---
type: resource
title: Tiền không được lấy float làm chuẩn — kể cả khi đi kiểm sai số của float
summary: `17.935 * 100 === 1793.4999…` nên `Math.round` trên float lệch 1 cent; và khi brute-force đi tìm chỗ lệch, nếu chuẩn đối chiếu cũng là float thì phép kiểm sẽ báo sạch đúng ở những case nó sai.
tags: [billing, js, patterns]
created: 2026-08-24
updated: 2026-08-24
source: [[digest-subscriptions-2026-08-24]]
---

# Tiền không được lấy float làm chuẩn

## Chuyện đã xảy ra

Tính discount cho summary của landing page:

```
8900¢ → giảm 15%
Big.js  → 17.935          (chính xác)
native  → 17.935 * 100 === 1793.4999999999998
Math.round(...)           → lệch 1 cent so với số Shopify tính lúc checkout
```

Giá trị trung gian đúng, nhưng bước **nhân ngược về cents** làm hỏng nó. Fix: giữ nguyên trong `Big()`
tới tận lúc ra số nguyên cents, không bao giờ để một giá trị tiền đi qua `number` rồi quay lại.

## Điều đắt hơn: chuẩn đối chiếu cũng không được là float

Verifier bắt lỗi này bằng brute-force ~9.800 tổ hợp giá × discount, và điểm quyết định là nó dùng **BigInt**
làm đáp án chuẩn. Nếu chuẩn được tính bằng chính `giá * (1 - p/100)` trong float thì hai bên sai giống nhau
và phép kiểm sẽ báo 0 lệch — đúng ở những case nó sai. Đây là một dạng của
[[bang-chung-phan-biet-duoc]]: phép kiểm phải phân biệt được hai giả thuyết, mà float-so-với-float thì không.

## Luật rút ra

| ❌ | ✅ |
|---|---|
| Lưu/tính tiền bằng `number` thập phân | Lưu bằng **integer cents**, tính bằng decimal lib (`big.js`, `decimal.js`) |
| `Math.round(x * 100)` để về cents | `Big(x).times(100)` rồi mới `toNumber()` trên số nguyên |
| Brute-force so kết quả với công thức float | Chuẩn tính bằng BigInt / integer arithmetic |
| Test 3 case tròn trịa (10%, 20%, 50%) | Quét dải giá × dải % — lệch cent chỉ lộ ra ở đuôi thập phân xấu |
| Tin số app tính | Đối chiếu với số **nhà thanh toán tính thật** (cart/checkout của Shopify) |

Case cuối là bằng chứng tốt nhất có được: app tính 7120, Shopify tính 7120 — hai đường độc lập ra cùng số.

Liên quan: [[dong-bo-chan-luong-khong-phai-chuyen-hieu-nang]] (một họ lỗi khác cũng chỉ lộ ra khi đo đúng thứ),
[[digest-subscriptions-2026-08-24]], [[2026-08-24-landing-joyxjoy-dung-plan-cua-app]] (quyết định kéo theo
ràng buộc decimal này).
