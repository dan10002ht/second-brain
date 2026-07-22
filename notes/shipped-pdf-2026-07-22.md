---
type: note
title: Shipped PDF Invoice 2026-07-21 — apiv1 refactor sang controller-service-repository + 16 write endpoint (v3.1.54)
summary: Landed 07-21 (v3.1.53→54): apiV1 refactor sang pattern codebase (class + service + repository, bỏ Firestore trực tiếp khỏi controller) và bổ sung 16 write endpoint (14→30 route: Template CRUD, Settings, Email automation, Preview Liquid). WIP chưa merge: tracking store unlock template mới (banner_claim vs devzone_manual) + docs public-api.
tags: [pdf, invoice, shopify, patterns, firebase]
created: 2026-07-22
updated: 2026-07-22
source: repo "pdf" — git log (hash đã verify)
---

# Shipped — PDF Invoice for Shopify (landed 2026-07-21)

> Note "shipped" đầu tiên cho repo [[pdf]] (chưa có digest trước). Góc "cái gì thực sự lên master/tag".

## Shipped

- **apiv1: refactor sang pattern codebase + 16 write endpoint** — merge `a1d5acb04` (tag **v3.1.54**, !466),
  commit thật `2a609efa5`. Refactor không đổi hành vi, không breaking:
  - `apiV1Controller.js` → `apiV1.controller.js` (class `ApiV1Controller`, static methods); `routes/apiV1.js`
    → `apiV1.route.js`, vẫn mount cả `/api/v1` và `/app/api/v1`. Tách `ApiV1Service` +
    `emailActivityRepository`/`reportCacheRepository`, bỏ Firestore trực tiếp khỏi controller — đúng
    pattern [[controller-service-repository]]. `core/apiV1.res.js` giữ shape `{success, data}` cho endpoint cũ.
  - **+16 endpoint** (14→30, kebab-case): Template CRUD (create/update/delete/duplicate/set-default/
    batch/deleted/restore/generate-defaults), Settings (`PUT /settings`, `GET /settings/allowed-fields`),
    Email automation (`PUT`, `/toggle`, `POST /resend`), Preview (`POST /preview-html` — Liquid, **không**
    Puppeteer vì function chỉ 256MiB).
  - An toàn: `apiV1Validator` + schema whitelist, blacklist secret/shopId/createdAt/id; `shopId` luôn lấy từ
    `ctx.state.shopId` không bao giờ từ body; batch giới hạn 50 id, limit clamp 100; `coldStartGraph.test.js`
    assert import graph không chạm Puppeteer. Test: 11 suite / 220 pass.
  - ⚠️ Sửa file dùng chung ngoài phạm vi apiV1 (lưu ý khi review): `emailNotification.service.js` (fix bug
    pre-existing `reSendEmail` luôn throw → ảnh hưởng cả admin `PUT /email_notification/re-send`),
    `settings.service.js` (+`updateSettingsPartial` + `syncAppBlockMetafield`), `template.service.js`
    (+`duplicateTemplate` + batch), `processHookedInvoice.js` (+param `skipDeliveries`).
- **Refactor code structure for readability** — merge `2bb07c892` (tag **v3.1.53**, !435). Refactor thuần.

## Reverted

- Không có revert landed hôm nay.

## Deploy notes

- **Version bumps**: v3.1.53 → v3.1.54.
- **Migration / Firestore**: không có migration file landed trên master. (`firestore.indexes.json` bị đụng ở
  nhánh tracking chưa merge — xem WIP.)
- Repo pdf **không dùng** quy ước `[deploy-functions]` (đó là của [[subscriptions]]).
- ⚠️ Nhắc lại cảnh báo ở [[pdf]]: có secrets hardcode trong RELEASE_NOTE — không liên quan diff này nhưng cần dọn.
- **WIP theo dõi (chưa merge):**
  - `feat/new-templates-claim-tracking` `5660512c0` — đếm số store unlock bộ template mới, **tách 2 kênh**
    (`banner_claim`: merchant bấm "Claim now"; `devzone_manual`: team Avada "Add selected") vì
    `shop.newTemplatesUnlocked` set cho mọi shop mới nên không tách được nguồn. Firestore
    `newTemplatesClaims/{shopId}` (doc ID = shopId → mỗi store đếm 1 lần) + `stats/newTemplatesClaim`. Loại dev
    store + store nội bộ Avada; tracking fire-and-forget không throw; chỉ đếm từ ngày deploy, không backfill.
    26 test mới. **Đụng `firestore.indexes.json` (+16).**
  - `feat/apiv1-extend` `c669c887e`/`82c4eb7a5` — docs `public-api-spec.md` cho 16 write endpoint mới
    (curl/response examples, error codes, legacy contract note). Chưa merge.
  - `feature/new-templates` `559fd96b9` — thay ảnh template invoice PNG → WebP + polish banner. Chủ yếu asset.

## Liên quan
- [[pdf]] · [[controller-service-repository]] · [[shopify-app-dev]] · [[app-development]]
