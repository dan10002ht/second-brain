---
type: note
title: Digest Joy Subscription 2026-07-20 — xoá publicApi, discount recurring, cart-transform không rebuild wasm
summary: Phần mới: xoá hẳn publicApi thay vì vá guard, recurringCycleLimit phải là 0 (không phải null), app discount không bake vào contract nên phải trừ theo từng surface, và deploy cart-transform không rebuild wasm khi build command rỗng.
tags: [shopify, subscription, debug, nodejs, firebase]
created: 2026-07-20
updated: 2026-07-21
source: project "subscriptions" — session history (mined 2026-07-20)
---

# Digest Joy Subscription — 2026-07-20 (CHỈ phần mới)

Đã loại phần đã có trong các digest 07-09 → 07-19 (installment/defer-last, Horizon block,
cart-transform expand, race auto-swap, BigQuery, Redis, 3DS, i18n, `getVolumeOffer`, wasm limits…).

## Feedback

- **Không commit lẻ từng bước** — "làm xong hết rồi commit 1 lần"; và chỉ commit/push khi được yêu cầu rõ. (nối [[subscription-work-style]])
- **Đừng đổi hành vi global để chiều 1 store** — bật fix email cho vài shop thì tạo helper trong `const/customShop.js` (pattern `isCustomRescheduleOrderShop`) rồi thêm domain, không gate toàn cục.
- **Sửa component dùng chung = rủi ro regression**: vá `InlineProduct` làm giá màn Subscriptions *list* sai (567 → 402.32) → revert, làm lại bằng **prop opt-in** (`subtractLineDiscounts`) chỉ bật ở 2 component trang detail.
- **Chốt block security theo mức độ, làm từng đợt**: user chỉ duyệt #1–#4 (xoá + secrets) để deploy trước, #5–#7 (IDOR / open-redirect / tenant-isolation qua header) để sau — không tự ý ôm hết.

## Decisions

- **Xoá sạch `publicApi`** (routes/handlers/controllers) thay vì vá guard. *Why:* guard là key hardcode `'avada_public_api_key'` — ai biết key + orderId là ép được billing state mọi tenant; API không còn dùng → xoá là hết rủi ro.
- **Secrets (slack bot token, GCP API key trong `googleTranslate.js` / `autoTranslateV2.js`) đọc từ `process.env` + `safeConfig()`** theo pattern `config/slack.js`. Verify: **Firebase Functions Gen 1 CÓ đọc `.env`** (đọc thẳng `firebase-tools@13.29.1`) → không cần `functions:config`; hai đường là thay thế nhau, không cộng dồn.
- **Chặn `reset-migration-data` ở ts-tool**: thêm vào `REJECTED_TYPES` (`const/tsTool.js`) → `getRequiredScope()` trả `null` → middleware `403 OPERATION_REJECTED`. Gỡ luôn mục doc `disable-powered-by` (đã chết: rơi vào `default: break`). MR !2358.
- **Fix discount recurring bằng nút DevZone `fix-installment-discount-recurring`**, không migration hàng loạt. *Why:* scope chỉ đụng DiscountAutomaticApp trỏ đúng function installment → không ảnh hưởng discount khác.

## Bugs

- **SB-14456 — recurring order không được discount.** Discount app live có `recurringCycleLimit: 1`. Sâu hơn: `ensureInstallmentDiscount` tìm thấy app theo functionId là `return` luôn, **không update** (~L261) → discount tạo bởi code cũ không bao giờ self-heal. **Gotcha API:** giá trị "áp mọi cycle" là **`0`, KHÔNG phải `null`** — update `null` bị từ chối `recurringCycleLimit can't be blank`.
- **SB-14457 — email/contract hiện giá gốc.** Automatic **app (function) discount KHÔNG bake vào contract line**; Shopify chỉ áp lúc billing/checkout → contract detail, Upcoming order, email đều lấy `currentPrice` chưa trừ. Phải trừ `lineDiscountAllocations` theo từng surface; `collectOrderSummary` dùng chung cho admin Upcoming lẫn email → sửa 1 chỗ chảy sang cả 2 (vừa lợi vừa rủi ro).
- **Cart transform "đã deploy mà không expand"**: `[extensions.build] command = ""` rỗng → `shopify app deploy` **không rebuild wasm**, chỉ upload `dist/function.wasm` sẵn có. Verify bằng grep string literal JS trong `.wasm` (namespace metafield nằm ở graphql input query, KHÔNG compile vào wasm → grep namespace vô ích).
- **Thiếu scope `read_cart_transforms`/`write_cart_transforms` trong 3 file toml staging** (prod đã có) → cart transform không chạy; app là managed install nên phải re-grant qua `/updateScopes` sau `shopify app deploy`. Bẫy phụ: **sửa toml bị mất khi checkout sang branch khác**.

## Techniques

- **`lib/` build stale là bẫy khi test helper local**: chạy helper từ `lib/` ra kết quả giống hệt dù đổi input → đếm occurrence của logic mới trong `lib/` (0 = build cũ), rebuild rồi chạy lại. Cũng dùng để chứng minh "prod chưa nhận code mới".
- **Test-send email thật bằng code mới mà không cần deploy**: build `lib/` → gọi trực tiếp `resendSubscriptionEmailByType({shop, shopInfo, contractId, type})` với env staging + SMTP config, gửi tới tester nội bộ.
- **Audit doc ↔ code cho DevZone**: trích `case` theo mức indent cấp 1 của switch (bỏ nested switch/status/email = nhiễu), gộp token trong backtick của doc vào tập "đã document" → tìm ra ~50 action chưa document + 1 entry chết.
- **Recurring order trên dev/test store không có email order-confirmation** — hành vi đúng của Shopify (notification setting / giới hạn development store), không phải bug app; `SubscriptionBillingAttemptInput` không có field điều khiển email. Nguồn: Help Center (không có trong dev API docs → MCP không tra được).
- **Query contract trong Firestore**: field là `subscriptionContractId` (không phải `contractId`) — sai field ra rỗng, dễ kết luận nhầm "chưa swap".
- (chưa xác minh) Chi tiết "1 việc bắt buộc trước khi deploy" của CI (`.gitlab/scripts/selective-deploy.sh` + danh sách env cần set) chỉ xuất hiện dạng tóm tắt bị cắt trong transcript — kiểm lại repo trước khi tin.

## Liên kết gợi ý

[[shipped-subscriptions-2026-07-21]] (góc commit landed của cùng ngày) · [[digest-subscriptions-2026-07-19]] · [[digest-subscriptions-2026-07-18]] · [[subscriptions-debug-runbook]] · [[subscription-work-style]] · [[subscriptions]]
