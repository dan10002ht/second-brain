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
       origin/master `e599f96cc` (ĐO LẠI 21/08/2026, node 22.23.0): **13 suites / 82 tests, exit 0**
       · `@avada/functions production` exit 0 (431 files babel) · `@avada/assets production` exit 0 (2 vite build)
       · lint đỏ sẵn: functions **129 errors / 9 warnings**, assets **187 errors / 42 warnings**
    ⚠️ origin/master thêm dependency `morphdom@2.7.8` (`packages/assets/package.json`) mà máy chưa cài.
       Không `yarn install` thì `@avada/assets production` chết ở `Rollup failed to resolve import "morphdom"`.
       Kéo master về là phải chạy `yarn install` trước khi build.
    ⚠️ `.env.production` không có → build assets in cảnh báo `VITE_FIREBASE_API_KEY` undefined. Cảnh báo
       này CÓ SẴN, exit vẫn 0, không phải lỗi của thay đổi nào.
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

### SB-15857 — Payment reminder email, layout mới (Highest · Sprint 59)

https://space.avada.net/browse/SB-15857 · Slack: https://avadaio.slack.com/archives/D08HS7DES78/p1787277195263099
Jira ghi *"PRD không đổi. Xem mockup ở local."* — PRD `spec-payment-reminder-due-overdue.md` giữ nguyên,
**thay đổi nằm ở mockup**, và mockup đó **CHƯA có trong working tree**: nó ở `origin/master`
(`e599f96cc`, đã `git fetch`). Nhánh hiện tại `feature/payment-reminder-plus` chưa kéo về.
→ **Mọi worktree của cụm task này phải base từ `origin/master`**, không phải HEAD hiện tại.

🔴 **Preview nào tin được** (dantt chốt 21/08/2026): lấy ở trang **`/email-templates`** — 2 mục
`Payment due reminder` / `Overdue reminder` ở cuối tab Customer, và 2 file tĩnh
`public/email-previews/paymentReminder{Due,Overdue}.html`. **KHÔNG tin** preview trong
`/automation_email/payment-reminders/due|overdue`: cột `oneThird` ở trang khổ chuẩn chỉ được
**~277px** mà email thiết kế cho **600px**, nên line item gãy 3 dòng, cột giá đè tên sản phẩm.
BA không dựng được preview đúng khổ trên trang đó — **đó là giới hạn của mockup, KHÔNG phải
yêu cầu layout**. Đừng port cái vỡ đó sang app, và cũng đừng đi sửa layout trang settings.

**Nguồn sự thật của layout mới** (đọc TRƯỚC khi code, không tự thiết kế lại):

```
git show origin/master:product-team/marketing/product/mockup-app/src/utils/buildReminderEmail.js
```

422 dòng, comment giải thích **từng quyết định + lý do Philip bác các phương án khác** — đó là spec.
Kèm theo: `.../src/utils/paymentReminders.js` (biến mẫu + theme mặc định mới),
`.../components/organisms/ReminderEmailPreview/ReminderEmailPreview.jsx`,
`.../mockups/automation-email/{payment-reminder-settings,customize-email-template}.jsx`,
và 2 bản render tĩnh `public/email-previews/paymentReminder{Due,Overdue}.html` (mở bằng trình duyệt để nhìn).

**Layout mới khác bản đang có ở đâu** — bản production hiện tại (`buildReminderEmailHtml.js`) chỉ có
logo + đoạn chữ + ô đính kèm giả. Bản mới học bố cục email của **Joy Subscriptions**, thứ tự trong card:

1. Logo canh giữa trên **dải nền màu** (`logoBackground`, mặc định `#090099` = màu icon App Store của app)
2. Nội dung merchant sửa được (giữ nguyên)
3. Nút **Pay now** — luôn hiện, không phụ thuộc Document Access
4. Link "View invoice online" — **chỉ** ở nhánh `viewOnline`; ô đính kèm giả **bị bỏ hẳn**
5. Ticket nền xám: `Payment terms` | `Time left` (bản due) / `Overdue` (bản overdue)
6. **Line item** (ảnh 60×80, tên × sl, variant, giá gạch + giá sau giảm, mã giảm từng dòng)
7. **Bảng tổng**: Subtotal · Order discount (+ dòng con mã giảm) · Shipping · Tax · Total · Amount paid → **Amount due** (đậm 16px)
8. **Customer information** 2 cột: Shipping address | Billing address
9. Footer nằm **ngoài** card trắng

Ba luật đã chốt, **đừng phá**: nhãn dòng chốt là **"Amount due"** cho cả 2 bản · **không** gắn ngày vào nhãn ·
**không** đổi nhãn khi quá hạn. Đã thử sai 3 lần trước đó, lý do ghi trong mockup.

**Vẫn phải giữ**: mọi thẻ mang inline style riêng + `bgcolor` kèm `style` cho mọi nền — Gmail/Outlook cắt
`<head><style>`. Mockup chạy trong iframe nên không lộ, mail thật thì mất nền là mất tiền.

---

1. [✅ 2026-08-21] **[P0]** BE — dữ liệu đơn cho layout mới: merge tag + hàm dựng `order` object
   - Sửa `packages/functions/src/helpers/email/renderReminderMergeTags.js`: thêm
     `{{order.days_until_due}}` (mới, cho bản due — số ngày CÒN LẠI, `max(0, -getDiffDays(dueAt))`)
     và `{{pay_link}}`. Giữ nguyên 8 tag cũ.
   - Thêm helper mới `packages/functions/src/helpers/email/buildReminderOrderData.js`: từ order thật
     (`OrderService.getOrderForPdf`) dựng đúng shape `SAMPLE_REMINDER_ORDER` của mockup —
     `paymentTerms`, `daysLeft`, `daysOverdue`, `lineItems[]`, `summaryRows[]`, `amountDue`,
     `shippingAddress[]`, `billingAddress[]`. Bảng field → nguồn Shopify đã ghi sẵn trong doc comment
     `summaryRows` của mockup, **theo đúng bảng đó**, đừng tự map lại:
     Subtotal = `order.subtotal_price` (ĐÃ trừ discount từng dòng, **không** thêm dòng "Line item discounts") ·
     Order discount = `discount_applications` có `target_type !== 'line_item'` ·
     Shipping = `total_shipping` · Tax = `order.total_tax` **một dòng gộp**, không tách `tax_lines[]` ·
     Total = `total_price` · Amount paid = `total_paid` · Amount due = `total_outstanding`.
   - Line item: giá gạch ngang chỉ hiện khi dòng đó có `discount_allocations`; mã giảm lấy `code`
     (hoặc `title` với discount thủ công) nối qua `discount_application_index`. Một dòng có thể dính
     **nhiều** allocation → là MẢNG. Không có ảnh → dùng placeholder CDN, **cấm** `data:` URI (client chặn).
   - Wire vào cả **2 đường gửi** trong `wholeSale.service.js`: cron `sendReminderMail` **và**
     `sendTestReminderMail` (đơn mẫu `storage/order.json`). Lệch một đường là bug đã vấp ở task 17.
   - ⚠️ **Giả định về `{{pay_link}}`** (mockup ghi "cần dev bổ sung", không nói lấy từ đâu):
     dùng `order.order_status_url`, rỗng thì fallback về `invoiceLink`. Ghi rõ trong doc comment là
     giả định, và nêu ở MR để Philip xác nhận — xem task 6.
   - Đây là task **định nghĩa contract** cho task 2. Không đụng `buildReminderEmailHtml.js`.

   **Xong** · nhánh `feature/reminder-order-data` · commit `4fa8fc8ff` · đã push.
   `executor: codex lane T1 (gpt-5.6-sol, effort xhigh)` — xhigh vì nó dựng bảng tổng tiền khách nhìn
   trong mail đòi nợ. Một vòng code, **hai vòng verify**.
   File: `renderReminderMergeTags.js` · `buildReminderOrderData.js` (mới) · `wholeSale.service.js` ·
   4 file test (2 mới, 2 sửa).
   Gate: exit 0. Nhánh này giờ đã **gộp cả T2 + T3** → **16 suites / 101 tests**, 2 build exit 0.

   ⚠️ **Verifier vòng 1 trả FAIL — và FAIL đó SAI, ghi lại để lần sau khỏi vấp.**
   Nó báo `wholeSale.service.js` ngừng truyền `attachmentName`/`downloadLink` nên builder render ra
   `<span class="name"></span>` rỗng, mất link download. Tái hiện được thật, script đàng hoàng.
   Nhưng đó là **artefact của cách chia nhánh, không phải lỗi nội dung**: T2 (nhánh khác) đã **gỡ hẳn**
   cả khối ô đính kèm — `git show feature/reminder-email-layout:…buildReminderEmailHtml.js | grep
   "attachmentName\|downloadLink"` → **0 match**. Cái span rỗng chỉ tồn tại trên nhánh T1 đứng một mình
   với builder CŨ. Giao lại cho lane là bắt nó viết code sai với builder mới.
   → Xử: **không** giao lại lane. Gộp T2 + T3 vào chính worktree đó rồi verify trên **trạng thái sẽ ship**.
   Bài học: khi chia một ticket thành nhiều lane mà chúng đổi **chung một contract**, verify từng nhánh
   riêng sẽ đẻ ra FAIL giả. Phải verify trên bản hợp nhất.

   Verifier **vòng 2 PASS**, tự dựng integration test gọi thật `sendPaymentReminders()` (cron) và
   `sendTestReminderMail()` với builder + helper **không mock**, bắt HTML thật đưa cho `sendMail`:
   `HAS_ATTACHMENT_CLASS:false` · `HAS_EMPTY_NAME_SPAN:false` · `HAS_PAY_NOW:true` ·
   `PAY_HREF:https://shop.example.com/pay/1001`.
   Rủi ro merge tag rò rỉ (xem task 2): `html.match(/\{\{[^}]*\}\}/g)` trên **cả hai** đường gửi →
   **null / 0 match**. Cả hai call site đều truyền `order` tường minh, không dựa vào default param.
   Vòng 1 nó cũng đã bác **nghi vấn của tôi** rằng test cũ bị xoá: dựng bản `origin/master` sạch rồi đếm
   từng suite — `sendPaymentReminders` 20/20 và `sendTestReminderMail` 2/2 **không đổi**; +4 test là do
   đúng 2 suite mới. 4 mutation test đều đỏ đúng chỗ; 8 merge tag cũ output **giống byte-for-byte** master.

   **Tôi tự chạy hàm với input thật** (mục 6.1 #4): đơn 2 line item, dòng đầu dính **2 `discount_allocations`**,
   1 discount cấp order trên shipping line, `tax_lines` **2 dòng**, đã trả một phần →
   Subtotal 1.493,35 · Order discount −74,67 (dòng con `WHOLESALE5`) · Shipping 15,00 · **Tax 172,04 gộp
   MỘT dòng** (VAT 143,37 + City tax 28,67) · Total 1.605,72 · Amount paid −434,00 · **Amount due 1.171,72**.
   Cộng trừ khớp cả hai vế. Line item 1: 1.020,00 gạch ngang → 836,40, ra **2** phần tử discount không
   nuốt mất cái thứ hai. `daysLeft` "5 days left", `daysOverdue` "**0** days overdue" — không âm.

2. [✅ 2026-08-21] **[P0]** BE — dựng lại `buildReminderEmailHtml.js` theo layout mới + test
   - Port `mockup-app/src/utils/buildReminderEmail.js` sang
     `packages/functions/src/helpers/email/buildReminderEmailHtml.js`. **Giữ nguyên tên file + default
     export + chữ ký hiện có**, chỉ thêm tham số: `kind` (`'due'|'overdue'`), `payLink`, `order`.
     `attachmentName`/`downloadLink` thành **no-op** (ô đính kèm giả đã bị bỏ) — xoá tham số luôn nếu
     không còn nơi nào truyền, nhưng phải sửa hết chỗ gọi, đừng để tham số chết.
   - Text tiếng Anh cứng trong builder ("Pay now", "Amount due", "Customer information",
     "Payment terms", "Time left", "Overdue", "Shipping address", "Billing address") — mail gửi cho
     khách của merchant nên **giữ tiếng Anh**, nhưng đi qua i18n của functions nếu file đó có sẵn cơ chế;
     nếu không có thì để chuỗi thẳng và ghi chú, **đừng dựng cơ chế i18n mới cho riêng file này**.
   - `TAG_ICON` inline `<svg>`: **port nguyên, và dừng ở đó** — dantt chốt 21/08/2026 *"icon thì có thể
     giữ như cũ"*. Không upload PNG lên CDN, không đổi sang emoji, không tự nghĩ cách khác.
     Đánh đổi đã biết và đã chấp nhận: Gmail cắt sạch `<svg>` nên mail gửi qua Gmail **mất icon tag**
     ở dòng mã giảm — **chữ mã giảm vẫn còn, layout không vỡ**. Đừng "sửa giúp" chỗ này.
   - Cập nhật `packages/functions/__tests__/wholeSale/buildReminderEmailHtml.test.js`: test cũ assert
     ô đính kèm/nút CTA cũ sẽ đỏ — **sửa cho khớp layout mới**, đừng xoá case. Thêm case:
     `kind='due'` ra "Time left" · `kind='overdue'` ra "Overdue" · `access='sendAttachment'` **không**
     render link view-online nhưng **vẫn** có nút Pay now · `logoBackground` 3 trạng thái
     (undefined → `#090099` · chuỗi rỗng → nền card, banner biến mất · có màu → màu đó).
   - Chỉ chạm 2 file này. `defaultData.js` là của task 3.

   **Xong** · nhánh `feature/reminder-email-layout` · commit `db53a8283` · đã push.
   `executor: codex lane T2 (gpt-5.6-sol, effort high)` — một vòng, không phải sửa lại.
   File: `helpers/email/buildReminderEmailHtml.js` · `__tests__/wholeSale/buildReminderEmailHtml.test.js`.
   Gate: `.lanes/gate.sh` exit 0 — test **82 → 90** (suite này 12 → 20 case), 2 build đều exit 0.
   eslint 2 file = 0 lỗi.
   Verifier **PASS**, tự render 4 tổ hợp `kind × access` ra HTML rồi grep từng tiêu chí, không đọc assert:
   `due`→`Time left` / `overdue`→`Overdue` · `sendAttachment` không có link view-online nhưng **vẫn có**
   Pay now · không còn chuỗi `attachment`/`&#128206;` nào · `Amount due` ở **cả hai** bản · không có
   `Line item discount` · `max-width:600px` có, `width:600px` cứng không · script quét **mọi** `<td>/<table>`
   có `background-color`: **0 phần tử thiếu `bgcolor` đi kèm`.
   Mutation test (phá rồi khôi phục): đổi nhãn `Amount due`→`Balance due` → **đỏ**; gộp 3 trạng thái
   `logoBackground` bằng `||` → **đỏ đúng case chuỗi rỗng**. Test khoá thật.
   Đối chiếu mockup: cấu trúc, thứ tự 8 khối, `SAMPLE_REMINDER_ORDER`, `TAG_ICON`, công thức `logoBg`
   **giống hệt** — đúng là port chứ không phải viết lại.
   **Tôi tự mở ra nhìn** (mục 6.1 #4): render 3 bản, chụp màn. Layout khớp mockup, Pay now đúng chỗ,
   số cộng trừ khớp (1.493,35 − 74,67 + 15 + 172,04 = 1.605,72 − 434 = 1.171,72).
   🔴 **Rủi ro tôi thấy khi nhìn, chưa ai báo:** không truyền `order` thì builder rơi về
   `SAMPLE_REMINDER_ORDER`, mà hằng mẫu đó **giữ nguyên merge tag** ⇒ mail gửi cho khách sẽ in
   `{{order.total_outstanding}}` lồ lộ, **không lỗi, không cảnh báo**. Phải kiểm đúng điểm này lúc gộp nhánh.
   Nit (không đủ để FAIL, chưa sửa): doc comment `buildReminderEmailHtml.js:31-33` nói builder dùng chung
   với `scripts/email-previews/render-emails.mjs` — file đó **chỉ có trong mockup-app**, không có trong
   `packages/`. Comment lệch thực tế.
   ⚠️ Hai caller **chưa** truyền `kind`/`payLink`/`order`: `wholeSale.service.js` (task 1 lo) và
   `ReminderEmailPreview.js` (task 4 lo). Đúng thiết kế, nhưng là điều kiện bắt buộc trước khi gộp.

3. [✅ 2026-08-21] **[P1]** BE — theme field mới + đổi content/logo mặc định
   - `packages/functions/src/constants/defaultData.js` — trong `defaultPaymentReminder.theme`:
     thêm `logoBackground: '#090099'` (= màu nền icon listing App Store của app, Philip sample từ
     ảnh icon thật); `summaryBackground` **đã có sẵn `#f5f5f5`**, không phải thêm; `logoSize` 60 → **150**.
   - 🔴 **`logoImage` là bẫy, đọc kỹ trước khi sửa.** Hiện là hằng `DEFAULT_LOGO` (`defaultData.js:11`)
     = `Signature_PhienBanMauChinhTrenNenSang.png` — bản **mực xanh đậm cho nền SÁNG**. Đặt lên dải
     `#090099` là chìm nghỉm (mockup đã dính đúng lỗi này 1 lần). Nhưng **đừng hardcode URL** vào
     theme: comment tại `defaultData.js:82-84` ghi rõ lý do dùng hằng — để đổi branding một chỗ ăn
     mọi nơi. → Thêm hằng thứ hai `DEFAULT_LOGO_ON_DARK` cạnh `DEFAULT_LOGO` (bản
     `Signature_PhienBanMauChinhTrenNenToi.png`, chữ trắng) rồi `logoImage: DEFAULT_LOGO_ON_DARK`.
     Giữ nguyên `DEFAULT_LOGO` cho `previewSetting.js` và mọi chỗ khác đang dùng.
   - **Content mặc định — đúng MỘT chỗ đổi**: `OVERDUE_REMINDER_CONTENT`, dòng
     `<h3>Outstanding balance: {{order.total_outstanding}}</h3>` → `<h3>Amount due: {{order.total_outstanding}}</h3>`.
     Lý do: "Amount due" là **một nhãn cho cả hai bản**, khớp dòng chốt bảng tổng — đã soi đối thủ
     (Sufio, Softify Easy Invoice+) rồi chốt, chi tiết trong mockup `buildReminderEmail.js`.
     ⚠️ `DUE_REMINDER_CONTENT` và **cả 2 subject KHÔNG đổi** — đã đối chiếu từng ký tự với mockup.
   - `packages/functions/src/schemas/paymentReminderSchema.js:27` — thêm validate `logoBackground`,
     cùng kiểu `string().max(20).notRequired()` như các màu khác. **Cho phép chuỗi rỗng** — chuỗi rỗng
     là "merchant tắt banner", không phải giá trị thiếu.
   - `packages/assets/src/pages/CustomizeEmailTemplate/LogoSection.js` — thêm ô màu **"Logo background"**
     vào **card Logo** (không dồn xuống `ColorSection`: nó chỉ ăn vào khối logo ngay trên, tách ra là
     phải nhớ hai chỗ mới sửa xong một thứ). Dùng đúng component chọn màu `ColorSection.js` đang dùng.
   - ⚠️ i18n: sửa **file nguồn** `CustomizeEmailTemplate.json` nằm cạnh component, **KHÔNG** sửa
     `locale/translations/*.json` (file sinh ra, `yarn trans` sẽ hoàn tác). Bẫy đã vấp 3 lần.
   - Không chạm `buildReminderEmailHtml.js` (task 2 đang giữ) — default nội bộ của builder là việc của task 2.

   **Xong** · nhánh `feature/reminder-theme-fields` · commit `20ca0fc1a` · đã push.
   `executor: codex lane T3 (gpt-5.6-sol, effort high)` — 2 vòng: vòng 1 dừng đúng ở `Blocked On`
   vì brief tôi viết thiếu quyền sửa `CustomizeEmailTemplate.js` (lỗi của brief, không phải lane).
   File: `defaultData.js` · `paymentReminderSchema.js` · `LogoSection.js` · `CustomizeEmailTemplate.js`
   · `CustomizeEmailTemplate.json` · `__tests__/wholeSale/paymentReminderThemeDefaults.test.js` (mới).
   Gate: `.lanes/gate.sh` exit 0 — test **13 suites/82 → 14 suites/89**, `@avada/functions production`
   exit 0, `@avada/assets production` exit 0 (2 vite build). eslint 5 file JS = 0 lỗi.
   Verifier **PASS**, tự làm lại thí nghiệm chứ không đọc assert: sửa ngược `logoBackground` về
   `#0065E6` và `logoImage` về `DEFAULT_LOGO` → **2 test đỏ đúng chỗ** (test khoá thật, không viết cho có)
   · `git diff origin/master` đọc bằng mắt: chỉ 3 thay đổi được phép, `DUE_REMINDER_CONTENT` + 2 subject
   **không xuất hiện trong diff** · `previewSetting.js` diff **rỗng** (DEFAULT_LOGO không bị đụng)
   · `curl` URL logo mới → **HTTP 200** · `git diff --stat -- locale/` **rỗng** (không sửa file i18n sinh ra)
   · probe schema: `''` resolve, `'#090099'` resolve, 21 ký tự bị reject đúng `max(20)`.
   **Tôi tự mở ra nhìn** (mục 6.1 #4): render email thật từ builder mới + theme mới này, chụp màn —
   dải `#090099` với logo Signature chữ trắng **đọc rõ**, đúng cái bẫy "TrenNenSang chìm nghỉm" đã tránh.
   ⚠️ Thay đổi chỉ ăn vào **shop MỚI** (chưa có doc `paymentReminders`). Shop cũ giữ theme đã lưu —
   có chủ ý, không backfill.

4. [✅ 2026-08-21] **[P1]** FE — prop `kind` + biến mẫu cho preview
   🔴 **Scope đã cắt 21/08 (dantt chốt).** Task này KHÔNG đụng layout trang settings: không đổi
   `Page`/`Layout.Section`, không `fullWidth`, không `transform: scale`. Preview ở trang settings
   là thứ **BA đã bảo đừng tin** (cột ~277px cho email 600px) — sửa nó không nằm trong SB-15857.
   Việc ở đây chỉ là **không để preview lệch mail thật** về mặt dữ liệu.
   - `packages/assets/src/components/ReminderEmailPreview/ReminderEmailPreview.js`: thêm prop
     `kind` (`'due'|'overdue'`) truyền thẳng xuống builder. **Giữ nguyên** kiến trúc "preview gọi CÙNG
     hàm với đường gửi thật" (`@functions/helpers/email/buildReminderEmailHtml`) — đó là thứ chống lệch.
     Bỏ `attachmentName`/`downloadLink` cho khớp task 2.
   - `PaymentReminderSettings.js`: truyền `kind={type}`. Ngoài một prop đó, **không sửa gì khác** ở file này.
   - `packages/assets/src/constants/paymentReminders.js` — thêm `{{order.days_until_due}}` + `{{pay_link}}`
     vào `EMAIL_VARIABLES` (merchant chèn được vào nội dung); `PREVIEW_VALUES`: thêm
     `days_until_due: '5'`, `pay_link: '#'`, và sửa `total_outstanding` → `'$1,171.72'` cho khớp bảng
     tổng mẫu (1.605,72 − 434,00). Số trong mail nhắc nợ mà không cộng trừ khớp là loại lỗi khách
     nhặt ra ngay. ⚠️ i18n cho nhãn 2 biến mới: sửa **file nguồn** `paymentReminders.json` cạnh nó.

   **Xong** · nhánh `feature/reminder-preview-kind` · commit `a8e431362` · đã push.
   `executor: codex lane T4 (gpt-5.6-sol, effort high)` — 2 vòng: vòng 1 dừng ở `Blocked On` vì brief
   tôi viết thiếu quyền sửa `ReminderEmailPreview.json` (**lỗi brief, lặp lại đúng lỗi đã mắc ở T3**).
   File: `ReminderEmailPreview.js` · `ReminderEmailPreview.json` · `PaymentReminderSettings.js` ·
   `constants/paymentReminders.js`. Gate exit 0, test 90/90 không đổi (FE wiring), eslint 3 file = 0 lỗi.
   Verifier **PASS**, tự viết test tạm gọi thẳng builder với đúng bộ tham số component truyền:
   `DUE_HAS_TIME_LEFT=true / DUE_HAS_OVERDUE_LABEL=false` · `OVERDUE_HAS_OVERDUE_LABEL=true /
   OVERDUE_HAS_TIME_LEFT=false`. Không nhận "static check" của lane.
   Cũng đã kiểm: `attachmentPrefix` **thật sự mồ côi** trước khi xoá, 3 key còn lại đều có consumer,
   JSON parse OK · `PaymentReminderSettings.js` numstat **`1 0`** (không lén đụng layout) ·
   `EMAIL_VARIABLES` đúng 10, không trùng · import builder vẫn từ `@functions/...`, **không** copy HTML
   sang FE · `git diff --stat -- locale/` rỗng.

   ⚠️ **Lại một cảnh báo do chia nhánh, KHÔNG phải bug** — ghi để lần sau đọc report đừng hoảng.
   Verifier nêu: đường gửi thật `wholeSale.service.js` "không truyền `kind`/`payLink`" ⇒ mail thật luôn
   `kind='due'`, không bao giờ hiện "Overdue". Nghe rất nặng. Nhưng nhánh T4 base trên **T2, không có T1**,
   mà T1 mới là commit nối 3 tham số đó. Tôi kiểm trên nhánh hợp nhất `4fa8fc8ff`:
   `:271` cron gọi `#sendReminderMail({…, kind: 'due'})` · `:322` `kind: 'overdue'` ·
   `:418` builder nhận `kind` (**shorthand** — nên `grep "kind:"` bị trượt, phải đọc cả block) ·
   `:391` `payLink = order.order_status_url || invoiceLink`, không còn literal `{{pay_link}}`.
   Đây là lần **thứ hai** cùng một kiểu cảnh báo giả (lần đầu ở task 1). Xem lại ghi chú ở task 1.

5. [✅ 2026-08-21] Icon tag trước mã giảm — **chốt GIỮ NGUYÊN SVG inline, không làm gì thêm**
   dantt chốt 21/08/2026: *"icon thì có thể giữ như cũ"*. Đóng task, không có commit — đây là
   quyết định, không phải code.
   Mockup (`buildReminderEmail.js`, hàm `TAG_ICON`) đề xuất trước khi ship phải up 1 file PNG tag
   lên CDN rồi đổi sang `<img>`, vì Gmail cắt sạch `<svg>` inline. **Không làm.**
   Hệ quả đã chấp nhận: mail mở bằng Gmail sẽ **không thấy icon 🏷** ở dòng mã giảm; phần chữ
   (`LOYAL (-$183.60)`) vẫn hiện đủ, layout không vỡ. Hai đường thay thế đã bị loại từ trước:
   emoji `🏷` render ra khối bệch trên Mac, `data:` URI thì chính Gmail chặn.
   ⇒ Task 2 port `TAG_ICON` nguyên trạng. Ai đọc mockup thấy dòng "CẦN DEV BỔ SUNG" về PNG thì
   **bỏ qua** — đã có quyết định đè lên.

6. [⏸️] Chốt với Philip 2 điểm mockup để mở
   → **chờ Philip trả lời**, không phải chờ agent:
   - `{{pay_link}}` lấy từ đâu cho đơn wholesale chưa trả? Task 1 đang **giả định** `order.order_status_url`.
   - PRD `Automation emails.md` v2.3 còn **OQ-2** (log overdue cần 2 bản ghi/đơn, trái luật "1 document/đơn"
     ở `emailNotification.service.js:210-214`) và **OQ-3** (tên field `attempt` của mockup vs
     `overdueReminderCount` của spec backend). Hai cái này thuộc History, **ngoài scope SB-15857**,
     nhưng chốt sớm thì task History sau đỡ phải sửa ngược.

7. [✅ 2026-08-21] **[P2]** FE — ô soạn nội dung hiện chữ giống email (WYSIWYG đang hỏng)
   Tách khỏi task 4 vì nó là chuyện **ô soạn**, không phải preview — nhưng cùng gốc: cùng một chuỗi
   HTML sống ở hai môi trường CSS khác nhau.
   - Hiện: ô soạn nằm trong trang Polaris, reset toàn cục ép `h1..h6` và `p` về cùng cỡ chữ, margin 0.
     Email nằm trong `<iframe>` **không** reset. Cùng dòng `<h3>Amount due: {{order.total_outstanding}}</h3>`:
     trong ô soạn ra chữ thường tăm tắp, gửi đi thành heading to đậm ⇒ merchant sửa mù.
     Đúng nghĩa WYSIWYG hỏng — và dòng đó chính là dòng quan trọng nhất của mail nhắc nợ.
   - Sửa: CSS scope vào đúng vùng nội dung của editor. Production dùng **CKEditor**
     (`ContentSection.js` + `CkeditorInput`), mockup dùng `contentEditable` trần nên
     `payment-reminder-settings.css` của mockup **không bê thẳng sang được** — phải tự tìm selector
     vùng nội dung của CKEditor trong repo.
   - **Chép đúng bộ số của builder, đừng canh mắt**: wrapper `font-size:14px; line-height:1.6`;
     `h3`/`p` để theo **mặc định trình duyệt** (h3 = 1.17em bold, margin 1em). Khớp vì cùng một bộ số,
     không phải vì nhìn thấy giống.
   - Phụ thuộc task 2 (bộ số nằm trong builder mới) → làm sau khi task 2 đã landed.

   **Xong** · nhánh `feature/reminder-editor-wysiwyg` · commit `979618270` · đã push.
   `executor: codex lane T7 (gpt-5.6-sol, effort high)` — một vòng.
   File: `ContentSection.js` (bọc `<div className="PdfReminder__editor">` + import CSS) ·
   `ContentSection.css` (mới). **Không** đụng `CkeditorInput.js`/`.css` — `git diff` cả hai **rỗng**.
   Gate exit 0, test **90/90 không đổi** (CSS thuần, không có test tự động — đúng, không bịa test cho có).

   Verifier **PASS** và soi đúng 2 chỗ tôi nghi nhất — đây là phần đáng giữ lại:
   1. **`revert` có thắng Polaris không?** Đọc thẳng `@shopify/polaris/build/esm/styles.css:137-147`:
      `h1..h6,p{margin:0;font-size:1em;font-weight:...}` — specificity **(0,0,1)**, **không** `!important`.
      Selector của lane `.PdfReminder__editor .ck-content h3` = **(0,2,1)** ⇒ thắng bất kể thứ tự source.
   2. **`revert` có sống qua build không?** Repo **không có** `postcss.config.*` và `vite.config.js`
      không gắn plugin PostCSS/autoprefixer ⇒ không có transform theo browserslist. Grep CSS build ra:
      `.PdfReminder__editor .ck-content h1,…,p{margin:revert;font-size:revert;font-weight:revert}` —
      còn nguyên chữ `revert`.
   Scope kín: 9 match `PdfReminder__editor`, **mọi** selector trong `ContentSection.css` đều bắt đầu
   bằng class đó; `UpdatePolicyContentModal.js:45` không có wrapper nên rule không thể với tới.

   **Tôi tự mở ra nhìn** (mục 6.1 #4): dựng một trang nạp CSS Polaris **thật** + CSS **build ra thật**,
   đặt cạnh nhau `.ck-content` trần và `.ck-content` bọc `.PdfReminder__editor`, chụp màn.
   Trước: `<h3>Amount due: $1,171.72</h3>` phẳng lì bằng cỡ `p`. Sau: to, đậm, có margin — khớp mail.
   ⚠️ Lần chụp đầu tôi nhặt **nhầm file CSS** (chọn theo "file lớn nhất" nên ra `index-ot7wnwZm.css`,
   trong khi rule nằm ở `index-CmiliOTa.css`) nên thấy hai khối giống hệt nhau và suýt kết luận sai.
   Lỗi ở phép đo của tôi, không phải ở code. Chọn file CSS bằng `grep -l <class>`, đừng bằng kích thước.

---

### 🔴 Task 8 và 9: base nhánh từ `feature/payment-reminder-layout`, KHÔNG phải `origin/master`

Cụm SB-15857 đã gộp xong và **đã mở MR !529**
(https://git.avada.net/avada/pdf-invoice/pdf-invoice-firebase/-/merge_requests/529),
nhánh `feature/payment-reminder-layout`, 21 files / +1076 −304, gate **16 suites / 101 tests** exit 0.

Task 8 và 9 đều sửa `buildReminderEmailHtml.js` — file **chỉ tồn tại ở dạng mới trên nhánh đó**.
Base từ `origin/master` là làm trên bản builder CŨ, sẽ conflict toàn bộ khi gộp.
Baseline gate cho worktree của 2 task này là **101 tests**, không phải 82.

⚠️ Hai task cùng chạm `buildReminderEmailHtml.js` (task 8 sửa signature, task 9 sửa doc comment
`:31-33` ngay đầu file) ⇒ **va chạm có bằng chứng, chạy TUẦN TỰ**, hoặc gộp một lane làm cả hai.
Gợi ý: một lane làm cả hai, vì task 9 chỉ là vài dòng comment trong cùng file task 8 đang sửa.

5 nhánh lane đã merge xong, xoá được: `feature/reminder-{order-data,email-layout,theme-fields,preview-kind,editor-wysiwyg}`.

8. [✅ 2026-08-21] **[P2]** Builder: default param `order = SAMPLE_REMINDER_ORDER` là bẫy im lặng
   Verifier T1 nêu (vòng 2, 21/08): *"rủi ro có thật về mặt thiết kế API (default param nguy hiểm)
   nhưng KHÔNG xảy ra ở runtime vì cả hai call site đều truyền `order` tường minh."*
   → Không chặn gì hôm nay, nên **không sửa lén trong task khác**.
   Vấn đề: `buildReminderEmailHtml({..., order = SAMPLE_REMINDER_ORDER})` — hằng mẫu đó **giữ nguyên
   merge tag**. Caller tương lai quên truyền `order` sẽ gửi cho khách mail in `{{order.total_outstanding}}`
   lồ lộ: **không throw, không cảnh báo, test không bắt**. Đã xác nhận bằng cách tự render.
   **Hướng đã chốt 21/08 (tôi kiểm rồi mới chốt, đừng làm theo cách kia):**
   Phương án "bỏ default rồi throw" **một mình là SAI** — nó làm **vỡ màn settings**. Bằng chứng:
   `ReminderEmailPreview.js:44` gọi `buildReminderEmailHtml({theme, content, access, kind, payLink})`,
   **không** truyền `order`; preview sống hoàn toàn nhờ default `SAMPLE_REMINDER_ORDER`
   (`buildReminderEmailHtml.js:187`, hằng khai ở `:65`).
   ⇒ Phải làm **cả hai vế cùng lúc**:
   1. Preview **import `SAMPLE_REMINDER_ORDER` tường minh** rồi truyền vào — nó là dữ liệu mẫu của
      preview, để nó ẩn trong default của builder mới là chỗ sinh ra bug.
   2. Builder **bỏ default**, thiếu `order` thì **throw** với message nói rõ caller nào thiếu.
   Test khoá bắt buộc: (a) gọi builder **không** có `order` → **throw**, không được lặng lẽ ra HTML;
   (b) render preview với sample tường minh → HTML **không** chứa `{{`.
   ⚠️ Cân nhắc tách `SAMPLE_REMINDER_ORDER` sang module riêng: hiện nó nằm trong file BE mà FE import
   qua alias `@functions`. Đang chạy được, nên **đừng tách nếu không cần** — chỉ tách khi bước 1 làm lộ ra
   vòng import xấu.
   ✅ Task 4 đã đóng 21/08 nên hết chặn — dispatch được ngay.

   **Xong (task 8 + 9 chung một lane)** · nhánh `feature/reminder-order-required` · commit `dd6bd21ed`
   · đã fast-forward vào `feature/payment-reminder-layout` ⇒ **MR !529 đã cập nhật**, mô tả MR cũng
   sửa lại (trước đó ghi "chưa sửa trong MR này" — giờ thành sai nên phải sửa, không để MR nói dối reviewer).
   `executor: codex lane T8 (gpt-5.6-sol, effort high)` — một vòng, `Blocked On: none`.
   File: `buildReminderEmailHtml.js` · `buildReminderEmailHtml.test.js` · `ReminderEmailPreview.js`.
   Gate exit 0 — **101 → 102 tests**, 2 build exit 0, eslint 3 file = 0 lỗi.

   **Hai nghi vấn tôi nêu, verifier kiểm xong, CẢ HAI đều không thành vấn đề** — ghi lại vì cả hai đều
   là loại nghi ngờ đáng có:
   1. *"Test chỉ +1 mà brief đòi ít nhất 2 case"* → đếm thật: base **18** case, giờ **19**. Bỏ 1 case
      lỗi thời (`'uses the sample order when order is omitted'` — assert **đúng cái default vừa bị bỏ**),
      thêm 2 case mới. 18 − 1 + 2 = 19. Xoá có lý do, không phải xoá cho xanh.
   2. *"`replaceVariables` chạy trên toàn bộ HTML, `$1` trong `$1,171.72` là backreference"* →
      `paymentReminders.js:61-66` dùng **`split/join`**, KHÔNG phải `String.replace` regex, nên bẫy đó
      không tồn tại. Render thật: mọi số nguyên vẹn.
   Verifier cũng mutation-test: khôi phục lại default `order = SAMPLE_REMINDER_ORDER` → case throw
   **đỏ** ngay (`Received function did not throw`). Và `grep "= SAMPLE_"` toàn `src/` → **0 match**,
   không còn default dữ liệu mẫu nguy hiểm nào sót.

   **Tôi tự chạy + nhìn** (mục 6.1 #4): gọi builder thiếu `order` → **throw** đúng message; render
   preview theo đúng đường FE rồi chụp màn — `$1,020.00`, `$836.40`, `$1,493.35`, `−$434.00`,
   `$1,171.72` **nguyên vẹn**, 0 merge tag sót, content thay đúng (`Hi Philip`, `#1028`).
   ⚠️ Phép kiểm đầu của tôi báo "🔴 nghi ngờ" backreference — **sai, lỗi ở regex của tôi**: tôi lọc bỏ
   `$1,171.72` rồi tìm `$1` còn lại, nhưng `$1,020.00` và `$1,493.35` cũng khớp. Nhìn ảnh mới ra.

9. [✅ 2026-08-21] **[P3]** Doc comment lệch: `buildReminderEmailHtml.js:31-33`
   Verifier T2 nêu (21/08), không đủ để FAIL: comment nói builder dùng chung với
   `scripts/email-previews/render-emails.mjs`, nhưng file đó **chỉ tồn tại trong
   `product-team/marketing/product/mockup-app/`**, không có trong `packages/`
   (`find packages -iname "render-emails*"` → rỗng). Sửa comment cho khớp thực tế.

10. [✅ 2026-08-21] **[P1]** DevZone: nút reset template Payment reminder cho store đã dùng feature
   dantt hỏi 21/08: *"store của tôi làm sao để reset về layout mới này?"* + *"tạo 1 nút devzone để
   tôi reset phần này"*. Shop test: `AYctc8Mrxl664GaFbRUj`.
   **Vì sao cần**: `paymentReminderRepository.getForShop:37-41` merge **NÔNG theo từng sub-object**
   (`theme: {...default, ...saved}`). Nên store đã lưu settings thì:
   · `logoBackground` chưa từng lưu ⇒ **tự ăn `#090099`**, không cần reset
   · `logoImage` + `logoSize` đã lưu ⇒ giá trị cũ thắng ⇒ **logo nền-sáng size 60 chìm nghỉm trên dải xanh**
   · `overdue.content` đã lưu ⇒ vẫn `Outstanding balance:` thay vì `Amount due:`
   · `due.content` + 2 subject: text mới giống hệt text cũ nên không lệch
   **Phạm vi dantt chốt**: reset **hết trừ cờ `enabled`** (`defaultData.js:58` và `:70`, nằm trong
   `due` và `overdue`) · nút chỉ áp cho **shop đang mở DevZone**, KHÔNG có ô nhập shopId.
   Base nhánh: `feature/payment-reminder-layout` (cần default mới).

11. [✅ 2026-08-21] **[P0]** Email tràn ngang ở khổ hẹp — mất SẠCH số tiền trên điện thoại
   dantt phát hiện 21/08 khi nhìn preview; tôi render bản cuối ở **375px** và xác nhận **nặng hơn
   preview**: email không co, giữ ~600px, **tràn ngang**. Cột phải bị cắt ⇒ `Subtotal`, `Shipping`,
   `Tax`, `Total`, `Amount paid` và **cả dòng chốt `Amount due`** đều **không thấy con số nào**.
   Logo banner + `Unsubscribe here` cũng bị cắt.
   ⇒ Khách mở mail đòi nợ trên điện thoại thấy mail **không có số tiền**. Đây là **mail thật**,
   không phải chỉ preview.
   **Đã đo, đừng đoán lại**: KHÔNG có `width:600px` cứng — cả 2 chỗ đều `width:100%; max-width:600px`
   (phần fluid đúng như comment). Thủ phạm là **5× `table-layout:fixed`** + **2× `min-width:60px`**
   (ô ảnh line item) + bảng con auto-layout có **min-content** vượt 375px.
   🔴 **Không được dùng `<style>`/media query** — Gmail/Outlook cắt `<style>` ở tầng `<body>`, đó là
   ràng buộc đã chốt của cả cụm. Joy làm được vì nó chấp nhận phụ thuộc `<style>`; mình thì không.
   Sửa được cái này thì **preview 277px cũng tự đẹp**, khỏi phải nới cột.

---

## 21/08 chiều — kết quả tràn ngang, và hai lần tôi tự đo sai

**Chốt cuối (task 11)**: giữ **bảng lồng đơn giản kiểu Joy**, tên và giá **cùng hàng ở mọi khổ**,
số tiền không bao giờ ngắt giữa chữ số, vẫn về được **277px**. Ba thay đổi, đã đo:

| | lấy lại | ghi chú |
|---|---|---|
| bỏ `white-space:nowrap` ở **2 dòng mã giảm** | **61px** (373 → 311) | `🏷SAVE10 (-$74.67)` không có điểm ngắt |
| cho **cột ảnh co được** như Joy | **34px** (311 → 277) | `<td>` bỏ `width="60"`, `img` dùng `width:100%;max-width:60px` |
| tên line item 14px → **13px** | 0.23px | thuần thẩm mỹ, cho khớp Joy |

Ảnh co còn ~30px **chỉ ở 277px**; từ 320px trở lên vẫn 62px. dantt duyệt 21/08.

### Vì sao Joy không tràn mà mình tràn

CSS Joy: `.Avada-Email__Product--Image{width:60px}` + `img{width:100%}`.
`width` trên `<td>` chỉ là **gợi ý** với table layout, còn `img{width:100%}` đóng góp **min-content = 0**
⇒ cột ảnh co được. Của mình cứng cả hai: `<td width="60" style="width:60px">` + `<img width="60" style="width:60px">`.
Tôi đã đọc CSS Joy và ghi nhận đúng "không có `nowrap`" nhưng **không để ý `img{width:100%}`** —
dantt nhìn ra từ hành vi trên màn hình.

### 🔴 Hai lỗi ĐO của tôi — đọc trước khi tin bất kỳ số nào tự đo

1. **Render builder ra HTML còn nguyên merge tag.** `{{order.total_outstanding}}` là token **27 ký tự
   không dấu cách** ⇒ tự nó dựng sàn, cho ra 383.75px sai lệch. Preview thật chạy `replaceVariables()`
   trước. **Dấu hiệu nhận biết**: probe chỉ tìm thấy **6/7** số tiền — số thứ 7 vẫn là cái tag.
2. **So ảnh HEAD với chính nó.** Khi render bản HEAD để đối chiếu, tôi ghi đè luôn lên file bản mới
   ⇒ `cmp` báo "trùng khít" một cách vô nghĩa. Phải render ra **hai đường dẫn khác nhau** và
   kiểm `wc -c` khác nhau trước khi `cmp`.

Cộng với lỗi cũ (**Chrome headless có sàn viewport 500px**, `--window-size` < 500 vô dụng) ⇒
**luôn assert `innerWidth`** và luôn kiểm harness trước khi kết luận lane sai.

### Giả thuyết đã bị BÁC — đừng dựng lại

"Bốn `min-width` (132×2 + 156×2) chiếm hết ngân sách 277px." Sai. Lane bỏ **hẳn** khối Customer
information ra mà sàn vẫn 373px. Đó là khớp số học (312+48+16=376≈373) chứ không phải nhân quả.
Test khoá giả thuyết này đã bị xoá.

### Comment — dantt phản hồi 21/08

Comment của **mockup** (file spec, comment dày là đúng) bị port nguyên sang production:
builder **150/446 dòng = 33%**, `renderReminderMergeTags.js` **36%**. Chỉ giữ ràng buộc ngoài
(Gmail cắt `<style>`/`<svg>`/`data:`, 3 trạng thái `logoBackground`, tax gộp 1 dòng, `discounts` là mảng,
`{{pay_link}}` còn là giả định). Bỏ lịch sử thiết kế, bằng chứng đối thủ, bảng field trùng lặp.
Lý do dài để ở **commit message** và file này. → còn nợ 1 lượt dọn.
