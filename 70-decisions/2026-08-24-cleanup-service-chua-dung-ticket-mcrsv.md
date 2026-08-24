---
type: decision
title: ticket-mcrsv — chia code "chưa ai dùng" làm 3 nhóm giữ / hẹn hạn / xoá, thay vì cleanup theo "không có reference"
summary: Xoá `analytics-service`, `support-service`, `rate-limiter` và `boilerplate-service` (mỗi cái chỉ có README, không có code), giữ nguyên thứ đã nối đủ dây mà chưa ai bấm nút, và đặt hạn chót trong ROADMAP cho thứ nằm trong plan nhưng chưa tới lượt.
tags: [architecture, system-design, backend, project]
created: 2026-08-24
updated: 2026-08-24
review: 2026-11-24
source: project "ticket-mcrsv" — session history 2026-08-24
---

# Cleanup code "chưa ai dùng" ở ticket-mcrsv — chia 3 nhóm, không chia 2

User hỏi: *"xem có service nào không dùng tới hoặc không cần thiết phải implement thì cleanup đi được không?"*

Kết luận đầu tiên của tôi — gắn nhãn "đường cụt" cho realtime-service vì FE có **0** dòng WebSocket — bị user
bác ngay: *"ơ nhưng mà FE đã build done đâu mà kết luận vậy"*. `plans/phase12-fe.md` có roadmap rõ:
**Phase 14: Real-time Notifications (WebSocket)**. Xem [[feedback-khong-dung-vs-chua-lam-toi]].

## Chốt

| Nhóm | Dấu hiệu đo được | Xử lý |
|---|---|---|
| **A — dây đã nối đủ, chưa ai bấm nút** | có code, có route/handler, có test, chỉ thiếu người gọi | **Giữ**, mở task trong `BRIEF.md` |
| **B — nằm trong plan, chưa tới lượt** | không có reference **nhưng** có mặt trong roadmap/plan có số phase | **Giữ + đặt hạn chót trong ROADMAP** |
| **C — vỏ rỗng** | đúng 1 file README, không có một dòng code nào | **Xoá** |

Đã xoá theo nhóm C: `analytics-service/`, `support-service/`, `rate-limiter/` (commit `27c8885`) và
`boilerplate-service` (`30ad4f3`). Kèm theo là viết lại `README.md` — nó hoá ra là design doc **từ trước khi
implement**, mọi service đều ghi `🟡 Planning`, kể cả cái vừa smoke test thật sáng đó.

## Why

- Dữ kiện "không có reference nào" **không phân biệt được** đường cụt với chưa-tới-lượt. Hai thứ đó đòi hai
  hành động ngược nhau, nên nhập chúng vào một nhóm là bảo đảm sẽ xoá nhầm ít nhất một cái.
- Thứ duy nhất phân biệt được là **plan/roadmap**, không phải codebase. Phải đọc nó trước khi kết luận.
- Nhóm C thì an toàn thật: một thư mục chỉ có README không thể đang phục vụ ai, và git giữ lại được.
- Nhóm B mà chỉ "giữ im lặng" thì sau 3 tháng lại thành nhóm C giả — nên phải có hạn chót ghi ở nơi có người đọc.

## Tradeoff

- **Chậm hơn.** Phải đọc 61 file doc + plan trước khi được xoá 3 thư mục. Cleanup "grep xem có ai gọi không rồi
  xoá" nhanh hơn nhiều lần.
- **Nhóm B là nợ có ghi sổ, vẫn là nợ.** Repo giữ lại code không ai chạy, CI vẫn build nó, người mới vẫn phải hỏi
  "cái này để làm gì". Hạn chót trong ROADMAP chỉ có giá trị nếu tới hạn thật sự có người xem lại — nếu không,
  nó y hệt việc không quyết định gì.
- **Ranh giới A/B mờ khi plan do chính mình viết.** User đã nói rõ: *"ở đây là plans tôi viết nên có thể nó cũng
  chưa chuẩn"* — nghĩa là roadmap đang vừa là bằng chứng vừa là thứ cần được thách thức.

Liên quan: [[2026-08-22-cau-truc-doc-theo-vong-doi]] · [[digest-ticket-mcrsv-2026-08-24]] ·
[[feedback-khong-khep-viec-khi-con-khe-ho]]
