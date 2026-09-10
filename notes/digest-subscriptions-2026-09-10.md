---
type: note
title: Digest Joy Subscription — 2026-09-10 (dựng lại portal Wholefoods theo ảnh, 2 ticket Slack, cờ DevZone)
summary: 11 task extension "xong" hoá ra sai toàn bộ về bố cục vì mọi lượt verify đều so `document.body.innerText` chứ chưa ai nhìn màn hình; vòng dựng lại lộ ra một họ bug lặp lại (cột `auto` nuốt hết bề ngang, `useFetchApi` mount sớm nên không bao giờ fetch, destructure không guard làm sập cả portal), cộng hai ticket Slack có root cause khác hẳn giả thuyết đầu và một cờ DevZone thay cho suy diễn từ `autoSwap`.
tags: [avada, subscription, shopify, extensions, debug, agent]
created: 2026-09-10
updated: 2026-09-10
source: project `subscriptions` — session history (44297bec đuôi, 0fb64e0c dựng lại visual, 151a3b81 ticket Slack, a6d752f1 DevZone)
---

CHỈ phần mới so với [[digest-subscriptions-2026-09-09]] (dựng extension, 401 header, Rules of Hooks,
tầng phân quyền 18 hàm — không lặp lại). Việc của lượt này là **sau khi 11 task đã "xong"**.

Bài học lớn nhất của lượt này đã tách riêng: [[so-anh-khong-so-chu]].

## Bugs

**Section rỗng nhưng vẫn được tính là "đã render".** `groupDeliveryLines` phân loại line bằng
`__box_id` / `__fixed_bundle_staple`; contract nào không mang marker rơi khỏi cả ba nhóm ⇒ khách thấy
heading `Your weekly subscription` trên **không có gì**. Fallback tôi viết sau đó cũng sai một lần
nữa: `contract.lines` là mảng **rỗng** (truthy) nên box rơi vào `ONE-TIME ITEMS`.

**Cột `auto` không ràng buộc bề ngang thì nó nuốt cả hàng.** `InlineLayout columns={['auto','fill','auto']}`
làm title sản phẩm **vỡ thành mỗi dòng một ký tự**, card cao ~2000px — cột `auto` chứa 3 button label
dài (và ở chỗ khác là `<Image>` không ràng buộc tỉ lệ) chiếm hết, cột `fill` co còn vài px. Sửa xong ở
`DeliverySection` mà **không grep pattern** ⇒ `OrderDetail.js:315` giữ nguyên đúng lỗi đó; user chỉ ra.
Cách sửa đúng cuối cùng là **dùng chung `DeliverySection`** thay vì viết lại row lần hai.

**`useFetchApi` mount trước khi có dữ liệu phụ thuộc ⇒ không bao giờ fetch.** `initLoad` chỉ được đọc
một lần lúc mount với deps `[]`; `History` mount khi `contract` còn rỗng ⇒ `initLoad: false` ⇒ kẹt
skeleton vĩnh viễn. Bằng chứng phân biệt được: probe đếm `STILL_PENDING 0` mà **không có `RESOLVED`
nào** ⇒ request chưa từng được gửi, tức "không phải chậm, là không fetch". Cùng lỗi tái xuất ở endpoint
`product-scopes` (menu `⋯` hiện sai nhãn vì `isBox` luôn false).

**Cùng hook đó nuốt `error`.** `Subscriptions.js` destructure `{loading, data}` mà bỏ `error` ⇒ fetch
fail hiển thị *"No subscriptions"* trong khi khách có 10 contract. `General.js` đã có `settle()` xử lý
đúng lớp này; màn list không được kế thừa.

**Guard `|| []` chỉ chặn null, không chặn sai kiểu.** `(products || []).filter is not a function` —
`useFetchApi` gán thẳng `respData.data`, endpoint trả object thì `products` là object và `|| []` vô
dụng. Guard đúng là kiểm `Array.isArray`.

**Destructure không default làm sập cả portal, và nó có sẵn từ trước.** `calculateCurrentPriceByTier`
destructure `productPlan`; line nào tra plan không ra là trắng trang. Crash **phụ thuộc dữ liệu** nên
contract này render bình thường còn contract kia sập — dễ bị quy oan cho thay đổi vừa làm.

**Test xanh cả khi bỏ guard.** Mutation-check bắt được: test không chạm đường crash vì fixture do tôi
bịa (`contract.plans` là **mảng** chứ không phải map; `__selling_plan_id` seed không khớp cái
`calculatePricing` tra). Suýt đưa nó ra làm bằng chứng. → [[fixture-khong-phai-hop-dong-du-lieu]]

**Controller ghi đè sort mặc định bằng `undefined`.** Repository mặc định
`sort = {field:'createdAt', direction:'desc'}` nhưng controller truyền `undefined` đè lên ⇒ list luôn
trả 10 contract cũ, contract vừa tạo không bao giờ lên. Đây là lý do mọi lần verify "contract mới
không thấy" trước đó đều đi tìm sai chỗ.

**`String(x).endsWith('')` luôn `true`.** Chế độ PATCH truyền `boxVariantId: ''` ⇒ **mọi** line bị gán
là box ⇒ xoá sạch marker staple của cả 5 line. Bắt được trước khi ghi tiếp, nhưng chỉ vì đi kiểm chứ
không vì test.

**`LIMIT=0` trong Firestore nghĩa là KHÔNG giới hạn.** Script dọn 8 doc rồi ghi lại 16. Và script seed
**tự tạo lại sau khi dọn** vì thiếu guard clean-only mà script migrate đã có — nên hai lần báo "đã
xoá" đều sai, doc vẫn nằm đó.

**Báo "đã thêm" dựa trên `grep` sai.** `grep` qua wrapper trả 0 match cho cả từ vốn có sẵn trong file
⇒ kết luận ngược. Hai lần vấp: một devzone action tôi khai là "added" **chưa từng tồn tại**, và hai
test mới không hề được thêm vì anchor string không có trong file đó. Đọc lại bằng python mới ra sự
thật. Nối tiếp cụm gotcha `rtk` ở [[digest-subscriptions-2026-09-09]].

### Hai ticket Slack

**SB-16667 — bundle ATC không mở cart drawer.** Giả thuyết đầu (`getConfig.js` hardcode
Atelier/Refresh) chỉ là một tầng. Root cause thật ở store báo lỗi: theme **Minimog** đăng ký drawer là
`<m-cart-drawer id="MinimogCartDrawer">` với method `open()` và pub/sub riêng (`MinimogEvents`) —
không nằm trong danh sách `CART_DRAWER_ELEMENTS`. Counter số lượng chạy (chứng minh
`updateThemeCartCount` đã ăn) trong khi drawer không mở là **triệu chứng phân biệt được** hai tầng đó.
Test được khoá bằng cách bỏ selector ra thì phải đỏ. MR !2569 (merge) → !2572 (Minimog).

**SB-16672 — ChunkLoadError, chunk lazy-load 404 trên CDN.** Bug hệ thống, không phải của riêng shop
Pháp; kiểm chứng bằng `curl` chứ không suy luận. Hướng vá hai lớp: sửa CI (Layer 1) + retry chunk phía
client (Layer 2). *Chi tiết cơ chế CI chưa xác minh trong note này.*

**Contract 21859533043 — 2 đơn sát nhau.** Agent đo trên toàn prod và kết luận **có nguy cơ charge
trùng thật**, hạn 12/09. Đơn thừa cycle 16 đã reset sạch (21 doc, `cycleIndex` duy nhất, không còn
ngày trùng). *Phần "nguy cơ toàn prod" chưa xác minh lại độc lập — cần đọc lại trước khi hành động.*

## Techniques

- **Backend local phải có host HTTPS công khai.** `yarn dev` + `emudev` phục vụ `http://127.0.0.1:5002`;
  Tailscale Funnel (`rm.eel-wrasse.ts.net`) bọc HTTPS. Trỏ `NEW_CP_BASE_URL` vào đó khi test và
  **revert trước mọi commit** — file này dùng chung với portal cũ.
- **Chrome chặn mặc định.** Host Tailscale resolve về `100.x` nên Private Network Access từ
  `extensions.shopifycdn.com` bị từ chối. Cờ cũ không ăn vì Chrome đã **đổi tên** tính năng: phải thêm
  `LocalNetworkAccessChecks,LocalNetworkAccess` vào `--disable-features`.
- **`shopify app dev` chỉ watch `extensions/<name>/`.** Sửa `packages/functions/src` không rebuild
  bundle. Không cần restart — **chạm một file trong extension** là dev build lại trong ~4 giây.
- **Không tin "đã deploy" — grep bundle.** So mtime `.shopify/dev-bundle/<uid>/dist/*.js` với
  `find extensions/<name>/src -newer` trước khi đọc bất kỳ kết quả nào; build hỏng để lại bundle cũ
  đang phục vụ và trang trông vẫn bình thường.
- **Muốn contract dev "mô phỏng logic thật" thì gọi đúng đường app.**
  `POST /api/v1/subscription-contract/manual-create` tạo contract **thật trên Shopify** (qua
  `subscriptionContractAtomicCreate`) nhưng không ra được fixed bundle; phần sync về app nằm ở chính
  **webhook handler** `handleSubscriptionContractCreate({shop, data, skipActivityCheck})` — gọi thẳng
  hàm đó mới là chạy logic thật.
- Ba cái bẫy khi viết command đứng ngoài app: lib khởi tạo Firestore qua **default app** (tạo app có
  tên thì lib không thấy); script chạy từ `src/` không resolve alias `@functions` (command khác trong
  repo require từ `lib/` → phải build); `subscriptionDraftUpdate` **thay cả mảng** customAttributes nên
  xoá mất `_joy_source: 'manual'` — phải merge.
- Contract thật của store prod **không có mảng `lines`** — nó dùng `products` / `productIds` /
  `lineIds`, và `customAttributes` nằm ở tầng khác. Đó là lý do helper viết theo `lines` chạy đúng trên
  fixture và rỗng trên dữ liệu thật.

## Context

- **Staples = sản phẩm cùng plan với product fixed bundle trong contract, và LOẠI BỎ mọi fixed bundle.**
  Tôi tự suy ra thành "offer của box" và làm rỗng danh sách; user chỉnh lại. Tham chiếu:
  `planProductFilter` trên nhánh `feat/joyxjoy-landing`. One-off thì hiện tất cả product trừ fixed bundle.
- Bật theo cờ, không hardcode domain: `shops/{id}.enabledFixedBundleStaples` + pin field plans lên
  doc contract, ghi ở ba đường (devzone toggle, lúc contract create khi cờ bật, command backfill).
  Endpoint `product-scopes` thuần đọc, additive.
- `Need more staples?` ghi vào **contract**; `This week's one-off items` ghi vào **order kế tiếp**
  (`PUT /order/product/add` với `cycleIndex` của chính order đó) — đã xác nhận bằng code, không theo trí nhớ.
- Refactor `sellingPlanVariables` từ 4 tham số vị trí sang object param — `git grep` xác nhận **11/11**
  call site đã đổi, gồm cả test đang assert theo vị trí.
- MR đã tạo: !2569, !2572 (cart drawer), !2573 (cờ DevZone + refactor trên).
- Quyết định của lượt này: [[2026-09-10-cutoff-theo-delivery-day]] ·
  [[2026-09-10-devzone-hide-recurring-pricing]].

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-09-09]] · [[so-anh-khong-so-chu]] ·
[[cau-extension-chay-that-tren-store]] · [[bang-chung-phan-biet-duoc]] ·
[[fixture-khong-phai-hop-dong-du-lieu]] · [[ack-khong-phai-hieu-ung]]
