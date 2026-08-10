---
type: feedback
title: Guard git chỉ chặn master/main — nhánh feature thì cứ push
summary: Hook chặn `git push` của repo được nới lại: chỉ chặn khi đích là `master`/`main`, còn push nhánh feature thì agent làm thẳng, không phải nhờ người dán lệnh.
tags: [feedback, avada, tooling]
created: 2026-08-10
updated: 2026-08-10
source: project "subscriptions" — session history 2026-08-10
---

Nguyên văn: *"đừng chặn push nhé, chỉ chặn push vào master hoặc main thôi nhé!"* — sau một phiên
mà mọi `git push` (kể cả nhánh feature) đều bị hook `.claude/hooks/guard-git.sh` chặn và phải
nhờ người chạy tay.

**Why:** Ranh giới thật cần bảo vệ là **master/main**, không phải "mọi thao tác ghi lên remote".
Chặn tất thì mỗi task xong lại kẹt một lượt chờ người dán lệnh — nhiều ma sát mà không thêm an
toàn, vì nhánh feature luôn còn MR làm gate. Đây là bản nới của
[[feedback-git-branch-discipline]], không phải bản thay: **vẫn không push thẳng master/main, vẫn
hỏi trước khi commit ở repo project.**

**How to apply:**
- Push nhánh feature: làm thẳng, không hỏi lại, không nhờ người chạy hộ.
- Push vào `master`/`main`: hook chặn — không lách, đưa lệnh cho người quyết.
- Khi sửa hook: nó **được commit trong repo**, sửa là cả team dính. Viết ca test ra **file** rồi
  chạy (chuỗi test chứa `--force` + `master` gõ thẳng vào shell sẽ bị chính guard khác bắt), và
  kiểm cả ca `cd <worktree> && git push -u origin ...` — ca hay dùng nhất và cũng là ca từng lọt
  vì `sed` bắt cả khoảng trắng cuối đường dẫn rồi rơi vào nhánh fail-closed.
- Phân biệt với tầng permission của Claude Code (`~/.claude/settings.local.json`): tầng đó là
  riêng máy mình, và **agent không tự nới quyền cho chính nó** — chỉ soạn sẵn để người dán.

→ [[feedback-git-branch-discipline]] · [[migrate-repo-gitlab-on-prem]] · [[subscriptions]]
