---
type: area
title: Shopify app development (AVADA)
summary: Phát triển & bảo trì các app Shopify embedded tại AVADA — mảng công việc chính; từ 09/2026 thêm bề mặt thứ năm là Customer Account extension (thêm extension = thêm cho MỌI merchant, không gate được theo shop).
tags: [shopify, avada, career, area, extensions]
created: 2026-07-06
updated: 2026-09-20
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
  availability → [[storefront-vs-admin-availability]]. **Bundle widget đi qua CDN với
  `max-age=86400`**, nên "MR đã merge" không đồng nghĩa "shop đang chạy bản mới": phân biệt bằng
  một lượt gọi kèm `?cb=<timestamp>` (ra size khác = origin đã đúng, CDN đang giữ bản cũ), và chữa
  cho merchant bằng `?v=<ngày>` trong ô *Bundle script URL* của theme editor — query string nằm
  trong cache key nên không phải sửa code ([[caching-layers]]).
- **Customer Account extension** (bề mặt thứ năm, từ 09/2026): portal khách hàng dựng bằng
  extension riêng thay vì trang web nhúng. Bốn ràng buộc đã trả giá để biết:
  - **Thêm extension = thêm cho MỌI merchant.** Shopify không có cơ chế bật/tắt theo shop; muốn
    "chỉ khách này thấy" thì extension tự đọc cờ lúc mount và tự render rỗng — và mục menu do
    merchant thêm trong editor thì không tắt được ([[extension-khong-gioi-han-theo-shop]] ·
    [[2026-09-17-extension-wholefoods-khong-gate-theo-shop]]).
  - **Không có error boundary**: một dòng ném lỗi ở nhánh render là **trắng cả màn hình**, nên
    triệu chứng không mang thông tin chẩn đoán → [[khong-error-boundary-hong-ca-man-hinh]].
  - **Prop sai bị bỏ qua im lặng** — tra thẳng type definition trước khi kết luận "platform không
    hỗ trợ": `Modal` thiếu `size` thì mặc định `auto`, `blockAlignment="stretch"` không hợp lệ,
    `BorderStyle` **có** `dashed` ([[prop-sai-bi-bo-qua-im-lang]] · [[feedback-ra-het-duong-verify]]).
  - **Chạy thật trên store chỉ qua dev preview**, cần một mục menu mới đến được, và backend phải
    là HTTPS công khai — `localhost` không dùng được ([[cau-extension-chay-that-tren-store]]).
  - Thay đổi bố cục thì **mở ảnh ra nhìn**, đừng so `innerText` → [[so-anh-khong-so-chu]].
- **Cấu trúc repo**: [[monorepo-yarn-workspaces]].
- **Nền tảng**: [[app-development]] (extensions, billing, embedded).
- **Git & CI: GitLab on-premise `git.avada.net`.** `subscriptions`, `pdf` và
  `joy-subscription-artifacts` đã chuyển; gitlab.com giữ lại dưới remote tên `saas` để đối
  chiếu delta ([[2026-08-10-remote-gitlab-on-premise]] · thao tác:
  [[migrate-repo-gitlab-on-prem]]). Năm cái bẫy đang sống:
  - nhánh cũ vẫn `branch.<name>.remote = saas` ⇒ `git push` trần đẩy nhầm lên gitlab.com;
  - push **tag** lên on-prem chạy job deploy **production**;
  - remote `onprem` của repo artifacts là **mirror cũ lag hàng nghìn commit**, không phải
    nguồn — đo trước khi lấy làm mốc so sánh ([[digest-joy-subscription-artifacts-2026-08-14]]);
  - **`shopify app deploy` đẩy CẢ app config trong toml**, không chỉ bundle extension. Một lần
    deploy từ máy với `shopify.app.staging-3.toml` thiếu `optional_scopes` đã **làm mất scope của
    app**. Production an toàn *chỉ vì* `.gitlab/ci/production.yml` ghi `$PROD_APP_TOML` ra
    `shopify.app.toml` trước khi deploy — tức toml trên máy không phải nguồn cho prod, nhưng **là**
    nguồn cho mọi môi trường khác ([[digest-subscriptions-2026-09-17]] · [[digest-subscriptions-2026-09-19]]);
  - **`.gitlab/ci/staging.yml` / `staging3.yml` ghim `STAGING*_BRANCH`** — merge nguyên trạng là đổi
    con trỏ môi trường của nhánh khác. Luôn lấy bản master cho hai file này; đây là conflict thật
    duy nhất của một nhánh dài ngày 228 file.
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
- **Mutation thay-cả-khối xoá field không gửi.** `productSet.variants` và
  `SubscriptionDraftInput.customAttributes` đều thay **cả danh sách** — đọc hiện trạng rồi nối
  thêm, và script sửa chữa chỉ được đặt giá trị TRỞ LẠI, không bao giờ ghi `null` đè lên cái đang
  sống → [[mutation-ghi-nguyen-khoi-xoa-field-khong-gui]].
- **Giá trị thuộc về thực thể khác thì tra lại lúc đọc, đừng backfill xuống từng bản ghi** — và
  phạm vi backfill (khi buộc phải làm) suy từ *ai đọc field này*, không từ *field này đang sai*
  → [[resolve-luc-doc-thay-vi-ghi-truoc]] · [[2026-09-14-backfill-bird-chi-don-chua-charge]].
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
