---
type: note
title: ticket-mcrsv — flow looptasksv2 (codex implement / Claude verify) chạy trọn ngày
summary: Lane codex chỉ chạy được với bản npm `@openai/codex` chứ không phải bản trong ChatGPT.app, sidebar cmux liệt kê workspace chứ không phải pane, watcher nền bị kill nên chính nhịp cron 5 phút mới là đồng hồ đáng tin; và bẫy suy luận đắt nhất của repo lặp lại lần thứ ba — "trạng thái X nghĩa là Y chưa xảy ra".
tags: [debug, skills, tooling, backend, java]
created: 2026-08-20
updated: 2026-08-20
source: project "ticket-mcrsv" — session history 2026-08-19→2026-08-20 (sessions b96566e9, 2a4d2395, b2d5c1b1, 6315823e)
---

# ticket-mcrsv — một ngày chạy `/looptasksv2`

Flow user chốt: **Opus orchestrate · codex (`gpt-5.6-sol`) implement · verifier Claude
chấm** — khác nhà mô hình giữa người viết và người chấm, mở rộng
[[2026-08-04-looptasks-verifier-doc-lap]]. 6 task đóng, đều merge thẳng `main`
(repo này cho phép, khác các repo Avada).

## Bugs — code

- **Task 114 (`IdempotencyKey` mồ côi trên đường replay)**: bảng trạng thái **tôi tự chốt**
  mới là chỗ sai, không phải lane. `Refund` khác `Payment`: `markAsSuccess` chỉ chạy ở
  **webhook async** (`RefundService.java:199`) nên một refund gateway đã nhận vẫn nằm ở
  `PENDING`. Disambiguator đúng là `PENDING && providerReference != null`. Verifier FAIL
  hai vòng, vòng thứ ba mới qua — và cả hai lần FAIL đều chỉ vào giả định của tôi.
- **Task 115**: `verifyRequestFingerprint` phải đứng **trước** `isCompleted()`,
  `isProcessing()` và `updateExistingKey` — vì chính `updateExistingKey` **ghi đè**
  `requestBody`, đặt sau là mất luôn thứ cần so.
- **Task 117 `[P0]`**: `Booking.cancel()` set `CANCELLED` + `paymentStatus = FAILED`
  **không guard trạng thái nào** ⇒ nói dối khi tiền đã capture, và không trả ghế, không gỡ
  tiền. Cách sửa: **xoá hẳn** method đó, `cancelBooking` bỏ `@Transactional` (đọc DB ngắn →
  I/O mạng → ghi DB ngắn), mọi quyết định gom vào **một** class `CancellationPolicy.decide()`
  — vá lỗ ngay hôm nay bằng default an toàn (đã capture ⇒ REFUSE), nhưng để sẵn đúng một
  điểm móc cho task 120 (policy cấu hình theo bên bán vé) không phải viết lại.
- **Task 116**: nhánh "chưa xác định" của reconcile chỉ `log` + `metric`, **không ghi DB** —
  cố ý, để `updated_at` giữ nguyên và tick sau nhặt lại.
- **Bẫy suy luận lặp lần thứ ba**: *"trạng thái X nghĩa là Y chưa xảy ra"* — sai ở task 114
  và 111. Câu phải hỏi mỗi lần: **có cửa sổ nào việc đã xảy ra thật mà trạng thái chưa được
  ghi không?** Cùng họ với [[bang-chung-phan-biet-duoc]].

## Techniques — hạ tầng lane

- **`codex` trong bundle của ChatGPT.app không dùng được cho lane** (`0.148.0-alpha.15`,
  không có trên PATH). Bản npm `@openai/codex` `0.148.0` thì chạy. Sau khi gỡ ChatGPT.app,
  `pgrep -x codex` **vẫn ra 3** — phép kiểm đó không chứng minh gì.
- **Sidebar cmux liệt kê *workspace*, `cmux new-split` chỉ tạo *pane*** bên trong workspace
  "Terminal" đang có ⇒ lane không thành mục riêng. Đây là lỗi trong công thức của skill,
  đã sửa.
- **Hook store không sinh vì `CMUX_SURFACE_ID` rỗng trong pane.** Đối chứng A/B: file
  marker (lane ghi `report-T<id>.md`) **thắng** hook store — ít phụ thuộc, quan sát được.
- **Watcher nền bị kill hai lần liên tiếp** (không phải tự thoát). Bỏ watcher, dựa vào
  chính nhịp cron 5 phút của loop — và đúng lượt cron kế tiếp bắt được report.
- **Probe pane trước khi dispatch.** TUI codex còn mở từ lần trước sẽ **nuốt lệnh thành
  prompt**; ngược lại, tiêu đề cửa sổ đổi thành `[tmux]` **không** có nghĩa TUI đã thoát —
  tôi kết luận sai chuyện đó một lần rồi phải rút lại. Menu *"Our systems are thinking a bit
  more…"* là loại tự đóng, đừng gửi phím vào.
- `model_context_window = 872000` cho `gpt-5.6-sol` (codex tự khai `max_context_window`,
  **không phải 1M**); xác nhận tên key bằng `--strict-config` trước khi ghi
  `~/.codex/config.toml`.
- Đo tải trước mỗi lượt: swap 12.2/13.3 GB ⇒ **1 lane**. Hai Testcontainers Postgres song
  song ở mức đó đã làm sập Colima hai lần.
- macOS: `find -newermt` không có → dùng `stat -f '%Sm' -t '%H:%M'` để xem lane còn sửa file.

## Techniques — kỷ luật verify

- **Verifier chạy `git checkout --` xoá mất việc chưa commit của lane** (lần thứ hai trong
  hai ngày, xem [[digest-ticket-mcrsv-2026-08-19]]). Nó tự khôi phục bằng `git apply` —
  **tôi không nhận lời nó**, mà diff lại với patch trước khi verify, khớp đúng
  8 file / `351+/66-`. Fix: cấm tường minh `git checkout --` / `git restore` / `git stash`
  trong **mọi** brief verifier sau đó, kèm yêu cầu `cp` backup trước khi mutate.
  **Có tác dụng** — verifier task 115 chuyển sang mutate bằng Python + bản `cp` tự lưu.
  Bổ sung cho [[2026-08-14-verifier-va-agent-mutation-tach-doi]].
- **Mục "của tôi, không uỷ quyền"** (6.1 #4) bắt được một lỗ mà gate không bắt: ở task 113,
  nhánh replay nằm **sau** `validateRefundAmount` — verifier vòng 1 PASS, nhưng thí nghiệm
  ngược của chính nó lại vô tình xác nhận đúng lỗ tôi tìm ra bằng tay.
- **Dán sẵn `gate-T<id>.sh` + `diff-T<id>.patch` cho verifier** (gồm cả nội dung file
  untracked) — verify nhanh hơn hẳn và không phải dò lại môi trường.
- **Lane phản bác được mô tả task, và nhiều lần nó đúng.** Task 111: lane chứng minh bằng
  `StripeGatewayAdapter.java:116-117` (`CaptureMethod.AUTOMATIC` + `setConfirm(true)`) rằng
  giả định loại trừ của tôi sai; giải trình được ghi thẳng vào javadoc chứ không chỉ nằm
  trong report.
- Đối chiếu số: lane khai baseline 63 + 2 test mới, kết quả không ra 65 ⇒ soi ngay thay vì
  nhận. Baseline trong brief bị cũ một lần (71 vs 76 thật) — brief cũng thối như
  [[brief-state-agent-loop]] đã ghi.

## Context

- Baseline dịch trong ngày: `booking-service` 168 → 175 → **201**;
  `payment-service` 78 → 82 → **90**.
- Khảo sát backend (Explore rồi **tự verify lại** bằng cách grep consumer của
  `BookingCancelled` — chỉ có email-worker + một hằng realtime) đổi hẳn hướng dự án từ
  "hết task" thành 4 task mới `117`–`120`. Tôi cũng **tự sửa lời khuyên của mình**: ban đầu
  đề xuất viết E2E kịch bản trước, sau khi thấy 3 lỗ nghiệp vụ thật thì viết E2E trước sẽ
  *"codify hành vi sai"* — bịt lỗ trước.
- Còn mở: `118` đã đóng cuối ngày; `119` (`PAYMENT_FAILED` không reconciler nào quét —
  phải mở rộng `BookingPaymentReconcileService` đã có 5 nhánh, **không** dựng service thứ
  ba, và phải release ghế lặp lại được), `120` (policy huỷ cấu hình theo bên bán vé —
  câu dễ sót: booking đặt trước khi đổi policy thì theo bản nào; snapshot-at-booking là
  hướng nhiều khả năng đúng nhưng chưa xác minh).
- `--notrack` không phải flag của Claude Code mà của wrapper `cc` trong `~/.zshrc`;
  cmux dùng shell non-interactive nên PATH phải đặt ở `~/.zshenv`, không phải `~/.zshrc`.

Liên quan: [[digest-ticket-mcrsv-2026-08-19]] · [[looptasks-vs-workflow]] ·
[[brief-state-agent-loop]] · [[2026-08-04-looptasks-verifier-doc-lap]]
