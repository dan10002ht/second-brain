---
type: decision
title: PDF Invoice thay cơ chế discount B2B thủ công bằng company payment rule
summary: Gỡ hẳn đường discount thủ công theo từng order (modal chọn discount, `discount.controller/service`, email `templateDiscount.html`) và thay bằng rule cấu hình theo company location + engine `b2bDiscount.service` chạy qua Pub/Sub và cron hết hạn; có test khoá việc gỡ để không ai vô tình dựng lại.
tags: [avada, pdf, invoice, shopify, firestore, architecture]
created: 2026-08-19
updated: 2026-08-19
review: 2026-11-19
source: repo "pdf" — git log, commit `d7b7e4a00` (2026-08-18, nhánh `feat/early-payment-benefit`, 205 file, +17.536/−2.729)
---

# Bỏ discount B2B thủ công → rule theo company payment term

**Trạng thái: ⚠️ CHƯA MERGE** — mới ở nhánh `feat/early-payment-benefit`, master chưa nhận
(xem [[shipped-pdf-2026-08-19]]).

## Đã quyết cái gì

Đường cũ — merchant mở modal trên từng order, tự chọn discount, app tự tạo discount rồi gửi
email riêng — bị **xoá**, không phải giữ song song:

| Bị gỡ | Dòng |
|-------|------|
| `hooks/modal/useDiscountModal.js` | 306 |
| `components/OrderPage/PaymentTerm/PaymentTerm.js` | 287 |
| `storage/emailnotifications/templateDiscount.html` | 584 |
| `services/mail.service.js` | 123 |
| `helpers/handle/order/handleCreateDiscount.js` | 77 |
| `helpers/handleChangeProductDiscount.js` | 94 |
| `controllers/discount.controller.js` + `services/discount.service.js` | 35 + 36 |

Thay bằng: `companyPaymentRule` (route → controller → service → repository → schema) cho
merchant cấu hình **một lần theo company location**, `b2bDiscount.service.js` (592 dòng) làm
engine, `applyB2BDiscount` handler chạy qua Pub/Sub, cron `expireB2BDiscounts` thu hồi khi
hết hạn, `b2bDiscountRecordRepository` lưu vết đã áp, và snapshot rule
(`buildEarlyPaymentSnapshot`, `ruleSnapshot.test.js` 352 dòng) để hoá đơn đã in không đổi
nghĩa khi rule sau này bị sửa.

Việc gỡ được **khoá bằng test**: `legacyMechanismRemoved.test.js` (158 dòng) +
`legacyRecordShape.test.js` (123) — tức đây là quyết định, không phải dọn dẹp tiện tay.

## Why

- **Discount thủ công theo từng order không mở rộng được cho B2B.** Khách B2B mua theo
  company location với payment term cố định; đặt lại discount cho từng đơn là lặp tay và
  không có nguồn sự thật nào để đối chiếu khi đơn đã in ra PDF.
- **Hai đường tính discount song song sẽ lệch nhau.** Repo này đã dính đúng họ đó nhiều lần
  (mỗi surface đọc một nguồn khác — xem [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]]).
  Giữ modal cũ bên cạnh rule mới là đảm bảo có ngày hai bên cho hai con số.
- **Rule cho phép hết hạn tự động.** Early payment benefit chỉ có nghĩa nếu nó **mất đi** khi
  quá hạn thanh toán — đường thủ công không có ai đi thu hồi, cron `expireB2BDiscounts` thì có.
- **Test khoá việc gỡ** vì cơ chế cũ nằm rải ở FE hook + controller + email template; không
  khoá thì lần sau ai đó dựng lại một mảnh và app có hai nguồn discount trở lại.

## Tradeoff

- **Chấp nhận mất tính linh hoạt "giảm giá ad-hoc cho một đơn".** Merchant muốn ưu đãi một
  đơn lẻ ngoài rule thì không còn cửa trong app — phải sửa rule hoặc làm ngoài Shopify.
- **Bề mặt phải maintain to hơn hẳn**: 28 theme liquid nhúng token early-payment, 11 file
  locale (+239 dòng mỗi ngôn ngữ), scope Shopify mới (`hasGrantedScopes` + `UpdateScopes`),
  một Pub/Sub topic và một cron. Chính vì thế commit phải kèm 2 script
  `template-sync-audit*.js` để canh độ lệch giữa các theme — thừa nhận rằng "sửa 28 template
  bằng tay" là một bề mặt cần công cụ.
- **Merge một cục 205 file** khó review và khó revert từng phần: nếu engine mới sai ở prod,
  không có đường lùi về modal cũ vì nó đã bị xoá cùng commit.
- **Index Firestore mới** (`firestore.indexes.json` +16) ⇒ deploy phải theo thứ tự
  index-trước-code, không phải push là xong.
- **Rủi ro đã được trả trước một phần**: bộ e2e Playwright mới (`e2e/`, 5 spec) + ~25 file
  unit test là lần đầu repo pdf có e2e riêng.

## Cần theo dõi tới ngày review

- Đã merge chưa, và có phải bump version + tạo topic Pub/Sub trước không.
- Có merchant nào xin lại "discount ad-hoc một đơn" không — đó là tín hiệu tradeoff đầu tiên
  đắt hơn dự tính.
- `template-sync-audit-deep.js` có thực sự được chạy định kỳ hay chỉ chạy một lần rồi thối.

Liên quan: [[pdf]] · [[shipped-pdf-2026-08-19]] · [[shipped-pdf-2026-08-11]] ·
[[controller-service-repository]] · [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]]
