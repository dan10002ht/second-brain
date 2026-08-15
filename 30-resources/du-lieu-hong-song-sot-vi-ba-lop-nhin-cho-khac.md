---
type: resource
title: Dữ liệu hỏng sống sót vì ba lớp cùng nhìn chỗ khác
summary: Một trường dữ liệu hỏng tồn tại lâu không phải vì khó phát hiện, mà vì lớp ghi sai trường A, lớp đồng bộ đối chiếu trường B (luôn đúng ở cả hai phía), và lớp dò tìm lấy chính dữ liệu hỏng làm chuẩn kèm ngưỡng dung sai — mỗi lớp đều "chạy đúng" và báo sạch.
tags: [patterns, debug, architecture, avada]
created: 2026-08-15
updated: 2026-08-15
source: [[digest-subscriptions-2026-08-15]] · [[digest-subscriptions-2026-08-14]] — ca kookut contract 151147970941
---

# Dữ liệu hỏng sống sót vì ba lớp cùng nhìn chỗ khác

Khi một trường dữ liệu sai nằm trong hệ thống hàng tháng mà không hệ thống giám sát nào kêu,
phản xạ thường là "thiếu monitoring". Thường không phải. Monitoring có, chỉ là mỗi lớp đang
so một thứ khác với thứ bị hỏng.

## Ba lớp và cách mỗi lớp mù

| Lớp | Vai trò | Kiểu mù điển hình |
|---|---|---|
| **Ghi** | tạo/cập nhật bản ghi | ghi sai một trường phụ trong khi trường chính vẫn đúng — không có gì để so tại thời điểm ghi |
| **Đồng bộ / self-heal** | phát hiện lệch và chữa | so **trường khác** với trường bị hỏng. Trường được so đúng ở cả hai phía → job chạy hằng ngày, luôn báo "không có gì để sửa" |
| **Dò tìm / detector** | quét tìm bản ghi hỏng | lấy **chính nhóm dữ liệu đang xét** làm chuẩn (median/mode của cụm) và có ngưỡng dung sai; hỏng nhỏ hơn ngưỡng thì lọt, hỏng lan cả cụm thì chuẩn cũng lệch theo |

Ca cụ thể sinh ra note này: một dòng contract mang `basePrice` sai; job đồng bộ giá so
`variant.price` (đúng ở cả hai phía) nên không bao giờ chạm vào `basePrice`; detector dùng
median tỉ lệ của chính contract đó với dung sai 15%, dòng hỏng lệch 12,1% → báo `0 damaged`
cho **toàn bộ 84 contract ACTIVE** của shop. Chi tiết ở [[digest-subscriptions-2026-08-15]].

## Kiểm ba câu hỏi, theo thứ tự

1. **Lớp đồng bộ đang so trường nào?** Nếu tên trường trong điều kiện so *khác* tên trường
   người dùng phàn nàn, job đó không liên quan gì tới bug — dù nó chạy xanh mỗi ngày.
2. **Detector lấy chuẩn từ đâu?** Chuẩn suy ra từ chính tập dữ liệu đang kiểm là chuẩn tự
   xác nhận. Cần một nguồn **bên ngoài** (cấu hình của merchant, bảng giá, snapshot lúc ký hợp
   đồng) mới phân biệt được "cả cụm đúng" với "cả cụm cùng hỏng".
3. **Ngưỡng dung sai đang che mất lớp hỏng nào?** Mọi ngưỡng đều tạo một dải âm tính giả. Trước
   khi tin con số `0 damaged`, hãy hỏi: một ca hỏng nhỏ hơn ngưỡng thì trông ra sao, và nó có
   gây thiệt hại thật không. Hỏng 12% tiền vẫn là thu sai tiền.

## Hệ quả khi sửa

Vá lớp ghi **không** làm sạch dữ liệu đã hỏng — lớp đồng bộ vẫn mù nên nó không tự lành. Một
sự cố kiểu này luôn phải tách làm hai việc: sửa code và sửa data, và việc sửa data cần một công
cụ **nhận giá trị đúng tường minh** thay vì tự suy, vì mọi nguồn tự suy sẵn có đều là nguồn đã
được chứng minh không đáng tin trong chính ca đó.

Và vá lớp ghi ở *một* đường vào không đủ khi cùng một họ lỗi còn nằm ở đường vào khác —
xem [[feedback-follow-conventions]].

Liên quan: [[bang-chung-phan-biet-duoc]] · [[feedback-debug-phai-query-data-that]] ·
[[digest-subscriptions-2026-08-15]] · [[firestore-multitenant]]
