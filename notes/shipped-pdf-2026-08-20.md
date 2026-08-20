---
type: note
title: PDF Invoice — commit landed 2026-08-19
summary: Master chỉ nhận 2 MR tài liệu của BA (không code, không tag); khối lượng thật trên 3 nhánh — template sync đẩy design mới xuống shop cũ theo vân tay SHA-1, chuỗi SB-15764 tự đảo kết luận về nguyên nhân nháy trắng, và gate B2B đổi từ allowlist env sang plan Wholesale.
tags: [avada, pdf, shopify, invoice]
created: 2026-08-20
updated: 2026-08-20
source: repo `pdf` (pdf-invoice-firebase) — git log 2026-08-19, hash đã verify
---

# PDF Invoice — commit landed 2026-08-19

Master (`ef3d007cb`) **không nhận một dòng code app nào**: 2 MR, cả hai đều là tài liệu
BA, không tag, không version bump (mốc gần nhất vẫn là `v3.1.78` của 08-12).

## Shipped

**Master — 2 MR tài liệu (đường auto-merge BA, xem [[2026-08-06-auto-merge-mr-tai-lieu-ba]])**

| MR | Commit | Nội dung |
|----|--------|----------|
| !522 | `486418f75` | PRD Early payment benefit card theo **3 state**, khớp mockup |
| !521 | `ddaa8d13b` | mockup-app + DESIGN-SYSTEM + `order-detail.jsx` |

**Nhánh `feat/templates-redesign` — template sync (`806be7f9b`, +5.821 dòng)**

Việc lớn nhất trong ngày. Template doc của mỗi shop giữ **bản sao** body/styles chụp lúc
tạo, nên sửa file theme không bao giờ với tới shop đã cài. Cơ chế đẩy design mới xuống,
nhưng chỉ ở chỗ chứng minh được là an toàn:

- vân tay SHA-1 sinh **lúc build** vào `storage/themes/.fingerprints.json` (3.091 dòng) —
  runtime không có lịch sử git nên không thể phân loại tại chỗ;
- phân loại từng doc: `current` bỏ qua · `historic` (khớp một phiên bản git) mới ghi ·
  `unknown` (**đã sửa tay, 3,3% doc production**) không bao giờ đụng khi chưa được yêu cầu rõ;
- backfill `isItemDiscountReason` khi doc bật `isItemDiscount` — body mới gate mã giảm dòng
  hàng bằng cờ con đó, thiếu nó là shop **mất mã trên hoá đơn, im lặng**;
- trigger ở `GET /whoami`: so `templateSyncVersion` với `THEME_BUNDLE_VERSION`, khác thì
  publish Pub/Sub fire-and-forget — một lần cho mỗi phiên bản bộ theme, không phải mỗi login;
- không stamp version khi còn doc bị hoãn vì đang sửa (`updatedAt` < 5 phút), nếu không cổng
  idempotency bỏ qua chúng vĩnh viễn;
- Dev Zone: dry-run → báo cáo → modal xác nhận **2 checkbox tách theo mức rủi ro**
  (re-push doc `current` = an toàn; ghi đè template đã custom = destructive, kèm
  `bodyBackup`/`stylesBackup`). Đường login không bao giờ truyền hai cờ đó.

**Nhánh `feat/templates-redesign` — SB-15764, chuỗi tự đảo kết luận**

`62dd4ed59` (bỏ toast trung gian, giữ CTA loading) → `618df449d` (kết luận App Bridge v3
`Redirect.Action.REMOTE` gây nháy → đổi sang `window.top.location.href`) → `3e5190771`
(DIAG tạm: log mount/unmount editor + timeline saga) → `818ae6ed2` (**đảo lại**: diagnostic
chứng minh editor KHÔNG remount, cái nháy trắng chính là hard-nav của
`window.top.location.href` → dùng App Bridge **v4** `open(confirmationUrl, '_top')`, gỡ DIAG).
Xem ⚠️ bên dưới.

**Nhánh `feat/templates-redesign` — phần còn lại**

- `7c3b04ebe` bỏ nháy modal upgrade (giữ modal mở, CTA loading theo `subscription.subscribing`)
- `e221d8ab8` SB-15765 rule sticky tab preview scope quá rộng ăn luôn segmented "Order type"
- `70895ff3d` CodeMirror mount trong tab `display:none` nên đo sai kích thước → full height + refresh
- `d434757ba` SB-15743 propagate key locale còn thiếu (`TemplatePage.logo` trước chỉ có ở `en.json`)
- `16d057df5` SB-15739 Crisp mở popup 400x640 thay vì tab full-screen
- `4799fe5c1` **gỡ bộ e2e preview-parity khỏi git** (`git rm --cached`, −2.483 dòng) — mới chạy
  được 1 lần, chưa verify để public cho team; file vẫn giữ local + `.gitignore`
- 3 vòng dọn comment (`85724c855` · `f8463499b` · `8b61d7373`, tổng ~−1.845 dòng), verify
  bằng babel token-level "chỉ comment thay đổi" — khớp [[feedback-comment-chi-khi-code-roi]]

**Nhánh `feat/early-payment-benefit` — 3 commit mới chồng lên bản 205 file đã ghi ở [[shipped-pdf-2026-08-19]]**

- `de0db552f` **bỏ `B2B_DISCOUNT_SHOP_ALLOWLIST`**, gate đổi sang `isShopWholesale(shop)`;
  thêm `assertShopWholesale` ở `CompanyPaymentRuleController`; `PaymentTerms` chặn Save khi
  shop chưa grant `wholesaleScopes` (logic đọc scope tách ra `hooks/useB2BScopes.js`).
  → quyết định riêng: [[2026-08-20-b2b-gate-plan-thay-allowlist]]
- `4832c4d5b` viết lại `matchRuleForOrder` (+232 dòng test) + `themeBundle`/fingerprints
- `f07370b5e` card Early payment benefit theo 3 state của PRD !522

**Nhánh `feature/payment-reminder-plus` — `5445adcaf`**

SB-15301: card Payment reminders **và** route `/automation_email/payment-reminders/:type`
chỉ hiện cho `shopifyPlan === 'shopify_plus'`. Lý do: gói Wholesale chỉ bán được cho store
Plus (`PricingTable.js:96`) nên store non-Plus đang bị mời mua thứ họ không mua được. Giữ
nguyên gate `isShopWholesale` trong card (Plus mà chưa mua vẫn thấy bản khoá + upsell) và
gate 403 ở backend. MR !523.

## Reverted

Không có revert trên master. Trong ngày chỉ có **một lần tự đảo hướng** ở nhánh
(`818ae6ed2` gỡ cách của `618df449d`) — xem ⚠️.

Lưu ý: `ac82ed47e` (SB-14329 customer card actions, 08-13) xuất hiện lại trong log này —
đã ghi ở [[shipped-pdf-2026-08-14]], không tính là mới.

## Deploy notes

- **Không** commit nào mang `[deploy-functions]` ở tiêu đề. `3e5190771` mang `[deploy-only]`
  **trong body** — đó là commit DIAG log tạm; nếu deploy trúng đúng commit đó thì log DIAG
  ra môi trường thật (đã gỡ ở `818ae6ed2`).
- Master không tag, không version bump → không có gì ra production hôm nay.
- Template sync là thay đổi **có mặt deploy**: thêm function `syncTemplates` +
  topic Pub/Sub mới trong `src/index.js`, và phụ thuộc file **sinh lúc build**
  `storage/themes/.fingerprints.json` — deploy mà không chạy `generateThemeFingerprints`
  thì phân loại doc mất chuẩn. `.gitlab-ci.yml` không đổi.
- Không migration, không đụng `firestore.indexes.json` trong các commit mới.

## ⚠️ Cần xác nhận

**1. Hai commit cùng ngày nêu hai nguyên nhân ngược nhau cho cùng một triệu chứng (SB-15764).**
- `618df449d` khẳng định: App Bridge v3 `Redirect.Action.REMOTE` làm embedded app re-render
  trước khi top frame chuyển ⇒ nháy; cách chữa là `window.top.location.href`.
- `818ae6ed2` khẳng định ngược: editor **không** remount (có log saga, không có
  `EditorMaxModal` render / gated-body remount) ⇒ chính `window.top.location.href` là
  hard-nav nên blank; cách chữa là App Bridge **v4** `open(_top)`.

Bản sau có diagnostic thật, bản trước chỉ suy luận — nhưng cả hai còn nằm trong history của
nhánh, ai đọc `618df449d` rồi tin sẽ đi lại vòng cũ.

**2. PDF Invoice đang chạy App Bridge phiên bản nào?** `618df449d` nói saga dùng **v3**
(`Redirect.Action.REMOTE`), `818ae6ed2` nói dùng **v4** (`open()`). Brain chỉ có
[[2026-08-06-appbridge-v3-sang-max-modal]] và đó là quyết định của **Joy Subscription**, app
khác — không được suy sang pdf. Cần xác nhận pdf có cả hai hay đã lên hẳn v4.

Liên quan: [[pdf]] · [[shipped-pdf-2026-08-19]] · [[digest-pdf-2026-08-18]] ·
[[2026-08-19-b2b-rule-thay-discount-thu-cong]] · [[2026-08-11-bo-feature-flag-payment-reminder]]
