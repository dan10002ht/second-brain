---
type: note
title: Shipped subscriptions 2026-08-18 — master chỉ nhận tag `v2.34.76` + 1 MR PRD, cả ngày dồn vào nhánh `fix/kookut-issues`
summary: Commit landed 08-18 — master nhận `v2.34.76` `[deploy-extensions]` (volume bundle apply đúng tier khách chọn, tức nhánh của quyết định 08-18 ĐÃ merge) và 1 MR mockup/PRD; khối lượng thật là 10 commit trên `fix/kookut-issues` — 6 fix tiền thật (retry đếm theo chu kỳ Shopify, sync giá theo country, discount line thêm mới, quote ship nhóm SUBSCRIPTION, không commit draft nửa vời, không tính contract là đã xử lý khi fail), customer portal có error state thay vì spinner vĩnh viễn, mirror `deliveryPrice`, cộng 2 script chỉ-đọc/backfill; không revert, không migration.
tags: [avada, subscription, shopify, billing, firestore, debug]
created: 2026-08-19
updated: 2026-08-19
source: repo "subscriptions" — git log (commit 2026-08-18; hash + tag dưới đây đã verify từ log)
---

# Shipped — subscriptions (commit landed 2026-08-18)

> Đây là **cái gì đã landed**. Phần *học được* của chuỗi kookut nằm ở
> [[digest-subscriptions-2026-08-15]] · [[digest-subscriptions-2026-08-13]] — không lặp lại.
> Bối cảnh: [[subscriptions]].

## Shipped — vào master

| Tag | Merge | Nội dung |
|-----|-------|----------|
| `v2.34.76` | `8023d8aaa` (!2481) | `[deploy-extensions]` — volume bundle apply **đúng tier khách chọn** |
| — | `cc96165f0` (!2485) | mockup-app + PRD Volume bundle (BA), 5 file |

`v2.34.76` chính là nhánh `fix/volume-bundle-discount` của
[[2026-08-18-volume-tier-line-attribute]] — decision note đó đang ghi ⚠️ *CHƯA MERGE*,
nay **đã vào master và mang cờ `[deploy-extensions]`**. Cần cập nhật lại status của
decision (xem mục ⚠️ bên dưới).

## Shipped — trên nhánh `fix/kookut-issues` (chưa vào master)

Cả cụm là hệ quả trực tiếp của điều tra kookut đã ghi 08-13 → 08-15. Sáu commit đầu
đều **đụng tiền thật**:

**`255759a1d` — đếm retry theo chu kỳ Shopify, không theo order-doc.** `maximumRetryAttempts`
kiểm trên `orderData.retryCount` — field của riêng order-doc (theo *app* cycleIndex). Một
chu kỳ billing thật của Shopify có thể trải qua NHIỀU order-doc (app đẻ đơn theo lịch tháng
của nó; reschedule cũng chia một chu kỳ ra nhiều doc), mỗi doc bắt đầu lại từ `retryCount 0`
⇒ cap được cấp lại từ đầu. Đo trên prod: contract `123521991037` fail **13 lần** trên đúng
một `shopifyCycle=3` trong khi merchant cấu hình 3; contract `129462731133` fail liên tục
từ tháng 5, chưa thu được đồng nào. Helper `countCycleRetries` decode `idempotencyKey` để
đếm attempt thuộc đúng `shopifyCycleIndex`; điều kiện mới **OR** với điều kiện cũ (chỉ chặt
hơn, không bao giờ cho lọt thứ check cũ đã chặn). Commit ghi rõ **không** đụng tới thiết kế
2 quy ước cycleIndex ([[subscription-digest-2026-07-13]]) và không đụng guard double-charge.

**`d6aa74b81` — nguồn giá repair đổi sang `PriceList.prices(originType: FIXED)`.** Thí nghiệm
trên kookut: cùng một variant, `contextualPricing` trả 1.95 / 42.95 (FR) / 45.95 (DE) trong
khi PriceList FIXED của merchant là 1.70 / 40.00. ⇒ **bản sửa tay 12/08 đã hạ nhầm một dòng
vốn đúng** (Chicken & Duck Dry Cat 1.5kg, 23 → 1.7). Dòng không có giá FIXED thì SKIP chứ
không đoán; thêm `--catalog=<id>` bắt buộc khi `--apply` nếu shop có nhiều catalog cùng
currency (kookut có 2 catalog EUR); tách `_catalogFixedPrice.js` dùng chung với detector để
bản sửa và detector không lệch nhau. → **đóng câu hỏi treo** của
[[shipped-subscriptions-2026-08-15]] ("PriceList FIXED đã đối chiếu với dữ liệu merchant
chưa"): rồi, và nó khớp cấu hình merchant.
Cùng commit: `auditShippingRecurring` so sánh với `NaN` nên contract thiếu `deliveryPrice`
không bao giờ bị gắn cờ → 36/86 contract kookut bị dồn nhầm vào nhóm "khớp" ở audit 13/08
(đúng họ bug detector-so-NaN đã ghi ở [[digest-subscriptions-2026-08-17]]).

**`c0d112197` … `44a136349` — sync giá theo **country**, không theo currency.** Shop CHF bán
vào nhiều thị trường EUR: bản đồ giá key theo CURRENCY nên Pháp và Đức chung key, country
fetch sau đè country trước (đo prod: 42.95 FR vs 45.95 DE — contract Pháp bị ghi giá Đức).
Fallback cũ về `variant.price` (giá STORE currency) ghi số CHF lên contract EUR *im lặng*;
nay không resolve được thì SKIP + cảnh báo. Bỏ luôn bảng tĩnh `COUNTRY_TO_CURRENCY`, quyết
định fetch theo `contract.currency`.

**`82d493cf0` — line thêm mới được tính discount thay vì ghi cứng 0%.** Admin add product
gửi `percentage: 0` + `sellingPlanId: null`, backend chuyển thẳng `pricingPolicy` của caller
sang `subscriptionDraftLineAdd`; `bulkAddProducts.js` lặp y hệt ⇒ trên prod kookut line thêm
mới **mất hẳn discount 5%**. Repo đã có cách đúng ở chỗ khác (`prepareLineAddPayload` của
classic portal, `subscriptionUpdateLine`) — hai đường admin-add/bulk-add là hai chỗ duy nhất
đi vòng. Tách `buildAddedLinePricing` cho 3 call site dùng chung.
⚠️ **Chỉ chặn phát sinh mới**: 5 contract / 19 plan entry đang hỏng trên prod và **8.73 CHF
đã thu thừa** vẫn còn nguyên — cần script backfill riêng + quyết định hoàn tiền từ merchant.

**`6becadf3f` — không commit draft nửa vời khi một dòng bị Shopify từ chối.**
`subscriptionDraftLineItemUpdate` log lỗi rồi `return undefined`, không call site nào trong
7 chỗ đọc giá trị trả về ⇒ dòng bị từ chối là vô hình mà caller vẫn commit draft: contract
nằm nửa cũ nửa mới trên live Shopify, không rollback, không cảnh báo. Commit gọi đây là
"cơ chế hợp lý nhất cho chuỗi *fix rồi lại bị*" của kookut. Helper nay THROW kèm
lineId/contractId/lý do; `updateContractPriceLineBatch` bắt tại biên per-contract và trả
`{success, error}` thay vì rethrow (vì `processContractsBatch` không có try/catch riêng nên
rethrow sẽ giết cả chunk); `subscriptionBillingCycleEditsDelete` chuyển xuống **sau** commit
để abort giữa chừng không làm mất cycle edit mà chẳng được giá mới. `ensureLineOwnsPlan` cố
ý **giữ nguyên** hành vi nuốt lỗi vì nằm trên đường khách/CS — quyết định product chưa chốt.

**`7855b4c21` — không tính contract là đã xử lý khi reprice thất bại.**
`processedContracts.add()` gọi SAU try/catch, vô điều kiện ⇒ job bulk báo hoàn thành đủ
trong khi có contract chưa hề được cập nhật giá, merchant không có cách nào biết. Cùng lớp
bug với `updateSingleContractPrice` (đã sửa commit trước — hàm trả true/false nhưng caller
không đọc). Giữ nguyên việc đánh dấu processed khi contract KHÔNG có line của variant đang
reprice: đó là skip hợp lệ.

**`b2b85d11c` + `5ce1b26aa` — customer portal báo lỗi thay vì treo spinner vĩnh viễn.**
Khách của merchant báo **22 lần** không tự sửa được subscription ("page lỗi" / "không hiện
gì"), dev không repro được vì portal **không hề có error state**. `useFetchApi` (cả 2 hook)
chỉ `setFetched(true)` bên trong `if (success)`, catch chỉ `console.error` ⇒ mọi thất bại
fetch để lại skeleton chạy mãi; `fetchApi` không check `response.ok` nên non-2xx được trả về
như dữ liệu thật; controller catch trả `{status:false}` trong khi client đọc `success` và
không set `ctx.status` ⇒ HTTP 200 kèm body mà client lặng lẽ bỏ qua. Nay có error gate + nút
thử lại, và **pin API version `2025-07`** (đúng version khai trong `shopify.extension.toml`)
thay cho `'unstable'` trên production ở cả 2 chỗ hardcode.
Kèm một bug độc lập: `getCustomerPortalUrl` đọc `shop?.shopInfo?.id` mà `shopInfo` chỉ gồm
`{timezone, ianaTimezone, currency}` ⇒ `shopNumericId` **luôn undefined** với MỌI merchant
dùng `NEW_CUSTOMER_ACCOUNTS`, sinh link `https://shopify.com/undefined/account/pages`.
Commit sau (`5ce1b26aa`) siết lại: banner lỗi vừa dựng xong sẽ phơi `e.message` (tên field
GraphQL, id, text từ driver) ra trước mặt khách hàng cuối → trả message chung, lỗi thật giữ
ở `console.error`.
Commit tự ghi rõ: **không có jest harness cho `extensions/customer-account-ui`** nên phần
hook/component ở đó chưa có unit test — ghi ra chứ không giấu.

**`b70000c1b` — mirror `deliveryPrice` từ Shopify về Firestore.** Webhook
`subscription_contracts/update` mirror `{customer, customerPaymentMethod, deliveryMethod,
shopifySyncedAt}` — **thiếu `deliveryPrice`**. Tên shipping option nằm BÊN TRONG
`deliveryMethod` nên nó sync, còn giá là field top-level bên cạnh nên không bao giờ được
mang về: contract `154109116797` sửa trên Shopify 13/08 (0 → 10 CHF) mà đọc Firestore vẫn 0
sau 4 ngày, trong khi tên option thì đã đổi. Đo lại: 11/87 contract lệch thật, 9 trong đó
app hiện THẤP hơn số Shopify thực thu. Tách `buildShopifyContractSnapshot` — một chỗ định
nghĩa duy nhất danh sách field được mirror + test khoá danh sách đó (bug này đúng nghĩa là
thiếu một field trong object literal, nên test chốt danh sách mới là thứ chặn tái diễn).
Đây là lần thứ ba trong tháng gặp họ "mirror lệch nguồn" — xem
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]].

**`9bb92e2ef` — quote phí ship theo nhóm SUBSCRIPTION thay vì `edges[0]`.**
`getLowestShippingRate` đọc thẳng `cart.deliveryGroups.edges[0]`; cart tách delivery group
theo loại hàng và nhóm đầu là `ONE_TIME_PURCHASE` (probe 4 contract kookut: `edges[0]` =
ONE_TIME, `edges[1]` = SUBSCRIPTION). Commit ghi rõ **lỗi chưa phát tác** vì chưa có đường
nào gọi `autoUpdateShippingRate` theo chu kỳ (`services`/`cron` grep = 0 match) — nhưng
`recurringOption: 'lowest'` là mặc định toàn hệ thống nên ngày ai bật "tính lại phí ship mỗi
kỳ" thì mọi shop dùng mặc định sẽ báo giá sai hàng loạt. Nhiều group mà không có SUBSCRIPTION
thì coi như không có rate đáng tin và skip.

**`0c35105e2` — contract imported không crash khi nhiều line hơn plan entry.**
`getSubscriptionContractById` ghép `linesData` với `importedPlans` **theo index**, không
kiểm độ dài; contract imported thường chỉ mang MỘT plan entry cho cả contract nên từ line
thứ hai trở đi ném `Cannot read properties of undefined (reading 'sellingPlanId')`, hỏng cả
lần fetch. Ghép theo vị trí cũng chính là lớp bug đã gán giá variant này sang line kia ở
contract kookut `#151147970941`.

**`e267d8141` — 2 script chỉ-đọc/backfill.** `classifyContractPriceDrift` (CHỈ ĐỌC) phân
loại lệch giá làm 4 nhóm vì mỗi nhóm cần một cách xử lý khác — gộp chung là huỷ doanh thu:
`SWAP` (bug index, sửa được bằng `repairContractLinePrices`) · `OVERCHARGE` (cần merchant xác
nhận rồi hạ) · `UNDERCHARGE` (thường là price-lock hợp lệ, **ĐỪNG SỬA**) · `NO-FIXED` (sản
phẩm chưa publish vào market). Chạy kookut: **0 SWAP · 25 dòng/22 contract OVERCHARGE ·
11 UNDERCHARGE · 243 dòng/83 contract NO-FIXED**. `backfillContractDeliveryPrice` chỉ ghi
Firestore (không đụng Shopify, không đổi số tiền khách bị charge) — đã chạy 27 contract,
verify bằng 2 công cụ độc lập ra 0 lệch.

**`7563716bd` (nhánh `fix/integrate-no-store`) — docs guide Chatty.** Ghi lại rằng
`nextBillingDate` **không phải cột lưu sẵn**: `prepareData` ghi đè mỗi request bằng
`getNextOrder(...)?.billingAttemptExpectedDate || '--'` ⇒ giá trị có thể là **chuỗi `'--'`**
chứ không phải null/date, và nó được điền bất kể status nên contract PAUSED/CANCELLED vẫn
giữ ngày cũ (agent API của Joy đã guard bằng `activeNextBillingDate`; Chatty cần luật y hệt).
`currentBillingCycle` là bộ đếm của riêng Joy, **không** đảm bảo bằng `currentCycleIndex` của
Shopify → chỉ để hiển thị. Và `prepareData` nuốt lỗi trả `[]` ⇒ **200 kèm list rỗng có thể
là thất bại**, không phải "không có subscription" — đúng họ [[bang-chung-phan-biet-duoc]].

## Reverted

Không có revert nào trong log ngày này (master lẫn nhánh).

## Deploy notes

- **Cờ deploy**: `v2.34.76` mang `[deploy-extensions]` — chỉ deploy extensions, không phải
  full CI. Không có `[deploy-functions]` / `[deploy-all]` nào trong log ngày này.
- **Tag**: chỉ `v2.34.76`. Toàn bộ cụm `fix/kookut-issues` **chưa có tag** → theo cơ chế
  deploy-theo-tag đã ghi ở [[digest-subscriptions-2026-08-10]], **chưa ra prod** tại thời
  điểm cắt log. Nghĩa là 6 lỗi tiền thật ở trên vẫn đang chạy trên prod.
- **Migration**: không có (không đụng `firestore.indexes.json`, không SQL).
- **Data ops chạy tay**: `backfillContractDeliveryPrice` (dry-run mặc định) và
  `classifyContractPriceDrift` là command, không tự chạy theo deploy.
- `c0d112197` là merge master vào `feat/sb-15077-mcp-server` — không có nội dung riêng.

## ⚠️ Cần xác nhận

**1. Status của [[2026-08-18-volume-tier-line-attribute]] đã lạc hậu.** Decision note ghi
"⚠️ CHƯA MERGE — mới ở nhánh `fix/volume-bundle-discount`"; log 08-18 cho thấy `8023d8aaa`
tag `v2.34.76` đã merge !2481 vào master kèm `[deploy-extensions]`. Đây là ghi nhận sự
kiện, không phải mâu thuẫn nội dung — nhưng câu hỏi treo ở
[[shipped-subscriptions-2026-08-18]] ("rào chắn quantity đủ hay không") nay đã **ra prod
trước khi được trả lời**. Người xác nhận nên chốt.

**2. Nợ tiền thật chưa có chủ.** `82d493cf0` tự ghi: 5 contract / 19 plan entry hỏng trên
prod + **8.73 CHF đã thu thừa**, cần script backfill riêng và quyết định hoàn tiền từ
merchant. Trong log không có commit nào làm việc đó. Cùng dạng với món nợ "bulk delete vẫn
hard-delete" treo từ [[shipped-subscriptions-2026-08-18]] — cần xác nhận đây là *chấp nhận
tạm* hay *việc còn nợ*.

**3. `OVERCHARGE` 25 dòng / 22 contract trên kookut chưa được xử lý.** Script phân loại nói
rõ nhóm này "cần merchant xác nhận rồi hạ về", nhưng chưa thấy hành động. Xác nhận ai đang
giữ việc này.

Liên quan: [[subscriptions]] · [[shipped-subscriptions-2026-08-18]] ·
[[digest-subscriptions-2026-08-15]] · [[digest-subscriptions-2026-08-13]] ·
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] · [[bang-chung-phan-biet-duoc]] ·
[[subscriptions-debug-runbook]]
