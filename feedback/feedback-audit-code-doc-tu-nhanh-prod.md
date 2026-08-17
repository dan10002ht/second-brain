---
type: feedback
title: Audit/điều tra code phải đọc từ nhánh đang chạy prod
summary: Kết luận về "code hiện đang thế nào" chỉ có giá trị nếu đọc từ `origin/master` — worktree đang mở thường là nhánh feature đã lệch hàng trăm commit và sẽ báo bug đã fix là còn nguyên.
tags: [feedback, debug, method, avada]
created: 2026-08-17
updated: 2026-08-17
source: project "subscriptions" session history
---

# Audit/điều tra code phải đọc từ nhánh đang chạy prod

User bắt được lỗ hổng này giữa một bản audit đã giao: *"nãy giờ bạn check là check ở
data thật hay là check code nhỉ? tại code thì tôi đang ở nhánh `feat/portal-preview`
mà nhánh này đang out date so với master do 2 branch làm khác nhau?"*

**Why:** đo ra `feat/portal-preview` **198 commit sau master**. 11/14 file trích dẫn
trùng khớp, nhưng **3 file lệch — và đúng 3 file load-bearing nhất**: fix
index-misalignment đã **có trên master (prod đang chạy)** mà **không có** trên nhánh
đang đọc. Nếu không hỏi, bản audit sẽ báo với merchant là một bug đã sửa vẫn còn nguyên.
Số đo từ dữ liệu prod thì không dính — chỉ phần "code hiện thế nào" mới sai. Đây là
biến thể của [[bang-chung-phan-biet-duoc]]: đọc đúng file nhưng sai **phiên bản** thì
bằng chứng không phân biệt được gì cả.

**How to apply:**
1. Trước khi kết luận bất cứ điều gì về code đang chạy, chạy
   `git rev-list --left-right --count origin/master...HEAD` và ghi con số vào report.
2. Trong prompt giao cho subagent audit: bắt đọc `git show origin/master:<path>` thay vì
   file trong worktree, hoặc tạo hẳn worktree mới từ `origin/master` cho việc audit
   (nhớ nạp `.env.local` — worktree mới thiếu file này làm gate đỏ giả, xem
   [[digest-subscriptions-2026-08-06]]).
3. Tách rõ trong report hai loại kết luận: **từ dữ liệu prod** (không phụ thuộc nhánh)
   và **từ code** (phụ thuộc nhánh) — đừng gộp một bảng.
4. Trước khi ship kết luận, `git diff` từng file được trích dẫn giữa nhánh đọc và
   `origin/master`; file nào lệch thì đọc lại trên master.

Bổ sung cho [[feedback-debug-phai-query-data-that]] (code chỉ dựng được giả thuyết) —
cặp đôi: đọc **đúng phiên bản** code để dựng giả thuyết, rồi query prod để chốt.
Liên quan: [[feedback-git-branch-discipline]] · [[digest-subscriptions-2026-08-11]]
