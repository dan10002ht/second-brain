# PDF Invoice — BRIEF (đã xong)

> Task xong quá 3 ngày được `/looptasks` cắt từ `BRIEF.md` sang đây, **giữ nguyên tóm tắt**.
> Đây là lịch sử để tra lại: task nào nằm ở nhánh/commit nào, verify ra sao, nợ gì còn lại.
> File ngoài graph wiki (tiền tố `BRIEF` nên `brain-lint` bỏ qua).

## 2026-08-06


1.  [✅ 2026-08-06] https://space.avada.net/browse/SB-15301 hiện tại tôi đang có tính năng thế này, và MR này https://gitlab.com/avada/pdf-invoice/pdf-invoice-firebase/-/merge_requests/501 (update/product-20260806-1714) là mockup cũng như PRD của tính năng trên
    Trước tiên thì giúp tôi làm rõ feature cũng như lên plan feature này nhé

    **XONG 06/08** — deliverable: `product-team/marketing/product/prd/spec-payment-reminder-due-overdue.md` (344 dòng)
    - nhánh `feature/payment-reminder` · commit `804464917` · **chưa push**
    - Spec gồm: Context · OPEN QUESTIONS Q1–Q8 (đặt đầu file) · Scope · UI/UX 3 màn · bảng as-is backend
      kèm file:line · data model (collection `paymentReminders` mới + field thêm vào `wholesaleOrders`) ·
      3 phương án trigger kèm trade-off (không tự chốt) · pseudo-code logic gửi · plan gate Wholesale
      FE+BE · rủi ro R1–R6 · 16 acceptance criteria · implementation plan P0–P4
    - Verify: agent `verifier` chạy 2 vòng. Vòng 1 FAIL (1/~56 tham chiếu sai: `liquid.service.js:27`
      trỏ vào `export class` thay vì method `parse` ở dòng 28). Sửa + vòng 2 **PASS**, không finding.
      Verifier đã đọc trực tiếp ~56 tham chiếu file:line, spot-check lại 8 cái sau vòng sửa.
      `git diff --stat` rỗng — không đụng file code/mockup nào.
    - KHÔNG cập nhật `CHANGELOG.md`: file đó theo convention release-version của app (v2.0.x + ngày),
      không phải nơi ghi tài liệu nội bộ.

    **Tiến độ 06/08 17:26–18:0x** — recon (3 Explore agent).
    - Jira: "[DEV][PDF] Payment reminder due date & overdue (Wholesale plan only)", reporter longlv, sprint 58, assignee field ghi `dantt`.
    - **KHÔNG có PRD** cho feature này (grep SB-15301 toàn repo = 0; không nằm trong index `prd/README.md`).
      Nguồn spec thực chất = mockup MR 501 + comment code. Backend chưa có gì (grep "reminder" trong
      `packages/functions/src` = 0).
    - Yêu cầu gốc khách 05/08: gửi **ADJUSTED invoice** → PDF phải render TẠI LÚC GỬI (phản ánh order edit,
      trả một phần, combine), không dùng file cache.
    - Mockup chạy local: `cd product-team/marketing/product/mockup-app && yarn dev` → localhost:3200.
      Route: `/automation_email` (card) · `/automation_email/payment-reminders/:type` (due|overdue) ·
      `/automation_email/customize-template`.
    - **Hạ tầng đã có sẵn** (không phải build mới): `dueAt` + `overdue` + `paymentBadge` trong collection
      `wholesaleOrders` (`helpers/company/formatOrder.js:52,100,109`); cron `updatePaymentTermSchedule`
      (`0 * * * *`) → `handlers/cron/handleOrderDaily.js`; `MailService.sendMail()`; custom SMTP
      (`emailNotifications`); LiquidJS; gate `isShopWholesale()` (`config/getPlans.js:435`).
      Pattern gần nhất để clone: `WholeSaleService.#processExpiredOrder` + cờ `isSendExpiredEmail`.
    - **Cần build mới**: settings schema + API, cron step gửi reminder, cờ idempotency, 2 trang FE.

    **Câu hỏi còn treo (chưa chốt — cần Product/anh dantt quyết):**
    - [x] **CHỐT 06/08 (dantt): overdue KHÔNG lặp vô hạn.** Hai ô trong Card "Schedule" của mockup
          (`payment-reminder-settings.jsx:354-371`) = **2 mốc gửi**, không phải vòng lặp:
          `timingDays` ("Days after the overdue date") → email overdue lần 1;
          `resendDays` ("Send again after") → email overdue lần 2, **một lần duy nhất**.
          → Tối đa **3 email/đơn**: 1 due + 2 overdue. Không cần `maxResend`, không cần trần.
          Rule duy nhất: mỗi lần gửi **kiểm lại đơn còn unpaid** (paid/cancel/refund thì thôi).
          Field kỹ thuật trong `wholesaleOrders` (merchant không thấy): `lastReminderSentAt` +
          `reminderSentCount` — cần vì cron chạy `0 * * * *` = 24 lần/ngày, phải biết đã gửi chưa.
          Giống cờ `isSendExpiredEmail` đang dùng cho email discount hết hạn.
          ⚠️ Ghi chú: chưa hỏi Philip xác nhận cách đọc "Send again after" = 1 lần (mockup không viết rõ).
          ✅ Spec đã sửa lại theo quyết định này, verifier PASS vòng 2.
    - [x] **CHỐT: "Fixed date" CÓ gửi reminder.** Nó có due date thật (merchant tự chọn ngày).
          ⚠️ Bẫy khi code: `isNetPaymentTerms` (`constants/paymentTermNames.js:13`) = `paymentTermsName !== FIXED`
          → trả `false` cho Fixed date. Feature early payment discount đang lọc đơn bằng helper này.
          **KHÔNG tái dùng `isNetPaymentTerms` để lọc order cho reminder** — chỉ cần điều kiện `dueAt != null`.
          (Vẫn bỏ qua "Due on receipt"/"Due on fulfillment" — `paymentWithoutDate`, không có mốc.)
    - [x] **CHỐT: scope cấu hình = global theo shop** (đúng mockup, không override theo company).
    - [x] **CHỐT: reminder thứ 3 (mốc ưu đãi trả sớm) — ĐỂ SAU**, không làm phase này.
    - [x] **CHỐT: trigger = phương án A (khuyến nghị)** — thêm bước thứ 3 vào cron `handleOrderDaily.js`
          sẵn có (`0 * * * *`), không dựng cron mới. dantt: "làm theo hướng recommend trước, note vào đây
          để sau này tôi đổi ý". → **Nếu đổi ý**: điểm phải sửa là query candidates trong
          `WholeSaleService.sendPaymentReminders()` + chỗ đăng ký scheduled function ở `index.js:136-139`.
          Hai phương án còn lại (cron riêng theo timezone shop / webhook `payment_schedules/due`) mô tả
          ở mục 4.4 của spec, giữ nguyên để đối chiếu.
    - [x] **CHỐT: gate plan / thông điệp upgrade — ĐỂ SAU**, tạm dùng chung `triggerFeature="netTerms"`.
    - [ ] ~~Reminder thứ 3~~ (giữ lại giải thích để tra cứu) — early payment discount cho
          khách giảm vd 2% nếu trả trong 10 ngày, trong khi due date thật là Net 30 → **2 mốc khác nhau**.
          `spec-company-early-payment-discount.md:235` mô tả story "nhắc trả sớm → được giảm → quá hạn
          thì mất ưu đãi" ngụ ý cần email nhắc mốc ưu đãi. Mockup không có.
          **Đề xuất: KHÔNG làm phase này, ghi nhận phase sau.** Chờ dantt xác nhận.
          Reply: để sau nhé

2. [✅ 2026-08-06] **SB-15301 P0** — Data model + API cấu hình payment reminder (chưa gửi mail)
   - nhánh `feature/payment-reminder` · commit `a4fff6439` · **chưa push**
   - Tạo: `schemas/paymentReminderSchema.js` (Yup, khớp mockup DEFAULTS + DEFAULT_EMAIL_THEME) ·
     `repositories/paymentReminderRepository.js` (`getForShop` merge default+saved, `updateOrCreate`) ·
     `routes/paymentReminder.route.js` (Koa, `GET/POST /payment-reminders`, tách khỏi `/email_notification/*`) ·
     `controllers/paymentReminder.controller.js` (gate `isShopWholesale` → `ForbiddenError`)
   - Sửa: `routes/index.routes.js` · `repositories/wholesaleOrdersRepository.js`
     (`getOrdersForDueReminder` dùng `dueAt != null`, **không** dùng `isNetPaymentTerms`;
     `getOrdersForOverdueReminder(shopId, step)` với `overdueReminderCount == 0|1`) ·
     `constants/defaultData.js` (`defaultPaymentReminder`) · `firestore.indexes.json` (2 composite index)
   - 2 chỗ default cố ý lệch mockup, **có comment giải thích**: `theme.logoImage` dùng `DEFAULT_LOGO`
     app-wide (đổi theo branding app) thay vì hardcode CDN asset; `theme.buttonUrl` để rỗng theo
     helpText mockup ("Leave the default to open the invoice link generated for each order").
   - Verify: verifier 2 vòng. Vòng 1 FAIL (2 default lệch mockup không có comment). Vòng 2 **PASS**.
     Gate: `cd packages/functions && yarn test` exit 0 (3 suites/22 tests) · eslint 7 file P0 exit 0 ·
     `yarn workspace @avada/functions run production` exit 0 (418 files) · `firestore.indexes.json` JSON hợp lệ.
     Diff vs origin/master: 337 insertions, **0 deletions**, `packages/assets` không đụng, không có code gửi mail.
   - ⚠️ **Chưa xác minh**: 2 composite index có thật sự đủ cho query Firestore Native không (chưa chạy
     emulator) · API chưa test end-to-end với server thật, mới review tĩnh + đối chiếu convention.
   - Theo mục 8 của `product-team/marketing/product/prd/spec-payment-reminder-due-overdue.md`
   - Tạo: `repositories/paymentReminderRepository.js`, `schemas/paymentReminderSchema.js`,
     `routes/paymentReminder.route.js`, `controllers/paymentReminder.controller.js`
   - Sửa: `routes/index.routes.js` (gắn route), `repositories/wholesaleOrdersRepository.js`
     (thêm field `isSendDueReminder`, `overdueReminderCount`, `lastOverdueReminderAt` + query lọc)
   - Gate `isShopWholesale` ở BE (defense-in-depth, xem `helpers/email/getSenderFrom.js` làm mẫu)
   - Không phụ thuộc gì, rủi ro thấp nhất → làm trước

4. [✅ 2026-08-06] **SB-15301 P2** — Logic gửi qua cron (phương án A đã chốt)
   - nhánh `feature/payment-reminder` · commit `7ad035d31` · **chưa push**
   - nằm cùng nhánh gộp `feature/payment-reminder` (trước ở nhánh riêng, đã cherry-pick gộp 07/08)
   - Tạo `helpers/email/renderReminderMergeTags.js` (LiquidJS, đủ 8 biến EMAIL_VARIABLES).
     Sửa `services/wholeSale.service.js` (`sendPaymentReminders()` + private helpers, clone skeleton
     batch/chunk/idempotency từ `updateDiscountEarlyForOrder`/`#processExpiredOrder`) ·
     `handlers/cron/handleOrderDaily.js` · `repositories/paymentReminderRepository.js` (thêm
     `getAllShopIds()`) · `config/app.js` + `.env.example` (flag `ENABLE_PAYMENT_REMINDER_SEND`)
   - 🚩 **FEATURE FLAG MẶC ĐỊNH TẮT** — `ENABLE_PAYMENT_REMINDER_SEND=true` mới gửi thật.
     Khi tắt: chạy hết logic chọn candidate + render, log ra thứ *sẽ* gửi, **không** gọi `MailService.sendMail`
     và **không** ghi cờ trạng thái (verifier xác nhận cả 2 vế) → bật lên không mất đơn nào.
     Chờ Philip xác nhận cách đọc "Send again after" trước khi bật.
   - Verify: verifier 2 vòng. **Vòng 1 FAIL — bắt được hồi quy thật ngoài scope**: agent kéo
     `updateDiscountEarlyForOrder()` xuống chạy SAU `updatePaymentTerm()` (trước đó song song).
     Mà `updatePaymentTerm()` ghi `isDiscountEarly:false` cho đơn vừa OVERDUE, còn
     `getOrdersEarlyPaymentDiscount()` lọc `isDiscountEarly==true` và `#processExpiredOrder` không
     bao giờ set lại → đơn đó **vĩnh viễn** mất nhánh gỡ line-item discount + email "discount expired".
     Sửa: giữ nguyên `Promise.all` cũ byte-identical, chỉ `await sendPaymentReminders()` sau đó.
     Vòng 2 **PASS**, diff `handleOrderDaily.js` = 8 insertions / **0 deletions**.
   - Gate: `packages/functions && yarn test` exit 0 (22 tests) · eslint 5 file exit 0 ·
     `production` build exit 0 (419 files). `packages/assets` không đụng.

   ❓ **CÂU HỎI MỞ phát sinh khi implement — cần Product/Philip chốt (verifier nêu, chưa ai quyết):**
   Cron chỉ quét shop **đã có doc `paymentReminders`** trong Firestore (`getAllShopIds()`).
   Nhưng default trong `constants/defaultData.js` là `due.enabled: true` / `overdue.enabled: true`.
   → Shop Wholesale **chưa từng mở trang settings** sẽ KHÔNG nhận reminder nào, dù default là bật.
   Spec không có acceptance criterion nào cho case này (AC1/AC13 đều giả định đã tương tác toggle).
   Hai hướng: (a) giữ như hiện tại — an toàn, opt-in ngầm; (b) coi default `enabled:true` là thật,
   phải quét cả shop Wholesale chưa có doc → cần thêm cách list shop Wholesale.

   - `WholeSaleService.sendPaymentReminders()` + hook bước 3 vào `handlers/cron/handleOrderDaily.js`
   - Render merge tag + `getOrderForPdf` + attachment + `MailService.sendMail`
   - ⚠️ **Để feature-flag TẮT gửi thật** cho tới khi Philip xác nhận cách đọc "Send again after" = 1 lần
   - **Phụ thuộc task 2 (P0)**

6. [✅ 2026-08-06] **SB-15301 P4** — Test: cron logic (chọn candidate, idempotency, dừng đúng ở lần 2 không có lần 3)
     + API test (schema, gate plan). Mẫu: `__tests__/apiV1/emailAutomation.test.js`
   - **Bắt buộc xong trước khi bật cron ở production** (rủi ro tiền thật/spam)
   - nhánh `feature/payment-reminder` · commit `65377f0f6` · **chưa push**
   - nằm cùng nhánh gộp `feature/payment-reminder`
   - Tạo `__tests__/wholeSale/sendPaymentReminders.test.js` + `__tests__/wholeSale/wholesaleOrdersRepository.test.js`.
     **45 tests / 5 suites** (từ 22). Cover đủ 7 invariant: overdue dừng đúng ở lần 2 (fake repo có
     trạng thái, chạy 5 tick cron) · idempotency · R1 (đơn paid/cancel **giữa lúc query và lúc gửi**) ·
     feature flag OFF/ON assert cả 2 vế · gate plan (cron + API) · schema partial update · lọc
     `dueAt != null` (Fixed date VẪN chọn, `paymentWithoutDate` loại) test thẳng vào `.where()` thật.
   - 🔧 **2 bug hạ tầng test của repo phát hiện & sửa luôn** (ngoài scope nhưng chặn task):
     1. `jest.config.js` có `rootDir: 'src'` → **cả cây `packages/functions/__tests__/` chưa BAO GIỜ
        được `yarn test` chạy** (apiV1, campaign, quickstart... đều vô hình). Chỉ mở `roots` cho
        `__tests__/wholeSale`, không sửa rộng. Verifier xác nhận không kéo suite cũ nào vào (đúng 5 suite).
        ⚠️ **Nợ kỹ thuật còn đó**: phần còn lại của `__tests__/` vẫn không chạy — đáng mở task riêng.
     2. `smtpHelper.test.js` mock `{virtual: true}` cho file **giờ đã tồn tại thật** → Jest 24 lúc
        resolve trúng file thật lúc trúng mock, flake ~50% khi có thêm suite chạy cùng. Bỏ `virtual: true`,
        giữ nguyên giá trị mock. Verifier chạy riêng 5 lần liên tiếp: xanh cả 5.
   - **KHÔNG sửa code production** để test dễ hơn (ràng buộc đã giao) — verifier xác nhận
     `git diff -- packages/functions/src` chỉ có đúng `smtpHelper.test.js`.
   - Verify: verifier **PASS ngay vòng 1**, tự kiểm độc lập chứ không tin lời agent: fake repo có
     trạng thái thật · mock R1 trả trạng thái **khác** giữa 2 lần đọc · không có assertion rỗng.
     Gate: `yarn test` exit 0 **chạy 3 lần liên tiếp** đều 45/45 · eslint 2 file test exit 0 ·
     `production` build exit 0 (419 files). `packages/assets` không đụng.
   - ⚠️ **Chưa xác minh**: idempotency chỉ mô phỏng 2 tick cron (không replay đủ 24 tick/ngày) ·
     số học ngưỡng ngày `overdueReminderCount`/`resendDays` mới đọc code + test xanh, chưa tính lại từ đầu.

## 2026-08-07

3. [✅ 2026-08-07] **SB-15301 P1** — FE settings payment reminder (chưa gửi mail thật)
   - nhánh `feature/payment-reminder` · commit `43eb3f105` · **chưa push**
   - nằm cùng nhánh gộp `feature/payment-reminder` (trước ở nhánh riêng, đã cherry-pick gộp 07/08)
   - 25 files, 1735 insertions / 4 deletions. Tạo: `components/PaymentRemindersCard/` ·
     `components/ReminderEmailPreview/` · `components/ColorSwatchInput/` ·
     `pages/PaymentReminderSettings/` · `pages/CustomizeEmailTemplate/` ·
     `constants/paymentReminders.js` · `helpers/rule/paymentReminderRule.js` (validate subject /
     reply-to email) · 2 loadable. Sửa: `routes/routes.js` · `pages/Emails/Emails.js` ·
     `api/emailApi.js` · `const/queryKey.js` · `locale/translations/{en,origin}.json`
   - i18n: **tái dùng key sẵn có** `CombineOrders.showPlan` ("This option is available with our") +
     `CombineOrders.wholesalePlan` cho thông điệp gate Wholesale, đúng pattern `CombineOrders.js:94-99`
     và khớp mockup `PlanUpgradeText.jsx:34-45`. Chọn namespace `CombineOrders` vì đó là feature
     gate Wholesale sẵn có (khớp ngữ cảnh, không chỉ khớp chuỗi).
   - Verify: verifier **4 vòng** (3 FAIL rồi PASS). Vòng 1: UI hardcode tiếng Anh, không wire i18n.
     Vòng 2: tự chế chuỗi "Available on the Wholesale plan" thay vì tái dùng key sẵn có của app.
     Vòng 3: đã sửa 2 call-site JS nhưng **sót bản sao** trong `constants/paymentReminders.json`
     (dead code, không ảnh hưởng runtime) + comment mô tả sai nguồn label. Vòng 4 **PASS**, 0 finding.
     ⚠️ Vòng 3→4 vượt quota 2 vòng sửa của looptasks — **dantt duyệt cho chạy thêm 1 vòng ngoại lệ**.
   - Gate verifier tự chạy vòng 4: `grep availableOn` 0 match (cả 11 file locale) ·
     `paymentReminders.json` JSON hợp lệ, 3 key còn lại nguyên vẹn · eslint file sửa exit 0 ·
     `yarn workspace @avada/assets run production` exit 0 (2 vite build) ·
     `packages/functions && yarn test` exit 0 (3 suites/22 tests) · `packages/functions` không đụng ·
     không lọt `node_modules`/build artifact.
   - ⚠️ **Chưa xác minh**: mới build + review tĩnh, **chưa chạy app thật** để bấm thử 2 trang settings
     và xác nhận API P0 trả/nhận đúng end-to-end.
   - 🐛 **Sự cố vận hành (ghi lại để tránh lặp)**: agent vòng 4 chạy >60 phút wall-clock nên vượt
     ngưỡng lock 30 phút → iteration sau tưởng mồ côi và spawn agent thứ hai trên **cùng worktree**.
     Phát hiện kịp, `TaskStop` cái thứ hai trước khi nó sửa gì; verifier đã kiểm riêng dấu vết
     sửa đôi (JSON lỗi, comment lặp) → sạch. **Ngưỡng 30 phút hơi ngắn cho task build nặng.**

5. [✅ 2026-08-07] **SB-15301 P3** — Nút "Send test" gọi API thật (`POST /payment-reminders/:type/test`)
   - nhánh `feature/payment-reminder` · commit `a732a6db0` · **chưa push**
   - ⚠️ Lúc implement, P3 nằm ở nhánh riêng base P2 + merge P1 nên baseline test khi verify là
     3 suites/22. Sau khi gộp về `feature/payment-reminder` (có cả P4) thì baseline là **5 suites/45**.
   - 9 files, 195 insertions / 12 deletions.
     BE: `routes/paymentReminder.route.js` (route mới) · `controllers/paymentReminder.controller.js`
     (`sendTest`, gate `isShopWholesale`, validate `type` → `BadRequestError`) ·
     `services/wholeSale.service.js` (`sendTestReminderMail()`) · `schemas/paymentReminderSchema.js`
     (export `reminderConfig`) · `schemas/paymentReminderTestSchema.js` (mới).
     FE: `api/emailApi.js` · `pages/PaymentReminderSettings/PaymentReminderSettings.js` ·
     `locale/translations/{en,origin}.json`
   - **Tái dùng, không viết mới**: `renderReminderMergeTags` + `getPDFAttachment` của P2 (verifier xác nhận
     là **đúng cùng hàm** đường cron đang gọi, không nhân bản logic render) · component FE
     `SendTestMailModal` sẵn có · fixture đơn mẫu `storage/order.json` giống
     `EmailNotificationService.sendTestMail` · **0 key i18n mới** (dùng
     `AutomationEmail.Toast.sentSuccessfully`, error toast dùng `e.message` như `saveMutation.onError`).
     Xoá key `sendTestComingSoon`.

   - 🔧 **ĐÍNH CHÍNH 07/08 (phát hiện khi làm task 10)**: câu "Xoá key `sendTestComingSoon`" ở trên
     **chỉ đúng một nửa**. Key đã xoá khỏi `locale/translations/en.json` + `origin.json` — nhưng
     đó là **file được SINH RA**, không phải nguồn. `PaymentReminderSettings.toast.sendTestComingSoon`
     **vẫn còn** trong `pages/PaymentReminderSettings/PaymentReminderSettings.json`, là file nguồn mà
     `commands/autoTranslateV2.js:223-227` quét rồi ghi đè lên `en.json` mỗi lần chạy `yarn trans`.
     ⇒ Lần tới ai chạy `yarn trans`, key rác đó **sống lại**. Không JS nào tham chiếu nên vô hại về
     runtime, nhưng là rác và là dấu hiệu của bug-class bên dưới.
     Chưa sửa — nằm ngoài scope task 10, cố ý không đụng namespace khác.

   - 📌 **BÀI HỌC CHUNG (đã lặp 3 lần, đáng nhớ)**: `packages/assets/src/locale/translations/*.json`
     là **file generated**. Nguồn thật là các file `<TênComponent>.json` nằm cạnh component/page
     trong `packages/assets/src`. Sửa i18n mà chỉ đụng `translations/` thì `yarn trans` sẽ hoàn tác.
     Đã vấp: task P1 (sót `constants/paymentReminders.json`) · task P3 (`sendTestComingSoon`) ·
     task 10 (sót 8 key toolbar, verifier bắt được).
     → **Luôn sửa file nguồn TRƯỚC, rồi mới tới `translations/`.**
   - 🚩 **Feature flag `ENABLE_PAYMENT_REMINDER_SEND` cố ý KHÔNG áp cho send-test** — flag chỉ chặn cron
     gửi hàng loạt cho khách thật; merchant tự bấm gửi cho chính mình phải chạy được kể cả khi flag tắt.
     Verifier kiểm **cả 2 vế**: send-test chạy khi flag tắt, và đường cron vẫn KHÔNG gửi thật khi flag tắt.
   - Verify: verifier **PASS ngay vòng 1**, 0 finding vi phạm done-criteria.
     Gate: `packages/functions && yarn test` exit 0 (3 suites/22 tests, đúng baseline) ·
     `@avada/functions run production` exit 0 (420 files) · `@avada/assets run production` exit 0
     (`grep -c "✓ built in"` = 2) · eslint 5 file BE + 2 file FE exit 0.
     💡 Verifier phát hiện `yarn workspace @avada/functions run lint -- <files>` **nuốt tham số**
     (script hardcode `src/`) nên luôn lint cả repo → phải gọi thẳng `./node_modules/.bin/eslint <files>`
     mới có tín hiệu theo file. Ghi lại để lần sau khỏi mất công.
   - ⚠️ **NỢ / CẦN QUYẾT — verifier khuyến nghị KHÔNG lặng lẽ đóng lại:**
     **Send-test không có rate-limit**, trong khi `EmailNotificationService.sendTestMail` có
     `MAX_TEST_EMAILS`/`testMailCount` (`emailNotification.service.js:139`). Verifier phản bác lý do
     của agent ("counter là private, tái dùng là scope creep"): `testMailCount` nằm trên **shop doc**,
     không private, tái dùng rẻ. → Là **lỗ hổng abuse thật**: merchant bấm liên tục = SMTP gửi không
     giới hạn + render PDF lặp lại (tốn tiền). Chấp nhận ship phase này **chỉ khi mở task theo dõi**.
   - ⚠️ **Chưa xác minh**: chưa chạy runtime với shop thật (SMTP, sinh PDF, vòng đời Puppeteer) —
     verifier chỉ soi tĩnh · `sendTestReminderMail` bỏ qua `getShopTimeZone` mà đường cron có gọi,
     dùng `timezone=''` → `getDateText` fallback UTC; verifier đánh giá **chấp nhận được** vì ngày trong
     mail test vốn là mốc tổng hợp ±5/±10 ngày, không mang nghĩa nghiệp vụ · chưa kiểm
     `getShopCountryByShopId` trả giá trị hợp với `sampleOrder.billing_address.country_code` downstream.

7. [✅ 2026-08-07] Kiểm tra tại sao tính năng payment reminder kia chưa toggle được và ko hiển thị save change top bar nhé ?
   - nhánh `feature/payment-reminder` · commit `5291caa65` (save bar trang settings) + `16a48d124`
     (toggle card qua save bar) + `c261c16d7` (default OFF) · **chưa push**

   ### ✅ Vòng 4 (07/08) — default `enabled` đổi TRUE → FALSE, commit `c261c16d7`
   - **dantt phát hiện**: "default là disable chứ nhỉ? chứ khách cũ thì làm gì enable". Đúng —
     feature tự động gửi mail RA CHO KHÁCH của merchant, default bật nghĩa là **mọi shop Wholesale cũ
     đột nhiên bắt đầu gửi mail** mà chưa từng đồng ý. Phải opt-in.
   - **Gỡ luôn CÂU HỎI MỞ treo từ P2** (xem task 4): cron chỉ quét shop **đã có doc** `paymentReminders`
     trong khi default là `true` → hai vế đá nhau, không ai chốt được. Để `false` thì hết mâu thuẫn:
     chưa vào bật thì không gửi, đúng cả hai đường. **Câu hỏi mở đó coi như đã đóng.**
   - Sửa đúng 2 dòng ở `constants/defaultData.js:58,70` — đây là **single source of truth**, mọi consumer
     (BE `getForShop`, FE `Emails.js`, `PaymentRemindersCard`, `PaymentReminderSettings`) đều import
     hằng này, KHÔNG nơi nào hardcode `true` riêng. Lần này không sót bản sao nào (khác P1).
   - Kiểm hệ quả trước khi đổi, không đổi mù:
     · Cron `sendPaymentReminders()` dùng truthy check thẳng (`if (!due.enabled && !overdue.enabled) return`),
       **KHÔNG có pattern `!== false`** coi `undefined` là bật → default tắt được tôn trọng thật.
     · Yup `reminderConfig.enabled` **không có `.default()`** → schema không tự tiêm `true` vào đâu.
     · 5 suite test **không suite nào import `defaultPaymentReminder`** — đều tự dựng fixture
       `{enabled: true/false}` tường minh, nên không suite nào ngầm giả định default bật.
       Không phải sửa test nào, baseline giữ nguyên 45 tests.
   - Shop đã lưu `enabled: true` tường minh thì GIỮ NGUYÊN (saved đè default) — không ảnh hưởng ai đã bật.
   - Gate: `yarn test` exit 0 (5 suites/45) · eslint exit 0 · `@avada/functions run production` exit 0
     (420 files). Không chạm `packages/assets` nên không chạy vite build.
   - 📌 Còn lệch có chủ ý: `mockup-app/src/utils/paymentReminders.js:84-99` vẫn `enabled: true`.
     Mockup nằm ngoài build app thật, không import vào code chạy → cố ý không đụng.
   - ⚠️ **Còn 1 việc dantt cần test thật**: gõ tiếng Việt/IME vào ô Content (xem mục "Chưa xác minh"),
     và xác nhận triệu chứng 2 đã hết hẳn chưa.

   ### ✅ Vòng 3 (07/08 16:20–17:xx) — toggle card chuyển sang save bar, verifier PASS
   - dantt xác nhận sau `5291caa65`: **toggle ở `/automation_email` đã bấm được**, nhưng "ko thấy
     hiển thị save change top bar". Làm rõ: card cố ý lưu-ngay theo mockup
     (`PaymentRemindersCard.jsx:93-94`), save bar của `Emails.js` chỉ theo dõi `setting`/`automationEmails`;
     mutation lại chỉ có toast LỖI, không có toast thành công → bấm xong không thấy phản hồi gì.
   - **CHỐT (dantt chọn giữa 3 phương án): chuyển toggle card sang dùng save bar** — lệch mockup,
     đổi lại đồng nhất với mọi control khác của feature.
   - **Cách làm**: nâng state lên `pages/Emails/Emails.js` — giữ `paymentReminders` +
     `initialData.paymentReminders`, fetch 1 lần với đúng gate `enabled: isShopWholesale` cũ
     (`Emails.js:113`); `isShowSaveBar()` cộng vế `remindersDirty` **chỉ khi `tab === AUTOMATION_EMAILS`**
     (`Emails.js:426-438`, nhánh `EMAIL_NOTIFICATION`/`EMAIL_SETTINGS` giữ nguyên ngữ nghĩa cũ);
     `getDirtyReminderPayload()` trả `null` khi không đổi → **không ghi thừa** khi user chỉ sửa thứ khác;
     `onSuccess` invalidate `QUERY_KEY.paymentReminders` + cập nhật `initialData` → save bar tắt và
     trang settings chi tiết refetch đúng. `handleDiscard` reset về `initial`.
     `PaymentRemindersCard` thành **controlled component thuần** — gỡ hết `useQuery`/`useMutation`/
     optimistic update (thứ vừa thêm ở `5291caa65`)/`setToast`, chỉ nhận `reminders` + `onChangeReminder`.
   - **Rời trang khi đang dirty**: không cần code thêm — `hooks/useSaveBar.js:43-56` cài
     `history.block(...)` toàn cục khi `showing` true, chặn cả `history.push` của `openReminder`
     (bấm chevron mở trang chi tiết) → leave-confirmation chạy đúng cả embedded lẫn standalone.
     Verifier đã đọc xác minh, không tin lời agent.
   - Verifier **PASS vòng 1**, tự kiểm T1–T11 + đối chiếu `git show HEAD:` cho phần save bar cũ.
     Kịch bản nghi ngờ nhất trong brief (**save bar tự bật sai lúc load** khi shop có data khác default)
     → KHÔNG xảy ra: `useEffect` (`Emails.js:146-151`) set `paymentReminders` và
     `initialData.paymentReminders` **trong cùng một effect** nên cùng batch, không có render lệch.
     Gate: `packages/functions && yarn test` exit 0 (5 suites/45) · eslint 2 file exit 0 ·
     `@avada/assets run production` exit 0 (`✓ built in` = 2) · `git status` đúng 2 file ·
     `PaymentReminderSettings.js` `git diff` rỗng · 0 key i18n mới.
   - 🔍 Verifier nêu, KHÔNG chặn: race hẹp nếu user toggle **trước khi** query resolve lần đầu thì
     effect ghi đè mất thao tác. Nhưng `automationEmails`/`setting` **vốn đã** xử lý y hệt từ trước
     (cùng file, không do diff này), + `staleTime: Infinity` nên query chỉ chạy 1 lần lúc mount
     → cửa sổ vài trăm ms. Là rủi ro kiến trúc có sẵn của trang, không phải hồi quy.
   - 💡 Còn tồn tại (pre-existing, không do diff này): card render bằng `defaultPaymentReminder`
     (`enabled:true`) trước khi query resolve → có thể nháy "bật rồi tự tắt". Code cũ ở HEAD cũng vậy.

   🔁 **Vòng 2 (07/08 13:45–15:xx)** — dantt đưa 2 screenshot. Ảnh 1: sửa được rich-text "Content"
   nhưng save bar vẫn KHÔNG hiện → bác kết luận vòng 1 (field edit được, không bị gate khoá, mà
   dirty-check vẫn không bắt ⇒ bug wiring thật). Ảnh 2: card "Payment reminders" ở trang Automation
   Emails, mũi tên vào toggle row "Payment due reminder" — "chỗ này ko được nè"; card render đầy đủ,
   2 toggle đậm (bật) và KHÔNG mờ, không có badge/link upgrade.
   Vòng 1 sai vì cả agent điều tra lẫn verifier **chỉ trace đường `Toggle` của trang settings**,
   không trace field Content. Bài học: có bằng chứng runtime thì trace ĐÚNG control mà user chạm.

   ### ✅ Triệu chứng 1 (save bar) — ĐÃ SỬA, verifier PASS
   - nhánh `feature/payment-reminder` · commit `5291caa65` · **chưa push**
   - **Nguyên nhân gốc**: `RichTextEditor` định nghĩa inline trong `PaymentReminderSettings.js:69-165`,
     **port nguyên văn từ mockup** (`mockup-app/.../payment-reminder-settings.jsx:90-165`), chỉ gọi
     `onChange(e.currentTarget.innerHTML)` ở **`onBlur`**. Mọi field khác là Polaris controlled
     component → onChange mỗi keystroke. Đang gõ thì `values.content` đứng yên → dirty-check
     `JSON.stringify(values)!==JSON.stringify(initial)` (dòng 224) không đổi → save bar im.
     ⚠️ Bài học rộng hơn: **component mockup bị port thẳng vào code thật** — mockup không cần
     dirty-tracking nên onBlur là đủ; code thật thì không.
   - **Fix**: thêm `onInput` (`emitChange`) song song `onBlur`; thay `dangerouslySetInnerHTML` bằng
     `useEffect` chỉ gán `ref.current.innerHTML = value` khi khác DOM hiện tại (chỉ áp cho thay đổi
     từ ngoài: load đầu, Discard, Insert variable) → tránh reset caret khi gõ.
   - Verifier tự grep lại toàn bộ field còn lại (`subject`, `replyEmail`, `timing`, `timingDays`,
     `resendDays`, radio access, `enableCustomCss`, `customCss`, Toggle đầu trang) → đều wire đúng,
     **không field nào mắc lỗi tương tự**. `CustomizeEmailTemplate.js` không có `contentEditable`.
     `contentEditable` duy nhất còn lại trong `packages/assets/src` là `CkeditorInput` — nó bắn
     onChange theo event của CKEditor, không phải onBlur → không dính.

   ### ❓ Triệu chứng 2 (toggle trên card) — **CHƯA CHỨNG MINH ĐƯỢC NGUYÊN NHÂN GỐC**
   Cả agent implement lẫn verifier trace độc lập trọn chuỗi ghi (`ReminderRow` → `Toggle` →
   `toggleMutation` → `POST /payment-reminders` → controller → `updateOrCreate` → refetch), gồm cả
   đường "shop chưa có doc Firestore" (`getForShop` trả default `enabled:true` → tắt → `.add()` doc
   mới → refetch merge ra `false`) — **không tìm ra mắt xích đứt nào trên backend khoẻ mạnh.**
   Đã loại trừ: query key lệch (`QUERY_KEY.paymentReminders`, `const/queryKey.js:14`, dùng chung
   card + settings) · `invalidateQueries` bị `staleTime:Infinity` vô hiệu hoá (react-query v5
   refetch active query ngay bất kể staleTime) · gate (`PaymentRemindersCard.js:133-151` xác nhận
   row nằm sau `isUnlocked &&`, nên thấy row = shop ĐÚNG là Wholesale, và thiếu badge upgrade là
   đúng thiết kế vì shop non-Wholesale không thấy row nào).
   - Đã thêm **optimistic update + rollback + toast lỗi** vào `toggleMutation`
     (`PaymentRemindersCard.js`): đây là control **duy nhất trong feature ghi ngay** (mọi thứ khác
     qua save bar) mà trước đó `checked` 100% do server quyết → latency/cold-start làm click trông
     như "không ăn", lỗi thì im lặng. Đây là **cải thiện UX + hiện lỗi ra, KHÔNG phải fix gốc đã
     chứng minh** — ghi rõ để sau này không tưởng nhầm là đã xử lý xong.
   - 🔥 **Giả thuyết mạnh nhất còn lại (verifier phát hiện, PRE-EXISTING, chưa sửa)**:
     `paymentReminderRepository.updateOrCreate` (`paymentReminderRepository.js:58-81`) **nuốt mọi lỗi
     ghi và `return false`**, còn `PaymentReminderController.update`
     (`paymentReminder.controller.js:31-41`) **không hề kiểm giá trị trả về** → ghi Firestore hỏng
     thật (thiếu index, permission…) vẫn trả `SuccessRes`. Đúng kịch bản "bấm không ăn mà không
     báo lỗi gì". Pattern này có sẵn khắp app (`emailNotificationRepository.js:59-61`,
     `shopRepository.js:55-57`, caller `emailNotification.service.js:110` cũng không check)
     → **đáng mở task riêng**, không sửa lén trong task này.
   - **Cần dantt làm để chốt**: pull nhánh, hard reload, bấm lại toggle trên card và xem
     (a) toggle có nhảy + có toast lỗi không, (b) tab Network response của `POST /payment-reminders`,
     (c) console log. Có 3 thứ đó là khoanh được ngay.

   ### ⚠️ Chưa xác minh (chỉ runtime mới kết luận được)
   - Gõ tiếng Việt/IME (composition event) vào contentEditable: có nuốt/nhân đôi ký tự không ·
     caret có giữ đúng qua các trình duyệt không. Verifier chỉ suy luận tĩnh trên guard so sánh
     DOM vs `value` (`PaymentReminderSettings.js:87-97,161-168`), **chưa chạy thật**.
   - 🐛 **Pre-existing, KHÔNG phải hồi quy của commit này** (verifier đối chiếu `git show HEAD:`):
     nút "Insert variable" (`PaymentReminderSettings.js:77-80`) luôn append `<p>{text}</p>` vào
     **cuối** `value`, không chèn tại vị trí con trỏ. Đáng sửa nhưng ngoài scope task này.
   - Gate verifier tự chạy lại (không tin số của agent): `packages/functions && yarn test` exit 0
     (5 suites/45 tests) · eslint 2 file exit 0 · `@avada/assets run production` exit 0
     (`✓ built in` đếm được 2) · `git status --short` đúng 2 file, không sót file test rác.

   ⏸️ Kết luận vòng 1 (giữ lại để đối chiếu — **ĐÃ BỊ BÁC**):
   Không sửa file nào, `git diff` rỗng. Verifier verdict **PASS** (kiểm chứng độc lập 8 tuyên bố + tự
   trace lại luồng end-to-end, không tin lời agent điều tra).
   - **Kết luận: code KHÔNG sai — triệu chứng là by design khi `shop.plan !== 'wholesale'`.**
     Một nguyên nhân gốc giải thích cả 2 triệu chứng: gate khoá `<input>` → `onChange` không chạy →
     `values` không đổi → dirty-check `JSON.stringify(values) !== JSON.stringify(initial)` luôn `false`
     → save bar không hiện.
   - Bằng chứng: `isShopWholesale = shop => shop.plan === 'wholesale'` (`config/getPlans.js:435,39`),
     FE dùng chung helper này · `PaymentReminderSettings.js:268-273` truyền `disabled`/`disabledClick`
     **giống hệt** gate Wholesale đang chạy tốt ở `CombineOrders.js:106-107` (không phải lỗi đảo prop) ·
     save bar dùng cùng pattern `Emails.js:346-354` · BE cũng chặn độc lập
     (`paymentReminder.controller.js:14-18` → `ForbiddenError`), defense-in-depth đúng ý đồ.
   - Loại trừ được: race `shop===undefined` lúc render đầu (`getShopInstance` dispatch thẳng
     `GET_SHOP_INSTANCE_SUCCEED`, reducer chạy đồng bộ trước `root.render()` ở cả `embed.js`
     lẫn `standalone.js`) · `values.enabled` undefined (default `enabled:true`, `defaultData.js:58,70`) ·
     stale closure (`setField` dùng functional updater) · refetch ngầm ghi đè (`staleTime/gcTime: Infinity`,
     `App.js:34-39`) · `initial` bị set lại mỗi render (chỉ sync 1 lần qua `useEffect` dòng 192-197).
   - **Cần dantt trả lời**: shop test đang là plan gì? Nếu `shop.plan === 'wholesale'` mà toggle vẫn
     chết → là bug thật, phải đào tiếp bằng runtime (agent không có browser/Firestore của shop đó).
     Nếu không phải Wholesale → đúng thiết kế, lẽ ra phải thấy Badge "attention" + link upgrade
     (`PaymentReminderSettings.js:275-292`); **không thấy 2 thứ đó mới là bug** → báo lại.
   - 🔎 Phát hiện phụ, ngoài scope, không sửa: `embed.js` nếu email shop khớp `competitorEmails` thì
     `return` trước khi gọi `root.render()` → app trắng hoàn toàn. Không liên quan triệu chứng này
     nhưng là một đường làm app "chết im lặng", đáng biết.
   - ⚠️ `ToggleAvada` có 2 prop dễ nhầm: `disabled` CHỈ đổi class CSS, `disabledClick` mới thực sự
     set `disabled` lên `<input>` (`ToggleAvada.js:36`, `_toggle.scss:27-30`). Chỗ nào chỉ truyền 1
     trong 2 sẽ ra toggle "nhìn bình thường mà bấm không ăn".

11. [✅ 2026-08-07] **SB-15301 — BLOCKER** — Cron payment reminder KHÔNG BAO GIỜ chọn được đơn nào
    (cờ idempotency chưa từng được khởi tạo → query `==` không match doc thiếu field)

    - nhánh `feature/payment-reminder` · commit `a0fbaf4fa` · **ĐÃ PUSH**
    - 3 files, 256 insertions / 1 deletion. Sửa `repositories/wholesaleOrdersRepository.js`
      (seed `isSendDueReminder: false` + `overdueReminderCount: 0` **chỉ ở nhánh `.add()`**).
      Tạo `commands/backfillReminderFields.js` (**CHƯA CHẠY — dantt tự chạy cho đơn cũ**) +
      `__tests__/wholeSale/reminderFieldsBackfillGuard.test.js`.
    - **Cố ý KHÔNG đặt default trong `formatOrder`**: `updateOrder` spread output đó vào
      `.update()`, mà `webhook.service.js:115` gọi mỗi lần webhook cập nhật đơn → default ở đó sẽ
      reset cờ của đơn đã gửi → gửi lại mỗi lần đơn thay đổi. Đổi bug "không gửi" thành bug "spam khách".
    - Verify: verifier **tự tay patch tạm cả hai nhánh `.update()`** để mô phỏng lỗi → đúng
      **2 trap test đỏ** (`Expected: true / Received: false`); khôi phục → `git diff --stat` trùng
      khớp lại, full suite xanh. Test đi qua `formatOrder` **thật**, không dựng doc tay.
      Gate: `yarn test` exit 0 (**7 suites / 53 tests**, baseline 6/49) · eslint 3 file exit 0 ·
      `@avada/functions run production` exit 0 (421 files).
    - ⚠️ **Verifier verdict là `FAIL`, nhưng đóng task có chủ ý.** Thứ trượt KHÔNG phải code —
      verifier xác nhận toàn bộ phần code đúng. Trượt ở deliverable "quét hết chỗ tương tự":
      agent bỏ sót `PUT /order/:id` (xem **task 12**). Đó là bookkeeping, main agent tự ghi được,
      không cần thêm một vòng agent + verify (~15 phút) cho 0 dòng code. Ghi lại để sau này không
      tưởng nhầm là verifier đã PASS.
    - ⚠️ **Chưa xác minh**: chưa chạy cron thật để xem end-to-end.

    ### 🟡 CHỐT 07/08 (dantt): **KHÔNG backfill đơn cũ ở phase này** — "backfill để sau, sau BA
    requirement thêm thì mới làm"

    `commands/backfillReminderFields.js` đã viết xong và commit, **cố ý chưa chạy**. Hệ quả phải
    biết trước, không phải bug:

    - Cờ chỉ được seed ở nhánh `.add()` ⇒ **chỉ đơn TẠO MỚI** sau khi deploy mới có field.
      Đơn cũ đi qua webhook update vẫn `.update()` nên **vĩnh viễn không có field, vĩnh viễn
      không lọt query** — trừ khi chạy backfill.
    - ⇒ **Hoá đơn chưa thanh toán đang tồn tại sẽ KHÔNG bao giờ được nhắc.** Mà đó chính là nhóm
      merchant quan tâm nhất khi bật feature (họ bật vì đang có công nợ cần đòi).
    - ⇒ Đơn mới hôm nay nếu là Net 30 thì **một tháng nữa** mới tới hạn. Feature sẽ gần như
      **im lặng hoàn toàn trong ~30 ngày đầu**. Đây là điều cần nói trước với Product/BA,
      kẻo bị báo là "feature không chạy".

    ⚠️ **CẢNH BÁO CHO NGƯỜI CHẠY BACKFILL SAU NÀY — đọc trước khi chạy:**
    Command hiện set `isSendDueReminder: false` / `overdueReminderCount: 0` cho **mọi** đơn thiếu field.
    Chạy nó rồi bật `ENABLE_PAYMENT_REMINDER_SEND` thì **lượt cron đầu tiên sẽ gửi hàng loạt**:
    `getOrdersForOverdueReminder(step 1)` lọc `overdueReminderCount == 0`, rồi filter
    `getDiffDays(dueAt) >= timingDays` — đơn quá hạn 3 ngày hay 300 ngày **đều thoả**.
    ⇒ Mọi khách đang nợ quá hạn, kể cả hoá đơn từ nửa năm trước, nhận email đòi nợ **cùng lúc**.
    Không phải bug — code chạy đúng thiết kế — nhưng rất khó ăn nói với merchant.

    **Đề xuất khi làm phase sau** (chưa chốt, cần BA): backfill **có mốc chặn** — đơn quá hạn quá lâu
    (hoặc quá hạn trước ngày bật feature) thì seed thẳng `isSendDueReminder: true` +
    `overdueReminderCount: 2`, tức "coi như đã nhắc rồi", để nằm ngoài cả hai query. Chỉ đơn trong
    vùng hợp lý mới tham gia. **Mốc bao nhiêu ngày là câu hỏi nghiệp vụ, không phải kỹ thuật.**

    **Phát hiện 07/08** khi dantt hỏi "enable rồi thì test thế nào". Chưa ai bắt được vì test của
    P4 dùng fake repo tự dựng doc đã có sẵn field, **không đi qua `formatOrder`** — nên invariant
    "doc thật có field đó" chưa bao giờ được kiểm.

    **Bug**: Firestore **không match document thiếu field** với điều kiện `==`. Mà:
    - `repositories/wholesaleOrdersRepository.js:212` lọc `.where('isSendDueReminder', '==', false)`
    - `repositories/wholesaleOrdersRepository.js:238` lọc `.where('overdueReminderCount', '==', step === 2 ? 1 : 0)`

    Trong khi `helpers/company/formatOrder.js:125-145` — nơi tạo/ghi doc `wholesaleOrders` — chỉ ghi
    `dueAt`, `paymentBadge`, `isUnpaid`, `isCanceled`, `isClosed`… **KHÔNG ghi `isSendDueReminder`
    cũng không ghi `overdueReminderCount`**. Grep toàn repo: hai field này chỉ xuất hiện ở
    (a) hai câu query trên và (b) chỗ ghi giá trị SAU khi đã gửi (`services/wholeSale.service.js:236,251,284-285`).

    ⇒ Đơn nào cũng thiếu field ⇒ `getOrdersForDueReminder` và `getOrdersForOverdueReminder(step=1)`
    **luôn trả mảng rỗng** ⇒ không đơn nào được gửi, kể cả khi bật `ENABLE_PAYMENT_REMINDER_SEND`.
    Đường overdue bước 2 (`overdueReminderCount == 1`) thì không dính, vì lúc đó field đã được ghi.

    **Ba hướng, mỗi hướng một đánh đổi — cần chọn, đừng làm cả ba:**
    - (a) ❌ **LOẠI — nguy hiểm hơn bug hiện tại.** Khởi tạo mặc định trong `formatOrder`:
      `createOrUpdateOrder` (`wholesaleOrdersRepository.js:25-29`) và `updateOrder` (dòng 37-44) đều
      ghi bằng `.update({...data})` → mọi key trong output `formatOrder` **đè lên giá trị đang lưu**.
      Mà `services/webhook.service.js:115` gọi `updateOrder(formatOrder(...))` **mỗi lần Shopify bắn
      webhook cập nhật đơn**. ⇒ đơn đã gửi reminder, khách sửa địa chỉ một cái là cờ về `false` →
      **gửi lại, lặp vô hạn, ra khách thật**. (dantt + main agent xác minh 07/08 16:2x)
      → Hướng đúng: khởi tạo **chỉ ở nhánh `.add()`** của `createOrUpdateOrder`, KHÔNG đưa vào `formatOrder`.
    - (b) Đổi query để bắt được cả doc thiếu field. Firestore không có "field absent OR == false"
      trong một query → phải tách 2 query rồi gộp, hoặc đổi sang so sánh khác. **Kiểm kỹ index**:
      `firestore.indexes.json` đã thêm 2 composite index ở P0 và **chưa từng được xác minh** là đủ
      (task 2 tự ghi "chưa chạy emulator").
    - (c) Backfill một lần cho đơn cũ + (a) cho đơn mới. Tốn công nhất nhưng dứt điểm.

    **Việc bắt buộc kèm theo — nếu không thì bug này tái diễn ở dạng khác:**
    - Test hồi quy phải đi qua **`formatOrder` thật** rồi mới query, chứ không dựng doc bằng tay.
      Đây chính xác là lỗ hổng đã để lọt bug này (P4 có 45 test vẫn không thấy).
    - **Quét chỗ tương tự**: mọi query `.where(field, '==', <giá trị mặc định>)` trên collection mà
      writer không khởi tạo field đó. Cùng hạng lỗi, cùng cách chết im lặng.

    **Liên quan**: task 9 (Yup độn `undefined` + lỗi ghi bị nuốt) và task này đều là "ghi/đọc im lặng
    sai mà không ai báo". Đáng gộp thành một bài học chung khi ghi digest.

10. [✅ 2026-08-07] **SB-15301** — Ô "Content" của payment reminder: thay editor giả bằng `CkeditorInput` sẵn có
    - nhánh `feature/payment-reminder` · commit `184a84681` · **ĐÃ PUSH**
    - 5 files, 73 insertions / 170 deletions. Xoá hẳn `RichTextEditor` mock trong
      `PaymentReminderSettings.js` (8 nút `onClick={() => {}}`) + import icon thừa.
      `CkeditorInput.js`: thêm prop `onReady` (additive, `UpdatePolicyContentModal.js:45` không truyền
      nên không đổi hành vi). Insert variable chèn **tại con trỏ** qua
      `editor.model.change(w => editor.model.insertContent(w.createText(text)))` — sửa luôn bug cũ
      "luôn append vào cuối". Bộ đếm CHARS/WORDS giữ, tính từ `values.content`.
    - Verify: verifier **2 vòng**. Vòng 1 **FAIL** — sót **file nguồn i18n** (xem bài học ở khối
      gate đầu file). Vòng 2 **PASS**, 0 finding.
    - Verifier đọc thẳng source `@ckeditor/ckeditor5-react@6.3.0` trong `node_modules` để kiểm 3 thứ
      không thể suy từ code app: `onChange` wire vào `editor.model.document.on("change:data")` →
      bắn **mỗi thay đổi**, không phải blur ⇒ **không hồi quy bug `5291caa65`** ·
      `_shouldUpdateEditor` + `editor.data.set()` ⇒ prop `data` **có** đồng bộ khi `value` đổi từ
      ngoài (Discard, query resolve lần đầu) · `writer.createText()` tạo model text node, không qua
      HTML-parse ⇒ `{{order.name}}` **không bị escape**.
    - Gate: `@avada/assets run production` exit 0 (`✓ built in` = 2) · `packages/functions && yarn test`
      exit 0 (7 suites/53, không đụng functions) · eslint 2 file JS exit 0 · 11 file locale đều là
      JSON hợp lệ · `git status` đúng 5 file.
    - 💡 **Push bị GitLab từ chối lần 1** (`pre-receive hook declined`, message rỗng từ
      `/pre_receive endpoint`) — **lỗi hạ tầng nhất thời, không phải chính sách**. Push lại lần 2 OK.
    - ⚠️ **Chưa xác minh**: verifier chỉ trace code + đọc source thư viện, **chưa chạy UI thật**.
      Nên bấm thử một lần: gõ vào Content xem save bar có hiện, bấm Discard xem nội dung có reset,
      chèn biến xem có vào đúng vị trí con trỏ.
    - 📌 Nhánh fallback khi editor ref chưa sẵn sàng (`PaymentReminderSettings.js:93-98`)
      **không phải dead code tuyệt đối** — có cửa sổ race hẹp nếu popover mở trước khi `onReady` fire;
      nếu chạy thì append plain text vào cuối chuỗi HTML, không bọc tag. Verifier đánh giá
      không nghiêm trọng, không gate.

    ✅ **Điểm bất định đã gỡ (recon 07/08 16:49)**: `helpers/ckeditor.js` là **bundle CKEditor
    custom** (53k dòng, định nghĩa global `ClassicEditor`), KHÔNG phải stock classic build.

    ✅ **Điểm bất định đã gỡ (recon 07/08 16:49)**: `helpers/ckeditor.js` là **bundle CKEditor
    custom** (53k dòng, định nghĩa global `ClassicEditor`), KHÔNG phải stock classic build.
    Grep trong bundle: `Alignment` 74 lần · `Underline` 6 lần · `ImageUpload` 4 lần.
    ⇒ `defaultToolbarItems` (`CkeditorInput.js:9-24`) liệt kê `underline`/`alignment` là **hợp lệ**,
    không sợ nút biến mất im lặng.

    **CHỐT 07/08 (dantt): "nếu đã có ckeditor thì cho vào brief"** — dùng lại component sẵn có,
    không tự viết editor.

    **Vấn đề**: `RichTextEditor` định nghĩa inline trong
    `packages/assets/src/pages/PaymentReminderSettings/PaymentReminderSettings.js:69-180` là bản
    **port nguyên văn từ mockup** (comment dòng 67-69 tự khai "Mock rich text editor"). Cả 8 nút
    toolbar (paragraph/bold/italic/underline/align/link/image/more) đều `onClick={() => {}}`
    (dòng 100-105) — **không nút nào làm gì**. Merchant thấy toolbar đầy đủ nhưng bấm không ăn.
    Gõ text thì work (contentEditable + `onInput`, đã fix ở `5291caa65`).

    **App ĐÃ CÓ editor thật, chỉ dùng ở đúng 1 chỗ**:
    - dependency: `@ckeditor/ckeditor5-build-classic` + `@ckeditor/ckeditor5-react`
      (`packages/assets/package.json:26-27`)
    - component: `packages/assets/src/components/CkeditorInput/CkeditorInput.js` — nhận
      `value`/`onChange`/`label`/`helpText`/`toolbarItems`, bắn `onChange` theo event CKEditor
      (không phải onBlur) nên **dirty-check của save bar vẫn chạy đúng**
    - toolbar mặc định: bold, italic, underline, alignment, heading, numberedList, bulletedList,
      outdent, indent, undo, redo (`CkeditorInput.js:9-24`), override được qua `toolbarItems`
    - đang dùng ở `components/UpdatePolicyContentModal/UpdatePolicyContentModal.js:45`

    **Việc phải làm:**
    1. Thay `RichTextEditor` inline bằng `CkeditorInput` trong `PaymentReminderSettings.js`.
       Xoá hẳn component giả, đừng để lại dead code.
    2. **Wire lại "Insert variable"** — đây là thứ DUY NHẤT trong toolbar cũ chạy thật
       (`EMAIL_VARIABLES` + Popover + ActionList). Phải chèn **tại vị trí con trỏ** qua API của
       CKEditor (`editor.model.change` + `insertContent`), không append vào cuối.
       ⚠️ Bug cũ cần sửa luôn: `PaymentReminderSettings.js:77-80` hiện luôn append `<p>{text}</p>`
       vào **cuối** `value` — đã ghi nhận ở task 7 là pre-existing, ngoài scope lúc đó.
       `CkeditorInput` chưa expose instance editor ra ngoài → cần thêm prop kiểu `onReady`
       (hoặc tương đương). **Sửa `CkeditorInput` phải backward-compatible** — nó đang được
       `UpdatePolicyContentModal` dùng, không được làm hỏng chỗ đó.
    3. Bộ đếm CHARS/WORDS ở chân editor: giữ hay bỏ đều được, nhưng nếu giữ thì phải tính từ
       `value` mới. Nếu bỏ thì dọn cả key i18n.
    4. **Dọn i18n**: block `PaymentReminderSettings.richTextEditor` (`locale/translations/en.json:3795-3806`)
       có 10 key cho toolbar giả. Key nào không còn dùng thì xoá ở **tất cả 11 file locale**
       (de, en, es, fi, fr, ja, nb, origin, pt-BR, sv, tr).
       ⚠️ Bài học từ task 7 vòng 3: lần đó agent sửa call-site JS nhưng **sót bản sao** trong
       `constants/paymentReminders.json`. Grep cho hết, đừng chỉ sửa chỗ dễ thấy.
    5. Kiểm `CustomizeEmailTemplate.js` có dùng editor giả này không — nếu có thì xử lý cùng.

    **Cần xác nhận khi làm** (không đoán): CKEditor 5 build classic mặc định KHÔNG có plugin
    `underline`/`alignment`, nhưng `CkeditorInput.js:9-24` lại liệt kê 2 cái đó trong toolbar mặc định
    và import `@assets/helpers/ckeditor` → nhiều khả năng là build custom. **Đọc file đó rồi mới
    chốt toolbarItems**, đừng liệt kê nút mà build không có (sẽ ra lỗi console + nút biến mất =
    lặp lại đúng bug "toolbar giả" đang sửa).

    **Đánh đổi đã chấp nhận**: giao diện lệch mockup (toolbar CKEditor thay vì hàng icon Polaris).
    dantt chốt đổi lấy toolbar chạy thật + đồng nhất với editor sẵn có của app.

9. [✅ 2026-08-07] **SB-15301** — Save payment reminder trả 200 nhưng KHÔNG ghi được doc nào vào Firestore
   - nhánh `feature/payment-reminder` · commit `b2f2038c6` · **ĐÃ PUSH** (MR chưa tạo)
   - 4 files, 260 insertions / 6 deletions. Sửa: `schemas/paymentReminderSchema.js`
     (`.default(undefined)` cho `due`/`overdue`/`theme`) · `repositories/paymentReminderRepository.js`
     (`new Firestore({ignoreUndefinedProperties: true})` + log & rethrow thay vì `return false`) ·
     `controllers/paymentReminder.controller.js` (kiểm kết quả ghi, trả lỗi thật).
     Tạo `__tests__/wholeSale/paymentReminderPartialSave.test.js`.
   - Verify: verifier **2 vòng**. Vòng 1 **FAIL** — bắt được 2 lỗi thật:
     (a) test không guard tầng repository (gỡ riêng `ignoreUndefinedProperties`, giữ fix schema
     → cả 3 test vẫn xanh); (b) cuộc quét "tìm hết chỗ tương tự" bỏ sót đúng chỗ giống nhất là
     `emailNotificationRepository.js:59-60` + caller không kiểm. Vòng 2 **PASS**.
   - Vòng 2 verifier **tự tay làm lại thí nghiệm**, không tin số agent: gỡ riêng
     `ignoreUndefinedProperties` → **đúng 1 test mới FAIL** (`Cannot use "undefined" as a Firestore
     value (found in field overdue.enabled)`), 3 test cũ vẫn xanh → chứng minh test mới guard đúng
     tầng repository; khôi phục → `diff` identical, 6 suites/49 xanh lại.
   - Gate (chạy lại SAU khi đóng merge master, vì merge kéo code mới vào): `yarn test` exit 0
     (**6 suites / 49 tests**, baseline 5/45) · eslint 4 file exit 0 ·
     `@avada/functions run production` exit 0 (420 files).
   - 🔀 **Git**: lúc commit phát hiện repo đang ở **merge dở dang từ 15:01** (`MERGE_HEAD` =
     `f8c41f8a4`, merge `master` vào feature branch, 21 file mockup staged sẵn, 0 conflict).
     Git chặn partial commit khi đang merge. dantt duyệt cho đóng merge → `6e58ce960`, rồi mới
     commit task 9. ⚠️ Đám file mockup "M" thấy lúc đầu phiên **chính là kết quả merge này**,
     không phải thay đổi rời của ai khác — đọc nhầm chỗ đó lúc đầu.
   - ⚠️ **Chưa xác minh**: mới static + test, **chưa bấm thử trên app thật sau khi commit**
     (dantt đã xác nhận save được ở bản working-tree trước đó).
   - 📌 **NỢ đã ghi nhận, cố ý KHÔNG sửa** (ngoài scope, rủi ro hồi quy — verifier spot-check
     xác nhận file:line đúng):
     · `emailNotificationRepository.js:59-60` `catch → return false` không log; caller không kiểm ở
       `emailNotification.service.js:110,380` · `emailNotification.controller.js:16` ·
       `handlers/onUpdateShop.js:19` · `subscription.service.js:85` · `charge.service.js:174`.
       **Đây là đúng bug này áp lên Email Notification settings** — đáng mở task riêng.
     · `schemas/templateSchema.js:97` `socialList: object({...}).notRequired()` **thiếu
       `.default(undefined)`** → cùng bẫy Yup, qua `validator(templateSchema)` ở `POST /templates`,
       ghi qua `templateRepository.js:16` cũng `new Firestore()` trần. Latent crash chưa nổ.
     · `templateRepository.js:444-452` `updateAllTemplates` **luôn `return true`** kể cả khi lỗi;
       3 call site ở `apiV1.service.js:325,339,360` không kiểm.
     · `shopRepository.js:55-57` `updateAppRating` nuốt lỗi thành `false`; caller
       `shop.service.js:141` không phân biệt được "đã rate" vs "ghi hỏng".
     · `settingSchema.js:41-50` `customCurrency` **đã có** `.default(undefined)` → an toàn, không phải finding.
   - ❓ **CẦN DANTT QUYẾT**: `paymentReminder.controller.js:43` ném `BadRequestError` (400) cho lỗi
     ghi Firestore — sai ngữ nghĩa (lỗi phía server). Nhưng `core/error.res.js` **không có class 5xx
     nào** (chỉ BadRequest/NotFound/Forbidden/TooManyRequests/Unauthorized) nên đây là lựa chọn
     ít sai nhất hiện có. Thêm class 5xx là đụng core, không tự làm.



   **Nguyên nhân gốc đã chứng minh xong (07/08, dantt + main agent điều tra chung, chưa sửa):**
   Đây chính là "Triệu chứng 2" treo từ task 7 — lúc đó verifier chỉ đúng chỗ nghi
   (`updateOrCreate` nuốt lỗi) nhưng thiếu dữ liệu Firestore nên dừng ở mức giả thuyết.

   Chuỗi khép kín, mỗi mắt xích có bằng chứng trực tiếp:
   1. FE gửi payload **partial** `{due: {...}}` — `Emails.js:304-314` cố ý chỉ gửi type nào đổi
   2. `middleware/validator.js` → `koa-yup-validator/src/index.ts:93` chạy `set(ctx, 'req.body', data)`
      → **ghi đè body bằng giá trị Yup đã cast**, controller không nhận body gốc
   3. Yup **0.29.3** vật chất hoá `overdue` + `theme` (khai `.notRequired()` ở
      `schemas/paymentReminderSchema.js:53-57`) thành object đầy đủ với **14 field `undefined`**.
      Đã chạy thật với đúng options validator dùng (`{stripUnknown: true, abortEarly: false}`).
   4. `repositories/paymentReminderRepository.js:4` là `new Firestore()` trần, **không**
      `ignoreUndefinedProperties` → `.add()` throw `Cannot use "undefined" as a Firestore value`
   5. `paymentReminderRepository.js:78-80` `catch (e) { return false }` — không log, không rethrow
   6. `controllers/paymentReminder.controller.js:35` **không đọc giá trị trả về** → luôn `SuccessRes`
   7. FE thấy 200 → toast "Save successfully", `initialData` cập nhật → save bar tắt
   8. F5 → `getForShop` không thấy doc → trả `defaultPaymentReminder` (`enabled:false` từ `c261c16d7`)

   Bằng chứng runtime dantt cung cấp: POST trả `{"code":200,"success":true,...}`;
   GET `/payment-reminders` trả object **thiếu field `id`** ⇒ rơi nhánh `!snapshot.size`
   (`paymentReminderRepository.js:21-23`) ⇒ 0 doc. Main agent quét collection `paymentReminders`
   trên `avada-staging`: **0 document toàn project**. Probe ghi bằng service account: `add()` OK
   → tầng Firestore khoẻ, lỗi nằm ở payload.

   **Phạm vi rộng hơn 1 chỗ:**
   - Trang settings chi tiết cũng hỏng cùng lý do (gửi 1 type + `theme` → type còn lại bị độn undefined)
   - `paymentReminderTestSchema` tái dùng `reminderConfig` → `config` vào `sendTestReminderMail`
     cũng đầy undefined; không ghi Firestore nên không nổ, nhưng render/merge tag nhận dữ liệu rác
   - Pattern `catch → return false` không ai kiểm còn ở `emailNotificationRepository.js:59-61`,
     `shopRepository.js:55-57` (caller `emailNotification.service.js:110` cũng không check)

   **Việc phải làm:**
   1. Chặn tại nguồn: `.default(undefined)` cho object lồng trong `paymentReminderSchema`
      để Yup không vật chất hoá khi vắng mặt — giữ đúng ý đồ partial update
   2. Phòng thủ tầng ghi: strip `undefined` trước `.add()/.update()` (hoặc bật
      `ignoreUndefinedProperties` cho instance repo này)
   3. Bỏ lớp tàng hình: `updateOrCreate` không nuốt lỗi; controller kiểm kết quả, trả lỗi thật
   4. **Quét HẾT chỗ tương tự** toàn repo: schema có `object()` lồng + qua `validator` + ghi Firestore;
      và các `catch → return false` không ai kiểm
   5. Test hồi quy: ghi payload partial qua đúng đường validator → schema → repository,
      assert doc thật sự tồn tại (không mock Firestore rỗng rồi assert gọi hàm)

8. [✅ 2026-08-07] https://localhost:3001/apiSa/payment-reminders/due/test POST -> {

   **XONG 07/08 — KHÔNG phải bug code, là cấu hình SMTP ở local. Không sửa file nào.**
   dantt xác nhận 16:3x: "hiện tại thì send test được rồi nhé".

   **Nguyên nhân**: `sendTestReminderMail` không tự dựng transport, nó gọi chung
   `MailService.sendMail` → `helpers/email/smtpHelper.js:109-129 getSmtpConfig` như mọi đường
   gửi mail khác. Chuỗi:
   - `getSmtpConfig` chỉ dùng SMTP riêng của merchant khi **đủ cả 3**:
     `isShopPro(shop, true) && emailNotification?.customSmtpEnabled && emailNotification?.isVerifiedSmtp`.
     **Khách KHÔNG bắt buộc nhập SMTP** — thiếu 3 điều kiện thì rơi về SMTP của Avada.
   - SMTP của Avada có **hai hồ sơ**, chọn theo cờ trên shop doc:
     `getDefaultSmtp` (`smtpHelper.js:96-98`) = `shop.useChattySmtp ? chattySmtp : smtp`
   - Trong `packages/functions/.env.local`: nhóm `SMTP_*` (5 biến) **rỗng hoàn toàn** (key có mặt,
     giá trị 0 ký tự), nhóm `CHATTY_SMTP_*` (5 biến) **có đủ giá trị**.
   - Shop `dantt-pdf-dev` không có `useChattySmtp` → đi hồ sơ `smtp` rỗng → `host`/`port` = `undefined`
   - `services/mail.service.js:64` vẫn ép `secure: true` cho nhánh non-custom → nodemailer tự điền
     default `localhost` + port `465` → `ECONNREFUSED ::1:465`

   **Cách gỡ đã làm**: bật `useChattySmtp: true` cho shop `dantt-pdf-dev.myshopify.com`
   (`AYctc8Mrxl664GaFbRUj`) trên Firestore `avada-staging`. Ghi bằng
   `serviceAccount.development.json`, verify bằng đọc lại doc sau khi ghi (`undefined` → `true`).

   ⚠️ **CÒN NGUYÊN, chưa xử**: hồ sơ `SMTP_*` vẫn rỗng ở local. Shop nào **không** bật cờ chatty
   sẽ dính lại đúng lỗi này — kể cả **đường cron** khi bật `ENABLE_PAYMENT_REMINDER_SEND`.

   📌 **Hai thứ đáng sửa thật (khác với "chỉ thiếu env"), chưa mở task:**
   1. `getSmtpConfig` fail im lặng khi host rỗng → nên throw sớm với message rõ, thay vì để
      nodemailer mò về `localhost:465`.
   2. Lỗi nodemailer thô lọt nguyên `message` + `stack` ra response 422. `normalizeSmtpError`
      (`smtpHelper.js:75-89`) đã có sẵn nhưng **chỉ dùng cho verify custom SMTP**
      (`emailNotification.service.js:377`), không áp cho `sendMail`/`sendTestMail`/`sendTestReminderMail`.
      (`middleware/errorHandler.js:20-26` chỉ leak stack khi không phải production, nhưng message thô vẫn ra.)

   Log gốc:
   {
    "code": 422,
    "success": false,
    "message": "connect ECONNREFUSED ::1:465",
    "stack": [
        "Error: connect ECONNREFUSED ::1:465",
        "    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1638:16)"
    ]
}

13. [✅ 2026-08-07] Clean code file này PaymentReminderSettings và có thể những file tương tự nhé
    _(đánh số lại từ `10.` → `13.` vì trùng với task 10 đã xong)_
    - nhánh `feature/payment-reminder` · commit `fa4081ac7` · **ĐÃ PUSH**
    - 1 file, 31 insertions / 18 deletions. `PaymentReminderSettings.js` 483 → 496 dòng.
      Gom 3 khối `<TextField>` "N days" (due-before timing · overdue days-after · overdue resend)
      thành `DaysNumberField` local — 3 khối vốn **byte-identical** về props, chỉ khác label và
      field đích (verifier đọc `git show HEAD:` xác nhận, không tin lời agent).
    - 4 file kia (`CustomizeEmailTemplate` · `PaymentRemindersCard` · `ReminderEmailPreview` ·
      `ColorSwatchInput`) audit rồi **để nguyên**, `git diff` rỗng cả 4.
    - Verify: verifier **PASS vòng 1**, 0 finding. Kiểm 3 điểm: prop parity (không rơi prop riêng
      nào vì cả 3 khối vốn giống hệt) · state shape không đổi (quan trọng: save bar dirty-check dùng
      `JSON.stringify(values)`) · surgical (diff chỉ có `DaysNumberField` + 3 chỗ thay).
      Gate: assets build exit 0 (`✓ built in` = 2) · eslint exit 0 · functions test 7 suites/53.
    - ⚠️ **dantt đánh giá là CHƯA ĐỦ** → mở task 15. Agent chỉ gom được 1 khối rồi dừng, và đặt
      subcomponent mới **ngay trong cùng file** — tức lặp lại đúng thứ task 15 phàn nàn.
    - 📌 Phát hiện, cố ý không sửa: `CustomizeEmailTemplate.js:110` `DropZone onDrop={() => {}}`
      — upload logo **không làm gì**, giống hạng lỗi "nút giả" của task 10 · 2 Popover "insert
      variable" lệch nhau ở `Scrollable` height (200 vs 220) và prop `focusable`.

14. [✅ 2026-08-07] check giúp tôi là sendAgainAfter cần chốt gì nữa nhỉ?
    _(đánh số lại từ `11.` → `14.` vì trùng với task 11 đã xong)_

    **Task điều tra — KHÔNG có commit.** Deliverable là danh sách dưới đây.

    ### Đã rõ, KHÔNG cần hỏi ai
    - **Mockup label nguyên văn**: `"Send again after"`, **không có helpText**, không nói đếm từ mốc nào
      (`mockup-app/src/mockups/automation-email/payment-reminder-settings.jsx:364-368`).
      Field cạnh nó là `"Days after the overdue date"` = `timingDays` (dòng 356-360).
    - **Code đếm từ `lastOverdueReminderAt`** (mốc gửi email overdue lần 1), KHÔNG phải từ `dueAt` —
      `services/wholeSale.service.js:267-268`.
    - **Không lặp vô hạn**: `#sendOverdueReminders` chỉ gọi step 1 + step 2
      (`wholeSale.service.js:255-258`); `getOrdersForOverdueReminder` lọc `overdueReminderCount == 1`
      cho step 2 nên đơn rơi khỏi mọi candidate khi count = 2 (`wholesaleOrdersRepository.js:246-252`).
      Test khoá hành vi này qua nhiều tick cron (`sendPaymentReminders.test.js:341-390`).
    - Kiểu `resendDays` là **string** xuyên suốt (schema `string().max(10)` · default `'1'` ·
      FE `String(value ?? '1')`), ép số đúng một chỗ khi so sánh. Nhất quán.
    - Đơn **trả một phần** vẫn `isUnpaid: true` → vẫn gửi lần 2 đúng lịch, PDF cập nhật số dư (AC9).
    - Đơn nhảy thẳng qua overdue trước khi kịp gửi due → `isSendDueReminder` set `true`, bỏ due,
      không ảnh hưởng `resendDays` (`wholeSale.service.js:210-213`).

    ### ❓ CẦN PHILIP/PRODUCT QUYẾT — 2 câu, mang đi hỏi
    1. **"Send again after N days" đếm từ mốc nào?** Code đang đếm từ **ngày gửi email overdue lần 1**.
       Cách đọc còn lại: cộng dồn từ due date (= `timingDays + resendDays`). Label mockup mơ hồ,
       đọc kiểu nào cũng xuôi. Spec tự chọn cách thứ nhất và tự ghi là **suy diễn chưa xác nhận**
       (`spec-payment-reminder-due-overdue.md:308`, Assumption A2).
    2. **Có đúng chỉ gửi thêm ĐÚNG 1 lần overdue không?** Bằng chứng hiện tại là **thiếu UI cho vòng
       lặp** trong mockup (không có "repeat every N days until paid", không có `maxResend`) — tức suy
       ra từ *sự vắng mặt*, không phải từ bằng chứng minh thị. ⚠️ Nếu Philip muốn lặp tới khi trả tiền
       thì **schema hiện tại không hỗ trợ**, phải thêm field và làm lại logic step.

    ### 🐛 DEV TỰ QUYẾT ĐƯỢC — nhưng là BUG TIỀM ẨN THẬT, nên mở task
    `wholeSale.service.js:266-268` dùng `Number(config.resendDays || 0)` — `|| 0` nằm **bên trong**
    `Number()`, áp lên chuỗi trước khi đổi kiểu. Không có validate min/numeric ở schema
    (`paymentReminderSchema.js:11` chỉ `string().max(10)`); FE `min={1}` của Polaris chỉ là gợi ý
    spinner, gõ tay hoặc paste vẫn lọt.

    | Giá trị | `Number(x \|\| 0)` | Hệ quả |
    |---|---|---|
    | `"0"` / `""` | `0` | **gửi lần 2 gần như NGAY** ở lượt cron kế |
    | `"-3"` | `-3` | **gửi ngay** |
    | `"abc"` | `NaN` | so sánh `>= NaN` luôn false → **KHÔNG BAO GIỜ gửi lần 2**, im lặng |

    ⚠️ **ĐÍNH CHÍNH**: agent điều tra kết luận `"abc"` cũng "gửi ngay lập tức" — **SAI**.
    Nó tưởng `NaN || 0` = 0, nhưng `|| 0` áp lên chuỗi chứ không áp lên `NaN`. Main agent chạy thử
    `node -e` xác nhận: `Number("abc" || 0)` = `NaN`, `5 >= NaN` = `false`.
    Hai ca hỏng theo **hai hướng ngược nhau** — một cái spam, một cái câm — nên không gộp làm một được.

    **Cùng pattern ở step 1**: `Number(config.timingDays || 0)` (dòng 266) dính y hệt.
    **Không có test nào** cho các ca biên này (đã grep `sendPaymentReminders.test.js`).

    ### Ưu tiên thấp, dev tự quyết, không cần hỏi
    - `resendDays < timingDays`: không tự thân là lỗi (resendDays là khoảng cách *thêm* kể từ lần 1,
      không cộng dồn). Chỉ là câu hỏi UX có nên cảnh báo hay không.
    - Không có `max`: `string().max(10)` là giới hạn **ký tự**, cho phép số tới ~10 tỉ. Vô hại
      (đơn nằm chờ mãi ở `overdueReminderCount = 1`) nhưng có thể cap ở 365.

15. [✅ 2026-08-07] Tôi thấy ở task 13 bạn đang clean code chưa chuẩn lắm, tôi thấy các components bạn đang viết trong components khác và ko chịu tách nhỏ components mà viết 1 file rất dài, các biến thì chưa được khởi tạo dạng const ABCXYZ = "";
    - nhánh `feature/payment-reminder` · commit `5524a25d7` · **ĐÃ PUSH**
    - 13 files, 789 insertions / 543 deletions. **11 file mới**, mỗi Card một file:
      `PaymentReminderSettings/` → `DaysNumberField.js` · `GeneralSection.js` · `ScheduleSection.js` ·
      `ContentSection.js` · `AttachedDocumentSection.js` · `CustomCssSection.js`
      `CustomizeEmailTemplate/` → `LogoSection.js` · `ColorSection.js` · `ButtonSection.js` ·
      `FooterSection.js` · `CustomCssSection.js`
    - `PaymentReminderSettings.js` **496 → 266** dòng · `CustomizeEmailTemplate.js` **356 → 124** dòng
    - Theo convention **có sẵn của repo** (main agent recon trước khi giao, agent không tự chế):
      `pages/DevZone/` (13 file, subcomponent nằm cạnh page) · `pages/B2B/` (`Companies.js`,
      `Statistic.js` cạnh `B2B.js`, truyền `i18n` qua prop, **không** tạo `.json` riêng).
    - Hằng số đã đặt tên: `TYPE_DUE`/`TYPE_OVERDUE` · `TIMING_BEFORE` · `ACCESS_VIEW_ONLINE`/
      `ACCESS_SEND_ATTACHMENT` · `LOGO_SIZE_MIN`/`MAX`/`SUFFIX` · `DEFAULT_DAYS_VALUE` ·
      `CUSTOM_CSS_TEXTAREA_ROWS` · `SUBJECT_VARIABLES_POPOVER_HEIGHT` ·
      `CONTENT_VARIABLES_POPOVER_HEIGHT` · `ROUTE_*` …
    - Verify: verifier **PASS vòng 1**, 0 finding. Kiểm được mấy thứ đáng giá:
      · union `setField('<key>')` + `values.<key>` của bản cũ **khớp chính xác** với union của 7 file
        mới (10 key: access, content, customCss, enableCustomCss, enabled, replyEmail, resendDays,
        subject, timing, timingDays) — làm y hệt cho `CustomizeEmailTemplate` (15 key)
      · **key i18n khớp tuyệt đối** — verifier dùng perl trích multi-line vì grep 1 dòng bỏ sót
        các call xuống dòng; `diff` exit 0 cho cả 2 trang
      · **không có file `.json` mới** nào trong `packages/assets/src`
      · `contentEditorRef` + `onReady` + `insertContent` + fallback chuyển **verbatim** vào
        `ContentSection.js:32-45`, và **không file nào khác** tham chiếu ref này
      · gate Wholesale (`isShopWholesale`, `disabled`, `disabledClick`, Badge, link upgrade) nguyên vẹn
      · `error` props (`subjectError`, `replyEmailError`) luồn đúng parent → `GeneralSection`
      Gate: assets build exit 0 (`✓ built in` = 2) · eslint 12 file exit 0 · functions test 7 suites/53.
    - 📌 **2 bug cố ý mang nguyên sang, KHÔNG sửa lén** (verifier xác nhận giữ verbatim):
      `LogoSection.js:31` `DropZone onDrop={() => {}}` — upload logo không làm gì ·
      popover insert-variable lệch nhau: subject 200 + có `focusable` (`GeneralSection.js:18,80`),
      content 220 + không `focusable` (`ContentSection.js:17,72`).
    - ⚠️ **Chưa xác minh**: không có browser, verifier chỉ so tĩnh source cũ/mới + gate xanh.
      **Chưa bấm thử UI.**

16. [✅ 2026-08-07] Reply 14: tức ngày 10 due -> day after overdue date -> ngày 11 -> send after -> ngày 12

    ✅ **CHỐT — đây là câu trả lời cho CÂU HỎI MỞ #1 của task 14. Code đang làm ĐÚNG, không cần sửa.**

    dantt xác nhận mốc đếm, với `timingDays = 1` và `resendDays = 1`:
    | Ngày | Việc |
    |---|---|
    | 10 | due date → email DUE |
    | 11 | = due + `timingDays` → email OVERDUE lần 1 |
    | 12 | = **ngày gửi lần 1** + `resendDays` → email OVERDUE lần 2 |

    ⇒ `resendDays` đếm từ **ngày gửi email overdue lần 1**, KHÔNG cộng dồn từ due date.
    Đúng y hệt code hiện tại: `getDiffDays(order.lastOverdueReminderAt) >= Number(config.resendDays || 0)`
    (`wholeSale.service.js:267-268`). Kiểm lại số học: due ngày 10, ngày 11 thì
    `getDiffDays(dueAt)` = 1 >= 1 ✓ · ngày 12 thì `getDiffDays(lastOverdueReminderAt)` = 1 >= 1 ✓.
    (Cách đọc kia — cộng dồn từ due date — sẽ ra ngày 11 cho cả hai lần, tự đụng nhau.)

    → **Assumption A2 trong `spec-payment-reminder-due-overdue.md:308` giờ đã được xác nhận.**

    ⚠️ **CÂU HỎI MỞ #2 VẪN CÒN**: có đúng chỉ gửi thêm **1 lần** overdue rồi dừng hẳn không.
    Ví dụ của dantt dừng ở ngày 12 nên **ngụ ý** là dừng, nhưng đó là dantt xác nhận cách đọc của
    chính mình — **Philip vẫn chưa xác nhận**. Nếu Product muốn lặp tới khi trả tiền thì schema
    hiện tại không đỡ được.

    ⚠️ **BUG ca biên ở task 14 VẪN CÒN NGUYÊN, chưa mở task**: `Number(config.resendDays || 0)`
    khiến `"0"`/`""`/số âm → **gửi ngay**, còn `"abc"` → **không bao giờ gửi**. Câu trả lời này
    không đụng tới nó.

## 2026-08-10

17. [✅ 2026-08-10] **Mail gửi ra là plain text — toàn bộ theme / "Customize email template" KHÔNG có tác dụng**
    - nhánh `feature/payment-reminder` · commit `6c162f4ec` · **ĐÃ PUSH**
    - 6 files, 376 insertions / 68 deletions. Tạo `helpers/email/buildReminderEmailHtml.js` (98 dòng,
      **0 import**, hàm thuần) + 2 file test mới. Sửa `wholeSale.service.js` ·
      `ReminderEmailPreview.js` (58 dòng → bỏ phần tự ghép HTML) · 1 assertion test cũ.
    - **Test 7 suites/53 → 9 suites/63.**
    - Verify: verifier **PASS vòng 1**, 0 finding. Kiểm được:
      · **Purity**: `grep "^import"` trên file mới ra **0 match** — không phải chỉ tin build xanh
      · **Parity với preview cũ**: so `git show HEAD:ReminderEmailPreview.js:37-77` với
        `buildReminderEmailHtml.js:56-97` **từng rule CSS** (`*`, `body`, `.card`, `.wrap`, `.logo`,
        `.logo img`, `h3`, `p`, `.cta`, `.muted`, `.attachment`, `.attachment .name`, `.footer`,
        `.footer a`) — không rớt rule, không đổi thứ tự làm lệch cascade
      · **`theme` tới nơi trên CẢ 4 nhánh gửi**: due · overdue step 1 · overdue step 2 · send test.
        Send test destructure đúng phần tử thứ 4 của `Promise.all`
      · **Assertion cũ KHÔNG bị làm yếu**: cũ là `html: 'Content'` exact; mới assert `toContain('Content')`
        **+** `toContain('#123456')` (màu theme) **+** `toContain('Pay now')` (nút theme) → chặt hơn
      Gate: functions test 9/63 · assets build 2× `✓ built in` · functions build 422 files · eslint sạch.
    - ⚠️ **Chưa xác minh**: **chưa mở mail thật trong email client.** Verifier chỉ so tĩnh + assert
      chuỗi HTML. "Mail trông giống preview" mới là suy luận, chưa phải quan sát.
    - 🔓 **Injection — dantt cần biết, verifier nêu, KHÔNG chặn**: `theme.customCss` append **thô**
      vào `<style>` (`buildReminderEmailHtml.js:54,76`), `theme.buttonUrl` vào `href` **không escape**.
      Merchant gõ `</style>` + HTML tuỳ ý là chèn được vào mail gửi cho **khách của họ**.
      Verifier đánh giá: **không phải lớp rủi ro mới** — `content` (rich text merchant viết) vốn đã
      raw-embed không escape từ bản preview cũ, các field theme khác (`primaryText`, `buttonColor`,
      `logoImage`) cũng vậy. Diff này chỉ **mở rộng bề mặt** (`buttonUrl` giờ thành `href` thật thay
      vì `#` cố định). Cần quyết có sanitize không.
    - 📌 **Phát hiện phụ, chưa mở task**: có **HAI** field custom CSS trong schema —
      `theme.enableCustomCss`/`theme.customCss` (trang Customize) và per-type
      `due.enableCustomCss`/`due.customCss` + `overdue.*` (`paymentReminderSchema.js:36-37`,
      `PaymentReminderSettings/CustomCssSection.js`). **Cả hai trước giờ đều dead.** Task này chỉ
      wire cái theme-level; **per-type vẫn dead** — trang settings có ô nhập mà không dùng vào đâu.
    - ⚠️ Giới hạn kỹ thuật cần nói với Product: nhiều email client (nhất là Outlook desktop cũ)
      **bỏ qua `<head><style>`** → theme và customCss có thể không hiện. Chưa làm inline CSS
      (scope lớn hơn nhiều).

    **dantt báo 07/08**: "gửi mail thì thấy nó gửi mỗi plain text, ko có background hay style như preview".
    Main agent kiểm code, **xác nhận đúng, và nguyên nhân rộng hơn triệu chứng**.

    ### Nguyên nhân gốc
    Cả hai đường gửi đều truyền **nội dung thô**, không bọc template:
    - cron: `services/wholeSale.service.js` `#sendReminderMail` → `MailService.sendMail({..., html: content})`
    - send test: `sendTestReminderMail` → `MailService.sendMail({..., html: content})`

    `content` ở đây là output của `renderReminderMergeTags` — tức **chỉ phần rich text merchant gõ
    trong ô Content**, đã thay merge tag. Không logo, không màu nền, không card, không nút CTA,
    không footer.

    Trong khi đó **toàn bộ HTML có style chỉ tồn tại ở FE**, trong
    `packages/assets/src/components/ReminderEmailPreview/ReminderEmailPreview.js:37-51` — nó tự dựng
    chuỗi HTML + `<style>` inline từ `t.*` (`outerBackground`, `innerBackground`, `buttonColor`,
    `buttonTextColor`, `primaryText`…) rồi render trong iframe. **Port từ mockup**
    (`mockup-app/src/components/organisms/ReminderEmailPreview/ReminderEmailPreview.jsx`).

    ⇒ **Backend không có mã nào đọc `reminders.theme`.** Grep toàn `packages/functions/src`: `theme`
    chỉ xuất hiện ở chỗ **lưu và đọc lại** (`paymentReminderRepository.js:42` merge default,
    `defaultData.js:81` giá trị mặc định, schema validate). **Không consumer nào.**

    ⇒ Cả trang **"Customize email template"** (task P1 dựng, 15 field: logo, 6 màu, nút, footer,
    custom CSS) hiện **không ảnh hưởng gì tới email thật**. Merchant chỉnh thoải mái, lưu thành công,
    preview đổi — mail gửi ra vẫn y nguyên.

    ### Hệ quả phụ, cùng gốc
    Default content (`constants/defaultData.js`) viết *"The attached PDF is the latest version of
    your invoice"* và **không chứa `{{invoice_link}}`**. Hợp lý khi `access = sendAttachment` (mặc định).
    Nhưng nếu merchant đổi sang **"view online"** thì: không có attachment, **và cũng không có link**
    (vì nút CTA "View invoice online" chỉ tồn tại trong preview) → khách nhận mail **không có đường nào
    tới hoá đơn**, còn nội dung thì vẫn nói "attached PDF". Biến `{{invoice_link}}` có tồn tại
    (`constants/paymentReminders.js:33-40`) nhưng merchant phải tự chèn tay.

    ### ✅ HƯỚNG ĐÃ CHỐT (dantt duyệt sửa 10/08) — MỘT hàm dựng HTML, hai bên cùng import

    **Recon quyết định**: `packages/assets` **import được** từ `packages/functions` — **233 chỗ đang
    làm vậy** trong 130 file (vd `@functions/helpers/parseString`, `@functions/config/getPlans`),
    alias khai ở `packages/assets/.babelrc:23` và `packages/assets/vite.config.js:220`.

    ⇒ Không cần dựng API preview, cũng không được viết 2 bản. Đặt **một hàm thuần** ở
    `packages/functions/src/helpers/email/` (vd `buildReminderEmailHtml({theme, content, ...})`),
    rồi **cả hai bên cùng import đúng hàm đó**:
    - BE: `#sendReminderMail` + `sendTestReminderMail` bọc `content` bằng hàm này trước khi
      `MailService.sendMail`
    - FE: `ReminderEmailPreview.js` bỏ phần tự ghép chuỗi HTML (dòng 37-51), gọi cùng hàm

    **Vì sao không chọn API preview**: preview cập nhật realtime khi merchant kéo màu / gõ chữ,
    gọi API mỗi keystroke là sai. Hàm thuần import chung vừa realtime vừa không thể trôi.

    **Ràng buộc cho hàm chung**: phải **thuần** — không đọc Firestore, không `process.env`, không
    import thứ chỉ chạy được ở Node (`fs`, `firebase-admin`…), vì FE bundle nó vào vite.

    ### Còn phải quyết trong lúc làm (agent nêu, đừng tự chốt im lặng)
    - **Custom CSS**: `enableCustomCss` + `customCss` áp thế nào — nhiều email client bỏ `<style>`,
      cần cân nhắc inline. Preview dùng `<style>` được vì nó là iframe.
    - **`access = viewOnline`**: nút CTA "View invoice online" hiện chỉ có trong preview. Khi bọc
      template thì nút này vào mail thật — cần `invoiceLink` (BE đã tính sẵn,
      `wholeSale.service.js:330-338`) truyền vào hàm dựng.
    - Default content vẫn viết "The attached PDF…" kể cả khi merchant chọn viewOnline — **nêu ra,
      đừng tự sửa chuỗi**, đó là quyết định nội dung.

    ⚠️ Đây **không phải bug nhỏ về giao diện** — nó nghĩa là một trang settings đầy đủ đã build xong
    nhưng chưa nối vào đâu cả.

23. [✅ 2026-08-10] **Modal Send test đóng ngay khi bấm, không chờ request** — phải hiện loading rồi mới đóng
    - nhánh `feature/payment-reminder` · commit `1c7384742` · **ĐÃ PUSH**
    - 2 files, 32 insertions / 6 deletions. Thêm prop `closeOnAction` (mặc định `true` = hành vi cũ);
      `PaymentReminderSettings` truyền `false` + đóng ở `onSettled`; `handleClose` no-op khi `loading`,
      Cancel thêm `disabled: loading`.
    - **`AutomationEmail.js` KHÔNG bị sửa** — `git diff` rỗng, call site không truyền `loading` lẫn
      `closeOnAction` nên rơi vào default, hành vi cũ y nguyên.
    - Verify: verifier **PASS vòng 1**. Gate: assets build 2× `✓ built in` · functions test 10/66
      (không đụng) · eslint 2 file exit 0 · không file `.json` nào bị sửa.
    - ⚠️ **Chưa xác minh**: không có browser → chỉ khẳng định wiring, **chưa thấy spinner thật**.

    ### 🔴 RỦI RO MỚI DO CHÍNH FIX NÀY TẠO RA — cần dantt quyết
    Chặn đóng khi `loading` là đúng yêu cầu, nhưng verifier truy ra **không có đường thoát** nếu
    request treo:
    - `sendTestPaymentReminderApi` (`api/emailApi.js:49-55`) → `fetchAuthenticatedApi`
      (`helpers.js:244`). **Nhánh embedded** (app Shopify thật) dùng thẳng
      `authenticatedFetch(app)` (dòng 252-263) — **KHÔNG có timeout/AbortController**.
    - Mutation không có `retry`/timeout; `QueryClient` (`App.js:34-41`) cũng không cấu hình timeout.
    - ⇒ Request treo → `isPending` mãi `true` → Cancel disabled, X + backdrop no-op →
      **user chỉ còn cách reload trang**.
    - Nhánh **không-embedded** (`api()`, `helpers.js:215-223`) có `timeout: 60000` nên tự thoát sau 60s.
    - Lỗi HTTP bình thường **không** dính (có response → reject → `onSettled` chạy). Chỉ treo mới dính.

    **Ba hướng, chưa chọn**: (a) thêm AbortController/timeout cho `fetchAuthenticatedApi` — sửa gốc
    nhưng đụng helper dùng chung toàn app · (b) chỉ `disabled` nút Cancel, vẫn cho đóng bằng X ·
    (c) chấp nhận rủi ro edge-case, ghi nhận.

    **dantt yêu cầu 10/08**: "trong khi gửi request thì chưa close modal mà hiển thị loading ở primary
    action của modal, gửi xong thì tắt → hiện toast".

    ### Nguyên nhân — đã tìm ra, KHÔNG cần điều tra lại
    `components/SendTestMailModal/SendTestMailModal.js:16-25`:
    ```js
    const handleSubmit = useCallback(() => {
      if (!validateEmail(email)) return setEmailError(...);
      onAction({...values, email});
      onClose();          // ← đóng NGAY, không đợi request
    }, [...]);
    ```
    Prop `loading` **đã được truyền đúng** (`PaymentReminderSettings.js:250` →
    `loading={sendTestMutation.isPending}`) và modal **đã gắn** nó vào `primaryAction.loading`
    (dòng 42-46). Nhưng không ai thấy vì modal biến mất trước khi request xong.

    ### ⚠️ Component DÙNG CHUNG — 2 nơi
    `pages/PaymentReminderSettings/PaymentReminderSettings.js:245` và
    `pages/AutomationEmail/AutomationEmail.js:315`.
    ⇒ **Đổi thẳng hành vi tự đóng sẽ đụng cả trang AutomationEmail.**

    **Hướng đề xuất (an toàn, chờ agent xác nhận khả thi)**: thêm prop opt-in kiểu
    `closeOnAction = true` (mặc định **giữ nguyên** hành vi cũ) → `AutomationEmail` không đổi gì;
    `PaymentReminderSettings` truyền `closeOnAction={false}` và tự đóng khi mutation settle.

    ### Việc cần làm
    1. Modal: không tự `onClose()` khi `closeOnAction === false`
    2. Page: đóng modal ở `onSettled` của `sendTestMutation` (đóng cho **cả** thành công lẫn lỗi,
       kẻo lỗi thì modal kẹt mãi)
    3. Trong lúc `loading`: **chặn đóng modal** — vô hiệu nút Cancel và `onClose` của backdrop.
       Nếu không, user đóng giữa chừng rồi toast nhảy ra không rõ từ đâu.
    4. Toast giữ nguyên chỗ cũ (`onSuccess`/`onError`), không đụng nội dung

    ### Ràng buộc
    - **KHÔNG đổi hành vi trang `AutomationEmail`** — đó là feature khác, ngoài scope
    - Không đổi chuỗi hiển thị, không thêm/xoá key i18n
    - ⚠️ i18n: file **nguồn** là `<TênComponent>.json` cạnh component, không phải `locale/translations/`

22. [✅ 2026-08-10] **Cho ô "📎 tên file" trong thân mail bấm được → LINK TẢI PDF** (dantt chốt 10/08)

    - nhánh `feature/payment-reminder` · commit `177a4489c` (đã push)
    - Sửa `buildReminderEmailHtml.js` (thêm param optional `downloadLink`, bọc ô attachment trong
      `<a>` **style inline**), `wholeSale.service.js` (cả `sendReminderMail` cron lẫn
      `sendTestReminderMail` gọi `generateViewOnlineOrDownloadLink` lần 2 với `isDownload: true`;
      `invoiceLink` giữ nguyên `isDownload: false` vì còn back merge tag `{{invoice_link}}` + CTA),
      `ReminderEmailPreview.js`, + test mới trong `buildReminderEmailHtml.test.js`
    - verifier PASS: `packages/functions && yarn test` exit 0 (**10 suites / 69 tests**) ·
      eslint riêng 2 file sửa exit 0 · `functions run production` exit 0 (422 files) ·
      `assets run production` exit 0 (vite ×2)
    - Verifier tự làm lại thí nghiệm, không tin report: gọi thẳng hàm với `downloadLink`
      thiếu/`undefined`/`null`/`''` → render plain text, **không có** `href="undefined"`;
      gỡ fix ra (compile bản ở `177a4489c^`) → 2 assertion mới **FAIL** đúng như mong đợi
      ⇒ test guard thật; `grep "^import"` = 0 (hàm vẫn thuần); nhánh
      `sendAttachment`→attachment / `viewOnline`→CTA không lẫn.
    - Chưa xác minh: gửi mail thật qua SMTP Chatty (không có credential trong môi trường verify).

    ⛔ **PHỤ THUỘC task 20** — cùng sửa `wholeSale.service.js`. Chỉ giao **sau khi task 20 commit xong**,
    kẻo hai agent đè nhau.

    **Hiện trạng**: `buildReminderEmailHtml.js:78-81` là `<td class="attachment">` chứa `&#128206;`
    + tên file, **không có thẻ `<a>`** → bấm không ra gì. Port từ mockup, mockup cũng chỉ để nhìn.

    **dantt chốt: link TẢI** (không phải link xem online). Lý do: ô đó hiện tên file kèm kẹp giấy nên
    người ta bấm là mong tải; link xem online còn **trùng vai với nút CTA**, mà template cố ý chỉ hiện
    một trong hai.

    ### Việc cần làm
    1. BE tính thêm **link tải** — cùng helper `MailService.generateViewOnlineOrDownloadLink` nhưng
       **`isDownload: true`** (hiện `invoiceLink` dùng `isDownload: false`). Xem
       `wholeSale.service.js:330-338` (cron) và chỗ tương ứng trong `sendTestReminderMail`.
    2. Truyền xuống `buildReminderEmailHtml` thành tham số mới (vd `downloadLink`).
    3. Template bọc nội dung ô attachment trong `<a href="${downloadLink}">`, **style inline** (task 19:
       không dựa vào `<head><style>`, client strip mất).

    ### ⚠️ Ràng buộc
    - **Tham số mới phải OPTIONAL.** `buildReminderEmailHtml` **dùng chung với FE preview**
      (`ReminderEmailPreview.js`), mà FE **không có** link tải thật. Thiếu tham số → render **như hiện tại**
      (không link), đừng để `href="undefined"`.
    - Giữ nguyên tính **thuần** của hàm (`grep "^import"` = 0) — vite bundle vào FE.
    - Vẫn **một** hàm dùng chung, **không** tách bản riêng cho preview (task 17).
    - Không đụng nhánh CTA vs attachment (task 19 đã verify: `sendAttachment` → attachment,
      `viewOnline` → CTA).

    📌 **Lệch mockup có chủ ý** — mockup vẽ ô đó không có link. Đã lệch mockup một lần rồi (thay editor
    giả bằng CKEditor), ghi lại lý do là đủ.
    📌 Đây là **thứ cộng thêm, không phải sửa lỗi**: PDF vốn đã đính kèm thật. Link hữu ích cho người
    đọc trên điện thoại hoặc khi client chặn file đính kèm.

20. [✅ 2026-08-10] **PDF không được đính kèm vào mail reminder** — `attachments` truyền qua tham số hỏng
    - nhánh `feature/payment-reminder` · commit `153e74913` · **ĐÃ PUSH**
    - Sửa 2 call site trong `wholeSale.service.js`: đưa `attachments` vào **trong** options.
      Send test giữ `({...options, attachments}, [], true)` — `true` vẫn ở **vị trí thứ 3**.
    - Tạo `__tests__/wholeSale/reminderAttachments.test.js`. **Test 9/64 → 10 suites / 66 tests.**
    - Verify: verifier **PASS vòng 1**, 0 finding. Đáng chú ý cách nó thí nghiệm: bị cấm sửa file repo
      nên nó **copy service ra scratchpad**, revert đúng 2 hunk về dạng hỏng, rồi chạy **file test THẬT**
      qua jest config trỏ alias sang bản hỏng → **2/2 test đỏ** (`Received: undefined`). File trong repo
      **chưa từng bị đụng** (`git diff` không đổi trước/sau). Sạch hơn cách mutate-rồi-khôi-phục.
    - Verifier **quét chỗ tương tự**: grep mọi `MailService.sendMail(` trong `src` →
      `processHookedInvoice.js:156` · `mail.service.js:567` · `emailNotification.service.js:187,283` ·
      `export.service.js:138`. **Tất cả đã đúng shape từ trước**, không còn call site nào ở dạng hỏng.
    - Gate: functions test 10/66 · eslint 2 file exit 0 · functions build 422 files · `mail.service.js`
      `git diff` **rỗng** (ràng buộc cứng, đã kiểm 2 lần).
    - ⚠️ **Chưa xác minh**: không gửi mail thật trong lúc verify → chỉ khẳng định `attachments` nằm đúng
      chỗ trong options. **dantt cần mở mail xem thẻ đính kèm của Gmail** (cuối thư, cạnh nút Reply).
    - 📌 **NỢ tách riêng, chưa quyết**: tham số thứ 2 của `sendMail` vẫn hỏng và vẫn nằm trong chữ ký
      hàm — mời gọi người sau truyền vào đó, mà nó **im lặng tuyệt đối**. Nên gỡ hẳn hoặc merge vào
      options. Không sửa trong task này vì đụng code dùng chung của mọi email trong app.

    **dantt phát hiện 10/08** khi mở mail thật: nền/card/logo đã lên đúng (task 19 OK), nhưng
    **không có thẻ đính kèm nào** trong Gmail. Khối `📎 Invoice_1003.pdf` trong thân mail chỉ là
    **chỉ dấu trực quan** (`buildReminderEmailHtml.js:78-81`, `<td class="attachment">`, không có
    thẻ `<a>`) — port từ mockup, đúng thiết kế. PDF thật phải là attachment của email.

    ### Nguyên nhân — đã chứng minh
    `MailService.sendMail(options, attachments = [], sendTest = false)` — **tham số thứ hai HỎNG**.
    `services/mail.service.js:66-87`:
    ```js
    const transportOptions = {host, port, secure, attachments, ...SMTP_TIMEOUTS};
    const transporter = nodemailer.createTransport(transportOptions);  // attachments Ở ĐÂY
    await transporter.sendMail(options);                                // message KHÔNG có
    ```
    `attachments` bị nhét vào **cấu hình transport** thay vì **message** → nodemailer bỏ qua,
    **không báo lỗi**. Mail vẫn gửi thành công, cờ idempotency vẫn ghi, chỉ là thiếu file.

    **Hai luồng đang chạy tốt làm ĐÚNG cách** — đặt `attachments` **bên trong options**:
    · `handlers/processHookedInvoice.js:156-165` · `services/mail.service.js:567-576`

    Payment reminder là chỗ **đầu tiên** dùng tham số thứ hai đó. Nó có sẵn trên `origin/master`
    từ trước nhưng **chưa ai gọi**, nên chưa lộ. ⇒ Bug của feature này, không phải bug có sẵn.

    Cả 2 call site đều dính: `wholeSale.service.js:396` (cron) và `:500` (send test).

    ### Cách sửa (tối thiểu, không đụng code dùng chung)
    Đưa `attachments` vào trong options ở cả 2 chỗ, y như 2 luồng kia.
    ⚠️ Call site `:500` có **tham số thứ ba `true`** (`sendTest` — bỏ qua `InsightTracker`).
    **Không được làm mất nó** khi đổi.

    ### 📌 Nợ tách riêng, cần dantt quyết (chạm code dùng chung)
    Tham số `attachments` thứ hai của `sendMail` nên **gỡ hẳn** hoặc merge vào options. Để nguyên là
    một cái bẫy nằm chờ người tiếp theo — chữ ký hàm mời gọi truyền vào đó, mà nó **im lặng tuyệt đối**:
    không lỗi, không cảnh báo, chỉ là mail thiếu file.

19. [✅ 2026-08-10] **Email HTML dựng theo kiểu web, không sống được trong email client** (theme mất nền/card)
    - nhánh `feature/payment-reminder` · commit `933e741c8` · **ĐÃ PUSH**
    - 2 files, 103 insertions / 48 deletions. Viết lại `helpers/email/buildReminderEmailHtml.js`
      theo **HTML chuẩn email**: `<table>` bọc ngoài, `<td>` mang màu ở **CẢ** `bgcolor="..."`
      **VÀ** inline `style="background-color:..."`; style inline trên từng element thay vì class
      selector. Thứ tự khối + nhánh CTA/attachment **không đổi**.
    - **Test 63 → 64.** Test mới: cắt bỏ mọi thứ tới hết `</style>` (mô phỏng client strip
      `<head><style>`) rồi assert màu vẫn còn qua `bgcolor` + inline. Đưa màu về lại `<style>` là test đỏ.
    - Verify: verifier **PASS vòng 1**, 0 finding. Tự làm 5 thí nghiệm thay vì tin lời agent:
      · `git diff` file test = **20 insertions / 0 deletions** → 7 test cũ thật sự nguyên vẹn
      · **tự ghi đè bản pre-fix** (màu chỉ trong `<style>`) → đúng test mới FAIL
        (`Expected pattern: /<td[^>]*bgcolor="#abc123"/`), 8 test kia vẫn xanh; khôi phục → md5 khớp lại
      · `grep "^import"` = 0 · `grep "isPreview\|isEmail"` = 0 · `ReminderEmailPreview.js` diff **rỗng**
      · `grep -rln buildReminderEmailHtml` toàn repo = đúng 3 file → **không có bản dựng HTML thứ hai**
      · tự sinh HTML với màu **khác** màu test của agent (`#ff0000`/`#00ff00`), strip `<style>`,
        grep lại → outer + inner còn đủ ở cả `bgcolor` lẫn inline
      Gate: functions test 9 suites/64 · assets build 2× `✓ built in` · functions build 422 files · eslint 2 file exit 0.
    - ⚠️ **Chưa xác minh**: **không có email client thật** → chỉ khẳng định được về cấu trúc HTML.
      **Chưa ai mở mail sau khi sửa.** dantt cần gửi lại và xem nền xám + card có lên không.
    - 📌 **Giới hạn còn lại, đã ghi trong doc comment của file**: `theme.customCss` vẫn phải nằm trong
      **một** `<style>` block duy nhất (không có chỗ nào khác để đặt) → client nào strip `<head><style>`
      (Gmail mobile, Outlook desktop cũ) vẫn mất custom CSS. Muốn dứt điểm phải thêm **CSS inliner** —
      scope lớn hơn, chưa làm.
    - 📌 Nhắc lại 2 thứ **KHÔNG phải bug**: logo mất là do mail vào **spam** → Gmail chặn ảnh
      (URL logo curl HTTP 200) · không có nút CTA khi `access = sendAttachment` là **đúng thiết kế**.

    **dantt phát hiện 10/08** khi so mail thật với preview. Cấu trúc **giống hệt** (nội dung, khung
    attachment, footer đều khớp) nhưng lệch đúng 2 chỗ:

    | | Preview | Mail thật | Nguyên nhân |
    |---|---|---|---|
    | Logo | ✅ | ❌ | mail vào **spam** → Gmail chặn ảnh từ xa. URL logo **vẫn sống** (curl HTTP 200, PNG 34KB) — không phải lỗi code |
    | Nền xám + card trắng | ✅ | ❌ | **Gmail bỏ style cấp `body`** |

    🔴 **Lỗi thật là cái thứ 2.** `buildReminderEmailHtml.js` dựng theo kiểu web:
    ```css
    body  { background:#f5f5f5 }   /* Gmail vứt style cấp body */
    .card { background:#ffffff }    /* → card trắng trên nền trắng của Gmail = vô hình */
    ```
    Preview trông đẹp vì chạy trong **iframe**, nơi `body` là của riêng nó. Mail thật thì client bọc
    nội dung vào DOM của nó → mất nền → nhìn như text trơn.

    ⚠️ CSS **có ăn** (khung viền `.attachment` và `.footer` căn giữa vẫn hiện) — nên **đừng** đi tìm
    bug "theme không được áp". Theme được áp, chỉ là cách dựng HTML không hợp email client.

    **Cách sửa (chuẩn email HTML):** bỏ `body background`, dùng **`<table>` bọc ngoài với `bgcolor`**
    và **style inline** thay cho `<head><style>`. Đây đúng là phần "inline CSS" đã đánh dấu ở task 17
    là *scope lớn hơn, chưa làm* — giờ có bằng chứng nó **bắt buộc**, không phải tuỳ chọn.
    ⚠️ Sửa xong phải giữ nguyên tính chất **một hàm dùng chung cho cả preview và mail** (task 17),
    đừng tách lại thành 2 bản.

    **Không phải bug, đừng sửa:**
    - **Không có nút CTA** khi `access = sendAttachment` — template chọn *một trong hai*: đính kèm PDF
      **hoặc** nút "View invoice online". Verify: `sendAttachment` → cta ❌/attachment ✅;
      `viewOnline` → cta ✅/attachment ❌. Preview cũng vậy.

    📌 **Đáng đề xuất Product**: màu mặc định `outerBackground #f5f5f5` vs `innerBackground #ffffff`
    chênh nhau quá ít, kể cả sửa xong cũng gần như không phân biệt được.

    📌 **Vấn đề riêng, không thuộc task này**: mail vào **spam**. Gửi từ
    `noreply-pdfinvoice@chattyemail.com`, nội dung đòi nợ, không có SPF/DKIM khớp domain shop.
    Là chuyện deliverability, cần xử riêng — nhưng ảnh hưởng trực tiếp tới việc khách có đọc được không.

20. [✅ 2026-08-10] feature/payment-reminder ở nhánh này thì khi click nút mũi tên ở góc phải màn hình thì bị hiển thị save change top bar?

    - nhánh `feature/payment-reminder` · commit `f2c6921ea` (đã push)
    - **Root cause** (không phải thiếu dirty-guard như đoán ban đầu): nút mũi tên là
      `Page.pagination` ở `PaymentReminderSettings.js:180-187`, `history.push` đổi route param
      `:type` mà `routes.js:82-83` dùng **cùng một component** ⇒ KHÔNG remount. Effect
      `PaymentReminderSettings.js:58-63` set `values` và `initial` bằng **cùng một object
      reference** nên lúc đó chưa dirty. Nhưng prop `value` của `<CKEditor>` đã đổi →
      `@ckeditor/ckeditor5-react` v6.3.0 gọi `editor.data.set()`
      (`_shouldUpdateEditor(t){return this.props.data!==t.data && this.editor.data.get()!==t.data}`)
      → bắn ra **cùng event `change:data`** như user gõ thật, nhưng chuỗi HTML là bản CKEditor
      **tự serialize lại** → `onChange` forward lên → `setField('content', …)` ghi đè
      `values.content` trong khi `initial.content` giữ chuỗi thô ⇒ `showSaveBar` (dòng 90) true
      dù không ai chạm gì.
    - **Fix**: `echoGuard.js` (mới, state machine **thuần**, tách khỏi JSX để test được) +
      `CkeditorInput.js` lấy editor sống qua `onReady` rồi arm guard đúng **cả hai vế** predicate
      của thư viện (`editorData !== undefined && value !== lastPropData && editorData !== value`).
      Nuốt đúng một echo. Sửa ngay chỗ đẻ ra dirty giả, **không** che bằng confirm-guard khi
      điều hướng.
    - ⚠️ **Vòng sửa 1 bị verifier bắt FAIL** — bản đầu arm cờ trong render body theo
      `lastEmittedRef`, disarm chỉ khi có `change:data`: hai điều kiện không đồng bộ nên cờ kẹt
      `true` sau một re-render không liên quan (vd bấm "Insert variable", `ContentSection.js:60-64`)
      → **nuốt ký tự user gõ thật**. Bài học: guard kiểu one-shot flag phải arm theo **đúng**
      điều kiện mà bên kia dùng để bắn event, nếu không sẽ lệch.
    - verifier PASS (vòng 2, tự viết script riêng load `echoGuard.js` thật, không dùng lại sim
      của agent): repro vòng 1 hết bug với N = 1/2/5 re-render · double-render StrictMode không
      arm hai lần · dựng lại logic hỏng của vòng 1 → **4/7 test mới FAIL** ⇒ test guard thật ·
      `npx jest packages/assets/__tests__/` 12/12 · eslint 3 file exit 0 · assets lint đúng
      baseline 180 errors/41 warnings, không thêm lỗi · `assets run production` exit 0 (vite ×2) ·
      `packages/functions yarn test` 10 suites/69 tests.
    - Chưa xác minh: chưa repro tay trên browser thật (package không có DOM harness).


## 2026-08-12 — ARCHIVE (chưa làm, dantt yêu cầu dọn khỏi BRIEF để tập trung task 25)

> 4 task dưới đây **KHÔNG phải đã xong**. Chúng là finding ngoài scope tích lại từ các vòng
> /looptasks trước (task 12, 24 do verifier phát hiện; 18, 21 do dantt gặp khi test tay).
> Chuyển sang đây nguyên văn để tra lại khi cần mở lại.

12. [ ] **Mass assignment ở route legacy `PUT /order/:id`** — client set được MỌI field của `wholesaleOrders`

    **Verifier phát hiện 07/08 khi verify task 11.** PRE-EXISTING, không do task 11 tạo ra.
    Không chặn task 11 nên tách ra đây thay vì sửa lén (quy tắc "finding ngoài scope" của skill).

    `routes/order.route.js:34` → `controllers/order.controller.js:330-336`
    `OrderController.updateOrderWholesale` → `services/wholeSale.service.js:58-64`:
    ```js
    static async updateOrderById({body, shopId, orderId}) {
      ...
      return updateOrder({...body, orderId, shopId});   // body = ctx.req.body, RAW
    }
    ```
    Route này **không có schema validation, không whitelist/blacklist field nào**. Mà
    `updateOrder` (`wholesaleOrdersRepository.js:37-44`) làm
    `ref.update({...data, id: data.orderId})` → Firestore nhận verbatim.

    ⇒ Ai gọi được route này set thẳng được `isSendDueReminder` / `overdueReminderCount`
    (**phá đúng invariant idempotency mà task 11 vừa dựng** — reset cờ = gửi lại, set count = 2 =
    câm vĩnh viễn), và cả `isUnpaid` / `dueAt` / `paymentBadge` / `isCanceled`.

    **Cần làm**: thêm whitelist field cho route này (hoặc Yup schema như các route mới), **KHÔNG**
    dùng blacklist — field mới thêm sau sẽ tự lọt. Quét luôn các route khác spread `ctx.req.body`
    thẳng vào repository.

    ### ✅ RECON XONG 07/08 16:5x (Explore agent, read-only) — đã gỡ ẩn số "ai đang gọi"

    - **KHÔNG có call site FE nào** gọi `PUT /order/:id`. Grep toàn `packages/assets/src` mọi
      `method: 'PUT'` + mọi literal `/order`: chỉ có đúng một, `pages/OrderPage/OrderPage.js:167`
      → `/order/${id}/discount`, mà đó là **route khác** (`order.route.js:36`
      → `updateOrderDiscountById`), koa-router không match `/order/:id`.
    - **Không client nào khác trong repo**: grep `updateOrderWholesale|updateOrderById` toàn repo →
      chỉ 1 đường duy nhất `order.route.js:35` → `order.controller.js:330-336` → `wholeSale.service.js:58`.
      Không test, script, webhook, extension nào gọi. `controllers/apiV1*` (API v1 public) không có
      route order tương ứng.
    - **KHÔNG lộ public.** Route mount qua `routes/index.routes.js:52`, chỉ được gọi từ
      `handlers/app.js:46` (`/api`, `verifyEmbedRequest`) và `handlers/appSa.js:38-39`
      (`/apiSa`, `verifyRequest`). `handlers/proxy.js` (app proxy storefront) **không** import
      route order → không với tới được từ storefront.
      ⇒ Hạ mức nghiêm trọng: cần **session merchant đã đăng nhập**, và `shopId` lấy từ session
      nên không sửa được đơn shop khác. Vẫn là mass assignment (merchant tự set field mà UI không
      cho phép, gồm field chỉ server được ghi), nhưng **không phải lỗ hổng cho người ngoài**.
    - **Whitelist ứng viên = RỖNG** — không có call site thật nào để suy ra field hợp lệ.
    - `routes/order.route.js` **không import `middleware/validator` ở BẤT KỲ route nào** — không
      phải ngoại lệ của một route, mà là thói quen của **cả file**. Các route file khác
      (`paymentReminder`, `email`, `template`, `settings`, `delivery`, `featureRequest`) đều có dùng.

    **⇒ Hướng nên cân nhắc trước khi viết whitelist**: route này có vẻ là **dead code**. Xoá hẳn
    hoặc khoá cứng sẽ dứt điểm hơn là dựng whitelist cho một endpoint không ai gọi. Nhưng
    "không ai gọi **trong repo này**" ≠ "không ai gọi" — có thể còn client ngoài repo (script nội
    bộ, Postman cũ, merchant tự gọi bằng token của họ). **Nên xem access log/APM trước khi xoá.**

    Pattern spread `{...body}` không validate ở chỗ khác (chỉ liệt kê, chưa xử):
    `wholeSale.service.js:63` · `wholesaleOrdersRepository.js:37,58` · `customer.service.js:16` ·
    `productTranslationRepository.js:24` · `downgradeReasonRepository.js:18`

18. [ ] **Composite index khai trong repo nhưng CHƯA deploy → cron chết, không chỉ reminder hỏng**

    **Phát hiện 10/08** khi dantt tạo đơn #1003/#1004 mà không thấy mail. Chạy đúng query của
    `getOrdersForDueReminder` trên `avada-staging` → `FAILED_PRECONDITION: The query requires an index`.

    `firestore.indexes.json` **CÓ khai** đủ 2 index (2 dòng cuối của mục `wholesaleOrders`):
    ```
    shopId, isUnpaid, isCanceled, isSendDueReminder, dueAt
    shopId, isUnpaid, isCanceled, paymentBadge, overdueReminderCount
    ```
    Nhưng **Firestore chưa có chúng**. Khai trong repo ≠ đã deploy.
    → Đúng rủi ro task 2 (P0) tự ghi từ 06/08: *"chưa xác minh 2 composite index có đủ không"*.
    Câu trả lời: **không, vì chưa tồn tại**.

    🔴 **Hệ quả nặng hơn "reminder không gửi"**: `getOrdersForDueReminder` **ném lỗi** →
    `sendPaymentReminders()` đổ → **cả `handleOrderDaily` chết**. Trên production nghĩa là cron
    fail **mỗi giờ**, kéo theo `updatePaymentTerm()` (bước cập nhật trạng thái quá hạn) không hoàn tất.
    Không chỉ mất feature mới, mà **hỏng cả thứ đang chạy tốt**.

    **Việc cần làm:**
    1. Deploy 2 index lên staging + production (`firebase deploy --only firestore:indexes`, hoặc
       `gcloud firestore indexes composite create` cho chính xác 2 cái). Build mất vài phút.
    2. **Bọc `try/catch` quanh `sendPaymentReminders()`** trong `handlers/cron/handleOrderDaily.js`.
       Hiện `updatePaymentTerm` và reminder dùng chung một lượt cron — reminder lỗi là mất cả hai.
       Feature mới không được phép kéo sập thứ đã chạy ổn.
    3. Thêm bước "deploy index" vào quy trình release của feature này (spec/checklist chưa có).

    ✅ **CẬP NHẬT 10/08 11:54 — index đã BUILD XONG, cả 3 query chạy được.**
    `getOrdersForDueReminder` → 2 đơn · `...OverdueReminder(1)` → 1 đơn · `(2)` → 0 đơn.
    ⇒ Việc 1 (deploy index) coi như xong **trên staging**. **Production CHƯA kiểm** — vẫn phải làm.

    ### 🎉 LẦN ĐẦU CHẠY END-TO-END THÀNH CÔNG (10/08 11:5x)

    Chạy thẳng `WholeSaleService.sendPaymentReminders()` từ `lib/` trên staging, flag gửi **tắt**.
    Cố ý **không** gọi `handleOrderDaily()` vì `updatePaymentTerm()` → `getOrdersOverdue()`
    **KHÔNG lọc theo shopId** (`wholesaleOrdersRepository.js:193-198`) → nó quét đơn của **MỌI shop**
    trên staging và ghi `paymentBadge` lan sang dữ liệu người khác. Ai chạy sau nhớ điều này.

    Output — đúng 3 dòng, khớp thiết kế:
    ```
    flag OFF — would mark isSendDueReminder=true (order already overdue)   orderId 7034955596077 (#1003)
    flag OFF — would send due reminder      #1004 → dantt@avadagroup.com
       subject: "Invoice #1004 from dantt-pdf-dev is due on August 11, 2026"
    flag OFF — would send overdue reminder  #1003 → dantt@avadagroup.com
       subject: "Overdue: invoice #1003 — $2,629.95 still outstanding"
    ```

    **Chứng minh được:**
    - Chọn đơn đúng: #1004 vào nhánh due (timing `before`, còn 1 ngày tới hạn), #1003 vào nhánh overdue
    - **Race due-vs-overdue xử lý đúng**: #1003 lọt cả 2 query, nhưng nhánh due **bỏ qua** vì đã
      `paymentBadge=overdue` và chỉ đánh cờ — khách **không** nhận email "sắp tới hạn" cho đơn đã trễ
    - **Merge tag render đúng** cả 2 loại: tên đơn, tên shop, ngày (`August 11, 2026`), và
      **số tiền có định dạng tiền tệ** (`$2,629.95`) — không phải số trần
    - Địa chỉ người nhận resolve đúng
    - Flag OFF hoạt động đúng cả 2 vế: chỉ log, **không gửi, không ghi cờ**

    ⏭️ **Bước tiếp theo cần dantt duyệt**: bật `ENABLE_PAYMENT_REMINDER_SEND` rồi chạy lại để
    **nhận mail thật** — lúc đó mới kiểm được giao diện theme (task 17) và cờ idempotency có chặn
    lần gửi thứ hai không. Mail gửi về `dantt@avadagroup.com` (chính dantt) nên rủi ro thấp.

    ---

    ### 🔧 Công cụ: mô phỏng cron ở local (đã dựng 10/08)

    `/private/tmp/claude-501/.../scratchpad/runCron.js` — **script tạm trong scratchpad, chưa commit.**
    Nạp **code thật** từ `packages/functions/lib` (bản babel compile), chạy trên Firestore staging thật,
    env lấy từ `.env.local` + `serviceAccount.development.json`.

    ```
    node runCron.js          # DRY — chỉ chạy 3 query chọn đơn, KHÔNG ghi gì
    node runCron.js --run    # chạy thật handleOrderDaily()  ⚠️ CÓ GHI Firestore
    ```

    In ra: flag gửi thật đang bật/tắt · `getAllShopIds()` có thấy shop không · từng query chọn được
    mấy đơn (kèm `dueAt`/`badge`/`sentDue`/`overdueCount`) · nếu thiếu index thì in **link tạo index**.
    Chế độ `--run` in thêm trạng thái đơn sau khi chạy để đối chiếu cờ idempotency.

    ⚠️ `--run` gọi nguyên `handleOrderDaily()` nên chạy cả `updatePaymentTerm()` và
    `updateDiscountEarlyForOrder()` — **ghi vào `wholesaleOrders` thật**, không chỉ phần reminder.

    ❓ **Nên đưa vào repo thành `packages/functions/src/commands/runOrderDailyCron.js`?**
    Tài liệu test hiện chỉ nói "kích cron" mà chưa chỉ cách. Chờ dantt quyết.

    ### Dữ liệu test đang có trên `avada-staging` (shop `dantt-pdf-dev`, `AYctc8Mrxl664GaFbRUj`)
    | Đơn | dueAt | badge | isSendDueReminder | overdueReminderCount |
    |---|---|---|---|---|
    | #1003 | 07/08 (quá hạn 3 ngày) | `overdue` | `false` | `0` → sẵn sàng OVERDUE lần 1 |
    | #1004 | 11/08 (ngày mai) | `pending` | `false` | `0` → sẵn sàng DUE (timing `before`, 1 ngày) |

    Settings shop: `due.enabled=true, timing=before, timingDays=1` · `overdue.enabled=true,
    timingDays=1, resendDays=1`. ✅ Cả hai đơn **có đủ** 2 cờ → **fix task 11 chạy đúng trên dữ liệu thật.**

    ### ✅ ĐÃ GỬI MAIL THẬT 10/08 12:01 — idempotency VERIFY BẰNG RUNTIME
    Bật `ENABLE_PAYMENT_REMINDER_SEND=true` trong `.env.local` rồi chạy `sendPaymentReminders()`:
    - **2 mail thật về `dantt@avadagroup.com`** (#1004 due, #1003 overdue)
    - Cờ ghi đúng sau khi gửi: #1004 `isSendDueReminder=true` · #1003 `overdueReminderCount=1`
      + `lastOverdueReminderAt=2026-08-10T05:01:54Z`
    - **Chạy lại lần 2 → KHÔNG gửi thêm gì.** Query sau đó: due 0 đơn · overdue(1) 0 đơn ·
      overdue(2) 1 đơn (#1003 chờ đủ `resendDays`). ⇒ **TC-FUNC-018 PASS bằng bằng chứng thật.**
    - ⚠️ `.env.local` giờ đang BẬT cờ — mỗi lần cron chạy trên máy dantt sẽ gửi mail thật.

21. [ ] **Deliverability: mail reminder vào SPAM, người gửi không có tên và không có avatar**

    Tách từ ghi chú rải rác ở task 19. **Không phải bug code reminder** — nhưng nếu không xử thì
    feature vô dụng: thư đòi nợ nằm trong spam thì khách không đọc.

    ### Dữ kiện đã kiểm (dig thật 10/08, không phải phỏng đoán)
    ```
    chattyemail.com          TXT  v=spf1 include:_spf.mx.cloudflare.net include:amazonses.com ~all
    _dmarc.chattyemail.com   TXT  v=DMARC1; p=quarantine; pct=10; rua=...cloudflare.net
    default._bimi...         TXT  (KHÔNG có bản ghi)
    ```

    | Vấn đề | Trạng thái | Ghi chú |
    |---|---|---|
    | SPF | có, nhưng `~all` (softfail) | **CHƯA kiểm** host SMTP thật (`CHATTY_SMTP_HOST`) có nằm trong `include:` không — nếu không thì SPF fail |
    | DKIM | **chưa kiểm** | cần biết selector mới dig được |
    | DMARC | `p=quarantine` nhưng **`pct=10`** | chỉ 10% thư fail bị xử → đang ở chế độ rollout, chưa siết thật |
    | BIMI | **không có** | ⇒ avatar hiện dấu **`?`** là **đúng dự kiến**, không sửa từ app được |

    ### 🔧 Sửa được NGAY (env, không cần code)
    `CHATTY_SMTP_SENDER` trong `.env.local` dài **34 ký tự**, **không có `<>` cũng không có `"`**
    → là địa chỉ trần `noreply-pdfinvoice@chattyemail.com`. `getSenderFrom.js:28` lấy thẳng làm From
    khi shop không phải Pro / chưa cấu hình sender riêng ⇒ mail hiện **địa chỉ trần, không tên**.
    → Đổi thành `"Your Invoice" <noreply-pdfinvoice@chattyemail.com>`.
    ⚠️ **Kiểm cả biến trên production**, không chỉ local.

    ### 🐛 Bug nhỏ trong code, chưa sửa
    Giá trị **mặc định** của `fromSubject` ở **cả hai** file config **thiếu dấu `<>`** — sai định dạng RFC 5322:
    - `config/smtp.js` → `'"Your Invoice" noreply-pdfinvoice@email.avada.net'`
    - `config/chattySmtp.js` → `'"Your Invoice" noreply-pdfinvoice@chattyemail.com'`

    Đúng phải là `"Your Invoice" <địa-chỉ>`. Hiện env đang có giá trị nên default không được dùng —
    nhưng shop/môi trường nào thiếu env sẽ rơi vào chuỗi sai này.

    ### Về avatar (dấu `?` trong Gmail)
    Gmail chỉ hiện logo/ảnh người gửi khi địa chỉ thuộc tài khoản Google có ảnh, **hoặc** domain có
    **BIMI**. BIMI cần: DMARC `p=quarantine|reject` với **`pct=100`** (hiện là 10) + SPF/DKIM khớp +
    **VMC** (chứng chỉ nhãn hiệu, **mất phí**) + bản ghi DNS BIMI.
    ⇒ Là việc **hạ tầng + thương hiệu**, không phải việc của app. Ưu tiên thấp hơn chuyện vào spam.

    ### Thứ tự nên làm
    1. Sửa `CHATTY_SMTP_SENDER` có tên hiển thị (rẻ nhất, hiệu quả ngay)
    2. Xác minh host SMTP thật nằm trong SPF, và DKIM có ký không
    3. Nâng DMARC `pct` dần lên 100 sau khi (2) sạch
    4. BIMI/avatar — làm sau cùng, nếu thấy đáng tiền

    ⚠️ Bối cảnh làm nó nghiêm trọng hơn bình thường: đây là thư **đòi nợ gửi cho khách của merchant**,
    tần suất tự động. Vào spam thì merchant mất tiền thật, và uy tín domain gửi càng tụt.

24. [ ] **Không có stage nào trong CI chạy test** (finding của verifier khi làm task 20, ngoài scope)

    Nguyên văn: *"grepping `.gitlab/ci/*.yml` and `.gitlab-ci.yml` for `jest`/`test`/`lint` found no
    matches — this repo currently has no CI stage that runs `jest` at all (only
    `.gitlab/ci/auto-merge.yml`). This is a pre-existing repo-wide gap … it means these 7 new tests
    currently only run when a human/agent invokes `npx jest` manually."*

    ⇒ Toàn bộ test đang có (`packages/functions` 10 suites/69 tests, `packages/assets/__tests__`
    12 tests) **không ai chạy tự động**. Mọi verdict PASS từ trước tới giờ đều là do agent chạy tay.

    Cần chốt trước khi làm: thêm stage test vào `.gitlab/ci/` có đụng gì tới quota runner
    on-premise (`git.avada.net`) không, và có muốn chặn merge khi test đỏ không.
