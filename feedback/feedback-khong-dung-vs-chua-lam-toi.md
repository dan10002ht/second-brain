---
type: feedback
title: "\"Không dùng tới\" và \"chưa làm tới\" là hai kết luận khác nhau — kiểm plan trước khi đề xuất xoá"
summary: Trước khi gắn nhãn một service/module là thừa và đề xuất cleanup, phải đọc plan/roadmap xem nó là đường cụt hay chỉ là phần chưa tới lượt build — dữ kiện đo được (không có reference nào) không phân biệt được hai thứ đó.
tags: [feedback, method, architecture]
created: 2026-08-21
updated: 2026-08-21
source: project "ticket-mcrsv" — session history 2026-08-21
---

# "Không dùng tới" ≠ "chưa làm tới"

User nhờ rà xem service nào không dùng tới để cleanup. Tôi đo: FE **không có một dòng nào**
gọi WebSocket ⇒ tôi gắn nhãn realtime là **đường cụt** và đưa vào danh sách xoá.

User bác ngay: *"ơ nhưng mà FE đã build done đâu mà kết luận vậy :)))"*.

Dữ kiện tôi đo **không sai** — FE thật sự không có dòng WS nào. Cái sai là cái **nhãn** tôi
gắn lên dữ kiện đó. `plans/phase12-fe.md` có roadmap rõ ràng cho phần realtime; nó là *chưa
tới lượt*, không phải *đã thử và bỏ*.

## Why

- Zero-reference là **bằng chứng vắng mặt**, và nó khớp với **cả hai** giả thuyết: "không ai
  cần" và "chưa ai viết". Nó không phân biệt được hai thứ — cùng đúng một lỗi lập luận đã ghi
  ở [[bang-chung-phan-biet-duoc]].
- Hậu quả hai phía lệch nhau rất xa: gắn nhầm "chưa làm tới" thành "đường cụt" thì đề xuất
  **xoá mất một mảnh kiến trúc đã có kế hoạch**; gắn ngược lại thì chỉ là giữ thêm ít code
  chết một thời gian.
- Repo này là repo để học, mục tiêu user đặt ra là *hoàn thiện nhất có thể* — cắt bớt phạm vi
  bằng lý lẽ "không thấy ai dùng" đi ngược đúng mục tiêu đó
  ([[feedback-khong-khep-viec-khi-con-khe-ho]]).

## How to apply

- Trước khi đề xuất xoá bất kỳ service/module/endpoint nào: đọc `plans/`, roadmap, hoặc
  BRIEF/PRD tương ứng. **Không có kế hoạch nào nhắc tới nó** mới là điều kiện để gọi là thừa.
- Trong báo cáo, tách hẳn hai nhóm: **"đã thử rồi bỏ / thay bằng cái khác"** và **"đúng theo
  kế hoạch nhưng chưa build tới"**. Nhóm thứ hai không bao giờ nằm trong danh sách cleanup —
  nó nằm trong danh sách *còn nợ*.
- Khi chỉ có dữ kiện zero-reference, phát biểu đúng mức: *"hiện không có consumer nào"* —
  không phát biểu *"đường cụt"*, *"không cần"*, *"thừa"*.

## Liên quan

[[bang-chung-phan-biet-duoc]] · [[feedback-khong-khep-viec-khi-con-khe-ho]] ·
[[digest-ticket-mcrsv-2026-08-21]] · [[feedback-follow-conventions]]
