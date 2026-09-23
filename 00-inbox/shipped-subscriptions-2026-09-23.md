---
type: note
title: Shipped subscriptions — 2026-09-23 (commit landed 22/09: !2595 + v2.35.57 → v2.35.59)
summary: Master nhận 4 merge (!2595 không tag, `v2.35.57`→`v2.35.59`) — command migrate fixed bundle quét hết cycle edit, [deploy-extensions] reward theo mốc tổng số lượng món, editor thuộc tính giao hàng Bird + ô tìm khách, và landing joyxjoy đẩy sold-out xuống cuối kèm nút Get notified gọi thẳng Klaviyo client API; vòng 4 fix portal Wholefoods và nhánh Win Back (kéo Polaris lên 13.9.5) vẫn chưa lên master.
tags: [subscription, shopify, avada, backend, storefront, extensions, polaris, firestore]
created: 2026-09-23
source: repo `subscriptions` — git log 2026-09-22 (mọi hash trong note là hash thật)
---

# Shipped — Joy Subscription, commit landed 2026-09-22

Note này chỉ ghi **cái gì thật sự lên master** và cái gì còn treo trên nhánh. Phần *vì sao* của
từng thay đổi nằm ở các digest được link ở cuối. Kỳ trước: [[shipped-subscriptions-2026-09-22]]
(dừng ở `v2.35.55` + !2621).

## Shipped (master)

| Tag | MR | Merge | Nội dung |
|-----|-----|-------|----------|
| — | !2595 | `06939d16b` | `fix - be - migrate contract fixed bundle: quét hết cycle edit thay vì 2 index`. Đây chính là bản `--clear-cycle-edits` mà [[shipped-subscriptions-2026-09-17]] ghi là "vẫn trên nhánh" — nay đã merge. |
| `v2.35.57` | !2600 | `48c044b4e` | **[deploy-extensions]** `feat - be - reward: condition total_items_quantity_milestone (SB-16816)`. Trên nhánh `feat/reward-qty-milestone-be`: `681d424f4` đặt **trần 1000 doc** cho các query aggregate của reward và cảnh báo khi chạm trần (`rewardQueryLimit.js` + 2 file test, sửa `orderRepository` và `subscriptionContractRepository`); `2362d3d87` tách helper doc id ra khỏi `subscriberRewardRepository`; `0313c7949` là commit `add todo` thuần. |
| `v2.35.58` | !2591 | `ea5adbb95` | `feat - subscriptions: Bird delivery attribute editor + customer search`. `7103a0a50` (+2898 dòng, 56 file) khoá key của provider nhưng giữ value sửa được **có kiểu**: method/location/postal code/timezone/weekday lấy từ Bird, date dùng picker làm xám ngày Bird không giao được và chặn quá khứ; chọn location điền một lượt address + name + id + postal code + timezone; chọn weekday kéo ngày về ngày mở gần nhất; mọi select vẫn có lối thoát "add custom value". BE thêm `POST /integrations/bird/delivery-options` dò xem shop bật method nào (method tắt trả *"config not found"*). Kèm combobox tìm khách ở trang tạo subscription. `aa9930ffc` là vòng dọn theo todo của @damhv: gom const vào `const/`, helper thuần vào `helpers/`, kéo resolution contract lines/zip từ controller xuống `birdService`. |
| `v2.35.59` | !2630 | `011c1729c` | `feat - fe/storefront - landing Joy Wholefoods: sold-out xuống cuối, nút Get notified gọi Klaviyo BIS` (`ef8c0f908`). Xem [[decision-klaviyo-back-in-stock-goi-thang-client-api-2026-09-23]] cho phần đổi hướng. |

### Chi tiết !2630 (landing joyxjoy)

- `sortSoldOutLast()` gọi **trước** `paginate` nên sold-out dồn xuống trang cuối chứ không bị
  ẩn. `isProductSoldOut()` chỉ tính hết hàng khi **mọi** variant hết — còn một size mua được thì
  vẫn thuộc nhóm còn hàng, nên danh sách không nhảy khi khách đổi variant.
- `visibleBundles` tách hai: `filterVisibleBundles` giữ box hết hàng và xếp cuối,
  `filterSelectableBundles` loại chúng khỏi thumbnail "How it works" và khỏi selection. Ba chỗ chặn
  ở `LandingApp`/`BoxSection` giữ nguyên — box hết hàng vẫn không vào được cart.
- Helper từ chối gửi khi thiếu `variantId` thay vì để Klaviyo trả 400. Bundle dùng field **phẳng**
  `variantId`, không phải `variants[0].id` — test cũ dựng shape giả nên không bắt được
  ([[fixture-khong-phai-hop-dong-du-lieu]] lại một lần nữa).
- Public company id đọc runtime từ script onsite của theme, **không hardcode**.

Hai thứ commit tự ghi là **ngoài phạm vi**, đáng tách task:

1. Nút Get notified trên collection page **của theme** vẫn nhận email rồi bỏ đó.
2. `--jw-font-body` của widget vỡ vì theme khai `--font-body-family: DM Sans 9pt` **không quote**,
   nên cả landing đang chạy Times thay vì DM Sans.

## Chưa lên master (còn trên nhánh)

- **`fix/wholefoods-box-lines` — vòng 4 fix portal Wholefoods** (toàn bộ đo trên store khách):
  - `d1f1e12b8` gộp dòng con của fixed bundle vào chính hàng box. Dòng con không mang `__box_id`
    lẫn `__fixed_bundle_staple` nên rơi hết xuống nhánh recurring và bị liệt kê lần hai dưới
    "Staples (recurring)" — contract `23097934039` có 1 box + 11 dòng con thì portal hiện **12
    hàng cho một box**. `filterBundleChildrenFromContract` vốn có sẵn nhưng return sớm trừ khi
    `shop.hideBundleChildren` được set, mà cờ DevZone đó **undefined** trên shop khách. Chỉ gộp khi
    dòng cha nằm cùng cycle — contract có con mà không có cha thì bỏ con đi là mất hẳn.
  - `d76113d3d` từ chối **và giải thích** thao tác trên billing cycle đã qua. Thêm sản phẩm vào
    upcoming order không làm gì cả: không sản phẩm, không lỗi, không phản hồi. Log prod 18/09 có 5
    lần `Billing cycle selector is invalid` ném từ `createDraftBillingCycle`. Chứng minh trên
    staging bằng cách chỉ đổi cycle: PAST → REJECTED, CURRENT → ok, FUTURE → ok; cycle bị skip mà
    còn ở tương lai thì draft vẫn ok. `isCycleClosed` nay đóng các order đó ở cả hai màn. **Cố ý
    không** đi qua `resolveDeliveryDate` — nó fallback về attribute của contract vốn mô tả lần giao
    **kế tiếp**, nên order cũ sẽ trông như order tương lai. Kèm hai chỗ im lặng:
    `ProductPicker.addProduct` vứt kết quả đi và luôn `return true`, và `addProductToOrder` ném
    nguyên văn của Shopify cho khách (nay có `describeBillingCycleError` + log kèm contract/cycle).
    Và `OrderDetail` post thẳng input của picker nên thiếu marker `__joy_one_off` → cả hai màn nay
    dùng `buildOneOffAddPayload`.
  - `df6e1bac5` đọc đúng quantity của dòng đã lưu: `line.quantity` có mặt ở **0/2262** dòng
    upcoming order, `line.product.quantity` có ở cả 2262 (143 dòng > 1) — nên bảng tóm tắt in "×1"
    trong khi danh sách bên cạnh in số thật.
  - `80bac55a8` thu hai cột của portal về một trên điện thoại: cả hai page shell hardcode
    `Grid columns={['68%','fill']}` không breakpoint, ở 390px sidebar còn ~60px mà vẫn giữ price
    summary + notes + delivery details. Sáu grid khác trong extension đã collapse sẵn từ trước.
    (Đây là phần vá cho triệu chứng đã ghi ở [[digest-subscriptions-2026-09-22]].)
- **`fix/sb16934-dedup-staging`** — nhánh gom để test staging, không phải nhánh tính năng:
  `c87b2b127` gom !2613 (dedup due-date + cycleIndex), `586582a44` gom !2624 (`getNextCycleIndex` +
  `withContractSyncLock`), `a0b3f8c59` mock `getLastOrder` cho test, `8d5adfbef` **[deploy-all]**
  trỏ staging 3 vào nhánh này. Chùm SB-16934 vẫn **chưa** lên master.
- **`feat/email-content-guard`** — `c25abb959` merge master vào nhánh (conflict ở `useCreateApi` /
  `useEditApi`), `1f79e087c` trim comment.
- **`feat/adama-add-win-back-flow`** — nhánh Win Back rất lớn, mở từ 23/07 và **vẫn chưa merge**.
  Xem mục "Deploy notes" bên dưới; nội dung đáng chú ý:
  - `778fb1569` **[deploy-functions]** dựng toàn bộ feature (253 file, +28,679 dòng) — flow builder,
    runner, node executor, email, token, analytics, translation, 223 dòng `firestore.indexes.json`.
  - `2771e6fcb` (SB-14690) sửa email win-back đọc sai shape contract: `prepareDeliveryMethod`
    **flatten** address nên mọi email gửi đi không có địa chỉ; instrument cũng bị flatten nên email
    rơi về thẻ SAMPLE và hiện cho người thật dòng "Visa ending 4242"; giá dòng lấy `variant.price`
    (giá catalog) thay vì `lineDiscountedPrice`/`currentPrice` — sai 28% trên 296 dòng thật;
    `contractSubtotal` duyệt `contract.lines` trong khi doc Firestore **không có** `lines`
    (0/200 doc, nó lưu `products[]`) nên **mọi** accept `reactivate_previous` ghi revenue 0.
  - `802fd5175` (SB-14513) sáu thẻ metric luôn hiện 0: Firestore cần index composite **riêng** cho
    aggregation, và index đó phải chứa mọi field được `sum()`. Index đã khai (`shopId`, `flowId`,
    `createdAt DESC`) phục vụ query list chứ không phục vụ aggregation. Nửa sau của bug là cái
    `catch` degrade về 0 không dấu vết, nên "query hỏng" trông y hệt "chưa có gì xảy ra" suốt hai
    tuần — cùng họ với [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]].
  - `cb3e7120b` (SB-14667) runtime chỉ thay `{{customer_first_name}}` nên ~23 merge tag còn lại đi
    tới khách dưới dạng `{{...}}` thô; nay một catalogue tag dùng chung FE+BE và preview với mail
    thật đi qua **cùng** một resolver.
  - `ee782a9f9` kéo coverage win-back từ 15/52 module (~29%) lên 41/52 (~79%, 559 case), cố ý bỏ 4
    repository (Firestore transaction cần emulator, luật project cấm mock Firestore).
  - `a6d63f5db` (2026-09-15) — nhánh này **nâng Polaris 12.27 → 13.9.5**. Polaris 13 đọc
    `window.matchMedia` ngay lúc module đang load và `Popover` dựng `ResizeObserver` lúc mount;
    jsdom không có cả hai nên `CustomerPortal.test.js` và `Edit.test.js` của master không load nổi
    → stub ở `jest.setupFiles` thay vì từng file test.

## Reverted

- `70d2dd21e` (2026-07-29) revert `137d349de` "Make AppModal destructive primary action render in
  critical tone". Cả hai đều nằm trên nhánh Win Back, cách nhau cùng ngày — revert UI thường lệ,
  không phải đổi hướng.
- Không có revert nào trên master trong khoảng này.

## Deploy notes

- `48c044b4e` (`v2.35.57`) mang **[deploy-extensions]** — bắt buộc CI deploy extension.
- `8d5adfbef` mang **[deploy-all]** nhưng chỉ đổi `.gitlab/ci/staging3.yml` và nằm **trên nhánh**,
  không phải master.
- Ba commit `[deploy-functions]` trong slice này (`778fb1569`, `3be86d96c`, `cadc38655`) đều thuộc
  nhánh Win Back chưa merge — chưa có tác động lên production.
- **`firestore.indexes.json` đổi ở 3 commit** (`778fb1569` +223 dòng, `802fd5175` +57 dòng,
  `c1a705d1b` +16 dòng), tất cả trên nhánh Win Back. `802fd5175` ghi rõ: staging, staging-2,
  staging-4 và **production hiện KHÔNG có index win-back nào** — tức ngày merge nhánh này, deploy
  index là bước bắt buộc, quên thì cả query list lẫn metric đều chết. Đây là việc phải làm **ngoài**
  commit, không có gate nào bắt.
- 3 version bump trong một ngày: `v2.35.57` → `v2.35.59`. `v2.35.56` **không xuất hiện** trong slice
  log này — có thể nó nằm ngoài cửa sổ commit, chưa xác minh.

## ⚠️ Cần xác nhận

1. **Dòng con của fixed bundle: đã bỏ khỏi contract hay chưa?**
   - [[2026-09-21-fixed-bundle-con-them-luc-order-create]] (đã merge, `v2.35.54`/!2626) quyết định
     contract **chỉ giữ dòng cha**, con dựng lại lúc `orders/create`.
   - `d1f1e12b8` (22/09, còn trên nhánh) đo trên store khách: **1671 trong 2262** dòng upcoming
     order đã lưu **là dòng con**, và phải viết code gộp chúng vào hàng box để portal không hiện 12
     hàng cho một box.
   - Hai câu này ở hai tầng khác nhau (contract vs doc upcoming order đã lưu) nên chưa chắc chọi
     nhau, nhưng con số 1671 nói rằng dữ liệu cũ vẫn đầy dòng con — tức câu hỏi "backfill là bắt
     buộc hay tuỳ chọn" (đã treo ở [[shipped-subscriptions-2026-09-22]]) vẫn chưa được trả lời, và
     giờ có thêm một consumer (portal Wholefoods) phải tự chịu trách nhiệm.
2. **`shop.hideBundleChildren` — cờ DevZone này còn nghĩa gì không?**
   `d1f1e12b8` mô tả nó là "một DevZone toggle không ai bật", và code mới **đi vòng** qua nó thay vì
   bật nó. Nếu cơ chế mới đã là mặc định thì cờ này nên bị xoá; nếu không, đang có hai đường điều
   khiển cùng một hành vi mà chỉ một đường được dùng.

Liên quan: [[subscriptions]] · [[shipped-subscriptions-2026-09-22]] ·
[[digest-subscriptions-2026-09-22]] · [[shipped-subscriptions-2026-09-17]] ·
[[2026-09-21-fixed-bundle-con-them-luc-order-create]] ·
[[2026-09-16-landing-doi-nguon-lap-sang-collection-list]] ·
[[digest-subscriptions-bird-2026-09-14]] · [[2026-09-14-backfill-bird-chi-don-chua-charge]] ·
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] · [[fixture-khong-phai-hop-dong-du-lieu]] ·
[[khong-error-boundary-hong-ca-man-hinh]] · [[bang-chung-phan-biet-duoc]]
