---
type: note
title: Digest ticket-mcrsv 2026-08-30 — verdict tiêu đề nói khác thân bài, hit-target cắt bằng clipPath
summary: Một verifier trả PASS ở dòng tiêu đề nhưng FAIL ở một trong ba kết luận nó tự chấm, nên verdict phải đọc theo từng kết luận chứ không đọc dòng đầu; và ba vùng chạm 44px chồng nhau giải được bằng `clipPath` phân vùng thay vì thu vùng chạm theo zoom.
tags: [agent, method, debug, react]
created: 2026-08-30
updated: 2026-08-30
source: project `ticket-mcrsv` — session history 2026-08-30 (3 task FE F21/F22/F23 qua `/looptasksv2` với `BRIEF-FRONTEND.md`)
---

Nối tiếp [[digest-ticket-mcrsv-2026-08-28]]. **Chỉ phần mới** — phần Chrome CDP chết lây, rác
`.next/dev/types` làm `tsc` đỏ giả, verifier chạy `git checkout --` và bảng đo trên fixture rỗng
đều đã ghi ở digest 08-28.

## Techniques

**Verdict của verifier phải đọc theo từng kết luận, không đọc dòng tiêu đề.** Verifier F22 in
`PASS` ở dòng đầu nhưng thân bài chấm riêng ba kết luận: C1 PASS, C2 PASS, **C3 FAIL** — và C3
mới là cái đáng giá (bảng "không route nào tràn" đo trên event rỗng). Nếu tôi dừng ở dòng tiêu đề
thì đã merge một kết luận sai. Cách làm đúng khi giao verifier cho một task *điều tra nhiều câu
hỏi*: bắt nó chấm **từng câu một**, và ở vòng sửa thì gửi lại **chính verifier cũ** để nó giữ
context C1/C2 và chỉ chấm lại C3.

**Vùng chạm chồng nhau: cắt bằng `clipPath` thay vì thu theo zoom.** Ba handle resize mỗi cái có
vùng chạm 44px (ngưỡng a11y) trên một block nhỏ thì chúng chồng lên nhau — hướng trực giác là đo
zoom rồi thu vùng chạm lại, nhưng như vậy vùng chạm co theo mức zoom và mất luôn 44px. Lane giải
bằng `clipPath` cắt ba hit-target vào ba vùng rời nhau của cùng một block: **rời nhau theo cấu
trúc**, đúng cả với block cực dẹt/hẹp và toạ độ âm — không phụ thuộc phép đo nào.

## Context / gotcha

- **Con số trong prompt của user cũng là số cũ.** Prompt cảnh báo "frontend đang có 29 problem
  eslint tồn tại sẵn, đỏ vì mấy cái đó không phải lỗi của lane"; đo baseline thật trước khi
  dispatch ra **2 problem** (task H75 đã dọn phần lớn). Nếu tin con số đó thì mọi lint error mới
  của lane đều được tha. Cùng bệnh với [[brief-state-agent-loop]], chỉ khác là nguồn số cũ nằm
  trong lời dặn chứ không trong `BRIEF.md`.
- **Task điều tra có thể đóng mà không commit gì vào `main`.** F22 kết luận không phải bug code
  → PASS, không commit; probe của nó cũng không được đưa lên vì truyền password qua `argv` và
  hardcode gateway URL. Kết quả của một task là **câu trả lời**, không nhất thiết là diff.
- F21 hạ `venue-canvas.tsx` **300 → 242 dòng** bằng cách tách phần toán (zoom/pan/kẹp biên) ra
  module thuần — phần "tự chạy module thật với input thật" của tôi khớp đúng thí nghiệm đã đo
  trước đó (neo lệch tâm giữ nguyên qua pinch 2×, kẹp biên 3 / 0.5).

## Liên quan

[[digest-ticket-mcrsv-2026-08-28]] · [[bang-chung-phan-biet-duoc]] · [[cham-viec-agent-nen]] ·
[[brief-state-agent-loop]] · [[feedback-ui-component-300-dong-atomic]] ·
[[2026-08-27-he-thi-giac-chong-ai-slop]]
