---
type: decision
title: Get notified trên landing joyxjoy — widget tự dựng modal, gọi thẳng Klaviyo client API
summary: Bỏ hướng tái dùng form back-in-stock của theme (`openForm`) trên landing joyxjoy; widget tự dựng modal và POST thẳng `/client/back-in-stock-subscriptions/` của Klaviyo với variant id đo được từ PDP, vì một trang chỉ mang được MỘT product context còn landing hiện hàng trăm sản phẩm khác variant.
tags: [subscription, shopify, avada, storefront, marketing-automation]
created: 2026-09-23
review: 2026-12-23
source: repo `subscriptions` — commit `ef8c0f908` (MR !2630, merge `011c1729c`, tag `v2.35.59`), đo trên production
---

# Get notified trên landing joyxjoy: gọi thẳng Klaviyo client API

## Bối cảnh

Khách Joy Wholefoods muốn sản phẩm hết hàng **hiện ra** (xuống cuối danh sách) thay vì bị ẩn, kèm
nút "Get notified" giống trang collection của theme. Hướng rẻ nhất — và hướng được thử trước — là
gọi lại chính form Klaviyo mà theme đã có.

## Quyết định

Không tái dùng form của theme. Widget landing tự dựng modal và gọi **thẳng** Klaviyo client API:

- `POST /client/back-in-stock-subscriptions/` với
  `relationships.variant.data.id = $shopify:::$default:::<variantId>` — payload này đo được từ PDP
  của chính shop, không suy diễn từ tài liệu.
- Checkbox marketing gọi thêm `/client/subscriptions/` với list `RZJvhL` và `custom_source` giống
  form của theme, để hai lối vào rơi vào **cùng một audience**.
- Public company id đọc runtime từ script onsite của theme, không hardcode.
- Helper từ chối gửi khi thiếu `variantId` thay vì để Klaviyo trả 400.

Bằng chứng: `ef8c0f908` (nhánh `feat/joyxjoy-soldout-last-get-notified`), merge `011c1729c`
(MR !2630, tag `v2.35.59`, 2026-09-22).

## Why

Đo trên **production**, không đọc code đoán:

1. `openForm` của Klaviyo **không nhận tham số variant**.
2. Klaviyo lấy product context **từ trang**. Landing có `__st.rtyp="page"` và không có
   `meta.product` — nên submit form đó ở landing chỉ tạo **profile**, KHÔNG tạo back-in-stock
   subscription. Tức hướng cũ hỏng *im lặng*: khách bấm xong, tưởng đã đăng ký.
3. Chèn một product form giả vào DOM cũng không đổi được điều đó.

Lý do gốc là một giới hạn kiến trúc, không phải một bug vá được: **một trang chỉ mang được một
product context**, còn landing hiện hàng trăm sản phẩm khác variant. Mọi cách tái dùng form theme
đều đụng cùng bức tường này.

## Tradeoff

**Được:**
- Đúng variant cho từng sản phẩm trên landing — thứ mà form theme về nguyên tắc không làm được.
- Lỗi lộ ra: Klaviyo trả 400 thì modal **giữ form để thử lại** và không báo thành công giả.
- Hai lối vào (landing và theme) cùng list, cùng `custom_source` nên audience không tách đôi.

**Mất / nợ lại:**
- Tự cầm một endpoint của bên thứ ba. Klaviyo đổi shape payload hay đổi id scheme
  (`$shopify:::$default:::`) thì landing hỏng mà không ai báo — không có contract test nào với
  Klaviyo, payload được chép từ một lần đo trên PDP.
- Modal, validate, reset state, Esc, mobile — đều tự viết, tự bảo trì.
- **Chưa có bằng chứng mail thực sự gửi**: Klaviyo trả `202` chỉ nghĩa là *nhận yêu cầu*. Phải để
  khách xác nhận trong Klaviyo dashboard. Đây đúng là [[ack-khong-phai-hieu-ung]] — nhận ≠ đã xảy ra.
- Nút Get notified trên collection page **của theme** vẫn nhận email rồi bỏ đó (commit ghi rõ là
  ngoài phạm vi). Tức shop hiện có hai nút cùng tên, một cái chạy thật một cái không.

## Điều kiện review (2026-12-23)

- Khách đã xác nhận trong Klaviyo dashboard là mail back-in-stock thật sự gửi chưa?
- Nút trên collection page của theme đã được vá chưa, hay vẫn nuốt email?
- Klaviyo có phát hành API/SDK chính thức nhận variant không — nếu có, phần tự viết nên co lại.

Liên quan: [[subscriptions]] · [[shipped-subscriptions-2026-09-23]] (cùng đợt, ở `00-inbox/`) ·
[[2026-09-16-landing-doi-nguon-lap-sang-collection-list]] ·
[[2026-09-18-cta-product-page-giu-add-to-cart-cua-theme]] ·
[[ack-khong-phai-hieu-ung]] · [[fixture-khong-phai-hop-dong-du-lieu]] ·
[[bang-chung-phan-biet-duoc]]
