---
type: feedback
title: User dẫn tài liệu → đọc nguyên văn, đừng khẳng định dựa trên bản tóm tắt
summary: Khi user gửi link/đường dẫn một tài liệu, lấy nguyên văn phần liên quan trước khi khẳng định tài liệu nói gì — bản tóm tắt của lần fetch đầu đã lược mất câu quyết định và làm tôi trả lời sai hai lần liên tiếp.
tags: [feedback, skills, method, tooling]
created: 2026-08-09
updated: 2026-08-09
source: project "pdf" — session history
---

User gửi `https://notes.avada.net/THD10GhEhT.md` (skill `looptasks`) và hỏi cơ chế lặp.
Tôi trả lời "skill không tự lặp, phải bọc `/loop`" — dựa trên bản tóm tắt của lần fetch đầu.
User trích lại đúng câu trong tài liệu; tôi vẫn cãi; user trích lần hai. Lấy nguyên văn ra thì
câu đó **có thật** ("Nếu skill được gọi trực tiếp và user muốn loop: tạo cron `*/5 * * * *`")
— bản tóm tắt đã lược mất chính đoạn quyết định.

**Why:** bản tóm tắt fetch tối ưu cho độ dài, không cho câu nào là *ràng buộc*. Khi tranh luận
về việc "tài liệu nói gì", một câu bị lược không phải mất thông tin nền — nó là mất đúng thứ
đang tranh luận. Và user đang cầm bản gốc: cãi lại từ trí nhớ tóm tắt thì hai lượt sau vẫn sai,
chỉ tốn thêm thời gian của user.

**How to apply:** user dẫn tài liệu → fetch/đọc **nguyên văn** phần liên quan trước khi khẳng
định. User trích một câu mà mình không nhớ đã đọc → mặc định là **mình thiếu**, lấy lại nguyên
văn ngay ở lượt đó, không phản bác trước. Cùng nguyên tắc với "đọc thẳng mockup thay vì phán từ
trí nhớ" ở [[digest-moonie-2026-07-25]].

→ [[digest-pdf-2026-08-09]] · [[bang-chung-phan-biet-duoc]] · [[feedback-follow-conventions]]
