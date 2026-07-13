---
type: note
title: Digest Joy Subscription 2026-07-12 — revert Phase 2 vol-reprice (vol do AOV discount code), rule update installment
summary: Learning MỚI so với digest 07-11 — kết luận cuối: bỏ hẳn app-side capture/reprice volume vì vol% đến từ Shopify discount code của AOV; update installment chỉ đụng metafield, bỏ validate giá; verify bằng helper thật + lib phải rebuild.
tags: [shopify, subscription, billing, debug]
created: 2026-07-12
updated: 2026-07-13
source: subscriptions (session history — chưa xác minh hết chi tiết)
---

# Digest — Joy Subscription (2026-07-12)

> CHỈ chứa phần MỚI so với [[subscription-digest-2026-07-11]] và các digest trước.
> Phần lớn saga debug (display-path getOne, 2 cart-form, AOV intercept, stale lib,
> basePrice/freq) đã nằm trong [[subscription-digest-2026-07-11]] — không lặp lại.

## Decisions (kèm Why)

- **BỎ HẲN app-side capture + reprice volume cho auto-swap (revert Phase 2 pricing).**
  Sau khi truy nguồn số thật trên contract prod: vol% thực ra được áp bằng **Shopify
  subscription discount code của AOV** (`AOVAI_*`, nằm trong `discountAllocations`),
  KHÔNG phải do app tính. Nên toàn bộ hướng "widget inject `_joy_swap_vol_pct`/`_joy_swap_qty`
  → capture → bake vào `currentPrice`" là **thừa và double-count**. Đã revert giá ở mọi
  call-site (orderRepository x3, backgroundHandler, shopifyService,
  subscriptionContractUpdateService, `orderController.getOne` x2) + xóa dead code
  (`autoSwapCapture.js`, injection ở widget). Commits `97adeeb85`, `5ab008c98`.
  → **Bài học chốt:** trước khi dựng tầng reprice, phải xác minh discount đang sống ở
  đâu (baked vào `currentPrice` vs `discountAllocations`/Shopify discount code). Nếu
  Shopify/AOV đã áp qua discount code thì app **không** được áp lại.
  (Sửa lại giả định trong [[subscription-digest-2026-07-11]] về "bake vol% ở autoSwapService".)
- **Giữ `buildAutoSwapMetafield` — nó chỉ expose title/price sản phẩm swap cho widget
  ("From 2nd payment onwards"), KHÔNG dính logic giá.** Tách rõ dead (capture vol) vs
  vẫn-dùng (metafield expose) trước khi dọn, để không xóa nhầm.

## Bugs / Root cause (mới)

- **Update contract khi Installment vẫn gọi API set product + validate giá từng order
  → sai.** Khi ở chế độ installment, update chỉ nên **cập nhật metafield**, KHÔNG gọi lại
  API set product và KHÔNG chạy validation giá per-order (giá đã bám variant). Bỏ validation
  đó cho nhánh installment.

## Techniques / Gotchas

- **Verify bằng helper thật, đừng đoán — nhưng phải require đúng build.** Chạy
  `prepareLineDiscountData`/`prepareOrderSubscription` thẳng từ `lib/` cho kết quả CŨ khi
  `lib` chưa rebuild sau commit `src/` (grep `lib` = 0 occurrence của logic vol ⇒ stale).
  Rebuild `lib` (hoặc require `src`) rồi mới tin số. (Nhấn lại gotcha stale-lib ở 07-11.)
- **Đọc nhầm `grep -c` = "đã pass field".** `orderRepository:64` tưởng thiếu `autoSwapVolumePct`
  hóa ra đã pass đúng (đọc nhầm dòng grep) — bug thật nằm ở **display path** `getOne`
  re-compute. Bài học: xác nhận từng call-site bằng đọc code, không suy từ 1 dòng grep.
- **`invalid_grant` khi nested `getContractById` lúc chạy helper offline** làm
  `subscriptionContract=null` → `prepareLineDiscountData` early-return giá raw, dễ hiểu nhầm
  là "code không áp discount". Kiểm tra contract có load được không trước khi kết luận.

## Liên quan
- [[subscription-digest-2026-07-11]] · [[subscription-digest-2026-07-10]] · [[subscription-digest-2026-07-09]] · [[subscription-installment-horizon-digest]] · [[subscriptions]] · [[subscriptions-debug-runbook]] · [[2026-07-08-installment-mode-design]] · [[subscription-work-style]]
