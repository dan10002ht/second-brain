---
type: note
title: Shipped Joy Subscription 2026-07-20 — security publicApi/secrets, drop dead discount flag, reopen Crisp, installAt [deploy-functions]
summary: Landed 07-20 (v2.34.02→05): xoá hẳn publicApi + đưa secrets về env, bỏ cờ chết discountConfig.enabled (bug swap vẫn giảm giá), mở lại Crisp/Contact sau cửa sổ review Shopify, fix installAt [deploy-functions]; LCP/web-vitals và transform-discount còn WIP.
tags: [subscription, shopify, billing, performance]
created: 2026-07-21
updated: 2026-07-21
source: repo "subscriptions" — git log (hash đã verify)
---

# Shipped — Joy Subscription (landed 2026-07-20)

> Góc "cái gì thực sự lên master/tag". Bổ sung cho [[digest-subscriptions-2026-07-20]]
> (góc session/khái niệm — không lặp lại nội dung đó) và tiếp nối
> [[shipped-subscriptions-2026-07-18]].

## Shipped

- **Security: xoá hẳn `publicApi`** — `438b7ca67` merge `290c0bce8` (tag **v2.34.04**, !2363).
  Routes chỉ chặn bằng chuỗi hardcode `'avada_public_api_key'`, không middleware auth, look-up
  order không scope `shopId` → sửa billing state xuyên tenant. Xoá handlers/routes/controllers +
  export trong `index.js` + rewrite `/publicApi/**` trong `firebase.json`.
  `resyncUnexpectedErrorsOrder` đã có bản có auth ở `tsToolController`.
- **Security: slack + google-translate key đọc từ env** — `8b851a49a` (cùng MR !2363).
  Theo pattern `safeConfig()` + `process.env` của `config/slack.js`; `firebaseFunctionConfig.js`
  tự dựng chuỗi `functions:config:set` từ env và cảnh báo khi key trống.
- **Bỏ cờ chết `discountConfig.enabled`** — `3dfa4963e` merge `a3a743444` (tag **v2.34.02**, !2360).
  Swap product ở customer portal lấy `enabledDiscount` từ `discountConfig.enabled` (hardcode `true`
  mọi nơi ghi) → plan đã tắt discount vẫn áp tier 5%. `enabledDiscount` là công tắc duy nhất;
  kèm test guard tĩnh chống tái phát.
- **[SB-14181] Mở lại Crisp / Contact us** — `d74660c98` merge `4b7ebeab3` (tag **v2.34.03**, !2361).
  Gỡ guard `false &&` / `true ||` ở 19 chỗ sau cửa sổ review Shopify 2 tuần (đã khoá ở SB-14076),
  khôi phục `customFooter` cho Bird/Shipandco/Zapiet, bỏ `TEMP_TRANSLATE_LIMIT` + trả lại plan gating
  cho Translations. Không còn token `SHOPIFY_CONTACT_LOCK` trong `packages/`.
- **Fix `installAt` sau luồng cài đặt** — `afce091cc` merge `045a8148b` (tag **v2.34.05**, !2364,
  hotfix). 1 dòng trong `installationService.js`. Tiêu đề mang `[deploy-functions]`.
- **Product docs**: mockup-app + PRD `6469168f1` merge `4cbc1ebf8` (!2362) — thêm PRD
  *fixed-bundle-installment* và *Widget Badge Style*, JoyMark atom, setupTasks dashboard.
  Chỉ doc/mockup, không đụng runtime.

## Reverted

- Không có revert "sửa sai" hôm nay. `d74660c98` tuy là revert kỹ thuật nhưng là **gỡ khoá có kế hoạch**
  (SB-14076 → SB-14181), coi như feature.

## Deploy notes

- **`[deploy-functions]`** trên `045a8148b` (installAt) → buộc CI deploy full functions.
  Ba commit `[deploy-functions]` khác (`30d040b9f`, `07010c8ae`, `f7e3c557f`, `751e6ce4c`) nằm trên
  nhánh **chưa merge** `fix/optimize-lcp` → chưa deploy.
- **Version bumps**: v2.34.02 → v2.34.05 (4 tag trong 1 ngày).
- **Migration**: không có migration file nào landed. `enableInstallmentDiscount.js` bị sửa nhưng ở
  nhánh WIP `feat/transform-discount`.
- **Cần hành động vận hành**: sau khi deploy secrets phải set
  `firebase functions:config:set google_translate.key="..."` (hoặc `.env`) và `GOOGLE_TRANSLATE_KEY`
  cho `yarn trans` — quên là job translate fail-fast.
- **WIP chưa merge (theo dõi, KHÔNG shipped):**
  - `fix/optimize-lcp` — tách `/shops` (chỉ Firestore) khỏi `/shops/integrations` (10 call Shopify
    Admin, 2781ms/4008ms LCP đo trên staging) fold bằng `MERGE_SHOP`; ghi Web Vitals mỗi lần load vào
    collection `webVitals` (TTL 30 ngày khai báo ở `firestore.indexes.json`); header `Server-Timing`
    tách charge/auth/route. `f7e3c557f` · `07010c8ae` · `751e6ce4c` · `30d040b9f` · `03322bf58`.
  - `feat/transform-discount` — installment discount: trừ discount ở bundle-parent line của
    upcoming order, giá trong email theo automatic discount (`prepareEmailData` + `customShop`),
    section DevZone `InstallmentDiscountSection` + query/mutation discount.
    `cfa5780da` · `b5035dc9f` · `1de0a7c23` · `d2ba4b8b0` · `cd71cd985` (widget liquid stringflags).

## Liên quan
- [[subscriptions]] · [[subscriptions-debug-runbook]] · [[digest-subscriptions-2026-07-20]] ·
  [[shipped-subscriptions-2026-07-18]] · [[digest-subscriptions-2026-07-19]] ·
  [[subscription-shipped-2026-07-16]]
