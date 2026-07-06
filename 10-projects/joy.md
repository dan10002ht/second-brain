---
type: project
title: "Joy — Shopify Loyalty & Rewards App (AVADA)"
tags: [js, nodejs, react, shopify, firebase, subscription, loyalty, saas]
created: 2026-07-06
updated: 2026-07-06
status: active
repo: ~/projects/joy
---

# Joy — Shopify Loyalty & Rewards App

## Mục đích

Joy là một ứng dụng SaaS **loyalty program** cho Shopify do AVADA phát triển
(`@avada/joy`). Nó cung cấp toàn bộ chức năng chương trình khách hàng thân thiết:
tích/đổi điểm (points & rewards), hạng VIP (VIP tiers), giới thiệu bạn bè
(referrals), quà tặng sinh nhật, store credit, ưu đãi độc quyền (exclusive
access) và hàng loạt tích hợp bên thứ ba. Đây là nền tảng **multi-tenant** phục
vụ hàng nghìn merchant Shopify.

Mô hình kinh doanh là **subscription/SaaS**: merchant trả phí theo gói (plan)
qua Shopify Billing — xem phần billing bên dưới. Đây là lý do note nằm trong
mảng "subscription app".

## Tech stack

- **Backend**: Node.js trên Firebase Cloud Functions, Firestore (DB chính),
  BigQuery (analytics), PubSub, Cloud Tasks. Routing kiểu Express/Koa (`ctx`).
- **Frontend admin**: React 18 + Shopify Polaris v12+, Vite, Redux Saga.
- **Storefront**: `packages/scripttag/` — code inject vào storefront khách hàng
  (webpack build).
- **Shopify**: App Bridge, Admin GraphQL API, Functions API (discount
  functions), Extensions, Flow, POS.
- **Hạ tầng**: Firebase Hosting + GCP. Search: Typesense/Meilisearch. AI:
  OpenAI + Chroma vector DB.
- **Monorepo**: yarn workspaces (yarn 4), `packages/*` + `extensions/*`.
- **Version**: 1.185.0 (đã trưởng thành, nhiều iteration).

## Kiến trúc / luồng chính

Monorepo 3 khối chính:

- `packages/assets/` — React admin dashboard.
- `packages/functions/` — backend Cloud Functions (trái tim hệ thống).
- `packages/scripttag/` — widget hiển thị cho khách hàng cuối.
- `extensions/` — **60+ Shopify extensions** (checkout UI, customer account,
  POS, Flow triggers/actions, discount functions). Rất nhiều extension là
  các trigger nhắc lịch (vd `1-day-pre-tier-demotion-reminder`,
  `7-days-before-customer-s-birthday`, `30days-before-point-exp`).

Phân tầng backend (`packages/functions/src/`), tuân thủ nghiêm ngặt:

- `repositories/` — chỉ thao tác **một** Firestore collection (CRUD cơ bản).
- `services/` — business logic, gọi nhiều repository + tích hợp bên thứ ba
  (khối lớn nhất: `activitiesService.js`, `birthdayService.js`,
  `klaviyoService.js`, `afterChargeService.js`...).
- `controllers/` — HTTP handlers, dùng `getCurrentShop(ctx)` /
  `getCurrentShopData(ctx)`.
- `handlers/` — entry point Firebase function + routing (`handlers/api.js`,
  `apiV2.js`, `auth.js`, cùng `pubsub/`, `schedule/`, `tracking/`).
- `middleware/`, `presenters/`, `validations/`, `const/` (default settings,
  program definitions), `config/`.

Luồng đáng chú ý:

- **Xử lý bất đồng bộ**: PubSub + Cloud Tasks đẩy công việc nặng ra nền
  (`services/cloudTaskService.js`, `handlers/schedule/enqueueHandler.js`).
  Các job định kỳ ở `handlers/schedule/` (daily/hourly/frequent operations).
- **Billing/Subscription**: gói trả phí xử lý qua
  `services/chargeAnnualPlan/handleChargeAnnualPlan.js` và
  `services/afterChargeService.js`; state charge ở `const/chargePending.js`;
  script audit `scripts/billing/auditBigQuery.mjs`.
- **Reward engine**: activity → transaction → điểm. Xem
  `handlers/onCreateActivity.js`, `onCreateTransaction.js`,
  `onCreateCouponUsage.js`; program service ở `services/program/`
  (tier, custom program, voucher, refund, anti-cheat).
- **API v1 & v2**: có hai lớp API (`handlers/api.js` vs `apiV2.js`), specs ở
  `joy-api.yaml` (377KB) và `joy-api-v2.yaml`; docs REST v2 ở
  `docs/rest-api-v2.md`.

## Quyết định & gotcha

- **Response format bắt buộc**: mọi endpoint trả `{success, data, error}` —
  frontend phụ thuộc chặt vào cấu trúc này.
- **Firestore rules**: dùng `.update()` thay `.set()` để tránh ghi đè field;
  `limit(1)` khi check tồn tại; `docs.empty` thay vì `docs.size > 0`; đặt TTL
  cho collection lưu lượng cao (tối ưu chi phí Firestore là mối quan tâm lớn).
- **Firestore indexes khổng lồ**: `firestore.indexes.json` ~124KB, có tooling
  riêng `firestore:build` / `firestore:split` và tài liệu về
  index-merging/exemptions trong `docs/`.
- **Frontend**: chỉ dùng `.js` (không `.jsx`); loadable components phải nằm
  trong folder có `index.js` (không để top-level); dùng Polaris v12+ và Icons
  v9 (bỏ suffix Minor/Major); mọi page fetch data phải có skeleton loading.
- **i18n**: sửa `locale/input/*.json` rồi chạy `yarn update-label`
  (`scripts/autoTranslateV2.js`) để auto-translate.
- **Emulator ports cố định**: Functions 5011, Firestore 8090, PubSub 8095,
  Hosting 5010, UI 4012 (xem CLAUDE.md repo).
- **CI**: `.gitlab-ci.yml` khổng lồ (~272KB) được sinh tự động bởi
  `scripts/generateGitlabCI.js` — không sửa tay.
- **Git flow**: nhiều branch prefix `hotfix/`, `support/`, `feature/`,
  commit `[deploy-extensions]` / `[deploy-only]` điều khiển pipeline deploy.

## Bài học

- Extension nhiều (60+) và phần lớn là biến thể theo timing/segment → khi thêm
  tính năng mới thường phải nhân bản nhiều extension tương tự nhau (chi phí
  bảo trì cao, đây là bản chất mô hình Shopify Functions/Flow).
- Kiến trúc repository/service/controller rất kỷ luật giúp codebase lớn vẫn
  điều hướng được — quy tắc "repo = 1 collection" là chốt chặn quan trọng.
- Với app multi-tenant chạy trên Firebase, **tối ưu chi phí đọc/ghi Firestore
  và index** quan trọng ngang tính năng; nhiều doc trong `docs/` dành riêng
  cho performance/cost.

## Liên quan

- [[joy-subscription-artifacts]] — chi tiết billing/plan artifacts của Joy
- [[subscriptions]] — mô hình subscription/SaaS billing chung
- [[app-development]] — pattern app Shopify (extensions, Functions API)
- [[firestore-multitenant]] — tối ưu chi phí Firestore
