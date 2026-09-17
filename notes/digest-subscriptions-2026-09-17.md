---
type: note
title: Digest subscriptions — 2026-09-17 (đóng vụ sync giá, migrate 63/63, và vòng bug cuối của portal Wholefoods)
summary: Backfill ghi vào Firestore hoàn toàn vô tác dụng vì endpoint đọc contract bằng `fullResp: true` fetch từ Shopify rồi đè lên doc; tên plan hiện sai vì dòng con bundle được tạo thiếu `sellingPlanName` nên UI rơi về `deliveryPolicy` vốn là số app cố ý thổi phồng; và `shopify app deploy` đẩy cả app config trong toml nên một lần deploy từ máy đã làm mất scope của app.
tags: [subscription, shopify, avada, backend, firestore, extensions, debug, method, cdn]
created: 2026-09-17
updated: 2026-09-17
source: project `subscriptions` — session history 2026-09-16/17 (session 1facd563 SB-16815, session 65eb4665 migrate + landing joyxjoy, session 0fb64e0c portal Wholefoods)
---

# Digest — `subscriptions`, 2026-09-17

Nối tiếp [[digest-subscriptions-2026-09-16]]. Ba chủ đề của hôm qua đều **đóng lại** trong lượt này
(sync giá, migrate, landing), và portal Wholefoods chạy hết vòng bug JIRA thứ hai. Note này **CHỈ
phần mới**. Cái gì đáp xuống master: [[shipped-subscriptions-2026-09-17]].

## Bugs

### Backfill vào Firestore vô tác dụng vì đường đọc fetch từ Shopify rồi đè lên

Đắt nhất của lượt. Tester báo `Customer TimeZone` vẫn trống **sau khi** backfill 5 contract vào
Firestore và đọc lại Firestore xác nhận đã ghi. Nguyên nhân: endpoint chi tiết contract gọi với
`fullResp: true`, và hàm đó **fetch contract từ Shopify rồi spread lên trên** doc Firestore:

```js
const data = {id: doc.id, ...formatDateFields(doc.data()), ...subscriptionFromShopify};
```

Nên mọi field mà Shopify cũng có sẽ bị bản Shopify thắng. Ghi vào Firestore là ghi đúng chỗ dữ liệu
"sống", nhưng **sai tầng so với đường đọc**. Backfill phải vào `customAttributes` trên Shopify.

Kèm một cái bẫy thứ hai ở đó: `SubscriptionDraftInput.customAttributes` **thay cả danh sách**, nên
phải đọc attribute hiện có rồi nối thêm — cùng họ với
[[mutation-ghi-nguyen-khoi-xoa-field-khong-gui]]. 5/6 contract ghi được; 1 bị Shopify từ chối vì
đang có billing cycle edit.

Bài học chung: "đọc lại để xác nhận" chỉ có giá trị khi đọc bằng **đúng đường mà tính năng dùng**,
không phải đường mình vừa ghi — [[ack-khong-phai-hieu-ung]].

### Tên plan hiện `Delivery every 10 weeks` vì dòng con bundle thiếu `sellingPlanName`

`MOCK_INTERVAL_DATA = {day: 60, week: 8, month: 2}` — app **cố ý cộng offset** vào interval gửi lên
Shopify để Shopify không tự bill theo lịch của nó, rồi trừ lại khi đọc. Nên `WEEK × 10` trên Shopify
là **đúng thiết kế** cho một plan "Every 2 weeks" (8 + 2), không phải bug dữ liệu.

Bug thật nằm chỗ khác: dòng con của bundle được tạo bằng `subscriptionDraftLineAdd` với input
**không có** `sellingPlanId` lẫn `sellingPlanName`, rồi dòng cha (vốn có đủ) bị xoá. UI hết chỗ lấy
tên nên rơi về `deliveryPolicy` của Shopify — tức về đúng con số đã thổi phồng. Luật rút ra: **tên
plan là thứ app tự đặt, `deliveryPolicy`/`billingPolicy` của Shopify không phải nguồn** cho nhãn.

Sửa ở 2 chỗ tạo dòng con + mang `item.sellingPlan.name` từ order line vào entry (nó có sẵn ngay đó,
dòng bên cạnh còn dùng nó để lọc). Backfill 20 dòng/7 contract trên store tester, đối chứng còn 0.

### Sync giá ghi giá catalog vào line con — đã vá dữ liệu

Chuỗi nhân quả đã ghi ở [[digest-subscriptions-2026-09-16]]; lượt này là phần đóng. Tắt
`automation.syncProductPrice` rồi chạy command vá — dry-run ra **9 contract, không phải 8** như
report của dev. 21 line về 0 ở **cả ba chỗ**: `currentPrice`, `pricingPolicy.basePrice`,
`cycleDiscounts[].computedPrice`. Quét lại toàn bộ 21 contract của shop → `0 affected`.

Một contract mất cycle edit sau khi commit draft, phải restore từ snapshot. Không phải commit xoá
bừa: contract khác (`nQje`, cycle 25) vẫn còn edit nguyên.

### Migrate 63/63 — hai chỗ sót cuối cùng

- **`--clear-cycle-edits` của dev chỉ dò 2 index** suy từ đơn BILLED gần nhất. MR !2595 (quét mọi
  cycle) vá được 1 contract; contract cuối `BQdzs9TS8XIoNvF2txS2` có edit ở **4/6/10** nên phải làm
  tay 3 phase: snapshot → xoá edit → migrate → tạo lại. Quét 57 cycle mới thấy hết.
- **`inventoryItem.tracked` bị lật ở 1/16 sản phẩm.** `restoreUntrackedVariants` đọc `tracked` từ
  bản parent fetch **lúc đầu run**, mà run đó có `retry 1/4 fetch parents: AggregateError` ⇒ bản
  parent sai ⇒ ghi lại giá trị sai. Một lỗi mạng đã retry thành công vẫn để lại dữ liệu hỏng vì
  snapshot dùng để so sánh được lấy trước lúc retry. Cùng họ
  [[loi-mang-bi-bao-thanh-ly-do-nghiep-vu]].

### Apply / Change frequency chết im lặng ở classic CP

Tiếp SB-16815. Chuỗi thật: **token hết hạn → PUT 401 → refresh fail → FE nuốt sạch**. Có đúng 2 chỗ
bỏ qua `success`, và chỗ thứ hai còn không `await`.

Cách loại trừ đáng giữ hơn cả kết luận — mỗi bước giết một giả thuyết bằng dữ liệu, không bằng suy
đoán:

| Giả thuyết | Chết vì |
|---|---|
| `Permission denied` do so sánh strict `customerId` | `customerId` là **number ở cả 44 contract** |
| Đã xoá upcoming orders rồi tạo lại lỗi | `removeUpcomingOrders` hard-delete, mà 11 doc còn nguyên với `updatedAt` = lúc tạo ⇒ chưa tới bước đó |
| Shop này chưa bao giờ đổi được frequency | log `clientApi` cho thấy hôm đó có 4 lần đổi **thành công**, không lần nào của shop này |

Fix: banner `banners.actionFailed` ở 3 call site (MR !2599). Và một lần báo động sai của chính tôi
phải tự bác: `intervalCount` lệch +2 so với `frequencyValue` **không phải bug** — đó là
`MOCK_INTERVAL_DATA` ở trên.

### Cụm bug portal Wholefoods (SB-16889 → 16929)

Mỗi cái một dòng; điểm chung là không cái nào gate nào bắt được, chỉ lộ khi mở màn hình ra nhìn
([[so-anh-khong-so-chu]]) hoặc khi tester chạm vào.

| Triệu chứng | Gốc |
|---|---|
| "All collections" chỉ bao giờ ra 10 sản phẩm | backend mặc định `limitPerPage = 10`, picker không truyền gì |
| Dropdown variant ra 4 dòng đều "Default" | mapper sau fetch chỉ giữ `id/price/compareAtPrice`, `title` bị vứt ngay sau khi fetch |
| Modal add product hẹp, nút bị cắt thành dải chữ dọc | `Modal` thiếu `size` ⇒ mặc định `auto`; `['auto','auto','fill']` khiến nút không co được nên tràn ra ngoài |
| Reload mất màn đang xem | full-page customer-account extension chỉ có **một URL duy nhất**, không có gì để khôi phục — phải nhớ bằng `storage`; và effect ghi chạy lúc mount sẽ đè giá trị đã lưu nếu không guard |
| Badge `SUBSCRIPTION (−$X)` nuốt luôn tiền của discount code | `resolveLinePrice` ưu tiên `lineDiscountedPrice` — giá **sau khi trừ cả mã** |
| Một attribute timezone rác làm sập cả portal | `deliveryDayLock` ném exception khi `Intl` nhận timezone không hợp lệ ⇒ validate một lần lúc đọc, không ở từng chỗ dùng |
| Filter Collection của staples không có gì để chọn | nhánh v2 dùng `handleGetProductsByIdsLightweight`, query đó **không lấy `collections`** — helper đọc `product.collections` nên rỗng |
| Picker "box" rỗng dù backend đã sửa | shop không có document bundle nào ở 3 tên collection đã đoán — phải tìm tên collection thật |

Và một khác biệt prod ↔ staging bắt được **trước khi live**: `sprayfreefarmacy` dùng
`Delivery-Date` / `Pickup-Date` (gạch nối) trong khi 3 helper chỉ đọc kiểu Bird `Delivery Date`.
Sửa xong lại lộ chỗ thứ hai: `deliveryDayLock` parse ngày theo **nửa đêm local** còn
`resolveDeliveryDate` neo **giữa trưa UTC** — cùng một attribute, hai mốc khác nhau, và attribute
còn có thể là ISO instant đầy đủ chứ không chỉ chuỗi ngày trần.

## Techniques

- **Chạy helper thật trên dữ liệu prod bằng jest, không bằng `node lib/`.** `lib/` có thể stale
  (`money.js` và service plan-v2 chưa từng tồn tại trong `lib` khi tôi chạy), còn chạy thẳng `src/`
  thì alias `@functions` không resolve. Jest đã có sẵn alias + babel nên là đường ngắn nhất. Một lần
  chẩn đoán sai chỉ vì chạy nhầm `lib/`.
- **`String(x).endsWith('')` luôn true.** Chế độ PATCH truyền `boxVariantId: ''` đã xoá sạch marker
  staple của cả 5 line. Guard non-empty trước khi so hậu tố id.
- **Đừng tin "đã deploy" — grep bundle.** `.shopify/dev-bundle/<uid>/dist/*.js`, đếm số lần host
  xuất hiện. `yarn dev` chỉ watch `extensions/`, sửa `packages/functions` không rebuild gì. Và
  `touch` sai đường dẫn đã tạo một `src/index.js` **rỗng** — phá bundle, phải xoá ngay.
- **Rebuild metafield landing bằng `updateCustomLandingMetaField`, không bằng `handleSetFixedBundle`.**
  Đường thứ hai chạy lại `productSet` và sẽ xoá `compareAtPrice` lần nữa
  ([[mutation-ghi-nguyen-khoi-xoa-field-khong-gui]]). Hàm thứ nhất có export, ghi thẳng metafield,
  không đụng sản phẩm nào.
- **Bust cache CDN bằng `?v=` trong ô "Bundle script URL" của theme editor.** Cloudflare
  `max-age=86400` giữ bundle cũ; query string nằm trong cache key nên `?v=<ngày>` kéo bản mới từ
  origin, không cần sửa code. Dấu hiệu phân biệt "cache" với "chưa deploy": gọi kèm `?cb=<timestamp>`
  ra size khác.
- **`shopify app deploy` đẩy CẢ app config trong toml, không chỉ bundle extension.** Một lần deploy
  từ máy với `shopify.app.staging-3.toml` thiếu `optional_scopes` đã **làm mất scope của app** trên
  staging 3. Production an toàn vì CI ghi `PROD_APP_TOML` rồi mới deploy — nghĩa là toml trên máy
  không phải nguồn cho prod, nhưng **là** nguồn cho mọi môi trường khác.
- **Hai file ghim nhánh CI là mìn merge.** `staging3.yml` và `staging.yml` giữ `STAGING*_BRANCH`;
  merge nguyên trạng là đổi con trỏ môi trường của người khác. Lấy bản master cho cả hai — đây là
  ngày thứ tư liên tiếp chuyện này xuất hiện (xem [[shipped-subscriptions-2026-09-17]]).

## Context

- **Migrate đóng hoàn toàn:** 63/63 sản phẩm, 17/17 contract. Nhưng **migrate ≠ vào plan** — 63 sản
  phẩm vẫn không hiện ở landing tới khi được add vào plan group (15/16 vào được, 1 phải xử riêng).
- **Landing joyxjoy:** `plan_v2: false` trên 16 box nên tần suất rơi về danh sách legacy hardcode;
  sửa theo đúng nguyên tắc dantt nêu — "nhập group id nào thì chỉ hiện thứ thuộc group đó" (MR
  !2598). Metafield trên prod còn shape cũ (`position`, `defaultPlanId` đều ABSENT) nên thứ tự vẫn
  sai tới khi rebuild.
- **SB-16803: 14/16 Done** cuối ngày. Nhánh `feat/wholefoods-portal` đã merge master — 5 file xung
  đột, 2 trong đó là file ghim nhánh CI; gate 371/371 suite. Suite duy nhất đỏ là **của master và
  hỏng sẵn**: nó đọc fixture trong `memory-bank/` (gitignore), nên không thể xanh trên bất kỳ
  checkout sạch nào.
- **Chưa live.** Portal chưa từng chạy trên store production, và store đó khác staging ở đúng chỗ
  nguy hiểm (`newPlanVersion: true`, attribute gạch nối). Checklist go-live + hai điểm về hiển thị
  extension: [[2026-09-17-extension-wholefoods-khong-gate-theo-shop]] ·
  [[extension-khong-gioi-han-theo-shop]].
- **Quyết định không chạy 2 backfill trên prod** (`sellingPlanName` dòng con, timezone contract):
  dantt bác — *"trên prod chắc vẫn work bth mà? cần gì backfill cha"* — và đúng. Kiểm lại thì
  **không portal nào đọc `sellingPlanName` của dòng con**. Cùng lớp với
  [[2026-09-14-backfill-bird-chi-don-chua-charge]]: phạm vi backfill phải suy từ "ai đọc field này",
  không từ "field này đang sai".

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-09-16]] · [[shipped-subscriptions-2026-09-17]] ·
[[2026-09-09-portal-wholefoods-extension-rieng]] · [[2026-09-16-landing-doi-nguon-lap-sang-collection-list]] ·
[[mutation-ghi-nguyen-khoi-xoa-field-khong-gui]] · [[loi-mang-bi-bao-thanh-ly-do-nghiep-vu]] ·
[[ack-khong-phai-hieu-ung]] · [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] ·
[[khong-error-boundary-hong-ca-man-hinh]] · [[prop-sai-bi-bo-qua-im-lang]] · [[so-anh-khong-so-chu]] ·
[[feedback-tra-loi-trong-chat]]
