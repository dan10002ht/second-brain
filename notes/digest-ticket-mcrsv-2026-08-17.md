---
type: note
title: Digest ticket-mcrsv 2026-08-17 — chokepoint thay vì quét-rồi-vá
summary: Vá cơ học từng call site chỗ rò seat sẽ đổi lỗ rò lấy oversell vì script Lua release trả toàn bộ seat rồi DEL hold; lời giải là một chokepoint duy nhất kèm test guard chặn call site mới.
tags: [system-design, redis, backend, patterns, debug]
created: 2026-08-17
updated: 2026-08-17
source: project "ticket-mcrsv" session history
---

# Digest ticket-mcrsv — 2026-08-17

Vòng 3 của task F1b ở `~/projects/ticket-mcrsv` (2 vòng verifier trước đều FAIL).
Yêu cầu nguyên văn của user: *"sửa sao cho best practice, ko sửa chỉ để cho chạy được,
cần phải phù hợp với business logic"* — đúng tinh thần [[feedback-fix-tan-goc]].

## Bugs

**Vá cơ học đổi lỗ rò lấy oversell.** `release_hold.lua` trả về **TOÀN BỘ** `seat_ids`
rồi `DEL` cả hold. Nên nếu vá thẳng vào `RemoveSeatFromSession` (bỏ một ghế) thì nó nhả
hết ghế của session — hết rò seat, nhưng oversell. Ca "bỏ một ghế" cần script riêng ở
tầng Redis, không phải guard ở tầng Go.

**Vòng đời hold không khép**: `ConfirmHold` có **zero call site** — hàm tồn tại mà chưa
ai gọi, tức nhánh xác nhận chưa bao giờ chạy.

**`IsReserved()` gộp luôn điều kiện not-expired** → các sweep dọn hạn sẽ **im lặng
no-op** (chúng hỏi "còn reserved không?" và luôn nhận false). Phải tách hai khái niệm
"đang giữ" và "chưa hết hạn".

## Techniques

- **Chokepoint > quét-rồi-vá**: gom 4 đường release về một điểm duy nhất rồi viết
  **enforcement guard test** — test tự grep source, fail và **chỉ đích danh file + dòng +
  bản thay thế** khi có call site mới đi vòng qua chokepoint. Đây là thứ giữ fix sống
  sau khi mình rời đi; cùng họ với [[gate-quet-ma-nguon-bang-ast]].
- **Thí nghiệm ngược** để chứng minh test thật sự bắt lỗi: phá code → xem test đỏ →
  `cp`/khôi phục. Verifier độc lập PASS **ngay vòng 1** và tự chạy lại toàn bộ số đo +
  tự làm 2 thí nghiệm ngược thay vì tin báo cáo. Xem [[2026-08-14-verifier-va-agent-mutation-tach-doi]].
- Token hold dạng `{bookingSessionID}:{zoneID}` giữ được nghĩa mà **không cần migration**
  — một quyết định của vòng 2 vẫn đứng vững, không làm lại từ đầu.
- Gate hai chế độ tách bạch: `no-infra 75 PASS/0 FAIL/15 SKIP`, `real-infra 90/0/0` —
  con số SKIP là một phần của gate, không phải nhiễu.

Liên quan: [[digest-ticket-mcrsv-2026-08-14]] · [[2026-08-12-va-triet-de-saga-ticket]] ·
[[bang-chung-phan-biet-duoc]]
