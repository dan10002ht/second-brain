---
type: note
title: Digest Joy Subscription 2026-07-16 — cart-transform expand cho one-time bundle, Shopify Functions gotchas, flag enableAovBundleSwap, bug WIDGET_V4_DATE
summary: Learning MỚI so với digest 07-15 — saga tent one-time ×5 qua Cart Transform expand + installment discount function (limits/register/deploy), self-healing metafield/discount lúc save, flag ẩn enableAovBundleSwap, bug placeholder-date WIDGET_V4_DATE, feedback "user đè file theme mới lên repo → re-apply, đừng overwrite".
tags: [subscription, shopify, extensions, storefront, debug]
created: 2026-07-16
source: project "subscriptions" (session history 2 session — chưa xác minh hết chi tiết)
---

# Digest — Joy Subscription (2026-07-16)

> CHỈ chứa phần MỚI so với [[subscription-digest-2026-07-15]] và các digest trước.
> Đã lược bỏ: chi tiết race auto-swap (07-14), decrypt token prod, Horizon block gotchas
> (horizon-digest), toàn bộ quyết định Phase 2 vol-reprice (đã revert 07-12).
> Proposal chờ brain-learn duyệt.

## Feedback (cách làm việc)

- **User hay copy bản theme MỚI NHẤT từ theme khách save đè lên file trong repo** (vd `theme-custom/reformlabs/joy-supply-widget.liquid`) → edit của agent biến mất (màu revert, autoSwap mất). Trước khi sửa: diff working tree vs commit, **re-apply lên bản hiện tại của user** ("sửa trên version hiện tại nhé"), KHÔNG đè lại bản commit.
- **Review nhánh lớn phải chạy high effort.** Low = 1 lượt đọc diff, tối đa 4 findings → user: "ủa? review kiểu gì có tí vậy?". High = fan-out 3 agent theo mảng (admin UI / widget / pricing-backend) + verify chéo.
- **Hỏi làm rõ requirement thì hỏi lần lượt TỪNG CÂU**, không dồn nhiều câu một lúc ("bạn hỏi tôi lần lượt từng câu nhé").
- **Trước khi code: note các bước + đánh dấu rõ chỗ đang GIẢ ĐỊNH** (có thể sai) để user chỉnh; luôn tự hỏi regression "sửa thế này store khác vẫn work chứ?" (null-safe, chỉ activate khi có marker). Comment của coder-agent có thể SAI — tự đọc code verify. (mở rộng [[feedback-follow-conventions]])
- **Scaffold extension bằng `shopify app generate extension`**, không tự tay tạo file.
- **Trước khi merge master: commit WIP trên branch trước** rồi mới merge, tránh mất việc (33 file feature chưa commit).
- Mockup bị cắt/mơ hồ → **render component ra ảnh vài biến thể A/B/C/D cho user chọn**, đừng đoán qua nhiều vòng.

## Decisions (kèm Why)

- **Tent one-time ×5: dùng Cart Transform `expand`, KHÔNG dùng `update`.** Why: `update` là Plus-only, `expand` chạy mọi plan và là pattern chính thức. Mô hình addon: **không giao original, chỉ giao addon** (tránh dòng tent con trùng), tổng giá gộp vào addon.
- **Installment discount = 1 Shopify Function xử lý cả 2 mode** (partial/defer-last), config **per-product qua metafield `avada_installment_discount`** (không whitelist shop-level); fixed áp mỗi cycle, cả first + recurring. Structure theo convention `product-discount`: `const/` + `helpers/` + `services/`, `run.js` mỏng.
- **`_joy_installment_mode` là line property client kiểm soát → vector abuse** (ai cũng `POST /cart/add.js` với properties tùy ý). Phòng thủ nhiều lớp: function chỉ discount khi thỏa TẤT CẢ điều kiện (~95%) + 1 chốt backend.
- **Auto-swap mặc định CHỈ đổi product, GIỮ NGUYÊN giá.** Chỉ đổi giá (catalog mode) khi bật **flag ẩn shop-level `enableAovBundleSwap`** (mặc định OFF; shop String Flags đang TRUE). Nguồn: `autoSwapService.js`.
- **Sub-discount (frequency) được BAKE thẳng vào selling plan `price_adjustments`**, không phải discount code/function — ngược với vol% (đến từ discount code AOV, xem [[subscription-digest-2026-07-12]]). Hệ quả: mô phỏng được giá "2nd payment onwards" client-side không cần swap product có selling plan.
- **Widget supply-tabs ReformLabs: widget TỰ TÍNH giá cả 2 tab, AOV chỉ dùng để drive cart action.** Why: AOV chỉ render 1 giá subscribe duy nhất (không per-supply), đọc DOM sẽ đè sai giá. → Nuance cho bài "đọc giá AOV render thật" ở [[subscription-digest-2026-07-13]]: chỉ đúng khi AOV có đủ giá per-option.
- **Refine race auto-swap (bổ sung [[subscription-digest-2026-07-14]]):** guard `!isAutoSwapUpdate` là behavior GỐC từ master (restore ở commit `f99ab9780d` sau refactor drift), KHÔNG phải chống lag → không được bỏ guard, chỉ gate thêm `trigger === 'contract_create'`.

## Bugs (root cause)

- **`WIDGET_V4_DATE = 2026-06-20` là placeholder "far-future" nhưng đã nằm trong QUÁ KHỨ** (`isEnableWidgetV2.js:11`) → widget v4 tự kích hoạt ngoài ý muốn + chuỗi hệ quả ở save-flow. Bài học: đừng dùng date placeholder — nó sẽ thành quá khứ. (finding từ review nhánh `widget-v4` — chưa xác minh đã fix)
- **Volume block hiện trên MỌI product:** `getVolumeOffer` lấy `offers[0]` không check product hiện tại có trong `triggerProducts` → phải khớp product/variant với `triggerProducts`/`triggerCollections` trước khi render.
- **Installment widget không update giá khi đổi variant:** chỉ nghe event Horizon `variant:selected`/`variant:update`, thiếu fallback `change` trên variant input. Kèm theo: theme tự re-render giá sẽ **xóa mất override** "$X × N payments" → dùng **MutationObserver re-apply** (re-run cả `renderSchedule`, disconnect trong lúc tự ghi để tránh loop).
- **Inline `<script>` của theme block chạy lúc trang đang parse** → product form chưa tồn tại → `syncThemeForm` không fill `selling_plan` (phải đổi frequency mới ăn). Fix: retry/đợi form parse xong.
- **Metafield product chứa 6 plans trong khi merchant chỉ setup 4** — plan stale trong metafield → re-sync metafield (và decrypt token đúng shop trước).
- **Lệch 2 xu giữa widget và cart = cách làm tròn**, không phải tính sai: widget làm tròn TỔNG (`2999×3×0.70 → $62.98`), AOV/cart làm tròn per-unit rồi nhân.
- **Giá gạch khi product đang sale:** dùng `max(compare_at_price, price)` (MSRP thật) × qty, đừng lấy `price`.
- **Luật badge AOV:** tier `isDefault` hiện badge GLOBAL (`setting.volumeDiscount.badgeText`, vd "MOST POPULAR"), các tier khác chỉ hiện `badgeText` riêng khi `isShowBadgeEachTier: true` — config có badgeText mọi tier không có nghĩa là hiện hết.

## Techniques — Shopify Functions & CLI

- **Limits:** Wasm ≤ 256 kB, input ≤ 128 kB, output ≤ 20 kB. JS (javy/QuickJS) nặng hơn Rust nhiều — đo thật (cart-transform ~5 KB, product-discount 87 KB).
- **1 shop chỉ được 1 cart-transform function per app** → extend `cart-transform-extension` hiện có thêm nhánh, không tạo mới.
- **`expand`: line cha KHÔNG có giá riêng** — giá hiển thị đến từ components (`expandedCartItems[].price.adjustment.fixedPricePerUnit.amount`). Đánh đổi về display.
- **Deploy KHÔNG tự tạo CartTransform object** → phải chạy `cartTransformCreate` (register) riêng; thiếu object thì transform không làm gì.
- **`shopify app deploy` đẩy CẢ app version (mọi extension)**, không phải 1 → pre-flight build-check tất cả function trước khi deploy.
- **Discount function mới bắt buộc field `discountClasses`** (vd `[PRODUCT]`) theo API mới — thiếu là create lỗi.
- `shopify app dev` hot-reload extension local (không cần deploy); `shopify app function run` test input case từ `lib/` sau build — **exit 137 = OOM**, chạy lại.
- **Self-healing thay vì manual ops:** `ENSURE_METAFIELD_DEFINITIONS` chỉ publish lúc install (`installationService.js`) → shop đã cài không tự có definition mới; hook `ensureAppMetafieldDefinitions` vào flow **save**. Discount cũng vậy: `ensureInstallmentDiscount` query-based, tự tạo DiscountAutomaticApp lúc save (tránh bug stuck-flag).
- **Nhánh one-time cho installment bundle:** widget vốn LUÔN inject `selling_plan` → expose metafield `avada_onetime_addon` (PUBLIC_READ) cho widget tự tính; `syncThemeForm` nhánh one-time gỡ `selling_plan` + `_joy_installment_mode`; `DisplayManager` gate bỏ `properties[Contents]` chỉ khi one-time + `bundle.isInstallment` (nhận biết one-time = input `selling_plan` rỗng).

## Techniques / Gotchas — khác

- **i18n app:** label admin trống = thiếu key; app đọc từ `locale/translations/en.json` (KHÔNG phải file source) → key mới phải chạy `yarn trans` mới tới runtime; "Translate 0 words" khi chỉ xoá key là bình thường; sub-component không có JSON riêng → truyền `i18n` prop từ parent.
- **Liquid phá lint JS:** `{{ }}` trong `<script>` gây "Unexpected token" giả → strip Liquid trước khi check. Và Liquid tag viết TRONG comment JS (vd `{% style %}`) vẫn bị theme editor parse → lỗi "'style' tag was never closed" — đừng viết cú pháp Liquid trong comment.
- **"Theme editor OK nhưng storefront không thấy" → theme chưa Publish** (editor đang sửa theme draft, khác theme live).
- **Nhận diện theme trước khi phán:** Elixir ≠ Horizon — grep "horizon" dính false positive từ "horizontal"; verify bằng `config/settings_schema.json` (`theme_name`). Elixir: block định nghĩa trong section (`shop-product-details`), KHÔNG có folder `blocks/` top-level.
- **macOS TCC chặn `~/Downloads`** (EPERM cả Bash lẫn Read tool — không phải sandbox) → copy file vào project dir rồi mới đọc.
- **Xác nhận env/shop trước khi query:** local dev chạy Firestore RIÊNG (emulator/dev project — `serviceAccount.development.json`, staging3), query prod sẽ ra "shop không tồn tại". (bổ sung [[subscriptions-debug-runbook]])
- **`webhookLogs` không có index trên `createdAt`** → không query theo range được; lọc domain in-memory hoặc bỏ hướng này. (bổ sung [[subscriptions-debug-runbook]])

## Liên quan

- [[subscription-digest-2026-07-15]] · [[subscription-digest-2026-07-14]] · [[subscription-digest-2026-07-13]] · [[subscription-digest-2026-07-12]] · [[subscription-installment-horizon-digest]]
- [[subscriptions]] · [[subscriptions-debug-runbook]] · [[subscription-work-style]] · [[feedback-follow-conventions]] · [[2026-07-08-installment-mode-design]] · [[app-development]]
