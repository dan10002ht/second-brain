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
    cd packages/functions && yarn test               # ĐÚNG: rootDir riêng
       ⚠️ Baseline THAY ĐỔI theo nhánh — đừng chép số cũ vào brief, hãy ĐO LẠI.
       Cách đo đúng (verifier làm 13/08): `git archive <HEAD trước thay đổi>` ra thư mục tạm
       rồi chạy tách biệt, KHÔNG đụng worktree đang review.
       master: 3 suites / 22 tests · feature/payment-reminder trước fix 13/08: 10 suites / 66 tests
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
1. [✅ 2026-08-19] https://avadaio.slack.com/archives/C0B8X1S8AFL/p1787124073284679 chỉ hiển thị card payment reminders cho store có plan plus nhé
   → "plan plus" = **Shopify Plus** (`shop.shopifyPlan === 'shopify_plus'`), không phải app plan —
   app không có gói nào tên "plus", và gói Wholesale chỉ bán cho store Plus (`PricingTable.js:96`),
   nên store non-Plus đang bị mời mua thứ họ không mua được.
   Sửa: `Emails.js` (ẩn card + tắt query `/payment-reminders`) và `routes.js` (chặn route
   `/automation_email/payment-reminders/:type`, không thì gõ URL tay vẫn vào được).
   Giữ nguyên gate `isShopWholesale` trong card + gate 403 BE.
   Gate: eslint 2 file sửa 0 lỗi · `@avada/assets run production` exit 0 (2 vite build).
   ⚠️ Chưa chạy app thật để nhìn bằng mắt — mới verify tĩnh + build.
   Nhánh `feature/payment-reminder-plus` · MR !523
