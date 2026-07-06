---
type: area
title: Shopify app development (AVADA)
tags: [shopify, avada, career, area]
created: 2026-07-06
updated: 2026-07-06
---

# Shopify app development (AVADA)

Trách nhiệm **dài hạn, không có "xong"**: phát triển & bảo trì các app Shopify
embedded tại AVADA. Đây là mảng công việc chính hằng ngày (10+ app), nền tảng kỹ
thuật lặp lại xuyên suốt các project.

## Stack lõi (dùng chung hầu hết app)

- **Backend**: Node.js + Koa + Firebase Functions, kiến trúc [[controller-service-repository]].
- **Data**: Firestore multi-tenant theo `shopId` ([[firestore-multitenant]]) + BigQuery (analytics) + Redis (cache).
- **Frontend admin**: React + Shopify Polaris + App Bridge.
- **Storefront**: Preact widget nhúng theme.
- **Cấu trúc repo**: [[monorepo-yarn-workspaces]].
- **Nền tảng**: [[shopify-app-development]] (extensions, billing, embedded).
- CI trên GitLab (gitlab.com/avada/*).

## Các app đang phụ trách

- [[subscriptions]] — Joy Subscription (recurring billing) — phức tạp nhất.
- [[joy]] — Joy Loyalty & Rewards.
- [[joy-subscription-artifacts]] — kho build/CDN của Joy Subscription.
- [[avada-core]] — thư viện lõi auth Shopify + Firebase (dùng chung).
- [[crm]] — marketing automation.
- [[backup]], [[pdf]], [[shipping-labels]], [[headless-demo]].

## Nguyên tắc/gotcha xuyên suốt

- **Multi-tenant nghiêm ngặt**: mọi query validate `shopId` — rule số 1.
- **"Ask first"** trước khi đổi schema DB, thêm collection/webhook, sửa shared helper.
- Nhiều môi trường staging (`shopify.app.*.toml`) — link đúng config trước khi deploy.
- Query mới thường cần thêm composite index Firestore.

## Liên quan
- [[dev-skills]]
- [[avada-core]]
