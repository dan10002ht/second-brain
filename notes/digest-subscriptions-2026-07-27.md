---
type: note
title: Digest Joy Subscription — shipping per-cycle, ensure không reconcile, giá đọc sai tầng attribute (2026-07-27)
summary: Chuỗi bug lấy sai nguồn sự thật (cycleIndex Firestore ≠ Shopify billing cycle, line.product.customAttributes ≠ line.customAttributes, plan doc id đổi sau khi mua) cộng hàm ensure chỉ create-if-missing nên cấu hình sai cũ không bao giờ được chữa.
tags: [subscription, shopify, avada, debug, firestore]
created: 2026-07-27
source: project "subscriptions" — session history
---

> CHỈ phần mới so với [[digest-subscriptions-2026-07-25]] và các digest trước.

## Feedback (cách làm việc)

- **"Đừng vội fix, hãy làm rõ vấn đề trước"** + **"verify data giúp tôi đã"** — user nhắc nhiều lần: xem screenshot/data thật, query source of truth, rồi mới bàn hướng sửa.
- **Sửa 1 chỗ thì quét hết chỗ tương tự**: user phản ứng khi chỉ sửa đúng card được chỉ ra mà không check các card/item khác. Khớp [[subscription-work-style]].
- **`git blame` để truy chủ sở hữu logic cũ** trước khi đổi — cả write lẫn UI của "shipping per-cycle" cùng một commit của một người, giúp hiểu ý đồ gốc.

## Decisions

- **Freeze discount installment theo contract lúc mua**, không đọc plan hiện tại. **Why**: merchant sửa discount 10%→20% sau đó thì contract cũ (đã báo 10% lúc mua) bị ăn theo — sai cam kết với khách. Chỉ áp cho case installment.
- **Không update mirror product line trực tiếp** và **không deferred re-sync bằng Cloud Task** — cả hai làm lệch kiến trúc app / dễ vỡ memory function + Shopify bucket. Thay vào đó chỉ **nới điều kiện sync theo trigger `create`** (không check `edited = true`).
- Sửa cho **contract mới** thôi, không fallback contract cũ, khi nhánh chưa live production.

## Bugs (root cause)

- **Shipping price per-cycle lệch kỳ**: cả **ghi** (set shipping ở Order Detail) lẫn **đọc** (preview) đều dùng `order.cycleIndex`/`currentBillingCycle` của Firestore làm **Shopify billing cycle index** — hai thứ này không đồng nhất vì app billing theo ngày hiện tại. Ngoài ra `syncDeliveryAndPaymentToCurrentCycle` mới chỉ sync address + payment method, **chưa sync `deliveryPrice`**.
- **Auto-swap không bao giờ chạy**: `contract.plan.subscriptionPlanId` trỏ doc plan lúc mua, còn **config auto-swap được tạo SAU khi mua với doc id MỚI** → không match. (Lúc mua plan vẫn tồn tại — bác bỏ giả thuyết "plan bị xoá".)
- **SB-14456 — hàm `ensure` chỉ create-if-missing, không reconcile**: `ensureInstallmentDiscount` tìm thấy discount app theo `functionId` thì **return luôn, không update** → app live tạo bởi code cũ với `recurringCycleLimit: 1` không bao giờ được chữa, dù code hiện tại set đúng. Bài học chung: **ensure phải reconcile cấu hình, không chỉ tạo khi thiếu**.
- **Giá installment ở Customer Portal sai**: đọc `line.product.customAttributes` (= 0) thay vì `line.customAttributes` (= 50). Dính ở **cả 2 list** — CP mới (`SubscriptionItems`) và scripttag cũ (`SubscriptionList.js`).
- **Widget inject `selling_plan` vào NHẦM form**: product page có **2 form** `action*="/cart/add"`, widget inject vào form không phải `product-form-component` → payload submit không có `selling_plan` → mua ra one-time. (Triệu chứng ban đầu bị đổ oan cho AOV / cho việc đổi frequency.)
- **Volume widget lấy quantity trễ**: đọc từ `AVADA_BUNDLE.volumeDiscountSelecting.volumeQuantity` — biến này cập nhật sau → giá sai khi đổi Buy 1 / Buy 2.
- **Thiếu scope `read_cart_transforms` / `write_cart_transforms` ở 3 file `shopify.app.*.toml`** (các app staging; bản prod đã có) → cart transform im lặng không chạy. Sau khi thêm phải reapply scope cho store + redeploy.
- **Horizon dispatch `variant:update` trên `document`**, không phải `change` trên form → listener gắn vào `productForm.change` bắt hụt việc đổi variant.

## Techniques / gotchas

- **Shopify KHÔNG gửi email order confirmation** cho test order (`test: true`) và development store (`plan.partnerDevelopment: true`) — đây là hành vi đúng của Shopify, không phải bug app. Docs nằm ở Help Center (không phải dev API docs).
- **Trước khi "sửa giá hiển thị", verify bằng hàm build selling plan thật** (`getSellingPlanVariables` / `getPricingPolicyByTier`) — đó mới quyết định giá bị charge. Gate `checkEnabledAmountDiscount` dùng ở ~82 chỗ nên đổi nó là đổi cả giá thật, không chỉ UI.
- **Discount kiểu Shopify app/automatic không bake vào contract line** → contract vẫn giữ giá gốc, mọi surface (email, CP, list) phải tự trừ. Xem thêm [[digest-subscriptions-2026-07-20]].
- **Kiểm tra file env mà script thật sự đọc**: script load `packages/functions/.env.development` trong khi key nằm ở `.env.local` / `packages/.env` → "thiếu key" giả.
- **Gate workflow có thể báo fail giả**: `eslint-fix` chạy toàn package làm diff phồng lên 82 file (scope thật ~8 file) → **luôn soi `git diff` vs master theo scope trước khi tin gate**. Revert danh sách file phải qua `xargs` (danh sách nhiều dòng bị word-splitting thành 1 pathspec).
- **Workflow đặt effort theo phase** (phase cơ học effort thấp) để giảm token; `rtk` + Serena chỉ tối ưu leaf-ops đọc/tìm, không đụng phần tốn token nhất — nhắc lại [[subscription-digest-2026-07-13]].
- **Chẩn đoán "block không hiển thị"**: đếm element trước (`joy-sub-root`, `Avada-Volume` = 0) để biết là *chưa add block* chứ không phải logic hỏng.

## Liên quan

[[subscriptions]] · [[subscriptions-debug-runbook]] · [[digest-subscriptions-2026-07-25]] · [[shipped-subscriptions-2026-07-25]] · [[digest-subscriptions-2026-07-20]] · [[subscription-work-style]] · [[shopify-app-dev]]
