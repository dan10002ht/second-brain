---
type: note
title: Digest subscriptions — 2026-09-19 (charge đúp ở bluegrasspw: ba cơ chế một hậu quả; và các bẫy còn lại của landing joyxjoy + portal Wholefoods)
summary: Ba contract của bluegrasspw-supplements bị charge hai lần trong cùng một kỳ vì có HAI upcoming order doc cùng ngày — ba đường vào khác hẳn nhau nhưng chung một kết cục, và quét cả store còn thấy 31 doc có cycleIndex nghịch chiều ngày; kèm cụm bẫy nhỏ nhưng đắt của landing/portal: CDN cache 24h che mất bản mới, thiếu một snippet Liquid làm mảng JSON thành `[,,,]` và trang chết hẳn, `plan_v2` là metafield sản phẩm chứ không phải phiên bản plan của shop.
tags: [subscription, shopify, avada, firestore, backend, extensions, billing, debug, method, cdn]
created: 2026-09-19
updated: 2026-09-19
source: project `subscriptions` — session history 2026-09-18/19 (session 1d674cab SB-16934 charge đúp, session 65eb4665 landing joyxjoy, session 0fb64e0c portal Wholefoods)
---

# Digest — `subscriptions`, 2026-09-19

Nối tiếp [[digest-subscriptions-2026-09-17]]. Phần commit đã ghi ở
[[shipped-subscriptions-2026-09-19]]. Note này **CHỈ phần mới** của các phiên 18–19/09.

## Bugs

### Charge đúp ở `bluegrasspw-supplements` — ba cơ chế, một hậu quả (SB-16934)

Ticket từ kênh Slack `C07URV6QMJ8` → JSUB-260917 → JIRA **SB-16934**. Contract `75462181105`
(shop `yaMwrC6n2dqi8Brswwea`) bị charge hai lần trong cùng một kỳ.

**Hậu quả chung, dễ nhận:** contract có **hai upcoming order doc mang cùng một ngày**. Cron billing
xử lý theo doc, nên hai doc cùng ngày = hai lần thu tiền. Đó là thứ duy nhất ba ca có chung.

**Ba đường vào thì khác hẳn nhau** — và đây là điểm phải giữ, vì nó bác giả thuyết ban đầu của tôi
rằng "đây là lỗi của luồng skip":

| | Dấu vết | Cơ chế |
|---|---|---|
| Ca 1 | contract `isManual: true` (kèm cờ cần tạo đơn — bản ghi transcript bị cắt ở chỗ này, **chưa xác minh** tên cờ chính xác) | đơn sinh thêm ngoài nhịp cron |
| Ca 2 | doc mang `isRescheduled` / `updateBy: client` | khách tự dời ngày, doc mới trùng ngày doc cũ |
| Ca 3 | cặp "1 skipped + 1 unbilled cùng ngày" | skip không dọn doc còn lại |

Nên mọi phép vá chỉ theo **một** cơ chế đều sẽ bỏ sót hai cơ chế kia. Bản chặn trong code đang nằm
ở nhánh `fix/skip-cycle-recharge` (xem [[shipped-subscriptions-2026-09-19]]) và nó đánh đúng lớp
"hai cycle chung một ngày billing" — tức chặn ở **hậu quả chung**, không chặn ở từng đường vào.

**Quét cả store mới ra phạm vi thật:** 514 contract / 4.701 order doc → **3 contract đã charge đúp**
+ **1 contract sắp nổ ngày 03/10** (lúc quét còn 15 ngày). Tức phần đã hỏng nhỏ hơn phần *sắp* hỏng,
và cái sắp hỏng chỉ thấy được khi quét, không thấy được từ ticket.

**Phép tự kiểm đã bác một nửa giả thuyết của chính tôi.** Quét sâu ra **31 doc có `cycleIndex`
nghịch chiều ngày** trên 255 contract. Tôi định kết luận "ghi nhầm `originAttemptDate`" — nhưng
`date === originAttemptDate` chỉ đúng **2/31**. Giả thuyết chết tại chỗ — đây là một phép kiểm
*phân biệt được* hai giả thuyết chứ không phải một lượt xác nhận
([[bang-chung-phan-biet-duoc]]) — thay bằng phép nắn thuần hình học: mỗi doc phải khít giữa hai kỳ kề (`prev + 1 tháng = to`, `to + 1 tháng = next`).

Và một con số suýt bị đọc sai: **71/255 contract có gap 59–61 ngày** — nhìn thì như lỗi hàng loạt,
đọc kỹ thì **gộp hai thứ khác nhau**: phần lớn là *lệch hợp lệ* (khách skip một kỳ thì khoảng cách
tự nhiên thành hai tháng), chỉ phần thiếu đúng một `cycleIndex` ở giữa mới là hỏng. Cùng họ với
[[con-so-trong-tieu-chi-phai-kem-cach-do]] — một con số tổng không phân biệt được hai giả thuyết.

**Kỷ luật vá dữ liệu prod đã dùng, không có ngoại lệ nào:**

1. Tách rõ hai việc: *nắn dữ liệu đã hỏng* ≠ *chặn sinh ra cái mới*. Làm cái một trước theo yêu cầu
   của dantt ("xử lý cho store trước và sau đó tìm root cause").
2. Script mặc định **dry-run**, chỉ ghi khi có `--apply`, in bảng `from → to` từng doc.
3. **Verify bằng state, không tin dòng `WRITTEN`** — chạy lại đúng script đếm: doc lạc 31 → **0**,
   nhóm sắp charge đúp 1 → **0**. Đây là [[ack-khong-phai-hieu-ung]] áp dụng thẳng.
4. Preflight viết ra file trước khi đụng prod:
   `docs/superpowers/preflight/2026-09-18-duplicate-upcoming-order-double-charge.md`, trong đó ô 1
   liệt kê **7 luồng** có thể đẻ ra doc trùng ngày.

Một cái bẫy trong chính script vá: helper `day()` của repo chỉ xử lý Firestore `Timestamp`, còn
script truyền vào `Date` thuần → dry-run ra bảng rác. Bắt được vì đọc bảng, không vì test.

### Thiếu một snippet Liquid ⇒ trang chết hẳn, không phải thiếu một box

Section landing dựng mảng JSON bằng vòng lặp `{% render 'joy-subscription-bundle-json' %}`. Merchant
paste section mà **quên tạo snippet** (`MissingTemplate` của Theme Check). `{% render %}` không in gì
nhưng **dấu phẩy phân cách vẫn in** ⇒ payload ra `[,,,]` ⇒ `JSON.parse` trả `null` ⇒
`TypeError: Cannot read properties of null`. Đo trên harness: **0 section render, trang trống hoàn
toàn**. Tức triệu chứng của "thiếu một file phụ" lại là "mất cả trang" — không hề tỉ lệ với nguyên
nhân, nên khi merchant báo trắng trang thì snippet là chỗ phải hỏi trước.

### `plan_v2` — cùng một cái tên cho hai tầng khác nhau

Mất nhiều lượt qua lại vì chỗ này: dantt hỏi *"mặc định là plan_v2 mà cha ????"* và **cả hai đều
đúng**, chỉ là đang nói về hai thứ:

| | Là gì | Nguồn |
|---|---|---|
| `shop.newPlanVersion` | shop đang chạy mô hình plan v2 | Firestore, cấp shop |
| `plan_v2` trong payload landing | **metafield của từng sản phẩm** | `avada_subscription_plan_v2` trên product |

Shop dùng v2 **không** làm `plan_v2` của sản phẩm thành `true`. Nó `false` khi sản phẩm không có
metafield, **hoặc** có nhưng không chứa đúng key `plan_group_id`. Khi `false`, code rơi về nhánh dự
phòng đoán tần suất bằng **regex trên tên plan** — đó là lý do "Every 4 weeks" ra rỗng trong khi 1/2
tuần có hàng: sản phẩm đó thật sự không có plan 4 tuần trong nhánh dự phòng.

### Staple không bao giờ đọc selling plan của chính nó

Câu hỏi của dantt (*"sao tao mua sản phẩm ở step 2 và đã chọn frequency thì add to cart vẫn ra sản
phẩm one time?"*) có một câu trả lời rất ngắn: `pickStapleSellingPlanId` **đi mượn** — lấy selling
plan từ box đang chọn, không có box thì lấy từ `selectedPlan`. Bản thân staple có đầy đủ selling
plan (46/46 sản phẩm trong group dùng **chung một bộ `sellingPlanId`**, vì Shopify cấp id theo
**group** chứ không theo product) nhưng không đường nào đọc tới. Không box được chọn ⇒ `null` ⇒ vào
giỏ dạng one-time.

Bằng chứng đóng việc là bắt `/cart/add.js`: trước `id=… qty=5 selling_plan=(KHÔNG CÓ)`, sau
`selling_plan=5811306711`.

### Metafield landing chỉ được dựng lại khi merchant **save một fixed bundle**

Pin một plan group mới trong theme editor thì step 1/2 trống trơn — không phải cache, không phải
Liquid. `rebuildCustomLandingMetafield` chỉ chạy bên trong `handleSetFixedBundle` (và **không
export**), nên group mới chưa có trong `planProducts` cho tới khi có ai đó bấm save một bundle bất
kỳ. Đường ghi thẳng an toàn là `updateCustomLandingMetaField` — nó **không** chạy `productSet`, tức
không kéo theo cú xoá `compareAtPrice` của [[mutation-ghi-nguyen-khoi-xoa-field-khong-gui]].

### Portal Wholefoods — ba lỗi nhỏ đắt tiền

- **`Modal` thiếu `size` thì mặc định `auto`.** Modal Add product hẹp, icon nhảy lên trên, nút gãy
  4 dòng. Tôi "sửa" bằng `size="large"` — bản 147 ra **tệ hơn**: nút tràn hẳn ra ngoài và bị cắt
  thành dải chữ dọc, tester đẩy ngược 4 ticket. Gốc thật là ô nút để `['auto','auto','fill']` nên
  không co được. Một lần nữa: thay đổi layout phải mở ảnh ra nhìn ([[so-anh-khong-so-chu]]).
- **Dropdown variant ra 4 dòng đều tên "Default".** Không phải query thiếu `title` — query có, nhưng
  **mapper vứt nó đi** ngay sau khi fetch, chỉ giữ `id/price/compareAtPrice`.
- **Ghi attribute lên Shopify: `SubscriptionDraftInput.customAttributes` THAY THẾ cả danh sách.**
  Backfill phải đọc attribute hiện có rồi nối thêm; ghi thẳng là xoá sạch 7–12 attribute giao hàng
  của Bird. (Cùng họ "ghi đè thay vì gộp" ở [[digest-subscriptions-2026-09-11]].)

## Techniques

**CDN cache 24h che mất việc verify — cache-buster đi qua ô setting của theme.** MR đã merge, origin
đã có bản mới, mà trang vẫn chạy bundle cũ: Cloudflare trả `max-age=86400`. Phân biệt được bằng một
lần gọi có `?cb=<timestamp>`:

```
bình thường     121.571 bytes   step_images=0    ← bản cũ
?cb=<timestamp> 122.268 bytes   step_images=3    ← origin đã đúng
```

Cách chữa cho merchant: thêm `?v=20260916` vào ô **"Bundle script URL"** trong theme editor —
Cloudflare tính query string vào cache key nên tạo entry mới. Không phải sửa code.

Kèm một cái bẫy đọc số: `pinnedGroupPlans=0` khi grep bundle **không** có nghĩa là thiếu code —
Terser mangle tên biến. Dấu hiệu đọc được phải là thứ không bị mangle (chuỗi literal như
`step_images`).

**Đối chiếu hai lần chạy độc lập rẻ hơn tin một lần.** Quét đủ 63 sản phẩm sau migrate bằng cách đọc
metafield thật trên Shopify (`SAN PHAM: da migrate 63/63`), không cộng tay từ output lệnh.

**`PROD_APP_TOML` do CI bơm — toml trên máy không quyết định prod.** Nối tiếp gotcha
"`shopify app deploy` đẩy cả app config" của [[digest-subscriptions-2026-09-17]]: ở đường production
thì `.gitlab/ci/production.yml` ghi `echo "$PROD_APP_TOML" > shopify.app.toml` trước khi deploy, nên
scope prod đọc từ biến CI. Việc này **sửa hẳn một mục trong checklist go-live** tôi vừa viết —
câu hỏi của dantt (*"file toml khi live nằm ở gitlab ci cd cơ"*) là thứ bắt được nó.

**Merge master vào nhánh dài ngày: quả mìn duy nhất là file ghim nhánh CI.** 45 commit ahead / 107
behind, 228 file khác nhau — nhưng chỉ **2 file conflict thật**, và cả hai là
`.gitlab/ci/staging.yml` / `staging3.yml` ghim `STAGING*_BRANCH`. Lấy bản của master cho cả hai (nếu
không, merge xong là cướp môi trường staging của nhánh khác). Sau merge, suite đỏ duy nhất là test
**của master** đọc fixture trong `memory-bank/` (gitignored) — hỏng sẵn trên mọi checkout sạch.

## Context

- **Store prod ≠ store staging ở đúng chỗ nguy hiểm.** Trước khi golive portal Wholefoods, đọc dữ
  liệu thật của `sprayfreefarmacy`: `newPlanVersion: true` (đi vào nhánh v2 vừa viết, chưa ai chạy
  thật) và attribute giao hàng **không theo kiểu Bird** — ba helper chỉ đọc `Delivery Date`, bỏ sót
  `Delivery-Date` / `Pickup-Date`. Chi tiết đã ghi ở [[shipped-subscriptions-2026-09-18]]; điều đáng
  giữ ở đây là **phép kiểm sinh ra nó**: đọc dữ liệu store đích trước khi tuyên bố live được, chứ
  không suy từ store đã test.
- **Đang vá prod thì đóng băng công cụ.** Giữa đợt migrate, dantt chốt: *"tôi muốn dùng command của
  nhánh đó làm, và những gì bạn vừa fix để làm, ko làm thêm nhé, nếu có bug thì dev sẽ monitor"*.
  Hệ quả thực tế: khi lệnh gặp `AggregateError`, tôi bọc retry ở **tầng shell** thay vì sửa command
  đang chạy dở trên dữ liệu thật.
- **`syncProductPrice` vẫn đang tắt tay.** Dữ liệu đã vá (9 contract / 21 line về $0) nhưng bản sửa
  `findContractsNeedPriceUpdate` **chưa có MR**. Bật lại sớm là 9 contract dính lại ngay.
  ⚠️ Đây là trạng thái treo, không phải việc đã đóng — xem [[digest-subscriptions-2026-09-16]].

Liên quan: [[subscriptions]] · [[shipped-subscriptions-2026-09-19]] ·
[[digest-subscriptions-2026-09-17]] · [[digest-subscriptions-2026-09-16]] ·
[[shipped-subscriptions-2026-09-18]] · [[2026-09-18-timezone-resolve-luc-doc]] ·
[[2026-09-16-landing-doi-nguon-lap-sang-collection-list]] · [[ack-khong-phai-hieu-ung]] ·
[[con-so-trong-tieu-chi-phai-kem-cach-do]] · [[mutation-ghi-nguyen-khoi-xoa-field-khong-gui]] ·
[[so-anh-khong-so-chu]] · [[digest-subscriptions-2026-09-11]] · [[caching-layers]] ·
[[lich-dinh-ky-neo-theo-ngay-du-kien]] · [[bang-chung-phan-biet-duoc]] ·
[[2026-09-18-cta-product-page-giu-add-to-cart-cua-theme]]
