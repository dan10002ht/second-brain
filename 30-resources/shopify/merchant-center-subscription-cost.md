---
type: resource
title: `subscription_cost` là feed attribute của Merchant Center, không phải structured data
summary: Thuộc tính hiển thị giá theo kỳ trong quảng cáo Shopping đến từ product feed của Merchant Center chứ không phải schema.org/JSON-LD — nên nó ảnh hưởng Shopping ads, không ảnh hưởng SEO, và app subscription chỉ chạm được vào nó gián tiếp qua metafield mà feed app đọc được.
tags: [shopify, subscription, marketing-automation, storefront]
created: 2026-08-19
updated: 2026-08-19
source: project "subscriptions" — session history 2026-08-19 (research doc Google Merchant Center)
---

# `subscription_cost` — feed attribute, không phải structured data

Điểm dễ nhầm đầu tiên và cũng là điểm quan trọng nhất: trang
`support.google.com/merchants/answer/7437904` mô tả một **attribute của product feed** trong
Google Merchant Center. Nó **không** nằm trong danh sách structured data (schema.org /
JSON-LD) mà Google hỗ trợ, nên không có cách nào "gắn nó vào trang sản phẩm" bằng markup.

## Hai bề mặt khác nhau, đừng gộp

| | Chạy trên | Ảnh hưởng |
|---|---|---|
| Structured data (JSON-LD) | trang web thật, Googlebot crawl | kết quả tìm kiếm tự nhiên (SEO) |
| Feed attribute (`subscription_cost`) | dữ liệu đẩy lên Merchant Center | **quảng cáo Shopping**, không phải SEO |

Kết quả kỳ vọng khi làm đúng: quảng cáo Shopping của sản phẩm đó **đổi cách hiển thị giá** —
từ giá trọn gói sang dạng giá theo kỳ (ví dụ "$X/tháng trong N tháng") cho hàng bán theo gói
định kỳ.

## Vị trí của một app subscription trong bức tranh này

App **không** đẩy feed lên Google — việc đó thuộc về kênh Google & YouTube của Shopify hoặc
các feed app (Simprosys, DataFeedWatch). Nhưng app là bên **độc quyền giữ dữ liệu kỳ hạn**
(tần suất, số kỳ, giá mỗi kỳ), thứ mà feed app không tự suy ra được. Đòn đẩy thực tế vì vậy
là: ghi dữ liệu đó ra nơi feed app đọc được, để merchant map sang `subscription_cost`.

**Chỗ quyết định là namespace của metafield, không phải cách set.** Shopify chia metafield
theo namespace và feed app chỉ đọc được phần được phơi ra — nên "set bằng cách nào" không
quan trọng bằng "set vào namespace nào". *Chưa xác minh*: danh sách namespace cụ thể mà từng
feed app đọc — cần đối chiếu tài liệu của chính feed app trước khi hứa với merchant.

Liên quan: [[subscriptions]] · [[app-development]] · [[digest-subscriptions-2026-08-19]]
