---
type: note
title: Shipped PDF Invoice — commit landed 2026-08-06 (v3.1.72)
summary: Commit landed 08-06 — master nhận 4 MR: Email Sender & Custom SMTP (Professional+) lên `v3.1.72` sau một loạt fix QA SMTP, job CI auto-merge MR tài liệu (+ hotfix whitelist username), và 1 MR mockup/PRD; trên nhánh: SB-15301 payment reminder chạy tới P4 (data model + cron flag-off + test, kèm 52 dòng firestore.indexes.json), SB-14329 customer card actions kèm tách `.gitlab-ci.yml` thành `.gitlab/ci/*`, Sidekick SB-14254; không revert, không cờ deploy.
tags: [pdf, invoice, shopify, avada, firebase]
created: 2026-08-07
source: repo "pdf" — git log (2026-08-06); mọi hash/tag dưới đây lấy nguyên từ log
---

# PDF Invoice — shipped 2026-08-06

> Phần *học được* của ngày này (spec SB-15301 dựng từ mockup vì không có PRD, verifier bắt
> off-by-one, gate đỏ "pre-existing" phải chứng minh) đã nằm ở [[digest-pdf-2026-08-06]] —
> **không lặp lại ở đây**. Bối cảnh project: [[pdf]].

## Shipped

### Vào master — 4 MR

- **`ad12ba775` — tag `v3.1.72`, MR !461** — *Email Sender & Custom SMTP (Professional+):
  Tier-1 branded sender + Tier-2 custom SMTP*. Tính năng này theo dõi từ
  [[shipped-pdf-2026-08-01]] (khi đó còn trên nhánh, có 1 fix XSS) nay merge. Đợt cuối trước
  khi merge gần như toàn là **fix QA**, đáng ghi vì đều là họ lỗi hay lặp:
  - `1929f4509` (SB-15287/88/89) — validation của tab Automation Emails chạy cả rule SMTP
    nên shop có config SMTP điền dở **Save fail im lặng**; trim `testEmail` khi verify cho
    khớp giá trị đã validate client-side; trim `smtpPort` lúc onChange.
  - `db1dc85f6` (SB-15295/96/97/98) — khoá toggle Custom SMTP tới khi verify xong; verify
    fail thì banner critical mức trang + reset `isVerifiedSmtp`/`customSmtpEnabled` +
    **normalize lỗi SMTP ở server** (message thô của nodemailer chỉ log, không trả client);
    standalone dựng dialog xác nhận rời trang thật (trước chỉ rung save bar).
  - `37d56181a` — save bar "ma": shop non-Pro mở Email Settings là auto-revert
    `senderType`/`customSmtpEnabled` nhưng **không normalize baseline đã lưu**, nên revert
    chỉ-UI bị đọc thành thay đổi chưa lưu.
  - `741f51a37` — banner verify-error phải là **Layout riêng full-width** phía trên; nhét vào
    Layout nội dung thì `Layout.Section` mặc định (min-width 51%) rớt chung hàng với nav
    `oneThird`. Đây là lần vá thứ 2 của cùng một banner (`37d56181a` là lần 1).
  - `7bb2fda60` dời go-live date của flow Custom SMTP; `62be38444` tách preset provider ra
    `smtpProviders.js` + `ProviderHeader`/`ProviderAccordion` (behavior unchanged);
    `76a9166e5` merge master (conflict `.gitlab-ci.yml` + `getPlans.js`).
- **`e50b63fac` — MR !498** — job CI auto-merge MR chỉ đụng `product-team/`
  (nguồn `9b39b1ce5`), đúng phương án ở [[2026-08-06-auto-merge-mr-tai-lieu-ba]]; cùng job
  đã dựng song song bên `subscriptions`.
- **`9f3aaff8c` — MR !499** — hotfix ngay trong ngày: whitelist author sai username
  (`longlv` → `longlv3`, nguồn `62bbb568e`). Cùng một lỗi và cùng một hotfix với repo
  `subscriptions` — điều kiện whitelist khớp *chính xác* username nên lệch 1 ký tự là rơi về
  merge tay im lặng (job cố ý `exit 0` ở mọi nhánh skip).
  ⚠️ Body của `9b39b1ce5` nói PAT **bỏ Protected**, lệch với [[2026-08-06-auto-merge-mr-tai-lieu-ba]]
  ("PAT scope `api` Protected") — cần đối chiếu lại decision.
- **`8c54d99d4` — MR !501** — update mockup-app + PRD (nguồn `95b429960`, ~2.000 dòng):
  mockup payment reminder settings / customize email template / company + location payment
  terms / draft orders list. Không phải code app, nhưng **đây chính là nguồn spec** cho
  SB-15301 (xem [[digest-pdf-2026-08-06]]: feature không có PRD nên spec dựng từ mockup).

### Còn trên nhánh (chưa vào master)

- **SB-15301 payment reminder** — chạy tới P4 trên 4 nhánh riêng theo từng pha:
  - `af85e716a` spec `spec-payment-reminder-due-overdue.md` (344 dòng),
  - `52cf3f2f1` **P0** data model + config API: controller/repository/route/schema +
    `defaultData` + ⚠️ **`firestore.indexes.json` +52 dòng** (xem Deploy notes),
  - `8c993b1a8` **P2** gửi reminder qua cron `handleOrderDaily` — **flag off**, kèm
    `renderReminderMergeTags` và 239 dòng `wholeSale.service.js`,
  - `74c4ff39c` **P4** test cron + API (603 dòng) và bật thêm config cho `jest.config.js`.
- **`feature/SB-14329-customer-card-actions`** `2425f9181` — Customer card actions trên
  Order detail (`orderOverride.service` + `orderOverridesRepository`, 485 dòng
  `RightSection`). Commit này đồng thời **tách `.gitlab-ci.yml` 272 dòng** thành
  `.gitlab/ci/production.yml` / `staging.yml` / `staging2.yml` / `shopify-extension.yml` —
  refactor CI đi nhờ trong một MR feature, dễ lọt khi review.
- **Sidekick SB-14254** — `5596fb260` audit Sidekick theo rule cấm quảng cáo của Shopify
  (367 dòng spec), `7ff619e41` bỏ gợi ý nâng plan trong `instructions.md` của
  `pdf-invoice-tools` (hệ quả trực tiếp của audit), `9939823ae` trỏ staging_2 vào nhánh
  sidekick để deploy. Nối tiếp [[shipped-pdf-2026-08-06]].
- **`feat/templates-redesign`** `2a17993ff` — thanh tab (Preview/Liquid/Style/Variables) chỉ
  render khi developer mode bật; trước đây tắt vẫn vẽ `<Tabs>` một tab thừa.

## Reverted

Không có revert nào trong log ngày 08-06.

## Deploy notes

- **Không có `[deploy-functions]` / `[deploy-all]`** trong toàn bộ log ngày này.
- Version bump: `v3.1.72` (Email Sender & Custom SMTP).
- ⚠️ **`firestore.indexes.json` +52 dòng** trong `52cf3f2f1` — không phải file `migration/`
  nhưng là **thay đổi cần deploy index Firestore** trước khi query payment reminder chạy
  được ở prod. Đang trên nhánh; nhớ khi merge SB-15301.
- **Cấu trúc CI đổi trên 2 nhánh khác nhau cùng lúc**: `2425f9181` tách `.gitlab-ci.yml`
  thành `.gitlab/ci/*`, còn `e50b63fac`/`9f3aaff8c` thêm `.gitlab/ci/auto-merge.yml` vào
  master. `76a9166e5` đã dính conflict `.gitlab-ci.yml` — sẽ còn conflict nữa khi
  SB-14329 merge.
- `9939823ae` trỏ `staging_2` sang nhánh sidekick (đổi target deploy staging, không mang cờ).

## Bỏ qua (noise)

`8e94d40b1` và `002db864b` là bản trước của cùng MR mockup !501 (`95b429960` là bản được
merge), `349429557` chỉ thêm 1 dòng TODO (đã được `62be38444` giải quyết ngay sau đó).

## Liên quan

[[shipped-pdf-2026-08-06]] · [[digest-pdf-2026-08-06]] · [[digest-pdf-2026-08-07]] ·
[[shipped-pdf-2026-08-01]] · [[2026-08-06-auto-merge-mr-tai-lieu-ba]] · [[pdf]] ·
[[digest-pdf-2026-07-31]]
