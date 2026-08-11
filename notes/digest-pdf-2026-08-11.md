---
type: note
title: Digest PDF Invoice 2026-08-11 — CKEditor echo, attachment href và DNS
summary: Root cause "editor nuốt/echo ký tự" là hành vi của `@ckeditor/ckeditor5-react` chứ không phải thiếu dirty-guard, và attachment kiểu `href` khiến nodemailer đi tải file qua URL nên hỏng ngay khi `APP_BASE_URL` sai.
tags: [pdf, invoice, react, nodejs, firebase, debug]
created: 2026-08-11
updated: 2026-08-11
source: project "pdf" — session history
---

CHỈ phần mới so với [[digest-pdf-2026-08-09]] và [[digest-pdf-2026-08-10]].
→ Quyết định tách riêng: [[2026-08-11-bo-feature-flag-payment-reminder]]

## Bugs

- **Editor "echo" ký tự — không phải thiếu dirty-guard.** Recon đưa 3 giả thuyết, cả 3 sai.
  Root cause thật: `@ckeditor/ckeditor5-react` khi prop đổi thì tự phát lại change event, tạo
  vòng lặp. Vòng sửa đầu (`suppressNextChangeRef`) **đẻ ra bug nặng hơn**: cờ có thể kẹt `true`
  rồi nuốt ký tự user gõ thật — verifier chặn lại trước khi commit. Vòng sửa hai đi hướng khác
  hẳn: **tách state machine thuần ra file riêng + test jest thật**, PASS.
- **Mail có theme nhưng PDF không đính kèm.** `getPDFAttachment` trả attachment kiểu **`href`**
  (URL để nodemailer tự tải lúc gửi, không phải bytes). Ở `mail.service.js` `attachments` bị
  đặt trong **object cấu hình transport** thay vì trong options của `sendMail` → nodemailer bỏ
  qua. Luồng invoice cũ đặt đúng chỗ nên vẫn chạy — tức đây là bug của feature reminder, không
  phải bug có sẵn. (Đã ghi ở [[digest-pdf-2026-08-10]]; phần mới là **hệ quả của kiểu `href`**:)
- **Gửi mail chết vì DNS, không phải SMTP.** Vì attachment là URL, nodemailer phải resolve được
  host lúc gửi. `APP_BASE_URL` sai → lỗi DNS, dễ bị đọc nhầm thành lỗi SMTP. Giá trị đúng cho
  staging: `avada-staging.firebaseapp.com` — **không `https://`, không dấu `/` cuối**, vì code
  tự ghép.
- **Ô "📎 Invoice_xxxx.pdf" trong thân mail không phải link** — chỉ là `<td class="attachment">`
  chứa emoji + tên file, không có `<a>`. Đúng thiết kế nhưng gây hiểu nhầm; đã sửa thành link tải.
- **Modal Send test đóng trước khi request xong.** `SendTestMailModal` gọi `onAction(...)` rồi
  `onClose()` ngay. Prop `loading` vốn đã đúng — thứ sai là thời điểm đóng. Component dùng ở
  **2 nơi** (`PaymentReminderSettings`, `AutomationEmail`) nên sửa bằng prop `closeOnAction`
  mặc định `true` → trang kia **diff rỗng**.

## Kỹ thuật

- **Verifier đọc `node_modules` để chốt root cause** thay vì suy luận: xác nhận đúng thư viện,
  đúng version, đúng predicate của `@ckeditor/ckeditor5-react`.
- **Chi phí verify không nằm ở chỗ hay nghĩ.** Verifier chạy 7,7 phút cho task 11 — dữ liệu này
  là cái nuôi [[2026-08-07-phan-tang-verifier]]: chọn hạng verify theo độ rộng diff (task 1 file
  → brief cực gọn; task 11 file, 2 package → hạng cao).
- **Tài liệu cho tester là file riêng trong repo**, không nằm trong brain: convention của repo là
  `*-test-cases.md` đặt cạnh PRD, README có link `([test cases](...))`, có skill `/create-test-case`.
- App **chỉ có đúng một feature flag** trong toàn bộ codebase (`grep process.env.ENABLE|FEATURE|GOLIVE`
  ra 1 dòng) — tức không có tiền lệ, flag này do chính feature payment reminder đẻ ra.

## Context

- Chốt spec Q1: **"Send again after N days" chỉ gửi thêm 1 lần sau lần gốc** — trần 3 email/đơn
  (1 due + 2 overdue). Đã sửa 4 chỗ trong spec từ "chờ Philip xác nhận" thành "Đã chốt (dantt, 11/08)".
  Code hiện tại vốn đã đúng như vậy, không phải sửa.
- Feature chạy end-to-end thật lần đầu sau khi Firestore index build xong: cron chọn đúng đơn,
  gửi thật, cờ trên đơn được ghi, và **idempotency chạy đúng** (lượt 2 không gửi lại).

## Liên quan

[[digest-pdf-2026-08-10]] · [[digest-pdf-2026-08-09]] · [[shipped-pdf-2026-08-11]] ·
[[2026-08-11-bo-feature-flag-payment-reminder]] · [[2026-08-07-phan-tang-verifier]] ·
[[2026-08-09-hoan-backfill-co-don-cu-pdf]] · [[feedback-feature-moi-mac-dinh-opt-in]] ·
[[bang-chung-phan-biet-duoc]] (recon đưa 3 giả thuyết, cả 3 sai — verifier đọc `node_modules`
mới là bằng chứng phân biệt được) · [[pdf]]
