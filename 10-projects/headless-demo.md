---
type: project
title: headless-demo
summary: Demo store Shopify headless (Next.js 15) tích hợp subscription SDK.
tags: [shopify, nextjs, headless, subscription, sdk]
created: 2026-07-06
updated: 2026-07-06
status: active
repo: ~/projects/headless-demo
---

# headless-demo

## Mục đích
Demo store Shopify headless dùng Next.js, làm ví dụ tích hợp **joy-subscription-sdk**
(SDK cho Joy Subscription của Avada) vào một storefront không dùng theme Liquid.
Mục tiêu: chứng minh flow subscription (widget sản phẩm, bundle, box, customer portal)
chạy được trên headless store.

## Tech stack
- Next.js 15 (canary, App Router, `--turbopack`) + React 19
- Tailwind CSS 4, `@headlessui/react`, `@heroicons/react`, `geist`, `sonner`
- TypeScript 5.8
- Dependency chính: `joy-subscription-sdk` ^2.0.0 (SDK ~2.3KB gzip, framework-agnostic)
- Storefront API Shopify (mặc định version `2025-01`)

## Trạng thái
Active. Git log cho thấy đang lặp fix: theme, redirect Customer Portal về Shopify,
truyền config trực tiếp vào SDK constructor cho standalone bundle. Commit gần nhất
là các bản vá nhỏ ("add some thing", "done").

## Điểm đáng nhớ
- SDK có 2 kiểu dùng: NPM import (`joy-subscription-sdk/widget`, `/portal`, `/box`,
  `/productBundle`) hoặc CDN script tag qua `window.AVADA_SUBSCRIPTION_CONFIG`.
- Config bắt buộc: `shopDomain` + `storefrontAccessToken`; API base mặc định
  `https://sub.joyapp.gg`. Có thể `SubscriptionSDK.configure()` global 1 lần cho SPA.
- Event-driven: lắng nghe `subscription:ready`, `avada:add-to-cart`, `avada:plan:selected`;
  dùng `sdk.on(...)` trả về hàm unsubscribe, nhớ `sdk.destroy()` khi cleanup.

## Liên quan
- [[app-development]]
- [[subscriptions]]
