---
type: note
title: Digest Joy Subscription — 2026-09-11
summary: Vòng dựng lại portal Wholefoods lộ ra một họ lỗi "ghi đè thay vì gộp" (attribute contract bị `subscriptionDraftUpdate` thay cả mảng, `direction: undefined` đè default của repository, `endsWith('')` luôn true xoá sạch marker), cộng phát hiện doanh thu app tự ghi thấp hơn số Shopify thật sự thu ~3 lần, và một lượt báo cáo sai vì chính công cụ `grep` trả kết quả sai.
tags: [avada, subscription, shopify, extensions, firestore, billing, debug]
created: 2026-09-11
updated: 2026-09-11
source: project `subscriptions` — session history 2026-09-10/11 (6 session, nặng nhất là `feat/wholefoods-portal`)
---

# Digest — `subscriptions`, 2026-09-11

Phần cart drawer Minimog, chunk 404 trên CDN, cờ DevZone hide-recurring và luật delivery-day
đã ghi ở [[digest-subscriptions-2026-09-10]] · [[2026-09-10-devzone-hide-recurring-pricing]] ·
[[2026-09-10-cutoff-theo-delivery-day]]. Note này CHỈ phần mới.

## Bugs

**Ghi đè thay vì gộp — một họ, bốn lần vấp trong cùng đợt.**

| Chỗ | Cái gì bị đè | Hậu quả |
|-----|--------------|---------|
| `subscriptionDraftUpdate` | **thay cả mảng** `customAttributes` chứ không merge | xoá mất `_joy_source: 'manual'` ⇒ webhook `subscription_contracts/create` đi nhánh checkout và đòi `originOrder` |
| `subscriptionContractController` (clientApi) | `direction: undefined` **đè** default `desc` của repository | list portal trả về **10 contract CŨ NHẤT**, contract vừa tạo không bao giờ lên |
| script PATCH attribute | `String(x).endsWith('')` **luôn true** khi `boxVariantId` rỗng | mọi line bị gán là box ⇒ xoá sạch marker `__fixed_bundle_staple` của 5 line |
| script seed | `LIMIT <= 0` trong Firestore nghĩa là **không giới hạn**, và `CLEAN` chạy ngay trước reseed | báo "đã xoá" trong khi dữ liệu được tạo lại ngay sau đó; phải thêm cờ `CLEAN_ONLY` riêng |

Điểm chung: một giá trị "rỗng/không truyền" được tầng dưới hiểu thành *lệnh* thay vì thành
*không có ý kiến*. Cùng lớp với [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]].

**`calculatePricing` destructure `productPlan` không guard làm trắng CẢ portal.**
`calculateCurrentPriceByTier` destructure `productPlan` (và `getDiscountValueFromDiscountConfig`
destructure `plan`) không default ⇒ line nào tra plan không ra là sập toàn bộ extension. Crash
**phụ thuộc dữ liệu**, có sẵn từ trước, nằm trong helper dùng chung — không phải regression của
đợt này. Cùng họ với lỗi thiếu field `product` ở [[digest-subscriptions-2026-08-06]].

**Test hồi quy cho guard đó ban đầu PASS cả khi gỡ guard** — fixture sai signature nên nó không
chạm đường crash; suýt được đem ra làm bằng chứng. Chỉ sau khi sửa fixture (`contract.plans` là
**mảng**, không phải map; `productPlan` fallback về `contract.plan`) thì mutation-check mới fail
đúng thông báo lỗi thấy trên browser. → [[gate-tu-viet-la-nguon-xanh-gia]] ·
[[fixture-khong-phai-hop-dong-du-lieu]].

**Doanh thu app tự ghi ≠ tiền Shopify thật sự thu.** Shop `0vvfmr-xr`: `billingHistory` trong
Firestore chỉ có **$199**, trong khi REST `recurring_application_charges` (query bằng token shop
giải mã từ `ACCESS_TOKEN_KEY_PROD`) cho **4 charge ≈ $597 gross** — app mất dấu các chu kỳ gia hạn.
Nên mọi câu hỏi "store này trả bao nhiêu" phải hỏi Shopify, không hỏi bảng của app.

**Picker hỏng VĨNH VIỄN khi gõ rồi xoá nhanh** — response cũ về sau ghi đè state của truy vấn
mới, danh sách không bao giờ hồi lại (không phải hỏng một lần). Cùng đợt: 14 request search bắn
song song không cái nào trả về, sửa bằng 1 effect + debounce + chặn trùng in-flight + cache
module-level để remount không tốn request.

**`(products || []).filter is not a function`** — `useFetchApi` gán thẳng `respData.data`, endpoint
trả object thì `products` là object và toán tử `||` không cứu được. Guard chặn sập, nhưng vẫn phải
truy tiếp vì sao payload không phải mảng, kẻo picker rỗng im lặng.

**`formatMoney` hardcode `'en-AU'`** ⇒ hiện `USD 900.00` thay vì `$900.00`. Locale không "sở hữu"
currency — ba file đang giữ ba bản copy của cùng một formatter.

## Techniques

**Giới hạn CỨNG của Customer Account UI extension (tra bằng type union, không đoán).**
`grep "color?:"` toàn bộ component surface → **0 match**. Không custom CSS/webfont.

| Thứ | Giá trị hợp lệ |
|-----|----------------|
| `Background` | `transparent` · `base` · `subdued` — không có amber/green |
| `Badge tone` | `default` · `critical` · `subdued` — **không** có success/warning |
| `Text appearance` | có `success` · `warning` · `accent` · `subdued` · `info` ⇒ đường duy nhất ra màu |
| `Banner status` | `info` · `success` · `warning` · `critical` — thứ duy nhất có nền màu thật |
| `BlockAlignment` | `start` · `center` · `end` · `baseline` — `"stretch"` **bị bỏ qua im lặng** |
| `IconSource` | `orderBox` · `clock` · `calendar` · `settings` · `horizontalDots` hợp lệ; `product`, `check-circle`, `x-circle` **không** |
| `View border` | nhận `'dashed'` ⇒ divider đứt nét làm được, dù `Divider` chỉ vẽ nét liền |

Hai lần tôi kết luận "platform không hỗ trợ" rồi phải rút lại — nên tra hết bề mặt API trước khi
tuyên bố giới hạn. → [[prop-sai-bi-bo-qua-im-lang]].

**Bố cục:** `View` **luôn fill chiều ngang parent** (badge full-width là do đó, không phải prop).
`Pressable`+`Card` đo được 169px trong ô lưới 292px — `ResourceItem` mới fill đúng ô.
Cột `['auto','fill','auto']` chứa nút nhãn dài hoặc `<Image>` không ràng tỉ lệ sẽ nuốt hết bề
ngang, làm title vỡ **mỗi dòng một ký tự** — lỗi này xuất hiện ở 2 file, sửa một chỗ mà không grep
chỗ còn lại là đúng cái đã bị nhắc.

**Dựng data test phải đi đường của chính app, không tự gọi GraphQL.** Chuỗi chạy được:
`POST /api/v1/subscription-contract/manual-create` (→ `validateManualSubscription` →
`buildManualContractInput` → `subscriptionContractAtomicCreate`) tạo contract **thật trên Shopify**;
patch attribute bundle + 8 key của Bird; rồi gọi thẳng `handleSubscriptionContractCreate` —
chính webhook handler — để sync về app bằng **logic thật**. Điều kiện: customer phải **đã có
payment method**. Ghi Firestore không thôi thì portal đọc được nhưng mọi mutation lên Shopify fail.

**Lib của repo gọi `admin.firestore()` trên DEFAULT app** — script tạo app có tên sẽ chết với
`undefined is not iterable`. Phải `admin.initializeApp({projectId})` làm default TRƯỚC khi require
lib. Store dev nằm ở project khác prod (`ag-subscriptions-staging-3`, xem bằng `firebase use`).

**Model fixed bundle thật (đọc từ contract prod, không suy từ code):** dòng box chỉ mang
`__selling_plan_id`; dòng staple mang `__box_id` + `__fixed_bundle_staple` +
`__fixed_bundle_box_selling_plan`. Contract thật **không có mảng `lines`** — nó dùng `products` /
`productIds` / `lineIds`, và `customAttributes` nằm ở tầng khác. Mọi helper viết theo `lines` đều
phải fallback.

**`grep` qua wrapper rtk trả KẾT QUẢ SAI** — báo 0 match cho chuỗi có thật (kể cả từ vốn có sẵn
trong file gốc). Hệ quả thật: tôi báo "đã thêm devzone action" trong khi nó **chưa từng được ghi**,
và báo "đã xoá seed contract" trong khi chúng vẫn còn. Khi verify sự tồn tại của một chuỗi trong
file, đọc bằng Python/Read chứ đừng tin grep qua wrapper. `grep -c` trên bundle minify cũng vô
nghĩa (đếm dòng) — phải `grep -o | wc -l`.

## Context

- Staples **không** liên quan tới `offerProducts` của bundle: là các sản phẩm **cùng plan** với
  product fixed bundle trong contract, **trừ** mọi fixed bundle. Tôi tự suy sai một lần và bị chỉnh.
  One-time = mọi product trừ fixed bundle. `Add another box` = chỉ fixed bundle.
- Cờ tính năng đi theo pattern có sẵn: `shops/{id}.enabledFixedBundleStaples` bật bằng DevZone
  toggle (không hardcode domain), field `fixedBundleContext` ghim trên contract qua **ba đường**
  (devzone action, command backfill có gate theo cờ, và lúc contract create).
- Khách đang dùng **Simple Bundle**, chưa migrate sang fixed bundle của Joy — nên contract prod của
  họ không có marker nào; copy contract của họ về dev **không** giúp test được fixed bundle.
- Lỗi `pricingPolicy.cycleDiscounts.0.adjustmentType` (Expected value to not be null) là **hậu quả**
  chứ không phải nguyên nhân: picker đang mời những sản phẩm không thể thêm được vì không khớp plan
  của contract.
- Chặn edit có **hai cơ chế khác nhau, đừng lẫn**: cutoff/delivery-day chỉ gate 3 section
  box/staples/one-off; còn permission của portal đọc từ **metafield của shop** (không phải doc
  `shops` trong Firestore — settings nằm ở collection `settings`).
- `NEW_CP_BASE_URL` đang trỏ Tailscale funnel để test local; **phải revert trước mọi commit** — nó
  dùng chung với portal classic.
- 4 file backend dùng chung đã sửa (đổi hành vi cả portal cũ) còn chờ review:
  `subscriptionContractController.js` (thứ tự list), `calculatePricing.js` (guard crash),
  `routes/clientApi.js` (route mới), `devZoneController.js` / `subscriptionContractCreateService.js`.
- `yarn dev` chết vì worktree trong repo — root cause + cách vá ở
  [[worktree-trong-repo-lam-hong-tooling]].

## Liên quan

[[subscriptions]] · [[shipped-subscriptions-2026-09-11]] · [[digest-subscriptions-2026-09-10]] ·
[[digest-subscriptions-2026-09-09]] · [[2026-09-09-portal-wholefoods-extension-rieng]] ·
[[bang-chung-phan-biet-duoc]] (báo "đã thêm devzone action" vì tin một `grep` trả 0 match sai) ·
[[so-anh-khong-so-chu]] (cùng đợt dựng lại portal: bố cục chỉ lộ ra khi nhìn màn hình)
