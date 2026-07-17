---
type: note
title: Shipped digest — subscriptions 2026-07-16 (log chạy 2026-07-17)
summary: Widget V4 merged (v2.33.91) + loạt polish fix; guard double-charge RE-APPLY sau revert 07-14 (v2.33.90); fix price-sync stuck PENDING (v2.33.88); Fix LCP home (v2.33.89); WIP chưa merge — one-time cart-transform + defer-last-discount function (kèm 2 migration command), fix shipping-rate FX SB-14315, discovery multi-currency.
tags: [subscription, shopify, billing, extensions]
created: 2026-07-17
source: repo "subscriptions" git log (các hash dưới đây ĐÃ verified từ log-subscriptions.md)
---

Digest các commit landed ngày 2026-07-16 (repo `subscriptions`). Cross-link, không lặp nội dung:
[[subscription-shipped-2026-07-14]] (guard double-charge bị revert — ngày này RE-APPLY),
[[subscription-digest-2026-07-16]] (learning cùng ngày từ session — hiện ở inbox dạng `digest-subscriptions-2026-07-16`),
[[subscription-digest-2026-07-15]], [[2026-07-08-installment-mode-design]] (nền installment 2 mode).

## Shipped (merged master)

**Widget V4 — merged** (tag **v2.33.91**, MR !2346)
- `5d6aee327` feat(widget-v4): V4 subscription widget landed master.
- Loạt polish cùng ngày trên nhánh v4: `ecc500f1c` centre badge icon-row (specificity + %-translate trên container width ~0) ·
  `d3cacebef` badge radio nằm cạnh title (bỏ `flex: 1`) · `433d53861` ẩn price badge khi plan không có discount
  (badge rỗng vẫn paint sliver clip-path) · `241a7d275` bỏ bold title/price · `d2a59e7cd` slim scrollbar preview ·
  `f99d4238b` refactor tách StorefrontHeader/ProductMedia khỏi PreviewContainerV4.
- `13b3eb68d` / `1f70c4253` (hotfix/update-date) — **update `WIDGET_V4_DATE`** trong `isEnableWidgetV2.js`:
  fix bug placeholder-date đã nằm trong quá khứ (root cause ở [[subscription-digest-2026-07-16]]). Hotfix branch, chưa thấy merge trong log.

**Billing — RE-APPLY guard double-charge** (tag **v2.33.90**, MR !2334)
- `3e8132bbb` fix backend: re-apply guard double-charge billing attempt (scope theo app cycleIndex).
  → **Đóng câu hỏi mở của [[subscription-shipped-2026-07-14]]**: guard shipped v2.33.78/80 → revert sạch v2.33.82 → nay ship lại bản scoped. Bảo vệ double-charge đã trở lại master.

**Bulk actions — fix price-sync job kẹt PENDING** (tag **v2.33.88**, MR !2343)
- `164cf46d9` / merge `8583c4844`: job `sync-product-price-to-subscription-contract` kẹt PENDING → `isExecuting` khóa mọi bulk action của shop vô hạn.
  Fix 4 root cause: resume theo `activityId` (bỏ field-lookup mong manh), key chunk doc theo `chunkIndex + productId` số, flip DONE mọi chunk (không chỉ chunk cuối), catch → FAILED thay vì nuốt lỗi.

**Performance — Fix LCP trang Home** (tag **v2.33.89**, MR !2345)
- `c7d72a7db` / merge `70a457449`: lazy-load WidgetShowcase bằng hook `useInView` mới, preload template.

**Product-team mockup** (merged master, MR !2347)
- `c3aabe607` / `ac0f46d19`: mockup-app — payment recovery standalone page, retention badge, widget badge-position, dashboard copy. Chỉ là mockup/PRD, không đụng runtime app.

## WIP — chưa merge master

- **One-time purchase + installment ship-mode discount** (branch feat/transform-discount): `e17a532b8` (~58 file) —
  cart-transform `expand` cho one-time bundle (service `onetimeExpand`), **extension mới `defer-last-discount`** (Shopify Function discount),
  metafield per-product, admin OneTimePurchaseCard + Price ship-options; `122e65945` purchase-option UI installment widget theo mockup.
  Bối cảnh quyết định ở [[subscription-digest-2026-07-16]]. ⚠️ Kèm **2 migration command**: `enableInstallmentDiscount.js`, `exposeMetafieldsHeadless.js`.
- **Shipping rate FX SB-14315** (branch fix/SB-14315-shipping-rate-fx): `ff3b0522b` — auto-update lấy đúng contract currency qua
  `cartCreate @inContext(country)` thay vì convert bằng bảng FX tĩnh (CHF→EUR ra số sai); 9 regression test. `2f6f60a44` trỏ STAGING2 vào nhánh này.
- **Discovery Product** (branch feat/discovery-product): `e08230420` — freeze presentment price vào snapshot lúc contract-create
  (fix 500000 VND bị charge $500000), bail khi productBundle doc không tồn tại (TypeError mỗi lần mua discovery), currency symbol + dirty-state editor.
  Tiếp nối WIP ở [[subscription-shipped-2026-07-14]].
- **Onboarding V5** (branch feat/onboading-v5): `a29a6eda6` — cho phép Next khi store rỗng ở bước build-plan; Finish bỏ qua tạo plan, quickstart task chỉ done khi plan thật sự được tạo.

## Reverted

- Không có revert trong log này. Ngược lại: guard double-charge (revert 07-14) được **ship lại** ở v2.33.90 — xem Shipped.

## Deploy notes

- ⚠️ `253df6e38` **`[deploy-functions]`** — force full CI deploy, nhưng nội dung chỉ là **log [DEBUG] tạm** trong `shopifyService.js`
  (soi embed/widget block detection trên staging — vụ "Refresh status" activation). Cần gỡ log này trước khi lên prod.
- Version bumps landed: **v2.33.88 → v2.33.91** (4 tag trong ngày).
- `2f6f60a44` đổi STAGING2_BRANCH → `fix/SB-14315-shipping-rate-fx` (trước là fix/bundle-name-truncate).
- Migration: 2 command mới trong `commands/migration/` nhưng nằm trên **nhánh chưa merge** (feat/transform-discount) — chưa chạy được trên prod.

## Bỏ qua (noise)

- `1c4cfd482` add todo · `592ca2785` / `abcd196ee` merge master vào branch (conflict resolution).
