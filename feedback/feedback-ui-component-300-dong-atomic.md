---
type: feedback
title: Component UI lý tưởng ~300 dòng, tổ chức theo atomic design
summary: Hai luật user đặt cho code frontend — một component nên quanh 300 dòng và cây thư mục đi theo atomic design (atoms/molecules/organisms) — và chúng chỉ có hiệu lực khi được biến thành số đo trong gate, không phải một dòng dặn trong prompt.
tags: [react, patterns, architecture, feedback, method]
created: 2026-08-27
updated: 2026-08-27
source: project `ticket-mcrsv` — session history 2026-08-27
---

# Component UI lý tưởng ~300 dòng, tổ chức theo atomic design

User đặt hai luật khi bắt đầu đợt frontend:

1. **Một component lý tưởng quanh ~300 dòng.**
2. **Tổ chức theo atomic design** — `atoms/` · `molecules/` · `organisms/`.

**Why:** đây là câu trả lời cụ thể cho lời phàn nàn "UI AI viết rất khó chịu". File 640–709 dòng
(4 file trong `org-events/`) không có ranh giới nào để một người — hay một agent lượt sau — biết
phần nào chịu trách nhiệm gì; sửa một chỗ là đọc cả file. Atomic design cho cây thư mục một quy
tắc trả lời được câu "cái này đặt ở đâu" mà không cần hỏi. Cả hai luật đều nhắm vào cùng một thứ:
làm cho *ranh giới* tồn tại, chứ không phải làm cho code ngắn.

**How to apply:**

- Khi nhận việc frontend, **đo trước rồi mới hứa**: đếm file vượt ngưỡng, đếm màu hardcode, đếm
  giá trị tuỳ tiện. Nói luật suông mà không có số thì không ai kiểm được nó đã được tuân thủ chưa.
- Biến ngưỡng 300 dòng thành **một dòng trong gate CI** (`long_files`), rồi siết baseline mỗi lần
  đóng task — không để nó là một câu trong brief.
- ~300 là *lý tưởng*, không phải hàng rào cứng: tách vì có ranh giới thật (controller ↔ view ↔
  state), không tách để lách con số. Task nặng nhất đợt này đi từ 709 dòng → controller 223 dòng +
  8 file, **0 dependency mới**.
- Khi hai khái niệm khác nhau nằm chung thư mục thì **đặt tên phân biệt được** trước khi tách
  (`booking-flow/` và `my-tickets/` thay vì một `booking/` gộp).
- Task đổi *luật* (gate, cấu trúc thư mục) không chạy song song với task viết code chịu luật đó —
  xem [[gate-hop-nhat-truoc-khi-merge]].

Liên quan: [[2026-08-27-he-thi-giac-chong-ai-slop]] · [[feedback-follow-conventions]] ·
[[feedback-comment-chi-khi-code-roi]] · [[atomic-notes-principle]] ·
[[digest-ticket-mcrsv-2026-08-27]]
