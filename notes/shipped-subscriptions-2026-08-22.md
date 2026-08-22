---
type: note
title: Joy Subscription — commit landed 2026-08-21
summary: Master nhận đúng 1 MR dưới tag `v2.34.84` — legacy change-discount plan bị tính giá kỳ đầu cho mọi kỳ nên đơn 2+ thu 30% thay vì 17.36% (JSUB-260820); khối lượng thật là 5 commit landing joyxjoy, trong đó lazy-fetch chưa từng chạy vì gọi `/products.js` (404) thay vì `.json`.
tags: [avada, subscription, shopify, storefront, billing]
created: 2026-08-22
updated: 2026-08-22
source: repo `subscriptions` (avada/subscriptions) — git log 2026-08-20/21, hash đã verify
---

# Joy Subscription — commit landed 2026-08-21

Tiếp nối [[shipped-subscriptions-2026-08-21]]. Bối cảnh landing joyxjoy ở
[[digest-subscriptions-joyxjoy-2026-08-20]] và [[digest-subscriptions-2026-08-21]]; hướng đi chốt ở
[[2026-08-19-page-custom-o-theme-khach]]. Ở đây chỉ ghi cái gì **landed**.

## Shipped

**Master — 1 MR, tag `v2.34.84`**

| MR | Hash | Nội dung |
|----|------|----------|
| !2493 | `af70ff53c` (`fc22efc3a`) | apply legacy change-discount tier price **per cycle** trong billing |

Bug tiền thật, ticket **JSUB-260820**: plan legacy (`enabledChangeDiscount` + `numberBeforeChange`,
không có `discountConfig`) chưa bao giờ được đường billing tính lại theo kỳ, nên **mọi** lần gia hạn tự
động đều thu mức giảm của đơn đầu — đơn 2+ bị tính 30% thay vì 17.36%.

Ba lớp cùng phải sửa, và đó là điểm đáng nhớ: `currentPrice` trong order doc luôn là tier đầu
(`preparePriceOfCycle` lấy `cycleDiscounts[0]`); phần tính lại theo kỳ
(`prepareLineDiscountData` / `isMultiTierPlan`) **chỉ phủ plan `discountConfig`**; còn đường
**automatic billing thì không tính lại gì cả**. Fix: `migrateDiscountConfig` trước khi đếm tier để plan
legacy được coi là multi-tier, migrate line plan để `findApplicableTier(cycleIndex + 1)` chạy đúng, và
`handleAutomaticBillingAttempt` soi gương đường thủ công (`hasMultiTier` vào điều kiện sync).
Cùng họ với chuỗi bug ở [[digest-subscriptions-2026-07-19]] — cùng một hàm `prepareLineDiscountData`,
lần đó thiếu ở một call site, lần này thiếu cả một nhánh plan.

**Nhánh `feat/joyxjoy-landing` / `feat/jw-*` — 5 commit**

- `645f9fb72` — **root cause nằm ngoài dự kiến**: `/collections/{handle}/products.js` (URL code cũ gọi)
  trả **404 trên mọi collection**, kể cả collection đang publish; đường đúng là `.json`. Lỗi bị `catch`
  nuốt nên lazy-fetch **chưa bao giờ chạy** kể từ đầu — đây mới là thứ chặn cả hai bug bên dưới.
  - *Task 26* — tab "All" không tải gì: `handleSetCategory` thoát sớm khi `category === ALL_CATEGORY`, mà
    `activeCategory` lúc mount **chính là** `ALL_CATEGORY`. Ghép với trần `eager_product_limit` 50 ⇒ store
    khách (category 145/211/435 sp) nhận mảng rỗng và search luôn "không thấy gì"; store dev không lộ vì
    mọi category ≤ 25. Fix bằng hàng đợi tải ngầm chạy lúc mount (concurrency 2, ưu tiên tab khách bấm,
    huỷ khi unmount), first paint **không đổi**.
  - *Task 27* — chỉ lấy trang đầu rồi coi là cả category: mặc định 30 sp/trang, `limit=250` chạy đúng;
    `automated-collection` đo thật ra **656 sp** (250+250+156+0). Fix bằng lặp `?page` tăng dần, dừng khi
    trang trả về ngắn hơn limit đã yêu cầu — không phụ thuộc con số cứng của Shopify. Trần an toàn để
    **2000 chứ không phải 500**, vì 500 sẽ cắt đứt đúng cái category 656 sp vừa đo, tức tái tạo chính lỗi
    đang sửa.
  - **Phát hiện chưa sửa:** 14 request cho 7 category — `StapleSection` và `OneOffSection` là hai instance
    `ProductPickerSection` riêng, mỗi cái chạy hàng đợi của mình. Trên store khách là gấp đôi băng thông
    vô ích. Đã ghi thành task riêng.
- `fd625cd74` — tách collection step 2 / step 3 (trước đó `LandingApp` truyền **cùng** một mảng
  `categories` cho cả hai bước nên hai bước hiện y hệt nhau — đúng mục treo của
  [[digest-subscriptions-2026-08-21]]). Thêm 3 block type (`category` legacy / `staple_category` /
  `oneoff_category`), khử trùng theo handle trong Liquid nên payload không nhân đôi. Cộng responsive
  mobile: mốc `@media 535px` lấy từ điểm `auto-fill` tự rớt 2→1 cột chứ không tuỳ tiện, vùng chạm ≥44×44
  làm bằng `::before` trong suốt (phóng to thật sẽ tràn card 152px), `--jw-sticky-top` đo header thật
  lúc mount thay cho số 178px của mockup.
- `db98b9309` — thay việc "mỗi collection một block" bằng 2 setting cấp section kiểu `collection_list`
  (14 block → 0 block trên store dev). **Vẫn giữ** 3 block type vì một lý do thật, không phải tương thích
  ngược: `collection_list` không cho đặt nhãn tab riêng cho từng collection, mà tên collection của khách
  rất dài. Handle có ở cả hai nguồn thì `title` của block thắng.
- `0c9ef5949` — thay 3 emoji bước bằng ảnh sản phẩm thật.
- `92d3ba675` — `BoxCard` thêm vendor + badge save/was; Liquid emit `vendor` và `compare_at_price`.

## Reverted

Không có revert nào trong log 08-20/08-21.

## Deploy notes

- **Không** commit nào mang `[deploy-functions]` / `[deploy-all]` / `[deploy-extensions]`.
- **Không** file migration, **không** đụng `firestore.indexes.json`.
- Một tag duy nhất trong log: `v2.34.84` trên `af70ff53c`.
- **Gotcha vận hành đáng nhớ (`db98b9309`)** — đẩy section và template trong **cùng một** lệnh
  `shopify theme push` thì Shopify kiểm template **trước khi** schema mới của section kịp cập nhật, rồi
  **âm thầm** loại bỏ setting nó chưa biết. Không có thông báo lỗi nào; triệu chứng là `categories = 0` và
  đọc lại template trên theme thấy `staple_collections = undefined`. Phải push section trước, template ở
  lệnh riêng.
- `fd625cd74` bổ sung một giới hạn nữa của schema theme: **tên block cũng bị giới hạn 25 ký tự** như tên
  section, và `shopify theme check` **không** bắt được — chỉ lộ ra lúc push thật. Cùng họ với "25 ký tự áp
  cho cả tên section lẫn id setting" đã ghi ở [[digest-subscriptions-2026-08-21]].

## ⚠️ Cần xác nhận

1. **Bốn tag không có trong sổ.** [[shipped-subscriptions-2026-08-21]] chốt rằng master ngày 08-20 nhận
   4 MR mà **không** tag, không version bump, và `v2.34.79` (08-19) vẫn là mốc gần nhất. Log hôm nay cho
   thấy master đã ở `v2.34.84` — tức `v2.34.80` → `v2.34.83` đã được gắn ở đâu đó mà brain không ghi.
   → Cần chốt: 4 MR của 08-20 được tag muộn, hay có commit/tag khác chưa từng vào digest nào?
   Nếu là vế sau thì bốn phiên bản đã ra prod mà không có bản ghi nào trong brain.

2. **"Collection chưa publish" — phạm vi của kết luận cũ.**
   [[digest-subscriptions-joyxjoy-2026-08-20]] ghi "sản phẩm/collection tạo qua API chưa publish ⇒ Liquid
   trả `handle=null`, 0 sản phẩm" như một trong bốn nguyên nhân trang trắng. Commit `645f9fb72` hôm nay
   **tự bác** đúng cụm từ đó cho một triệu chứng khác: *"Tôi từng thử `.js` bị 404 rồi kết luận 'collection
   chưa publish' — chẩn đoán sai"*, nguyên nhân thật là sai đuôi file.
   → Hai kết luận có thể cùng đúng (một cho đường Liquid, một cho đường fetch JS), nhưng note cũ đang để
   trần. Cần thêm một câu giới hạn phạm vi, kẻo lần sau gặp "collection trả 0 sản phẩm" lại đi thẳng vào
   giả thuyết publish.

## Liên quan

[[subscriptions]] · [[shipped-subscriptions-2026-08-21]] · [[digest-subscriptions-2026-08-21]] ·
[[digest-subscriptions-2026-08-22]] ·
[[digest-subscriptions-joyxjoy-2026-08-20]] · [[2026-08-19-page-custom-o-theme-khach]] ·
[[2026-08-20-seed-dev-qua-luong-http-that]] · [[digest-subscriptions-2026-07-19]] ·
[[lich-dinh-ky-neo-theo-ngay-du-kien]]