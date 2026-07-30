---
type: note
title: Shipped Joy Subscription 2026-07-29 — 7 version bump v2.34.37→43, partner plan postfix ship rồi revert ngay trong ngày, JOY red rebrand landed
summary: Commit landed 07-29 (v2.34.37→43, ngày nhiều release nhất từ đầu tháng): fix reinstall kẹt onboarding SB-14784 + script chữa shop đã kẹt, shipping price custom trên đường auto-billing (SB-14694 vế 2), one-time-only 2 lát, JOY red rebrand toàn admin, `forceOneTimeAddProduct` SB-14773; partner plan postfix merged ở v2.34.40 rồi revert nguyên merge ở v2.34.41 để đổi sang cờ `isPartnerStore`; WIP khổng lồ Win Back flow `[deploy-functions]` 252 file kèm `firestore.indexes.json`.
tags: [shopify, subscription, avada, billing, extensions]
created: 2026-07-30
source: repo "subscriptions" — git log (hash đã verify)
---

# Shipped — Joy Subscription, commit landed 2026-07-29

Phần *root cause / bài học* nằm ở [[digest-subscriptions-2026-07-29]] — ở đây chỉ ghi **cái gì đã landed và ở đâu**.

> 📈 Trái ngược hẳn 07-28 ([[shipped-subscriptions-2026-07-29]]: master chỉ nhận mockup/PRD, **không** version bump).
> Ngày này master nhận **7 tag** liền: `v2.34.37` → `v2.34.43`, cộng 1 MR không bump version và 1 MR product-docs.

## Shipped

### 1. `v2.34.37` — reinstall làm shop kẹt onboarding, SB-14784 (MR !2411)

Merge `b61ace746` ← `c410328db` (`fix/onboarding-reinstall`). Reinstall không clear `uninstalledAt`, mà `isShopSetupDone` lại **suy** cờ từ `installedAt - uninstalledAt` → shop quay lại sau >48h thì biểu thức vĩnh viễn false, wizard thay thế mọi route. Fix: `publish()` clear `uninstalledAt` (giữ `lastUninstalledAt`) và quyết định `setupDone` **một lần** lúc install; `isShopSetupDone()` chỉ đọc cờ đã lưu; `resolvePlanVersion()` cho reinstall rơi vào pricing V5 chuyển sang plan model V2 + bỏ republish metafield V1; wizard vẫn thoát được khi ghi `setupDone` fail; `getWizardVariant()` yêu cầu `newPlanVersion`.
➕ Kèm **script chữa data**: `commands/misc/fixStuckOnboardingReinstall.js` (83 dòng) cho shop đã kẹt — cùng nếp "fix + backfill/audit script" của [[shipped-subscriptions-2026-07-25]].

### 2. `v2.34.38` — shipping price custom trên đường auto-billing (MR !2412)

Merge `99b216fe8` ← `fix/autobilling-shipping`. `9d13cae77`: fix SB-14694 trước đó **chỉ phủ `handleBillingAttempt`** (manual); `handleAutomaticBillingAttempt` sync cycle đã edit nhưng không áp custom delivery price của order doc → contract chỉ đổi shipping price vẫn bị charge giá gốc trên đường cron. QA bắt đúng ca này (manual bill $0, auto vẫn thu phí). Fix: mirror nhánh đó — fold vào edit-sync nếu cycle đang được edit, ngược lại mở draft riêng hẹp.
Kèm `603df3503` (trim comment trên đường shipping-price sync, -38 dòng) và `579bb8d45` (**skill `deploy-extensions`** vào `.claude/skills/` — tooling repo, đáng chú ý vì liên quan trực tiếp mục Deploy notes).

### 3. `v2.34.39` + `v2.34.42` — one-time-only, 2 lát (MR !2405, !2416)

- `74bbb9f74` (`v2.34.39`, MR !2405) — lát đầu `Feat/one time only` (tiếp nối WIP SB-14700 ghi ở [[shipped-subscriptions-2026-07-28]]).
- `ce8ddba10` (`v2.34.42`, MR !2416, **`[deploy-extensions]`**) ← `91fa99dda`: **đảo chiều toggle one-time trong customer portal cho khớp label** — đổi `customerPortalTypes.js`, `const/default.js`, `helpers/subscription/oneTimeAddProduct.js` + 3 test file + 7 locale. Đảo semantics một cờ đã ship: đáng đánh dấu nếu sau này thấy shop có giá trị "ngược".

### 4. `v2.34.41` — cờ `isPartnerStore` (MR !2415) *(thay cho v2.34.40)*

Merge `3342b2f3f` ← `fix/partner-store-flag`: `145972947` đánh dấu shop được Joy Loyalty tặng plan bằng `isPartnerStore` trong `shopService.js` (+168 dòng test) — sau khi `10f0fd6f1` revert cách làm cũ (xem mục Reverted).

### 5. `v2.34.43` — JOY red rebrand toàn admin (MR !2410)

Merge `b0b1806f6`. Đây chính là nhánh `feat/rebranch-color-in-app` (57 file) đã ghi là *branch-only* ở [[shipped-subscriptions-2026-07-29]] — **giờ đã vào master**.

### 6. Không version bump

- `5caacf4f2` (MR !2414, **`[deploy-extensions]`**) ← `23f08dfc9` / `6d5b9c1d2`: expose `forceOneTimeAddProduct` ra global của classic portal (**SB-14773**) — 2 dòng trong `extensions/theme-app-extension/blocks/app-embed.liquid`. Đóng nốt item WIP của 07-27/07-28.
- `339443d1f` (MR !2417) ← `f96e17bd2`: mockup-app + PRD — cross-app modal đặt ở **app PDF** đẩy merchant sang Joy (tách `CrossAppPromoModal` dùng chung), `ConciergeCallCard` đổi copy tip AM. *Nguồn thiết kế, không phải code app.*

### WIP (còn trên nhánh)

- **Win Back flow — khối lớn nhất** (`feat/adama-add-win-back-flow`): `7b9ba052e` **`[deploy-functions]`** "Add win back flow" — **252 file, +28.715/-721**: FlowBuilder (canvas/nodes/edges/side panel/forms), TiptapEditor, `WinBacks` pages, 5 repository + ~20 service (`flowRunnerService`, `nodeExecutors`, `winBackAcceptService`, cron `winBackResumeService`), pubsub topic + handler, clientApi accept/open controller, view `win-back-status.html`, 691 dòng × 7 locale, **`firestore.indexes.json` +223 dòng**, sửa `.gitlab/ci/staging2.yml`, `yarn.lock` +1.341.
  Rồi `74ae82b1a` "Fix bug" (TiptapEditor, incentive helpers, analytics service) và `a00137f15` **port nốt 5/9 validation rule từ mockup**: rule condition có multi-select rỗng (`[]` là truthy nên `!r.value` không bắt → mọi subscriber rơi nhánh false), `order_discount` thiếu giá trị, `free_gift` thiếu product, `discount_code` rỗng, "charge after a delay" thiếu số ngày. Validator dùng chung cho badge builder + backend activate check.
- **Home widget showcase** (`feat/rebranch-color-in-app`): `64ec6ff77` fit image element → `db0066caf` serve ảnh lớn nhất (carousel bị mờ) → `7ad352197` lightbox: `useLockBodyScroll` + chặn wheel/touchmove bằng **native non-passive listener** (React `onWheel` là passive nên `preventDefault()` vô hiệu; `overflow: hidden` không chặn event chain qua iframe → scroll cả Shopify admin), lightbox có index riêng (trước đó phân trang trong lightbox lái luôn `active` của carousel), autoplay 5s tự re-arm và pause khi out-of-view / hover / `prefers-reduced-motion`.
- **Grow card copy** (`content/grow-card-need-a-hand-20260729-1745`): `6718e92f8` "Get setup help" → "Need a hand?" + `9dee7030e` chạy dịch 7 locale — khớp đúng PRD vừa merge ở `f96e17bd2`.

## Reverted

- **`10f0fd6f1` — revert `plan` postfix `_partner`, đổi sang cờ `isPartnerStore`.** Postfix ship ở **`v2.34.40`** (`94c770c40`, MR !2413, `[deploy-extensions]`, gồm `0c738ca26` spec → `59656928d` infra `const/planPostfix.js` + `plans.js` + `shopPresenter` + `behaviorService` → `2ea08e9e0` docs) rồi bị revert ở **`v2.34.41`** — **cách nhau 1 tag, cùng ngày** (-320 dòng, xoá 4 test file). Lý do: nhét postfix vào chính plan id buộc mọi chỗ resolve plan phải strip. Cùng họ với "merge rồi revert sau 8 giây" ở [[shipped-subscriptions-2026-07-25]] — pattern lặp lại: **ship hạ tầng trước khi chốt hướng**.
- `771bdc3d1` revert `1b01320ed` ("AppModal destructive primary action render in critical tone" — wire `tone="critical"` qua 3 render path embed/max/base). Cả ship và revert đều **trên nhánh**, không vào master.
- `2643791ba` revert `d698ce77f` (mockup thumbnail PNG→WebP, 5,6MB→126KB). Revert đưa **4 file PNG ~5,6MB trở lại repo** — đáng lưu ý vì đây đúng là loại phồng repo mà [[digest-artifact-2026-07-24]] phải đi dọn.

## Deploy notes

- **`[deploy-extensions]` × 3 đã vào master**: `v2.34.40` (`94c770c40`), `v2.34.42` (`ce8ddba10`), MR !2414 (`5caacf4f2`). Cả 3 đều đúng loại thay đổi cần đẩy extension (liquid app-embed, cờ portal) — khớp bài học "deploy đi bằng hai kênh khác nhau" của [[digest-subscriptions-2026-07-29]]; và repo vừa có skill `deploy-extensions` (`579bb8d45`) để chạy việc này.
- **`[deploy-functions]` chỉ có ở `7b9ba052e` (nhánh Win Back)** → khi merge sẽ **force full CI deploy**. Kèm 2 thứ phải làm ngoài code: deploy `firestore.indexes.json` (+223 dòng index mới) và `.gitlab/ci/staging2.yml` đã bị sửa.
- **7 version bump trong 1 ngày** (`v2.34.36` → `v2.34.43`). Mốc cần nhớ khi trace prod: **nếu môi trường nào dừng đúng ở `v2.34.40`, plan id ở đó đang mang postfix `_partner`** (đã revert từ `v2.34.41`).
- **Migration/data-fix**: `fixStuckOnboardingReinstall.js` (`c410328db`, đã vào master ở `v2.34.37`) — script một lần cho shop đã kẹt onboarding, cần chạy tay.

## Liên kết gợi ý

[[subscriptions]] · [[digest-subscriptions-2026-07-29]] · [[shipped-subscriptions-2026-07-29]] · [[shipped-subscriptions-2026-07-28]] · [[shipped-subscriptions-2026-07-25]] · [[digest-subscriptions-2026-07-28]] · [[subscriptions-debug-runbook]] · [[digest-artifact-2026-07-24]] · [[shipped-pdf-2026-07-30]] · [[subscription-work-style]] · [[shopify-app-dev]]
