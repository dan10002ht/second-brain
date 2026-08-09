---
type: decision
title: Hoãn backfill cờ payment-reminder cho đơn cũ đến khi BA có requirement
summary: PDF Invoice không backfill cờ eligibility cho đơn wholesale đã tồn tại — cờ chỉ seed ở nhánh `.add()` nên đơn cũ vĩnh viễn nằm ngoài cron, và đó là lựa chọn có chủ ý chứ không phải quên.
tags: [pdf, invoice, avada, firestore]
created: 2026-08-09
updated: 2026-08-09
review: 2026-11-09
source: project "pdf" — session history (SB-15301, task 11)
---

Cron payment reminder chọn đơn theo một cờ trên document order. Cờ đó **chỉ được seed ở nhánh
`.add()`** của `wholesaleOrdersRepository` — đơn đã tồn tại trước khi feature ra đời không có
cờ, nên cron sẽ không bao giờ chọn chúng.

Chốt: **giữ nguyên**, không viết script backfill. Chỉ làm khi BA bổ sung requirement rõ ràng.
Điều này đóng mục "cần xác nhận" của [[shipped-pdf-2026-08-08]] (đã có command backfill hay
đã hoãn): **đã hoãn có chủ ý**.

## Why

- Feature chưa live với khách; tập đơn cũ chưa ai yêu cầu phải được nhắc.
- Hướng ngược lại nguy hơn nhiều: backfill hoặc khởi tạo cờ mặc định `true` sẽ làm **một loạt
  đơn cũ đột nhiên đủ điều kiện** và app gửi mail nhắc nợ ra ngoài cho khách của merchant mà
  không ai chủ động bật. Đúng thứ [[feedback-feature-moi-mac-dinh-opt-in]] cấm.
- Ghi thành quyết định để lần sau không ai đọc code rồi tưởng là bug bỏ sót.

## Tradeoff

- Đơn wholesale tạo trước feature **vĩnh viễn** ngoài tầm cron, trừ khi có backfill sau này.
  Merchant bật feature xong có thể thắc mắc "sao đơn quá hạn cũ không được nhắc".
- Nếu sau này backfill, phải kèm cửa sổ thời gian (chỉ đơn N ngày gần đây) chứ không quét hết
  — nếu không sẽ rơi đúng vào cái bẫy gửi hàng loạt ở trên.

→ [[digest-pdf-2026-08-09]] · [[digest-pdf-2026-08-07]] · [[pdf]]
