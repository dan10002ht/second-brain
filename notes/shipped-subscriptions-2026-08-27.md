---
type: note
title: Joy Subscription — commit landed 2026-08-26
summary: Master nhận tag `v2.34.87` (một discount code volume giờ phủ mọi bundle trong cart) rồi ngay sau đó là MR !2500 `[deploy-extensions]` xoá 3 dòng comment; trên nhánh: probe quyết định preview cho classic portal (SB-16059), banner portal xét theo menu (SB-16056), và một commit "fix bug" gỡ trọn 4 tool reward-campaign khỏi MCP agent API.
tags: [avada, subscription, shopify, extensions, agent]
created: 2026-08-27
updated: 2026-08-27
source: repo `subscriptions` (avada/subscriptions) — git log 2026-08-26, hash lấy nguyên từ log
---

# Joy Subscription — commit landed 2026-08-26

Tiếp nối [[shipped-subscriptions-2026-08-26]] (log 08-25). Root cause của cùng cửa sổ này đã ghi ở
[[digest-subscriptions-2026-08-26]] — ở đây chỉ ghi **cái gì landed ở đâu**.

## Shipped

### Master — 2 ref, 1 tag

| Hash | Nội dung |
|------|----------|
| `31c005898` (tag `v2.34.87`) | merge !2499 — fix volume discount, nội dung ở `7f5ecc017` |
| `7f5ecc017` | **fix - be - một discount code volume phủ MỌI bundle trong cart.** Mỗi volume bundle sở hữu discount node riêng (để merchant có code đặt tên/theo dõi được) nhưng một cart chỉ mang **một** code — nên khách mua 2 bundle bị thu full giá ở bundle không sở hữu code đang có trong cart (ca báo lỗi `nj1kht-86`, ESB-01 + GSB-02). Nay mỗi node mang **toàn bộ tập bundle đang active của shop**, ghi lại sau mọi create/update/delete bundle. Không migrate code, không gộp node, contract đang chạy giữ nguyên node của nó. Function đọc **cả hai shape** vì node cũ vẫn là `{bundleId, tiers}` đơn lẻ. 6 file, +287/−41 (`extensions/product-discount/.../getVolumeBundleDiscount.js`, `volumeBundleDiscountService.js`, `buildTierMetafieldValue.js`, `backgroundHandler.js` + 2 file test mới) |
| `95684b59b` | merge !2500 — `[deploy-extensions] - remove comment`; nội dung là `93ec38ca2` (nhánh `fix/volume-bundle-discount-not-stacking`), xoá 3 dòng comment trong `getVolumeBundleDiscount.js`. Không đổi hành vi — xem Deploy notes |

### Nhánh `feat/portal-preview` — 3 commit

| Hash | Nội dung |
|------|----------|
| `af19715a9` | **fix - fe - preview classic: quyết định preview TRƯỚC khi render (SB-16059).** Các nhánh đã-login không bao giờ gọi `setClassicPreviewOn()`, nên decision chỉ đến từ việc observe response thật của `GET /subscriptions` — mà chỉ `MySubscriptionTab` bắn request đó. Merchant preview từ admin đáp xuống tab *Upcoming orders* (fetch endpoint khác) ⇒ decision kẹt ở `null`: không modal, dữ liệu thật rỗng. Chỉ tái hiện khi trình duyệt **đang có session customer** — nên dev không gặp, tester gặp. `renderPortalForCustomer()` bao 3 terminal đã-login (authToken exchange, session verify, cached login) và bắn chính request quyết định đó trước khi render, giới hạn 6s; request đi qua `makeRequest` (đã tự gọi `observeClassicSubscriptionsResponse`) nên **không nhân bản logic**, chỉ đợi *thời điểm*. Hằng số 6s tách ra `const/preview/probe.js` dùng chung 2 portal. 3 file, +65/−15 |
| `41c1da430` | **fix - fe - portal settings: xét MENU thay vì `extensionPageUuid` (SB-16056).** `customerAccountPages` liệt kê page mà app *cung cấp* nên uuid có từ lúc deploy extension và không bao giờ đổi — tức một hằng số. Readiness nay = có uuid **VÀ** menu trỏ đúng uuid đó; không tốn request thêm (`getShopIntegrations` đã fetch cả hai trong cùng `Promise.all`). Copy banner sửa theo việc thật (add vào menu, không phải "theme settings") + `yarn trans` 7 file locale. 10 file, +52/−15. → quyết định đã ghi: [[2026-08-26-banner-portal-theo-menu]] |
| `fe41f214d` | **fix - be - customer account menu: match handle có prefix theo profile.** `getCustomerAccountMenus` so `handle === 'customer-account-main-menu'` nhưng Shopify trả `store-default-customer-account-main-menu` (handle gắn prefix theo profile) ⇒ so sánh chính xác **không bao giờ khớp**, hàm trả `null` cho mọi shop. Kéo theo tier 2 của `getCustomerPortalUrl` (URL menu merchant tự đặt) chết âm thầm — không ai thấy vì tier 1 luôn có giá trị. Sửa handle **không đổi URL hiện tại của bất kỳ shop nào**. 1 file, +6/−2 |

### Nhánh `feat/sb-15077-mcp-server` — 1 commit

`b0a9fe7e9` — commit title chỉ ghi **"fix bug"** nhưng là commit lớn nhất trong log: **84 file, +2915/−1565**.
Đọc theo file stat thì nó gồm ít nhất 3 việc khác nhau:

- **Gỡ trọn nhánh reward campaign khỏi MCP agent API**: xoá `createRewardCampaignTool.js` (−105),
  `getRewardCampaignTool.js` (−100), `updateRewardCampaignTool.js` (−106),
  `setRewardCampaignStatusTool.js` (−76), `agentRewardService.js` (−131) và 2 file test tương ứng
  (−229, −135). Xem ⚠️ bên dưới.
- **Thêm tool/helper mới**: `removeDiscountTool.js` (+40), helper `contractFrequency.js` (+101),
  `contractPayload.js` (+94), `discountTitle.js` (+54), cộng `subscriptionLineWriteTools.test.js` (+170)
  và một loạt test mới cho `getSubscriptionDetailsTool` (+152), `removeAgentDiscount` (+117),
  `agentChangeFrequencyService` (+133).
- **UI + i18n**: `mcpKeyDisplay` (+40/tests +80), tab Developers/Mcp, 7 file locale, cộng
  `ChurnAnalytics`/`OverviewAnalytics` + sample data.

Kèm theo là `exchangeRate/_latest.json` (294 dòng đổi) — dữ liệu tự cập nhật, coi là nhiễu.

### Nhánh `feat/joyxjoy-landing` — 1 commit

`89189a5cc` — `chore - ci - trỏ staging 1 về nhánh feat/joyxjoy-landing`, 1 dòng trong
`.gitlab/ci/staging.yml`. Đúng cơ chế slot staging neo theo `STAGING_BRANCH` đã ghi ở
[[digest-subscriptions-2026-08-12]]; hôm qua là staging 3 cho `feat/portal-preview`
([[shipped-subscriptions-2026-08-26]]), hôm nay là staging 1 cho landing.

## Reverted

Không có revert nào trong log 08-26.

## Deploy notes

- **`[deploy-extensions]`: 1 commit trên master** — `95684b59b` (!2500). Diff thật chỉ là xoá 3 dòng
  comment ⇒ đây gần như chắc chắn là commit **để ép CI deploy extension**, không phải thay đổi code.
- **Ràng buộc thứ tự deploy MỘT CHIỀU** — commit body của `7f5ecc017` nói thẳng: node lưu trước bản
  này vẫn giữ object `{bundleId, tiers}` đơn lẻ, nên **extension phải ship TRƯỚC khi backend bắt đầu
  ghi mảng**, nếu không function cũ đọc mảng thành `undefined` và **rơi mọi volume discount**. Đây là
  loại ràng buộc không có gate nào bắt được — xem ⚠️ mục 1.
- **Version bump**: tag `v2.34.87`. Không `[deploy-functions]`, không `[deploy-all]`, không file
  migration, không đụng `firestore.indexes.json`.

## ⚠️ Cần xác nhận

1. **Extension có thật sự ship trước backend không, hay cả hai đi chung một tag?**
   `7f5ecc017` đặt ra ràng buộc một chiều (extension trước, backend sau), nhưng chính commit đó sửa
   **cả hai phía trong cùng một diff** — `extensions/product-discount/.../getVolumeBundleDiscount.js`
   (bên đọc) lẫn `volumeBundleDiscountService.js` + `backgroundHandler.js` (bên ghi) — và cả cụm merge
   vào master dưới **một tag `v2.34.87`**. Nếu pipeline của tag đó deploy function trước extension, cửa
   sổ mất-toàn-bộ-volume-discount là có thật.
   Việc `95684b59b` `[deploy-extensions]` xuất hiện **ngay sau** tag, với diff rỗng nghĩa, là tín hiệu
   hợp với giả thuyết "phải bắn thêm một lượt deploy extension" — nhưng log không đủ để phân biệt
   *chủ động làm đúng thứ tự* với *chữa cháy sau khi merge*. Cần hỏi hoặc đọc pipeline của `v2.34.87`.
   Đây đúng dạng [[ack-khong-phai-hieu-ung]]: merge thành công không chứng minh discount còn chạy.

2. **`b0a9fe7e9` gỡ hẳn reward campaign khỏi MCP — trim scope hay đảo hướng?**
   4 tool + 1 service + 2 file test bị xoá sạch (~880 dòng) dưới một commit tên **"fix bug"**.
   [[shipped-subscriptions-2026-08-12]] ghi SB-15077 là *"7 permission Read của MCP trả sai dữ liệu"*
   và [[2026-08-12-mcp-settings-allowlist]] là quyết định thu hẹp bề mặt MCP vì rò dữ liệu sang LLM
   bên thứ ba — nên "gỡ nhóm tool ghi vào reward campaign" **có thể** là bước tiếp theo cùng hướng đó.
   Nhưng đó là suy diễn: commit body rỗng, không có ticket, và đây là nhánh chưa merge.
   → Nếu đây là quyết định thu hẹp bề mặt MCP thì phải có một file trong `70-decisions/` kèm Why +
   Tradeoff; nếu chỉ là dọn code chưa từng dùng thì không. **Chưa viết decision vì không có bằng
   chứng về lý do** — cần xác nhận rồi mới ghi.

3. **`v2.34.85` và `v2.34.86` chưa từng xuất hiện trong brain.**
   Mốc gần nhất được ghi là `v2.34.84` ([[shipped-subscriptions-2026-08-22]]); log 08-25 và 08-26
   không có tag nào; hôm nay nhảy thẳng tới `v2.34.87`. Cộng thêm khoảng trống `v2.34.80`→`v2.34.83`
   vẫn treo từ [[shipped-subscriptions-2026-08-22]], hiện có **6 phiên bản đã ra mà brain không biết
   nội dung**. Nguyên nhân nhiều khả năng là cửa sổ `git log` chỉ lấy commit mới nên tag merge nằm
   ngoài — nhưng chưa kiểm.

## Liên quan

[[subscriptions]] · [[shipped-subscriptions-2026-08-26]] · [[digest-subscriptions-2026-08-26]] ·
[[2026-08-26-banner-portal-theo-menu]] · [[digest-subscriptions-volume-bundle-2026-08-17]] ·
[[2026-08-18-volume-tier-line-attribute]] · [[shipped-subscriptions-2026-08-21]] ·
[[shipped-subscriptions-2026-08-12]] · [[2026-08-12-mcp-settings-allowlist]] ·
[[digest-subscriptions-2026-08-12]] · [[shipped-subscriptions-2026-08-22]] ·
[[ack-khong-phai-hieu-ung]] · [[bang-chung-phan-biet-duoc]] ·
[[digest-subscriptions-2026-08-27]] (digest cùng cửa sổ)
