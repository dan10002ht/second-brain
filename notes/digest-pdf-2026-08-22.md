---
type: note
title: Digest PDF Invoice — 2026-08-22 (payment reminder email layout SB-15857)
summary: Email co được xuống 277px nhờ bỏ nowrap + cột ảnh co được (không phải min-width như đã chẩn đoán); "Send test" dùng sample order chứ không phải data thật; 422 chỉ là vỏ của lỗi SMTP 502; và đơn B2B không có địa chỉ trên order mà ở company location.
tags: [pdf, invoice, shopify, debug, avada]
created: 2026-08-22
updated: 2026-08-22
source: project "pdf" — session history (`/looptasksv2` SB-15857 + DevZone reset)
---

Nối tiếp [[digest-pdf-2026-08-21]] — chỉ ghi phần **mới** so với note đó.

## Bugs

**Sàn 373px không đến từ `min-width` — chẩn đoán cũ sai hai lần.**
Lane T13 chứng minh bằng thí nghiệm cô lập: bỏ hẳn khối *Customer information* → bảng **vẫn 373px**; bỏ line item → còn 289; cho `nowrap` được ngắt → còn 311; bỏ cả hai → đúng 277. Hai thủ phạm thật là **line item kiểu Joy** và `white-space:nowrap` trên các số tiền. Trước đó tôi cộng số học (`156×2 + padding = 376 ≈ 373`) rồi coi đó là bằng chứng — đó là pattern-matching, không phải thí nghiệm.

**Cột ảnh cứng `60px` mới là thứ giữ sàn cuối cùng.** Joy dùng `width:60px` trên `<td>` nhưng `img{width:100%}` nên ô ảnh **co được** khi khung hẹp; bản của mình để ảnh cứng nên ở 277px tràn 34px. Bỏ `nowrap` ở dòng mã giảm giá lấy lại **61px**, cộng cột ảnh co được thì đủ. → khớp đúng quyết định [[2026-08-21-line-item-email-kieu-joy]].

**Padding chồng ba tầng.** `td` ngoài 8×2 + card 24×2 + ticket 24×2 = **112px/hai bên**, trong khi Joy chỉ 88px (card pad 12 chứ không phải 24). Ở khổ 277px thì 24px chênh lệch là quyết định.

**Font đang to hơn Joy đúng một nấc ở 5 chỗ** (14 vs 13, 15 vs 14). Khi user hỏi "có phải do font-size không", tôi so **tiêu đề** (Joy 24/20/16 vs ta 20/15/14) rồi kết luận "không phải" — so nhầm nhóm; chữ phụ mới là chỗ lệch.

**Hai `<td>` thật ≠ `inline-block` + `min-width`.** Ô bảng không bao giờ rơi xuống; `inline-block` thì rơi. Joy dùng `width: calc((100% - 1px) / 2)` cho hai cột chi tiết — phần trăm cứng, không `min-width` nào.

**`422` chỉ là cái vỏ.** Nút *Send test* trả 422 nhưng schema validate PASS với payload thật; lỗi thật nằm sâu hơn: nodemailer `Invalid status code 502`. Đừng dừng ở HTTP status của chính endpoint mình.

**Đơn B2B không có địa chỉ trên order.** `#1003`/`#1004` có `shipping_address: null` và `billing_address: null` **thật** (Shopify trả vậy), vì `purchasing_entity: PurchasingCompany` — địa chỉ nằm ở **company location** (`companyQuery.js` đã có sẵn `billingAddress`/`shippingAddress`). `orderParse.service.js` không đụng gì tới địa chỉ, nên null không phải app làm mất.

## Techniques

**"Send test" ≠ data thật.** Nút Send test dùng `sampleOrder` (`storage/order.json`). Muốn gửi bằng dữ liệu store thật phải viết script một lần trong `src/commands/` với **người nhận ghi cứng** — đường gửi thật lấy `to = order.customer?.email`, chạm nhầm là gửi cho khách thật, không lùi được.

**Merge tag chưa thay làm hỏng phép đo bề ngang.** `{{order.total_outstanding}}` là token 27 ký tự không có chỗ ngắt, nên HTML render còn merge tag đo ra rộng hơn thật. Render **bản cuối đã thay tag** rồi mới đo.

**Đo "tràn hay không" bằng đúng đối tượng.** `documentElement.scrollWidth` lấy theo cửa sổ (900px) chứ không theo body; `scrollWidth` trong iframe bị kẹp về bề ngang iframe. Thước đúng là **bề ngang bảng ngoài cùng**. → đã khái quát ở [[do-be-ngang-headless-chrome]].

**Chọn file CSS build bằng "lớn nhất" là sai** — `ls -S` nhặt nhầm `index-ot7wnwZm.css` trong khi rule nằm ở `index-CmiliOTa.css`, làm tôi kết luận fix không ăn. Chọn bằng `grep -l <class>`.

**Verifier FAIL giả do cô lập nhánh.** T1 và T4 đều bị verifier trả FAIL vì nhánh của lane base trên nhánh khác nên **thiếu commit của lane trước** — verifier nhìn thấy trạng thái không tồn tại ở đâu cả. Kiểm bằng `git show <branch>:<file> | grep ...` trên nhánh **hợp nhất** trước khi giao lại cho lane. Cả hai lần đều là artefact chia nhánh, không phải lỗi code.

## Context

- Lane codex **tự tụt model** giữa chừng (`gpt-5.6-sol xhigh` → `gpt-5.6-luna low`) và báo "không thể chuyển model giữa chừng"; xử lý: `ctrl+c` hai lần rồi relaunch với `-m gpt-5.6-sol -c model_reasoning_effort=xhigh`, sau đó **đọc lại dòng model in ra** để xác nhận.
- Paste dài qua `cmux send` bị kẹt trong ô nhập (`› Vò[Pasted Content 2012 chars]`), Enter bị nuốt. Cách chắc: ghi chỉ thị ra file (`.lanes/round2-*.md`) rồi gửi một câu ngắn trỏ vào file đó.
- "Lane T15" không tồn tại — tôi gửi việc mới vào **chính lane T13 cũ**; tên T14/T15 chỉ là nhãn trong đầu tôi, sidebar cmux vẫn hiển thị "T13 fit-277". Đặt tên lane trong ghi chép mà không dựng lane thật là nguồn nhầm lẫn cho cả user lẫn chính mình.
- Verifier chết giữa chừng vì **hết quota tuần** (reset 16:00 giờ VN) → T10–T13 commit với ghi chú "chưa verify độc lập" ngay trong commit message.
- Server mockup `localhost:3200` chết vì tôi gỡ chính worktree nó đang chạy từ đó.
- Giả định "tính năng này chưa ai dùng" **sai với production**: đúng 2 shop đã có doc `paymentReminder` ⇒ reset hàng loạt là ghi vào dữ liệu thật của khách. Và chỉ số "có đặt màu/customCss" tôi in ra lúc đầu vô nghĩa — tôi dựng mảng diff từ `Object.entries(DEF)` nên in ra **giá trị mặc định** chứ không phải giá trị đang lưu.
- Comment trong `buildReminderEmailHtml.js` chiếm **150/446 dòng (33%)** vì port nguyên từ file spec `mockup-app/src/utils/buildReminderEmail.js` — file đó cố ý giải thích mọi lựa chọn, production thì không cần. → [[feedback-comment-chi-khi-code-roi]]
- MR **!529** `feature/payment-reminder-layout` → `master`, gộp dần tới 9+ commit; nhánh `feature/devzone-reset-reminder` chứa cả layout mới lẫn nút DevZone reset.

Liên quan: [[pdf]] · [[digest-pdf-2026-08-21]] · [[shipped-pdf-2026-08-22]] · [[2026-08-21-line-item-email-kieu-joy]] · [[do-be-ngang-headless-chrome]] · [[bang-chung-phan-biet-duoc]] · [[gate-tu-viet-la-nguon-xanh-gia]] · [[feedback-comment-chi-khi-code-roi]]
