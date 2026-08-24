---
type: decision
title: Landing joyxjoy lấy tần suất + discount từ plan `plan_v2` của app, bỏ cách suy theo số tuần
summary: Widget đọc plan group của app qua metafield `plan_v2` (mang sẵn `sellingPlanId` Shopify + `discountConfig.tiers`) và merchant nhập plan group id trong theme editor; bỏ hẳn cách suy tần suất từ `delivery_policy`/tên plan và tự tính savings theo `compare_at_price`.
tags: [subscription, shopify, billing, storefront]
created: 2026-08-24
updated: 2026-08-24
review: 2026-11-24
source: project "subscriptions" — session history 2026-08-24 (lane T31, T32)
---

# Landing joyxjoy dùng plan của app, không suy theo tuần

## Bối cảnh

Trang "Build Your Subscription" ban đầu tự suy tần suất từ selling plan của Shopify
(`delivery_policy` → `billing_policy` → regex trên tên plan) và tính "savings" của summary bằng
`compare_at_price - price`. Cả hai đều không biết gì về khái niệm plan/tier của Joy Subscription.
Triệu chứng user báo: *"thay đổi plan có discount thì nó vẫn không hiển thị discount ở summary"* —
và kiểm cart thật cho thấy `price_adjustments: []`, plan do seed tạo **không hề có `pricingPolicies`**.

## Chốt

1. Nguồn plan là **metafield mức product `plan_v2`** của app, không phải selling plan Shopify.
   Plan object đã mang sẵn `sellingPlanId` của Shopify ⇒ không map tần suất thủ công.
2. Merchant nhập **plan group id** vào một field trong theme editor của section landing; để trống thì emit tất cả group.
3. Label tần suất lấy thẳng `plan.title` của group đã chọn.
4. Discount tính bằng chính helper của repo (`getDiscountConfig` + `getPrice` ở `packages/functions/src/helpers/`,
   import qua alias `@functions/*`), không viết lại logic tier trong scripttag.

Đã bác trước đó: đọc `shop.metafields.avada_subscription_plan_v2.statuses` (shop-level, render được ở mọi
trang nhưng **chỉ có map `{planId: true}`**, không có discount/frequency).

## Why

- Tần suất suy từ dữ liệu Shopify **không bao giờ đủ**: verifier chứng minh `"Giao mỗi 2 tuần"`,
  `"Deliver every 14 days"`, `"Bi-weekly delivery"` đều → `null`, và lưới an toàn khi đó **âm thầm ẩn box**.
  Sau đó lại lộ ra `frequencyValue` của plan app có đơn vị `month` bị dùng như tuần.
- Discount của Joy sống trong `discountConfig.tiers`, không có mặt trong `compare_at_price` lẫn trong
  `price_adjustments` của selling plan seed. Không đọc plan app thì không có đường nào ra đúng số.
- Đối chứng mạnh nhất: số app tính **khớp chính xác** số Shopify tính lúc checkout (`7120` cho plan 20%).
- Tái dùng helper của repo giữ được luật tier ở một chỗ, và cả hai helper đều thuần (chỉ phụ thuộc `big.js`
  đã hoisted ở root) nên không kéo backend vào bundle.

## Tradeoff

- **9/14 box legacy không có `plan_v2`** ⇒ vẫn phải giữ nhánh fallback theo tuần. Nghĩa là hai đường dữ liệu
  cùng tồn tại, và đường fallback chính là chỗ đã sinh ra bug đơn vị month/week.
- **Đẩy một quyết định cấu hình sang merchant**: gõ sai plan group id thì trang lặng lẽ emit tất cả group.
- **Bundle phình 87KB → 128KB** khi kéo `getDiscountConfig`/`getPrice` + `big.js` vào scripttag. Chấp nhận được
  vì trần 30KB tôi từng áp là con số không có thật (bundle cùng loại đang ~198KB), nhưng nó vẫn là chi phí thật
  trên trang storefront của khách.
- **Buộc phải dùng số học decimal** cho toàn bộ đường giá — xem [[tien-khong-duoc-lay-float-lam-chuan]].

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-08-24]] · [[2026-08-19-page-custom-o-theme-khach]] ·
[[lich-dinh-ky-neo-theo-ngay-du-kien]] · [[tien-khong-duoc-lay-float-lam-chuan]]
