---
type: note
title: Digest PDF Invoice — gửi email marketing cho merchant (2026-07-31)
summary: CHỈ phần mới — app không có SMTP riêng mà đi nhờ creds SES của Chatty, tên app deploy thật lệch tên marketing, link CTA `admin.shopify.com/apps/<handle>/embed` tự resolve theo store đang đăng nhập, và export recipient phải tái dùng đúng hàm phân loại plan của app.
tags: [shopify, pdf, invoice, avada, marketing-automation]
created: 2026-07-31
source: project "pdf" (PDF Invoice for Shopify) — session history
---

# Digest PDF Invoice — 2026-07-31

> Chỉ ghi phần **mới** so với [[digest-pdf-2026-07-30]], [[shipped-pdf-2026-07-31]],
> [[digest-pdf-2026-07-23]].

## Feedback

- **Đọc hết biến môi trường trước khi kết luận "thiếu credential".** Lần kiểm đầu báo
  không gửi được vì `SMTP_*` rỗng → sai. `CHATTY_SMTP_*` mới là bộ có creds đầy đủ.
  Bài học chung: khi một tính năng "thiếu config", grep theo **công dụng** (mọi biến
  chứa `SMTP`) chứ không theo tên biến mình đoán trước.

## Decisions

- **Giữ tên "Avada Order Printer" trong email**, dù app deploy thật tên là
  **"AG Order Printer"** (đọc từ `.shopify/deploy*`). *Why:* tên thương hiệu merchant
  quen thuộc hơn tên kỹ thuật đang deploy. *Tradeoff:* tồn tại **lệch tên** giữa email
  và app store listing — người nhận có thể không nhận ra app khi mở admin.
- **Link CTA để tĩnh, không cá nhân hoá theo store.** Cùng một URL dùng ở 2 chỗ trong
  template (`href` bọc hero image và nút CTA). *Why:*
  `https://admin.shopify.com/apps/<app-handle>/embed` được **Shopify admin tự resolve
  theo store của phiên đang đăng nhập** → không cần biết store nào để dựng link riêng.
  Đã verify bằng cách bấm thật từ email nhận được.

## Bugs / gotchas

- **Sender name trống.** `CHATTY_SMTP_SENDER` chỉ là địa chỉ trần
  (`noreply-pdfinvoice@chattyemail.com`) → inbox hiện "no name". Muốn có tên hiển thị
  phải set riêng phần display-name, không suy ra được từ địa chỉ.

## Techniques

- **PDF Invoice không có hạ tầng mail riêng — đi nhờ SMTP của Chatty**
  (`CHATTY_SMTP_*`, AWS SES `us-east-1`). Gửi thử được ngay từ local, SES trả
  message-id để tra cứu. Nhớ check cả **spam** khi verify bản test.
- **Export recipient phải tái dùng đúng hàm phân loại của app.** Script
  `commands/exportCampaignRecipients.js` dùng lại tiêu chí trong
  `packages/functions/src/config/getPlans.js` thay vì tự viết điều kiện lọc plan →
  danh sách gửi khớp với những gì app coi là plan đó. Loại dev store ra khỏi list.
  (Service account prod = project `pdf-invoice-4717c`, xem [[digest-pdf-2026-07-23]].)
- **Asset campaign nằm trong repo mockup-app:**
  `product-team/marketing/product/mockup-app/public/email-previews/campaigns/` —
  file HTML + metadata ở `campaigns.json` cùng thư mục.

## Liên quan

[[pdf]] · [[shipped-pdf-2026-08-01]] (commit landed cùng cửa sổ) · [[digest-pdf-2026-07-30]] ·
[[shipped-pdf-2026-07-31]] · [[digest-pdf-2026-07-23]] · [[shopify-app-dev]]
