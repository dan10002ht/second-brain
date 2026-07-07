---
type: decision
title: Trộm daily/decisions/skills từ avader-folder, bỏ agent-board & role system
tags: [pkm, brain, tooling]
created: 2026-07-07
updated: 2026-07-07
status: active
review: 2026-10-07
---

# Chỉ mượn layer nhẹ (daily + decisions + skills) từ template avader-folder, không bê phần nặng vào my-brain

**Bối cảnh:** So sánh [[build-my-brain]] (PKM cá nhân, plain markdown + Zettelkasten, LLM-maintained) với template team `avader-folder` của Avada (onboarding + role overlay + Agent Board + 19 skill + installer). Cần chốt: nâng my-brain bằng cách lấy gì từ template kia.

**Quyết định:** Chỉ port 3 thứ nhẹ, hợp triết lý plain-markdown:
1. `10-daily/` — daily notes (nhịp làm việc, nguyên liệu roll-up).
2. `70-decisions/` — decision log, ENFORCE Why + Tradeoff.
3. Skill `/today` + `/decision` (project-scoped `.claude/skills/`).

KHÔNG bê: Agent Board (runner/ui/telegram), role system (15 role), one-liner installer, migrate mode, ABOUT-AVADA/ABOUT-ME.

**Why:** my-brain là brain **cá nhân 1 người**, mạnh ở chín kiến thức (atomic notes + link graph + provenance). Ba thứ mượn bổ đúng chỗ yếu: brain đang là kho tĩnh, thiếu nhịp (daily) và thiếu chỗ giữ lý do quyết định (decisions). Chúng nhẹ, plain-markdown, không phá 3-layer hiện có.

**Tradeoff / đánh đổi:**
- Được: nhịp làm việc (daily→review sau này), decision log chống quên "tại sao", 2 skill tiện — chi phí gần như 0, không thêm dependency.
- Mất/bỏ qua: Agent Board (async AI kanban) rất hay nhưng cần Bun + launchd + service, quá nặng cho 1 người; role system & installer chỉ có nghĩa khi triển khai cho cả công ty.
- Rủi ro: thêm folder = thêm chỗ phải bảo trì; nếu không thực sự viết daily/decision thì chúng thành folder rỗng. Review lại sau 3 tháng xem có dùng thật không.

**Phương án khác đã cân nhắc:**
- Bê nguyên avader-folder — loại vì over-engineer cho cá nhân, phá triết lý plain-markdown + Zettelkasten.
- Không lấy gì, giữ my-brain nguyên trạng — loại vì brain thiếu nhịp + thiếu decision log là điểm yếu thật.
- Chỉ lấy Agent Board — loại vì nặng nhất, giá trị thấp nhất với 1 user không chạy task async theo lịch.

## Liên quan
- [[build-my-brain]]
- [[2026-07-07]]
