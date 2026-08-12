---
type: note
title: Digest subscriptions 2026-08-12 — joysub.3 + bật đường token hết hạn ở app
summary: CHỈ phần mới của dòng core riêng: `joysub.3` vá 7 gap so với `alpha.12`, hai biến env là hai quyết định khác nhau (`SHOPIFY_EXPIRING_OFFLINE_TOKEN` vs `SHOPIFY_AUTO_MIGRATE_OFFLINE_TOKEN`), chuyển sang mặc định bật nên biến CI thành thừa, và slot staging bị neo theo `STAGING_BRANCH` trong `.gitlab/ci/staging.yml`.
tags: [subscription, shopify, avada, auth, nodejs, backend, redis]
created: 2026-08-12
updated: 2026-08-12
source: project "subscriptions" (+ repo `avada-core`) — session history (4 session, chỉ 2 session mang phần mới)
---

# Joy Subscription — digest 2026-08-12

> Chỉ ghi **phần mới** so với [[digest-subscriptions-2026-08-11]] và
> [[2026-08-11-dong-core-rieng-joysub]]. Nền Shopify: [[shopify-token-exchange-migrate-offline-token]].

## Bugs / gap

- **`joysub.2` thiếu 7 thứ so với `alpha.12` của CTO**, 2 trong đó CRITICAL: guard
  `hasActivePaidSubscription` trong `Builder.create` và phân loại auth-failure ở `getAuthResult`.
  Bug **không nổ được ở production hiện tại** vì cần hai điều kiện đồng thời mà app đều chưa có —
  đó là may, không phải thiết kế. Vá thành `joysub.3` (9 file, +157/−25).
- **Guard mới chặn nhầm chính luồng nó sinh ra để bảo vệ** — verifier bắt ở vòng 1:
  `checkFreePlan` (merchant tự bấm Downgrade) bị chặn bởi *"shop đang trả tiền thì không tạo charge
  Free"*. Cách sửa **không** phải rải `allowDowngrade: true` khắp call site mà sửa thẳng định nghĩa
  `isDowngradeToFree`. Verifier FAIL tiếp vòng 2 ⇒ dừng, hỏi user thay vì tự cho thêm lượt —
  và câu hỏi *"guard này bản của CTO có không?"* **đảo ngược khuyến nghị**: guard là của alpha.12,
  đọc cách CTO gọi nó mới lộ ra ý đồ thiết kế ⇒ hoá ra là **lỗi hiểu, không phải lỗi code**
  (sửa changelog, không đụng dòng code nào).
- **`alpha.8` chưa từng được publish** — registry chỉ có `alpha.1,2,3,5,6,7,9`, nội dung alpha.8
  nằm trong changelog của alpha.9 ⇒ so version phải **hỏi registry**, đừng tin changelog.

## Techniques / gotcha

- **Hai biến env là hai quyết định khác nhau, không phải một cờ bị tách đôi:**
  | Biến | Quyết định gì |
  |---|---|
  | `SHOPIFY_EXPIRING_OFFLINE_TOKEN` | khi app **xin** token (shop cài mới / re-exchange) thì xin loại hết hạn |
  | `SHOPIFY_AUTO_MIGRATE_OFFLINE_TOKEN` | shop **đã có** token không hết hạn thì có tự chuyển sang loại mới ở lần merchant ghé kế tiếp không |
- **Chuyển sang mặc định BẬT làm biến CI trở thành thừa** — deploy vào slot nào cũng tự bật, không
  phải gắn biến cho từng slot, cũng không cần chiếm cả 4 slot staging. ⚠️ Còn một chỗ **chưa xác
  minh / còn treo**: logic parse cờ hiện tại khiến `=TRUE` hoặc `=1` **tắt** cờ thay vì bật — đã
  nêu, chưa chốt sửa.
- **Slot staging neo theo `STAGING_BRANCH` trong `.gitlab/ci/staging.yml`** — pipeline
  `deploy:staging_1` chỉ chạy cho nhánh ghi ở dòng đó. Push nhánh mới mà quên đổi dòng này thì
  **pipeline im lặng không chạy**. Cả 4 slot lúc đó đang bị nhánh người khác chiếm.
- **Sửa tập trung `makeGraphQlApi` + `initShopify` là gần đủ nhưng không đủ** — quét rộng
  (header `X-Shopify-Access-Token` dựng tay, `fetch` thẳng `/admin/`, bulk operation) vẫn lòi ra
  **3 chỗ ngoài hai đường đã biết**. Đúng nếp [[feedback-follow-conventions]].
- **Kiểm tên option app truyền có khớp tên core đọc không** — sai một chữ thì cờ bật mà vô tác dụng,
  và hỏng im lặng. Xác minh tận `verifyToken.js` (đọc cả hai cờ cho nhánh migrate) và
  `authController.js` (dùng `expiringOfflineToken` khi exchange).
- **Cache key `valid-access-token:${shopifyDomain}`** — verifier xác nhận không rò token chéo shop.
  Cache đặt ở **app**, không ở core (app khác không dùng Redis).
- Trước khi code: **đo baseline gate** trên đúng nhánh sẽ làm (5 violation `yarn check` + 2 suite
  fail đều pre-existing), không tin số ghi trong brief cũ.

## Context

- **`/looptasks` bookkeeping mục ruỗng**: phần lớn task còn `[ ]` trong `BRIEF.md` thực ra **đã hết
  hiệu lực từ lâu, chỉ chưa ai đóng sổ** — loop không chạy chứ không phải chạy mà không xong.
  Dọn một lượt đóng 8 task (2 task lock chết đã commit+push chỉ chưa mark, 6 task bị việc khác thay
  thế), còn 2 task mở / 13. ⇒ *file state của loop tự thối theo thời gian; phải dọn định kỳ, đừng
  đọc `[ ]` như "còn phải làm".*
- Task bị **gỡ khỏi `BRIEF.md`** (task 6 — webhook `products/delete` dọn mirror) vẫn được archive
  sang `BRIEF-done.md` đánh dấu 🚫 **kèm phần phân tích root cause**, để sau không điều tra lại.
- **3 session còn lại trong lượt mining này là việc cũ đã ghi** (build installment/widget custom cho
  stringflags + reformlabs, SB-14456 `recurringCycleLimit`, discount không bake vào contract) — đã
  nằm ở [[digest-subscriptions-2026-07-20]], [[digest-subscriptions-2026-07-21]],
  [[digest-subscriptions-2026-07-27]], [[digest-subscriptions-2026-08-09]]. Không lặp lại.
  Một chi tiết đáng nhớ duy nhất chưa ghi: **sửa `InlineProduct` (component dùng chung) để chữa
  tooltip đã làm sai giá ở màn list Subscriptions** ⇒ phải revert 3 file. Sửa component dùng chung
  để chữa một surface thì phải kiểm **mọi surface đang dùng nó**.

## Liên quan

[[digest-subscriptions-2026-08-11]] · [[2026-08-11-dong-core-rieng-joysub]] ·
[[shopify-token-exchange-migrate-offline-token]] · [[shipped-subscriptions-2026-08-12]] ·
[[avada-core]] · [[bang-chung-phan-biet-duoc]] · [[feedback-follow-conventions]] ·
[[feedback-git-guard-chi-chan-master]] · [[subscriptions]] · [[looptasks-vs-workflow]] ·
[[feedback-dung-loop-khi-rong]]
