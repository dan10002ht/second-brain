# my-brain — Schema & Operating Manual (Layer 3)

Bạn (Claude / LLM agent) là **người bảo trì wiki này**. Con người capture thô;
bạn làm phần bookkeeping: phân loại, liên kết, giữ nhất quán, cập nhật index.
Mô hình: "compile once, keep current" (Karpathy LLM-wiki) — KHÔNG re-derive mỗi lần hỏi.

## 3 Layers (không được phá vỡ)

1. **`sources/` — IMMUTABLE.** Nguồn thô (PDF, transcript, bài lưu). KHÔNG BAO GIỜ sửa file ở đây. Chỉ đọc + trích dẫn.
2. **Wiki (mọi thư mục khác) — bạn SỞ HỮU.** Tự do tạo/sửa/link/gộp note. Đây là nơi kiến thức "chín".
3. **`CLAUDE.md` + `index.md` — điều hướng.** Đọc `index.md` ĐẦU TIÊN để biết brain có gì, rồi mới drill vào file cụ thể.

## Cấu trúc (PARA + Zettelkasten hybrid)

| Thư mục | Ý nghĩa (PARA) | Khi nào dùng |
|---------|----------------|--------------|
| `00-inbox/` | Capture | Note thô chưa phân loại. Bạn xử lý → chuyển đi. |
| `10-daily/` | — | Nhật ký ngày `YYYY-MM-DD.md` (ephemeral). Nguyên liệu cho review. Skill `/today`. |
| `10-projects/` | **P**rojects | Có mục tiêu + deadline. Xong → `40-archive/`. |
| `20-areas/` | **A**reas | Trách nhiệm duy trì lâu dài (health, career, finance). Không có "xong". |
| `30-resources/` | **R**esources | Chủ đề quan tâm, tài liệu học. `learns/` sống ở đây. |
| `40-archive/` | **A**rchive | Đã xong / không active. |
| `notes/` | Zettelkasten | Note atomic (1 ý / 1 file), liên kết bằng `[[...]]`. Tầng insight. |
| `70-decisions/` | — | Nhật ký quyết định. Mỗi file BẮT BUỘC có **Why** + **Tradeoff**. Skill `/decision`. |
| `feedback/` | — | Feedback nhận được. Kèm **Why** + **How to apply**. |
| `sources/` | Layer 1 | Nguồn thô immutable. |

## Quy tắc bảo trì

1. **Xử lý inbox:** với mỗi file trong `00-inbox/`, quyết định type → thêm frontmatter → move vào layer đúng → gợi ý `[[links]]` tới note liên quan → cập nhật `index.md`.
2. **Atomic:** mỗi note trong `notes/` chỉ 1 ý. Note dài → tách nhỏ + link.
3. **Link liberally:** dùng `[[slug]]` (không đuôi .md). Link tới note chưa tồn tại cũng OK — nó đánh dấu việc cần viết sau.
4. **Provenance:** kiến thức tổng hợp phải trỏ nguồn qua field `source:` để tránh bịa đặt bị đóng băng thành "sự thật". Nếu không chắc → ghi "chưa xác minh".
5. **Tránh folder lồng sâu** (cái bẫy của dev). Ưu tiên note phẳng + link hơn là nested folders.
6. **Đừng over-engineer frontmatter.** Giữ nhẹ (xem schema dưới). Không thêm field nếu không dùng.
7. **Cập nhật `index.md`** mỗi khi thêm/di chuyển note đáng kể — đây là bản đồ, phải luôn đúng.
8. **Mỗi note PHẢI có `summary:`** (1 câu TLDR trong frontmatter). LLM đọc summary để quyết định có mở full note không — rẻ vài giây, tiết kiệm việc đọc file không liên quan. Dòng trong `index.md` nên khớp với `summary:` của note (nguồn để auto-generate index sau này). Daily notes ephemeral — không bắt buộc summary.
9. **Tag phải nằm trong `tags.md`** (taxonomy). Cần tag mới → khai báo ở `tags.md` TRƯỚC rồi mới dùng. Chống tag sprawl.
10. **Chạy `bin/brain-lint` trước khi commit** — báo link hỏng, note thiếu summary, note orphan, tag ngoài taxonomy. Sạch rồi mới commit.

## Frontmatter schema (giữ nhẹ)

```yaml
---
type: project | area | resource | note | feedback | source | daily | decision
title: <ngắn gọn>
summary: <1 câu TLDR — LLM đọc dòng này để quyết định có mở full note không>
tags: [tag1, tag2]
created: YYYY-MM-DD
updated: YYYY-MM-DD
source: [[slug-nguon]]   # optional — chỉ khi là kiến thức tổng hợp
status: active | done    # optional — cho projects
---
```

## Khi nào thêm RAG / vector DB

Chưa cần. Dưới ~100 nguồn: `index.md` + đọc trực tiếp + ripgrep là đủ và tốt hơn.
Graph tự sinh từ `[[wiki-links]]` — không cần graph DB. Chỉ thêm `sqlite-vec`
khi corpus vượt ~100 nguồn / hàng trăm trang và search bắt đầu chậm.
