---
type: note
title: Digest ticket-mcrsv 2026-08-26 — nửa sau vòng đời vé chạy lần đầu, và bốn thứ chặn nó đều nằm ngoài business logic
summary: Check-in chưa bao giờ chạy được ở dev vì `.env` ghi hostname của Docker Compose; lỗi nhập liệu ra 500 vì `errors.New` trượt `errors.As`; cột `updated_by` kiểu uuid nhận chuỗi rỗng; và mã QR bắt buộc phải có nhưng chưa bao giờ được đối chiếu.
tags: [system-design, backend, postgresql, architecture, agent, automation, debug]
created: 2026-08-26
updated: 2026-08-26
source: project "ticket-mcrsv" — session history (2 session `/looptasksv2`, ~15 task đóng)
---

# Digest ticket-mcrsv — 2026-08-26

> Nối tiếp [[digest-ticket-mcrsv-2026-08-25]] (bảng trùng tên hai schema, CI Go, `env.example`).
> Phiên này chạy được **lần đầu** trọn nửa sau vòng đời vé: đặt → phát hành → check-in → hoàn tiền.

## Bugs

**Check-in chưa bao giờ chạy được ở dev, và nguyên nhân là một dòng `.env`.**
`checkin-service/.env:23` ghi `TICKET_SERVICE_HOST=ticket-service` — **tên service trong Docker
Compose**, không phải `localhost`. Chạy native trên host thì tên đó không resolve, mà `dev-all.sh`
không override cho riêng service này. Chỉ `checkin-service` dính. Fix: default `localhost` + một
guard AST khoá lại default của mọi service host (fail được cả hai chiều). Cùng họ với chuyện
`env.example` sinh ra `.env` sai đã ghi hôm trước — cấu hình mặc định sai thì mọi thứ phía sau chỉ
là triệu chứng.

**Cột `updated_by` kiểu `uuid` nhận chuỗi rỗng.** `UpdateStatus` (`ticket_repository.go:404`) set
`updated_by = $3`; `checkin-service` truyền chuỗi rỗng → `pq: invalid input syntax for type uuid`,
vé không bao giờ chuyển sang `used`. Fix chuyển chuỗi rỗng thành `NULL` — và điều đáng giữ là
verifier chứng minh tuyến phòng thủ **không nuốt lỗi**: `"not-a-uuid"` vẫn bị Postgres từ chối,
chỉ đúng chuỗi rỗng mới thành `NULL`.

**Lỗi nhập liệu đi ra client thành 500.** `Validate()` trả `errors.New` thuần ⇒ `errors.As(err, &ce)`
trượt ⇒ `codes.Internal` ⇒ gateway map thành `500 INTERNAL_ERROR`. Sau khi trả đúng typed error:
ba ca nhập liệu đều `400 VALIDATION_ERROR`, còn mã nghiệp vụ `ALREADY_CHECKED_IN` vẫn `409` — hai
lớp không lẫn vào nhau. Cùng lớp lỗi ở phía Java: `invalidArgument()` ném `StatusRuntimeException`
bị bắt ở nhánh trên trước nên không bao giờ tới nhánh `INTERNAL` — kết luận "mã này không thể ra"
chỉ đúng khi đọc đủ thứ tự catch.

**QR bắt buộc phải có nhưng chưa bao giờ được đối chiếu.** `checkin_service.go` grep `qr_code` ra
**0 kết quả** — nó chỉ đòi field có mặt. Nghĩa là chuỗi tự gõ tay `TICKET:<ticketId>` đi qua được,
và mã QR không phải là một phép kiểm. Migration 012 đổi QR thành token 71 ký tự không mang dấu vết
`ticket_id`; sau đó đúng chuỗi từng qua được thì bị từ chối, QR thật đọc từ DB thì đi tiếp. Hai bẫy
kèm theo:
- `gen_random_uuid()` trong backfill **đánh giá một lần** cho cả câu lệnh nếu viết sai chỗ →
  verifier tự dựng bảng 4 row legacy để kiểm `distinct_count 4 / total 4`.
- Fixture test không hề khai `QrCode`, nên khi production check chặt lại thì test fail-closed hàng
  loạt — đó là **vấn đề fixture**, không phải hồi quy. Lane từ chối cả hai lối tắt (sửa file ngoài
  allowlist, thêm bypass test-only) và dừng lại báo — đúng chỗ đáng dừng.

**Màn check-in của org chưa bao giờ dùng được.** `checkin-form.tsx` **không bao giờ gửi `qrCode`**,
và type khai `qrCode?: string` (optional) trong khi backend bắt buộc. Frontend và backend lệch nhau
ở tầng kiểu, không ai bắt được vì hai bên không chia sẻ contract.

**`RetryJob` không reset `retry_count` dù comment ghi "Reset job for retry".** Nó set status →
`pending` và dừng ở đó. Trước khi có `GREATEST(retry_count, in-memory)` thì DB luôn `retry_count=0`
nên không lộ. Điều tra tới cùng: `RetryJob` **không có caller production nào** (chỉ một unit test
đường invalid-ID) và **không có poller nào đọc `status=pending`** để requeue — nên đây là tương tác
**tiềm ẩn**, không phải đang hỏng. Ghi lại đúng mức đó thay vì gắn nhãn bug.

**`PGOPTIONS` thiếu ở hai job migration nữa.** `migrate-user` và `migrate-checkin` cũng thiếu
`-c search_path=<schema>` — cùng bug đã sửa cho `migrate-ticket`, đúng dạng "sửa lỗi là quét HẾT
chỗ tương tự". 22 bảng `public` chết được **quarantine bằng `SET SCHEMA public_dead_20260825`**
thay vì drop/rename — lùi lại được, và 4 bảng `public` hợp lệ mà email-worker thật sự dùng được
giữ nguyên (22 chuyển + 4 giữ = 26, khớp DB).

## Techniques / kỷ luật

- **`-a never` không chặn được prompt hỏi trust của codex lane.** Dấu hiệu là màn hình gần như
  trống trong khi process vẫn sống và probe vẫn pass — `pgrep` không phân biệt được "đang chạy" với
  "đang ngồi chờ trả lời". Phải đọc màn hình. Cùng họ với [[gui-viec-cho-lane-khong-co-ack]].
- **Verifier FAIL vòng 2 là blocker** — dừng và hỏi user, không tự cho vòng 3. Vòng 3 chỉ chạy khi
  user chốt ("cho lane vòng 3 đi").
- **Lệch số test giữa verifier và lane không mặc nhiên là mất test**: 131 vs 133 hoá ra là đếm khác
  đơn vị (hàm `func Test` top-level vs test case), đối chiếu với `main` mới ra `+7`.
- `git worktree remove` chạy chồng `git add` → `index.lock`. Kiểm trước khi xoá mù; lần này nó tự
  biến mất, không có tiến trình git nào thật đang chạy.
- **Sandbox chặn lane `kill` PID** (`operation not permitted`) nên nó smoke-test trên **binary cũ**
  mà vẫn báo đúng sự thật là chưa đo được. Việc restart service là phần main agent phải tự làm —
  đúng loại việc không uỷ quyền được.
- Chọn task theo **swap của máy** (92–97% suốt phiên, ngưỡng tự đặt `<70%`): mọi task cần dựng stack
  đo bị hoãn có chủ đích, không phải quên. Nối tiếp [[digest-ticket-mcrsv-2026-08-18]].

## Context

- **Quyền user cấp (đã ghi vào BRIEF, không chỉ nằm trong hội thoại):** được xoá và viết lại toàn bộ
  migration vì dự án **chưa lên prod**; không cần giữ log migration theo tiến độ; ưu tiên chạy các
  task không đụng hạ tầng.
- Lần đầu tiên trong repo, luồng đặt vé **sinh ra một tấm vé thật** (`sold`/`paid`) — nhờ quyết định
  [[2026-08-25-ticket-phat-hanh-luc-confirm-reservation]].
- Ghế đã refund **bán lại được** cho session khác (S1 refund → S2 confirm cùng ghế), xác nhận bằng
  thực nghiệm chứ không suy từ code.
- Kỷ luật nhặt lane của phiên này bị user chỉnh, ghi riêng ở [[feedback-nhat-du-lane-song-song]].

## Liên quan

[[digest-ticket-mcrsv-2026-08-25]] · [[digest-ticket-mcrsv-2026-08-22]] ·
[[2026-08-25-ticket-phat-hanh-luc-confirm-reservation]] · [[feedback-nhat-du-lane-song-song]] ·
[[gui-viec-cho-lane-khong-co-ack]] · [[cham-viec-agent-nen]] · [[brief-state-agent-loop]] ·
[[feedback-follow-conventions]]
