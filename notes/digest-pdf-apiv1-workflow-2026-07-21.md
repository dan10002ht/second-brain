---
type: note
title: Digest workflow apiV1 (repo pdf) 2026-07-21 — mở rộng Public API v1 và những gì review đối kháng bắt được
summary: Workflow multi-agent extend apiV1 của PDF Invoice — ràng buộc bắt buộc của apiV1, 2 lỗi critical (Puppeteer lọt vào cold start 256MiB, endpoint resend luôn fail), blacklist field bị bypass qua route legacy, và cách chứng minh lint finding là pre-existing.
tags: [pdf, invoice, shopify, nodejs, backend, patterns, debug, avada]
created: 2026-07-21
updated: 2026-07-21
source: project "wf_0b697f72-4ac" (workflow multi-agent trên repo `pdf`) — session history (mined 2026-07-21)
---

# Digest workflow apiV1 — 2026-07-21

> Cùng repo với [[digest-pdf-2026-07-21]]: đây là các phiên **subagent của một workflow** (Phase 0 → 5C)
> mở rộng Public API v1 (`apiV1`) của PDF Invoice — API cho AI Agent support, **đang chạy production**.

## Decisions / ràng buộc kiến trúc của apiV1 (đáng nhớ, dễ vi phạm)

- **Không breaking**: mọi endpoint cũ giữ nguyên URL, body shape, response `{success, data}` (không thêm `code`/`message` cho route cũ) và **giữ HTTP 200 kể cả khi lỗi** như hiện tại.
- **Mount ở CẢ HAI prefix** `/api/v1` và `/app/api/v1` — phải giữ cả hai.
- **`shopId` LUÔN lấy từ `ctx.state.shopId`** (do `middleware/apiV1Auth.js` set), không bao giờ đọc từ body/query.
- **Không mount `koa-body`** → body đọc qua `ctx.req.body`; `ctx.request.body` luôn `undefined`.
- **Function deploy 256MiB** → tuyệt đối không để Puppeteer vào đường đi của apiV1.
- **Blacklist cứng không bao giờ cho ghi:** `shopId`, `createdAt`, `secret`, `id` — đổi `secret` **giết mọi link PDF đã gửi khách**.
- **Route mới phải kebab-case** (`/email-automation`, không `/emailAutomation`); controller mỏng, mọi ghi đi qua Service để không bypass plan-guard.
- **Phase 0 = viết regression test ghi lại HÀNH VI HIỆN TẠI trước mọi refactor**, kể cả khi hành vi đó là bug (ghi `// BUG:` + liệt kê, không sửa ở phase này).

## Bugs (root cause) — do review đối kháng bắt

- **CRITICAL — Puppeteer bị kéo vào cold start.** Một `import` static ở `controllers/apiV1/emailAutomation.controller.js:1` kéo chuỗi `emailNotification.service → webhook.service → export.service → printer.service → puppeteer.service`. Graph cold start nhảy ~40 → **194 module**, vô hiệu hoá hoàn toàn 2 chỗ đã cẩn thận lazy-`require`. *Fix:* lazy-require + **test guard** assert `require('routes/apiV1.route')` không đưa `puppeteer` vào `require.cache`.
- **CRITICAL — `POST /email-automation/resend` fail 100%.** `reSendEmail` gọi `processHookedInvoice({data: base64})` nhưng handler đọc `message.json` (getter của PubSub `Message`, plain object không có) → TypeError → 500. Test không bắt được vì **mock luôn cả `EmailNotificationService.reSendEmail`**. Và nếu "sửa" payload cho đúng thì mở luôn đường chạy Puppeteer runtime + gửi lại file qua SFTP/FTP thật.
- **MAJOR — blacklist bị bypass hoàn toàn qua route legacy `PUT /?type=update-settings`**: case này đẩy raw body thẳng repository (`.update(data)`), né sạch validator + allowed-fields + service guard mới → ghi được `secret`, `unLimitOrders`, `removeBrandMark` (tự cấp entitlement trả phí), `smtpPassword` plaintext + `isVerifiedSmtp: true`. Lỗi có từ trước **nhưng diff này bê nguyên đoạn đó sang service mới** → đúng lúc phải vá.
- **MAJOR — đổi hành vi endpoint production trong lúc "chỉ refactor"**: `dev-zone?type=create-all-templates` từ `updateAllTemplates(shopId, {})` (thực chất no-op, không bao giờ fail) thành `TemplateService.generateTemplates` (tạo thật document, có thể throw, `Promise.all` không rollback). Response message giữ nguyên nên client không thấy khác biệt.
- **MAJOR — "đi qua Service" ≠ "có plan-guard"**: `SettingsService.updateSettings` chỉ guard đúng 1 field (`xmlEmbedEnabled`), nên `PUT /settings {"isCombineOrder": true}` vẫn cho shop free bật feature wholesale. Comment nói có guard nhưng grep chứng minh không có.
- **MAJOR — `updateSettingsPartial` ghi metafield `secret: undefined`** khi shop chưa có settings doc: đọc `current` TRƯỚC khi ghi, mà lúc ghi repo mới `add()` doc + sinh `secret` mới → metafield storefront hỏng link download PDF.
- **MAJOR — auth model: 1 `X-DevZone-Key` toàn cục + `X-Shop-Domain` do client tự khai** → ai cầm key thao tác được mọi shop. Trước diff apiV1 gần như read-only; diff thêm CRUD template, ghi settings, resend email tới khách thật ⇒ blast radius tăng mạnh, không rate limit.
- **MINOR nhưng đáng nhớ**: `parseInt(ctx.query.limit)` không clamp trên function 256MiB (`?limit=100000` kéo cả collection vào RAM); yup non-strict `.noUnknown(true)` **không ném lỗi** mà chỉ strip khi cast — nên key-filter phải lọc riêng chứ đừng tin schema; controller không được `await` một method service "tình cờ đồng bộ" (`JSON.stringify(Promise)` → `{}`, im lặng).

## Techniques

- **Chứng minh lint finding là pre-existing chứ không đoán**: `git archive HEAD` ra sandbox + symlink `node_modules` → chạy eslint trên cây HEAD → diff 2 tập finding theo khoá `(file, rule, message)` bỏ qua số dòng → "NEW src findings vs HEAD baseline: 0".
- **Bẫy: đừng đặt file không-phải-test vào `__tests__/`.** Tạo `__tests__/.eslintrc.js` làm ESLint xanh nhưng **Jest vỡ** (default `testMatch` `**/__tests__/**/*.js` gom luôn file config → "test suite must contain at least one test"). Cách đúng: thêm `overrides: [{files: ['__tests__/**/*.js'], env: {jest: true}}]` vào eslintrc của package.
- **Dựng import-graph bằng script để verify ràng buộc kiến trúc** (ở đây: "không Puppeteer trong apiV1") — nhanh và đưa ra bằng chứng đếm được từng controller, thay vì đọc mắt.
- **`rtk` hook mangle stdout của eslint/grep** (JSON-parse + truncate) → redirect output ra file rồi tóm tắt bằng `python3`.
- **Review đối kháng phải kèm mục "đã kiểm tra và KHÔNG có vấn đề"** — báo cáo tốt liệt kê rõ IDOR/prototype-pollution/webhook/route-order đã verify đạt, để lần sau không phải soi lại từ đầu.

## Liên kết gợi ý

[[digest-pdf-2026-07-21]] · [[pdf]] · [[controller-service-repository]] · [[shopify-app-dev]] · [[digest-subscriptions-2026-07-21]]
