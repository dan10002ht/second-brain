---
type: note
title: PDF Invoice — commit landed 2026-08-21
summary: Master chỉ nhận 1 MR mockup/PRD (!527, không tag, không version bump); toàn bộ khối lượng là 14 commit SB-15857 dựng lại email payment reminder theo layout mới trên chùm nhánh `feature/reminder-*` (kèm nút DevZone reset template), cộng một job CI mới đòi `deploy_staging_4` cho `fix/print-invoice-discount`.
tags: [avada, pdf, invoice, shopify, tooling]
created: 2026-08-22
updated: 2026-08-22
source: repo `pdf` (avada/pdf-invoice/pdf-invoice-firebase) — git log 2026-08-21, hash đã verify
---

# PDF Invoice — commit landed 2026-08-21

Root cause của cụm email đã ghi ở [[digest-pdf-2026-08-21]]; hướng line item đã chốt ở
[[2026-08-21-line-item-email-kieu-joy]]. Ở đây chỉ ghi cái gì **landed** và ở đâu.

## Shipped

**Master — đúng 1 MR, không code app**

| MR | Hash | Nội dung |
|----|------|----------|
| !527 | `e599f96cc` (`429b72602`) | mockup-app + PRD Automation emails: 2 bản render tĩnh `paymentReminderDue/Overdue.html`, `buildReminderEmail.js` (422 dòng), `.mockup-review/REVIEW.md` |

Không tag, không version bump (`v3.1.78` từ 08-12 vẫn là mốc gần nhất).

**Chùm nhánh `feature/reminder-*` — SB-15857 dựng lại email payment reminder (14 commit)**

Thứ tự làm việc, chia theo lớp:

*Layout + dữ liệu*
- `20ca0fc1a` — theme `logoBackground` (3 trạng thái, không gộp bằng `||`), `logoSize` 60 → 150,
  logo bản nền tối, copy overdue `Outstanding balance:` → `Amount due:` cho khớp dòng chốt bảng tổng.
- `db53a8283` — port layout từ mockup vào builder production: bỏ hẳn ô đính kèm giá
  (bỏ luôn tham số `attachmentName`/`downloadLink`), thêm `kind` (due|overdue) + `payLink` + `order`;
  mọi nền mang **cả** `bgcolor` lẫn inline `background-color` vì Gmail/Outlook cắt `<style>` ở tầng body.
  Test 12 → 20 case.
- `4fa8fc8ff` — `buildReminderOrderData` (mới) làm **một điểm mapping duy nhất** cho shape 9 key,
  nối vào **cả hai** đường gửi (cron + nút Send test); thêm merge tag `{{order.days_until_due}}`,
  `{{pay_link}}`. `pay_link = order.order_status_url` là **giả định** đã ghi trong doc comment,
  chờ Philip xác nhận.
- `a8e431362` — preview nhận prop `kind`, giữ nguyên kiến trúc "preview gọi CÙNG hàm với đường gửi thật".
  Scope bị cắt theo chốt 21/08: **không** sửa layout trang settings (cột ~277px là thứ BA bảo đừng tin).

*Bề ngang — bốn vòng, hai lần thay hướng*
- `e5d7e247d` — hybrid `inline-block` + `overflow-wrap` để email co được ở 375px (email fixed ~600px
  đang giấu sạch số tiền trên điện thoại).
- `be76610cb` — bỏ `overflow-wrap`/`word-break` ở **mọi** ô hiện số tiền (chính commit trước đẻ ra bug
  `$1,493.35` ngắt thành `$1,493.3` + `5`), khoá `white-space:nowrap`, line item về kiểu Joy.
- `04474aa6f` — line item tự stack dưới ngưỡng 151px; hạ min-width hai cấp hybrid (132→80, 156→96).
- `16a5c2252` — **thay** cách của `04474aa6f`: cho cột ảnh co được (`img{width:100%}` + `max-width`),
  bỏ ngưỡng stack. Chốt này là nội dung của [[2026-08-21-line-item-email-kieu-joy]].
- `842192488` — bỏ **hết** `min-width` còn lại (Customer information, header ticket) nên hai cột không
  bao giờ rơi xuống; nhãn 15px → 14px.
- `9bd8185a8` — padding card 24 → 12px, hạ chữ phụ về 13px; **giữ** 14px có chủ ý cho nút Pay now và
  nội dung merchant.

*Đúng đắn + vận hành*
- `dd6bd21ed` — builder bắt buộc có `order`, bỏ default `SAMPLE_REMINDER_ORDER` âm thầm (caller quên
  truyền sẽ gửi cho khách thật mail in `{{order.total_outstanding}}` lồ lộ, không throw, không test bắt).
  Preview import sample tường minh và chạy `replaceVariables` trên **toàn bộ** HTML.
- `162516813` — ẩn khối Customer information khi đơn không có địa chỉ. Chỉ lộ ra khi gửi mail **thật**
  bằng dữ liệu store dev (order #1004, `shipping_address: null`): data mẫu luôn có đủ hai địa chỉ nên
  preview và nút "Send test" không bao giờ thấy được bug này.
- `5b9ffac2a` — `POST /dev_zone/reset-payment-reminder` + `ResetPaymentReminder.js` (modal xác nhận).
  Lý do tồn tại: `paymentReminderRepository.getForShop` merge **nông** theo từng sub-object nên shop đã
  lưu theme cũ vĩnh viễn không ăn default mới. Shop lấy từ `authentication.getShop(ctx)`, **không** đọc
  `shopId` từ body. Reset đặt lại cả hai cờ `enabled` về `false` — đúng tinh thần
  [[feedback-feature-moi-mac-dinh-opt-in]].
- `979618270` — ô soạn CKEditor hiển thị chữ giống email: cùng một chuỗi HTML nhưng hai môi trường CSS
  khác nhau (Polaris reset ép `h1..h6`/`p` về cùng cỡ), nên merchant sửa mù. CSS mới **phải scope** dưới
  `.PdfReminder__editor` vì `CkeditorInput.css` là global và còn dùng ở modal Policy.

**Nhánh `fix/print-invoice-discount`**
- `822f10c0e` — thêm job `deploy_staging_4` (`only: fix/print-invoice-discount`) + alias `staging4`
  trong `.firebaserc`. Xem mục ⚠️ bên dưới.

**Nhánh `feature/SB-14332`**
- `e20583ef0` "CI" · `10033a0d2` "mcp" — không có file stat trong log, tiêu đề một từ; chưa đủ dữ kiện
  để nói nội dung là gì.

**Mockup (`f6f8c694e`)** — hạ padding card 24 → 12px trong mockup-app cho khớp production. Commit body
ghi rõ mockup **vẫn chưa** đồng bộ hết: còn thiếu chữ phụ 13px, cột ảnh co được, bỏ min-width, ẩn
Customer information khi rỗng — tất cả đều đã làm bên `packages/functions`.

## Reverted

**Không có `git revert` nào.** Nhưng có **hai lần thay hướng tại chỗ** trong ngày, cả hai đều xoá test
đang khoá hướng cũ:

| Bỏ | Thay bằng | Test bị xoá |
|----|-----------|-------------|
| `e5d7e247d` hybrid inline-block + `overflow-wrap` | `be76610cb` nowrap + line item kiểu Joy | — |
| `04474aa6f` stack theo ngưỡng 151px | `16a5c2252` cột ảnh co được | test khoá "ngưỡng stack 151px" |

Chốt cuối cùng đã có decision riêng: [[2026-08-21-line-item-email-kieu-joy]].

## Deploy notes

- **Không** commit nào mang `[deploy-functions]` / `[deploy-all]` / `[deploy-extensions]`.
- **Không** tag, **không** version bump, **không** file migration, **không** đụng `firestore.indexes.json`.
- Có thay đổi hạ tầng deploy: `.gitlab-ci.yml` + `.firebaserc` (`822f10c0e`), đòi thêm bộ biến
  `STAGING4_*` trong GitLab CI/CD — deploy sẽ **im lặng không chạy** nếu biến chưa được set.
- `162516813` ghi một gate đỏ giả đã được xử đúng cách: build assets fail ở bản sao đó vì `morphdom`
  khai trong `package.json` mà chưa cài; đã verify lại bằng worktree có `node_modules` đầy đủ thay vì
  khai là "pre-existing" — đúng kỷ luật ở [[bang-chung-phan-biet-duoc]].
- 6/14 commit ghi rõ **chưa qua verifier độc lập** vì hết quota tuần; các số đo là do main agent tự đo lại
  (Playwright, đã assert `innerWidth`), không lấy từ báo cáo của lane — xem [[do-be-ngang-headless-chrome]].

## ⚠️ Cần xác nhận

1. **Slot `staging_4` đang có hai chủ.** [[2026-08-14-staging-4-cho-nhanh-sidekick]] chốt rằng
   `deploy_staging_4` thuộc **trọn** nhánh `feature/sidekick-agent-extensions`, và master đã bị gỡ khỏi
   `only:` của job đó (`67742edbe`) đúng vì slot staging là tài nguyên **ghi đè lẫn nhau**. Hôm nay
   `822f10c0e` **thêm mới** một job `deploy_staging_4` với `only: fix/print-invoice-discount`, trỏ vào
   cùng Firebase project `avada-pdf-invoice-staging-4`.
   → Hai cách đọc, chưa phân biệt được từ log: (a) nhánh sidekick chưa merge nên `.gitlab-ci.yml` ở base
   của nhánh này **không có** job staging_4, và commit này vô tình dựng lại slot đã có chủ; hoặc (b) quyền
   sở hữu slot đã được chuyển giao có chủ ý. Nếu là (a) thì đây đúng là hậu quả mà chính decision đó đã
   dự báo trong mục Tradeoff — *"người mở nhánh feature tiếp theo không có cách nào biết staging 4 đã có chủ"*.

2. **`pay_link` fallback về `invoiceLink`** (`4fa8fc8ff`) là giả định của người viết code, chờ Philip
   xác nhận. Mail đòi nợ mà nút "Pay now" trỏ sai đích là lỗi khách nhìn thấy ngay.

## Liên quan

[[pdf]] · [[digest-pdf-2026-08-21]] · [[digest-pdf-2026-08-22]] · [[2026-08-21-line-item-email-kieu-joy]] ·
[[2026-08-14-staging-4-cho-nhanh-sidekick]] · [[shipped-pdf-2026-08-20]] ·
[[2026-08-11-bo-feature-flag-payment-reminder]] · [[2026-08-09-hoan-backfill-co-don-cu-pdf]] ·
[[feedback-feature-moi-mac-dinh-opt-in]] · [[do-be-ngang-headless-chrome]] · [[bang-chung-phan-biet-duoc]]
