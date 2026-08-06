---
type: project
title: PDF Invoice for Shopify
summary: App tạo hóa đơn PDF cho Shopify (Node + Firebase + React); lưu ý có secrets hardcode trong RELEASE_NOTE.
tags: [shopify, firebase, nodejs, react, pdf, invoice]
created: 2026-07-06
updated: 2026-07-06
status: active
repo: ~/projects/pdf
---

# PDF Invoice for Shopify

## Mục đích
Shopify app tạo và quản lý hóa đơn PDF (invoice) cho merchant: in, tải, gửi email hóa đơn cho order và draft order. Sản phẩm của Avada (`@pdf-invoice/pdf-invoice`, v2.6.0).

## Tech stack
- **Backend**: Node.js 20 + Firebase (Cloud Functions, Firestore, PubSub, Hosting).
- **Frontend**: React + Shopify Polaris (package `assets`).
- **Nền tảng**: Shopify App (Shopify CLI, app extensions), framework nội bộ `@avada/shopify-app`.
- **Monorepo**: Yarn workspaces — `packages/*` (chính: `functions`, `assets`) + `extensions/*` (nhiều extension in/tải/gửi cho order & draft, POS, theme app, customer account UI).
- CI qua GitLab; dev local dùng Cloudflare Tunnel + Firebase emulators.

## Trạng thái
Active, đang phát triển. Commit gần đây tập trung vào i18n/dịch thuật (auto-translate label, template), fix billing/shipping address, SIRET/registeredNumber cho hóa đơn Pháp, BCC email.

## Điểm đáng nhớ
- **Thêm template mới**: đăng ký ở `packages/functions/src/config/themes.js` + thêm HTML/CSS vào `packages/functions/storage/themes/`.
- **Multi-staging**: `yarn use:staging1` / `use:staging2` để đổi env Firebase; dev cần `serviceAccount.json` xin từ team.
- Dùng Serena cho code intelligence (xem `CLAUDE.local.md`); cần Java 11+ cho PubSub emulator.
- Lưu ý bảo mật: `RELEASE_NOTE.md` có chứa secrets/API keys cũ hard-code (SendGrid, Google OAuth) — nên xoay vòng.

## Liên quan
- [[app-development]]
- [[firestore-multitenant]]
