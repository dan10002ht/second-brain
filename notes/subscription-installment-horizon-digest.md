---
type: note
title: Digest kỹ thuật — installment bug + Horizon theme block gotchas (Joy Subscription 07/2026)
summary: Root cause race auto-swap-at-create, bug bundle metafield variant-tay, và loạt gotcha khi viết Horizon theme block custom + ops BigQuery/token.
tags: [shopify, subscription, debug, storefront, bigquery]
created: 2026-07-08
updated: 2026-07-08
source: [[subscriptions]]
---

# Digest kỹ thuật — installment + Horizon theme block (07/2026)

> Chỉ chứa phần MỚI so với [[subscriptions]] + [[subscriptions-debug-runbook]]. Rút từ session history.
> Phần feedback cách làm việc → [[subscription-work-style]]; thiết kế installment → [[2026-07-08-installment-mode-design]].
> "chưa xác minh" = chưa confirm chi tiết trong session.

## Bugs (root cause)

- **Variant thêm tay thiếu metafield `avada_fixed_bundle_variant`** (chỉ `generateVariants` mới ghi). Expansion lúc contract-create (`buildBundleMetafieldList`) gate trên `item.variant?.metafield?.jsonValue && item.sellingPlan?.name` → bundle installment variant-tay không expand origin thành parent+child @$0. Fix: synth metafield từ bundle doc (`synthBundleMetafieldFromDoc`), chỉ fetch async khi `isInstallment`.
- **Race auto-swap-at-create — root cause chính xác**: swap chạy ở billing attempt qua `RUN_AUTO_SWAP`. Guard `isActive && !isManual && !isAutoSwapUpdate && syncUpcomingOrders(...)` với `RACE_CONDITION_WINDOW_MS = 10000`; khi auto-swap update rơi trong 10s → `isAutoSwapUpdate=true` → **skip** `syncManualUpcomingOrders` → cycle 2..N giữ sản phẩm cũ trước swap. Xác nhận qua BigQuery changelog trace. Fix đã ship (commit `d22d2ba5c`): thread `trigger`, cho phép re-sync lại **chỉ khi** `trigger === 'contract_create'` — KHÔNG bỏ guard (guard bảo vệ mid-lifecycle skip cố ý).
- **Red-herring**: contract có thể trỏ `subscriptionPlanId` doc đã bị xoá (merchant xoá/tạo lại rule → id mới) → `plan.autoSwap.enabled` falsy → swap bị skip âm thầm.

## Techniques / gotchas — Horizon theme block

- Pattern: build theme block đọc JS global `AVADA_BUNDLE`/`AVADA_SUBSCRIPTION` (nguồn giá authoritative) + product metafield, restyle/khống chế widget native. Scrape DOM fragile + double-count giá → ưu tiên global. Nhưng vài field global lag (`volumeDiscountSelecting.finalPrice/volumeQuantity`, `product.selectedVariant`) → đọc qty/variant từ DOM đồng bộ.
- Checkout **stack volume-tier discount VÀ subscription discount nhân nhau**: `subscribe = one-time × (1 − subPct)`.
- `{% javascript %}` **không** lồng trong `{% if %}`; Horizon dùng `{% stylesheet %}` + `{% schema %}` top-level + inline `<script>`.
- `--color-*` chỉ định nghĩa trong class `color-scheme-*` → block phải thêm `color-{{ block.settings.color_scheme }}` (kèm setting `color_scheme`) nếu không var rỗng, vỡ màu.
- `rgb(var(--color-primary-button-background))` **sai** — var `-rgb` mới giữ triplet thô; dùng `var(...)` trực tiếp, transparency `rgb(var(--color-foreground-rgb) / 0.65)`.
- **Theme Check MCP KHÔNG bắt** vài lỗi live-editor-strict: schema `default: ""` blank trên text setting; `{`/`}` trong string filter default; `{% javascript %}` lồng nhau; schema name ≤25 ký tự, setting label ≤70.
- metafield type `json` trong Liquid cần `.value`: `bundle = mf.value | default: mf`.
- Không dùng filter (`| default`) trong lookup `[...]` → assign handle trước.
- `[hidden]` bị `display:inline-block` override (specificity) → thêm `.x[hidden]{display:none}`.
- Horizon bắn `variant:update`/`variant:selected` trên `document` (không phải `change` trên form); set URL `?variant` async qua `yieldToMainThread` → đọc giá tức thì bằng `data-variant-id` trên option element thay vì URL.
- `all_products[handle]` rỗng cho tới khi product publish lên Online Store.
- Theme CSS override `<select>` mạnh (vd `ebay-bootstrap.css`) → cần `!important` trong block.

## Ops techniques (bổ sung runbook)

- **Đọc prod Shopify access token đã mã hoá local**: token là CryptoJS AES; decrypt bằng `ACCESS_TOKEN_KEY_PROD` từ `.env.local` (khác dev key). Chạy service không babel bằng cách require thẳng `lib/` đã build.
- **BigQuery changelog tracing**: `orders_changelog` (shard theo tháng, resolve tên qua `determineTableByMonth`) và `subscriptionContracts_changelog_partitioned_clean` (partition `timestamp` DAY + cluster `shop_id, subscription_contract_id`); luôn filter để prune + dry-run cost trước.

## Liên quan
- [[subscriptions]] · [[subscriptions-debug-runbook]] · [[joy-subscription-artifacts]] · [[firestore-multitenant]] · [[app-development]] · [[subscription-work-style]] · [[2026-07-08-installment-mode-design]]
