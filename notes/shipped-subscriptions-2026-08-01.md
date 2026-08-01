---
type: note
title: Shipped Joy Subscription 2026-07-31 — master chỉ nhận 1 MR (v2.34.44), khối lượng thật là Classic Portal Preview trên nhánh
summary: Commit landed 07-31 — master CHỈ nhận 1 MR (`v2.34.44`, nút Add product standalone cạnh Edit subscription, JSUB-260730); phần nặng nằm trên `feat/portal-preview`: preview cho classic portal (plan 2.864 dòng, router + safeSessionStorage + catalog từ storefront `products.json`) và preview mode của new-CP đổi thành **tri-state** quyết theo response `/subscriptions` thật, cộng 2 fix fail-closed (response không kết luận được → undecided; nút Preview portal gate theo `shop.shopInfoData`); nhánh reward có `[deploy-all]` force full deploy staging4; không revert.
tags: [shopify, subscription, avada, extensions]
created: 2026-08-01
source: repo "subscriptions" — git log (hash đã verify)
---

# Shipped — Joy Subscription, commit landed 2026-07-31

Chỉ ghi **cái gì đã landed và ở đâu**. Bản trước: [[shipped-subscriptions-2026-07-30]] ·
root cause / bài học: [[digest-subscriptions-2026-07-29]], [[digest-subscriptions-2026-07-28]].

> 📉 Lại về nhịp "master gần như đứng yên": 07-29 nhận **7 tag**, hôm nay **1 tag duy nhất**
> (`v2.34.44`). Toàn bộ khối lượng dồn vào nhánh `feat/portal-preview`.

## Shipped (đã vào `master`)

### `v2.34.44` — nút Add product standalone cạnh Edit subscription, JSUB-260730 (MR !2420)

Merge `b9fe6b68b` (tag `v2.34.44`, `origin/master`) ← `3cbc4972c` (`origin/feat/standalone-add-btn`).
1 file `SubscriptionDetail.js`, +78/-55 — tách "Add product" ra thành nút riêng thay vì nằm trong
luồng Edit. Đây là **MR duy nhất vào master** trong cửa sổ này.

## Còn trên nhánh (chưa merge) — nơi chứa khối lượng thật

### Classic Portal Preview (`feat/portal-preview`) — nhánh chính của ngày

Nối tiếp Customer Portal Preview ghi ở [[digest-subscriptions-2026-07-28]], giờ mở sang **classic portal**:

- `79d39973d` plan `docs/superpowers/plans/2026-07-28-classic-portal-preview.md` **2.864 dòng**;
  `79b7edc78` bổ sung vào plan yêu cầu **check build bundle scripttag** cho mọi task classic preview
  (scripttag đi kênh deploy riêng — đúng bài học "deploy đi bằng hai kênh khác nhau").
- `fdea26399` route request classic portal sang preview handler khi cờ bật —
  `buildPreviewRequest.js` + `previewMode.js` (scripttag) + hook vào `CustomerPortalManager` và
  `makeRequest`, kèm test 107 dòng.
- `163a73b00` stub module preview còn thiếu + **`safeSessionStorage`** (sessionStorage có thể ném:
  Safari private / storage bị chặn) — 69 dòng test.
- `39839187b` dựng catalog preview từ **storefront `products.json`** (`mapStorefrontCatalog`), rồi
  `096d00f5e` vá ngay: catalog **không bao giờ emit giá NaN**.

### Preview mode của new customer account extension → tri-state

- `8e644c258`: trước đây `?joy_preview=1` bật preview cho **mọi** request, kể cả khách thật đang có
  subscription. Đổi cờ thành **tri-state (undecided / on / off)** quyết định từ chính response
  `GET /subscriptions` đầu tiên của portal → **không thêm request backend nào và không nháy trang trắng**:
  response rỗng → bật preview, có data → tắt preview cho hết session.
- `316217a3d` vá lỗ của chính cơ chế trên: `subscriptionContractController` lúc catch trả
  `{status:false, message}` (không có `success`/`data`), `hasSubscriptionContracts` đọc thành **0 contract**
  → preview bị **đóng băng ở ON cho khách thật** chỉ vì một lỗi backend thoáng qua, và không có đường
  hồi trong session. Thêm `isConclusiveSubscriptionsResponse()` (`success===true && Array.isArray(data)`),
  shape không kết luận được thì trả `null` = **vẫn undecided** để lần gọi sau còn quyết đúng.
  → Cùng họ lỗi "mảng rỗng / shape lệch làm fallback quyết sai" đã ghi ở [[digest-subscriptions-2026-07-29]].

### Setup guide: nút Preview portal

- `e6c839ed7` thêm nút Preview portal vào bước customer portal của Setup guide;
  `77c610fdf` trả `accessLink` từ `shops/integrations`;
- `a742f4f9c` (**JSUB-260730**) fix fail-open: nút bật **trước khi** `/shops/integrations` resolve, mà
  trong cửa sổ đó `shop.shopInfoData` là `undefined` và `getCustomerPortalUrl` **âm thầm coi đó là
  Classic** → merchant đã dùng New customer accounts bấm vào sẽ ra trang classic 404. Gate readiness
  theo **sự tồn tại của `shop.shopInfoData`** (payload integrations) chứ không theo version suy ra,
  disable + tooltip cho tới khi có. Message ghi đã đối chiếu `CustomerPortalVersion.js`: nút Preview
  ở đó gate thẳng `shop.extensionPageUuid` nên **fail-closed sẵn** — không thủng.
- `7ffbaa0ed` cho preview trong setup guide bám theo setting portal version của app.

### Nhánh khác

- **Reward** (`origin/feat/subscription-reward`): `0b1d469f1` merge master vào nhánh (policy resolve
  conflict ghi rõ trong message: code không thuộc reward lấy master, code reward giữ logic nhánh,
  `staging4.yml` giữ target của nhánh); `3c9b0a54a` tokenize màu `PerksTab.scss` sang `--sub-color-*`
  cho khớp design system master (accent `#2c6ecb` → `--sub-color-info-strong`) — chỉ chừa xám
  skeleton-shimmer vì chưa có token gradient.
- **Product docs** (`origin/update/product-20260731-1344`): `48203b2bc` mockup-app + PRD —
  `joy-mcp-server-plan.md` (211 dòng, **PRD MCP server cho Joy** — mới), PRD Perk viết lại lớn
  (+1.067 dòng), Customer Portal Perks, `SettingsTabs.jsx` (+334). *Nguồn thiết kế, không phải code app.*

## Reverted

- **Không có revert** trong cửa sổ này.

## Deploy notes

- **Không có `[deploy-functions]`**, nhưng có **3 commit `[deploy-all]`** (cùng tác dụng ép CI deploy
  đầy đủ, bỏ selective diff) — **tất cả đều trên nhánh, chưa vào master**:
  - `3d5cd7e97` (`feat/subscription-reward`) — lý do ghi rõ: staging4 trước đó build
    `feat/rebranch-color-in-app` nên **baseline của selective diff không còn khớp functions đang chạy**,
    phải force full deploy để `rewardEvaluationHandler` + firestore indexes mới land. Đây là ca mẫu
    của bẫy selective-deploy đã ghi từ [[subscription-digest-2026-07-09]].
  - `23813c447` (`feat/sb-13947-volume-bundle`) — 1 dòng `integrateApi.js`, chỉ để trigger.
  - `3d384966a` (`feat/sidekick-agent-extensions`) — sửa `staging2.yml`/`staging3.yml` trigger stg2.
- **1 version bump**: `v2.34.44`. Nối tiếp `v2.34.43` của [[shipped-subscriptions-2026-07-30]] — liền mạch.
- **Không có migration / `firestore.indexes.json` mới** trong cửa sổ này. ⚠️ Nhưng Win Back flow
  `[deploy-functions]` + `firestore.indexes.json` +223 dòng ghi ở [[shipped-subscriptions-2026-07-30]]
  **vẫn chưa thấy vào master** — món nợ deploy còn treo.
- **Scripttag**: preview classic portal đụng `packages/scripttag/src/...` ở `fdea26399`, `163a73b00`,
  `39839187b`. Nhánh này **không đi bằng `shopify app deploy`** — plan đã tự ghi yêu cầu check bundle,
  giữ đúng cảnh báo của [[digest-subscriptions-2026-07-29]].

## Liên kết gợi ý

[[subscriptions]] · [[digest-subscriptions-2026-07-31]] (root cause / bài học của chính nhánh
`feat/portal-preview` ghi ở đây) · [[shipped-subscriptions-2026-07-30]] · [[digest-subscriptions-2026-07-29]] ·
[[digest-subscriptions-2026-07-28]] · [[shipped-subscriptions-2026-07-29]] ·
[[shipped-subscriptions-2026-07-28]] · [[subscriptions-debug-runbook]] ·
[[subscription-digest-2026-07-09]] · [[shipped-pdf-2026-07-31]] · [[subscription-work-style]] ·
[[shopify-app-dev]]
