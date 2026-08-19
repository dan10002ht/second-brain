---
type: note
title: Digest subscriptions 2026-08-19 — CLS in-app, cache key mất `?shop=`, và trần bundle tôi tự bịa ra
summary: `SET_SHOP` ghi đè nguyên object nên field chỉ có ở `/shops/integrations` bị xoá giữa boot ở MỌI lần load (kể cả cache hit), cache localStorage khoá theo `?shop=` nên rơi về `default` sau nav SPA, `drop_console: true` xoá luôn `console.warn` làm bản vá observability vô hiệu ở production, và trần bundle 30KB tôi tự áp không hề tồn tại (bundle cùng loại đang 198KB).
tags: [subscription, shopify, react, performance, billing, debug, avada, webpack]
created: 2026-08-19
updated: 2026-08-19
source: project "subscriptions" — session history 2026-08-19 (CLS in-app BFS · billing 918ud3-zi · landing joyxjoy · kookut)
---

# Digest subscriptions — 2026-08-19

CHỈ phần mới. Nhánh `fix/kookut-issues` và nội dung từng commit đã ghi ở
[[shipped-subscriptions-2026-08-19]] · [[digest-subscriptions-2026-08-15]] ·
[[digest-subscriptions-2026-08-17]] — không lặp lại. Bối cảnh: [[subscriptions]].

## Bugs

**CLS in-app: `SET_SHOP` thay nguyên object nên xoá field giữa boot.** `SET_SHOP` là
`{...state, shop: payload}` (full replace), trong khi payload của `/shops` được dựng
**không có** nhóm field chỉ đến từ `/shops/integrations` (`blockWidgetStatus`,
`appBlockStatus`, `shopInfoData`, `isPartnerDevelopment`, `themeId`, `menus`,
`shopInfo.timezone/currency`…). Hệ quả: ở **mọi** lần load, kể cả cache hit, các field đó bị
xoá tại `shops:fetch-end` rồi được `MERGE_SHOP` trả lại tại `integrations:fetch-end` — một
khung `known → unknown → known` rộng ~1s, **đã paint**, trên mọi trang đọc `state.shop`.
Khoảng cách ~900–1100ms là do Functions v1 **không có concurrency** nên hai request chạy
tuần tự.
Chọn **merge trong reducer** thay vì whitelist danh sách field: 53 call site `setShop()`
trong 37 file đều đã truyền `{...shop, ...changes}` (snapshot đầy đủ) nên merge là no-op với
tất cả, trừ đúng chỗ hỏng; còn whitelist thì phải bảo trì tay ở hai nơi và sẽ mục ruỗng.

**Đảo thứ tự card = tự nó là một shift.** `Home.js` xếp lại 4 card sau khi `metricsFirst`
resolve, và hai nhánh ternary là fragment **không có `key`** ⇒ React reconcile theo vị trí,
unmount cả subtree, rect co về `0x0`. Fix giữ tính năng nhưng quyết định **trước paint**:
`useState(() => readMetricsFirstCache(shopDomain))` — lazy initializer chạy đồng bộ trong
render phase, cùng timing với `useMemo(fn, [])`. Giá phải trả: đổi trạng thái chỉ hiện ở lần
load **sau**, và không có test nào bắt được nếu ai đó trỏ ternary về lại giá trị live.

**Cache localStorage khoá theo `?shop=` — mất khoá sau nav SPA.** `history.push` chỉ mang
pathname, không caller nào gắn lại `?shop=`, nên `getCacheKey()` đọc `window.location.search`
**tại thời điểm gọi** sẽ rơi về `default` sau lần điều hướng đầu. Hai hệ quả thật:
`clearShopCache()` xoá một bucket `default` rỗng và để khoá thật mồ côi 48h; và
`homeCardOrderCache` ghi giữa phiên dưới khoá dùng chung. Fix ở gốc: `BOOT_SHOP` bắt một lần
ở module scope (sớm hơn cả `readShopCache()` trong `initState`), và helper nhận `shopDomain`
làm tham số thay vì tự đọc URL. **Định dạng khoá không đổi** nên merchant cũ vẫn hit.

**`drop_console: true` xoá luôn `console.warn`.** Bản vá observability của một task
(cảnh báo khi không match selling plan) **vô hiệu ở production** — `grep -c` chuỗi đó trên
bundle ra 0. Cách đi vòng mà không đụng webpack config dùng chung (6 bundle, 112 call site):
tham chiếu console **gián tiếp** qua biến (`const target = window.console ?? console`) để
Terser không nhận ra mà cắt.

**Đọc tần suất selling plan bằng regex trên *tên* plan.** `"Giao mỗi 2 tuần"`,
`"Deliver every 14 days"`, `"Bi-weekly delivery"` đều ra `null`, và lưới an toàn khi đó
**âm thầm ẩn box** — hỏng im lặng. Nguồn đúng: `delivery_policy` → `billing_policy` →
regex chỉ là fallback cuối, kèm cảnh báo khi rơi tới đó.

**Free-forever bị thu tiền vì thứ tự kiểm.** `isFreeForever()` kiểm
`getForcedPricingVersion` → `shop.customPricing.enabled` → **rồi mới** so `installedAt` với
mốc go-live. Shop cài 2025-09-11 (trước mốc) vẫn bị charge chỉ vì `customPricing.enabled =
true`; nhánh dọn dẹp CASE 2 cũng không xoá được vì shop đã có `recurChargeId`. Fix đặt ở
`syncShopPlanWithIntegrationLoyalty` — shop free-forever thì không đổi plan khi gỡ Loyalty.
**Ai đã set `customPricing.enabled` thì không xác định được**: có 4 writer và **không có
audit log** — kết luận lật 3 lần trước khi tôi khuyến nghị dừng, vì cách xử lý không phụ
thuộc câu trả lời.

**`shop.shopInfo` không có `id`** → `shop?.shopInfo?.id` luôn `undefined` với **mọi**
merchant, không riêng shop đang điều tra.

**kookut — phí ship 0 chưa dứt.** `getLowestShippingRate` đọc `selectedDeliveryOption`
(option Shopify đang chọn sẵn) chứ không phải rate rẻ nhất; và delivery profile "Shipping
rates …" của merchant đang **trùng rate**. Contract tạo **19/08 vẫn `ship = 0.0`** ⇒ đây là
lỗi còn sống, không phải di sản. Ba sản phẩm sai giá chứ không phải một.

## Techniques

**Đo trước, rồi mới xếp ưu tiên — số thật bác chính báo cáo.** `queryWebVitalsCls.js` trên
prod 7 ngày (1.565 mẫu): p50 0.027 · **p75 0.129** · p90 0.236. Tách theo route: `/embed/`
chiếm **63% mẫu, p75 0.164**; mọi route khác dưới ngưỡng (`/embed/order` p75 0.099 với n=13).
⇒ Home gần như **là toàn bộ vấn đề**, còn "nguyên nhân #2" mà audit xếp cao (4 tab Orders)
bị hạ ưu tiên bằng dữ liệu. Bias phải biết trước khi tin con số: query chỉ có index **tăng
dần** trên `createdAt` + `LIMIT 5000` nên nó đi từ **đầu** cửa sổ.

**Đo lại sau deploy 45 phút thì không kết luận gì được** — 11 mẫu. Nói thẳng "chưa kết luận
được" thay vì vẽ ra con số nghe xuôi.

**Ràng buộc từ lịch sử nằm trong message của commit revert.** Bản "reserve chiều cao list
table" (CLS 0.0432 → 0.0065) đã bị revert vì shop có list rỗng/ngắn render một khối trắng cao
rồi sập — regression thật báo từ production. Mọi brief sau đó cấm reserve fixed height khi
chưa biết data. Đừng ghi "chưa rõ vì sao revert" khi lý do nằm sẵn trong commit.

**Đo trần thật trước khi áp ràng buộc lên agent.** Tôi áp trần bundle **30KB** — con số không
tồn tại trong repo này: hai bundle cùng loại đang chạy **198KB**. Cái giá là thật: agent bỏ
`preact/compat`, `.scss`, `prop-types` để ép 39KB → 29KB. Kèm một hiểu nhầm phổ biến phải nói
rõ: **tách component KHÔNG giảm bundle size** — webpack vẫn gộp; chỉ `import()` code-splitting
mới giảm.

**Chia lô agent bằng grep vùng file thật, không bằng phỏng đoán.** Mỗi vòng đều grep lại
(`LandingApp.js` có 0 dòng `console.`? hai task có import chung không?) vì cây file đổi liên
tục; và **cố ý verify tuần tự** khi mutation test của một verifier sẽ build/jest lên file mà
agent khác đang sửa dở.

**Shopify: `subscriptionBillingCycleEditsDelete` revert cả `skip`.** Docs nguyên văn:
*"Deletes the schedule and contract edits on the current and all future billing cycles, and
reverts the schedule"* — skip chính là một schedule edit. Nhưng cổng quyết định charge của
app là **Firestore** (`.where('skipped','==',false)` ở 6 chỗ), nên revert phía Shopify không
sinh charge. App chỉ đăng ký **1 trong 5** topic cycle (`subscription_billing_cycle_edits/
update`), phần còn lại đi bằng job đọc `getUpcomingBillingCycles`. Cả **24 call site** trong
repo đều xoá cycle edit **trước** khi mở draft — nên chuyển xuống sau commit là hành vi mới,
phải kiểm chứ không suy từ tên mutation.

## Context

- **Report untracked trong repo code thì biến mất.** Ba file `kookut-audit-51.md`,
  `kookut-shipping-audit.md`, `kookut-du-lieu-cho-CS.md` bốc hơi khi repo chính đổi nhánh
  lúc deploy. Deliverable sống lâu hơn một nhánh thì để trong brain, không để untracked
  trong repo code.
- **Grep literal trượt handler passthrough.** Ba vòng grep `"customPricing"` không ra
  `shopController.updateShop` — writer thật, chỉ forward body nên không chứa chuỗi đó.
- **Probe sai API rồi gửi kết luận sai cho CS.** `resourcePublicationsV2` là **kênh bán
  hàng** (Online Store, Facebook…), không phải catalog/market — dùng nó để bác giả thuyết
  "chưa publish" là bác nhầm; đảo lại lần nữa mới ra đúng. Đã phải đính chính với CS.
- **Seed store dev:** `productBundleRepository` tự tạo `new Firestore()` nên **không** dùng
  credential từ env — phải chỉ rõ project id (`ag-subscriptions-staging-3`, không phải prod).
  Tạo selling plan group bắt buộc `category: 'SUBSCRIPTION'` — lấy từ chính code app
  (`getSellingPlanVariables.js`), không đoán enum.
- `gates.sh` **không** chạy jest cho `packages/scripttag` — test ở đó chỉ chạy khi để trong
  `packages/assets/src/scripttagTests/`.
- `rtk` nuốt exit code và nén output jest thành `PASS (N)` — verifier phải dùng `rtk proxy`
  để lấy raw. Chấm gate theo dòng `Test Suites:`, vì suite chết lúc load đóng góp 0 test nên
  dòng `Tests:` vẫn trông xanh.
- Google Merchant Center `subscription_cost` → tách ra [[merchant-center-subscription-cost]].

Liên quan: [[subscriptions]] · [[shipped-subscriptions-2026-08-19]] ·
[[2026-08-19-page-custom-o-theme-khach]] · [[feedback-hoi-be-mat-truoc-khi-audit]] ·
[[do-layout-shift-bang-browser-automation]] · [[bang-chung-phan-biet-duoc]] ·
[[subscriptions-debug-runbook]]
