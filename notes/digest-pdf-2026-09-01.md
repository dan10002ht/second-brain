---
type: note
title: Digest PDF Invoice — 2026-09-01
summary: Verifier FAIL giả vì worktree của lane thiếu commit của nhánh chị em; "không phải font-size" là kết luận sai do so nhầm tiêu đề thay vì so từng chỗ; và cách tìm thứ giữ sàn bề ngang là gỡ từng khối rồi đo, không phải cộng số học.
tags: [pdf, invoice, shopify, debug]
created: 2026-09-01
updated: 2026-09-01
source: project `pdf` — session history (SB-15857 payment reminder layout, MR !529)
---

CHỈ phần mới so với [[digest-pdf-2026-08-28]], [[digest-pdf-2026-08-27]], [[digest-pdf-2026-08-25]],
[[digest-pdf-2026-08-24]]. Những thứ đã ghi ở đó (email co xuống 277px nhờ cột ảnh co được,
hai `<td>` thật thay `inline-block`, padding chồng ba tầng, 150 dòng comment port từ mockup,
"Send test" dùng sample order, 422 là vỏ của SMTP 502, đơn B2B giữ địa chỉ ở company location,
merge tag chưa thay làm phép đo sai, `getForShop` merge nông theo sub-object) không lặp lại.

## Bugs

**Verifier trả FAIL giả vì worktree của lane không chứa commit của nhánh chị em.**
Verifier T1 báo `<span class="name">` rỗng và mất download link; T4 báo "mail thật không bao giờ
hiện Overdue". Cả hai đều sai: nhánh T1 base trước T2, nhánh T4 base trên T2 nên không có T1 —
mỗi lane chỉ nhìn thấy một lát của thay đổi. Cách phân biệt là `git show <nhánh-hợp-nhất>:<file>`
rồi grep chính ký hiệu verifier nêu; sau khi merge các nhánh chị em vào worktree thì cả hai đều PASS.
Đây là mặt đối xứng của [[gate-hop-nhat-truoc-khi-merge]]: nhánh cô lập vừa **giấu** tương tác thật,
vừa **bịa ra** tương tác không có. FAIL của lane phải được phân loại trước khi giao lại — xem
[[cham-viec-agent-nen]].

**"Không phải font-size" là kết luận sai vì tôi so nhầm cấp.** Khi user hỏi có phải do font-size
không, tôi so *tiêu đề* (Joy 24/20/16 vs ta 20/15/14) rồi kết luận "chữ ta còn nhỏ hơn". Soi lại
từng chỗ thì có **5 chỗ chữ thân bài đang to hơn Joy đúng một nấc** (14 nơi Joy 13, 15 nơi Joy 14).
So mức cao nhất không trả lời được câu hỏi về mức trung bình.

**Test đếm nhầm vì đếm trong source thay vì trong HTML render.** Tôi viết test khoá `width:60px`
đếm ra 3 (số lần khai trong source) trong khi HTML render lặp qua từng dòng hàng nên ra 11.
Test khoá markup phải đếm trên đầu ra, không trên mã nguồn.

**Verifier chết giữa chừng vì hết quota tuần** (reset 16:00 giờ VN) → T10/T11/T12/T13 được commit
mà **chưa** qua verify độc lập. Đã ghi rõ điều đó vào từng commit message thay vì để im. Xem
[[bang-chung-phan-biet-duoc]].

## Techniques

**Tìm thứ giữ sàn bề ngang bằng cách gỡ từng khối rồi đo, không cộng số học.** Tôi chẩn đoán sàn
373px đến từ `min-width:156px × 2 + padding` (312+48+16 = 376 ≈ 373) — nghe rất khớp và hoàn toàn sai.
Lane T13 chứng minh bằng thí nghiệm cô lập:

```
Bỏ Customer information: 373.09px   ← chẩn đoán của tôi nói phải giảm
Bỏ header ticket:        373.09px
Bỏ line item:            289.58px   ← thủ phạm 1
Cho nowrap được ngắt:    311.59px   ← thủ phạm 2
Bỏ cả hai:               277.00px
```

Số học khớp không phải bằng chứng; chỉ phép đo phân biệt được hai giả thuyết mới là.

**Cùng công thức áp cho mọi thứ giữ sàn**: ép khung xuống một giá trị phi lý (100px) rồi xem thẻ nào
*không* chịu co — thẻ đang lấp đầy sẽ co theo, chỉ thẻ giữ sàn mới đứng lại.

## Context

- Layout mới **chỉ tự áp cho field mà shop chưa từng lưu** (hệ quả của merge nông trong
  `paymentReminderRepository.getForShop`), nên store đã dùng feature vẫn giữ logo/content cũ —
  đó là lý do phải dựng nút DevZone reset (reset hết trừ cờ `enabled`, chỉ áp cho shop đang mở DevZone).
- Câu hỏi treo: **reset layout cho toàn bộ store đã dùng feature** — user hỏi, tôi chưa làm vì đó là
  ghi vào dữ liệu thật của khách và không lùi lại được. *chưa xác minh* số store bị ảnh hưởng
  (đếm được 2 shop có doc `paymentReminder` trên production, nhưng hai phép đếm trước của tôi đều sai
  vì so với default thay vì với giá trị đang lưu — xem [[digest-pdf-2026-08-24]]).
- Gửi mail bằng data thật vẫn phải đi đường script trong `src/commands/`, người nhận **ghi cứng**,
  không bao giờ lấy từ `order.customer.email`.

→ [[pdf]] · [[layout-email-html-co-duoc]] · [[gate-hop-nhat-truoc-khi-merge]] · [[bang-chung-phan-biet-duoc]]
