---
type: note
title: Shipped Joy Subscription — commit landed 2026-08-06 (v2.34.55→57)
summary: Commit landed 08-06 — master nhận 3 tag (Delivery provider app + custom attribute cards kèm chuỗi strip `_joy_*` khỏi mọi surface đọc customAttributes, guard field `product` thiếu làm trắng trang, mock analytics data bật bằng DevZone toggle) cộng 1 MR chore nâng Jest 24→30 và job auto-merge MR tài liệu; trên nhánh: box editor max modal giữ draft qua reload + hỏi save khi bấm X, 139 test e2e Playwright, ghi mọi source của CLS lớn nhất; không revert, không cờ deploy.
tags: [subscription, shopify, avada, react, firestore]
created: 2026-08-07
source: repo "subscriptions" — git log (2026-08-06); mọi hash/tag dưới đây lấy nguyên từ log
---

# Joy Subscription — shipped 2026-08-06

> Phần *học được* của ngày này (doc Firestore thiếu field `product`, worktree thiếu
> `.env.local` làm gate đỏ giả, bẫy đo layout-shift) đã nằm ở
> [[digest-subscriptions-2026-08-06]] — **không lặp lại ở đây**.
> Bối cảnh project: [[subscriptions]] · runbook: [[subscriptions-debug-runbook]].

## Shipped

### Vào master — 3 tag + 2 MR chore

- **`d3cfffd6e` — tag `v2.34.55`, MR !2430** — *Delivery provider app + Custom attribute
  cards on manual create*. Đây là nhánh `feat/manual-delivery-custom-attr` đã theo dõi từ
  [[shipped-subscriptions-2026-08-06]] (khi đó còn WIP) nay merge. Branch head lúc merge là
  `d0ea2b19a`, nên đợt này **kéo theo trọn chuỗi strip `_joy_*`**:
  - `721353e7c` helper `stripJoyAttributes` (bỏ key `_joy_*` khỏi cả array lẫn object) + test,
  - `90359241a` strip ở producer delivery-provider (order custom attributes),
  - `21f94a2f9` strip ở 2 endpoint đọc contract: admin `subscriptionContractController`
    và portal `readController` — cùng một quy tắc phải vá ở **mỗi surface đọc riêng**,
  - `d0ea2b19a` giữ lại `_joy_*` khi *ghi* edit-attribute lên contract (strip ở đường đọc
    mà không guard đường ghi thì lần edit đầu tiên xoá sạch attribute nội bộ),
  - `8c1221719` tách `resolveManualIntegrationPayload` khỏi webhook contract-create.
- **`bbae6adb3` — tag `v2.34.56`, MR !2444** — guard doc `subscriptionProducts` thiếu field
  `product` (nguồn `64764171f`). Fix ở 5 chỗ backend + 1 chỗ FE defense-in-depth, kèm 366
  dòng test regression. Root cause đã ghi ở [[digest-subscriptions-2026-08-06]]; ở đây chỉ
  chốt: **nó vào master ngày 08-06**.
- **`3c6f5f91b` — tag `v2.34.57`, MR !2445** — *mock analytics data + DevZone toggle*, để
  demo/QA thấy biểu đồ có dữ liệu mà không cần shop thật:
  - `caebf5067` bộ sample + `useMockAnalytics`/`sampleSeries` + section trong DevZone,
  - `9a46436d2` phủ thêm tab Forecasting, `a0e4fb526` sample phủ **mọi stock state** của
    Inventory forecast,
  - 2 fix của chính bộ sample: `56dfadf80` (mock mode vẫn vẽ empty state đè lên sample rows)
    và `c0105d38d` (chuỗi sample dồn hết vào **một bucket tháng** nên line chart vẽ ra rỗng —
    tách `sampleWindow.js` + test).
- **`ba4e6809a` — MR !2443** — chore backend: gate chuẩn output, hook kỷ luật git,
  **nâng Jest 24 → 30**. Dep bump lớn nhất trong ngày, đáng nhớ khi test bỗng vỡ.
- **`1e4912635` — MR !2446** — job CI auto-merge MR chỉ đụng `product-team/`
  (nguồn `677bb9f31`), đúng phương án đã chốt ở [[2026-08-06-auto-merge-mr-tai-lieu-ba]].
  Cùng ngày đã phải sửa whitelist username: `e87e4def8` (`longlv` → `longlv3`) — *chưa merge*.
  ⚠️ Lệch với decision đã ghi: commit body nói PAT **bỏ Protected**, trong khi decision ghi
  "PAT scope `api` Protected".

### Còn trên nhánh (chưa vào master)

- **`fix/appbridge-box-editor-max-modal`** — tiếp đợt lớn của
  [[2026-08-06-appbridge-v3-sang-max-modal]], lần này xử đúng cái tradeoff đã ghi trong
  decision ("nút X đóng làm mất thay đổi chưa lưu"):
  - `821b951c7` bấm X → **đóng rồi mở lại rồi mới hỏi** (host không cho chặn hide, đã đo);
    child tự vẽ dialog Polaris vì App Bridge không đăng ký web component trong iframe con,
    parent chỉ mirror cờ dirty qua `box-frame:dirty`. Mọi nhánh lỗi degrade về hành vi cũ.
  - `6da5b3b1e` giữ draft qua reload iframe (`boxFrameDraft` + `useBoxFrameDraft`, 13 file).
  - `aed6d0526` Save trong dialog bị `savingRef` **nuốt im lặng** → helper `coalesceAsync`.
  - `cf0aa779d` propagate i18n key sang de/es/fr/it/ja; `845c440a5` sửa test box-frame chạy
    được dưới jsdom sau khi merge master (`0b20aaf8b`, conflict `jest.config.js`/`yarn.lock`
    — hệ quả trực tiếp của đợt nâng Jest ở trên).
- **`feat/auto-test`** `d6b0a954f` — **139 test e2e Playwright** (Orders/Subscribers/Portal/
  Subscription Box + fixture mỗi test một contract riêng, tự huỷ) + 3 bộ test case viết
  ngược từ UI thật. Đáng chú ý là phần *hạ tầng test tự nó sai và im lặng*: `nav.js` dùng
  `?tab=` trong khi Settings đọc `?tabId=` (test chạy nhầm tab mà vẫn xanh),
  `CUSTOMER_PORTAL_URL` trỏ trang không tồn tại, `STORE_PASSWORD` rỗng → `bypassStorePassword()`
  bỏ qua nên toàn bộ test storefront đâm vào tường mật khẩu mà vẫn "pass" các bước đầu.
  Bug phát hiện được: search Joy charge ID không nhận chuỗi hiển thị `#JOY1014-49`, chỉ nhận
  phần số. Bộ test case **cần BA review** trước khi tin.
- **`perf/cls-sources`** `4dae7b032` — ghi lại **mọi source** của cú shift lớn nhất, không
  chỉ element di chuyển xa nhất. Lý do trong commit: production lặp đi lặp lại một shift ở
  home (card trượt 24.194 → 24.322 ở 3 session, lúc 3s/11s/38s) mà sample không nói được cái
  gì phía trên nó nở thêm 128px. Nối tiếp chiến dịch CLS ở [[shipped-subscriptions-2026-08-04]]
  và kỷ luật đo ở [[do-layout-shift-bang-browser-automation]].
- **`feat/sb-13947-volume-bundle`** `93168dfa9` — chọn variant cho gift card + gom nhóm gift
  item trong Volume Bundle. Feature này xuất hiện từ [[subscription-shipped-2026-07-13]],
  đến giờ vẫn chưa merge.

## Reverted

Không có revert nào trong log ngày 08-06.

## Deploy notes

- **Không có `[deploy-functions]` / `[deploy-all]`** trong toàn bộ log ngày này.
- **Không có file migration.**
- Version bump: `v2.34.55` → `v2.34.56` → `v2.34.57` (3 tag trong 1 ngày).
- Dep bump cần để ý khi CI đỏ: **Jest 24 → 30** (`ba4e6809a`) — đã kéo theo conflict
  `jest.config.js`/`package.json`/`yarn.lock` cho nhánh box editor ngay trong ngày.

## Bỏ qua (noise)

`cde664c22` merge master vào `debug/prod-env` (không có nội dung),
`87f2af4d6` update mockup-app/PRD chỉ sửa 5 dòng DESIGN-SYSTEM.md.

## Liên quan

[[shipped-subscriptions-2026-08-06]] · [[digest-subscriptions-2026-08-06]] ·
[[digest-subscriptions-2026-08-07]] ·
[[2026-08-06-appbridge-v3-sang-max-modal]] · [[2026-08-06-auto-merge-mr-tai-lieu-ba]] ·
[[do-layout-shift-bang-browser-automation]] · [[subscriptions]] · [[subscription-work-style]]
