---
type: note
title: Shipped Joy Subscription 2026-07-24 — chuỗi sửa tên shipping option SB-14649 (fix → backfill → hotfix ghi đè → audit), Grow card revert sau 8 giây
summary: Commit landed 07-24 (v2.34.29→32): backfill tên shipping option [deploy-functions], hotfix chặn backfill ghi đè carrier đúng, fix địa chỉ mất company/zip, portal highlight chờ skeleton; "Grow your subscriptions" card merge rồi revert ngay 8 giây sau; WIP lớn: Mystery Product + bundle sync banner.
tags: [subscription, shopify, shipping, debug]
created: 2026-07-25
source: repo "subscriptions" — git log (hash đã verify)
---

# Shipped — Joy Subscription, commit landed 2026-07-24

Range tag: **v2.34.29 → v2.34.32**. Phần *bài học/root cause* nằm ở [[digest-subscriptions-2026-07-24]]
(mục SB-14649 + backfill ghi đè) — ở đây chỉ ghi *cái gì đã landed*.

## Shipped (merged master)

**Cụm SB-14649 — tên shipping option trên recurring order** (chiếm gần trọn ngày, đọc theo thứ tự):

1. `1442a3bb9` **fix - be - keep origin shipping method name on recurring orders** — bỏ bail-out của `adjustShippingPrice` khi `recurringOption='lowest'`/free (chỉ GIÁ mới phụ thuộc option, TÊN luôn copy), thêm `buildShippingOptionInput()` gửi kèm `presentmentTitle` cho cả 5 call site, `autoUpdateShippingRate` so cả `presentmentTitle` để contract cũ được sửa thay vì skip vĩnh viễn.
2. `18668fdec` **skip redundant shipping option write on contract create** — truyền option Shopify đã lưu ở checkout vào để bỏ write trùng (`updateDraftContract` xoá billing-cycle edit + tốn 4 API call + dội webhook contract-update về).
3. `84a05bd96` / `d0230daf0` **backfill script** `backfillShippingOptionTitle.js` (246 dòng) — merge master qua `040cad016` (tag **v2.34.29**, MR !2394, **[deploy-functions]**). Cố ý KHÔNG đi qua `updateDraftContract` (nó xoá mọi billing cycle edit → mất one-time product & swap khách đã đặt); tự build draft, contract Shopify từ chối thì skip + liệt kê cuối.
4. `c5831e6e0` **hotfix: stop overwriting a correct shipping option** — merge `d901e32f6` (tag **v2.34.30**, MR !2397). Bản fix (1) copy `originOrder.shippingLines[0]` cho MỌI contract; order bán qua pickup point có nhiều shipping line (`[Zásilkovna | GLS kurýr]`) → lấy line đầu là **thay carrier đúng bằng pickup point**, guard idempotency còn làm nặng thêm (thấy mismatch → write). Helper mới `resolveShippingOptionUpdate` sở hữu quyết định, dùng chung contract-create + backfill: option Shopify đã lưu **không bao giờ** bị thay (chỉ vá `presentmentTitle` thiếu); contract trống chỉ nhận line của origin order khi line đó **không mơ hồ**. Dry-run prod trước/sau: `19 scanned, would repair 2 (cả 2 vốn đã đúng)` → `would repair 0, already correct 3`.

**Khác:**

- **fix địa chỉ contract mất company name** — `994d03d6c` merge `b6006e3e0` (tag **v2.34.32**, MR !2398): thêm `company` + `zip` vào address selection của `deliveryMethod` ở 6 chỗ (createContract, resync-upcoming-orders, query billingCycle, contractService, subscriptionContractService, contractSnapshotService). Sửa một chỗ là phải quét hết 6 — kiểu bug "field thiếu trong mọi query GraphQL".
- **fix(fe) portal highlight chờ skeleton tan** — `1c039054b` merge `48d3aa011` (tag **v2.34.31**, MR !2395): effect chạy lúc mount nên pulse cháy trên skeleton của `CustomerPortalVersion`; gate theo `loading` + ref chạy 1 lần/visit, tách auto-clear sang effect riêng theo đúng cờ nó xoá (dùng chung deps → cleanup huỷ pulse đang chạy).
- **fix(fe) `window.activeShop` lệch store** — `d11107dc5`: `setShop` chỉ dispatch + clear cache, không cập nhật mirror; response `/shops/integrations` về muộn (~2.5s) ghi shop *trước khi sửa* lại vào cache → tick "Set up your customer portal" reload là mất dù server đã lưu. Fix: mirror payload trong `setShop`.
- **Mockup-app + PRD** — `d167d88b9` (MR !2392), `764b8a3c0` (MR !2396), source `5625045b7`/`ec45e7b97`: bộ 21 email preview HTML render sẵn + script `render-emails.mjs`, cập nhật mockup fixed-bundle / subscription detail & list. Tài liệu product, không đụng runtime — nhưng là **reference giao diện email** đáng nhớ.

## Reverted

- **"Grow your subscriptions" floating card (MR !2388)** — merge `4a40b98fd`, revert `e1161d71e` **8 giây sau khi merge** (theo mô tả ở `ee0e3c573`). Revert xoá `GrowSubscriptionsCard` (js/json/scss), `JoyMark`, `const/customerPortal/highlight`, `useBookCallEligible`, thay đổi HelpDesk + 7 file locale (−1222 dòng).
  - Commit gốc còn sống trên nhánh: `cc947f05b` (deep-link `?highlight=version` + pulse card portal version, dùng Polaris focus token và tôn trọng `prefers-reduced-motion`), `ea8c86466` (rút gọn CTA — ghi chú: dịch máy mất ngữ cảnh, "Set up" thành danh từ ở fr/es, nghĩa vật lý ở de).
  - **Bẫy merge đáng nhớ** (`ee0e3c573`): commit gốc vẫn nằm trong history master, nên khi merge master vào `feat/onboading-v5` git đọc revert là "master xoá file, branch không đụng" → **âm thầm giữ trạng thái xoá**, chỉ lộ ra qua đúng 1 conflict ở `CustomerPortal.js`; merge nguyên xi là vỡ build (`CustomerPortal` import `const/customerPortal/highlight`, `Home` import `GrowSubscriptionsCard`). Phải chủ động restore mọi path revert đã đụng về bản của branch.

## Deploy notes

- **`[deploy-functions]`**: `040cad016` (v2.34.29) — backfill script shipping option → ép CI deploy full.
- **Version bump**: v2.34.29 → v2.34.32 (4 tag / 1 ngày).
- **Migration / script vận hành** (chạy tay, chú ý thứ tự):
  - `backfillShippingOptionTitle.js` — luôn `--dry-run` trước; sau hotfix v2.34.30 mới an toàn chạy (bản trước ghi đè carrier đúng).
  - `auditShippingOptionDamage.js` (`dfa83e46c`, 216 dòng) — sweep read-only tìm contract bị bản cũ ghi hỏng; bỏ qua order có nhiều line **trùng tên** (`[GLS kurýr | GLS kurýr]` là chuyện thường khi tách delivery group). Chạy trên `eb18c0-00`: 19 contract, 0 nghi phạm.
  - `inferCarrierFromHistory` (`8e87e51f3`, nhánh `feat/shipping-audit`, **chưa merge**) — contract import không có shipping option lẫn origin order → đoán carrier từ CHECKOUT order cũ của chính khách; lịch sử 1 carrier = confident, đổi carrier = flag và skip trừ khi `--include-ambiguous`. Áp cho `eb18c0-00`: 10/16 contract sửa được, còn 5 ca "Free" + 1 ca đổi qua lại chờ merchant xác nhận.
- **Index Firestore mới** đi kèm 2 nhánh WIP (`firestore.indexes.json`: +18 dòng ở bundle sync, +54 dòng ở Mystery Product) — phải deploy index trước khi feature lên.

## WIP (chưa merge — theo dõi)

- **Mystery Product** `310d2d1d0` (nhánh `feat/discovery-product`, 97 file, ~9.3k dòng) — feature lớn nhất đang chờ: rotation theo cycle (`mysteryRotation`, `applyRotationToOrders`, `getMysteryCycleConfig`), service/repository/controller + middleware validate, `createMysteryProduct` command, tag line mystery, ẩn sản phẩm ở upcoming order & customer portal, 7 locale × 115 dòng, ~15 file test. Nối tiếp mạch Discovery Product ở [[shipped-subscriptions-2026-07-24]].
- **Bundle synchronization cho contract** `ab28ca63b` (nhánh `feat/bundle-no-plan-banner`, 60 file) — sync bundle sang contract đang chạy: `bundleContractsSyncService` + `syncBundleToContract`, endpoint sync + activity, `SyncProgressBanner` + `UpdateSubscriptionsModal` (bulk update sang product bundle mới), polling activity, khoá sửa line khi đang sync, `DEV_ONLY_upcomingOrdersFirestore` + `start-local-emulators.js` cho local dev.
- **Onboarding V5 / Grow card** `3f158e1ea` = `a32b8931c` (dismissal Grow card về field `dismissGrowCard` trên shop doc thay localStorage — `PUT /shops` không `?type=` ghi thẳng key lạ, `presentShop` trả lại nên không cần đổi backend; kèm fix scrollbar ngang thừa ở Safari do khai báo mỗi `overflow-y: auto` + `margin: 0 -8px`).

## Bỏ qua (noise)

`c60cacb99` / `9fce7d486` / `584976a90` "Trigger deploy staging 4" (đổi 1 dòng để kích CI) · `4f5807b53` merge master vào branch · `a32b8931c` trùng nội dung `3f158e1ea` · `d0230daf0` trùng `84a05bd96`.

## Liên kết gợi ý

[[subscriptions]] · [[digest-subscriptions-2026-07-24]] · [[shipped-subscriptions-2026-07-24]] · [[shipped-subscriptions-2026-07-23]] · [[subscriptions-debug-runbook]] · [[subscription-work-style]] · [[shopify-app-dev]] · [[digest-artifact-2026-07-24]] (bước hosting/artifact khi release)
