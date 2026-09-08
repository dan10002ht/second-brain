---
type: note
title: Digest Joy Subscription — 2026-09-08 (landing joyxjoy nối vào tiền thật + 5 bug SB-16454)
summary: Cart không ăn subscription vì Liquid thiếu đúng một field `variantId`; `/collections/{h}/products.json` trả shape KHÁC Liquid (giá là chuỗi đô la, ảnh là object) nên hai ticket tưởng khác nhau chung một gốc; trần tồn kho vô hiệu trên dữ liệu thật dù suite xanh vì fixture tự đặt sẵn field Liquid chưa từng emit; và `pushed successfully` của Shopify CLI nói dối khi schema hỏng.
tags: [avada, subscription, shopify, storefront, debug]
created: 2026-09-08
updated: 2026-09-08
source: project `subscriptions` — session history (landing joyxjoy: cart/discount/swap/tồn kho, SB-16454 + SB-16578)
---

CHỈ phần mới so với [[digest-subscriptions-joyxjoy-2026-08-20]], [[digest-subscriptions-2026-08-21]],
[[digest-subscriptions-2026-08-24]] và quyết định [[2026-08-24-landing-joyxjoy-dung-plan-cua-app]].
Giai đoạn này là nối trang landing vào **tiền thật**: selling plan, discount tier, tồn kho, swap.

## Bugs

**Cart không mang subscription — thiếu đúng một field trong Liquid.** `window.AVADA_JW.bundles[]`
chỉ emit 7 key (`available, handle, image, price, productId, selling_plan_groups, title`), **không
có `variantId`**. Vòng `products` thì có, vòng `bundles` thì không. Hệ quả: line box add sai, và
staple mất `__staple` chỉ là hậu quả xuôi dòng chứ không phải bug thứ hai. Fix: emit
`p.selected_or_first_available_variant.id`.

**`/cart/add.js` là atomic — một dòng hỏng thì cả lô 422.** Nghi vấn ban đầu là `selling_plan: null`
gây lỗi; đo cả ba biến thể (`null`, `""`, bỏ hẳn field) trên cart thật đều `http=200`. Thủ phạm thật:
một box **đã sold out** làm cả 4 item bị từ chối. Cùng họ với [[ack-khong-phai-hieu-ung]] — thông báo
lỗi của Shopify nói về item cuối, không nói về item gây lỗi.

**Trần tồn kho chạy đúng logic nhưng vô hiệu trên dữ liệu thật.** `getVariantMaxQty` gate trên
`variant.inventory_management`, mà Liquid **chưa từng emit** field đó — 22/22 suite vẫn xanh vì
fixture do chính người viết code dựng ra và đã có sẵn field. Verifier bắt được; fix là emit field
**và** thêm test `requires inventory_management in the production Liquid data contract` ràng buộc
hai phía. → [[fixture-khong-phai-hop-dong-du-lieu]] · [[phep-kiem-quan-sat-sai-tang]].

**Lệch đơn vị plan: tháng bị đưa vào hàm tính theo tuần.** Plan của app có `frequency` (`week`/
`month`) và `frequencyValue`; code ném thẳng `frequencyValue` vào `getSellingPlanForWeeks`, nên plan
`Every 4 months` bị hiểu là 4 tuần. Chốt: **cấm quy đổi 1 tháng = 4 tuần**; không khớp đơn vị thì trả
`null` và ẩn box, chứ không đoán.

**Lệch 1 cent do float** — `Math.round(price * 100)` với `17.935` ra `1793.4999…`. Fix bằng `Big.js`
cho toàn bộ phép nhân về cents. Instance thứ hai của [[tien-khong-duoc-lay-float-lam-chuan]]; điểm mới
là brute-force ~9.800 tổ hợp giá×discount, và **chuẩn đối chiếu phải là BigInt**, không được là float.

**Hai ticket khác nhau, một gốc chung — endpoint storefront trả shape khác Liquid.**
`/collections/{h}/products.json` không có `featured_image`, `images[]` là **object có `.src`** (card
mong string), và `variants[].price` là **chuỗi đô la** (Liquid trả cents) — nên ảnh vỡ (SB-16574) và
giá sai ×100 (SB-16592) là cùng một chỗ. Fix ở **biên fetch** bằng `normalizeStorefrontProduct`, viết
idempotent để dữ liệu Liquid (đã là cents/number) đi qua vẫn nguyên.

**`bundles: []` trên shop khách vì thiếu metafield definition, không phải thiếu dữ liệu.** Firestore có
bundle, metafield có value, nhưng không có definition `PUBLIC_READ` thì Liquid đọc `nil`. Đường tạo
definition duy nhất lại nằm ở DevZone — không thể bắt merchant vào đó. Fix đúng chỗ: gọi
`ensureMetafieldDefinition` (đã idempotent sẵn) **ngay trước** khi ghi value trong
`rebuildCustomLandingMetafield`, theo đúng tiền lệ `syncOnetimeAddonMetafield` trong cùng file.

**Liquid parse TOÀN BỘ file, kể cả bên trong comment CSS `/* */` và JS `//`.** Một chữ `{% if %}` viết
trong comment giải thích làm hỏng cả file: `Liquid syntax error: [:end_of_string] is not a valid
expression`. Trước khi kết luận file hợp lệ phải đếm cân bằng tag, không chỉ đọc phần code.

**`shopify theme push` in `pushed successfully` trong khi Shopify từ chối file.** Lần này nguyên nhân
là schema hỏng (`info` không phải attribute hợp lệ của setting) — và một biến thể khác: push
**section + template cùng một lệnh** thì Shopify âm thầm loại các setting `collection_list` mới (nó
kiểm template trước khi schema section kịp cập nhật). Luật rút ra: push section trước, template ở lệnh
riêng, và **luôn pull lại đối chiếu byte** thay vì tin dòng thông báo.

**Hai lỗi bố cục là lỗi cấu trúc DOM, không phải CSS.** (a) `.jw-builder-grid` là lưới 2 cột mà có
**4 con trực tiếp** → auto-placement nhét khối thứ 3 sang cột trái. (b) `position:sticky` tạo
stacking context nên summary **vẽ đè** mọi khối đứng sau nó trong cùng cột. Lời giải là gom cột phải
thành một khối (`.jw-sum-col`) và đặt sticky lên đúng con của cột.

**"Buy once" trên PDP vẫn gửi `selling_plan`.** Widget subscription gốc bị `display:none` **nhưng vẫn
nằm trong DOM** và vẫn giữ `input[name="selling_plan"]` với lựa chọn mặc định; nút "Buy once" chuyển
click sang nút add-to-cart của theme nên form vẫn kèm plan. Ẩn bằng CSS không phải là vô hiệu hoá —
phải xoá giá trị input trước khi giao click.

## Techniques

- **Vòng nghiệm thu lặp lại được cho storefront:** build → upload bundle lên Shopify Files (trả
  `content-type: text/javascript`, `access-control-allow-origin: *`) → push theme → đọc
  `window.AVADA_JW` bằng Chrome thật (Playwright `channel:'chrome'`) → POST `/cart/add.js` thật. Nó bắt
  được thứ mà gate và report không thấy: widget không mount, ô ảnh cao 0px, sheet mở 44px, tab "All" rỗng.
- **Đối chiếu số của mình với số Shopify tính ra.** App tính 7120 và `price_adjustments` của Shopify
  cũng 7120 → mới kết luận công thức discount đúng. Cũng chính phép này chứng minh `discountConfig.tiers`
  là nguồn thật còn `discountValue` là field cũ (5% vs 20% mâu thuẫn trong cùng một plan).
- **Snapshot lúc save thay vì fetch mỗi lần tải trang.** Định gọi clientApi để biết staple nào thuộc
  plan; user chỉ ra hướng ghi sẵn vào metafield lúc save Fixed Bundle — rẻ hơn một request/pageview.
  Điểm kiểm quan trọng: "select all" đã được expand thành danh sách product cụ thể lúc lưu, nên
  **rỗng không có nghĩa là tất cả**.
- Gọi store quá nhiều lần bằng Playwright → **HTTP 429 + Cloudflare challenge**, `AVADA_JW` thành
  `undefined`. Triệu chứng giống hệt "widget không mount"; phải phân biệt trước khi đi sửa code.
- `rtk` che output nhiều lần trong phiên: báo `PASS (6) FAIL (0)` khi có 1 suite **chết lúc load**, và
  làm `grep -q` in ra kết quả mâu thuẫn. Khi cần kết luận thì chạy binary trực tiếp.
- Worktree mới thiếu `node_modules`/env → gate in `GATE COULD NOT RUN` + "214 failed"; deploy extension
  từ worktree thiếu file gitignored (`schema.graphql`, `generated/`, `dist/`) → lỗi codegen lạc hướng.

## Context

- Trạng thái cuối: toàn bộ trên `feat/joyxjoy-landing`, staging 1 trỏ nhánh này; 5 sub-task của
  SB-16454 và SB-16578 đã xử; store tester là `ngocvtb-prod`.
- Quyết định của user, ghi lại để không đào lại: **không xử race condition tồn kho lúc submit**
  ("lúc tải trang là ok"); step 2 khi chưa có snapshot plan thì **không hiển thị gì** thay vì hiện hết
  (thà trắng còn hơn cho khách chọn staple ngoài plan rồi checkout hỏng); **giữ sticky** cho cột phải
  dù UX kém vì khách muốn vậy.
- Dọn worktree/lane là **bước cuối của quy trình**, không phải việc phải xin phép — user phải nhắc
  ("làm xong thì dọn chứ? bạn ko tự dọn được à?"). Cùng họ với [[feedback-dung-xin-chot-khi-chi-thi-da-co]].

Liên quan: [[subscriptions]] · [[2026-09-08-bespoke-khong-vao-theme-app-extension]] ·
[[digest-subscriptions-tielenergy-2026-09-08]] · [[bang-chung-phan-biet-duoc]] ·
[[fixture-khong-phai-hop-dong-du-lieu]] · [[tien-khong-duoc-lay-float-lam-chuan]]
