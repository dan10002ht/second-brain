---
type: note
title: Digest Mooni — chốt hạ npm ci, Colima bất ổn, giới hạn của skill security-review (2026-07-27)
summary: Lock sinh trên darwin không bao giờ đủ cho linux (Tailwind v4 oxide native) nên bỏ hẳn npm ci; Colima I/O bất ổn giết container pull; skill security-review chỉ soi git diff nên bỏ sót file untracked.
tags: [tooling, patterns, debug, backend]
created: 2026-07-27
source: project "moonie" — session history
---

> CHỈ phần mới so với [[digest-moonie-2026-07-18]], [[digest-moonie-2026-07-24]], [[digest-moonie-2026-07-25]].

## Decisions

- **Bỏ `npm ci`, dùng `npm install --no-audit --no-fund`** ở cả CI lẫn `web/Dockerfile`, kèm comment giải thích gốc rễ. Đây là chốt hạ sau nhiều vòng cố regen lock trong container linux. **Why**: lock sinh trên darwin thiếu biến thể native/wasm linux của Tailwind v4 oxide (`@tailwindcss/oxide-wasm`, `@emnapi/*`, `@napi-rs/wasm-runtime`) — deps optional theo platform nên `npm ci` linux luôn fail. **Tradeoff**: mất tính tất định tuyệt đối của `ci`, đổi lấy CI xanh; lock vẫn commit nên `install` vẫn tôn trọng phần lớn.

## Bugs / gotchas

- **Colima mất ổn định I/O giữa session**: `colima status = running` nhưng docker daemon không phản hồi, container pull bị kill liên tục. `colima restart` phục hồi (giữ volume). Hệ quả thực tế: **đừng phụ thuộc vào container linux để regen lock** khi Colima đang chậm — chọn đường khác.
- **`timeout` không có sẵn trên macOS** → lệnh held-out `exit=127` là lỗi của lệnh chạy, không phải test hỏng.
- **Phát hiện production bằng so sánh `==` nghiêm ngặt** → `APP_ENV="Production"` âm thầm tắt seed-guard. Fix: case-fold khi so sánh env.
- **Skill `security-review` dựa trên `git diff origin/HEAD`** → không bắt được thay đổi ở dạng untracked/unstaged, báo "không có gì để review". Cách xử: chỉ định thẳng danh sách file cho subagent review.

## Techniques

- **Backup/restore round-trip test thật** trước khi tin runbook prod: seed sentinel → backup → xoá bớt (8→6 sản phẩm) → restore → xác nhận sentinel quay lại.
- Hai gate độc lập cho mỗi task UI (**held-out qa-evaluator + design-evaluator**) tiếp tục chứng minh giá trị; generator "rút kinh nghiệm" các task trước thì task sau qua thẳng gate không cần vòng sửa.

## Liên quan

[[digest-moonie-2026-07-24]] · [[digest-moonie-2026-07-25]] · [[digest-moonie-2026-07-18]] · [[dev-skills]]
