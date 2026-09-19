---
type: note
title: Shipped Joy Subscription — commit landed 2026-09-18 (v2.35.44 → v2.35.48, 5 merge vào master)
summary: Master nhận 5 merge (`v2.35.44`→`v2.35.48`) — trọn vòng merchant feedback của landing joyxjoy (2 [deploy-extensions]), bảng offer products cho fixed bundle, plan card thôi hiện 0% fee sau grace, dịch tay không bị ghi đè nữa, và fix hai argument lệch shape làm "add all products from collections" luôn trả plan rỗng; guard chặn charge trùng khi hai cycle chung một ngày billing vẫn trên nhánh.
tags: [subscription, shopify, avada, backend, storefront, extensions, billing]
created: 2026-09-19
updated: 2026-09-19
source: repo `subscriptions` — git log 2026-09-18 (hash đã verify)
---

# Shipped — `subscriptions`, commit landed 2026-09-18

Chỉ ghi **cái gì đáp xuống đâu**. Đợt trước: [[shipped-subscriptions-2026-09-18]] (landed 09-17).

## Shipped

### Vào `master` — 5 merge, 5 version bump

| Merge | Tag | MR | Việc | Commit nhánh |
|---|---|---|---|---|
| `2b2fe55fa` | `v2.35.48` | !2616 | "Add all products from these collections" thôi trả plan rỗng | `ea9a76383` |
| `2ac57481f` | `v2.35.47` | !2608 | SB-16933 — gộp translation với **giá trị cũ thắng** để giữ bản dịch tay | `499e540cc` · test `82e051df2` |
| `0891b799b` | `v2.35.46` | !2614 | `[deploy-extensions]` fixed bundle: offer products dạng **bảng** (cột In stock + Price) | `afbf2e29b` |
| `765fe95ff` | `v2.35.45` | !2611 | `[deploy-extensions]` trọn vòng **merchant feedback** cho landing/theme joyxjoy | 8 commit, xem dưới |
| `c3e37dfd7` | `v2.35.44` | !2612 | plan card Starter thôi hiện **0% transaction fee** sau khi hết grace | `a7839c94d` |

Bốn điểm đáng giữ:

- **`ea9a76383` — hai argument lệch shape trên cùng một đường, mỗi cái đủ để làm rỗng plan.**
  `subscriptionPlanService` gọi `getCollectionsProducts({shop, collectionIds})` nhưng hàm khai
  `(shop, collectionIds)` ⇒ `collectionIds` là `undefined`, guard trả `[]` trước khi tới BigQuery.
  Và `productBQService` gọi `getCollectionsProductsFromShopify(shop, collectionIds)` trong **cả hai**
  nhánh fallback, còn hàm đó destructure `({shop, collectionIds})` ⇒ BigQuery miss hoặc throw thì
  fallback cũng trả `[]`. Đo trên sprayfreefarmacy với 2 collection: gọi kiểu object **0**, gọi kiểu
  positional **0**, gọi Shopify đúng shape **119**. **Không có cảnh báo nào** — `selectedItems` chỉ
  về rỗng, mà trên đường update thì rỗng **ghi đè** thứ plan đang có. Cùng lớp
  [[loi-mang-bi-bao-thanh-ly-do-nghiep-vu]] (lỗi hạ tầng hiện ra dưới dạng "không có sản phẩm nào").
- **`0310ca2c6` — `available` nay là tín hiệu tồn kho đầu tiên, trên cả `inventory_policy: continue`.**
  `getVariantMaxQty` quyết trần theo `inventory_management`/`_quantity`/`_policy`, nhưng
  `/collections/*/products.json` — endpoint fill mọi category sau giới hạn eager — **không trả field
  nào trong ba cái đó**. Thiếu `inventory_management` đọc thành "không track" ⇒ mọi variant load muộn
  có trần vô hạn, khách thêm được hàng hết rồi chết ở checkout (merchant vấp với Belvedere eggs).
  Card sold-out đổi stepper thành notice "Out of stock" thay vì cặp +/- disabled. Hai fixture trong
  `productPickerStockLimit` mang `available:false` vào state Shopify **không bao giờ phát** — sửa
  fixture chứ không lách: [[fixture-khong-phai-hop-dong-du-lieu]]. ⚠️ Xem mục Cần xác nhận #1.
- **`499e540cc` — translation gộp, giá trị cũ thắng, không đổi schema.** Bốn repository (boxes,
  plans, productBundle, translation) + `translationService`, diff nhỏ. Cùng họ "ghi đè thay vì gộp"
  đã ghi ở [[digest-subscriptions-2026-09-11]]. Test đỏ trước fix (`82e051df2`, 106 dòng).
- **`a7839c94d` — plan card Starter hiện 0% fee kể cả sau grace**, tách ra helper
  `isStarterGraceFeeActive` (+75 dòng test). Khớp với ghi nhận ở
  [[digest-subscriptions-2026-09-04]]: tính tới 04/09 có **494 shop Starter pricing V4** đang trong
  grace 0% và **chưa shop nào hết 6 tháng** — tức bug này tới hôm nay mới bắt đầu có nạn nhân.

### Vòng merchant feedback landing joyxjoy (đã vào master qua !2611)

Nhánh `fix/landing-merchant-feedback` là bản **gộp lại** của mấy nhánh một-việc trước đó
(`fix/landing-fonts`, `fix/cta-simplify`, `fix/picker-stock`…), nên nhiều patch xuất hiện **hai
hash** trong log — đừng đếm hai lần:

| Trên nhánh gộp | Bản trên nhánh lẻ | Việc |
|---|---|---|
| `abf69e5e5` | `0b040c397` | product page **giữ Add to cart của theme**, subscription dời sang một card (324 → 108 dòng, bỏ hẳn `<script>`) — xem decision bên dưới |
| `d4670f631` | `e3a6aa39b` | tiêu đề box/sản phẩm mở product page (tab mới, chặn click nổi lên card; "See box contents" bỏ khi chọn nhiều box) |
| `5e48e5995` | `3b228cb50` | FAQ failed-payment viết đúng cách shop này bill — **không retry**, copy do merchant cấp. ⚠️ Cần xác nhận #2 |
| `53dfc06f5` | `10c3c1d07` | box theo mùa thôi lặp ở step 2 (8/16 box nằm trong Fruit & Veg; `buildAllowedProductIndex` nhận id step 1 và loại ra) |
| `0310ca2c6` | `77b3f060c` | chặn hàng hết ngay ở picker (mục trên) |
| `bf557dec6` | `71529d09e` | tên sản phẩm về **body font** của store: `.jw-card-title` là `<h4>`, theme style thẻ heading trần nên thắng `font-family` kế thừa từ `.jw-landing` |
| `a06750d87` | `52252243e` | gọt comment tường thuật còn phần không hiển nhiên |
| `a7e1e6db5` · `6292aa51a` | — | bỏ assertion quantity-hiding mà nhánh này supersede; chú thích rule theme đã đè font |

### Còn trên nhánh

| Hash | Nhánh | Việc |
|---|---|---|
| `f41ba8786` | `fix/skip-cycle-recharge` | **chặn charge lần hai khi hai cycle chung một ngày billing** — `billingAttemptGuard` +39 dòng, `shopifyService` +49, test **692 dòng**. Tiếp tục dòng guard double-charge đã ship/revert/re-apply hồi tháng 7 ([[subscription-shipped-2026-07-13]] · [[subscription-shipped-2026-07-14]] · [[subscription-shipped-2026-07-16]]) — hai cycle chung ngày là ca guard cũ **không** phủ |
| `ac6edaa64` | `feat/reward-qty-milestone-be` | SB-16935 — reward `pending` phạm vi **campaign-wide (`__all`)** không apply được lúc billing; `subscriberRewardRepository` (+139 dòng test `getPendingReward`) |
| `1f616f5fe` · `df4731557` | `agent/SB-16965` | gửi email thất bại cho **manual charge** — fix chỉ **bỏ 4 dòng** trong `subscriptionEmailService` (tức đang có điều kiện chặn), test tái hiện 41 dòng. ⚠️ Cần xác nhận #3 |
| `da90b0ec5` | `fix/swap-modal-mobile` | swap modal nổi **trên** bottom sheet trên mobile (`.jw-swap-overlay` z-index 200 vs sheet 210), và bấm checkout thì đóng sheet |

## Reverted

**Không có `git revert` nào.** Nhưng có một lần **đảo hướng thật**: `abf69e5e5` / `0b040c397` bỏ hẳn
cách block CTA tự dựng purchase option trên product page, và nói thẳng nó supersede nhánh
`fix/cta-hide-qty` (*"that MR should be closed rather than merged"*) — chính nhánh
[[shipped-subscriptions-2026-09-18]] ghi hôm qua ở hai hash `86c4b76ab` / `ef1b1d016`. `a7e1e6db5`
xoá luôn 31 dòng assertion của hướng cũ. Tách riêng:
[[2026-09-18-cta-product-page-giu-add-to-cart-cua-theme]].

## Deploy notes

- **Hai merge mang `[deploy-extensions]`**: `0891b799b` (!2614) và `765fe95ff` (!2611). **Không có
  `[deploy-functions]`, không có `[deploy-all]`** trong đợt này.
- **Không có file migration nào**, không script backfill nào (khác hẳn hai đợt trước).
- **`v2.35.43` không xuất hiện.** Đợt trước dừng ở `v2.35.42`, đợt này mở ở `v2.35.44`. Hôm qua
  `v2.35.38` cũng thiếu y như vậy ([[shipped-subscriptions-2026-09-18]]) — **hai đợt liên tiếp**
  hụt một số. Có thể ngoài cửa sổ log, có thể bump bỏ sót. Chưa xác minh.
- **Không lần nào ghim `STAGING_BRANCH` trong đợt này** — chuỗi 4 ngày liên tiếp đã ghi ở
  [[shipped-subscriptions-2026-09-18]] dừng lại ở đây. Chưa có cơ chế nào được thêm, chỉ là hôm nay
  không ai cần.
- **Locale: `afbf2e29b` chạy `yarn trans`** nên diff chạm cả 7 file locale + `origin.json`, và
  **tiện thể xoá key chết `singleVariantPerProductHint`** không JSON/component nào tham chiếu. Đây là
  dạng diff to vì công cụ, không phải vì việc.
- **Liquid vẫn ngoài CI.** `abf69e5e5` sửa `docs/joyxjoy-theme/custom-liquid/joy-bundle-cta.liquid`
  (−276 dòng) và `README-joy-bundle-cta.md` — merchant paste tay
  ([[2026-09-08-bespoke-khong-vao-theme-app-extension]]).

## ⚠️ Cần xác nhận

**1. `available:false` khi `inventory_policy: continue` — tin ai?**

| Nguồn | Nói gì |
|---|---|
| [[storefront-vs-admin-availability]] (resource, 08-09) | Bước loại trừ #1: `inventoryPolicy: CONTINUE` thì tồn kho 0 **vẫn phải mua được** ⇒ hết hàng *không giải thích được* `available:false`; nghi index storefront lệch tạm thời, **đừng sửa code theo triệu chứng sắp tự khỏi** |
| `0310ca2c6` (09-18) | `available` *"is now the first signal and **outranks** inventory_policy: continue, since it is Shopify's own verdict rather than an input to it"* |

Hai phát biểu ngược chiều nhau về **thứ tự ưu tiên**. Có thể dung hoà (note nói về chẩn đoán ATC
chết ở theme, commit nói về trần số lượng ở picker của app) nhưng chưa ai chứng minh điều đó — nếu
không, đường picker sẽ chặn cứng đúng những variant mà [[storefront-vs-admin-availability]] dạy là
sẽ tự khỏi. Cần một phép đo: variant `continue` + tồn 0 thì `/collections/*/products.json` trả
`available` bằng gì. Liên quan: commit còn khẳng định endpoint **không** trả
`inventory_management/_quantity/_policy` nhưng **có** trả `available` — trong khi note ghi bản `.json`
của `/products/<handle>` **ẩn** `available`. Hai endpoint khác nhau, cần ghi rõ khi mature.

**2. FAQ nói "không retry" — nhưng app thì có.**

| Nguồn | Nói gì |
|---|---|
| [[digest-subscriptions-2026-07-18]] | *"Một cycle bị charge nhiều lần là **BÌNH THƯỜNG** theo logic app"* (guard chỉ block khi attempt còn `processing`), và app tự gửi email verify 3DS để khách trả lại |
| `5e48e5995` (09-18) | FAQ mới: merchant **không** retry — deadline đóng gói nên payment fail là **mất kỳ giao đó**, khách tự đặt tay trước cut-off |

Nếu đây chỉ là copy theo quy trình vận hành của merchant thì không sao; nếu cron billing của app
vẫn attempt lại cho shop này thì FAQ đang hứa một hành vi mà hệ thống bác. Cần chốt: shop joyxjoy có
cấu hình nào tắt retry, hay chỉ có chữ trên trang. Đây đúng lớp [[ack-khong-phai-hieu-ung]] — văn bản
không phải hành vi.

**3. SB-16965 — email thất bại cho manual charge đang bị chặn có chủ đích?**
`1f616f5fe` chỉ **xoá 4 dòng** để email đi được. Brain không có note nào nói vì sao manual charge
từng bị loại khỏi email thất bại. Nếu điều kiện đó dựng lên để tránh spam merchant khi charge tay
hàng loạt, bỏ nó ra sẽ đổi hành vi cho mọi shop. Cần đọc lại lịch sử của đoạn điều kiện trước khi
merge.

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-09-19]] ·
[[shipped-subscriptions-2026-09-18]] · [[digest-subscriptions-2026-09-17]] · [[2026-09-18-cta-product-page-giu-add-to-cart-cua-theme]] ·
[[2026-09-16-landing-doi-nguon-lap-sang-collection-list]] · [[digest-subscriptions-2026-09-08]] ·
[[digest-subscriptions-2026-09-04]] · [[digest-subscriptions-2026-09-11]] ·
[[storefront-vs-admin-availability]] · [[fixture-khong-phai-hop-dong-du-lieu]] ·
[[loi-mang-bi-bao-thanh-ly-do-nghiep-vu]] · [[ack-khong-phai-hieu-ung]] ·
[[2026-09-08-bespoke-khong-vao-theme-app-extension]]
