---
type: note
title: Shipped Joy Subscription 2026-07-28 — Customer Portal Preview (~30 commit, branch), JOY red rebrand, badge style card; master chỉ nhận mockup/PRD
summary: Commit landed 07-28: master CHỈ merge 3 MR mockup-app/PRD (không có code app, không version bump); toàn bộ khối lượng thật nằm trên branch — Customer Portal Preview build trọn từ spec→router→handlers rồi vá một họ bug "preview trả shape khác backend thật", JOY red rebrand toàn admin, widget badge style card, forceOneTimeAddProduct SB-14773; không revert; 2 tín hiệu deploy đều là trigger CI ([deploy-all] fc3d2f651, staging4 e9c57a296).
tags: [shopify, subscription, avada, extensions, debug]
created: 2026-07-29
source: repo "subscriptions" — git log (hash đã verify)
---

# Shipped — Joy Subscription, commit landed 2026-07-28

Phần *bài học / root cause* nằm ở [[digest-subscriptions-2026-07-28]] — ở đây chỉ ghi *cái gì đã landed và ở đâu*.

> ⚠️ **Đặc điểm ngày này:** `origin/master` (`a7a0da5f0`) chỉ nhận **3 MR mockup-app/PRD** của product-team.
> Không một dòng code app nào vào master, **không có version bump** trong cả cửa sổ này.
> Mọi thứ dưới đây (trừ mục "Vào master") vẫn đang trên branch → đọc như "đã code xong", không phải "đã release".

## Shipped

### 1. Customer Portal Preview — khối lớn nhất (branch `feat/portal-preview`)

Cho merchant xem trước Customer Portal bằng **fake backend in-memory** thay vì gọi backend thật. Trình tự đúng kiểu spec → plan → seam → data → router → handlers → sweep → vá shape:

- **Spec & plan:** `9258f6391` (design spec + `constants/preview.js`, `isPreviewUrl.js`) → `4a92ef8b5` (plan 2.446 dòng) → `3c19272e4` (chốt single pricing path + graded evaluation) → `618074ce0`, `781b4f079` (sửa lại bảng route sau khi sweep).
- **Seam & flag:** `5ba296b4e` (route request của portal sang preview handler khi cờ bật, `previewMode.js`), `1524f4119` (ghi chú side-effect `enablePreview` lúc render), `b7543d18e` (**cờ `?joy_preview=1` bị rơi ở MỌI navigation trong extension** → helper `withPreviewFlag`).
- **Data & core:** `2b7ef954a` (scenario definitions) → `747a83d13` + `64cb64eb9` (`buildSampleData` từ product thật) → `d63872936` (in-memory store) → `6c9dfa4c8` (router core + guard "unhandled route" kêu to) → `e9ce6f460` static read handlers (+ `9a6c6375d` CommonJS→ESM, `ba982a1b4` format) → `191c3c2ac` (product handlers lấy từ storefront catalog).
- **Sweep độ phủ route:** `7a47fa623` (route động collections/categories/reward còn thiếu) → `5a9104589` (mở rộng sweep đúng scope: cả V1 & V2 + shared modal hooks, thêm 4 GET route) → `1000360ac` (`hooks/useFetchApi.js` bypass hẳn `fetchPublicApi` → 6 consumer rơi về mockData cũ) → `4a7d31b95` (test **endpoint coverage guard**, 717 dòng) → `733f1c31d` (bắt test catch-path chạy thật, không bị `fetchCatalogProducts` nuốt lỗi).
- **Mutation:** `a9a04f12c` (mutation handlers + reprice bằng `calculatePricing`) → `2e3d65f43` (one-time line không được mặc định sellingPlanId của contract; line-add/remove propagate sang upcoming order; honour `applyToOrders`) → `ca5a8b863` (**reprice không lan sang upcoming order** → `syncOrderWithContract`).
- **Họ bug "shape preview ≠ shape backend thật"** — cả cụm cùng một root cause dạng: handler trả contract/product thô, còn UI deref thẳng không guard:
  - `69d75461f` product route shape crash (+ `variants` cho `AddProductCard`), `2300ae0d7` reshape picker route về `{product, plans}`, `d9d3ca113` V2 Swap/Add Product trả catalog + plan thật (trước là `ok([])` → luôn "No products found").
  - `28d0ecab9` thiếu `upcomingOrder` → crash cả trang detail, `0d8673d95` thiếu `contract.lines` → crash trước khi mount, `0ee6334ca` thiếu `originOrder.createdAt` → `Invalid Date`, `6da1da73c` `/analytics` trả `{}` (badge = 0) + thiếu `nextOrderDate` (dayjs(undefined) âm thầm ra hôm nay).
  - `62e7ae6a5` compare-at strikethrough ở Recommended, `743b173d7` charge id preview dùng số tuần tự thật.
- **FE nút preview:** `cd00d5075` (nút Preview portal ở trang Customer Portal) → `c06ec7684` (phải dùng version **đang chọn**, không phải setting đã lưu).
- **Polish portal:** `57c85ac0a` card "My subscriptions" cao bằng nhau, `7fd0fbbcb` a11y đánh dấu giá gạch bằng `deletion` role (11 file).

### 2. JOY red rebrand toàn admin (branch `feat/rebranch-color-in-app`)

- `a935a5b3a` — thay palette tím/xanh cũ bằng **JOY red**: 15 SVG icon + logo, gradient panel rút thành biến `--sub-brand-panel-background` (để lần rebrand sau không sót chỗ nào), dựng lại corner-glow của Enterprise plan card, đổi thumbnail Retention sang ảnh tự mang gradient, bỏ swirl vector PricingV4, repoint import ảnh sang `.jpg` — **4 tab Orders còn trỏ `notFoundOrder.png` đã xoá, suýt vỡ build**. 57 file. Kèm 5 template email.
- `f02adab8b` — Home: slider widget showcase + tự gửi setup request.

### 3. Widget badge style card (branch `feat/widget-badge-customize`)

- `8ac4dd60b` — merchant chọn hình badge discount (ribbon/solid/outline) + kéo vị trí trong option box ở widget V4. Ribbon là default và **tái hiện đúng badge hiện tại**; rule vị trí gate sau attribute `data-badge-pos` chỉ phát khi slider thật sự bị kéo → shop không mở card thì render y nguyên. Admin preview & storefront dùng chung một renderer nên CSS ở `SubscriptionBlockV4.scss` là nguồn duy nhất.
- `186752fb8` — rút nhãn "All countries" → "All" (chỉ sửa tay `en.json`; chạy `yarn trans` sẽ kéo theo key pending của branch khác).
- `f5825d7b0` — chạy pipeline dịch, sinh lại locale 6 ngôn ngữ (kéo luôn key OneTimePurchaseCard/Grow đã merge nhưng chưa propagate).

### 4. Lẻ

- `c3c20346a` — expose `forceOneTimeAddProduct` ra global của classic portal (**SB-14773**, branch `feat/one-time-only`).
- `ba046eedb` — sửa số Jira bị gắn nhầm trong comment code agent-api: SB-14371→**SB-14375** (dunning future-retry), SB-14372→**SB-14586** (next order date). Commit *message* cũ vẫn mang số sai — sửa lúc squash/MR.

### Vào master

- `a7a0da5f0` (MR !2409 ← `dfd72e8db`), `d5e8f6520` (MR !2408 ← `3f30a0bf2`), `904995d5d` (MR !2406 ← `f3c3ca194`) — mockup-app + PRD của product-team. Đáng chú ý: `f3c3ca194` thêm **email preview cho campaign catalog** (10 HTML + script render), mockup cross-app modal, select-bundle-type, subscription-detail dựng lại lớn. Đây là *nguồn thiết kế*, không phải code app.

## Reverted

_Không có revert trong khoảng này._ (khác với 07-14 và 07-24 — xem [[shipped-subscriptions-2026-07-25]]).

## Deploy notes

- `fc3d2f651` — commit tên đúng **`[deploy-all]`**, đổi 1 dòng `routes/storefrontApi.js` trên `feat/sb-13947-volume-bundle`. Đây là **commit kích CI deploy đầy đủ**, không phải thay đổi logic.
- `e9c57a296` — "Trigger deploy staging 4", sửa `.gitlab/ci/staging4.yml` 1 dòng → đẩy nhánh rebrand lên staging4.
- **Không migration file, không version bump** (`v2.34.36` từ [[shipped-subscriptions-2026-07-28]] vẫn là mốc gần nhất). Nghĩa là nếu cần trace "prod đang chạy gì", ngày 07-28 không thêm gì.
- Rủi ro khi merge: `a935a5b3a` (rebrand, 57 file, xoá/đổi tên asset) và nhánh preview đụng chồng lên nhiều file `packages/assets` — merge rebrand **trước** rồi rebase phần còn lại sẽ đỡ đau hơn.

## Liên kết gợi ý

[[subscriptions]] · [[digest-subscriptions-2026-07-28]] · [[shipped-subscriptions-2026-07-28]] · [[digest-subscriptions-2026-07-27]] · [[digest-subscriptions-2026-07-22]] (bẫy widget preview — gate theo version, 2 endpoint schema khác) · [[subscriptions-debug-runbook]] · [[subscription-work-style]] · [[shopify-app-dev]]
