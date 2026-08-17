---
type: note
title: Digest subscriptions 2026-08-17
summary: Firebase Hosting cache response 404 của API có auth 600s; `functions:config` băm JSON và từ chối key hoa; `getExternalApps()` không filter nên bật app mới là bắn webhook cho mọi app; detector so `NaN` nên không bao giờ gắn cờ; và chuỗi bug giá kookut chốt bằng dữ liệu prod.
tags: [subscription, shopify, firebase, caching, http, debug, avada]
created: 2026-08-17
updated: 2026-08-17
source: project "subscriptions" (+ workflow kookut audit) session history
---

# Digest subscriptions — 2026-08-17

CHỈ phần mới so với các digest trước của [[subscriptions]]. Phần kookut đã ghi ở
[[digest-subscriptions-2026-08-14]] / [[digest-subscriptions-2026-08-15]] không lặp lại.

## Bugs

**Firebase Hosting cache response của function rewrite — API có auth bị trả bản cũ.**
Probe `GET /integrate/customer/subscriptions` qua `subscription.joy.so` và
`*.firebaseapp.com`: **mọi** case đều 404 giống hệt nhau, kể cả khi ký bằng secret sai
(phải là 401). Gọi thẳng `us-central1-...cloudfunctions.net` thì **200 đúng data** —
tức code chạy đúng, CDN mới là thủ phạm. Response 404 mang `cache-control: max-age=600`
(không đến từ `firebase.json` → default của Hosting cho function rewrite), 401 thì không
cache, 200 thì `private`. Hệ quả thật: khách chưa từng subscribe gọi trước → 404 nằm
trong ô cache 10 phút → khách thật gọi sau vẫn nhận 404. Vá bằng middleware
`noStore.js` set `Cache-Control: no-store` cho `integrateApi`. Khái quát ở
[[khong-cache-response-co-auth]]. ⚠️ *chưa xác minh*: vì sao 200 ra `private`
còn 404 ra `max-age=600` — chưa giải thích được cơ chế.

**`firebase functions:config:set` không lưu JSON — nó băm nhỏ ra.**
`functionsConfig.js:64-80` (`setVariablesRecursive()`) tách JSON thành từng biến, nên:
- boolean thật (`false`) bị API từ chối — `Invalid value at 'variable.text' (TYPE_STRING)`;
- key có **chữ hoa** bị từ chối luôn (`externalAppConfigs` camelCase không set được);
- double-stringify qua được CLI (lưu nguyên chuỗi) nhưng code app chỉ `JSON.parse` một
  lần nên vẫn hỏng;
- đọc lại thì lodash `_.set` với index số **tự tạo array** → cấu trúc array đúng, chỉ
  `forwardWebhook: false` biến thành chuỗi `"false"` (phải parse chuỗi ở phía app).

**Firebase Functions Gen 1 **có** đọc `.env`** — verify bằng chính code
`firebase-tools@13.29.1`, ngược với giả định "v1 không đọc được env". `.env` và
`functions:config` là hai đường **thay thế nhau**, không cộng dồn, và **env thắng**.
Set cả hai thì chạy được nhưng bẫy về sau: rotate secret ở `functions:config`, deploy,
thấy không đổi gì mà không hiểu vì sao.

**Bật app mới trong `external_app` là bắn webhook cho mọi app.**
`getExternalApps()` không nhận filter nên trả cả mảng; `webhookIntegrationHandler.js:91-107`
lặp qua toàn bộ. Field `enabled` là **field chết** — chỉ xuất hiện ở một dòng
`console.log`, không ai đọc. Chốt thêm cờ `forwardWebhook: false` cho app chỉ gọi vào
(Chatty), và `address` chỉ được đọc ở `webhookForwardService.js` nên điền vào cũng vô hại.

**Detector so bằng `NaN` nên không bao giờ gắn cờ.**
`Number(c.deliveryPrice?.amount ?? NaN)` → thiếu field thì `now = NaN`, mà `NaN > 0.01`
luôn false ⇒ 36 contract lọt sạch. Cùng họ với
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]]: lớp dò tìm im lặng vì phép so sánh
không bao giờ đúng, chứ không phải vì ngưỡng sai.

**Key theo currency + fallback sai đơn vị.** Map giá key theo currency → FR/DE cùng
`EUR` thành last-write-wins; fallback `variant.price` là **store currency (CHF)** trong
khi contract là EUR; `COUNTRY_TO_CURRENCY` là bảng tĩnh nên market mới không có mặt.
Detector cũng so `variant.price` (CHF) với `shopifyPrice` (EUR) → khác đơn vị.

**Lỗi bị nuốt rồi vẫn báo DONE.** `contractService.js:683-697` destructure
`{data, errors}` mà không throw; `updateSingleContractPrice:389` add vào
`processedContracts` **vô điều kiện**. Sửa bằng cách throw ở biên helper — nhưng phải
kiểm từng call site trước: vòng `for` ở `:419-433` **không** try/catch từng contract nên
throw sẽ giết cả batch, còn `bulkUpdateDiscount:142-207` thì có. Comment thiết kế ở
`:492-500` cấm thêm terminal status mới vì Pub/Sub redelivery guard chỉ dừng ở
`DONE`/`FAILED`.

**Giá volume không giảm ở màn subtotal.** `calculateCurrentPriceByTier` trả thẳng
`basePrice` khi `checkEnabledAmountDiscount(productPlan)` false → contract qty=6 hiện
`$1.158 = 193×6` không giảm. Hàm đó dùng ở **82 chỗ**, gồm `getSellingPlanVariables` —
nơi quyết định giá THẬT bị charge; nên đây là lỗi có sẵn trên master, không phải do nhánh
`feat/transform-discount` (chứng minh bằng `git diff` chứ không bằng lời).

**Recurring order không gửi mail "Order confirmed" là đúng, không phải bug app** —
đã ghi riêng ở [[digest-subscriptions-2026-08-16]]; phiên này chỉ bổ sung link Help Center.

## Techniques

- **Audit code phải đọc từ nhánh đang chạy prod.** Report kookut viết trên
  `feat/portal-preview` — đo ra **198 commit sau master**; 3/14 file trích dẫn lệch, và
  đúng 3 file load-bearing nhất (fix index-misalignment có trên master, không có trên
  nhánh đọc). Cách làm đúng: `git show origin/master:<path>` +
  `git rev-list --left-right --count origin/master...HEAD`. → [[feedback-audit-code-doc-tu-nhanh-prod]]
- **`source .env.local` rò env thật vào jest** làm suite không liên quan đỏ; chạy env
  sạch (như CI) mới ra baseline thật. Đối chiếu **hai chiều** (có env / không env) rồi
  mới kết luận "đỏ sẵn". Riêng 2 suite `@avada/core` đỏ là do thiếu
  `packages/functions/.runtimeconfig.json`, không phải `.env.local`.
- **`clearAllMocks()` xoá call history nhưng KHÔNG xoá implementation** — một
  `mockRejectedValue` rò sang test sau. Đặt lại default implementation trong `beforeEach`.
- **Push on-prem không cần TTY**: token ở `packages/functions/.env.local`, dùng
  `https://oauth2:$TOKEN@git.avada.net/...` và lọc token khỏi output.
  Push option `merge_request.assign_reviewer` **không áp dụng mà GitLab không warning gì**
  → phải verify lại bằng API, đừng tin "không có lỗi nghĩa là đã set".
- **Quét Firestore lượng lớn phải phân trang** (`orderBy(documentId) + startAfter`, page
  ~2000); `.limit(200000).get()` bị OOM-kill. Script chỉ đọc Firestore không cần token
  Shopify; thiếu `GOOGLE_CLOUD_PROJECT=avada-subscription-app` thì fail
  "Unable to detect a Project Id".
- **`rtk` nuốt exit code và nuốt cả suite chết lúc load** — chạy thẳng binary /
  `rtk proxy npx jest` rồi tự đọc exit code. Bổ sung cho [[subscription-digest-2026-07-13]].
- **Slack token thiếu `files:read`** thì `files.info` trả `missing_scope` và URL trực tiếp
  trả HTML login; đường vòng đã dùng: file gốc là Google Sheet public →
  `export?format=csv`.
- **Comment phải theo ngôn ngữ file đang có.** Brief giao coder viết comment tiếng Việt
  trong `CustomerPortalManager.js` (file vốn toàn comment tiếng Anh) → ra một câu lẫn hai
  thứ tiếng. Đọc file trước khi ra chỉ thị về ngôn ngữ.

## Context

- **Chatty help desk**: endpoint `GET /integrate/customer/subscriptions` +
  `/customer/subscription-summary` (route literal, không path param), đi qua
  `externalAppConfigs` với `forwardWebhook: false` — Chatty chỉ gọi vào, app không bắn
  webhook ra. MR **!2476** gom 5 commit; doc gửi team ở
  `docs/chatty-subscriptions-api-guide.md`. Base URL dùng được `https://subscription.joy.so`.
- **Key Google Translate bị dán vào chat** khi chạy `yarn trans`: redact được 4 file local
  nhưng sandbox chặn ghi đè `~/.claude/*.jsonl` và `~/.zsh_history`, và **xoá file không
  rút lại được việc key đã gửi lên API** — rotate là biện pháp duy nhất thật sự đóng lỗ.
  Key không lọt vào git (chỉ nằm trong `lib/` là build output đã gitignore).
- Nhánh `feat/portal-preview` **73 commit sau master** nên chưa có `yarn check` lẫn jest
  cho assets — gate thật ở nhánh đó chỉ còn vite build + jest functions. Gate khác nhau
  theo nhánh, đừng giả định.
- New Customer Portal: SDK `customer-account` bắt Modal phải mở bằng trigger khai báo
  sẵn, nên phần confirm chuyển sang `Banner` — lệch spec mockup có chủ đích.
- `BRIEF.md` chạy hết một ngày `/loop 10m /looptasks` rồi rơi vào **hơn 20 iteration
  "No pending tasks" liên tiếp** vì cả 4 task còn lại đều `[⏸️]` chờ người —
  đúng ca [[feedback-dung-loop-khi-rong]] mô tả.

Liên quan: [[subscriptions-debug-runbook]] · [[brief-state-agent-loop]] ·
[[bang-chung-phan-biet-duoc]] · [[caching-layers]] ·
[[digest-subscriptions-volume-bundle-2026-08-17]] (bug Volume Bundle cùng ngày, worktree riêng) ·
[[2026-08-17-installment-bundle-mot-engine]] (quyết định kiến trúc installment cùng ngày)
