---
type: note
title: Shipped subscriptions 2026-08-17 — master nhận 8 MR / 2 tag, cụm portal preview + Chatty API
summary: Commit landed 08-17 — master nhận 8 MR (2 tag `v2.34.72` API read-only cho Chatty Helpdesk, `v2.34.73` volume bundle per-unit pricing; 4 MR sau tag chưa được tag: overselling recurring charge SB-15699, guard orphan order, command khôi phục 16 đơn bị bulk-delete, key devzone); trên nhánh: trọn cụm portal preview (history/upcoming/banner/version card), middleware `no-store` cho `/integrate/**`, và volume bundle đọc tier client-set; không revert, không migration.
tags: [avada, subscription, shopify, extensions, caching, billing]
created: 2026-08-18
updated: 2026-08-18
source: repo "subscriptions" — git log (commit 2026-08-17, hash + tag đã verify từ log)
---

# Shipped — subscriptions (commit landed 2026-08-17)

> Phần *học được* của ngày này (cache Hosting 404 API có auth, `functions:config` băm JSON,
> `getExternalApps()` không filter, detector so `NaN`) đã ghi ở [[digest-subscriptions-2026-08-17]];
> phần volume bundle tier ở [[digest-subscriptions-volume-bundle-2026-08-17]]. Không lặp lại.

## Shipped — vào master

| Tag | MR | Merge | Nội dung |
|-----|----|-------|----------|
| — | !2482 | `314da4c93` | cho phép **overselling** trên recurring charge (SB-15699) |
| — | !2480 | `933f92e12` | guard trang Orders khi order mồ côi (contract đã xoá) |
| — | !2479 | `8c8930b54` | command khôi phục 16 order đã processed bị bulk-delete |
| — | !2478 | `40026b681` | "Add key devzone" |
| `v2.34.73` | !2474 | `2ece283ab` | volume bundle: per-unit pricing, serving pill, benefit row |
| `v2.34.72` | !2476 | `c946a3259` | API read-only cho Chatty Helpdesk |
| — | !2477 | `60157164e` | mockup-app + PRD (BA) |
| — | !2473 | `1cbd30626` | mockup-app + PRD (BA) |

Bốn MR đầu nằm **sau** tag `v2.34.73` và chưa mang tag nào — theo cách deploy prod chạy
theo git tag đã ghi ở [[digest-subscriptions-2026-08-10]], phần đó chưa ra prod tại thời
điểm cắt log.

**Overselling cho recurring charge — SB-15699** (`74c236975` → merge `314da4c93`, 10 file,
+585/−11). Billing attempt tạo ra không kèm `inventoryPolicy` nên Shopify rơi về
`PRODUCT_VARIANT_INVENTORY_POLICY` và tôn trọng `DENY` của variant → mọi đơn recurring
fail khi Shopify báo hết hàng. Số đo trên shop báo lỗi: `INSUFFICIENT_INVENTORY` chiếm
**21/35** charge fail trong 30 ngày, 89 upcoming order xếp hàng sau cùng một variant.
Nay Dev Zone → Enterprise → Out of Stock nhận allowlist sản phẩm hoặc cờ "select all";
order chạm sản phẩm trong allowlist được charge với `ALLOW_OVERSELLING`. Ba điểm thiết kế
đáng giữ:
- Policy đặt **theo từng billing attempt**, nên variant giữ nguyên `DENY` và checkout
  one-time vẫn bị chặn — đúng cái merchant xin.
- "All products" lưu là **cờ**, không materialize thành danh sách id, vì danh sách lưu
  sẵn sẽ mục ruỗng âm thầm khi catalogue đổi.
- Allowlist dạy luôn `enableAutoRemoveOOS` chừa các line đó ra: trước đây order nhiều
  line bị bỏ đúng sản phẩm merchant muốn thu, còn order một line thì thu bình thường —
  cùng một sản phẩm hành xử khác nhau tuỳ ai chung cycle với nó.
- Ranh giới: `ALLOW_OVERSELLING` chỉ bỏ qua tồn kho. Line có product DRAFT/ARCHIVED/đã xoá
  vẫn bị `autoRemoveUnavailableProductLines` gỡ.

**Guard order mồ côi** (`98913da93` FE + `890b192a9` BE → merge `933f92e12`). Contract bị
xoá (ví dụ sau bulk delete) làm backend trả order **không có** `subscriptionContract`; 5
chỗ trong Orders table đọc thẳng `subscriptionContract.currency` → sập cả trang. Vá bằng
optional chaining + fallback `shop?.currency`, đúng pattern đã dùng sẵn ở
`TableUpcomingOrder`/`OrderDetail`. Phía BE, `getOrdersByContractOrSubscriber`
(`GET /orders/specific`) destructure `{plan, plans}` không guard → `find()` trả `undefined`
là 500 cả list; default `{}`. Cùng họ với ca "doc Firestore thiếu field làm trắng trang"
ở [[digest-subscriptions-2026-08-06]] — và cả hai đều do **quét hết chỗ đọc cùng shape**
mới sạch.

**Khôi phục 16 order bị bulk-delete** (`7e4de4a28` → merge `8c8930b54`, +3.992 dòng).
Bulk delete subscription hard-delete **mọi** order của contract đã cancel; trên shop
`51q36nfKRxPs0y7Xb6bk` ngày 2026-08-17 mất 16 order đã processed (4 BILLED, 12 UNBILLED).
Trạng thái trước khi xoá lấy lại từ **BigQuery CDC changelog** và commit thẳng vào
`commands/data/deleted-processed-orders.json`; `restoreDeletedProcessedOrders.js` tạo lại
từng doc theo đúng document id cũ (idempotent: bỏ qua doc đã tồn tại, guard `shopId` +
`processed`). Cần `serviceAccount.json` có quyền ghi Firestore → **techlead chạy tay**.
Kỹ thuật BQ changelog forensics đã ghi ở [[digest-subscriptions-2026-07-19]] — đây là lần
dùng thật để phục hồi dữ liệu.

⚠️ Đây là fix hậu quả, **không phải fix nguyên nhân**: bulk delete vẫn hard-delete order
đã processed. Không thấy commit nào chặn hành vi đó trong log ngày này.

**API read-only cho Chatty Helpdesk — `v2.34.72`** (`a0ce90e6b` → merge `c946a3259`, !2476).
Controller `apiHookV1/customerSubscriptionsController` + route `integrateApi`, kèm
`stripJoyAttributes` (nối tiếp chuỗi strip `_joy_*` ở [[shipped-subscriptions-2026-08-07]]).
Chuỗi commit theo sau trên nhánh `feat/chatty-subscription-api`: `6eb3474f3` cờ
`forwardWebhook` để app chỉ-gọi-vào không bị fan-out webhook, `7f2f52845` chấp nhận key
`external_app.configs` chữ thường, `2d8adf14c` coi chuỗi `"false"` là opt-out — cả ba
chính là hệ quả trực tiếp của hai gotcha `functions:config` ghi ở
[[digest-subscriptions-2026-08-17]].

**"Add key devzone"** (`24cd4e41c` → merge `40026b681`, `devZoneController.js` +7/−1).
Commit không có body; nội dung thật không đọc được từ log.

## Reverted

Không có revert nào trong log ngày này (master lẫn nhánh).

## Deploy notes

- **`[deploy-functions]`**: `40bf24b6e` "Custom widget" — bắt buộc CI deploy đầy đủ.
  Commit này cũng sửa `.gitlab/ci/staging3.yml` (đổi slot staging, cùng họ với
  [[2026-08-14-staging-4-cho-nhanh-sidekick]] bên repo pdf) và bump asset
  `theme-app-extension/assets/avada-subscription.js`.
- **Tag**: `v2.34.72`, `v2.34.73`. Bốn MR merge sau `v2.34.73` chưa có tag → chưa ra prod.
- **Migration**: không có (không đụng `firestore.indexes.json`, không SQL).
- **Data ops**: `deleted-processed-orders.json` + `restoreDeletedProcessedOrders.js` là
  script chạy tay cần service account — không tự chạy theo deploy.
- Middleware `no-store` cho `/integrate/**` (`1deaa03b8`) **còn trên nhánh**
  `fix/integrate-no-store` — tức lỗ cache CDN mô tả ở [[khong-cache-response-co-auth]]
  vẫn đang hở trên prod tại thời điểm cắt log, dù API Chatty (`v2.34.72`) đã lên.

## Còn trên nhánh (chưa vào master)

- **`feat/portal-preview`** — preview có lịch sử thật: contract ở cycle N nay mang N order
  đã bill phía sau và 10 order phía trước (`82ddfb4ed`), order history mang order number
  dạng `#` suy từ contract + cycle (`46a58404a`), id contract rút ngắn cho vừa card
  (`259451be2`). Dữ liệu 10 order/contract lộ ra một bug thật của handler: mọi mutation
  (skip, reschedule, note, sửa line) **resolve order theo contract**, nên luôn rơi vào
  cycle gần nhất bất kể caller hỏi cycle nào.
- **Quyết định preview settle trước khi render** (`208e3d44f`, `12491b11a`): preview bật từ
  câu trả lời thật của `GET /subscriptions`, mà chỉ tab My subscriptions hỏi câu đó — mọi
  request bay ra trước đó (`/analytics` đọc count = 0) giữ nguyên kết quả live và không hỏi
  lại. Vòng đầu vá bằng "mở mặc định ở tab My subscriptions", vòng sau vá đúng chỗ: giải
  quyết trong pha loading provider vốn đã giữ children, timeout 6s thì thả về live data.
  Tri-state preview này đã ghi ở [[shipped-subscriptions-2026-08-01]].
- **Banner/modal xác nhận đang xem dữ liệu mẫu** (`bdcd428e2`/`9c968e88a`, `6937ac216`).
  Ràng buộc nền tảng đáng giữ: `@shopify/ui-extensions` 2025.7.4 bắt Modal phải nằm trong
  prop `overlay` của activator và **chỉ mở được bằng một cú bấm thật** → new customer
  account dùng banner, classic portal mới dùng modal thật.
- **`feat/portal-version-ui`** (`89b7dad18`, `9ffae2fab`) + rebuild card
  (`b3fd2c0e5`): version picker theo mockup MR 2475 (radio phẳng, không phải card chọn
  được), nút preview hiện cả ở Legacy vì classic preview chạy bằng URL portal + cờ
  `joy_preview`, không cần customer account page.
- **`fix/volume-bundle-discount`** (`a22ad41ba`, `07d54b0f1`) — xem mục ⚠️ bên dưới và
  [[2026-08-18-volume-tier-line-attribute]].
- **`fix/kookut-pricing`** (`717f04026`, commit ngày 08-14) — script **chỉ đọc** đối chiếu
  `basePrice` từng line với `PriceList.prices(originType: FIXED)`; đúng kết luận
  "`contextualPricing` không đáng tin trên kookut" của [[digest-subscriptions-2026-08-15]].

## ⚠️ Cần xác nhận

**1. Discount function tin line attribute do client set — ngược hướng đã chốt 3 lần.**

| Nguồn | Nói gì |
|-------|--------|
| [[shipped-subscriptions-2026-07-24]] (`e1a386e39`, tag `v2.34.24`, !2386) + [[digest-subscriptions-2026-07-25]] + [[digest-subscriptions-2026-08-09]] | cart line attribute là **client-settable**, nên Shopify Function **không được** lấy nó làm nguồn tính giảm giá; nhánh `frozenDiscount` bị **bỏ hẳn** |
| commit `a22ad41ba` (nhánh `fix/volume-bundle-discount`, 08-17) | ghim tier khách chọn vào line attribute `__volume_tier` lúc add-to-cart và **đọc nó trong discount function** |

Commit có nêu rào chắn: pin chỉ được tin **khi line còn giữ đúng quantity của tier đó**,
sửa quantity hoặc giỏ tạo trước khi attribute tồn tại thì rơi về cách suy tier theo
quantity như cũ. Cần người xác nhận rào chắn này đủ hay không, vì nó thu hẹp chứ không
đóng bề mặt. Chi tiết + Tradeoff ở [[2026-08-18-volume-tier-line-attribute]].

**2. Bề mặt API cho app ngoài — câu hỏi treo từ 08-08 nay có thêm dữ liệu.**
[[shipped-subscriptions-2026-08-08]] đã treo mâu thuẫn "endpoint `clientApi` public mới vs
hướng xoá hẳn `publicApi`" ([[digest-subscriptions-2026-07-20]]). Ngày 08-17 bề mặt này
lớn thêm: `integrateApi` lên master (`v2.34.72`) + guide 241 dòng giao cho team Chatty
(`bb8690bfa`). Điểm khác so với `publicApi` cũ: `/integrate/**` **resolve cả shop lẫn
customer từ JWT đã ký**, không phải key hardcode. Nghiêng về "không mâu thuẫn" — nhưng
người xác nhận nên chốt hẳn để câu hỏi thôi treo sang tháng thứ hai.

**3. Bulk delete vẫn hard-delete order đã processed.** Ngày 08-17 chỉ ship command khôi
phục (`7e4de4a28`); không có commit nào chặn hành vi gốc. Cần xác nhận đây là "chấp nhận
tạm" hay là việc còn nợ.

Liên quan: [[subscriptions]] · [[shipped-subscriptions-2026-08-15]] ·
[[digest-subscriptions-2026-08-16]] · [[digest-subscriptions-2026-08-17]] ·
[[digest-subscriptions-volume-bundle-2026-08-17]] · [[khong-cache-response-co-auth]]
