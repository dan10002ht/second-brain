# PDF Invoice — BRIEF

<!--
  `[ ]` chưa làm · `[⏳ HH:MM]` đang chạy · `[✅ YYYY-MM-DD]` xong
  Task xong quá 3 ngày → /looptasks tự dọn sang BRIEF-done.md
  Chạy (cwd = repo pdf, không phải brain):
  /loop 5m /looptasks ~/projects/my-brain/10-projects/pdf/BRIEF.md

  Gate của repo này (JS thuần — KHÔNG có tsc):
    ⚠️ MỌI lệnh `yarn workspace` cần Node 22 (engines.node: "22", máy mặc định 20.19):
       source ~/.nvm/nvm.sh && nvm use 22.23.0 && <lệnh>   # trong CÙNG một Bash call
    ⚠️ `npx jest` từ ROOT là SAI — hỏng sẵn, KHÔNG phải lỗi code của mình.
       Babel không thấy `.babelrc` của packages/functions khi cwd=root → 34/39 suite fail
       với "Cannot use import statement outside a module", kể cả file không liên quan.
       (verifier xác minh 06/08: grep các suite fail → 0 file nào chạm code đang sửa)
    cd packages/functions && yarn test               # ĐÚNG: rootDir riêng, 3 suites / 22 tests
    yarn workspace @avada/functions run lint        # eslint src/ — ⚠️ FAIL sẵn 94 errors ở file cũ
       (autoTranslateV2, euCountries, admin.controller, apiV1Auth, behaviorService, admin.service,
        subscription.service, test files). Cách chấm đúng: chạy eslint RIÊNG các file vừa sửa → 0 lỗi.
    yarn workspace @avada/assets   run lint
    yarn workspace @avada/functions run production  # babel src → lib/
    yarn workspace @avada/assets   run production   # vite build × 2 (embed + standalone)
  Chi tiết + bẫy riêng của app: .claude/agents/verifier.md trong repo pdf
-->

## Tasks

_(trống — thêm task ở đây)_

1.  [✅ 2026-08-06] https://space.avada.net/browse/SB-15301 hiện tại tôi đang có tính năng thế này, và MR này https://gitlab.com/avada/pdf-invoice/pdf-invoice-firebase/-/merge_requests/501 (update/product-20260806-1714) là mockup cũng như PRD của tính năng trên
    Trước tiên thì giúp tôi làm rõ feature cũng như lên plan feature này nhé

    **XONG 06/08** — deliverable: `product-team/marketing/product/prd/spec-payment-reminder-due-overdue.md` (344 dòng)
    - nhánh `docs/SB-15301-payment-reminder-spec` · commit `af85e716a` · **chưa push**
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
   - nhánh `feature/SB-15301-payment-reminder-api` · commit `52cf3f2f1` · **chưa push**
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

3. [ ] **SB-15301 P1** — FE settings payment reminder (chưa gửi mail thật)

   🚫 **BLOCKER 06/08 19:4x — verifier FAIL 2 vòng, KHÔNG mark done, code CHƯA commit.**
   Code nằm ở worktree `/private/tmp/pdf-p1`, nhánh `feature/SB-15301-payment-reminder-fe`
   (base = nhánh P0). **Chưa `git add`, chưa commit** — còn nguyên ở working tree.
   Chỉ còn **đúng 1 lỗi, sửa 2 dòng là xong** (xem finding). Sáng mai chỉ cần bảo "làm nốt P1".

   Vòng 1 FAIL: toàn bộ UI mới hardcode tiếng Anh, không wire i18n → **đã sửa xong**, verifier
   xác nhận `en.json`/`origin.json` chỉ thêm 5 key mới, **0 key cũ bị xoá/đổi**, 9 file locale
   còn lại không đụng, key mới byte-identical giữa 2 file (khớp cách `autoTranslateV2.js` sinh).

   Vòng 2 FAIL — **finding nguyên văn của verifier:**
   > Translated copy deviates from the mockup and from the app's own established i18n pattern for
   > the exact same "locked feature, upgrade link" UI — `PaymentRemindersCard.js:105-108` và
   > `PaymentReminderSettings.js:264-267`, từ key `PaymentReminders.availableOn.prefix` =
   > `"Available on the "` và `PaymentReminders.availableOn.planLink` = `"Wholesale plan"`
   > → render **"Available on the Wholesale plan"**.
   > Mockup dùng `<PlanUpgradeText plan="wholesale" feature="netTerms" />`
   > (`PaymentRemindersCard.jsx:110`, `payment-reminder-settings.jsx:232`), render literal
   > `"This option is available with our "` + `{Plan} plan` (link) — xem
   > `mockup-app/src/components/molecules/PlanUpgradeText/PlanUpgradeText.jsx:34`.
   > Câu đó không phải one-off: chính chuỗi "This option is available with our" đã là key i18n
   > sẵn có trong app, xuất hiện ở 9+ namespace (`AdvancedSettings`, `CombineOrders`, `DeliveryPage`,
   > `ExportOrdersModal`, `PlanCard`, `TemplatePage`, `XmlEmbedSettings`, `PricingTable`) và được
   > dùng y hệt ở `Advanced.js:339`, `CombineOrders.js:94`, `ExportOrdersModal.js:260`.
   > Agent tự nghĩ câu mới thay vì tái dùng đúng chữ của mockup / convention sẵn có của app.

   **Cách sửa (rõ ràng, không cần điều tra thêm):** bỏ 2 key tự chế `PaymentReminders.availableOn.*`,
   tái dùng key sẵn có ("This option is available with our" + `{Plan} plan`) đúng như
   `CombineOrders.js:94` đang làm. Rồi verify lại.

   Mọi thứ khác verifier đã xác nhận SẠCH: ≥25 chuỗi còn lại khớp mockup nguyên văn · không còn
   text hardcode · schema P0 chấp nhận partial update đúng như FE gửi · `packages/functions` không
   đụng · không TODO/`maxResend` · gate Wholesale nguyên vẹn · không lọt `node_modules`.
   Gate: `yarn workspace @avada/assets run production` exit 0 (cả embed + standalone) ·
   eslint 13 file exit 0 · `packages/functions` test 22/22 exit 0.

   - Card "Payment reminders" ở tab Automation Emails + 2 trang settings, build từ mockup, nối API P0
   - Sửa: `assets/src/routes/routes.js`, `pages/Emails/Emails.js`, `api/emailApi.js`,
     `const/queryKey.js`, rule validate subject/reply email
   - **Phụ thuộc task 2 (P0)**

4. [✅ 2026-08-06] **SB-15301 P2** — Logic gửi qua cron (phương án A đã chốt)
   - nhánh `feature/SB-15301-payment-reminder-cron` · commit `8c993b1a8` · **chưa push**
   - **depends on** `feature/SB-15301-payment-reminder-api` (P0) — stack, không base thẳng origin/master
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

5. [ ] **SB-15301 P3** — Nút "Send test" gọi API thật (`POST /payment-reminders/:type/test`)
   - **Phụ thuộc task 3 + 4**

6. [✅ 2026-08-06] **SB-15301 P4** — Test: cron logic (chọn candidate, idempotency, dừng đúng ở lần 2 không có lần 3)
     + API test (schema, gate plan). Mẫu: `__tests__/apiV1/emailAutomation.test.js`
   - **Bắt buộc xong trước khi bật cron ở production** (rủi ro tiền thật/spam)
   - nhánh `feature/SB-15301-payment-reminder-tests` · commit `74c4ff39c` · **chưa push**
   - **depends on** `feature/SB-15301-payment-reminder-cron` (P2) — stack
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
