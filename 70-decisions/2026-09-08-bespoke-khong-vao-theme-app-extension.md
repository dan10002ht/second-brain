---
type: decision
title: Feature bespoke cho một shop không được nằm trong theme app extension
summary: Card CTA + logic redirect PDP của landing joyxjoy đã ship dưới dạng block trong theme app extension, rồi bị gỡ ra — thứ chỉ phục vụ một merchant thì đi bằng theme của chính merchant đó (section / `custom_liquid`), vì mọi block trong extension đều hiện ra với TOÀN BỘ store cài app.
tags: [avada, subscription, shopify, extensions, architecture]
created: 2026-09-08
updated: 2026-09-08
status: active
review: 2026-12-08
source: project `subscriptions` — session history (landing joyxjoy, SB-16454)
---

## Quyết định

Phần bespoke của trang landing joyxjoy trên PDP (card "Want this every week?" + chặn Add to cart để
chuyển sang trang builder) **không** đi bằng `extensions/theme-app-extension/blocks/*.liquid`, mà đi
bằng **theme của khách**: một file Liquid dán vào block `custom_liquid` có sẵn trong `main-product`.

Đường đi thực tế đã đi qua ba chặng, giữ lại để không lặp:

1. Block theme app extension `joy-bundle-builder-cta` → đã deploy `avada-subscription-staging-286`,
   sau đó **gỡ ra** ở version `287`.
2. Section trong theme khách → sai chỗ: section OS 2.0 chỉ thêm được ở **cấp trang**, không nằm được
   trong khối *Product information* cạnh nút Add to cart.
3. Chốt: file `docs/joyxjoy-theme/custom-liquid/joy-bundle-cta.liquid`, khách dán vào block
   **Custom Liquid** (đã có sẵn trong `main-product` của theme Dawn-like). Guard
   `{%- if product.metafields.avada_fixed_bundle.data and BUILDER_URL != blank -%}` để chỉ chạy trên
   PDP của Fixed Bundle.

Cũng bác luôn phương án sửa thẳng `main-product.liquid` của khách (thêm `{% when 'joy_bundle_cta' %}`):
file đó nặng 148KB và mọi lần khách update theme là mất, trong khi `custom_liquid` cho đúng kết quả.

## Why

- Shopify **không hỗ trợ giới hạn block theo shop** ở tầng `{% schema %}`. Một block nằm trong theme
  app extension thì mọi merchant cài app đều nhìn thấy và add được — kể cả block chỉ có nghĩa với một
  store duy nhất. Đây là lý do user bác thẳng: *"ko nhé, ko add theme app extensions do đây ko phải là
  thứ dùng chung cho toàn bộ store"*.
- Extension còn là thứ đi chung một version với cả app: mỗi lần sửa phần bespoke là một lần
  `shopify app deploy` cho tất cả. Thay đổi nằm trong theme của khách thì phạm vi hỏng dừng ở đúng
  store đó.
- Cùng nguyên tắc đã dùng khi chọn "block trong theme khách" cho chính trang landing từ đầu — quyết
  định này chỉ là áp lại cho phần PDP mà tôi đã làm lệch.

## Tradeoff

- **Mất:** không tự deploy được. Mỗi lần đổi nội dung là khách phải **dán lại** thủ công vào ô Custom
  Liquid; không có versioning, không rollback được bằng app version, và không cách nào biết store đang
  chạy bản nào ngoài việc pull theme về so byte.
- **Mất:** hai file gần giống nhau (`snippets/` và `custom-liquid/`) đã từng cùng tồn tại trong repo và
  gây nhầm ("dùng cái nào?") — phải chủ động giữ đúng **một** file là deliverable.
- **Được:** không có rủi ro rò rỉ block bespoke sang store khác, không phải bump version app cho mỗi
  lần sửa copy, và guard theo metafield giữ cho file vô hại nếu bị dán nhầm trang.
- **Ngưỡng đảo lại:** nếu về sau ≥2–3 merchant cần đúng luồng "PDP Fixed Bundle → trang builder", thì
  nó hết bespoke và nên thành block extension thật, có setting bật/tắt.

Liên quan: [[digest-subscriptions-2026-09-08]] · [[2026-08-24-landing-joyxjoy-dung-plan-cua-app]] ·
[[subscriptions]] · [[app-development]]
