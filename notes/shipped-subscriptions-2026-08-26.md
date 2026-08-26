---
type: note
title: Joy Subscription — commit landed 2026-08-25
summary: Không có ref master, không tag, không version bump — 4 commit landing joyxjoy trên `feat/joyxjoy-landing` (chặn vượt tồn kho dùng chung staple/one-off, báo lỗi khi cart add hỏng + xoá 2 component chết, redirect add-to-cart PDP sang trang builder kèm 961 dòng theme khách vào repo docs) và một commit CI `[deploy-all]` đẩy `feat/portal-preview` lên staging 3.
tags: [avada, subscription, shopify, storefront, preact]
created: 2026-08-26
updated: 2026-08-26
source: repo `subscriptions` (avada/subscriptions) — git log 2026-08-25, hash lấy nguyên từ log
---

# Joy Subscription — commit landed 2026-08-25

Tiếp nối [[shipped-subscriptions-2026-08-25]]. Root cause và kỹ thuật của cùng ngày đã ghi ở
[[digest-subscriptions-2026-08-25]] — ở đây chỉ ghi **cái gì landed ở đâu**, không lặp lại.

**Không có commit nào trên master.** Log chỉ mang 2 ref: `HEAD -> feat/joyxjoy-landing`
(+ origin) và `origin/feat/portal-preview`. Không tag, không version bump, không migration,
không đụng `firestore.indexes.json`.

## Shipped

### Nhánh `feat/joyxjoy-landing` — 08-25, 4 commit

| Hash | Nội dung |
|------|----------|
| `20cd428ff` | feat — ẩn box hết hàng + chặn vượt tồn kho **tính chung** staple và one-off. Helper mới `helpers/variantStock.js` (+60), sửa `BoxSection`/`LandingApp`/`ProductPickerSection`/`ProductCard`, `joy-subscription-landing.liquid` (+6/−2). Kèm 4 file test mới ~377 dòng, trong đó `joySubscriptionLandingLiquid.test.js` là test ràng buộc fixture JS với chuỗi Liquid thật (xem ⚠️ bên dưới) |
| `9e95e5254` | fix — `submitOrder` báo lỗi khi `/cart/add.js` thất bại (trước đó `fetch` chỉ reject khi lỗi mạng nên 422 vẫn báo thành công), **+ xoá 2 component chết** `OneOffSection` và `StapleSection` (−91 dòng kể cả `index.js`); `SwapModal`, `ProductPickerSection`, `filterCategoriesByStep` chỉnh theo. Test: `landingCheckoutFlow.test.js` (+85) và `submitOrder.test.js` (+56) mới, 2 suite product-picker bồi thêm |
| `f3780cd5d` | docs — sửa docblock `submitOrder` vốn còn mô tả thiết kế cũ. Một file, +13/−6. Ghi lại vì nó là phần đuôi của `9e95e5254` chứ không phải formatting rời |
| `022a54d5d` | feat — nút add-to-cart của **box trên PDP** chuyển thẳng sang trang builder thay vì add vào cart tại chỗ: snippet mới `joy-bundle-redirect.liquid` (+96), và commit đưa nguyên `docs/joyxjoy-theme/layout/theme.liquid` **961 dòng** vào repo. Commit chỉ insert, 0 dòng xoá |

Đây là thay đổi **hành vi trên PDP của store khách** (`022a54d5d`), không chỉ trong widget —
đáng theo dõi khi đối chiếu với hướng đã chốt ở [[2026-08-19-page-custom-o-theme-khach]].

Hai commit `20cd428ff` và `9e95e5254` chính là phần code của hai bug đã phân tích trong
[[digest-subscriptions-2026-08-25]] (trần tồn kho vô hiệu vì Liquid không emit field, và
`/cart/add.js` atomic 422 bị nuốt) — không lặp lại nội dung ở đây.

## Reverted

Không có revert nào trong log 08-25.

## Deploy notes

- **`[deploy-all]`: 1 commit** — `bf4ac79b9` "chore - ci - trigger deploy staging 3" trên
  `feat/portal-preview` (0 file thay đổi trong log). Commit CI thuần để ép deploy nhánh
  portal-preview lên **staging 3**; tiêu đề ghi "3" cho thấy đã phải bắn lại nhiều lần.
  Khớp với ghi chú deploy-từ-worktree ở [[digest-subscriptions-2026-08-25]].
- **Không** `[deploy-functions]`, **không** tag, **không** version bump trong cửa sổ này —
  4 phiên bản `v2.34.80`→`v2.34.83` vẫn là câu hỏi treo từ [[shipped-subscriptions-2026-08-22]],
  log hôm nay tiếp tục không đóng được.
- Không file migration, không `firestore.indexes.json`.

## ⚠️ Cần xác nhận

1. **Lỗ `inventory_management` đã bịt trong chính commit thêm tính năng, hay còn hở?**
   [[digest-subscriptions-2026-08-25]] khẳng định tính năng chặn vượt tồn kho **vô hiệu 100%
   trên production** vì Liquid không emit `inventory_management` ⇒ trần luôn `Infinity`.
   Nhưng chính commit `20cd428ff` lại sửa `joy-subscription-landing.liquid` (+6/−2) và thêm
   `joySubscriptionLandingLiquid.test.js` (+48) trong cùng một commit.
   → Hai khả năng chưa phân biệt được: (a) +6 dòng đó **đã** emit field nên digest đang mô tả
   trạng thái *trước* commit, hay (b) chỉ có test khoá hợp đồng còn bên phát vẫn chưa emit.
   Không đọc được commit body/diff trong phiên này (bash vào repo `subscriptions` bị chặn) —
   cần mở `git show 20cd428ff -- docs/joyxjoy-theme/sections/joy-subscription-landing.liquid`
   để chốt. Đây là khác biệt giữa "tính năng chạy" và "tính năng chết nhưng test xanh"
   ([[gate-tu-viet-la-nguon-xanh-gia]]).

2. **Theme của khách được commit ngược vào repo app — nguồn thật hay bản đối chiếu?**
   `022a54d5d` đưa `docs/joyxjoy-theme/layout/theme.liquid` (961 dòng) vào repo.
   [[digest-subscriptions-2026-08-25]] lại ghi kỷ luật ngược chiều: *"khi sửa template phải sửa
   trên bản pull, vì bản local sẽ ghi đè `bundle_script_url` mà user đang trỏ vào localhost"* —
   tức bản trên store mới là nguồn. Nếu file trong `docs/` được dùng để `theme push`, nó sẽ tái
   lập đúng cái bẫy đó; nếu chỉ là snapshot đọc tham chiếu thì không sao. Chưa có note nào trong
   brain khai quy ước này. Cần chốt và ghi vào [[digest-subscriptions-joyxjoy-2026-08-20]] hoặc
   một decision riêng.

3. **Hash trên nhánh feature vẫn là hash không bền.** Câu hỏi treo từ
   [[shipped-subscriptions-2026-08-25]] (nhánh `feat/joyxjoy-landing` từng bị rebase làm 2 hash
   trong brain thành hash chết) chưa được trả lời. 4 hash ghi ở note này nằm trên cùng nhánh đó
   nên chịu cùng rủi ro.

## Liên quan

[[subscriptions]] · [[shipped-subscriptions-2026-08-25]] · [[digest-subscriptions-2026-08-25]] ·
[[digest-subscriptions-2026-08-24]] · [[digest-subscriptions-joyxjoy-2026-08-20]] ·
[[2026-08-19-page-custom-o-theme-khach]] · [[2026-08-24-landing-joyxjoy-dung-plan-cua-app]] ·
[[2026-08-25-swap-line-item-property-tung-box]] · [[gate-tu-viet-la-nguon-xanh-gia]] ·
[[shipped-subscriptions-2026-08-22]] · [[digest-subscriptions-2026-08-26]]
