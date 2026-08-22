---
type: note
title: Digest ticket-mcrsv — 2026-08-22 (bịt 3 lỗ P0 + tái cấu trúc docs)
summary: Gate script tự viết của tôi là nguồn xanh giả hai lần trong một phiên; env.example khai biến mà code không đọc nên cấu hình "đã set" vẫn vô hiệu; và `last-verified` tôi điền hàng loạt biến doc chưa ai kiểm thành doc "đã xác minh".
tags: [system-design, architecture, java, postgresql, debug, tooling]
created: 2026-08-22
updated: 2026-08-22
source: project "ticket-mcrsv" — session history (`/loop 5m /looptasksv2` + cleanup docs)
---

Nối tiếp [[digest-ticket-mcrsv-2026-08-21]] — phần **mới**.

## Bugs

**Gate script của chính tôi là nguồn xanh giả — hai lần trong một phiên.** Verifier bắt được cả hai:
1. `( <lệnh> ; echo "--- exit $?" ) || rc=1` — `echo` cuối **luôn thành công** nên subshell luôn exit 0, `rc` không bao giờ thành 1. Phải bắt `$?` ngay sau lệnh thật.
2. Gate không dựng Postgres/Redis nên **36 test integration SKIP im lặng** mà vẫn in `ok` và `GATE EXIT 0`. Luật đã thêm: coi mọi dòng `--- SKIP` là **FAIL**.
→ khái quát ở [[gate-tu-viet-la-nguon-xanh-gia]].

**Migration của task đã merge chưa bao giờ được áp** vào `dev-postgres-main`: `relation "event_cancellation_policies" does not exist` làm **mọi** `POST /api/v1/bookings` trả 500 suốt một ngày. Nguyên nhân quy trình: init container `migrate-event` chỉ chạy khi `docker compose up`. Đóng vĩnh viễn bằng `scripts/dev-migrate.sh` — chạy migration của cả 5 service lên Postgres **đang chạy**, không cần `compose down`.

**Biến env chết.** `auth-service/env.example` khai `METRICS_PORT` trong khi code đọc `PROMETHEUS_PORT` — người mới set biến đó và tin là đã cấu hình, thật ra không ai đọc. Cùng loại: `user-service/env.example:24` ghi `METRICS_PORT=9092` còn code là `9192`. Cấu hình sai kiểu này im lặng hơn cả không cấu hình.

**Tôi tạo ra chứng nhận giả.** Điền `last-verified: 2026-08-21` + `verified-by` hàng loạt cho front-matter mới; verifier lấy mẫu **3 file thì 2 sai**. Người sau sẽ tin dòng đó thay vì kiểm lại. → đúng thứ [[truong-last-verified]] đã cảnh báo, và tôi vẫn vấp.

**Guard khớp prefix bắt hụt vì tên trùng một phần.** Chuỗi `service-to-service` khớp **trọn** nên phần prefix không kết thúc bằng `service-` và lọt guard. Luật tổng quát thay thế: tên service thật không bao giờ nằm ngay sau một chữ cái/dấu gạch khác.

**`ticket-service` gọi nhầm port của hai service khác** trong `config/config.go` — cùng lớp lỗi với `env.example` ghi `50053` trùng `event-service` (đã ghi ở digest 08-21) mà tôi **bỏ sót vì chỉ sửa `GRPC_PORT`, không quét hết file**. Máy tôi chạy được chỉ vì có `.env` local; checkout mới làm theo hướng dẫn thì hỏng.

## Techniques

**Verifier sai cũng phải tự phân xử, không gật.** Verifier khẳng định `PAYMENT_SERVICE.md` "không tồn tại ở đâu trong repo" sau khi `ls` một đường dẫn đã resolve từ root — kết luận vượt quá dữ kiện nó có. Lane đúng. Cùng phiên, verifier lại **đúng và tôi sai** về port email-worker. Trọng tài là tôi tự chạy, không phải bên nào nói to hơn.

**Thí nghiệm ngược để chứng minh checker không xanh giả**: tự tiêm một link chết / một số port sai vào file **khác** với chỗ vừa vá, xem checker có đỏ không, rồi gỡ ra và xác nhận bằng `md5`. Tiêm vào service khác mới phân biệt được "phát hiện tổng quát" với "hardcode riêng một ca".

**Colima chết hai lần giữa lúc đo** (swap ~92%) và kéo theo `dev-postgres-main` — ghi vào BRIEF như một **ràng buộc vận hành thật**, không phải xui. → cùng chuyện với [[digest-ticket-mcrsv-2026-08-18]].

**`grep -c '\[⏳'` trả về 4 nhưng cả 4 là văn xuôi** trong khối bàn giao phiên cũ, không phải lock thật. Đếm không thay được đọc từng dòng — chính file đó có cảnh báo về cái bẫy này.

## Context

- Ba lỗ P0 phát hiện ở phiên trước đều đã bịt và **chứng minh bằng đường thật** (đặt → capture → refund → đặt lại đúng ghế đó), không dừng ở test xanh: `122` (nối `ConfirmReservation` vào đúng đường `PAYMENT_CAPTURED`, 3 vòng verify), `125` (guard nguyên tử `AND status = 'reserved'` trong UPDATE), `123` (refund huỷ booking + trả ghế).
- Bẫy AOP self-invocation cắn repo lần thứ ba: `@Transactional(REQUIRES_NEW)` gọi qua `this.xxx()` trong cùng bean thì **bỏ qua proxy**. Task 123 tránh bằng cách đặt `persistRefundOutcome` ở **bean riêng**.
- Xoá 3 service vỏ rỗng (`analytics-service`, `support-service`, `rate-limiter` — mỗi cái đúng 1 file README). Nhưng gắn nhãn "đường cụt" cho `realtime`/WebSocket là **sai**: `plans/phase12-fe.md` có Phase 14 rõ ràng cho nó. → [[feedback-khong-dung-vs-chua-lam-toi]] lặp lại đúng lần thứ hai.
- README hoá ra là design doc từ **trước khi implement** — mọi service ghi `🟡 Planning`, kể cả service tôi vừa smoke test sáng đó. 62 file doc, 12 file phải dán banner STALE (**19% đang nói sai**).
- Tái cấu trúc doc theo vòng đời + ADR + CI check: xem [[2026-08-22-cau-truc-doc-theo-vong-doi]].

Liên quan: [[digest-ticket-mcrsv-2026-08-21]] · [[gate-tu-viet-la-nguon-xanh-gia]] · [[2026-08-22-cau-truc-doc-theo-vong-doi]] · [[feedback-dung-xin-chot-khi-chi-thi-da-co]] · [[truong-last-verified]] · [[bang-chung-phan-biet-duoc]]
