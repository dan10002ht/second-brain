---
type: note
title: Shipped subscriptions — 2026-09-26 (commit landed 25/09: !2640 [deploy-extensions] + !2641, và bản revert !2641 vẫn còn trên nhánh)
summary: Master nhận 2 merge không kèm commit bump version — reward translations SB-16816 (!2640, mang `[deploy-extensions]`) và bản vá font sửa `layout/theme.liquid` của khách (!2641); bản revert !2641 cùng phương án thay thế đã viết xong nhưng CHƯA merge, nên master hiện đang mang đúng thay đổi mà quyết định 25/09 nói là không được mang; nhánh `agent/SB-17176` thêm 3 commit (helper delivery method, bắt buộc phone, key dịch).
tags: [subscription, shopify, avada, storefront, backend, git, gotcha]
created: 2026-09-26
updated: 2026-09-26
source: repo `subscriptions` — git log 2026-09-24 → 2026-09-25 (mọi hash trong note là hash thật, lấy từ log có decoration)
---

# Shipped — Joy Subscription, commit landed 2026-09-25

Kỳ trước: [[shipped-subscriptions-2026-09-25]] (dừng ở !2637 `v2.35.67` + !2638).
Phần *vì sao* của slice này nằm ở [[digest-subscriptions-2026-09-25]] và
[[digest-subscriptions-wholefoods-font-2026-09-25]].

> Slice này **không có commit bump version nào** — hai merge lên master đều không kèm tag,
> giống hình dạng đã thấy ở [[shipped-subscriptions-2026-09-24]].

## Shipped (master)

| Tag | MR | Merge | Nội dung |
|-----|-----|-------|----------|
| — | !2640 | `6905246de` (source `9174407ef`) | **[deploy-extensions]** `fix - fe - reward: đưa mission description + reward title của portal vào translation (SB-16816)`. Mission description và reward title trong `RewardModal` đang **hardcode tiếng Anh** (`missionConfig.js`, `rewardTitleTemplates.js`) nên shop không dùng tiếng Anh vẫn thấy lẫn ngôn ngữ. Chuyển sang `defaultTranslations`: `reward.missionDescriptions.<type>` (16 key) + `reward.rewardTitles.<type>` (5 key), áp cho **cả hai** bề mặt — `classicCustomerPortal` (scripttag) và `newCustomerAccount` (extension). Locale đã lưu trước đó fallback về tiếng Anh qua `defaultsDeep`. +72/−54, 9 file. |
| — | !2641 | `b39a00591` (source `5e374fda8`) | `fix - fe - quote the custom font families in the Joy Wholefoods theme`. Thêm dấu nháy cho hai custom property trong `docs/joyxjoy-theme/layout/theme.liquid`, dùng literal `sans-serif` chứ không dùng `type_body_font.fallback_families` (setting đó có thể rỗng → sinh dấu phẩy treo và làm chết declaration đúng như cũ). Cơ chế: [[css-var-khong-quote-lam-chet-ca-declaration]]. |

**!2640 là lần thứ ba cùng một họ lỗi locale.** Không phải cùng root cause với !2641, nhưng
cùng lớp "chuỗi hiển thị nằm ở chỗ runtime không đọc" đã ghi ở
[[digest-subscriptions-2026-07-31]] (key có trong `QuickStart.json` colocated, thiếu ở
`locale/translations/en.json`) và [[shipped-subscriptions-2026-08-06]] (`2d41a348d`: JSON
colocated **không bao giờ** được load runtime vì app không có babel plugin react-i18n).
Lần này là hardcode thẳng trong constant thay vì nằm sai file.

## Reverted

| Commit | Nội dung |
|--------|----------|
| `c35d4e3b8` | `revert - fe - stop editing the merchant's global theme layout for the font fix` — **revert !2641**. Lý do trong commit body: quote hai custom property trong `theme.liquid` **là** root fix và sửa được cả storefront, nhưng file đó là **layout toàn cục của khách**, có thể do theme developer của họ bảo trì, và một lượt theme update sẽ xoá bản vá mà không ai biết. Yêu cầu vốn chỉ phạm vi trang subscription. |
| `4688a3971` | `fix - fe - name the brand fonts in our own Joy Wholefoods theme files` — phương án thay thế: hai file **do app sở hữu** (`sections/joy-subscription-landing.liquid`, `custom-liquid/joy-bundle-cta.liquid`) tự khai báo lại hai family có dấu nháy cho subtree của mình. `.jw-landing` **nhân đôi selector** để thắng runtime stylesheet (được append sau khối này) — đã verify trên trang live rằng override thắng và `body` không bị chạm. Guard `!= blank` vì setting rỗng sẽ emit `""` và làm chết declaration đúng kiểu như giá trị không quote. Đo trên store thật: `body`, `.jw-landing`, `.jw-card-title`, `.jbc-link` đều compute ra Times; `.jw-h2` không sao vì "Holiday Journey" không chứa token số. |

Đây **không phải revert đổi hướng mới** — hướng đã được chốt và ghi ở
[[2026-09-25-fix-font-trong-file-cua-app]], quyết định đó đã trích đúng `b39a00591` làm bằng
chứng "A đã merge nên phải tạo MR revert". Slice này là phần *thi hành* của quyết định đó,
nên không mở decision mới.

## Trên nhánh, chưa merge

**`fix/wholefoods-theme-font`** (MR !2642) — `4688a3971` + `c35d4e3b8` ở trên. **Chưa lên
master.** Xem mục Deploy notes.

**`agent/SB-17176`** (MR !2639, đã có ở [[digest-subscriptions-2026-09-25]]) — thêm 3 commit
sau bản fix gốc:

| Commit | Nội dung |
|--------|----------|
| `89b70bc9a` | `test: reproduce SB-17176` — test đỏ trước (+22 dòng `manualSubscriptionService.test.js`). |
| `7ae148da1` | `fix: SB-17176 - preserve manual delivery methods` — bản fix gốc, 5 file. |
| `a093cbf74` | `refactor - be - extract the manual contract delivery method builder` — IIFE inline trong `buildManualContractInput` + ternary lồng nhau chuyển sang `helpers/shipping/buildContractDeliveryMethod.js`; tên method vốn viết raw string cạnh chính các hằng `DELIVERY_*` mà nó nhân bản, nay đi qua `const/options/deliveryKeyMapping.js`. Trang Create có resolver giá riêng (`resolveManualDeliveryPrice.js`). Thêm coverage pickup mà builder chưa từng có, kể cả **pickup không có location**. |
| `9b3916839` | `fix - be - require a phone number before saving a local delivery method` — Shopify khai `SubscriptionDeliveryMethodLocalDeliveryOptionInput.phone` là `String!`, nên local delivery dựng từ địa chỉ **không có phone** bị tầng GraphQL từ chối **trước khi** sinh `userError` — merchant chỉ thấy lỗi chung không nêu tên field nào. Chặn ở **4 boundary**: validator manual create, nhánh `address` của `PUT /subscription-contract/update/:type`, validation của form Create, và address modal (ô phone của nó **không có chỗ hiện lỗi** nào cả). |
| `19760db40` | `fix - fe - register the local delivery phone validation message` — key chỉ được thêm vào `CreateSubscription.json` của chính page mà **chưa tới `locale/translations`**, tức file mà `@shopify/react-i18n` resolve lúc runtime → chính nhánh validation vừa dựng ném `MissingTranslationError` thay vì nói cho merchant biết phải sửa gì. Sinh bằng `yarn trans` nên en/origin + fr/de/it/es/ja đều có. |

Chuỗi này là kiểu quét-hết-boundary đúng khuôn [[feedback-follow-conventions]] — và `19760db40`
cho thấy chặn 4 boundary vẫn chưa đủ nếu **thông điệp** ở boundary đó không tồn tại lúc runtime.

## Deploy notes

- **`[deploy-extensions]` trên !2640** (`6905246de` / `9174407ef`) — buộc deploy extension, vì
  thay đổi chạm `extensions/customer-account-ui/` và `packages/scripttag/`. Hai bề mặt portal
  phải lên cùng nhau: cùng 21 key sống ở `packages/functions/src/const/defaultTranslations.js`.
- **Không có `[deploy-functions]`**, không có file migration, không có commit bump version
  trong slice.
- **Master đang mang thay đổi mà quyết định 25/09 nói là không được mang.** `origin/master`
  = `b39a00591` = !2641, tức bản sửa `layout/theme.liquid` của khách; revert (`c35d4e3b8`)
  và phương án thay thế (`4688a3971`) **vẫn nằm trên `fix/wholefoods-theme-font`**. Tình
  trạng này **không nguy hiểm trên store** — `docs/joyxjoy-theme/` chỉ là bản export để đối
  chiếu, app không deploy file đó (xem [[2026-09-25-fix-font-trong-file-cua-app]]) — nhưng
  nó khiến bản trong repo **nói sai** về thứ đang chạy trên theme khách. Việc còn lại: merge
  !2642.

## ⚠️ Cần xác nhận

**`a093cbf74` cố ý biến giá không parse được thành `0`.** Commit body: *"No behaviour change,
except that an unparseable `deliveryPrice` now lands on 0 instead of NaN"* — tức một giá trị
tiền **hỏng** được nuốt thành một giá trị tiền **hợp lệ**.

- **Commit nói:** `0` là cải thiện, vì `NaN` là kết quả tệ hơn.
- **[[gia-0-tren-dong-con-lam-mat-thong-tin]] nói:** trên trường tiền, `0` là một khẳng định
  ("món này không tốn gì") chứ không phải cách biểu diễn "không biết" — và chính lớp lỗi đó
  đã làm người vận hành không swap ngang giá được.

Hai bên không nhất thiết loại trừ nhau (`NaN` vẫn tệ hơn `0` về mặt lan truyền), nhưng
**không có bên thứ ba**: input hỏng đáng lẽ phải *ồn ào* chứ không rơi vào một trong hai giá
trị im lặng. Cần xác nhận: `deliveryPrice` không parse được là ca **không thể xảy ra** (đã có
validator chặn trước) hay là ca **chưa ai chặn**? Nếu là cái sau thì đây là một đường thu
thiếu tiền ship im lặng, đúng họ với [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]].

Liên quan: [[subscriptions]] · [[shipped-subscriptions-2026-09-25]] ·
[[digest-subscriptions-2026-09-25]] · [[digest-subscriptions-wholefoods-font-2026-09-25]] ·
[[2026-09-25-fix-font-trong-file-cua-app]] · [[css-var-khong-quote-lam-chet-ca-declaration]] ·
[[digest-subscriptions-2026-07-31]] · [[shipped-subscriptions-2026-08-06]] ·
[[gia-0-tren-dong-con-lam-mat-thong-tin]] · [[shopify-app-dev]]
