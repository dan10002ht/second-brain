---
type: note
title: Joy Subscription — commit landed 2026-08-19
summary: Master nhận 2 tag (`v2.34.78` SET_SHOP merge thay vì ghi đè, `v2.34.79` loyalty sync bỏ qua shop free-forever sau ca thu tiền thật); trên nhánh là trọn trang landing joyxjoy (~14 commit), 2 lát CLS admin và import mang theo discount code của Appstle.
tags: [avada, subscription, shopify, performance]
created: 2026-08-20
updated: 2026-08-20
source: repo `subscriptions` (avada/subscriptions) — git log 2026-08-19, hash đã verify
---

# Joy Subscription — commit landed 2026-08-19

## Shipped

**Master — 2 tag**

| Tag | Merge | MR | Nội dung |
|-----|-------|----|----------|
| `v2.34.78` | `ad3a1a5d6` | !2488 | `SET_SHOP` **merge** vào state thay vì thay cả object |
| `v2.34.79` | `d7a316a5b` | !2489 | loyalty sync để yên shop free-forever |

**`v2.34.78` (`5dfc63777` + `c1cce5bea`)** — boot embedded gọi `/shops` rồi
`/shops/integrations` tuần tự (~900–1100ms, cố ý serial vì Functions v1 không có
concurrency). `SET_SHOP` thay nguyên `state.shop` bằng payload `/shops`, mà payload đó
**không có** các field chỉ `getShopIntegrations` trả về (`blockWidgetStatus`,
`appBlockStatus`, `klaviyoBlockStatus`, `themeId`, `menus`, `shopInfo.timezone`…). Kể cả khi
cache localStorage đã seed sẵn, chúng bị xoá ở `shops:fetch-end` và chỉ được `MERGE_SHOP`
trả lại ở `integrations:fetch-end` ⇒ consumer gate theo "biết vs chưa biết" lật
biết → chưa biết → biết với một frame đã vẽ ở giữa: layout shift ở **mọi** lần load.
Chọn merge trong reducer thay vì whitelist field: cả **53 call site** `setShop()` đã truyền
full snapshot nên merge là no-op với tất cả, chỉ đổi đúng chỗ sai (`storeReducer.js:148`);
whitelist thì phải bảo trì tay song song `getShopIntegrations` và sẽ mục âm thầm.
Root cause đã ghi ở [[digest-subscriptions-2026-08-19]] — đây là mốc nó **vào master**.

**`v2.34.79` (`017366d16`)** — shop cài trước `GO_LIVE_PRICING` vốn đã không trả tiền, nên
món quà Joy Loyalty không có plan nào để tặng. Chạy CASE 1 vẫn ghi
`customPricing.enabled = true`, và `isFreeForever()` đọc cờ đó là "đã ghim vào plan trả
tiền" ⇒ shop **mất free-forever vĩnh viễn**. Shop `918ud3-zi` đã bị thu tiền theo đường này
(điều tra đầy đủ: [[shop-918ud3-billing-2026-08-19]]). Fix chỉ chặn **ca mới**; shop đã dính
cờ phải sửa tay. Fixture test cũng phải đổi `installedAt` 2025-01-01 → 2026-01-01 vì mốc cũ
vô tình biến mọi shop trong fixture thành free-forever.

**Nhánh `feat/joyxjoy-landing` — trọn trang landing bespoke (~14 commit)**

Hướng đi đã chốt ở [[2026-08-19-page-custom-o-theme-khach]]; hôm nay là toàn bộ phần thực thi:

- `214340718` spec + mockup gốc · `451b6d827` sửa lệnh build sai trong spec
- `4feb1a61d` scaffold bundle scripttag riêng `subscription-box-joyxjoy-main`
- `37f8cc5ca` metafield danh sách fixed bundle (shape tối giản, **không** nhét giá/ảnh vì đó
  là dữ liệu chết và sai presentment currency) → `58bf3f178` nối vào `handleSetFixedBundle`
- `876cca492` script seed store dev (dry-run mặc định) → `0ef4b273f` fix thiếu
  `category: 'SUBSCRIPTION'` khi `sellingPlanGroupCreate`
- `4d1b8e29d` `buildCartItems` — property contract `__staple` / `__purchase_type`, **tuyệt đối
  không phát `__box_id`** (thuộc namespace Subscription Box, set bậy sẽ phá `resolveSwapLineKey`)
- `b403480ef` section 1 boxes + frequency selector · `bf7a0d958` section 2 staples ·
  `585075f0a` tách `ProductPickerSection` dùng chung cho section 2+3 (bundle 41.0 → 41.6KB
  thay vì ~55KB nếu nhân bản) · `ad6e3a289` dời nó ra khỏi thư mục `StapleSection/`
- `7c7b5d7e5` summary panel + CTA + swap modal · `9b22dcbc1` 4 khối tĩnh (hero / three steps /
  cutoff / FAQ bằng `<details>` native) · `0aef32c1d` deep-link `?bundle=` chọn sẵn bundle
- `51895e14f` `helpers/report.js` — kênh báo lỗi sống sót qua `drop_console: true`
- `2976cea07` script archive 9 doc `fixed-bundle` rác trên store dev (đổi `bundleType`,
  **không xoá doc**; xoá là một chiều và để lại discount/metafield trỏ vào `productId` đã mất)

**Nhánh `fix/cls-admin-bfs` — 2 lát CLS admin**

- `50e4b2fb0` Home quyết thứ tự card **trước first paint**: giá trị resolve được ghi
  localStorage sau paint, đọc lại đồng bộ trong `useState` lazy initializer ở lần load sau —
  cùng timing mà `storeReducer` đã dùng để seed từ `readShopCache()`. Giá phải trả: đổi trạng
  thái chỉ hiện ở lần load kế tiếp — cố ý, vì "sắp xếp lại ngay khi fetch về" chính là cái
  shift đang gỡ. **Không** reserve chiều cao: `24605a2b0` đã thử và `fd214c920` revert.
- `ed05e51e0` hai cache localStorage đều suy khoá từ `?shop=` đọc tại thời điểm gọi;
  `history.push` chỉ mang pathname nên sau lần điều hướng đầu tiên khoá rơi về literal
  `'default'`. Hệ quả: `clearShopCache` xoá một bucket rỗng (invalidation **âm thầm không làm
  gì**, entry thật sống tới TTL 48h), và `homeCardOrderCache` rò giữa **hai shop cùng
  browser**. Sửa: `shopCache` chụp `?shop=` một lần lúc module evaluate; `homeCardOrderCache`
  nhận domain qua tham số — lần đầu tiên standalone có khoá riêng theo shop.
- Số đo hiện tại: admin CLS p75 **0.129–0.131** vs ngưỡng 0.1 của Shopify, `/embed/` chiếm
  63% mẫu ở 0.164 (`commands/misc/queryWebVitalsCls.js`) — phải đo lại sau deploy.

**Nhánh `feat/import-subscription-line-discounts`**

- `39b447eea` import contract Appstle mang theo **discount code**: `prepareImportLineDiscounts`
  dựng `SubscriptionAtomicLineInput.discounts`, `recurringCycleLimit` làm hạn ("apply thêm N
  đơn nữa"). Promo là **lớp discount code, không phải pricing policy** — hai thứ nhân nhau,
  nhét vào `pricingPolicy` là kết liễu luôn discount thường trực của selling plan. Cột discount
  giờ được validate thay vì đi ké: type mà không có value thì **reject**, không âm thầm rụng.
- `140147803` `groupSubscriptionLinesById` tồn tại **hai bản byte-for-byte** (importService cho
  XLSX, `useImportSubscriptionModal` cho CSV gom ở browser) — thêm cột vào một bản là cột đó
  bị vứt trước khi validate nhìn thấy, mà run vẫn báo thành công. Gộp về một
  `IMPORT_LINE_FIELDS` dùng chung.

**Nhánh khác**: `b0bbcd2a4` + `eb79e34a7` bổ sung e2e mystery product (rotation-pool,
list-search-pagination, view-menu).

## Reverted

**Không có revert nào trên master hôm nay.** `fda93ee6a` (revert
"Make AppModal destructive primary action render in critical tone", `8eebf304a`) là commit
**29/07** trên nhánh win-back, lọt vào log này vì nhánh mới được push — cụm win-back đã ghi ở
[[shipped-subscriptions-2026-08-12]]. Tương tự, chuỗi mystery product `d37d0a909`/`124f83bfb`
(24/07) và win-back `8ec84f158`→`949368707` (23/07 → 05/08) là commit cũ, không tính là mới.

## Deploy notes

- Hai tag master **không** mang cờ deploy trong tiêu đề.
- `b0a5a53e4` `[deploy-functions] Deploy staging 4` (nhánh `feat/discovery-product`).
  `e13d65b36` `[deploy-functions]` là commit 05/08 cũ.
- **Ba commit chỉ đổi `.gitlab/ci/staging*.yml` để chiếm slot** trong một ngày (`06533a93f`
  `fix/cls-admin-bfs`, `f046f3140` `feat/portal-preview`, `b0a5a53e4` `feat/discovery-product`)
  — tranh slot staging giữa các nhánh, cùng loại vấn đề với
  [[2026-08-14-staging-4-cho-nhanh-sidekick]] ở repo pdf.
- Không migration mới. `firestore.indexes.json` chỉ xuất hiện trong commit win-back cũ.

## ⚠️ Cần xác nhận

**Fix free-forever đặt guard ở đâu — trước CASE 1 hay ở CASE 2?**
- [[digest-subscriptions-2026-08-19]] viết: *"Fix đặt ở `syncShopPlanWithIntegrationLoyalty` —
  shop free-forever thì **không đổi plan khi gỡ Loyalty**"* (tức nhánh dọn dẹp CASE 2).
- Commit `017366d16` viết ngược: guard `isFreeForever()` đặt **trước CASE 1** (lúc *tặng*
  plan), và **cố ý giữ CASE 2 chạy được** cho shop đã bị tặng — *"the CASE 2 cleanup path has
  to stay reachable for it"*.

Hai mô tả cùng trỏ vào một hàm nhưng khác nhau ở nhánh được chặn, và khác nhau đúng ở chỗ
quyết định shop đã dính cờ có tự chữa được hay không. Vế còn lại thì khớp: cả hai đều nói
CASE 2 không dọn được cho shop đã có `recurChargeId`.

*(Đã tự giải quyết, ghi lại để khỏi tra lại: các commit landing ở `b403480ef`/`4feb1a61d` còn
viện dẫn "trần bundle 30KB" — [[digest-subscriptions-2026-08-19]] đã đính chính rằng trần đó
không tồn tại, bundle cùng loại đang 198KB.)*

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-08-20]] ·
[[digest-subscriptions-joyxjoy-2026-08-20]] · [[shipped-subscriptions-2026-08-19]] ·
[[digest-subscriptions-2026-08-19]] · [[2026-08-19-page-custom-o-theme-khach]] ·
[[shop-918ud3-billing-2026-08-19]] · [[digest-subscriptions-2026-08-15]]
