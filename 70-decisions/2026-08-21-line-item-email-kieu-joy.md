---
type: decision
title: Line item email PDF đi theo cách của Joy (hai `<td>` thật + ảnh co được), bỏ hướng stack theo ngưỡng
summary: PDF Invoice bỏ hướng "line item tự stack khi hẹp hơn ~340px" (đã implement, đã có test khoá ngưỡng) và bỏ luôn `inline-block` + `min-width`, chuyển sang đúng cách Joy dựng — hai `<td>` thật trong một `<tr>`, ảnh `width:60px` nhưng `img{width:100%}` nên co được, giá không `white-space:nowrap`.
tags: [avada, pdf, invoice, patterns]
created: 2026-08-21
updated: 2026-08-21
review: 2026-11-21
source: project "pdf" — session history 2026-08-20/21 (SB-15857, MR !529, commit `be76610cb` → `16a5c2252`)
---

# Line item email đi theo cách của Joy

Trạng thái: nằm trên `feature/payment-reminder-layout` / `feature/devzone-reset-reminder`,
gộp vào **MR !529**. ⚠️ chưa merge master tại thời điểm ghi.

Bài toán: preview trong settings page là cột `Layout.Section variant="oneThird"` rộng
**277px**, còn email thật phải sống ở **375px** (điện thoại) và **600px** (desktop) mà không
số tiền nào bị ngắt, không tràn ngang.

Đã đi qua ba hướng:

| | Cách | Kết quả |
|---|---|---|
| A | `inline-block` + `min-width` (lane T11 làm theo brief sai của tôi) | tràn, và đẻ ra bug ngắt số tiền giữa chữ số |
| B | giữ nguyên hàng ngang, **stack khi < ~340px** (user chốt, đã code + test khoá ngưỡng 151px) | vừa khung nhưng thêm một ngưỡng phải nuôi, và 277px vẫn chật |
| **C** | **đúng cách Joy**: hai `<td>` thật + ảnh co được + bỏ `nowrap` ở giá | vừa từ 277px trở lên, giá luôn một dòng, không ngưỡng nào |

Chốt **C**. Test "ngưỡng stack 151px" của hướng B bị **xoá**, thay bằng test khoá việc cột
ảnh không được làm cứng lại.

## Why

- **Ô bảng không bao giờ rơi xuống.** Hai `<td>` trong một `<tr>` giữ ảnh trái / tên+giá cùng
  hàng ở mọi khổ mà không cần media query — thứ mà email không được phép dùng (Gmail strip
  `<style>` ở tầng `<body>`, và bản này có `@media` = 0 như một ràng buộc cứng).
- **Mảnh còn thiếu là ảnh phải co được**, và đó là quan sát của user chứ không phải của tôi:
  Joy đặt `.Avada-Email__Product--Image { width: 60px }` nhưng `img { width: 100% }`, nên ở
  277px ảnh tự thu còn ~30px thay vì giữ sàn 60px cho cả hàng.
- **`white-space:nowrap` trên giá là thứ giữ sàn**, không phải `min-width` như tôi chẩn đoán.
  Thí nghiệm cô lập của lane T13: bỏ line item → 289px; cho `nowrap` ngắt → 311px; bỏ cả hai
  → đúng 277px. Joy **không** có `nowrap` ở chỗ đó và giá vẫn không bao giờ ngắt, vì
  `$949.95` không có chỗ để ngắt khi không bị ép `overflow-wrap:anywhere`.
- **Ngưỡng là thứ phải nuôi.** Hướng B đưa một con số ma thuật (151px / 340px) vào code, sinh
  từ một phép tính padding mà chính padding đó đang chồng ba tầng và sẽ đổi. Hướng C không có
  con số nào.
- **Hai khối hai cột khác cũng theo cùng luật**: Joy dùng `width: calc((100% - 1px) / 2)`,
  không `min-width` — sau khi áp, file không còn `min-width` nào.

## Tradeoff

- **Ở 277px ảnh sản phẩm co còn dải hẹp ~30px** — chật và xấu. Chấp nhận vì 277px chỉ là
  preview trong admin, không phải khổ khách đọc mail.
- **Markup của ta vẫn phức tạp hơn Joy** (nhiều bảng lồng hơn) vì layout hoá đơn có nhiều
  khối hơn email subscription; ta chỉ mượn *luật*, không copy nguyên cấu trúc.
- **Ba vòng lane đã đốt cho hướng A và B** (T11 → T13 vòng 1 → vòng 2), trong đó một vòng đi
  sai vì brief của tôi mang số đo giả — xem
  [[do-be-ngang-headless-chrome]].
- **Bỏ `nowrap` là đánh cược vào dữ liệu**: nếu có chuỗi tiền tệ dài bất thường (mã tiền tệ
  dài, số rất lớn) thì nó *được phép* xuống dòng giữa các token. Đã kiểm 7 số tiền ở
  277/320/375/600 đều một dòng, nhưng đây là ràng buộc chưa được test khoá theo dữ liệu xấu.
- **Vẫn tràn ở 320px trở xuống** — giới hạn đã biết, cố ý chưa xử.
- Mốc review 3 tháng là lúc kiểm: có store nào báo mail vỡ ở khổ lạ không, và `min-width` có
  bò trở lại file không.

## Liên quan

[[digest-pdf-2026-08-21]] · [[do-be-ngang-headless-chrome]] ·
[[2026-08-13-wholesale-table-chi-chua-item-grid]] · [[pdf]] · [[subscriptions]]
