---
type: note
title: Shipped PDF Invoice — commit landed 2026-08-13 (không có gì vào master)
summary: Commit landed 08-13 — master KHÔNG nhận gì (không MR, không tag, không version bump); toàn bộ nằm trên 3 nhánh — `feature/payment-reminder` đóng 3 bug SB-15545/SB-15554/SB-15496 (đáng kể nhất: race hai webhook tạo đơn trùng, vá bằng transaction), sidekick chiếm hẳn slot staging 4 và đẩy master về staging 3, SB-14329 customer card actions tách `.gitlab-ci.yml` thành `.gitlab/ci/*`; không revert, không cờ deploy, không migration.
tags: [pdf, invoice, shopify, avada, firestore, concurrency]
created: 2026-08-14
updated: 2026-08-14
source: repo "pdf" (PDF Invoice for Shopify) — git log 2026-08-13; mọi hash lấy nguyên từ log, nhánh suy từ ref decoration
---

# PDF Invoice — shipped 2026-08-13

> Ngày trước: [[shipped-pdf-2026-08-13]] · root cause cùng ngày: [[digest-pdf-2026-08-13]] ·
> bối cảnh: [[pdf]].

**Master nhận 0 commit hôm nay.** Không MR, không tag, không bump version — mốc gần
nhất vẫn là `v3.1.78` của [[shipped-pdf-2026-08-13]]. Toàn bộ khối lượng nằm trên
ba nhánh song song.

## Shipped

### `feature/payment-reminder` — 3 bug, mỗi bug một vùng file

| Hash | Ticket | Nội dung |
|---|---|---|
| `28dfc9910` | SB-15545 | overdue reminder gửi lại **cùng một đơn mỗi giờ** |
| `9bb31deba` | SB-15554 | trang payment reminder hiện sender mặc định thay vì sender custom |
| `5ef1dcdbe` | SB-15496 | ô upload logo bị một rule DropZone không scope giấu đi |

**`28dfc9910` là commit đáng giữ nhất trong ngày** — và là thứ *không* có trong
[[digest-pdf-2026-08-13]] (digest hôm đó chỉ ghi SB-15496 / SB-15554 / SB-15563).
Chuỗi nhân quả trong commit body:

- `createOrUpdateOrder` **đọc rồi ghi mà không có transaction** ⇒ hai webhook
  `orders/updated` tới trong cùng một giây đều thấy "chưa có doc" và mỗi bên tạo một cái.
- `updateOrder` chỉ patch **bản khớp đầu tiên**, nên bản sinh đôi kẹt ở
  `overdueReminderCount = 0` — và cron mỗi giờ lại nhặt đúng nó lên. Triệu chứng
  "gửi lại mỗi giờ" thực ra là *hai doc*, không phải *cờ ghi hụt*.
- Cách vá: bọc read+write trong transaction **theo đúng cách `claimAemInvoice` đã làm
  cho cùng kiểu burst đó**, và match theo `orderId + shopId` như `updateOrder` vẫn match.
  Đây là mẫu "tái dùng cơ chế sẵn có trong repo thay vì phát minh cái thứ hai" —
  cùng nếp với [[feedback-follow-conventions]].
- `updateOrder` nay **throw** thay vì resolve im lặng khi không khớp gì, để trạng thái
  "mail đã gửi mà cờ chưa ghi" **hiện ra trong log**. Caller theo lô đi qua
  `updateOrderInBatch` — log rồi nuốt lỗi, vì một đơn hỏng trong `Promise.all` của cron
  không được phép giết cả tick của mọi shop khác. Cùng họ với
  [[bang-chung-phan-biet-duoc]]: hỏng im lặng thì không phân biệt được với chạy đúng.
- Kèm 2 file test mới (`wholesaleOrdersDuplicateGuard`, `updateDiscountEarlyForOrderBatchResilience`)
  — 374 dòng test cho 55 dòng repository.

Hai commit còn lại đã có root cause đầy đủ ở [[digest-pdf-2026-08-13]] (sender hardcode
ở FE → giải bằng `getSenderFrom` server-side; rule `.Polaris-DropZone{display:none}` viết
cho widget logo legacy nhưng chưa bao giờ được scope, nay ghim vào
`.Polaris-UpdateTemplate-DropZone`) — **không chép lại ở đây**.

### `feature/sidekick-agent-extensions` — chiếm hẳn một slot staging

- `a0f6d79a8` — merge master vào nhánh, gỡ 2 conflict: `.gitlab-ci.yml` lấy phía master
  (⇒ nhánh **mất** slot staging 2), và `Emails.js` add/add giữ cả `isPro`/`goToSubscription`
  của master lẫn block `focusTab` của Sidekick.
- `e333c63b7` — trỏ nhánh sang `deploy_staging_4` để bù lại slot vừa mất. Body commit
  ghi *"master keeps deploying to staging 4 as before"*.
- `67742edbe` — **cùng ngày gỡ luôn master khỏi `deploy_staging_4`**, master còn
  `deploy_staging_3`. Tức mệnh đề trong `e333c63b7` chỉ đúng được vài giờ.

Hai commit này là một quyết định thật về sở hữu môi trường, không phải sửa vặt →
[[2026-08-14-staging-4-cho-nhanh-sidekick]].

### `feature/SB-14329-customer-card-actions` — customer card + tách CI

`764e7f4ac` (20 file, +1385/−362): action trên customer card ở màn order detail —
`orderOverridesRepository` + `orderOverride.service` (200 dòng, có test 111 dòng),
2 route mới, `RightSection.js` +485. Nhét chung trong commit đó là việc
**xẻ `.gitlab-ci.yml` (−342 dòng) thành `.gitlab/ci/{production,staging,staging2,staging3,staging4,shopify-extension}.yml`**.

Brain đã ghi việc tách này ở [[shipped-pdf-2026-08-07]] cũng dưới dạng "trên nhánh" —
một tuần sau vẫn chưa vào master, và nay xuất hiện lại như một commit đơn (dấu hiệu
nhánh đã rebase/squash). Việc hạ tầng dùng chung bị khoá trong một commit feature là
rủi ro riêng của nó: muốn lấy cấu trúc CI mới thì phải lấy kèm cả tính năng.

## Reverted

Không có revert nào, trên master lẫn trên nhánh.

## Deploy notes

- **Không tag, không bump version, không MR vào master** trong cả ngày.
- **Không** commit nào mang `[deploy-functions]` / `[deploy-all]` / `[deploy-extensions]`.
- **Không** migration, không đụng `firestore.indexes.json` (khác các ngày trước —
  xem [[shipped-pdf-2026-08-11]]).
- Tín hiệu deploy duy nhất là **cấu hình CI**, và nó thay đổi trên **hai nhánh theo hai
  cách không tương thích** (xem mục dưới).

## ⚠️ Cần xác nhận

**1. Hai biểu diễn xung khắc của cùng một cấu hình CI.**
- Brain ([[shipped-pdf-2026-08-13]], MR !507 / `880fb1b0f`) ghi: staging 3 + 4 được mở
  bằng cách **thêm ~70 dòng vào `.gitlab-ci.yml`** monolith, đã vào master.
- Log 08-13, `764e7f4ac`: `.gitlab-ci.yml` **bị rút còn 342 dòng ít hơn**, các job dời
  sang `.gitlab/ci/staging3.yml` / `staging4.yml` / …
- Cùng lúc đó `e333c63b7` và `67742edbe` vẫn đang sửa **`.gitlab-ci.yml` monolith** trên
  nhánh sidekick.

Ba nhánh đang sửa cùng một cấu hình ở hai chỗ khác nhau. Nhánh nào merge sau sẽ hoặc
conflict, hoặc **im lặng nuốt mất** thay đổi slot của nhánh kia — kiểu hỏng đã xảy ra
đúng một lần trong ngày này (`a0f6d79a8` lấy phía master và làm nhánh sidekick rơi khỏi
staging 2). Cần chốt: `.gitlab/ci/*` có phải hướng đi chính thức không, và ai merge trước.

**2. `e333c63b7` khẳng định "master keeps deploying to staging 4", `67742edbe` cùng ngày
gỡ đúng dòng đó.** Không phải mâu thuẫn với brain mà là mâu thuẫn nội bộ trong log —
ghi lại để ai đọc `e333c63b7` một mình không tin nhầm. Trạng thái cuối: master → staging 3,
sidekick → staging 4.

## Liên quan

[[shipped-pdf-2026-08-13]] · [[digest-pdf-2026-08-13]] · [[digest-pdf-2026-08-12]] ·
[[shipped-pdf-2026-08-11]] · [[shipped-pdf-2026-08-07]] ·
[[2026-08-14-staging-4-cho-nhanh-sidekick]] · [[2026-08-11-bo-feature-flag-payment-reminder]] ·
[[2026-08-09-hoan-backfill-co-don-cu-pdf]] · [[bang-chung-phan-biet-duoc]] ·
[[feedback-follow-conventions]] · [[pdf]] · [[shopify-app-dev]]
