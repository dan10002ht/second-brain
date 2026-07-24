---
type: note
title: Digest avada-project 2026-07-23 — NODE_ENV=production làm chết next dev + setup Google OAuth localhost
summary: Đặt NODE_ENV=production trong .env làm next dev 404 mọi route (và cookie OAuth secure fail trên http); cùng cách wedged dev server giữ .next/dev/lock và bước cấu hình Google OAuth cho app nội bộ chạy local.
tags: [nextjs, auth, debug, tooling]
created: 2026-07-23
source: project "avada-project" — session history (mined 2026-07-23)
---

# Digest avada-project — 2026-07-23

App Next.js nội bộ (chat + Google OAuth, login bằng email `@avadagroup.com`), chạy local `bun dev`.

## Bugs (root cause)

- **`NODE_ENV=production` trong `.env` → `next dev` 404 TẤT CẢ route (kể cả `/`).** Triệu chứng đánh lừa: server sống, static (favicon) chạy, nhưng route trả 404 trong ~36ms = route manifest **không compile** (Next có cảnh báo "inconsistencies"). Hệ quả thứ 2: cookie OAuth state đặt `secure:true` → fail trên `http://localhost`. *Fix:* bỏ `NODE_ENV=production` khỏi `.env` cho môi trường dev.
- **Wedged dev server:** PID cũ không chết bằng kill thường, vẫn giữ lock `.next/dev/lock` → Next từ chối start server mới. Cần kill -9 + xoá lock; dấu hiệu là "404 trong vài chục ms, chỉ static chạy".

## Techniques

- **Login "Simple Password" khi `APP_ENV=development`** — app có sẵn đường bỏ qua Google hoàn toàn, cách nhanh nhất để chạy local mà không cần cấu hình OAuth.
- **Google OAuth cho email tổ chức:** OAuth consent screen chọn **Internal** (email `@avadagroup.com` thuộc Workspace tổ chức). Authorized JS origins = `http://localhost:3000`, redirect URI = `http://localhost:3000/...` (xoá placeholder `https://www.example.com`).
- Lỗi "Missing required parameter: client_id" = `GOOGLE_CLIENT_ID` trong `.env` đang **rỗng/placeholder** (`your-app.example.com`) → chưa cấu hình OAuth thật.

## Liên kết gợi ý

[[dev-skills]] · [[headless-demo]] (cùng stack Next.js) · [[shopify-app-dev]]
