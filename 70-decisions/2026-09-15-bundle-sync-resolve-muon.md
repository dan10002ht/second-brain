---
type: decision
title: Sync fixed bundle vào contract — resolve muộn khi đọc, không ghi ngược vào contract
summary: Bỏ job REBUILD_UPCOMING_ORDERS_AFTER_BUNDLE_SYNC (ghi trước vào orders.lines khi merchant save bundle) để về hướng B thuần — mọi đường đọc tự resolve từ bundle hiện tại, không đường nào ghi Firestore.
tags: [avada, subscription, backend, architecture, patterns, firestore]
created: 2026-09-15
updated: 2026-09-15
status: active
review: 2026-12-15
source: repo `subscriptions` — git log nhánh `feat/migrate-simple-bundles-to-fixed-bundle` (hash đã verify)
---

# Sync fixed bundle vào contract: đọc muộn, không ghi ngược

## Bối cảnh

Merchant sửa thành phần của một Product Fixed Bundle. Câu hỏi: các contract đang chạy — và những
upcoming order đã sinh sẵn — lấy thành phần mới ở đâu ra?

`research.md` của feature chốt **hướng B** (contract chỉ trỏ id, materialize muộn lúc đọc) và loại
**hướng A** (push xuống contract khi merchant save). Nhưng bản dựng đầu (`c76b2a476`) vẫn kèm một
job `REBUILD_UPCOMING_ORDERS_AFTER_BUNDLE_SYNC` ghi trước vào `orders.lines`, vì đường charge đọc
`orders.lines` chứ không đọc bundle. Job đó **chính là hướng A** nấp dưới tên khác.

## Quyết định

`4f75c4ed5` bỏ hẳn job ghi ngược, đưa mọi nơi về resolve muộn:

- Module mới `helpers/subscription/bundleSyncResolver.js` — **thuần đọc, không ghi Firestore**. Trả
  về nguyên xi ở ba trường hợp: shop tắt cờ, contract không đủ điều kiện, bundle đã bị xoá.
- Cắm lazy resolve vào 8 nơi đọc: charge (`shopifyService` 2 chỗ), `getCycleOrderByType`, 4 endpoint
  `clientApi/orderController`, email đơn sắp tới + cảnh báo sắp hết hàng.
- Xoá `bundleSyncRebuildService`, const `bundleSyncRebuild`, `bundleOfferProductsChanged` và topic
  pubsub tương ứng; gỡ `bundleSyncSource` khỏi **cả 5 đường ghi** (`backgroundHandler`,
  `contractService`, `subscriptionService` ×2, `subscriptionContractUpdateService`).

Quét nốt các đường đọc còn sót trong 4 commit sau: `81b6b5b73` (4 nơi phía admin), `121bd09e0`
(`getOne` resolve xong bị ghi đè), `2aa47bbc3` (new CP order detail + old CP list), `e77bed382` (nhãn
variant của dòng con).

## Why

- **Bundle không bao giờ ghi đè contract nữa.** Khi không có đường ghi thì không có kiểu hỏng "ghi
  nửa chừng rồi im lặng" — thứ `bundleSyncRebuildService` chạy trong `backgroundSubscriber` với
  timeout 240s rất dễ dính.
- **Chi phí đo được.** Shop 100 contract sửa bundle: hướng A tốn ~300 call Shopify + ~1000 Firestore
  write mỗi lần merchant bấm Save. Hướng B thuần: 0.
- **Một job ghi trước là một bản sao dữ liệu phải giữ đồng bộ.** Giữ nó nghĩa là có hai nguồn sự
  thật cho cùng một thành phần bundle — và mọi màn hình đọc sót một chỗ là hiện số cũ (đã xảy ra
  thật: `81b6b5b73` phải vá 4 màn admin, `2aa47bbc3` vá thêm 2 màn CP).
- **Đơn đã thu tiền được bảo vệ ở tầng resolver, không ở tầng caller.** `resolveOrderBundleLines`
  lọc `status === UNBILLED` ngay đầu hàm, nên `getOne` mở đơn quá khứ hay `getCycleOrderByType` lấy
  `lastBilledOrder` đều không thể vẽ lại lịch sử theo bundle hiện tại.

## Tradeoff

- **Mất**: mỗi lượt đọc phải trả thêm một bước resolve — chi phí dời từ lúc merchant save (1 lần,
  đắt, nền) sang lúc đọc (nhiều lần, rẻ, đồng bộ). Chưa có số đo cho nhánh đọc; đây là chỗ đáng đo
  lại ở mốc review.
- **Mất**: bề mặt phải quét rộng hơn và **không có gate nào bắt sót**. Bằng chứng: sau `4f75c4ed5`
  còn 4 commit nữa mới hết chỗ đọc sót, mỗi commit là một màn hình khách đã nhìn thấy số sai.
- **Bẫy đã gặp, ghi trong `plan-v3-lazy.md`**: `willSyncEditedCycle` trước đây thành `true` nhờ
  chính job ghi `edited:true` xuống đơn. Bỏ job thì đường charge **bỏ qua bản sửa chu kỳ** —
  `resolveOrderForCharge` phải trả thêm cờ `changed` để cộng vào điều kiện đó. Đây là loại phụ thuộc
  ẩn mà "bỏ một job" dễ làm gãy.
- **Được**: hết rủi ro timeout 240s của `backgroundSubscriber`, hết kiểu hỏng nửa chừng im lặng, và
  đường đọc luôn nhất quán với bundle hiện tại theo định nghĩa chứ không theo độ trễ của job.

## Bằng chứng (hash thật, repo `subscriptions`)

| Hash | Vai trò |
|---|---|
| `c76b2a476` | bản dựng đầu, có job `REBUILD_UPCOMING_ORDERS_AFTER_BUNDLE_SYNC` (= hướng A) |
| `4f75c4ed5` | bỏ job, dựng `bundleSyncResolver`, gỡ `bundleSyncSource` khỏi 5 đường ghi |
| `09ae37859` | gate toàn bộ nhánh sync sau cờ `enabledSyncBundleToContracts` |
| `81b6b5b73` · `121bd09e0` · `2aa47bbc3` · `e77bed382` | quét nốt các đường đọc còn sót |

Kiểm trên contract thật `#63175852269` và `63181160685` (tab Upcoming orders từ "6 products" về
"3 products"), gate 326 suite / 3550 test. **Chưa vào master** tại thời điểm ghi.

## Mốc review 2026-12-15 phải trả lời

1. Chi phí nhánh đọc: resolve muộn có làm chậm charge/portal ở shop nhiều contract không? Có số đo chưa?
2. Còn đường đọc nào sót không — sau 5 lần quét thì lần cuối cùng là khi nào và bằng cách gì?
3. Cờ `enabledSyncBundleToContracts` đã bật cho bao nhiêu shop, hay vẫn tắt toàn bộ?

Liên quan: [[subscriptions]] · [[shipped-subscriptions-2026-09-15]] ·
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] · [[dong-bo-chan-luong-khong-phai-chuyen-hieu-nang]] ·
[[caching-layers]] · [[bang-chung-phan-biet-duoc]]
