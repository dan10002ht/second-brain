---
type: decision
title: Vá triệt để saga/ticket-service để bàn đo chạy được, thay vì vá tối thiểu hay hoãn G0
summary: `ticket-mcrsv` cho phép sửa business logic trong vùng Spec #1 tuyên bố off-limits — vá `LazyStringArrayList`→Hibernate và hoàn thiện reservation ở ticket-service theo hướng đúng nghiệp vụ (partial unique index thay unique toàn cục), thay vì vá tối thiểu để đo hay đẩy G0 xuống sau F1.
tags: [system-design, architecture, java, postgresql, backend, debug]
created: 2026-08-12
updated: 2026-08-12
review: 2026-11-12
source: project "ticket-mcrsv" — session history 2026-08-11/12 (task G0/B1/B2)
---

# Vá triệt để saga/ticket-service để bàn đo chạy được

**Bối cảnh.** Task G0 (baseline load test) không đo được vì **hai bug ứng dụng có sẵn**, không phải
vì thiếu hạ tầng:

- `BookingGrpcService.java:49` → `BookingSagaOrchestrator.java:269` → `Booking.java:90-93` —
  nhét `LazyStringArrayList` (immutable, từ protobuf) vào `@ElementCollection` của Hibernate;
- `ticket-service/grpc/ticket_controller.go:22-23` — `ReserveTickets`/`ReleaseTickets` còn là
  `Unimplemented` stub (0 hit khi grep).

Cả hai nằm đúng trong vùng **Spec #1 tuyên bố "không sửa business logic"** ⇒ mâu thuẫn ở tầng kế
hoạch: **không vá thì không đo được gì**, tức G0/G4/G5 đều tắc. Loop không tự quyết, đưa lên user.

**Quyết định của dantt:** *"Đừng vá tối thiểu nhé, vá làm sao cho **triệt để, phù hợp với business**
nhé"* → mở ranh giới spec, vá đến nơi.

Nội dung đã làm theo hướng đó:
- **B1** — chốt chặn bằng **copy phòng thủ** tại `Booking.java` cho cả `seatNumbers` lẫn `metadata`,
  rồi **quét cùng pattern** sang `invoice-service`/`payment-service`.
- **B2** — phát hiện `ticket-service` **đã có sẵn nguyên tầng reservation** (không phải viết mới
  tồn kho). Vòng sửa thứ ba đi vào gốc: `reservation_token` đang **`UNIQUE` toàn cục** trong khi
  nghiệp vụ chỉ cần duy nhất **giữa các hold đang sống** ⇒ đổi sang **partial unique index**
  (migration `005`/`006`).
- **B3** (lộ ra trong lúc đo) — gRPC version skew, vá bằng **BOM** thay vì pin lại từng artifact.

## Why

- **Vá tối thiểu ở đây không rẻ hơn.** Nó vẫn phải chạm đúng hai file nhạy cảm nhất, nhưng để lại
  một hệ thống mà mọi số đo sau này đều phải kèm chú thích "đang chạy trên bản chắp vá" — baseline
  mất ý nghĩa so sánh, mà baseline là toàn bộ mục đích của Spec #1.
- **Phương án "đẩy G0 xuống sau F1" biến thành ngồi chờ.** F1 (Redis inventory) sẽ viết lại chính
  vùng này, nên chờ nó là hợp lý *trên giấy*; nhưng không có baseline thì F1 cũng không chứng minh
  được nó cải thiện cái gì. Đo trước rồi mới có đối chứng.
- **Ranh giới "không sửa business logic" vốn để chống agent tự tiện đổi nghiệp vụ**, không phải để
  cấm sửa bug chặn đường. Giữ nguyên chữ mà mất mục đích là hiểu sai chính spec của mình.
- **Vá gốc lộ ra thứ vá ngọn không thấy**: `UNIQUE` toàn cục trên `reservation_token` là lỗi mô hình
  chứ không phải lỗi code — chỉ khi từ chối "bắt lỗi rồi retry" mới nhìn ra.

## Tradeoff

- **Được:** bàn đo đo đúng thứ nó định đo; `ReserveTickets` round-trip thật (bằng chứng: lỗi mới là
  `seat(s) not found`, tức nghiệp vụ, không còn panic transport); ba service Java hết version skew;
  cùng pattern `LazyStringArrayList` được quét hết chứ không chỉ chỗ được chỉ.
- **Mất — spec không còn là ranh giới cứng.** Một khi đã mở một lần vì "không vá thì tắc", lần sau
  lập luận đó dùng lại được. Rào chắn giờ nằm ở **người**, không ở văn bản.
- **Mất — chi phí thật.** B2 tốn **3 vòng verifier** (2 vòng đầu FAIL, vòng 2 fail vì chính vòng sửa
  đẻ ra bug chức năng mới), 17 file `+2180/−34`. "Triệt để" không rẻ.
- **Rủi ro còn lại:** F1 sẽ viết lại vùng tồn kho ⇒ một phần công của B2 có thể thành **throwaway**.
  Chấp nhận vì phần không bị vứt (partial unique index + copy phòng thủ) là phần đúng mô hình.
- **Chưa chốt:** baseline vẫn **chưa đo xong** — bàn đo còn vướng rate limiter theo IP của gateway
  ([[digest-ticket-mcrsv-2026-08-12]]) và RAM/k3d ([[2026-08-11-ban-do-tai-k3d-k6]]).

## Phương án đã bỏ

- **(a) Vá tối thiểu đúng 2 chỗ, giữ nguyên mô hình tồn kho + lock eventId** — đủ để chạy số, nhưng
  giữ nguyên lỗi mô hình `UNIQUE` toàn cục và để lại một baseline không dám tin.
- **(b) Đẩy G0 xuống sau F1** — an toàn về ranh giới spec, nhưng đổi lại là không có đối chứng cho
  chính F1, và mọi task G2–G5 nằm chờ.
- **Pin lại từng artifact gRPC** (thay cho BOM) — chính cách pin lẻ đã sinh ra skew lần này.

## Cần theo dõi tới ngày review

1. Baseline G0 **đã đo được chưa**, và có phải nới rate limiter để đo không (nếu có thì con số phải
   ghi rõ là đã nới).
2. F1 (Redis inventory) có **vứt bỏ** phần B2 không — nếu có thì phần nào sống sót.
3. Ranh giới "không sửa business logic" có bị viện dẫn lại để mở tiếp lần nữa không.

→ [[digest-ticket-mcrsv-2026-08-12]] · [[2026-08-11-ban-do-tai-k3d-k6]] ·
[[digest-ticket-mcrsv-2026-08-11]] · [[2026-08-07-phan-tang-verifier]] ·
[[chan-agent-bang-cau-hinh]]
