---
type: project
title: Customer Manager Mono
tags: [monorepo, react, nodejs, postgresql, quan-ly-khach-hang]
created: 2026-07-06
updated: 2026-07-06
status: active
repo: ~/projects/customer-manager-mono
---

# Customer Manager Mono

## Mục đích
Ứng dụng quản lý khách hàng cho một cơ sở kinh doanh may đo / giao hàng. Quản lý khách hàng, thợ may (tailors), nhân công (workers), đơn hàng, giao hàng (online & offline), chi phí (expense) và doanh thu (revenue). Có tính năng gửi thông báo qua WhatsApp.

## Tech stack (monorepo)
Yarn workspaces, chạy song song bằng `concurrently` + `cross-env`. Hai package trong `packages/*`:

- **`@cm/be`** (backend): Express + PostgreSQL (`pg`, `pg-format`, `pg-pool`). Auth bằng JWT + bcryptjs. Tích hợp Firebase (admin) và Baileys/WhatsApp (`@whiskeysockets/baileys`) để gửi tin nhắn, tạo QR (`qrcode`). Build bằng Babel (không TypeScript), dev bằng nodemon + babel-node. Cấu trúc chuẩn: controllers / services / repositories / models / routes / middleware / commands / scripts.
- **`@cm/frontend`**: React 18 + Vite + Ant Design (antd) + SCSS. React Router v6, axios, react-quill (rich text), chart.js + react-chartjs-2 (biểu đồ), react-toastify, dayjs. Pages: Customer, Tailors, Workers, DeliversOnline, DeliversOffline, Expense, Revenue, Information, Login.

## Trạng thái
Đang active. Đã có: login feature, backup (shell script + setup), migrate data, cấu hình nginx để deploy. Git history chủ yếu là fix bug + tinh chỉnh (không có test — script test đều là placeholder).

## Điểm đáng nhớ
- **Không có test tự động** ở cả BE lẫn FE (đều là `echo "Error: no test specified"`). Chất lượng dựa vào fix bug thủ công.
- **BE dùng Babel thay vì TypeScript**, build ra `dist/`; setup DB qua script `setup-db` (`src/scripts/setupDatabase.js`).
- **Tích hợp WhatsApp qua Baileys** là điểm đặc biệt — có route `whatsappRoutes.js` riêng để gửi thông báo cho khách. Analytics có route riêng nhưng phần revenue/expense từng bị ẩn (commit "hide revenue" / "hide expense").

## Liên quan
- [[index]]
