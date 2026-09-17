---
type: resource
title: Shopify không cho giới hạn extension theo shop — cổng phải nằm trong chính extension
summary: Một extension thêm vào app là thêm cho MỌI merchant đã cài app; Shopify không có cơ chế bật/tắt theo shop, nên muốn "chỉ khách này thấy" thì extension phải tự đọc cờ lúc mount và tự render rỗng — và cái không tắt được là mục menu mà merchant tự thêm trong editor.
tags: [shopify, extensions, avada, architecture, patterns]
created: 2026-09-17
updated: 2026-09-17
source: project `subscriptions` — session history 2026-09-17 (soát go-live extension `customer-account-ui-wholefoods`, tra docs Shopify)
---

# Extension không giới hạn được theo shop

Áp cho mọi loại extension của Shopify app (customer account UI, theme app extension, checkout UI,
admin block). Câu hỏi sinh ra note này: *"có cách nào chỉ show extension này cho khách đấy thôi hay
không?"* — và câu trả lời ngắn là **không, ở tầng Shopify**.

## Cơ chế

Extension là **một phần của bản release của app**. Deploy app version nào thì mọi merchant đã cài
app đều nhận bản đó, kèm toàn bộ extension trong đó. Tài liệu Shopify không có field, setting hay
API nào giới hạn một extension theo shop, plan hay tag merchant.

Hệ quả cụ thể cho customer-account extension: một app có thể mang **nhiều**
`customer-account.page.render`. Mỗi cái xuất hiện trong danh sách "thêm page" của mọi merchant, và
tên hiển thị (`name` trong `shopify.extension.toml`) chính là chuỗi merchant nhìn thấy. Nên một
extension custom viết riêng cho một khách sẽ hiện tên khách đó cho tất cả merchant khác, nếu không
đổi tên.

## Cổng duy nhất khả dụng: extension tự chặn

Cổng phải nằm **trong code extension**, chạy lúc mount:

1. Extension đọc settings của shop — ở app này là metafield `avada_subscription_settings.data`
   (metafield definition phải có `customerAccount: READ`, nếu không extension đọc ra rỗng).
2. Có sẵn `shopDomain` trong API context nếu muốn chặn theo domain, nhưng **cờ trong dữ liệu tốt hơn
   domain hardcode** — cùng lý do với [[2026-09-10-devzone-hide-recurring-pricing]].
3. Không thoả điều kiện → render `null`.

## Cái vẫn không tắt được

Mục menu / page mà merchant **đã tự thêm** trong editor không mất đi khi extension render rỗng: họ
vẫn thấy một entry trong nav dẫn tới trang trắng. Và họ vẫn thấy tên extension trong danh sách lúc
chọn thêm page — cổng trong code không che được bước đó.

Nên khi một extension custom đi chung app với mọi merchant, có **hai** việc phải tách rời:

| Việc | Giải pháp |
|---|---|
| Khách khác vô tình **thêm được** và thấy trang | không chặn được ở Shopify — đổi `name` sang chuỗi trung tính (`Subscriptions (Custom)`) để không lộ tên khách và không mời gọi |
| Khách khác **thấy nội dung** nếu đã thêm | cờ trong dữ liệu shop + render `null` |

Đổi `name` an toàn: `handle` và `uid` giữ nguyên nên merchant đã thêm page không bị ảnh hưởng.

## Chưa xác minh

Chưa kiểm liệu Shopify có cho phép giới hạn theo **app version pinning per shop** (giữ một tập
merchant ở version cũ) như một đường lách — chưa tìm thấy trong docs và cũng chưa thử.

Liên quan: [[app-development]] · [[cau-extension-chay-that-tren-store]] ·
[[2026-09-09-portal-wholefoods-extension-rieng]] ·
[[2026-09-17-extension-wholefoods-khong-gate-theo-shop]] ·
[[2026-09-10-devzone-hide-recurring-pricing]] · [[digest-subscriptions-2026-09-17]]
