---
type: area
title: Shopify app development (AVADA)
summary: Phát triển & bảo trì các app Shopify embedded tại AVADA — mảng công việc chính.
tags: [shopify, avada, career, area]
created: 2026-07-06
updated: 2026-08-09
---

# Shopify app development (AVADA)

Trách nhiệm **dài hạn, không có "xong"**: phát triển & bảo trì các app Shopify
embedded tại AVADA. Đây là mảng công việc chính hằng ngày (10+ app), nền tảng kỹ
thuật lặp lại xuyên suốt các project.

## Stack lõi (dùng chung hầu hết app)

- **Framework**: `@avada/core` — auth Shopify + Firebase, dùng chung mọi app.
- **Backend**: Node.js + Koa + Firebase Functions, kiến trúc [[controller-service-repository]].
  Validate request bằng `koa-yup-validator` — xem [[koa-yup-validator-yup029]] trước khi thêm field.
- **Data**: Firestore multi-tenant theo `shopId` ([[firestore-multitenant]]) + BigQuery (analytics) + Redis (cache).
- **Frontend admin**: React + Shopify Polaris + **App Bridge v4**. Joy Subscription đã gỡ hẳn
  v3 ([[2026-08-06-appbridge-v3-sang-max-modal]]): fullscreen cũ thay bằng max modal + iframe
  route, đổi lại phải tự dựng bridge 2 chiều và Save/Discard nằm ở TitleBar do host sở hữu.
- **Storefront**: Preact widget nhúng theme. Khi Storefront API và Admin API mâu thuẫn về
  availability → [[storefront-vs-admin-availability]].
- **Cấu trúc repo**: [[monorepo-yarn-workspaces]].
- **Nền tảng**: [[app-development]] (extensions, billing, embedded).
- CI trên GitLab (gitlab.com/avada/*).

## Các app đang phụ trách

- [[subscriptions]] — Joy Subscription (recurring billing) — phức tạp nhất.
- [[pdf]] — PDF Invoice / Order Printer.
- [[joy]] — Joy Loyalty & Rewards.
- [[joy-subscription-artifacts]] — kho build/CDN của Joy Subscription.
- [[crm]] — marketing automation.
- [[backup]], [[shipping-labels]].

_(đã archive 2026-08-04: [[avada-core]], [[headless-demo]] — repo không còn trên máy)_

## Nguyên tắc/gotcha xuyên suốt

- **Multi-tenant nghiêm ngặt**: mọi query validate `shopId` — rule số 1.
- **"Ask first"** trước khi đổi schema DB, thêm collection/webhook, sửa shared helper.
- Nhiều môi trường staging (`shopify.app.*.toml`) — link đúng config trước khi deploy.
- Query mới thường cần thêm composite index Firestore.
- **Schema validate ghi đè body.** Thêm field mới đi xuyên tầng thì sửa schema là bước
  ĐẦU; `200 success` không chứng minh đã ghi được xuống DB → [[koa-yup-validator-yup029]].
- **Không nhận lời khai thay bằng chứng.** "Gate đỏ là pre-existing", "không thấy log",
  "đo ra 0", "verifier PASS" đều cần một bằng chứng phân biệt được →
  [[bang-chung-phan-biet-duoc]].

## Cách làm việc đã ổn định

- **Auto-merge MR tài liệu của BA** chạy ở cả `subscriptions` và `pdf`: diff nằm trọn
  trong `product-team/` + author trong whitelist → job pipeline tự merge
  ([[2026-08-06-auto-merge-mr-tai-lieu-ba]]).
- **Hook chặn `git push` tự động** ở repo app — hàng rào cố ý, agent đưa lệnh cho người
  thật chạy chứ không lách. Xem [[feedback-git-branch-discipline]].
- Verify sau khi implement giao cho agent `verifier` context sạch, chọn hạng theo độ rộng
  diff → [[2026-08-04-looptasks-verifier-doc-lap]] · [[2026-08-07-phan-tang-verifier]].

## Liên quan
- [[dev-skills]]
