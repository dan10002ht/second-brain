---
type: note
title: Digest pdf 2026-08-25 — email co được là nhờ ảnh co được, và gửi mail data thật phải đi đường script
summary: Mảnh cuối làm email vừa cột preview 277px không phải min-width hay font-size mà là cột ảnh co được kiểu Joy (`width:60px` + `img{width:100%}`); hai `<td>` thật thay `inline-block` để hai cột không bao giờ rơi xuống; và muốn gửi mail bằng data store thật thì phải viết script trong `src/commands/` vì "Send test" chỉ dùng sample order.
tags: [pdf, invoice, shopify, avada, nodejs, debug]
created: 2026-08-25
updated: 2026-08-25
source: project "pdf" — session history (1 session, SB-15857 payment reminder layout, MR !529)
---

# Digest pdf — 2026-08-25

Chỉ phần **chưa có** trong [[digest-pdf-2026-08-24]], [[digest-pdf-2026-08-22]] và
[[digest-pdf-2026-08-21]]. Phần 150 dòng comment port từ mockup, padding chồng ba tầng, "chưa ai
dùng" là giả định sai, 422 là vỏ của SMTP 502, đơn B2B không có địa chỉ trên order — đã ghi, không lặp.

## Bugs / chẩn đoán

### Mảnh cuối của sàn 277px là **cột ảnh co được**, không phải min-width

Chuỗi chẩn đoán này sai hai lần rồi mới đúng, và cả hai lần sai đều là do tôi:

| Giả thuyết | Kết quả |
|---|---|
| `min-width:132/156px` giữ sàn 373px | **sai** — lane T13 gỡ hẳn khối Customer information, sàn vẫn 373 |
| font-size của mình to hơn Joy nên chiếm chỗ | **sai** — font mình đang **nhỏ hơn** Joy (20/15/14 vs 24/20/16) |
| bỏ `nowrap` + cột ảnh co được | **đúng** — 277px vừa khung, giá vẫn một dòng |

Joy khai `.Avada-Email__Product--Image { width: 60px }` nhưng `img { width: 100% }` — ở khổ hẹp cột
ảnh **co xuống ~30px** thay vì giữ cứng 60px. Bản của mình để ảnh cứng 60px nên sàn còn 311px, tràn
34px. User là người chỉ ra chỗ này ("bên kia thì giá dài thì ảnh có thể sẽ co lại ấy") — chi tiết mà
cả tôi lẫn lane đều bỏ qua vì chỉ nhìn `min-width`.

Ghi nhận thêm: bỏ `white-space:nowrap` ở dòng mã giảm giá lấy lại **61px**.

### Hai `<td>` thật thay `inline-block` + `min-width`

Khối "Order detail" hai cột của mình dựng bằng `inline-block` + `min-width`, nên ở khổ hẹp cột phải
**rơi xuống dòng**. Joy dùng hai `<td>` thật trong một `<tr>` với `width: calc((100% - 1px) / 2)` —
ô bảng thì không bao giờ rơi xuống, và không cần `min-width` nào. Sau khi đổi, file không còn
`min-width` nào; hai cột giữ nguyên ở cả 277/375/600px.

Cùng một kết luận với [[2026-08-21-line-item-email-kieu-joy]], nhưng lần này áp cho khối order
detail chứ không phải line item — tức là **quy tắc chung, không phải ca riêng**: trong HTML email,
"hai thứ phải nằm cùng hàng" là việc của `<td>`, không phải của `inline-block`.

### Font-size to hơn Joy đúng một nấc ở 5 chỗ

Sau khi đo từng chỗ (không ước lượng): 5 chỗ đang 14/15px trong khi Joy để 13px, 4 chỗ vốn đã khớp.
Hạ về 13px cho chữ phụ (giá trị dưới nhãn, dòng bảng tổng, link "View in…"); **giữ 14px** đúng hai
chỗ: nút Pay now và nội dung merchant tự soạn.

Đây cũng là chỗ tôi phải đính chính: khi user hỏi "có phải do font-size không", tôi so **tiêu đề**
rồi kết luận "không phải" — đúng cho câu hỏi về sàn bề ngang, sai cho câu hỏi về thẩm mỹ mà user
đang thật sự hỏi.

## Techniques

- **Gửi mail bằng data store thật** thì không dùng được nút "Send test" — nó lấy `sampleOrder`
  (`storage/order.json`). Đường thật: script một lần trong `src/commands/` (repo đã có quy ước sẵn),
  Firestore qua service account, khoá giải mã access token nạp từ `.env.local` **trước** khi jest
  khởi động, và **ghi cứng người nhận** trong script — đường production lấy `to = order.customer?.email`,
  chạm nhầm là không lùi lại được. Dọn file tạm ngay sau khi gửi.
- **Xác định store nằm project nào trước khi chạy script.** Cả hai service account đều trỏ project
  thật (`avada-staging`, `pdf-invoice-4717c`), không phải emulator. Store hoá ra là
  `dantt-pdf-dev.myshopify.com` — store dev của chính user, nên an toàn; nhưng điều đó phải **biết
  trước**, không phải phát hiện sau.
- **Chọn file CSS build bằng `grep -l <class>`, không bằng `ls -S`.** Chọn "file lớn nhất" nhặt nhầm
  bundle và làm tôi kết luận fix không ăn.

## Context / gotcha

- **Lane codex đứng im 0% CPU**: hai message giao việc (T14, T15) không khởi động được gì, cây làm
  việc sạch từ 17:09, không có report nào. Không đấm thêm — việc nhỏ thì tự làm.
  → [[gui-viec-cho-lane-khong-co-ack]]
- **T15 không phải một lane mới.** Tên T14/T15 chỉ tồn tại trong BRIEF của tôi; việc được gửi vào
  chính lane T13 cũ (`workspace:37`, sidebar vẫn hiển thị *"T13 fit-277"*). User hỏi "lane T15 ở
  cmux đâu" là câu hỏi đúng — đặt tên task khác tên workspace thì sidebar nói dối.
- **`morphdom` khai trong `package.json` nhưng chưa cài ở repo chính** — build assets đỏ, và đó là
  bẫy môi trường đã ghi sẵn trong BRIEF, không phải do thay đổi của mình. Verify bằng worktree có
  cài đủ. → [[brief-state-agent-loop]]
- Verifier chết giữa chừng vì hết quota tuần ⇒ T10–T13 **chưa được verify độc lập**; điều này được
  ghi thẳng vào commit message thay vì để trôi.
- Order `#1004`/`#1003` thật sự không có địa chỉ (`shipping_address: null`) vì là đơn B2B tạo tay;
  user chốt **ẩn từ tiêu đề Customer information đổ xuống** khi cả hai cột rỗng, chứ không đi tìm
  địa chỉ ở company location.

## Liên quan

[[pdf]] · [[digest-pdf-2026-08-24]] · [[digest-pdf-2026-08-22]] · [[digest-pdf-2026-08-21]] ·
[[2026-08-21-line-item-email-kieu-joy]] · [[do-be-ngang-headless-chrome]] ·
[[brief-state-agent-loop]] · [[gui-viec-cho-lane-khong-co-ack]] ·
[[feedback-comment-chi-khi-code-roi]]
