---
type: project
title: Avada Backups & Restore (Shopify app)
summary: App Shopify sao lưu & khôi phục dữ liệu store (Node.js + Firebase).
tags: [shopify, nodejs, firebase, backup]
created: 2026-07-06
updated: 2026-07-06
status: active
repo: ~/projects/backup
---

# Avada Backups & Restore

## Mục đích
Ứng dụng Shopify (embedded) của Avada giúp merchant **sao lưu và khôi phục** dữ liệu store (products, collections, themes, settings...). Tên app: "Avada Backups & Restore", chạy tại `avada-backup.web.app/embed`.

## Tech stack
- **Framework**: `@avada/core` (framework Shopify app của Avada).
- **Backend**: Node.js, Koa.js, Firebase Functions v2.
- **DB**: Firestore (auth/core) + PostgreSQL qua Drizzle ORM (Cloud SQL) cho app data; Docker khi chạy local.
- **Frontend**: React 18 + Shopify Polaris v13 + Vite. Storefront widget dùng Preact (Rspack).
- **APIs**: Shopify GraphQL Admin API + REST API.
- **Background jobs**: Cloud Tasks, Pub/Sub, Cloud Scheduler.
- **Test**: Vitest, React Testing Library, Playwright (e2e).
- Monorepo yarn workspaces: `packages/functions` (backend) + `packages/assets` (frontend), thêm `extensions/`.

## Trạng thái
Đang phát triển active. Commit gần đây: tích hợp firestore-bigquery-changelog 0.4.4 (sync shops/subscriptions), fix normalize embed paths (404 back-navigation), auto-refresh Shopify offline access token, dọn translations/audit logs.

## Điểm đáng nhớ
- Kiến trúc backend phân lớp rõ: `handlers` (entry) → `controllers` → `routes` → `middleware` → `services` → `repositories`. Mỗi repo chọn Firestore HOẶC PostgreSQL.
- Deploy qua Firebase (`yarn deploy`); dev qua `shopify app dev`. CI trên GitLab (`.gitlab-ci.yml`).
- `readme.md` chỉ là template GitLab mặc định — thông tin thật nằm ở `CLAUDE.md` và `TECHNICAL_ARCHITECTURE_REPORT.md` trong repo.

## Liên quan
- [[app-development]]
- [[firestore-multitenant]]
