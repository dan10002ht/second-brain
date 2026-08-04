---
type: note
title: Workflow hơn/kém looptasks và harness truyền thống ở đâu
summary: looptasks đã là một graph viết bằng văn xuôi với state trên đĩa; workflow thắng ở điều phối version-control được và context không phình, nhưng thua ở state bền, git tập trung và hỏi giữa chừng — nên hybrid, không thay thế. Harness không bị graph thay: nó là cái gate làm graph đáng tin.
tags: [ai, tooling, method, patterns, skills]
created: 2026-08-04
source: đọc chéo skill looptasks + docs Claude Code workflows + digest aws/moonie
---

# Workflow vs looptasks vs harness

## looptasks ĐÃ là một graph rồi

Chỉ là graph viết bằng văn xuôi thay vì code. Ánh xạ thẳng:

| Graph | looptasks |
|---|---|
| Node | subagent Sonnet mỗi task; agent `Explore` recon; main agent làm orchestrator + verifier |
| Edge | recon → ma trận va chạm → chia song song/tuần tự → spawn → verify → đóng task |
| Shared state | **`BRIEF.md` trên đĩa** — checkbox `[ ]` / `[⏳ HH:MM]` / `[✅ ngày]` |

Điểm đáng chú ý: shared state của looptasks **nằm ngoài mọi context window và ngoài repo code**.
Đây là thứ workflow *không* có.

## Workflow hơn ở đâu

1. **Điều phối trở thành artifact.** Script version-control được, diff được, rerun y hệt.
   looptasks là prose → mỗi iteration Claude diễn giải lại; hành vi trôi theo model và theo lượt.
2. **Context không phình.** Kết quả trung gian nằm ở biến script. Ở looptasks, main agent phải ôm
   mọi report + output verify của mọi task → phiên càng dài càng loãng.
3. **Quy mô.** 16 agent đồng thời, 1000 agent/run, so với vài task một lượt.
4. **Quality pattern code hoá được**: adversarial verify (N skeptic cố bác bỏ, majority mới sống),
   judge panel, loop-until-dry (dừng khi 2 vòng liền không ra gì mới). Ở prose thì chỉ là lời khuyên
   — model có thể bỏ qua; ở script thì nó *bắt buộc* chạy.
5. **Resume trong session** — dừng giữa chừng không mất hết.

## Workflow thua ở đâu (đúng những chỗ looptasks cần)

1. **State chết theo session.** Thoát Claude Code là workflow chạy lại từ đầu. `BRIEF.md` sống mãi,
   sync đa máy, chạy được qua cron 5 phút suốt nhiều ngày. Đây là khác biệt *kiến trúc*, không vá được.
2. **Không có input giữa chừng.** looptasks có nhánh blocker → trả `[⏳]` về `[ ]`, hỏi user.
   Workflow chỉ hỏi được sau khi kết thúc; muốn có chốt giữa chừng thì phải cắt thành nhiều workflow.
3. **Script không đụng filesystem/git.** Toàn bộ kỷ luật git của looptasks (fetch, base
   `origin/master`, một task một nhánh, worktree, commit) do **main agent** làm tập trung, và skill
   *cấm* subagent chạy git — chính rào đó xoá nguyên lớp rủi ro agent này `checkout` phá việc agent kia.
   Đưa vào workflow thì git phải rơi xuống agent → mất đúng cái rào đó.
4. **Replay rule tàn nhẫn.** Dừng giữa fan-out: mọi agent *start sau* agent chưa xong đều chạy lại,
   kể cả agent đã xong. Nhiều agent nhỏ giữ được nhiều tiến độ hơn một agent dài.
5. **~15× token**, và Anthropic nói thẳng multi-agent fit **kém** với coding task.

## Kết luận: hybrid, không thay thế

Đúng shape là **looptasks giữ vai orchestrator dài hạn** (state bền trên đĩa, cron, hỏi được user),
và **gọi workflow cho từng task đủ nặng** — audit toàn repo, migration nhiều file, quét hết chỗ
tương tự khi sửa lỗi. Workflow làm cái nó giỏi: fan-out lớn, một lần, trong một session.

Chỗ *thật sự* đáng nâng cấp trong looptasks không phải "viết lại thành script", mà là hai **edge yếu**:

- **Bước 2 (ma trận va chạm)** — model phán "task này độc lập". Sai là hai agent đè nhau.
  Worktree đã đỡ được hậu quả, nhưng edge vẫn là phỏng đoán.
- **Bước 5 (verify)** — phụ thuộc main agent nhớ mà chạy. Đây là chỗ **hook** làm được: edge xác định,
  luôn cháy, không phó mặc model.

## Harness KHÔNG bị graph thay thế

Harness kiểu Mooni/AWS (generator → evaluator độc lập → held-out test mù → screenshot loop) tự nó
đã là graph 3 node. Khác biệt thật không nằm ở số node, mà ở **loại gate**:

> Graph engineering nói về *edge nào chạy tiếp*. Harness nói về *cái gì được phép đi qua*.

Bài học đã trả giá, ghi sẵn trong brain — và graph không xoá được cái nào:

- *"Chạy gate deterministic TRƯỚC evaluator LLM"* ([[digest-aws-2026-07-24]]) — rẻ hơn và không bịa.
- *"Không tin report của agent, dùng ground truth"* ([[digest-aws-2026-07-27]]) — agent chết âm thầm
  vẫn làm gate PASS.
- *"Giá trị harness = gate mỗi task, chứ không phải mốc phase"* ([[digest-moonie-2026-07-24]]).
- *"Verify ở render path THẬT, không chỉ tool cô lập"* ([[digest-aws-2026-07-24]]).

Graph không có gate = trả 15× token để nhận kết quả sai một cách rất tự tin, ở quy mô lớn hơn.
Đó là lý do thứ tự đúng là: **harness trước, loop, rồi mới graph** — đúng thứ tự 5 lớp.

## Liên quan

- [[graph-engineering]] — khái niệm, 5 lớp, 4 primitive của Claude Code.
