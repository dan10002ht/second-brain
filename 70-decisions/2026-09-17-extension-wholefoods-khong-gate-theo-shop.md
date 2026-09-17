---
type: decision
title: Extension Wholefoods live cho mọi merchant, chỉ đổi tên thành "Subscriptions (Custom)" — không dựng cổng theo shop
summary: Chấp nhận extension custom viết riêng cho Joy Wholefoods xuất hiện trong danh sách "thêm page" của mọi merchant; biện pháp duy nhất áp dụng trước khi live là đổi tên hiển thị sang chuỗi trung tính, còn cờ chặn theo shop thì hoãn.
tags: [subscription, shopify, extensions, avada, architecture]
created: 2026-09-17
updated: 2026-09-17
review: 2026-12-17
source: project `subscriptions` — session history 2026-09-17 (soát go-live nhánh `feat/wholefoods-portal`); dantt chốt trong chat
---

# Extension Wholefoods: đổi tên, không gate theo shop

## Bối cảnh

`extensions/customer-account-ui-wholefoods` là customer-account extension viết riêng cho một khách
(Joy Wholefoods / `sprayfreefarmacy`). Lúc soát go-live mới lộ ra: nó là
`customer-account.page.render` **thứ hai** trong cùng app Joy Subscription, và Shopify **không có**
cơ chế giới hạn extension theo shop — cơ chế đầy đủ ở
[[extension-khong-gioi-han-theo-shop]]. Nghĩa là mọi merchant đã cài app sẽ thấy
`Joy Wholefoods Subscriptions` trong danh sách chọn thêm page.

Hai đường được đặt lên bàn:

1. Đổi `name` sang chuỗi trung tính.
2. Thêm cờ trong dữ liệu shop, extension đọc lúc mount và render `null` nếu không bật.

## Quyết định

**Làm (1), hoãn (2).** dantt chốt: *"Subscriptions (Custom) để như này cũng đc nhé"* và với cổng theo
shop: *"kệ cũng đc, để sau"*.

Chỉ đổi `name`; `handle` và `uid` giữ nguyên.

## Why

- **Rủi ro thật là lộ tên khách, không phải lộ tính năng.** Chuỗi `Joy Wholefoods Subscriptions` nằm
  trong danh sách mà merchant nào cũng đọc được — đó là thông tin về một khách hàng cụ thể. Đổi tên
  xử lý đúng phần đó bằng một dòng toml.
- **Merchant khác phải tự tay thêm page mới thấy được gì.** Extension không tự xuất hiện; nó chỉ nằm
  trong danh sách. Xác suất một merchant vô tình thêm một page tên `Subscriptions (Custom)` rồi giữ
  lại là thấp, và hậu quả là một trang không dùng được chứ không phải hỏng dữ liệu.
- **Cờ chặn theo shop không rẻ như nghe.** Nó cần metafield definition có `customerAccount: READ`,
  một đường ghi (devzone), và một nhánh render rỗng — tức thêm ba chỗ có thể sai, trong khi đúng
  ngày đó nhánh còn chưa từng chạy trên store production lần nào.
- **Nó cũng không che được bước nguy hiểm nhất.** Cờ chặn *nội dung*; nó không xoá extension khỏi
  danh sách chọn page. Nên (2) không thay được (1), chỉ cộng thêm.
- **`handle`/`uid` giữ nguyên nên đổi tên là thao tác không rủi ro** với merchant đã thêm page.

## Tradeoff

- **Mọi merchant vẫn thấy một mục lạ trong danh sách thêm page.** Không có ngày hết hạn cho tình
  trạng này trong quyết định — nó kéo dài tới khi có người dựng cổng (2).
- **Merchant nào đã thêm page thì thấy nội dung thật**, chạy trên dữ liệu shop của họ. Chưa ai kiểm
  extension này hành xử thế nào trên một shop không có fixed bundle, không có attribute Bird và
  không bật `enabledFixedBundleStaples` — khả năng cao là trang rỗng hoặc hiện sai nhãn, chứ không
  phải lỗi dữ liệu, nhưng **chưa xác minh**.
- **Tên trung tính làm mất tín hiệu.** `Subscriptions (Custom)` không nói cho ai biết nó là của
  khách nào; sáu tháng sau, người sửa nó sẽ phải tra git để biết vì sao có hai page render. Bù lại
  bằng note này và README của extension.
- **Nợ kỹ thuật được ghi nhận nhưng không có chủ.** "Để sau" không kèm ticket.

## Điều kiện xét lại

Đọc lại khi: có merchant thứ hai thêm page này (kể cả vô tình); hoặc khi app cần bán chính extension
đó cho khách thứ hai — lúc đó cổng theo shop không còn là phòng ngừa mà là tính năng; hoặc khi có
thêm một extension custom nữa cho khách khác, vì lúc đó cách "đổi tên trung tính" hết dùng được.

Liên quan: [[subscriptions]] · [[extension-khong-gioi-han-theo-shop]] ·
[[2026-09-09-portal-wholefoods-extension-rieng]] · [[digest-subscriptions-2026-09-17]] ·
[[2026-09-10-devzone-hide-recurring-pricing]] · [[shopify-app-dev]]
