---
type: note
title: Shipped Joy Subscription — commit landed 2026-09-04
summary: Master chỉ nhận 2 MR nhẹ (`v2.35.7` đổi link book-a-call về constant, và bản viết lại skill `prod-fix-preflight` phủ mọi bề mặt prod chứ không riêng billing); khối lượng thật nằm trên nhánh — SB-16382 chặn mã giảm giá giới hạn lượt làm upcoming order về 0 bằng cách đọc `usageCount` LIVE từ Shopify (2.119 dòng, kèm refactor gộp N+1 của billable rank), fix card subtotal $0, và bỏ gate preview ở Customer accounts (SB-16175). Không revert, không migration, không cờ deploy.
tags: [avada, subscription, shopify, billing, performance, skills]
created: 2026-09-05
updated: 2026-09-05
source: repo `subscriptions` — git log 2026-09-04 (hash đã xác minh trong log)
---

Ngày 09-04 master nhận **2 MR**, một tag `v2.35.7`. Phần nặng nằm trên 3 nhánh.
Nối tiếp [[shipped-subscriptions-2026-09-04]] (ngày 09-03).

## Shipped

### Master

| Tag / hash | Việc |
|---|---|
| `91a19e3bc` **v2.35.7** (!2528) ← `f8e96f81d` | **Đổi link "Book a call" sang Calendly.** Gom 3 chỗ hardcode `cal.com` về constant `BOOK_CALL_URL` (4 file, +8/−14). |
| `aaa46d576` (!2527) ← `202032eec`, `d09f8b08b` | **Viết lại skill `prod-fix-preflight`** — 638 dòng mới (SKILL.md + 2 reference). Đây là đổi hướng, không phải sửa chữ → [[2026-09-05-prod-fix-preflight-tam-voi]]. `d09f8b08b` là bản fact-check ngay sau đó, sửa 2 claim CI sai trong ô 0. |

### Trên nhánh — `fix/spent-discount-usage` (SB-16382, cụm nặng nhất ngày)

| Hash | Việc |
|---|---|
| `e042ac932` | **Mã giảm giá giới hạn lượt không còn làm upcoming order về 0.** 26 file, **+2.119**. Shopify tính `lineDiscountedPrice` của mọi kỳ theo TẤT CẢ discount của contract, không trừ theo `recurringCycleLimit`/`usageCount`; còn `usageCount` trong order doc là **snapshot lúc sync** nên đứng ở 0 sau khi bill. Cách trả lời: đọc `usageCount` **live từ Shopify** (cache 60s), đánh dấu mã đã retire qua `expiredDiscountIds`, xếp rank theo lượt bill, bỏ allocation của mã đã hết lượt. Phủ 4 endpoint upcoming-order + chi tiết contract/đơn + apply/remove discount của clientApi (portal cũ **và** mới), admin order detail, admin contract detail, endpoint list của cả admin lẫn portal. → [[2026-09-05-usagecount-live-tu-shopify]] |
| `dfde49076` | **Card subscription tính subtotal theo lượt bill của đơn kế tiếp.** Card ở admin list, portal cũ và portal mới cộng `lineDiscountedPrice` đã bị Shopify trừ cả mã 100% hết lượt ⇒ ra **$0**. Ưu tiên `upcomingOrder` do backend present, tính bằng `collectOrderSummary` như trang chi tiết; contract không có mã giới hạn lượt giữ nguyên cách cũ. |
| `cee44e219` | **Refactor: gom query của billable rank thành batch.** Trước đó mỗi contract trong một trang danh sách tự đi 1 query lịch upcoming + 1 doc contract + 1 call Shopify — tab *My subscriptions* **153 contract** là N+1 thật. Sau: cả trang tốn 1 query lịch (`where in`, 30 id/lần), 1 call Shopify (`nodes(ids:)`, 30 contract/lần, `first 10` discount), **0 doc contract** khi order đã mang sẵn `subscriptionContract`. `presentAll` là lối đi chung; `presentUpcomingOrder`/`presentCardUpcomingOrders`/`stampBillableRanks` chỉ là vỏ mỏng quanh nó. |

Cụm này **đóng câu hỏi treo số 1** của [[discount-per-cycle-audit-2026-08-27]] (*"`usageCount` nghĩa
là gì"*): audit để ngỏ hai khả năng — Shopify không tăng `usageCount` ở đơn checkout, hoặc mirror
lấy sai field. Commit `e042ac932` đưa ra khả năng **thứ ba** và đi theo nó: field không sai, nó chỉ
là snapshot đóng băng lúc sync. Cùng họ với [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]].

### Trên nhánh — khác

- **`feat/portal-preview`** — `d43024a8a` (SB-16175, 1 file +19/−12): helptext dưới ô portal link chỉ
  hiện khi chọn **Legacy**; nút *"See your portal"* bỏ disable ở **Customer accounts**. Lý do: không có
  API nào trả lời được *"merchant đã add Subscriptions page vào extension chưa"* —
  `customerAccountPages` trả uuid từ lúc extension được deploy và không đổi, còn `isPortalThemeReady`
  chỉ sáng **sau khi** họ link tiếp page vào customer account menu ⇒ dùng nó để disable là chặn nhầm
  shop đã add xong. Tách làm **hai tín hiệu** thay vì nới lỏng một cái: `canPreviewVersion` (nút
  preview — NEW luôn cho preview, CLASSIC vẫn gate theo `appBlockStatus` vì đây là tín hiệu đo được
  thật) và `isThemeReady` (banner cảnh báo — giữ nguyên hành vi cũ). Nhánh `previewPortalDisabled` của
  tooltip không thể xảy ra nữa nên gỡ, key locale để nguyên. Cùng card với
  [[2026-09-04-bo-checkbox-nav-menu-portal]].
  Kèm `620148676` — merge `master` vào nhánh, conflict ở 2 file CI staging + `fetchApi.js`/`useFetchApi.js`
  của `customer-account-ui`.
- **`feat/joyxjoy-landing`** — `78b5b077e`: tạo metafield definition custom landing **ngay khi lưu**
  fixed bundle (2 file, +66; 51 dòng là test). Cùng pattern "ensure lúc ghi thay vì lúc install" đã ghi ở
  [[digest-subscriptions-2026-07-27]].
- **`loop/tiel-box-loop-clone`** — `1a117c799`: box discount cho one-time purchase theo `purchaseType`
  của box (theme-custom tielenergy, 1 file +3/−2).

## Reverted

Không có revert nào trong log ngày 09-04.

## Deploy notes

- **Không** commit nào mang `[deploy-functions]` / `[deploy-all]` / `[deploy-extensions]`.
- **Không migration** — không file SQL, không `firestore.indexes.json`. `const/firestore.js` có +1 dòng
  (collection mới) trong `cee44e219` nhưng không kèm index.
- 1 version bump: `v2.35.7`.
- Cụm SB-16382 **chưa vào master** ⇒ prod vẫn đang hiển thị upcoming $0 cho contract có mã giới hạn lượt.
- Ba fact về đường deploy, do `202032eec` + `d09f8b08b` fact-check trực tiếp trên file CI — đáng ghim vì
  brain đang có note nói về selective-deploy ([[subscription-digest-2026-07-09]]) nhưng chưa có mảnh này:
  - Path master `production:deploy-functions` (`production.yml:240-248`) **chỉ deploy BE, KHÔNG build FE**
    — comment dòng 239 ghi rõ *"fast BE hotfix, NO FE build"*. Đọc nhầm chỗ này sẽ kết luận "đã deploy rồi"
    trong khi FE vẫn là bản cũ.
  - **FE deploy vô điều kiện mỗi tag** (`publish-fe`, `- if: $CI_COMMIT_TAG` ở `production.yml:191`) —
    assets **không** cần `[deploy-all]`.
  - **Extension chỉ lên qua CI khi commit title có `[deploy-extensions]`** (`production.yml:272`, gần nhất
    `8eed7e928` 27/08) ⇒ bản deploy ngoài mốc đó không có sha để revert.

## ⚠️ Cần xác nhận

**1. Nút preview ở Customer accounts: mockup và ticket nói ngược nhau.**

- Mockup chốt 28/08 (nguồn của [[2026-09-04-bo-checkbox-nav-menu-portal]]): **vẫn disable** nút preview
  ở Customer accounts, và ẩn nút setup khi đã setup xong.
- Phần ticket sửa **sau** mockup: *"logic hiển thị button mới: luôn hiện"*.

Code đã landed (`d43024a8a`) theo vế thứ hai — chính commit body tự ghi *"còn lệch mockup 28/08 ở 2 điểm,
chờ BA chốt"*. Đây là câu hỏi đang mở với BA, không phải bug: ai đọc note này đừng coi hành vi hiện tại là
đã chốt.

**2. Đường tắt banner setup vẫn chưa có.** [[2026-08-26-banner-portal-theo-menu]] chốt banner "chưa setup
customer portal" ẩn/hiện theo việc extension có trong menu customer account hay không. `d43024a8a` **cố ý
giữ nguyên** `isThemeReady` cho banner, nên tradeoff đã ghi ở [[2026-09-04-bo-checkbox-nav-menu-portal]]
(app không còn lever tự đưa link vào menu) vẫn còn nguyên — chỉ nút preview được nới, banner thì không.

→ [[subscriptions]] · [[discount-per-cycle-audit-2026-08-27]] · [[digest-subscriptions-2026-09-04]] ·
[[shipped-subscriptions-2026-09-04]] · [[subscriptions-debug-runbook]] · [[bang-chung-phan-biet-duoc]]
