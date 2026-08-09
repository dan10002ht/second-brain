---
type: note
title: PDF Invoice — digest 2026-08-09 (looptasks tự lặp, merge dở dang, kết luận sai của agent điều tra)
summary: `/looptasks` CÓ cơ chế tự lặp bằng cron của chính skill (không cần `/loop` bọc ngoài); merge dở dang trong working copy chặn commit và `git add` của agent làm bẩn index của merge đó; agent điều tra kết luận sai một ca vì đọc lướt `Number(x || 0)`.
tags: [pdf, invoice, avada, skills, tooling, debug]
created: 2026-08-09
updated: 2026-08-09
source: project "pdf" — session history (BRIEF task 10–16)
---

CHỈ phần chưa có trong [[digest-pdf-2026-08-07]] và [[shipped-pdf-2026-08-08]].

## Bugs

**Agent điều tra (task 14) kết luận sai một ca vì đọc lướt biểu thức.**
Agent báo `resendDays` rỗng sẽ thành `NaN`. Thực tế code là `Number(config.resendDays || 0)`
— dấu `||` nằm **bên trong** `Number()`, tức fallback áp lên *chuỗi* trước khi đổi kiểu, nên
kết quả là `0` chứ không phải `NaN`. Bản chất lỗi đổi hẳn. Kết quả của một task điều tra
(không có commit, không qua verifier) chỉ có gate là mình đọc lại — kiểm biểu thức trước khi
chép kết luận vào `BRIEF.md`, vì task sau sẽ tin nó là sự thật. Xem [[bang-chung-phan-biet-duoc]].

## Techniques

**`/looptasks` có hai cách lặp, và cách mặc định không phải `/loop`.**
Skill tự tạo cron `*/5 * * * *` (CronCreate) khi được gọi trực tiếp và user muốn lặp;
`/loop 5m /looptasks <brief>` là cách bọc bên ngoài. Gọi `/looptasks` trần → chạy **một
lượt** rồi dừng. Trong phiên này tôi khẳng định hai lần là skill không tự lặp — sai, vì tin
bản tóm tắt WebFetch của tài liệu thay vì đọc nguyên văn (→ [[feedback-doc-nguyen-van-tai-lieu]]).
Skill đã được sửa lại cho khỏi mơ hồ (232 → 341 dòng).

**Kiểm trạng thái repo trước khi `git add` trong phiên tự động.**
Working copy đang ở giữa một merge dở dang do user để lại. Hệ quả: (1) git từ chối commit lẻ
— blocker *không* nằm ở verifier như tưởng ban đầu; (2) `git add` của tôi đẩy file test vào
**index của merge đó**, làm bẩn thứ user đang dựng dở. Phải `git restore --staged` gỡ ra rồi
đóng merge của user (giữ nguyên message git đã dựng) mới commit tiếp được.

## Context

- App **đã có sẵn** `@ckeditor/ckeditor5-build-classic` + component dùng chung `CkeditorInput`;
  `helpers/ckeditor.js` là bundle CKEditor **custom 53k dòng** (định nghĩa global `ClassicEditor`).
  Recon trước khi giao task gỡ được điểm bất định đã tự ghi vào brief hôm trước.
- Repo đã có **tiền lệ tách component** (`pages/DevZone/` 13 file, subcomponent nằm cạnh page)
  — agent refactor không cần tự chế pattern, cứ theo đó. Hợp với [[feedback-follow-conventions]].
- SMTP: khách **không bắt buộc** nhập SMTP. `getSmtpConfig` chỉ dùng SMTP của merchant nếu có,
  còn lại rơi về `getDefaultSmtp`; bật đường Chatty cho một shop bằng cờ `useChattySmtp` trên
  doc shop (trước đó là `undefined`). Bổ sung cho [[digest-pdf-2026-07-31]].

→ [[2026-08-09-hoan-backfill-co-don-cu-pdf]] · [[pdf]] · [[2026-08-07-phan-tang-verifier]] · [[koa-yup-validator-yup029]]
