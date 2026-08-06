---
type: note
title: Shipped Joy Subscription — commit landed 2026-08-04→05 (v2.34.47→53)
summary: Commit landed 08-04/08-05 — master nhận 7 tag (giá theo từng line của order, tsTool best-selling, delivery-anchored billing enterprise kèm 1 file migration SQL, 3 lát CLS skeleton/boot margin); revert reservation chiều cao list table vừa ship hôm trước rồi thay bằng skeleton rows; khối lượng lớn nhất còn trên nhánh: bỏ App Bridge v3 + box editor sang max modal, classic portal preview, manual delivery attributes.
tags: [subscription, shopify, avada, performance, react]
created: 2026-08-06
source: repo "subscriptions" — git log (2026-08-04 → 2026-08-05); hash và tag dưới đây lấy nguyên từ log
---

# Joy Subscription — shipped 2026-08-04 → 2026-08-05

> Phần *học được* (delivery-anchored billing, gate theo contract) đã nằm ở
> [[digest-subscriptions-2026-08-05]] — **không lặp lại ở đây**.
> Bối cảnh project: [[subscriptions]] · runbook: [[subscriptions-debug-runbook]].

## Shipped

### Vào master — 7 tag trong 2 ngày

- **`bc5407bd6` — tag `v2.34.47`, MR !2428** — "hot fix" (message trần, không có body).
- **`33a011340` — tag `v2.34.48`, MR !2431** — *đọc giá theo từng line, không lấy từ
  `order.product` gốc*. Nguồn: `f53ee1c0f`. `OrderProductLine` đọc
  `order.product.currentPrice` — snapshot 1-sản-phẩm đóng băng lúc tạo contract — nên mọi
  line trong order nhiều dòng hiện cùng một số (báo trên contract 23358111959: giá 95 của
  sản phẩm đã xoá hiện trên 2 line còn lại). Đo được **214 upcoming order / 42 shop**.
  Override này đã bị vá 3 lần bằng cách loại trừ từng shape (one-time, bundle parent,
  bundle child) thay vì sửa nguồn. Giờ resolve giá theo từng line, chỉ re-derive từ plan
  khi số đó thật sự sẽ bị bill (multi-tier). Kèm `09392af45` guard 4 chỗ throw khi thiếu
  `lines`/`plans`/`product` — trước ở background job, nay nằm trên render path nên throw
  = trắng trang order.
- **`e78082ade` — tag `v2.34.49`, MR !2433** (+ `1b54dbc3f` MR !2434 docs) — tsTool
  endpoint best-selling products (`9b3b179e6` code, `75d3bdc71` `TS_TOOL_API.md`).
- **`949d8965c` — MR !2432** — update mockup-app + PRD (`bd0b8469f`: SettingsTabs,
  widget-settings, PRD MCP trên trang Pricing). Không phải code app.
- **`0a7987ef5` — tag `v2.34.50`, MR !2229** — *delivery-anchored billing cho enterprise
  (toggle)*. ⚠️ commit nguồn `501a4baf0` **kèm 1 file migration**:
  `migration/optimize-subscription-metrics-by-variant.sql` (37 dòng). Nội dung nghiệp vụ
  của tính năng này đã ghi ở [[digest-subscriptions-2026-08-05]] và khái quát ở
  [[lich-dinh-ky-neo-theo-ngay-du-kien]] — ở đây chỉ chốt là **nó đã vào master ngày 08-05**.
- **`8af6b685c` — tag `v2.34.51`, MR !2436** — skeleton rows cho list subscriptions
  (`4f4a7ec0d`), thay bản reservation đã revert (xem mục Reverted). Kèm `8408dfcb8`:
  `useFetchGrid` khởi tạo `loading:false` nên lần render đầu không phân biệt được
  "chưa fetch" với "shop rỗng" → trang paint 998px rồi nhảy full width
  (`328,0 998x670 → 0,0 1653x798` đo trên production, **bucket CLS lớn nhất của app**);
  `b48349ee1` quét tiếp Plans + Subscribers cùng công thức.
- **`fd899b389` — tag `v2.34.52`, MR !2437** — chữ ngày đổi sang trắng trên header đỏ của
  4 template email store-owner (`e323d76e4`); `#FF7878` cũ đọc như màu xám.
- **`af357c652` — tag `v2.34.53`, MR !2439** — skeleton tab Settings/Email dựng theo đúng
  cấu trúc trang (`7a3cdbb8e` 48px→352px, `273e9fe2a` + `e22293cc9` + `c8a0a3b80` đo từng
  block: loading 1616px vs settled 1611px). Ghi rõ trong commit: **CLS trang này vẫn 0** —
  đây là skeleton fidelity, không phải fix shift.
- **`e07b7ad68` (master HEAD, chưa tag)** — set `margin` trong boot styles của 3 file HTML.
  Mọi shift mức body trên production đều là một lỗi duy nhất: browser vẽ boot screen trong
  margin 8px mặc định của UA rồi bỏ nó khi stylesheet về — **31/31 sample trong ngày** đọc
  `8,8 → 0,0`, chiếm **4.59 trên tổng ~25 CLS**, đỉnh 0.989 trên điện thoại.

### Còn trên nhánh (chưa vào master)

- **`fix/appbridge-box-editor-max-modal`** — đợt lớn nhất: bỏ App Bridge v3 khỏi
  `helpers.js` (`c7f92188e`), dựng `boxFrameSrc`/`boxFrameBridge`/`AppFrameLayout` +
  route `/box-frame/*` (`5570e04f2`, `7b5f9ef59`, `3e97da2e2`), 3 họ editor chuyển sang
  max modal (`e2c114f28`, `0bef50483`, `26a6b3b1b`, `4b24fbe6c`), Save/Discard lên
  `<TitleBar>` của modal (`03e0284fd`), xoá `useFullscreen.js` + gỡ package v3.
  → hướng đi này đủ lớn để tách riêng: [[2026-08-06-appbridge-v3-sang-max-modal]].
  Bug đáng nhớ trong đợt: `14345a593` (Save trên title bar **im lặng không làm gì** vì
  `setHandleSave` nằm sau gate snapshot, dep `JSON.stringify` không đổi khi hydrate trả
  data y hệt), `1fc9d37c4` (`getHost()` luôn null, từ click thứ 2 localStorage trả chuỗi
  `"null"` → `?host=null` truthy nên guard không chặn), `cd347dc8a` (scheme `app:` trong
  migration guide của Shopify **không điều hướng** trên runtime đang ship — WHATWG protocol
  setter từ chối đổi non-special sang special scheme).
- **`feat/portal-preview`** — classic portal preview: router + handler read/mutation
  (`3ec0eda4c`, `9947535e5`, `3f4fafa9c`, `d3a58ba47`, `dcd1ebb0a`), guard phủ endpoint
  726 dòng (`f45f6b768`), và `ead5b726a` đưa classic portal sang **tri-state** activation
  giống new-CP (đọc chính response `/subscriptions`, không gọi thêm backend). Nối tiếp
  [[shipped-subscriptions-2026-08-01]] và [[digest-subscriptions-2026-07-31]].
  Chuỗi fix shape lặp lại đúng họ lỗi cũ: `4eaccee5f` (reward/cancellation-flow trả sai
  shape nên card không render / modal kẹt), `0d67b57f6` + `44c894452` (line one-time bị
  ăn discount của plan vì `filter(Boolean)` bỏ `sellingPlanId` rỗng), `8b7f87993`
  (`dayjs(undefined)` ra hôm nay → "next order today" trên contract paused),
  `45c090247` (mất cờ `joy_preview` khi điều hướng → trang detail trắng).
- **`feat/manual-delivery-custom-attr`** — delivery provider + custom attributes cho
  manual create (BE `c8f2367d4`, `23b13b608`, `d01be8ba6`, `017d41021`; FE `26e4934e5`,
  `b3cafbc96`, `6203aa661`, `edab68f2f`). `2d41a348d`: JSON colocated **không bao giờ
  được load runtime** (app không có babel plugin react-i18n) → phải nhét key vào
  namespace `CreateSubscription` — đúng họ lỗi locale runtime đã ghi ở
  [[digest-subscriptions-2026-07-31]].
- **`fix/app-embed-badge`** `1905cf61d` — `/shops/integrations` trả `appBlockStatus` là
  nguyên block settings thô, badge chỉ render khi `typeof status === 'boolean'`; embed đã
  tắt vẫn truthy nên **mọi banner cảnh báo và gate đọc field này im lặng chết**.
- **`feat/adama-add-win-back-flow`** `0e831c76a` — chỉ là commit trigger `[deploy-functions]`
  cho staging 2 (Win Back flow xuất hiện từ [[shipped-subscriptions-2026-07-30]], vẫn chưa merge).

## Reverted

- **`fd214c920` — `revert - fe - drop list table height reservation`**. Bản reservation
  chiều cao list table vừa ship hôm trước trong `v2.34.46`
  ([[shipped-subscriptions-2026-08-04]]) bị gỡ: nó xoá được cú rơi 464px và kéo CLS
  0.0432 → 0.0065, nhưng trên shop có list rỗng/ngắn thì vẽ một khối trắng cao với "No
  subscriptions found" nằm trong rồi co lại — **regression nhìn thấy được, báo từ
  production**. Thay bằng skeleton rows co theo kết quả thật (`4f4a7ec0d`, ship ở
  `v2.34.51`). Đây là đổi *kỹ thuật* trong cùng một hướng (giảm CLS), không phải đổi hướng
  → không tách decision riêng.

## Deploy notes

- **Không có `[deploy-functions]` / `[deploy-all]` nào trên master** trong 2 ngày này.
  Cả 3 tín hiệu deploy đều nằm trên nhánh và đều là commit *trigger CI*, không phải code:
  `8f69a20b3` (`[deploy-all]`, chỉ thêm 1 file playbook trong `.claude/skills/`),
  `81601d49a` (`ci(staging2)` trỏ staging2 sang `fix/appbridge-box-editor-max-modal`,
  `[deploy-all]` vì đợt này đụng cả entry HTML lẫn dependency), `0e831c76a`
  (`[deploy-functions]` staging 2).
- **Migration**: `optimize-subscription-metrics-by-variant.sql` đi kèm `v2.34.50` — file
  migration duy nhất trong đợt, đã vào master.
- `caae73f04` trỏ staging4 sang `feat/manual-delivery-custom-attr` (không mang cờ deploy).

## Bỏ qua (noise)

`cb81521e6` bật Jest cho workspace assets, `2bb181be1`/`d5103052c`/`c15692c2b`/`cbd87b4c0`
là merge key i18n do generator sinh, các commit `docs(plan)`/`docs(spec)` của đợt max modal
(`805d060d2`, `99dc892c4`, `c4a7970b3`, `57031b297`, `ae5b2337d`, `b4807ad78`, `4534eedbc`,
`c5ad1c9dd`) — nội dung của chúng đã gói trong decision.

## Liên quan

[[shipped-subscriptions-2026-08-04]] · [[digest-subscriptions-2026-08-05]] ·
[[digest-subscriptions-2026-08-04]] · [[shipped-subscriptions-2026-08-01]] ·
[[lich-dinh-ky-neo-theo-ngay-du-kien]] · [[subscription-work-style]]
