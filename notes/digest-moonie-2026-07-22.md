---
type: note
title: Digest Mooni 2026-07-22 — CI lint thật, testcontainers Postgres flaky, race convert đơn, revenue lệch múi giờ
summary: Phần mới của Mooni (CI + giai đoạn 4/5) — golangci-lint fail trên CI dù local xanh, wait-strategy Postgres yếu gây flaky, race TOCTOU khi convert lead→đơn, và bug doanh thu tháng tính theo UTC.
tags: [debug, postgresql, tooling, backend, method]
created: 2026-07-22
source: project "moonie" — session history (mined 2026-07-22)
---

# Digest Mooni — 2026-07-22 (CHỈ phần mới)

Đã loại phần đã có trong [[digest-moonie-2026-07-17]], [[digest-moonie-2026-07-18]],
[[digest-moonie-2026-07-20]] (harness generator→evaluator→held-out→screenshot,
Colima socket cơ bản, `CGO_ENABLED=0`, package-lock lệch platform, ORDER BY,
rate-limit, snapshot giá, held-out chống gian lận, Docker cleanup, JWT alg=none,
dummy-bcrypt, upload magic-byte, int truncation tài chính). Phần dưới chỉ ghi cái CHƯA có.

## Feedback

- **CI không phải blocker — chạy song song tiếp, đừng dừng chờ CI.** User bắt đúng: đã dừng chờ CI một cách không cần thiết trong khi vẫn có việc độc lập làm được. → poll CI ở nền, dây chuyền vẫn đi tiếp.
- **Agent nền có thể tự commit thêm SAU khi đã mark xong** (Task 7 chạy nền ~68 phút rồi tự commit tối ưu image 388→269MB). *How:* sau khi đóng task, `git fsck` + soi commit lạ trước khi tin repo toàn vẹn; chấp nhận chỉ khi verify được.

## Bugs (root cause)

- **golangci-lint fail trên GitHub CI dù local xanh** — chuỗi 3 nguyên nhân riêng biệt, mỗi lần fix lộ lớp sau:
  1. Local chạy `CGO_ENABLED=0` (do shim `cc`) nên qua; CI mặc định bật CGO → typecheck import testcontainers fail. Đặt `CGO_ENABLED=0` cấp job.
  2. Vẫn fail vì **`golangci-lint-action@v6` vốn cho golangci-lint v1**, xử lý sai config v2 → phải bỏ action, tự cài.
  3. `install.sh` từ `master` **checksum mismatch** cho v2.12.2 (bug đã biết của v2) → dùng `go install github.com/golangci/golangci-lint/cmd/golangci-lint@v2.12.2` từ tag. Lưu `GOTOOLCHAIN=local` có thể chặn build tool → cân nhắc.
  → Bài học: **local xanh không chứng minh CI xanh**; khác biệt CGO/version/action là thủ phạm kinh điển. Push sớm để CI thật gác cổng.
- **Test testcontainers-Postgres flaky "connection refused" lúc migrate** — `newTestDB` dùng `wait.ForListeningPort`: port mở TRƯỚC khi Postgres thật sẵn sàng nhận query → race readiness → CI đỏ ngẫu nhiên. Fix: đổi sang wait-strategy chắc cho Postgres (chờ log/health, không chỉ chờ port).
- **Race TOCTOU khi convert lead→đơn**: 2 request convert cùng lúc 1 lead → tạo 2 đơn. Held-out (chạy tuần tự) KHÔNG thấy; **go-reviewer tự viết test race** mới bắt được. Fix: guard atomic `WHERE order_id IS NULL` + `FOR UPDATE` + rollback → không đơn mồ côi.
- **Doanh thu tháng lệch múi giờ**: `date_trunc('month', now())` tính theo UTC → đơn đầu/cuối tháng rơi sai tháng với tiệm bán mùa vụ. Fix: neo giờ VN + có test fail-trước/pass-sau chứng minh.
- **Reject `JWT_SECRET` yếu/placeholder lúc khởi động (fail-fast)** — defense-in-depth: app không boot nếu secret ngắn/placeholder; `.env` dev để secret 64 ký tự để vẫn chạy.

## Techniques

- **Held-out tuần tự không bắt được lỗi đồng thời** → cần reviewer chủ động viết test race/2-goroutine (và test 2-curl song song thật) cho các thao tác có ghi cạnh tranh (convert, tạo đơn).
- **Form browser gọi thẳng Go API khác origin bị CORS** (:3000 → :8080) → cấu hình CORS phía server, không tự đoán origin.
- **Đổi `postgres:16` → `16-alpine` giữ volume**: cùng major nên data còn, nhưng chỉ đụng **cả compose lẫn testcontainers trong test** (không sót một chỗ).

## Liên kết gợi ý

[[digest-moonie-2026-07-17]] · [[digest-moonie-2026-07-18]] · [[digest-moonie-2026-07-20]] · [[controller-service-repository]] · [[moc-learning-pkm]]
