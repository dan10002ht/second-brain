---
type: note
title: Shipped Joy Subscription — commit landed 2026-09-10
summary: Sáu tag trong một ngày (v2.35.19→v2.35.24, MR !2569/!2572/!2573/!2574/!2575/!2576) — hai lượt vá cart drawer theme, hai cờ DevZone, và bộ vá CDN chunk 404 gồm cả thay đổi CI mà thứ tự deploy là load-bearing; không revert trên master, không migration, không `[deploy-functions]`, nhưng có `[deploy-extensions]` đẩy lại toàn bộ 30 extension.
tags: [avada, subscription, shopify, extensions, cdn]
created: 2026-09-11
updated: 2026-09-11
source: repo `subscriptions` — git log (mọi hash dưới đây lấy thẳng từ log, đã verify, không suy đoán)
---

# Shipped — `subscriptions`, ngày 2026-09-10

Root cause và bối cảnh của phần cart drawer + chunk 404 đã ghi ở
[[digest-subscriptions-2026-09-10]]; cờ DevZone hide-recurring ở
[[2026-09-10-devzone-hide-recurring-pricing]]. Note này chỉ ghi **cái gì landed ở đâu**, kèm hash.

## Shipped

**Trên `master` (`origin/master` = `2cb46d326`) — 6 tag liên tiếp:**

| Tag | Merge | Việc |
|-----|-------|------|
| `v2.35.24` | `2cb46d326` (!2576) | `[deploy-extensions]` — đẩy lại bundle loader của theme app extension |
| `v2.35.23` | `37bb80a6f` (!2575) | fix widget trắng vì chunk 404 trên CDN + khôi phục cache bundle |
| `v2.35.22` | `834a90f09` (!2574) | cờ DevZone mở khoá rich text editor theo shop |
| `v2.35.21` | `ddf125d6c` (!2573) | cờ DevZone ẩn giá định kỳ ở checkout |
| `v2.35.20` | `1d8d096df` (!2572) | mở cart drawer của theme Minimog sau khi add bundle |
| `v2.35.19` | `af74c92cd` (!2569) | mở cart drawer theme sau khi add bundle (lượt đầu) |

**Chi tiết theo cụm:**

- *Cart drawer, hai lượt.* `48c8bf30b` (SB-16667, dentalaccess) mở drawer khi `redirectTo = "stay"`,
  thêm event `cart-update` + pub/sub Dawn, và thay selector đơn của `DisplayManager` bằng danh sách
  dùng chung; `86ba8fbe0` dọn comment thừa (−48 dòng). Lượt hai `1350ab449` / `9fbfa3901` (cùng nội
  dung, hai nhánh) thêm đúng **một** selector `<m-cart-drawer>` của Minimog — 1 dòng code + 1 test.
- *CDN chunk 404 (SB-16672).* Test viết trước và đỏ tại `8ee91d402`. Bản vá `bbfff20ab` hai lớp:
  webpack chunk loader retry **một lần** bằng URL cache-bust (chỉ nhánh `error`, không retry
  `timeout`), và CI đẩy lên CDN đúng **bộ chunk đã merge** như Firebase Hosting — trước đó CDN chỉ
  giữ build hiện tại nên mọi hash cũ 404 ngay tại origin. Vì chunk cũ được giữ lại, loader không còn
  cần `?v=Date.now()` mỗi page load (~110KB/lượt, MISS 100%).
- *Bucket cache-bust.* `bbfff20ab` chốt bucket **1 giờ**, `1dfd5e7f2` trong cùng MR hạ xuống **5
  phút** vì một giờ là quá chậm cho hotfix widget. Chỉ hằng số đổi; test đọc hằng số nên phủ cả hai
  giá trị. Bản đang chạy là **5 phút**.
- *Hai cờ DevZone.* `3264fda9c` bỏ `pricingPolicies.recurring` cho plan 2 tier khi
  `shop.hideRecurringPriceAtCheckout` bật + action "Re-push selling plans" (`resyncSellingPlanPolicies`);
  `22c80e794` thêm `enableRichTextEditing` gỡ khoá read-only của rich text editor cho một shop, có
  audit hai chiều `RICH_TEXT_EDITING_UNLOCKED` / `_RELOCKED` → [[2026-09-10-devzone-mo-khoa-rich-text]].
- *Refactor.* `e8177b4ac` — `sellingPlanVariables` nhận **options object** thay cho 4 tham số vị trí
  (tham số thứ 4 nằm sau một tham số có default, bỏ sót `false` là bật nhầm `forceLegacyVersion`).
  11/11 call site đã đổi, gồm test đang assert theo `mock.calls[0][0]`.
- *Gate.* `dbce756f9` — scanner import webhook match `from "unresolved"` trong một dòng JSDoc rồi báo
  thiếu npm package; nay strip comment khối/dòng trước khi quét, giữ `//` giữa dòng code để URL trong
  string sống sót.

**Trên nhánh, chưa vào master:**

- `feat-email-daily-cap` — `4c08d30b5` (SB-16673): 11 email hoãn qua ngày thì 6 chết vì
  `550 Too many emails per second`. Ba khiếm khuyết cộng hưởng thành thundering herd: `claimDelivery`
  đặt `availableAt` vào **đúng một** mốc nửa đêm UTC, `processDeferredEmails` `Promise.all` cả batch
  100 doc, retry khoảng cố định 5 phút không jitter. Vá bằng `mapWithConcurrency` (3 send đồng thời),
  backoff mũ + jitter (5/10/20/40/60 phút, budget trải ~2 giờ thay vì 23 phút) và `spreadDeferUntil`
  rải mốc nửa đêm trong cửa sổ 30 phút với offset luôn ≥ 0 (không thủng cap).
  → [[dong-bo-chan-luong-khong-phai-chuyen-hieu-nang]]
- `reward-consts` — 4 MR gộp vào nhánh tích hợp, **không** phải master: `!2567` (`9e79b91ef` ←
  `aa99b83d6`) bắt buộc `decoded.sub`, bỏ fallback `orderId` ⇒ vá IDOR ở reward public controller;
  `!2568` (`00025d2e2` ← `ae5b86eaa`) màn create/edit campaign; `!2570` (`309b23f28` ← `2a1bb00e3`)
  extension `reward-thank-you` (14 file, target `purchase.thank-you.block.render`, đã adapt theo hợp
  đồng endpoint mới của `aa99b83d6`); `!2571` (`59ef0e0b1` ← `42e748223`, `31d060f08`) display
  settings + preview theo channel. Kèm `dc059f2b9` tách sub-component màn list. Đáng nhớ trong
  `42e748223`: PUT settings của nhánh nguồn là **save NO-OP im lặng** (`api()` không tự bọc body,
  controller đọc `ctx.req.body.data`) — response `success: true`, toast "saved", reload về giá trị cũ.
  → [[ack-khong-phai-hieu-ung]]
- `feat/adama-auto-swap-setting` — `a75251a30` (+ `79770efaa`, `d77d8fc76`): rule auto-swap +
  `docs/features/auto-swap/upcoming-order-sync.md`, chạm `swapAllowlist` và
  `subscriptionContractUpdateService`. Commit message trống nghĩa ("Update rule", "Fix UI") nên
  không suy ra được gì thêm từ log.
- `feat/wholefoods-portal` — `1983bf86e`: 9 gate `checkPermissionCustomerPortal` cho Swap / Add /
  Remove / Pause / Cancel / Skip / Change frequency trên 3 page của extension. Đúng cái lỗ
  [[digest-subscriptions-2026-09-09]] đã ghi. Commit tự khai **chưa verify** hành vi chặn: dev store
  bật hết setting nên chỉ chạy qua nhánh cho phép.

## Reverted

Không có revert trên master. Không hotfix, không tag bị rút.

Hai lần đảo hướng đều nằm *trong* một MR, không phải revert sau khi ship: bucket 1 giờ → 5 phút
(`bbfff20ab` → `1dfd5e7f2`), và phương án suy ra từ `autoSwap` bị bỏ trước khi merge (đã ghi ở
[[2026-09-10-devzone-hide-recurring-pricing]]).

## Deploy notes

- **`[deploy-extensions]` ×2** (`f7655c319` commit rỗng + `2cb46d326` merge). Commit rỗng tồn tại chỉ
  để tiêu đề merge mang cờ mà `deploy-shopify-extension:production` gate theo trong
  `.gitlab/ci/production.yml`. Hệ quả: **cả 30 extension redeploy ở trạng thái hiện tại**, dù chỉ 2
  file đổi kể từ lần deploy extension trước (`6d6633ce6`).
- **Thứ tự deploy là load-bearing** (`bbfff20ab` khai thẳng): thay đổi CI phải ship **cùng release
  hoặc trước** loader bucket. Cả hai nằm trong `!2575` và job publish bộ chunk merged trong cùng
  pipeline — nhưng đây là ràng buộc phải nhớ nếu sau này cherry-pick lẻ.
- `358507347` — pipeline **fail ở bước parse config**, trước khi bất kỳ job nào chạy, vì một dòng
  `echo "... CDN:  $SCRIPTTAG_FILES"` không quote: `: ` trong plain scalar làm YAML đọc cả entry
  thành mapping. `yaml.safe_load` **không** bắt được (file parse sạch, chỉ sai shape) — cách kiểm
  đúng là assert mọi entry `script`/`before_script`/`after_script` là string.
- Không có file migration, không `firestore.indexes.json`, không `[deploy-functions]`.
- CDN phục vụ 404 kèm `cache-control: max-age=86400` ⇒ một miss thoáng qua lúc deploy khoá một PoP
  Cloudflare trả 404 cho chunk còn sống **suốt một ngày**. Đây là lý do ticket đầu bị đóng
  "not reproducible" — vùng chưa cache 404 vẫn chạy tốt. → [[caching-layers]]

## ⚠️ Cần xác nhận

**Cửa sổ cache-bust: 1 giờ hay 5 phút?** `bbfff20ab` (và mọi mô tả đọc theo commit đó) nói *"bucketed
by the hour"*; `1dfd5e7f2` cùng MR nói một giờ quá chậm và hạ về **5 phút**, đồng thời sửa
`docs/superpowers/preflight/2026-09-10-cdn-chunk-404-widget-blank.md` (6 dòng). Giá trị đang chạy là
5 phút. Ghi ra đây vì bất kỳ ai đọc `bbfff20ab` một mình — kể cả preflight doc nếu còn sót số cũ —
sẽ tin nhầm sang một giờ khi ước lượng bao lâu hotfix widget tới được shopper.

**`digest-subscriptions-2026-09-10` để ngỏ cơ chế CI của SB-16672** (*"Chi tiết cơ chế CI chưa xác
minh trong note này"*). `bbfff20ab` trả lời: CDN nhận snapshot chụp **trước** khi chunk của các build
cũ được merge vào, nên nó chỉ giữ build hiện tại và mọi hash cũ 404 tại chính origin — Firebase
Hosting thì có bộ merged. Không mâu thuẫn, là bổ sung; nêu ra để khi mature thì gỡ dấu "chưa xác
minh" ở note kia thay vì để hai note nói khác nhau.

## Liên quan

[[subscriptions]] · [[digest-subscriptions-2026-09-10]] · [[shipped-subscriptions-2026-09-10]] ·
[[2026-09-10-devzone-hide-recurring-pricing]] · [[2026-09-10-cutoff-theo-delivery-day]] ·
[[digest-subscriptions-2026-09-09]] · [[caching-layers]] · [[ack-khong-phai-hieu-ung]] ·
[[dong-bo-chan-luong-khong-phai-chuyen-hieu-nang]] · [[khong-cache-response-co-auth]]
