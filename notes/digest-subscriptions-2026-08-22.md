---
type: note
title: Digest Joy Subscription — 2026-08-22 (landing joyxjoy chạy thật + responsive)
summary: Lazy-fetch chưa từng chạy vì gọi `/collections/{h}/products.js` thay vì `.json`; `1fr` trong grid là `minmax(auto,1fr)` nên tràn; push section và template cùng lệnh làm Shopify âm thầm vứt setting mới; và seed qua route HTTP thật kéo theo publish + rebuild metafield mà ghi thẳng Firestore không có.
tags: [subscription, shopify, storefront, preact, debug, avada]
created: 2026-08-22
updated: 2026-08-22
source: project "subscriptions" — session history (BRIEF-CUSTOM, landing joyxjoy)
---

Nối tiếp [[digest-subscriptions-joyxjoy-2026-08-20]] và [[digest-subscriptions-2026-08-21]] — chỉ phần **mới**.

## Bugs

**Lazy-fetch chưa từng chạy một lần nào.** Code gọi `/collections/{handle}/products.js` — đuôi đúng là **`.json`**. Mọi lời gọi 404, bị `catch` nuốt im lặng, nên "All" luôn rỗng. Tôi đã chẩn đoán nhầm hai lần là "collection chưa publish ra Online Store" vì 404 hợp với giả thuyết đó. Kèm hai giới hạn phải biết: endpoint mặc định trả trang đầu, cần `?page=` + `?limit=250`; và trong Liquid `collection.products` **âm thầm cap ở 50** nếu không `{% paginate %}`.

**`1fr` trong grid không phải `minmax(0,1fr)`.** Bare `1fr` = `minmax(auto,1fr)` nên item không co dưới nội dung → trang tràn ngang ở **mọi** bề rộng, kể cả 1600px. Fix: `minmax(0,1fr)` trên track + `min-width:0` trên item.

**Bottom sheet chỉ mở 44px.** `@media(max-width:960px){.jw-summary-aside{display:none}}` ẩn luôn bản nằm *trong* sheet; override chỉ đặt `width` mà quên `display`.

**Push section + template trong cùng một lệnh làm mất setting mới.** Setting `collection_list` bị Shopify **loại bỏ im lặng** khỏi template vì nó kiểm template trước khi schema mới của section kịp cập nhật. Phải push **section trước, template ở lệnh riêng**. Cũng ở đây: `name` của section/block giới hạn **25 ký tự**, và `shopify theme check` KHÔNG bắt lỗi này — chỉ lộ lúc push.

**Step 2 và step 3 hiện y hệt nhau** vì `LandingApp.js:183-184` truyền **cùng một mảng `categories`** cho cả hai section.

**Ô search luôn mở 192px** trong khi mockup là nút tròn 42px, focus mới bung — `SearchBar.js` thiếu hẳn trạng thái đóng/mở, icon SVG và phần đếm kết quả. `handleBlur` đọc **prop `value`** (controlled, cha cập nhật bất đồng bộ) nên lúc blur còn giữ chữ cũ → phải đọc `event.target.value`.

**`duplicateResolutionMode: REPLACE` không hỗ trợ cho `GENERIC_FILE`** — mỗi lần upload bundle lên Shopify Files sinh một file có hậu tố UUID, tích rác dần.

## Techniques

**Seed qua đúng luồng HTTP của app làm được nhiều hơn ghi thẳng Firestore** — nó publish sản phẩm và tự `rebuildCustomLandingMetafield` (14 bundle xuất hiện trong `avada_custom_landing` mà không phải làm gì thêm). Đường local: `POST http://localhost:5012/<project>/us-central1/apiSa/apiSa/fixed-bundle` — chú ý **`apiSa` hai lần, không có `/v1`**; auth bằng header `x-auth-token` (Firebase ID token có custom claim `shopID`, `verifyRequest.js:120,131`); và **bắt buộc gửi `Accept: application/json`**, nếu không lỗi trả về HTML với HTTP 200. → [[2026-08-20-seed-dev-qua-luong-http-that]]

**Vòng nghiệm thu lặp được:** build → upload bundle lên Shopify Files → push template → **đo bằng Playwright trên trang thật** (storefront password `1`, `channel:'chrome'`). Vòng này bắt được đúng những thứ không report nào và không gate nào thấy: widget không mount, `div:empty` ẩn thumbnail, tràn ngang ở cả 10 khổ, sheet 44px, tab "All" rỗng.

**Giữ `console.warn` sống qua Terser `drop_console`** bằng tham chiếu gián tiếp thay vì sửa webpack config dùng chung cho 6 bundle:
```js
const target = typeof window !== 'undefined' && window.console ? window.console : console;
target.warn(...);
```
Xác nhận trong bundle đã minify chứ không tin build log.

**`Control+A` trên macOS là "về đầu dòng", không phải select-all** — test Playwright của tôi tưởng đã xoá ô search mà thật ra chưa; tín hiệu nằm ngay trong output của chính tôi (`count` vẫn "9 results").

**Agent báo cáo lại việc cũ như thể vừa làm** — kiểm bằng **mtime của file** (`14:01:15`, trước cả lúc tôi gửi yêu cầu) chứ không đọc report. Nhưng cũng phải đính chính: một lần tôi kết luận sớm, agent thực sự đang ghi dở lúc tôi grep.

**Monitor canh file phải canh mtime đổi, không canh file xuất hiện** — report của lane đã tồn tại từ vòng trước; một lần tôi chụp mtime baseline đúng lúc lane vừa ghi xong nên waiter treo vô hạn.

## Context

- Parser của tôi bỏ sót hẳn mảng `ONEOFF` (23 handle) trong mockup vì regex chỉ bắt `BOXES|STAPLES|CATS|VENDORS` — con số "4 UPDATE không khớp kỳ vọng" mới là thứ lộ ra nó.
- Cài section vào theme **không** tự động hoá được bằng token app (`themeFilesUpsert` → `ACCESS_DENIED`, cần exemption của Shopify); Shopify CLI thì làm được. Nhưng CLI push **file trong repo nguyên trạng**, nên `bundle_script_url` mà script cài đặt định set không bao giờ được áp — theme âm thầm trỏ vào CDN prod chưa từng deploy. User bắt được chỗ này.
- Ghi vào theme **live** kèm `--force` bị harness chặn — chặn đúng, không tìm cách lách.
- Trần bundle 30KB tôi tự áp không tồn tại → xem [[digest-subscriptions-2026-08-19]]; bổ sung: **tách component KHÔNG giảm size bundle**, chỉ `import()` code-splitting mới giảm. Và Web Component/Shadow DOM là **không nên** ở đây — đo trên theme khách chỉ có `blockquote`/`hr`/`summary` là bare element selector, 202 rule còn lại đều scope dưới class của theme.
- `gates.sh` **không chạy jest cho `packages/scripttag`** (chỉ `functions` và `assets`) — phát hiện về hạ tầng test, không phải về task.
- `helpers/logger.js` mà `CLAUDE.md` bắt dùng **không tồn tại**; 128 file trong `services/` dùng `console.*`. Luật thứ hai của repo chỉ tồn tại trên giấy.
- Kỷ luật chia lô agent song song: **grep vùng file thật mỗi vòng** thay vì phỏng đoán, và cố ý **verify tuần tự** khi mutation test của verifier sẽ build/jest đè lên file agent khác đang sửa.
- `9/14 box thiếu selling plan` và `12/14 thiếu ảnh` sau lần clone — script kiểm `userErrors` và exit 0 mà group không tồn tại trên sản phẩm. ⚠️ **chưa giải thích được**, còn treo.

Liên quan: [[subscriptions]] · [[digest-subscriptions-joyxjoy-2026-08-20]] · [[digest-subscriptions-2026-08-21]] · [[shipped-subscriptions-2026-08-22]] · [[2026-08-19-page-custom-o-theme-khach]] · [[2026-08-20-seed-dev-qua-luong-http-that]] · [[bang-chung-phan-biet-duoc]]
