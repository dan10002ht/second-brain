---
type: note
title: Shipped Joy Subscription — commit landed 2026-09-15 (v2.35.30 + 2 lượt deploy extensions)
summary: Master nhận 3 merge — command migrate Simple Bundles → Fixed Bundle (`v2.35.30`) và hai lượt `[deploy-extensions]`, trong đó !2589 chữa modal Change frequency của contract import; khối lượng còn lại trên nhánh portal Wholefoods và joyxjoy (bundle giảm ~24KB, PropTypes strip ở production).
tags: [avada, subscription, shopify, backend, react, preact, webpack, performance]
created: 2026-09-16
updated: 2026-09-16
source: repo `subscriptions` — git log 2026-09-15 (hash đã verify)
---

# Shipped — `subscriptions`, commit landed 2026-09-15

Root cause đã nằm ở [[digest-subscriptions-2026-09-15]] — note này chỉ ghi **cái gì đáp xuống
đâu**. Đợt trước: [[shipped-subscriptions-2026-09-15]].

## Shipped

### Vào `master`

| Merge | Tag | Việc |
|---|---|---|
| `baeb4cd53` | `v2.35.30` | !2557 — command migrate bundle từ Simple Bundles sang Product Fixed Bundle. Khối lượng này hôm qua còn ghi là "trên nhánh" ở [[shipped-subscriptions-2026-09-15]], nay đã landed. |
| `57788b634` | — | !2589 `[deploy-extensions]` — Change frequency đọc **cả hai nguồn plan** (SB-16815), branch commit `ec4c52c79` |
| `e0c0ef086` | — | !2588 `[deploy-extensions]` — "Deploy ext" (`cb5fe44ad`, chỉ đổi doc `plan-v3-lazy.md`) |

Chi tiết !2589 (`ec4c52c79`): `importService` bịa plan với `subscriptionProductId`/`sellingPlanId`
kiểu uuid và **không có `subscriptionPlanId`**; cả hai customer portal lại chọn nguồn dữ liệu chỉ
dựa vào field đó ⇒ rơi về nguồn legacy `/subscription-product/multiple` vốn rỗng trên shop chỉ
từng có subscription plan ⇒ option rỗng, `currentPlan` undefined, Apply ném lỗi ở
`selectedPlan.frequency` mà **không bao giờ tắt loading** (đúng cái spinner merchant báo). Shop
`87d00b-42` có **42/43 contract là import**, tức gần như không khách nào ở đó đổi được tần suất.
Fix: helper `frequencyPlanSource` (thử nguồn khả dĩ trước, fallback khi rỗng) dùng chung classic
CP + customer account UI, Apply disable khi chưa resolve được plan, handler bọc `try/finally`,
empty state có message + log contract identifier.

### Còn trên nhánh

**`feat/wholefoods-portal`** — vòng polish tiếp theo:

- `0fa1ebbef` ba lỗi SB-16861/66/67. SB-16861: trang chi tiết đọc nhịp giao **chỉ** từ
  delivery/billing policy của contract; contract `164692066358` renew 2 tuần/lần và không lưu cái
  nào, nên default `|| 1` / `|| 'week'` in đè thành "Every 1 week" — trong khi card danh sách đã
  đúng, đó là lý do hai màn hình nói khác nhau về cùng một sub. SB-16867: nhánh fallback xếp mọi
  dòng không marker vào "Seasonal boxes" chỉ vì nó nằm trên contract; nay một dòng là box **chỉ
  khi** product của nó là fixed bundle. SB-16866: picker staples còn lọc bỏ product có plan
  không khớp contract ⇒ picker rỗng trên shop có plan-data mỏng; bỏ lọc ở danh sách, giữ chốt
  chặn lúc bấm.
- `ef706fbeb` SB-16809: card chỉ vẽ ảnh dòng đầu nên contract 1 box + 3 staples trông y hệt sub
  một sản phẩm. Dùng `ImageGroup` + tile "+N", áp cho cả ba card cùng shape (My subscriptions,
  Upcoming orders, History); một ảnh vẫn đi qua `ProductImage` để giữ placeholder.
- `7bfff95a8` SB-16808: `getSubscriptionContractsByCustomerId` cap cứng 10 dòng, không có đường
  vượt, mà portal thì không có phân trang. Cap thành tham số, **mặc định vẫn 10** nên 5 caller
  khác (customer tagging, subscriber type, AI tool, public API hook, recommended products) giữ
  nguyên; chỉ 2 endpoint list của portal xin nhiều hơn. Storefront API còn lỗi thứ hai: truyền
  `direction` undefined đè lên default `'desc'` ⇒ trả về **10 cái CŨ NHẤT**, đúng triệu chứng
  "sub mới không hiện".
- `e1ef2af33` merge `feat/joyxjoy-landing` vào nhánh này.

**`feat/joyxjoy-landing`** — vòng theo convention + giảm bundle:

- `628707fff` (60 file) theo convention `scripttag`: `import React` thay vì `preact`/pragma
  `@jsx h`, khôi phục PropTypes cho 15 component (bỏ 17 header `eslint-disable`), chuyển
  `pickerLogic`/`getBoxFrequencyPlan`/`summaryLogic`/`formatMoney` sang `helpers/` (hết cảnh
  `helpers/` import ngược lên `components/`), tách hằng số ra `const/`. Quan trọng:
  `packages/assets/jest.config.js` **thêm project scripttag có alias `react → preact/compat`
  như webpack** — và ngay lập tức phơi ra 2 assertion blur chưa từng chạy (compat map `onBlur`
  → `focusout`).
- `683099342` gỡ config backend khỏi bundle storefront: `summaryLogic` chỉ cần 3 giá trị nhưng
  đi qua `checkDiscountPlan` → `const/default.js` kéo theo ~76KB config backend. Tách
  `const/subscription/discountDefaults.js` + `trialActions.js`, module cũ re-export nên importer
  không đổi. **Không gộp hai module discount-type** dù trùng tên: `discountType.js` có
  `'fixed_amount'`/`'freeShipping'` còn `subscriptionPlan.js` có `'fixed'`/`'free_shipping'` —
  chỉ PERCENTAGE khớp.
- `e2db1f589` gỡ PropTypes khỏi bundle production bằng
  `babel-plugin-transform-react-remove-prop-types` (chỉ chạy khi `NODE_ENV=production`, dev giữ
  warning). Verify: bundle production 0 lần xuất hiện `propTypes`, bundle dev còn 16.

**`feat-custom-sender-ses`** — `6e3260a33` gate custom sender SES **theo ngày install**: shop cũ
giữ nguyên Mailgun. `c51929131` ghim nhánh này lên staging4 `[deploy-all]`.

## Reverted / đảo hướng

Không có `git revert` nào. Một lần đảo hướng trong cùng nhánh, quy mô nhỏ:

- `ef706fbeb` nói thẳng nó **lật lại lựa chọn trước đó của chính tác giả**: `ImageGroup` từng bị
  bỏ vì làm card lệch chiều cao, nhưng `rows="auto"` + `ResourceItem` đã xử lý ở tầng grid nên
  lý do cũ không còn. Đây là sửa UI trong vòng dựng, không phải đổi hướng kiến trúc — không tách
  decision.

## Deploy notes

- **2 commit mang `[deploy-extensions]`** (`57788b634`, `e0c0ef086`) và **1 mang `[deploy-all]`**
  (`c51929131`, chỉ ghim nhánh staging4). Không có `[deploy-functions]`.
- 1 version bump: `v2.35.30` (`baeb4cd53`).
- Không có file migration mới trong đợt này; command migrate bundle (`v2.35.30`) **không tự
  chạy**, phải gọi tay theo runbook — xem [[shipped-subscriptions-2026-09-15]].
- `e1ef2af33` (merge joyxjoy vào wholefoods) có **đúng một conflict**: cả hai phía đặt
  `STAGING_BRANCH` trong `.gitlab/ci/staging.yml`. Giữ giá trị của master (`fix/cls-admin-bfs`)
  để không âm thầm đổi hướng staging-1; việc của nhánh này đẩy staging-3. Đây là lần thứ hai
  trong hai ngày biến con trỏ staging suýt bị merge ghi đè — lần trước là `STAGING4_BRANCH`
  ở [[shipped-subscriptions-2026-09-15]].
- `30310d3dd` merge master vào `feat/joyxjoy-landing`, giữ nguyên con trỏ staging branch.

## ⚠️ Cần xác nhận

**Con số bundle joyxjoy: brain ghi 128.535, commit ghi 125.440.**

- [[digest-subscriptions-2026-09-15]] ghi: *"Gỡ → `149.865 → 128.535` byte (−14,2%)"*.
- Commit `683099342` (đã commit, cùng thay đổi đó) ghi: *"Bundle: 149,865 → 125,440 bytes
  (−24,425)"*, và `e2db1f589` tiếp tục `125,438 → 121,571` raw / `30,337 → 29,302` brotli.
- Mốc đầu (149.865) khớp, mốc cuối lệch ~3KB và số 128.535 không khớp mốc nào trong log.
  Nhiều khả năng digest ghi một phép đo trung gian rồi commit đo lại sau khi làm thêm, nhưng
  đây là con số sẽ bị trích lại — cần chốt lấy số nào làm chuẩn. Đúng loại lỗi mà
  [[do-kich-thuoc-bundle]] đã cảnh báo: mọi con số bundle phải nói rõ đo ở mốc nào, raw hay nén.

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-09-16]] ·
[[digest-subscriptions-2026-09-15]] ·
[[shipped-subscriptions-2026-09-15]] · [[do-kich-thuoc-bundle]] ·
[[2026-09-15-bundle-sync-resolve-muon]] · [[2026-09-09-portal-wholefoods-extension-rieng]] ·
[[khong-error-boundary-hong-ca-man-hinh]]
