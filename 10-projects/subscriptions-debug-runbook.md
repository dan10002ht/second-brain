---
type: note
title: Subscriptions — Debug & Ops Runbook
tags: [shopify, subscription, debug, bigquery, firestore, redis, runbook]
created: 2026-07-07
updated: 2026-07-07
source: [[subscriptions]]
---

# Joy Subscription — Debug & Ops Runbook

> Cách điều tra bug trên [[subscriptions]] bằng data thật. Rút từ 46 session + mô tả trực tiếp của dantt (2026-07-07).
> Chỗ "⚠️ chưa xác minh" = chưa thấy chi tiết trong session, cần confirm khi dùng.

## 🔴 Rule an toàn (số 1)

- **Read-only tự do** để điều tra: query Firestore / BigQuery / Shopify đọc thoải mái.
- **XOÁ / SỬA data prod: BẮT BUỘC confirm với dantt trước.** Không delete/update/drop khi chưa được phép.
- Thao tác tốn cost hoặc ghi (publish package, DDL, BQ CALL nặng): **dry-run trước**, báo cost ước tính, rồi mới apply.

## 1. Query data prod (Firestore)

- **Project id**: prod = `avada-subscription-app` · staging = `ag-subscriptions-staging-4`.
- Cách: viết **Node script ad-hoc** dùng `serviceAccount.prod.json` query Firestore.
- ⚠️ Gotcha lặp: `serviceAccount.prod.json` hay **thiếu permission / bị restrict** → không access được prod DB. Fallback: debug bằng code + unit test (vd `frequency.test.js`) thay vì đụng prod.
- Multi-tenant: mọi query filter `shopId`.

## 2. BigQuery (đắt nếu sai — đọc kỹ)

- **Dataset**: `firestore_sync`. Bảng: `subscriptionContracts_changelog`, `subscriptionProducts_latest` / `subscriptionProducts_partitioned`, `orders.upcoming_orders`.
- **Thủ phạm cost**: stored proc `firestore_sync.get_subscription_logs` scan **~26.85 GB/call (~$0.13)**, 1 CALL spawn ~6 child query.
- **Prod** bảng **partition theo `timestamp` (DAY) + clustered**; **staging KHÔNG có** → khi mirror: backup → `DROP + CREATE` (BQ không cho `CREATE OR REPLACE` đổi partition spec) → verify `diff=0`.
- **Query đúng để pruning hoạt động**:
  - Filter theo cột partition `timestamp`, **siết date range mặc định 90 → 7 ngày**.
  - ⚠️ **View có `ORDER BY` chặn partition pruning** → query thẳng base table, đừng qua view.
  - Hiệu quả pruning quan sát được: no-filter 962 MB → 90d 249 MB → 7d thấp hơn nữa.
- Thêm cluster: `ALTER TABLE ... SET OPTIONS (clustering_fields=...)` — chỉ DDL, không deploy code.
- Doc chi tiết: `docs/bigquery/optimize-get-subscription-logs.md` (trong repo subscriptions).

## 3. Shopify data

- **REST API v2 nội bộ**: `/rest_api/v2/customers?hasCount=false` — phân trang cursor `after=<lastId>`, filter `created_at_min=<ISO8601>`. Storefront: `/storefront-api/v1/subscriptions/{id}`.
- **Token**: `fetchAccessToken` đổi `code→token`; `getValidAccessToken` (avada-core alpha.17) đọc token từ **session** + refresh qua `refreshAccessToken`; hỗ trợ **offline expiring access token**.
- **GraphQL Admin API** dùng khi cần edit order (`orderEditBegin`). Storefront dùng **Customer Account API OAuth**.
- Nguyên tắc: **KHÔNG lấy admin access token của khách** để đọc catalog — sợ cạn bucket. Dùng Storefront/native API cho get-products.

## 4. Caching (Redis / Memorystore)

- Helper: `kvCache` + `redisClient` (`rGet`/`rSet` **resilient** — Redis down → null/no-op, không throw).
- `cacheRepository` cũ cache vào Firestore collection `caches` → vẫn tốn read, **không dùng cho hot path**.
- `shopCache`/`setShopCache` lưu JSON shop (gồm token đã giải mã) → token **mã hoá at-rest trong Redis**.
- Key pattern ví dụ: `markets:currency-map:<shopId>`. TTL: ⚠️ có TTL nhưng giá trị cụ thể chưa xác minh.
- **Đọc Redis prod**: qua Cloud Shell — `gcloud compute ssh redis-check-tmp --zone=us-central1-a --tunnel-through-iap` (tạo GCE tạm rồi xoá sau).

## 5. Chống race condition

- **Cơ chế chốt hiện tại**: dedup atomic bằng `doc(id).create()` (throw nếu đã tồn tại) thay vì read-then-write. Áp ở `verifyHook.js` (HMAC verify TRƯỚC I/O rồi dedup) và `webhookLogsRepository.js`.
- **Bug kinh điển**: race `subscriptionContractCreate` ↔ `subscriptionContractUpdate` khi **swap variant** — update bắn thêm & sync trước, create sync sau nhưng mang **data trước khi swap** → hiển thị/charge sai sp. Biểu hiện: sp chỉ swap đúng khi **billing attempt / charge**. (Vụ đang debug — xem [[2026-07-07]].)
- ⚠️ Redis lock (SETNX/lease) **được bàn nhưng chưa chốt chi tiết** trong session — mới dừng ở atomic `create()` cấp Firestore + giữ `randomId`.

## Liên quan
- [[subscriptions]] · [[joy-subscription-artifacts]] · [[firestore-multitenant]]
