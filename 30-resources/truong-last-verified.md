---
type: resource
title: Trường `last-verified` điền hàng loạt là chứng nhận giả, tệ hơn không có trường nào
summary: Thêm `last-verified`/`verified-by` vào doc tạo ra một lời hứa mà CI chỉ kiểm được *có trường hay không*, chứ không kiểm được nó *đúng hay không* — nên điền hàng loạt biến một file chưa ai đọc thành một file "đã được xác minh", và người sau sẽ tin nó thay vì kiểm lại.
tags: [method, writing, tooling, meta, architecture]
created: 2026-08-21
updated: 2026-08-21
source: project "ticket-mcrsv" — session history 2026-08-21 (tái cấu trúc `docs/`, verifier FAIL)
---

# `last-verified` điền hàng loạt là chứng nhận giả

Bối cảnh: tái cấu trúc 64 file `docs/`, thêm front-matter phân biệt doc **living** (phải đúng
với code hiện tại) và doc **ảnh chụp quá khứ**, kèm `last-verified: YYYY-MM-DD` +
`verified-by`, và một gate CI `check-docs.sh`.

Tôi đóng dấu `last-verified: 2026-08-21` cho cả loạt file trong lúc di chuyển chúng. Verifier
lấy mẫu **3 file** mang dấu đó và tìm thấy **2 sai**. Nghĩa là dòng `verified-by` đang **hứa
nhiều hơn việc đã thật sự làm**.

## Vì sao nó tệ hơn không có trường nào

- **Không có trường** ⇒ người đọc mặc định phải nghi ngờ doc, và họ sẽ kiểm.
- **Có trường và sai** ⇒ người đọc *ngừng* kiểm. Cái sai được đóng băng lại dưới dạng "đã
  được xác minh", đúng thứ mà luật provenance của brain này tồn tại để chống.
- **Gate không cứu được.** CI kiểm được *có trường hay không*, *ngày có hợp lệ không*, *link
  có chết không* — nó **không** kiểm được nội dung có đúng với code không. Một gate xanh trên
  một trường nói dối là xanh giả ở tầng cao hơn cả xanh giả của test.

## Luật

1. **Chỉ đóng dấu file mình vừa thật sự đọc và đối chiếu với code.** Đóng dấu là một hành động
   riêng, không phải hệ quả kèm theo của việc `git mv`.
2. **Để trống là câu trả lời hợp lệ.** Kết thúc phiên còn 8 file `living` chưa ai kiểm — đó là
   sự thật, và CI báo được đúng con số đó. Con số 8 hữu ích; con số 0 giả thì không.
3. **Không lấy `verified-by` làm chỉ số tiến độ.** Nó là chỉ số *nợ*, và số nợ giảm nhanh bất
   thường là dấu hiệu ai đó đang điền hàng loạt.
4. Áp dụng nguyên si cho mọi trường cùng dạng: `status: done`, checkbox `[✅]` trong BRIEF,
   cột `%` hoàn thành trong README. Xem [[brief-state-agent-loop]].

## Liên quan

[[bang-chung-phan-biet-duoc]] · [[brief-state-agent-loop]] ·
[[digest-ticket-mcrsv-2026-08-21]] · [[2026-08-04-looptasks-verifier-doc-lap]]
