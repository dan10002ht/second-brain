---
type: project
title: Avada Shipping Labels
summary: App in nhãn vận chuyển cho Shopify (Firebase + React).
tags: [shopify, firebase, react, shipping]
created: 2026-07-06
updated: 2026-07-06
status: active
repo: ~/projects/shipping-labels
---

# Avada Shipping Labels

## Mục đích
Ứng dụng Shopify (thương hiệu AVADA) giúp merchant in nhãn vận chuyển (shipping labels) cho đơn hàng. Tích hợp trực tiếp vào Shopify Admin qua embedded app + order print action extension, hỗ trợ fulfillment và in nhãn hàng loạt.

## Tech stack
- **Backend:** Node.js (ES6 import/export), Firebase Functions (serverless), Firestore (NoSQL), Firebase Auth + Storage, GCP (BigQuery, PubSub, Cloud Tasks). Có thêm Postgres + Drizzle ORM (scripts `db:*`).
- **Frontend:** React (hooks/context), Shopify Polaris v12+, Vite, code-splitting, custom API hooks (`useFetchApi`, `useCreateApi`...).
- **Shopify:** Admin API, App Bridge, CLI 3.88, extensions (`order-print-action`, `theme-extension`).
- Monorepo yarn workspaces: `packages/*` (assets, functions) + `extensions/*`.
- Scopes: read/write orders, fulfillments, products, themes, customers.

## Trạng thái
Active. Commit gần đây: sync BigQuery changelog 0.4.4, fix bug print action, freeze-column bảng order.

## Điểm đáng nhớ
- App URL production: `avada-shipping-label.firebaseapp.com/embed` (embedded trong Shopify Admin).
- Deploy qua Firebase (`yarn deploy`); dev qua `shopify app dev`. Emulator dùng `firebase emulators:start`.
- Migration/i18n nhãn qua `update-label` (`autoTranslate.js`); có Chroma vector DB trong stack.
- Docs nội bộ: `docs/techstack.md`, `readme.md`, `changelog.md`.

## Liên quan
- [[app-development]]
- [[firestore-multitenant]]
