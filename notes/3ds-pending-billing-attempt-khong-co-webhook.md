---
type: note
title: Order stuck Processing vì 3DS pending — webhook không bao giờ tới
summary: Attempt có ready:false mà không orderId và không errorCode là đang CHỜ 3DS (ActionRequired), Shopify không gửi webhook cho ca này nên app phải poll subscriptionBillingAttempt; Joy không poll, không lưu id attempt, và fragment billingCycle thiếu nextActionUrl + processingError nên mọi chẩn đoán đọc từ Firestore đều mù.
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
