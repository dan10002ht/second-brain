---
type: resource
title: Shopify app development
tags: [shopify, polaris, extensions, billing]
created: 2026-07-06
updated: 2026-07-06
---

# Shopify app development

Kiến thức nền tái dùng cho mọi app Shopify embedded (xem area [[shopify-app-dev]]).

## Thành phần một app embedded

- **Admin UI**: React + **Polaris** + **App Bridge** (nhúng trong Shopify admin).
  Polaris icons format v9 (không suffix Minor/Major).
- **Storefront**: widget nhúng theme (Preact cho nhẹ), theme app extension.
- **Backend**: webhook handler + API cho admin/storefront.
- **Extensions** (`extensions/`): Functions, Flow triggers, Customer Account UI,
  cart-transform, product-discount, POS, theme-app-extension, post-purchase-upsell.

## Billing

- Charge qua **Shopify Billing API** (recurring/one-time/usage).
- Feature-gating theo gói: service kiểu `limitFeatureService` + cron reset hàng tháng.
- Ví dụ thật: [[subscriptions]] (recurring contract + billing attempt),
  [[joy]] (`chargeAnnualPlan` + `afterChargeService`).

## Multi-env & deploy

- Nhiều `shopify.app.*.toml` (dev/staging) — **link đúng config trước khi deploy**.
- Deploy qua Shopify CLI + Firebase. Bump `api_version` extension định kỳ (vd 2025-10).

## Gotcha

- Webhook phải idempotent (Shopify gửi lại).
- Theme migration (vd Horizon block) là nguồn bug dai dẳng cho storefront.
- Multi-currency (Shopify Markets) + multi-location → cẩn thận pricing.

## Liên quan
- [[shopify-app-dev]] · [[firestore-multitenant]] · [[controller-service-repository]]
- [[subscriptions]] · [[joy]] · [[avada-core]]
