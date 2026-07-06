---
type: project
title: Dựng "my-brain" — wiki tri thức cá nhân
tags: [pkm, project, meta]
created: 2026-07-06
updated: 2026-07-06
status: active
---

# Dựng "my-brain" — wiki tri thức cá nhân

**Mục tiêu:** Có một brain markdown chạy được, đúng convention (PARA +
Zettelkasten), với đủ note mẫu cho từng `type` để làm chỗ dựa học tập.

**Deadline:** 2026-07-31

## Ghi chú

- Kiến trúc theo 3 layer: `sources/` immutable → wiki (sở hữu) → `index.md`
  điều hướng. Chi tiết trong CLAUDE.md.
- Đã seed các note kỹ thuật đầu tiên (Rust / TS / Python) + MOC + feedback.
- Nguyên tắc chủ đạo: [[atomic-notes-principle]] — atomic + link, tránh folder
  lồng sâu.
- Chưa cần vector DB / RAG cho tới khi vượt ~100 nguồn.

## Việc còn lại

- [ ] Capture ghi chú thô vào `00-inbox/` rồi phân loại.
- [ ] Bổ sung note cho các chủ đề đang học.
- [ ] Duy trì `index.md` luôn khớp thực tế.

## Liên quan
- [[moc-learning-pkm]]
- [[dev-skills]]
- [[write-shorter-notes]]
