---
type: note
title: Digest pdf 2026-08-28 — thước đo hỏng ba lần trong cùng một task email
summary: Ba lần tôi kết luận sai về email payment reminder đều do phép đo của chính tôi chứ không do code — HTML còn merge tag chưa thay, file CSS chọn theo kích thước, và bề ngang đo trong iframe; kèm cụm gotcha khi giao việc cho lane codex.
tags: [pdf, invoice, debug, agent]
created: 2026-08-28
updated: 2026-08-28
source: project `pdf` — session history 2026-08-28 (SB-15857, MR !529)
---

Phần lớn task này đã ghi ở [[digest-pdf-2026-08-21]] · [[digest-pdf-2026-08-22]] ·
[[digest-pdf-2026-08-24]] · [[digest-pdf-2026-08-25]] · [[digest-pdf-2026-08-27]].
Đây chỉ là phần **về cách đo và cách giao việc** chưa ghi ở đâu.

## Bugs (của phép đo, không của code)

**HTML còn merge tag chưa thay thì không đo được bề ngang.** `{{order.total_outstanding}}` là một
token **27 ký tự không có dấu ngắt** — nó tự trở thành sàn bề ngang. Tôi đo ra 383.75px ở cả 277
lẫn 375 rồi định báo lane sai; render lại với merge tag đã thay thì số của tôi khớp lane, và
320px cũng vừa. Trước khi tin một phép đo layout: đếm merge tag còn sót = 0.

**Chọn file CSS build bằng `ls -S` (lớn nhất) là nhặt nhầm bundle.** Tôi lấy
`index-ot7wnwZm.css` trong khi rule nằm ở `index-CmiliOTa.css`, rồi kết luận fix của lane không
ăn. Chọn bằng `grep -l <class>` mới đúng.

**Thước hỏng theo hai kiểu khác nhau trong cùng một buổi**: `documentElement.scrollWidth` lấy
theo cửa sổ 900px chứ không theo body; và trong iframe thì `scrollWidth` bị kẹp về đúng bề ngang
iframe nên **không bao giờ báo tràn**. Cùng họ với [[do-be-ngang-headless-chrome]] — phải đo bảng
ngoài cùng, hoặc ép `<body style="width:375px">` rồi chụp và nhìn.

## Techniques

- Kiểm test của chính mình trước khi kiểm code: test đếm "3 khai báo trong source" trong khi HTML
  render lặp thành 11 — con số không sai, đơn vị sai.
- Commit message có backtick trong `-m` bị **shell thực thi** (`command not found: revert`) và gửi
  đi bản khuyết chữ. Dùng `git commit -F -` + heredoc, rồi `--force-with-lease`.

## Context

- **Lane codex tự tụt model giữa chừng** (`gpt-5.6-sol xhigh` → `gpt-5.6-luna low`) và tự khai
  "không thể chuyển model giữa chừng". Phải `ctrl+c` hai lần rồi relaunch bằng
  `-m gpt-5.6-sol -c model_reasoning_effort=xhigh`, và **đọc lại dòng model in ra** để xác nhận.
  Bổ sung cho [[gui-viec-cho-lane-khong-co-ack]].
- Một FAIL của verifier có thể là **artefact chia nhánh**: nhánh T1 không có commit của T2 nên
  verifier thấy `<span>` rỗng và "mất download link" — cả hai đều không tồn tại trên trạng thái hợp
  nhất. Hai lần trong một phiên. Trước khi giao lại vòng sửa, kiểm finding trên nhánh hợp nhất.
- Feature payment reminder **đã có shop dùng thật trên production** (2 shop có doc
  `paymentReminder`), ngược với giả định "chưa ai dùng" — và tôi đếm sai hai lần vì chính script
  đếm của mình in ra giá trị mặc định thay vì giá trị đang lưu. Cùng bài học với
  [[digest-pdf-2026-08-24]].

## Liên quan

[[pdf]] · [[bang-chung-phan-biet-duoc]] · [[gate-tu-viet-la-nguon-xanh-gia]] ·
[[cham-viec-agent-nen]] · [[do-be-ngang-headless-chrome]] ·
[[2026-08-21-line-item-email-kieu-joy]]
