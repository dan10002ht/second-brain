---
type: feedback
scope: agent
title: Agent không được phát tín hiệu "done" — TS là người chốt
summary: Agent mở MR nháp xong thì báo trạng thái đó thôi, không thả ✅ hay viết chữ "done" lên ticket; quyền chốt ticket done thuộc về bên TS, và một tín hiệu done giả làm ticket bị đóng khi chưa ai review.
tags: [feedback, avada, agent, support]
created: 2026-09-23
updated: 2026-09-23
source: Slack — Trần Đức Tùng nhắn trong kênh support 2026-09-23 17:58
---

# Agent không được phát tín hiệu "done" — TS là người chốt

Tùng nhắn trong kênh support:

> "e ơi e bỏ cái tự động ticket done vào thread báo dev của con bot giúp a nhé
> Bên TS sẽ tick done nhé"

Agent support trên VM đang thả ✅ (`white_check_mark`) lên tin ticket khi case xong. Đã đổi
sang 📝 (`memo`) ngày 23/09 — `slack-bridge.js`, hằng `EMOJI.xong`.

**Why:** "agent xong việc" và "ticket xong" là hai chuyện khác nhau. Thứ agent làm xong là
**một MR nháp chưa ai review**; ticket chỉ done khi TS xác nhận khách hết vấn đề. Một dấu ✅
trên ticket bị người và bot đọc như trạng thái thật, nên nó đóng case trước khi có ai nhìn
diff — cùng loại lỗi với [[feedback-chi-tao-mr-user-merge]]: agent lấn sang quyết định cuối
thuộc về người khác.

**How to apply:** báo đúng thứ đã làm ("đã mở MR nháp", "cần người"), không báo trạng thái
của ticket. Không thả ✅, không viết "done"/"đã xong" lên ticket hay thread báo dev. Muốn
người liếc qua kênh là biết thì dùng emoji mô tả *việc agent làm* (📝 = đã có báo cáo + MR),
không dùng emoji mô tả *kết cục của case*.

## Liên quan
- [[feedback-chi-tao-mr-user-merge]] · [[feedback-khong-khep-viec-khi-con-khe-ho]] · [[feedback-bug-la-bug-khong-cho-po-chot]]
