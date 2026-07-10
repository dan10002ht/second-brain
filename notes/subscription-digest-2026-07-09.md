---
type: note
title: Digest Joy Subscription 2026-07-09 — MRR bug, best-seller API, CI selective-deploy, workflow orchestration
summary: Các learning MỚI so với digest 07-08 — bug MRR hardcode v5, sự thật best-seller API Shopify, bẫy selective-deploy CI, bẫy dedup BigQuery, và cách chạy multi-agent workflow trong repo.
tags: [shopify, subscription, billing, debug, tooling]
created: 2026-07-09
updated: 2026-07-09
source: subscriptions (session history — chưa xác minh hết chi tiết)
---

# Digest — Joy Subscription (2026-07-09)

> CHỈ chứa phần MỚI so với [[subscription-installment-horizon-digest]] (07-08),
> [[subscriptions-debug-runbook]] và [[2026-07-08-installment-mode-design]].
> "chưa xác minh" = chưa confirm hết chi tiết trong session. Đây là proposal chờ brain-learn duyệt.

## Feedback (cách làm việc)

- **Đừng chỉ sửa đúng chỗ được chỉ — audit toàn bộ chỗ tương tự.** Khi user chỉ 1 ví dụ sai (vd 1 card của widget), phải rà tất cả card/item khác, không sửa mỗi chỗ được point. (Khớp memory [[feedback-follow-conventions]].)
- **Research cấu trúc file trước khi generate, đừng làm bừa.** Agent generate block Liquid mà không đọc file Horizon thật (`buy-buttons.liquid`, `add-to-cart.liquid`) → sai structure, bị Shopify reject. Copy CSS/markup gốc từ mockup thay vì áng chừng.
- **Tạo nhánh TRƯỚC khi workflow ghi file** — vài lần workflow sửa thẳng trên `master`; phải nhớ branch sớm (khớp [[feedback-git-branch-discipline]]).

## Decisions

- **Least-privilege SA cho AI-agent debug**: tạo SA `ai-agent-debug@...` gán ~7-8 predefined role read-only (view Firestore + BigQuery data, đọc log, xem BQ job history) — đủ cho agent tìm bug mà không ghi được. Predefined role, gán ở project level.
- **Server-to-server integrate API** (`GET /integrate/customer/subscription-summary`): auth bằng API key + JWT HS256 ký bằng secret; `shopifyDomain` + `customerId/email` nằm TRONG token đã ký → **chống IDOR/cross-shop** (không truyền id qua URL). Set `expiresIn ≤ 5m`. `activeCount` cache 5 phút/customer.

## Bugs (root cause)

- **MRR/afterCharge báo sai giá cho legacy shop**: `planPriceOf(planId, interval)` **hardcode chỉ tra `v5Plans`** → mọi shop bị tính theo giá v5 ($49) kể cả legacy Starter ($29). Fix: đổi signature nhận `shop`, resolve qua helper có sẵn `getShopPlanPrice(shop)` (`plans.js:1032`, đã xử lý version + customPricing + interval) thay vì tự viết. Bài học: tìm helper resolve đúng trước khi tự code.
- **Bẫy dedup khi refactor stored-proc BigQuery**: khi tối ưu `get_subscription_logs`, đổi CTE `QUALIFY ROW_NUMBER()` làm **semantic change** → v2 ra nhiều row hơn v1 (2/5 test case lệch). Luôn diff output v1↔v2 trên nhiều contract THẬT trước khi apply prod.
- **`apiHookV2` OOM + throttling** khi cost spike — memory exceeded liên tục vài lần/ngày; check memory %peak/avg 30 ngày khi cost cao.

## Techniques

- **Bẫy selective-deploy CI (quan trọng)**: pipeline **xanh (pass) nhưng KHÔNG deploy functions** khi diff không đụng file functions nào (`selective-deploy.sh`). Fix: thêm `[deploy-functions]` vào commit title → `FORCE_ALL=true` → deploy tất cả. Triệu chứng: UI/toggle hiện (assets đã deploy) nhưng backend case không chạy, field ghi `undefined` trên shop doc. 4 file CI staging chỉ khác 4 thứ "danh tính", logic giống nhau.
- **Shopify best-seller / most-sold API** (đã verify docs 2026-04):
  - Admin API top-level `{ products }` **KHÔNG có** sort key `BEST_SELLING`; chỉ dùng được qua **collection query**.
  - **Storefront API** top-level `products` **CÓ** `BEST_SELLING` (cần scope `unauthenticated_read_*`, đã có sẵn trong `shopify.app.toml`).
  - "Bán nhiều nhất theo số lượng/doanh thu thật" → **ShopifyQL** `shopifyqlQuery` (Analytics), khác `BEST_SELLING`.
- **Report MRR pricing-version từ prod**: lọc shop có `subscription_fee` status=`paid` trong tháng (KHÔNG phải "có recurChargeId"); **loại internal/dev shop**: email `@avada.io`/`@avadagroup.com`/`@easycommerceapps.com` + domain chứa `staging`/`ngocvtb-subs`/`hoang-subscription`/`joy-sub`.
- **Multi-agent workflow trong repo** (pattern `thorough.js`: spec → decompose → produce→verify (reviewer đối kháng) → gate → completeness-loop → report; fan-out mỗi item 1 agent):
  - **Effort-tier theo phase**: hạ effort cho phase cơ học, giữ cao cho verify/gate — tiết kiệm token.
  - **rtk + Serena chỉ tối ưu leaf ops (đọc/tìm)**, KHÔNG giảm phần tốn token nhất (planning/verify dài). Đừng kỳ vọng chúng cứu token cho session heavy-reasoning.
  - **Cấm eslint toàn package trong workflow** — `eslint-fix` từng làm bẩn 70+ file không liên quan → gate báo fail giả. Đặt gate **jest-only**, lint chỉ file đã sửa.
  - Verify agent có THỰC SỰ dùng Serena (grep transcript `activate_project`/`find_symbol`) — bake instruction vào prompt chưa đảm bảo agent gọi.
- **Debug Horizon block khi render rỗng**: thêm debug panel dump shape metafield ra màn hình (nhớ giữ panel hiện cả khi guard fail), xoá sau. (Bổ sung cho [[subscription-installment-horizon-digest]].)

## Liên quan
- [[subscriptions]] · [[subscription-installment-horizon-digest]] · [[subscriptions-debug-runbook]] · [[2026-07-08-installment-mode-design]] · [[subscription-work-style]] · [[app-development]] · [[firestore-multitenant]]
