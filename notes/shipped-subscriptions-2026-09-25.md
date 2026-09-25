---
type: note
title: Shipped subscriptions — 2026-09-25 (commit landed 24/09: !2637 `v2.35.67` + !2638, và cả nhánh Win Back đổ vào slice)
summary: Master nhận 2 merge — multi-bundle contract (!2637, `v2.35.67`, gỡ `.find()` ở 8 module) và email billing-failed cho manual charge (!2638, đóng câu hỏi treo #3 của 19/09); phần còn lại của slice là toàn bộ lịch sử nhánh Win Back (07-23 → 09-24, ~40 commit, Polaris 13.9.5 + index Firestore mới) lộ ra vì nhánh vừa rebase, KHÔNG phải vừa ship.
tags: [subscription, shopify, avada, billing, backend, git, debug]
created: 2026-09-25
updated: 2026-09-25
source: repo `subscriptions` — git log 2026-09-24 (mọi hash trong note là hash thật, lấy từ log có decoration)
---

# Shipped — Joy Subscription, commit landed 2026-09-24

Kỳ trước: [[shipped-subscriptions-2026-09-24]] (dừng ở !2578 + !2429, không tag).
Phần *vì sao* của hai MR dưới đây nằm ở [[digest-subscriptions-2026-09-24]].

> **Đọc cái này trước khi đọc bảng:** slice log này có ~40 commit mang ngày **07-23 → 09-22**.
> Chúng xuất hiện vì nhánh `feat/adama-add-win-back-flow` vừa được **rebase lên master rồi
> force-push** (`cec69902e`), không phải vì chúng vừa ship. Chỉ hai dòng trong mục Shipped là
> thật sự lên master hôm nay.

## Shipped (master)

| Tag | MR | Merge | Nội dung |
|-----|-----|-------|----------|
| `v2.35.67` | !2637 | `ad2d46970` (source `8f1757b3e`) | `feat - be - support several fixed bundles on one subscription contract`. Mỗi bundle nay resolve theo **group id của chính nó** thay vì `.find()` lấy dòng cha đầu tiên — 8 module: `currentBundleComponents`, `bundleSyncCycleSource`, `bundleSyncResolver`, `applyRotationToOrders`, `bundleSyncChargeGuard`, `parentVariantRepair`, webhook `contracts/update`, `orderController`. +473/−137, 14 file. |
| — | !2638 | `f13abefdb` (source `ee2003b26`) | `fix - be - send billing failed email for manual charges (SB-16965)`. Bỏ early-return `isAutomatic` trong `handleSendFailedEmail` (−6 dòng ở `subscriptionEmailService.js`, +59 dòng test). |

Hai điều đáng ghi về chính hai dòng đó:

- **!2637 không chỉ là "thiếu tính năng".** Commit body nói rõ hai đường **đang phá dữ liệu**:
  `parentVariantRepair` repoint **MỌI** dòng cha sang product của box vừa repair, và webhook
  `contracts/update` chép snapshot rotation của box này lên box kia. Hộp thứ hai không chỉ vô
  hình — nó bị ghi sai. Cùng họ với [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]].
- **!2637 tự giải thích được vì sao bug này sống lâu:** đường restore phía order **vẫn đúng** vì
  nó key theo metafield định nghĩa bundle chứ không theo tag dòng cha — nên hàng vẫn giao đúng
  trong khi mọi thứ khác (admin, export, email, guard tồn kho, repair) mù hộp thứ hai. Triệu
  chứng ở tầng khách hàng vắng mặt, đúng khuôn [[bang-chung-phan-biet-duoc]].
- **!2638 đóng câu hỏi treo #3 của [[shipped-subscriptions-2026-09-19]]** ("manual charge bị loại
  khỏi email thất bại có chủ đích không?"). Câu trả lời từ commit body: **không** — và phạm vi rộng
  hơn tưởng: retry của **payment recovery** cũng chạy với `isAutomatic: false` nên lâu nay cũng bị
  skip im lặng; chúng vẫn bị `shouldSendEmailFailure` trên `paymentRecovery.sendEmail` gác. Thêm
  một hệ quả không ai để ý: **email log ghi bên trong hàm send**, nên app không có log nào cho
  những lần thất bại đó — "không thấy log" từng là bằng chứng vắng mặt, không phải bằng chứng
  không xảy ra.

## Chưa lên master (còn trên nhánh)

**`feat/adama-add-win-back-flow`** — cả tính năng Win Back, `cec69902e` là commit rebase mới nhất
(`chore - [deploy-functions] redeploy staging-2 after rebase onto master`). Vòng mới nhất trên nhánh
(22–24/09), gom theo chủ đề:

| Chủ đề | Hash | Nội dung |
|---|---|---|
| **Link email không được có tác dụng phụ trên GET** | `e725e65e7` · `b3ba8e0ce` | Paste link win-back vào Slack → Slackbot GET 3 lần → **tạo contract sống, đã charge**. GET nay chỉ render trang confirm, nút POST lại cùng URL. `b3ba8e0ce` áp cùng cách cho confirm/decline/unsubscribe của email thường. → quyết định riêng: [[2026-09-25-link-email-khong-tac-dung-phu-tren-get]] |
| **Không tái áp offer lên contract đang ACTIVE** | `9bddf7046` | Khách tự quay lại rồi bấm email cũ: accept skip reactivate nhưng vẫn cộng incentive, dồn mọi kỳ về "now" và tính doanh thu win-back. Nay trả `null`, trang confirm hiện "You're all set" (1 Firestore read song song, ~900ms → ~10ms). |
| **Discount win-back chồng nhau** | `b13b0f57d` | `discounts` là union nhưng query select `id title` trực tiếp → Shopify từ chối, lỗi bị nuốt thành `[]`, bước "xoá discount win-back cũ" không bao giờ chạy. Một contract test thật chồng **3 lần 15% ≈ 38.6%**. Vá bằng `... on SubscriptionManualDiscount`. |
| **Run không chết theo plan** | `114d8e9e7` | Run đi theo snapshot lúc enroll, tắt/xoá plan không dừng nó — tái hiện: run park 1 ngày vẫn gửi email sau khi plan đã tắt. Nay stop eager + re-check plan sống ở cron resume và ở accept (`flow_disabled` / `flow_deleted`); bật lại plan **không** resume run đã stop. |
| **Gate accept đi đúng run của nó** | `5a148c6ac` | Accept chỉ mở gate đang chờ đúng offer đó, trong đúng run đó; email đã gửi thì checkpoint để recovery không gửi lại; dedup open/click theo **email node** chứ không theo step. **Thêm index Firestore mới** (`winBackFlowSteps` runId + expectedEvent + status). |
| **Tiền đúng đến từng cent** | `061653c50` · `83f4a1202` · `52a0f1a08` · `6e71c990f` · `8af8be060` · `4edfb02ac` · `c81d390cc` | Cả chuỗi một mục tiêu: doanh thu log phải bằng **đúng con số email in ra**. Gồm shipping (`061653c50`); định giá **trước** khi incentive kịp sync về doc (`83f4a1202`); làm tròn y hệt `toFixed(2)` vì `Math.round` lệch 1 cent ở nửa cent — `33.345` → `33.35` vs email `33.34` (`52a0f1a08`, đúng khuôn [[tien-khong-duoc-lay-float-lam-chuan]]); đọc **contract live** thay vì doc Firestore đã hấp thụ discount cũ (`6e71c990f`, đổi lại thêm 1 Shopify read mỗi accept); giá theo **đơn vị** chứ không theo line total Shopify — `2 × 664.95` từng mail `$2659.80` (`8af8be060`); offer chọn ở mức product phải định giá **mọi variant** nó subscribe — Gift Card 4 variant mail `$9.00` trong khi contract charge `$166.50` (`4edfb02ac`). `c81d390cc` siết test từ `toBeCloseTo(x,2)` sang `toBe` vì dung sai 1 cent chính là bug. |
| **Tiền trong đúng đồng tiền** | `4de0cd4e4` · `42d3ad7ad` · `efed5ddd7` · `a724b18dc` | `shops` doc **không có field `currency`** (kiểm cả 4 shop staging-2) nên mọi biểu thức rơi về `'USD'` im lặng; `getShopifyShopCurrency` nuốt lỗi và trả `'USD'` nên cache không phân biệt được "shop bill USD" với "lookup fail". |
| **Đếm đơn theo cách admin nói** | `9691732e9` | `currentBillingCycle` = 1 ngay khi tạo contract, nên contract import/manual báo **dư 1 đơn**, contract migrate mất sạch đơn cũ. Đổi sang `getDisplayedOrderCount` — đúng helper render dòng merchant đọc trước khi gõ ngưỡng. Đo trên 15 contract: mới đúng 15/15, cũ sai 5. |
| **Merge tag & bản dịch** | `97af7ff51` · `6f3cfacb4` · `a2e09a501` · `731c782f3` · `47d73e93c` | Phần trăm phải là số nguyên (Shopify `percentage` là `Int`, `12.5` lưu được nhưng contract tạo ra **không có discount**); tag `{{…}}` ngoài catalogue bị chặn activate; `yarn trans` dịch luôn **tên placeholder** (`{amount}` → `{montant}`) làm react-i18n throw. |
| **Canvas builder** | `e56c644be` · `0914add93` | Vòng 3 và 4 của SB-15259: bug là **occlusion** (panel 440px `position:absolute` che canvas mà không thu nhỏ nó), rồi lần sửa đầu vẫn hỏng vì **đo sai thời điểm** — `getBoundingClientRect()` đọc lúc panel còn ở `translateX(110%)`. Đổi sang `offsetLeft/offsetWidth`. Cùng họ với [[con-so-trong-tieu-chi-phai-kem-cach-do]]. |

Ba commit trong nhánh này là **nợ kỹ thuật đã thành hình**, không phải noise dù tiêu đề nói vậy —
xem mục Deploy notes.

**`agent/SB-17166`** — `4cb56382a` (`test: reproduce SB-17166`) + `a3d796500`
(`fix: SB-17166 - prevent stale billing attempts`). ⚠️ Xem mục Cần xác nhận #1.

**`fix/sb17107-skip-local-truth`** — `8343a2300` · `c30b2551c` · `f617b80de`: skip/resume billing
cycle chỉ ghi **cờ local**, resync thôi ghi đè cờ đó, cộng một command dry-run
`unskipStrayShopifyCycles.js` (+357) để dọn cycle đã skip nhầm bên Shopify. Đây là **đổi hướng**, ghi
riêng ở [[2026-09-25-skip-cycle-flag-local-la-nguon-su-that]].

**`fix/skip-cycle-recharge`** — `984f86b76` gom !2624 (swap contract sync lock) vào SB-16934, conflict
ở `contractService.js`; `752c28c75` đồng bộ master vào nhánh. Chùm guard SB-16934 treo từ
[[shipped-subscriptions-2026-09-22]] tới nay vẫn chưa lên master.

**`feat/bundle-no-plan-banner`** — `52f7ceda5` merge master vào nhánh với **17 conflict**, trong đó
`firestore.indexes.json`, `Toggle.js`, `FixedBundle.js`, `OfferProducts.js`,
`subscriptionContractController.js`, `backgroundHandler.js`. Nhánh này đã trôi xa khỏi master.

**Trong stash, không phải commit:** `8f183ed69` / `73231f69f` là `refs/stash` của
`feat/multi-bundle-contract`. Cùng lớp rủi ro đã ghi ở [[shipped-subscriptions-2026-09-24]]
(`backfillParentOnlyContracts.js` +293 dòng sống trong stash).

## Reverted

Chỉ một `git revert` trong cả slice, và nó là **routine**: `dbbfeffbe`
`Revert "Make AppModal destructive primary action render in critical tone"` — revert `697098643`
**cùng ngày 29/07**, 3 file, trên nhánh Win Back. Không mở note quyết định.

Không có revert nào trên master.

## Deploy notes

- **`v2.35.67`** là tag duy nhất trong slice, gắn ở `ad2d46970` (!2637). !2638 merge **sau** nó và
  **không có tag** — nên bản vá email billing-failed hiện chưa nằm trong release nào có số.
- **`a362a7198` `[deploy-all] chore - ci - point staging 1 at fix/sb17107-skip-local-truth`.**
  [[shipped-subscriptions-2026-09-24]] ghi staging 1 đang trỏ `feat/portal-preview` (`f2ccec41e`) —
  nay đã bị trỏ đi chỗ khác. Staging 1 **vẫn không phản ánh master**, chỉ đổi nhánh. Đây là lần thứ
  ba liên tiếp trong ba ngày staging 1 bị đổi đích.
- **`cec69902e` `[deploy-functions]`** trên nhánh Win Back — force full CI deploy staging-2 sau
  rebase. Cộng ba `[deploy-functions]` cũ trong cùng nhánh (`f144d08d9`, `49ae9eb64`, `97e6bb450`)
  và `d79d023d0`.
- **Nhánh Win Back mang một khối `firestore.indexes.json` phải deploy cùng functions.** Tích luỹ:
  `97e6bb450` (+223), `de1370eee` (+57), `d66f52b61` (+16), `5a148c6ac` (+18). `de1370eee` còn ghi
  một việc **chưa làm**: *"staging, staging-2, staging-4 và production hiện KHÔNG có index win-back
  nào"*. Nếu nhánh merge mà index không deploy trước/cùng lúc, metrics quay về 6 số 0 và cả query
  list cũng chết.
  - Bản thân `de1370eee` là một bài học riêng đáng nâng cấp sau: **aggregation của Firestore cần
    index RIÊNG, và index đó phải chứa mọi field được `sum()`** — `count()` chạy được trong khi mọi
    `sum()` fail, và `catch` degrade về 0 nên "query fail cứng" trông y hệt "chưa có gì xảy ra",
    ẩn hai tuần. Cùng họ [[bang-chung-phan-biet-duoc]].
- **Nhánh Win Back nâng Polaris 12.27 → 13.9.5** (`6ebccf5e8`) — đã được [[shipped-subscriptions-2026-09-23]]
  cảnh báo. Polaris 13 đọc `window.matchMedia` lúc module còn đang load và `Popover` dựng
  `ResizeObserver` lúc mount; jsdom không có cả hai, nên test master (`CustomerPortal.test.js`,
  `Edit.test.js`) **fail ở bước load** cho tới khi stub trong `jest.setupFiles`.
- **Command mới, chưa merge:** `unskipStrayShopifyCycles.js` (`f617b80de`, +357, mới dry-run).
  Đúng lớp [[script-pha-du-lieu-tu-choi-flag-la]] — phải kiểm nó từ chối flag lạ trước khi ai chạy
  `--apply` trên prod.
- Không có file migration nào trong slice. `autoTranslateV2.js` bị sửa (`a2e09a501`) là **command
  dịch**, không phải migration dữ liệu.

## ⚠️ Cần xác nhận

**1. `a3d796500` có phải chính bản sửa mà brain đã kết luận là SAI?**

| Nguồn | Nói gì |
|---|---|
| [[3ds-pending-billing-attempt-khong-co-webhook]] (24/09) | Bản sửa của agent cho SB-17166 (**MR !2636**) **SAI**: `ready === false && !orderId && !errorCode` chính là chữ ký của **3DS pending**, mà bản sửa coi nó là "chưa tới hạn" — xoá `idempotencyKey`, set `ready:true`, bỏ luôn `nextActionUrl` khách cần; còn gọi `scheduleBillingCycle` dời chu kỳ thật về `new Date()`. |
| `a3d796500` (24/09, `origin/agent/SB-17166`) | `fix: SB-17166 - prevent stale billing attempts` vẫn tồn tại trên origin. File **không khớp** mô tả trên: nó thêm `const/graphql/mutation/billingCycle.js` (+20), `const/subscription/orders/orderStatus.js` (+5), `services/graphql/billingCycleService.js` (+25), `shopifyService.js` (+29) — không thấy `billingAttemptGuard`. |
| [[verify-checkout-theo-nhanh-do-sai]] | Cùng case này từng bị **chặn oan** vì cổng đo sai (checkout theo tên nhánh), chạy tay thì 42/42 pass — tức có một lượt "xanh" đã được ghi nhận cho nhánh này. |

Hai khả năng loại trừ nhau: (a) `a3d796500` là bản **viết lại** sau khi chẩn đoán 3DS được làm rõ —
thì phải đọc xem nó có phân biệt `ActionRequired` không; (b) nó vẫn là cách cũ, chỉ đổi chỗ đặt code
— thì **không được merge**, và cái 42/42 pass kia đang chứng minh một điều khác với điều cần chứng
minh. Cách phân biệt rẻ nhất: đọc `a3d796500` xem nó có đọc `nextActionUrl` / `processingError` /
`state` hay không. Đừng suy từ tiêu đề commit.

**2. Ba commit "noise" trên nhánh Win Back không phải noise.**
`4419bfe7d` mang tiêu đề `Format code` nhưng **136 file, +858/−1932**, và **đổi tên file**
(`winBackPortalService`, `const/customerPortal/customerAccount.js`) — format code không xoá 1932
dòng và không rename module. `d66f52b61` (`Format code`) sửa `firestore.indexes.json` (+16) và thêm
`const/winBackFlow.js` +42, `const/winBackRun.js` +46. `7c952e161` (`Remove comment`) xoá code ở 46
file. Một tiêu đề nói "format" là tiêu đề người review **bỏ qua** — nếu nhánh này sắp merge, ba
commit đó là chỗ duy nhất trong nhánh chưa từng được đọc kỹ.

**3. Nhánh Win Back bao giờ merge, và ai chịu trách nhiệm deploy index trước?**
Nhánh mang ~28k dòng (riêng `97e6bb450` là 253 file / +28679), nâng Polaris major, thêm 4 khối index
Firestore, và có 4 môi trường **chưa có index nào**. Không có note nào trong brain ghi thứ tự deploy
cho nhánh này. Đây là việc phải chốt **trước** khi bấm merge, không phải sau.

Liên quan: [[subscriptions]] · [[shipped-subscriptions-2026-09-24]] · [[shipped-subscriptions-2026-09-23]] ·
[[shipped-subscriptions-2026-09-22]] · [[shipped-subscriptions-2026-09-19]] ·
[[digest-subscriptions-2026-09-24]] · [[digest-subscriptions-2026-09-22]] ·
[[2026-09-24-parent-only-xoa-het-dong-con]] · [[2026-09-21-fixed-bundle-con-them-luc-order-create]] ·
[[3ds-pending-billing-attempt-khong-co-webhook]] · [[verify-checkout-theo-nhanh-do-sai]] ·
[[bang-chung-phan-biet-duoc]] · [[ack-khong-phai-hieu-ung]] ·
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] · [[con-so-trong-tieu-chi-phai-kem-cach-do]] ·
[[script-pha-du-lieu-tu-choi-flag-la]] · [[tien-khong-duoc-lay-float-lam-chuan]] ·
[[khong-cache-response-co-auth]]
