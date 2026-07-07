---
type: project
title: joy-subscription-artifacts
summary: Kho artifact/CDN build storefront của Joy Subscription (webpack/vite).
tags: [subscription, shopify, cdn, artifacts, storefront, webpack, vite, avada]
created: 2026-07-06
updated: 2026-07-06
status: active
repo: ~/projects/joy-subscription-artifacts
---

# joy-subscription-artifacts

## Mục đích
Repo **kho artifact/CDN tĩnh** cho app **Joy Subscription** (Shopify subscription app của Avada). Nó KHÔNG chứa source code phát triển — chỉ chứa **các bản build đã compile** (JS/CSS đã minify + hash) được dùng để phục vụ cho storefront (script tag, theme extension) và app embed. Mỗi lần CI build front-end xong sẽ đẩy output vào đây; browser của khách hàng nạp asset trực tiếp từ repo/CDN này.

Nói cách khác: đây là "đích deploy" của phần front-end, không phải nơi viết logic.

## Tech stack
- **Bundler**: cả **Vite** (hash kiểu `Name-a1B2c3.js`, nằm trong `static/assets/`) lẫn **Webpack** (bundle kiểu `avada-...-main.min.js` + `...node_modules_...bundle.js`, nằm trong `static/scripttag/`).
- Front-end nguồn (không có trong repo này) dựa trên **React** + **dayjs** (rất nhiều bundle locale `dayjs`).
- Hosting: static files + **Shopify App Bridge** (thấy trong `embed-template.html`).
- CI/CD: **GitLab CI** — origin là `gitlab.com/avada/artifacts/joy-subscription-artifacts.git`. Commit message dạng máy sinh: `... at commit CI_COMMIT_SHA by CI_COMMIT_AUTHOR`.

## Kiến trúc / luồng chính (trỏ file)
- `static/assets/` — output **Vite** cho storefront widget. Mỗi component có hàng chục–hàng trăm bản hash (vd `ActiveBanner-*.js` ~148 bản, `FormProductBundle-*.js`...). Đây là các widget hiển thị trên trang khách: banner đăng ký, form chọn subscription plan, product bundle.
- `static/scripttag/` — output **Webpack** cho các entry storefront theo tên app:
  - `avada-subscription-main.min.js` — widget subscription chính (~337K).
  - `avada-subscription-box-main.min.js`, `-fixed-bundle-`, `-veluma-` — biến thể của **subscription box** (veluma là theme/variant riêng).
  - `avada-customer-portal-main.min.js` — **customer portal** để khách tự quản lý subscription (pause/skip/cancel...); kèm ~287 bundle locale dayjs + helper `getTranslatedTitle`.
  - `avada-cod-form-main.min.js` — form COD (Cash on Delivery).
- `static/embed-template.html`, `static/standalone.html` — shell HTML nhúng app admin qua Shopify App Bridge (`shopify-api-key`).
- `static/changelog/index.html` — trang changelog tĩnh (mới chỉ có `[0.0.1] 2019-04-10 Initialize project`, gần như bỏ hoang).
- `all_files.txt`, `changed_files.txt`, `files_to_remove.txt` — **danh sách đường dẫn** (33k / 10k / 23k dòng) do CI sinh, dùng cho bước **dọn artifact cũ**.

## Quyết định & gotcha
- **Repo phình cực to (~2.9GB)** vì tích lũy artifact theo từng lần build mà không xoá bản cũ — mỗi component để lại hàng trăm file hash trùng nội dung (`static/assets` có ~26k tên phân biệt sau khi bỏ hash). Đây là root cause của nhánh `hotfix/remove-artifacts` + commit gần nhất `remove artifacts` (HEAD `b80622b`).
- Có **hai hệ bundler song song** (Vite ở `assets/`, Webpack ở `scripttag/`) — dấu hiệu app được viết/migrate qua nhiều giai đoạn; khi debug phải biết widget nào ra từ pipeline nào.
- Không được sửa file trong repo này thủ công: nó là **output do CI ghi đè**, sửa tay sẽ mất khi build kế tiếp.
- Commit history không mang thông tin dev thật (đều là message CI generic) — muốn hiểu tính năng phải đọc từ repo source, không phải từ đây.

## Bài học
- Với artifact/CDN repo: cần **chính sách retention** (xoá build cũ, hoặc dùng object storage thay Git) ngay từ đầu, nếu không Git sẽ trương phình vì binary hash không nén tốt.
- Danh sách `files_to_remove.txt` cho thấy team chọn cách dọn thủ công/scripted thay vì rewrite history — hợp lý để tránh phá cache CDN đang phục vụ khách.
- Đọc repo này chủ yếu để nắm **bản đồ deploy front-end của Joy Subscription** (widget/portal/box/COD nằm đâu), không phải để đọc logic.

## Liên quan
- [[subscriptions]]
- [[joy]]
- [[avada-core]]
- [[shopify-app-dev]]
