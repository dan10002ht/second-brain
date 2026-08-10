---
type: note
title: PDF Invoice — digest 2026-08-10 (mail không bọc theme, attachments đặt sai chỗ, dựng luồng test webhook local)
summary: Mail reminder ra plain text vì cả hai đường gửi chỉ `html: content` không bọc theme, và PDF không đính kèm vì `attachments` nằm trong cấu hình transport thay vì options của `sendMail`; kèm trọn cách dựng webhook local (funnel + DevZone register) để test feature end-to-end.
tags: [pdf, invoice, avada, debug, backend, nodejs, firestore]
created: 2026-08-10
updated: 2026-08-10
source: project "pdf" — session history (BRIEF task 17–23, payment reminder SB-15301)
---

CHỈ phần chưa có trong [[digest-pdf-2026-08-09]] và [[shipped-pdf-2026-08-08]].

## Bugs

**Mail gửi ra chỉ có rich text trần, không nền không style — vì không ai bọc theme.**
Cả hai đường gửi (test + cron) đều `MailService.sendMail({ html: content })` — `content` là đúng
phần merchant gõ trong ô Content, còn cấu hình `theme` (logo, màu, footer, nút CTA) **chưa từng
được áp lúc gửi**, chỉ áp ở preview. Sửa bằng cách port 1:1 markup/CSS của preview thành hàm
thuần `helpers/email/buildReminderEmailHtml.js`. Điều kiện quyết định cách làm — kiểm trước khi
chốt hướng, đừng đoán: **`packages/assets` import được từ `packages/functions`** (233 chỗ đang
làm vậy, alias khai trong cả `.babelrc` lẫn `vite.config.js`), nên preview và mail thật dùng
chung một nguồn markup thay vì đẻ ra hai bản HTML lệch nhau.

**HTML kiểu web ≠ HTML email.** Bọc theme xong mail vẫn mất nền: `body { background }` bị client
mail strip. Phải `<table>` bọc ngoài, màu đặt ở **cả** `bgcolor` **và** inline `style` trên `<td>`,
mọi element có inline style. Cách kiểm nhanh khi nghi "CSS không ăn": nhìn khung viền khối
attachment và footer căn giữa — chúng đến từ template, còn thì theme **có** được áp.

**PDF không đính kèm dù `getPDFAttachment` trả đúng.** `mail.service.js` đặt `attachments` trong
**object cấu hình transport** thay vì trong options của `sendMail`, nên nodemailer bỏ qua im lặng.
Luồng invoice đang chạy tốt đặt đúng chỗ (`processHookedInvoice.js`, `mail.service.js:567`) — đây
là bug đẻ ra bởi feature mới, không phải bug có sẵn. Đọc call site đang hoạt động trước khi kết
luận "thư viện không hỗ trợ".

**Khối `📎 Invoice_1003.pdf` trong thân mail không bấm được** — đúng thiết kế lúc đó: `<td
class="attachment">` chứa emoji + tên file, không có `<a>`. Sau đó mới bọc `<a href>` thành link
tải thật. Thẻ đính kèm thật của Gmail nằm ở **cuối thư**, không phải khối này.

**Modal test-mail đóng trước khi request xong.** `SendTestMailModal` gọi `onAction(...)` rồi
`onClose()` ngay → prop `loading` truyền đúng nhưng không kịp hiện. Component có **2 call site**
(`PaymentReminderSettings.js`, `AutomationEmail.js`) nên fix bằng prop `closeOnAction` mặc định
`true`; `AutomationEmail.js` giữ nguyên, diff rỗng.

**CKEditor tự echo làm dirty-guard sai.** `@ckeditor/ckeditor5-react` khi prop `data` đổi thì gọi
lại `onChange` → state coi như user vừa gõ. Vòng fix đầu dùng cờ `suppressNextChangeRef` bị
`verifier` chặn: cờ có thể kẹt `true` rồi **nuốt ký tự user gõ thật** — fix đẻ bug nặng hơn bug
gốc. Vòng hai đổi hướng: tách state machine thuần ra file riêng + test jest.

## Techniques

**Dựng luồng webhook để test feature ở local — bốn chỗ hay vấp.**

| Chỗ | Sự thật |
|---|---|
| `sdd` / `emudev` | **không** dựng tunnel — phải tự chạy `tsdev` (`tailscale funnel --bg 5002`) |
| Cổng funnel | mặc định trỏ 5002 nhưng hosting là **5000** (functions 5031, app 3000/3001) → trỏ lại + sửa `APP_BASE_URL` |
| Endpoint | doc `wholesaleOrders` chỉ sinh từ `orders/updated` → **`/webhook/order-update`**, không phải `/webhook/order` |
| Nút Register của DevZone | dùng `webhookSubscriptionCreate` = **tạo mới, không thay thế** — bấm 2 lần thì mỗi topic có 2 subscription |

Kiểm đường đi thông bằng `GET` tới endpoint: trả **405** (Koa "method not allowed") nghĩa là
request đã đi qua internet vào tới router — đủ để loại trừ tunnel.
Sửa `.env.local` bằng `sed` chứ đừng mở cả file: nó chứa credential, không cần kéo vào context.

**Đơn test phải là Create order + payment terms "Fixed date".** Draft order không sinh doc
`wholesaleOrders`. `Due on receipt` / `Due on fulfillment` không sinh mốc hạn nên `getPaymentTerms`
không có gì để tính.

**Firestore composite index có trạng thái "building".** Query trả
`That index is currently building and cannot be used yet` — không phải thiếu index, chỉ là chờ.
Đó cũng là thứ chặn lần chạy cron mô phỏng đầu tiên.

## Context

- **Hai công tắc khác nhau, tên không giúp gì.** `due.enabled` / `overdue.enabled` là của
  merchant; `ENABLE_PAYMENT_REMINDER_SEND` là env feature flag — cờ tắt thì log ra
  `flag OFF — would send…` chứ không gửi. Grep `process.env.ENABLE|FEATURE|GOLIVE` cho đúng **một**
  dòng: đây là feature flag duy nhất trong app, không có tiền lệ. Hợp với
  [[feedback-feature-moi-mac-dinh-opt-in]].
- Idempotency của cron chạy đúng: lần chạy thứ hai chọn 0 đơn vì cờ `isSendDueReminder` /
  `overdueReminderCount` đã ghi.
- Agent vòng sửa task 20 sửa cả `.gitlab/ci/auto-merge.yml` (`AUTO_MERGE_AUTHORS`) — hoàn toàn
  ngoài scope và là config auto-merge. Đọc `git status` trước khi commit thay agent.
- Repo đã đổi remote sang on-prem nhưng **nhánh vẫn track `saas`** → `git push` trần vẫn bay lên
  gitlab.com. Phải set upstream từng nhánh: xem [[migrate-repo-gitlab-on-prem]].

→ [[pdf]] · [[koa-yup-validator-yup029]] · [[2026-08-07-phan-tang-verifier]]
