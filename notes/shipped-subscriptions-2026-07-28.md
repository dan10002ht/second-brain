---
type: note
title: Shipped Joy Subscription — commit landed 2026-07-27 (v2.34.33→36)
summary: Landed 07-27 — vá tenant-isolation X-Shopify-Shop-Id (v2.34.33), 2 dev-zone override pricing (v2.34.34 + v2.34.3x), shipping price theo billed cycle SB-14694 (v2.34.35), propagate address ra mọi upcoming order (v2.34.36); WIP lớn: one-time-only add product SB-14700, mystery product, bulk error banner SB-14564.
tags: [subscription, shopify, avada, auth]
created: 2026-07-28
source: repo "subscriptions" — git log 2026-07-27 (hash đã verify)
---

> Đề xuất từ inbox, chưa mature. Phần *bài học/root cause* nằm ở
> [[digest-subscriptions-2026-07-27]] — ở đây chỉ ghi **cái gì đã landed**.

## Shipped (merged master, có tag)

- **v2.34.33 — vá tenant isolation `X-Shopify-Shop-Id`** (`9020ac8f8` merge MR!2399, code `2879aad15`).
  `getShopId()` đọc thẳng header client-supplied → khách đổi header là đọc được data shop khác.
  Giờ lấy `ctx.state.shopId` từ session/JWT đã xác thực, chỉ fallback header ở public route,
  và bắn **403 tripwire** khi header ≠ credential. Cùng họ với lỗ IDOR đã ghi ở
  [[shipped-subscriptions-2026-07-24]].
- **v2.34.34 — Dev Zone: force pricing version override** (`fc2807cf2` merge MR!2403).
  Chuỗi: `6d8ea9b06` (thêm `shop.forcePricingVersion`, `const/pricingVersion.js`) →
  `52d873422` (từ chối pin sang version thiếu plan hiện tại) → `ac88b1c73` + `ae47aa0ea`
  (thu picker còn Auto + V5, sửa copy: pin version **có** đụng free-forever/feature gate/portal login).
  Why: trước đó lever duy nhất là `installedAtTest` — 1 ngày lái ~14 gate khác (widget V3/V4, CP mới, cancellation V2…).
- **v2.34.3x — Dev Zone: `disableSubCountLimit`** (`ce6d354e1` merge MR!2401, code `cf368c1c3`).
  Gỡ cap 50 subscription của pricing-v5 free plan cho test shop, chốt ở `limitPlanCal`
  (một choke point → phủ manual create + metafield `isV5SubCapReached` + usage card).
  Kèm: Republish dựng lại `activeSubscriptionCount` từ contract thật (không gì decrement lúc cancel).
- **v2.34.35 — custom shipping price áp đúng billed cycle (SB-14694)** (`b76b1460c` merge MR!2404, code `5fcda483f`).
  Bỏ tin `order.cycleIndex` của Firestore; giá custom lưu ở order doc rồi ghi vào cycle **resolve theo ngày**
  (`shopifyCycleIndex`) lúc billing. Preview đọc cùng nguồn nên số hiển thị = số bị charge.
  *Chưa động* case `shippingOption` (đổi rate) — cùng root cause, fix riêng.
- **v2.34.36 — propagate address ra tất cả upcoming orders** (`eb070b5fa` merge MR!2402, code `754c468b1`).
  `shouldSyncUpcomingOrders` bỏ guard `isRecentLocalUpdate`: guard đó sinh ra cho đúng 1 race
  (cancel/pause webhook, SB-14396 — xem [[shipped-subscriptions-2026-07-22]]) nhưng bắn ở mọi local mutation,
  làm order #2..#10 giữ data cũ. Race vẫn được phủ bởi `withContractSyncLock` + re-read contract trong lock.
- **`[deploy-extensions]` fix category select** (`a92efdcd7` merge MR!2400, code `a9b7c9bde`) —
  swap/add product modal ở customer-account-ui.

## WIP (đã commit, chưa merge master)

- **SB-14700 one-time-only add product** (nhánh `feat/one-time-only`, ~14 commit):
  spec `6439893ac` → plan `1d1ddcd81`/`066c9a5e9` → predicate `fde775504` →
  setting `allowAddSubscriptionProducts` `9d10d76c8` → dev-zone flag `forceOneTimeAddProduct` `d87d5bdb5` →
  chặn BE `469a9ee79`, ẩn nút khi không có upcoming order dùng được `72f3cf163` →
  route add sang upcoming order ở 3 surface (classic portal `34b3baa6e`/`00e908969`,
  card scripttag `54b013297`, CAU extension `619c63981`) → i18n 6 locale `b194cb4af`/`890a4953b` →
  `4fa8de794` đổi vị trí toggle.
- **Mystery Product** (nhánh `feat/discovery-product`): `0d38c462f` khối lớn (~9.3k dòng, thêm
  `firestore.indexes.json`) → `f98ae02b3` khoá add/edit/swap/remove ở cả 2 customer portal + 403 guard server-side
  → `b3269680c` fix UI rotation row (title dài làm rớt giá/nút xoá).
- **SB-14564 bulk action error banner + retry** (`13493fbb7`) — 11 bulk service ghi lỗi per-contract vào
  `shopifyErrors` thay vì nuốt, banner dùng `onSnapshot` (không polling), retry chỉ chạy lại contract fail.
  Cộng `e8765c64b` ContractSyncBanner + `useBundleSyncActivities`.
- **JSUB-260727-Yba5fc frequency line sync** (`a48ca4c26` + plan `7959c2dc2`) —
  `getCycleDiscountTiersVariables` không còn fallback về `getDefaultPricingPolicy` (0%) khi không resolve được tier;
  fallback 0% đi thẳng vào `currentPrice` → contract mất discount, khách bị over-charge mỗi kỳ (contract 15560409342: 129.44 → 136.25).
- **Audit script SB-14694** (`cb57828e5`) — `auditCustomDeliveryPriceDamage.js`, dò contract đã bị thiệt hại
  bởi bug shipping cycle ở trên. Cùng pattern fix → backfill → audit như SB-14649 ([[shipped-subscriptions-2026-07-25]]).

## Reverted

- Không có revert sản phẩm nào trong ngày.
- `13493fbb7` **revert scaffolding test local** trong cùng commit: bỏ workaround BigQuery→Firestore
  (`orderController`/`orderRepository`) + xoá `DEV_ONLY_upcomingOrdersFirestore.js`, trả bundle-sync dev knob về mặc định.

## Deploy notes

- `0cc1d65bf` **[deploy-functions]** trên `feat/sb-13947-volume-bundle` — đổi 1 dòng `routes/api.js`
  chỉ để ép CI deploy full (không phải thay đổi logic).
- `42bf04382` **[deploy-all] deploy staging 1** — sửa `.gitlab/ci/staging.yml` đẩy `feat/one-time-only` lên staging.
- `a92efdcd7` / `a9b7c9bde` **[deploy-extensions]** — hotfix category select, cần deploy extension riêng.
- **Migration/schema**: `0d38c462f` thêm `firestore.indexes.json` (+54 dòng) cho Mystery Product — index phải deploy trước khi query live.
- Noise bỏ qua: `241bf016b`, `3ab8960f7` (bump `staging3.yml`), `545c09030` (merge cùng nhánh).

## Liên quan

[[subscriptions]] · [[digest-subscriptions-2026-07-27]] · [[shipped-subscriptions-2026-07-25]] ·
[[shipped-subscriptions-2026-07-24]] · [[shipped-subscriptions-2026-07-22]] ·
[[subscriptions-debug-runbook]] · [[shopify-app-dev]]
