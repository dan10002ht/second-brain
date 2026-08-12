---
type: feedback
title: Loop rỗng liên tiếp ~15 lần thì tự dừng cron, đừng chờ user
summary: Khi `/loop` hoặc `/looptasks` báo "không thay đổi" khoảng 15 lượt liên tiếp thì tự huỷ cron và tổng kết, thay vì tiếp tục fire vô hạn chờ user quay lại.
tags: [feedback, skills, tooling, method, ai]
created: 2026-08-12
updated: 2026-08-12
source: project "ticket-mcrsv" — session history 2026-08-11/12
---

# Loop rỗng liên tiếp thì tự dừng

Nguyên văn của dantt:

> "hiện tại tiến độ ra sao rồi? với cả loop mà rỗng quá lâu ví dụ **15 lần liên tiếp** check thì
> **ngừng cron** chứ"

Bối cảnh: cron `/looptasks` 5 phút/lần đã báo **~170 iteration rỗng liên tiếp** (≈14 tiếng, từ
19:00 hôm trước sang hôm sau) vì mọi task còn lại đều chờ quyết định của user hoặc chờ RAM/công cụ.
Loop vẫn fire đều và mỗi lượt trả đúng một dòng "Không thay đổi — iteration rỗng thứ N".

**Why:** một loop không nhặt được việc **không tự khỏi** — nguyên nhân (chờ user quyết, thiếu tài
nguyên, task phụ thuộc tuyến tính) chỉ đổi khi có người can thiệp. Fire tiếp chỉ đốt token và context
mà không đổi trạng thái, và nó **che mất tín hiệu**: 170 dòng "không thay đổi" khiến việc *thật sự
đang bị chặn* trông giống việc *vẫn đang chạy*. Với `/loop` dynamic thì mỗi wakeup rỗng còn tính là
một noop-streak — đó chính là con số phải đọc để biết khi nào dừng.

**How to apply:**
- Đếm số iteration rỗng liên tiếp. Tới **~15 lượt** thì **tự huỷ cron** (`CronDelete` với job ID,
  hoặc `ScheduleWakeup({stop: true})` với loop dynamic) — không hỏi lại.
- Khi dừng, ghi một tổng kết: đã xong gì, còn gì, **chặn bởi cái gì và cần ai làm gì** — đó là thứ
  user cần khi quay lại, không phải con số iteration.
- Trước khi dừng, kiểm xem có task nào **không phụ thuộc** để chạy tiếp không (đúng uỷ quyền đã
  nhận); chỉ dừng khi đã chắc là không nhặt được gì.
- Trạng thái chặn phải nằm trong file (`BRIEF.md`), không nằm trong context — loop chạy nền thì
  context bị tóm tắt.

→ [[digest-ticket-mcrsv-2026-08-12]] · [[looptasks-vs-workflow]] ·
[[feedback-plan-o-subagent-hoac-ghi-brief]] · [[2026-08-04-looptasks-verifier-doc-lap]]
