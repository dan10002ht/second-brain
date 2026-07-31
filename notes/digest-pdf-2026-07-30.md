---
type: note
title: Digest PDF Invoice — khối tổng tiền bị xẻ trang & header bảng không lặp (2026-07-30)
summary: CHỈ phần mới — khối tổng tiền vắt qua biên trang do header bảng là `<tr>` trần (không có `<thead>` nên không lặp), cách bọc `<thead>` an toàn, và kỷ luật kiểm cả hai đường in (đơn lẻ vs in gộp).
tags: [pdf, invoice, shopify, debug, avada, method]
created: 2026-07-30
source: project "pdf" (PDF Invoice for Shopify) — session history
---

# Digest PDF Invoice — 2026-07-30

> Chỉ ghi phần **mới** so với [[digest-pdf-2026-07-29]] (đã có: root cause engine
> page-break, `break-inside` vô hiệu trong flex, `PAGE_HEIGHT.TECH = 1220`, leak
> Chromium, patch `height: auto` nén trang, template refund rỗng, shim `cc`,
> ground truth bằng ảnh PDF, gotcha dev store scope rỗng).
> Commit landed của cùng chuỗi việc này → [[shipped-pdf-2026-07-31]]
> (bản trước: [[shipped-pdf-2026-07-30]]).

## Bugs (root cause)

- **Khối tổng tiền bị xẻ đôi qua biên trang** (`Sous-total`/`TVA` ở trang trước,
  `Total` rơi sang đầu trang sau, dính sát mép). CSS vá riêng trước đó chỉ bảo vệ
  **dòng hàng**, không bảo vệ khối tổng — cấu trúc là `.Template-Pricing__Detail`
  bọc `.Template-Pricing__Table`.
- **Header bảng không lặp sang trang sau vì là `<tr>` trần**, không nằm trong
  `<thead>`. Chrome chỉ tự lặp header khi nó ở trong `<thead>` — **cách "lặp header
  bằng CSS" không có tác dụng gì**. Fix: bọc header vào `<thead>` + giữ khối tổng
  nguyên khối.

## Techniques

- **Trước khi bọc `<thead>`, quét stylesheet xem có selector phụ thuộc thứ tự `tr`**
  (`nth-child`, sọc màu xen kẽ) — bọc lại sẽ làm lệch. Lần này quét thấy sạch nên
  bọc là an toàn; nếu có thì phải sửa selector kèm theo.
- **Kiểm cả hai đường in: in đơn lẻ và in gộp nhiều template.** In gộp là đường
  render riêng (`#adjustTemplateContainers` xoá `<br>`/`page-break-after` và tự set
  chiều cao) — bug chỉ lộ ở đường này, và fix ở đường kia có thể phá nó.
  Cùng họ với [[feedback-follow-conventions]] (sửa là quét mọi chỗ tương tự).
- **Khi fixture tự chế không tái hiện được, vẫn sửa theo *cấu trúc* thay vì đợi
  repro** — đơn thật của khách có ảnh/thuế/tên dài nên rơi biên trang khác hẳn.
  Đánh đổi: fix loại này phải được khách/tester xác nhận trên đơn thật.
  *(chưa xác minh: trong phiên chưa có xác nhận cuối từ khách cho khối tổng tiền)*

## Liên quan

[[pdf]] · [[digest-pdf-2026-07-29]] · [[shipped-pdf-2026-07-31]] ·
[[shipped-pdf-2026-07-30]] · [[digest-pdf-2026-07-23]] · [[digest-pdf-2026-07-21]] ·
[[shopify-app-dev]] · [[feedback-follow-conventions]]
