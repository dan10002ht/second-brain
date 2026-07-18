---
type: note
title: Shipped Joy Subscription 2026-07-17 — Onboarding V5 [deploy-all], Cellexia ATC fix (ship→revert→reship), Bird Location Name, Retention hub
summary: Landed 07-17 (v2.33.94→100): Onboarding V5 Concierge [deploy-all], fix cuối cho giá ATC Cellexia (populate selling_plan input) sau khi revert cách MutationObserver, Bird Delivery Location Name (attr + backfill charge-flow), dời Payment Recovery sang Retention hub.
tags: [subscription, shopify, storefront, billing]
created: 2026-07-18
source: repo "subscriptions" git log (hash đã verify)
---

# Shipped — Joy Subscription (landed 2026-07-17)

> Chỉ những commit ĐÃ merge master / gắn tag. Góc "cái gì thực sự lên" — bổ sung cho
> [[digest-subscriptions-2026-07-17]] (góc session/khái niệm) và tiếp nối [[subscription-shipped-2026-07-16]].
> Nhánh chưa merge liệt kê ở Deploy notes để theo dõi, không coi là shipped.

## Shipped

- **Onboarding V5 "Concierge"** — `cc5fd1ba2` (v2.33.94, !2311). Tiêu đề mang `[deploy-all]` → xem Deploy notes.
- **Fix giá ATC Cellexia cold-load (bản CUỐI)** — `2d2674b4d` (v2.33.100, !2356): populate `input[name="selling_plan"]` của theme lúc cold load, để cả `.pdp__price` lẫn nút Add-to-Cart hiện giá đã giảm. Theme Sleepify tự render giá qua `window.renderVariables()`; Joy set default-plan trước khi input tồn tại → theme render giá base (~14% cold load, repro thị trường Spain). Derive `sellingPlanId` từ option active trong widget, poll bounded ~10s, re-apply chỉ khi mismatch. Playwright 0/23 lỗi với fix. → Supersede cách MutationObserver đã revert (xem Reverted).
- **Bird Delivery Location Name** — 2 phần landed:
  - `dc75c2d19` (v2.33.97/98, !2352): thêm `Delivery Location Name` vào contract custom attributes; đăng ký key trong `BIRD_ATTRIBUTE_KEYS` để giữ qua renewal (carry-forward, không recompute theo ngày).
  - `3a6fb882e` (v2.33.99, !2355): self-healing backfill trong luồng calculate/charge khi field trống (fetch 1 lần/contract qua locationId, best-effort — Bird API fail thì không chặn billing).
- **Retention: dời Payment Recovery sang Retention hub** — `15167f3c5` (v2.33.96, !2353): chuyển Payment Recovery từ tab Settings sang page Retention (thêm route + skeleton + i18n 7 locale).

## Reverted

- **Price guard MutationObserver (`fix/overwrite-theme-price`)** — ship `0b65e710a` (v2.33.95, !2351) rồi REVERT sạch `f9b36b9c9` (!2354, revert commit `94e583e6a`; xóa 141 dòng `PriceHelper.js` + `SubscriptionBlock.js`). Lý do: cách này canh các container giá do Joy ghi, KHÔNG cover nút ATC do theme render của Cellexia → thay bằng fix populate `selling_plan` input (v2.33.100). Bài học: cùng "giá theme đè" nhưng điểm ghi khác nhau (Joy-written container vs theme-rendered button) cần cách khác nhau.

## Deploy notes

- **`[deploy-all]`** trên `cc5fd1ba2` (Onboarding V5) → buộc full CI deploy.
- **Version bumps** dồn trong 1 ngày: v2.33.94 → v2.33.100 (7 tag).
- **Revert** giá ATC (`f9b36b9c9` / `225c73cf5` / `ddf08ac0a`) — deploy-relevant, xem mục Reverted.
- Không có migration file mới landed hôm nay.
- **WIP chưa merge (theo dõi, KHÔNG shipped):**
  - tsTool DFY API — nhánh `feat/tstool-dfy-api` (`59ad5f1c6`+, HEAD). Chi tiết ở [[digest-subscriptions-2026-07-17]].
  - custom-widget v2 editor — nhánh `feature/custom-widget-editor` (inspector/palette/hotkeys/template lib). Tiếp nối Widget V4 ở [[subscription-digest-2026-07-16]].
  - discovery-product multi-currency + editor UX — `f46f530fc` (nhánh `feat/discovery-product`, freeze presentment-price lúc contract-create chống charge sai foreign currency).

## Liên quan
- [[subscriptions]] · [[subscriptions-debug-runbook]] · [[subscription-shipped-2026-07-16]] · [[subscription-digest-2026-07-16]] · [[digest-subscriptions-2026-07-17]]
