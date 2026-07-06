---
type: resource
title: Monorepo với Yarn workspaces
tags: [monorepo, yarn, tooling, pattern]
created: 2026-07-06
updated: 2026-07-06
---

# Monorepo với Yarn workspaces

Cấu trúc repo dùng chung ở nhiều app AVADA (yarn 4 workspaces).

## Layout điển hình (app Shopify)

- `packages/assets` — frontend admin (React + Vite + Polaris).
- `packages/functions` — backend (Koa + Firebase Functions), theo
  [[controller-service-repository]].
- `packages/scripttag` — widget storefront (Preact + Webpack).
- `packages/e2e` — test đầu-cuối.

## Lưu ý

- Backend build Babel: `src → lib` (một số repo cấm TS, chỉ `.js`).
- Shared helper nằm ở package dùng chung → sửa phải "ask first" vì ảnh hưởng rộng.
- Ví dụ khác: [[crm]], [[customer-manager-mono]] cũng là monorepo workspaces.

## Liên quan
- [[controller-service-repository]] · [[shopify-app-dev]]
- [[subscriptions]] · [[joy]]
