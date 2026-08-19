---
type: note
title: Shipped pdf 2026-08-18 — master không nhận gì; 3 nhánh chạy song song (B2B early payment, templates redesign, secrets)
summary: Commit landed 08-18 — master KHÔNG nhận MR/tag/version bump nào; toàn bộ nằm trên 4 nhánh — `feat/early-payment-benefit` là một commit khổng lồ 205 file thay hẳn cơ chế discount thủ công cũ bằng company payment rule (kèm 2 script audit + bộ e2e Playwright), `feat/templates-redesign` đóng 5 issue SB-14670 rồi thay hẳn react-color bằng Polaris ColorPicker vì cross-origin, `feat/pdf-fonts-56` thêm 54 font (18 → 72), và `chore/remove-hardcoded-secrets` thay secret bằng placeholder; không revert, không cờ deploy, không tag.
tags: [avada, pdf, invoice, shopify, react, polaris, auth]
created: 2026-08-19
updated: 2026-08-19
source: repo "pdf" — git log (commit 2026-08-18; hash dưới đây đã verify từ log)
---

# Shipped — PDF Invoice (commit landed 2026-08-18)

> Phần *học được* của cụm secrets nằm ở [[digest-pdf-2026-08-18]] và
> [[api-key-cong-khai-khong-phai-secret]] — không lặp lại. Bối cảnh: [[pdf]].

## Shipped — vào master

**Không có gì.** Không MR nào merge, không tag, không version bump (mốc gần nhất vẫn là
`v3.1.78` của [[shipped-pdf-2026-08-13]]). Ngày này là ngày làm việc trên nhánh — lần thứ
hai trong tháng, sau [[shipped-pdf-2026-08-14]].

## Shipped — trên nhánh

### `feat/early-payment-benefit` — `d7b7e4a00`, 205 file, +17.536/−2.729

Cú squash lớn nhất của repo tháng này, nối tiếp "B2B early payment discount P1–P5" đã ghi ở
[[shipped-pdf-2026-08-11]]. Ba mảng:

- **Engine mới**: `b2bDiscount.service.js` (592 dòng) + `companyPaymentRule` (controller /
  service / repository / schema / route), `applyB2BDiscount` handler (286 dòng) qua Pub/Sub,
  cron `expireB2BDiscounts`, `b2bDiscountRecordRepository` (253 dòng), helper tách nhỏ
  (`matchRuleForOrder`, `allocateFixedAmount`, `getB2BDiscountPercent`,
  `getEditableLinesForDiscount`, `buildEarlyPaymentSnapshot`, `validatePaymentRule` 240 dòng).
- **Gỡ cơ chế cũ**: xoá `PaymentTerm.js` (287), `useDiscountModal.js` (306),
  `handleCreateDiscount.js` (77), `handleChangeProductDiscount.js` (94),
  `discount.controller`/`discount.service`, `mail.service.js` (123) và template email
  `templateDiscount.html` (584). Có hẳn `legacyMechanismRemoved.test.js` (158 dòng) khoá
  việc gỡ này lại → đây là **đảo hướng có chủ ý**, ghi riêng ở
  [[2026-08-19-b2b-rule-thay-discount-thu-cong]].
- **Bề mặt hiển thị**: `EarlyPaymentBenefit` + `PaymentHistory` trong Order page, trang
  `B2B/PaymentTerms` (420 dòng + BenefitRow/LocationCard/TermPickerModal), token
  early-payment nhúng vào **28 theme liquid**, 11 file locale (+239 dòng mỗi ngôn ngữ), và
  `hasGrantedScopes` + `UpdateScopes.js` cho scope company.
- **Hạ tầng test mới**: thư mục `e2e/` với Playwright (`global-setup`, `seed`,
  `interceptApi`, 5 spec — `orderDetail` 390 dòng, `paymentTerms` 334) và ~25 file unit test
  mới. Đây là lần đầu repo pdf có e2e riêng; repo subscriptions đã đi trước bước này
  ([[shipped-subscriptions-2026-08-07]]).
- **2 script audit**: `template-sync-audit.js` + `template-sync-audit-deep.js` — soi độ lệch
  giữa 28 theme liquid, tức thừa nhận "sửa 28 template bằng tay" là bề mặt cần công cụ
  canh, cùng bài học phủ theme của [[shipped-pdf-2026-08-04]].

**Migration**: `firestore.indexes.json` +16/−? dòng — có index mới, cần deploy indexes trước
khi bật.

### `feat/templates-redesign` — đóng 5 issue To Do SB-14670 rồi tự sửa lại 3 lần

Thứ tự thật (cũ → mới): `241b16b54` → `5b713d8a7` → `a227afdb5`(font, khác nhánh) →
`d28a86335` → `ad06dc109`.

- **`241b16b54`** đóng 5 issue một lượt: SB-15701 toast không hiện trong max modal (helper
  `showToast` chọn kênh theo env — embed dùng `shopify.toast` tầng host, standalone giữ redux
  Toast), SB-15533 tên template không truncate (span inline + thiếu `min-width: 0`), SB-15700
  modal preview không đổi label Select/Unselect (trước chỉ update cache react-query, không
  sync state), SB-15705 loé editor ở app frame, SB-15706 color picker "Not found".
- **SB-15705 phải vá 3 lần** — chuỗi đáng giữ vì nó là bài học về *vị trí* của skeleton:
  vòng 1 hoãn mount children tới `Modal onShow`; `5b713d8a7` phát hiện gate onShow chưa đủ vì
  **skeleton nằm TRƯỚC nó** (nhánh `!fetched` return thẳng `<TemplatePageLoading/>` ra app
  frame kèm nav + top bar, rồi max modal mới mở đè lên) → mở max modal ngay lúc loading với
  skeleton làm children, **cùng một `EditorMaxModal` instance** nên khi data về chỉ swap
  children, modal không remount; `d28a86335` dọn nốt hệ quả: nhánh `!fetched` truyền
  `loading=true` nên overlay spinner của modal trùng spinner sẵn có trong
  `<TemplatePageLoading/>` → 2 icon loading.
- **SB-15706 → thay hẳn `react-color` bằng Polaris `ColorPicker`** (`141928f3f`): fix inline
  của vòng trước chưa đủ, react-color vẫn gọi `getContainerRenderWindow` và walk lên
  `window.parent` (frame Shopify admin, khác origin) khi `window.document.contains(container)`
  false trong web-component `ui-modal` → `SecurityError`. Đây là **thay dependency**, ghi
  riêng ở [[2026-08-19-bo-react-color-dung-polaris-colorpicker]].
- **`ad06dc109`** — SB-15717/19/20/21 + SB-15722. Root cause preview đáng giữ:
  `PREVIEW_ORDER_SHORT` set về **0** cho order discount / shipping discount / order tax /
  refund, mà mọi theme gate dòng tiền bằng `!= "0.00"` / `> 0` ⇒ 4 dòng biến mất **chỉ trên
  preview** (prod dùng order đầy đủ vẫn hiện) — tức là bug của *dữ liệu mẫu*, không phải của
  theme. Bơm giá trị mẫu != 0 (+ `automatic_*` cho billing mode, `automatic_total_discounts`
  cho theme gộp discount kiểu london/sydney) và tính lại Total theo đúng công thức template;
  `tax_lines` cố ý giữ rỗng vì mọi theme fallback nhãn "Tax" và gate row bằng `total_tax`.
  SB-15722: `handleSave` khi validate fail **luôn** `setActiveMenu(GENERAL)` trong khi field
  validate nằm 2 tab (name→General, social→Content) ⇒ lỗi url social đá về General, người
  dùng không thấy lỗi ở đâu → map `VALIDATION_FIELD_TAB` + `getFirstInvalidTab`, không đổi
  tab nếu lỗi nằm ngay tab đang mở.
  Verify ghi trong commit: backend 307/307 pass, lint sạch, `production:embed` exit 0.

### `feat/pdf-fonts-56` — `a227afdb5`, font picker 18 → 72 entry

Gốc là ticket PDF-260802-WyvjTY xin DM Sans + DM Serif Display (đã thêm ở `f8b28b53b`, xem
[[shipped-pdf-2026-08-04]]), team chốt làm luôn cả bộ ⇒ lần này thêm **54**, không phải 56.
Chỉ sửa `constants/fonts.js` — file dùng chung cho Wizard Settings, DesignMenu và TemplatePage
nên **không phải đụng dòng template liquid nào**. Hai quy ước đáng giữ: giữ nguyên 18 entry cũ
đúng thứ tự (chúng không sắp alphabet, chèn vào giữa là phá nhóm sẵn có), và nhãn gợi ý ngôn
ngữ để ở `label` chứ KHÔNG lọt vào `value` vì `value` phải là tên family thật của Google
Fonts (`{label: 'KoHo (Thai)', value: 'KoHo'}`).
Verifier **gọi thật `fonts.googleapis.com`** cho cả 72 value (đúng endpoint app dùng, không
encode dấu `+`) và fetch cả body để chắc không phải 200 rỗng: 54 font mới đều 200; `Source
Sans 3` mới là tên hiện tại chứ không phải `Source Sans Pro`; `Arial` trả 400 nhưng nó là font
hệ thống nằm trong `ignoreFonts` nên không bao giờ được request.

### `feature/sidekick-agent-extensions` — `5551d4c7a`, sửa 2 comment ghi sai sự thật

Chỉ sửa comment, không đụng key/value nào — nhưng đúng loại sai khiến người sau tin nhầm rồi
ship lỗi thật:
- `shopify.sidekick.toml` ghi *"Hard limit: 500 characters"*; giới hạn THẬT là **256 token** —
  khác đơn vị hẳn. Vô hại hiện tại chỉ vì trùng hợp (giá trị đang dùng 351 ký tự). Ai sửa
  field này mà soi theo comment cũ có thể phình tới 490 ký tự rồi vượt trần token thật.
- `print-order-invoice/shopify.extension.toml` ghi Shopify chỉ hỗ trợ **3** type
  `application/*`; thật ra là **9**, đã sửa theo SB-15363 và câu đúng đã nằm sẵn ở
  `edit-email-automation/shopify.extension.toml` → hai comment trong cùng repo cãi nhau, cái
  ở đây là cái cũ còn sót.
Verifier tự fetch `shopify.dev` xác nhận cả 2 con số chứ không tin lời implementer — đúng kỷ
luật [[bang-chung-phan-biet-duoc]].

### `chore/remove-hardcoded-secrets` — `a47246b47`, 5 file

Thay giá trị thật bằng placeholder/biến môi trường ở `RELEASE_NOTE.md` (GCP api key, OAuth
client id + secret, SendGrid key), `example/google.js`, `commands/testEmail.js`
(`SENDGRID_API_KEY`), `packages/functions/src/commands/testWebhook.js`
(`SHOPIFY_ACCESS_TOKEN`), + khai báo biến mới ở `.env.example`. Commit body tự ghi rõ: giá
trị cũ **vẫn còn trong git history và tại thời điểm commit VẪN CÒN HIỆU LỰC**. Đúng nội dung
[[feedback-xoa-secret-khoi-code-chua-phai-vo-hieu-hoa]]. Xem mục ⚠️ bên dưới.

## Reverted

Không có revert. Chuỗi SB-15705/15706 là **sửa đè liên tiếp trên cùng nhánh**, không phải
`git revert`.

## Deploy notes

- **Không cờ deploy**: không `[deploy-functions]` / `[deploy-all]` / `[deploy-extensions]`
  trong log ngày này.
- **Không tag, không version bump** — master đứng yên ở `v3.1.78`.
- **Migration**: `feat/early-payment-benefit` sửa `firestore.indexes.json` (16 dòng) →
  cần deploy indexes trước khi bật feature. Cũng đụng `.gitlab-ci.yml` (1 dòng) và thêm
  `e2e/.gitignore` — cần soi khi merge vì `.gitlab-ci.yml` của repo này đã tách thành
  `.gitlab/ci/*` ([[shipped-pdf-2026-08-14]]) và slot staging đang chia theo
  [[2026-08-14-staging-4-cho-nhanh-sidekick]].
- **Pub/Sub topic + cron mới** (`config/pubsub.js`, `handlers/cron/expireB2BDiscounts.js`) →
  lần deploy đầu phải tạo topic, không chỉ là push code.

## ⚠️ Cần xác nhận

**1. "Remove hardcoded secrets" chưa phủ hết danh sách brain đã lập.**

| Nguồn | Nói gì |
|-------|--------|
| [[digest-pdf-2026-08-18]] (session 08-17/18) | ngoài 3 finding của scanner còn `client_secret`, SendGrid key, **và một khoá mã hoá scanner bỏ sót ở `packages/functions/src/config/crypto.js:2`** — khác hẳn về hệ quả so với API key |
| commit `a47246b47` (08-18) | diff chỉ chạm 5 file: `RELEASE_NOTE.md`, `example/google.js`, `commands/testEmail.js`, `commands/testWebhook.js`, `.env.example` — **không có `config/crypto.js`** |

Cần xác nhận: `crypto.js` cố ý để lại (vì đổi khoá mã hoá thì mất data thật, như chính digest
đã cảnh báo) hay là bị sót? Nếu cố ý thì lý do đó phải nằm trong repo, không chỉ trong brain.

**2. "Cần revoke/rotate ở phía provider" — đúng với 3/4 credential, không đúng với cái
`AIza…`.** Commit body kết luận chung là *rotate*. Nhưng [[digest-pdf-2026-08-18]] +
[[api-key-cong-khai-khong-phai-secret]] đã chốt: key `AIza…` trong `RELEASE_NOTE` là Firebase/
Google Picker API key **được in thẳng ra browser** (cùng giá trị nằm ở `SHOPIFY_FIREBASE_API_KEY`,
`GOOGLE_DEVELOPER_KEY` và bundle FE do CI build) ⇒ giá trị mới cũng lộ ngay lượt tải trang đầu,
biện pháp thật là **restrict theo referrer/API**, và thứ tự bắt buộc là *đổi mọi consumer →
redeploy → verify → mới xoá key cũ*. Cần xác nhận người nhận việc rotate đã biết phân biệt này,
vì làm theo commit body một cách máy móc thì vừa tốn công vừa có thể gãy login toàn bộ merchant.

**3. Version bump của B2B early payment chưa có.** Feature 205 file kèm index Firestore + cron
+ Pub/Sub mà chưa có tag nào — xác nhận mốc go-live dự kiến, vì repo này đã có tiền lệ đổi
go-live date bằng MR riêng ([[shipped-pdf-2026-08-08]]).

Liên quan: [[pdf]] · [[shipped-pdf-2026-08-14]] · [[shipped-pdf-2026-08-13]] ·
[[digest-pdf-2026-08-18]] · [[api-key-cong-khai-khong-phai-secret]] ·
[[feedback-xoa-secret-khoi-code-chua-phai-vo-hieu-hoa]] ·
[[2026-08-19-b2b-rule-thay-discount-thu-cong]] ·
[[2026-08-19-bo-react-color-dung-polaris-colorpicker]]
