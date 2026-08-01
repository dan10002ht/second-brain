---
type: note
title: Shipped PDF Invoice 2026-07-31 — v3.1.64/65, custom currency + fix nhận diện dev store; HS code & SMTP còn trên nhánh
summary: Commit landed 07-31 (v3.1.64→65): dev-zone custom currency + seed money format từ Shopify lúc install (kèm 2 fix có sẵn của filter `money`: đường email chưa từng đăng ký filter, và `toFixed` lệch cent), cộng fix nhận diện dev store đã chọn plan test để không rơi nhầm vào bucket promo 70%; còn trên nhánh: HS code + country of origin phủ 77/83 theme (SB-14896), Email Sender/Custom SMTP (có 1 fix XSS), Setup Checklist Card SB-14770; không revert, không `[deploy-functions]`.
tags: [pdf, invoice, shopify, avada]
created: 2026-08-01
source: repo "pdf" — git log (hash đã verify)
---

# Shipped — PDF Invoice, commit landed 2026-07-31

Chỉ ghi **cái gì đã landed và ở đâu**. Bản trước: [[shipped-pdf-2026-07-31]] (commit 07-30) ·
root cause / bài học gần nhất: [[digest-pdf-2026-07-30]].

> 📈 Đảo chiều so với hôm trước: 07-30 master chỉ nhận **1 dòng**, hôm nay nhận **2 MR + 2 tag**,
> trong đó có một feature ~2.300 dòng.

## Shipped (đã vào `master`)

### 1. `v3.1.65` — dev-zone custom currency + seed money format từ Shopify (MR !487)

Merge `d9124cb1f` (tag `v3.1.65`, `origin/master`) ← `14fc23576` (`origin/feat/dev-zone-custom-currency`).
Ticket **PDF-260730-fJGMuV**: merchant EU muốn `1.234,50 €` thay vì `€1,234.50`. Hướng chốt **chia 2 nhóm shop**:

- **Store mới**: `onCreateShop` / `afterInstall` seed `defaultMoneyFormat` + `defaultCurrencyLocale`
  từ `shopInfos.moneyFormat` — Shopify trả sẵn lúc install nên **không tốn thêm API call**. Thêm
  webhook `shop/update` **thứ hai** của app để resync khi merchant đổi format (handler của
  `@avada/core` bỏ mất `money_format` nên không dùng lại được). Cờ `isMoneyFormatSeeded` là
  **ranh giới duy nhất** phân biệt store mới/cũ.
- **Store cũ**: card "Custom currency" ở dev zone (port cơ chế từ app subscription) — toggle +
  `{locale, currency, currencyDisplay}`, field rỗng lấy default của shop. Override **chỉ đổi cách
  hiển thị, KHÔNG quy đổi tiền**.

Kèm 2 bug có sẵn được vá luôn — đáng nhớ hơn cả feature:
- `buildLiquid` (**đường email**) **chưa bao giờ đăng ký filter `money`** → invoice trong email in số
  thô hoặc ăn format của shop render trước đó. Giờ filter đọc settings từ render context và đăng ký một lần.
- `toFixed` làm tròn trên số nhị phân (`2.675 → 2.67`), lệch cent so với `Intl` và storefront → đổi sang
  lấy digits qua `Intl`.

Quy mô: 25 file, +2.331/-34, trong đó `supportedLocales.js` 555 dòng và **5 file test mới**
(`moneyFormat`, `moneyFilter`, `moneyFilterIsolation`, `customCurrency`, `shopUpdateMoneyFormat`).
Message ghi 375 test pass, riêng phần tiền 89 case.

### 2. `v3.1.64` — promo: nhận diện dev store đã chọn plan để test (MR !485)

Merge `071ebeae2` (tag `v3.1.64`) ← `606b3404b` (`origin/feat/cross-app-promo-modal`).
Dev store đời mới chọn plan test nên `plan_name` trả về `"basic"`/`"grow"`, trong khi `isShopifyTest`
chỉ bắt trial/affiliate/partner_test/staff → **dev store bị xếp nhầm vào nhóm merchant thật và có thể
rơi vào bucket 70% Joy**. Shopify đánh dấu ở `plan_display_name` ("Basic App Development",
"Developer Preview"), mà `@avada/core` lưu nguyên payload REST `shop.get()` vào `shopInfos` →
field đã có sẵn trong DB từ lúc install, chỉ cần `whoami` map ra FE, **không tốn request Shopify nào**.
3 file, +7/-2: `isDevelopmentStore({shopifyPlanDisplayName})` khớp `/develop/i`, `shop.service.js`
trả thêm field, `getCrossAppPromoVariant.js` cộng vào `isTestStore`.

👉 Đây là **hậu quả trực tiếp** của cơ chế chia 70-30 bằng hash `shop.id` ghi ở [[shipped-pdf-2026-07-31]] —
nhánh đó giờ đã merge và đang được vá phần phân loại store.

## Còn trên nhánh (chưa merge)

- **HS code + country of origin, SB-14896** (`origin/feat/item-hs-code`): `fcd5dbd5f` fetch
  `inventoryItem.countryCodeOfOrigin` cùng `harmonizedSystemCode`, expose `item.hs_code` /
  `item.country_of_origin`, thêm 2 setting `isItemHSCode`/`isItemCountryOfOrigin` **gate theo
  Professional**, render across **65 theme** (83 file, +529). `ce6aada81` sinh label cho 9 locale bằng
  `autoTranslateV2` + **override thủ công tiếng Tây Ban Nha**: auto-translate ra "Pais natal"
  (nơi sinh) — sai cho field hải quan → đổi "Pais de origen". `5c468c9ca` lượt 2: lượt đầu key theo
  block `isItemSKU` nên **bỏ sót 12 theme** render line item bằng `{% if item.sku %}` trần
  (barcelona/sydney/three/venice) và `newyork_invoice` chỉ render `item.name`. Coverage chốt
  **77/83 theme merchant chọn được**; 6 theme `*_unpaid` còn lại duyệt `bill.orders` chứ không phải
  line item nên không áp dụng.
- **Email Sender + Custom SMTP** (`origin/feature/email-sender-custom-smtp`):
  `7a356c9d3` **HTML-escape email merchant trong template verification (XSS)** — 2 file, sửa ở cả
  `customEmail.controller.js` lẫn `emailNotification.service.js`;
  `6134c894e` + `478d19528` đưa "Verify your email" thành **link dưới field** (thay nút
  `connectedRight` làm input bị bóp) và **ẩn hẳn khi `customSenderEmail` rỗng** thay vì hiện disabled;
  `79729975a` trỏ message required của smtpHost/Port/Username/Password về key
  `Settings.validation.required` **đã dịch sẵn 9 locale**.
  i18n đi 2 bước cố ý: `be16d4498` **xoá** khối `emailSettingsV2` thêm tay khỏi `en.json`/`origin.json`
  để `yarn update-label` không skip, rồi `b860e2286` chạy regen đủ 11 file (+1.123).
- **Setup Checklist Card SB-14770** (`origin/feature/SB-14770-setup-checklist-card`): tiếp tục từ
  `e6966bb38` hôm trước — `ce8e96919` dựng `SetupChecklistCard` (JS/JSON/SCSS 415 dòng) + 17 key ×
  11 locale + `vite.config.js`; `ec50c975d` thêm backend thật (`quickstart.service.js` +171,
  `detectCompletedTasks.js` +144, `printDemoInvoice.js`) kèm **3 file test mới** (~560 dòng);
  `3260738e6` viết lại task list theo PRD mới; `3a09908a7` nối `PrintOrder` + `constants/order.js`.

## Reverted

- **Không có revert** trong cửa sổ này.

## Deploy notes

- **Không có commit `[deploy-functions]`.**
- **2 version bump**: `v3.1.64` (`071ebeae2`), `v3.1.65` (`d9124cb1f`). Nối tiếp `v3.1.61` của
  [[shipped-pdf-2026-07-31]] — `v3.1.62`/`v3.1.63` **không xuất hiện trong log này** (chưa xác minh
  là landed ngoài cửa sổ hay bị bỏ số).
- **Không có migration file.** Nhưng `v3.1.65` có **backfill ngầm theo thời gian**: store cũ *không*
  được seed `defaultMoneyFormat`, chỉ store mới (và store cũ cài lại app) mới tự áp. Cờ
  `isMoneyFormatSeeded` là thứ duy nhất phân biệt → khi debug format tiền phải hỏi cờ này trước.
- **Webhook mới**: `shop/update` thứ hai (`webhook.route.js` +8, `webhook.controller.js` +6) —
  đăng ký webhook là việc ngoài code, cần kiểm sau deploy.
- Bỏ qua như noise: `39abfb93f` "trigger deploy" và `ac84e5cba` "Update gitlab branch staging"
  (đều 1 dòng `.gitlab-ci.yml`), `30ad52dc6` "Update text" (đổi copy 3 key × 11 locale).

## Liên kết gợi ý

[[pdf]] · [[digest-pdf-2026-07-31]] (bài học cùng cửa sổ — SMTP đi nhờ Chatty, liên quan nhánh
Email Sender/Custom SMTP ở trên) · [[shipped-pdf-2026-07-31]] · [[digest-pdf-2026-07-30]] · [[digest-pdf-2026-07-29]] ·
[[digest-pdf-2026-07-23]] · [[shipped-pdf-2026-07-22]] · [[digest-pdf-2026-07-21]] ·
[[subscriptions]] · [[shipped-subscriptions-2026-07-30]] · [[shopify-app-dev]] ·
[[firestore-multitenant]] · [[controller-service-repository]]
