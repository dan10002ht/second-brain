---
type: project
title: avada-core
tags: [shopify, firebase, koa, typescript, auth, billing]
created: 2026-07-06
updated: 2026-07-06
status: active
repo: ~/projects/avada-core
---

# avada-core

## Mục đích
Thư viện lõi (`@avada/core`) cung cấp phần **xác thực (authorization) Shopify** dùng chung cho các Shopify App của Avada, tích hợp với **Firebase**. Đóng gói OAuth Shopify, quản lý session/token, billing (charge/subscription), webhook và các middleware bảo mật để các app không phải viết lại.

## Tech stack
- **TypeScript** (build bằng `tsc`, xuất ra `build/`), publish qua Lerna.
- **Koa** + `koa-router` làm web layer; `@shopify/koa-shopify-webhooks`, `shopify-api-node`, `@avada/shopify-api`.
- **Firebase Admin** + `@google-cloud/firestore` (peer dep) làm backend lưu trữ/token.
- Tiện ích bảo mật: `crypto-js`, `safe-compare`, `xss`, `nonce`.
- Quản lý gói: `yarn@4`. Version hiện tại: `4.8.1-alpha.1`.

## Trạng thái
Active, đang phát triển (chuỗi bản `4.8.x-alpha`). Commit gần nhất mở rộng **custom pricing**, thêm endpoint `/link/:plan` và sửa lỗi lệch bản ghi charge. Có dấu vết refactor token verification và revert vài thay đổi `loginFieldMiddleware` — vùng auth/token đang được tinh chỉnh.

## Điểm đáng nhớ
- Kiến trúc chia lớp rõ: `controllers/` (auth, subscription, webhook, loyalty), `middleware/` (verifyRequest, verifyWebhook, validateHmac, CSP...), `repositories/` (shop, session, charge, discount trên Firestore), `services/`, `session/`.
- Nghiệp vụ **billing** là trọng tâm: `charge.ts`, `subscription.ts`, `usage.ts`, `discount.ts`, `SubscriptionBuilder.ts` + `subscriptionController` khá lớn.
- Git log cho thấy đang gỡ bỏ phụ thuộc `CHARGE_API` và middleware `userState` cũ — xu hướng gọn hoá tầng token/charge.

## Liên quan
- [[shopify-app-auth-flow]]
- [[firebase-firestore-patterns]]
