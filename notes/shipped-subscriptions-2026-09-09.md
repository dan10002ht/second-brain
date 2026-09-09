---
type: note
title: Shipped Joy Subscription — commit landed 2026-09-08
summary: Master nhận 6 tag trong một ngày (`v2.35.12`→`v2.35.17`), trong đó `v2.35.16` mở lại ts-tool API trên prod sau ~12 ngày cả fleet bị 403 và `v2.35.15` `[deploy-extensions]` sửa giá recurring của widget cho sản phẩm auto-swap; khối lượng nặng nhất còn trên nhánh — Auto swap rule/allowlist (+9.456 dòng, có `firestore.indexes.json`), select-all bulk action theo filter (+3.259), và landing joyxjoy SB-16578/16593 chạy suốt ngày. Một revert UI trong ngày (sticky summary).
tags: [avada, subscription, shopify, auth, billing, extensions, firestore]
created: 2026-09-09
updated: 2026-09-09
source: repo `subscriptions` — git log 2026-09-08 (hash đã xác minh trong log)
---

Ngày 09-08 master nhận **6 tag** (`v2.35.12` → `v2.35.17`) cộng 4 MR không tag.
Nối tiếp [[shipped-subscriptions-2026-09-08]].

## Shipped

### Master

| Tag / hash | Việc |
|---|---|
| `99da9eeac` **v2.35.17** (!2549) ← `0913ee5fb`, `ee4de8588` | **Customer portal hết màn trắng và click câm.** Portal trước đó không render gì cho tới khi xong cả chuỗi boot (preload locale → verify session customer account → lazy chunk sau `Suspense` fallback rỗng). Thêm `SkeletonPortalPage` **mang style riêng** để không phụ thuộc CSS nằm trong lazy chunk, render ngay sau khi tìm thấy container — tức trước chuỗi `await`. Analytic number cũng skeleton thay vì hiện `0/0/0/0`, payload default là object để total không bao giờ `NaN`. Vế thứ hai: nút *Add new subscription* ở shop có default bundle mở trang ngoài mà **không phản hồi gì**, khách mạng chậm bấm nhiều lần mở nhiều tab → `openTabWithLoading` (nhả cờ ở `focus`/`visibilitychange`, fallback 5s phòng popup bị chặn), chỉ dùng ở nhánh custom của `getHelperConfig`. |
| `401aeeb85` **v2.35.16** (!2546) ← `1dcfcb40d` | **Mở lại ts-tool API trên prod, chỉ chặn op cấp entitlement/plan/billing.** Xem [[2026-09-09-ts-tool-prod-scope-theo-op]] và ⚠️ bên dưới — đây là đảo hướng, không phải bugfix thường. |
| `6d6633ce6` **v2.35.15** `[deploy-extensions]` (!2547) ← `17ffafd53`, `0aed9c058` | **Widget hiện giá recurring theo sản phẩm auto-swap.** Dòng "First payment X, then Y" tính cả hai giá từ variant gốc, nên từ đơn #2 — khi plan auto-swap giao sản phẩm khác — hiện sai (ranvoostyle: `149.99−6=143.99` thay vì `19.99−6=13.99`). Gate theo `shop.enableAovBundleSwap`: chỉ shop thực sự reprice lúc swap (`autoSwapService` mode `catalog`) mới hiện giá mới; shop không bật vẫn giữ giá gốc khi swap nên text cũ đúng. Lấy giá của **phần tử đầu list rotation** vì đơn #2 luôn giao entry đầu tiên. Đáng ghi: `prepareSubscriptionProductV2` **có 2 bản trùng nhau** (`app-embed.liquid` + `DisplayManager.js`) đều destructure bỏ rơi `autoSwap` — phải sửa cả hai. Metafield lưu **cents**, widget dùng shop currency → `normalizeAutoSwapPrices.js`. Verify trên store test: `First payment $9,499.05, then $624.95`. |
| `70f6520ff` **v2.35.14** (!2544) ← `50d6d0449` | **tielenergy: nút Add subscription đi thẳng build-a-box + hiện đơn mang sang từ app cũ.** Shop bán subscription dạng box dựng sẵn nên subscription tạo qua modal chọn lẻ **không fulfil được** → `ADD_SUBSCRIPTION_REDIRECT_PATH` + hook `overrideHandleClickAddNewSubscriptionButton` đẩy sang `/pages/build-a-box`; shop không có trong map giữ nguyên modal. Contract import từ app khác đếm cycle lại từ 0 nên khách nhiều năm vẫn đọc "Total successful orders: 0" → `getDisplayedOrderCount` cộng lại số của app cũ từ field `importedOrderCount` **chỉ để hiển thị**, cố ý KHÔNG gộp vào `getContractBillingCycle` vì hàm đó còn chạy luật min/max order — thổi phồng ở đó sẽ làm contract migrate **hết hạn sớm**. Kèm `backfillImportedOrderCount.js` (dry-run mặc định) đọc từ CSV bàn giao. Nối [[digest-subscriptions-tielenergy-2026-09-08]]. |
| `1de77bac3` **v2.35.13** (!2535) ← `ef0fffc80` | **Store credit đã trừ hiện đúng trên 4 màn order** — xem ⚠️ bên dưới, vế fix hôm nay chứng minh vế hôm qua chưa chạy. `storeCreditApplied` **chưa bao giờ chạm collection `orders`**, chỉ tới `backgroundActivities`; doc `orders` thật do `syncBillingAttempt` ghi mà hàm này chỉ persist thứ nằm trong `additionalData` (trước đó chỉ có `{plan}`). Fix: `processBillingAttempt` trả thêm `storeCreditResult` đẩy vào `additionalData`. Bằng chứng staging `orders/mSIMt9wNHsoScibXS0Yi`: `orders` có `pendingStoreCredit 100000` không có `storeCreditApplied`, `backgroundActivities` thì ngược lại; quét cả project **0 doc `orders`** có `storeCreditApplied`, **5 doc BILLED** còn kẹt `pendingStoreCredit > 0`. Regression test pin đúng boundary `additionalData` (gỡ fix → 2/3 case fail). |
| `3a2c31b28` **v2.35.12** (!2541) ← `a8f2eb32b` | **Mở khoá toàn bộ bulk subscription action, bỏ gate growth-hack + helptext "contact us".** Chỉ 2 file, −38 dòng ở `Subscriptions.js`/`.json`. |
| `bc05b0c17` (!2537) | **Command ops gỡ product variants khỏi delivery profile subscription (SB-16531)** vào master — chốt việc còn treo ở [[shipped-subscriptions-2026-09-08]]. Xem [[2026-09-08-go-variants-khoi-delivery-profile]]. |
| `24af28a14` (!2548) ← `a7f1c8cbc`, `5970f6cfc`, `a6bc66b61` · `69b8c4e7f` (!2543) ← `655bd342c` · `72fafe544` (!2551) ← `663c39146` | **Mockup/PRD của BA** (đường auto-merge tài liệu, [[2026-08-06-auto-merge-mr-tai-lieu-ba]]). Banner cross-app Joy đặt **inline trong slot AOV đang cho thuê** thay vì modal bung giữa màn như 5 host trước. `663c39146` to bất thường — **298 file, +23.938**: demo store Joy Wholefoods + customer portal tĩnh (`store.html` 12.744 dòng, `landing.html` 7.554, ~250 ảnh) kèm `vercel.json`, tức bản demo này deploy độc lập chứ không nằm trong app. |

### Trên nhánh

| Nhánh / hash | Việc |
|---|---|
| `feat/adama-auto-swap-setting` — `68905587f` | **Auto swap rule + swap allowlist**, 85 file, **+9.456**. Nguyên một khu Settings mới (`AutoSwapRule/` ~20 component + hooks + helpers), `autoSwapRuleController` + repository + `autoSwapRuleService` + `swapGuardService` + `swapAllowlist.js` (345 dòng), tách `autoSwapLegacyConfig` khỏi `autoSwapRuleConfig` (giữ đường cũ sống), 7 file locale +102 dòng mỗi file, e2e admin + storefront. **Có `firestore.indexes.json` (+14)** và sửa `.gitlab/ci/staging3.yml` (neo slot staging theo nhánh). Đây chính là phần code cho PRD *Auto swap* mà [[shipped-subscriptions-2026-09-08]] ghi là "đang spec lại, chưa có code". |
| `feat-select-all-subs` — `568ffc10b`, `28fd817a1` | **Select-all toàn bộ contract theo filter, xử lý theo chunk** — 49 file, **+3.259**. Mọi hook bulk (12 cái) đi qua `bulkSelectionService`; `bulkActionHandler` xử lý theo chunk thay vì nhận danh sách id. `28fd817a1` vá tiếp: `skippedContractIds` của job bulk swap cũ **rò rỉ sang job mới** — cùng họ với bug `skippedContractIds` đã ghi ở [[shipped-subscriptions-2026-09-08]]. |
| `shipping-profile-clear-variants` — `509694764`, `23ef98e39`, `529487f6b`, `816e3c2a0` | **Bốn vòng làm cứng command SB-16531** sau khi bản đầu đã merge: bỏ hẳn Firebase (chỉ còn Shopify), nhận **access token hash + key qua env** thay vì raw token, tự chứa để chạy thẳng `node src` không cần build, và đổi thứ tự thao tác — **gỡ selling plan group trước rồi mới gỡ variant, xác nhận lại sau mỗi mutation**. Việc phải xác nhận lại sau từng mutation đúng họ [[ack-khong-phai-hieu-ung]]. |
| `feat/joyxjoy-landing` — ~20 commit (`7f9256bd2`, `be6b4c0c2`, `8dd4afadb`, `beb627724`, `d69ba707d`, `0814b1179`, `94fb9cdc8`, `6f514db54`, `a1f2a4b68`, `efac80f23`, `51f093942`, `553d46637`, `ad58c34bf`, `722176440`, cụm typography `f6ecc6915`/`8969faf34`/`314ecff92`/`7c347dd91`/`22fb9329a`/`ddb82f89f`/`9f9908fe6`/`6d0f847d7`/`11ea9e04b`, `3485b6ac1`) | **Landing joyxjoy SB-16578/16591/16593/16574/16592** chạy trọn ngày. Đáng giữ: (1) **box thành optional** — subscription chỉ-staples dựng từ mảng selling plan (`8dd4afadb`); (2) **step 2 chỉ hiện staple nằm trong plan**, snapshot đẩy qua metafield (`be6b4c0c2`) và khi **chưa có snapshot thì không hiện gì thay vì hiện hết** (`3485b6ac1`) — chọn fail-closed; (3) CTA trên PDP đi **đường Custom Liquid**, bỏ hẳn bản snippet trùng lặp (`722176440`) sau khi đã đi qua section → snippet block → extension block; (4) `a1f2a4b68`: **tag Liquid nằm trong comment CSS làm vỡ syntax** khi dán vào Custom Liquid — comment không bảo vệ được Liquid; (5) `94fb9cdc8` `normalizeStorefrontProduct` chuẩn hoá shape prefetch về shape Liquid, đóng tiếp chủ đề "hai nguồn trả shape khác nhau" của [[digest-subscriptions-2026-09-08]]. |
| `Feature/fix-index-trial` — `a606d1f02`, `561b932b5`, `9caa1da49` | **Ba lát tiếp của trial × discount tier.** (a) Tắt trial phải trả tier về vị trí cũ: `handleToggleTrial` chỉ xử lý nhánh bật (`if (!enabled) return`) nên tier bị đẩy #1→#2 kẹt lại; `preTrialTiersRef` chụp bản nguyên gốc, chỉ restore khi danh sách hiện tại vẫn **đúng bằng kết quả clamp của bản chụp** — merchant tự sửa sau khi bật trial thì giữ nguyên sửa của họ. (b) Bỏ tier 0% ảo của trial khỏi dòng tóm tắt. (c) `9caa1da49`: bộ lọc `isTrialFillerTier` chỉ khớp filler `{1,1}` nên khi merchant xoá tier giữa (tier còn lại *Apply from #3*), filler thành `{1..2}` và lọt xuống thành "next 2 orders 0%" → thay bằng `trimTrialFromFillerTier` (cắt phần trial ra khỏi filler thay vì lọc cả cụm). |
| chưa rõ nhánh — `a75e598b8`, `427d86987` | **Hai bug cùng một gốc: `currentBillingCycle` là SỐ ĐƠN ĐÃ TẠO, không phải cycle của dòng sắp tính tiền.** `a75e598b8`: 2 trong 4 đường thêm line **thiếu `+ 1`** (`prepareLineAddPayload.js:55` từ customer portal, `bulkAddProducts.js:217` truyền thẳng dù `buildAddedLinePricing` khai rõ "1-based") ⇒ contract ở cycle 1 (5%) thêm sản phẩm bị đóng giá 5% thay vì 50%, và **giá đó ghi thẳng vào `pricingPolicy`** nên đơn upcoming sinh ra vẫn sai. `427d86987`: màn order detail gọi `calculatePricing` không truyền `billingCycleOverride` nên rơi về cycle upcoming gần nhất bất kể đang mở đơn nào — cùng màn hiện 3 con số của 3 cycle khác nhau (dòng sản phẩm $712.50 cycle 2 SAI, badge 50% cycle 3 đúng, Billing details $375.00 đúng). Cùng họ "mỗi surface đọc một nguồn khác" của [[digest-subscriptions-2026-07-29]]. |

## Reverted

- **`6da6bfa29` — Revert `765a05eda` trong cùng ngày (SB-16578, sticky summary).** Sáng bỏ ghim
  summary "để summary, lưu ý và FAQ liền mạch như mockup", chiều trả lại vì **khách muốn giữ sticky
  summary, FAQ cuộn xuống mới thấy**. Khôi phục nguyên `measureStickyHeader.js` (44 dòng). Sau đó
  còn 5 lượt chỉnh sticky nữa trong ngày. Đây là vòng lặp thẩm mỹ theo yêu cầu khách, **không phải
  đảo hướng kỹ thuật** — nhưng nó cho thấy mockup không phải nguồn cuối cùng cho SB-16578.
- **`0aed9c058` "Clean code"** — 3 file, −8 dòng, dọn sau `17ffafd53`. Chore thuần.

## Deploy notes

- **6 tag trong một ngày**: `v2.35.12` → `v2.35.17`, không có khoảng trống.
- **Một cờ deploy**: `[deploy-extensions]` trên `6d6633ce6` (v2.35.15) — đúng, vì fix chạm
  `extensions/theme-app-extension/blocks/app-embed.liquid`. Không có `[deploy-functions]`,
  không `[deploy-all]`.
- **`firestore.indexes.json` (+14) còn trên nhánh** `feat/adama-auto-swap-setting` (`68905587f`).
  Feature Auto swap rule sẽ cần deploy index cùng lúc với code — cùng bẫy đã ghi cho
  `feat-email-daily-cap` ở [[shipped-subscriptions-2026-09-08]].
- **Không có file migration SQL.** Chữa dữ liệu vẫn đi bằng script tay
  (`backfillImportedOrderCount.js` dry-run mặc định, `clearDeliveryProfileVariants.js`).
- **`v2.35.16` là bản sửa lỗi phát hành, không phải feature**: nó gỡ hậu quả của một release cũ
  (`v2.34.91`, 27/08) đã làm ts-tool API 403 trên prod suốt ~12 ngày. Xem ⚠️.
- `.gitlab/ci/staging3.yml` đổi 1 dòng trong `68905587f` — neo slot staging 3 về nhánh auto-swap,
  đúng cơ chế `STAGING_BRANCH` đã ghi ở [[digest-subscriptions-2026-08-12]], không phải rút feature.
- `72fafe544` (!2551) kéo **298 file / ~250 ảnh** vào repo app cho một demo tĩnh deploy bằng
  `vercel.json`. Chưa rõ có chủ ý giữ lâu dài trong repo này không — đáng hỏi trước khi nó lặp lại.

## ⚠️ Cần xác nhận

**1. `resync-order` trên prod: brain nói bị chặn cứng, commit hôm nay nói đã mở lại.**

- [[digest-subscriptions-2026-09-04]] ghi (JSUB-260828): *"`PUT /resync-order/:orderId` **không dùng
  được** — `middleware/tsToolAuthMiddleware.js` chặn hẳn trên prod"*, và đó là lý do phải viết
  command scan read-only thay vì chữa. Dòng trong `index.md` cũng chốt *"`resync-order` bị chặn cứng
  trên prod"*.
- Commit `1dcfcb40d` (merge `401aeeb85`, **v2.35.16**) nói ngược: guard đó do `7238937df` đặt **ở
  đầu** `tsToolAuthMiddleware`, làm **toàn bộ** `/api/v1` ts-tool trả `403 DEV_ZONE_DISABLED` trên
  prod *"cho mọi shop từ bản phát hành 27/08 (`v2.34.91`) trở đi, không chỉ đường ghi dev-zone"*, và
  nay `sync/resync` đã chạy lại được trên prod dưới key auth cũ.
- **Cả hai đều đúng tại thời điểm của mình** — nhưng note 09-04 sẽ đọc như "sự thật hiện tại" nếu
  không sửa. Cần: xác nhận `v2.35.16` đã deploy prod chưa, rồi cập nhật câu đó ở
  [[digest-subscriptions-2026-09-04]] + dòng tương ứng trong `index.md`. Chi tiết quyết định ở
  [[2026-09-09-ts-tool-prod-scope-theo-op]].

**2. Store credit trên 4 màn order: note hôm qua mô tả nó đã chạy, commit hôm nay nói field không tồn tại.**

- [[shipped-subscriptions-2026-09-08]] mô tả `8ce66e720`: *"Cả 4 đọc **snapshot post-credit đã lưu
  trên order doc**"* — đọc như một việc đã xong.
- `ef0fffc80` (landed `1de77bac3` **v2.35.13**) nói: *"commit hiển thị `8ce66e720` đọc một field
  không tồn tại: đơn đã bill vẫn 'nhìn như chưa trừ' ở cả 4 màn"*, kèm phép quét *"0 doc `orders` có
  `storeCreditApplied`"*.
- Không mâu thuẫn về thực tế — vế hiển thị đúng, vế ghi chưa có — nhưng note hôm qua đang khẳng định
  một thứ chưa chạy được. **Cần sửa lại câu đó** thành "đọc snapshot, nhưng snapshot chỉ được ghi từ
  `ef0fffc80`". Đây đúng họ [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]]: lớp hiển thị đọc
  field A, lớp ghi ghi field B, cả hai đều "chạy đúng".

## Liên quan

[[subscriptions]] · [[shipped-subscriptions-2026-09-08]] · [[digest-subscriptions-2026-09-08]] ·
[[digest-subscriptions-tielenergy-2026-09-08]] · [[2026-09-08-go-variants-khoi-delivery-profile]] ·
[[2026-09-09-ts-tool-prod-scope-theo-op]] · [[ack-khong-phai-hieu-ung]] ·
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] · [[2026-08-24-landing-joyxjoy-dung-plan-cua-app]]
