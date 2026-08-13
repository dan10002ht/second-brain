---
type: decision
title: PDF Invoice không validate ô "Button URL" của email nhắc nợ (SB-15563)
summary: Đóng SB-15563 không sửa — nút CTA dẫn ra ngoài là do merchant/tester tự gõ chuỗi không phải URL vào ô Button URL, không phải lỗi app.
tags: [pdf, invoice, avada, method]
created: 2026-08-13
updated: 2026-08-13
status: active
review: 2026-11-13
source: project "pdf" — session history (a2d7c194, SB-15563)
---

# Không validate ô "Button URL" (SB-15563)

QA báo nút *"View invoice online"* trong mail nhắc nợ bấm ra `google.com`.
Root cause: `buildReminderEmailHtml.js:55` — `ctaHref = t.buttonUrl || invoiceLink
|| '#'`, và QA đã gõ chuỗi test `123###` vào ô **Button URL** ở Customize email
template. Gmail resolve href tương đối → ra ngoài.

Chốt: **đóng ticket, không sửa code.** Agent đang làm dở bị dừng và toàn bộ thay đổi
đã hoàn nguyên (giữ nguyên `yarn.lock` untracked của user).

Hướng đã đề xuất nhưng **không làm**: thêm validate `http(s)://` vào
`paymentReminderSchema.js:31` (vẫn cho để trống = dùng link hoá đơn).

## Why

`buttonUrl` là field cố ý, có input thật ở `ButtonSection.js` và helpText nói rõ
"để trống thì dùng link hoá đơn app sinh ra". Không ai gõ chuỗi rác vào đó thì nút
chạy đúng. Merchant tự nhập sai URL là lỗi ở thao tác của họ — quyết định của user,
và tôi không cãi phần đó.

## Tradeoff

- **Được:** không tốn công sửa cho một tình huống do tester tạo ra; không đụng vào
  schema đang trên nhánh feature sắp merge.
- **Mất:** ô đó **là ô URL** mà app nhận bất kỳ chuỗi nào rồi im lặng nhét thẳng vào
  `href`. Nếu một merchant thật gõ nhầm (thiếu `https://`, dán kèm khoảng trắng),
  triệu chứng sẽ là **mail gửi cho khách của họ dẫn ra một trang lạ** — hỏng im lặng,
  không log, không ai biết cho tới khi khách phản ánh. Rủi ro thấp nhưng hậu quả
  hướng ra ngoài merchant.
- Nếu mở lại: bản vá rẻ (validate ở schema + để trống vẫn hợp lệ) đã ghi sẵn trong
  `BRIEF.md`, không phải điều tra lại.

## Review 2026-11-13

Câu hỏi: có ticket nào từ merchant thật (không phải QA) về link CTA sai không? Có →
thêm validate; không → giữ nguyên và coi như đóng hẳn.

→ [[digest-pdf-2026-08-13]] · [[2026-08-11-bo-feature-flag-payment-reminder]]
