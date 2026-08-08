---
type: note
title: Shipped PDF Invoice — commit landed 2026-08-07 (v3.1.73 → v3.1.74)
summary: Commit landed 08-07 — master chỉ nhận 3 MR nhỏ (2 lần đổi go-live date SMTP `v3.1.73`/`v3.1.74` + 1 MR mockup/PRD); khối lượng thật trên nhánh `feature/payment-reminder` (SB-15301 chạy trọn P0→P4 rồi 5 fix + 2 refactor tách section) và nhánh templates import (guard 5MB phía server, size hint, Crisp standalone); không revert, không cờ deploy.
tags: [pdf, invoice, shopify, avada, firebase, nodejs]
created: 2026-08-08
source: repo "pdf" — git log (2026-08-06/08-07); mọi hash + tag dưới đây lấy nguyên từ log
---

# PDF Invoice — shipped 2026-08-07

> Phần *học được* của ngày này (root cause save-trả-200-mà-Firestore-rỗng, editor tự chế
> chỉ commit onBlur, cron không bao giờ chọn được đơn) đã nằm ở [[digest-pdf-2026-08-07]] —
> **không lặp lại ở đây**, chỉ ghi cái gì đã landed. Bối cảnh project: [[pdf]].
> Ngày trước: [[shipped-pdf-2026-08-07]].

## Shipped

### Vào master — 3 MR, đều nhỏ

| Hash | Tag | Nội dung |
|---|---|---|
| `49d669290` (nguồn `80df7a1d6`) | `v3.1.73` | MR !502 — "Update golive date", `getPlans.js` 2 dòng |
| `fc68e20e5` (nguồn `255af1411`) | `v3.1.74` | MR !503 — `GOLIVE_NEW_SMTP_FLOW` = 2026-08-07, "align với tài liệu 07/08 (đang là 08/08)" |
| `f8c41f8a4` (nguồn `316410e96`) | — | MR !504 — mockup-app + PRD (~1.100 dòng: TemplateEditor các paper, company/location payment terms, order detail) |

Hai MR đầu là **cùng một hằng số go-live bị chỉnh hai lần trong một ngày** — nối tiếp
`7bb2fda60` đã ghi ở [[shipped-pdf-2026-08-07]]. Đây là lần thứ 3 dời/sửa mốc go-live của
flow Custom SMTP; nếu còn lần thứ 4 thì vấn đề là chỗ giữ ngày, không phải cái ngày.

MR !504 tiếp tục vai trò đã ghi hôm trước: **mockup chính là nguồn spec** cho SB-15301
(feature không có PRD).

### Còn trên nhánh — `feature/payment-reminder` (SB-15301), khối lượng lớn nhất trong ngày

Toàn bộ pha P0→P4 giờ đã nằm trên một nhánh (trước đó rải trên 4 nhánh, xem
[[shipped-pdf-2026-08-07]]), cộng loạt fix và 2 lượt refactor:

**Feature (pha):**
- `a4fff6439` **P0** data model + config API (+52 dòng `firestore.indexes.json`).
- `43eb3f105` / `96b345ed5` **P1** FE settings — 1.735 dòng: `PaymentRemindersCard`,
  `PaymentReminderSettings`, `CustomizeEmailTemplate`, `ReminderEmailPreview`,
  `ColorSwatchInput` + loadables/routes; tái dùng key i18n `CombineOrders.*` cho gate Wholesale.
- `7ad035d31` **P2** gửi qua cron `handleOrderDaily` — **flag off**.
- `a732a6db0` / `cb6ebf4a1` **P3** `POST /payment-reminders/:type/test` (send test).
  Đáng ghi: cờ `ENABLE_PAYMENT_REMINDER_SEND` **cố ý không áp cho send-test** — cờ chỉ
  chặn cron gửi hàng loạt cho khách thật, merchant tự bấm gửi cho chính mình phải chạy
  được kể cả khi cờ tắt.
- `65377f0f6` **P4** test cron + API (603 dòng).
- `804464917` spec 344 dòng.

**Fix trong ngày (đều là bug làm feature không dùng được, không phải polish):**
- `b2f2038c6` — save settings trả 200 mà **không ghi gì**: yup 0.29.3 dựng nested object
  toàn `undefined`, koa-yup-validator ghi đè body, Firestore từ chối, `updateOrCreate` nuốt
  lỗi. Fix ở 4 tầng (schema `.default(undefined)` + `ignoreUndefinedProperties` +
  controller kiểm kết quả ghi + test có guard chống gỡ fix).
- `a0fbaf4fa` — **cron không bao giờ khớp đơn nào**: Firestore equality filter bỏ qua doc
  thiếu field, mà `isSendDueReminder`/`overdueReminderCount` chỉ được ghi *sau khi* đã gửi.
  Seed default **chỉ ở nhánh `.add()`** — cố ý không đặt trong `formatOrder` vì
  `updateOrder` spread output đó vào `.update()` và webhook order-update gọi mỗi lần sửa
  đơn ⇒ sẽ reset cờ và gửi lại. Kèm command `backfillReminderFields` (xem ⚠️ bên dưới).
- `184a84681` — bỏ editor contentEditable port từ mockup (8 nút toolbar đều
  `onClick={() => {}}`) sang `CkeditorInput` có sẵn trong repo; insert-variable chèn tại
  caret thay vì luôn nối cuối.
- `5291caa65` — trước đó vá chính editor tự chế đó bằng `onInput` để save bar chịu dirty;
  `184a84681` sau đó thay hẳn component ⇒ bản vá này sống chưa tới một ngày.
- `16a48d124` — toggle trên card Automation Emails không còn tự persist khi click; nâng
  state lên `Emails.js` để dùng chung save bar của trang.
- `c261c16d7` — **payment reminder default OFF**. Đúng [[feedback-feature-moi-mac-dinh-opt-in]].

**Refactor (no behaviour change, tự khai rõ trong body):**
- `fa4081ac7` gộp 3 input number byte-identical thành `DaysNumberField`.
- `5524a25d7` tách mỗi Card ra file riêng theo tiền lệ `pages/DevZone` / `pages/B2B`:
  `PaymentReminderSettings` 496→266 dòng, `CustomizeEmailTemplate` 356→124 dòng.
  Body ghi rõ **hai bug được bê nguyên sang, không lặng lẽ sửa** (DropZone logo no-op,
  popover lệch chiều cao) — kiểu khai báo này đáng nhân rộng.

### Còn trên nhánh — `feature/SB-14332` (Templates import/export)

- `9e67da53a` — **guard bảo mật**: FE giới hạn 5MB nhưng server chỉ kiểm per-field 500KB
  ⇒ client bỏ qua FE gửi được ~20MB. Thêm guard tổng body+styles khớp FE.
- `5ef62e3d8` — hint "tối đa 20 template, file dưới 5MB", nâng giới hạn client 1MB→5MB,
  link "import từ app khác? contact us" mở Crisp kèm sẵn nội dung.
- `e205a09ef` / `fab11ce32` — tách lỗi chung "invalid template export" thành thông báo
  riêng cho file hợp lệ nhưng có 0 hoặc >20 template (cả FE lẫn BE, 11 ngôn ngữ).
- `385344401` dời banner lỗi xuống dưới drop zone; `17462522a` đóng modal trước khi mở Crisp;
  `1eac0c542` i18n 10 ngôn ngữ.
- `f127f32a5` — `CrispIsolated` đang bị gate sau `isEmbeddedAppEnv` nên standalone không
  có bong bóng chat; widget chạy trong iframe cô lập, không phụ thuộc App Bridge ⇒ render
  ở mọi mode.

## Reverted

Không có revert nào trong log ngày này. Thứ gần nhất là `184a84681` thay hẳn editor mà
`5291caa65` vừa vá — nhưng cùng nhánh, chưa vào master, nên không tính là revert.

## Deploy notes

- **Không có `[deploy-functions]` / `[deploy-all]`** trong toàn bộ log.
- Version bump: `v3.1.73`, `v3.1.74` — **cả hai chỉ đổi ngày go-live** trong `getPlans.js`.
  `GOLIVE_NEW_SMTP_FLOW = 2026-08-07` nghĩa là flow SMTP mới **đã tới ngày bật**; giá trị
  này quyết định hành vi theo mốc thời gian nên nó là tín hiệu deploy dù diff chỉ 1 dòng.
- Không có file `migration/`. `firestore.indexes.json` (+52 dòng, `a4fff6439`) vẫn nằm trên
  nhánh — **cần deploy index trước khi query payment reminder chạy ở prod**; đã cảnh báo
  từ [[shipped-pdf-2026-08-07]], vẫn chưa merge.
- `6e58ce960` là merge `master` vào `feature/payment-reminder` với commit message còn
  nguyên phần hướng dẫn `#` của git — không ảnh hưởng gì, nhưng nhánh này sẽ mang message
  rác đó vào lịch sử nếu merge không squash.

## ⚠️ Cần xác nhận

**Backfill cờ cho đơn cũ: đã viết rồi hay vẫn đang hoãn?**

| Nguồn | Nói gì |
|---|---|
| [[digest-pdf-2026-08-07]] (mục Context) | "Backfill cờ cho đơn cũ: **cố ý hoãn** tới khi BA có requirement, ghi rõ trong BRIEF để sau không ai tưởng là quên" |
| commit `a0fbaf4fa` (08-07) | thêm `packages/functions/src/commands/backfillReminderFields.js` (54 dòng) — "one-off backfill for existing orders, fills only missing fields" |

Có thể cả hai đều đúng ở hai thời điểm khác nhau trong ngày (viết command trước, hoãn phần
*chạy* nó), nhưng note đang khẳng định là hoãn mà không nhắc command đã tồn tại. Cần chốt:
command đã có sẵn và chỉ chờ lệnh chạy, hay phần hoãn là một backfill khác? Nếu là vế đầu
thì [[digest-pdf-2026-08-07]] nên sửa lại cho khớp.

## Bỏ qua (noise)

`96b345ed5`/`43eb3f105` và `cb6ebf4a1`/`a732a6db0` là cùng một commit ở hai nhánh (P1 và P3
được gộp lên `feature/payment-reminder` bằng cherry-pick — xem kỹ thuật ở
[[digest-pdf-2026-08-07]]); chỉ đếm một lần. `fdd25f11f` là merge nhánh-vào-nhánh.
`1eac0c542` là i18n thuần của `5ef62e3d8`.

## Liên quan

[[shipped-pdf-2026-08-07]] · [[digest-pdf-2026-08-07]] · [[digest-pdf-2026-08-06]] ·
[[shipped-pdf-2026-08-04]] · [[pdf]] · [[feedback-feature-moi-mac-dinh-opt-in]] ·
[[feedback-follow-conventions]] · [[feedback-ten-nhanh-ngan]]
