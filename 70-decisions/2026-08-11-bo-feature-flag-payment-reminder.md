---
type: decision
title: Gỡ hẳn feature flag ENABLE_PAYMENT_REMINDER_SEND khỏi PDF Invoice
summary: Bỏ biến env gate việc gửi payment reminder vì nó không được set ở đâu trong repo (chỉ ở CI variable + máy local) nên prod sẽ im lặng không gửi, trong khi merchant đã có công tắc opt-in riêng.
tags: [pdf, invoice, nodejs, firebase]
created: 2026-08-11
updated: 2026-08-11
review: 2026-11-11
source: project "pdf" — session history
---

Chốt 2026-08-11: xoá `enablePaymentReminderSend` khỏi `config/app.js`, khỏi service, khỏi
`.env.example`, khỏi test và khỏi PRD. Commit `f317776c1` trên `feature/payment-reminder` (MR !497).
Flag này sinh ra từ chính nhánh này (`7ad035d31`, SB-15301 P2) — **master chưa từng có nó**,
nên gỡ không đụng gì đang chạy.

## Why

- **Hai công tắc chồng nhau, dễ nhầm.** Merchant đã có `due.enabled` / `overdue.enabled` — đúng
  mô hình opt-in ([[feedback-feature-moi-mac-dinh-opt-in]]). `ENABLE_PAYMENT_REMINDER_SEND` là
  công tắc thứ hai ở tầng env, và trong phiên này chính nó gây ra cảnh "merchant đã bật mà không
  thấy mail" (log ra `flag OFF — would send…`).
- **Nguồn của biến nằm ngoài repo.** Không set ở đâu trong code; chỉ đến từ GitLab CI variable,
  và tại thời điểm chốt chỉ đang bật ở máy local. Một flag mà quên set thì feature im lặng không
  chạy trên production — hỏng kiểu tệ nhất: không lỗi, không log, không ai biết.
- **Không có tiền lệ trong app.** `grep process.env.ENABLE|FEATURE|GOLIVE` ra đúng một dòng —
  chính nó. Giữ lại nghĩa là nuôi một cơ chế một-mình-một-kiểu.

## Tradeoff

- **Mất kill-switch nhanh.** Nếu bug gửi sai/gửi trùng lộ ra ở production, giờ không tắt được
  bằng cách đổi một biến CI + redeploy; phải revert code hoặc tắt từng shop qua `due.enabled`.
  Đổi lại: idempotency đã được chứng minh chạy đúng (lượt chạy thứ hai không gửi thêm), và trần
  3 email/đơn giới hạn thiệt hại.
- Bỏ luôn khả năng "deploy code trước, go-live sau" bằng cờ — go-live giờ đi cùng lúc merge.

## Xem lại 2026-11-11

Nếu tính tới lúc đó feature đã ship và có ít nhất một lần cần tắt gấp mà không tắt được, quyết
định này sai và nên dựng lại kill-switch — nhưng dựng **trong DB/shop doc**, không phải env.

→ [[digest-pdf-2026-08-11]] · [[pdf]] · [[feedback-feature-moi-mac-dinh-opt-in]] ·
[[shipped-pdf-2026-08-11]] · [[2026-08-09-hoan-backfill-co-don-cu-pdf]] (cùng feature: đơn cũ
cũng vĩnh viễn nằm ngoài cron, cũng là lựa chọn có chủ ý)
