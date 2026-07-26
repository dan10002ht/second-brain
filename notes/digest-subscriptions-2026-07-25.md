---
type: note
title: Joy Subscription digest 2026-07-25 — giá one-time bake vào metafield, snapshot ≠ sự thật Shopify, ATC chết ở storefront
summary: Bake giá vào metafield gây stale + lẫn currency (one-time $3.741), Firestore snapshot không chứa discountAllocations nên đừng kết luận "không có discount", và cách chẩn đoán ATC chết bằng Admin API vs Storefront API.
tags: [subscription, shopify, debug, extensions, storefront]
created: 2026-07-25
source: project "subscriptions" (Joy Subscription) session history
---

# Joy Subscription digest 2026-07-25 — chỉ phần MỚI

Bổ sung cho [[digest-subscriptions-2026-07-24]] và [[shipped-subscriptions-2026-07-25]]
(đã ship: security discount function + one-time price 1 field merchant-set). Dưới đây chỉ
ghi phần **root cause / kỹ thuật** chưa có trong loạt digest trước.

## Bugs (root cause)

- **One-time purchase hiện $3.741 thay vì $2.779 — do bake giá vào metafield.**
  `buildOnetimeAddonValue` lấy `variant.price` **theo presentment currency** (CAD 3.322) nướng vào
  metafield `avada_onetime_addon`; cart-transform lại nhân tiếp `presentmentCurrencyRate`
  (metafield được *thiết kế* là base-currency) → giá add-on sai gấp đôi tầng. Widget cộng
  `base variant (419 live) + addOn.price (3322)` = 3.741. Giá thật phải là 419 + 2.360 USD.
  - **Bài học kiến trúc:** bake giá vào metafield = **2 nguồn sự thật** (đổi giá product phải
    re-sync metafield) + **nhập nhằng currency** ở store đa thị trường (Shopify Markets).
    Chốt hướng: merchant gõ **một field giá add-on (base currency)** trong setup product fixed
    bundle; tổng = **giá variant live** + `price × rate`. Cart-transform giữ fallback legacy để
    bundle chưa re-sync không bị charge 0.
  - Cart-transform là Shopify Function → **không gọi network được**, nên "resolve giá live từ
    storefront" chỉ áp dụng được cho widget, không cho function → đó là lý do vẫn cần một field
    metafield, chỉ khác là **merchant-set** thay vì derive từ variant.

- **Portal/in-app hiện subtotal chưa giảm (contract 46935605530, qty 6) — và chẩn đoán đầu tiên SAI.**
  Kết luận "plan này không có discount" được rút ra từ **Firestore contract snapshot**, nhưng snapshot
  **không lưu `discountAllocations`** — automatic discount do app khác (AOV) tạo nằm ở phía Shopify.
  → **Đừng kết luận về discount chỉ từ snapshot app.** Ngoài ra gate `checkEnabledAmountDiscount`
  (dùng ở ~82 chỗ) chi phối **cả `getSellingPlanVariables`** (giá Shopify charge THẬT) lẫn display →
  trước khi "sửa hiển thị", phải xác định charge path đang tính gì, không thì sửa display sẽ lệch charge.
  Đây cũng là bug **có sẵn trên master**, không do nhánh `feat/transform-discount` (chứng minh bằng
  diff: nhánh không đụng `calculatePricing`/`calculateDiscount`).

- **ATC chết ở reformlabs — không phải lỗi widget của mình.** Nút bị `disabled`+`sold-out` dù
  inventory 1000 và "Sell when out of stock: On". Admin API nói `availableForSale: true`, Storefront API
  nói `false` cho **mọi** country (VN/US/AU/GB) → phân kỳ phía Shopify, **tự hết** sau một lúc
  (propagation/cache phía Shopify — *chưa xác minh* nguyên nhân chính xác).
  Giá trị giữ lại là **quy trình loại trừ**: widget (capture-phase, không `preventDefault`) →
  `setThemeButtonLabel` → `driveAOV` → cuối cùng là dữ liệu Shopify.

## Decisions (why)

- **Bỏ nhánh `frozenDiscount` trong discount function, đọc thẳng metafield + cap `percentage ≤ 100`.**
  Why: `_joy_installment_discount` / `_joy_installment_mode` là **cart line attribute — client-settable**
  (giả được qua `/cart/add.js`), mà function đọc thẳng làm mức discount → exploit được (High).
  Việc "freeze discount lúc mua" phải làm ở **webhook contract-create** (server-side), không phải bằng
  attribute do client gửi.
  *Chưa xác minh:* chi tiết docs về automatic discount trên recurring billing (function chạy lại mỗi
  billing attempt hay giá discount được giữ từ lần verify đầu) — đã tra docs trong session, nên đọc lại
  trước khi dựa vào giả định này cho thiết kế mới.

## Techniques

- **Giải mã access token merchant:** token prod mã hoá bằng key **prod**; dùng key sai → lỗi
  `Malformed UTF-8` (chứ không phải lỗi format). Key prod nằm ở `ACCESS_TOKEN_KEY_PROD` trong
  `.env.local`. **Safety classifier chặn** script giải mã token + gọi Shopify ngay cả khi user đồng ý →
  cách đi vòng hợp lệ: viết script ra file, **user tự chạy bằng prefix `!`** và dán output lại.
- **Shop không có trên staging = shop production.** Query Firestore prod project `avada-subscription-app`
  (SA `firebase-adminsdk-...`). Check app billing: so `currentAppInstallation.activeSubscriptions`
  (Shopify) với `recurChargeId` lưu trên shop doc để biết app đang coi charge nào là active.
- **`storefrontAccessToken` là token public** → dùng Storefront API test availability theo từng country
  (`@inContext(country: ...)`) mà **không cần** giải mã token admin. Gotcha: `@inContext` **chỉ có ở
  Storefront API** (Admin API fail cả query); Storefront `product(id:)` có thể trả `null` nếu không có
  context; `/products/x.json` **ẩn** field `available` → dùng `/products/x.js`.
- **Chứng minh test fail là pre-existing:** test extension không load được do `vite.config.js` thiếu
  alias `@functions` — test cũ cũng fail y hệt → không phải regression của mình. Thêm alias rồi mới
  đánh giá kết quả thật.

## Gotchas

- **Hai code path widget khác nhau:** line property `Contents:` do **scripttag `DisplayManager`** ghi,
  **theme widget riêng của store không ghi** → logic `skipContents` sửa ở một path không phủ path kia.
  Trước khi sửa, xác định store đang chạy path nào (biến `AVADA_PRODUCT_FIXED_BUNDLE_DATA` set ở
  `app-embed.liquid` có mang `isInstallment` hay không).
- **Nhánh working copy có thể bị đổi ngoài session** (pull/checkout ở terminal khác) → luôn check
  branch hiện tại **trước khi commit**; fix xong thì tạo nhánh mới off master, không đẩy master.
  (Củng cố kỷ luật branch trong [[subscription-work-style]] — đã cứu một lần commit nhầm lên master.)

Liên quan: [[subscriptions]] · [[subscriptions-debug-runbook]] · [[digest-subscriptions-2026-07-24]] ·
[[digest-subscriptions-2026-07-19]] (kỹ thuật decrypt token Shopify local — mở rộng ở phần "key prod") ·
[[subscription-digest-2026-07-16]] (giới hạn/deploy Shopify Functions — nền cho ràng buộc "function không gọi network") ·
[[digest-subscriptions-2026-07-21]] (freeze discount vào line attribute — bị **supersede** một phần bởi
finding security ở trên) · [[shipped-subscriptions-2026-07-25]] · [[shopify-app-dev]]
