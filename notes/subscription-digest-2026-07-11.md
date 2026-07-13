---
type: note
title: Digest Joy Subscription 2026-07-11 — installment giá theo variant, multi-theme widget, bug volume discount đa tầng
summary: Learning MỚI so với digest 07-08/09/10 — giá installment ăn theo variant (bỏ enforceFixedPrice), 2 mode partial vs defer-last, bug volume discount rớt ở display-path/discount code AOV/stale lib, gotcha 2 cart-form + AOV chiếm add-to-cart, deploy 1 block lên nhiều theme.
tags: [shopify, subscription, billing, debug, storefront]
created: 2026-07-11
updated: 2026-07-12
source: subscriptions (session history — chưa xác minh hết chi tiết)
---

# Digest — Joy Subscription (2026-07-11)

> CHỈ chứa phần MỚI so với [[subscription-installment-horizon-digest]] (07-08),
> [[subscription-digest-2026-07-09]], [[subscription-digest-2026-07-10]] và [[subscriptions-debug-runbook]].
> "chưa xác minh" = chưa confirm hết chi tiết trong session. Proposal chờ brain-learn duyệt.

## Feedback (cách làm việc)

- **Tận dụng cơ chế đang chạy, đừng dựng nhánh code song song.** Cơ chế "Customize each order" (per-cycle rotation) đã bung bundle đúng cho installment — chỉ cần thay đúng phần giá, không viết expansion path mới. User: *"cơ chế vẫn work mà sao ko tận dụng?"*.
- **Verify logic trước khi phán cơ chế.** Khẳng định sai "cart-transform bung bundle cho subscription" (thực ra cart-transform chỉ cho ONE-TIME; subscription bung ở backend contract-create) → bị chỉnh. Đọc code xác nhận flow, nêu rõ chỗ đang giả định. (Khớp [[feedback-follow-conventions]].)
- **Text customer-facing cho merchant nước ngoài phải English — audit toàn bộ.** Note/label sinh tiếng Việt lọt vào order + Theme editor. Soát mọi string đi vào order, không chỉ chỗ được point. (Khớp [[subscription-work-style]].)

## Decisions (kèm Why)

- **Giá installment ăn theo PRODUCT variant, KHÔNG theo giá setup fixed bundle.** Bỏ hẳn `enforceInstallmentFixedPrice`. Why: merchant thêm variant tay ($100/$200/$300) trên sản phẩm cha; fixed bundle chỉ để setup "cycle giao gì". Charge giá variant as-is mọi kỳ. Khi bật Installment: 2 radio "Use product prices/Use fixed price" **disable (grey-out) chứ không ẩn**, ẩn ô Order price từng cycle. (Cập nhật [[2026-07-08-installment-mode-design]].)
- **Hai mode installment khác nhau CHỈ ở origin/mid order:** `partial` = mọi order thêm children @$0 (giao từng phần); `defer-last` = origin & mid parent-only, chỉ payment cuối của lifecycle mới collapse toàn bộ children để giao. Phân biệt qua property `_joy_installment_mode`.
- **Loại 3 hướng fix race auto-swap (Why):** (1) direct mirror-write — loop N orders **vỡ functions memory + Shopify bucket**; (2) deferred re-sync Cloud Task — **đổi kiến trúc app**; (3) đẩy qua Redis — không chữa đúng bug. → Fix gọn trong luồng webhook, gate `trigger === 'contract_create'`.
- ~~**Auto-swap reprice: giữ `basePrice = catalog price`, chỉ bake vol% ở `autoSwapService`; freq% để display tự áp.**~~ **SUPERSEDED 07-12:** vol% thực ra do Shopify discount code của AOV áp (`discountAllocations`), app bake lại là double-count → đã revert hẳn Phase 2 vol-reprice. Xem [[subscription-digest-2026-07-12]].

## Bugs (root cause)

- **Recurring order thiếu volume discount dù đã deploy — đa tầng:**
  - **Display-path drop field:** `orderController.getOne` re-compute `lines` qua `prepareLineDiscountData` mà **không pass `autoSwapVolumePct`** → rớt vol, dù write/billing path pass đúng. Bài học: write-path đúng ≠ mọi display-path đúng, grep hết nơi re-compute.
  - **Red-herring:** vol% thật trên contract prod đến từ **Shopify subscription discount code `AOVAI_*`** (nằm ở `discountAllocations`), không qua capture của app → query `discountAllocations` mới thấy sự thật.
  - **Stale `lib/` build:** verify bằng helper require từ `lib/` cho kết quả CŨ vì `lib` chưa rebuild sau commit `src/`. Verify nên require thẳng `src/` hoặc rebuild `lib` trước.
- **"Đổi frequency → mua ra one-time": inject vào NHẦM cart-form.** Product page có **2 form** `action*="/cart/add"`; widget inject `selling_plan` vào form ngoài `product-form-component` nhưng theme submit form kia. Phải target đúng form theme thực sự submit.
- **AOV chiếm quyền add-to-cart:** khi app AOV active, nút Add-to-cart bị AOV intercept → `POST /cart/add.js?app=aov-ai-bundle`, AOV tự build cart line (`_aov_bundles`) → `properties[...]` gắn qua theme-form có thể không tới order. Muốn giữ property phải hook vào request của AOV. (chưa xác minh chi tiết ownership.)
- **AOV subscription widget tự reset về one-time SAU khi drive** → phải re-drive (poll tiếp), không drive một phát.
- **Volume widget sai giá do `discountType: "fixed"`.** AOV dùng fixed ($ off) không phải %; widget mặc định tính % → lệch (127.47 vs 134.97). Đọc `offer.discountType`, xử lý cả `fixed` lẫn `percentage`.
- **Card price frozen:** card đọc `c.tier` đóng băng lúc build DOM, trong khi AOV load tier data SAU → lệch với button (đọc live). Build DOM 1 lần nhưng đọc tier LIVE trong `applySelection`.

## Techniques / Gotchas

- **Deploy 1 block lên nhiều theme khách:** Horizon (`stringflags`) vs Elixir (`reformlabs`) có selector giá khác nhau — Horizon `<product-price ref="priceContainer">`; Elixir `.shop-product-price-container`/`.shop-compare-price`/`.shop-save-price`. Soi selector từng theme, không hardcode 1 bộ.
- **`type: "color_scheme"` trong schema kéo color scheme của theme** → theme không định nghĩa scheme trong `settings_data`/`settings_schema` sẽ lỗi "Unable to display color schemes". Bỏ setting đó, để block kế thừa scheme của section (đừng hardcode `.color-scheme-1`). (Mở rộng 07-08.)
- **Storefront data qua metafield + cron 1 phút:** widget đọc product metafield (`avada_subscription`/`avada_bundle`), không gọi API live. Cron mỗi phút + trigger lúc save plan mới sync xuống metafield → đổi plan phải **re-save/đợi cron** mới propagate (giải thích "re-save mới đúng giá").
- **Rebuild-DOM-once chống flicker ảnh:** wipe innerHTML mỗi lần chọn làm `<img>` reload/nháy. Tách build-DOM-1-lần vs `applySelection` (chỉ update class/giá/nút).
- **Liquid `[...]` lookup không nhận filter:** `all_products[handle | default:'...']` fail — `assign` handle trước rồi mới lookup.
- **Giới hạn schema live-editor (Theme Check MCP không bắt):** block schema name ≤25 ký tự, setting label ≤70 ký tự, `default` không được blank.

## Liên quan
- [[subscriptions]] · [[subscription-installment-horizon-digest]] · [[subscription-digest-2026-07-09]] · [[subscription-digest-2026-07-10]] · [[subscriptions-debug-runbook]] · [[2026-07-08-installment-mode-design]] · [[subscription-work-style]] · [[app-development]]
