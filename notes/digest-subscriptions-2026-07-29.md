---
type: note
title: Digest Joy Subscription — giá installment lệch theo từng surface, deploy sai kênh, reinstall nhốt onboarding (2026-07-29)
summary: CHỈ phần mới — mỗi surface đọc một nguồn customAttributes khác nhau (list Firestore không có `lines`), old CP có 2 màn detail nên fix 1 chỗ không đủ, `shopify app deploy` không đụng scripttag, và reinstall không clear `uninstalledAt` làm shop kẹt onboarding.
tags: [shopify, subscription, avada, debug, billing]
created: 2026-07-29
source: project "subscriptions" (Joy Subscription) — session history
---

# Digest Joy Subscription — 2026-07-29

> Chỉ ghi phần **mới** so với [[digest-subscriptions-2026-07-28]],
> [[digest-subscriptions-2026-07-27]], [[digest-subscriptions-2026-07-25]],
> [[shipped-subscriptions-2026-07-29]].

## Feedback

- **Đừng bịa tên người trong thread Slack.** Thread chỉ có user ID; đã gán bừa
  một cái tên rồi bị user bắt ("thread này làm gì có a hoàng nào nhỉ ????").
  Phải tra `users.info` ra tên thật rồi mới nhắc/mention. Lặp lại y hệt ở
  [[digest-pdf-2026-07-29]] → coi như quy tắc cứng.
- **"cần query data và verify nhé"** — user chặn ở mọi bước sửa giá: không được
  suy từ code, phải query contract/order thật và in ra số trước khi code, và
  verify lại sau khi sửa. Nhiều lần chính bước này lật ngược chẩn đoán.
- **Giới hạn phạm vi theo trạng thái ship**: "ko cần fallback contract cũ nhé,
  tại nhánh này chưa live production" → chỉ xử lý contract mới, không viết
  migration/backfill cho data chưa từng tồn tại ngoài thật.

## Decisions

- **Bỏ postfix trên `plan` id, chuyển sang cờ `isPartnerStore` trên shop.**
  *Why:* nhét postfix vào chính plan id làm mọi chỗ resolve plan phải strip —
  ô nhiễm lan ra toàn hệ. Cờ riêng giữ `plan` gốc nguyên vẹn. *Tradeoff:* thêm
  một field trạng thái phải nhớ đồng bộ (đặc biệt khi Joy Loyalty tặng plan).
  Postfix đã merge (`!2413`) nên phải **revert nguyên merge** trên nhánh mới.
  Phát hiện kèm theo: plan cấp bởi partner **vẫn đi qua `afterCharge`** của
  `@avada/core` (không qua Shopify billing thì cũng vẫn qua hook đó).
- **Sửa hiển thị giá bằng opt-in prop tại từng call-site, không patch component
  chia sẻ.** Bản đầu patch thẳng `InlineProduct`/tooltip/`collectOrderSummary`
  → **double-count $402.32** ở trang Subscriptions list. Làm lại: thêm prop
  `subtractLineDiscounts` và chỉ những card thật sự cần mới truyền vào.

## Bugs (root cause)

- **Mỗi surface đọc một nguồn `customAttributes` khác nhau** — đây là họ lỗi
  chính của cả phiên, và nó không phải một bug mà là bốn:
  | Surface | Nguồn dữ liệu | Bẫy |
  |---|---|---|
  | Admin list | Firestore `contract.products[].customAttributes` | ok |
  | CP detail | Shopify `line.customAttributes` | `line.product.customAttributes` = undefined |
  | CP **list** | endpoint `/subscriptions` → **Firestore contract, KHÔNG có `lines[]`** | code iterate `lines` → luôn ra 0 |
  | Email/upcoming | `line.discountAllocations` | đường độc lập, thường đúng sẵn |
  Nối tiếp "`line.product.customAttributes` ≠ `line.customAttributes`" ở
  [[digest-subscriptions-2026-07-27]]. Bài học: **list và detail của cùng một
  màn có thể trả hai shape khác nhau** — kiểm payload thật của từng endpoint.
- **`getContractProductProps` đọc sai thứ tự fallback**:
  `prepareProduct.customAttributes || lineItem.customAttributes` — mảng rỗng là
  **truthy** nên nhánh sau không bao giờ chạy → discount bị rơi. Fix: ưu tiên
  `lineItem.customAttributes`.
- **`lineTotal` truyền vào hàm tính discount phải là giá BASE**, không phải giá
  đã giảm. Field Firestore đã là 209.5 trong khi `calculatePricing` trả 419 —
  lấy nhầm thì trừ discount hai lần.
- **Old CP (scripttag) có HAI màn detail khác nhau**: `customerPortal/pages/SubscriptionDetail`
  (dùng `getContractProductProps`) và `SubscriptionProductItem` (dùng thẳng
  `lineDiscountedPrice`). Fix một chỗ → giá top-right vẫn sai trong khi Order
  summary đã đúng. Mở rộng luật **CAU V1/V2 parity**: parity không chỉ giữa hai
  bản portal mà còn giữa các màn **trong cùng một bản**.
- **Email billing-failed hiện giá gốc** — hai lỗi chồng nhau: (1) `orderTotal`
  dùng `originalTotalPriceSet` (pre-discount) thay vì `totalPriceSet`; (2)
  `getBillingCycleContract` gắn `order: {...originOrder, lineItems}` — tức là
  **đơn gốc**, không phải order của cycle đang xét. Bẫy chẩn đoán: trên order
  **thật** thì `originalTotalPriceSet === totalPriceSet` (đều đã discount), nên
  nhìn field không đủ để kết luận — phải truy xem `order` đến từ đâu.
- **`UpcomingOrderCard` có 3 chỗ render `InlineProduct`** (nonBox /
  bundleFixedProducts / box); nhánh bundle-parent gọi với args khác
  (`prepareLine(lineForRender, !isParent)`) nên `replace_all` không khớp và bị
  bỏ sót. Quét theo **call-site**, không theo chuỗi giống nhau.
- **Reinstall không clear `uninstalledAt` → shop kẹt onboarding** (SB-14784).
  `isShopSetupDone()` **tính lại mỗi lần đọc** từ hai mốc thời gian bất biến,
  nên cờ tồn dư làm nhiều chỗ vẫn coi shop là đã gỡ app. Chẩn đoán auto-triage
  trên Jira ("2 API call fail silently") sai. Fix: clear `uninstalledAt` (cờ
  **trạng thái**) và ghi riêng `lastUninstalledAt` (dữ liệu **lịch sử**) — đúng
  họ với bài học "cờ trạng thái DB không thay được tracking hành vi" ở
  [[digest-pdf-2026-07-21]].

## Techniques / gotchas

- **Deploy đi bằng hai kênh khác nhau — đừng đổ cho code khi chưa kiểm kênh.**
  `shopify app deploy` chỉ đẩy **extensions** (defer-last-discount, cart-transform,
  customer-account-ui = new CP). Còn **scripttag (old CP) + functions + hosting**
  đi bằng `firebase deploy` (`yarn deploy`) / CI. Fix nằm trong HEAD mà old CP
  vẫn cũ = deploy gap, không phải bug. Bonus: bundle old CP tên **cố định**
  (`avada-customer-portal-main.min.js`, không content-hash) nên cache là nghi vấn
  hợp lý phải loại trừ trước.
- **`yarn deploy-shopify` fail "Flag not specified: allow-updates"** → chạy thẳng
  `shopify app deploy -c <config> --force` (bắt buộc `--force` khi non-interactive).
- **Discount tự động (Shopify Function) KHÔNG lưu trên contract** — chỉ được
  đánh giá lúc billing. Query `discountAllocations` của contract chỉ trả
  `SubscriptionManualDiscount` / `AppliedCodeDiscount`. Riêng discount installment
  lại **materialize thành `SubscriptionManualDiscount` tiêu đề "Installment saving"**
  (targetType `LINE_ITEM`) — đó là lý do các surface đọc `discountAllocations`
  hiển thị đúng trong khi surface đọc metafield thì sai.
- **Store dev/test của Shopify KHÔNG gửi email order confirmation** (shop
  `partnerDevelopment: true` + order `test: true`) — hành vi đúng của Shopify,
  không phải bug app. Loại giả thuyết này trước khi đi debug luồng email.
- **Chứng minh "lỗi cũ chứ không phải do nhánh" bằng git, không bằng lời**: so
  từng surface giữa `master` và nhánh, chỉ ra với line non-installment thì
  discount = 0 nên biểu thức **giống hệt** master → bug volume-discount là
  pre-existing. Cùng kỹ thuật với [[digest-pdf-apiv1-workflow-2026-07-21]].
- **Slack `conversations.replies` cần form-encode**, không nhận JSON body.

## Điểm cần đối chiếu

- Phiên này lại đọc `_joy_installment_discount` (line attribute do client set)
  làm nguồn freeze trong `defer-last-discount`, trong khi
  [[digest-subscriptions-2026-07-25]] ghi là **đã bỏ nhánh `frozenDiscount`** vì
  attribute client-settable là lỗ hổng, và freeze phải làm ở webhook
  contract-create. **Chưa xác minh** thứ tự thời gian giữa hai mạch này — cần
  kiểm `defer-last-discount/src/helpers/eligibility.js` trên master trước khi
  coi bên nào là kết luận cuối.

## Liên quan

[[subscriptions]] · [[subscriptions-debug-runbook]] · [[digest-subscriptions-2026-07-28]] ·
[[digest-subscriptions-2026-07-27]] · [[digest-subscriptions-2026-07-25]] ·
[[shipped-subscriptions-2026-07-29]] · [[digest-pdf-2026-07-29]] ·
[[subscription-work-style]] · [[shopify-app-dev]]
