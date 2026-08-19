---
type: decision
title: Page custom cho một khách sống trong theme của khách, không phải theme app extension
summary: Landing "Build Your Subscription" cho joywholefoods đi bằng Liquid section trong theme khách + một scripttag bundle riêng, thay vì app block trong theme-app-extension hay tái dùng feature Subscription Box.
tags: [subscription, shopify, extensions, storefront, avada, architecture]
created: 2026-08-19
updated: 2026-08-19
review: 2026-11-19
source: project "subscriptions" — session history 2026-08-19 (BRIEF-CUSTOM, joyxjoy landing)
---

# Page custom cho một khách sống trong theme của khách

Một merchant (joywholefoods.com.au, đang migrate từ Appstle) cần trang "Build Your
Subscription" 7 khối theo mockup riêng. Ba phương án nằm trên bàn:

| Phương án | Kết cục |
|---|---|
| Tái dùng feature Box (`fixedBundleBox` / `subscriptionBox`) | **Bỏ** |
| Block trong theme-app-extension của app | **Bỏ** |
| Liquid section trong theme của khách + scripttag bundle riêng | **Chọn** |

Section 1 lấy dữ liệu từ một **shop metafield mới** (`avada_custom_landing`) được dựng lại
mỗi khi merchant save Fixed Bundle, và Liquid inject thẳng vào trang — không thêm route
public, không fetch lúc load. Ràng buộc kèm theo: các box chỉ được chọn chung khi **cùng
selling plan**, nhờ đó một đơn sinh đúng một contract và webhook
`subscription_contracts/create` **không phải đổi một dòng nào**.

## Why

- **Block của theme-app-extension hiện với MỌI merchant cài app.** Shopify không cho giới
  hạn block theo shop ở tầng `{% schema %}` — đưa một trang bespoke vào đó nghĩa là mọi
  merchant khác đều thấy và add được nó.
- **Tái dùng Box là tái dùng nhầm thứ.** Trang này không phải box: `__box_id` mà Box phát ra
  bị **ba** nơi khác đọc (`resolveSwapLineKey` mất khoá selling-plan theo dòng khi swap,
  `processContractLines`/`subscriptionContract` hiển thị dòng như line của box và UI
  customer-account tra không ra, `product-discount` có thể áp nhầm discount). Không phát nó
  ra là hợp lệ — `buildStaplesList` đọc `boxIdAttr?.value || ''`. Nguyên tắc chốt lại:
  **tái dùng kiến thức, không tái dùng code path.**
- **Metafield + Liquid bỏ hẳn latency** so với gọi API lúc render, và CI vốn đã đẩy toàn bộ
  `static/scripttag/*` lên CDN nên bundle mới tự lên, không cần đường deploy riêng.

## Tradeoff

- Trang **không cài được cho merchant khác** bằng UI — mỗi khách mới là một lần copy Liquid
  vào theme của họ. Đây là cái giá cố ý cho một feature bespoke.
- Merchant **phải mở app và save lại từng bundle một lần** thì metafield mới có dữ liệu;
  seed script tạo bundle không đủ. Đây là bước tay, dễ quên, và triệu chứng khi quên là
  **trang trắng** chứ không phải lỗi.
- Bundle riêng nghĩa là code không được các bundle khác dùng lại, và ngược lại — task đầu đã
  suýt vi phạm bằng cách import helper từ `subscriptionBox/`.
- **Không tối ưu size ngay** (chốt riêng): trang đang ~65KB trong khi hai bundle cùng loại
  chạy 198KB, nên tối ưu bây giờ là giải bài toán không tồn tại. Hoãn có chủ ý, đã ghi vào
  brief, không phải quên.
- Web Component/Shadow DOM bị **loại có số liệu**: theme khách chỉ có `blockquote`/`hr`/
  `summary` là selector element trần, 202 rule còn lại đều scope dưới class component — cách
  ly CSS mà Shadow DOM bán không đáng cái giá của nó ở đây.

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-08-19]] ·
[[2026-08-17-installment-bundle-mot-engine]] · [[2026-08-18-volume-tier-line-attribute]] ·
[[app-development]]
