---
type: note
title: Shipped Joy Subscription — commit landed 2026-08-12 (v2.34.64→65)
summary: Commit landed 08-12 — master nhận 3 MR / 2 tag: Volume Bundle native quantity-break SB-13947 cuối cùng cũng merge sau ~1 tháng (`v2.34.64`, `[deploy-extensions]`), và hai fix cùng một họ "ghi giá vào đúng dòng đã tính giá" (price sync `v2.34.65` + bulk swap); trên nhánh: đường token refresh-aware bật mặc định + fix parse cờ đóng đúng mục treo của digest 08-12; không revert, không migration.
tags: [subscription, shopify, avada, backend, auth, extensions]
created: 2026-08-13
updated: 2026-08-13
source: repo "subscriptions" (Joy Subscription) — git log 2026-08-12; mọi hash + tag + số MR lấy nguyên từ log, nhánh suy từ ref decoration
---

# Joy Subscription — shipped 2026-08-12

> Ngày trước: [[shipped-subscriptions-2026-08-12]] · bối cảnh: [[subscriptions]] ·
> [[subscriptions-debug-runbook]] · [[digest-subscriptions-2026-08-12]].

## Shipped

### Vào master — 3 MR, 2 tag

- **`c687938c7` — tag `v2.34.64`, MR !2321, `[deploy-extensions]`** — *"feat(bundle): Volume
  Bundle (native) — quantity-break discount type"*. **SB-13947 merge sau khoảng một tháng**:
  brain theo dõi nhánh này từ [[subscription-shipped-2026-07-13]] ("chưa merge") qua
  [[shipped-subscriptions-2026-08-04]] (`[deploy-all]` còn trên nhánh) tới
  [[shipped-subscriptions-2026-08-12]] (code-review cleanup 53 file). Số MR **!2321** thấp hơn
  hẳn các MR cùng ngày (!2462, !2463) — đo được tuổi của nhánh bằng chính số MR.
- **`af8421482` — tag `v2.34.65`, MR !2463** — *"price sync writes to the line it priced, not the
  one at the same index"*. Nguồn `2dc2fb9fd` (`fix/line-price-sync`): +49 dòng service, +251 dòng
  test.
- **`b01bd6170` — MR !2462, không tag** — *"bulk swap prices the new variant and keeps the line
  quantity"*. Nguồn `84425caae` (`fix/bulk-swap-price`): +41 dòng service, +255 dòng test.

**Hai fix này là một họ, không phải hai bug rời.** Cả hai đều là *thao tác hàng loạt trên contract
lines dùng vị trí (index) làm khoá thay vì danh tính*: price sync ghi giá vào dòng cùng index thay
vì dòng nó vừa tính giá cho; bulk swap tính giá cho variant cũ và/hoặc làm rơi quantity. Cùng họ
"mỗi surface đọc một nguồn sự thật khác nhau" đã ghi ở [[digest-subscriptions-2026-07-27]] và
[[digest-subscriptions-2026-07-29]] — ở đây là *cùng surface, hai mảng song song trôi lệch nhau*.

### Còn trên nhánh

- **`5bad8ed1e` (`test/line-index-regression`) — bài học test đáng giữ hơn cả bản fix.** Test cũ
  **tự tay dựng sẵn hai mảng đã lệch** ⇒ nó ghim triệu chứng chứ không ghim nguyên nhân. Bản mới
  lái drift qua **`processContractLines` thật** (khách thêm variant thứ hai của sản phẩm đã có
  trên contract ⇒ `products[]` và `lineIds[]` trôi lệch), rồi assert giá rơi đúng dòng nó được
  tính cho. Kèm một assert ngược quan trọng: **positional match KHÔNG đúng, và không được đúng** —
  gom theo product id là **cố ý** để admin list giữ các variant của cùng sản phẩm cạnh nhau.
  ⇒ *fixture tự chế mô phỏng trạng thái lỗi sẽ pass cả trên code sai lẫn code đúng.* Cùng luật
  [[bang-chung-phan-biet-duoc]]. 233 dòng test, 2 file.
- **`14271d400` (`feat/expiring-token`) — đường token refresh-aware, expiring offline token BẬT
  mặc định.** 33 file, +764/−61: `helpers/shopify/accessTokenCache.js` (+61) và `tokenCrypto.js`
  (+20) mới, 4 handler (`api`, `apiSa`, `auth`, `authSa`) cùng thêm 2 dòng, 12 service/controller
  đổi cách lấy token, `package.json` bump 1 dòng (dòng `@avada/core` riêng —
  [[2026-08-11-dong-core-rieng-joysub]]), `commands/README.md` +58. Test đi kèm dày:
  `accessTokenCache.test.js` +291, `tokenCrypto.test.js` +109, `shopifyExpiringToken.test.js` +79.
- **`f140e6006` — chỉ chuỗi `'false'` mới tắt cờ expiring-token. ĐÓNG mục treo của
  [[digest-subscriptions-2026-08-12]]**, ở đó ghi *"logic parse cờ hiện tại khiến `=TRUE` hoặc
  `=1` **tắt** cờ thay vì bật — đã nêu, chưa chốt sửa"*. Nghi ngờ đó **đúng** và nay đã vá
  (9 dòng `config/shopify.js`, +14 test). Ăn khớp với việc chuyển sang mặc định-bật: khi default
  là `true`, mọi giá trị *"trông như bật"* mà bị parse thành tắt là một cách hỏng im lặng.
- **`72088c7eb`** — ghim `staging_1` vào `feat/expiring-token` (1 dòng `.gitlab/ci/staging.yml`).
  Đúng cơ chế "slot staging neo theo `STAGING_BRANCH`" đã ghi ở [[digest-subscriptions-2026-08-12]].
- **`0b523ba6c` (`feat/sb-13947-volume-bundle`) — `[deploy-all]`**, 3 file/+34: mapping
  `aovVolumeMapping.js`, `AovBundleSetup.js` (+27), `aovVolumeController.js`. Nằm **sau** khi
  MR !2321 đã merge ⇒ là phần đuôi, không phải phần được ship trong `v2.34.64`.
- **`ade1e628c` (`feat/sb-15077-mcp-server`) — "i18n"**: 4 dòng `Developers.json` + 19 dòng
  `tasks/lessons.md`. Nhánh MCP (SB-15077, [[shipped-subscriptions-2026-08-12]],
  [[2026-08-12-mcp-settings-allowlist]]) **vẫn chưa merge**.

### Nhiễu / không đọc được

`b2762de9e` (*"[deploy-all]"*) và `c14e7bb15` (*"CI"*) — **không có file stat nào trong log**, tiêu
đề không nói gì. Không suy được nội dung; xem phần ⚠️.

## Reverted

**Không có revert nào**, cả trên master lẫn trên nhánh — khác hẳn chuỗi "merge rồi revert trong
ngày" của [[shipped-subscriptions-2026-07-25]] / [[shipped-subscriptions-2026-07-30]] /
[[shipped-subscriptions-2026-08-12]].

## Deploy notes

- Version: `v2.34.63` → **`v2.34.64`** → **`v2.34.65`**. Lần này **hai tag cho hai MR khác nhau**,
  đọc tag suy ra nội dung được — ngược với "release mù" của
  [[shipped-subscriptions-2026-08-11]] và "một tag bọc 3 MR" của
  [[shipped-subscriptions-2026-08-12]].
- **`[deploy-extensions]`: `c687938c7`** — đã vào master. Volume Bundle là **extension native**
  nên MR này thật sự đổi thứ chạy ở storefront.
- **`[deploy-all]`: `0b523ba6c`** (nhánh volume-bundle) và **`b2762de9e`** (không rõ nhánh) —
  chưa vào master.
- **Không migration, không `firestore.indexes.json`, không `[deploy-functions]`** trong log ngày
  này. Nợ index của nhánh win-back và nhánh MCP ghi ở [[shipped-subscriptions-2026-08-12]] **vẫn
  chưa được trả** (không thấy commit nào đụng tới).
- `72088c7eb` chiếm `staging_1` cho `feat/expiring-token` ⇒ nhánh khác push vào slot đó sẽ **im
  lặng không chạy pipeline**.

## ⚠️ Cần xác nhận

### `[deploy-all]` trần lại xuất hiện — brain đã đặt sẵn đây là tín hiệu cảnh báo

| Nguồn | Nói gì |
|---|---|
| [[shipped-subscriptions-2026-08-12]] (Deploy notes) | *"Sau khi `67aaf13bc` merge thì hai commit kiểu này **không còn cần nữa** — nếu vẫn thấy chúng xuất hiện, resolver chưa được vá trên nhánh đang chạy."* (`67aaf13bc` = fix CI resolver map controller `agentApi` về function của chính nó) |
| log 08-12 | `b2762de9e` — commit tiêu đề đúng chữ **`[deploy-all]`**, không file stat; kèm `c14e7bb15` *"CI"* |

Hai khả năng, **chưa phân biệt được bằng log**: (a) `67aaf13bc` chưa merge vào master nên nhánh
đang chạy vẫn phải ép full deploy — đúng như brain dự đoán; (b) `b2762de9e` thuộc một nhánh khác
đã rẽ trước bản vá, hoặc chỉ là commit rỗng ép chạy pipeline. Cách chốt rẻ nhất:
`git log --oneline master | grep 67aaf13bc` và xem `b2762de9e` nằm trên nhánh nào. Đáng chốt vì
nếu là (a) thì **mọi fix backend cho agent gateway vẫn đang âm thầm không tới staging**.

## Liên quan

[[shipped-subscriptions-2026-08-12]] · [[digest-subscriptions-2026-08-12]] ·
[[digest-subscriptions-2026-08-13]] ·
[[2026-08-11-dong-core-rieng-joysub]] · [[2026-08-12-mcp-settings-allowlist]] ·
[[subscription-shipped-2026-07-13]] · [[shipped-subscriptions-2026-08-04]] ·
[[digest-subscriptions-2026-07-27]] · [[digest-subscriptions-2026-07-29]] ·
[[bang-chung-phan-biet-duoc]] · [[subscriptions]] · [[subscriptions-debug-runbook]]
