---
type: note
title: Digest ticket-mcrsv 2026-08-18 — Colima chết 11 lần không phải lỗi VM, và hệ thống chạy thông lần đầu
summary: Sau 11 lần Colima chết, thủ phạm không phải VM cũng không phải service của project mà là tổng RAM (VM 8GiB + 3 JVM + Eclipse JDT LS 2.19GB của Zed trên máy 16GB); trên macOS chỉ số đúng là `vm.swapusage`/`memory_pressure` chứ không phải `Pages free`. Phiên này cũng là lần đầu booking chạy thông end-to-end, và lộ ra ghế đã đặt trả 500 thay vì 409.
tags: [backend, system-design, debug, java, tooling]
created: 2026-08-18
updated: 2026-08-18
source: project "ticket-mcrsv" — session history 2026-08-17/18 (F1b, B7–B26, G0)
---

# Digest — ticket-mcrsv (2026-08-18)

> Chokepoint release seat (F1b) đã ghi ở [[digest-ticket-mcrsv-2026-08-17]]; rate limiter
> gateway 100 req/15 phút quyết định baseline load test ở [[digest-ticket-mcrsv-2026-08-12]].
> Đây chỉ là phần mới.

## Bugs

**Tranh ghế trả 500 INTERNAL thay vì 409 Conflict.** `seat(s) already reserved: SEAT-1` bị
bọc thành `RuntimeException` → 500. Với flash-sale thì **phần lớn request là tranh ghế**,
nên nếu tất cả đếm là lỗi 5xx thì mọi số đo p95/error-rate đều vô nghĩa. Sau fix: 409
`SEAT_CONFLICT` kèm `details.seatNumbers`, và `InvalidStateTransitionException` về 0.

**Thu tiền hai lần (B22).** Gọi hai lần cùng một ghế → 2 row booking, **cùng
`reservation_id`**, 2 payment intent. Thí nghiệm ngược (revert `.orig`) tái hiện được; sau
fix, lần gọi thứ hai trả **cùng một booking**.

**k6 đếm 5 thành công trong khi DB có 9 booking** — 4 booking thành công phía server mà
client không nhận được. Con số client-side một mình không tả đúng hệ thống.

## Techniques

**Truy nguyên nhân Colima chết thay vì restart mù.** Sau ~6 lần restart mù, điều tra tử tế
cho ra: VM **không hề tự chết** — máy 16GB, VM Colima được cấp **8GiB**, cộng 3 JVM
(~2.3GB) + Node services + Claude → macOS giết tiến trình VM khi bí bộ nhớ. Log Lima dừng
đột ngột không có thông báo lỗi, đúng dấu hiệu bị kill từ ngoài. Hạ VM xuống **5GiB** thì
ổn. Sau đó còn một thủ phạm nữa **không thuộc project**: `Eclipse JDT Language Server` của
**Zed** (`Support/Zed/extensions/work/java/jdtls`) giữ **2.19 GB** — đúng phần margin từng
thiếu; nó thoát cùng lúc Zed đóng, swap tụt 3701 → 3314 MB.

**Trên macOS `Pages free` thấp là bình thường** — chỉ số đúng để kết luận là `vm.swapusage`
+ `memory_pressure`. Tôi suýt lặp lại chính cái sai mà `BRIEF.md` đã đính chính. Đo xong:
memory free 58%, swap 710MB/2GB — **toàn hệ thống chỉ ~2.7 GB**, tức project này *không*
tốn RAM, ngược với cảm giác.

**Ghép agent theo toolchain, không theo số lượng.** Cố ý không ghép hai task Java cùng lúc
(`mvn` nặng) — ghép Java ‖ Go (`go test` nhẹ), hoặc Java ‖ frontend. Quyết định dựa trên số
đo RAM tại thời điểm nhận task, không dựa cảm giác.

**Verifier trả `UNVERIFIED` khi môi trường chết là hành vi đúng**, không phải PASS dựa trên
log cũ — theo quy tắc thì chạy lại phần bị chặn. Verifier phiên này còn tự **compile một
harness gọi thẳng `capture()` thật** trên PaymentIntent ở trạng thái sai để chứng minh code
không nuốt lỗi, và tự viết thêm test không có trong bộ của agent. Liên quan
[[2026-08-04-looptasks-verifier-doc-lap]] · [[2026-08-07-phan-tang-verifier]].

**Done-criteria phải là hành vi thật, không phải test xanh.** Với chuỗi B10/B12/B13, tiêu
chí chốt cứng trong brief là **booking thật trả 2xx**, vì đây là lỗi thứ tư liên tiếp mà
unit test xanh nhưng luồng vẫn 500. Cách đọc tiến bộ đúng: lỗi **đổi** (Invalid API Key →
`payment_intent_unexpected_state` → lỗi ở booking-service) chính là bằng chứng bản vá trước
đã ăn.

**Agent đi ngược chỉ thị vì có lý do chính đáng thì nghe nó.** Task 28: tôi bảo dùng bảng
`event_seat_availability` ("real-time"); agent đào ra bảng đó **không được ghi ở đường tạo
event qua UI** nên hướng tôi giao là sai. Tương tự, vòng 3 F1b đào sâu hơn cả yêu cầu.

## Context

- **Stripe: tên biến trong `.env` phải khớp `application.yml`.** Key hợp lệ
  (`GET /v1/balance` → 200, `livemode:false`) nhưng service vẫn `Invalid API Key` vì
  `.env` dùng `STRIPE_SECRET_KEY`/`STRIPE_PUBLISHABLE_KEY` trong khi code đọc
  `STRIPE_API_KEY`/`STRIPE_PUBLIC_KEY`. Và tiến trình đang chạy **khởi động trước khi có
  bản vá** — restart *có nạp `.env`* mới tính.
- Mock gateway (`PAYMENT_MOCK_GATEWAY`) và Stripe thật **sống song song**, không loại trừ
  nhau; chọn mock cho load test để Stripe rate-limit (~100 req/s) không thành nút cổ chai giả.
- `BRIEF.md` phình **1849 dòng** với 54 task done → tách sang `TASKS_DONE.md`, còn 517 dòng
  / 28 task. Việc bookkeeping này tự làm, không giao agent. Liên quan [[brief-state-agent-loop]].
- Zed **không bundle sẵn Java** — chẩn đoán Cursor/`.vscode/settings.json` ban đầu là vô
  dụng vì hỏi nhầm editor. Hỏi "đang dùng editor nào" trước khi chẩn đoán extension.
- Milestone: `POST /bookings` → `CONFIRMED` với row thật trong DB, lần đầu tiên trong dự án;
  smoke từ **0/55 → 51/56 (91%)**, p50/p95 = 9.24ms / 59.90ms. 68 task đóng, 48 commit.
