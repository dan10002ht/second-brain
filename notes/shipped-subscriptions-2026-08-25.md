---
type: note
title: Joy Subscription — commit landed 2026-08-24
summary: Log không có ref master lẫn tag nào — toàn bộ nằm trên 2 nhánh: landing joyxjoy nối vào plan/discount thật của app (5 commit 08-24) + pin font-size boot screen bằng px hạ CLS 0.0146→0.0064, và nhánh win-back đóng 8 brief SB dưới một commit `[deploy-functions]` rồi bị một commit "Format code" 133 file đi qua.
tags: [avada, subscription, shopify, storefront, performance]
created: 2026-08-25
updated: 2026-08-25
source: repo `subscriptions` (avada/subscriptions) — git log 2026-08-21/24, hash lấy nguyên từ log
---

# Joy Subscription — commit landed 2026-08-24

Tiếp nối [[shipped-subscriptions-2026-08-22]]. Bối cảnh kỹ thuật đã ghi ở
[[digest-subscriptions-2026-08-24]] — ở đây chỉ ghi **cái gì landed ở đâu**, không lặp root cause.

**Không có commit nào trên master trong log này.** Toàn bộ log chỉ mang 2 ref:
`HEAD -> feat/joyxjoy-landing` và `origin/feat/adama-add-win-back-flow`. Không tag, không version bump,
không file migration.

## Shipped

### Nhánh `feat/joyxjoy-landing` — 08-24, 5 commit

Nối widget landing vào **plan group thật của app** thay vì tự suy đoán — đúng hướng đã chốt ở
[[2026-08-24-landing-joyxjoy-dung-plan-cua-app]].

| Hash | Nội dung |
|------|----------|
| `aa9d8a745` | Liquid emit `variantId` + metafield plan của app; redirect về `/cart` (đóng bug add-to-cart không ăn selling plan) |
| `03b141c77` | Dùng selling plan của app thay vì đoán tần suất theo tuần — thêm `resolveAppPlans.js` + `getBoxFrequencyPlan.js`, sửa `BoxSection`/`FrequencySelector`/`LandingApp`/`buildOrderPayload` |
| `04c607177` | Summary hiện discount theo plan app (`summaryLogic.js` +73) |
| `dbff23a1b` | Swap item chuyển thành **line item property trên từng box** thay vì ghi vào order note — sửa `buildCartItems` + `buildOrderPayload` + `SwapModal` |
| `8bf2e70f7` | Summary hiện đúng **tên plan** thay vì suy ra số tuần (sửa nốt nửa đường dữ liệu còn hardcode `'Every N weeks'`) |

Cả 5 commit đều đi kèm test (`resolveAppPlans.test.js`, `frequencySelector.test.js`,
`buildCartItems.test.js`, `summaryLogic.test.js`, `landingCheckoutFlow.test.js` được bồi 3 lần).

`dbff23a1b` là một **đảo hướng** chứ không phải fix — xem
[[2026-08-25-swap-line-item-property-tung-box]].

### Nhánh `feat/joyxjoy-landing` — 08-24, CLS boot screen

`5880203ad` — pin font metrics của boot screen bằng đơn vị **px**. Sửa cả **ba** template
(`index.html` dev, `standalone.html` + `embed-template.html` là input build) vì sửa một cái là lệch parity.
Số đo trong commit body: `CLS 0.0146 → 0.0064`, shift `#PreLoading` biến mất, ổn định qua 5 run,
throttle CPU 4x. Shift thật đo ở production: `220,97 1000x674 -> 220,103`, chiếm **92/351 CLS entry**
(tổng 1.38). Commit ghi rõ `2rem` đã thử và vô dụng vì `rem` neo vào chính cái root font-size mà Polaris
hạ 16→13px.

### Nhánh `feat/adama-add-win-back-flow` — 08-21/08-22

- `57440b756` **`[deploy-functions]`** — đóng một loạt subtask kèm **8 brief mới trong
  `docs/features/win-back/briefs/`** (+ README): SB-15259 (add node nhầm nhánh), SB-15308 (condition theo
  cancellation reason), SB-15707 (metrics flow list theo daterange), SB-15710 (cột bảng flow), SB-15712
  (cỡ chữ modal), SB-15729 (confirm modal set status), SB-15732 (ảnh locked state), và
  SB-14513-deploy-metrics-indexes. Code đi kèm: `SetStatusConfirmModal.js` mới, `flowModel.js` +66 với
  `flowModel.test.js` +181 và `FlowCanvas.render.test.js` +234, `bulkStatus.js` + test, 18 dòng key mới ×
  7 file locale.
- `67b3f2e0e` "Format code" — 133 file, −1.080 dòng ròng. **Tiêu đề nói dối về phạm vi**: commit này thêm
  `WinBackConditionSettings.js` (+80), `helpers/winBack/conditionNode.js` (+27) và **đổi tên**
  `winBackPortalService` (kèm test) — không phải formatting thuần.
- `541421828` "Remove comment" — 46 file, −162 dòng comment. Noise thuần, ghi lại chỉ vì nó là commit
  đứng đầu `origin/feat/adama-add-win-back-flow`.

### Đã có trong brain — không lặp lại

Log lần này kéo cả lịch sử nhánh win-back từ 07-23. Các cụm sau đã ghi rồi, chỉ liệt kê hash để đối chiếu:
`400253bed` (07-23, `[deploy-functions]` Add win back flow, 252 file → [[shipped-subscriptions-2026-07-30]]);
`d3804c4dd` / `471f90a6d` / `863e98d50` / `a771aee14` (08-03: SB-14513 metrics luôn 0, SB-14690 email đọc sai
shape contract, SB-14667 merge tag, test 29%→79% → [[shipped-subscriptions-2026-08-12]]);
`c30a78dc2` + `e80fdca58` (revert cosmetic AppModal critical tone, cùng ngày 07-29 → đã ghi ở cùng note đó).

## Reverted

Không có revert nào trong cửa sổ 08-21 → 08-24. Cặp `c30a78dc2` → `e80fdca58` (07-29) là revert cũ
đã ghi trong brain.

## Deploy notes

- **`[deploy-functions]`: 1 commit** — `57440b756` (08-21, nhánh win-back). Ép CI deploy full.
- **Không** tag, **không** version bump, **không** ref master trong toàn bộ log.
- **Không** file migration, **không** đụng `firestore.indexes.json` trong cửa sổ 08-21→08-24.
  (`firestore.indexes.json` +57 dòng chỉ có ở `d3804c4dd` ngày 08-03, đã ghi.)
- Nợ vận hành còn treo từ `d3804c4dd`: commit body ghi *"staging, staging-2, staging-4 và production hiện
  KHÔNG có index win-back nào"*. Brief `SB-14513-deploy-metrics-indexes.md` xuất hiện trong `57440b756`
  cho thấy việc deploy index **vẫn chưa xong** tính đến 08-21.

## ⚠️ Cần xác nhận

1. **Hash của 2 commit joyxjoy trong brain đã không còn tồn tại — nhánh bị rebase.**
   [[shipped-subscriptions-2026-08-22]] ghi `0c9ef5949` (thay 3 emoji bằng ảnh sản phẩm) và `92d3ba675`
   (BoxCard vendor + badge save/was). Log hôm nay có **đúng hai thay đổi đó** với tiêu đề gần như y hệt
   nhưng hash khác: `0389847d3` và `77fa23375`, cùng ngày 08-21.
   → `feat/joyxjoy-landing` đã bị rebase/amend sau khi brain ghi. Hai hash cũ giờ là hash chết.
   Cần chốt: sửa hash trong note cũ, hay chấp nhận rằng hash trên nhánh feature là thứ **không bền** và
   ghi rõ điều đó vào quy ước của job này? (Hash trên master thì bền — vấn đề chỉ ở nhánh chưa merge.)

2. **Câu hỏi tag `v2.34.80`→`v2.34.83` vẫn chưa được trả lời.**
   [[shipped-subscriptions-2026-08-22]] đã treo câu này. Log 08-21→08-24 **không có tag nào**, nên nó
   không đóng được ở đây — 4 phiên bản vẫn đang ở prod mà brain không có bản ghi.

3. **`57440b756` gộp 8 ticket vào một commit tiêu đề "Fix bug subtask".**
   Không tra ngược được ticket nào sửa dòng nào nếu cần revert lẻ. Ghi lại như một dữ kiện, không phải
   phán xét — nhưng nó ngược với kỷ luật `type - role - scope` mà [[feedback-commit-style]] ghi cho repo Avada.

## Liên quan

[[subscriptions]] · [[shipped-subscriptions-2026-08-22]] · [[digest-subscriptions-2026-08-24]] ·
[[digest-subscriptions-2026-08-22]] · [[digest-subscriptions-joyxjoy-2026-08-20]] ·
[[2026-08-24-landing-joyxjoy-dung-plan-cua-app]] · [[2026-08-19-page-custom-o-theme-khach]] ·
[[shipped-subscriptions-2026-08-12]] · [[shipped-subscriptions-2026-07-30]] ·
[[do-layout-shift-bang-browser-automation]] · [[2026-08-25-swap-line-item-property-tung-box]]
