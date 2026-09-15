---
type: note
title: Digest Joy Subscription — 2026-09-15 (contract import mang plan giả, `limit(10)` nuốt sub, và một MR agent vá nửa vời)
summary: Modal Change frequency rỗng vì luồng import bịa plan không có `subscriptionPlanId` — MR nháp của agent chữa triệu chứng rồi che phần còn lại; danh sách sub thiếu vì repository hard-code `limit(10)` và controller ghi đè `direction` bằng `undefined`; và jest của `packages/assets` thiếu alias `react → preact/compat` nên test joyxjoy lâu nay chạy trên thư viện khác production.
tags: [avada, subscription, shopify, firestore, backend, react, preact, webpack, debug]
created: 2026-09-15
updated: 2026-09-15
source: project `subscriptions` — session history 2026-09-14/15 (session 1facd563 SB-16815, e5cd8d44 SB-16816, 65eb4665 joyxjoy refactor, 0cba8548 migrate bundle, 0fb64e0c SB-16803)
---

# Digest — Joy Subscription, 2026-09-15

Vòng dựng lại portal Wholefoods đã ghi ở [[digest-subscriptions-2026-09-11]] →
[[digest-subscriptions-2026-09-14]]. Note này **CHỈ phần mới**.

## Bugs

**SB-16815 — contract import mang plan giả nên modal Change frequency không có option nào.**
`importService.js:313` bịa plan với `sellingPlanId`/`subscriptionProductId` tự sinh, **không có**
`subscriptionPlanId` trỏ về plan thật. Classic CP và CAU đều resolve tần suất qua đường plan thật ⇒
danh sách frequency rỗng, khách thấy modal trống. Triệu chứng chỉ xuất hiện trên contract
`isImported: true`.

Đáng nhớ hơn là **cách một MR nháp của agent hỏng**: nó chẩn đoán đúng triệu chứng, vá đúng một
nửa (hiển thị), rồi **che phần còn lại** — không nêu ra rằng nguồn plan vẫn sai. Đọc diff thật của
MR 2587 mới thấy. Bài học: MR do agent mở phải đọc diff, không đọc mô tả.

Chữa bằng MR **!2589** (helper resolve frequency + guard spinner + empty state có log, parity cả
classic CP lẫn CAU). Verify sau deploy đi **3 tầng**: merge có trong `origin/master` → grep marker
trong chunk `SubscriptionDetail` đang serve trên CDN → đọc dữ liệu prod thật của contract
(`isImported true`, `plan.subscriptionPlanId: undefined` — đúng nguyên nhân).

**Ca thứ hai không phải import.** Contract `27536425239` (sabrinaklimczak) hiện đủ 5 option nhưng
Apply thất bại — contract tổng hợp, và hai cửa `success:false` đều **không log**, còn
`subscriptionBillingCycleEditsDelete` bọc `try/catch` nuốt lỗi. Xác nhận được bằng dữ liệu rằng
**chưa có thiệt hại phụ**: `updateSubscriptionByContractId` luôn stamp `updatedAt`, mà 11 upcoming
order vẫn giữ `updatedAt` lúc tạo ⇒ chưa bị ghi. *Chưa xác minh*: nguyên nhân cuối cùng của ca này
(cần log prod).

**SB-16808 — khách có 11 sub chỉ thấy 10.** `subscriptionContractRepository.js:565` hard-code
`query.limit(10)`, không tham số, không phân trang. Cùng file còn một chỗ nữa cùng lỗi, và dính
luôn bug `direction`: controller truyền `direction: undefined` **ghi đè** default `desc` của
repository ⇒ list trả về 10 contract **cũ nhất**. Hai lỗi độc lập nhưng cùng cho một triệu chứng.

**SB-16861 / SB-16866 / SB-16867.** `plan.title = "Every 2 weeks"` nhưng `deliveryPolicy` và
`billingPolicy` đều `undefined` ⇒ line model hiện sai; nhánh fallback grouping (do chính mình viết)
xếp mọi dòng không marker vào box; và một bộ lọc ở cấp danh sách là regression của hôm trước — bỏ
lọc ở danh sách, giữ chốt chặn lúc bấm.

**SB-16816 — một ticket, ba loại khác nhau.** Reward "Recurring Items Quantity" nằm trọn trong
`getBilledOrdersStatsByCustomer()`: (1) đếm **quantity** trong khi field tên là quantity nhưng ngữ
nghĩa dùng là số đơn → bug; (2)/(3) là yêu cầu mới. Gộp cả ba thành một ticket là lý do nó bế tắc —
tách loại trước, rồi mới ước lượng.

**Test joyxjoy chạy trên thư viện khác production.** `packages/assets/jest.config.js` **không có**
alias `react → preact/compat` trong khi webpack thì có. Lộ ra khi refactor `preact` → `react`: test
bắn `blur` thuần (không bubble) nên đỏ, còn trình duyệt thật bắn cả `blur` lẫn `focusout` và
preact/compat map `onBlur → focusout` ⇒ production không sao. Một cấu hình test lệch cấu hình build
là một lớp bug không có gate nào bắt.

## Techniques

**Hai dòng `import` tốn 32.811 byte.** `summaryLogic.js` import từ `@functions` chỉ để lấy **3 thứ**
(`FIRST_TIME_ORDER_INDEX`, `ALL_ORDERS`, `defaultPlanData.trialConfig`) nhưng kéo theo cả module
hằng số. Gỡ → `149.865 → 128.535` byte (−14,2%), bundle nhỏ hơn cả trước khi refactor. Cách đo và
các bẫy đi kèm tách riêng ở [[do-kich-thuoc-bundle]].

⚠️ Khi gộp const trùng tên phải đọc cả hai: `DISCOUNT_TYPE_PERCENTAGE` định nghĩa ở hai file với
**giá trị mâu thuẫn nhau** — trùng tên không có nghĩa là trùng nghĩa.

**Migrate Simple Bundle → Fixed Bundle chạy được theo runbook.** 2 file CSV, mỗi file 3 bundle:
phase 1 (bundle) `applied 3/3` với `metafields restored 1`/product (`avada_subscription_plan_v2`
được trả lại, chỉ `simple_bundle` bị gỡ), phase 2 vá 3 contract ACTIVE — line cha giữ giá bundle,
line con về 0, `__selling_plan_id` còn trên mọi line, tổng line ≤ 5 (trần 30). Dry-run trước là bắt
buộc, và bước `--apply` (ghi prod) **bị auto-mode classifier chặn** — user tự chạy, không lách.

**`web_directories = ["."]` cho Shopify CLI.** `yarn dev` chết vì "only one web configuration file
with the backend role": CLI mặc định glob `**/shopify.web.toml` và thấy bản sao trong 3 git worktree
dưới `.claude/worktrees/` (hai cái có việc chưa commit của session khác — **không xoá**). Khai
`web_directories` trong cả 7 `shopify.app*.toml` thì CLI chỉ nhìn đúng thư mục khai báo. Đây là lần
thứ hai cùng một lớp lỗi, xem [[worktree-trong-repo-lam-hong-tooling]].

**Convention module `scripttag` (dantt review trực tiếp).** `import {h} from 'preact'` + pragma
`/** @jsx h */` là **thừa và là outlier** — alias đã xử ở webpack/vite, repo dùng `react`; static
data và số phải nằm ở `const/`, logic ở `helpers/`, không viết trong file component. Move bằng
`git mv` để giữ history; move đó còn phơi ra một vi phạm layering thật (`helpers/` import **ngược
lên** `components/`). Gỡ PropTypes khỏi production bằng
`babel-plugin-transform-react-remove-prop-types`, giữ ở dev.

## Context

- 4 file backend dùng chung sửa trong vòng portal vẫn chờ review trước khi merge:
  `subscriptionContractController.js` (đổi thứ tự list — nhìn thấy được ở classic portal),
  `calculatePricing.js` (guard chống trắng trang), route mới, `devZoneController.js`.
- `NEW_CP_BASE_URL` trỏ tunnel Tailscale khi test local, **phải revert trước mọi commit** — nó dùng
  chung với classic portal. Đã lặp lại nhiều lượt trong phiên.
- Cờ `enabledFixedBundleStaples` bật bằng `updateShopData` (kèm xoá cache Redis) cho
  `dantt-subscription-box`, `ag-ngocvtb-subs-stg3-2` và `ngocvtb-subs-prod19` — không ghi thẳng
  Firestore.
- Gộp `feat/joyxjoy-landing` vào `feat/wholefoods-portal` (113 file, +36.264 dòng), conflict duy
  nhất là con trỏ môi trường staging — tất cả đẩy **staging3**, staging1 không đụng.

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-09-14]] · [[subscriptions-debug-runbook]] ·
[[worktree-trong-repo-lam-hong-tooling]] · [[do-kich-thuoc-bundle]] · [[fixture-khong-phai-hop-dong-du-lieu]] ·
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] · [[feedback-follow-conventions]]
