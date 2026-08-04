---
type: note
title: Digest Joy Subscription — 2026-08-04 (block custom làm controller cho widget AOV)
summary: CHỈ phần mới — pattern "block của mình = controller, block AOV bị ẩn = engine" khi custom theme cho khách, kèm luật hiện badge của AOV volume (isDefault → badge global, còn lại theo isShowBadgeEachTier).
tags: [subscription, shopify, extensions, storefront, avada]
created: 2026-08-04
source: project "subscriptions" — session history (mined 2026-08-04)
---

# Joy Subscription — digest 2026-08-04

> Các session mined lần này gần như trùng hoàn toàn với những gì đã ghi:
> deploy chết vì CI pin Shopify CLI 3.86.1, `defer-last-discount` thiếu
> `@graphql-codegen/cli`, shadow yarn classic trong extension, nhánh bị đổi ngoài
> session → đã có ở [[digest-subscriptions-2026-08-03]]. BigQuery cost gộp nhiều
> project (phồng ~7×), order "from App (via import)", 3DS, PubSub singleton, giá
> one-time bake vào metafield → đã có ở [[subscription-digest-2026-07-13]],
> [[digest-subscriptions-2026-07-18]], [[digest-subscriptions-2026-07-24]],
> [[digest-subscriptions-2026-07-25]]. Dưới đây **chỉ** phần chưa ghi.

## Techniques

- **Block custom của mình làm _controller_ cho block AOV, không tái hiện logic AOV.**
  Khi khách cần UI riêng (reformlabs, rồi string-flags) nhưng giá/discount/ATC phải
  giữ nguyên hành vi của app AOV Bundle:
  1. Ẩn block AOV bằng CSS (`.Avada-Bundle-Offer__Volume { display: none !important }`),
     **không xoá** — nó vẫn là engine tính giá và bơm discount/selling plan.
  2. Block của mình render UI từ biến `AVADA_BUNDLE` / `AVADA_SUBSCRIPTION`.
  3. Mỗi thao tác trên UI của mình thì **click/select tương ứng vào DOM của AOV**
     (`.Avada-Volume__Item`, `.AOV-SubscriptionsWidget__Option`…).

  Lợi: không phải copy logic giá/discount (chỗ dễ lệch nhất), khi AOV đổi logic thì
  vẫn ăn theo. Rủi ro: **phụ thuộc class DOM của app khác** — AOV đổi markup là gãy;
  cần verify không duplicate CSS (block dùng `{% stylesheet %}` thì hide-rule phải
  nằm trong đó, không thêm `<style>` riêng).

- **Luật hiện badge của AOV volume** (soi từ config + render thật, không đoán):
  config có `badgeText` ở *mọi* tier nhưng AOV chỉ hiện 2 trường hợp —
  tier `isDefault` hiện **badge GLOBAL** (`setting.volumeDiscount.badgeText`, bỏ qua
  `badgeText` riêng của tier), các tier khác chỉ hiện khi `isShowBadgeEachTier: true`.
  Muốn badge riêng từng tier thì phải **tắt global badge**, nếu không tier default
  luôn đè.

## Bugs (root cause)

- **BQ cost tăng ~$18/ngày 3 ngày liên tiếp**: truy về query trong
  `subscriptionPlanBQService.js` dựng danh sách `productIds` thành IN-list rồi quét
  bảng plans — pattern này nhảy lên top delta GiB/ngày.
  *(chưa xác minh: chưa thấy bước fix + đo lại sau khi sửa trong session này)*

## Liên kết

[[subscriptions]] · [[subscriptions-debug-runbook]] · [[digest-subscriptions-2026-08-03]] ·
[[subscription-digest-2026-07-13]] · [[digest-subscriptions-2026-07-25]] ·
[[app-development]]
