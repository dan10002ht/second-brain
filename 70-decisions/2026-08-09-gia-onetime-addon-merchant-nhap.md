---
type: decision
title: Giá add-on one-time do merchant nhập trong setup fixed bundle, không bake giá variant
summary: Joy Subscription bỏ việc copy `variant.price` của add-on vào metafield; merchant gõ một field "add-on price" (base currency) trong setup product fixed bundle, còn giá parent luôn lấy live từ variant đang chọn.
tags: [subscription, shopify, avada, storefront, billing]
created: 2026-08-09
updated: 2026-08-09
review: 2026-11-09
source: project "subscriptions" — session history (String Flags, one-time purchase $3.741)
---

One-time price của fixed bundle installment giờ tính là:

```
total = giá variant parent đang chọn (LIVE)  +  config.price × presentmentCurrencyRate
```

`config.price` là **một field merchant nhập** trong màn setup product fixed bundle
(`OneTimePurchaseCard`), lưu ở base currency, hiển thị kèm symbol lấy từ helper sẵn có
`currencySymbol({currency: shop.currency})`. Metafield không còn giữ `price` theo từng add-on.
Cả 4 surface đi cùng một công thức: editor, `buildOnetimeAddonValue`, cart-transform
(`onetimeExpand.js`), widget (`oneTimeTotalCents`).

## Why

- Bake `variant.price` vào metafield tạo **hai nguồn sự thật**: đổi giá product mà không re-sync
  bundle là lệch âm thầm. Đây chính là bug $3.741 (xem [[digest-subscriptions-2026-08-09]]).
- Giá copy được là **presentment currency** của store đa thị trường (CAD 3.322 thay vì USD 2.360),
  rồi cart-transform còn nhân thêm `presentmentCurrencyRate` → sai hai lần.
- Phương án sạch hơn về lý thuyết — **lưu variant ID rồi resolve giá live ở storefront** — bị loại
  vì `onetimeExpand.js` là Shopify Function: không gọi được mạng, không query storefront lúc
  chạy. Nó chỉ đọc được input của cart. Nên "lấy giá live" chỉ khả thi cho phần parent (đã có
  trong cart input), không cho add-on.
- Merchant nhập tay biến metafield thành nguồn **duy nhất và có chủ ý** cho phần add-on, thay vì
  một bản sao có thể lệch.

## Tradeoff

- Merchant phải tự cập nhật field khi đổi giá sản phẩm add-on — app không còn tự đồng bộ. Đổi
  "stale âm thầm" lấy "phải nhớ sửa một chỗ".
- Bundle cũ chưa re-sync vẫn cần **fallback legacy** trong cart-transform để không charge 0.
- Field là base currency: store đa thị trường quy đổi bằng `presentmentCurrencyRate`, nên số
  khách thấy có thể lệch vài cent so với bảng giá Shopify Markets do làm tròn. *Chưa xác minh*
  mức lệch thực tế.
- Kiểu field đã đổi một lần giữa chừng (tổng one-time → chỉ giá add-on) vì có nhiều variant parent
  giá khác nhau; nếu sau này parent chỉ còn một variant thì lựa chọn này thành phức tạp thừa.

→ [[digest-subscriptions-2026-08-09]] · [[digest-subscriptions-2026-07-25]] · [[subscriptions]]
