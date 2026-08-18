---
type: decision
title: Volume bundle đọc tier khách chọn từ line attribute `__volume_tier` — đảo hướng "không tin attribute client-set"
summary: Joy Subscription cho Shopify Function đọc lại một cart line attribute do client set (`__volume_tier`) để biết tier khách chọn, sau ba lần chốt ngược lại với `_joy_installment_discount`; rào chắn là pin chỉ được tin khi line còn giữ đúng quantity của tier đó. ⚠️ CHƯA MERGE — mới ở nhánh `fix/volume-bundle-discount`.
tags: [avada, subscription, shopify, extensions, billing]
created: 2026-08-18
updated: 2026-08-18
review: 2026-11-18
source: repo "subscriptions" — git log 2026-08-17 (`a22ad41ba`, `07d54b0f1`); hash đã verify
---

# Volume bundle đọc tier từ line attribute client-set

**Trạng thái: ⚠️ CHƯA MERGE** — `a22ad41ba` nằm trên nhánh `fix/volume-bundle-discount`,
chưa vào master tại thời điểm cắt log 2026-08-17.

## Quyết định

Storefront ghim **index tier khách bấm** vào cart line attribute `__volume_tier` lúc
add-to-cart; Shopify Function `product-discount` đọc attribute đó thay vì tự suy tier từ
quantity của line.

- `extensions/product-discount/src/helpers/resolveVolumeTierDiscount.js` (mới, +38)
- `src/run.graphql` +3 (kéo attribute vào input của function)
- `packages/scripttag/src/subscription/helper/handleVolumeAddToCart.js` +5 (nơi ghim)
- `07d54b0f1` — thu `resolve.alias` về `test.alias` để alias `@functions/*` chỉ phục vụ
  vitest, không lọt vào bundle Shopify CLI build.

## Why

Discount function tự suy tier lại từ quantity, mà `getApplicableTier` **sort theo quantity
thôi** — hai tier cùng quantity là không phân biệt được, tie giữ tier đứng trước. Cấu hình
`(qty 1, 0%)` + `(qty 1, 10%)` khiến option 10% **không bao giờ mua được**: line không ăn
giảm giá nào cả. Không có nguồn nào khác biết khách bấm cái nào — Shopify chỉ chuyển
quantity xuống function; lựa chọn của khách chết ngay tại storefront nếu không được mang
theo. Chi tiết triệu chứng ở [[digest-subscriptions-volume-bundle-2026-08-17]].

## Tradeoff

**Đánh đổi chính: mở lại đúng bề mặt đã cố ý đóng ba lần.**

| Lần | Kết luận cũ |
|-----|-------------|
| [[shipped-subscriptions-2026-07-24]] (`e1a386e39`, tag `v2.34.24`, !2386) | discount function **không được** tin `_joy_installment_discount` do client set |
| [[digest-subscriptions-2026-07-25]] | bỏ hẳn nhánh `frozenDiscount`, đọc thẳng metafield + cap `percentage ≤ 100` |
| [[digest-subscriptions-2026-08-09]] | xếp mức **Security [High]**: khách sửa attribute lúc add-to-cart là tự đặt discount tuỳ ý |

Cái được: option cùng quantity khác discount bán được — trước đó là tính năng chết hẳn.

Cái mất và cái phải chấp nhận:
- Function tin một giá trị **client gửi**. Khác biệt so với ca `_joy_installment_discount`:
  attribute cũ mang **số phần trăm** (sửa là tự đặt giá bất kỳ), attribute mới chỉ mang
  **index vào bảng tier do merchant cấu hình** — mức giảm vẫn lấy từ config phía server,
  nên trần thiệt hại là "tier tốt nhất merchant đã tự tạo", không phải "discount tuỳ ý".
- Rào chắn thứ hai: pin chỉ được tin **khi line còn giữ đúng quantity của tier đó**. Sửa
  quantity trong giỏ, hoặc giỏ tạo trước khi attribute tồn tại, đều rơi về cách suy theo
  quantity như cũ. Rào này **thu hẹp** bề mặt chứ không đóng: trong nhóm tier cùng quantity,
  khách vẫn tự chọn được index.
- Thêm một trạng thái phải giữ đồng bộ giữa storefront và function; storefront quên ghim
  là im lặng rơi về hành vi lỗi cũ chứ không báo gì.

Không chọn phương án khác vì: đổi khoá tier (thêm id thay vì sort theo quantity) chỉ sửa
được phía config, vẫn không mang được **lựa chọn của khách** xuống function — Shopify
không có kênh nào khác cho dữ liệu đó ngoài attribute của line.

## Ngày review

`2026-11-18` — lúc đó cần trả lời: attribute đã vào master chưa, và rào "quantity phải
khớp" có bị nới trong lần sửa nào sau đó không (đây là chỗ dễ bị gỡ vì trông như thừa).

Liên quan: [[shipped-subscriptions-2026-08-18]] · [[subscriptions]] ·
[[digest-subscriptions-volume-bundle-2026-08-17]] · [[digest-subscriptions-2026-08-09]]
