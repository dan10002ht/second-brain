---
type: note
title: Digest Joy Subscription 2026-07-17 — sandbox≈staging, App Events vs Billing API, tsTool DFY + Yup
summary: Chỉ phần MỚI — chiến lược sandbox test (≈ staging, 2 loại data), app dùng Billing API cũ (không App Events), expose tsTool DFY API + gotcha Yup stripUnknown; toàn bộ Horizon/installment đã nằm ở horizon-digest.
tags: [subscription, shopify, avada, firebase, backend]
created: 2026-07-17
source: subscriptions (session history)
---

# Digest Joy Subscription — 2026-07-17

> CHỈ chứa phần MỚI. Loạt gotcha Horizon theme block (`{% javascript %}`, color-scheme,
> Theme Check MCP không bắt lỗi live-editor, metafield `.value`, `[hidden]` bị inline-block đè,
> `variant:update`/URL async), 2 mode partial/defer-last, và fix `synthBundleMetafieldFromDoc`
> cho variant-thêm-tay **ĐÃ nằm trong** [[subscription-installment-horizon-digest]] — KHÔNG lặp lại.

## Decisions

- **Sandbox test cho Joy Sub ≈ staging, không phải thứ mới.** Firebase project riêng + dev store + deploy trước prod = đúng định nghĩa staging. Đừng gộp 2 mục đích khác nhau vào 1 giải pháp: (1) môi trường auto-test/UAT chung, (2) luồng test riêng cho store VIP (cron ~3 ngày/lần). Recommend tách rõ 2 mục đích trước khi build.
- **2 loại data khi "sync sang sandbox" — own bởi 2 bên khác nhau:** (1) data app own 100% (Firestore/BigQuery/Redis/Cloud Tasks) → copy được; (2) data Shopify own (product/order/customer trên dev store) → KHÔNG sync trực tiếp, phải tái tạo qua API/seed. Đây là điểm dễ nhầm nhất. Pain point chính: state Shopify-side khó dựng lại giống prod.

## Bugs / facts (root cause)

- **App đang handle usage charge bằng Billing API cũ, KHÔNG dùng App Events API.** Event trong màn Usage charges là phần App Pricing; app hiện chưa tích hợp App Events (đẩy event lúc charge). ("event đẩy lên khi charge" — không hẳn đúng như UI gợi ý — chưa xác minh chi tiết timing.)
- **DevZone `disable-powered-by` là entry lỗi thời (no-op)**: rơi vào `default: break` trong switch `type` của `devZoneController.update`; giờ disablePoweredBy set qua `growth-hacking`/toggle khác. Doc `TS_TOOL_API.md` liệt kê nhưng code không có case → đã dọn. DevZone dispatch = 1 switch lớn trên `type` (không nhiều switch); ~50 action chưa document.
- Đưa `reset-migration-data` vào `REJECTED_TYPES` (`const/tsTool.js`): `getRequiredScope()` → null → middleware trả `403 OPERATION_REJECTED`.

## Techniques / gotchas

- **Codebase validate bằng Yup, KHÔNG Zya/Zod** (dù doc rules nói Zod) → theo code thật.
- **Yup `stripUnknown:true` khiến object thiếu default thành `{}` → `.required()` KHÔNG reject rỗng**; `.test` non-empty trên nested field cũng không chạy khi key vắng. → Đặt guard "payload rỗng → 400" ở **controller** (chắc chắn, không phụ thuộc Yup), để validate middleware lo whitelist.
- **2 mô hình Plan song song** phải cover cả hai: Plan v1 (`newPlanVersion=false`, gắn theo product) và v2 (`newPlanVersion=true`). Tool DFY dùng version guard + delegate admin controllers.
- Expose DFY API: controller mỏng gọi service/repo có sẵn + `getCurrentShop(ctx)` + response `{success,data}`; auth qua `tsToolAuthMiddleware` (set `shopID` + scope). `lib/docs/*` là build output → sửa source `packages/functions/src/docs/`, không sửa tay.

## Feedback

- **Sửa 1 chỗ theo ví dụ thì phải audit TẤT CẢ chỗ tương tự** (các card/item khác), không chỉ đúng chỗ được chỉ. Củng cố [[feedback-follow-conventions]]. **Why:** ví dụ chỉ là mẫu; sửa lẻ để sót lỗi giống hệt. **How:** render mockup ra ảnh → rà toàn widget, không eyeball.
- **Có mockup thì copy CSS gốc, đừng áng chừng** (badge `.pbadge` thiếu `::before`/`::after` do đoán thay vì trích CSS thật).

## Liên quan
- [[subscriptions]] · [[subscriptions-debug-runbook]] · [[subscription-installment-horizon-digest]] · [[subscription-digest-2026-07-16]] · [[app-development]] · [[firestore-multitenant]] · [[subscription-work-style]]
