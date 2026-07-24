---
type: note
title: Shipped Joy Subscription 2026-07-23 — 2 fix security (IDOR/open-redirect [deploy-all], discount function không tin client attribute), one-time bundle price merchant-set multi-currency, onboarding-v5 expert questions
summary: Commit landed 07-23 (v2.34.22→26): vá IDOR contract + open-redirect returnUrl [deploy-all], chặn discount function tin `_joy_installment_discount` client-set, one-time bundle price về 1 field merchant-set (multi-currency, hết stale) rồi fix tiếp giá add-on theo variant; WIP lớn: Win Back flow builder [deploy-functions] + Grow card/Help center onboarding-v5.
tags: [subscription, shopify, billing, auth]
created: 2026-07-24
source: repo "subscriptions" — git log (hash đã verify)
---

# Shipped — Joy Subscription, commit landed 2026-07-23

Range tag: **v2.34.22 → v2.34.26**. Phần *bài học* của những ngày này nằm ở
[[digest-subscriptions-2026-07-22]] và [[shipped-subscriptions-2026-07-23]] — ở đây chỉ ghi *cái gì đã landed*.

## Shipped (merged master)

- **Security: IDOR contract lookup + open-redirect returnUrl** — `e51ee740c` (tag `v2.34.26`, MR !2389), source `cff4f63a6`.
  - `subscriptionContractRepository.getContractDoc` verify `doc.shopId` ở nhánh tra Firestore-id trực tiếp → id chéo shop trả `null`.
  - `customerAccountAuthController.handleCallback` tự chọn **một** returnUrl an toàn phía server cho mọi redirect, không tin host client gửi lên (rò authToken → chiếm tài khoản). Helper mới `helpers/customerAuth/returnUrl.js` + unit test, xử lý shop đã đổi domain qua myshopify 301.
- **Security: discount function không được tin attribute client-set** — `e1a386e39` (tag `v2.34.24`, MR !2386), source `3749d6e5c`.
  Bỏ phụ thuộc `_joy_installment_discount` do client set trong `defer-last-discount` (`cart_lines_discounts_generate_run` + `helpers/eligibility.js`), viết lại test eligibility. Nối tiếp hướng "freeze discount vào line attribute" ở [[digest-subscriptions-2026-07-21]] — nay siết lại phía Shopify Function.
- **One-time bundle price = 1 field merchant-set (multi-currency, không stale)** — `c442e508a` (tag `v2.34.23`, MR !2385), source `9f0d05215`.
  Đụng `cart-transform-extension/services/onetimeExpand.js` + test, `fixedBundleService`, `OneTimePurchaseCard`, `installment-widget.liquid`. Tiếp nối one-time cart-transform expand ở [[shipped-subscriptions-2026-07-23]].
- **Fix tiếp giá one-time: lấy giá variant live + add-on price nhập tay đúng theo variant + prefix ký hiệu tiền tệ** — `c722bb824` (tag `v2.34.25`, MR !2387), source `402991c79`. Cùng vùng file với `v2.34.23` → đọc 2 commit này như một cặp.
- **Onboarding V5: dời expert questions vào Step 1, ghi câu trả lời sang BigQuery** — `c0ef549f4` (tag `v2.34.22`, MR !2371). Tiếp mạch Onboarding V5 Concierge ở [[shipped-subscriptions-2026-07-18]].

## Reverted

_Không có revert trong khoảng này._

## Deploy notes

- **`[deploy-all]`**: `e51ee740c` (v2.34.26), `c442e508a` (v2.34.23, kèm `[deploy-extensions]`), `c722bb824` (v2.34.25, kèm `[deploy-extensions]`) → 3 lần deploy full trong một ngày; cả 3 đều đụng extension/cart-transform nên **không** chọn selective được (bẫy đã ghi ở [[subscription-digest-2026-07-09]]).
- **`[deploy-functions]`**: `740017597` "Add win back flow" trên `origin/feat/adama-add-win-back-flow` — **chưa merge master**.
- **Version bump**: v2.34.22 → v2.34.26 (5 tag / 1 ngày).
- **Migration/infra cần chú ý khi Win Back merge**: `firestore.indexes.json` +223 dòng (index mới phải deploy), pubsub topic mới (`pubSubTopics.js` + `winBackTriggerHandler`), cron `winBackResumeService`, `cacheTypes` mới, `yarn.lock` đổi lớn (Tiptap editor, React Flow).

## WIP (chưa merge — theo dõi)

- **Win Back flow** `740017597` — 252 file, ~28.7k dòng: flow builder (canvas/node/panel), `winBackFlowService` + node executors (email/tag/wait), analytics/click-tracking/incentive, seed service, 7 locale × ~691 dòng, ~20 file test. Đây là feature lớn nhất đang chờ.
- **Onboarding V5 dashboard** — `6b3f888a0` (floating "Grow your subscriptions" card, gate: served market + ≥500 order/30 ngày, Dev Zone `forceBookCall` override), `7bfc043ba` (Help center dạng row list + tách `useBookCallEligible`, session-cache orders-count để Grow card và Help center dùng chung 1 call Shopify), `7a212d559` + `728534657` (thu gọn/canh lề card).
- **Fixed bundle: banner thiếu subscription plan** `c84a892a7` (SB-14564, `[skip-release]`) — bundle tạo product cha nên bán one-time được ngay, nhưng phải có plan trỏ vào mới bán subscription; banner tone `info`, dismiss lưu Firestore theo bundle; nút "Add subscription plan" phân nhánh theo `shop.newPlanVersion`.
- **`3cb5b2f68`** — bỏ property `Contents` của bundle cho mọi installment bundle (`DisplayManager.js`, branch `fix/installment-hide-contents`).

## Bỏ qua (noise)

`a42791e59` update translation (7 file locale, +.gitignore) · `cf86e663d`/`740358e7c` stash · `d7c5ffda3`/`aa37704b2` merge master vào branch.

## Liên kết gợi ý

[[subscriptions]] · [[shipped-subscriptions-2026-07-23]] · [[digest-subscriptions-2026-07-22]] · [[digest-subscriptions-2026-07-21]] · [[shipped-subscriptions-2026-07-18]] · [[subscriptions-debug-runbook]] · [[shopify-app-dev]]
