---
type: note
title: Giá theo cycle sai ở 2 tầng discount — audit 2026-08-27
summary: BA bug độc lập cùng làm giá subscription sai — !2502 (nhánh legacy không nhận cycle) và !2503 (plans[] lệch sellingPlanId sau đổi tần suất, ĐÂY mới là cái thu dư 8 EUR thật) đã merge + repair xong; còn bug thứ ba chưa vá: subtotal admin hiện 56 thay vì 64 do otherDiscounts suy từ dữ liệu cũ.
tags: [avada, subscription, shopify, billing, debug, agent]
created: 2026-08-27
updated: 2026-08-27
source: đọc trực tiếp repo `subscriptions` @ `32b0ea7c7` trên VM dantt-solar + query Firestore prod (chỉ đọc) qua `agent-query`
---

# Giá theo cycle sai ở 2 tầng discount — audit 2026-08-27

Xuất phát từ ticket `JSUB-260826-BLxRXu` (charge 72 € thay vì 64 €). Agent support tự
tìm ra, tôi verify lại bằng code + dữ liệu prod. **Case đã giao dev xử lý** — note này
để lần sau audit sâu hơn, không phải để làm ngay.

## Kết luận ngắn

Có **hai bug độc lập**, hay bị gộp làm một vì triệu chứng giống nhau ("giá upcoming sai"):

| | Tầng 1 — tier / `pricingPolicy` | Tầng 2 — manual discount + `recurringCycleLimit` |
|---|---|---|
| Hậu quả | **Charge sai tiền thật** | Chỉ sai hiển thị |
| Ai giữ sự thật | **App** (app ghi đè policy lên Shopify trước khi charge) | **Shopify** (app không đẩy lại theo cycle) |
| Trạng thái | Bug đã xác nhận bằng đơn hàng thật | Bug hiển thị, logic cần đã có sẵn nhưng không được gọi |

## Tầng 1 — nhánh legacy không biết cycle

`helpers/utils/getSellingPlanVariables.js`:

```js
export const getCycleDiscountVariables = (plan, basePrice, currentBillingCycle) => {
  if (!plan?.discountConfig) {
    return getLegacyCycleDiscountVariables(plan, basePrice);      // ← KHÔNG có cycle
  }
  return getCycleDiscountTiersVariables(plan, basePrice, currentBillingCycle);  // ← CÓ cycle
};

export const getLegacyCycleDiscountVariables = (plan, basePrice) => {
  const pricingDefault = { ..., afterCycle: 0, computedPrice: <giá đơn đầu> };
  const additionalPricingPolicy = { ..., afterCycle: parseInt(plan.numberBeforeChange), ... };
};
```

Sự bất đối xứng giữa hai nhánh **chính là bug**. Nhánh legacy luôn đóng đinh giá đơn đầu
vào `afterCycle: 0`; đẩy lại policy đó lên Shopify giữa vòng đời thì Shopify re-anchor
`afterCycle` từ thời điểm đổi ⇒ đơn recurring kế tiếp bị tính lại giá đơn đầu.

**Bằng chứng — contract `24349311307`** (doc `LPwmmkK06TjTzf120Aes`, `currentBillingCycle: 3`):

```
plan.discountConfig        null      ← nên đi nhánh legacy, KHÔNG phải tiers
plan.discountValue         "10"      (đơn đầu)
plan.discountValueChanged  "20"      (từ đơn 2 trở đi)
plan.numberBeforeChange    1
plan.enabledChangeDiscount true
```

Đơn thật trên Shopify (`order.originalTotalPriceSet`, **không** phải mirror):

| cycle | đơn | thực thu | đúng phải là |
|---|---|---|---|
| 0 | #2036 | 72 € | 72 ✓ |
| 1 | #2141 | 64 € | 64 ✓ |
| 3 | **#2284** | **72 €** | 64 ✗ — thu dư 8 € |

Cả **14** order doc (cycle 0→13) đều mang `cycleDiscounts = [after0=72.0, after1=64.0]`
⇒ mọi kỳ còn lại sẽ tiếp tục sai, không phải sự cố một lần.

### Đã có fix nhưng không ăn

Commit `fc22efc3a` (2026-08-20) — *"fix - be - apply legacy change-discount tier price
per cycle in billing"* — thêm lớp chắn ở `services/subscription/contractService.js:833`:

```js
if (Array.isArray(editedContractData?.lines) && isMultiTierPlan(plan)) {
  editedContractData.lines = prepareLineDiscountData({order: editedContractData, plans, plan});
}
```

`migrateDiscountConfig` **có** quy plan legacy về dạng tier (`enabledChangeDiscount` +
`numberBeforeChange` → 2 tier), nên `isMultiTierPlan` trả `true` cho contract này. Lớp
chắn đáng lẽ phải chạy. Vậy mà 5 ngày sau, #2284 (25/08) vẫn thu 72, và cycle doc sinh
ra đúng phút đó vẫn mang `[72, 64]`.

Giả thuyết mạnh nhất (chưa chứng minh): lớp chắn chỉ ăn khi **có một edit chảy qua**
`handleSyncEditedContractToCurrentCycle`. Không edit thì không đẩy gì lên, Shopify cứ
bill theo policy cũ nó đang giữ — đúng như doc comment của `isMultiTierPlan` tự nói:
*"multi-tier → the app will overwrite Shopify's policy with the projected tier"*.
Contract này đổi tần suất 8 tuần → 6 tuần **trước** 20/08, và `plan.sellingPlanId`
(`689691230539`, plan cũ) vẫn lệch với `sellingPlanId` mức contract (`689691296075`)
⇒ mirror của plan chưa từng đồng bộ lại sau lần đổi.

**Hệ quả:** `fc22efc3a` vá đường đi tới, **không** chạm các contract đã lệch sẵn.

## Tầng 2 — `recurringCycleLimit` không có mặt ở đường tính giá

`helpers/subscription/preparePriceOfCycle.js` (cả file 19 dòng):

```js
const computedPrice = pricingPolicy?.cycleDiscounts?.[0]?.computedPrice?.amount   // ← luôn [0]
  ? pricingPolicy?.cycleDiscounts?.[0]?.computedPrice?.amount
  : currentPrice.amount;
```

Hàm không nhận `cycleIndex`. `currentPrice` của **mọi** cycle = `cycleDiscounts[0]`.
Hai nơi gọi: `services/graphql/contractService.js:82`, `services/graphql/orderService.js:306`.

Manual discount mang `recurringCycleLimit` sống ở cấu trúc khác (`discounts` /
`discountAllocations`), và bên đó cũng không ai lọc theo cycle:

```js
export const getTotalSavings = (discountAllocations = [], ...) =>
  discountAllocations.reduce((acc, a) => acc + parseFloat(a.amount.amount || 0), init);
```

### Logic cần đã có sẵn — chỉ là không được gọi

`helpers/subscription/discount.js` đã có đủ:

```js
const getExpireAfter = (recurringCycleLimit, usageCount) => recurringCycleLimit - usageCount;

export const getValidDiscounts = discounts =>
  discounts.filter(d => !d.recurringCycleLimit || d.usageCount < d.recurringCycleLimit);
```

Nhưng `getValidDiscounts` **chỉ** được gọi từ component render *danh sách discount* —
`DiscountsCard`, `OrderSummary`, `OrderDetail` (assets) và `DiscountsCard` (scripttag).
Đường **giá** không nhánh nào chạm tới. `calculateTotalDiscount` cũng chỉ dùng cho
**phí ship** ở `services/graphql/billingCycleService.js:240`.

⇒ App nói một đằng hiện một nẻo: thẻ discount ghi "Expire after 1 order(s)", bảng giá
ngay cạnh thì áp discount đó cho mọi cycle. Đúng triệu chứng ticket `JSUB-260827-UjQwHh`
(contract `23650664726`: `TYDEBBIE` 100% `recurringCycleLimit: 1` → upcoming hiện $0 hết).

## Bốn câu CHƯA chốt — việc cho lần audit sau

1. **`usageCount` nghĩa là gì.** Contract `23650664726` (`aLYWTdFhDLOZNxW6PfKY`),
   `shopifySyncedAt` 2026-08-26 11:17 UTC (rất mới), `currentBillingCycle: 1`, nhưng
   **cả hai discount đều `usageCount: 0`** — kể cả `FINLEY LEGACY` nằm trong
   `initialDiscountIds`. Trong khi `getExpiredDiscounts` giả định ngược lại:
   ```js
   const usageCountOnRecurringOrder = isInitialDiscount ? usageCount - 1 : usageCount;  // → -1
   ```
   Hoặc Shopify không tăng `usageCount` ở đơn checkout (⇒ công thức trên sai), hoặc mirror
   lấy sai field (⇒ số 0 sai). Hai khả năng lệch nhau **đúng một cycle**.
   Cách rẻ nhất để chốt: lấy contract đã qua ≥2 kỳ có manual discount `recurringCycleLimit`,
   đối chiếu `usageCount` trong Firestore với `usageCount` Shopify trả thẳng.
2. **`fc22efc3a` đã deploy prod chưa** tính tới 25/08 — chưa kiểm được bằng quyền view.
   Quyết định giữa "chưa deploy" và "fix không phủ đường này".
3. **Bao nhiêu contract đã lệch sẵn.** Điều kiện quét: `plan.discountConfig == null` +
   `enabledChangeDiscount` + `currentBillingCycle > numberBeforeChange`. Con số này quyết
   định đây là case lẻ hay sự cố diện rộng. **Chưa quét.**

4. **`null` vs `0` của `recurringCycleLimit` — hai bên hiểu ngược nhau.**
   `knowledge/gotchas.md` trên VM ghi: Shopify ép `null` → `1` (chỉ áp cycle đầu), muốn
   "áp mọi cycle" phải truyền `0` tường minh. Nhưng `getValidDiscounts` lại coi cả `null`
   lẫn `0` là "không giới hạn, luôn hợp lệ":
   ```js
   if (!recurringCycleLimit) return true;
   ```
   Nếu gotcha đúng thì discount có `recurringCycleLimit: null` sẽ hiển thị là còn hiệu
   lực mãi mãi trong khi Shopify chỉ áp cho cycle đầu. Cùng lớp bug với tầng 2, nhưng
   nguồn khác. **Chưa xác minh** — cần đối chiếu với `services/graphql/discountService.js:438`
   (`recurringCycleLimit = 1` làm mặc định) và `services/discountService.js:14`
   (`recurringCycleLimit: 0`) xem hai chỗ này có đang nói cùng một thứ không.

## Bẫy khi đối chiếu

`price` của order doc trong Firestore **không phải số đã thu** — nó bằng
`cycleDiscounts[0]`, nên hiện 72 ở cả 14 cycle kể cả cycle 1 mà Shopify thực thu 64.
Muốn biết tiền thật phải đọc `order.originalTotalPriceSet` / `subtotalPriceSet`.

## Liên quan

- [[subscriptions]] · [[subscriptions-debug-runbook]]
- [[agent-support-design]] — case này do agent support tự tìm ra, là 1 trong 3 ticket thật đầu tiên
- [[tien-khong-duoc-lay-float-lam-chuan]]

---

# Cập nhật 27/08 — đã đi hết luồng, kết quả khác giả thuyết ban đầu

## Nguyên nhân THẬT của lần thu dư 8 EUR

Không phải !2502. Contract `24349311307`: khách đổi tần suất 8→6 tuần, contract nhận
`sellingPlanId` mới `689691296075` nhưng **`plans[]` giữ id cũ** `689691230539`
(`UPDATE_PLAN_FIELDS` không mang `sellingPlanId`). Lúc billing,
`prepareLineDiscountData` tra `plans.find(p => p.sellingPlanId === line.sellingPlanId)`
→ trượt → `return line` nguyên xi → đẩy nguyên giá đơn đầu 72 lên cycle → charge.

Đã chứng minh bằng cách chạy chính hàm đó trên dữ liệu prod: trước 72, sau 64.

## Đã xử lý

| | |
|---|---|
| !2502 | merged `9db03c4b` — nhánh legacy nhận `currentBillingCycle`, thu bảng giá về 1 bậc. **Không nằm trên đường charge** (bước đẩy chỉ set `currentPrice`, không set `cycleDiscounts`) — nó gác đường *sửa contract* |
| !2503 | merged — `syncPlanSellingPlanId` giữ `plans[]` đúng id. **Đây mới là cái gác đường charge** |
| Repair dữ liệu | 5 contract của Moba Matcha đã sửa `plan`/`plans[]` bằng chính `syncPlanSellingPlanId`. Diff trước/sau: đúng 2 thay đổi, không mất skip, không đổi ngày |
| Xác minh | 5 đơn sắp tới (`#JOY1045-4..8`) đều 72 → **64 OK** khi chạy đúng hàm luồng billing gọi |

## Bug thứ ba — CHƯA VÁ: subtotal admin hiện 56

`prepareLineDiscountData` dòng cuối:

```js
const otherDiscounts = Math.max(oldCurrentPrice * qty - oldLineDiscountedPrice, 0);  // 72 - 64 = 8
const lineDiscountedPrice = computedPrice * qty - otherDiscounts;                    // 64 - 8 = 56
```

Nó suy "discount khác" từ khoảng chênh của **dữ liệu đang lưu**, mà cặp đó lệch chỉ vì
`currentPrice` cũ. `line.discountAllocations` thật sự là `[]`. Tiền charge 64 vẫn đúng,
chỉ hiển thị sai — và đây chính là con số `54/56` khách kêu trong ticket gốc.

Trước khi sửa phải chốt: `collectOrderSummary` **đã** trừ `getLineAppDiscount(line)` một
lần. Nếu `prepareLineDiscountData` cũng trừ allocations thì thành trừ đôi.

## Ba luật đã ghi vào runbook trên VM

Xem `knowledge/apps/subscriptions.md` mục **4b-bis / 4b-ter / 4b-quater**:

- **Ngày lấy từ Firestore**, không lấy từ Shopify — app tự tính lịch, hai bên lệch hẳn sau
  reschedule (đo được: app 6 tuần/đơn, Shopify 14 tuần)
- **Hai trục `cycleIndex`** — app và Shopify không bằng nhau (đo được: app 4 vs Shopify 1),
  cố ý, vì nhiều đơn app có thể cùng bill một cycle Shopify. Tier chọn theo trục app, draft
  ghi theo trục Shopify, **cả hai đều đúng**
- **Edit của cycle Shopify không phải hồ sơ của một đơn** — ai charge sau ghi đè người trước.
  Muốn biết đơn thu bao nhiêu thì đọc `order.originalTotalPriceSet` của chính đơn đó

## Chưa xác minh

- Hai đơn app cùng trỏ một cycle Shopify và charge gần nhau → cycle chỉ giữ một giá, ai sync
  sau thắng. `hasBlockingBillingAttemptForCycle` cố ý chỉ chặn theo app cycleIndex nên không
  ngăn được. Chưa gặp thật.
- Refund 8 EUR cho `#2284` — vẫn chờ merchant.
