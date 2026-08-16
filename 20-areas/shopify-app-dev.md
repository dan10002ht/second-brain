---
type: area
title: Shopify app development (AVADA)
summary: Phát triển & bảo trì các app Shopify embedded tại AVADA — mảng công việc chính.
tags: [shopify, avada, career, area]
created: 2026-07-06
updated: 2026-08-16
---

# Shopify app development (AVADA)

Trách nhiệm **dài hạn, không có "xong"**: phát triển & bảo trì các app Shopify
embedded tại AVADA. Đây là mảng công việc chính hằng ngày (10+ app), nền tảng kỹ
thuật lặp lại xuyên suốt các project.

## Stack lõi (dùng chung hầu hết app)

- **Framework**: `@avada/core` — auth Shopify + Firebase. Mặc định là một dòng dùng chung,
  nhưng **không còn đúng tuyệt đối**: Joy Subscription đang chạy dòng riêng
  `5.0.0-joysub.N` publish với npm dist-tag `joysub`, tách khỏi `latest` của CTO
  ([[2026-08-11-dong-core-rieng-joysub]]). Trước khi kết luận "app X dùng bản nào", **hỏi
  registry** chứ đừng đọc changelog.
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
- **Git & CI: GitLab on-premise `git.avada.net`.** `subscriptions`, `pdf` và
  `joy-subscription-artifacts` đã chuyển; gitlab.com giữ lại dưới remote tên `saas` để đối
  chiếu delta ([[2026-08-10-remote-gitlab-on-premise]] · thao tác:
  [[migrate-repo-gitlab-on-prem]]). Ba cái bẫy đang sống:
  - nhánh cũ vẫn `branch.<name>.remote = saas` ⇒ `git push` trần đẩy nhầm lên gitlab.com;
  - push **tag** lên on-prem chạy job deploy **production**;
  - remote `onprem` của repo artifacts là **mirror cũ lag hàng nghìn commit**, không phải
    nguồn — đo trước khi lấy làm mốc so sánh ([[digest-joy-subscription-artifacts-2026-08-14]]).
  `CI_JOB_TOKEN` chỉ đọc; CI muốn **ghi** sang repo khác thì phải PAT/Project Access Token riêng.
  ⚠️ *chưa xác minh*: `crm`, `backup`, `joy`, `shipping-labels` đã chuyển on-prem hay chưa —
  chưa có note nào nói, phạm vi ghi ở đây là phạm vi đã biết.

## Các app đang phụ trách

- [[subscriptions]] — Joy Subscription (recurring billing) — phức tạp nhất.
- [[pdf]] — PDF Invoice / Order Printer.
- [[joy]] — Joy Loyalty & Rewards.
- [[joy-subscription-artifacts]] — kho build/CDN của Joy Subscription.
- [[crm]] — marketing automation.
- [[backup]], [[shipping-labels]].
- [[avada-core]] — thư viện lõi. Đang ở `40-archive/` với lý do "repo không còn trên máy";
  lý do đó **không còn đúng** từ 2026-08-11 (repo có mặt lại, đang làm thật). Cần quyết định
  đưa về `10-projects/` hay `20-areas/`.

_(đã archive 2026-08-04: [[headless-demo]] — repo không còn trên máy)_

## Nguyên tắc/gotcha xuyên suốt

- **Multi-tenant nghiêm ngặt**: mọi query validate `shopId` — rule số 1. Kênh rò không chỉ là
  query thiếu filter: **state dùng chung ở tầng module** (const bị mutate) cũng đưa dữ liệu
  shop A sang shop B ([[digest-subscriptions-2026-08-14]]).
- **"Ask first"** trước khi đổi schema DB, thêm collection/webhook, sửa shared helper.
- Nhiều môi trường staging (`shopify.app.*.toml`) — link đúng config trước khi deploy.
- Query mới thường cần thêm composite index Firestore.
- **Schema validate ghi đè body.** Thêm field mới đi xuyên tầng thì sửa schema là bước
  ĐẦU; `200 success` không chứng minh đã ghi được xuống DB → [[koa-yup-validator-yup029]].
- **Không nhận lời khai thay bằng chứng.** "Gate đỏ là pre-existing", "không thấy log",
  "đo ra 0", "verifier PASS" đều cần một bằng chứng phân biệt được →
  [[bang-chung-phan-biet-duoc]].
- **Email notification của Shopify không phải thứ app điều khiển được**, và dev store /
  order `test: true` thì Shopify cố ý không gửi → [[digest-subscriptions-2026-08-16]].

## Cách làm việc đã ổn định

- **Auto-merge MR tài liệu của BA** chạy ở cả `subscriptions` và `pdf`: diff nằm trọn
  trong `product-team/` + author trong whitelist → job pipeline tự merge
  ([[2026-08-06-auto-merge-mr-tai-lieu-ba]]).
- **Hook chặn `git push` chỉ chặn `master`/`main`** — nhánh feature agent push thẳng, không
  phải nhờ người dán lệnh ([[feedback-git-guard-chi-chan-master]] ·
  [[feedback-git-branch-discipline]]). Repo mà `main` *là* nhánh làm việc (kho artifacts,
  repo học tập) thì thêm vào `EXEMPT_REPOS`, không gỡ lưới chung.
- Verify sau khi implement giao cho agent `verifier` context sạch, chọn hạng theo độ rộng
  diff → [[2026-08-04-looptasks-verifier-doc-lap]] · [[2026-08-07-phan-tang-verifier]].
  Khi một task sửa nhiều bug: chạy gate **một lần** cho cả cụm
  ([[2026-08-13-tach-gate-khoi-cham-tung-bug]]).
- Task list của loop sống trong `BRIEF.md` của từng repo và **phải được dọn định kỳ** →
  [[brief-state-agent-loop]].

## Liên quan
- [[dev-skills]]
