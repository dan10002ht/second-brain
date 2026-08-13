---
type: note
title: Shipped PDF Invoice — commit landed 2026-08-12 (v3.1.75→78)
summary: Commit landed 08-12 — master nhận 5 MR trong một ngày (4 tag `v3.1.75`→`v3.1.78`): trọn chuỗi wholesale template SB-15436/SB-15444 (heading trong khổ giấy, 12 Content setting trước đây bấm không ra gì, extra info xuống dưới Total, footer in một lần), rollout Joy cross-app promo 70%→90%, và 2 slot deploy mới staging 3/4; trên nhánh: Sidekick tool `list_invoice_templates` + intent mở thẳng editor (SB-15503); không revert.
tags: [pdf, invoice, shopify, avada, extensions, method]
created: 2026-08-13
updated: 2026-08-13
source: repo "pdf" (PDF Invoice for Shopify) — git log 2026-08-12; mọi hash + tag + số MR lấy nguyên từ log, nhánh suy từ ref decoration
---

# PDF Invoice — shipped 2026-08-12

> Ngày trước: [[shipped-pdf-2026-08-11]] · bối cảnh: [[pdf]] · [[digest-pdf-2026-08-12]].
> Cơ chế page-break của Chrome đã ghi ở [[digest-pdf-2026-07-30]] — hôm nay lộ ra **mặt sau**
> của đúng cơ chế đó, xem [[2026-08-13-wholesale-table-chi-chua-item-grid]].

## Shipped

### Vào master — 5 MR, 4 tag

| Tag | MR | Hash merge | Nội dung |
|---|---|---|---|
| `v3.1.75` | !503 | `d56c17499` | wholesale: giữ heading trong khổ giấy, wrap discount dài, **gate theo plan wholesale** |
| `v3.1.76` | !504 | `de2105493` | **Joy cross-app promo rollout 70% → 90%** (nguồn `9eb2a645a`, `feature/joy-rollout-90`, đúng **1 dòng** trong `crossAppPromo.js`) |
| `v3.1.77` | !505 | `8322c3999` | wholesale: content settings, PO number, dòng tax, cột SKU, notes (**SB-15436 QA**) |
| `v3.1.78` | !506 | `6ba851e32` | wholesale: extra information xuống dưới Total, footer in **một lần**, không còn heading trần |
| — | !507 | `880fb1b0f` | **2 môi trường deploy mới staging 3 + staging 4** (nguồn `78c4bbcf8`: `.firebaserc` +2, `.gitlab-ci.yml` +70) — **không tag, không bump version** |

Rollout promo ăn tiếp mạch [[shipped-pdf-2026-07-31]] (chia bucket bằng **hash tất định từ
`shop.id`**, không DB, không migration) và [[shipped-pdf-2026-08-01]] (fix nhận diện dev store
đã chọn plan test). Vì bucket là hàm thuần của `shop.id`, nâng 70→90 là **mở rộng tập cũ chứ
không xáo lại** — shop đã thấy promo vẫn thấy.

### Còn trên nhánh — chuỗi wholesale template (`feat/wholesale-invoice-template`)

Bảy commit, cùng ticket SB-15444/SB-15436, đi từ số liệu sai → trình bày → phân trang:

- **`62be048d9` — trừ hai lần line discount trong subtotal wholesale** (3 theme: invoice,
  pro forma, credit note). Đây là commit duy nhất trong ngày sai **con số**, phần còn lại là
  trình bày.
- **`3a3553def`** — cột tiền có headroom, **không xẻ đôi giữa một con số** (7 theme, style-only).
- **`6c18d1206`** — PO number sang cột order, bỏ invoice hash, **luôn hiện tax**, ẩn cột SKU khi
  tắt, in order note + thank-you note.
- **`0eeaba58c` — 12 Content setting là công tắc không nối vào đâu**: bấm không đổi preview chút
  nào, và `isUseSetting.js` **giấu phần lớn chúng đi thay vì giải quyết mâu thuẫn**. Nay mỗi
  setting được đặt vào chỗ tờ giấy này chịu được (ảnh inline cạnh tên sản phẩm, barcode vào cột
  meta phải, ship-to sau billing, QR + social đóng document trên banner). Chỉ 3 loại document có
  cột totals mới nhận đủ; refund/packing slip/quote giữ hide-list hẹp hơn **có chủ đích**.
  ↳ cùng họ với [[bang-chung-phan-biet-duoc]]: "toggle không có tác dụng" trông y hệt "toggle
  đang tắt".
- **`63d6a4dd1`** — social links từ chữ thường (`facebook instagram twitter`, đọc như placeholder
  sót lại) sang icon brand. Lấy **nguyên văn** switch của `aria_invoice` thay vì gõ lại: *"a
  hand-copied path is a silently wrong logo"*. Kèm else-branch của Aria nên platform lạ in tên
  chứ không để link chết. 20px thay vì 25px native vì body copy tờ này 11px.
- **`9892fb452`** — extra information (note, footer note, thank-you, QR, social) đang in **trước**
  banner Total ⇒ trên đơn 3 trang nó nằm giữa document và bị xẻ qua biên. Nay thứ tự đóng là
  totals → Total → extra information → footer. **Footer rời khỏi `<tfoot>`** → xem decision.
- **`8e90b7927`** — trang cuối chỉ có QR + footer nhưng **vẫn in heading SKU / PRODUCT TITLE /
  QUANTITY**: cột tiêu đề trên một trang không có cột nào bên dưới. Chrome lặp `<thead>` trên mọi
  trang mà **TABLE** trải qua, không phải mọi trang có **row** — mà banner Total, order tag, extra
  info và footer đều đang là `<tr>` (chúng là row chỉ để mượn full-width của table, thứ mà một
  sibling block-level có sẵn). Kéo chúng ra ngoài table ⇒ heading chỉ lặp trên trang thật sự có
  cột. CSS phải dời từ selector `td` sang chính block — *padding do cell mang sẽ bị vứt im lặng*.

  **Cách verify đáng giữ**: đo geometry đã render trên **49 tổ hợp** (7 theme × 7 độ dài đơn, tới
  11 trang), assert mỗi trang table trải qua có ít nhất một row thật; cộng 35 render (7 theme × 5
  fixture mode) assert **không banner/note/message/footer nào sót trong `<tbody>`** — chính
  assertion đó bắt được dòng balance-help của `wholesale_unpaid` vẫn còn là table row. 2/49 run
  chết vì **puppeteer navigation timeout** chứ không phải fail check, chạy lại thì pass.
  Cùng kỷ luật "đo hình học đã render, không đọc markup" của [[digest-pdf-2026-07-30]].

### Còn trên nhánh — Sidekick (`feature/sidekick-agent-extensions`)

- **`c2c93190b` — SB-15503**: tool `list_invoice_templates` + intent **mở thẳng màn editor của
  1 template cụ thể**. 15 file, +596/−72, trong đó 5 file test mới (extensionManifests,
  templates.service, tools/index, listInvoiceTemplatesTool). Logic rời `Templates.js` (−39)
  sang `UpdateTemplate.js` (+38).
- `77823849d` (+131 dòng spec "mở thẳng 1 template, trần 5 intent") và `804ffa9a9` (+156 dòng,
  đóng mục treo trong spike findings 08-03) — **docs SB-14254**, không code.

### Hạ tầng CI

- `4583e4891` / `6a3ba8278` / `d44908abb` — ba nhánh `feat/test-staging-3`, `feat/test-staging-4`,
  `feature/staging-3-4`, mỗi cái sửa **cùng 6 dòng** `.gitlab-ci.yml` để ghim slot staging 3/4 vào
  nhánh test. Cùng cơ chế "slot staging neo theo tên nhánh trong file CI" đã ghi cho subscriptions
  ở [[digest-subscriptions-2026-08-12]] — **push nhánh mà quên đổi dòng này thì pipeline im lặng
  không chạy**.
- `aa5fac419` — trỏ staging2 về `feat/templates-redesign`.

## Reverted

Không có revert nào, cả trên master lẫn trên nhánh.

## Deploy notes

- **4 tag trong một ngày** (`v3.1.75` → `v3.1.78`), mỗi tag một MR — ngược hẳn kiểu "một tag bọc
  nhiều MR" của subscriptions ([[shipped-subscriptions-2026-08-12]]). Đọc tag ở repo này suy ra
  nội dung được.
- **MR !507 mở 2 slot deploy mới**: `.firebaserc` +2 alias và `.gitlab-ci.yml` **+70 dòng**. Đây
  là thay đổi hạ tầng thật (2 project Firebase mới trong vòng deploy), landed **không tag**. Ăn
  khớp với chuỗi provision staging 3/4 đã ghi ở [[digest-pdf-2026-08-12]] (service agent Gen2,
  UBLA, Firebase Authentication phải bật thủ công) ⇒ **slot mới chưa chắc đã dùng được chỉ vì CI
  đã biết tên nó**.
- Không migration, không revert, không cờ ép deploy trong log ngày này.
- Toàn bộ thay đổi wholesale nằm ở `packages/functions/storage/themes/**` (liquid) — **chưa xác
  minh** đường ship của thư mục này (đi cùng deploy functions hay seed riêng); cần chốt trước khi
  suy "MR đã merge = merchant đã thấy".

## Liên quan

[[2026-08-13-wholesale-table-chi-chua-item-grid]] · [[shipped-pdf-2026-08-11]] ·
[[digest-pdf-2026-08-12]] · [[digest-pdf-2026-07-30]] · [[digest-pdf-2026-07-29]] ·
[[shipped-pdf-2026-07-31]] · [[shipped-pdf-2026-08-01]] · [[bang-chung-phan-biet-duoc]] ·
[[pdf]] · [[shopify-app-dev]]
