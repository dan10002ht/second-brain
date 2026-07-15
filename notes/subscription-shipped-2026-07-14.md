---
type: note
title: Shipped digest — subscriptions 2026-07-14
summary: Double-charge billing-attempt guard shipped (v2.33.78/80) rồi REVERT sạch cùng ngày (v2.33.82); LTV analytics merged master (v2.33.83); Joy rebrand (logo/boot/email/red panels) landed; Dynamic Widget Editor + Discovery Product build tiếp (chưa merge).
tags: [subscription, shopify, billing]
created: 2026-07-15
source: repo "subscriptions" git log (các hash dưới đây ĐÃ verified từ log-subscriptions.md)
---

Digest các commit landed ngày 2026-07-14 (repo `subscriptions`). Cross-link, không lặp nội dung:
[[subscription-shipped-2026-07-13]] (ngày trước — Widget Editor WIP, LTV, Volume Bundle),
[[subscription-installment-horizon-digest]] (swap/billing), [[subscription-digest-2026-07-12]] (volume discount).

## Shipped

**Billing — chống double-charge (SHIPPED rồi REVERT cùng ngày — xem Reverted)**
- `0a9ab2192` fix backend: guard trạng thái cycle + per-cycle lock re-check (manual & auto retry).
  Root cause: `idempotencyKey` sinh bằng `uniqid()` → khác mỗi retry → Shopify không dedupe; không tầng
  nào check cycle đã charged/processing. Thêm `hasBlockingBillingAttempt()` + `withOrderLock` re-check tươi
  trong lock. Merged **v2.33.78** (`8519da485`, MR !2326, `[deploy-functions]`).
- `9c9e3a859` fix backend: thu hẹp guard scope theo **app cycleIndex** (không chặn nhầm order reschedule
  cùng Shopify cycle — BQ: ~8.5k cycle/7.7k contract, chỉ ~20 case bug thật). Merged **v2.33.80** (MR !2329).

**Analytics — LTV** (merged master, HEAD)
- `52a2bd88e` Add LTV analytics — **v2.33.83** (MR !1922). Nối tiếp pipeline LTV/order-revenue của 07-13.
- `77dee1d20` hide tab analytics (feat/adama-ltv-analytics).

**Joy rebrand — logo / boot / email / brand-red** (nhiều MR merged)
- `14f4805d2` boot screen *vẽ* mark thay vì wipe — **v2.33.81** (MR !2328); nền `0561d7d73` (JS per-frame),
  `797442c29` inline SVG preloading (`0d6113a54` MR !2325), `334cb3dfb` gom preloading-logo 1 file + Vite inject.
- `727741722` repaint brand panels đỏ + app-icon mới · `b718a9c74` logo mới trong upgrade modal ·
  `2d66fb333` logo header email (fix luôn bug Outlook gradient) · `c1fdabd1b` logo SMTP test email.
- DevZone preview-all-modals (branch feat/joy-newbrand): `637d2507d`/`4034baa5e` tab mở mọi app modal +
  `60c9e4158`/`ad8b66204` narrow về surfaces có brand mark · `358...`→ `Fix mark banner đỏ` `630ffee68`.

**Onboarding V5 — best-seller badge** (merged v2.33.79, MR !2327)
- `93d1769a7` fix: ẩn badge "Best sellers" cho shop chưa có order (Shopify `BEST_SELLING` fallback
  newest-first khi shop chưa bán → gán nhầm sản phẩm mới là best-seller). Thêm all-time order lookup.

**Command — origin order cho manual contract** (branch chore/origin-order-backfill-command, MR !2331)
- `c5c470e3c` command attach 1 Shopify order sẵn có làm `originOrder` cho manual contract (Shopify không
  có API attach sau; ghi thẳng Firestore mirror `prepareOriginOrder()`; dry-run mặc định, idempotent).

**WIP — chưa merge master:**
- **Dynamic Widget Editor** (branch feat/widget-editor): dựng gần trọn editor — reducer/context `fb602b553`,
  Left/Right panel, preset picker, live preview, layoutTree persist `18d0d3ab8` + Yup validate `5f97aebc3`,
  E2E specs `dcb9159ac`, i18n. Tiếp nối nền tảng block-system của 07-13.
- **Discovery Product** (branch feat/discovery-product): `cbd3fb934` rotation subscription discovery
  (~57 files: create/edit UI, rotation cards, `createDiscoveryProduct` command, contract-create hook). WIP.
- **widget-v4 storefront fixes**: `0b63dded0` đóng dropdown khi click ngoài (composedPath qua shadow-root) ·
  `55353eccd`/`54410e72d` giá theo primary text color · `60aa97e4b` button-grid 1 hàng aligned price.

## Reverted

- ⚠️ **Toàn bộ guard chống double-charge (shipped v2.33.78 + v2.33.80) bị REVERT sạch cùng ngày.**
  - `fa74a0134` revert `0a9ab2192` (guard trạng thái cycle + lock).
  - `25fb65950` revert `9c9e3a859` (guard scope theo app cycleIndex).
  - `0a9283643` `[deploy-functions]` merge revert — **v2.33.82** (MR !2330).
  - → Bảo vệ double-charge billing **hiện KHÔNG còn trên master** sau ngày 07-14. Cần điều tra vì sao revert
    (regression? chặn nhầm?) trước khi ship lại. Liên quan giả định billing của [[subscription-installment-horizon-digest]].

## Deploy notes

- ⚠️ `8519da485` `[deploy-functions]` (v2.33.78) và `0a9283643` `[deploy-functions]` (v2.33.82, revert) —
  cả hai **force full CI deploy**. Deploy ship guard rồi deploy gỡ guard trong cùng ngày.
- `0e4f212a9` `[deploy-all] trigger deploy` — force deploy staging3.
- Version bumps landed: **v2.33.78 → v2.33.83** (6 tag trong ngày).
- Không thấy file migration SQL mới trong log này.
