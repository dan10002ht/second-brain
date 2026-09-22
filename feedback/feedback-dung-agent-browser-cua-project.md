---
type: feedback
title: Kiểm trình duyệt thì dùng skill `agent-browser` của project, không đòi Chrome extension
summary: Đừng bao giờ đề nghị bật Claude-in-Chrome extension khi repo đã có skill `agent-browser` — tìm trong `.claude/skills/` chứ không chỉ `.claude/agents/`.
tags: [feedback, tooling, method, avada]
created: 2026-09-22
updated: 2026-09-22
source: project `subscriptions` — session history (hai lần trong cùng một tuần: "hả? có mà cha ???? skill agent-browser ko thấy à cha ????" và "sao cứ dùng extension vậy, note kĩ cho t là t ko muốn dùng extensions, cứ dùng agent-browser có sẵn trong project đi")
---

# Kiểm trình duyệt: dùng `agent-browser` của project

Câu nguyên văn, lần thứ hai:

> *"sao cứ dùng extension vậy, note kĩ cho t là t ko muốn dùng extensions, cứ dùng agent-browser
> có sẵn trong project đi"*

Lần thứ nhất, khi tôi khẳng định repo không có agent nào tên đó:

> *"hả? có mà cha ???? skill agent-browser ko thấy à cha ????"*

**Why:** Claude-in-Chrome extension là thứ phải cài và phải *đang kết nối*; mỗi lần nó không kết
nối là một vòng hỏi-đáp chết, và dantt không dùng nó. `agent-browser` là CLI sống trong repo, chạy
được ngay, hỗ trợ `--session`, `eval --stdin`, `screenshot`, và truyền được flag thẳng cho Chrome
qua `--args` — tức là làm được những việc extension không làm được. Lần đầu tôi kết luận "không có
agent nào tên `agent-browser`" vì chỉ tìm trong `.claude/agents/`, trong khi nó nằm ở
`.claude/skills/agent-browser/` — nhầm chỗ tìm chứ không phải thiếu công cụ.

**How to apply:** khi cần nhìn trang thật (verify UI, đo layout, bắt request), gọi skill
`agent-browser` ngay. Trước khi kết luận "repo không có công cụ X", quét **cả** `.claude/skills/`,
`.claude/agents/` và `bin/` — ba chỗ, không phải một. Không bao giờ đề nghị bật extension như
phương án chính; nếu `agent-browser` không làm được việc thì nói rõ nó chặn ở đâu chứ đừng đổi sang
extension.

## Liên quan

[[subscriptions]] · [[feedback-follow-conventions]] · [[feedback-ra-het-duong-verify]] ·
[[digest-subscriptions-2026-09-22]] · [[cors-error-co-the-la-private-network-access]]
