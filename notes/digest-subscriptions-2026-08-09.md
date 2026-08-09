---
type: note
title: Joy Subscription — digest 2026-08-09 (giá one-time lẫn currency, discount client-settable, ATC "hết hàng" giả)
summary: Giá add-on one-time bake vào metafield theo currency presentment nên ra $3.741 thay vì $2.779; `_joy_installment_discount` là cart attribute client-settable nên bỏ hẳn nhánh frozen; ATC chết ở reformlabs là do storefront báo `available:false` trong khi Admin API nói ngược lại, rồi tự khỏi.
tags: [subscription, shopify, avada, storefront, debug, billing]
created: 2026-08-09
updated: 2026-08-09
source: project "subscriptions" — session history (installment / fixed bundle, String Flags + Reform Labs)
---

CHỈ phần mới so với [[digest-subscriptions-2026-07-25]] và [[digest-subscriptions-2026-08-07]].

## Bugs

**One-time $3.741 — bake giá vào metafield vừa stale vừa lẫn currency.**
`fixedBundleService.buildOnetimeAddonValue` lưu `Number(variant.price)` của add-on vào metafield
`avada_onetime_addon`. Store String Flags dùng Shopify Markets (`useSpecificCurrency`), nên giá
đọc được là **presentment CAD 3.322** chứ không phải base USD 2.360. Widget cộng
`base variant (live, đúng: 419) + add-on (metafield, sai currency)` → 3.741.
Nặng hơn: **cart-transform cũng dùng `addOn.price × presentmentCurrencyRate`** → cùng một con số
sai bị nhân thêm rate lần nữa. Giá trong metafield là **nguồn sự thật thứ hai**: đổi giá product
mà không re-sync bundle thì lệch âm thầm. Hướng xử lý → [[2026-08-09-gia-onetime-addon-merchant-nhap]].

**Security [High] — `_joy_installment_discount` là cart line attribute, client-settable.**
`eligibility.js` đọc thẳng `frozenDiscount` từ line attribute làm % giảm giá, không cap. Khách
sửa attribute lúc add-to-cart là tự đặt discount tuỳ ý. Fix: bỏ hẳn nhánh frozen (kể cả trong
`.graphql` input), chỉ đọc metafield, cap `percentage ≤ 100` như defense-in-depth. Lỗ hổng tồn
tại **trên cả master lẫn nhánh feature** → fix đi bằng nhánh riêng off master.
Điều này đóng luôn câu hỏi "vậy frozen để làm gì": Shopify docs xác nhận automatic discount được
verify **một lần lúc tạo contract**, không chạy lại discount function ở từng billing attempt —
nên không cần freeze bằng attribute. (Khớp kết luận đã ghi ở [[digest-subscriptions-2026-07-31]],
lần này có docs chính thức.)

**Giá installment sai ở email + Customer Portal — 4 chỗ dùng nhầm nguồn.**
`prepareEmailData.js` có 4 chỗ tính subtotal/giá per-line không đi qua helper
`discountAllocations`; line trong email lấy từ `contractData.lines`/order lines nên **có**
`discountAllocations` (chỉ `sourceOrderProducts` từ Firestore là không có — nhánh đó không tính
tiền). Classic CP: `OrderItem.js` hiển thị $1.158 thay vì $926,40 cùng nguyên nhân.

**Subscriptions list hiển thị tên child thay vì parent.** `ProductGroup` lấy `products[0]`, mà
với bundle thì phần tử đầu là child. Parent nhận diện bằng attribute `__joy_bundle_parent === "1"`
— đã có sẵn helper `findBundleParentInProducts` (thuần, import được từ frontend), fallback
`products[0]` cho contract thường/AOV.

**Property `Contents:` ở cart do scripttag ghi, không phải theme widget.**
`DisplayManager.appendBundleFixedContents` mới là chỗ ghi; theme widget của khách chỉ ghi
"Shipping preference". Logic drop cũ là `isOneTime && isInstallment` → nới thành mọi
`isInstallment`. Cờ `isInstallment` có sẵn trong `AVADA_PRODUCT_FIXED_BUNDLE_DATA` (set ở
`app-embed.liquid`), không cần thêm nguồn dữ liệu mới.

## Techniques

- **`/products/<handle>.js` mới có field `available` tin cậy**; bản `.json` ẩn nó. Khi nghi
  "sản phẩm hết hàng", đọc `.js`, đừng suy từ `.json`.
- **`@inContext` chỉ tồn tại ở Storefront API**, không có ở Admin API — query Admin có
  `@inContext` sẽ fail toàn bộ chứ không bỏ qua.
- `storefrontAccessToken` lưu cùng shop là **token public** → test availability theo từng country
  không cần giải mã gì. Ngược lại, access token admin mã hoá bằng `SHOPIFY_ACCESS_TOKEN_KEY`;
  token của shop **production** cần đúng `ACCESS_TOKEN_KEY_PROD` (key dev sẽ ra "Malformed UTF-8").
  Thao tác giải mã token merchant bị safety classifier chặn ở auto-mode → user tự chạy script.
- Store production không nằm trên staging1: shop String Flags ở project `avada-subscription-app`.
  App billing của merchant tra bằng `recurChargeId` trên doc shop, đối chiếu
  `currentAppInstallation.activeSubscriptions`.
- Vitest không resolve alias `@functions` → test cart-transform fail ngay lúc load (pre-existing,
  không phải do thay đổi của mình). Thêm alias vào `vite.config.js` rồi hẵng kết luận.

## Context

- **ATC chết ở reformlabs.shop tự khỏi, không phải lỗi code.** Storefront API trả
  `availableForSale: false` cho **mọi** country và `product` resolve ra `null`, trong khi Admin
  API cùng lúc nói `availableForSale: true`, tồn kho 1000, `Sell when out of stock: On`, đã
  publish Online Store, market Global. Không phải cache (cache-bust vẫn false), không phải
  market/publication, không phải selling-plan. Query lại sau đó → `true`, nút ATC sống lại. Khi
  hai nguồn của Shopify mâu thuẫn, khả năng cao là index storefront lệch tạm thời →
  [[storefront-vs-admin-availability]]. *Chưa xác minh nguyên nhân phía Shopify.*
- Merge `master` vào `feat/transform-discount`: 2 file conflict, `fixedBundleService.js` là
  conflict **import block** hai bên thêm symbol khác nhau → gộp cả hai (cả 7 symbol đều được dùng),
  không chọn một bên.

→ [[subscriptions]] · [[subscriptions-debug-runbook]] · [[digest-subscriptions-2026-07-27]] · [[koa-yup-validator-yup029]] · [[shopify-app-dev]]
