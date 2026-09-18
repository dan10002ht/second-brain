---
type: note
title: Shipped Joy Subscription — commit landed 2026-09-17 (v2.35.39 → v2.35.42 + !2605, 5 merge vào master)
summary: Master nhận 5 merge (4 tag `v2.35.39`→`v2.35.42`, riêng !2605 không tag) — landing tôn trọng plan group được ghim thay vì đoán theo số tuần, portal cũ thôi báo xanh khi mutation fail, chặn ngày reschedule rác sinh mốc 1970, scroll modal fixed bundle trên embed; còn cả một vòng lớn portal Wholefoods (SB-16929/16900/16926/16927/16924/16888/16861) vẫn trên nhánh.
tags: [subscription, shopify, avada, backend, extensions, storefront, firestore]
created: 2026-09-18
updated: 2026-09-18
source: repo `subscriptions` — git log 2026-09-17 (hash đã verify)
---

# Shipped — `subscriptions`, commit landed 2026-09-17

Note này chỉ ghi **cái gì đáp xuống đâu**. Đợt trước: [[shipped-subscriptions-2026-09-17]]
(commit landed 09-16). Root cause của vòng portal Wholefoods nằm rải ở
[[digest-subscriptions-2026-09-17]] và các digest trước đó.

## Shipped

### Vào `master` — 5 merge, 4 version bump

| Merge | Tag | MR | Việc | Commit nhánh |
|---|---|---|---|---|
| `55eb9efc3` | *(không tag)* | !2605 | bundle CTA dựng đúng link builder cho landing kiểu **alternate view** | `7a196b7bd` (=`44fa86fad`) |
| `e1278b683` | `v2.35.42` | !2602 | fixed bundle: cuộn được modal/list trên embed, nút **View product**, toggle one-time purchase | `0469057b1` · `5fab5d69a` · `ef2d186ce` |
| `e7a0d7a47` | `v2.35.41` | !2601 | chặn ngày reschedule rác — không còn sinh mốc **1970** để cron auto-charge | `81c619c85` |
| `a84afd9d2` | `v2.35.40` | !2599 | customer portal cũ: **hiện lỗi** thay vì banner xanh khi edit thất bại | `09369f113` |
| `52a988ce2` | `v2.35.39` | !2598 | landing tôn trọng **plan group được ghim**, thôi đoán theo số tuần | `79955e9e2` |

Bốn điểm đáng giữ:

- **`09369f113` — `useEditApi` không bao giờ throw.** Request bị reject, 401 refresh hỏng, và
  controller trả `{success: false}` đều về dưới dạng **một object trần** — nên ba mutation trên trang
  detail của portal cũ (change frequency / edit product / add product) đều báo thành công vô điều
  kiện. Đó là lý do lần báo thứ hai của SB-16815 (*"đổi frequency, apply, không có gì đổi"*) **không
  để lại dấu vết nào**: không ghi gì, không đụng order, không log lỗi. Fix: `resolveMutationBanner`
  thuần, chỉ coi là thành công khi `success === true`. Cùng lớp với [[ack-khong-phai-hieu-ung]].
- **`79955e9e2` — ghim plan group thì đừng đoán theo số tuần.** Picker rơi xuống matcher legacy mỗi
  khi một box không có entry cho group được ghim, giữ box đó lại nếu *bất kỳ* selling plan nào của
  sản phẩm tình cờ chạy đúng số tuần đang chọn. Trên joywholefoods lộ ra 2 box thuộc group không liên
  quan, danh sách đổi mỗi lần shopper đổi frequency và **rỗng hẳn ở 4 tuần** — và mỗi box đó sẽ
  checkout trên một plan merchant chưa bao giờ chọn cho landing này.
- **`7a196b7bd` — `?bundle=` nối cứng vào một URL đã có query.** joywholefoods vào builder bằng
  `/pages/100-happiness-guarantee?view=build-your-subscription` (landing là **alternate view**, không
  phải page riêng), nên link ra hai dấu hỏi; Shopify đọc cả đuôi làm giá trị của `view`, rơi về
  template mặc định, builder không render — **mà link vẫn trông đúng**. Separator nay chọn theo URL.
  Bỏ luôn tham số `qty` vì `LandingApp` chỉ đọc `params.get('bundle')`.
- **`ef2d186ce` — one-time purchase cho fixed bundle đi sau cờ DevZone** (`enabledOneTimePurchase`,
  thêm vào `PROD_RESTRICTED_TYPES`). Cùng pattern với
  [[2026-09-10-devzone-hide-recurring-pricing]] và [[2026-09-10-devzone-mo-khoa-rich-text]].

### Còn trên nhánh

**`feat/wholefoods-portal`** — vòng lớn nhất trong ngày, chưa merge. Chủ đề xuyên suốt: **ngày giao
hàng ≠ ngày charge**, và **múi giờ thuộc về location chứ không thuộc về contract**.

| Hash | Việc |
|---|---|
| `2a52c9ba3` | SB-16929 + SB-16900 — `deliveryDate` vốn là `billingAttemptExpectedDate \|\| nextBillingOrderDate`, tức **toàn ngày charge** hiện dưới tiêu đề nói về ngày giao; đo trên `ag-ngocvtb-subs-stg3-2`: **10/10 contract active lệch** với `Delivery Date` của Bird, có cái hiện 30/5 vào ngày 17/9. Kèm resolve múi giờ **lúc đọc** từ location của shop (xem decision bên dưới) |
| `e3edfbf74` | SB-16929 — màn **order detail** vẫn đọc `billingAttemptExpectedDate` cho các field giao hàng; tách rõ ngày charge (giữ cho "This order will be made on…", order-now, skip) khỏi ngày giao (field giao + khoá sửa) |
| `527168c6f` | sprayfreefarmacy mang **CẢ HAI** integration: contract có cả cách viết của Bird (`Delivery Date`/`Delivery Day`/`locationId`) lẫn Zapiet (`Delivery-Date`/`Delivery-Location-Id`/`Pickup-Location-Id`). Ba reader chỉ biết cách viết của Bird ⇒ contract Zapiet rơi về ngày billing và **không resolve được múi giờ nào**. Đồng thời gộp hai parser ngày (một hiểu là local midnight, một neo 12:00Z ⇒ phía sau UTC gọi tên hai ngày khác nhau) |
| `8c1852787` | SB-16900 — `subscriptionCardModel` dựng formatter **một lần** với `Australia/Brisbane` hardcode, không đọc contract; `2026-10-10T15:30Z` là T7 10/10 ở Saigon nhưng đã CN 11/10 ở Brisbane. Ảnh hưởng **mọi** contract của shop, không chỉ contract thiếu attribute. Viết test lộ thêm crash: `Customer TimeZone` là free text, giá trị không parse được làm `getDeliveryDayInfo` throw giữa render ⇒ [[khong-error-boundary-hong-ca-man-hinh]] trắng cả portal |
| `9b805d954` | backfill `Customer TimeZone` ghi lên **contract của Shopify**, không chỉ Firestore — endpoint đọc contract bằng `fullResp: true` rồi đè bản Shopify lên doc, đúng cái [[digest-subscriptions-2026-09-17]] đã ghi. `customAttributes` trên draft **thay cả danh sách** nên phải đọc lại attribute cũ gửi kèm, không thì xoá sạch thứ Bird ghi |
| `87ed9811e` | SB-16926 — badge "SUBSCRIPTION" nhận vơ luôn tiền của **mã giảm giá**: Shopify báo cả hai là `SubscriptionManualDiscount`, phân biệt được chỉ nhờ **cặp giá** nó nằm giữa (`basePrice→currentPrice` = subscription, `currentPrice→lineDiscountedPrice` = mã code). Contract 164692066358: một line 400→380→76 bị gắn "SUBSCRIPTION (−$324.00)"; Product Bundle #1 899.91→899.91→179.98 **không giảm subscription đồng nào** vẫn báo "−$719.93" |
| `867072c7e` | SB-16924 (badge editing-closed biến mất đúng lúc khách cần nhất) + SB-16922 (picker Collection tự ẩn vì mapper plan v2 trả về **không collection nào**; taxonomy không dùng được: id node `fb-2-10-7-1` vs payload rút còn `5582`, và chỉ 3/14 sản phẩm có) + nửa layout của SB-16926 |
| `f94f00bf3` | SB-16888 — picker chào **4 option đều đọc là "Default"** vì mapper `handleGetProductsByIdsLightweight` bỏ mất `title`; kèm SB-16861 — dòng con bundle thiếu `sellingPlanName` nên Shopify render delivery policy mang `MOCK_INTERVAL_DATA` ⇒ "Delivery every 10 weeks" trên contract 2 tuần |
| `2fe6c5eac` | SB-16861 — backfill `sellingPlanName` cho dòng con bundle **đã tồn tại** (contract cũ không tự lành). Chỉ ghi `sellingPlanName`; `sellingPlanId`, giá và pricing policy không đụng ⇒ tiền khách trả không đổi. Chạy trên stg3-2: 41 contract, 20 dòng / 7 contract |
| `913e5a385` | SB-16927 — full-page customer account extension chỉ có **một URL** `/account/pages/<uuid>` dù đang xem list hay detail, nên suy view từ path luôn rỗng và mọi lần reload về list. Nay nhớ bằng `storage` của extension |
| `826f061b1` | SB-16900 — đọc attribute giao hàng **từ order trước**, merge chứ không thay: đo trên stg3-2, order mang đủ mọi key TRỪ múi giờ, nên đọc-chỉ-order sẽ giấu mất giá trị mà contract có |
| `7540bbf9e` | ProductPicker phân trang sai: `loadMore` đòi `pagination.nextCursor` mà chỉ `/products/search` trả; `/subscription-products/search` báo `hasNext` không kèm cursor và đợi `after` là **id dòng cuối**. Shop plan v1 thấy "còn trang" mà không bao giờ tới được |
| `a81bd012f` | SB-16894 — địa chỉ support vẫn xuống dòng riêng dù đã khớp 12px, vì text và link là **sibling trong BlockStack** (mỗi con một hàng). Nest Link vào trong Text, hai lớp để `subdued` không biến link thành chữ thường |
| `a718e5366` | đổi tên extension sang **"Subscriptions (Custom)"** + CLI cho `ensureAppMetafieldDefinitions` — quyết định đã ghi ở [[2026-09-17-extension-wholefoods-khong-gate-theo-shop]]. Chạy trên sprayfreefarmacy: 20 definition, 2 tạo mới, 18 cập nhật access |
| `f81488677` | merge master vào nhánh — 2 conflict, cả hai là **pin CI branch**, đều lấy theo master |

**`feat/reward-qty-milestone-be`** — condition `total_items_quantity_milestone` (SB-16816):
`d89e04d21` (backend) cộng **quantity thật** chứ không đếm số line, tính cả đơn checkout gốc
(`isOrigin: true`); dùng **watermark** `countedQuantityBase` trong `conditionSnapshot` thay vì biến
đếm, vì `evaluateSubscriberForReward` có **4 entry point** và biến đếm trừ dần sẽ cấp 2 reward — kèm
transaction Firestore quanh read-modify-write (trước đây là read-then-write trần). Condition cũ
`recurring_items_quantity` **đóng băng hoàn toàn**, hàm cũ giữ nguyên xi. Rồi `215fe4b2f` (UI + 7
locale + portal copy) và `86e9c594c` (mirror sang `missionConfig` của New Customer Account).

**Nhánh lẻ:**

- `e2cbd4933` (`feat/widget-url-preselect`) — widget preselect purchase option từ URL param
  (`?selling_plan`, `?purchase_option`).
- `86c4b76ab` / `ef1b1d016` (`fix/cta-hide-qty`, `fix/bundle-cta-link` — **cùng một patch ở hai
  nhánh**) — bundle CTA ẩn luôn quantity stepper mà nó không thể tôn trọng: link builder chỉ mang
  `bundle=<handle>`, nên khách chọn 3 vẫn tới builder hiện 1 mà không được giải thích. Ẩn cả wrapper
  `.product-form__quantity` để nhãn "Quantity:" không ở lại một mình, và bản thứ hai trong sticky bar.
- `a63c4eaf0` — dịch comment trong hai file Liquid **merchant tự paste vào theme của họ** từ tiếng
  Việt sang tiếng Anh. Đúng nguyên tắc đã có: thứ người nước ngoài đọc thì viết tiếng Anh.
- `5e4d3f9c9` (`chore/create-mr-token-fix`) — command `create-mr` dùng `LONGTERM_GITLAB_PAT`, bỏ suy
  luận sai về reviewer option.

## Reverted

**Không có `git revert` nào.** Ba lần đè lên lựa chọn trước, đều trong cùng ngày:

- `9b805d954` đè cách làm của `8c1852787` (backfill Firestore-only → ghi lên contract Shopify), rồi
  `2a52c9ba3` **bỏ hẳn hướng backfill** cho múi giờ ⇒ tách riêng:
  [[2026-09-18-timezone-resolve-luc-doc]].
- `527168c6f` sửa chính parser mà `2a52c9ba3` vừa thêm: neo 12:00Z áp cho **cả** giá trị là instant
  đầy đủ (`2026-09-16T02:00:00.000Z`) làm lệch hàng giờ. Một test sẵn có bắt được.
- `87ed9811e` bác một kết luận trước đó **trên chính ticket SB-16926**: *"An earlier note on this
  ticket said the two could not be separated. That was wrong, and was based on the discount types
  being identical rather than on the price fields."* Kết luận cũ dựa trên loại discount — thứ không
  phân biệt được; thứ phân biệt được là cặp giá. Cùng lớp [[bang-chung-phan-biet-duoc]].

## Deploy notes

- **`384fffb55` mang `[deploy-all]`** — nhưng nó chỉ ghim `STAGING_BRANCH` sang
  `feat/reward-qty-milestone-be`, tức **một lần deploy đầy đủ chỉ để đổi con trỏ staging**.
- **Con trỏ staging: ngày thứ tư liên tiếp.** `f81488677` phải giải 2 conflict, cả hai là pin CI:
  `STAGING_BRANCH → feat/joyxjoy-landing`, `STAGING3_BRANCH → feat/adama-auto-swap-setting`.
  staging3 trước đó đã bị trỏ vào `feat/wholefoods-portal` để test portal — giữ nguyên thì **staging
  3 vĩnh viễn deploy nhánh này và lấy môi trường khỏi tay mọi người khác**. Cộng với `384fffb55`
  cùng ngày ghim staging 1, và 3 lần đã ghi ở [[shipped-subscriptions-2026-09-17]] /
  [[shipped-subscriptions-2026-09-16]]: đây là **thiếu cơ chế**, không phải chuỗi tai nạn.
- **`v2.35.38` không xuất hiện trong log này** — đợt trước dừng ở `v2.35.37`, đợt này mở ở
  `v2.35.39`. Có thể nằm ngoài cửa sổ log, có thể là bump bỏ sót (đợt trước đã có một merge không
  tag). Chưa xác minh.
- **Merge `55eb9efc3` (!2605) không kèm tag** — lần thứ hai trong hai đợt liên tiếp có merge vào
  master mà không bump version.
- **Không có file migration.** Hai thứ sinh ra là **script chạy tay**:
  `backfillCustomerTimeZone.js` và `backfillBundleChildSellingPlanName.js`, đều dry-run mặc định.
  Cả hai đi đường draft-commit để giữ billing cycle edit — cùng cơ chế `autoSwapService` dùng.
- **Cả hai backfill đều tự khai giới hạn.** `9b805d954`: 6 contract cần, **5 ghi được**; contract
  `164719034422` bị Shopify từ chối (*"cannot be updated if there is a current or upcoming billing
  cycle contract edit"*) và **không backfill nào chạm tới được**. `2fe6c5eac`: contract không có
  dòng nào mang tên plan thì bỏ qua cả contract.
- **Liquid vẫn không đi qua CI.** `7a196b7bd` (đã vào master) và các bản CTA trên nhánh đều sửa
  `docs/joyxjoy-theme/` — merchant paste tay
  ([[2026-09-08-bespoke-khong-vao-theme-app-extension]]).
- **Một suite fail trên mọi checkout sạch:** `f81488677` ghi rõ `simpleBundleMapping` đọc file export
  bundle của merchant trong `memory-bank/` — thư mục **gitignore và không có trong repo**. Sau khi
  loại suite đó: assets 72/72, functions 371/371 (3998 test). Ai chạy full suite lần đầu sẽ thấy đỏ
  mà không phải lỗi của mình.

## ⚠️ Cần xác nhận

**1. Fallback `Australia/Brisbane` — đã fix hôm 09-16 hay chưa?**

| Nguồn | Nói gì |
|---|---|
| [[shipped-subscriptions-2026-09-17]] (commit `bd9ab1cf8`, landed 09-16) | *"`Delivery Location` / `Customer TimeZone` đọc đúng cái contract mang thay vì fallback `Australia/Brisbane` hardcode"* |
| Commit `8c1852787` (09-17) | `subscriptionCardModel` *"built its date and weekday formatters once against a hardcoded Australia/Brisbane and **never read the contract at all**"* — và *"That affected **every** contract on the shop"* |

Hai khả năng: (a) `bd9ab1cf8` chỉ sửa **field hiển thị** còn card model là chỗ khác chưa đụng tới;
(b) một trong hai bản ghi mô tả quá rộng. Cần chốt vì nếu là (b) thì có một chỗ hardcode nữa chưa ai
tìm. Đây đúng lớp [[con-so-trong-tieu-chi-phai-kem-cach-do]] — "đã fix múi giờ" là một claim không
có gate nào đỏ được.

**2. SB-16888 — brain ghi một fix, commit hôm nay mô tả một fix khác, và một regression từ chính
fix hôm qua.**

- [[shipped-subscriptions-2026-09-17]] ghi `ad3e1c2f7` (09-16) là SB-16888: *"thêm bước chọn variant
  + số lượng trước khi thêm sản phẩm"*.
- `f94f00bf3` (09-17) ghi SB-16888 là: mapper bỏ mất `title` nên **4 option đều đọc "Default"**.
- Cùng commit đó nói layout của bước chọn sản phẩm là *"a regression from `912fd562b`"* — mà
  `912fd562b` chính là commit brain ghi hôm qua như một **fix** (SB-16889/92/94). Nó dời nút sang
  cùng hàng với stepper để nhãn khỏi xuống dòng, và cột `auto` không co được nên đẩy nút ra khỏi
  mép modal.

Tức SB-16888 là **hai lỗi khác nhau dưới một số ticket**, và fix hôm qua đẻ ra lỗi hôm nay. Khi
mature nên ghi rõ cả hai thay vì để note hôm qua nói như đã đóng.

**3. `size="large"` trên modal Polaris/App Bridge có tác dụng không?**
`f94f00bf3` khẳng định *"`size=\"large\"` does not widen this modal either; it renders around 480px
regardless"*, và hai cột benefit tile hỏng vì điều kiện dựa trên `viewportInlineSize` (đo **cửa sổ
trình duyệt**, không đo modal). Chưa có note nào trong brain ghi giới hạn này; nếu đúng thì nó là
gotcha tái dùng được, cùng họ [[prop-sai-bi-bo-qua-im-lang]] — cần một phép đo độc lập trước khi
nâng thành resource.

Liên quan: [[subscriptions]] · [[2026-09-18-timezone-resolve-luc-doc]] ·
[[shipped-subscriptions-2026-09-17]] · [[digest-subscriptions-2026-09-17]] ·
[[2026-09-17-extension-wholefoods-khong-gate-theo-shop]] · [[2026-09-09-portal-wholefoods-extension-rieng]] ·
[[digest-subscriptions-bird-2026-09-14]] · [[2026-09-10-cutoff-theo-delivery-day]] ·
[[khong-error-boundary-hong-ca-man-hinh]] · [[ack-khong-phai-hieu-ung]] ·
[[bang-chung-phan-biet-duoc]] · [[con-so-trong-tieu-chi-phai-kem-cach-do]] ·
[[mutation-ghi-nguyen-khoi-xoa-field-khong-gui]] · [[prop-sai-bi-bo-qua-im-lang]]
