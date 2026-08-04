---
type: note
title: Graph engineering — lớp thứ 5, và nó là gì trong Claude Code
summary: Graph = nhiều loop nối lại bằng node/edge/shared-state; tên mới (7/2026) cho thực hành cũ của LangGraph. Trong Claude Code, graph đúng nghĩa nhất là dynamic workflow — nơi kế hoạch nằm trong script chứ không trong context window.
tags: [ai, tooling, method, patterns, skills]
created: 2026-08-04
source: aibuilderclub "Graph Engineering Guide 2026" + docs Claude Code + Anthropic multi-agent research post
---

# Graph engineering

## 5 lớp AI engineering (từ trong ra ngoài)

`Prompt` → `Context` → `Harness` (tools, memory, scaffolding) → `Loop` (1 agent lặp) → **`Graph`**

Định nghĩa gốc: *"thực hành thiết kế đồ thị mà các agent chạy trong đó — node chuyên biệt nào
tồn tại, edge nào định tuyến công việc, và shared state nào chảy dọc theo edge."*

Graph là **lớp trên loop**: một loop là một agent lặp một chu kỳ; graph là khi nhiều loop nối lại.

| Thành phần | Là gì | Hiện thân trong Claude Code |
|---|---|---|
| **Node** | đơn vị làm việc (agent chuyên biệt / bước xác định) | subagent `.claude/agents/*.md` |
| **Edge** | định tuyến: tuần tự, điều kiện, song song, vòng lặp | orchestrator tự chọn; **hook** khi cần edge chắc chắn cháy |
| **Shared state** | object chảy giữa node, phình dần | context window, hoặc **biến trong workflow script** |

## Tên mới, không phải công nghệ mới

Thuật ngữ kết tinh trên X **giữa 7/2026** (từ câu hỏi của Peter Steinberger: *"chúng ta vẫn nói
về loops hay đã chuyển sang graphs?"*). LangGraph, Microsoft AutoGen GraphFlow, Google ADK đã
hỗ trợ đúng những quyết định thiết kế này từ trước. Đây là **cái tên chung cho một thực hành đã có**.

Điều đó có ý nghĩa thực tế: đừng đợi tool mới. Cái cần học là *quyết định thiết kế*, không phải API.

## 4 primitive của Claude Code — khác nhau ở AI GIỮ KẾ HOẠCH

| | Subagents | Skills | Agent teams | Workflows |
|---|---|---|---|---|
| Là gì | worker Claude spawn | chỉ dẫn Claude làm theo | lead giám sát session ngang hàng | **script runtime chạy** |
| Ai quyết định bước tiếp | Claude, từng lượt | Claude | lead agent | **script** |
| Kết quả trung gian ở | context window | context window | task list chung | **biến script** |
| Cái lặp lại được | định nghĩa worker | chỉ dẫn | định nghĩa team | **chính phần điều phối** |
| Quy mô | vài task/lượt | như subagent | vài peer chạy dài | **hàng chục–hàng trăm agent** |
| Bị ngắt thì | restart lượt | restart lượt | teammate chạy tiếp | **resume được trong cùng session** |

→ **Graph đúng nghĩa nhất trong Claude Code = dynamic workflow.** Vì nó là primitive duy nhất
chuyển kế hoạch từ context window vào **code**: có loop, branch, state thật, rerun được y hệt,
và context của Claude chỉ giữ kết quả cuối.

## Cái giá (số thật từ Anthropic)

Multi-agent research system (Opus lead + Sonnet workers): **+90.2%** so với single-agent trên eval
nội bộ. Nhưng agent dùng **~4×** token so với chat, multi-agent **~15×**; riêng token usage
giải thích **80% variance** của hiệu năng.

Anthropic nói thẳng fit **kém** với: coding task, và việc cần phối hợp real-time chặt.
Fit tốt: research song song nhiều hướng, thông tin vượt 1 context window, nhiều tool tích hợp.

Giảm giá: model mạnh làm orchestrator, model rẻ làm worker → 5–10× rẻ hơn mà chất lượng gần như
không đổi **trên task đã scope kỹ**.

## Checklist trước khi dựng graph

1. **Cố giữ nó là loop trước.** Một agent + verifier rõ ràng làm nổi thì đừng chia.
2. Chỉ đặt tên node nếu đó là **chuyên môn thật**, không phải chia cho đẹp.
3. **Vẽ edge trước khi viết code.**
4. Thiết kế rõ object shared state.
5. Cho reviewer node **thẩm quyền thật** (được quyền bật ngược lại).
6. Cách ly lỗi giữa các node.
7. Đặt trần chi phí + ràng buộc cứng.

Giới hạn runtime workflow của Claude Code: tối đa **16 agent đồng thời**, **1000 agent/run**,
không có input giữa chừng, script không đụng filesystem (agent mới đụng).

## Liên quan

- [[looptasks-vs-workflow]] — so sánh cụ thể với harness đang dùng.
- [[digest-aws-2026-07-24]] — build-content-loop + evaluator-optimizer, gate deterministic trước LLM, gotcha viết Workflow script.
- [[digest-aws-2026-07-27]] — workflow `thorough` thay `/loop` để chống làm qua loa; kỷ luật không tin report của agent.
- [[digest-moonie-2026-07-24]] — *"giá trị harness = gate mỗi task, không phải mốc phase"*.
