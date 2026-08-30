---
type: resource
title: Email HTML co được là việc của `<td>` và ảnh co được, không phải của `min-width`
summary: Sàn bề ngang của một email là tổng những thứ KHÔNG co được — ảnh cố định, `nowrap`, padding chồng nhiều tầng — nên `min-width` gần như luôn là chẩn đoán sai; hai thứ phải nằm cùng hàng là việc của hai `<td>` thật, và mọi phép đo phải chạy trên HTML đã thay hết merge tag.
tags: [patterns, method, debug, avada]
created: 2026-08-30
updated: 2026-08-30
source: [[digest-pdf-2026-08-24]] · [[digest-pdf-2026-08-25]] · [[digest-pdf-2026-08-27]] · [[digest-pdf-2026-08-28]] · [[2026-08-21-line-item-email-kieu-joy]]
---

# Email HTML co được là việc của `<td>` và ảnh co được

Một email transactional phải đọc được ở **cột preview ~277px** của client mail, không chỉ ở 600px.
Chuỗi SB-15857 của [[pdf]] mất bốn ngày và **ba chẩn đoán sai liên tiếp** để tới đúng chỗ, và cả
ba lần sai đều đi theo cùng một trực giác từ web layout. Note này là phần đáng mang sang app khác —
Avada có nhiều app gửi mail, và bản tham chiếu đúng đã tồn tại sẵn trong Joy.

## Luật

**1. Sàn bề ngang = tổng những thứ không co được.** Không phải `min-width`. Danh sách thủ phạm,
theo đúng thứ tự đã vấp:

| Thủ phạm | Ghi chú |
|---|---|
| Cột ảnh cố định | `width: 60px` cứng là một cái sàn. Cách Joy làm: `width: 60px` **cộng** `img { width: 100% }` — khổ hẹp thì cột co xuống ~30px |
| `white-space: nowrap` | Riêng dòng mã giảm giá lấy lại **61px** khi bỏ |
| Padding chồng nhiều tầng | td ngoài 8×2 + card 24×2 + ticket 24×2 = **56px/bên**; Joy pad card 12px ⇒ 44px/bên. Chênh 24px đủ để không lọt 277px. Phải cộng **mọi** tầng lồng, không chỉ tầng ngoài cùng |
| `overflow-wrap: anywhere` trên ô tiền | Ngắt số tiền giữa chữ số — hỏng khác, cùng ô |

**2. "Hai thứ phải nằm cùng hàng" là việc của `<td>`, không phải `inline-block`.**
`inline-block` + `min-width` thì ở khổ hẹp cột phải **rơi xuống dòng**. Hai `<td>` thật trong một
`<tr>` thì không bao giờ rơi:

```css
.Avada-Email__Order--DetailItem { width: calc((100% - 1px) / 2); }
```

Sau khi đổi, file không còn một `min-width` nào và hai cột giữ nguyên ở cả 277 / 375 / 600px.
Đúng kết luận đã chốt cho line item ở [[2026-08-21-line-item-email-kieu-joy]], nay áp cho khối
order detail ⇒ **quy tắc chung, không phải ca riêng**.

**3. `min-width` gần như luôn là chẩn đoán sai.** Ba lượt liên tiếp trong cùng một task:

| Giả thuyết | Kết quả |
|---|---|
| `min-width: 132/156px` giữ sàn 373px | sai — gỡ hẳn khối vẫn 373 |
| font-size mình to hơn Joy nên chiếm chỗ | sai — font mình **nhỏ hơn** (20/15/14 vs 24/20/16) |
| bỏ `nowrap` + cột ảnh co được | **đúng** — 277px vừa khung, giá vẫn một dòng |

Font-size là câu hỏi về **thẩm mỹ**, không phải về bề ngang; đừng trả lời câu này bằng câu kia.

**4. Cột rỗng thì ẩn cả khối, đừng đi tìm dữ liệu ở chỗ khác.** Đơn B2B tạo tay có
`shipping_address: null` + `billing_address: null` — đó là **dữ liệu thật**, không phải app làm
mất. Company location có địa chỉ nhưng kéo nó vào mail reminder là mở thêm một đường phải bảo trì.
Chốt: cột nào rỗng thì không vẽ, cả khối biến mất nếu không có địa chỉ nào.

## Trước khi tin một phép đo email

Ba cái thước hỏng, cả ba đều gặp trong cùng một buổi ([[digest-pdf-2026-08-28]]):

- **HTML còn merge tag chưa thay thì đo sai.** `{{order.total_outstanding}}` là token 27 ký tự
  không có chỗ ngắt nên nó tự thành sàn — đo ra 383.75px ở cả 277 lẫn 375. Kiểm
  `merge tag còn sót = 0` trước.
- **Trong iframe, `scrollWidth` bị kẹp về bề ngang iframe** nên không bao giờ báo tràn; còn
  `documentElement.scrollWidth` đo cửa sổ chứ không đo nội dung. Đo bảng ngoài cùng, hoặc ép
  `<body style="width:375px">` rồi chụp và nhìn. → [[do-be-ngang-headless-chrome]]
- **Chọn file CSS build bằng `ls -S` là nhặt nhầm bundle.** Chọn bằng `grep -l <class>`.

Và nút **"Send test" chạy trên sample order**, không phải data store thật — muốn dữ liệu thật thì
viết script một lần với **người nhận ghi cứng**, vì đường production lấy `to = order.customer?.email`
và gửi nhầm khách thì không lùi được. → [[fixture-khong-phai-hop-dong-du-lieu]] ·
[[feedback-khong-in-secret-ra-chat]]

## Liên quan

[[pdf]] · [[2026-08-21-line-item-email-kieu-joy]] · [[do-be-ngang-headless-chrome]] ·
[[fixture-khong-phai-hop-dong-du-lieu]] · [[bang-chung-phan-biet-duoc]] ·
[[digest-pdf-2026-08-25]] · [[digest-pdf-2026-08-27]]
