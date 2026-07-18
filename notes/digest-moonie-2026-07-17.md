---
type: note
title: Digest moonie 2026-07-17 — harness generator→evaluator độc lập + gotchas Go/testcontainers/Colima/CI
summary: Build website Mooni bằng harness AI (generator build → evaluator độc lập gác cổng → held-out test viết trước, mù → design-evaluator so screenshot) và loạt gotcha thật Go+testcontainers+Colima+golangci-lint+CI.
tags: [nextjs, postgresql, backend, monorepo, method, debug]
created: 2026-07-17
source: moonie (session history)
---

# Digest moonie — 2026-07-17

> Dự án greenfield (tiệm bánh Mooni): monorepo Next.js 16 + Go (chi/pgx/sqlc) + Postgres, build
> đầu-cuối bằng harness AI đa agent. Rút phần durable/tái dùng. "chưa xác minh" nếu không confirm.

## Decisions

- **Harness chạy XUYÊN SUỐT, không dừng chờ duyệt mỗi giai đoạn.** Giá trị harness nằm ở vòng generator→gate→tự-fix cho tới khi output đạt, KHÔNG ở ranh giới giai đoạn. Dừng-chờ-duyệt là "scaffold thừa" phản lại chính nguyên tắc harness. 4 điểm dừng thật sự chỉ là thứ vật lý không có trong máy (ảnh sản phẩm, token/secret, quyết định nghiệp vụ).
- **Held-out tests viết TRƯỚC bởi qa-evaluator, generator build MÙ** (cấm đọc `tests/heldout/`) → chống agent viết test giả/luôn-pass. Generator commit 0 file held-out = bằng chứng không gian lận.
- **Không tin lời generator — evaluator re-verify độc lập mọi claim** (chạy lại test/lint/behavior thật). Nhiều lần cứu chất lượng: generator báo lint pass nhưng thật ra fail (CGO), báo test xanh nhưng flaky.
- **UI: screenshot loop** (Playwright render thật → design-evaluator chấm vs mockup, ngưỡng ≥8/10 cả 4 tiêu chí) — đúng pattern harness Anthropic.
- **Next.js 16 (không 15)** cho dự án mới; `postgres:16-alpine` (musl) thay non-alpine để giảm image; BA docs là **tài liệu phái sinh** (agent trích từ spec, không phải nguồn sự thật riêng).

## Bugs (root cause) — do verify độc lập / reviewer bắt

- **Doanh thu tháng lệch múi giờ**: `date_trunc('month', now())` tính theo UTC → đơn đầu/cuối tháng lọt sai tháng cho tiệm bán mùa vụ VN. Fix: neo query theo giờ VN.
- **Race convert lead→order (TOCTOU)**: 2 request convert cùng lúc tạo 2 đơn cho 1 lead. Reviewer tự viết test race để chứng minh. Fix: guard atomic `WHERE order_id IS NULL` + `FOR UPDATE` + rollback → không đơn mồ côi.
- **Tràn/cắt số tiền**: quantity cực lớn → int64 overflow/cắt số ("hỏng dữ liệu tài chính âm thầm"). Fix: validate chặn input cực đoan (số lớn → 400) ở boundary.
- **IP spoofing qua `middleware.RealIP`**: cho phép giả header → ảnh hưởng rate-limit & log IP. Bỏ RealIP, dùng `r.RemoteAddr`. Rate-limit **không** bypass được qua header giả.
- **Token bot Telegram rò qua log lỗi mạng**: URL error chứa token. Fix: helper `stripURLError` cho mọi nhánh.
- **testcontainers wait strategy yếu**: `wait.ForListeningPort` mở port trước khi Postgres sẵn sàng → test flaky "connection refused" lúc migrate → CI đỏ ngẫu nhiên. Fix: chờ theo log/ready thật.

## Techniques / gotchas (tái dùng)

- **testcontainers-go + Colima**: cần set `DOCKER_HOST` **và** `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE`. `/var/run/docker.sock` mặc định trỏ Docker Desktop; Ryuk reaper cố mount socket theo path host Mac vào container → Colima VM không mount được. Sau khi Colima restart, testcontainers báo "rootless Docker not found".
- **golangci-lint + testcontainers**: cần `CGO_ENABLED=0` nếu không typecheck import testcontainers fail (do shim `cc`). `golangci-lint-action@v6` vốn cho v1 → xử sai config v2; dùng `go install golangci-lint@<tag>` (pin) thay install.sh (checksum mismatch cho v2 từ master).
- **`package-lock.json` không portable**: sinh trên darwin → `npm ci` fail trên linux CI → phải regenerate/commit đúng.
- **Pin pgx v5.7.5** giữ `go 1.23` (tránh Go tự tải toolchain 1.25); dùng `GOTOOLCHAIN=local`.
- **CI thật (push) bắt lỗi local không thấy** — lint/CGO/version lệch chỉ lộ trên GitHub Actions. Contract gate spec-first: OpenAPI → oapi-codegen (Go) + openapi-typescript (TS) → cả 2 phía bị cưỡng chế lúc build.
- Agent nền có thể tự commit thêm sau khi mark xong (tối ưu image) → luôn `git fsck` + kiểm diff phạm vi trước khi chấp nhận.

## Feedback

- **Không chạy từng giai đoạn thủ công — tự chạy tuần tự tới hết; CI không phải blocker** (poll nền, làm task khác song song). **Why:** dừng chờ CI là thận trọng thừa. **How:** dây chuyền generator→gate tự vận hành, chỉ dừng ở quyết định nghiệp vụ thật.

## Liên quan
- [[dev-skills]] · [[headless-demo]] · [[monorepo-yarn-workspaces]] · [[subscription-digest-2026-07-16]] (multi-agent workflow) · [[testcontainers-colima-gotchas]] · [[controller-service-repository]]
