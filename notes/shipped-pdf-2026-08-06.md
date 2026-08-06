---
type: note
title: Shipped PDF Invoice — commit landed 2026-08-04→05 (v3.1.71)
summary: Commit landed 08-04/08-05 — master chỉ nhận 3 MR (2 lần mockup-app/PRD + `v3.1.71` bump @avada/app-widget-hook 0.0.25 vá lỗi banner appList rỗng làm trắng trang); khối lượng thật trên nhánh: bỏ hẳn pagination client của preview rồi dựng lại highlight theo marker (7 task), Sidekick agent extensions SB-14254, redesign template editor.
tags: [pdf, invoice, shopify, avada, react]
created: 2026-08-06
source: repo "pdf" — git log (2026-08-04 → 2026-08-05); hash và tag dưới đây lấy nguyên từ log
---

# PDF Invoice — shipped 2026-08-04 → 2026-08-05

> Bối cảnh project: [[pdf]]. Digest gần nhất: [[digest-pdf-2026-08-05]] ·
> [[shipped-pdf-2026-08-04]].

## Shipped

### Vào master — 1 tag, 3 MR

- **`b350af89a` — tag `v3.1.71`, MR !495** — bump `@avada/app-widget-hook` 0.0.15 → 0.0.25
  (KEN-61). Nguồn `0bfd57679`: 0.0.25 guard `appList` rỗng — trước đó banner có appList
  rỗng thì destructure `undefined` → throw → **trắng trang**; pdfInvoice render banner qua
  `<WidgetInlineBannerV2 position="Orders Page"/>` (và "Home Page") nên chính app này báo
  lỗi. Commit ghi rõ compat check từng export + transitive deps 0.0.25 == 0.0.15, và
  **"KHÔNG deploy — deploy = tag do anh Kenny"**.
- **`5a07e2afe` (MR !496)** và **`0e5834c00` (MR !494)** — update mockup-app + PRD:
  `PaymentRemindersCard`, `SendTestMailModal`, mockup b2b (company orders / payment terms),
  spec `company-early-payment-discount`, và một lượt đại tu `TemplateEditor` bên mockup
  (`a99e6c845`, 32 file). Không phải code app.

### Còn trên nhánh (chưa vào master)

- **`feat/templates-redesign` — preview highlight theo marker (Task 0→7)**. Sau khi bỏ
  pagination client (xem Reverted), toàn bộ công sức chuyển sang một backbone khác: chèn
  comment `<!--cfg:KEY-->` **inert** quanh mỗi gate `{% if template.KEY %}` bằng chính
  tokenizer của liquidjs (`177dcd755`), rồi lấy Range theo marker thay vì đoán theo DOM
  (`8198035ba`), highlight bắn từ toggle thật (`07d4d7058`), và `c24ae63dc` xoá hẳn lớp
  heuristic hình học cũ (`resolveMarkTargets`/`LARGE_AREA_RATIO`/`LOOSE_FIT_RATIO`).
  Invariant load-bearing: strip marker khỏi render(injected) **byte-equal** với
  render(original). Vài bug đáng nhớ:
  - `d8134d79a` — marker close nằm trong nhánh `{% else %}` nên khi render chỉ 1 nhánh sống
    → marker lẻ → key đó **im lặng không bao giờ highlight**; byte-equal không bắt được vì
    marker bị strip ở cả hai đường. Fix bằng cách đi hết block stack, mỗi nhánh mang 1 cặp
    marker cân.
  - `b2a78026f` — theme `pos_invoice` float con của mỗi row mà container không clearfix →
    box cao ~0 → highlight vẽ lệch một dòng. Fix: khi border box **không bao** nội dung
    render (kiểm tra containment tất định, không phải heuristic tỉ lệ) thì rơi về overlay
    theo Range rect.
  - `a21a1677a` — barcode/QR chạy bwip-js + Buffer (Node-only) nên client miss cache là
    render **rỗng**; thêm SVG placeholder tất định, code quét thật vẫn từ PDF server.
  - `82f106a02` — chip "Updating" đã wire đủ nhưng **chưa ai từng thấy**: render local xong
    trong ~10-50ms nên nó mount/unmount trong 1-2 frame. Giữ tối thiểu 450ms, và chỉ giữ
    riêng `updating` — `stale`/`error` vẫn bắn ngay để không che trạng thái hỏng.
  - `ccec1eda7` — fixture e2e sinh tự động từ liquid của nhiều theme thay cho blob 1 theme.
- **`feat/sidekick-agent-extensions` — SB-14254**: data extension `pdf-invoice-tools` với
  2 read tool (`0c27cf508`), 4 intent extension + prefill (`bff3c71a0`, `2fd41c3e6`), commit
  `uid` do CLI sinh (`1fc38cc8e`, `fd3bbd0cc`) — thiếu uid thì CI có thể tạo bản đăng ký
  trùng. `997cbbc5c`: `@shopify/cli` 3.91.0 không đóng gói được assets cho
  `admin.app.intent.link` → phải nâng `^3.94.3` — **đúng lỗi đã gặp bên Joy Subscription**
  ([[shipped-subscriptions-2026-08-04]]), giờ tái phát ở app khác.
  `28689ff52` là đợt sửa 5 finding review, đáng nhớ nhất: `emailStatusOf()` tự chế một cách
  suy trạng thái email **khác với UI Email History** → tách `deriveOrderSendStatus` dùng
  chung cho cả hai; và `agentApi.js` mount error handler gọi `ctx.render('error')` trong khi
  route này không đăng ký koa-ejs → throw trong chính catch, thoát ra thành 500 trần.
- **`feat/template-redesign-01`** — redesign editor: skeleton theo số template thật
  (`b37ec06cf`), layout 3 cột panel setting sang trái (`95615485d`), close ở fullscreen
  điều hướng về `/templates` (`1c523010b`), và `89d34eae0` bỏ hẳn zoom, preview chỉ cuộn dọc
  + fix `resolveScroller` tự tìm khung cuộn thật (sau redesign có 2 khung `overflow-y` lồng nhau).
- **`feature/email-sender-custom-smtp`** `f459585f9` — QA fix validate SMTP: rule Save trước
  đây phụ thuộc `customSmtpEnabled` mà thao tác edit lại reset cờ này về false → **Save bỏ qua
  toàn bộ validate SMTP**; port bị strip âm thầm nên lỗi "Must be digits." không bao giờ hiện được.

## Reverted

- **`f2d9c5819` — `revert(preview): bỏ hẳn pagination của preview (Plan 2 client)`**, 129
  file, −3.969 dòng. Xoá `computePhysicalPages.js`, `renderPages.js`, `reconcileAnchor`,
  4 e2e spec Plan 2 và phần `countAnchors` bên `template.service`. Đáng chú ý: **toàn bộ
  Task C→G bị revert được viết trong cùng ngày** (`5d59705a2`, `9b007fd31`, `39ad2ee98`,
  `022175f00`, `9a35cbfdb`, `68abc4a16`, `a9003f529`). Đây là đổi hướng thật, không phải
  revert vá lỗi → tách riêng: [[2026-08-06-bo-pagination-preview-pdf]].

## Deploy notes

- `v3.1.71` là **version bump duy nhất** trong đợt, và nó là bump dependency chứ không phải
  code app — nhưng vẫn là bản chạy trên prod nếu được deploy.
- Không có `[deploy-functions]` / `[deploy-all]` trong log này. Hai commit trigger CI trần:
  `a0f7978de` ("triggerCI", sửa 1 dòng `.gitlab-ci.yml`) và `4100fe408` ("trigger deploy",
  rỗng) — cả hai trên nhánh.
- Không có file migration.

## Bỏ qua (noise)

`7b4ba8157` lockfile-only, `36a9e8020` xoá file debug lỡ commit (`dbg.py`, `verify_indent*.py`
— chính chúng được thêm ở `a99e6c845` cùng đợt), các commit `docs(sidekick)` chỉ đồng bộ
plan/spec (`8382f6208`, `8e084bf4e`, `10447c4ca`, `f3955482c`, `a01847572`, `403495c14`,
`d760bc7df`, `27e75678d`, `dc64b2b99`, `cc4cdb6ec`), và 2 merge master vào nhánh.

## Liên quan

[[shipped-pdf-2026-08-04]] · [[digest-pdf-2026-08-05]] · [[digest-pdf-2026-08-03]] ·
[[shipped-pdf-2026-07-31]] · [[pdf]]
