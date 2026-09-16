---
type: note
title: Digest subscriptions — 2026-09-16 (migrate Simple Bundles trên prod, landing joyxjoy nối vào plan thật, và vòng bug portal Wholefoods)
summary: Migrate 63 sản phẩm + 17 contract trên store thật làm lộ ba lớp lỗi khác nhau — `productSet` xoá field không gửi, lệnh migrate biến lỗi mạng thành lý do nghiệp vụ, và sync giá ghi giá catalog vào line con bundle khiến khách bị tính thêm tiền; song song đó landing đụng trần 20 handle của `all_products` và portal Wholefoods đóng 7 ticket JIRA.
tags: [subscription, shopify, avada, firestore, backend, extensions, debug, method, cdn]
created: 2026-09-16
updated: 2026-09-16
source: project `subscriptions` — session history 2026-09-15/16 (session 1facd563 ticket SB-16815, session 65eb4665 migrate + landing joyxjoy, session 0fb64e0c portal Wholefoods)
---

# Digest — `subscriptions`, 2026-09-16

Phần đầu của các session này (contract import bịa plan, `limit(10)` + `direction: undefined`, jest
`packages/assets` thiếu alias `react → preact/compat`) đã ghi ở [[digest-subscriptions-2026-09-15]].
Note này **CHỈ phần mới**.

## Bugs

### Sync giá ghi giá catalog vào line con của Fixed Bundle — khách bị tính thêm tiền

Nghiêm trọng nhất của đợt. Contract Fixed Bundle gồm **1 line cha mang giá bundle** và các line con
`currentPrice = 0`. Khi merchant sửa giá một sản phẩm con, `automation.syncProductPrice` ghi giá
catalog vào chính line con đó, mà Shopify charge theo **tổng các line** — nên kỳ tới khách trả giá
bundle **cộng thêm** giá lẻ. 8 contract dính, cao nhất `+54.80 AUD/kỳ`. Đã verify độc lập trên prod
bằng Shopify GraphQL, khớp từng đồng với report của dev.

Chuỗi nhân quả, không có chỗ nào tự chặn:

| Bước | Chỗ hổng |
|---|---|
| Webhook `products/update` | chỉ kiểm `automation.syncProductPrice`, không có giới hạn "chỉ sản phẩm cha" |
| `getAllSubscriptionContractsByProductId` | query `productIds array-contains` — `productIds` chứa **cả id line con** |
| `findContractsNeedPriceUpdate` | so `basePrice` (0) với giá catalog, lệch thì đưa vào danh sách; không loại line con |
| lúc charge | `prepareLineDiscountData` chỉ bỏ qua line có `basePrice === 0` — sync đã ghi khác 0 nên nó giữ nguyên giá sai |

Ba lý do nó sống sót — đúng họ với [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]]:

1. **Chưa từng có contract kiểu này** — trước đợt migrate, shop không có contract Fixed Bundle nào
   có line con.
2. **Giao diện che lỗi** — `PlanDetails.js` cố định hiển thị line con là `currentPrice: 0`, nên giá
   sai trên Shopify vẫn hiện `A$0.00`. Dấu hiệu duy nhất là giá gạch ngang lấy từ `basePrice`.
3. **Store test không tái hiện được** — webhook bị bỏ qua ở `productsController` (nghi
   `hasActiveSubscriptionPlanQueue` hoặc cache `isProductNotTracked` 60 phút), **cả hai đều không ghi log**.

Điều kiện đúng để nhận ra line con (có **hai** dạng attribute, đừng chỉ kiểm một):
có `__joy_bundle_group` và `__joy_bundle_parent !== "1"`. Contract migrate thì line con có
`__joy_bundle_parent = "0"`; contract bán trực tiếp qua Joy thì không có key đó.

Còn một hệ quả phụ chưa kiểm hết: `updateContractPriceLineBatch` gọi
`subscriptionBillingCycleEditsDelete(targetSelection: ALL)` sau khi commit — **xoá mọi bản sửa theo
chu kỳ**, gồm Delivery Date của Bird. *Chưa xác minh* 8 contract đó còn Delivery Date hay không.

### `productSet` xoá `compareAtPrice` và `inventoryItem.tracked`

Script migrate không hề nhắc `compareAtPrice`, nhưng sau khi chạy thì 3 sản phẩm mất giá gạch ngang
đang hiển thị cho khách. Gốc: `variants` là **list field** của `productSet`, mà mutation đó thay
nguyên khối — field không gửi thì bị xoá. Tách riêng ở
[[mutation-ghi-nguyen-khoi-xoa-field-khong-gui]].

Kèm một lỗi trong chính script sửa chữa: chạy không `--only` thì nó đòi ghi `"0.00" → null` lên
**những sản phẩm chưa migrate**. Bắt được vì chạy thử trước, không vì test. Luật đã nướng vào code:
*chỉ được đặt giá trị TRỞ LẠI, không bao giờ ghi `null` đè lên cái đang sống*.

`inventoryItem.tracked` lệch ở đúng **1/16** sản phẩm — và nó không ngẫu nhiên:
`restoreUntrackedVariants` đọc `tracked` từ bản parent fetch lúc đầu run, mà lần chạy đó có
`retry 1/4 fetch parents: AggregateError` ⇒ bản đọc khuyết. Một lỗi mạng đã lặng lẽ biến thành sai
dữ liệu tồn kho.

### Lệnh migrate biến lỗi mạng thành lý do nghiệp vụ

`migrateContractsToFixedBundle.js` **không có retry nào**. Gặp `AggregateError` nó báo
`skipped: parent-line-not-found` (một lý do nghiệp vụ nghe hợp lý) hoặc `applied 0/0` — **trông y
hệt một lần chạy thành công không có việc**. Tách riêng ở [[loi-mang-bi-bao-thanh-ly-do-nghiep-vu]].

### Landing joyxjoy — trần 20 handle của `all_products`

`{{ all_products[handle] }}` của Shopify Liquid có giới hạn **20 unique handle mỗi trang**, có ghi
trong docs. Payload emit 72 bundle nhưng chỉ 19 cái đầu resolve được; từ vị trí 19 trở đi rỗng hết.
Hai chi tiết đắt:

- `{%- if p -%}` **không lọc được** — handle không resolve trả về `EmptyDrop`, vẫn truthy.
  Phải kiểm `p.id`.
- Sản phẩm `UNLISTED` thì `all_products` không thấy, dù Admin API vẫn trả về bình thường. Tôi từng
  khẳng định "landing sẽ hiện 15 box JOY" vì đọc qua Admin API — sai.

Cách gỡ (không chặn, không cap) ở [[2026-09-16-landing-doi-nguon-lap-sang-collection-list]].

**Thiếu snippet thì trang chết hẳn, không phải thiếu một phần.** Section gọi
`{% render 'joy-subscription-bundle-json' %}`; file không tồn tại thì `render` không in gì nhưng dấu
phẩy phân cách **vẫn in** ⇒ `bundles: [,,,]` ⇒ `TypeError: Cannot read properties of null` ⇒ 0
section render. Đã chứng minh bằng cách dựng thật, không suy luận.

### Staples vào giỏ dạng one-time

Chuỗi 4 bước kết ở `pickStapleSellingPlanId` trả `null`: code **không bao giờ đọc selling plan của
chính staple đó**, nó đi mượn từ box đang chọn hoặc từ `selectedPlan`. Mà `plan_v2` của mọi bundle
là `false` (metafield `avada_subscription_plan_v2/data` thiếu hoặc trỏ group khác) nên tần suất rơi
xuống danh sách legacy hardcode, và không có gì để mượn. Verify end-to-end bằng cách chặn
`/cart/add.js` trong Chrome: `selling_plan=(không có)` → `selling_plan=5811241175`.

Một giả định phải kiểm trước khi thiết kế theo nó: *mọi product trong cùng plan group dùng chung một
bộ `sellingPlanId`*. Đo được 46/46 — và đúng về cấu trúc chứ không phải may: Shopify cấp
`sellingPlanId` **theo group**, không theo product.

### Portal Wholefoods — cụm lỗi "một dòng code làm trắng cả màn"

Nối tiếp [[digest-subscriptions-2026-09-12]] và [[khong-error-boundary-hong-ca-man-hinh]]:

| Lỗi | Gốc |
|---|---|
| Portal trắng trang tuỳ contract | `calculatePricing.js` destructure `productPlan` không guard — line nào tra plan không ra là sập cả extension |
| Tab History kẹt skeleton vĩnh viễn | `useFetchApi` chạy effect đúng một lần với deps `[]`, lúc đó `contract` còn rỗng ⇒ `initLoad: false` ⇒ **request chưa từng được gửi**. Lặp lại y hệt khi thêm `productScopes` fetch ở `General.js` |
| Picker staples spinner mãi | 14 request `/subscription-products/search` bắn song song do modal remount — chữa bằng debounce + cache module-level, không bằng đoán |
| Search "Star" rồi xoá vẫn giữ kết quả cũ, **hỏng vĩnh viễn** | cache ghi kết quả dưới signature mới hơn; sửa bằng `issuedFor` + không bao giờ cache dưới signature đã đổi |
| `405 Method Not Allowed` | route khai `PUT`, client gọi `POST` |
| `first: "60"` | `limitPerPage` qua query string là **chuỗi**, GraphQL `first:` cần Int. Trước đây picker không gửi tham số nên luôn là số 10 — bug chỉ sinh ra khi tôi bắt đầu gửi |

Ba ticket JIRA "đã sửa" rồi hỏng lại, cả ba vì **sửa theo triệu chứng chứ chưa tới gốc**:

- **SB-16809** (1 sản phẩm vẫn ra nhiều ảnh) — lần một khử trùng theo **URL**; snapshot và line có
  thể giữ hai tấm ảnh khác nhau của cùng một sản phẩm. Phải khử theo **danh tính sản phẩm**.
- **SB-16861** (plan hiện `9 weeks`) — lần một cho policy thắng plan. Nhưng
  `MOCK_INTERVAL_DATA = {day: 60, week: 8, month: 2}`: app **cố ý thổi phồng** interval lưu trên
  Shopify để Shopify không tự charge theo lịch của nó, rồi trừ lại lúc đọc. Nên `WEEK × 10` = 8 + 2
  = "Every 2 weeks". Plan phải thắng policy.
- **SB-16867** (line thường xếp vào Seasonal boxes) — lần một dựa vào `bundleProductIds` từ một API
  bất đồng bộ, **rỗng ở lần render đầu**. Phải dùng dấu hiệu nội tại có sẵn trên line
  (`__joy_bundle_parent = "1"`).

- **SB-16866** (picker rỗng) — chẩn đoán **sai ba lần** trước khi tới gốc thật: shop chạy **plan
  v2** (doc `subscriptionPlans` cấp shop với `selectedItems[]`), còn endpoint chỉ query collection
  `subscriptionProducts` của **plan v1**. dantt đẩy lại từng lần (*"bug 5 bạn cần check kĩ nhé? tại
  sao applied to all thì lại rỗng ?"*) — mỗi lần đẩy lại là một lần tôi kết luận vội.

## Techniques

**Lô ngắn + `results.json` ghi tăng dần = việc bị giết vẫn resume được.** Shell cắt lệnh ở 2 phút
làm lô 1 dừng ở 8/12; không mất gì vì mỗi sản phẩm là một đơn vị độc lập và tiến độ ghi tăng dần,
biết chính xác dừng ở đâu. Sau đó rút lô xuống 6. Cùng kỷ luật với
[[digest-pdf-2026-08-03]].

**Snapshot phải nằm NGOÀI worktree.** Xoá worktree là mất luôn dữ liệu rollback dưới `--out`. Sau
đó chuyển hẳn sang `/tmp/migruns`.

**Đếm bằng dữ liệu nguồn, không cộng tay theo output lệnh.** Mọi mốc tiến độ (55/63, 63/63, 15/17
contract) đều xác nhận bằng cách đọc lại metafield trên Shopify — đúng luật
[[ack-khong-phai-hieu-ung]].

**Cloudflare cache 24h và cách bypass.** Origin đã có bundle mới (122.268 bytes) nhưng CDN trả bản
cũ (121.571 bytes) vì `cache-control: max-age=86400`. Query string nằm trong cache key ⇒ thêm
`?v=20260916` vào ô "Bundle script URL" của theme editor là kéo được bản mới, **không cần sửa code**.
Dấu hiệu chẩn đoán: gọi kèm `?cb=<timestamp>` ra size khác hẳn.

**Ghi lại metafield mà không đụng sản phẩm nào.** `rebuildCustomLandingMetafield` không export và
đường gọi chuẩn của nó chạy lại `productSet` (⇒ xoá `compareAtPrice` lần nữa). Dùng
`updateCustomLandingMetaField` (có export) ghi thẳng, bỏ phần `currentBundle` — 78 bundle, JSON
13.6 KB, 0 sản phẩm bị chạm.

**Mutation-check mọi guard mới.** Một regression test viết cho guard `calculatePricing` **pass cả
khi bỏ guard** — nó không chạm đường crash. Suýt đưa ra làm bằng chứng. Viết lại thì nó fail đúng
thông báo lỗi thấy trên browser. Cùng họ với [[gate-tu-viet-la-nguon-xanh-gia]].

**Đo cả hai bên bằng cùng một thước.** Typography, gap, chiều cao card đều so bằng computed style
trên cả mockup lẫn build — không nhìn mắt, và tuyệt đối không `innerText` ([[so-anh-khong-so-chu]]).
Ngược lại, *"ủa sao mày ko xem được vậy ???"* là đúng: ảnh bằng chứng trong ticket JIRA tôi chưa
từng thử tải về đọc — tải xong là ra chẩn đoán ngay. Cùng lớp với [[feedback-ra-het-duong-verify]].

**`grep` qua wrapper `rtk` trả kết quả sai** (báo 0 match cho chuỗi có thật) — dẫn tới một lần báo
"đã thêm devzone action" trong khi nó **chưa từng tồn tại**. Xác minh file bằng Python. Đã gặp ở
[[digest-subscriptions-2026-09-11]], lặp lại lần này.

## Context

- Giới hạn cứng của Customer Account extension, đã tra thẳng type definition chứ không đoán:
  không có prop `color` ở đâu cả; `Background = transparent|base|subdued`;
  `Badge tone = default|critical|subdued` (không có success/warning) nhưng **có prop `icon`**;
  `Text appearance` thì **có** `success|warning|accent|subdued|info`; `BorderStyle` có `dashed`
  (nên làm được divider đứt); `blockAlignment="stretch"` **không hợp lệ và bị bỏ qua im lặng**
  ([[prop-sai-bi-bo-qua-im-lang]]); `ResourceItem` slot `action` ghim nút xuống đáy ô nên các hàng
  thẳng nhau; `Modal` mặc định `size="auto"` — thiếu `size="large"` là modal bị bóp.
- `yarn dev` chết vì Shopify CLI glob `**/shopify.web.toml` và thấy bản sao trong 3 git worktree
  dưới `.claude/worktrees/` của session khác. Chữa bằng `web_directories = ["."]` trong cả 7
  `shopify.app*.toml` — **không xoá worktree của ai**. Đúng cách vá ở
  [[worktree-trong-repo-lam-hong-tooling]].
- Khoá sửa theo **ngày giao của Bird** đã thay hẳn bảng cutoff hardcode trong portal Wholefoods —
  quyết định gốc ở [[2026-09-10-cutoff-theo-delivery-day]]. `CutoffScheduleCard` vẫn in bảng cũ,
  đang chờ dantt quyết.
- Cờ `enabledFixedBundleStaples` (bật bằng DevZone, **không hardcode theo shop domain**) + field
  `fixedBundleContext` pin trên doc contract, ghi qua 3 đường: devzone toggle, command backfill, và
  lúc contract create. Cùng pattern với [[2026-09-10-devzone-hide-recurring-pricing]].
- Trạng thái cuối: 63/63 sản phẩm và 17/17 contract đã migrate; extension lên `staging3-147`;
  MR !2589, !2590, !2594, !2596 trên GitLab. Bug sync giá đã báo dev, **chưa có bản vá**, kỳ charge
  gần nhất 20/09.

Liên quan: [[subscriptions]] · [[subscriptions-debug-runbook]] · [[digest-subscriptions-2026-09-15]] ·
[[shipped-subscriptions-2026-09-16]] · [[2026-09-09-portal-wholefoods-extension-rieng]] ·
[[khong-error-boundary-hong-ca-man-hinh]] · [[feedback-gioi-han-platform-thi-go-khong-chan]]
