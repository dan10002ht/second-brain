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

25. [✅ 2026-08-12] Tôi muốn bạn check ON_PREMISE_GITLAB_TOKEN ở .env.local và tạo giúp tôi 2 staging mới là staging 3 và staging 4 được ko?

    - nhánh `feature/staging-3-4` · commit `78c4bbcf8` (đã push, **chưa tạo MR**)
    - **Token OK**: `GET /user` 200 · user `dantt` (id 35) · scope `api, read_api, read_user,
      read_repository, write_repository` · hết hạn **2027-08-10**. Đủ quyền ghi CI variables.
    - **Firebase project đã có sẵn từ trước**, không phải tạo mới:
      `avada-pdf-invoice-staging-3` (438809529375) · `avada-pdf-invoice-staging-4` (87812729728).
      Hosting default site đã có. Nhưng **chưa có Web app nào** → đã `firebase apps:create WEB`
      cho cả hai (dantt duyệt) để lấy `VITE_FIREBASE_*`.
    - **Sửa code (2 file, +72 dòng):**
      - `.firebaserc`: thêm alias `staging3` / `staging4`
      - `.gitlab-ci.yml`: thêm job `deploy_staging_3` / `deploy_staging_4`, copy pattern của
        `deploy_staging_2` (environment + url + build assets + ghi `.env.<projectId>` + `firebase use` + deploy)
    - **16 biến CI đã tạo trên `git.avada.net`** qua API (`STAGING3_*` / `STAGING4_*`).
      6 biến `FIREBASE_*` mỗi bên lấy thẳng từ `firebase apps:sdkconfig`, giá trị thật.
    - Verify: `POST /ci/lint` của chính project → **`valid: true`, 0 error, 0 warning** ·
      YAML parse OK, 9 job nhận diện đúng · `.firebaserc` JSON hợp lệ ·
      `GET /variables` xác nhận đủ 16 biến.

    ### FUNCTIONS_ENV đã dựng xong 12/08 (copy từ `STAGING2_FUNCTIONS_ENV`, 35 key)

    `PUT` lên GitLab, đọc lại xác nhận khớp byte-for-byte, đủ 35 key cả hai bên.

    **8 key đổi theo môi trường:**
    | Key | staging 3 / 4 |
    |---|---|
    | `APP_BASE_URL` | `avada-pdf-invoice-staging-{3,4}.firebaseapp.com` (viết trần, **không** có `https://` — theo đúng staging 1/2) |
    | `SHOPIFY_FIREBASE_API_KEY` | web API key thật, lấy từ `firebase apps:sdkconfig` |
    | `SHOPIFY_ACCESS_TOKEN_KEY` | **sinh mới ngẫu nhiên 23 ký tự mỗi bên** — cố ý KHÔNG copy của staging 2. Đây là khoá mã hoá access token của shop (`config/shopify.js:29` → `shopifyBase.service.js:9`), dùng chung khoá giữa các môi trường là sai nguyên tắc. Chưa có shop nào cài nên sinh mới không mất gì. |
    | `SHOPIFY_HAS_READ_ALL_ORDERS` | `false` (staging 2 để `true`) — app mới chưa được Shopify duyệt `read_all_orders`; `config/shopify.js:20` tự bỏ scope đó ra khi `false` |
    | `STORAGE_EXPORT_BUCKET_NAME` | `avada-pdf-invoice-staging-{3,4}-export-orders` |
    | `APP_HANDLE`, `SHOPIFY_API_KEY`, `SHOPIFY_SECRET` | **để `TODO-...`** — chỉ có sau khi tạo app trên Shopify Partner |

    27 key còn lại (Google, SMTP, Chatty SMTP, avada.io, SendGrid, Sentry, Customer.io,
    Mixpanel, Translate) **copy nguyên** của staging 2 — dùng chung hạ tầng staging.

    - `APP_KEY` copy nguyên nhưng **là key chết**: chỉ có trong `.env.example:5`, không chỗ nào
      trong `packages/functions/src` đọc nó.
    - **Không** thêm `ENABLE_PAYMENT_REMINDER_SEND` — giữ parity với staging 2; code mặc định tắt
      khi thiếu biến.

    ⚠️ **CÒN LẠI — job sẽ FAIL nếu merge vào master mà chưa xong:**
    1. Tạo 2 app trên **Shopify Partner** → điền `STAGING3_SHOPIFY_API_KEY` /
       `STAGING4_SHOPIFY_API_KEY` (biến CI riêng cho VITE) và 3 key `TODO` trong `FUNCTIONS_ENV`.
       Scope + app URL + redirect + app proxy + GDPR webhook: xem `PROD_APP_TOML` trên GitLab làm chuẩn.
    2. ✅ **Đã provision hạ tầng GCP xong 12/08** — xem mục dưới.
    3. Nhánh feature chưa đụng master nên **chưa job nào chạy** — an toàn cho tới lúc merge.

    ### 🐛 500 `Cannot read properties of undefined (reading 'shopID')` trên staging 3 (12/08)

    Store `dantt-test-stag3`. **Không phải lỗi cấu hình env** — đã loại trừ bằng kiểm tra thật:
    Cloud Run service `app` có `SHOPIFY_API_KEY=a86b6a1e…` + `APP_HANDLE=avada-pdf-invoice-staging-3`
    (đúng app staging 3, không phải app dev), và HTML `/embed` trên hosting cũng nhúng đúng key đó.

    **Cơ chế** — `@avada/core` `build/helpers/verifyEmbedRequest/verifyToken.js`:
    ```js
    shopData = await getShopByShopifyDomain(shopifyDomain);
    if (shopData) { ctx.state.user = {shopID: shopData.id, ...}; }
    await executeAfterLogin(ctx, givenOptions);
    await next();          // ← vẫn next() kể cả khi shopData rỗng
    ```
    Không có doc shop ⇒ `ctx.state.user` undefined nhưng request **vẫn vào route** ⇒
    `helpers/auth.js:25` `ctx.state.user.shopID` nổ. Log Cloud Run chỉ có đúng các 500 của
    `/api/whoami`, không có exception nào khác.

    **Trạng thái Firestore staging-3**: đúng **1 collection `shopifySession`**, không có `shops`.
    Doc `offline_dantt-test-stag3.myshopify.com` **đã có `accessTokenHash` + `scope`**
    ⇒ token exchange THÀNH CÔNG, nhưng shop record không được tạo.

    🔴 **Vì sao kẹt vĩnh viễn**: session đã có access token nên mọi request sau
    `checkIfActiveAccessToken` trả true ⇒ nhánh `requestAndUpdateShopAccessToken` +
    `handleAfterInstall` **không bao giờ chạy lại**. Tự nó không thoát ra được.
    → Cách gỡ: **xoá doc `shopifySession/offline_<domain>`** (hoặc gỡ cài rồi cài lại app) để ép
    chạy lại nhánh install.

    ### ✅ ROOT CAUSE (12/08, xác minh bằng API chứ không đoán): **Firebase Authentication chưa bật**

    ```
    GET https://identitytoolkit.googleapis.com/admin/v2/projects/<p>/config
      avada-pdf-staging-2            → ✅ signIn.email.enabled = true
      avada-pdf-invoice-staging-3/4  → ❌ NOT_FOUND / CONFIGURATION_NOT_FOUND
    ```

    Tạo project Firebase bằng API **không** tự khởi tạo Authentication. `updateOrCreateUser`
    (`@avada/core/build/services/authService.js`) khi không thấy shop doc sẽ đi nhánh
    `admin.auth().createUser(...)` → ném `configuration-not-found` ⇒ **shop không bao giờ được tạo**.
    Log xác nhận `Start of updateOrCreateUser` chạy 3 lần mà `shops` vẫn 0 doc.

    🔴 **Deadlock làm nó không tự thoát ra được** — `authController.js:checkIfActiveShop` kết luận
    `installed: true` **chỉ dựa vào việc có `shopifySession` với access token dùng được**, KHÔNG hề
    nhìn collection `shops`. Nên vòng lặp là:
    1. Mở `/embed` → `app` → token exchange thành công → ghi session **có** accessToken
    2. `updateOrCreateUser` chết ở `createUser` → không có shop doc
    3. Vào lại `/auth/shopify` → `checkIfActiveShop` thấy session hợp lệ → `hasSession=true,
       installed=true, scopesChanged=false` → **bỏ qua OAuth**, redirect thẳng về `/embed`
    4. `/embed` → `verifyToken` → không có shop → `ctx.state.user` undefined → **500**
    ⇒ Cài lại app bao nhiêu lần cũng vô ích nếu session cũ còn đó.

    **Đã xử 12/08:** `POST identityPlatform:initializeAuth` + `PATCH config` bật email/password cho
    cả hai project (khớp staging-2), rồi xoá lại doc `shopifySession/offline_<domain>`.

    💡 **Bài học cho lần dựng staging mới**: sau khi tạo project phải bật **Firebase Authentication**
    — nó không nằm trong danh sách API của `gcloud services enable`, phải gọi Identity Toolkit
    admin API (hoặc bấm trong Console). Thiếu nó thì app cài xong vẫn 500 và **log không hề báo
    lỗi auth**, rất dễ đi lạc hướng sang env/Shopify key.

    ⚠️ `AppLifecycleService.afterInstall` (`appLifecycle.service.js:15-19`) cũng **giả định shop đã
    tồn tại** (`getShopByField(...)` rồi dùng ngay `shop.id`). Không phải nguyên nhân ở đây nhưng là
    quả mìn cùng loại.

    ⚠️ staging-4 chưa cài được: `/auth/**` trả **404** (hàm `auth`/`admin` chưa deploy xong).

    ### Test CI/CD deploy staging 3/4 (12/08) — CHƯA THÔNG, 2 blocker khác nhau

    Nhánh `feat/test-staging-3` / `feat/test-staging-4` (base `origin/master`, mỗi nhánh 1 commit
    đổi `only:` từ `master` sang chính nó) + commit `d44908abb` trên `feature/staging-3-4`.
    Nhân tiện khôi phục dòng `except: /Merge branch/` — bỏ nó chỉ đúng khi pin `master`.

    ⚠️ **dantt đã merge `feature/staging-3-4` vào master lúc 17:00** (`880fb1b0f`), nên pipeline
    master `206718` tự kích cả 2 job khi biến còn `TODO` — đúng rủi ro "mỗi push master chạy 2
    deploy". Commit `d44908abb` gỡ chuyện đó nhưng **chỉ có tác dụng sau khi merge tiếp vào master**.

    **Blocker 1 — CI không truy cập được project mới.** Pipeline `206737`/`206738` chạy qua được
    `yarn install` + 2 vite build, chết ở dòng cuối:
    `firebase use --token $FIREBASE_DEPLOY_KEY staging3` →
    *"Invalid project selection, please verify project staging3 exists and you have access."*
    Alias `staging3` CÓ trong `.firebaserc` trên nhánh → nghi identity của `FIREBASE_DEPLOY_KEY`
    chưa có quyền trên 2 project mới. IAM `user:` của staging-2 là `binhntt`, `damhv`; của
    staging-3/4 là `dantt`, `kenny` — **không giao nhau**. Chưa xác minh dứt điểm token thuộc ai.

    **Blocker 2 — first-time Gen2 trên project trắng.** dantt chạy deploy tay:
    `HTTP 500 Could not create Cloud Run service` (admin/app/pos/auth) + `HTTP 400 ... Permission
    denied while using the Eventarc Service Agent` cho mọi Firestore trigger. Firebase tự nói
    *"Since this is your first time using 2nd gen functions… Retry the deployment in a few minutes."*
    → Đúng: staging-3/4 **thiếu hẳn Eventarc service agent**, staging-2 thì compute SA có
    `roles/eventarc.eventReceiver`. Đã chạy
    `gcloud beta services identity create --service=eventarc.googleapis.com|pubsub.googleapis.com --quiet`
    cho cả hai ⇒ giờ đã có `gcp-sa-eventarc … roles/eventarc.serviceAgent` +
    compute SA `roles/eventarc.eventReceiver` + pubsub SA `roles/iam.serviceAccountTokenCreator`.
    Sau khi cấp agent, deploy tay **chạy tiến dần chứ không đứng**: staging-3 **18/25 function
    ACTIVE**, staging-4 **14/25**. Lỗi còn lại đổi thành `HTTP 409 Could not create bucket
    gcf-v2-sources-<num>-us-central1` — bucket **đã tồn tại** (do chính lần deploy trước tạo);
    đây là race của lần deploy Gen2 đầu tiên: nhiều function cùng tạo bucket nguồn, một cái thắng,
    số còn lại nhận 409. **Cách xử: chạy lại `firebase deploy --only functions` vài lần, mỗi lần
    lên thêm một mẻ cho tới khi đủ.** Không phải lỗi cấu hình.
    Còn thiếu — staging-3: `admin app auth pos onCreateUser onCreateCouponUsages onUpdateShop` ·
    staging-4: thêm `authSa customer google syncCompanies exportOrdersToMailSubscriber
    updatePaymentTermSchedule`.

    🔴 **Deploy tay từ máy local dùng `packages/functions/.env.local` của dantt (env DEV), KHÔNG
    phải `STAGING3_FUNCTIONS_ENV`.** Job CI cố ý `cp .env.avada-pdf-invoice-staging-3 .env.local`
    trước khi deploy chính vì vậy. ⇒ Function đang chạy trên staging 3/4 nhiều khả năng đang mang
    Shopify key/secret + SMTP của app dev. Phải deploy lại qua CI (hoặc tự thay `.env.local`) trước
    khi tin bất kỳ kết quả test nào trên 2 môi trường này.

    ❗ Còn lệch so với staging-2, chưa cấp được (bị chặn quyền, dantt tự chạy):
    `roles/pubsub.serviceAgent` cho pubsub SA của staging-3, và `roles/iam.serviceAccountTokenCreator`
    cho compute SA + appspot SA của cả hai.

    💡 Lỗi `sharp`/`vips/vips8` ở pipeline master `206718` là **tạm thời** — pipeline sau cùng image
    đã build qua. Đừng đi sửa Dockerfile vì nó.

    ### ✅ Deploy extensions lên app Shopify staging 3/4 (12/08)

    - `shopify.app.staging-3.toml` / `-4.toml` sinh từ `PROD_APP_TOML`, đổi `client_id` + URL.
      `.gitignore:86` (`shopify.app.*.toml`) che sẵn nên **không vào git** — bản gốc lưu ở CI var
      **`STAGING3_APP_TOML` / `STAGING4_APP_TOML`** (mới tạo, đúng như `PROD_APP_TOML`).
    - Bỏ `read_all_orders` khỏi scopes so với production (app staging chưa được duyệt), khớp
      `SHOPIFY_HAS_READ_ALL_ORDERS=false`.
    - Kết quả: **version tạo xong nhưng CHƯA release** ở cả hai app —
      `avada-pdf-invoice-staging-3-2` · `avada-pdf-invoice-staging-4-2`.
      Lý do Shopify trả về: *"Network access must be requested and approved in order for the
      `customer-account-ui` / `download-historical` extension to be published"*.
      → Phải xin **Network access** cho 2 ui_extension đó trong dashboard rồi release lại.

    🔴 **`SHOPIFY_APP_CLI_PARTNERS_TOKEN` KHÔNG dùng được cho staging 3/4** — token đó thuộc
    partner org của **production**; app dev (`dantt-pdf-dev`) và staging 3/4 đều nằm ở org
    **Avada Development**. Dùng nhầm token → 403 *"You are not a member of the requested
    organization"* (từng tưởng token hỏng, không phải). Deploy chạy được bằng **phiên
    `shopify auth login` local của dantt**. ⇒ Muốn thêm job CI deploy extension cho staging thì
    cần một token riêng của org Avada Development, chưa có.

    🔴 **CLI 3.91 đã BỎ `include_config_on_deploy`** — trường này bị xoá thẳng khỏi file toml khi
    deploy, và **config LUÔN được đẩy lên**. Nghĩa là scopes / application_url / redirect_urls /
    app_proxy / webhook trên app staging 3/4 giờ **lấy theo file toml**, ghi đè thứ cấu hình tay
    trước đó. Không phải ý định ban đầu (đặt `false` đúng như production) nhưng kết quả đúng
    hướng, vì toml vốn dựng từ `PROD_APP_TOML`. ⚠️ Job CI `deploy-shopify-extension:production`
    vẫn dựa vào `include_config_on_deploy = false` trong `PROD_APP_TOML` → **lần chạy tới sẽ đẩy
    cả config lên app production**. Cần rà lại trước khi ai đó push commit `[deploy-extensions]`.

    ### ✅ Provision GCP cho staging 3/4 (12/08, dantt duyệt "full, khớp staging 2")

    Hai project lúc nhận **gần như trống**: chưa có Firestore, chỉ bật mỗi `bigquerystorage`.
    Chỉ tạo bucket export thì `firebase deploy` vẫn đổ, vì `firebase.json:110` khai `storage.rules`
    (cần default bucket) và `firestore.indexes.json` cần Firestore.

    | Việc | Giá trị | Đối chiếu staging 2 |
    |---|---|---|
    | Bật API | `firestore`, `storage`, `firebasestorage`, `cloudfunctions`, `cloudbuild`, `artifactregistry`, `eventarc`, `pubsub`, `run` | staging 2 chỉ bật lẻ tẻ, nhưng đây là bộ tối thiểu cho Gen2 |
    | Firestore | `(default)`, **`nam5`**, `FIRESTORE_NATIVE` | ✅ khớp |
    | Default Storage bucket | `<project>.firebasestorage.app`, **US** | khớp (staging 2 là `<project>.appspot.com` — tên cũ, cùng vùng US) |
    | Bucket export | `avada-pdf-invoice-staging-{3,4}-export-orders`, **US** | ⚠️ **cố ý lệch**: staging 2 để `ASIA-EAST2` trong khi Firestore `nam5` + functions `us-central1` đều ở Mỹ — di sản từ staging 1. dantt chốt dùng US để khỏi tốn egress xuyên vùng. |
    | UBLA / public access | UBLA **off**, PAP `inherited` | ✅ khớp — **bắt buộc**, vì `export.service.js:96` gọi `file.makePublic()`, cần ACL theo object. Bucket tạo mới mặc định thường bật UBLA; đã kiểm lại thấy `False`. |

    💡 Default bucket **không tạo được bằng `gcloud storage buckets create`** (tên
    `.firebasestorage.app` là domain-named bucket). Đường đúng:
    `POST https://firebasestorage.googleapis.com/v1beta/projects/<p>/defaultBucket`
    với body `{"storageClass":"STANDARD","location":"us"}` — **không** có query param `bucketId`
    (truyền vào là 400 `Cannot bind query parameter`).

    ⚠️ **Một chỗ cố ý lệch pattern, cần dantt biết:** `deploy_staging`/`deploy_staging_2` có
    `except: $CI_COMMIT_TITLE =~ /Merge branch/`. Giữ nguyên dòng đó cho job pin `master` thì
    **gần như không bao giờ chạy**, vì commit trên master phần lớn LÀ merge commit.
    → Job 3/4 chỉ giữ `except` cho `[deploy-only]`, bỏ vế `Merge branch`.

    ⚠️ Cả 2 job cùng pin `master` ⇒ mỗi lần push master chạy **2 build + 2 deploy song song**.
    Đúng ý dantt (2 môi trường luôn mirror master), nhưng tốn gấp đôi quota runner on-premise.

    💡 Gotcha hạ tầng: `git.avada.net` đứng sau Cloudflare, **chặn user-agent của `urllib`**
    (`403 error code: 1010`). Gọi API bằng `curl`, đừng dùng `urllib.request` của Python.
