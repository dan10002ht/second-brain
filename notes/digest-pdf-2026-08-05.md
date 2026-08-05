---
type: note
title: Digest PDF Invoice — 2026-08-05 (kết quả chiến dịch email 27.6k)
summary: CHỈ phần mới — số liệu chốt của chiến dịch email marketing đầu tiên (27.626 mail, 1 lỗi, ~0.09% unsubscribe) và ngưỡng batch chạy trọn được trong môi trường hay giết tiến trình nền.
tags: [pdf, invoice, nodejs, avada]
created: 2026-08-05
source: project "pdf" (PDF Invoice / Avada Order Printer) — session history
---

# PDF Invoice — digest 2026-08-05

> Toàn bộ kỹ thuật của đợt này đã ghi ở [[digest-pdf-2026-08-03]] (unsubscribe HMAC,
> bẫy Firebase Hosting/emulator/koa-bodyparser, resume qua progress file, không in
> secret ra chat, PubSub client dùng chung). Đây **chỉ** là con số chốt — để làm mốc so
> sánh cho chiến dịch sau.

## Context — kết quả chiến dịch

| | |
|---|---|
| Gửi thành công | **27.626 / 27.626** (100%) |
| Địa chỉ trùng | 0 — resume qua progress file chạy đúng |
| Thất bại | **1** trên toàn bộ đợt |
| Unsubscribe | **≈0.09%** (~25 store — *chưa xác minh* con số cuối, bảng tổng kết bị cắt trong log; tỉ lệ 0.09% thì ổn định suốt đợt) |

- **Ngưỡng batch thực dụng ≈ 1.000 mail/lượt.** Batch 5.000 bị môi trường giết giữa
  chừng nhiều lần (ở mail thứ ~900, ~1.800, có lượt chỉ ~230); batch 1.000 thì gần như
  luôn chạy trọn. Nhịp đã dùng: xong một batch → chạy batch kế, dựa vào resume để không
  mất mát.
- **Tốc độ thực tế thấp hơn nhiều con số script in ra** (rate 8/s chỉ là ceiling) —
  2.000 mail mất ~45 phút, tức ~0.7/s.
- Có người bấm unsubscribe **ngay trong lúc đợt đang chạy**, và script bỏ qua đúng
  (đường gửi đọc lại trạng thái, không chỉ đọc CSV lúc bắt đầu).

## Liên kết

[[pdf]] · [[digest-pdf-2026-08-03]] · [[shipped-pdf-2026-08-04]]
