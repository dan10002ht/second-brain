---
type: resource
title: Controller → Service → Repository layering
tags: [architecture, backend, pattern, nodejs]
created: 2026-07-06
updated: 2026-07-06
---

# Controller → Service → Repository layering

Kiến trúc backend chuẩn của các app AVADA (Koa + Firebase Functions).

## 3 tầng

- **Controller** — *thin*. Chỉ nhận request, gọi service, format response. KHÔNG
  chứa business logic. Nhóm theo audience: `clientApi/` (admin), `storefrontApi/`,
  `shopifyApi/` (webhook), `publicApi/`.
  - Convention: `getCurrentShop(ctx)`, body ở `ctx.req.body.data`, response
    `{ success, data, message }`.
- **Service** — toàn bộ **business logic**. Đây là nơi code thật sự sống.
- **Repository** — truy cập Firestore, 1 collection = 1 repo, luôn validate
  `shopId` ([[firestore-multitenant]]).

## Điểm đau (bài học thật)

- Service dễ phình thành "god service" (vd `subscriptionService.js` ~69KB trong
  [[subscriptions]]). → tách bulk-action thành nhiều service nhỏ.
- Việc nặng/bulk → chạy qua Pub/Sub + Cloud Tasks, không block request.

## Liên quan
- [[monorepo-yarn-workspaces]] · [[firestore-multitenant]] · [[shopify-app-dev]]
- [[subscriptions]] · [[joy]]
