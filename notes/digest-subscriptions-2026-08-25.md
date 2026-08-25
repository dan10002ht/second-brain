---
type: note
title: Digest subscriptions 2026-08-25 — tính năng đúng logic nhưng vô hiệu trên dữ liệu thật, và cách đo thay vì đoán ở landing joyxjoy
summary: Chặn vượt tồn kho chạy đúng trong test nhưng vô hiệu 100% trên production vì Liquid không emit `inventory_management`; `selling_plan: null` không phải nguyên nhân 422 của `/cart/add.js` (sold out mới là); và test do chính lane viết đã đóng đinh một hành vi sai (đơn vị month dùng như tuần) thành "expected".
tags: [subscription, shopify, storefront, preact, avada, debug]
created: 2026-08-25
updated: 2026-08-25
source: project "subscriptions" — session history (3 session: deploy staging 3, CLS, landing joyxjoy)
---

# Digest subscriptions — 2026-08-25

Chỉ phần **chưa có** trong [[digest-subscriptions-2026-08-24]] và
[[digest-subscriptions-joyxjoy-2026-08-20]]. Phần boot-screen `2rem`/Polaris, `variantId` thiếu
trong Liquid, `theme push` báo thành công giả, `discountConfig.tiers` — đã ghi ở 08-24, không lặp lại.

## Bugs

### Chặn vượt tồn kho đúng logic nhưng vô hiệu trên dữ liệu thật

Helper `variantStock.js` (`getVariantMaxQty` / `getUsedQty` / `canIncrement`) gate trên
`variant.inventory_management`. Test xanh, mutation đỏ đúng chiều — nhưng **Liquid không hề emit
field đó**, nên trên production `inventory_management` luôn `undefined` ⇒ trần luôn `Infinity` ⇒
tính năng không chặn gì cả.

Gate xanh không thấy được vì **fixture của test là do chính người viết test dựng ra**, không phải
lấy từ payload Liquid thật — cùng họ với [[gate-tu-viet-la-nguon-xanh-gia]]. Cách bịt là một test
tên `requires inventory_management in the production Liquid data contract`, ràng buộc fixture JS
với đúng chuỗi Liquid emit: đổi tên property, bỏ `| json`, hay đổi key sang camelCase đều làm test đỏ.

| | Trần tính ra |
|---|---|
| `inventory_management: null` (trạng thái store lúc đó) | `Infinity` |
| sau khi merchant bật tracking | đúng số tồn |

Chi tiết thứ hai đáng nhớ: cùng một sản phẩm xuất hiện ở **cả** section staple lẫn one-off (cả 7
category đều `in_staples` và `in_oneoff`), nên trần phải tính **tổng hai bên**, không phải riêng từng bên.

### `selling_plan: null` không phải nguyên nhân 422 — "sold out" mới là

Giả thuyết ban đầu là `/cart/add.js` không nhận `null`. Đo cả ba biến thể trên cart thật:

| `selling_plan` | kết quả |
|---|---|
| `null` | 200 |
| `""` | 200 |
| bỏ hẳn key | 200 |

Lỗi thật chỉ lộ ra khi bắn **nguyên lô 4 item** — `/cart/add.js` là **atomic**, nên một item hỏng
làm cả lô 422: `"The product 'JOY Wild Caught Seafood Box' is already sold out."` Test từng item một
sẽ không bao giờ thấy.

### Lane tự viết test đóng đinh hành vi sai thành "expected"

`getBoxFrequencyPlan.js:128` ném `frequencyValue` của plan app (đơn vị **month**) vào đường tính
theo **tuần**. Gate xanh, và tệ hơn: test của chính lane ghi `APP_PLAN = {…}` với kỳ vọng khớp hành
vi sai. Verifier bắt được, lane sửa bằng guard `frequency === 'week'`, mutation làm 2 test đỏ ở 2 suite.

Đối chiếu ảnh hưởng thật trên store cho thấy verifier **ước lượng quá mức** (nó giả định 9 box legacy
đều có plan tuần) — nên finding đúng nhưng phạm vi phải tự đo lại, không lấy nguyên con số của verifier.

### `submitOrder` không kiểm response của `/cart/add.js`

`fetch` chỉ reject khi lỗi **mạng**; HTTP 422 vẫn resolve bình thường. Nên add-to-cart hỏng mà UI
vẫn báo thành công rồi chuyển trang. Phân biệt rõ với thứ user đã cố ý loại bỏ (đối chiếu lại tồn
kho lúc submit — không cần, race condition không quan trọng ở đây): nuốt lỗi là bug, chống race là scope bị cắt.

### CLS list page: skeleton thấp hơn row thật, và `minHeight` không cứu được

Trên mobile row thật cao **101px** (cell Products có `ProductGroup`: thumbnail + tên) trong khi
skeleton chỉ 1 dòng text ⇒ 60px. Desktop không shift chút nào (60→60). Ba row đầu 101px, các row sau
60px — chiều cao **không đồng nhất**, nên không có một con số nào để reserve.

Thử reserve bằng `minHeight` lấy từ cache đo thật (theo pattern `homeCardOrderCache`, key theo
`shopDomain`): CLS **tăng** 0.31 → 0.505, vì table **dịch xuống** 49px (`y 140 → 189`) chứ không chỉ
cao lên — `minHeight` không chữa được shift do phần tử phía trên. Bỏ hướng này, chỉ giữ fix boot logo
(CLS 0.0146 → 0.0064, ổn định 3/3 run). Bản reserve cũ đã revert từng hardcode `min-height: 820px`
và gây khối trắng — không lặp lại. → [[do-layout-shift-bang-browser-automation]]

## Techniques

- **Dev standalone không tái hiện được CLS của prod**: đo được 0.0146 trong khi prod 0.31. Dev bundle
  không minify mất >14s dưới throttle nên run đầu còn kẹt ở boot screen. Số đo dev chỉ dùng để
  *xác nhận một shift cụ thể biến mất*, không dùng để kết luận tổng CLS.
- **Verify theme push bằng pull-diff, không tin CLI.** `theme push` in `pushed successfully` ba lần
  liên tiếp mà file trên store đứng nguyên 27718 byte. Đọc **toàn bộ** output mới thấy lý do thật:
  `Invalid schema: setting with id="bundle_script_url" 'info' is not a valid attribute`. Quy trình
  đúng: push → pull lại → so byte-to-byte. Và khi sửa template phải sửa **trên bản pull**, vì bản
  local sẽ ghi đè `bundle_script_url` mà user đang trỏ vào localhost.
- **Push snippet TRƯỚC `theme.liquid`.** JSON template không render snippet trực tiếp được nên phải
  chèn qua `theme.liquid`; push ngược thứ tự thì layout render một snippet chưa tồn tại và cả theme lỗi.
- **Số app tính phải khớp số Shopify tính.** Bằng chứng mạnh nhất cho phần discount không phải test
  mà là cart thật: app config vs `selling_plan_allocation` của Shopify ra **cùng một con số**.
  Cũng chính đường này chốt được `discountConfig.tiers[0].value = 20` thắng `discountValue: 5`.
- Lệch 1 cent do float trong đường discount (`17.935 * 100 === 1793.4999…`) đã tách ra
  [[tien-khong-duoc-lay-float-lam-chuan]] — brute-force ~8.100 tổ hợp giá×discount, 0 lệch.

## Context / gotcha

- **Bundle ở Shopify Files bị đóng băng bản cũ.** Trang chạy code cũ dù local đã build mới, vì theme
  trỏ vào file đã upload session trước (82.708 byte) chứ không phải `localhost:3001` (84.462 byte).
  Khi "code local đã sửa mà trang không đổi", kiểm **nguồn bundle trang đang tải** trước mọi thứ khác.
- **Playwright + `https://localhost:3001` = `net::ERR_FAILED`** vì cert self-signed → widget không
  mount → `so box card: 0`. Trình duyệt thật của user đã trust nên không gặp. Đây là artefact môi
  trường đo, hai lần suýt bị đọc thành bug.
- **Cloudflare 429 challenge** (`Verifying your connection...`) sau khi gọi store quá nhiều lần bằng
  Playwright — `AVADA_JW = undefined` dù curl vẫn thấy section trong HTML.
- Nút add-to-cart của theme khách là `button.product-form__submit` — đúng class đã **cố ý loại trừ**
  vì sợ trùng nút chọn ngày giao. Loại trừ theo phỏng đoán làm mất luôn ca chính.
- `dynamicCheckout: []` — khách chưa bật "Buy it now", nên đường vòng qua checkout không tồn tại;
  user chốt không cover, chỉ để lại comment giải thích vì sao.
- **Deploy nhánh lên staging 3 từ worktree**: worktree chỉ symlink được `node_modules` gốc, thiếu
  `extensions/*/node_modules` (pos-extension không thấy `@shopify/ui-extensions`) và thiếu
  `schema.graphql` (file generated, bị gitignore) của `product-discount` / `cart-transform-extension`
  — phải copy tay từ repo chính. Shopify CLI trong môi trường non-interactive bắt buộc `--force`.

## Liên quan

[[subscriptions]] · [[digest-subscriptions-2026-08-24]] · [[digest-subscriptions-joyxjoy-2026-08-20]] ·
[[2026-08-24-landing-joyxjoy-dung-plan-cua-app]] · [[2026-08-19-page-custom-o-theme-khach]] ·
[[gate-tu-viet-la-nguon-xanh-gia]] · [[tien-khong-duoc-lay-float-lam-chuan]] ·
[[do-layout-shift-bang-browser-automation]] · [[ack-khong-phai-hieu-ung]] ·
[[gui-viec-cho-lane-khong-co-ack]]
