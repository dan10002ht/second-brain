---
type: resource
title: Storefront nói hết hàng, Admin nói còn — thứ tự loại trừ khi hai API Shopify mâu thuẫn
summary: Khi nút Add-to-cart chết vì `available:false` mà Admin API báo còn hàng, loại trừ theo thứ tự sold-out → cache → market/publication → selling plan, và chấp nhận khả năng index storefront lệch tạm thời rồi tự khỏi — đừng sửa code theo một triệu chứng sắp biến mất.
tags: [shopify, storefront, debug, avada]
created: 2026-08-09
updated: 2026-08-09
source: project "subscriptions" — session history (Reform Labs, ATC không hoạt động)
---

Triệu chứng: nút ATC bị `disabled` + class `sold-out`, network không bắn request nào. Trước khi
nghi widget/JS của mình, xác định **Shopify có coi variant là mua được không** — vì theme render
nút theo `variant.available`, và đó là dữ liệu của Shopify chứ không phải của app.

## Đọc đúng chỗ

| Cần biết | Lấy ở đâu |
|---|---|
| `available` thật của variant (public) | `/products/<handle>.js` — bản `.json` **ẩn** field này |
| Tồn kho, inventory policy, publication, market | Admin API (cần token app) |
| Availability theo từng country | Storefront API + `@inContext(country: …)` |

`@inContext` **chỉ có ở Storefront API**; nhét vào query Admin thì cả query fail chứ không bị bỏ
qua. `storefrontAccessToken` lưu cùng shop là token **public** — test per-country không cần giải
mã access token admin.

## Thứ tự loại trừ

1. **Sold out thật?** `inventoryPolicy: CONTINUE` (sell when out of stock) thì tồn kho 0 vẫn phải
   mua được → hết hàng không giải thích được `available:false`.
2. **Cache CDN?** Thêm query param cache-bust và đọc lại `.js`.
3. **Market / publication?** Product có publish "Online Store", market primary có phủ region đang
   duyệt không. Nếu `availableForSale:false` ở **mọi** country thì không phải per-market.
4. **Selling plan?** `requiresSellingPlan: true` mà theme không gắn plan → không mua được.
5. **Còn lại: index storefront lệch.** Dấu hiệu đặc trưng là Storefront API trả `product: null`
   cho cả id lẫn handle trong khi Admin đọc bình thường. Ca thật: sai lệch tự biến mất sau một
   lúc, `availableForSale` về `true`, ATC sống lại mà không sửa dòng code nào.

## Kỷ luật rút ra

Hai nguồn của cùng một hệ thống mâu thuẫn nhau → **query lại sau một khoảng thời gian trước khi
sửa code**. Sửa theo một triệu chứng sắp tự khỏi vừa vô ích vừa để lại một đoạn code phòng thủ mà
sau này không ai dám xoá vì không hiểu nó chống cái gì. Ghi lại giờ query của từng lần đo — đó là
bằng chứng phân biệt "hết hàng" với "index lệch" ([[bang-chung-phan-biet-duoc]]).

→ [[digest-subscriptions-2026-08-09]] · [[app-development]] · [[shopify-app-dev]]
