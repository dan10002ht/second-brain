---
type: feedback
title: Commit style — `type - role - scope` ở repo Avada, mô tả trần ở my-brain
summary: Repo Avada dùng message `type - role - scope` và batch commit; my-brain dùng message mô tả. Cả hai đều KHÔNG kèm trailer `Co-Authored-By` / `Claude-Session`.
tags: [feedback, avada, skills, brain]
created: 2026-08-04
updated: 2026-08-04
source: [[subscription-work-style]]
---

# Commit style

- **Repo Avada**: message dạng `type - role - scope` (gạch ngang, không phải colon) —
  ví dụ `perf - fe - reduce CLS on boot screen, home cards, crisp widget and list tables`
  (tag `v2.34.46`, xem [[shipped-subscriptions-2026-08-04]]).
  **Batch commit**: làm xong một thể rồi commit, không commit từng thay đổi vụn.
- **my-brain**: message mô tả bình thường, không cần prefix.
- **Cả hai: KHÔNG thêm trailer** `Co-Authored-By` hay `Claude-Session`.

**Why:** message là thứ người khác đọc trong `git log`/MR để hiểu một thay đổi mà không
phải mở diff — sai format thì mất tác dụng đó. Trailer tự động thì user đã nói rõ là không
muốn: nó làm nhiễu log và không mang thông tin gì về nội dung thay đổi.

**How to apply:** trước khi viết message — xác định đang ở repo nào. Repo Avada thì soi
`git log --oneline -10` để lấy đúng `type`/`role` đang dùng trong repo đó rồi bắt chước.
Không bao giờ append trailer.

## Liên quan
- [[feedback-git-branch-discipline]] · [[subscription-work-style]] · [[feedback-follow-conventions]]
