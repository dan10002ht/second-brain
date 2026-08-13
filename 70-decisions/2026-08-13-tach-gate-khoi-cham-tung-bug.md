---
type: decision
title: Tách "chạy gate" khỏi "chấm từng bug" trong /looptasks
summary: Khi một task sửa nhiều bug, chạy gate MỘT lần cho cả cụm rồi để mỗi verifier chỉ chấm phần bug của mình, thay vì mỗi verifier chạy lại nguyên gate.
tags: [skills, tooling, method, avada, pdf]
created: 2026-08-13
updated: 2026-08-13
status: active
review: 2026-11-13
source: project "pdf" — session history (a2d7c194, SB-15496/15545/15554)
---

# Tách "chạy gate" khỏi "chấm từng bug"

Từ nay trong `/looptasks`, khi một task chứa nhiều bug độc lập:

1. Chạy **gate một lần** cho cả cụm thay đổi (build + jest + lint), lấy output làm
   bằng chứng dùng chung.
2. Mỗi `verifier` nhận output đó + đúng phần bug của mình, và chỉ làm phần **chấm**:
   thí nghiệm ngược, soi finding, đọc diff. Không chạy lại toàn bộ gate.
3. Vai trò độc lập giữ nguyên: context sạch, không Edit/Write, vẫn trả
   PASS/FAIL/UNVERIFIED.

Bổ sung cho [[2026-08-07-phan-tang-verifier]] và
[[2026-08-04-looptasks-verifier-doc-lap]].

## Why

Số thật của ngày 2026-08-13: một lượt verifier mất **13–16 phút**, trong đó phần lớn
là chờ máy (build `@avada/assets` 2 lần + jest full suite), không phải chờ model.
Hôm đó chạy **6 lượt** cho 3 bug. Gate tốn **như nhau** bất kể sửa 1 bug hay 5 bug —
để mỗi verifier chạy lại nguyên gate là nhân bản một chi phí cố định một cách vô
nghĩa. User nói thẳng: *"giả sử fix nhiều bug trong 1 task vậy mà verifier lên tới cả
tiếng như vậy ko ổn"* — và điểm đó đúng: chi phí verify đang tăng **tuyến tính theo
số bug** trong khi nó không cần phải thế.

Không bỏ verifier: chính hôm đó nó bắt được 2 lỗi thật mà agent khai là xong (thiếu
key i18n ở `origin.json`, khối gate ghi sai baseline).

## Tradeoff

- **Được:** thời gian verify của một task nhiều bug gần như phẳng thay vì nhân lên;
  vòng sửa nhỏ không còn phải trả giá gate đầy đủ.
- **Mất:** verifier thứ hai trở đi **không tự chạy gate**, nên nó tin vào output do
  bên khác chạy. Nếu vòng sửa của bug A làm hỏng bug B thì gate chung phải được chạy
  **lại sau vòng sửa cuối** — bỏ bước đó là mở đúng cái lỗ mà verifier sinh ra để bịt.
- **Rủi ro thật:** bên chạy gate là bên điều phối, tức là bên đã spawn agent viết
  code. Đây vẫn là tự-chấm ở tầng *bằng chứng*, dù verdict vẫn độc lập.

## Review 2026-11-13

Câu hỏi: có bug nào lọt vì verifier tin gate của người khác không? Có → quay lại mỗi
verifier chạy gate riêng cho task đụng file dùng chung.

→ [[digest-pdf-2026-08-13]] · [[looptasks-vs-workflow]]
