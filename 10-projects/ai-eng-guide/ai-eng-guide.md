---
type: project
title: AI Engineering Guide — 5 layer cho team Avada
summary: Bộ guide nội bộ 5 layer (Prompt → Context → Harness → Loop → Graph) cho team dev Avada dùng Claude Code, mỗi layer có best practice, cạm bẫy đã trả giá và checklist.
tags: [ai, tooling, method, skills, avada, project]
created: 2026-08-05
updated: 2026-08-05
status: active
---

# AI Engineering Guide — 5 layer

Guide nội bộ cho team dev Avada dùng Claude Code. Mục tiêu: cả team hiểu mình **đang
làm việc ở layer nào**, và cái gì cần chuẩn bị trước khi leo lên layer trên.

## 5 layer

| Era | Layer | Bạn engineer cái gì | Vai của bạn |
|---|---|---|---|
| 2023–24 | **Prompt** | Yêu cầu bạn gửi đi | Operator |
| 2024 | **Context** | Cái model được nhìn thấy | Editor |
| 2025 | **Harness** | Tool, memory, scaffolding quanh nó | Toolmaker |
| Đầu 2026 | **Loop** | Chu kỳ một agent lặp tới khi xong | System designer |
| Giữa 2026 | **Graph** | Điều phối giữa nhiều agent/bước | Org designer |

Layer là **cộng dồn, không thay thế**. Layer 5 không xoá layer 1 — prompt tệ ở trong
một graph 20 agent chỉ có nghĩa là bạn trả 15× token để nhận kết quả sai nhanh hơn.

> Quy tắc số một: **đừng leo layer khi layer dưới chưa chắc.**
> Graph không có gate (layer 3) = sai ở quy mô lớn, rất tự tin.

## Đọc thế nào

| Bạn là ai | Đọc gì |
|---|---|
| Mới dùng Claude Code | [[ai-eng-thuat-ngu]] → phần **Cơ bản** của layer 1–3. Dừng ở đó, dùng 2 tuần. |
| Đã dùng hằng ngày để code | Lướt Cơ bản 1–2, đọc kỹ [[ai-eng-03-harness]] |
| Tester / QA | **[[ai-eng-cho-tester]]** trước (cấu hình + sample, không cần nền tảng gì), rồi mới tới các layer |
| Muốn tự động hoá việc lặp lại | [[ai-eng-04-loop]] |
| Đang cân nhắc multi-agent | [[ai-eng-05-graph]] — đọc mục chi phí trước khi đọc mục kỹ thuật |

Mỗi file layer có cùng khung: *Layer này là gì* → *Khi nào bạn đang ở đây* → *Use case*
→ *Cơ bản* → *Nâng cao* → *Setup* → *Cạm bẫy* → *Checklist*. Mục **Use case** trả lời
"việc của tôi có hợp cái này không" — đọc trước khi đọc cách làm.
Người mới đọc tới hết Cơ bản là đủ dùng;
mục **Setup** là artifact copy-paste được (`CLAUDE.md`, `verifier.md`, hook, `BRIEF.md`,
workflow script) — mở khi bắt tay làm. Riêng [[ai-eng-02-context]] có thêm hai mục về
monitor: bật `ctx %` lên statusline, và lúc nào thì `/clear` / `/compact` / mở session mới.

## Tra nhanh — có tình huống rồi thì nhảy thẳng vào đây

| Tình huống | Dùng gì | Đọc |
|---|---|---|
| Nó làm sai thứ tôi muốn | sửa cách giao việc | [[ai-eng-01-prompt]] |
| Nó sửa đúng logic nhưng sai file | chỉ đường + `CLAUDE.md` | [[ai-eng-02-context]] |
| Phiên dài rồi nó quên ràng buộc | monitor `ctx %`, clear đúng lúc | [[ai-eng-02-context]] |
| Nó báo "xong, test pass" mà CI đỏ | subagent `verifier` | [[ai-eng-03-harness]] |
| Cùng một lỗi tái phát nhiều repo | gate script + brain | [[ai-eng-03-harness]] |
| Làm lần thứ ba một quy trình 6 bước | skill | [[ai-eng-03-harness]] |
| Đống task nhỏ tồn đọng không ai làm | `/looptasks` + `BRIEF.md` | [[ai-eng-04-loop]] |
| Output chưa đạt chuẩn, phải sửa nhiều vòng | evaluator–optimizer | [[ai-eng-04-loop]] |
| Việc dài hơn một phiên, mở máy phải kể lại từ đầu | state trên đĩa | [[ai-eng-04-loop]] |
| Sửa bug, cần quét hết chỗ tương tự | fan-out theo thư mục | [[ai-eng-05-graph]] |
| Audit toàn repo trước release | fan-out theo dimension | [[ai-eng-05-graph]] |
| Phát hiện nghe hợp lý nhưng chưa chắc đúng | adversarial verify (3 skeptic) | [[ai-eng-05-graph]] |
| Migration lớn, không biết trước có bao nhiêu chỗ | orchestrator–workers | [[ai-eng-05-graph]] |

## Mục lục

- [[ai-eng-thuat-ngu]] — từ điển thuật ngữ, đọc trước nếu chưa quen
- [[ai-eng-01-prompt]] — yêu cầu bạn gửi đi
- [[ai-eng-02-context]] — quản lý context window
- [[ai-eng-03-harness]] — tool, gate, memory, second brain
- [[ai-eng-04-loop]] — `/loop`, `/looptasks`, `BRIEF.md`
- [[ai-eng-05-graph]] — subagent, agent team, workflow
- [[ai-eng-cho-tester]] — cấu hình + sample nhỏ từng phần, lộ trình 3 tuần

## Nguồn

Ví dụ trong guide lấy từ code và session thật của team, không bịa:
Joy Subscription, pdf, crm, aws study-app, moonie. Bài học "cạm bẫy" đều là lỗi
đã trả giá, có ghi trong brain — mỗi cái trỏ về digest gốc.

## Liên quan

- [[graph-engineering]] · [[looptasks-vs-workflow]] — hai note nền của layer 4–5
- [[dev-skills]] · [[shopify-app-dev]]
