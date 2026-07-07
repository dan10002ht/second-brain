---
type: project
title: AWS Learner — nền tảng học AWS & chứng chỉ
summary: Nền tảng tự học AWS & luyện chứng chỉ (Next.js + LocalStack).
tags: [aws, learning, cloud, certification, nextjs, localstack]
created: 2026-07-06
updated: 2026-07-06
status: active
repo: ~/projects/aws
---

# AWS Learner

## Mục đích
Bộ tài liệu + nền tảng tự học AWS từ 0 lên chứng chỉ **CLF-C02** (Cloud Practitioner)
và **SAA-C03** (Solutions Architect Associate), kèm labs hands-on và web app ôn thi.
Thiết kế cho cả trường hợp không có tài khoản AWS (dùng LocalStack / simulator thay thế).

## Tech stack
- **Nội dung**: Markdown — `roadmap/`, `lessons/` (bài học nhiều chủ đề), `practice/` (đề thi CLF-C02 & SAA-C03).
- **Labs**: 10 labs hands-on (`labs/lab01-s3-basics` … `lab10-step-functions`), chạy qua AWS CLI + LocalStack, có Terraform.
- **Web app** (`web/`): Next.js 14 + React 18 + TypeScript + Tailwind, dùng `react-markdown`, `minisearch` (full-text search), `cmdk`. Là app ôn thi/đọc bài với filter tabs & stats.

## Trạng thái
Active. Git log gần đây tập trung dịch toàn bộ UI + 771 câu hỏi đề thi sang tiếng Anh,
thêm inline SVG minh hoạ cho lessons (19/19 khoá), và exam filter tabs.

## Điểm đáng nhớ
- Hai lộ trình chính chi tiết trong `roadmap/clf-c02.md` và `roadmap/saa-c03.md`; có cả `aws-vs-gcp.md`.
- Ưu tiên hands-on không tốn phí: LocalStack + AWS CLI (mỗi lab có thư mục `localstack/`, `aws-cli/`).
- Repo cấu hình dùng **Serena** (code intelligence, `.serena/`) auto-activate mỗi session — xem `CLAUDE.local.md`.

## Liên quan
- [[localstack]]
- [[nextjs]]
