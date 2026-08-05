---
type: note
title: Từ điển thuật ngữ AI engineering (cho team)
summary: Giải nghĩa ngắn các thuật ngữ team sẽ gặp khi dùng Claude Code — token, context window, harness, hook, skill, subagent, gate, worktree, agent team, graph — mỗi từ 2–3 dòng kèm "dùng để làm gì".
tags: [ai, tooling, method, skills]
created: 2026-08-05
---

# Từ điển thuật ngữ

Đọc lướt một lần. Không cần thuộc — quay lại tra khi gặp từ lạ trong 5 file layer.

## Nền tảng

| Từ | Nghĩa | Dùng để làm gì |
|---|---|---|
| **Token** | Đơn vị model đọc/ghi, ~0.75 từ tiếng Anh, tiếng Việt tốn hơn | Đơn vị tính tiền và tính giới hạn |
| **Context window** | Toàn bộ text model nhìn thấy khi trả lời: system prompt + CLAUDE.md + lịch sử chat + file bạn cho đọc + output tool | Cái bạn phải quản lý ở layer 2 |
| **Prompt** | Yêu cầu bạn gõ vào | Layer 1 |
| **System prompt** | Chỉ dẫn nền do harness đặt, bạn không sửa trực tiếp | — |
| **Context rot** / **lost-in-the-middle** | Context càng dài, phần ở giữa càng bị model bỏ sót | Lý do đừng paste cả repo |
| **Compact** | Nén lịch sử chat khi gần đầy context | Xảy ra tự động; sau compact model có thể quên chi tiết |

## Trong Claude Code

| Từ | Nghĩa | Dùng để làm gì |
|---|---|---|
| **CLAUDE.md** | File chỉ dẫn tự nạp vào context mỗi session. Có 3 tầng: global (`~/.claude/`), project (repo), thư mục con | Nơi ghi convention để không phải nhắc lại mỗi lần |
| **Tool** | Hàm model gọi được: Read, Edit, Bash, Grep… | — |
| **MCP** | Chuẩn cắm tool ngoài vào (Jira, Slack, Telegram) | Cho agent đụng được hệ thống ngoài |
| **Hook** | Script chạy **tự động** tại thời điểm cố định (trước/sau khi gọi tool, khi session start) | Ràng buộc **chắc chắn cháy**, không phó mặc model nhớ |
| **Skill** | Bộ chỉ dẫn đóng gói (`SKILL.md`), gọi bằng `/tên`. Model *làm theo*, không phải code chạy | Đóng gói quy trình lặp lại |
| **Slash command** | Cách gọi skill: `/looptasks`, `/brain` | — |
| **Subagent** | Một Claude con được spawn, **có context window riêng**, làm xong trả kết quả về | Cách ly context + chuyên môn hoá |
| **Agent team** | Nhiều session Claude ngang hàng, một lead giám sát, dùng chung task list | Việc chạy dài, teammate chạy tiếp khi lead ngắt |
| **Workflow** | Script JS runtime chạy, gọi `agent()` theo vòng lặp/nhánh | Điều phối nằm trong **code**, rerun y hệt được |
| **Worktree** | Checkout thứ hai của cùng repo ở thư mục khác (`git worktree`) | Nhiều agent sửa code song song mà không đè nhau |

## Về chất lượng

| Từ | Nghĩa | Dùng để làm gì |
|---|---|---|
| **Done-criteria** | Điều kiện "xong" **kiểm được bằng lệnh**: `tsc` exit 0, test pass, build xanh | Không có nó thì agent tự chấm mình |
| **Gate** | Chốt chặn: không qua thì không đi tiếp | Cái làm harness đáng tin |
| **Gate deterministic** | Gate bằng script thường (grep, lint, test), không dùng LLM | Rẻ hơn và **không bịa**. Luôn chạy trước gate LLM |
| **Ground truth** | Sự thật kiểm bằng lệnh, không phải lời agent kể | `grep -c '<svg' file` là ground truth; "tôi đã thêm 12 SVG" thì không |
| **Verifier** | Agent riêng chỉ để chấm, không có quyền Edit/Write | Đứa vừa viết code không được chấm bài của chính nó |
| **Evaluator–Optimizer** | Vòng sinh → chấm → sửa → lặp tới đạt chuẩn | Pattern chuẩn cho "chạy tới khi output OK" |
| **Held-out test** | Test agent không được nhìn thấy lúc viết code | Chống agent viết test vừa khít code sai |

## Graph

| Từ | Nghĩa |
|---|---|
| **Node** | Một đơn vị làm việc — agent chuyên biệt hoặc bước xác định |
| **Edge** | Đường đi giữa node: tuần tự, điều kiện, song song, vòng lặp |
| **Shared state** | Object chảy dọc theo edge. Trong Claude Code: context window, biến trong workflow script, hoặc file trên đĩa (`BRIEF.md`) |
| **Fan-out** | Bung nhiều agent song song cho nhiều item |
| **Orchestrator** | Đứa điều phối, không tự làm việc chân tay |
| **SPOF** | Single point of failure — một agent chết là cả nhánh trống, thường **im lặng** |

## Liên quan

- [[ai-eng-guide]] — quay về mục lục
