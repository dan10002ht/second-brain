---
type: feedback
title: Tên nhánh — không mã ticket, tối đa 3 từ sau dấu `/`
summary: Đặt tên nhánh `feature/payment-reminder`, không nhét `SB-xxxx` và không quá 3 từ sau dấu `/`.
tags: [feedback, avada, skills]
created: 2026-08-07
updated: 2026-08-07
source: project "pdf" — session history
---

Tên nhánh **không mang mã ticket** (`SB-15301`, `JSUB-...`) và **không quá 3 từ sau dấu `/`**.

❌ `feature/SB-15301-payment-reminder-send-test`
✅ `feature/payment-reminder`

Áp cho mọi project, mọi nhánh về sau.

**Why:** mã ticket đã nằm trong commit message (`type - role - scope`) và trong MR, nhắc lại
ở tên nhánh chỉ làm dòng `git branch` dài ra mà không thêm thông tin. Tên dài cũng khiến
một feature bị xé thành nhiều nhánh gần-giống-nhau, khó đọc khi liệt kê.

**How to apply:** đặt tên trước khi tạo nhánh, không đợi đổi sau. Nếu đã trót đặt dài mà
**chưa push**, `git branch -m` là an toàn — commit hash không đổi; nhớ cập nhật lại tên
nhánh ở `BRIEF.md` và các ghi chú đang trỏ tới nó. Đã push rồi thì để nguyên, đừng đổi.
Một feature nhiều phần thì gộp về **một nhánh** bằng cherry-pick tuyến tính thay vì giữ
mỗi phần một nhánh.

→ [[feedback-commit-style]] · [[feedback-git-branch-discipline]] · [[digest-pdf-2026-08-07]]
