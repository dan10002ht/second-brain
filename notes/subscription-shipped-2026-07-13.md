---
type: note
title: Shipped digest — subscriptions 2026-07-13
summary: Dynamic Widget Editor block-system WIP, Volume Bundle (quantity-break) native feature, duplicate-charge redis lock + swap-frequency sync (v2.33.76), và LTV order-revenue pipeline với deploy-functions staging.
tags: [subscription, shopify, billing]
created: 2026-07-14
source: repo "subscriptions" git log (các hash dưới đây ĐÃ verified từ log-subscriptions.md)
---

Digest các commit landed ngày 2026-07-13 (repo `subscriptions`). Cross-link, không lặp nội dung:
liên quan [[subscription-digest-2026-07-11]] · [[subscription-digest-2026-07-12]] (volume discount),
[[subscription-installment-horizon-digest]] (swap/billing).

## Shipped

**Backend — chống double-charge (merged, tag v2.33.76, MR !2322)**
- `5e586fe0f` — per-cycle **redis distributed lock** (`SET NX EX 120` theo shopId+contractId+cycleIndex)
  chặn 2 cron tick chồng lấn cùng gọi `subscriptionBillingAttemptCreate` → khách bị charge 2 lần.
  Không release sau charge (để TTL hết) để phủ trọn cửa sổ overlap; fail-open khi Redis chết.
- `b4e1cf244` — `syncPlansFrequency`: swap product giờ force toàn bộ `plans[]` về cùng cadence
  của line vừa swap (trước đó chỉ ghi lại entry được swap → 2 item cùng lần giao khác frequency).

**Feature — Volume Bundle (native, quantity-break) — SB-13947**
- `01ee3c2f8` — loại bundle thứ 3: "Buy N → -X%" trên 1 product, stack với subscription discount ở
  checkout qua product-discount Shopify Function (đọc config từ discount-node metafield + cart line attr).
  Admin create/edit + tier/gift + product picker; storefront deal-bars hijack native ATC, cô lập trong
  ErrorBoundary. ~108 files. **Chưa merge master** (branch `feat/sb-13947-volume-bundle`).

**Feature (WIP) — Dynamic Widget Editor block system** (branch `feat/widget-editor`, chưa merge)
- Spec + plan: `727042345`, `756c829cb`, `8568cdb97`.
- Nền tảng: `376199169` blockRegistry stub · `5651f0000`/`798f07ef6` BlockRenderer (fallback + slot 1-level).
- Blocks: `70ded9abd` TrustText · `2d796e6c8` Description · `8550e9cc7` BenefitList · `44a52142e` Badge ·
  `8013bc051` Frequency · `949fa1d51` PlanSelector · `405ae1cf5`/`8e8c75874` PurchaseToggle.
- Functions layer: `4f9109b76` blockTypes const · `3c6a797f5` layoutTree Yup schema + sanitizer ·
  `281d09eb6` 5 dynamic layout presets.

**Feature — LTV / order-revenue analytics** (branch `feat/adama-ltv-analytics`)
- `02488077c` Add LTV analytics (cohort BQ procedures, LTVCacheRepository, chart UI) · `0d2a0535e` update
  BQ procedures + ChurnAnalytics/Overview refactor + backfillOrderRevenue command.

**Widget / dashboard (đã merge, tag):**
- `d290c971a`/`4fd8f427d` customize-widget: Block6 + tách LaurelBranch icon (tag v2.33.73, MR !2320).
- `8b3db1c4b` dashboard Widget Showcase card (tag v2.33.75) · `8a9e15edd` Hide GH button (v2.33.74).
- `b5decf712` fix Shopify POS integration guide link → help.joysubscription.com (tag v2.33.77, MR !2324).

## Reverted

_(none)_

## Deploy notes

- ⚠️ **`16d9d9b81` `[deploy-functions] trigger deploy staging 3`** — forces full CI deploy. Đi kèm SQL
  migration order-revenue: `addOrderRevenueColumns.js`, `backfillOrderRevenue.js`, `createTableOrder.js`
  (thêm cột + backfill revenue trên bảng order → kiểm tra chạy backfill trước khi query LTV mới).
- ⚠️ **`24a21b9c8` `[deploy-functions] Deploy staging 1`** — forces full CI deploy (onboarding concierge).
- Version bumps landed: **v2.33.73 → v2.33.77** (5 tag trong ngày).
- Redis lock (`5e586fe0f`) là runtime-critical: cần Redis khả dụng ở prod để dedup billing (fail-open,
  nhưng mất bảo vệ nếu Redis down).
