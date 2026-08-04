---
type: decision
title: looptasks tách verify sang subagent verifier độc lập
summary: Main agent không còn tự chấm code do chính nó spawn ra — Bước 5 giao cho subagent `verifier` context sạch, không Edit/Write, trả PASS/FAIL/UNVERIFIED kèm bằng chứng; đổi lại tốn thêm một agent mỗi task và một vòng brief.
tags: [tooling, skills, method, ai, avada]
created: 2026-08-04
updated: 2026-08-04
status: active
review: 2026-11-04
---

# Bước 5 của `/looptasks` giao cho agent `verifier` độc lập, main agent không tự verify nữa

**Bối cảnh:** `/looptasks` chạy nền qua `/loop 5m`, mỗi task một subagent Sonnet viết code rồi
main agent verify và commit. Vấn đề: **main agent chính là đứa vừa spawn ra code đó** — nó có
context của toàn bộ quá trình, đã "hiểu" ý đồ, nên chấm bài của mình. Bốn họ lỗi lặp đi lặp lại
trong digest 3 tuần gần nhất đều là lỗi *verification/coverage*, không phải lỗi điều phối:
sửa 1/6 chỗ giống nhau, lấy sai nguồn sự thật, tin report của agent, gate false-positive khi agent
chết âm thầm. Bối cảnh trực tiếp: research về [[graph-engineering]] cho thấy chỗ yếu nhất của
looptasks không phải quy mô mà là hai edge — ma trận va chạm và verify.

**Quyết định:** dựng subagent `~/.claude/agents/verifier.md` (user-level, dùng ở mọi repo) và
sửa `/looptasks` Bước 5 giao việc chấm cho nó.

- `tools: Read, Grep, Glob, Bash` — **không có Edit/Write**, git chỉ đọc. Nó không sửa được cái nó chấm.
- Verdict ba trạng thái: `PASS` / `FAIL` / `UNVERIFIED`. **`UNVERIFIED` không bao giờ được đôn lên `PASS`.**
- `FAIL` → giao lại **đúng một vòng** cho subagent sửa (brief = finding nguyên văn), rồi verify lại;
  vòng hai vẫn đỏ → blocker, trả `[⏳]` về `[ ]`.
- Brief **không được dán report của agent viết code**; cần đưa thì gắn nhãn "tuyên bố cần kiểm chứng".
- Ngoài gate, verifier bắt buộc chạy 2 bước riêng cho họ lỗi của mình: **quét chỗ tương tự còn sót**
  (grep theo công dụng, không theo tên biến) và **xác minh nguồn sự thật** thực sự chứa field đang đọc.

**Why:** một node không được nhìn thấy cái nó đang chấm. Đây chính là nguyên lý đã chứng minh
hiệu quả ở harness Mooni (generator → evaluator **độc lập** → held-out mù) — evaluator mà thấy
context của generator thì nó không còn độc lập nữa. Main agent tự verify vi phạm đúng nguyên lý đó.
Tách context là cách duy nhất làm nó thành gate thật chứ không phải nghi thức.

**Tradeoff / đánh đổi:**

- **Mất:** thêm một agent mỗi task → token tăng, mỗi iteration chậm hơn. Phải soạn brief đúng
  (đường dẫn tuyệt đối + dặn `cd <path> && <lệnh>` vì `cd` không persist giữa các Bash call) —
  brief sai là verifier chấm nhầm repo chính thay vì worktree. Verifier sẽ **FAIL nhiều hơn**
  main agent từng FAIL, nên `BRIEF.md` sẽ có nhiều task quay về `[ ]` hơn trước; đó là dấu hiệu
  đúng, không phải hỏng.
- **Được:** verdict dựa trên exit code + output trích nguyên văn, không dựa trên trí nhớ của đứa
  vừa viết code. `UNVERIFIED` tách khỏi `FAIL` nên gate không chạy được không còn âm thầm thành pass.
- **Trần cho vòng lặp:** cho reviewer thẩm quyền bật ngược lại (edge quay ngược) nhưng chặn ở
  **một vòng** — loop 5 phút chạy nền không được phép quay vô hạn đốt token.

**Phương án khác đã cân nhắc:**

- **Viết lại `/looptasks` thành dynamic workflow** — loại. Workflow thắng ở điều phối rerun được
  và context không phình, nhưng **state chết theo session** (thoát Claude Code là chạy lại từ đầu)
  trong khi `BRIEF.md` sống mãi và chạy được qua cron nhiều ngày; **không có input giữa chừng** nên
  mất nhánh hỏi user khi blocker; **script không đụng git** nên kỷ luật git tập trung của main agent
  phải rơi xuống agent, mất đúng cái rào cấm subagent chạy git. Chi tiết: [[looptasks-vs-workflow]].
- **Hook chạy gate ở `SubagentStop`** — chưa loại hẳn, nhưng để sau. Hook ép được *lệnh nào phải chạy*,
  không đánh giá được *coverage* và *nguồn sự thật* — hai bước đắt giá nhất của verifier. Có thể bổ sung
  sau như lớp bảo hiểm dưới cùng.
- **Giữ nguyên, chỉ dặn main agent kỹ hơn** — loại. Đã dặn "Không tin report — tự verify" từ đầu mà
  vẫn lọt. Chỉ dẫn trong prose là lời khuyên model có thể lướt qua; tách context là ràng buộc kiến trúc.

## Liên quan
- [[graph-engineering]] — node/edge/shared-state; lý do gọi verify là một "edge yếu".
- [[looptasks-vs-workflow]] — vì sao không chuyển hẳn sang workflow.
- [[digest-aws-2026-07-27]] — "không tin report của agent, dùng ground truth"; agent chết âm thầm làm pass gate.
- [[digest-aws-2026-07-24]] — chạy gate deterministic TRƯỚC evaluator LLM; verify ở render path thật.
- [[digest-moonie-2026-07-24]] — giá trị harness = gate mỗi task, không phải mốc phase.
