---
type: note
title: Shipped Joy Subscription 2026-07-22 — fixed-bundle one-time cart-transform [deploy-all], pubsub-leak fix + apiHookV2 rightsize [deploy-functions], shipping-rate FX SB-14315, admin LCP, standalone-boot fix
summary: Landed 07-22 (v2.34.16→21): fixed-bundle one-time purchase qua cart-transform expand [deploy-all][deploy-extensions] (WIP 07-16/20 nay merged), fix memory-leak webhook bằng pubsub singleton + right-size apiHookV2 1GiB [deploy-functions], shipping-rate lấy đúng contract currency bỏ static FX (SB-14315 landed), admin boot LCP, fix standalone dev boot nhầm embed.js do vite replace ăn comment CSS; transform-discount display + onboarding-v5 atomic refactor + discovery/mystery-product + chatty-embed còn WIP.
tags: [subscription, shopify, billing, performance, vite]
created: 2026-07-23
source: repo "subscriptions" — git log (hash đã verify)
---

# Shipped — Joy Subscription (landed 2026-07-22)

> Góc "cái gì thực sự lên master/tag". Tiếp nối [[shipped-subscriptions-2026-07-22]] (landed 07-21,
> dừng ở v2.34.13). Không lặp phần khái niệm — chỉ delta landed hôm nay.

## Shipped

- **[deploy-all][deploy-extensions] fixed-bundle one-time purchase (cart-transform `expand`) + installment** —
  merge `d021b0f78` (tag **v2.34.20**, !2382). Chính là WIP "one-time bundle qua Cart Transform `expand`" +
  "defer-last-discount" đã theo dõi ở [[subscription-digest-2026-07-16]] và [[digest-subscriptions-2026-07-20]],
  nay landed. Vì `[deploy-all]` + `[deploy-extensions]` → buộc CI deploy full functions **và** extensions (Shopify Functions).
- **[deploy-functions] fix memory-leak webhook: reuse pubsub client singleton** — merge `192992bd7`
  (tag **v2.34.16**, !2378), commit `7a70505d8`. Webhook handler tạo pubsub client mới mỗi lần publish → rò bộ nhớ.
  Dùng lại singleton trong `publishTopic.js`.
- **[deploy-functions] optimize cost: right-size apiHookV2 → 1GiB + maxInstances 10** — merge `d567b082f`
  (tag **v2.34.19**, !2381), commit `ba288d8cd`. Hạ cấu hình `apiHookV2` **sau khi** fix pubsub leak ở trên
  (leak vá xong mới dám giảm RAM). Cặp đôi leak-fix → rightsize trong cùng ngày.
- **fix backend: shipping-rate auto-update lấy đúng contract currency (bỏ static FX) [SB-14315]** —
  merge `437759f59` (tag **v2.34.18**, !2344). SB-14315 (shipping-rate FX) từng là WIP ở
  [[subscription-digest-2026-07-16]], nay landed: đọc currency thật của contract từ Shopify thay vì bảng FX tĩnh.
- **dev performance: optimize admin boot LCP + loading** — merge `3849bfdf4` (tag **v2.34.17**, !2379),
  commit `84d577927` (branch `improve/boot-lcp`). Đụng `embed-template.html`, `index.html`, `embed.js`, thêm
  `perfMarks.js`/`reportWebVitals.js`, `vite.config.js`. Nối tiếp chuỗi LCP/web-vitals đã ship ở
  [[shipped-subscriptions-2026-07-22]] (v2.34.13).
- **fix frontend: standalone dev boot nhầm embed.js (vite replace ăn comment CSS)** — merge `1a9114384`
  (tag **v2.34.21**, !2383), commit `0c4f6cf1c`. Plugin `index-html-build-replacement` dùng
  `html.replace('embed.js', 'standalone.js')` — chỉ thay match đầu tiên. Commit LCP thêm **comment CSS** chứa
  `'embed.js'` vào `<head>` đứng trước `<script>`, nên replace ăn nhầm comment và để nguyên
  `<script src="/src/embed.js">` → standalone dev boot nhầm embed.js → App Bridge thiếu `shop` → kẹt loading.
  Sửa: đổi chuỗi tìm sang `'/src/embed.js'` (đặc hiệu, chỉ khớp thẻ script). *Regression trực tiếp từ LCP v2.34.17.*
  - Kèm `46e5f9f9d` (chore i18n): `autoTranslateV2` nạp `GOOGLE_TRANSLATE_KEY` từ `.env.development` qua dotenv (fallback shell env).

## Reverted

- Không có revert sửa-sai nào landed hôm nay. (v2.34.21 là fix-forward cho regression của v2.34.17, không phải revert.)

## Deploy notes

- **`[deploy-*]` landed trên master:**
  - `192992bd7` (v2.34.16) `[deploy-functions]` — buộc deploy full functions.
  - `d567b082f` (v2.34.19) `[deploy-functions]` — buộc deploy full functions.
  - `d021b0f78` (v2.34.20) `[deploy-all] [deploy-extensions]` — deploy full functions **+ extensions**.
- **Version bumps:** v2.34.16 → v2.34.21 (6 tag trong ngày 07-22).
- **Migration:** không thấy migration file nào landed trên master trong log này.
- **CI staging config:** `af613ea90` `[deploy-all] deploy stg3` chỉ sửa `.gitlab/ci/staging2.yml`/`staging3.yml`
  trên nhánh `fix/SB-14315-shipping-rate-fx` (không phải master) — thao tác deploy staging, không phải feature.
- **WIP theo dõi (chưa merge master):**
  - `feat/transform-discount` — cụm fix hiển thị giá "subtract all line-item app discounts (AOV + installment)"
    ở email/subtotal (`21e5fa76e`, đang trong stash `2a61f4dbe`), scripttag upcoming order (`cb0442d94`), portal+admin
    (`087223f14`), subscription list card (`81aefb98a`), classic CP detail (`431cba1cb`), CP list+detail đọc discount
    từ **line** thay vì product (`0d0ea548f`). Tiếp nối transform-discount WIP ([[shipped-subscriptions-2026-07-22]]).
  - `feat/onboading-v5` — refactor lớn: chuyển component ra shared atomic folders (`ebb395e41` molecules/organisms,
    `81773b37d` Chip/ChipQuestion → atoms/molecules) theo @todo techlead; `47e21690c` **fix be** raise ordersCount
    limit 200→1000 (store 500+ order/30d bị clamp 200 → không qua call gate ≥500, Question 3 book-a-call bất khả đạt
    prod); `c02bcc979` bỏ blue-bubble Crisp (concierge đọc thuần message từ CS); `173400e94` preview scrollbar hover.
  - `feat/discovery-product` (mystery-product) — `52651c2dc` hard-delete doc + **archive** parent (không delete, giữ
    contract sống — archived vẫn qua `nodes(ids)` nên không trip `checkOrderHasDeletedProduct`); `d21e51f39` alias
    metafield engine trung tính (`avada_fixed_bundle_variant` là hard contract, không rename được); `aa12fa1cf` bỏ
    manual-retry, match Fixed Bundle (delete+recreate contract là recovery).
  - `feat/chatty-embed` — spike `ee29bed71` endpoint App-Proxy `/embed/portal` test `logged_in_customer_id` (POC) + spec docs.
  - `fix/contract-idor` `9bbc84153` — thêm shopId check ở `subscriptionContractRepository` (IDOR). Nối lỗ hổng auth
    ([[digest-subscriptions-2026-07-21]]).

## Liên quan
- [[subscriptions]] · [[subscriptions-debug-runbook]] · [[shipped-subscriptions-2026-07-22]] ·
  [[subscription-digest-2026-07-16]] · [[digest-subscriptions-2026-07-20]] · [[digest-subscriptions-2026-07-21]]
