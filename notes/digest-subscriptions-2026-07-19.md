---
type: note
title: Digest subscriptions 2026-07-19 — custom installment build (phần mới) + kỹ thuật query prod local, Shopify Functions limits, self-healing metafield
summary: Chỉ phần MỚI của session build installment custom (9e918a83) — quyết định discount baked vào selling-plan price + whitelist từ sellingPlanIds thật, bug strikethrough/double-discount, và loạt kỹ thuật tái dùng (decrypt token query Shopify local, storefront fallback, BQ changelog forensics, validate Liquid JS, Shopify Function byte-limits, metafield-def chỉ ensure lúc install).
tags: [subscription, shopify, billing, bigquery, debug]
created: 2026-07-19
source: subscriptions (session history)
---

# Digest subscriptions — 2026-07-19

> 3 session mới. Phần LỚN đã nằm trong brain nên KHÔNG lặp lại:
> - session dd891fc3 (tsTool DFY API + Yup stripUnknown + 2 mô hình Plan) → đã có ở [[digest-subscriptions-2026-07-17]].
> - session 2a7af080 (MRR v3 legacy + loại dev store, Redis prod qua GCE/IAP, BQ cost gộp project ~7×, stored-proc partition-prune + verify equivalence, 3DS/SCA "một nửa" + verify3dsSecure email qua Pub/Sub, charge nhiều lần/cycle bình thường, order "from App via import" ≠ Online Store) → đã có ở [[subscription-digest-2026-07-10]] · [[subscription-digest-2026-07-13]] · [[subscription-digest-2026-07-15]] · [[digest-subscriptions-2026-07-18]].
> - session 9e918a83 (build installment custom) trùng nhiều với [[2026-07-08-installment-mode-design]] · [[subscription-digest-2026-07-11]]…[[subscription-digest-2026-07-16]]; dưới đây CHỈ phần chưa có. "chưa xác minh" nếu không confirm.

## Feedback / method (human pushback)

- **Sửa 1 chỗ là phải quét mọi card/item tương tự.** Bị nhắc "sao chỉ sửa mỗi chỗ mà t bảo vậy?" — cách đúng: render mockup ra ảnh rồi so **từng card** trong widget, không vá đúng chỗ được chỉ. (củng cố [[feedback-follow-conventions]])
- **Ràng buộc kiến trúc khi fix auto-swap race:** user **bác 2 phương án** — ghi mirror-product-line trực tiếp trong `swapForNextBilling` (dễ break functions memory + Shopify bucket) và deferred Cloud Task re-sync (làm khác kiến trúc app). Fix phải nằm TRONG luồng webhook re-sync sẵn có. Guard `isAutoSwapUpdate` **không phải hack chống lag** ("ko lag đâu ba ơi") mà là skip-preservation — đừng gỡ, chỉ gate theo trigger. (nối [[subscription-work-style]])
- **Dùng theme var, đừng giả định màu trung tính:** hardcode text widget `#1c1c1c` sai — theme merchant có `--color-foreground` là xanh (`#3661ae`). Đọc biến theme.
- **defer-last: origin order KHÔNG add children** — chỉ payment cuối của 1 life cycle mới giao toàn bộ; tái dùng cơ chế "Customize each order" (per-cycle rotation) cho expansion, chỉ khác phần giá. Với one-time tent user chọn **không giao sản phẩm original** → expand thẳng sang add-on, tránh dòng child trùng. (làm rõ thêm [[2026-07-08-installment-mode-design]])

## Decisions (mới, kèm why)

- **Subscription discount được nướng thẳng vào giá selling-plan** (không phải allocation riêng — verify trong code) → widget có thể **mô phỏng giá đã giảm cho sản phẩm swap kể cả khi nó không có selling plan**.
- **Discount function whitelist lấy từ `sellingPlanIds` THẬT trên product tent**, không từ config shop — vì `_joy_installment_mode` là line property client kiểm soát được (abuse thật), nên phòng thủ nhiều lớp trong function + gate backend. (bổ sung cho [[subscription-digest-2026-07-16]])

## Bugs (root cause)

- **Subscribe thiếu giá gạch khi plan discount = 0%:** compare của subscribe bị set = giá one-time. Fix: `compare = max(compare_at_price, price) × qty` (theo MSRP).
- **Double-discount lúc recurring billing (cơ chế cụ thể):** `prepareLineDiscountData` chạy ở tầng ORDER/billing, mỗi đơn recompute freq% từ `basePrice`; nếu đã nướng freq% vào giá catalog swap → nhân đôi. Lưu ý: hàm này **chỉ được gọi ở `orderController.getOne`** (chi tiết 1 đơn), KHÔNG ở path "upcoming orders" (`clientApi/orderController`) → sửa ở đó chỉ ảnh hưởng hiển thị order-detail. (làm rõ [[subscription-digest-2026-07-13]] "đọc giá render tránh double-discount")
- **Inject selling_plan vào SAI form:** product page có 2 element `action*="/cart/add"`; inject vào form không phải `product-form-component` → checkout submit không kèm selling_plan → mua thành one-time. Phải target form BÊN TRONG `product-form-component`. (làm rõ [[subscription-digest-2026-07-11]] "2 cart-form")
- **Thêm product metafield mới làm theme render 500** (chỉ trên product tent): bisect bằng xóa metafield → page hồi phục, nhưng re-add đúng value KHÔNG tái hiện → không phải do value, nhiều khả năng theme caching/propagation. **Root cause chưa xác minh.**

## Techniques (tái dùng)

- **Query Shopify live từ script local:** decrypt token đã lưu — CryptoJS AES (`accessTokenHash`), passphrase `ACCESS_TOKEN_KEY_PROD` từ `.env.local` (khác key dev); chạy qua `lib/` đã build (CommonJS, relative require → không cần babel-node).
- **Admin token stale (app reinstall trên dev shop):** đọc selling plan / metafield qua **Storefront API bằng `storefrontAccessToken` trong shop doc** — chạy được cả trên store password-protected.
- **BQ changelog forensics để chứng minh race:** dataset `firestore_sync`, bảng partition theo `timestamp` (DAY) + cluster `shop_id, subscription_contract_id`; luôn filter đúng partition (1 ngày) + cluster key, chạy `bq` **dryRun check cost trước**, rồi dựng timeline per-write (contract vs order, tới ms) để định vị thứ tự ghi stale.
- **Validate JS của Liquid block trước khi upload:** extract `<script>`, strip tag Liquid, đẩy qua `new Function(...)` / `node --check`.
- **Shopify Functions size limits:** Wasm ≤256kB, input ≤128kB, output ≤20kB; JS (javy/QuickJS) nặng hơn Rust nhiều → đo `.wasm` thật (cart-transform ~3–5kB, product-discount ~87kB đều dưới ngưỡng). `shopify app deploy` ship TẤT CẢ extension trong 1 app version (build-check trước); `shopify app function run` để dry-run input. (bổ sung [[subscription-digest-2026-07-16]] "Shopify Functions limits")
- **Metafield definition chỉ được ensure lúc install** (`ENSURE_METAFIELD_DEFINITIONS` trong installationService) → shop cũ KHÔNG bao giờ nhận definition mới. Cách: hook self-healing `ensure` (query-based) vào luồng save; metafield đọc từ storefront cần `storefront: PUBLIC_READ` trên definition. (root cause cho [[subscription-digest-2026-07-16]] "self-healing metafield lúc save")

## Liên quan
- [[subscriptions]] · [[subscriptions-debug-runbook]] · [[2026-07-08-installment-mode-design]] · [[subscription-installment-horizon-digest]] · [[subscription-digest-2026-07-14]] (auto-swap race gate-by-trigger) · [[digest-subscriptions-2026-07-18]]
