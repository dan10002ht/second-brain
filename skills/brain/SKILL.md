---
name: brain
description: Tra cứu second brain (~/projects/my-brain) từ BẤT KỲ project nào — digest/gotcha đã gặp của từng app Avada, decisions kèm Why+Tradeoff, feedback, note học tập. Dùng khi cần biết "vấn đề này đã gặp chưa", "trước đây quyết định thế nào", "app X có gotcha gì", trước khi debug hoặc trước khi quyết định lại điều gì đó. Cũng dùng khi user muốn ghi một learning mới về brain.
---

# brain — tra cứu second brain từ mọi project

Wiki nằm ở `~/projects/my-brain`. Skill này để **đọc nó từ repo khác**, nơi wiki không
tự vào context. Luôn dùng **đường dẫn tuyệt đối** — cwd đang là project khác.

```
BRAIN=~/projects/my-brain
```

## Vì sao đáng tra

Brain giữ thứ repo không giữ được: digest theo ngày của từng app (root cause thật + gotcha),
`70-decisions/` (quyết định + Why + Tradeoff), `feedback/`, note học tập. Nhiều bug ở
Avada đã gặp và đã ghi — tra 20 giây rẻ hơn debug lại 2 tiếng.

## Bước 1 — Đọc bản đồ trước

```bash
sed -n '1,60p' ~/projects/my-brain/index.md
```

`index.md` liệt kê mọi note kèm 1 câu summary. Rất thường chỉ cần đọc summary là biết
nên mở file nào. **Đừng grep mù khi chưa xem bản đồ.**

## Bước 2 — Tìm

Đường chính (luôn chạy được):

```bash
rg -i "<từ khoá>" ~/projects/my-brain --glob '!.git' -l          # liệt kê file
rg -i -C3 "<từ khoá>" ~/projects/my-brain --glob '!.git'         # kèm ngữ cảnh
```

Mẹo thu hẹp theo app — note digest đặt tên theo pattern `digest-<app>-<ngày>` và
`shipped-<app>-<ngày>`. **Lưu ý:** note subscriptions cũ còn tồn tại lối đặt tên
ngược (`subscription-digest-<ngày>`, `subscription-shipped-<ngày>`), nên đừng lọc
theo một pattern duy nhất — lọc theo tên app:

```bash
ls ~/projects/my-brain/notes/ | rg -i "<tên app>"
```

Semantic search (chỉ khi đã build index — kiểm tra `~/projects/my-brain/.index/brain.db` có tồn tại):

```bash
~/projects/my-brain/bin/brain-search "câu hỏi tự nhiên" -k 8
```

Nếu `.index/` chưa có thì **bỏ qua, dùng ripgrep** — đừng cố build index giữa lúc đang
làm việc khác (cần Ollama hoặc sentence-transformers, mất thời gian).

## Bước 3 — Đọc và báo cáo

Mở file tìm được, đọc, rồi trả lời **kèm nguồn** dạng đường dẫn để user mở được:
`~/projects/my-brain/notes/<slug>.md`.

Hai điều bắt buộc khi báo cáo:

- Note ghi ngày nào → **nói ra**. Kiến thức có thể đã cũ so với code hiện tại.
- Note nào đánh dấu **"chưa xác minh"** → giữ nguyên cảnh báo đó, đừng trình bày như sự thật.

Không tìm thấy gì thì nói thẳng "brain chưa ghi gì về việc này" — **đừng bịa** và
đừng suy từ tên file ra nội dung.

## Bước 4 — Ghi lại lượt tra (BẮT BUỘC, cả khi trúng lẫn khi trượt)

```bash
# tìm được: liệt kê đúng những file đã dùng để trả lời
~/projects/my-brain/bin/brain-ask-log --q "<câu user hỏi>" \
  --files notes/a.md,notes/b.md

# không tìm được:
~/projects/my-brain/bin/brain-ask-log --q "<câu user hỏi>" --miss
```

Đây không phải telemetry cho vui. Brain có 4 job tự động ghi VÀO nhưng không đo
được gì ở chiều ĐỌC, nên nó chỉ lớn lên chứ không khôn lên. Log này đóng vòng:

- `brain-weekly` đọc các lượt **MISS** → đề xuất chính xác cần viết note gì.
- `brain-graph`/`brain-compact` đọc file đã mở → biết note nào lạnh **thật**
  (không ai link *và* không ai tra), thay vì lạnh giả vì chưa kịp wire link.

Lượt **MISS** giá trị hơn lượt trúng — đó là chỗ brain đang thủng. Đừng bỏ ghi
vì ngại "làm bẩn log". Lệnh này không bao giờ làm hỏng lượt tra: mọi lỗi ghi đều
bị nuốt và exit 0.

## Ghi ngược về brain (chỉ khi user yêu cầu)

Phát hiện điều đáng giữ lâu dài (root cause khó, gotcha sẽ tái phát, quyết định có tradeoff)?
**Gợi ý** cho user, đừng tự ghi. Khi user đồng ý: tạo file trong
`~/projects/my-brain/00-inbox/` — đây là vùng capture, `brain-learn` sẽ promote sau,
human vẫn ở giữa vòng lặp.

```markdown
---
type: note
title: <ngắn gọn>
summary: <1 câu TLDR>
tags: [<phải có sẵn trong ~/projects/my-brain/tags.md>]
created: <YYYY-MM-DD>
---

<nội dung — 1 ý. Trỏ nguồn nếu là kiến thức tổng hợp.>
```

**Không** commit hộ, **không** sửa file ngoài `00-inbox/`, **không** đụng `sources/`
(immutable). Muốn sửa wiki thật thì mở session ở my-brain và theo `CLAUDE.md` của nó.
