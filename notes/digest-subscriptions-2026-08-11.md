---
type: note
title: Digest subscriptions 2026-08-11 — dòng core riêng joysub cho token hết hạn
summary: Dựng dòng `@avada/core` riêng (`5.0.0-joysub.N`) rẽ từ nhánh CTO để vá đường token hết hạn, kèm chuỗi bẫy khi làm việc trên 2 repo cùng lúc (gate soi nhầm repo, nhánh track nhầm remote, master local chậm 26 commit).
tags: [subscription, shopify, auth, nodejs, avada, redis]
created: 2026-08-11
updated: 2026-08-11
source: project "subscriptions" (+ repo `avada-core`) — session history
---

Bối cảnh: Shopify bỏ offline token không hết hạn. CTO có bản `@avada/core@5.0.0-alpha.7`
xử lý việc này; dantt trước đó tự làm bản `4.8.0-alpha.18` (nhánh `origin/fix/expiring-offline-tokens`).
Cả phiên xoay quanh: chọn bản nào, và làm sao đưa app Joy Subscription lên đường token mới.
→ Quyết định tách riêng: [[2026-08-11-dong-core-rieng-joysub]] ·
Kiến thức Shopify khái quát: [[shopify-token-exchange-migrate-offline-token]]

## Bugs / gap tìm được

- **`joysub.2` thiếu 7 thứ so với `alpha.12` của CTO**, trong đó 2 CRITICAL: thiếu guard
  `hasActivePaidSubscription` trong `Builder.create`, và **phân loại auth-failure sai ở
  `getAuthResult`**. Bug không nổ ở production hiện tại vì cần *hai* điều kiện đồng thời mà
  app chưa có — nhưng đó là may, không phải thiết kế.
- **Guard mới chặn nhầm chính luồng nó sinh ra để bảo vệ**: `checkFreePlan` (merchant tự bấm
  Downgrade) bị guard "shop đang trả tiền thì không tạo charge Free" chặn lại. Verifier bắt
  ở vòng 1. Cách sửa đúng không phải rải `allowDowngrade: true` khắp call site mà sửa thẳng
  định nghĩa `isDowngradeToFree`.
- **`normalizeShopName` regex case-sensitive** (fix của alpha.12): `DEMO.myshopify.com` bị
  biến dạng.
- Bản `alpha.8` **chưa từng được publish** — registry chỉ có `alpha.1,2,3,5,6,7,9`, nội dung
  alpha.8 nằm gọn trong changelog của alpha.9. So sánh version phải hỏi registry, đừng tin changelog.

## Kỹ thuật / gotcha

- **Gate của Claude Code soi nhầm repo.** Commit ở `~/projects/avada-core` nhưng hook chạy
  `yarn check` của repo `subscriptions` → 5 violation pre-existing chặn commit. `--no-verify`
  vô dụng vì đây **không phải git hook** mà là hook tầng harness, chặn lời gọi Bash trước khi
  git chạy. Đường vòng đang dùng: nhờ user dán lệnh `!cd ... && git commit && git push`.
- **Nhánh mới tạo track nhánh của người khác.** `fix/token-hardening` rẽ từ
  `origin/feature/get-valid-shop-token` nên `git push` trần đẩy thẳng vào nhánh CTO. Phải chỉ
  định tường minh remote+nhánh. (Cùng họ với [[migrate-repo-gitlab-on-prem]].)
- **Fetch trước khi tạo worktree.** `master` local đang chậm **26 commit** so với `origin/master`;
  base worktree vào master local là kế thừa một cây cũ.
- **Đo baseline trước khi code, đừng tin số ghi trong brief cũ.** Brief ghi 8 suite fail, đo lại
  trên nhánh mới base `origin/master` chỉ còn **2 suite fail pre-existing**
  (`orderService.test.js`, `conditionEvaluation.test.js` — chết lúc load).
- **Sửa `makeGraphQlApi` một chỗ là đủ cho 224/225 call site** vì mọi call site đều spread
  `{...shop}`. Nhưng quét rộng (header `X-Shopify-Access-Token` dựng tay, `fetch` thẳng
  `/admin/`, bulk operation) vẫn lòi ra 3 chỗ ngoài hai đường đã biết.
- **npm dist-tag làm channel riêng**: publish `--tag joysub` để `dist-tags.joysub` là bản của
  mình còn `latest` vẫn là bản CTO — hai dòng không đụng nhau. Verify publish bằng cách **hỏi
  thẳng registry**, không đọc exit code qua pipe (pipe trả exit của lệnh cuối).
- **Cache token đặt ở app, không ở core** — theo yêu cầu của dantt: có app khác không dùng
  Redis, lib dùng chung không được ép dependency hạ tầng lên app tiêu thụ. Verifier xác nhận
  cache key `valid-access-token:${shopifyDomain}` không rò token chéo shop.
- `tsc` giữ nguyên comment khi build → bản build của alpha.9 mang cả JSDoc gốc, nên "dựng lại
  từ bản build" ≈ tái tạo chứ không phải "viết lại độc lập". Changelog phải nói đúng điều này.

## Context

- Verifier bác kết luận của agent điều tra **3 lần trong phiên** (V7 ở task 8, C3 ở task 11,
  finding changelog ở joysub.2). Giữ nguyên nếp: agent điều tra ≠ kết luận.
- Repo `avada-core` đang có mặt lại trên máy — brain đang ghi [[avada-core]] ở
  `40-archive/` với lý do "repo không còn trên máy". Cần xem lại khi mature note này.
- Hai session còn lại trong lượt mining này là việc cũ đã ghi
  ([[digest-subscriptions-2026-08-09]] và build installment custom) — không lặp lại.

## Liên quan

[[shipped-subscriptions-2026-08-11]] · [[2026-08-11-dong-core-rieng-joysub]] ·
[[shopify-token-exchange-migrate-offline-token]] · [[avada-core]] ·
[[migrate-repo-gitlab-on-prem]] · [[feedback-git-guard-chi-chan-master]] ·
[[feedback-follow-conventions]] · [[bang-chung-phan-biet-duoc]] (số fail ghi trong brief cũ
không phải phép đo — đo lại trên nhánh mới còn 2 suite) · [[subscriptions]]
