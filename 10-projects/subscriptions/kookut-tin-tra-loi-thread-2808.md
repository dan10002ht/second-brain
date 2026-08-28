# Tin trả lời thread Slack — Kookut (28/08)

> Dán vào thread `C07URV6QMJ8` / `p1786494004579699`.
> Tin cuối của mình trên thread là "checking ạ" (27/08 13:43) — cần trả lời.

---

C ơi, em xong 2 order c gửi hôm qua rồi ạ. Nhưng trước hết **em có 2 chỗ nói sai trước đó cần đính chính**, vì cả hai đều ảnh hưởng tới việc mình nói gì với khách:

**1. Ngày 19/08 em nói "vấn đề shipping em check thì thấy nó đang chạy đúng rồi ạ" — câu đó SAI.**
Lúc đó hàm em dùng để đo đọc nhầm sang nhóm đơn mua lẻ, nên nhìn tưởng đúng. Shipping không hề chạy đúng. Đây chính là lý do hai tuần sau khách báo lại đúng lỗi đó. Nếu c đã chuyển câu này cho khách thì cần đính chính giúp em ạ.

**2. Ngày 18/08 em nói "39 variant chưa publish vào catalog EUR, ảnh hưởng 83/159 contract" — con số này SAI.**
Giờ có quyền Market em đo lại được chính xác: tiền tệ gốc của shop là **CHF**, nên contract Thuỵ Sĩ **không cần** giá trong price list — dùng thẳng giá sản phẩm. Em đã đếm nhầm 249 dòng CHF bình thường thành lỗi. Con số thật: **chỉ 2 contract EUR** thiếu giá EUR.

---

## 1. Hai order c gửi — `#155757019517` và `#155848769917`

**Không phải app quên thu — Shopify không hề chào phí ship nào cho đơn định kỳ của shop này.**

Em dựng lại đúng giỏ hàng của 2 contract và hỏi Shopify. Cùng giỏ, cùng địa chỉ, cùng tổng tiền:

| | Đơn mua lẻ | Đơn định kỳ |
|---|---|---|
| DPD điểm nhận hàng | 5.90 € | **0.00 €** |
| Mondial Relay | 5.90 € | *không chào* |
| Shop2Shop | 5.90 € | *không chào* |
| DPD Predict tận nhà | 6.90 € | *không chào* |
| **Chronopost tận nhà** | **10.00 €** | *không chào* |

Cả 2 contract đều lưu đúng phương thức khách chọn là **Chronopost**, nhưng phương thức đó **không nằm trong danh sách Shopify chào cho đơn định kỳ**.

**Nguyên nhân:** shop có profile tên `Shipping rates for subscription`, bên trong là **đúng bảng giá khách mô tả** (Chronopost 10 € cho đơn 30–100 €, free từ 100 €). Nhưng profile đó đang gắn **0 sản phẩm**. Nó chưa bao giờ có hiệu lực. Không có profile riêng cho subscription, Shopify phục vụ đơn định kỳ từ General profile và thu gọn về đúng một rate miễn phí.

→ **Cần khách gán sản phẩm subscription vào profile đó.** Em có file yêu cầu cấu hình kèm bản tiếng Anh để c gửi thẳng.

Lưu ý khi báo khách: **khách hàng cuối không bị thu thừa — shop bị hụt thu.** Đơn `#11025` (27/08) thiếu 10 €. Không phải hoàn tiền cho ai cả.

**Phần bên mình cũng có lỗi thật, đã fix + đang chờ merge (MR !2509):** khi khách sửa subscription, app tính lại phí ship và chọn nhầm phương thức **rẻ nhất** thay vì phương thức khách đã chọn — tức đẩy khách từ giao tận nhà sang điểm nhận hàng. Kookut đang bật cả 2 toggle "cập nhật khi đổi sản phẩm / đổi địa chỉ" nên đường này đang mở.

## 2. Contract `#154109116797` — em rút lại cảnh báo cũ

Hôm 18/08 em có nói "có khả năng bên mình tăng nhầm phí ship của một khách". Em kiểm lại: giỏ 23.80 CHF, dưới ngưỡng 50, bảng giá Thuỵ Sĩ ghi `Standard - SwissPost Economy` = 10 CHF cho đơn dưới 50. **Con số 10 CHF là đúng**, khớp đúng rule khách mô tả. Không cần hoàn gì.

## 3. Vụ giá — ĐÃ SỬA XONG 19 contract

Có quyền Market rồi nên em quét lại được toàn bộ 167 contract đang chạy, và **đã sửa xong phần app ghi sai** (28/08):

| Sản phẩm | Đang thu | Đã sửa về | Dòng | Trạng thái |
|---|---|---|---|---|
| Pacific Tuna & Sardine 70g | 1.95 | **1.70** | 12 | ✅ xong |
| Pacific Tuna & Sardine 24x70g | 45.95 | **40.00** | 7 | ✅ xong |
| Free Run Chicken & Duck 70g | 1.95 | **1.70** | 1 | ✅ xong |
| Kookut wet food discovery set | 18.00 | 17.00? | 1 | ⏸ chờ khách |
| Chicken & Duck Dry Food 5kg | 62.00 | 58.00? | 1 | ⏸ chờ khách |
| Salmon & White Fish Dry 1.5kg | 26.80 | 25.00? | 1 | ⏸ chờ khách |

**19 contract / 21 dòng đã sửa**, discount 5% của từng khách giữ nguyên. Em quét lại độc lập sau khi sửa: nhóm "thu cao hơn" từ 24 dòng còn đúng 3 dòng — chính là 3 dòng em cố ý chưa đụng.

**Vì sao em tách 3 dòng cuối ra:** 20 dòng đầu mang đúng dấu vết bug — `1.95` và `45.95` là số app tự quy đổi rồi ghi nhầm. 3 dòng cuối thì không: chênh lệch tròn trịa (62→58, 26.80→25, 18→17), trông giống **khách hạ giá sau khi người mua đã đăng ký**, tức price-lock hợp lệ. Hạ chúng xuống là tự ý cắt doanh thu của khách. **Cần khách xác nhận riêng 3 dòng này.**

Ngoài ra có 11 contract đang thu **thấp hơn** bảng giá hiện tại — em **không đụng**, vì đó gần như chắc chắn là price-lock hợp lệ và sửa lên là tăng tiền của người mua.

## 4. Đang chờ

- **Auto sync price của kookut hiện đang TẮT** — em tắt chủ động để nó không ghi đè bản sửa tay. Phải bật lại sau khi khách xử lý xong phần giá EUR, không thì nó nằm im mãi.
- 2 contract EUR thiếu giá: `158632116605` (Pacific Tuna & Mackerel SENIOR 70g) và `125123395965` (Chicken & Duck SENIOR 70g).

## 5. Số tiền đã thu thừa — **28.42 €**

Em rà toàn bộ đơn đã charge và tìm những đơn bị tính ở giá sai (1.85 thay vì 1.62, và 43.65 thay vì 38.00). Tổng **28.42 €** trên **8 dòng / 6 contract**:

| Ngày | Đơn | Contract | Thu thừa |
|---|---|---|---|
| 13/08 | #9136 | 139674878333 | 5.65 € |
| 13/08 | #9535 | 139674878333 | 5.65 € |
| 19/08 | #10831 | 151147970941 | 7.05 € |
| 25/08 | #10914 | 155113881981 | 5.65 € |
| 28/08 | #10740 | 153346408829 | 2.56 € |
| 28/08 | #10886 | 125123395965 | 0.93 € |
| 28/08 | #10805 | 150985212285 | 0.93 € |

Con số này **thay thế** con số 7.06 € em báo hôm 18/08 — lúc đó em mới đếm được đúng một đơn.

Lưu ý: 3 đơn cuối bị charge **sáng nay 28/08**, tức chỉ vài giờ trước khi em sửa giá. Không tránh được, nhưng đã nằm trong tổng trên.

Riêng **8.73 CHF** em báo trước đó là vụ **mất discount**, khác vụ giá này — em chưa tính lại, sẽ rà riêng.

---

## Cần c hỏi khách 3 câu

1. Gán sản phẩm subscription vào profile `Shipping rates for subscription` — **cái này chặn toàn bộ vụ phí ship**
2. Xác nhận giá đúng cho 6 sản phẩm ở bảng trên, đặc biệt 3 dòng cuối
3. Publish 2 sản phẩm SENIOR vào market EUR
