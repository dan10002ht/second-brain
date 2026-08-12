---
type: note
title: Shipped Joy Subscription — commit landed 2026-08-11 (v2.34.63)
summary: Commit landed 08-11 — master nhận 3 MR dưới MỘT tag `v2.34.63` mà tag lại nằm trên MR nhẹ nhất: xoá `apiHookV1` chết + hạ `apiHookV2` về 512MiB `[deploy-functions]` (!2460), chuỗi gate Sidekick vào master `[deploy-extensions]` (!2451), fix UI popover analytics (!2461); trên nhánh: 7 permission Read của MCP trả sai dữ liệu (SB-15077, +18 dòng index), CI resolver chưa bao giờ map controller về function của chính nó, và cụm win-back 08-03 (metrics luôn 0 SB-14513, email đọc sai shape contract SB-14690, merge tag SB-14667, test 29%→79%); 1 revert cosmetic cùng ngày.
tags: [subscription, shopify, avada, backend, extensions, firestore, cost, ai]
created: 2026-08-12
updated: 2026-08-12
source: repo "subscriptions" — git log (2026-08-11, kèm commit cũ trên nhánh win-back 07-23→08-05); mọi hash + tag lấy nguyên từ log, branch suy từ ref decoration
---

# Joy Subscription — shipped 2026-08-11

> Ngày trước: [[shipped-subscriptions-2026-08-11]] · bối cảnh project: [[subscriptions]] ·
> [[subscriptions-debug-runbook]]. Nền chi phí Functions: [[functions-cost-audit-2026-08-11]].

## Shipped

### Vào master — 3 MR, 1 tag

- **`53dc2c061` — MR !2460, `[deploy-functions]`** — nguồn `62a7a929f`
  (`chore/functions-cost-rightsize`). Đây là **việc #1, #2 và #3 trong bảng "nên làm" của
  [[functions-cost-audit-2026-08-11]] cùng landed một lượt**:
  - xoá `apiHookV1` (Gen 1, 2GB, **0 invocation/30 ngày**). Hosting rewrite `/app/api/v1/**`
    trỏ sang `apiHookV2` và `shopifyService` đăng ký webhook đúng path đó, nên hàm Gen 1 chỉ
    còn **reachable qua URL `cloudfunctions.net` trần** — tức một webhook handler public chạy ở
    2GB. Đóng Phase 5 của `docs/migrate-apiHookV1-gen2.md`.
  - `apiHookV2` memory **1GiB → 512MiB**. p99 đo được 24–29% của 1GiB mỗi ngày kể từ 07-23
    (mốc vá Pub/Sub leak, [[shipped-subscriptions-2026-07-23]]) ⇒ 1GiB thừa ~3.5×; 512MiB đưa
    p99 về ~55%, còn 2× headroom.
  - sửa comment sai trong `index.js`: "memory always-allocated nên maxInstances cao mới
    affordable" **không đúng** với request-based billing — `maxInstances` không tốn gì lúc
    idle. Ghi luôn in-flight trung bình **0.34** vào code để người sau không tăng concurrency
    mà tưởng rẻ đi.
  - Con số chốt trong commit khớp audit: `apiHookV2` ~$35.8/tháng vs ~$34.5 nếu ở Gen 1 —
    **migrate mua capacity, không mua giá**; 38 hàm Gen 1 còn lại lên Gen 2 sẽ **đắt thêm
    ~$29/tháng**.
- **`7bdcd7ac8` — MR !2451, `[deploy-extensions]`** — "Sidekick no longer steers merchants to a
  plan upgrade when a tool is gated". **Chuỗi gate của Sidekick đã vào master**, đóng câu hỏi
  treo số 1 của [[2026-08-11-sidekick-gate-message-khong-mang-chi-thi]] ("chưa vào master,
  `v2.34.62` không chứa nó"). Nhưng nội dung merge vào **không giống** bản mà decision mô tả —
  xem ⚠️ bên dưới.
- **`4e3ff8c70` — tag `v2.34.63`, MR !2461 — "Fix UI"**. Nguồn nhiều khả năng là `812f811c3`
  (`origin/fix/popover-analytics`): **1 file, +9/−11** trong `AnalyticsPageTitle.js`.

### Còn trên nhánh

- **`feat/sb-15077-mcp-server` — `5ccf2d533`: rà soát 7 permission Read của MCP, mọi thay đổi
  đều là "tool HỨA trả dữ liệu mà không trả / trả sai / trả thừa".** 30 tool, 4 helper mới,
  1 index mới (+18 dòng `firestore.indexes.json`). Sáu lỗi đáng nhớ:

  | Permission | Lỗi thật |
  |---|---|
  | `subscribers.read` | payment status **luôn INVALID** — đọc `subscriberPaymentStatus`, mảng mà `processSubscriberPaymentStatues` ghi CẢ `VALID` lẫn `INVALID` mỗi lần webhook billing chạy. SB-14370/14375 đã chuyển dunning tool sang `contract.isPaymentFailed` nhưng **bỏ sót tool này**; bug gốc vẫn còn và còn làm hỏng filter Payment status ở admin |
  | `orders.read` | `getPendingRetryOrders()` `.limit(100)` trên **toàn bộ shop** rồi mới lọc `shopId` ở JS → shop không nằm trong lát cắt toàn cục nhận mảng rỗng và **được báo là không có đơn lỗi nào** |
  | `settings.read` | forward cả settings doc trừ 3 key → kéo theo `emailNotifications {host, port, username, password}`. Đổi sang **allowlist 2 tầng** → tách thành decision riêng: [[2026-08-12-mcp-settings-allowlist]] |
  | `analytics.read` | `get_churn` không truyền currency (trả USD trong khi admin hiện shop currency, **không nhãn đơn vị**) và không truyền `ianaTimezone` (nên "30 ngày qua" ra cửa sổ khác `get_analytics_performance`) |
  | `perks.read` | `get_reward_campaign` đọc `campaign.conditionType` — field **không tồn tại ở bất kỳ đâu trong repo**; `cleanEmptyField` strip `undefined` nên tool **chưa bao giờ** trả điều kiện. `list_subscription_boxes` không forward `active:false` vì repo guard bằng `if (active)` → trả TẤT CẢ box mà trông như đã lọc |
  | `subscriptions.read` / `plans.read` | thiếu `deliveryFrequency` dù data đã có sẵn trên item, khiến AI phải fetch từng contract **15KB chỉ để đọc 2 field** |

  Sợi chung: **mô tả permission là một lời hứa, và không có gate nào kiểm nó**. Cả 6 lỗi đều
  là lệch giữa mô tả và dữ liệu thực trả về — cùng họ với [[bang-chung-phan-biet-duoc]]
  (không ai phân biệt được "shop không có đơn lỗi" với "query trả rỗng vì sai").

- **`67aaf13bc` (`fix/sidekick-plan-gate-message`) — CI resolver chưa bao giờ map controller về
  function của chính nó.** Sửa file dưới `controllers/agentApi/` resolve ra
  `functions:api,functions:apiSa` và **deploy không có gì liên quan tới agentApi** ⇒ mọi fix
  backend cho agent gateway **âm thầm không tới staging**. Nhánh `controllers/` chỉ so path đổi
  với các key đã có trong `fileToFunctions` (`handlers/*.js`, `routes/*.js`) nên không path
  controller nào prefix-match nổi; tất cả rơi vào fallback viết cho `controllers/clientApi/`.
  Nay tra **owner**: handler/route nào import `controllers/<dir>/` thì góp function của nó.
  Bug thứ hai lộ ra cùng lúc: `controllers/clientApi/**` **chưa bao giờ redeploy chính function
  `clientApi`**. Path lạ vẫn rơi về full deploy nên miss vẫn an toàn.
  ↳ Đây là lý do kỹ thuật cho hai commit `[deploy-all]` cùng nhánh (`ee1f466c9`, `001cb8c14`):
  ép full deploy vì resolver bỏ sót `agentApi`.
- **`fix/sidekick-plan-gate-message` — vòng 4 và 5 của chuỗi gate** (vòng 1–3 ở
  [[2026-08-11-sidekick-gate-message-khong-mang-chi-thi]]):
  - `a783c23e3` — quan sát trên staging2: hỏi "what's my churn rate", Sidekick trả lời churn
    "bị gate ở tier cao hơn, bạn cần nâng gói". **Không câu nào đến từ tool** — tool trả đúng
    một câu, phần còn lại agent **tự bịa**. Luận điểm của commit đáng giữ: *"a bare refusal is
    a gap, and an assistant trained to be useful fills a gap with the likeliest story it
    knows"* — với app SaaS, câu chuyện khả dĩ nhất **luôn** là "bạn đang ở gói thấp". Cách vá:
    **lấp khoảng trống bằng sự kiện, không bằng mệnh lệnh** — thêm một câu chỉ chỗ tra thật
    ("The Joy Subscription app shows the details") và ghi vào `instructions.md` rằng **không
    tool nào** báo giá / gói / hạn mức.
  - `b04583d8e` — bỏ nốt `reason: 'plan_too_low'` khỏi body 403. Body còn đúng
    `{success:false, error: gate.message}`. `checkToolAllowed` vẫn trả `reason` cho caller/test,
    `agentAuditMiddleware` chỉ ghi `ctx.body.error` nên audit trail không đổi.
- **`feat/sb-13947-volume-bundle`** — `ca8ce6e7f` "apply code review cleanup": 53 file,
  +1.016/−830, tách `VolumeBundlePreview` thành `VolumeGiftSection/*` + helper riêng
  (`volumeTierGift`, `volumeProductPicker`, `volumeBundlePreview`), gom SCSS về một file.
  `9d36dfe2b` / `68bde850b` chỉ là **"add todo"** — thêm dòng comment vào 19–7 file, không
  logic. Nhánh SB-13947 vẫn chưa merge (theo dõi từ [[subscription-shipped-2026-07-13]]).
- **`feat/adama-add-win-back-flow`** — log lần này lộ ra cụm commit **08-03 chưa từng vào brain**
  (các note trước chỉ ghi "WIP 252 file"):
  - `2c3309709` — SB-14513: 6 metric card **luôn hiện 0** trong khi activity log ngay dưới có
    đủ sent/opened/clicked. Chạy hai query của `getFlowMetrics` trên staging-3 (project đã
    deploy đủ index đã khai): LIST **OK**, AGG **FAILED_PRECONDITION**. Bài học nguyên văn:
    **Firestore cần index composite RIÊNG cho aggregation, và index đó phải chứa mọi field được
    `sum()`** — index `(shopId, flowId, createdAt DESC)` phục vụ list nhưng không phục vụ
    aggregation (không `orderBy` ⇒ cần biến thể `createdAt ASC` + đủ field sum). Đo được:
    `count()` chạy tốt, **mọi `sum()` fail**. Nửa sau của bug: `catch` degrade về 0 **không
    marker** nên "query chết" trông y hệt "chưa có gì xảy ra" và trốn được 2 tuần → nay có
    `unavailable: true` + banner + dấu gạch thay vì 6 số 0 tự tin. `firestore.indexes.json`
    **+57 dòng**. Còn nợ ngoài commit: staging, staging-2, staging-4 và **production hiện KHÔNG
    có index win-back nào**, tức list query cũng hỏng ở đó.
  - `de014a4ed` — SB-14690: email win-back đọc path **không tồn tại** trên prepared contract, mọi
    lỗi im lặng vì chỗ nào cũng có fallback. `prepareDeliveryMethod` **flatten** address lên
    chính `deliveryMethod` ⇒ mọi email gửi đi **không có địa chỉ**; instrument cũng bị flatten ⇒
    `toPaymentDisplay` trả null và email rơi về **thẻ SAMPLE, hiện "Visa ending 4242" cho khách
    thật**; giá line lấy `variant.price` (giá catalogue) thay vì `lineDiscountedPrice`/
    `currentPrice` — **28% trong 296 line thật sai**, một gói prepaid hiện 1025 trong khi contract
    charge 40; `contractSubtotal` duyệt `contract.lines` nhưng doc Firestore **không có `lines`
    (0/200 doc)** mà là `products[]` ⇒ **mọi accept `reactivate_previous` ghi revenue 0**.
    ↳ đúng họ bug "mỗi surface đọc một nguồn khác nhau" ở [[digest-subscriptions-2026-07-29]].
  - `7234de29c` — SB-14667: runtime chỉ thay `{{customer_first_name}}` (`fillCustomerName` là
    regex một tag) ⇒ **~23 merge tag còn lại đi tới khách dưới dạng `{{...}}` thô**. Nay một
    catalogue tag dùng chung cho FE+BE, tag không có nguồn dữ liệu bị **bỏ khỏi picker** thay vì
    render rỗng, preview và send thật đi qua **cùng một resolver**.
  - `023c1a8ce` — coverage win-back 15/52 module (~29%) → **41/52 (~79%), 559 case**. Lý do ghi
    trong commit đáng giữ: coverage cũ nằm gần hết ở pure helper — *flow cấu hình được và
    validate được dưới test, nhưng không có gì CHẠY flow được cover*, mà **cả hai bug khó của
    nhánh đều nằm đúng ở đó**. Cố ý **không** cover 4 repository (transaction Firestore cần
    emulator, và luật project là không mock Firestore).
  - `1fff0d445` — 2 doc: checklist SB-14253 + coverage map. Ghi lại rằng cả hai bug khó đều
    được chốt bằng **chạy code thật trên dữ liệu Firestore thật ở staging**, vì **đọc tĩnh đã
    kết luận sai ở cả hai** → [[bang-chung-phan-biet-duoc]].
  - `d57a98ec5` (07-29) — chỉ 4/9 luật validate của mockup vào production ⇒ flow **activate được
    với step mà runtime lặng lẽ bỏ qua**. Kinh điển: rule multi-select rỗng — **`[]` là truthy
    trong JS** nên `!r.value` không bao giờ bắt được, và rule đó luôn evaluate false ⇒ **đẩy
    toàn bộ subscriber xuống nhánh false**. Cùng bẫy "mảng rỗng là truthy" đã ghi ở
    [[digest-subscriptions-2026-07-29]] — **tái phát ở feature khác**.
  - `30b8f829c` — SB-14531: đổi icon merge-tag từ `HashtagIcon` sang Polaris `CodeIcon`.
  - `efd3fbda4` (07-23) — **"Fix bug"**, 19 file: tiêu đề không dùng được để biết gì đã sửa.

## Reverted

- **`e0a4b4634` (07-29) revert `953270507` (cùng ngày)** — "Make AppModal destructive primary
  action render in critical tone": cờ `destructive` của `AppModal.primaryAction` vốn là no-op nên
  nút Deactivate của Win Back builder render như primary tối; commit wire nó qua cả 3 đường render
  (embed `tone="critical"`, standalone max, standalone base). 3 file, revert sạch, **không có lý do
  ghi trong commit revert**. Cosmetic, không phải đảo hướng — nhưng là **cùng pattern "merge rồi
  revert trong ngày"** đã thấy ở [[shipped-subscriptions-2026-07-25]] và
  [[shipped-subscriptions-2026-07-30]]. Cả hai đều **chưa vào master**.
- Trên master: **không có revert nào**.

## Deploy notes

- Version: `v2.34.62` → **`v2.34.63`** — **một tag duy nhất bọc 3 MR**, và tag nằm trên MR nhẹ
  nhất ("Fix UI", 1 file). Hai MR mang tín hiệu deploy (`!2460` `[deploy-functions]`, `!2451`
  `[deploy-extensions]`) **đi ké không tag riêng** ⇒ đọc tag để suy nội dung release ngày này là
  sai. Cùng loại "release mù" đã ghi ở [[shipped-subscriptions-2026-08-11]], chỉ khác chiều.
- **`[deploy-functions]`**: `53dc2c061`/`62a7a929f` — **đã vào master**. Kèm thay đổi hạ tầng
  thật: xoá hẳn một function (`apiHookV1`) và đổi memory `apiHookV2`.
- **`[deploy-extensions]`**: `7bdcd7ac8` — đã vào master.
- **`[deploy-all]`**: `ee1f466c9`, `001cb8c14` — **cả hai đều là ép full deploy vì CI resolver
  bỏ sót `agentApi`** (`67aaf13bc`), không phải release. Sau khi `67aaf13bc` merge thì hai commit
  kiểu này **không còn cần nữa** — nếu vẫn thấy chúng xuất hiện, resolver chưa được vá trên
  nhánh đang chạy.
- **`firestore.indexes.json` đổi ở 2 nhánh chưa merge**: `+18` dòng
  (`orders: shopId+status+enabledRetry`, nhánh MCP) và `+57` dòng (aggregation index win-back).
  Cả hai **phải deploy index trước hoặc cùng lúc với code**, nếu không: MCP `orders.read` fail
  query, còn metric card win-back về lại 0 im lặng.
- **Nợ hạ tầng ghi thẳng trong `2c3309709`**: staging, staging-2, staging-4 và **production
  chưa có index win-back nào**. Merge nhánh win-back mà chưa deploy index ⇒ hỏng ngay cả list
  query, không chỉ metric.
- **Hash của nhánh win-back không ổn định.** Cùng một commit "[deploy-functions] Add win back
  flow" (252 file, +28.715/−721) đã xuất hiện với **3 hash khác nhau** trong brain:
  `740017597` ([[shipped-subscriptions-2026-07-24]]), `7b9ba052e`
  ([[shipped-subscriptions-2026-07-30]]), và `834c35f70` hôm nay. Nhánh bị rebase liên tục ⇒
  **đừng dùng hash của nhánh này làm mốc tra cứu**, dùng tiêu đề + số file.

## ⚠️ Cần xác nhận

### 1. Gate message của Sidekick: brain nói "một câu", commit vừa thêm câu thứ hai

| Nguồn | Nói gì |
|---|---|
| [[2026-08-11-sidekick-gate-message-khong-mang-chi-thi]] (vòng 3, `f2269ded5`) | message về đúng **một câu trần thuật** *"This action isn't available for this shop."*; test assert **"không quá một câu"** là một trong hai vế của quyết định |
| `a783c23e3` (log 08-11) | `AGENT_TOOL_GATE_MESSAGE` **gains a second sentence**: *"The Joy Subscription app shows the details."* |

Không phải mâu thuẫn về ý định (câu thêm vào vẫn trần thuật, vẫn không mang chỉ thị), nhưng nó
**phá đúng invariant mà decision ghi là điều kiện kiểm được**. Cần chốt: luật là *"không quá một
câu"* hay *"không mang chỉ thị"*? Nếu là vế sau thì decision phải sửa lại phần Tradeoff, và test
tương ứng phải đang assert cái khác với điều decision mô tả.

### 2. `reason` trong body 403: brain nói "không tới agent", commit nói "nó tới rồi"

| Nguồn | Nói gì |
|---|---|
| [[2026-08-11-sidekick-gate-message-khong-mang-chi-thi]] (Tradeoff) | *"hôm nay `callGateway` chỉ đọc `error` nên nó không tới agent — nhưng đó là một sự trùng hợp về code, không phải một rào chắn"* |
| `b04583d8e` (log 08-11) | *"callGateway only forwards `error`, so on paper the label never reached the agent. **It did anyway.** Rather than re-litigate how, stop sending it"* |

Brain đang giữ một khẳng định **sai theo quan sát thực tế**. Commit chọn không truy nguyên nhân —
nên câu hỏi *"vì sao label tới được agent dù `callGateway` không forward"* **vẫn mở**, và nó quan
trọng: nếu có một đường rò chưa biết từ body 403 tới agent thì mọi field khác trong body cũng
đang đi cùng đường đó. Đề xuất: cập nhật Tradeoff của decision + ghi câu hỏi này vào phần "cần
theo dõi tới ngày review".

## Liên quan

[[shipped-subscriptions-2026-08-11]] · [[2026-08-11-sidekick-gate-message-khong-mang-chi-thi]] ·
[[2026-08-12-mcp-settings-allowlist]] · [[functions-cost-audit-2026-08-11]] ·
[[functions-pricing-v1-v2]] · [[shipped-subscriptions-2026-07-23]] ·
[[shipped-subscriptions-2026-07-30]] · [[shipped-subscriptions-2026-07-24]] ·
[[digest-subscriptions-2026-07-29]] · [[bang-chung-phan-biet-duoc]] ·
[[subscription-shipped-2026-07-13]] · [[subscriptions]]
