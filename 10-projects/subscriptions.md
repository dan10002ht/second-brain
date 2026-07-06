---
type: project
title: Joy Subscription (AVADA Shopify App)
tags: [shopify, subscription, nodejs, firebase, react, preact, monorepo]
created: 2026-07-06
updated: 2026-07-06
status: active
repo: ~/projects/subscriptions
---

# Joy Subscription (AVADA Shopify App)

## Mục đích

App Shopify (do AVADA phát triển, tên nội bộ `@avada/app`, brand "Joy Subscription") giúp merchant bán hàng theo **gói đăng ký định kỳ** (recurring subscriptions). Merchant tạo selling plan, bundle, quản lý subscription contract; billing tự động; khách hàng tự quản lý gói qua customer portal. Có cả các tính năng nâng cao: bundle cố định/động, box subscription, installment (trả góp), auto-swap sản phẩm theo chu kỳ, collection swap, reward/loyalty, cancellation flow, multi-currency (Shopify Markets).

## Tech stack

- **Monorepo** yarn workspaces (yarn 4): `packages/assets`, `packages/functions`, `packages/scripttag`, `packages/e2e`.
- **Backend**: Node.js 20, Firebase Functions, Koa.js, Babel (src → lib). Kiến trúc phân tầng Controller → Service → Repository.
- **Frontend admin**: React 18 + Vite 5 + Shopify Polaris 12 + App Bridge.
- **Storefront widget**: Preact (alias thành React) + Webpack 5 — nhẹ, nhúng vào theme.
- **Data**: Firestore (chính, multi-tenant theo `shopId`), BigQuery (analytics), Redis (cache).
- **Queue/async**: Google Cloud Tasks + Pub/Sub (background handlers).
- **Shopify**: nhiều extensions (Functions, Flow triggers, Customer Account UI, POS, theme app extension, post-purchase upsell, cart-transform, product-discount).
- **Ngôn ngữ**: chỉ JavaScript `.js` (KHÔNG TypeScript, KHÔNG `.jsx`). Deploy qua Firebase + Shopify CLI. CI trên GitLab (repo gốc gitlab.com/avada/subscriptions).

## Kiến trúc / luồng chính (deep)

### Backend layering
- **Controllers** (`packages/functions/src/controllers/`): thin. Nhóm theo audience: `clientApi/` (admin), `storefrontApi/`, `shopifyApi/` (webhook), `publicApi/`, `apiHookV1/`. File lớn nhất là `subscriptionContractController.js` (~41KB) và `shopifyController.js`. Luôn dùng `getCurrentShop(ctx)`, body ở `ctx.req.body.data`, response `{ success, data, message }`.
- **Services** (`packages/functions/src/services/`): chứa toàn bộ business logic. Trung tâm là `services/subscription/` với `subscriptionService.js` (~69KB — lõi lớn nhất repo) và `contractService.js` (~29KB). Nhiều bulk-action service riêng (bulkSwapProducts, bulkChangeStatus, bulkUpdateNextOrderDate...).
- **Repositories** (`packages/functions/src/repositories/`): 1 collection = 1 repo, luôn validate `shopId`. Nặng nhất: `orderRepository.js`, `subscriptionContractRepository.js` (~37KB), `subscriptionProductsRepository.js`.
- **Routes**: `routes/api.js` (admin, ~21KB), `clientApi.js`, `storefrontApi/`, `shopifyApi.js`, `integrateApi.js`, `publicApi.js`.

### Luồng billing / lifecycle
- **Webhook Shopify** → `services/webhook/`: `subscriptionContractCreateService.js` (~50KB, rất lớn — tạo contract từ order), `subscriptionContractUpdateService.js`, `billingAttemptWebhookService.js` (xử lý billing success/failure).
- **Cron / pipeline** (`services/cron/`): `runSubscriptionPipeline.js`, `automaticBillingAttemptService.js` (tạo billing attempt định kỳ), `autoResumeExpiredPause.js`, `dailySyncSubscriptionFees.js`, `updateSubscriptionPlansMetafields.js`, `renewExchangeRates.js`.
- **Async xử lý nặng** qua Pub/Sub (`handlers/pubsub/`): `backgroundHandler.js` (~34KB), `bulkActionHandler.js`, `backgroundBulkOperationHandler.js`, `productWebhookHandler.js`. Firestore trigger `onWrittenSubscriptionContract.js`.

### Frontend admin
`packages/assets/src/`: chuẩn PARA hooks — data fetching qua `useFetchApi`, `useCreateApi`, `useEditApi`. Cấu trúc `pages/`, `components/`, `hooks/`, `contexts/`, `reducers/`. Polaris icons dùng format v9 (không suffix Minor/Major).

### Storefront (scripttag)
`packages/scripttag/src/`: các widget Preact nhúng theme — `subscription/`, `subscriptionBox/`, `customerPortal/`, `fixedBundleBox/`, `codForm/`. Đây là phần khách hàng cuối tương tác.

### Extensions Shopify
~25 extension trong `extensions/`: đầy đủ bộ Flow triggers (subscription created/cancelled/paused/resumed, billing success/failure, next order date changed...), customer-account-ui các loại, cart-transform, product-discount, POS, theme-app-extension, post-purchase-upsell.

## Quyết định & gotcha đáng nhớ

- **Multi-tenant nghiêm ngặt**: MỌI query backend phải validate `shopId`. Đây là rule số 1, bỏ qua = rò rỉ dữ liệu chéo shop.
- **Chỉ `.js`**: cấm tạo `.jsx`/`.ts`. Business logic KHÔNG được để trong controller.
- **"Ask first"** trước khi: đổi schema DB, thêm collection Firestore, thêm webhook, sửa shared helper, đổi kiến trúc.
- **Đa môi trường staging**: nhiều file `shopify.app.*.toml` (joy-subscription-staging 2/3/4, dantt-subscription-dev...) → cẩn thận link đúng app config trước khi dev/deploy.
- **Firebase debug log khổng lồ** (`firebase-debug.log` ~3.8MB) và `firestore.indexes.json` ~153KB — index Firestore rất nhiều, thêm query mới thường cần thêm composite index.
- **App pricing**: log riêng ở `APP_PRICING_LOG.md`; feature-gating qua `limitFeatureService.js` + `resetFeatureMonthly.js` cron.
- **CSS**: khi sửa style phải áp cho TẤT CẢ element liên quan (badge, border, radio...), dùng CSS variables thay hardcode.
- **Bug prevention codebase**: kiểm tra state reset khi đóng/mở modal; validate trùng key trong JSON config (vd PricingTableComparison.json).
- **Công việc gần đây (07/2026)**: tập trung mảng installment/bundle trả góp (defer-last, partial payment), collection-swap (fix currency/pricing/multi-location save), migrate storefront sang Horizon theme block, bump extension api_version 2025-10.
- **API_DOCUMENTATION.md** (~27KB) là nguồn tra cứu endpoint đầy đủ (product/plan/bundle APIs...).

## Bài học

- App subscription "thật" phức tạp hơn nhiều so với demo: lõi nằm ở lifecycle contract + billing attempt + đồng bộ ngược Shopify, không phải ở UI.
- Layering Controller/Service/Repository giữ file service phình to (60-70KB) nhưng tách được rõ trách nhiệm; điểm đau là các "god service" như `subscriptionService.js`.
- Bulk operations tách thành nhiều service nhỏ + chạy qua Pub/Sub/Cloud Tasks để tránh timeout Firebase Functions.
- Multi-currency, multi-location, theme migration (Horizon) là nguồn bug dai dẳng nhất.

## Liên quan

- [[typescript-notes]] (đối chiếu — repo này cố tình KHÔNG dùng TS)
- [[app-development]] (Shopify)
- [[firestore-multitenant]]
- [[controller-service-repository]]
- [[joy]]
