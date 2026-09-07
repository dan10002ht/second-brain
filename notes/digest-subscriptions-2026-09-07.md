---
type: note
title: Digest Joy Subscription — 2026-09-07 (bật lại 25 contract vừa import từ Loop)
summary: Ngày giờ trong export của Loop là giờ địa phương của shop chứ không phải UTC, còn mốc 12:00Z là do chính helper frequency của Joy đặt; và bật lại contract đã import phải gọi `updateStatus` (resume) của app rồi đọc lại trạng thái từng cái, vì shell cắt lệnh ở ~2 phút và Firestore timeout ở bước cuối trong khi contract đã resume thật.
tags: [avada, subscription, shopify, billing, debug]
created: 2026-09-07
updated: 2026-09-07
source: project `subscriptions` — session history (giai đoạn activate contract sau import Loop → Joy)
---

Nối tiếp [[digest-subscriptions-2026-08-28]] và [[digest-subscriptions-2026-09-01]]
(dựng file import từ order + transaction log) và quyết định
[[2026-08-28-import-loop-chi-contract-song-paused]]. Phần này là **chặng sau**: import xong,
37 contract nằm `PAUSED`, giờ bật lại 25 cái vốn `Active` bên Loop. Chỉ ghi phần chưa có
trong brain.

## Bugs

**Ngày giờ trong export của Loop là giờ địa phương của shop, không phải UTC.** `loopDateToIso`
của tôi đọc `04-Sep-2026 16:02:16` như UTC, trong khi Loop in giờ Thuỵ Điển (CEST = UTC+2) →
**21/22 contract lệch đúng +2.00h**. Hệ quả nhẹ vì lệch giờ không làm đổi *ngày* ở contract nào
(0/37), nhưng đây là loại lỗi chỉ lộ ra khi có một mốc thứ hai để đối chiếu — cùng cơ chế sống
sót với [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]].

**"Joy tự normalize về `12:00:00Z`" là kết luận sai của tôi hai lần.** Lần đầu tôi suy từ một
giá trị; lần hai từ mẫu 400 dòng thấy toàn tròn giờ. Trên 1500 dòng thì **1290 cái không tròn
giờ** — không có normalize nào cả. Mẫu 400 dòng là phép kiểm đo trên phạm vi không chứa
phản ví dụ, đúng họ [[phep-kiem-quan-sat-sai-tang]]. Mốc 12:00 thật đến từ chính app:
`helpers/subscription/frequency.js` (`setToSpecificDateOfWeek` và bản month/year) trả
`moment.utc([y, m, d, 12, 0, 0])`. Tức nó là **quy ước của Joy khi tự tính lịch**, không phải
hành vi của Shopify — và `billingAttemptExpectedDate` vốn là field của Shopify trên billing cycle.

## Techniques

**Bật lại contract đã import: gọi `updateStatus` (resume) của app, không ghi Firestore.**
Resume làm nhiều hơn đổi status: tính lại `nextCycleIndex`/`nextCycleDate` cuộn qua hiện tại,
ghi `originStartCycleIndex`, và tạo upcoming order. Ghi thẳng Firestore là dựng contract sống
mà thiếu lịch — đúng họ với ca 80 contract mất sạch upcoming cycle ở [[jsub-260903-upcoming-order]].
Có tiền lệ trong repo để bám khuôn: `pauseContractsByShop.js` và `activateSubscriptionTool.js`.

**Script ghi prod hàng loạt phải idempotent + tự verify từng cái, vì lệnh sẽ bị cắt giữa chừng.**
Hai kiểu đứt gặp trong cùng một phiên:
- **Shell cắt lệnh ở ~2 phút** — 22 contract × ~6s cần ~3 phút, nên phải chạy lại 4 lượt
  (`resumed: 3, skipped: 22`). Script tự bỏ qua cái đã `ACTIVE` nên chạy lại là an toàn.
- **Firestore `DEADLINE_EXCEEDED` sau 60s** ở một bước **cuối** — script dừng đúng thiết kế,
  nhưng contract **đã resume thành công** (`ACTIVE`, `updateBy: admin/resume_subscription`,
  10 upcoming order đã tạo). Nếu tin dòng log lỗi thì kết luận ngược hẳn.

Rút ra: chia lô nhỏ **không** thêm an toàn gì khi script đã dừng-khi-lỗi + verify-từng-cái —
nó chỉ thêm thao tác. Cái thật sự cần là *đọc lại trạng thái cuối từ nguồn chuẩn*
(37/37 khớp file handoff, 0 sai status), đúng [[ack-khong-phai-hieu-ung]].

**Client Shopify của app đã tự chống throttle** — 429/502/503/520 retry tối đa 5 lần, backoff
`(attempt + random) * 1000` ms. Không cần tự thêm delay ở tầng script.

## Context / gotcha

- **`Orders completed to date` của Loop có tính cả origin order.** Bằng chứng phân biệt được:
  83/102 sub lệch **đúng +1** so với transaction log, và **28 sub báo `1` mà có 0 dòng charge
  lại + `Last payment = "-"`** — cái order duy nhất đó chỉ có thể là đơn checkout đầu tiên.
  Transaction log chỉ ghi các lần Loop *charge lại*.
- **Mọi cột lạ trong CSV import đều thành custom attribute trên contract mới**
  (`extractCustomAttributes(subscription, reservedKeys)`). Nên cột thêm cho merchant đọc
  (`loop_orders_completed`, `loop_id`) không làm hỏng import, nhưng nó **có ghi lên contract thật** —
  biết trước rồi hãy thêm.
- **File export cũ 10 ngày là một nguồn "lệch ngày" giả.** Ca `32486195465` tôi suýt quy cho
  import: file ghi đúng ngày Loop báo *lúc export*, còn Loop đã bill thêm một kỳ từ đó tới lúc
  import. Trước khi truy code, kiểm tuổi của file dữ liệu.
- **Đối chiếu bảng ghép phải dựng lại bằng đường khác.** File gửi khách (`id, loop_id, status,
  orders_completed`) ghép Firestore ↔ Loop qua `email` (37 email unique). Tôi kiểm bằng cách
  dựng lại theo chiều ngược (Loop ID → email → Firestore): lệch 0/37 — và lần lệch duy nhất
  hoá ra là parser CSV inline của tôi đọc sai dấu phẩy trong ngoặc kép, không phải phép ghép sai.

## Liên quan

[[subscriptions]] · [[digest-subscriptions-2026-08-28]] · [[digest-subscriptions-2026-09-01]] ·
[[2026-08-28-import-loop-chi-contract-song-paused]] · [[jsub-260903-upcoming-order]] ·
[[ack-khong-phai-hieu-ung]] · [[bang-chung-phan-biet-duoc]] · [[feedback-khong-in-secret-ra-chat]] ·
[[phep-kiem-quan-sat-sai-tang]] · [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]]
