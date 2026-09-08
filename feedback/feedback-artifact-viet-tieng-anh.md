---
type: feedback
title: Artifact viết tiếng Anh, trả lời user bằng tiếng Việt
summary: Commit message, tiêu đề/mô tả MR và comment trong code phải viết bằng tiếng Anh; chỉ phần đối thoại với dantt mới dùng tiếng Việt — ranh giới là "thứ nằm lại trong repo" chứ không phải "thứ khách nhìn thấy".
tags: [feedback, method, writing]
created: 2026-09-08
updated: 2026-09-08
source: project `subscriptions` (worktree `feat/tielenergy-custom`) — session history
---

Sau khi tạo MR !2544 với commit message và title bằng tiếng Việt, user sửa:

> "nội dung các thứ phải viết bằng tiếng anh nhé, reply tôi thì tiếng việt á ?"

Phải amend commit + đổi title MR + force push. Trong một phiên khác cùng ngày cũng phải sửa comment
vừa viết sang tiếng Anh trước khi commit.

**Why:** repo Avada là nơi làm việc chung của nhiều người và tồn tại lâu hơn cuộc trò chuyện — commit,
MR, comment là **artifact**, không phải tin nhắn. Đây rộng hơn quy tắc đã ghi ở
[[subscription-work-style]] ("text hướng tới khách phải tiếng Anh"): ranh giới không phải *khách có
nhìn thấy không*, mà là **thứ đó có nằm lại trong repo/GitLab không**. Sửa sau tốn thêm một vòng
amend + force push, và với MR đã có reviewer thì nó là nhiễu cho người khác.

**How to apply:** mặc định viết tiếng Anh cho commit message (giữ format `type - role - scope`),
title + description MR, comment và docblock trong code, tên biến/hằng. Dùng tiếng Việt cho: trả lời
dantt trong chat, `BRIEF.md`/brief giao cho agent, và note trong brain. Khi soạn commit hay MR thì
kiểm ngôn ngữ **trước** khi commit, đừng để phải amend.

Liên quan: [[feedback-commit-style]] · [[subscription-work-style]] ·
[[feedback-comment-chi-khi-code-roi]] · [[digest-subscriptions-tielenergy-2026-09-08]]
