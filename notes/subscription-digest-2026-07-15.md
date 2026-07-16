---
type: note
title: Subscriptions digest 2026-07-15 — BigQuery stored-procedure prune + widget requiresSellingPlan
summary: Tối ưu stored-procedure BigQuery (partition-prune + verify equivalence), logic report legacy pricing v3, gotcha widget requires_selling_plan/default-option, CSS theme ebay-bootstrap đè select.
tags: [subscription, shopify, bigquery, billing, performance, debug]
created: 2026-07-15
source: project "subscriptions" session history
---

# Digest Joy Subscription — 2026-07-15

Chỉ ghi phần **mới** so với [[subscription-digest-2026-07-14]] và các digest trước.
Bug race-condition sync auto-swap lúc contract-create (gate theo trigger=create) đã có ở 07-14 → không lặp.

## Decisions

- **BigQuery cost: fix stored-procedure thay vì rewrite caller.** Thủ phạm ~$85/ngày ("regex fail / unknown, PROC/DECLARE") là procedure `firestore_sync.get_subscription_logs` (caller `contractLogController.js`). Chọn **option A** (sửa procedure để prune partition), apply prod + drop procedure tạm `get_subscription_logs_v2`. Option B (rewrite caller) hoãn.
  - **Why:** caller luôn truyền `shopId` + `startDate/endDate` (default 90d) nhưng procedure không đẩy filter vào CTE → full scan. Đẩy filter vào CTE prune được partition, rẻ hơn nhiều mà không đổi call-site.

## Bugs / Root cause

- **BQ scan phồng do CTE không prune.** Trong procedure, các CTE (`SubscriptionLogsData`,...) đặt `WHERE @target_shop` quá muộn / theo pattern OR nên không loại partition. **Fix:** đẩy `shopId` + date-range vào CTE lọc trực tiếp.
  - **Gotcha verify:** khi đổi, `QUALIFY ROW_NUMBER()` ở dedup CTE (`SubscribersLogsData`/`OrdersLogsData`) đổi semantic → v2 trả **nhiều row hơn ở 2/5 case**. Phải đối chiếu output trước khi apply.
  - **Technique kiểm chứng an toàn:** so `dry-run` (bytes/cost) + **đếm row khớp trên 5 contract mẫu** (v1 vs v2) TRƯỚC khi replace procedure prod. Đạt 5/5 match mới apply.
- **Widget: sản phẩm không `requiresSellingPlan` vẫn hiện option one-time.** Option "one-time" do **app AOV render**, không phải block của mình. Nếu variant có `requires_selling_plan: true` thì phải **ẩn one-time trong `doRender`** + **auto-select subscribe** (nếu không khách thấy radio trống → add-to-cart hụt).
  - **Gotcha:** auto-select phải **có gate** để không đè **default option merchant đã setup** (`if (requiresSellingPlan && !selected) force subscribe`).
- **CSS `<select>` widget bị theme đè.** Theme Horizon có `ebay-bootstrap.css` style `select` rất mạnh (`border`, `box-shadow inset`) đè CSS widget → "2 viền" + mũi tên native sát mép. **Fix:** `appearance:none` + arrow SVG custom + `padding-right`, và tăng đặc thù selector để thắng `ebay-bootstrap.css`.

## Techniques / Ops

- **Report legacy pricing v3 (MRR grandfathered):** filter đúng = shop **có `subscription_fee` status=paid trong tháng**, KHÔNG phải "có `recurChargeId`". Query bằng `serviceAccount.prod.json`, **loại store dev**. Fee tier trên GMV: Starter 1.5% · Advanced 1% · Enterprise 0.5%. (Số cụ thể ephemeral — logic filter mới là phần giữ lại.)
- **BQ attribution theo Service Account (refine [[subscription-digest-2026-07-10]]):** job kiểu `subscriptionPlans_latest` đến từ SA `avada-subscription-app@appspot.gserviceaccount.com` (không phải code trực tiếp gọi bảng). Khi soi cost phải quy về SA, đừng gán nhầm cho query trong code app. `subscriptionPlanBQService.js` build IN-list `productIds` cũng là nguồn scan.

## Liên kết

- [[subscription-digest-2026-07-14]] · [[subscription-digest-2026-07-13]] · [[subscription-digest-2026-07-10]] (BQ attribution)
- [[subscriptions-debug-runbook]] · [[caching-layers]]
- [[subscription-installment-horizon-digest]] (Horizon theme block gotchas)
