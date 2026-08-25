---
type: note
title: Runbook agent — PDF Invoice
summary: Runbook cho agent support tự đọc trước khi điều tra case pdf-invoice — triệu chứng → chỗ phải nhìn → bẫy đã gặp, kiểm chứng trên repo 2026-08-25.
tags: [pdf, invoice, shopify, runbook, agent, support, debug]
created: 2026-08-25
updated: 2026-08-25
source: [[pdf]]
---

# Runbook — PDF Invoice (`pdf-invoice`)

> Đọc file này TRƯỚC khi điều tra bất kỳ case nào của app `pdf-invoice`.
> Nguồn: 20+ digest phiên làm việc thật của dantt (07–08/2026) + đọc repo `~/repos/pdf`.
> Chỗ ghi *chưa xác minh* nghĩa là đã gặp nhưng chưa chốt được nguyên nhân — đừng khẳng định.

## 1. App này là gì

Shopify app sinh **hoá đơn PDF** cho merchant: in, tải, gửi email cho order và draft
order. Có thêm mảng **email marketing / payment reminder** cho đơn B2B (wholesale).

Hai đường sinh nội dung, và **chúng hay lệch nhau** — đây là nguồn bug lặp lại nhiều
nhất của repo này:

| Cặp đường | Bug đã gặp |
|---|---|
| preview vs gửi thật | preview áp theme, đường gửi thì không → mail ra plain text |
| in đơn lẻ vs in gộp | sửa một đường, đường kia vẫn hỏng |
| test-mail vs cron gửi thật | "Send test" dùng **sample order**, không phải data thật |

**Luật rút ra: sửa chỗ nào cũng phải kiểm CẢ HAI đường.** Nếu chỉ kiểm một, khả năng
cao là bug vẫn còn ở đường kia.

## 2. Bản đồ code

Monorepo yarn workspaces: `packages/{functions,assets}` + `extensions/` (~15 cái, chia
theo order/draft × print/download/send × đơn lẻ/hàng loạt).

| Tầng | Đường dẫn | Ghi chú |
|---|---|---|
| Controller | `packages/functions/src/controllers/` | có `apiV1/` riêng cho API công khai |
| Service | `packages/functions/src/services/` | to nhất: `wholeSale.service.js` (32 KB), `template.service.js` (27 KB), `mail.service.js` (24 KB) |
| Repository | `packages/functions/src/repositories/` | 1 collection = 1 repo. **Firestore chỉ được đụng ở đây**, không đụng trong service |
| Sinh PDF | `services/printer.service.js`, `services/puppeteer.service.js` | Puppeteer/Chrome render HTML → PDF |
| Template | `config/themes.js` + `storage/themes/<tên>/` | thêm template mới = đăng ký ở `themes.js` **và** thêm HTML/CSS vào `storage/themes/` |
| Email | `services/mail.service.js`, `helpers/email/buildReminderEmailHtml.js` | |
| Validator | `middleware/validator.js` (dùng `koa-yup-validator`) | xem bẫy ở mục 3 — đây là nguồn bug im lặng |
| Admin UI | `packages/assets/src/` | React + Polaris |

**`packages/assets` import được từ `packages/functions`** — 233 chỗ đang làm vậy, alias
khai trong cả `.babelrc` lẫn `vite.config.js`. Nhờ đó preview và mail thật dùng chung
một nguồn markup thay vì đẻ ra hai bản HTML lệch nhau.

## 3. Triệu chứng → nhìn đâu trước

| Merchant kêu | Nhìn trước | Bẫy đã gặp |
|---|---|---|
| **Save trả 200 nhưng cài đặt không lưu** | **xem bảng "đường nào đã vá" ngay dưới bảng này** rồi mới tới `middleware/validator.js` + schema yup | `koa-yup-validator` sau khi validate **ghi đè `ctx.req.body`** bằng giá trị yup đã cast. Yup 0.29 biến `object().notRequired()` *vắng mặt trong input* thành object đầy đủ với mọi field `undefined` → Firestore ném `Cannot use "undefined" as a Firestore value`, lỗi bị nuốt, controller vẫn trả 200. Fix: `.default(undefined)` cho nested object. **Dấu hiệu nhận biết: response GET không có field `id`** (repository map từ doc) mà vẫn trả data → đó là default, không phải doc thật |
| **Mail gửi ra trần trụi, không giống preview** | cả hai đường gửi | `MailService.sendMail({html: content})` — `content` là phần merchant gõ, **theme chưa từng được áp lúc gửi**, chỉ áp ở preview |
| **Mail mất nền dù đã bọc theme** | HTML email ≠ HTML web | `body { background }` bị client mail strip. Phải `<table>` bọc ngoài, màu đặt ở **cả** `bgcolor` **và** inline `style` trên `<td>`, mọi element inline style |
| **PDF không đính kèm dù sinh đúng** | `mail.service.js` | `attachments` bị đặt trong **object cấu hình transport** thay vì trong options của `sendMail` → nodemailer bỏ qua **im lặng**. Luồng invoice đang chạy tốt đặt đúng chỗ (`processHookedInvoice.js`) — đọc call site đang hoạt động trước khi kết luận "thư viện không hỗ trợ" |
| **Đính kèm hỏng / nodemailer chết ở DNS** | `attachments` kiểu `href` | nodemailer đi **tải file qua URL** → chết ngay khi `APP_BASE_URL` sai |
| **Nội dung PDF vắt qua biên trang** | `storage/themes/<tên>/` CSS | header bảng là `<tr>` **trần** → Chrome chỉ tự lặp header khi nó nằm trong `<thead>`; "lặp header bằng CSS" **không có tác dụng gì**. Khối tổng tiền phải giữ nguyên khối (`.Template-Pricing__Detail` bọc `.Template-Pricing__Table`) |
| **Số tiền bị ngắt giữa chữ số** | CSS ô amount | `overflow-wrap: anywhere` |
| **Email quá rộng trên điện thoại** | padding, không phải `min-width` | đã chẩn nhầm 2 lần: sàn bề ngang đến từ **padding chồng nhiều tầng**, không từ `min-width`. Đo thật trước khi kết luận |
| **Editor nuốt / lặp ký tự** | `@ckeditor/ckeditor5-react` | hành vi của chính thư viện: prop đổi thì nó tự phát lại change event. **Không** phải thiếu dirty-guard |
| **Toggle đổi được nhưng save bar không hiện** | `RichTextEditor` tự chế | chỉ commit vào state lúc `onBlur` → bấm toggle rồi Save ngay thì state chưa đổi |
| **Cron không bao giờ chọn được đơn nào** | `wholesaleOrdersRepository` | cờ chỉ được seed ở nhánh `.add()` → đơn đã tồn tại không có cờ, query của cron loại hết |
| **App 500 ở mọi request / `whoami` lỗi `shopID`** | Firebase Authentication | `updateOrCreateUser` gọi `admin.auth().createUser()`; project chưa bật Identity Toolkit ⇒ **doc `shops` không bao giờ được tạo**. Nhưng `checkIfActiveShop` kết luận `installed: true` chỉ dựa trên `shopifySession` ⇒ **deadlock**. **Dấu hiệu chẩn đoán: Firestore chỉ có đúng 1 collection `shopifySession`** |
| **Sender email sai** | FE hardcode chuỗi mặc định | |
| **Ô upload logo không hiện** | một rule **CSS global** | không phải default logo — giả thuyết cũ từng được verifier PASS **nhầm** |
| **Store không nhận reminder** | có đơn B2B thật không? | từng có 3 lớp chặn độc lập, nhưng lý do cuối cùng là **store đó không có đơn B2B nào** |

### Bug "trả 200 nhưng không lưu" — đường nào đã vá, đường nào chưa

Kiểm trên repo 2026-08-25. **Đừng giả định cả app cùng trạng thái** — hai đường song
song nhau nhưng chỉ một đường được làm cứng:

| | `paymentReminders` | `emailNotifications` |
|---|---|---|
| `new Firestore(...)` | `{ignoreUndefinedProperties: true}` (SB-15301, có comment giải thích) | **`new Firestore()` trần** |
| Lỗi ghi | rethrow | **`catch (e) { return false }` — nuốt** |
| Controller | kiểm `saved`, ném `BadRequestError` | **không đọc kết quả → luôn trả 200** |
| Schema | `.default(undefined)` đã thêm | chưa kiểm |

Nghĩa là ở đường `emailNotifications`, **một field `undefined` vẫn đủ làm vỡ cả lần
`.update()` mà merchant thấy "lưu thành công"**. Chỗ cần nhìn:
`repositories/emailNotificationRepository.js:4` và `:59`,
`controllers/emailNotification.controller.js:14`.

Trớ trêu là comment trong `paymentReminderRepository.js` còn ghi *"same pattern as
emailNotificationRepository.getLatestForShop"* — hai đường vốn là bản sao của nhau, và
bản gốc mới là bản chưa được vá.

*(Phát hiện bởi chính agent khi điều tra ticket `PDF-RB-1`, đã được người kiểm lại.)*

## 4. Điều tra bằng dữ liệu thật

**Luật số 1: đọc thoải mái, KHÔNG BAO GIỜ ghi.** Agent chỉ có quyền view. Cần sửa dữ
liệu prod ⇒ dừng, báo người.

### Project Firebase

| Môi trường | Project id |
|---|---|
| production | `pdf-invoice-4717c` |
| staging (mặc định) | `avada-staging` |
| staging2/3/4 | `avada-pdf-staging-2`, `avada-pdf-invoice-staging-3`, `avada-pdf-invoice-staging-4` |

⚠️ **`gcloud`/`bq` lấy project từ config TOÀN CỤC của máy, không theo thư mục đang
đứng.** Máy này từng đang trỏ `avada-subscription-app` — chạy query cost/memory mà
không set project là ra số của app khác. **Luôn set và verify project trước khi query.**

### Kiểm bằng đúng cách app kiểm

Đã vấp: script kiểm so `paymentBadge == 'OVERDUE'` viết hoa, trong khi hằng thật là
`export const OVERDUE = 'overdue'` → kết luận sai. Đừng dựa vào field của REST API hay
hằng tự gõ lại — **đọc hằng trong code**.

Tương tự: *"log nói After login done"* không phân biệt được "auth chạy xong" với "shop
được tạo". Chỉ **đếm doc trong Firestore** mới phân biệt được.

## 5. Luật khi sửa code — vi phạm là MR bị đóng

1. **Firestore chỉ đụng ở tầng repository**, không đụng trong service.
2. **Multi-tenant**: mọi query validate `shopId`.
3. Thêm template = đăng ký `config/themes.js` **và** thêm file vào `storage/themes/`.
4. Sửa gì cũng **kiểm cả hai đường** (preview/gửi, đơn lẻ/hàng loạt) — xem mục 1.
5. **KHÔNG đụng**: `RELEASE_NOTE.md`, `config/crypto.js`, `*.env`, `serviceAccount*`,
   `.gitlab-ci.yml`, `firebase.json`. Mấy file này chứa hoặc từng chứa secret.
6. Puppeteer nặng — cẩn thận đừng kéo nó vào cold start của function nhỏ (đã từng làm
   một function 256 MiB chết vì lỡ import chuỗi tới `printer.service.js`).

## 6. Viết test tái hiện bug

Cổng bắt buộc: test phải **fail trước fix, pass sau fix**.

⚠️ **Bẫy lớn nhất của repo này** — đọc kỹ trước khi đặt file test:

`packages/functions/jest.config.js` đặt `rootDir: 'src'`, mà `roots` mặc định là
`[rootDir]`. Nên **toàn bộ cây `packages/functions/__tests__/**` chưa bao giờ được
`yarn test` chạy tới** (chỉ `__tests__/wholeSale` được thêm tay vào `roots`). Comment
trong chính file đó xác nhận: *"has never actually been discovered by yarn test"*.

Hệ quả: đặt test vào `packages/functions/__tests__/<thư mục mới>/` là tạo ra một test
**im lặng không bao giờ chạy**. Hai cách đúng:

- đặt test cạnh code trong `src/**/__tests__/*.test.js`, hoặc
- gọi jest thẳng vào file: `yarn jest <đường dẫn file test>`

Bẫy phụ: **đừng đặt file không-phải-test vào `__tests__/`**. `testMatch` mặc định gom
luôn file config → Jest vỡ với *"test suite must contain at least one test"*.

Khác: `packages/assets` dùng `jest --passWithNoTests`, nên test hỏng ở đó có thể **không
làm đỏ** gì cả — kiểm bằng cách chạy đúng file.

Mock: **call count không tự reset giữa các case** → phải reset trong `beforeEach`.

## 7. Khi nào DỪNG và gọi người

Ra report, tuyệt đối không tạo MR, nếu case chạm bất kỳ điều nào:

- Liên quan tiền của khách: refund, charge sai, hoàn tiền
- Cần sửa/xoá dữ liệu prod, hoặc bật/tắt dịch vụ trên GCP (ví dụ Firebase Auth)
- Cần đổi schema, thêm collection, thêm webhook, sửa shared helper
- Bug nằm ở **hành vi của client mail** (Gmail/Outlook strip CSS) — không kiểm được bằng test
- Bug chỉ thấy được bằng **mắt** (layout PDF, render email). Đã có tiền lệ: agent kết
  luận "không phải bug, đúng thiết kế", verifier PASS theo, chỉ đến khi merchant gửi
  **ảnh chụp màn hình** mới lật lại được. Verifier chỉ trace được đường code, không
  chứng minh được hành vi UI.
- Không dựng được test tái hiện

**"Chưa tìm ra" là kết quả hợp lệ và hữu ích.** Một report ghi rõ đã loại trừ được gì
có giá trị hơn nhiều so với một MR đoán mò.

## 8. Bẫy môi trường

- `yarn use:staging1` / `use:staging2` để đổi env Firebase; dev cần `serviceAccount.json` xin team
- PubSub emulator cần **Java 11+**
- Webhook của store dev hay còn trỏ về **URL tunnel đã chết** — endpoint sống nhận diện
  bằng `405 Method Not Allowed` cho GET (path bịa trả 404)
- `APP_BASE_URL` sai làm nodemailer đi tải PDF qua URL rồi chết ở DNS
- `RELEASE_NOTE.md` và `config/crypto.js` **có secret hardcode** (SendGrid, Google OAuth,
  một khoá mã hoá mà scanner từng bỏ sót). Đừng đọc to, đừng copy đi đâu, đừng sửa.
