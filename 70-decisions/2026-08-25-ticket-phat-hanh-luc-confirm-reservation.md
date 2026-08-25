---
type: decision
title: ticket-mcrsv — vé được phát hành ngay trong `ConfirmReservation` của ticket-service
summary: Chọn để ticket-service tự INSERT vào bảng `tickets` khi `ConfirmReservation` thành công, thay vì để một service khác gọi API `CreateTicket` sau khi thanh toán — vì `checkin-service` đọc `ticket.Status` chứ không đọc booking, nên không có ticket là check-in từ chối mọi vé.
tags: [system-design, backend, architecture, postgresql]
created: 2026-08-25
updated: 2026-08-25
review: 2026-11-25
source: project "ticket-mcrsv" — session history 2026-08-25 (task 139), user chốt phương án (a)
---

# Vé phát hành ngay trong `ConfirmReservation`

Điều tra bắt đầu từ một câu hỏi khác ("luồng còn thiếu gì") và ra một kết luận lớn hơn:

- `checkin-service` **không** gọi booking-service. Nó gọi **ticket-service** và xét `ticket.Status`
  (`cancelled`/`refunded` thì từ chối).
- Bảng `tickets` (schema `tickets`) có **0 row**, trong khi `booking_sessions` và
  `seat_reservations` đều có 254 — tức là booking chạy thật, còn vé thì chưa bao giờ được phát hành.
- `CreateTicket` có lộ ra ngoài gateway như một API riêng, nhưng **không luồng nào gọi nó**. Đã quét
  hết Go, Java (JPA nên không có `INSERT INTO tickets` dạng chuỗi) và Node.

Hệ quả nếu để nguyên: check-in từ chối **mọi** vé, không riêng vé huỷ — một tính năng chưa từng chạy
được lần nào. Cùng họ với các ca đã ghi ở [[digest-ticket-mcrsv-2026-08-13]].

## Why

Schema của bảng `tickets` đã được thiết kế sẵn **đúng như một tấm vé đã phát hành** (mang trạng thái
riêng, tách khỏi vòng đời của reservation). Nó không phải một bảng phái sinh để join ra khi cần —
nó là bản ghi cuối cùng của việc "chỗ này đã thuộc về người này".

Chỗ duy nhất biết chắc reservation đã thành công **và** vẫn còn transaction đang mở là chính
`ConfirmReservation`. Phát hành vé ở đó thì:

- Không có cửa sổ nào mà "chỗ đã giữ, tiền đã thu, nhưng chưa có vé" — trạng thái đó chính là thứ
  đang tồn tại trong 254 reservation hiện có.
- `seat_reservations` đã lưu sẵn `base_price` / `final_price`, nên vé mang được **ảnh giá** tại thời
  điểm mua mà không phải đi hỏi lại service khác.
- Không phải thêm một orchestrator hay một bước saga nữa chỉ để gọi `CreateTicket` đúng lúc.

Đường vòng "để service khác gọi `CreateTicket` sau khi thanh toán" chính là đường đã tồn tại trên
giấy suốt thời gian qua và **chưa từng có ai gọi** — giữ nó là giữ một hợp đồng không ai thực thi.

## Tradeoff

**Được:**
- Không còn khoảng trống giữa "đã giữ chỗ + đã trả tiền" và "có vé".
- Check-in có nguồn sự thật đúng cấp với thứ nó hỏi.
- Không thêm bước mạng nào giữa hai sự kiện vốn phải nguyên tử với nhau.

**Mất / phải trả:**
- `ConfirmReservation` gánh thêm việc, transaction dài hơn, và một lỗi ở bước phát hành vé giờ làm
  hỏng cả xác nhận chỗ. Vòng 2 của task chốt hướng **trả lỗi + rollback** thay vì log-rồi-đi-tiếp,
  lý lẽ: *"đường sau thu tiền, transaction vẫn mở nên rollback rẻ; tiếp tục dù đã phát hiện lệch sẽ
  giữ nguyên trạng thái sai"*.
- API `CreateTicket` trên gateway trở thành đường thứ hai vào cùng một bảng — chưa quyết sẽ gỡ hay
  giữ, và để nguyên thì nó là chỗ có thể tạo vé không qua reservation.
- Bất biến "partial insert luôn là bất thường" phải viết cho đúng: vòng 2 của lane phát biểu quá
  rộng và bị verifier bác; vòng 3 mới khớp đủ 5 ca (vé cũ + vé mới bằng số yêu cầu vẫn có thể là
  hợp lệ).
- Vé cho **254 reservation đã tồn tại** không tự có — chưa có backfill nào trong quyết định này.

## Chưa xác minh

- Phương án bị loại được ghi lại theo mô tả trong phiên ("để luồng khác gọi `CreateTicket`"); **chưa
  đọc lại code gateway** để biết API đó nhận đủ dữ liệu phát hành vé hay không.
- Task đi qua **ba vòng verifier, hai lần FAIL** trước khi PASS — bản merge là vòng 3, nên nếu cần
  trích dẫn hành vi cụ thể thì phải đọc code chứ không đọc mô tả vòng 1/2.

## Liên quan

[[digest-ticket-mcrsv-2026-08-25]] · [[digest-ticket-mcrsv-2026-08-13]] ·
[[digest-ticket-mcrsv-2026-08-21]] · [[2026-08-12-va-triet-de-saga-ticket]] ·
[[2026-08-24-cleanup-service-chua-dung-ticket-mcrsv]] · [[ack-khong-phai-hieu-ung]]
