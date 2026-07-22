---
type: note
title: Shipped Joy Subscription 2026-07-21 — SB-14396 upcoming-order race (Redis lock), fixed-bundle inventory location, LCP web-vitals [deploy-functions], limit-banner copy
summary: Landed 07-21 (v2.34.09→13): SB-14396 chặn contract cancel/pause vẫn giữ upcoming orders bằng per-contract Redis lock, fix fixed-bundle ghi tồn đúng location (SB-14486), LCP/web-vitals capture [deploy-functions] (fix/optimize-lcp từ 07-20 nay merged), sửa copy limit-banner lifetime/monthly, tstool preview session; transform-discount + volume-bundle + agent-api + win-back còn WIP.
tags: [subscription, shopify, billing, performance, redis]
created: 2026-07-22
updated: 2026-07-22
source: repo "subscriptions" — git log (hash đã verify)
---

# Shipped — Joy Subscription (landed 2026-07-21)

> Góc "cái gì thực sự lên master/tag". Bổ sung cho [[digest-subscriptions-2026-07-20]]
> và tiếp nối [[shipped-subscriptions-2026-07-21]] (landed 07-20). Không lặp phần khái niệm.

## Shipped

- **[SB-14396] Contract cancel/pause vẫn giữ upcoming orders** — merge `472d3fb06` (tag **v2.34.10**, !2372).
  Webhook `subscription_contracts/update` in-flight land sau khi cancel → tái sinh upcoming orders vừa xoá,
  để lại UNBILLED orphans hiện như order live ở customer portal. Root cause: cả 2 sync path đọc status ở
  đầu nhưng ghi orders vài trăm ms sau (sau fetch billing-cycle của Shopify).
  - `6a8692844` — bản đầu: webhook skip sync khi vừa mutate local (`isRecentLocalUpdate`), `updateStatus`
    stamp `lastLocalUpdateAt` trước khi đọc lại, re-read status sau khi ghi + drop orders nếu contract inactive,
    `removeStaleUpcomingOrders` dọn future-dated cũ, portal (legacy + storefront API) trả rỗng cho paused/cancelled.
  - `5d558c390` — thay post-sync re-read bằng **per-contract Redis lock** `contractSyncLock` (SET NX + TTL,
    fail-open theo pattern `orderCreationLock` / `billingAttemptLock`); body sync vào trong lock để status đọc
    được đã authoritative, bỏ query Firestore thứ hai. Nối tiếp lock chống double-charge (xem [[subscriptions-debug-runbook]]).
- **fix(fixed-bundle): ghi tồn vào đúng location (SB-14486)** — merge `2fbf2c480` (tag **v2.34.12**, !2374),
  commit `2507ebb59`. `buildVariant` gửi `inventoryQuantities` tại `locationIds[0]` — Shopify sắp list theo
  **TÊN**, nên chỉ cần merchant có location tên bắt đầu "A" là toàn bộ save vỡ (`INVALID_INPUT: not stocked at
  the location`) + chặn luôn ghi Firestore. Sửa: update-flow tra `getStockedLocations` của chính bundle, chọn
  location đang stock & fulfill online (ưu tiên tồn cao); create giữ `locationIds[0]` (item mới Shopify tự
  activate); retry 1 lần bỏ `inventoryQuantities`; `formatShopifyUserErrors` cho toast đọc được. Kèm sửa công
  thức tồn: chia quantity-per-bundle (tránh oversell bội số qty), bỏ `tracked:false`, clamp ≥0, bỏ Infinity.
- **[deploy-functions] perf: web-vitals capture** — merge `2214b217e` (tag **v2.34.13**, !2375). Chính là
  `fix/optimize-lcp` còn WIP ở [[shipped-subscriptions-2026-07-21]], nay landed. Nền: `0a77065f9` (dùng
  `pagehide` làm backstop — LCP chỉ report khi interact *hoặc* hidden, session không click → mất mẫu, làm thống
  kê đẹp giả; mỗi sample ghi path gửi để đối chiếu Partner Dashboard), `0a3ef1387` (bỏ debug badge tự trở thành
  LCP element khi `reportAllChanges` bật), `600b0545b`/`60a09ff95` loading-logo + reportWebVitals đọc timeline
  lúc flush.
- **fix(limit-banner): lifetime vs monthly** — merge `b77e4d500` (tag **v2.34.11**, !2373), commit `251105be7`.
  Plan Free tính doanh thu **lũy kế trọn đời** nhưng banner dùng chuỗi "monthly" → hiểu nhầm reset theo tháng;
  thêm `titleLifetime`, đổi tiêu đề bám `isLimitReached` thay vì plan (Free 80% đã báo "reached", Starter chạm
  trần vẫn "nearly").
- **dev - tstool: instant preview session** — tag **v2.34.09** `cc868dcbc` (+ `87f515dc6`). Expose preview
  quick/custom/cross-store + docs `TS_TOOL_API.md`. Nối tsTool DFY API ([[digest-subscriptions-2026-07-17]]).

## Reverted

- `60a09ff95` "Revert comment" — chỉ hoàn 1 comment trong `index.js` thuộc chuỗi LCP, **không** phải rollback
  feature. Không có revert sửa-sai landed hôm nay.

## Deploy notes

- **`[deploy-functions]` landed**: `2214b217e` (v2.34.13) → buộc CI deploy full functions. Các
  `[deploy-functions]` khác (`ae1118ae9`, `bfacc0fec`, `095d02a21`, `af2d9911b`) nằm trên **nhánh chưa merge** → chưa deploy.
- **Version bumps**: v2.34.09 → v2.34.13 (5 tag trong ngày).
- **Migration**: không có migration file nào landed trên master.
- **WIP theo dõi (chưa merge):**
  - `feat/transform-discount` — `07d39c967` apply installment discount ở new customer account + reschedule
    email (`prepareCommonOrderData`), `1ae0d4bd1` **freeze** ship-mode discount per contract lúc mua (hidden
    line prop `_joy_installment_discount`, function ưu tiên nó hơn config live → sửa bundle sau không re-price
    contract đã bán) + extension `defer-last-discount`, `d62ac9b47` show discounted price ở list/portal.
    Tiếp nối WIP transform-discount từ 07-20.
  - `feat/sb-13947-volume-bundle` `3cd48f74f` — AOV volume bundle integration (setup page, `aovVolumeController`,
    Firestore repo, scripttag add-to-cart). Nối SB-13947 ([[subscription-shipped-2026-07-13]]).
  - `feat/agent-api` `7a6704a45` (SB-14377) — gate agent/Sidekick tools theo pricing plan + usage limit.
  - `feat/sidekick-agent-extensions` `1fe2bc7cb` (SB-14376) — register staging tools cho Sidekick deep-link pre-fill.
  - `fix/preview-custom-css` `5dff2e851` — nhận `widgetCustomCSS` + `subscriptionDescription` trong preview
    override; thiếu ở schema nên `validate` `stripUnknown:true` xoá âm thầm (200 nhưng bỏ override). Gotcha Yup
    stripUnknown lặp lại ([[digest-subscriptions-2026-07-17]]).
  - `feat/onboading-v5` — `01eb4b3d8` dời expert questions vào Step 1 (chips) + track answers BigQuery long-format,
    `af2d9911b` `[deploy-functions]` locale + `forceBookCall` Dev Zone. Refine Onboarding V5 Concierge (đã ship
    07-18, [[shipped-subscriptions-2026-07-18]]).
  - `feat/adama-add-win-back-flow` `fc64b62fd` — Win-back flow builder khổng lồ (~30k dòng: FlowBuilder/nodes/
    analytics/executors). Chưa merge.

## Liên quan
- [[subscriptions]] · [[subscriptions-debug-runbook]] · [[shipped-subscriptions-2026-07-21]] ·
  [[digest-subscriptions-2026-07-20]] · [[digest-subscriptions-2026-07-17]] · [[subscription-shipped-2026-07-13]]
