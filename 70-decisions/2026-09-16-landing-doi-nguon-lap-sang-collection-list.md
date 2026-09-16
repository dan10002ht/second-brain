---
type: decision
title: Landing joyxjoy — bỏ `all_products`, lặp theo `collection_list` để gỡ trần 20 handle
summary: Trần 20 unique handle của `all_products` là giới hạn cứng của Shopify, nên thay vì cap/cảnh báo merchant, section đổi nguồn lặp sang picker `collection_list` (20 collection × 50 sản phẩm ≈ 1000 box) và giữ `all_products` làm nhánh fallback loại trừ, không cộng dồn.
tags: [subscription, shopify, storefront, avada, architecture]
created: 2026-09-16
updated: 2026-09-16
review: 2026-12-16
source: project `subscriptions` — session history 2026-09-16 (nhánh `fix/joyxjoy-landing`, store joywholefoods.com.au)
---

# Landing joyxjoy: đổi nguồn lặp sang `collection_list`

## Bối cảnh

Sau khi migrate 63 sản phẩm sang Fixed Bundle, payload landing có **72 bundle** nhưng trang chỉ hiện
**1**. Nguyên nhân là giới hạn có ghi trong docs Shopify:

> `all_products` — *"has a limit of **20 unique handles per page**."*

Chỉ 19 handle đầu resolve được; từ vị trí 19 trở đi rỗng hết. Thêm hai chi tiết: handle không resolve
trả `EmptyDrop` **vẫn truthy** nên `{%- if p -%}` không lọc được (phải kiểm `p.id`), và sản phẩm
`UNLISTED` thì `all_products` không nhìn thấy dù Admin API vẫn trả về.

Phương án đầu tôi đưa ra là **cap ở 20 + cảnh báo trong design mode** để merchant biết vì sao box
biến mất. dantt bác thẳng: *"khách enterprise làm mấy cái chặn như vậy ko ổn đâu cha"* — xem
[[feedback-gioi-han-platform-thi-go-khong-chan]].

## Quyết định

Section không lặp qua `all_products[handle]` nữa. Thêm setting `box_collections` kiểu
`collection_list`, và lặp theo `collection.products`.

| | `all_products` | `collection_list` |
|---|---|---|
| Trần | **20 handle/trang** | 20 collection × 50 sản phẩm = **~1000 box** |
| Sản phẩm UNLISTED | không thấy | thấy (nếu nằm trong collection) |
| Merchant phải làm | không | tự tạo/chọn collection |

Phần emit JSON tách thành snippet `joy-subscription-bundle-json` để hai nhánh lặp dùng chung, không
nhân đôi 45 dòng.

## Why

- **Giới hạn là của Shopify, không phải của mình.** Cap ở 20 chỉ đổi một lỗi im lặng thành một lỗi
  ồn ào — merchant vẫn không bán được box thứ 21. Docs của chính Shopify khuyến nghị đường đi khác
  khi cần hơn 20 sản phẩm.
- **Đường mới không đụng giới hạn đó**, nên trần mới đủ xa để không phải nghĩ lại trong tương lai
  gần. Đo thêm: `selling_plan_groups` chỉ chiếm 34% payload, phần nặng là image URL + title +
  handle, nên metafield cũng chỉ chứa được ~180 bundle trước khi chạm cap 64 KB — tức nút thắt tiếp
  theo nằm ở chỗ khác, không phải ở vòng lặp.
- **Pattern đã có sẵn trong theme Shopify**, không phải phát minh riêng.

## Tradeoff

- **Merchant phải tự dựng collection.** Trước đây không phải làm gì. Nếu chọn nhầm collection (chứa
  box cũ, hoặc chứa meal kit) thì trang hiện sai — và đã xảy ra đúng một lần ngay sau khi live.
- **Hai đường lặp phải cùng tồn tại.** Giữ `all_products` làm fallback cho store đã cài từ trước.
  Chúng là `if / else` **loại trừ nhau, không cộng dồn** — đây là chỗ dễ hiểu nhầm nhất, dantt đã
  hỏi lại đúng điểm này (*"hiện tại vẫn có all_products để backfill đúng ko ?"*). Không, nó không
  backfill.
- **Trần mới là ~1000, không phải vô hạn.** `collection.products` tự cắt im lặng ở 50 nếu không
  `{% paginate %}`. Chưa chạm tới, nhưng nó tồn tại.
- **File Liquid là bespoke của theme khách, CI không đụng tới** (`docs/joyxjoy-theme/`). Mỗi lần đổi
  là merchant phải paste tay — và thiếu snippet thì **trang trắng hoàn toàn**, không phải thiếu một
  phần. Xem [[2026-09-08-bespoke-khong-vao-theme-app-extension]].

## Điều kiện xét lại

Nếu theme app extension phủ được landing này (lúc đó CI deploy được, không phải paste tay), hoặc nếu
số box của một store vượt ~500, thì đọc lại quyết định này.

Liên quan: [[digest-subscriptions-2026-09-16]] · [[subscriptions]] ·
[[feedback-gioi-han-platform-thi-go-khong-chan]] · [[app-development]]
