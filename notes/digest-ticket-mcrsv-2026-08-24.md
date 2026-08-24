---
type: note
title: Digest ticket-mcrsv 2026-08-24 — migration không bao giờ được áp, process sống mà service chết, và gate chỉ xanh trong phạm vi nó quét
summary: Mọi POST /bookings 500 suốt một ngày vì migration của task trước chỉ chạy trong init container lúc `docker compose up`; ticket-service "còn sống" nhưng log ngừng ghi 45 giờ; và checker doc báo sạch vì glob của nó không chạm 17 README cấp service.
tags: [system-design, backend, java, postgresql, architecture]
created: 2026-08-24
updated: 2026-08-24
source: project "ticket-mcrsv" — session history (2 session)
---

# Digest ticket-mcrsv — 2026-08-24

CHỈ phần mới. Đã ghi ở [[digest-ticket-mcrsv-2026-08-21]] / [[digest-ticket-mcrsv-2026-08-22]]:
bán trùng ghế phát hiện qua chạy thật, `env.example` khai cổng trùng/biến chết, gate script tự viết là
nguồn xanh giả, `last-verified` điền hàng loạt, Colima chết vì swap.

## Bugs

**Migration merge rồi nhưng chưa bao giờ được áp.** `relation "event_cancellation_policies" does not exist`
làm **mọi** `POST /api/v1/bookings` trả 500 suốt một ngày. Root cause quy trình chứ không phải code: init
container `migrate-event` chỉ chạy khi `docker compose up`, mà stack dev thì đang chạy sẵn ⇒ migration của
task trước nằm im trong repo. Vá tạm bằng `psql < 010_*.up.sql`, vá thật bằng `scripts/dev-migrate.sh` —
một lệnh gọi lại đúng các compose migration service cho stack **đang chạy**, để mount/credential/`search_path`
vẫn có một nguồn duy nhất.

**Process còn sống ≠ service còn sống.** `POST /bookings` trả `DEADLINE_EXCEEDED` ở `reserveTickets`;
tiến trình ticket-service vẫn nghe cổng 50054 nhưng **log ngừng ghi 45 giờ trước**, sau một đợt load 100 req/s.
Chẩn đoán bằng `lsof` lên fd log của tiến trình rồi đọc timestamp cuối — cổng mở là tín hiệu rẻ nhất và
cũng vô dụng nhất.

**Bán trùng ghế đã có người trả tiền.** Hai tầng nguyên nhân: `CancelBookingSession` gọi `ReleaseSession`
(giải phóng được cả ghế `confirmed`) thay vì `ReleaseReservedSession`; và repository `Release` không có điều
kiện trạng thái. Fix hai tầng: SQL `WHERE id = $1 AND status = 'reserved'` (chốt **nguyên tử**, đúng chokepoint
của [[digest-ticket-mcrsv-2026-08-17]]) + tách rõ `ReleaseByBookingSession` (terminal) vs
`ReleaseReservedByBookingSession`.

**Bẫy AOP self-invocation, lần thứ ba của repo.** `@Transactional(REQUIRES_NEW)` gọi qua `this.xxx()` trong
cùng bean thì **bỏ qua proxy im lặng** — transaction mới không bao giờ được mở. Cách đi đúng: đẩy phần
`REQUIRES_NEW` sang một bean riêng (`PaymentRefundStore.persistRefundOutcome`), commit trạng thái + outbox +
`FailedCompensation` trong một transaction ngắn, rồi **sau khi commit** mới gọi phần release nằm ngoài mọi transaction.

## Techniques

**Gate chỉ xanh trong phạm vi nó quét.** `check-docs.sh` báo `DEAD=0` trong khi 17 README cấp service không
nằm trong glob `docs/**` — và chúng đang nói sai thật (link chết, tên service không tồn tại). Sau khi nới scope,
guard `service-to-service` khớp **trọn chuỗi** nên `prefix` không kết thúc bằng `service-` và bắt hụt; luật tổng
quát hơn: tên service thật không bao giờ là hậu tố của một tên khác. Cùng họ
[[gate-tu-viet-la-nguon-xanh-gia]] và [[gate-quet-ma-nguon-bang-ast]].

**Verifier cũng sai được, và main agent phải tự phân xử.** Verifier khẳng định `PAYMENT_SERVICE.md` /
2 file khác "không tồn tại ở đâu trong repo" sau khi `ls` một path đã resolve từ root — kết luận vượt quá dữ
kiện nó có. Lane nói ngược lại và **lane đúng**. Khi lane và verifier mâu thuẫn, đi kiểm bằng đường thứ ba
chứ đừng chọn bên theo uy tín — cùng họ [[cham-viec-agent-nen]] và [[bang-chung-phan-biet-duoc]].

**Acceptance criterion trỏ gián tiếp vào file sắp bị xoá.** Brief của tôi ra tiêu chí `check-docs.sh EXIT=0`,
mà generator hardcode `email-worker/internal/config/loader.go` ở 3 chỗ — đúng file lane vừa xoá. Lỗi brief,
không phải lỗi lane. Trước khi ra tiêu chí dạng "gate phải xanh", grep xem gate có phụ thuộc thứ task này đang xoá không.

## Context

- Chuỗi 4 task đóng trong một phiên `/looptasksv2` (`124` migration runner, `122` bán trùng ghế qua 3 vòng verify,
  `125` guard release, `123` refund trả ghế), mỗi task đều được **tự chạy thật qua gateway** sau khi verifier PASS
  — đó là phần không uỷ quyền được ([[bang-chung-phan-biet-duoc]]).
- Sau khi hết task làm được, loop chạy rỗng **10+ lượt liên tiếp** vì `k3d`/`helm` chưa cài và swap 88%.
  Khớp với [[feedback-dung-loop-khi-rong]] — đã đề nghị huỷ cron thay vì fire tiếp.
- `grep -c '\[⏳'` trong `BRIEF.md` trả 4 nhưng **cả 4 đều là văn xuôi** trong khối bàn giao, không phải lock thật —
  đúng kiểu thối của shared state đã ghi ở [[brief-state-agent-loop]].
- Cấu trúc doc mới (living / howto / archive + ADR) đến từ [[2026-08-22-cau-truc-doc-theo-vong-doi]]; phiên này
  là phần thi hành và sửa các lỗ nó lộ ra.
- Phiên này cũng chốt cách cleanup code "chưa ai dùng" — xem [[2026-08-24-cleanup-service-chua-dung-ticket-mcrsv]]
  và [[feedback-khong-dung-vs-chua-lam-toi]].
