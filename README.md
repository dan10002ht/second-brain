# my-brain 🧠

Personal knowledge "brain" — plain markdown, LLM-maintained.
Nền tảng: **plain markdown + frontmatter + `[[wiki-links]]`**, tổ chức theo
**PARA + Zettelkasten hybrid**, bảo trì bởi một **LLM agent** (mô hình LLM-wiki của Karpathy:
"compile once, keep current" thay vì RAG re-derive mỗi lần hỏi).

## Bắt đầu

```bash
# capture nhanh vào inbox (thêm bin/ vào PATH cho tiện)
export PATH="$HOME/projects/my-brain/bin:$PATH"
capture "ý tưởng nhanh"
echo "note từ pipe" | capture
capture                      # mở editor

# git để version control (khuyến nghị)
cd ~/projects/my-brain && git init && git add -A && git commit -m "init brain"
```

## Cách LLM dùng brain này

1. Đọc `index.md` trước để biết brain có gì.
2. Đọc `CLAUDE.md` để biết quy ước + cách bảo trì.
3. Xử lý `00-inbox/`: phân loại → thêm frontmatter → move vào layer đúng →
   gợi ý `[[links]]` → cập nhật `index.md`.

Ví dụ prompt cho Claude Code (chạy trong thư mục này):
> "Xử lý toàn bộ 00-inbox: phân loại, thêm frontmatter, di chuyển vào layer đúng,
> gợi ý wiki-links, và cập nhật index.md."

## Cấu trúc

```
00-inbox/      capture thô, chưa phân loại
10-projects/   việc có mục tiêu + deadline (PARA-P)
20-areas/      trách nhiệm duy trì lâu dài (PARA-A)
30-resources/  chủ đề & học tập — learns/{rust,typescript,python} (PARA-R)
40-archive/    đã xong / không active (PARA-A)
notes/         Zettelkasten atomic notes, liên kết [[...]]
feedback/      feedback nhận được (Why + How to apply)
sources/       nguồn thô IMMUTABLE (layer 1)
bin/capture    script capture vào inbox
CLAUDE.md      schema + operating manual (layer 3)
index.md       bản đồ toàn brain (LLM đọc đầu tiên)
```

## Khi nào nâng cấp

- **>100 nguồn / search chậm:** thêm semantic search bằng `sqlite-vec` (embeddings local).
- Trước ngưỡng đó: `index.md` + đọc trực tiếp + `ripgrep` là đủ. Đừng over-engineer.
- Graph tự sinh từ `[[wiki-links]]` — không cần graph DB.
