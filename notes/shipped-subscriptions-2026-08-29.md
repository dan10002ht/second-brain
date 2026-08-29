---
type: note
title: Joy Subscription — commit landed 2026-08-28
summary: Master nhận 4 MR (`v2.34.95` !2513 phí ship định kỳ đọc từ rate table merchant — nhánh của quyết định 08-28 ĐÃ merge, `v2.34.96` !2511 chặn code discount đã hết lượt định giá mọi upcoming order bằng `billableRank` suy live, !2514 gate đọc cả liquid theme-custom + thiếu package không còn đọc thành pass, !2509 kookut) cộng 1 MR mockup/PRD; trên nhánh: Parcely thành provider thứ ba, widget yearly-price cho theme custom, chặn ATC ở window capture, MCP key UI. Không revert, không cờ deploy, không migration.
tags: [avada, subscription, shopify, billing, shipping, debug]
created: 2026-08-29
updated: 2026-08-29
source: repo `subscriptions` (avada/subscriptions) — git log 2026-08-28, hash lấy nguyên từ log
---

# Joy Subscription — commit landed 2026-08-28

Tiếp nối [[shipped-subscriptions-2026-08-28]] (log 08-27). Phân tích root cause của ngày này đã
nằm ở [[digest-subscriptions-2026-08-28]] và hai decision tách riêng — ở đây chỉ ghi **cái gì
landed ở đâu**.

## Shipped

### Master — 4 MR có code + 1 MR tài liệu, 2 tag

| Hash | Tag / MR | Nội dung |
|------|----------|----------|
| `18aadcc78` | `v2.34.95` · !2513 | merge **fix - be - tính phí ship định kỳ từ rate table của merchant thay vì cart quote**. Đây chính là nhánh của [[2026-08-28-shipping-lay-gia-tu-rate-table]] — decision đó ghi *"CHƯA MERGE"*, nay **đã merge**. |
| `bdfad57d4` | `v2.34.96` · !2511 | merge **fix - be - stop a spent code discount from pricing every upcoming order** (JSUB-260827-UjQwHh). |
| `94447e144` | !2514 (master HEAD, chưa tag) | merge **fix - repo - gate reads theme-custom liquid widgets, and a missing package stops reading as a pass**. |
| `f814095f4` | !2509 | merge `fix/kookut-issues` — *"quote đúng phương thức giao hàng khách chọn + probe scripts"*. Đóng ⚠️ mục 2 của [[shipped-subscriptions-2026-08-28]] (*"`d36eae64e` đã lên prod chưa"*): nhánh đã vào master. |
| `3a095a134` ← `c706169cd` | !2510 | update mockup-app + PRD (customer-portal settings, DESIGN-SYSTEM, ShopifyFrame). Không code app. |

**Nội dung !2511 (`4574b4040`, 21 file, +714/−58)** — Shopify net `lineDiscountedPrice` với
**mọi** contract discount ở **mọi** kỳ, bỏ qua `recurringCycleLimit`, nên một code 100% dùng
được 1 lần làm cả lịch upcoming về 0 trên admin. Cách sửa:

- `billableRank` **suy live từ lịch ở mỗi lần đọc** (`billableRankService.js` +65), **không
  persist** — rank lưu sẵn sẽ stale ngay khi một kỳ bill xong và `usageCount + (rank − 1)` đếm
  kỳ đó hai lần. Kỳ bị skip không tiêu lượt.
- `getValidDiscounts(discounts, rank)` bỏ code đã hết lượt tính tới lượt của đơn đó; `rank` mặc
  định 1 nên caller cũ không đổi hành vi.
- `resolveUpcomingSubtotal` **chỉ** re-price line lấy từ số đã net của Shopify; line giá theo plan
  tính lại từ contract và không mang code discount → đơn trộn hai loại không còn over-apply.
- `stripSpentLineDiscounts` gỡ allocation của code đã hết lượt để badge thôi quảng cáo mức giảm
  đơn đó không được hưởng. Đơn đã bill (không có rank) để yên.
- Ba lỗi cùng vùng vá kèm: `billingCycleService` truyền **mọi** discount vào giá delivery (code
  100% off line-item zero luôn dòng ship → nay chỉ `SHIPPING_LINE` mới trừ được);
  `prepareReductionText` đọc mọi discount 100% thành *"Free shipping"*; `entitledLines.lines`
  10 → 50.
- Verify trên staging-3 contract `60892938477` (100% limit 1 + $10 limit 3): đơn 1 free, đơn 2–3
  −$10, đơn 4 trở đi giá đầy — khớp cái Shopify thật sự charge.

### Nhánh `fix/kookut-issues` — phần chưa merge sau !2509

| Hash | Nội dung |
|------|----------|
| `8d7efa0b5` | **fix - be - price recurring shipping from the merchant's rate table, not a cart quote** (8 file, +911/−25): helper mới `resolveRateFromProfile.js` (+125) kèm test (+223), query `shippingProfile.js` (+66), 2 `shippingProfileService`, `subscriptionContractCreateService`, script `auditRateTablePricing.js` (+244). Đối chiếu: định giá 50 contract live từ rate table khớp quote nhóm `ONE_TIME` của Shopify **trên cả 50**; ca lệch duy nhất là contract có line price khoá ở nửa giá catalog hiện tại. Đường tạo contract gate theo toggle `updateOnItemsChange` sẵn có — **38 shop** đã opt-in, **5.306** ở mặc định không được đụng. Đường này **từ chối chứ không đoán** ở 4 ca: option merchant đã gỡ, rate carrier-calculated, địa chỉ không zone nào phủ, giỏ không dải nào chứa. |
| `ba8ad3a71` | **chore - be - add `applyContractDeliveryPrice`** (+227) — anh em của `applyContractLinePrices`, operator **tự nhập giá** đọc từ rate table cho phương thức khách chọn. Dry-run mặc định; từ chối tăng giá nếu không `--allow-increase`; **từ chối contract có cycle bị skip hoặc đã edit**, vì commit draft xoá cycle edit và sẽ âm thầm dựng lại kỳ giao khách đã skip (đúng cơ chế đã ghi ở [[digest-subscriptions-2026-08-28]]). |
| `f2798a357` | **fix - be - anchor the billing-cycle guard window on today** — guard query dải ngày cố định 2 năm bị Shopify từ chối ở **11/25** contract (`Billing cycle start date out of range`), nới index thì chết đầu kia (`Upcoming billing cycle selected past limit`). Cửa sổ hợp lệ khác nhau theo contract ⇒ **không hằng số nào đúng**; neo vào `now` + nhìn 180 ngày tới. |
| `257bb1d25` | chore — `classifyContractPriceDrift` in currency ở bucket NO-FIXED (249 dòng CHF vô hại từng đọc y hệt 2 dòng EUR thật sự lỗi) + `--rows` thay cap 40 dòng cắt câm. |

### Nhánh `feat/parcely-integration` — provider giao hàng thứ ba (JSUB-260816-nXmTaV)

| Hash | Nội dung |
|------|----------|
| `dc63835a5` | **feat - be - carry the Parcely pickup point onto every recurring order** (13 file, +955): `ParcelyProvider.js` (+89), `parcelyService.js` (+130), helper `parcelyAttributes.js` (+100) kèm test (+174), `DESIGN.md` (+252). Parcely ghi điểm nhận (FoxPost, Packeta, GLS, MPL) vào note attributes lúc checkout; đơn recurring **không đi qua cart** nên từ đơn thứ hai merchant không export/in nhãn được. Khác Bird/Zapiet: điểm nhận là **dữ liệu tĩnh** ⇒ "calculate next" là copy nguyên văn, không lịch, không validate zip (Parcely không có public API). Nhận diện bằng 2 key chữ ký *"Parcely Shipping Method"* / *"Parcely Provider ID"* — 5 key còn lại tên quá chung nên chỉ gom khi đã thấy key chữ ký. Bỏ luôn 2 allowlist hardcode `bird|zapiet` ở đường manual-create (nếu không thì provider thứ ba bị bỏ qua **im lặng**). `manualSubscriptionService` cố ý key theo const attribute-keys chứ không import factory: import factory kéo `firebase-functions` vào graph và làm chết test suite của nó. |
| `11f9c43ba` | **feat - fe - Parcely integration page + manual-create provider option** (17 file, +626/−11). `yarn trans` được kiểm là **thuần chèn**: 21 key thêm, 0 key mất trên cả 7 locale; chuỗi duy nhất đổi là `deliveryProvider.empty`. |
| `1bae74b0b` | **fix - be - reject `Object.prototype` keys as delivery provider ids** — thay allowlist bằng object lookup làm `PROVIDERS['constructor']` (và `toString`, `__proto__`, …) pass được vì lookup trần đi lên prototype chain. Không leo thang được (query Firestore với `appId` undefined → không thấy gì, không set cờ) **nhưng id vẫn tới thuộc tính `_joy_delivery_provider` của contract**, và `getProviderById` giờ là chỗ validate duy nhất. Guard bằng `hasOwnProperty` + kiểm kiểu string. |

### Nhánh `feat/widget-yearly-price` — widget theme custom cho shop `1j1nt6-1u`

6 commit, **chỉ đụng đúng 1 file** `theme-custom/1j1nt6-1u/blocks/joy-yearly-price-widget.liquid`:
`2ceeff140` (bind plan trên cả hai card, theo color scheme của theme, **không bao giờ ghi giá
theme khi chưa có plan** — +135/−79, commit lớn nhất) → `984d04166` (bind **plan prepaid theo năm**,
không phải plan trả theo tháng) → `b13b0f4a9` (card cân đối, badge canh giữa, bỏ tiền tố *average*)
→ `0474430f0` (badge nằm dưới card, chừa chỗ theo **chiều cao đo được**) → `38053e7d4` (badge liền
mạch, giữ giá theme đồng bộ, scope CSS trong block) → `a6a6035e4` (không ẩn wrapper đang chứa nút
mua, để event variant thắng). Cụm "chừa chỗ theo chiều cao đo được" cùng họ với các lát CLS đã ghi
ở [[shipped-subscriptions-2026-08-06]].

### Nhánh `fix/volume-atc-capture` — `c784118c3` (JSUB-260828)

Theme họ Horizon delegate **mọi** `on:click` từ **một** capture listener ở `document`; handler của
nó gọi `stopPropagation()` rồi tự submit product form. Listener của widget gắn trên chính nút ATC
nên **không bao giờ nhận được click** → theme submit với `quantity=1`, khách chọn pack 2/3 vẫn chỉ
vào giỏ 1 chai. Tách sang helper `interceptThemeAddToCart.js` (+81, test +111) **bind ở `window`
capture — node đầu tiên trên đường capture** nên thắng bất kể ai đăng ký trước; bỏ qua nút ATC nằm
trong product card / quick-add / cart drawer vì selector mặc định rất rộng.
[[digest-subscriptions-2026-08-28]] ghi việc này là **MR !2518**; log hôm nay cho thấy nó vẫn ở
nhánh, chưa có commit merge.

### Nhánh `feat/sb-15077-mcp-server` — 3 commit lặt vặt

`8ab4fa164` *"fix ui"* (18 file, +140/−279 — **xoá nhiều hơn thêm**: bỏ hẳn
`mcpKeyDisplay.js`/test và 22 dòng locale × 7 file, gọn lại `McpAccessCard`), `a96d0490c` cập nhật
link user guide, `7b44a0915` `[skip-ci] add todo`, cộng `3604af2c1` merge master vào nhánh.
Nhánh này vẫn chưa merge — đúng điều [[2026-08-12-mcp-settings-allowlist]] đặt làm câu hỏi review.

## Reverted

**Không có revert nào trong log 08-28.**

## Deploy notes

- **Không cờ deploy nào**: không `[deploy-functions]`, không `[deploy-all]`, không
  `[deploy-extensions]`. Cả 4 MR đi đường deploy thường.
- **Version bump: `v2.34.95` → `v2.34.96`** (2 tag). MR !2514 (gate) merge **sau** `v2.34.96` và
  chưa được tag.
- **`886e51dba` "deploy FE"** — 1 dòng trong `packages/assets/src/embed.js`. Đây là cú bump bản
  widget đẩy bundle FE, không phải code logic; đáng để ý vì nó là đường phát hành **khác** với tag
  version (cùng chuyện hai kênh deploy đã ghi ở [[digest-subscriptions-2026-07-29]]).
- **Không migration, không đụng `firestore.indexes.json`.** Chữa dữ liệu vẫn đi bằng **script chạy
  tay** (`applyContractDeliveryPrice`, `auditRateTablePricing`, `classifyContractPriceDrift`), nên
  không để lại vết trong log.
- **Khoảng trống tag `v2.34.91`–`v2.34.94`**: note trước chốt ở `v2.34.90`, log này mở màn ở
  `v2.34.95`. Bốn tag ở giữa không xuất hiện trong cửa sổ log — cộng dồn với khoảng trống
  `v2.34.80`→`v2.34.83` và `v2.34.85`/`v2.34.86` vẫn treo từ [[shipped-subscriptions-2026-08-27]].
- **!2514 là thay đổi hạ tầng gate, không phải app**: `.claude/scripts/check.mjs` (+67/−4) +
  `gates.sh`. Hai lỗ được bịt: gate không đọc widget liquid trong `theme-custom/`, và **thiếu
  package thì gate đọc thành pass** — đúng họ lỗi ở [[gate-tu-viet-la-nguon-xanh-gia]].

## ⚠️ Cần xác nhận

**Phí ship 0 của kookut: lỗi cấu hình của merchant hay lỗi phía Shopify? Hai nguồn nói khác nhau.**

- [[digest-subscriptions-2026-08-27]] kết luận: *"không phải lỗi code mà là **cấu hình delivery
  profile của merchant** — nhóm SUBSCRIPTION chỉ có MỘT rate, profile app trỏ vào lại 0 sản phẩm"*.
  [[shipped-subscriptions-2026-08-28]] ghi lại chính bằng chứng đó từ `probeCartGroups`, và
  [[kookut-yeu-cau-cau-hinh-shipping]] đã **gửi CS yêu cầu merchant gán sản phẩm vào profile**.
- Commit body `8d7efa0b5` và `ba8ad3a71` (08-28) nói khác: *"for a cart's SUBSCRIPTION delivery
  group Shopify returns the **free tier of a TOTAL_PRICE-banded rate even when the basket is below
  the threshold** — measured on two zones of kookut (FR basket 38.00 quoted 0.00 against a 5.90
  band; CH basket 22.61 quoted 0.00 against a 10.00 band) and **reproduced on a second, unrelated
  shop**. **Every recurring order on a tiered shop therefore shipped free.**"*

Hai câu dẫn tới hai phạm vi khác hẳn nhau: một bên là **một shop cấu hình sai** (sửa bằng cách bảo
merchant gán profile), một bên là **mọi shop dùng rate theo dải giá đều đang ship free** (sửa bằng
code, và có nghĩa còn merchant khác đang mất tiền mà chưa ai biết). Bằng chứng "tái hiện trên một
shop thứ hai không liên quan" nghiêng về vế thứ hai, nhưng nó **chưa được đưa vào** note kookut hay
digest 08-27, và thư đã gửi CS vẫn đang mô tả theo vế thứ nhất.

Cần chốt: (a) shop thứ hai đó là shop nào, profile của nó có gắn sản phẩm không — nếu **có** thì
giả thuyết "merchant cấu hình sai" bị bác; (b) nếu là hành vi phía Shopify thì phải quét xem còn
bao nhiêu shop dùng dải `TOTAL_PRICE` đang bị quote 0, chứ không dừng ở kookut; (c) sửa lại câu chữ
trong [[kookut-yeu-cau-cau-hinh-shipping]] cho khớp kết luận cuối, vì đó là thứ đã gửi ra ngoài.

Liên đới: ⚠️ mục 1 của [[shipped-subscriptions-2026-08-28]] (*`selectedDeliveryOption` có thật sự
là option rẻ nhất không*) nay **hết quan trọng** với đường chính — !2513 đã bỏ hẳn cart quote làm
nguồn giá — nhưng câu chữ sai vẫn còn trong commit body và sẽ được đọc như luật.

## Đã xử lý khi mature (2026-08-29)

- [[2026-08-28-shipping-lay-gia-tu-rate-table]] trước ghi *"⚠️ CHƯA MERGE — MR !2513"*; `18aadcc78`
  chứng minh nó đã merge và tag `v2.34.95` → đã sửa dòng trạng thái ở cả decision lẫn `index.md`.

## Liên quan

[[subscriptions]] · [[shipped-subscriptions-2026-08-28]] · [[digest-subscriptions-2026-08-28]] ·
[[digest-subscriptions-2026-08-27]] · [[2026-08-28-shipping-lay-gia-tu-rate-table]] ·
[[2026-08-28-import-loop-chi-contract-song-paused]] · [[kookut-yeu-cau-cau-hinh-shipping]] ·
[[discount-per-cycle-audit-2026-08-27]] · [[subscriptions-debug-runbook]] ·
[[gate-tu-viet-la-nguon-xanh-gia]] · [[tien-khong-duoc-lay-float-lam-chuan]] ·
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] · [[subscription-installment-horizon-digest]]
