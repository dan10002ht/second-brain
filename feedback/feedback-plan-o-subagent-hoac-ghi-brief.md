---
type: feedback
title: Phần plan/tổng hợp phải làm ở subagent — hoặc ít nhất ghi tiến độ vào BRIEF
summary: Giao recon cho agent rồi tự ôm phần tổng hợp vào session chính là làm lệch quy trình; hoặc đẩy tổng hợp sang subagent, hoặc note tiến độ + câu hỏi treo vào BRIEF để theo dõi được và không block luồng.
tags: [feedback, method, skills, avada]
created: 2026-08-06
source: project "pdf" — session history 2026-08-06 (SB-15301)
---

# Plan/tổng hợp làm ở subagent, hoặc ghi vào BRIEF

User nói nguyên văn, hai lượt liên tiếp:

> "ấy mà tôi tưởng plan các thứ thì phải làm ở sub-agent tránh noise cho session chính chứ nhỉ?"
>
> "hoặc là ko làm ở subagent thì cũng cần note lại vào brief để có thể theo giõi, tránh block luồng nhé"

Bối cảnh: đã giao 3 agent recon song song (PRD, mockup, hạ tầng repo) — đúng — rồi **tự ôm
phần tổng hợp + viết spec vào session chính**. Đó là chỗ làm lệch.

**Why:** hai lý do khác nhau, không thay thế nhau được.
- **Noise context.** Recon trả về nhiều, tổng hợp trong session chính là nhồi toàn bộ chi
  tiết thô vào context của luồng điều phối — thứ mà việc tách agent sinh ra chính là để
  tránh. Session chính chỉ nên giữ kết luận.
- **Theo dõi được và không block.** Nếu vẫn làm ở session chính, thì trạng thái công việc
  chỉ tồn tại trong đầu một phiên chat: user không nhìn thấy đang tới đâu, còn treo câu gì,
  và luồng bị chặn ở đó. BRIEF là state trên đĩa — nó sống qua session, qua `/looptasks`,
  qua cron đêm.

**How to apply:**
- Việc sinh ra nhiều output trung gian (recon, tổng hợp, viết spec/plan) → giao subagent,
  session chính chỉ nhận kết luận.
- Nếu có lý do phải làm tại chỗ → **ghi ngay vào BRIEF** một block dưới task: tiến độ hiện
  tại + danh sách câu hỏi treo (đánh số để user reply thẳng vào).
- Áp cho mọi repo có `BRIEF.md` làm task list ([[pdf]], [[subscriptions]]), không riêng
  project nào.

## Liên quan
- [[digest-pdf-2026-08-06]] — session gốc.
- [[2026-08-04-looptasks-verifier-doc-lap]] — cùng nguyên tắc: việc chấm/soát giao agent
  context sạch, không tự ôm.
- [[feedback-follow-conventions]] · [[looptasks-vs-workflow]] · [[graph-engineering]]
