---
type: decision
title: Phí ship định kỳ lấy từ rate table của merchant, không lấy từ cart quote
summary: Joy Subscription bỏ cách hỏi Shopify một cart quote để suy phí ship định kỳ, chuyển sang tự đọc delivery profile của merchant (methodDefinitions + điều kiện TOTAL_PRICE) rồi resolve giá cho đúng phương thức khách đã chọn, có toggle chặn để không đụng 5.306 shop đang ở mặc định.
tags: [avada, subscription, shopify, shipping, architecture]
created: 2026-08-28
updated: 2026-08-28
status: active
review: 2026-11-28
source: project `subscriptions` — session history 2026-08-28 (kookut)
---

Bối cảnh: kookut báo contract dưới ngưỡng free-ship vẫn được miễn phí. Truy ra ba lỗi chồng nhau
trong `getLowestShippingRate`, và cách sửa cuối cùng là **đổi nguồn giá**, không phải vá hàm.

## Quyết định

- App **tự đọc delivery profile** của merchant (`methodDefinitions` + `methodConditions` dải
  `TOTAL_PRICE`), chuẩn hoá thành một rate table, rồi resolve giá theo subtotal của contract và
  **đúng tên phương thức khách đã chọn** — thay vì hỏi Shopify một cart quote rồi lấy
  `selectedDeliveryOption`.
- Ngữ nghĩa "lowest" được chốt lại theo user: **giá hiện tại của đúng phương thức khách chọn**,
  không phải rate rẻ nhất.
- Nhánh lúc **tạo contract** cũng dùng nguồn này, nhưng có **toggle chặn** để không đổi hành vi
  của 5.306 shop đang nằm ở mặc định.
- MR !2513, 3 commit trên `fix/kookut-issues`, không tự merge.

## Why

- `deliveryOptions` bị comment out trong query cart nên app **về mặt vật lý không biết** giá của
  phương thức khách chọn — nó chỉ thấy cái Shopify pre-select (rẻ nhất). Vá hàm mà giữ nguồn cũ
  thì vẫn đoán.
- Cart quote phụ thuộc delivery profile nào đang phủ sản phẩm, và với kookut nhóm `SUBSCRIPTION`
  chỉ chào **đúng một rate** trong khi nhóm `ONE_TIME_PURCHASE` chào 5 — tức quote không phản ánh
  bảng giá merchant công bố. Rate table thì phản ánh.
- Audit được: chạy thuật toán trên **profile live của kookut** rồi đối chiếu với 11 mức giá
  Shopify tự trả cho nhóm ONE_TIME → **22/22 khớp, 0 lệch**. Một cart quote không cho phép kiểm
  kiểu đó.

## Tradeoff

- App giờ **tự tính lại logic tiering của Shopify** — mỗi lần Shopify thêm kiểu điều kiện mới
  (trọng lượng, số lượng…) là app lệch mà không ai báo. Hiện chỉ phủ `TOTAL_PRICE`.
- Phải thêm `getVariantDeliveryProfileId` và một orchestrator dùng chung — nhiều bề mặt hơn một
  lời gọi cart.
- Toggle chặn nghĩa là **hai hành vi cùng tồn tại** trong production cho tới khi có quyết định
  bật rộng; nợ này phải có hạn.
- Vẫn **không** giải quyết vế "tính lại phí ship mỗi kỳ" — trigger chỉ có 2 sự kiện
  (đổi item / đổi địa chỉ), renew không nằm trong đó. Đó là câu hỏi Product, còn treo.

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-08-28]] · [[digest-subscriptions-2026-08-27]] ·
[[digest-subscriptions-2026-08-20]] · [[shipped-subscriptions-2026-08-28]] ·
[[kookut-yeu-cau-cau-hinh-shipping]] · [[2026-08-28-import-loop-chi-contract-song-paused]]
