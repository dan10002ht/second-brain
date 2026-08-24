---
type: note
title: Digest subscriptions 2026-08-24 — CLS boot screen, landing joyxjoy nối tới plan/discount thật của app
summary: Shift của boot screen đến từ `2rem` neo vào html font-size mà Polaris hạ 16→13px (3 template phải sửa cả ba); landing joyxjoy chết ở add-to-cart vì Liquid không emit `variantId`; `theme push` in "pushed successfully" khi Shopify đã từ chối file; và `discountConfig.tiers` mới là nguồn discount thật chứ không phải `discountValue`.
tags: [subscription, shopify, storefront, performance, avada]
created: 2026-08-24
updated: 2026-08-24
source: project "subscriptions" — session history (2 session)
---

# Digest subscriptions — 2026-08-24

CHỈ phần mới. Những thứ đã ghi ở [[digest-subscriptions-joyxjoy-2026-08-20]], [[digest-subscriptions-2026-08-21]],
[[digest-subscriptions-2026-08-22]] (metafield `.value`, `PUBLIC_READ`, `/products.json` chứ không `.js`,
`1fr` = `minmax(auto,1fr)`, push section+template cùng lệnh làm mất setting, seed qua route HTTP thật) không lặp lại.

## Bugs

**Shift của boot screen đến từ `rem`, không phải từ `<br>`.** `#PreLoading` shift `220,97 → 220,103`.
Giả thuyết đầu (chiều cao `<br>`) sai — probe cho thấy `br` chỉ đổi 2px. Nguyên nhân thật: rule dùng `2rem`,
mà `rem` neo vào font-size của `html`, và sheet Polaris load sau đó hạ `html` từ 16px → 13px ⇒ rule tự co lại
và đẩy logo. Đổi sang đơn vị tuyệt đối: CLS 0.0146 → **0.0064**, shift `#PreLoading>img` biến mất, ổn định 3/3 run
(kỷ luật đo: [[do-layout-shift-bang-browser-automation]]).
Có **ba** boot template đều là source thật — `index.html` (dev), `standalone.html` và `embed-template.html`
(input build, `vite.config.js:415`) — sửa một cái là lệch parity.

**Dev standalone không tái hiện được CLS của prod.** Dưới network throttle, dev bundle (không minify) mất >14s
để tải nên run đầu còn kẹt ở boot screen, chưa kịp shift gì. Số đo được chỉ 0.0146 trong khi prod cao hơn hẳn.
⇒ đo CLS trên môi trường không giống prod là đo một trang khác.

**Skeleton của IndexTable chỉ khớp ở desktop.** Row thật cao 101px vì cell Products chứa `ProductGroup`
(thumbnail + tên), skeleton chỉ 1 dòng text ⇒ 60px. Desktop 60→60, không shift chút nào; chỉ mobile hỏng.
Và chiều cao row **không đồng nhất** (3 row đầu 101px, các row sau 60px), nên `minHeight` không cứu được —
đo lại thấy table **dịch xuống** `y 140 → 189` chứ không chỉ cao lên, CLS còn tăng 0.31 → 0.505. Fix đã rollback,
chỉ giữ fix boot logo. Lặp lại đúng cái bẫy của bản reserve chiều cao cũ (hardcode `min-height:820px`) đã revert trước đây.

**Landing joyxjoy: add-to-cart không ăn selling plan vì Liquid không emit `variantId`.** `window.AVADA_JW.bundles[]`
chỉ có 7 key (`available, handle, image, price, productId, selling_plan_groups, title`). Không phải lỗi selling plan
như chẩn đoán ban đầu — vòng `products` có emit variant, vòng `bundles` thì không.

**`submitOrder` không kiểm response của `/cart/add.js`.** `fetch` chỉ reject khi lỗi mạng; HTTP 422 vẫn resolve
bình thường ⇒ lỗi add-to-cart im lặng. Cùng họ với [[ack-khong-phai-hieu-ung]].

**Lệch 1 cent do float.** `8900¢ → 15% off → Big.js cho 17.935` (đúng), nhưng `17.935 * 100 === 1793.4999…`
nên `Math.round` trên float ra sai. Fix: nhân về cents bằng `Big()`. Khái quát hoá ở
[[tien-khong-duoc-lay-float-lam-chuan]].

**`frequencyValue` của plan app có đơn vị `month` bị dùng như tuần.** Gate xanh không thấy — và tệ hơn,
**test của chính lane đã đóng đinh hành vi sai thành "expected"**. Verifier độc lập bắt được; đó chính là lý do
verifier phải khác họ model với executor ([[2026-08-04-looptasks-verifier-doc-lap]]).

**`SummaryPanel` vẫn nhận prop `weeks` và hardcode `'Every N weeks'`** sau khi `FrequencySelector` đã chuyển
sang `plan.title` — sửa một nửa đường dữ liệu.

## Techniques

**`shopify theme push` in "pushed successfully" khi file KHÔNG hề lên store.** Push 3 lần, store đứng nguyên
27718 byte. Không phải race — Shopify từ chối file và lý do nằm trong output đầy đủ:
`Invalid schema: setting with id="bundle_script_url" 'info' is not a valid attribute`. Kỷ luật: sau mỗi push phải
**pull lại và so byte**, đừng đọc dòng success. Cùng họ [[ack-khong-phai-hieu-ung]].

**Plan app đã mang sẵn `sellingPlanId` của Shopify** (`plan "Every 1 month" → sellingPlanId: "2582380662"`)
nên không cần map tần suất thủ công.

**`discountConfig.tiers` mới là nguồn discount thật** (quyết định lấy plan app làm nguồn:
[[2026-08-24-landing-joyxjoy-dung-plan-cua-app]])**.** Một plan có `discountValue: 5` nhưng
`discountConfig.tiers[0].value = 20`; helper của repo ưu tiên `tiers`, và cart thật của Shopify cũng tính 7120
(= 20%). ⇒ `discountValue` là field cũ, đừng đọc nó để đối chiếu.

**`shop.metafields.avada_subscription_plan_v2.statuses` là shop-level** nên render được ở mọi trang (kể cả page
custom), nhưng chỉ chứa map `{planId: true}` — không có discount/frequency. Muốn plan đầy đủ phải đọc metafield
mức product (`plan_v2`), và app-embed in thẳng không qua `| json` (qua `| json` thì `json not allowed for this object`).

**`getDiscountConfig` + `getPrice` ở `packages/functions/src/helpers/` là helper thuần** (chỉ phụ thuộc `big.js`,
`big.js` hoisted ở root) nên scripttag import lại được qua alias `@functions/*` — không phải viết lại logic tier.

**Seed dev qua đúng luồng HTTP của app làm nhiều hơn ghi Firestore**: nó publish product và rebuild metafield
`avada_custom_landing`. Lưu ý `productBundleRepository.js:2` tự tạo `new Firestore()` riêng nên script phải
export `GOOGLE_APPLICATION_CREDENTIALS`, và `sellingPlanGroupCreate` bắt buộc `category: 'SUBSCRIPTION'`
(lấy từ `getSellingPlanVariables.js:302`, không đoán).

## Context

- Trần bundle 30KB tôi tự áp **không tồn tại**: đo thật `veluma` 198.1KB, `fixed-bundle` 197.9KB. Nó đã đốt công
  thật (task 6 gỡ `preact/compat` để ép 39KB→29KB). Tách component **không** làm giảm bundle — chỉ `import()` mới giảm.
  (Đã ghi ở [[digest-subscriptions-2026-08-19]], nhắc lại vì lần này nó gây hậu quả.)
- Bundle đóng băng ở Shopify Files là bản cũ hơn cả hai task — trang thật chạy bản cũ trong khi local đã đúng.
  Khi "code local đúng mà trang sai", kiểm nguồn bundle mà trang đang tải trước khi đọc code.
- Message nhiều dòng gửi vào TUI codex bị nuốt (newline hiểu là Enter) ⇒ lane **không nhận được lệnh** mà vẫn
  trông như đang chạy. Đã ghi vào skill `looptasksv2`. Kiểm bằng `read-screen` + mtime file, không tin "đã gửi"
  ([[cham-viec-agent-nen]]).
- Verifier ước lượng quá mức một lần (giả định 9 box legacy *có* plan tuần) — đối chiếu dữ liệu store thật mới ra đúng.
- Swap hiện chỉ ghi vào order note; store khách dùng **line item property `Swap Item` trên từng box** — spec cũ sai
  so với hành vi thật của khách.

Project: [[subscriptions]]. Nối tiếp [[shipped-subscriptions-2026-08-22]].
