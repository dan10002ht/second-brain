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

  ⚠️ i18n — BẪY ĐÃ VẤP 3 LẦN:
    `packages/assets/src/locale/translations/*.json` là FILE ĐƯỢC SINH RA, không phải nguồn.
    Nguồn = các file `<TênComponent>.json` nằm CẠNH component/page trong `packages/assets/src`.
    `packages/functions/src/commands/autoTranslateV2.js:223-227` quét đệ quy mọi `.json` trong
    `assets/src` (trừ `locale/translations/`), lấy tên file làm namespace, rồi GHI ĐÈ `en.json`.
    ⇒ Sửa i18n mà chỉ đụng `translations/` thì `yarn trans` lần tới sẽ hoàn tác.
    → LUÔN sửa file nguồn TRƯỚC. Đã vấp: P1, P3, task 10.
-->

## Cách test feature Payment Reminder (SB-15301)

_Viết 10/08. Đi từ nhanh nhất tới tốn công nhất. Mỗi bước ghi rõ **thứ nó chứng minh được** và
**thứ nó KHÔNG chứng minh** — vì phần lớn feature này tới giờ mới chỉ verify tĩnh, chưa chạy thật._

### Điều kiện cần (thiếu là mọi bước dưới đều vô nghĩa)

| Thứ | Giá trị đúng | Kiểm bằng cách nào |
|---|---|---|
| Shop test | `dantt-pdf-dev.myshopify.com` (`AYctc8Mrxl664GaFbRUj`) | Firestore `avada-staging` |
| `shop.plan` | `wholesale` | thiếu là FE ẩn card, BE trả 403 |
| `shop.useChattySmtp` | `true` | **đã bật 07/08.** Không bật → `ECONNREFUSED ::1:465` vì nhóm `SMTP_*` trong `.env.local` rỗng |
| Chạy app | `emudev` (= `GOOGLE_APPLICATION_CREDENTIALS=serviceAccount.development.json yarn emulators`) | cwd của function = `packages/functions` nên path tương đối resolve đúng |

### Bước 1 — Lưu settings (nhanh nhất, ~1 phút)

Vào `/automation_email` → bật toggle "Payment due reminder" → **Save** ở top bar → **F5**.

- ✅ Đúng: toggle vẫn bật sau khi F5.
- ❌ Sai: về lại tắt → ghi Firestore hỏng. Đây là bug đã sửa ở commit `b2f2038c6`; tái phát thì
  kiểm collection `paymentReminders` trên `avada-staging` xem có doc của shop không.
- 💡 Mẹo kiểm nhanh không cần Firestore: gọi `GET /apiSa/payment-reminders`, **response có field `id`**
  nghĩa là doc tồn tại thật; **thiếu `id`** nghĩa là đang trả default, tức chưa từng ghi được
  (`paymentReminderRepository.js:21-23` vs `27-34`).

**Chứng minh được**: đường ghi settings.  **KHÔNG chứng minh**: gửi mail, cron, template.

### Bước 2 — Nút "Send test" (~2 phút, đường end-to-end khả thi duy nhất hiện nay)

Trang settings chi tiết → **Send test** → nhập email của bạn.

Đi qua **đúng** `renderReminderMergeTags` + `getPDFAttachment` mà cron dùng, nên chứng minh được:
merge tag, sinh PDF, cấu hình SMTP, gửi thật. **Không** bị chặn bởi `ENABLE_PAYMENT_REMINDER_SEND`
(cố ý — merchant tự gửi cho mình phải chạy kể cả khi tắt gửi hàng loạt).

- ❌ `ECONNREFUSED ::1:465` → SMTP. Xem bảng điều kiện cần.
- ⚠️ Dùng **đơn mẫu** `storage/order.json`, không phải đơn thật → **không** chứng minh được phần
  chọn đơn, cờ idempotency, hay số học ngày tháng.
- ✅ **Từ commit `6c162f4ec` (task 17) mail đã bọc theme** — logo, màu nền, card, nút CTA, footer.
  Preview và mail thật giờ gọi **chung một hàm** `helpers/email/buildReminderEmailHtml.js` nên
  không thể lệch nhau. **Nhưng chưa ai mở mail thật để nhìn** — bước này chính là lúc kiểm điều đó.
  Đáng soi: logo có hiện không · màu có đúng cái đã chọn không · nút "View invoice online" có link
  thật không · footer có đủ không.
- ⚠️ Nhiều email client (Outlook desktop cũ) **bỏ qua `<head><style>`** → có thể thấy mail trơ dù
  code đúng. Thử ở **2 client khác nhau** (vd Gmail web + Outlook), đừng kết luận từ một chỗ.

### Bước 3 — Cron thật (tốn công nhất, và là thứ DUY NHẤT chứng minh feature hoạt động)

**Chưa ai chạy bước này lần nào.** Cần đủ 5 thứ:

1. `ENABLE_PAYMENT_REMINDER_SEND=true` trong `packages/functions/.env.local` — **mặc định TẮT**.
   Muốn xem thử mà chưa gửi thật thì **cứ để tắt rồi đọc log**: cron chạy hết logic chọn đơn +
   render, log ra thứ *sẽ* gửi, không gọi `sendMail`, không ghi cờ (`wholeSale.service.js:241-247`).
   Đây là cách test an toàn nhất, nên làm **trước** khi bật.
2. Shop đã có doc `paymentReminders` (làm xong bước 1) — `getAllShopIds()` chỉ quét shop đã lưu.
3. **Đơn phải là đơn TẠO MỚI** sau commit `a0fbaf4fa`. ⚠️ Đơn cũ **vĩnh viễn không lọt query** vì
   thiếu `isSendDueReminder`/`overdueReminderCount` — đã **chốt không backfill** phase này (xem task 11).
4. Đơn cần: `isUnpaid: true`, `isCanceled: false`, `dueAt != null`.
5. Ngày phải khớp: `timing: 'on_due'` cần `dueAt <= hôm nay`; `'before'` thì mốc là `dueAt - timingDays`.
   Overdue lần 1 cần `getDiffDays(dueAt) >= timingDays`; lần 2 cần `getDiffDays(lastOverdueReminderAt) >= resendDays`.
   → Muốn test nhanh thì **sửa tay `dueAt` lùi về quá khứ** trong Firestore, đừng ngồi đợi.

**Kích cron thủ công** — nó là `onSchedule('0 * * * *')` (`index.js:136-139`), emulator không tự chạy.
Hai cách, ⚠️ **chưa cách nào được kiểm chứng trên máy này**:
- `yarn shell` (`firebase functions:shell`) rồi gọi `updatePaymentTermSchedule()`
- publish vào topic `firebase-schedule-updatePaymentTermSchedule` mà emulator tạo sẵn
  (đang chạy `--only functions,hosting,pubsub` nên có pubsub)

**Kiểm kết quả** — đọc doc đơn trong `wholesaleOrders`:

| Sau khi | Trường phải thành |
|---|---|
| email DUE | `isSendDueReminder: true` |
| email OVERDUE 1 | `overdueReminderCount: 1` + `lastOverdueReminderAt` |
| email OVERDUE 2 | `overdueReminderCount: 2` → đơn rơi khỏi mọi query, dừng hẳn |

**Kiểm idempotency**: kích cron **2-3 lần liên tiếp** → chỉ được gửi **một** email. Đây là thứ đáng
kiểm nhất, vì cron thật chạy **24 lần/ngày**.

### Ba thứ HIỆN KHÔNG test được, đừng mất công

- **Đơn cũ**: không backfill nên không bao giờ được nhắc (task 11, có chủ ý).
- **Giao diện mail**: theme chưa được áp (task 17, đang sửa).
- **Overdue lần 2 trong cùng ngày**: cần `lastOverdueReminderAt` cách đủ `resendDays` — phải sửa tay
  field đó lùi lại, không thì đợi thật.

### Ca biên đáng thử nếu có thời gian (đều CHƯA có test tự động)

`resendDays` để `0` hoặc rỗng → gửi lần 2 **gần như ngay lượt cron kế**. Để `abc` → **không bao giờ
gửi**, im lặng. Nguyên nhân: `Number(config.resendDays || 0)` (`wholeSale.service.js:266-268`),
không có validate min/numeric. Chi tiết ở task 14.

## Tasks

> **Quy ước tên nhánh (dantt, 07/08):** KHÔNG nhét mã ticket vào tên nhánh,
> **tối đa 3 từ sau dấu `/`**. Vd `feature/payment-reminder-api`. Gom cụm nếu tràn
> (`payment-reminder-sendtest`). Mã ticket đã có trong commit message + MR nên là thừa.

> **Gộp nhánh 07/08 (dantt: "để chung 1 nhánh đi ba"):** cả 6 commit (spec + P0–P4) giờ nằm
> trên **một nhánh `feature/payment-reminder`**, cherry-pick tuyến tính theo thứ tự phụ thuộc
> (P0 → P1 → P2 → P4 → P3 → spec), 0 conflict. Base = `origin/master` **mới fetch**, nên kéo
> theo fix upstream mà 6 nhánh cũ chưa có (`getPlans.js`: `GOLIVE_NEW_SMTP_FLOW` 2025 → 2026).
> Gate chạy lại trên nhánh gộp: `packages/functions && yarn test` exit 0 (**5 suites / 45 tests**) ·
> `@avada/functions run production` exit 0 · `@avada/assets run production` exit 0 (2 vite build).
> Tổng: 44 files, 3543 insertions / 21 deletions. **Chưa push.**
> 6 nhánh cũ (`-api`/`-fe`/`-cron`/`-tests`/`-sendtest`/`docs/…`) giữ tạm làm backup, xoá được.

_(trống — thêm task ở đây)_

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
