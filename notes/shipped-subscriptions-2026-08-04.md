---
type: note
title: Shipped Joy Subscription — commit landed 2026-08-03 (v2.34.45→46, CLS + Sidekick design)
summary: Commit landed 08-03 — master nhận 2 MR (v2.34.45 `[deploy-extensions]` docs Sidekick Phase 1, v2.34.46 chiến dịch giảm CLS boot/home/crisp/list table); trên nhánh còn chuỗi fix CI build extension (pin yarn 1.22.22, bump Shopify CLI 3.94.3), fix pricing gate uncapped plan, Volume Bundle `[deploy-all]`; không revert.
tags: [subscription, shopify, avada, performance, extensions]
created: 2026-08-04
source: repo "subscriptions" — git log (2026-08-03); các hash và tag dưới đây đã verify
---

# Joy Subscription — shipped 2026-08-03

> Phần *học được* (cách đo CLS A/B, security audit, chẩn đoán deploy CLI) nằm ở
> [[digest-subscriptions-2026-08-03]] — **không lặp lại ở đây**.
> Bối cảnh project: [[subscriptions]] · runbook: [[subscriptions-debug-runbook]].

## Shipped

### Vào master (2 tag trong ngày)

**`6b7f7eb7e` — tag `v2.34.45`, MR !2227 — `[deploy-extensions]`**
`docs(sidekick): Phase 1 design — agent gateway + contract skills`. Là **design
doc**, không phải code chạy — nhưng title mang `[deploy-extensions]` nên vẫn kéo CI
deploy extension. Nhánh nguồn `feat/sidekick-agent-extensions` còn commit chưa vào:
- `f835a9faa` — **fix pricing thật**: `limitPlanCal` so `orderRevenue >= maxRevenue`,
  mà Enterprise/Advanced có `maxRevenue = null` (uncapped). `null` ép về 0 nên
  `revenue >= null` luôn đúng và `revenue / null` = Infinity → **mọi shop gói
  uncapped bị đánh dấu limit-reached**. Thêm guard `hasRevenueLimit` + regression
  test Enterprise/Advanced vs Starter.
- `bb…`/`51ec67020` merge master vào nhánh (conflict `staging3.yml`,
  `Create.js`, `subscriptionContractRepository.js`, `yarn.lock`).
- `576ccd567` — sync 6 file locale generated cho `ToolGateBanner` (bỏ `capBanner` cũ).

**`74953e9ed` — tag `v2.34.46`, MR !2424 — chiến dịch giảm CLS**
`perf - fe - reduce CLS on boot screen, home cards, crisp widget and list tables`.
Từng lát có số đo trước/sau:
- `53cddd5ec` — **Crisp wrapper**: fixed wrapper phóng từ 120×120 lên full viewport
  khi mở, Chrome tính là dịch chuyển mọi thứ nó phủ → **0.916 mỗi lần mở + 0.916
  mỗi lần đóng**. Giữ nguyên một box, chỉ toggle `pointer-events`. Đo 1.832 → 0.
- `453850172` — **skeleton report card lệch chiều cao**: `SkeletonBodyText` 8px
  trong khi số thật nằm trên line 24px → mỗi card phình, đẩy trang xuống +32px.
  Home 0.0217 → 0.0038.
- `24605a2b0` — **reserve chiều cao list table**: `IndexTable` cao ~0 cho tới khi có
  row, pagination bên dưới rơi 464px. Subscriptions 0.0432 → 0.0065, products
  0.0334 → 0. *Tradeoff đã đo và chấp nhận*: shop có trang đầu gần rỗng thì giờ
  co lại (1 row: 0.0057 → 0.0406).
- `3276a5209` — `#reload-notice` hiện sau 15s làm cột boot tự căn lại và nhấc logo;
  đưa ra khỏi flex flow. 0.0138–0.0141 → 0 (3 file html: embed-template, index, standalone).

### Còn trên nhánh (chưa vào master)

- `feat/cls-optimization` `eb503b8be` — **web-vitals chỉ report CLS khi page hide**,
  mà timer flush không chờ tới đó: **1.235/1.553 sample production không có
  `clsValue`**. Bật `reportAllChanges` + ghi rect before/after của shift lớn nhất
  kèm timing/load state → truy được `clsTarget` nặng thay vì đoán. Thêm script
  report read-only trên collection.
- `feat/cls` `6146a7608` — CLS phía widget: skeleton liquid cho theme app extension.
- `feat/sb-13947-volume-bundle` `788a42053` — **`[deploy-all]`**, 22 file: dựng lại
  VolumeBundlePreview/VolumeDealBars/VolumePurchaseOptions, VolumeTierGift, hook
  `useSelectBundleType`/`useSelectProducts`, `volumeBundleDiscountService`,
  `handleVolumeAddToCart`. (SB-13947 xuất hiện từ [[subscription-shipped-2026-07-13]]
  — vẫn chưa merge.)
- `feat/standalone-add-btn` `14000bd69` (bản trùng `3f184c440` trên
  `feat/cau-add-first`) — CAU đưa Add product lên thành nút header standalone
  (JSUB-260730). Nối tiếp `v2.34.44` ở [[shipped-subscriptions-2026-08-01]].

## Reverted

Không có revert trong ngày.

## Deploy notes

- **`[deploy-extensions]`** trên `v2.34.45` — ép CI deploy extension cho một MR
  vốn chỉ có docs.
- **`[deploy-all]`** trên `788a42053` — **còn ở nhánh**, chưa kích CI production.
- **Chuỗi fix CI build extension** (nhánh `fix/ci-cli-version`, chưa merge) — đều là
  lỗi chặn deploy, đáng nhớ khi CI đỏ lần sau:
  - `41445359c` — CI pin `@shopify/cli@3.86.1` không bundle `tools.json` /
    `instructions.md` / `intent-schema.json` cho target `admin.app.intent.link`
    → Shopify **từ chối app version** với "Assets are required for links using the
    admin.app.intent.link target" cho cả 5 Sidekick action extension. Bump 3.94.3.
    Cùng commit: `defer-last-discount` thiếu devDependency trực tiếp
    `@graphql-codegen/cli` — yarn 4 chỉ expose binary của **direct dep** cho
    `yarn run`, nên "Build Function" chết vì không tìm thấy script.
  - `faa6fe1e0` — Shopify CLI spawn `yarn` bằng execa `preferLocal`, vớ đúng binary
    yarn 1.22.22 mà `node_modules/.bin` expose qua transitive dep; thiếu field
    `packageManager` thì extension rơi về root `yarn@4.13.0` → yarn 1 abort vì
    corepack mismatch. Pin `1.22.22` giống `cart-transform-extension` và
    `product-discount`.
- Không migration file trong ngày.

## Bỏ qua (noise)

`b8e6d964c` / `e6bb2cdd8` là entry stash (`WIP on master` / `index on master`),
`03176ba2c` chỉ sửa `shopify.app.toml` 2 dòng.

## Liên quan

[[shipped-subscriptions-2026-08-01]] · [[shipped-subscriptions-2026-07-30]] ·
[[digest-subscriptions-2026-08-03]] · [[digest-subscriptions-2026-07-31]] ·
[[subscription-work-style]]
