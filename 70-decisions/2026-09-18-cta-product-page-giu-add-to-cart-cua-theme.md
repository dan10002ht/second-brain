---
type: decision
title: Product page của joyxjoy giữ Add to cart của theme — block CTA thôi tự dựng purchase option
summary: Bỏ hẳn hướng block Liquid tự dựng purchase option / hijack Add to cart / ẩn quantity stepper trên product page; thay bằng buy controls gốc của theme cộng một card mời shopper vào builder — 324 dòng còn 108, không còn `<script>`.
tags: [subscription, shopify, storefront, avada]
created: 2026-09-19
updated: 2026-09-19
review: 2026-12-19
source: repo `subscriptions` — git log 2026-09-18 (`abf69e5e5`, `0b040c397`, `a7e1e6db5`; hướng cũ `86c4b76ab`/`ef1b1d016` ngày 09-17)
---

# Quyết định

Block `joy-bundle-cta.liquid` trên product page của joyxjoy **không** dựng purchase option riêng,
**không** chiếm nút Add to cart và **không** ẩn quantity stepper nữa. Còn lại: buy controls của
chính theme, cộng một card mời shopper dựng subscription (đường vào builder mà menu chính cũng trỏ
tới). Widget của app vẫn giữ trạng thái ẩn. Kết quả: 324 dòng → 108, **bỏ sạch `<script>`**.

Bằng chứng: `abf69e5e5` (trên nhánh gộp `fix/landing-merchant-feedback`, đã vào master qua !2611 =
`765fe95ff`, tag `v2.35.45`) và bản song sinh `0b040c397` trên `fix/cta-simplify`. `a7e1e6db5` xoá 31
dòng assertion của hướng cũ.

## Why

- **Merchant không yêu cầu bất kỳ phần nào trong đó.** Commit ghi thẳng: *"The merchant asked for
  none of that."*
- **"Subscribe & Save" hứa một khoản tiết kiệm không tồn tại** — các box này **không** được giảm giá.
  Đó cũng là lý do widget app vẫn ẩn.
- **Khách chỉ muốn mua một box thì phải mua được như mọi sản phẩm khác.** Hướng cũ hijack Add to cart
  nên đường mua lẻ biến mất.
- **Hướng cũ chỉ vá triệu chứng của chính nó.** Ngày 09-17 có hai nhánh cùng một patch
  (`86c4b76ab` / `ef1b1d016`, ghi ở [[shipped-subscriptions-2026-09-18]]) **ẩn quantity stepper** vì
  link builder chỉ mang `bundle=<handle>` nên không tôn trọng được số lượng khách chọn. Tức stepper
  phải bị ẩn *bởi vì* block đã chiếm luồng mua. Bỏ việc chiếm luồng thì không còn gì phải ẩn — MR cũ
  *"should be closed rather than merged"*.

## Tradeoff

| Được | Mất |
|---|---|
| Đường mua lẻ một box trở lại, đúng hành vi theme | Không còn chọn purchase option **ngay trên** product page — shopper muốn subscribe phải đi qua builder (thêm một bước) |
| Không còn `<script>` trong file merchant paste tay ⇒ bề mặt lỗi Liquid ngoài CI co lại đáng kể ([[2026-09-08-bespoke-khong-vao-theme-app-extension]]) | Bỏ mất cả phần code có thể tái dùng nếu sau này shop bật giảm giá thật cho box — khi đó phải dựng lại, và nên dựng bằng đường khác chứ không phục hồi bản 324 dòng |
| 216 dòng logic Liquid biến mất khỏi thứ không có gate nào chạy qua | Quyết định này **đúng cho một shop** (joyxjoy). Không suy ra cho shop khác — cùng họ với [[2026-09-08-bespoke-khong-vao-theme-app-extension]] |
| Thôi hứa khoản giảm giá không có ⇒ bớt một nguồn khiếu nại | Conversion trên product page có thể giảm; **chưa ai đo** cả trước lẫn sau |

## Điều kiện để xem lại (2026-12-19)

- Shop có bật giảm giá thật cho box chưa? Nếu có, lý do lớn nhất ("Subscribe & Save nói dối") mất
  hiệu lực và câu hỏi mở lại.
- Có số đo nào về việc shopper rơi ở bước chuyển sang builder không? Hiện đây là giả định chưa đo —
  cùng lớp [[con-so-trong-tieu-chi-phai-kem-cach-do]].

Liên quan: [[subscriptions]] · [[shipped-subscriptions-2026-09-19]] ·
[[digest-subscriptions-2026-09-19]] · [[shipped-subscriptions-2026-09-18]] ·
[[2026-09-16-landing-doi-nguon-lap-sang-collection-list]] ·
[[2026-09-08-bespoke-khong-vao-theme-app-extension]] · [[con-so-trong-tieu-chi-phai-kem-cach-do]] ·
[[bang-chung-phan-biet-duoc]]
