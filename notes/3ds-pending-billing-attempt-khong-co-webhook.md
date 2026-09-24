---
type: note
title: Order stuck Processing vì 3DS pending — webhook không bao giờ tới
summary: Attempt có ready:false mà không orderId và không errorCode là đang CHỜ 3DS (ActionRequired), Shopify không gửi webhook cho ca này nên app phải poll subscriptionBillingAttempt; Joy không poll, không lưu id attempt, fragment billingCycle thiếu nextActionUrl + processingError nên đọc Firestore là mù — và tới ngày đáo hạn cron tự set processed:true rồi skip im lặng nên đơn chết hẳn, trong khi xoá attempt lúc link 3DS còn sống là double charge.
tags: [avada, subscription, billing, shopify, gotcha]
created: 2026-09-24
updated: 2026-09-24
source: session điều tra 76dd7a2d-aa4e-4a00-b8b6-7f6009d701c5 (repo subscriptions) — SB-17166
---

# Order stuck Processing vì 3DS pending

Triệu chứng: đơn định kỳ đứng ở badge **Processing**, không có lỗi nào hiện ra, không thu tiền
và không xoay vòng. Nguyên nhân thật: lần thu tiền đang **chờ khách xác thực 3DS**
(`state: ActionRequired`, có `nextActionUrl`).

**Shopify KHÔNG gửi webhook cho ca này** — ghi rõ trong docs. App phải tự **poll**
`subscriptionBillingAttempt`. Joy không poll, và cũng **không lưu id của attempt**, nên không
có gì để poll bằng.

## Vì sao đọc Firestore là mù

`packages/functions/src/const/graphql/queries/billingCycle.js` (dòng 19-28 trên `origin/master`)
lấy `idempotencyKey, errorMessage, errorCode, createdAt, completedAt, order{id}, ready` —
**thiếu `nextActionUrl` và `processingError`**. Hai trường đó là thứ duy nhất phân biệt
"đang chờ 3DS" với "chưa tới hạn". Không query thẳng Shopify thì không thể thấy.

## Đơn không chỉ "kẹt" — nó bị giết vĩnh viễn vào đúng ngày đáo hạn

`processAutomaticBillingAttempt` gọi `batchMarkOrdersProcessed(...)` **trước khi** xử lý
(`services/cron/automaticBillingAttemptService.js:31`). Tới ngày đáo hạn:

1. Cron nhặt đơn (lúc này `ready:true`, `processed:false`, `status:UNBILLED` nên vẫn lọt query).
2. Set `processed: true`.
3. Guard thấy attempt 3DS pending → skip **im lặng**.

Sau bước đó `getOnScheduledOrders` (lọc `processed == false`) không bao giờ nhặt lại nữa.
Nên **thời điểm gỡ quan trọng hơn cách gỡ**: gỡ trước ngày đáo hạn thì gọn, sau đó thì phải
reset `processed` bằng tay.

Cộng thêm: `SCHEDULED_ORDER_LOOKBACK_MS = 7 ngày` (`repositories/orderRepository.js:47`).
Gỡ muộn quá 7 ngày kể từ `billingAttemptExpectedDate` thì cron cũng không nhặt —
phải dời luôn ngày thu.

> Script `fixStuckProcessingOrder.js` sẵn có **không** reset `processed` và **không** dời
> expected date → chạy nguyên si sau ngày đáo hạn là "gỡ" xong mà đơn vẫn chết.

## Xoá attempt khi link 3DS còn sống = double charge

Attempt mới sinh `idempotencyKey` khác nên **Shopify không dedupe được**. Nếu xoá attempt
pending để mở đường cho cron, rồi khách mới bấm link auth cũ → thu tiền hai lần.

Thứ tự đúng: gửi khách `nextActionUrl` trước, chỉ unstick khi khách không làm / link đã hết hạn.

## Bằng chứng email 3DS chết (đo được, không phải suy luận)

BigQuery `firestore_sync.email_logs`, `email_type = 'verify3dsSecureEmail'` →
**0 dòng, mọi shop, mọi thời điểm**. Dùng bảng này để kiểm "email có thật sự gửi không"
thay vì đọc code đoán — [[bang-chung-phan-biet-duoc]].

Và nhớ: **Shopify mới là bên gửi mail xác thực 3DS cho khách**, email của app chỉ là lớp
nhắc bổ sung. Đừng quy "khách không được báo" cho việc email app chết.

## Hai cái bẫy chẩn đoán

**`ready:false` trên order doc ≠ `ready:false` trên attempt.** Badge Processing đến từ nhánh
thứ hai của `prepareStatus`, không phải từ trạng thái attempt. Đọc nhầm nhánh là ra kết luận
khác hoàn toàn.

**`withEmailDefault` chỉ cứu email type có entry trong `const/default.js`.** Type nào thiếu
entry sẽ bị `!emailSetting.enabled` nuốt **im lặng, không log** — nên "khách không nhận được
mail" có thể chẳng liên quan gì tới billing.

## Shopify đã mô hình hoá sẵn — đừng suy diễn lại

Từ API **2026-04**, Shopify deprecate `ready` / `errorCode` / `processingError` / `order` /
`nextActionUrl`, gộp hết vào `state` (union `Pending` / `Success` / `Failed` / `ActionRequired`).
App đang ở **2025-10** nên chưa vỡ, nhưng `billingAttemptGuard` đang tự suy diễn đúng cái mà
Shopify đã có sẵn kiểu dữ liệu cho. Khi nâng API version, phần suy diễn đó nên bỏ chứ không
nên port.

## Bản sửa của agent (MR !2636) SAI ở đâu

Agent chẩn đoán "thu tiền sớm tạo attempt treo" và sửa thành:

```js
if (ready === false && !orderId && !errorCode) {
  // ...xoá idempotencyKey, set ready:true
  return {ready: true, notDue: true};
}
```

Đó **chính là chữ ký của ca 3DS pending**, và bản sửa coi nó là "chưa tới hạn": xoá
`idempotencyKey`, mở lại `ready`, bỏ luôn `nextActionUrl` mà khách cần để hoàn tất xác thực.
Khách sẽ không bao giờ được nhắc, và app có thể tạo attempt mới lặp lại. Nó cũng gọi
`scheduleBillingCycle` dịch chu kỳ thật về `new Date()` — đổi ngày billing của khách, một
thay đổi nghiệp vụ không ai yêu cầu.

Bài học cho agent: `ready:false` + không `orderId` + không `errorCode` **không phải** trạng thái
rỗng để dọn, mà là trạng thái CHỜ. Trước khi kết luận về billing attempt, phải query thẳng
Shopify — xem [[feedback-debug-phai-query-data-that]].

## Script đã viết, chưa commit

`dumpStuckProcessingCase.js`, `diagnoseBillingAttemptState.js` (chẩn đoán) và
`unstickPendingBillingAttempt.js` (mới dry-run, **chưa apply**).

## Liên quan
- [[verify-checkout-theo-nhanh-do-sai]] · [[feedback-debug-phai-query-data-that]] · [[feedback-bug-la-bug-khong-cho-po-chot]]
- [[subscriptions]] · [[bang-chung-phan-biet-duoc]] · [[ack-khong-phai-hieu-ung]] ·
  [[script-pha-du-lieu-tu-choi-flag-la]] (script gỡ kẹt cũng là script phá dữ liệu)
