---
type: note
title: Joy Subscription — commit landed 2026-08-20
summary: Master nhận 4 MR (3 code: discount name field volume bundle, mang discount code + manual discount cấp order qua đường import Appstle; 1 mockup/PRD) mà KHÔNG có tag/version bump nào; khối lượng thật trên nhánh — landing joyxjoy chạy được thật trên store dev, 2 lát CLS Home đảo hướng so với audit 08-19, banner validate theme cho portal, và bộ e2e/QA recon.
tags: [avada, subscription, shopify, storefront, performance]
created: 2026-08-21
updated: 2026-08-21
source: repo `subscriptions` (avada/subscriptions) — git log 2026-08-20, hash đã verify
---

# Joy Subscription — commit landed 2026-08-20

Tiếp nối [[shipped-subscriptions-2026-08-20]]. Root cause của cụm landing đã ghi ở
[[digest-subscriptions-joyxjoy-2026-08-20]] — ở đây chỉ ghi cái gì **landed**.

## Shipped

**Master — 4 MR, không tag, không version bump**

| MR | Hash | Nội dung |
|----|------|----------|
| !2487 | `4d393bf99` | thêm field discount name cho volume bundle (fe/be) |
| !2490 | `615d99767` | mang line discount code đi qua đường import subscription |
| !2491 | `0e8892db1` | command discount cấp order + `appliesOnEachItem` + 2 discount/line |
| !2492 | `a97cecb46` (`2bf6dde28`) | mockup-app + PRD của BA (customer portal settings, volume bundle, aov-volume-setup) |

_(Attribution master/nhánh đọc từ ref annotation + dòng "See merge request" trong log;
không truy cập được repo để `merge-base` lại.)_

**Import contract từ Appstle — hai lỗ hổng tiền thật (`038c037a0`, `f070123b4`)**

- `appliesOnEachItem` bị hardcode `false`. Đơn thật FIN1319 (qty 2, giá 60) có
  `allocationMethod EACH value 10 USD` → allocation thật là **20**, không phải 10 ⇒ với mọi
  line qty ≥ 2, importer trừ sai đúng một nửa. Cờ giờ đọc từ cột
  `line_variant_manual_discount_each`, và validation **bắt buộc** dòng fixed phải khai — mặc
  định im lặng là tự chọn hộ merchant một con số. Percentage không có field này nên cờ bị bỏ
  qua (có test khoá).
- Fixed discount **không** được quy đổi tiền tệ: khai 10 USD thì đơn SGD nhận 10 SGD. Xác
  nhận trên 4 đơn thật.
- Một line có thể mang **hai** discount (7 dòng FINLEY qty ≥ 2 mang cả FINLEY LEGACY fixed
  lẫn Volume %) → thêm bộ cột `_2_`, payload nối hai bộ, bộ trống thì bỏ. Tương thích ngược:
  dòng không có cột discount cho payload y hệt (test cũ khoá).
- `f070123b4` — discount **cấp order** ("MBS DISCOUNT", 20% trên cả order) không gắn được lúc
  import vì `SubscriptionContractAtomicCreateInput` không có field manual discount cấp
  contract. Phải mở draft sau khi contract tồn tại:
  `subscriptionContractUpdate` → `subscriptionDraftDiscountAdd(entitledLines {all:true})` →
  `subscriptionDraftCommit`. Phần đắt nhất là **idempotency**: mutation không có dedupe key,
  chạy lại lần hai thì hai discount chồng nhau (60 × 0.8 × 0.8 = 38.40 thay vì 48; trên 64
  contract ≈ 1.230 SGD giảm thừa) ⇒ đọc lại contract trước, bỏ qua nếu đã có discount cùng
  title. `findContractDiscountByTitle` tách thành helper thuần 18 test vì đó là thứ **duy
  nhất** chặn khoản tiền đó.
- Ba mutation viết thẳng trong command thay vì import `contractService`/`discountService`:
  require một trong hai kéo theo `billingCycleService → backgroundHandler → index.js →
  handlers/api.js`, file đó gọi `@avada/shopify-api initialize()` và chết nếu thiếu
  `API_KEY`. Script migration không nên phải boot cả entrypoint Firebase.

**Nhánh `feat/joyxjoy-landing` — trang chạy được thật trên store dev**

- `f5e3ef4dc` — 5 nguyên nhân độc lập của "trang trắng" (thiếu metafield definition, Liquid
  thiếu `.value`, collection setting lưu handle trần, sản phẩm chưa publish, bundle JS không
  tải được vì `https://localhost:3001` bị chặn) + 2 bug UI chỉ lộ trong theme thật
  (`div:empty{display:none}` của khách ẩn ô ảnh; `1fr` không có `min-width:0` nên tràn ngang
  ở 10/10 bề rộng). Chi tiết ở [[digest-subscriptions-joyxjoy-2026-08-20]].
- `80bb5d6f8` — section Liquid + template page đặt trong `docs/joyxjoy-theme/` (ngoài mọi
  build path nên không thể lọt vào bundle). Bug đáng giá nhất: `eager_product_limit` sinh
  mảng **bị cắt im lặng** — Liquid `collection.products` không `{% paginate %}` chỉ trả tối đa
  50 item, mà FE chỉ lazy-fetch khi mảng RỖNG ⇒ item vượt ngưỡng mất vĩnh viễn. Chốt hai lớp
  độc lập: schema `max:50` **và** gate Liquid hardcode `products_count <= 50`.
- `962cda13b` + `b9e8df12e` — 2 script clone catalog/fixed bundle từ store khách sang store
  dev. Bản fixed-bundle đi **qua route HTTP thật** của app (`POST /apiSa/apiSa/fixed-bundle`
  với Firebase ID token) để mọi hook phụ tự chạy — hướng đã chốt ở
  [[2026-08-20-seed-dev-qua-luong-http-that]]. 3 box không tạo được vì cùng phụ thuộc một
  `productId` đã bị xoá trên store khách.
- `e4c7cca49` — lưới `repeat(auto-fill, minmax(240px,1fr))` thay 2 media query: breakpoint cũ
  tính theo bề rộng **màn hình** trong khi lưới sống trong **cột trái** hẹp hơn đúng 380px.
  Cộng bar dính đáy + bottom sheet cho ≤960px (mockup chỉ vẽ desktop).
- `c4c9bc0ab` — ô search thu gọn 42px theo mockup + đếm kết quả, tái dùng `filtered.length`
  có sẵn nên không thể lệch hai con số; `handleBlur` đọc `event.target.value` chứ không đọc
  prop (controlled component, prop chưa kịp cập nhật lúc blur).

**Nhánh `feat/portal-preview` — chặn merchant rơi vào trang trắng**

- `fb191be7b` — banner validate theme + disable nút preview khi chưa setup.
  `appBlockStatus` là **tri-state**: `undefined` (không đọc được theme) tính là *chưa sẵn
  sàng*. Dismiss banner **không** enable lại nút — điều kiện enable bám trạng thái theme,
  không bám việc banner còn hiện hay không.
- `d39e775ab` — `getCustomerAccountExtensionPageUuid` **bỏ hẳn** nhánh fallback
  `pages.find(p => p.appExtensionUuid)`: nhánh đó không lọc theo app nên store đã add
  customer-account page của app khác sẽ trả uuid của app kia ⇒ admin tưởng portal đã setup
  xong. `CustomerAccountAppExtensionPage` không expose field nào chỉ ra app sở hữu, `handle`
  chỉ là uuid lặp lại, nên **title là tín hiệu duy nhất dùng được**. Merchant đổi tên page sẽ
  bị cảnh báo thừa — hướng sai lệch rẻ hơn nhiều so với link hỏng.
- `ecd7520b6` — preview classic mất customer id vì `renderPortal` merge
  `{...customer, ...(window.AVADA_SUBSCRIPTION.customer || {})}` mà `app-embed.liquid` luôn
  emit đủ key kể cả khách vãng lai (`id: null`) ⇒ `null` đè lên `preview-customer`. Tách
  `mergePortalCustomer` (giá trị từ window chỉ thắng khi thực sự có giá trị) — fix luôn ca
  khách login OTP bị `id: null` xoá mất id thật. Kèm gate 3 Firestore listener trong preview.
- `abc237c8a` — `upcomingFulfillmentOrder` của preview trả `{currentOrder:null, ...}` —
  shape không tồn tại ở backend thật; `isEmpty` đếm entries nên object 3 key `null` KHÔNG
  empty ⇒ mọi detail page preview throw. Test cũ đang assert đúng cái shape sai, đã thay bằng
  regression test dựa trên property mà `showUpcomingOrder` thật sự phụ thuộc.
- `2b2a47bd5` nhận thêm path `/subscriptions/` có trailing slash · `0661e12f3` đổi copy banner.

**Nhánh `fix/cls-home` — 2 lát CLS, xem mục Deploy notes & decision**

- `fef9bac82` — `/shops` không còn strip field integrations khỏi `window.activeShop` và cache
  localStorage. `5dfc63777` (đã ship `v2.34.78`) chỉ sửa **store**; mirror + cache vẫn bị ghi
  đè từ 2 call site khác. Hệ quả đo được: ~24% mẫu report lúc `visibilitychange` (tab đóng
  trước khi integrations về) để lại snapshot **thiếu field** trong localStorage ⇒ lần load
  SAU boot mà không biết widget status → CLS phân bố lưỡng đỉnh (p50 0.022, p95 0.36). Gom
  luật vào `mergeShopSnapshot` áp cho cả 4 call site.
- `772c408bd` — Setup guide chọn variant **trước paint** từ localStorage thay vì chờ
  `/shops/integrations` (3–5s trên prod). Đây là đảo hướng — xem
  [[2026-08-21-cls-home-freeze-variant]].

**Nhánh `feat/auto-test` — bộ QA/e2e**

`5823ee18e` dời portal flow sang admin suite + mở rộng spec subscription/win-back ·
`14ecd1a40` làm lại fixture/helper/playwright config · `acef5051a` 25 file recon spec +
DOM snapshot · `70f0002c6` bug report 2026-08-18 (5 bug kèm screenshot) · `460d21cd7` test
case PRD (win-back, volume bundle, sidekick, mystery product, widget badge) ·
`9d6dc4448` slack notifier + java wrapper cho Allure · `4304ac778` hook/statusline/CLAUDE.md
cho session Claude Code.

## Reverted

Không có revert nào trong log 08-20.

## Deploy notes

- **Không** commit nào mang `[deploy-functions]` / `[deploy-all]` / `[deploy-extensions]`.
- **Không** tag, **không** version bump (`v2.34.79` từ 08-19 vẫn là mốc gần nhất).
- **Không** file migration, **không** đụng `firestore.indexes.json`.
- CI staging bị dời hai lần trong ngày, cả hai đều về cùng một nhánh:
  `2cd9b5b6e` staging 1 → `feat/portal-preview`, `3127d04f7` staging 3 → `feat/portal-preview`
  ⇒ master mất slot staging 3.
- `f5e3ef4dc` ghi một ràng buộc vận hành đáng nhớ: upload bundle lên Shopify Files **không
  hỗ trợ REPLACE cho `GENERIC_FILE`**, mỗi lần upload tạo file mới ⇒ URL đổi mỗi lượt.

## ⚠️ Cần xác nhận

1. **Phạm vi của `v2.34.78` (SET_SHOP merge).** [[shipped-subscriptions-2026-08-20]] và
   [[digest-subscriptions-2026-08-19]] mô tả `5dfc63777` như bản vá đóng lại việc "field bị
   xoá giữa boot ở MỌI lần load", với lập luận "cả 53 call site `setShop()` đã truyền full
   snapshot nên merge là no-op". Commit `fef9bac82` hôm nay nói ngược lại một nửa: nó chỉ sửa
   **store**, còn `window.activeShop` và cache localStorage vẫn bị assign đè từ 2 call site
   riêng, và chính cái cache bị strip đó mới là thứ làm CLS lưỡng đỉnh **qua nhiều lần load**.
   → Cần chốt: note cũ có đang over-claim không, hay đây là một lớp khác của cùng bug?

2. **Hướng fix `metricsFirst`/setup guide.** `10-projects/subscriptions/cls-admin-audit-2026-08-19.md`
   khuyến nghị "trì hoãn render toàn bộ block bằng 1 skeleton chờ CẢ HAI tín hiệu ... không vẽ
   theo nhánh `false` rồi đổi". Commit `772c408bd` **bác cả hai**: gate cả hai variant sau
   `isWidgetStatusKnown` đã làm rồi và "tệ hơn" (chèn card ~450px vào trang đã vẽ, có thể đã
   cuộn), còn skeleton thì vô dụng vì hai variant khác chiều cao nên placeholder cố định chỉ
   *dời* shift chứ không xoá. → Audit 08-19 cần được đánh dấu là đã bị thực nghiệm bác ở mục
   khuyến nghị #1.

3. **Guard `assertIsQuery()` trong 2 script clone.** Cả `962cda13b` và `b9e8df12e` đều ghi
   FINDING **chưa sửa** của verifier: guard chặn mutation lên store khách chỉ là regex
   `^\s*mutation\b` (case-sensitive), lách được bằng comment dẫn đầu hoặc document nhiều
   operation. Hiện vô hại vì chỉ 1 call site dùng literal cố định — nhưng đây là rào chắn
   *duy nhất* giữa script và store production của khách. → Cần chốt siết trước khi thêm bất
   kỳ query nào lên store nguồn.

## Liên quan

[[subscriptions]] · [[shipped-subscriptions-2026-08-20]] · [[digest-subscriptions-joyxjoy-2026-08-20]] ·
[[digest-subscriptions-2026-08-20]] · [[digest-subscriptions-2026-08-19]] ·
[[2026-08-19-page-custom-o-theme-khach]] · [[2026-08-20-seed-dev-qua-luong-http-that]] ·
[[2026-08-21-cls-home-freeze-variant]]
