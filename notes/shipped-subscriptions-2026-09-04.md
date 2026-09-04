---
type: note
title: Shipped Joy Subscription — commit landed 2026-09-03
summary: Master nhận 3 tag trong một ngày (`v2.35.4` !2512 Parcely giữ pickup point trên đơn recurring, `v2.35.5` !2525 brand icon cho màn MCP consent, `v2.35.6` !2524 tính lại phí ship khi khách sửa MỘT KỲ + refactor gộp resolver); trên nhánh: 3 script vận hành phí ship dùng lại được và card Customer portal version theo mockup mới (bỏ checkbox navigation menu). Không revert, không cờ deploy, không migration.
tags: [avada, subscription, shopify, shipping, billing]
created: 2026-09-04
updated: 2026-09-04
source: repo `subscriptions` — git log 2026-09-03 (hash đã xác minh trong log)
---

Ngày 09-03 master nhận **3 tag**: `v2.35.4` → `v2.35.6`. Phần *kiến thức* của !2524
(root cause, cách đo, bẫy gate) đã nằm ở [[digest-subscriptions-2026-09-03]] — dưới đây
chỉ ghi **cái gì đã landed ở đâu**, không chép lại.

## Shipped (master)

| Tag / hash | Việc |
|---|---|
| `f70457b7f` **v2.35.4** (!2512) | **Parcely pickup point giữ trên mọi đơn recurring.** Nhánh `feat/parcely-integration` — provider giao hàng thứ ba, còn đang WIP ở [[shipped-subscriptions-2026-08-29]] — nay đã vào master. |
| `a9bae12bc` **v2.35.5** (!2525) | **Brand icon cho màn MCP consent** (`ba4c49906`, 9 file +202): atom `BrandMark`, const `clientBrands.js`, helper `clientBrand.js` + test (81 dòng), gắn vào `authorizePage.js` và `OauthBrandPair`. Commit title rỗng (`feat`) ở cả MR lẫn commit — phải đọc diff mới biết nó là gì. |
| `f73bff8df` **v2.35.6** (!2524) | **Tính lại phí ship khi khách sửa một kỳ, không chỉ khi sửa contract.** 3 commit: `d2d3a9a56` (fix, 8 file +670, sửa **cả hai** seam `handleOrderUpdate` và `handleSyncEditedContractToCurrentCycle`), `0fd0563f3` (refactor gộp 2 khối ~40 dòng inline thành `resolveEditedCycleShippingPrice`), `f4bb03cd0` (bớt comment thừa). Chỉ chạm shop bật `recurringOption = lowest` + `updateOnItemsChange` (**38 shop**). Đo prod: giỏ 51.48 → 0.00 CHF, giỏ 47.88 → 10.00. |

Hai lỗi thật lộ ra **trong lúc refactor** `0fd0563f3`, đáng nhớ vì cả hai đều là loại
refactor-mới-sinh-ra chứ không phải đổi tên:

- **Call site mất try/catch riêng.** Khối cũ tự bọc try/catch; tách ra thì lỗi rơi vào catch
  bao ngoài — mà catch đó bỏ qua luôn phần sync dòng phía sau ⇒ **bản sửa của khách không tới
  được đơn**. Đã bọc lại từng call site.
- **Cache theo identity object làm test phụ thuộc thứ tự** — cùng họ với ghi chú đã có ở
  [[digest-subscriptions-2026-09-03]]; test mới phải gọi `clearRecurringShippingPriceCache`
  trong `beforeEach`.
- **Prepaid nhân ở hai chỗ và cả hai đều đúng**: subtotal ×N để đo ngưỡng `TOTAL_PRICE` trên
  tổng đơn thật, giá ×N vì đơn giao N lần. Hệ quả phản trực giác: giỏ 40 ×3 = 120 vượt ngưỡng
  50 nên **miễn phí**, chứ không phải 10 ×3. Đã pin bằng test để người sau không "sửa lại cho
  nhất quán".

Gates của refactor: `jest:fn` 272 suite / 2908 test (trước: 271 / 2899) · `jest:as` 25 / 239.

## Trên nhánh (chưa vào master)

- **`chore/shipping-tools`** — `9d85a9f76`, 3 script vận hành (+645, dry-run mặc định, đều đọc
  rate table merchant chứ không cart quote):
  `repairCycleShippingPrice` (ghi lại phí ship cho một kỳ đã bị sửa, giá do resolver tính, kiểm
  lại số dòng + tổng giỏ sau khi ghi) · `auditEditedCycleShipping` (**64 kỳ bị sửa trên 4 shop
  nhưng chỉ 3 kỳ sai** — đếm kỳ-bị-sửa không thôi là thổi phồng) · `applyContractLinePrices`
  (sửa giá dòng mức contract, đã dùng cho **19 contract kookut**).
- **`feat/portal-ui-16175`** — `30532a9f9` + locale `4256f6c0f`: card *Customer portal version*
  theo mockup SB-16175. Dismiss banner nay **persist theo shop** (`shop.dismissedBanners` +
  `PUT /shops`, tái dùng pattern của `WidgetRebuildBanner`) thay vì `useState` cục bộ — trước đó
  reload là banner hiện lại. Nút "Go to theme" tách khỏi banner thành nút secondary luôn hiện;
  dismiss chỉ ẩn banner, không mở khoá preview.
- **`feat/portal-preview`** — `bf272773b` + locale `03cb24b8b`: bỏ banner "Contact us…" và **bỏ
  checkbox** *Add link to the Subscriptions portal page to navigation menus*, thay bằng helptext
  "To manage your navigation menus, click here". Đây là đổi hướng có hệ quả → xem
  [[2026-09-04-bo-checkbox-nav-menu-portal]].

## Deploy notes

- **Không** commit nào mang `[deploy-functions]` / `[deploy-all]` / `[deploy-extensions]`.
- **Không revert**, **không migration** (không file SQL, không `firestore.indexes.json`).
- 3 version bump trong một ngày: `v2.35.4` → `v2.35.5` → `v2.35.6`.
- `f73bff8df` chỉ chặn tái diễn — dữ liệu cũ phải chữa bằng `repairCycleShippingPrice` ở nhánh
  `chore/shipping-tools`, mà nhánh đó **chưa merge**.

## ⚠️ Cần xác nhận

**Seam nào là chỗ đúng để tính lại phí ship của một kỳ — một hay hai?**

- [[digest-subscriptions-2026-09-03]] viết: *"chỗ duy nhất đúng để tính lại phí ship là hàm sync
  đó, không phải chỗ ghi theo index app"* (tức `handleSyncEditedContractToCurrentCycle`, không
  phải `handleOrderUpdate`).
- Commit body `d2d3a9a56` (bản đã merge) viết ngược lại: *"Hai chỗ hở, sửa cả hai vì mỗi chỗ một
  mình đều không đủ"* — `handleOrderUpdate` một mình thì giá bị wipe lúc charge, hàm sync một
  mình thì thu đúng nhưng **màn hình hiện sai cho tới lúc charge**.

Code đã landed theo vế thứ hai. Nếu digest đúng như đang viết, người sau đọc nó sẽ kết luận
`handleOrderUpdate` không được đụng tới phí ship và có thể gỡ nửa fix. Cần sửa câu trong digest
thành "chỗ *đủ* để giá sống sót qua charge" thay vì "chỗ duy nhất đúng".

→ [[subscriptions]] · [[digest-subscriptions-2026-09-03]] · [[2026-08-28-shipping-lay-gia-tu-rate-table]] ·
[[shipped-subscriptions-2026-08-29]] · [[subscriptions-debug-runbook]]
