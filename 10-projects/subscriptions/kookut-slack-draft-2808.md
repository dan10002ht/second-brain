# Draft tin Slack — Kookut (28/08) — CHƯA GỬI

> Thread `C07URV6QMJ8` / `p1786494004579699`. Trả lời chị U07GD3PHXKP.
> Dán nguyên phần trong khung dưới.

---

C ơi, 2 order c gửi hôm qua em xử lý xong rồi ạ. Nhưng trước hết **2 chỗ em nói sai trước đó**, em xin đính chính:

*1.* Ngày 19/08 em bảo *"vấn đề shipping em check thấy đang chạy đúng rồi"* — câu đó **sai**. Lúc đó hàm em dùng để đo đọc nhầm sang nhóm đơn mua lẻ nên nhìn tưởng đúng. Nếu c đã chuyển câu này cho khách thì cần đính chính giúp em ạ.

*2.* Con số *"39 variant chưa publish, ảnh hưởng 83 contract"* em báo 18/08 cũng **sai**. Có quyền Market rồi em đo lại được: tiền tệ gốc của shop là CHF nên contract Thuỵ Sĩ không cần giá trong price list — em đếm nhầm 249 dòng bình thường thành lỗi. Số thật: **chỉ 2 contract EUR** thiếu giá.

---

*Về 2 order c gửi:* cả hai đã set **10 EUR**, kỳ tới thu đúng ạ.

Em quét luôn cả shop thì có **25 contract** cùng lỗi này chứ không riêng 2 cái. Đã sửa **23**, còn 2 cái em cố tình không đụng vì khách đang skip kỳ giao hàng — sửa lúc này sẽ xoá mất lệnh skip của họ. Em xử lý sau khi kỳ đó trôi qua.

*Nguyên nhân:* contract đóng băng phí ship của **đơn đầu tiên**. Đơn đầu thường có cả hàng mua lẻ nên vượt ngưỡng miễn phí, còn giỏ định kỳ thì không — thành ra thu 0 mãi. Em đã fix phần code, đang chờ merge.

⚠️ *Chỗ này c lưu ý khi báo khách:* **khách hàng cuối không bị thu thừa, shop bị hụt thu.** Không phải hoàn tiền cho ai. Nhưng **23 khách sẽ thấy hoá đơn kỳ tới tăng thêm 5.90–10 EUR/CHF** — đúng theo bảng giá merchant cấu hình, nhưng họ chưa được báo. C xem có cần merchant thông báo trước không ạ.

---

*Về vụ giá:* em sửa xong **19 contract** (Tuna 1.95→1.70 và 45.95→40.00). Còn **3 dòng em chưa đụng** vì chưa chắc là lỗi hay merchant chủ động hạ giá — cần khách xác nhận:

• Kookut wet food discovery set: 18.00 → 17.00?
• Chicken & Duck Dry Food 5kg: 62.00 → 58.00?
• Salmon & White Fish Dry 1.5kg: 26.80 → 25.00?

*Tiền đã thu thừa:* **28.42 EUR** (8 đơn / 6 contract). Con số này thay cho 7.06 EUR em báo hôm 18/08 — lúc đó em mới đếm được 1 đơn.

---

*Cần c hỏi khách 2 việc:*
1. Xác nhận 3 dòng giá ở trên
2. Publish 2 sản phẩm SENIOR vào market EUR — xong cái này em mới bật lại được auto sync price (em đang tắt để nó khỏi ghi đè bản sửa tay)
