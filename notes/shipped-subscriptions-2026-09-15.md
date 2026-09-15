---
type: note
title: Shipped Joy Subscription — commit landed 2026-09-14 (v2.35.27→29) + nhánh bundle sync đổi hướng
summary: Master nhận 4 merge trong ngày (Bird `v2.35.27`, email daily cap `v2.35.28`, giá dòng bundle `v2.35.29`, mockup/PRD); khối lượng thật nằm trên nhánh — sync fixed bundle vào contract bỏ hẳn job ghi ngược để về resolve muộn, và một MR đã merge ghi đè biến `STAGING4_BRANCH` của người khác.
tags: [avada, subscription, shopify, backend, architecture, billing]
created: 2026-09-15
updated: 2026-09-15
source: repo `subscriptions` — git log 2026-09-09 → 2026-09-14 (hash đã verify)
---

# Shipped — `subscriptions`, commit landed 2026-09-14

Note này chỉ ghi **cái gì đã đáp xuống đâu**. Root cause và cách chẩn đoán đã nằm ở
[[digest-subscriptions-bird-2026-09-14]] và [[digest-subscriptions-2026-09-14]] — không chép lại.

## Shipped

### Vào `master`

| Merge | Tag | Việc |
|---|---|---|
| `9ad76276d` (!2581) | `v2.35.27` | Bird/Parcely: gửi đúng location, thôi đóng băng ngày giao. Chi tiết: [[digest-subscriptions-bird-2026-09-14]] |
| `8650fa283` (!2538) | `v2.35.28` | Cap 1000 email/shop/ngày cho SMTP tự cấu hình + outbox bền |
| `43f20e0a4` (!2582) | `v2.35.29` | `fe - bundle` — dòng và tổng đọc **cùng một nguồn giá** (SB-16764), branch commit `44fe394fb` |
| `c11c4407a` (!2583) | — | Cập nhật mockup-app + PRD (`5461d72a6`): BookCallModal, ConciergeCallCard |

Chi tiết `v2.35.29` (`44fe394fb`): widget Fixed Bundle hiện giá dòng từ `baseSubPrice` (bỏ qua
discount của plan) còn tổng từ `originalTotal` (có áp) — lệch lộ ra ngay khi bỏ tick một item làm
bundle tụt dưới điều kiện. Gom cả ba chỗ render về `getBundleLinePrice`/`getBundleTotalPrice`. Kéo
theo 2 lỗ cùng loại: `calculateDiscountedPrice` bỏ `prepaidMultiply` khi plan không có discount, và
`calculateTotalPrice` vẫn giảm giá khi bundle không còn đủ điều kiện.

### Còn trên nhánh (chưa vào master)

**`feat/migrate-simple-bundles-to-fixed-bundle` — di trú Simple Bundles → Product Fixed Bundle**
(khối lượng lớn nhất của đợt này, chưa có note nào trong brain):

- `60445f0c3` command migrate bundle, giữ nguyên parent product/handle. Hai thiệt hại đo được trên
  store test và đã vá: `productSet` **xoá sạch metafield không nằm trong payload** (mất 4 metafield),
  và `buildVariant` hardcode `inventoryItem.tracked=true` làm **54/64 bundle thật thành hết hàng**.
- `b2070790c` command vá contract bán từ thời Simple Bundles (1 line cha, không attribute) →
  `applySwapBundleExpansion` + `keepParentPrice` để không ghi đè giá cũ. Lọc theo status **của
  Shopify** chứ không của Firestore: app cancel = Shopify `PAUSED` (đo 171 contract: 14 CANCELLED +
  2 EXPIRED đều PAUSED phía Shopify).
- `a40d9d86b` runbook 8 bước + tài liệu; số production: 63/64 bundle migrate được, 21 contract cần vá.
- `c76b2a476` feature sync component của bundle xuống contract (85 file).
- `09ae37859` gate mọi nhánh sync sau cờ `enabledSyncBundleToContracts` — 3 chỗ vẫn chạy cho shop
  đang **tắt cờ**, trong đó một chỗ làm sống lại nhánh code chết và đổi hành vi thật của khách cũ.
- `4f75c4ed5` **đổi hướng**: bỏ job ghi ngược, về resolve muộn thuần đọc → [[2026-09-15-bundle-sync-resolve-muon]].
- `81b6b5b73` · `121bd09e0` · `2aa47bbc3` · `e77bed382` quét nốt các nơi đọc còn sót (4 đường admin,
  new CP, old CP) và giữ lại nhãn variant của dòng con. Kiểm trên contract thật `63181160685`,
  `63175852269`, đơn `#JOY1359-3`.

**`feat-email-daily-cap`** — `1e8ab79be` (SB-16673) phân loại lỗi SMTP transient vs permanent:
Mailtrap trả `550` cho một throttle **tạm thời**, code cũ đốt 5 attempt rồi `failed` + **xoá payload**
⇒ mail mất vĩnh viễn dù upgrade plan. Thêm `smtpErrorClass.js` (kiểm PERMANENT trước RATE_LIMIT), bộ
đếm `retries` không bị hoãn để giãn backoff, và trần tuổi 72h là thứ duy nhất kết thúc một delivery.
`40be00e28` bớt chi phí Firestore (projection, cron `* * * * *` → `*/5`, tách quota Verify SMTP
riêng cap 20, 10 index exemption).

**`feat/customer-portal-ui`** — `49a64b461` (106 file): tích hợp **Froonze** (trang Settings mới,
`integrationsController`, xử lý `shopMetafield` ở `backgroundHandler`, 7 file locale) + tách bản
`*Hosted` cho ~12 component portal. Chưa có note nào trong brain nhắc Froonze.

**`fix/bird-delivery-attrs`** — `537c6b418` (test đỏ trước, 4 ca lấy từ contract live) → `032e03755`
(fix) → `554116f61` (bỏ fallback postcode) → `e17f22a66` (backfill) → `24294268d` (trim comment) →
`005c5eea7` (script đọc `--apply` thành shop domain).

**`feat/wholefoods-portal`** — `435460bbd` vòng parity cuối, đã ghi ở [[digest-subscriptions-2026-09-14]].

## Reverted / đảo hướng

Không có `git revert` nào trong đợt này. Hai lần **đảo hướng trong cùng nhánh**:

1. `4f75c4ed5` bỏ job `REBUILD_UPCOMING_ORDERS_AFTER_BUNDLE_SYNC` do chính `c76b2a476` dựng — xoá
   `bundleSyncRebuildService`, `bundleOfferProductsChanged`, const + topic tương ứng, và gỡ
   `bundleSyncSource` khỏi cả 5 đường ghi. Tách thành quyết định riêng:
   [[2026-09-15-bundle-sync-resolve-muon]].
2. `554116f61` bỏ fallback "location nào có postcode trùng khách" mà chính `032e03755` vừa thêm:
   delivery zone đều đăng ký ở địa chỉ kho nên fallback không bao giờ bắn cho chúng, còn pickup point
   thì postcode nói **kệ hàng ở đâu**, không nói khách ở đâu — người Alderley nhận hàng ở Kedron.
   Đây là sửa trong ngày, không phải đổi hướng kiến trúc.

## Deploy notes

- **Không commit nào mang `[deploy-functions]`** trong đợt này.
- 3 lần bump version: `v2.35.27` → `v2.35.28` → `v2.35.29`.
- `firestore.indexes.json` đổi ở `40be00e28` (+50 dòng `fieldOverrides`) — đã vào master theo !2538,
  cần deploy index cùng lượt chứ không chỉ deploy functions.
- **⚠️ `7ab0e752c` (merge master vào `feat-email-daily-cap`)** ghi rõ: MR này merge vào master sẽ
  **GHI ĐÈ biến `STAGING4_BRANCH`** mà Philip đã trỏ sang `feature/fix-index-trial` từ 7 ngày trước.
  MR **đã merge** (`8650fa283`) — cần kiểm lại giá trị `STAGING4_BRANCH` trên master.
- staging-3 bị các nhánh giành nhau trong ngày: `3a22b5008` → `01ba15e52` → `4ea4e9324` (redeploy vì
  nhánh khác deploy đè lên).
- 5 command/migration mới, **không tự chạy**, phải gọi tay: `migrateSimpleBundleToFixedBundle`,
  `migrateContractsToFixedBundle`, `backfillBirdDeliveryAttributes`, `backfillFixedBundleContext`,
  `seedWholefoodsBundleContracts`.
- `005c5eea7` (script backfill Bird đọc `--apply` thành shop domain) vẫn **chỉ nằm trên nhánh**
  `fix/bird-delivery-attrs`, chưa vào master — đúng việc còn treo mà
  [[2026-09-14-backfill-bird-chi-don-chua-charge]] đã ghi.
- `37a6d5801` là **stash untracked**, không phải commit: `chunkRetry.js`, `chunkRetryBootstrap.js`,
  `cdnCacheBust.js` + preflight chunk-404 (SB-16672). Chưa nằm trên nhánh nào — mất stash là mất hết.

## ⚠️ Cần xác nhận

**1. Email daily cap: 3 blocker của review, ship với 2 cái chưa xử.**

- [[digest-subscriptions-2026-09-14]] ghi 3 blocker đã nêu trong comment MR: (a) outbox nằm trên
  hot path của **mọi** email chứ không chỉ email vượt cap (~99,99% email đi vòng qua tầng không cần),
  (b) lưu HTML vào Firestore doc + single-field index, phải có TTL, (c) đếm cap bằng Firestore trong
  khi prod đã có Redis.
- Commit `40be00e28` nói thẳng: *"Điểm 1 và 2 KHÔNG làm ở đây, lý do trong mô tả MR"* — nó chỉ xử
  điểm 4–7 (projection, cron, quota verify, index exemption). Counter vẫn ở Firestore.
- MR `!2538` vẫn **merge vào master** thành `v2.35.28`.
- Cần xác nhận: hai blocker (a) và (c) được **chấp nhận có chủ đích** (và lý do là gì), hay chúng
  đang là nợ chưa ai theo dõi. Ghi chú lệch nhau giữa note review và trạng thái prod là thứ 3 tháng
  nữa sẽ không ai nhớ.

**2. Backfill Bird: "không redate" vs script vẫn redate mặc định.**

- [[2026-09-14-backfill-bird-chi-don-chua-charge]] chốt: *"Không redate: phần ngày đã lỡ sửa trong
  lượt trước được khôi phục từ snapshot"*, lý do là app tự tính lại ngày ở lần charge kế.
- Commit `e17f22a66` (script backfill, đã commit trên nhánh) mô tả ngược lại: *"Only a contract whose
  date is provably frozen is stepped forward… Uncharged cycles are redated from the corrected
  attributes using the same helpers the billing flow uses"*.
- Hai câu này nói về **cùng một script**. Khả năng cao là quyết định được chốt **sau** khi script đã
  viết xong và script chưa gỡ nhánh redate. Cần xác nhận: lần chạy `--apply` tới có redate không, và
  nếu không thì phải gỡ/tắt nhánh đó trong script chứ không dựa vào người chạy nhớ.

Liên quan: [[subscriptions]] · [[2026-09-15-bundle-sync-resolve-muon]] ·
[[digest-subscriptions-bird-2026-09-14]] · [[digest-subscriptions-2026-09-14]] ·
[[2026-09-14-backfill-bird-chi-don-chua-charge]] · [[shipped-subscriptions-2026-09-12]] ·
[[redis-queue-khong-dung-chung-instance-cache]]
