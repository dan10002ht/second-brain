---
type: decision
title: ticket-mcrsv — venue designer giữ 2D để dựng, thêm 3D để xem, chung một nguồn dữ liệu
summary: Không viết lại designer thành 3D và cũng không giữ nguyên 2D thuần — 2D vẫn là đường authoring, 3D là lớp xem có ở cả designer lẫn trang bán vé, cả hai đọc cùng một model zone/seat.
tags: [react, patterns, architecture, method]
created: 2026-09-04
updated: 2026-09-04
status: active
review: 2026-12-04
source: project `ticket-mcrsv` — session history 2026-09-04 (sau khi xem 28 trang chạy trên mock gateway)
---

# 2D để dựng, 3D để xem

## Bối cảnh

Sau khi mock gateway cho phép mở thật 28 trang, phản hồi của dantt là *"trang trông đơn giản quá"*
và *"tôi muốn có thể thiết kế venue dưới dạng cả 2D lẫn 3D"*. Đây là **architectural** — 3D là
subsystem mới (engine render, mô hình dữ liệu có chiều cao/độ dốc, view-from-seat), không phải một
chỉnh sửa trong luồng hiện có, nên nó được tách ra khỏi việc redesign giao diện.

## Quyết định

- **2D giữ nguyên vai authoring** — vẽ, kéo thả, sửa zone/fixture vẫn đi qua `venue-canvas` SVG có
  cấu trúc, 0 dependency (hướng đã chốt ở `F10`).
- **3D là lớp xem**, có ở **cả designer lẫn trang bán vé**, không phải chỗ để sửa dữ liệu.
- Cả hai đọc **cùng một nguồn dữ liệu** zone/seat — không nhân đôi model.
- Ràng buộc dantt đưa: **không tính ngân sách, ưu tiên mượt**.

## Why

- Giữ được tốc độ authoring của 2D (đã đo, đã có pinch-zoom + vùng chạm 44px + phân vùng
  `clipPath`), trong khi 3D trả lời đúng thứ khách cần khi mua vé: *ngồi chỗ này thì nhìn thấy gì*.
- Viết lại designer sang 3D là ném đi toàn bộ `F10`/`F20`/`F21`/`F23` — bốn task đã qua verifier —
  để đổi lấy một đường authoring chưa ai chứng minh là nhanh hơn.
- Lý do `F10` bác 3D hồi trước ("dữ liệu chưa có") được đánh giá là **không còn đúng**.
  ⚠️ *Chưa xác minh* — transcript đứt trước khi phần recon này được trình bày đầy đủ; phải đọc lại
  spec trước khi coi đây là căn cứ.

## Tradeoff

- **Một model, hai đường render** ⇒ mọi field mới của zone/seat phải đúng ở cả hai; một bên quên là
  hai màn hình nói khác nhau về cùng một sơ đồ, và chỉ bên bán vé bị khách nhìn thấy.
- 3D cần dữ liệu mà 2D không bắt buộc (chiều cao, độ dốc). Nếu không ép ở tầng authoring, phần lớn
  venue sẽ có 3D "chạy" nhưng vô nghĩa — thứ trông như đã có tính năng.
- "Ưu tiên mượt, không tính ngân sách" đẩy chi phí sang bundle và thiết bị yếu; chưa có ngưỡng đo
  nào được chốt cho nó, nên cần một gate đo được như đã làm với hệ token
  ([[2026-08-27-he-thi-giac-chong-ai-slop]]), nếu không "mượt" sẽ là ý kiến chứ không phải tiêu chí.

Liên quan: [[moc-ticket-mcrsv]] · [[digest-ticket-mcrsv-2026-09-04]] ·
[[2026-08-27-he-thi-giac-chong-ai-slop]]
