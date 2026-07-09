---
type: decision
title: Thiết kế installment "trả góp" cho Joy Subscription — 2 mode partial vs defer-last
summary: Chốt 2 mode installment phân biệt bằng line-item property, giá bám variant của product, tái dùng engine rotation per-cycle (review 2026-10-08).
tags: [subscription, shopify, billing, avada]
created: 2026-07-08
updated: 2026-07-08
status: active
review: 2026-10-08
source: [[subscription-installment-horizon-digest]]
---

# Thiết kế installment "trả góp" cho Joy Subscription

**Bối cảnh:** Cần thêm khả năng "trả góp" (installment) cho contract subscription trong [[subscriptions]], tái dùng engine rotation per-cycle sẵn có thay vì dựng flow mới.

**Quyết định:**
1. **2 mode phân biệt bằng line-item property `_joy_installment_mode`**:
   - `partial` — mỗi order ship vài child, origin nhận child @$0.
   - `defer-last` — chỉ payment cuối cùng ship tất cả; origin + cycle đầu KHÔNG có child.
   - Loop vô hạn; `period` = số order "Customize each order" mỗi cycle (không hardcode).
2. **Giá installment bám theo variant của PRODUCT** (merchant tự thêm variant $100/$200/... trên parent), charge nguyên si mỗi cycle — KHÔNG dùng bundle price setup. `enforceInstallmentFixedPrice` thêm rồi bỏ.
3. **Admin behavior**: khi installment thì radio price-mode bị **disable** (không hide), ẩn field giá per-cycle, skip validate giá per-order; khi UPDATE installment chỉ ghi metafield, **không gọi productSet** (tránh regenerate/xoá variant thủ công).
4. **Phân biệt contract custom**: `_joy_source`/`source === 'manual'`; property prefix `_` bị ẩn khỏi cart/checkout.

**Why:** tái dùng engine rotation per-cycle sẵn có, chỉ khác cách xử lý giá → ít bề mặt code mới, ít rủi ro. Giá bám variant product cho merchant kiểm soát trực tiếp trên admin Shopify, không cần bundle price setup riêng.

**Tradeoff / đánh đổi:**
- Variant thêm tay thiếu metafield `avada_fixed_bundle_variant` → phải synth metafield từ bundle doc (`synthBundleMetafieldFromDoc`) lúc contract-create, thêm một nhánh async chỉ khi `isInstallment`. Xem [[subscription-installment-horizon-digest]] để biết bug expansion đã trả giá.
- Dùng line-item property làm switch → logic phụ thuộc vào property tồn tại đúng; contract cũ/manual cần xử lý riêng.

## Liên quan
- [[subscriptions]] · [[subscriptions-debug-runbook]] · [[subscription-installment-horizon-digest]]
