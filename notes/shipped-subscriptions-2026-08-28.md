---
type: note
title: Joy Subscription — commit landed 2026-08-27
summary: Master nhận 3 tag liên tiếp trong một ngày (`v2.34.88` !2502 legacy change-discount neo ở cycle 0, `v2.34.89` !2503 giữ `plans[]` đúng `sellingPlanId`, `v2.34.90` !2504 lấy app discount từ `discountAllocations` — đóng nốt bug subtotal 56 mà audit hôm qua ghi là chưa vá); trên nhánh `fix/kookut-issues`: fix re-quote đúng option khách chọn + 5 script probe shipping read-only. Không revert, không cờ deploy, không migration.
tags: [avada, subscription, shopify, billing, shipping, debug]
created: 2026-08-28
updated: 2026-08-28
source: repo `subscriptions` (avada/subscriptions) — git log 2026-08-27, hash lấy nguyên từ log
---

# Joy Subscription — commit landed 2026-08-27

Tiếp nối [[shipped-subscriptions-2026-08-27]] (log 08-26). Root cause của cụm giá này đã ghi
rất sâu ở [[discount-per-cycle-audit-2026-08-27]] — ở đây chỉ ghi **cái gì landed ở đâu**,
không chép lại phân tích.

## Shipped

### Master — 3 MR, 3 tag trong cùng một ngày

| Hash | Tag / MR | Nội dung |
|------|----------|----------|
| `9db03c4b9` | `v2.34.88` · !2502 | merge **fix - be - anchor legacy change-discount price at cycle 0 once past the change point**. Nội dung ở `bd17de9d6` (`fix/legacy-change-discount-mid-life-repricing`): `getSellingPlanVariables.js` +33/−2. Test đi trước ở `51ec13289` (*"reproduce legacy change-discount repricing on mid-life contracts"*, +83). |
| `09433eb8f` | `v2.34.89` · !2503 | merge **fix - be - keep `plans[]` on the contract's current selling plan after a frequency change**. Nội dung ở `e5f2dcef5`: helper mới `helpers/subscription/syncPlanSellingPlanId.js` (+48) + `services/shopifyService.js` (+32/−10). Test trước ở `f5150fe58` (+126). Đây là cái **thật sự** gác đường charge — xem audit. |
| `daffd79b7` | `v2.34.90` · !2504 | merge **fix - be - take line app discounts from allocations so the plan discount is not subtracted twice**. |

Chi tiết nhánh `fix/line-discounted-price-from-allocations` của !2504 (đọc ngược từ dưới lên):

| Hash | Nội dung |
|------|----------|
| `c73ef3b09` | test đi trước: *"pin `lineDiscountedPrice` to real allocations, not a stale price gap"* — `prepareLineDiscountData.test.js` +78 |
| `fface0aaa` | fix chính — `prepareLineDiscountData.js` +15/−4 |
| `8d5fa35d4` | **giữ nguyên số của Shopify khi line CÓ allocation, bỏ qua khoảng chênh khi line KHÔNG có** — +47 test, +10/−1 code. Đây là mệnh đề quyết định của cả MR |
| `d16ad6cb4` · `43538b464` · `47442ca8e` | 3 commit `chore - be - trim comments` / `drop the comment` — thuần dọn comment, không đổi hành vi |

**!2504 đóng nốt câu hỏi treo hôm qua.** [[discount-per-cycle-audit-2026-08-27]] ghi bug thứ ba
*"subtotal admin hiện 56 thay vì 64 — CHƯA VÁ"*, nguyên nhân là `otherDiscounts` được **suy** từ
khoảng chênh `oldCurrentPrice * qty − oldLineDiscountedPrice`, mà cặp đó lệch chỉ vì `currentPrice`
cũ; `line.discountAllocations` thật ra là `[]`. Audit cũng cảnh báo trước điều kiện phải chốt:
*"`collectOrderSummary` đã trừ `getLineAppDiscount(line)` một lần, nếu `prepareLineDiscountData`
cũng trừ allocations thì thành trừ đôi"*. Tiêu đề !2504 (*"…so the plan discount is not subtracted
twice"*) cộng với `8d5fa35d4` (có allocation → tin số Shopify; không có → **không** suy từ gap)
cho thấy đúng cảnh báo đó đã được xử lý chứ không bị bỏ qua. index.md dòng mô tả
[[subscriptions]] hiện vẫn ghi bug này "chưa vá" — cần cập nhật khi mature note này.

### Nhánh `fix/kookut-issues` — 2 commit, chưa merge

| Hash | Nội dung |
|------|----------|
| `d36eae64e` | **fix - be - re-quote the shipping option the customer chose, not Shopify's cheapest.** Cờ *"Always use lowest shipping rate"* đang đọc `selectedDeliveryOption` — tức pre-selection của chính Shopify, là option rẻ nhất trong group. Với kookut đó là rate **0.00** ⇒ mọi đơn recurring bị quote 0 và shop không thu được phí ship; chỗ nào khác 0 thì nó **âm thầm chuyển khách từ giao tận nhà sang điểm nhận hàng**. Nay hỏi `deliveryOptions` và match theo **title option lưu trên contract**; option đã lưu không còn được chào thì **skip chứ không ghi giá** cho dịch vụ khách chưa từng chọn. 5 file, +394/−9 — gồm helper mới `pickRecurringShippingOption.js` (+67) kèm test (+91), `shippingProfileService.js`, `const/graphql/mutation/cart.js`, và script audit `auditSubscriptionShippingRate.js` (+205) |
| `163835a50` | **chore - be - add read-only probes for subscription shipping quotes.** 5 script trong `commands/misc/` (+426, không sửa file nào): `quoteContractShipping` (getLowestShippingRate sẽ ghi gì + full offer), `probeCartGroups` (so trực tiếp group ONE_TIME vs SUBSCRIPTION trên cùng cart), `dumpDeliveryProfiles`, `probeProfileById`, `probeVariantDeliveryProfile`. Chính bộ này dựng nên bằng chứng đã gửi CS: group SUBSCRIPTION chỉ được chào **đúng một** option 0.00 trong khi ONE_TIME được chào **năm** option đúng giá, vì delivery profile subscription của shop **không gắn sản phẩm nào**. → [[kookut-yeu-cau-cau-hinh-shipping]] |

Đây là dạng "công cụ điều tra ở lại trong repo" — trước đó ba report kookut untracked đã bốc hơi
khi repo đổi nhánh ([[digest-subscriptions-2026-08-19]]); lần này probe được **commit** nên còn
dùng lại được.

## Reverted

Không có revert nào trong log 08-27.

## Deploy notes

- **Không cờ nào**: không `[deploy-functions]`, không `[deploy-all]`, không `[deploy-extensions]`.
  Cả 3 MR đều nằm trong `packages/functions/src`, đi bằng đường deploy thường.
- **Version bump: 3 tag trong một ngày** — `v2.34.88` → `v2.34.89` → `v2.34.90`. Nhịp này
  bất thường; nó phản ánh việc vá nóng đúng cụm giá của ticket `JSUB-260826-BLxRXu`.
- **Không migration, không đụng `firestore.indexes.json`.** Việc chữa dữ liệu đã lệch được làm
  bằng **script chạy tay** (repair 5 contract Moba Matcha bằng chính `syncPlanSellingPlanId`,
  ghi ở audit), không bằng migration — nên nó không để lại dấu vết nào trong git log này.
- Khoảng trống tag `v2.34.80`→`v2.34.83` và `v2.34.85`/`v2.34.86` **vẫn treo** từ
  [[shipped-subscriptions-2026-08-27]]; log hôm nay không lấp được chỗ nào.

## ⚠️ Cần xác nhận

1. **`selectedDeliveryOption` có phải là "option rẻ nhất" không — hai nguồn nói khác nhau.**
   - [[digest-subscriptions-2026-08-19]] ghi: *"`getLowestShippingRate` đọc `selectedDeliveryOption`
     (option Shopify đang chọn sẵn) **chứ không phải rate rẻ nhất**"* — tức tách bạch hai khái niệm,
     và quy phần còn lại của triệu chứng cho việc profile của merchant **trùng rate**.
   - Commit body `d36eae64e` (08-27) ghi ngược lại: *"`selectedDeliveryOption` … is Shopify's own
     pre-selection — **the cheapest option in the group**"*, tức pre-selection **chính là** option
     rẻ nhất, và đó là lý do phải đổi sang match theo title.
   Hai câu này dẫn tới hai kết luận khác nhau về *cái gì đang hỏng*: một bên là "app đọc đúng thứ,
   dữ liệu merchant trùng rate"; một bên là "app đọc nhầm thứ, và thứ đó luôn là rẻ nhất".
   Fix đã viết theo phiên bản 08-27. **Chưa kiểm** Shopify có bảo đảm pre-selection = rẻ nhất
   hay không (có thể là mặc định *theo thứ tự cấu hình*, trùng khớp trên kookut vì group chỉ có
   một option). Nếu Shopify **không** bảo đảm điều đó thì câu chữ của commit sai dù fix vẫn đúng —
   và câu chữ đó sẽ được người sau đọc như luật. Rẻ nhất để chốt: chạy `probeCartGroups`
   (`163835a50`) trên một shop có group SUBSCRIPTION **nhiều hơn một** option, xem
   `selectedDeliveryOption` rơi vào option nào.

2. **`d36eae64e` đã lên prod chưa.** [[kookut-yeu-cau-cau-hinh-shipping]] gửi CS ghi fix này là
   *"đã fix, chờ deploy"*; log hôm nay xác nhận nó **vẫn ở nhánh `fix/kookut-issues`**, chưa có
   MR, chưa có tag. Trong khi đó thư đã forward cho merchant nói fix là việc *"separately, we found
   and fixed"*. Không sai, nhưng nếu merchant gán profile xong trước khi nhánh này merge thì họ vẫn
   gặp đúng triệu chứng cũ (bị đẩy sang DPD điểm nhận). Cần theo dõi thứ tự hai việc này.

## Liên quan

[[subscriptions]] · [[shipped-subscriptions-2026-08-27]] · [[discount-per-cycle-audit-2026-08-27]] ·
[[kookut-yeu-cau-cau-hinh-shipping]] · [[kookut-bug-report]] · [[digest-subscriptions-2026-08-19]] ·
[[shipped-subscriptions-2026-08-19]] · [[subscriptions-debug-runbook]] ·
[[tien-khong-duoc-lay-float-lam-chuan]] · [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] ·
[[ack-khong-phai-hieu-ung]]
