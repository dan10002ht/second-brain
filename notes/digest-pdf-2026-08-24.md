---
type: note
title: Digest pdf 2026-08-24 — comment port từ mockup, padding chồng 3 tầng, và "chưa ai dùng" là giả định sai
summary: 150 dòng comment trong file production là comment của file mockup bị port nguyên; sàn bề ngang email đến từ padding chồng ba tầng (56px/bên so với 44px của Joy); và giả định "feature này chưa ai dùng" sai với production — đếm sai hai lần vì chính phép đo của tôi.
tags: [pdf, invoice, shopify, avada, debug]
created: 2026-08-24
updated: 2026-08-24
source: project "pdf" — session history (1 session, SB-15857 payment reminder layout)
---

# Digest pdf — 2026-08-24

CHỈ phần mới. Đã ghi ở [[digest-pdf-2026-08-21]] / [[digest-pdf-2026-08-22]] và
[[2026-08-21-line-item-email-kieu-joy]]: `overflow-wrap:anywhere` ngắt giữa chữ số, sàn 373px không do
`min-width`, sàn viewport 500px của Chrome headless ([[do-be-ngang-headless-chrome]]), "Send test" dùng
sample order, 422 là vỏ của SMTP 502, đơn B2B giữ địa chỉ ở company location.

## Bugs

**Sàn bề ngang của email đến từ padding chồng ba tầng, không phải `min-width`.**
`:331` td ngoài 8×2 = 16px, `:341` card trắng 24×2 = 48px, ticket 24×2 = 48px ⇒ **56px/bên**.
Joy chỉ pad card 12px ⇒ 44px/bên. Chênh 24px là đủ để email không lọt cột preview 277px.
Đây là mảnh cuối sau khi hai chẩn đoán trước (`min-width`, font-size) đều bị số đo bác bỏ.

**Không phải font-size.** Số liệu ngược hẳn cảm giác: font của Joy (24/20/16/15/12) **to hơn** của mình
(20/15/14/13/12). Nhưng có 5 chỗ mình đang to hơn Joy đúng một nấc — hạ về 13px cho chữ phụ, giữ 14px cho
"Pay now" và nội dung merchant.

**Địa chỉ rỗng là dữ liệu thật, không phải app làm mất.** Order `#1003`/`#1004` có
`shipping_address: null` / `billing_address: null` — đơn B2B tạo tay không nhập địa chỉ; `orderParse.service.js`
không hề đụng tới địa chỉ. Chốt: cột nào rỗng thì không vẽ, và ẩn cả khối từ tiêu đề **Customer information**
đổ xuống khi không có địa chỉ nào (`162516813`).

**Giả định "feature này chưa ai dùng" sai với production** — đếm thật ra đúng 2 shop đã có doc
`paymentReminder`. Và tôi đếm sai **hai lần** vì phép đo của chính mình:
1. cột "có đặt màu/customCss" tôi chỉ kiểm *khác rỗng*, mà **giá trị mặc định cũng khác rỗng** ⇒ chỉ số vô nghĩa;
2. mảng `diff` dựng từ `Object.entries(DEF)` nên in ra **giá trị mặc định** chứ không phải giá trị đang lưu.
⇒ Trước khi ghi vào dữ liệu thật của khách hàng loạt, con số "bao nhiêu shop bị ảnh hưởng" phải chứng minh
được nó phân biệt được *đã lưu* với *đang ăn default* — đúng cái test của [[bang-chung-phan-biet-duoc]].

## Techniques

**Comment thừa vì port nguyên file spec sang production.** `mockup-app/src/utils/buildReminderEmail.js` là file
spec — comment ghi từng quyết định và cả phương án bị loại, đúng chỗ. Khi lane bê layout sang
`buildReminderEmailHtml.js` thì comment đi theo: 150/446 dòng = **33%**. Bài học cho lần sau khi port từ mockup:
comment của spec ở lại spec. Xem [[feedback-comment-chi-khi-code-roi]].

**Gửi mail thật với data thật mà không có rủi ro gửi nhầm khách**: đường gửi thật lấy
`to = order.customer?.email` — tuyệt đối không chạm; thay vào đó dựng script một lần trong `src/commands/`
với **người nhận ghi cứng**, nạp SMTP + `ACCESS_TOKEN_KEY` từ `.env.local` qua env của lệnh (không echo),
rồi xoá file tạm ngay sau khi gửi. Cùng tinh thần [[chan-agent-bang-cau-hinh]] và
[[feedback-khong-in-secret-ra-chat]].

**Đo layout trên HTML còn merge tag = đo sai.** `{{order.total_outstanding}}` là chuỗi 27 ký tự không có dấu
cách nên nó tự giữ bề ngang; harness của tôi báo 383.75px ở cả 277 lẫn 375. Phải render bản đã thay hết merge
tag (kiểm `0 merge tag còn sót`) rồi mới đo.

**Chọn file CSS build theo "lớn nhất" là chọn nhầm.** `ls -S` ra `index-ot7wnwZm.css` trong khi rule nằm ở
`index-CmiliOTa.css` ⇒ kết luận "fix không ăn" sai. Chọn bằng `grep -l <class>`.

## Context

- Verifier FAIL hai lần đều là **artefact chia nhánh**, không phải lỗi lane (phân loại FAIL trước khi giao
  lại: [[cham-viec-agent-nen]]): nhánh T1 không có commit của T2/T3
  nên verifier tái hiện được `<span>` rỗng / "mail thật không bao giờ hiện Overdue". Cách xử: hợp nhất nhánh
  vào worktree rồi verify lại, đừng giao lại cho lane.
- Verifier chết giữa chừng vì hết quota tuần ⇒ T10–T13 **chưa được verify độc lập**; đã ghi thẳng vào commit message.
- Không có lane "T15" nào — việc mới được gửi vào chính lane T13 cũ; và lane đứng im 0% CPU nghĩa là nó
  **không nhận được lệnh**, không phải đang nghĩ.
- `getForShop` merge **nông theo từng sub-object** (`theme: {...default, ...saved}`) nên shop đã lưu theme cũ
  không bao giờ ăn default mới — đó là lý do phải có nút DevZone reset, không phải deploy là xong.

Project: [[pdf]]. Nối tiếp [[shipped-pdf-2026-08-22]].
