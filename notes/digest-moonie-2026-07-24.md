---
type: note
title: Mooni digest 2026-07-24 — QA skill tái dùng, gate độc lập, Colima/CI
summary: Skill QA tái dùng (config ở root, docs derived + REQ trace), giá trị harness = gate mỗi task chứ không phải mốc phase, fix chính xác Colima testcontainers + golangci CI.
tags: [method, backend, tooling, debug, postgresql]
created: 2026-07-24
source: project "moonie" (Mooni) session history
---

# Mooni digest 2026-07-24 — chỉ phần MỚI

Bổ sung cho [[digest-moonie-2026-07-17]] · [[digest-moonie-2026-07-18]] ·
[[digest-moonie-2026-07-20]] · [[digest-moonie-2026-07-22]]. Chỉ ghi cái chưa có.

## Feedback (cách làm việc)
- **Giá trị của harness nằm ở gate CHẤT LƯỢNG mỗi task, KHÔNG phải ở ranh giới phase.**
  User đẩy lại 2 lần khi assistant dừng-chờ-duyệt mỗi giai đoạn. Mặc định đúng: chạy
  **liên tục đầu-cuối** (generate → gate → fix → lặp tới khi output OK); điểm dừng thật chỉ là
  thứ **vật lý không có trong máy** (ảnh bánh thật, prod token, VPS) — không phải giới hạn harness.
  "Dừng duyệt mỗi phase" chính là loại scaffold thừa mà nguyên tắc harness cấm.
- **CI không phải blocker** — cứ làm task kế song song trong lúc CI chạy.
- **Không tin report của generator; verify độc lập bắt lỗi liên tục** (~18 ca). Generator từng báo
  lint pass (Task 4) khi thực tế fail; báo `make check` xanh khi có test đỏ; đọc sai `.env` của chính nó.
  Luôn tự kiểm các claim then chốt trước khi cho qua gate. Ca hay nhất: `go-reviewer` **tự viết test
  concurrency không ai yêu cầu** → phơi ra race TOCTOU (2 order / 1 orphan) mà held-out tuần tự không thấy.
- **Subagent nền vẫn chạy sau khi mark done và có thể tự commit.** Một generator Task-7 chạy thêm ~68'
  rồi tự commit tối ưu Dockerfile (388→269MB). Trước khi nhận commit muộn kiểu này: `git fsck` +
  soi phạm vi commit lạ.

## Decisions (why)
- **Skill QA tái dùng: mọi thứ riêng-app gom vào 1 file config ở root.** Skill **không biết gì**
  về app; cách chạy test / test ở đâu → nằm trong 1 config duy nhất ở project root → nhấc nguyên
  skill sang repo khác không sửa. QA docs **derived từ test thật** (không viết tay), mỗi test trace về
  **REQ-xxx** để chứng minh coverage.
- **Tài liệu BA/SRS là artifact DERIVED, trích từ spec, chạy song song.** Agent `ba-writer` chỉ *trích*
  từ spec đã duyệt — không tự bịa requirement. Why: BA hay bịa sẽ drift + thành nguồn-sự-thật thứ hai;
  BA derived thay vào đó **phơi ra gap thật của spec** (lần chạy đầu tìm 4 gap nghiệp vụ để user quyết).

## Techniques
- **Colima + testcontainers (quirk Ryuk socket):** `make test` cần CẢ HAI:
  `DOCKER_HOST=unix://$HOME/.colima/default/docker.sock` **và**
  `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock`. Root cause: Ryuk (reaper) cố bind-mount
  socket **theo path host Mac** vào container, Colima VM không mount path host đó → override báo path
  in-VM. Chỉ set `DOCKER_HOST` là **chưa đủ**. Sau khi Colima restart, testcontainers mất provider
  ("rootless Docker not found") vì `/var/run/docker.sock` trỏ lại Docker Desktop.
- **Held-out cho endpoint có rate-limit:** seed data thẳng qua `psql` (né rate-limit của form public),
  retry-on-429, đặt assertion rate-limit **cuối cùng**. Việc này còn phơi ra 5/phút là **lỗi thiết kế
  nghiệp vụ thật** (corporate NAT) → nâng 20/phút.

## Bugs (root cause)
- **golangci-lint trên CI (root cause chính xác, nối tiếp 07-22):** (1) `golangci-lint-action@v6` viết
  cho golangci-lint **v1**, xử lý sai config **v2** → cài binary trực tiếp; (2) `install.sh` từ `master`
  **checksum mismatch** cho v2.x → dùng `go install .../golangci-lint@v2.12.2` từ tag, và bỏ
  `GOTOOLCHAIN=local` để install build được. Local cần `CGO_ENABLED=0` (shim `cc` làm hỏng CGO typecheck
  khi load import testcontainers).
- **npm lock lệch platform — fallback `npm install`:** lock sinh trên darwin thiếu native deps linux của
  Tailwind v4 (`@tailwindcss/oxide-wasm`, `@emnapi/*`, `@napi-rs/wasm-runtime`); Colima I/O bất ổn giết
  container linux cần để regenerate lock. Fallback bền: đổi CI + Dockerfile từ `npm ci` sang
  `npm install --no-audit --no-fund` (vẫn tôn trọng lock, nhưng reconcile native theo platform).
- **Postgres glibc→musl để lại warning collation không xoá được:** đổi `postgres:16-alpine` trên volume
  cũ tạo dưới glibc → warning collation-version-mismatch **vĩnh viễn**, không refresh được qua khác libc
  (glibc→musl); chỉ volume mới mới sạch. Chấp nhận cho DB dev. (Đổi alpine + xoá image trùng freed ~1.9GB.)
- **Footgun phát hiện env/prefix:** (1) so `==` chặt: `APP_ENV="Production"` lọt qua guard seed/mật khẩu
  mặc định → case-fold. (2) prefix match ngây thơ: `/adminx` khớp nhầm prefix auth `admin` → matcher
  phải segment-aware.

## Gotchas
- **`timeout` không có trên macOS** (exit 127) — đừng bọc held-out chạy lâu bằng `timeout`; chạy nền.
- **Skill `security-review` diff theo `git diff origin/HEAD`** → bỏ sót file untracked/unstaged. Với file
  mới/chưa commit phải **đưa danh sách file trực tiếp** cho reviewer, không nó review diff rỗng.

Liên quan: [[digest-avada-project-2026-07-23]] (Next dev gotcha) · [[digest-claude-chat-2026-07-17]] (Colima/Docker đĩa) ·
[[digest-aws-2026-07-24]] (gate rẻ trước LLM, loop tự nhịp — cùng mạch harness) · [[dev-skills]].
