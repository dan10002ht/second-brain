---
type: feedback
title: Claude điều phối và verify, Codex implement
summary: Khi lane codex hỏng thì sửa nguyên nhân rồi giao lại đúng vai, không tự chuyển sang subagent Claude viết code — mất luôn lớp chấm chéo giữa hai họ model.
tags: [feedback, agent, automation, skills, method]
created: 2026-09-04
updated: 2026-09-04
source: project `ticket-mcrsv` — session history 2026-09-04 (mock gateway, codex nuốt prompt 2 lần)
---

# Claude điều phối và verify, Codex implement

Nguyên văn user: *"à, cần ghi nhớ là claude làm orchestration, codex dùng làm implementor nhé"*.

Bối cảnh: codex nuốt prompt hai lần liên tiếp (modal update `0.153.2` bật lên nuốt paste), tôi
kết luận "không retry mù nữa" rồi **chuyển sang fallback subagent Claude để tự viết code**. Đó là
chỗ bị chỉnh.

**Why:** giá trị của quy trình `looptasksv2` / `lt-orca` nằm ở **chấm chéo giữa hai họ model** —
codex viết, Claude chấm. Nếu Claude vừa viết vừa chấm thì verifier không còn là bên độc lập, nó
chỉ đang đọc lại việc của chính mình; mọi verdict PASS sau đó là tự chấm chứ không phải bằng chứng
(xem [[bang-chung-phan-biet-duoc]]). Cộng thêm: quota Claude tuần đã từng chết giữa phiên và làm
treo cả loạt task chưa verify được.

**How to apply:**
- Lane codex không nhận việc ⇒ **chẩn đoán rồi sửa nguyên nhân** (modal update, TUI chưa khởi động
  xong, message nhiều dòng bị nuốt), không đổi vai. Đọc terminal trước khi retry.
- Nếu buộc phải fallback subagent Claude để không đứng hình, thì **dừng nó ngay khi codex nhận
  việc** — không để hai bên cùng làm một task.
- Việc main agent tự làm (sửa gate, sửa task list, restart service mà lane bị sandbox chặn) vẫn
  phải qua verifier độc lập như mọi task khác.

Liên quan: [[feedback-nhat-du-lane-song-song]] · [[gui-viec-cho-lane-khong-co-ack]] ·
[[2026-08-04-looptasks-verifier-doc-lap]] · [[cham-viec-agent-nen]]
