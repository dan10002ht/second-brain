# Kookut — dữ liệu để CS quyết cách trả lời khách

Rà **159 contract** còn sống (bỏ CANCELLED), ngày 18/08/2026. **Chưa sửa gì trên các contract này.**


> ## ⚠️ TRẠNG THÁI 19/08 — ĐỌC TRƯỚC
>
> **`automation.syncProductPrice` đang TẮT cho toàn shop kookut.**
> Hệ quả: merchant đổi giá bất kỳ sản phẩm nào sẽ **không** tự cập nhật lên subscription.
> **Phải bật lại** sau khi merchant publish Pacific Tuna & Sardine vào catalog Europe/France.
> Bật lại sớm hơn thì giá vừa sửa sẽ bị đẩy về 42.95 (giá auto-convert).
>
> **Đã sửa xong contract `151147970941`** (contract khách khiếu nại):
> Tuna 70g `1.95 → 1.70` · Tuna 24x70g `45.95 → 40.00`. Verify bằng 2 công cụ độc lập, cả 4 dòng KHỚP
> price list. Kỳ tới khách trả ~96 EUR thay vì ~114 EUR.
> Còn **hoàn 7.06 EUR** của đơn #10831 (14/08) — chưa làm.
>
> **21 contract còn lại ở mục A: CHƯA sửa** — chờ xin thêm quyền để kiểm tra.
>
> **Lỗi gốc đã fix và deploy** 19/08 (tag `v2.34.78`/`v2.34.79`): app không còn lấy nhầm giá
> thị trường khác, và không còn ghi đè lên giá sửa tay.


## A. 22 contract đang THU THỪA của khách

| Sản phẩm | Đang thu | Merchant đặt | Chênh | Contract |
|---|---|---|---|---|
| Pacific Tuna & Sardine - Natural / 70g | 1.95 | **1.70** | +0.25 | 14 |
| Pacific Tuna & Sardine - Natural / 24x70g | 45.95 | **40.00** | +5.95 | 9 |
| Kookut wet food discovery set / ? | 18.00 | **17.00** | +1.0 | 1 |
| Free Run Chicken & Duck - Natural / 70g | 1.95 | **1.70** | +0.25 | 1 |

**25 dòng / 22 contract.** Khách mới báo đúng 1 (`151147970941`).

<details><summary>Danh sách contract đầy đủ</summary>

| Contract | Status | Cur | Đang thu | Đúng ra | Sản phẩm |
|---|---|---|---|---|---|
| `155113881981` | ACTIVE | EUR | 45.95 | 40.00 | Pacific Tuna & Sardine - Natural / 24x70g |
| `125403431293` | ACTIVE | EUR | 1.95 | 1.70 | Pacific Tuna & Sardine - Natural / 70g |
| `144211050877` | ACTIVE | EUR | 1.95 | 1.70 | Pacific Tuna & Sardine - Natural / 70g |
| `151147970941` | ACTIVE | EUR | 1.95 | 1.70 | Pacific Tuna & Sardine - Natural / 70g |
| `151147970941` | ACTIVE | EUR | 45.95 | 40.00 | Pacific Tuna & Sardine - Natural / 24x70g |
| `155055489405` | ACTIVE | EUR | 1.95 | 1.70 | Pacific Tuna & Sardine - Natural / 70g |
| `153490162045` | ACTIVE | EUR | 18.00 | 17.00 | Kookut wet food discovery set / ? |
| `127309513085` | PAUSED | EUR | 45.95 | 40.00 | Pacific Tuna & Sardine - Natural / 24x70g |
| `117124989309` | PAUSED | EUR | 45.95 | 40.00 | Pacific Tuna & Sardine - Natural / 24x70g |
| `117124989309` | PAUSED | EUR | 1.95 | 1.70 | Pacific Tuna & Sardine - Natural / 70g |
| `125123395965` | ACTIVE | EUR | 1.95 | 1.70 | Pacific Tuna & Sardine - Natural / 70g |
| `153346408829` | ACTIVE | EUR | 1.95 | 1.70 | Pacific Tuna & Sardine - Natural / 70g |
| `139969659261` | ACTIVE | EUR | 1.95 | 1.70 | Pacific Tuna & Sardine - Natural / 70g |
| `132447240573` | PAUSED | EUR | 45.95 | 40.00 | Pacific Tuna & Sardine - Natural / 24x70g |
| `153505399165` | ACTIVE | EUR | 1.95 | 1.70 | Pacific Tuna & Sardine - Natural / 70g |
| `153505399165` | ACTIVE | EUR | 1.95 | 1.70 | Free Run Chicken & Duck - Natural / 70g |
| `150985212285` | ACTIVE | EUR | 1.95 | 1.70 | Pacific Tuna & Sardine - Natural / 70g |
| `148935999869` | PAUSED | EUR | 1.95 | 1.70 | Pacific Tuna & Sardine - Natural / 70g |
| `147905085821` | ACTIVE | EUR | 1.95 | 1.70 | Pacific Tuna & Sardine - Natural / 70g |
| `118354313597` | PAUSED | EUR | 45.95 | 40.00 | Pacific Tuna & Sardine - Natural / 24x70g |
| `153432359293` | ACTIVE | EUR | 45.95 | 40.00 | Pacific Tuna & Sardine - Natural / 24x70g |
| `119156867453` | PAUSED | EUR | 1.95 | 1.70 | Pacific Tuna & Sardine - Natural / 70g |
| `116972159357` | PAUSED | EUR | 45.95 | 40.00 | Pacific Tuna & Sardine - Natural / 24x70g |
| `125391667581` | PAUSED | EUR | 1.95 | 1.70 | Pacific Tuna & Sardine - Natural / 70g |
| `139056447869` | ACTIVE | EUR | 45.95 | 40.00 | Pacific Tuna & Sardine - Natural / 24x70g |

</details>


## B. 11 contract thu THIẾU — đề nghị KHÔNG sửa

Khách trả thấp hơn catalog hiện tại, thường do đăng ký trước khi merchant tăng giá. Sửa = tăng tiền khách đang trả đúng hợp đồng.

| Contract | Status | Cur | Đang thu | Catalog | Sản phẩm |
|---|---|---|---|---|---|
| `117269365117` | ACTIVE | CHF | 11.90 | 23.80 | Chicken & Turkey Dry Food for Kitten / 1.5kg |
| `121601032573` | PAUSED | EUR | 1.70 | 1.80 | Wild Alaskan Salmon - Natural / 70g |
| `121496043901` | PAUSED | CHF | 31.00 | 62.00 | Chicken & Turkey Dry Food for Kitten / 5kg |
| `127202525565` | PAUSED | EUR | 1.70 | 1.80 | Wild Alaskan Salmon - Natural / 70g |
| `117124989309` | PAUSED | EUR | 1.70 | 1.80 | Wild Alaskan Salmon - Natural / 70g |
| `125123395965` | ACTIVE | EUR | 1.70 | 1.80 | Wild Alaskan Salmon - Natural / 70g |
| `118510846333` | ACTIVE | EUR | 1.70 | 1.80 | Wild Alaskan Salmon - Natural / 70g |
| `139969659261` | ACTIVE | EUR | 1.70 | 1.80 | Wild Alaskan Salmon - Natural / 70g |
| `147905085821` | ACTIVE | EUR | 1.70 | 1.80 | Wild Alaskan Salmon - Natural / 70g |
| `116999324029` | PAUSED | EUR | 31.00 | 58.00 | Chicken & Turkey Dry Food for Kitten / 5kg |
| `119156867453` | PAUSED | EUR | 1.70 | 1.80 | Wild Alaskan Salmon - Natural / 70g |

⚠️ 3 ca **đúng một nửa giá** (11.90/23.80 · 31/62 · 31/58) — nên hỏi merchant có phải khuyến mãi cũ không.


## C. Vì sao giá bị sai — đã xác minh trên Shopify

**Pacific Tuna & Sardine CHƯA được publish vào catalog nào cả** (Switzerland / Europe / France).

Merchant **đã đặt** giá 1.70 và 40.00 trong price list EUR, nhưng sản phẩm không nằm trong catalog nên giá đó **vô hiệu** → Shopify quay về tự quy đổi từ CHF → 1.95 và 42.95 → app ghi số quy đổi đó vào contract.

Đối chứng xác nhận cơ chế:

| Sản phẩm | Publish vào catalog EUR | Giá FIXED | Contract giữ |
|---|---|---|---|
| Wild Alaskan Salmon | ✅ có | 1.80 | 1.80 ✅ khớp |
| Pacific Tuna & Sardine | ❌ **không** | 1.70 | 1.95 ❌ lệch |

**⇒ Merchant cần publish Pacific Tuna & Sardine vào catalog Europe và France.** Chưa làm thì có sửa contract về 1.70, lần sync sau vẫn đẩy về 1.95.

### Hai sản phẩm còn lại trong nhóm A thì KHÁC

`Free Run Chicken & Duck` và `Kookut wet food discovery set` **đã publish** và **đã có giá FIXED đúng** — contract chỉ đang giữ số cũ. Sửa được ngay, không phải chờ merchant.

### Ghi chú: 39 variant không có giá FIXED

Có 39 variant (83/159 contract) **không có giá FIXED nào** trong price list EUR. Với nhóm này Shopify tự quy đổi, và **có thể merchant cố ý** — không có gì để so nên không kết luận là sai. Nêu để merchant rà lại nếu muốn kiểm soát giá EUR chặt hơn.

<details><summary>Danh sách variant</summary>

| Sản phẩm / variant |
|---|
| Chicken & Duck Dry Food for Cat / 1.5kg |
| Chicken & Duck Dry Food for Cat / 10kg (2*5kg) |
| Chicken & Duck Dry Food for Cat / 5kg |
| Chicken & Duck Dry Food for Dog / 1.5kg |
| Chicken & Duck Dry Food for Dog / 12kg (2*6kg) |
| Chicken & Duck Dry Food for Dog / 24kg (4*6kg) |
| Chicken & Duck Dry Food for Dog / 6kg |
| Chicken & Duck SENIOR - Natural / 70g |
| Free Run Chicken & Duck - Natural / 24x70g |
| Free Run Chicken & Duck - Natural / 70g |
| Free Run Chicken & Pacific Tuna - Natural - Breeders / 24x280g |
| Free Run Chicken & Pacific Tuna - Natural / 24x70g |
| Free Run Chicken & Pacific Tuna - Natural / 70g |
| Free Run Chicken & Pumpkin - Natural / 24x70g |
| Free Run Chicken & Pumpkin - Natural / 70g |
| Free Run Chicken & Shrimps - Natural / 24x70g |
| Free Run Chicken & Shrimps - Natural / 70g |
| Free Run Chicken & Zucchini - Natural / 24x70g |
| Free Run Chicken & Zucchini - Natural / 70g |
| Free Run Chicken - Natural / 24x70g |
| Free Run Chicken - Natural / 70g |
| Mackerel & Zucchini - Natural / 24x70g |
| Mackerel & Zucchini - Natural / 70g |
| Pacific Tuna & Baby Clams - Natural / 24x70g |
| Pacific Tuna & Baby Clams - Natural / 70g |
| Pacific Tuna & Green Mussels - Natural - Breeders / 280g |
| Pacific Tuna & Green Mussels - Natural / 24x70g |
| Pacific Tuna & Green Mussels - Natural / 70g |
| Pacific Tuna & Sardine - Natural / 24x70g |
| Pacific Tuna & Sardine - Natural / 70g |
| Pacific Tuna & Seaweed - Natural / 24x70g |
| Pacific Tuna & Seaweed - Natural / 70g |
| Pacific Tuna - Natural / 24x70g |
| Pacific Tuna - Natural / 70g |
| Salmon & White Fish Dry Food for Cat / 1.5kg |
| Salmon & White Fish Dry Food for Cat / 5 kg |
| Salmon & White Fish Dry Food for Dog / 6kg |
| Wild Alaskan Salmon - Natural / 24x70g |
| Wild Alaskan Salmon - Natural / 70g |

</details>


## D. 9 contract đang gắn thẻ HẾT HẠN

4 ACTIVE sẽ fail ở kỳ tới · 5 PAUSED fail ngay khi resume. Không phải lỗi app.

| Contract | Status | Hết hạn | Thẻ | Khách |
|---|---|---|---|---|
| `119254778237` | ACTIVE | 06/2026 | visa ••••8619 | loreila+shopping@ikmail.com |
| `119901487485` | ACTIVE | 07/2026 | ••••4939 | t.liebich@bluewin.ch |
| `121065865597` | ACTIVE | 07/2026 | mastercard ••••1932 | charbonneau.caroline@hotmail.fr |
| `135604175229` | ACTIVE | 06/2026 | visa ••••0499 | elena.unverricht@hotmail.fr |
| `117124989309` | PAUSED | 12/2025 | ••••6979 | bonnaud.christel@icloud.com |
| `128382566781` | PAUSED | 12/2025 | ••••0845 | proietti.chiara91@gmail.com |
| `118553739645` | PAUSED | 01/2026 | ••••9856 | chiayuciti@gmail.com |
| `130226651517` | PAUSED | 05/2026 | visa ••••1104 | myriamsaadb@hotmail.com |
| `117505720701` | PAUSED | 06/2026 | mastercard ••••7555 | sandywe@bluewin.ch |

## E. Phí ship — 2 ca chưa rõ

| Contract | Cur | Hiện tại | Vấn đề |
|---|---|---|---|
| `155222278525` | CHF | 0 | Shopify không trả rate nào, chưa biết 0 có đúng ý merchant |
| `154109116797` | CHF | 10 | **Bên mình sửa 0→10 ngày 13/08** dựa trên rate đọc nhầm nhóm đơn lẻ — có thể đã tăng nhầm tiền khách |

**Đã loại khỏi danh sách lỗi**: `154185236861`, `155756986749`, `155757019517`, `155757052285` — nhóm giao hàng subscription của merchant **thật sự có option DPD giá 0**. Con số 5.90 báo trước đây là do app đọc nhầm sang nhóm đơn mua lẻ.

## Cần merchant xác nhận

1. **Publish Pacific Tuna & Sardine vào catalog Europe + France** ← chặn 23/25 dòng ở phần A
2. Xác nhận giá đúng cho 4 sản phẩm ở phần A
3. Nhắc 9 khách ở phần D đổi thẻ
4. Rate 0.00 cho đơn định kỳ có cố ý không (phần E)
5. 3 ca nửa giá ở phần B có phải khuyến mãi không
