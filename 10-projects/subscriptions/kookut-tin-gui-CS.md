# Tin nhắn gửi CS — Kookut (18/08)

> Dán vào thread Slack `C07URV6QMJ8` (thread `JSUB-260811-TWjnqq`).
> File kèm cho merchant: `docs/kookut-merchant-confirmation.md`

---

Em rà xong toàn bộ shop Kookut rồi ạ. Có 3 chỗ **bên mình nói sai trước đó**, em xin đính chính trước vì nếu khách tự phát hiện thì mệt hơn:

**1. Vụ thẻ `••••7216` — khách đúng, mình sai.**
Em từng nói contract đó dùng thẻ `••••1932`. Thực tế `••••7216` **có thật** và đã charge thành công **8 lần** (đơn #7266 → #10041, từ 10/2025 đến 06/2026), cùng BIN Mastercard, hạn 07/2026. Em đọc trực tiếp `transactions` trên Shopify. Khách nhìn thấy đuôi 7216 ở đơn cũ là **đúng**, không phải lỗi hiển thị.
→ Nếu đã nói với khách là "không tồn tại thẻ đó" thì cần đính chính, vì họ mở đơn #10041 trên Shopify là thấy ngay.

**2. "Sửa tay không ăn vì lần sync sau ghi đè lại" — em nói câu này ngày 12/08, và nó SAI.**
Cơ chế sync so `variant.price` chứ không so `basePrice`. Nghĩa là ngược lại: dòng bị hỏng **vô hình** với sync, chạy sync bao nhiêu lần cũng không tự chữa — chứ không phải sync ghi đè lên bản sửa tay.

**3. "Khách không cancel được subscription là do config của merchant" — cũng sai.**
Em kiểm config thật: `cancelSubscription = true`, và 86 contract ACTIVE không cái nào bật `enabledMinimumOrder`. Không có điều kiện nào chặn. **Khách đúng, mình sai.**

---

**Về vụ giá — rộng hơn khách báo nhiều.**

Khách chỉ báo 1 contract (`151147970941`). Em quét cả 159 contract thì có **22 contract đang thu thừa**, gần như toàn bộ là một họ sản phẩm:

| Sản phẩm | Đang thu | Merchant đặt | Số contract |
|---|---|---|---|
| Pacific Tuna & Sardine 70g | 1.95 | **1.70** | 14 |
| Pacific Tuna & Sardine 24x70g | 45.95 | **40.00** | 9 |
| Free Run Chicken & Duck 70g | 1.95 | **1.70** | 1 |
| Kookut wet food discovery set | 18.00 | **17.00** | 1 |

Root cause: **39 variant chưa được publish vào catalog EUR** (ảnh hưởng 83/159 contract). Chưa publish thì Shopify tự quy đổi từ CHF, app ghi số quy đổi đó vào contract.

⚠️ **Chưa sửa gì cả** — vì nếu ghi giá đúng vào lúc này thì lần sync sau vẫn đẩy về giá quy đổi. **Merchant phải publish sản phẩm trước.**

---

**Tin tốt — hai thứ bên mình từng báo là lỗi, hoá ra không phải:**

- **4 contract "shop mất phí ship"**: sai. Nhóm giao hàng subscription của họ **thật sự có option DPD điểm nhận hàng giá 0**. Con số 5.90 trước đây là do app đọc nhầm sang nhóm đơn mua lẻ — em đã fix.
- **15 contract Firestore PAUSED / Shopify ACTIVE**: không phải bug, billing do cron của app quản lý.

---

**Đã fix và deploy** (MR !2486): giá theo country · contract không còn bị vá nửa vời khi Shopify từ chối · discount 5% cho sản phẩm thêm mới · customer portal có báo lỗi thay vì quay vòng vô hạn · phí ship quote đúng nhóm subscription · thẻ khách không bị thử 4 lần/tháng nữa · app hiện đúng phí ship.

**Đã sửa dữ liệu**: 27 contract app hiển thị sai phí ship (phần lớn hiện 0 trong khi Shopify thu 10 CHF). Không đổi tiền khách, chỉ sửa hiển thị.

---

**Cần a/c gửi merchant xác nhận** — em có file kèm, dịch sẵn tiếng Anh:

1. **Publish 39 variant vào market EUR** ← chặn toàn bộ việc sửa giá
2. Xác nhận giá đúng cho 4 sản phẩm ở bảng trên
3. **9 contract đang gắn thẻ hết hạn** (4 ACTIVE sẽ fail kỳ tới, 5 PAUSED fail khi resume) — nên nhắc khách đổi thẻ trước khi mất họ
4. Hỏi: rate 0.00 cho đơn định kỳ có phải cố ý không

**Sau khi merchant xác nhận giá**, em sẽ sửa 22 contract + tính lại số tiền cần hoàn. Hiện đã biết chắc **7.06 EUR** (đơn #10831) và **8.73 CHF** (5 contract mất discount), tổng thật sẽ cao hơn.

---

**Một chỗ em cần tự kiểm lại**: contract `154109116797` bên mình sửa phí ship 0 → 10 CHF ngày 13/08. Con số 10 đó lấy từ hàm đang đọc nhầm nhóm đơn mua lẻ, nên có khả năng bên mình **tăng nhầm** phí ship của một khách. Em đang xác minh, nếu sai thì sẽ trả về và hoàn phần đã thu.
