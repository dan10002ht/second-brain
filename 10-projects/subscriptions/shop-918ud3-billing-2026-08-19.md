# Shop 918ud3-zi — vì sao đang bị tính phí (2026-08-19)

Shop: `918ud3-zi.myshopify.com` (THE LUCKY HAND™, id Firestore `AZgs43xXnvz1JK0lmixh`)
Nguồn: Firestore **prod** (đọc qua `serviceAccount.prod.json`), collections `shops` và `integrations`. Chỉ đọc, không sửa gì.

## Kết luận ngắn

Shop **đủ điều kiện free-forever theo ngày cài đặt** (`installedAt` = 2025-09-11, trước mốc cutoff
2025-11-04). Nhưng field `shop.customPricing.enabled = true` đang tồn tại trên shop doc, và hàm
`isFreeForever()` **kiểm tra `customPricing.enabled` trước cả `installedAt`** — hễ field này là
`true` thì free-forever bị tắt ngay, bất kể ngày cài đặt. Đây là nguyên nhân trực tiếp.

Nội dung `customPricing.plans` có một entry `{id: 'starter', price: 0, transactionFee: 0, enabled: true}`
— khớp **chính xác từng field** với object mà code tự động tạo ra khi Joy Loyalty tặng free Starter
cho shop dùng chung Loyalty (`shopService.js` CASE 1, xem bên dưới). Vậy Joy Loyalty **có liên quan
kỹ thuật thật**, không chỉ là thoả thuận thương mại ngoài code — nhưng cơ chế dọn dẹp khi gỡ Loyalty
(CASE 2) đã **không chạy** cho shop này vì một điều kiện guard (`!shop.recurChargeId`), nên
`customPricing.enabled` bị kẹt ở `true` vĩnh viễn.

**Có phải do toggle DevZone không**: **có, với độ tin cậy cao** (dựa trên bằng chứng cấu trúc dữ
liệu, không phải log trực tiếp — xem "Chưa xác minh" bên dưới). Mắt xích quyết định: shape của 2
entry `free`/`enterprise` trong `customPricing.plans` chỉ khớp với **một cửa sổ thời gian cụ thể**
của code FE DevZone, không khớp bất kỳ phiên bản nào khác, và cũng không khớp shape mà bất kỳ writer
tự động nào (Loyalty CASE 1/2, `afterChargeService.js`) từng tạo ra cho các entry đó.

Chi tiết:
- FE hiện tại (`CustomPricing.js:35-44`, `getPlansPayload()`) gửi **6 field**: `id, price,
  transactionFee, enabled, maxRevenue, trialDays` — field `trialDays` được thêm ở commit
  `9d4f7ff8f` (2026-06-16, "Group feature reward and feature cancellation flow to retention
  group").
- Bản FE ngay trước đó, từ commit `6d8de8f7f` (2026-03-09, "Refactor dev zone") đến trước
  `9d4f7ff8f`, gửi **5 field**: `id, price, transactionFee, enabled, maxRevenue` — **không có**
  `trialDays`.
- Bản FE cũ hơn nữa (trước `6d8de8f7f`, file khi đó ở path `pages/DevZone/CustomPricing.js`, xem
  `git show c501c7814:packages/assets/src/pages/DevZone/CustomPricing.js`) gửi **toàn bộ object
  plan mặc định** (`id, handle, name, price, maxRevenue, trialDays, shopifyTrialDays, circleDays,
  circleYears, type, transactionFee, featureList, notIncludedFeatureList, features, includeText,
  ...` — xem `config/plans.js:68-83` cho shape đầy đủ của `FREE_PLAN`).
- Backend `update-pricing-settings` (`devZoneController.js:1174-1182`) ghi `plans` **y nguyên**
  từ payload FE, không strip, không transform field nào — nên shape ghi vào Firestore phản ánh
  đúng shape FE tại thời điểm bấm Save (xem phần "Backend có strip field không" bên dưới).
- Dữ liệu thật của shop: entry `free` = `{id, price:0, transactionFee:1.5, enabled:true,
  maxRevenue:1000}`, entry `enterprise` = `{id, price:null, transactionFee:0, enabled:false,
  maxRevenue:null}` — **đúng 5 field, không có `trialDays`, không có `name/handle/featureList`**.
  → Khớp **chính xác** với shape FE trong cửa sổ `6d8de8f7f` → `9d4f7ff8f` (2026-03-09 đến
  2026-06-16), không khớp bản trước đó (thiếu handle/name/featureList) và không khớp bản hiện tại
  (thiếu trialDays).
- Cửa sổ thời gian này **bao trùm** thời điểm tích hợp Loyalty của shop được tạo
  (`joyio.createdAt = 2026-04-03`, nằm giữa 2026-03-09 và 2026-06-16) — tức về mặt kỹ thuật một cú
  Save DevZone trong giai đoạn này là khả thi và để lại đúng dấu vết quan sát được.
- Entry `starter` (giá 0/phí 0, chỉ 4 field, không có `maxRevenue`) **không khớp** shape DevZone ở
  bất kỳ thời điểm nào — nhưng khớp tuyệt đối với object CASE 1 tự tạo
  (`shopService.js:104-107`: `{id: loyaltyPlanId, price: 0, transactionFee: 0, enabled: true}`).
  Code CASE 1 filter `otherPlans = plans.filter(p => p.id !== loyaltyPlanId)` rồi append lại
  entry `starter` của riêng nó — nghĩa là **nếu** một DevZone Save trước đó từng ghi entry
  `starter` (5 field, có `maxRevenue`), CASE 1 sẽ **xoá và thay bằng bản 4-field của chính nó**,
  trong khi để nguyên các entry `free`/`enterprise` khác. Điều này giải thích chính xác vì sao
  entry `starter` có shape khác hẳn 2 entry còn lại trong cùng 1 mảng `plans` — không phải do 2
  nguồn ghi trộn lẫn ngẫu nhiên, mà là dấu vết của: **DevZone Save trước** (tạo shape 5-field cho
  free/enterprise, có thể cả starter ban đầu) **→ Loyalty CASE 1 chạy sau** (ghi đè riêng entry
  `starter` bằng shape 4-field của nó, giữ nguyên free/enterprise).

→ Kết luận: **nhiều khả năng có** một lần bấm Save trong DevZone "Custom Pricing" tab, xảy ra
trong khoảng 2026-03-09 – 2026-06-16 (khớp shape, khớp cửa sổ thời gian có Loyalty). Đây là suy
luận từ shape dữ liệu + lịch sử code, **không phải bằng chứng log trực tiếp** (không có audit log
ghi ai/khi nào bấm) — xem phần "Chưa xác minh" để biết giới hạn của kết luận này.

## Dữ liệu thật đọc được

Từ `shops/AZgs43xXnvz1JK0lmixh` (Firestore prod):

| Field | Giá trị | Ghi chú |
|---|---|---|
| `installedAt` | `2025-09-11T08:47:30Z` | trước cutoff free-forever |
| `newPlanVersion` | `true` | shop chạy pricing model V2 |
| `plan` | `"starter"` | plan hiện tại |
| `recurChargeId` | `"88207425923"` | có charge Shopify thật đang chạy |
| `isOnTrial` | `true` | |
| `subscriptionDate` / `subStartAt` / `renewSubscriptionDate` | `2026-08-18T15:42:0{7,8}Z` | charge Starter hiện tại mới bắt đầu **hôm qua** |
| `trialEndsAt` | `2026-08-30T15:42:07Z` | |
| `customPricing.enabled` | `true` | **field then chốt gây mất free-forever** |
| `customPricing.plans` | `[{id:"free", price:0, transactionFee:1.5, enabled:true, maxRevenue:1000}, {id:"enterprise", price:null, transactionFee:0, enabled:false, maxRevenue:null}, {id:"starter", price:0, transactionFee:0, enabled:true}]` | entry `free`/`enterprise` = giá trị mặc định chuẩn plan (đối chiếu `config/plans.js:75,81`); entry `starter` khớp y hệt object mà Loyalty CASE 1 tự tạo |
| `forcePricingVersion` | **không có field này trong doc** | → DevZone "force pricing version" toggle **không** được dùng cho shop này |
| `isPartnerStore` | `false` | |
| `planDiscountCode` | `null` | không dùng Starter Program coupon (`isStarterProgramCoupon` không áp dụng) |
| `dunningAmounts` | 2 entries: tháng 2026-04 và 2026-08 | có lịch sử billing/dunning |

Từ `integrations` (where `shopifyDomain == 918ud3-zi.myshopify.com`):

| doc | app | Giá trị | Ghi chú |
|---|---|---|---|
| `7cVRAP9PPW5LyQ9mm2O2` | `joyio` (Joy Loyalty) | `plan: "advanced_2026"`, `isFreeAdvanced: false`, `enable: false`, `createdAt: 2026-04-03T18:41:27Z` | Loyalty hiện đang **disable** — khớp mô tả "gỡ loyalty" của user |
| `q68FSdi8qiawb9iF1JYk` | `klaviyo` | `enable: false`, `disableDate: 2026-08-13` | không liên quan |

Không có field/collection nào cho thấy lịch sử uninstall/reinstall app Subscription của chính shop
này (`shop.uninstalledAt` không tồn tại trong doc hiện tại, `lastUninstalledAt` cũng không có) → đọc
được thì **không có dấu hiệu shop từng uninstall/reinstall app Subscription**.

## Logic free-forever trong code

`packages/functions/src/config/plans.js:1102-1117`:

```js
export function isFreeForever(shop) {
  if (getForcedPricingVersion(shop)) {
    return false;
  }
  if (shop.customPricing && shop.customPricing.enabled) {
    return false;
  }
  const installedDate = adjustToTimezone(shop.installedAtTest || shop.installedAt, 'Etc/UTC');
  const goLivePricing = adjustToTimezone(GO_LIVE_PRICING, 'Etc/UTC');
  if (installedDate > goLivePricing) {
    return false;
  }
  return true;
}
```

`GO_LIVE_PRICING = new Date('2025-11-04T04:30:00.000Z')` (`config/plans.js:53`). Không có mốc v4
(`GO_LIVE_PRICING_V4 = 2026-03-16`, `config/plans.js:56`) liên quan tới `isFreeForever` — mốc đó
dùng cho `isNewPricingV4Shop`, một hàm khác.

**Áp vào dữ liệu shop này**:
- `getForcedPricingVersion(shop)` → `null` (không có `forcePricingVersion` field) → không chặn ở bước 1.
- `shop.customPricing.enabled === true` → **chặn ngay ở bước 2, return `false`**.
- Không bao giờ tới được bước so `installedAt` với cutoff — dù `installedAt` (2025-09-11) thực ra
  nằm trước cutoff và sẽ pass nếu tới được bước đó.

→ `isFreeForever(shop)` hiện trả về `false` cho shop này, **hoàn toàn do `customPricing.enabled`**,
không phải do ngày cài đặt.

### Nguồn gốc field `customPricing.enabled`

**Ba** nơi trong code ghi field này (đã grep lại toàn bộ `packages/functions/src`, xem "Grep lại
writer" bên dưới — không còn writer nào khác):

1. **`packages/functions/src/services/shopService.js:69-218`** (`syncShopPlanWithIntegrationLoyalty`)
   — chạy khi có webhook loyalty sync hoặc mỗi lần app Subscription publish/install lại
   (`installationService.js:158`). Logic:
   - **CASE 1** (dòng 99-110): nếu Loyalty đang `isFreeAdvanced && enable`, set
     `customPricing = {enabled: true, plans: [...otherPlans, {id: loyaltyPlanId, price: 0, transactionFee: 0, enabled: true}]}`.
     `loyaltyPlanId` với shop v4/v5 = `STARTER` (`helpers/integration/getDefaultLoyaltyPlan.js:12-15`).
     **→ khớp chính xác entry `starter` trong dữ liệu thật.**
   - **CASE 2** (dòng 170-211): chỉ chạy khi
     `isCurrentFreeLoyaltyPlan = shop.plan === loyaltyPlanId && !shop.recurChargeId` là `true` **và**
     Loyalty không còn eligible. Với shop này, `shop.plan === 'starter'` đúng, nhưng
     `shop.recurChargeId = "88207425923"` (có charge thật) → `!shop.recurChargeId` = `false` →
     **`isCurrentFreeLoyaltyPlan = false` → CASE 2 không chạy, `customPricing.enabled` không bao giờ
     được dọn về `false`.**
   - Ngay cả khi CASE 2 chạy được, code chỉ lọc field `plans` (`newCustomPricing = {...customPricing, plans: otherPlans}`)
     — **không có dòng nào set `enabled: false`** — nên dù chạy đúng, field `enabled` vẫn kẹt ở `true`
     (bug riêng, độc lập với guard `recurChargeId` ở trên).

2. **`packages/functions/src/controllers/devZoneController.js:1174-1182`** case
   `'update-pricing-settings'` — ghi trực tiếp:
   ```js
   case 'update-pricing-settings': {
     const {pricingEnabled, plans} = data.data;
     await updateShopData(shopId, {
       customPricing: {enabled: pricingEnabled, plans}
     });
     break;
   }
   ```
   **Backend không strip/transform field nào** — `plans` được ghi y nguyên object nhận từ FE (đây
   là mắt xích quyết định cho lập luận shape ở phần "Có phải do toggle DevZone không" — đã đọc
   trực tiếp, xác nhận **không** có logic lọc field ẩn nào). FE tương ứng:
   `packages/assets/src/pages/DevZone/TabsContent/Pricing/CustomPricing.js` — tab "Custom Pricing"
   trong DevZone, có toggle bật/tắt `pricingEnabled` và nút Save (`handleAction('save')`, dòng
   46-51 file đó).

3. **`packages/functions/src/services/afterChargeService.js:126-146`** (trong `afterCharge`,
   chạy sau mỗi lần Shopify charge được activate) — nhánh riêng cho Starter Program coupon:
   ```js
   const charges = await shopify.recurringApplicationCharge.list();
   const lastCharge = charges.find(item => item.id == shop.recurChargeId);

   if (oldPlanId === STARTER && lastCharge.return_url.includes(STARTER_PROGRAM_COUPON)) {
     if (!shop.customPricing?.plans?.find(plan => plan.id === ENTERPRISE)?.enabled) {
       toUpdateShop.customPricing = null;
     } else {
       toUpdateShop.customPricing = {
         ...shop.customPricing,
         plans: [
           ...shop.customPricing.plans,
           {id: STARTER, price: 29, transactionFee: 1.5, enabled: true, maxRevenue: 2000}
         ]
       };
     }
   }
   ```
   Điều kiện kích hoạt: plan **trước** lần charge này là `STARTER`, và `return_url` của charge
   Shopify cuối cùng chứa chuỗi `STARTER_PROGRAM_COUPON = 'TEST2'` (`config/plans.js:38`, đã
   verify). Nếu điều kiện đúng và shop **không** có entry `enterprise` đang `enabled` trong
   `customPricing`, writer này **xoá sạch** `customPricing` (set `null`); nếu có, nó **thêm** một
   entry `starter` giá `$29`/phí `1.5%` (khác hẳn entry `starter` $0/0% thật sự có trong dữ liệu
   shop).
   **Tính liên quan tới shop này: chưa loại trừ được.** Báo cáo trước chỉ kiểm
   `shop.planDiscountCode === null` (field khác, không phải điều kiện của writer này — writer này
   đọc `return_url` của Shopify charge, không đọc `planDiscountCode`). Để loại trừ dứt điểm cần gọi
   Shopify Admin API đọc `return_url` của các `recurringApplicationCharge` cũ của shop xem có chứa
   `TEST2` không — **chưa gọi**, vì ngoài phạm vi read-only Firestore của lần điều tra này. Bằng
   chứng gián tiếp duy nhất hiện có: shape writer này tạo ra cho `starter` (giá 29, có
   `maxRevenue`) **không khớp** entry `starter` thật (giá 0, không có `maxRevenue`) — nên nếu writer
   này từng chạy, kết quả của nó đã bị ghi đè bởi lần chạy khác (nhiều khả năng CASE 1) sau đó, hoặc
   writer này chưa từng chạy cho shop này. Không đủ để kết luận chắc chắn theo hướng nào.

Không có field nào trên shop doc phân biệt được field `customPricing` do writer nào ghi lần cuối, và
không có audit-log collection nào lưu lịch sử gọi DevZone action / charge return_url theo shop —
nên **không đọc được bằng chứng trực tiếp xác nhận ai/khi nào**, chỉ có suy luận từ shape dữ liệu
(xem phần trên).

### Grep lại writer của `customPricing`

`grep -rn "customPricing" packages/functions/src` → 35 match trong 6 file:

- `config/plans.js` — **chỉ đọc** (`isFreeForever`, `getPlanPrice`/pricing lookup, `trialDays`
  lookup, `isPlanEnabled` check) — không ghi.
- `controllers/devZoneController.js` — 1 comment + writer #2 ở trên.
- `controllers/subscriptionController.js:76` — `customPricing: undefined` trong object trả về
  response (không phải ghi Firestore, chỉ shape response cho FE).
- `helpers/getCustomPricing.js` — **chỉ đọc**.
- `services/afterChargeService.js` — writer #3 ở trên.
- `services/shopService.js` — writer #1 (CASE 1 + CASE 2).

→ Xác nhận đúng **3 writer**, không có writer thứ tư nào bị bỏ sót.

## Trả lời 6 câu hỏi

1. **Plan hiện tại**: `starter`, có `recurChargeId` thật (`88207425923`), đang `isOnTrial: true`
   (trial mới bắt đầu hôm qua 2026-08-18, hết hạn 2026-08-30). Nguồn: `shops/AZgs43xXnvz1JK0lmixh`.

2. **`installedAt` thật**: `2025-09-11T08:47:30Z` — **nằm trong** cutoff free-forever
   (`GO_LIVE_PRICING = 2025-11-04T04:30:00Z`), tức nếu chỉ xét điều kiện ngày thì shop **đủ điều
   kiện** free-forever. Không có field `installedAtTest`.

3. **Lịch sử uninstall/reinstall Subscription app**: đọc trên shop doc hiện tại **không thấy**
   field `uninstalledAt` hoặc `lastUninstalledAt` → không có bằng chứng shop từng uninstall/reinstall
   app Subscription. (Không loại trừ hoàn toàn — nếu từng uninstall rồi reinstall và field bị ghi đè
   lần nữa sau đó thì dấu vết có thể mất, nhưng không có gì trong dữ liệu hiện tại gợi ý điều đó.)

4. **Logic free-forever nằm ở đâu**: `packages/functions/src/config/plans.js:1102-1117`
   (`isFreeForever`). Với dữ liệu thật của shop, hàm này trả về `false` — bị chặn bởi
   `shop.customPricing.enabled === true`, **không phải** bởi so sánh `installedAt`.

5. **Toggle DevZone**: **Nhiều khả năng có**, độ tin cậy cao hơn "không xác định được" ban đầu.
   Shape của 2 entry `free`/`enterprise` trong `customPricing.plans` (5 field, không có `trialDays`,
   không có `name/handle/featureList`) khớp **chính xác** với shape mà FE DevZone
   (`CustomPricing.js` → `getPlansPayload()`) gửi đi trong cửa sổ commit `6d8de8f7f` (2026-03-09) →
   `9d4f7ff8f` (2026-06-16) — không khớp bản trước đó (thiếu field, thiếu handle/name/featureList)
   cũng không khớp bản hiện tại (thiếu `trialDays`). Cửa sổ này bao trùm thời điểm Loyalty được tạo
   (`joyio.createdAt = 2026-04-03`). Backend `update-pricing-settings` không strip field nào — ghi
   `plans` y nguyên payload FE — nên mắt xích này đứng vững (xem "Backend có strip field không"
   ngay dưới). Entry `starter` (4-field, không match bất kỳ DevZone shape nào) khớp đúng object
   Loyalty CASE 1 tự sinh, và cơ chế filter-rồi-append của CASE 1 giải thích tự nhiên vì sao đúng
   1 entry (starter) có shape khác 2 entry còn lại trong cùng mảng. Kết luận: **nhiều khả năng có
   một lần Save DevZone** (tạo free/enterprise) **rồi sau đó Loyalty CASE 1 chạy** (ghi đè riêng
   entry starter) — đây là suy luận từ shape + lịch sử code, không phải audit log trực tiếp.

6. **Joy Loyalty có liên quan kỹ thuật không**: **Có, thật sự có** — không chỉ là thoả thuận thương
   mại. `packages/functions/src/services/shopService.js:69` (`syncShopPlanWithIntegrationLoyalty`)
   đọc trạng thái tích hợp Loyalty (`integrations` collection, app `joyio`) để tự động tặng/thu hồi
   plan Starter miễn phí bằng cách ghi `shop.customPricing`. Doc `integrations` của shop này
   (`7cVRAP9PPW5LyQ9mm2O2`) cho thấy Loyalty hiện `enable: false`, `isFreeAdvanced: false` — khớp mô
   tả "gỡ Loyalty" của user. Và entry `starter` còn sót trong `customPricing.plans` khớp chính xác
   shape mà code Loyalty tự sinh ra. Vấn đề là bug trong CASE 2 (dọn dẹp) khiến field không được xoá
   khi Loyalty bị gỡ, nên đây là **liên kết kỹ thuật thật, có bug**, không phải suy diễn.

### Backend `update-pricing-settings` có strip field không?

**Không.** Đọc trực tiếp `devZoneController.js:1174-1182` — code chỉ destructure
`{pricingEnabled, plans}` từ `data.data` rồi ghi thẳng `customPricing: {enabled: pricingEnabled,
plans}` vào Firestore, không có `.map()`, không có whitelist field, không có transform nào. Đây là
mắt xích yếu nhất của lập luận shape ở trên, và nó **đứng vững** — shape ghi vào Firestore phản ánh
đúng shape FE gửi lên tại thời điểm Save, nên suy luận "shape 5-field khớp cửa sổ code 2026-03-09 →
2026-06-16" là hợp lệ.

## Cách gỡ (KHÔNG tự làm)

Nếu muốn khôi phục free-forever cho shop này, cần dantt tự chạy (không tự động):

- Trên `shops/AZgs43xXnvz1JK0lmixh`: xoá hoặc set `customPricing.enabled = false` (và cân nhắc xoá
  hẳn entry `{id:"starter", price:0, transactionFee:0, enabled:true}` khỏi `customPricing.plans` nếu
  không còn dùng custom pricing gì khác cho shop này).
- Cần quyết định thêm: shop đang có `recurChargeId` thật + đang `isOnTrial` với charge Starter mới
  tạo hôm 2026-08-18 — nếu trả shop về free-forever, có thể cần huỷ charge Shopify hiện tại
  (`recurChargeId: "88207425923"`) và set lại `plan: "free"`/xoá `recurChargeId`, tuỳ chính sách
  merchant success muốn áp dụng — **đây là quyết định nghiệp vụ, không phải chỉ sửa 1 field**.
- Về mặt code (nếu muốn fix tận gốc cho các shop khác gặp tình huống tương tự): CASE 2 trong
  `shopService.js` (dòng ~169-211) nên set `enabled: false` khi `otherPlans` rỗng, và điều kiện guard
  `!shop.recurChargeId` ở `isCurrentFreeLoyaltyPlan` (dòng 88) nên được xem lại — nó khiến CASE 2
  không bao giờ chạy một khi shop có bất kỳ charge thật nào, kể cả charge không liên quan tới gift
  Loyalty ban đầu.

## Chưa xác minh

- **Không có audit log trực tiếp** ghi ai/khi nào bấm Save trong DevZone Pricing tab. Kết luận
  "nhiều khả năng có DevZone Save" ở trên là suy luận từ (a) shape dữ liệu khớp chính xác 1 cửa sổ
  thời gian cụ thể của code FE, (b) backend không strip field (đã verify), (c) cơ chế filter-append
  của Loyalty CASE 1 giải thích tự nhiên vì sao chỉ 1 trong 3 entry có shape khác — **không phải**
  bằng chứng log ghi nhận trực tiếp hành động. Không loại trừ hoàn toàn khả năng khác (vd: một script
  nội bộ / migration nào đó từng ghi `customPricing` với đúng shape 5-field này mà chưa được grep
  tới — dù đã grep lại toàn bộ `packages/functions/src` và chỉ thấy 3 writer, không writer nào khác
  ngoài DevZone tạo được shape 5-field cho free/enterprise).
- **Chưa loại trừ được** writer thứ 3 (`afterChargeService.js:126-146`, nhánh Starter Program
  coupon `TEST2`) có liên quan tới shop này hay không — cần đọc `return_url` của các
  `recurringApplicationCharge` cũ qua Shopify Admin API (chưa gọi, ngoài phạm vi read-only Firestore
  của lần điều tra này). Bằng chứng gián tiếp (shape `starter` writer#3 tạo ra là giá $29 có
  `maxRevenue`, không khớp entry `starter` $0 thật trong dữ liệu) gợi ý writer này **có thể** chưa
  từng chạy hoặc kết quả đã bị ghi đè sau đó bởi CASE 1 — nhưng không đủ để kết luận chắc chắn.
- **Không xác định được** vì sao charge Starter thật (`recurChargeId`) lại được tạo đúng hôm
  2026-08-18 (hôm trước ngày điều tra) — không rõ đây là do merchant tự bấm chọn Starter trên trang
  Plans (vì thấy mình không còn free-forever), hay do một quy trình billing tự động nào đó tạo charge.
  Chưa trace `afterChargeService.js` / flow tạo `recurringApplicationCharge` cho lần billing cụ thể
  này.
- **Không xác minh được** lịch sử đầy đủ của `customPricing` (không có snapshot/version cũ) — chỉ
  đọc được state hiện tại, nên nhận định "entry `starter` khớp với Loyalty CASE 1" là suy luận từ
  cấu trúc dữ liệu trùng khớp, không phải bằng chứng log trực tiếp.
