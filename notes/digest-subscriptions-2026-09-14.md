---
type: note
title: Digest Joy Subscription — 2026-09-14 (vòng polish cuối portal Wholefoods + review thiết kế email daily cap)
summary: Picker mời những sản phẩm KHÔNG thể thêm được nên lỗi GraphQL `adjustmentType` null là hậu quả chứ không phải nguyên nhân; `formatMoney` hardcode `en-AU` làm tiền hiện `USD 900.00`; `Divider` chỉ vẽ nét liền nhưng `View` có `border: dashed` nên "giới hạn platform" là kết luận sai; và outbox của email daily cap đang nằm trên hot path của MỌI email chứ không chỉ email vượt cap.
tags: [avada, subscription, shopify, extensions, debug, firestore]
created: 2026-09-14
updated: 2026-09-14
source: project `subscriptions` — session history (session 0fb64e0c `feat/wholefoods-portal` phần sau compact; session 6bfb663d review `feat-email-daily-cap`; session e753641b webhook audit)
---

# Digest — `subscriptions`, 2026-09-14

Phần lớn session `0fb64e0c` đã ghi ở [[digest-subscriptions-2026-09-11]],
[[digest-subscriptions-2026-09-12]], [[digest-subscriptions-2026-09-13]]. Note này **CHỈ phần mới**.

## Bugs

**Picker mời sản phẩm không thể thêm được — lỗi GraphQL là hậu quả.** Triệu chứng khách thấy:
`Variable $input ... pricingPolicy.cycleDiscounts.0.adjustmentType (Expected value to not be null)`.
Payload lộ nguyên nhân: `sellingPlanId: "gid://shopify/SellingPlan/undefined"` và
`sellingPlanName: "Every undefined undefined"`. Gốc là `prepareLineAddPayload` đi tìm plan của sản
phẩm khớp với plan của contract; không tìm ra thì vẫn dựng payload với `undefined`. Chữa ở tầng
GraphQL là vá triệu chứng — chữa đúng là **không đưa sản phẩm đó vào picker ngay từ đầu**.

**Giá từng dòng mất hẳn vì nằm dưới `product`/`variant`.** Card chỉ hiện tên. Cùng họ với bug đã ghi
ở [[digest-subscriptions-2026-09-12]], nhưng lần này lộ thêm rằng **mockup dùng hai kiểu Subtotal
khác nhau** ở hai màn — nên so một màn rồi suy ra màn kia là sai; đo lại thì card lệch **8/9 dòng**,
không riêng dòng Subtotal.

**`formatMoney` hardcode `'en-AU'`** → tiền hiện `USD 900.00` thay vì `$900.00`. Locale **không "sở
hữu"** currency: locale quyết định cách viết, currency là tham số riêng. Cùng lúc phát hiện **ba
file mang ba bản copy của cùng một formatter** — gộp lại một chỗ.

**`if (disabled) return null` trong `ProductPicker`** — `disabled` nghĩa là "đang có request chạy",
nên bấm `+ Add` là **mất cả lưới sản phẩm**. Handler vốn async: giữ lưới, chỉ khoá đúng nút vừa bấm
và cho nó trạng thái đang chạy. Cùng lớp với bug `disabled` dùng làm điều kiện render đã ghi hôm
trước.

**`405 Method Not Allowed`** — route `PUT /order/...` chưa khai trong `routes/clientApi.js`.

**`Payment method` rỗng — regression tôi tự gây ra** ở lượt trước khi cắt lấy 4 số cuối của một
trường không phải lúc nào cũng có đủ ký tự.

**Đơn `Failed` không có chỗ nào hiện lý do.** Lý do **đã nằm sẵn trong Firestore** của chính đơn đó,
chỉ là không surface ở bất kỳ màn nào. Đây là kiểu nợ hay bị bỏ qua: không phải thiếu dữ liệu, mà
thiếu đường hiển thị.

**Chọn collection ở `Need more staples?` "không work"** — chẩn đoán đúng là **không có gì để chọn**
(danh sách rỗng sau khi lọc), không phải "chọn xong không lọc". Hai triệu chứng nhìn giống nhau.

## Techniques

**`Divider` nét đứt: làm được, và "giới hạn platform" là kết luận sai của tôi.** `Divider` chỉ vẽ
nét liền, nhưng prop `border` của `View` nhận `'dashed'` — thay `Divider` bằng `View` chỉ có viền
trên. Nguyên tắc: trước khi tuyên bố surface không hỗ trợ, quét **toàn bộ** component có thể thay
thế, không chỉ component mang đúng cái tên đó. → [[prop-sai-bi-bo-qua-im-lang]].

**Thang chữ của surface này là 12 / 14 / 16 — không có 13px.** Muốn giữ bậc "tiêu đề nổi, meta chìm"
như mockup thì dùng `small` + tone `subdued`, đừng cố khớp px.

**Đo cả mockup lẫn build bằng cùng một probe** (computed `font-size`/`weight`/`color` từng dòng) —
cách duy nhất tách được "lệch thẩm mỹ" khỏi "lỗi thật". Lần này ra 2 lỗi thật + 5 chỗ lệch ở hai
card `Delivery info` / `Order detail`.

**Deploy staging3.** `staging3.yml` **không deploy extension** — extension đi bằng skill
`/deploy-extensions` riêng. Kèm bẫy git khi đổi nhánh: `git stash` **không lấy file untracked**, nên
`git checkout` vẫn bị chặn bởi đúng những file đó.

## Context — review thiết kế `feat-email-daily-cap` (vai techlead, không code)

Nhánh remote-only, 1 commit. Điểm mạnh của thiết kế: **đo BigQuery thật trước khi chọn ngưỡng**
(p99 = 45 email/shop/ngày, max = 334, cap chọn 1000), và **hoãn chứ không drop**.

Blocker đã nêu trong comment MR:

- **Outbox nằm trên hot path của MỌI email**, không chỉ email vượt cap. Với p99=45 so với cap 1000
  thì ~99,99% email đi vòng qua một tầng nó không cần.
- Lưu cả HTML vào Firestore doc ⇒ **single-field index** trên trường đó là tiền trả cho thứ không ai
  query — nên tắt; và record loại này phải có **TTL**.
- Đếm cap bằng Firestore trong khi prod **đã có Redis**: counter theo ngày là đúng loại việc của
  Redis (INCR + EXPIRE), không phải của Firestore.

## Context — câu hỏi audit webhook `products/update`

Session `e753641b` hỏi audit cấu hình webhook, nhưng template dán vào còn **để trống** (`filter =
"..."`, handler rỗng, payload rỗng) — không có gì thật để audit. Phần trả lời là ví dụ chuẩn theo
doc Shopify API 2026-07: `filter` giảm **số lần bắn**, `include_fields` giảm **kích thước payload**;
hai thứ khác nhau, không thay nhau được. *Chưa xác minh trên cấu hình thật của app.*

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-09-13]] · [[prop-sai-bi-bo-qua-im-lang]] ·
[[so-anh-khong-so-chu]] · [[redis-queue-khong-dung-chung-instance-cache]] · [[bigquery-avada]] ·
[[digest-subscriptions-bird-2026-09-14]] · [[feedback-ra-het-duong-verify]] (ca "surface không hỗ trợ nét đứt") ·
[[khong-error-boundary-hong-ca-man-hinh]] · [[2026-09-09-portal-wholefoods-extension-rieng]]
