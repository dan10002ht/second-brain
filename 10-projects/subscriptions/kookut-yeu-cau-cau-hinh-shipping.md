# Kookut — phí ship đơn định kỳ: cần merchant sửa cấu hình

> Gửi CS. Phần cuối có bản tiếng Anh để forward thẳng cho merchant nếu cần.
> Liên quan 2 issue khách báo: order `#155757019517` và `#155848769917`.

## Kết luận

**Không phải app không thu phí ship — mà Shopify không hề chào phí ship nào cho đơn định kỳ của họ.**

Merchant đã tạo bảng giá riêng cho subscription và tin rằng nó đang chạy. Nó **chưa được gán cho sản phẩm nào**, nên chưa bao giờ có hiệu lực.

## Bằng chứng

Cùng một giỏ hàng, cùng địa chỉ giao, cùng tổng tiền — Shopify chào 2 nhóm khác hẳn nhau:

| | Đơn mua lẻ (ONE_TIME) | Đơn định kỳ (SUBSCRIPTION) |
|---|---|---|
| DPD điểm nhận hàng | 5.90 EUR | **0.00 EUR** |
| Mondial Relay điểm nhận | 5.90 EUR | *không được chào* |
| Shop2Shop điểm nhận | 5.90 EUR | *không được chào* |
| DPD Predict tận nhà | 6.90 EUR | *không được chào* |
| **Chronopost tận nhà** | **10.00 EUR** | *không được chào* |

Kiểm trên contract `155757019517` (giỏ 38.00 EUR) và `155848769917` (giỏ 50.22 EUR) — kết quả như nhau.

Cả 2 contract đều lưu đúng phương thức khách chọn là **"Chronopost - Livraison à domicile"**, nhưng phương thức đó **không nằm trong danh sách Shopify chào cho đơn định kỳ**. Nên dù app có tính lại phí ship thế nào cũng chỉ ra được 0 EUR.

## Nguyên nhân

Shop có 3 delivery profile:

| Profile | Mặc định | Số sản phẩm gắn vào |
|---|---|---|
| General profile | ✅ | 72 |
| DPD | | 0 |
| **Shipping rates for subscription** | | **0** ← vấn đề |

Profile `Shipping rates for subscription` chứa **đúng bảng giá merchant mô tả với CS**:

```
zone "france"
   10.0 EUR  "Chronopost"   khi đơn từ 30 đến 100 EUR
    0.0 EUR  "Chronopost"   khi đơn từ 100 EUR trở lên
```

Đúng câu merchant nói: *"The shipping option he selected is 10 EUR under 100 EUR purchase."*

Nhưng profile này gắn **0 sản phẩm và 0 selling plan group**. Không có profile riêng cho subscription, Shopify phục vụ đơn định kỳ từ General profile và thu gọn về đúng một rate miễn phí.

## Việc merchant cần làm

**Gán sản phẩm subscription vào profile "Shipping rates for subscription".**

Shopify admin → Settings → Shipping and delivery → chọn profile `Shipping rates for subscription` → thêm các sản phẩm bán theo subscription vào profile đó.

Sau khi gán, cần merchant xác nhận lại: các zone hiện có (france / Europe / Switzerland) đã phủ hết thị trường họ bán subscription chưa. Zone `Europe` hiện thiếu Pháp — Pháp nằm ở zone `france` riêng.

**Chưa làm bước này thì không có thay đổi nào phía app chữa được.**

## Phần bên mình đã sửa (không liên quan cấu hình merchant)

Có một bug thật của app trong cùng khu vực này, **đã fix, chờ deploy**:

Khi khách sửa subscription (đổi sản phẩm hoặc đổi địa chỉ), app tính lại phí ship và **chọn nhầm phương thức rẻ nhất thay vì phương thức khách đã chọn**. Với kookut nghĩa là khách chọn giao tận nhà Chronopost nhưng bị đẩy sang điểm nhận hàng DPD. Cả 2 toggle "cập nhật khi đổi sản phẩm / đổi địa chỉ" của kookut đang bật, nên đường này đang mở.

Bản sửa cũng bổ sung: nếu phương thức khách chọn không còn được chào, app **không ghi gì cả** thay vì âm thầm đổi khách sang dịch vụ khác.

## Về tiền

**Khách không bị thu thừa — shop bị hụt thu.** Đơn định kỳ `#11025` (27/08) thiếu 10 EUR phí ship. Không có gì phải hoàn cho khách. Đây là thiệt hại doanh thu của merchant, ngược với vụ giá Tuna.

Sau khi merchant gán profile, các đơn định kỳ **mới** sẽ được tính đúng. Các contract **cũ** vẫn giữ phí ship 0 đã đóng băng — chữa được, nhưng đó là thay đổi số tiền khách hàng cuối bị charge nên **phải để merchant quyết định và nên báo trước cho khách của họ**.

---

## Bản tiếng Anh để forward cho merchant

> **Subject: Subscription shipping rates are not being applied — action needed**
>
> We investigated the two orders you reported (`#155757019517`, `#155848769917`) and found the cause.
>
> Your store has a delivery profile named **"Shipping rates for subscription"**. It contains exactly the rates you described to us — Chronopost at 10 EUR for orders between 30 and 100 EUR, free above 100 EUR. However, **this profile is currently not assigned to any products**, so it never takes effect.
>
> Because no subscription-specific profile is active, Shopify falls back to your General profile for recurring orders, and offers only a single free option. We verified this on both contracts: the customer's chosen method, "Chronopost - Livraison à domicile", is **not offered at all** for subscription deliveries, while the same basket offers five options — including Chronopost at 10 EUR — for one-time purchases.
>
> **What we need you to do:** in Shopify admin, go to *Settings → Shipping and delivery*, open the **"Shipping rates for subscription"** profile, and add your subscription products to it. Please also confirm that its shipping zones cover every market where you sell subscriptions.
>
> Until this is done, no change on our side can charge the correct shipping on recurring orders.
>
> Separately, we found and fixed a bug on our side: when a customer edited their subscription, our app re-calculated shipping and picked the cheapest available method instead of the one the customer had chosen. The fix also makes the app leave the contract untouched when the customer's chosen method is no longer offered, rather than silently moving them to a different service.
>
> Please note that existing subscriptions still carry the shipping price frozen from their first order. We can correct those, but since it changes what your customers are charged, we will only do so once you confirm — and we would recommend notifying the affected customers first.
