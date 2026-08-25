---
type: decision
title: Landing joyxjoy — swap item là line item property của TỪNG box, không phải order note
summary: Bỏ cách ghi swap vào order note của cả đơn, chuyển sang line item property `Swap Item` gắn trên từng box, vì đó là thứ store khách đang thật sự dùng để soạn hàng.
tags: [avada, subscription, shopify, storefront]
created: 2026-08-25
updated: 2026-08-25
review: 2026-11-25
source: repo `subscriptions` — commit `dbff23a1b` (2026-08-24, nhánh `feat/joyxjoy-landing`)
---

# Swap item đi bằng line item property của từng box

Trang landing "Build Your Subscription" cho joywholefoods (hướng đi chốt ở
[[2026-08-19-page-custom-o-theme-khach]]) ban đầu ghi lựa chọn swap của khách vào **order note** —
một chỗ, cho cả đơn. Commit `dbff23a1b` (2026-08-24) gỡ hẳn cách đó và gắn swap thành
**line item property trên từng box**: `buildCartItems.js`, `buildOrderPayload.js` và `SwapModal.js` đều
đổi, kèm test mới cho cả hai helper (`buildCartItems.test.js` +34, `buildOrderPayload.test.js` +16,
`landingCheckoutFlow.test.js` +91).

## Why

Spec cũ sai so với hành vi thật của khách hàng, chứ không phải sai kỹ thuật.
[[digest-subscriptions-2026-08-24]] ghi lại đúng phát hiện đó: *"Swap hiện chỉ ghi vào order note; store
khách dùng line item property `Swap Item` trên từng box — spec cũ sai so với hành vi thật của khách."*

Order note là **một trường cho cả đơn**. Khi khách mua nhiều box trong một lần, note không nói được box
nào bị swap món nào — người soạn hàng phải tự đoán. Property gắn thẳng vào line thì mỗi box mang lựa chọn
của chính nó, và nó xuất hiện ngay trên dòng hàng trong admin/packing slip — tức là chỗ người đóng gói
đang nhìn sẵn.

Đây cũng là lần thứ n trong dự án này chốt lại rằng **nguồn sự thật phải nằm cùng cấp với thứ nó mô tả**
— cùng họ với chuỗi bug đã ghi ở [[digest-subscriptions-2026-07-27]] (`line.product.customAttributes`
≠ `line.customAttributes`).

## Tradeoff

**Được:**
- Mỗi box mang lựa chọn của chính nó; nhiều box trong một đơn không còn nhập nhằng.
- Property đi theo line qua cart → checkout → order, không cần đường dữ liệu riêng.

**Mất / phải trả:**
- **Property không có tiền tố `_` thì hiện với khách** ở cart và checkout. Tên đang dùng là `Swap Item`
  (không tiền tố), tức là khách nhìn thấy — quy ước ẩn/hiện đã ghi ở
  [[subscription-digest-2026-07-13]]. Nếu sau này muốn ẩn thì phải đổi tên và mọi surface đọc nó cùng đổi.
- **Không còn một chỗ duy nhất để đọc swap của cả đơn.** Muốn tổng hợp thì phải duyệt hết line —
  ngược lại với order note.
- Cart line có property khác nhau thì Shopify **không gộp** chúng thành một line. Hai box giống hệt nhau
  nhưng swap khác nhau sẽ nằm thành hai dòng riêng — đúng ý ở đây, nhưng là một thay đổi về hình dạng giỏ
  hàng mà mọi thứ đọc giỏ hàng phải chịu được.
- Chuỗi `_joy_*` từng phải bị strip khỏi mọi surface đọc `customAttributes`
  ([[shipped-subscriptions-2026-08-07]]) — thêm một property khách-nhìn-thấy nữa là thêm một thứ phải nhớ
  khi hiển thị line ở portal/email.

## Chưa xác minh

- Ba gạch đầu dòng đầu của phần "Mất" suy từ hành vi chuẩn của Shopify line item property + quy ước `_`
  đã ghi trong brain, **không** đọc trực tiếp diff của `dbff23a1b` (log chỉ có thống kê file).
  Cần đối chiếu code trước khi trích dẫn như sự thật.
- **Chưa merge** — `dbff23a1b` mới nằm trên `feat/joyxjoy-landing`, chưa có ref master nào trong log 08-24.

## Liên quan

[[subscriptions]] · [[2026-08-19-page-custom-o-theme-khach]] ·
[[2026-08-24-landing-joyxjoy-dung-plan-cua-app]] · [[digest-subscriptions-2026-08-24]] ·
[[shipped-subscriptions-2026-08-25]] · [[subscription-digest-2026-07-13]] ·
[[digest-subscriptions-2026-07-27]]
