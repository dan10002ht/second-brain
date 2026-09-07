# Joy Subscription — BRIEF

<!--
  `[ ]` chưa làm · `[⏳ HH:MM]` đang chạy · `[⏸️]` chờ người, đừng nhận · `[✅ YYYY-MM-DD]` xong
  Task xong quá 3 ngày → /looptasks tự dọn sang BRIEF-done.md
  Chạy (cwd = repo subscriptions, không phải brain):
  /loop 5m /looptasks ~/projects/my-brain/10-projects/subscriptions/BRIEF.md
    hoặc /loop 5m /lt-orca <đường dẫn trên>  — executor codex qua Orca, verifier Claude

  Gate của repo này (JS thuần — KHÔNG có tsc):
    ⚠️ CHẠY THẲNG BINARY, ĐỪNG QUA `rtk` — `rtk` NUỐT EXIT CODE.
       Đã vấp thật (task #18): agent báo "jest exit 0" trong khi 9 suite đang fail.
       Verifier phải tự `echo $?` và đọc số suite/test trong output, không tin dòng tóm tắt.
    yarn check                                  # node .claude/scripts/check.mjs — locale-parity + ...
       Đây là gate CHẶN COMMIT. Phải exit 0.
       Đã vấp: `check` từng chặn bằng 5 violation vốn có SẴN của repo, không phải lỗi mình.
    yarn workspace @avada/functions test        # jest --config jest.config.js
       ⚠️ FAIL SẴN — exit 1 là bình thường. Baseline gần đây: ~9 suite fail / ~5 test fail.
       Cách chấm đúng: **không suite nào MỚI đỏ**, số passed tăng đúng bằng test mình thêm.
    yarn workspace @avada/assets test           # jest — thường exit 0, ~6 suite / ~86 test
    yarn workspace @avada/functions run production   # babel src → lib/
    yarn workspace @avada/assets   run production    # vite build × 2 (embed + standalone)

  ⚠️ BASELINE THAY ĐỔI THEO NHÁNH — ĐỪNG CHÉP SỐ Ở TRÊN VÀO BRIEF, HÃY ĐO LẠI.
     Số trên chỉ để nhận ra "đỏ sẵn ≠ mình làm đỏ". Cách đo đúng: `git archive <HEAD trước
     thay đổi>` ra thư mục tạm rồi chạy tách biệt — KHÔNG đụng worktree đang review.

  ⚠️ Thí nghiệm đỏ-trước: subagent BỊ CẤM chạy git, và repo đang có ~233 stash của user.
     Muốn dựng lại bug cũ thì copy file ra scratchpad rồi sửa bản copy — đừng `git stash`.
     (Đã vấp task #22: agent tự stash/pop, rủi ro thật với đống stash đó.)
-->


## Tasks

### [ ] [P1] resync upcoming order cho contract manual bị thiếu cycle

Nối tiếp `jsub-260903-upcoming-order.md`. **Chưa được sửa gì** — task này mới là task fix.

Ba việc, làm theo thứ tự:

1. **Xác định phạm vi thật.** 80 contract/30 shop là đếm theo *triệu chứng*, chưa chứng minh cùng
   root cause manual-create. Phân loại 80 contract đó: bao nhiêu là `isManual`, bao nhiêu ACTIVE
   nhưng nextBillingDate quá hạn, bao nhiêu là false positive do độ trễ sync (đo được: contracts
   view trễ ~230s, orders view ~399s).
2. **Đường resync.** `syncManualUpcomingOrders` (`services/subscription/subscriptionService.js:1653`)
   đã tồn tại và dựng 10 cycle. Xác định gọi nó lại an toàn không, và gọi từ đâu — endpoint admin,
   script one-off, hay cron dò định kỳ. **Không tự chạy trên prod** — viết code, user tự chạy.
3. **Bịt lỗ ban đầu.** `subscriptionContractCreateService.js:1258-1315,1395-1400` là chỗ lẽ ra
   persist cycles lúc tạo manual contract. Không có log để biết vì sao nó không tạo doc nào, nên
   hướng đúng là **làm nó fail ồn ào** (log/alert khi persist ra 0 cycle) thay vì đoán exception.

**Sai lệch cấu hình phát hiện kèm, chưa xử:** Joy lưu plan `frequencyValue=6` (6 tuần) còn Shopify
lưu billing policy `WEEK × 14`. Chưa chứng minh nó gây mất upcoming doc, nhưng là bug thật.

### [⏸️] [P0] SB-16532 — bulk update Next Order Date im lặng bỏ qua contract, merchant thấy "DONE"

**MR đã có, chờ dantt review:** https://git.avada.net/avada/subscriptions/-/merge_requests/2532
Jira: https://space.avada.net/browse/SB-16532 · shop `bnagdp-cx.myshopify.com`

**Triệu chứng:** merchant bulk update Next Order Date, màn hình báo `DONE`, nhưng một phần
contract không đổi ngày — hoặc đổi sang ngày khác ngày đã chọn. Không có thông báo lỗi nào.

**Root cause:** `isValidNextOrderDate` bound cận trên bằng `cycleEndAt` = ngày order của
cycle+1. Ngày merchant chọn (24/12) vượt cửa sổ đó nên contract bị bỏ qua — mà nhánh `else`
chỉ `console.log` rồi đi tiếp, không trả kết quả skip.

- `services/subscription/bulkUpdateNextOrderDate.js:188` — nhánh else chỉ log, không trả skip
- `:176` — với `appliedToAll`, cận trên theo nextOrder hiện tại là quá chặt
- `:169` — tìm neighbor theo `cycleIndex ±1`; thiếu order → `new Date(undefined)` → Invalid
- `:238` — SKIP không ghi vào background activity → merchant thấy `DONE`

**Ba việc trong MR:** bỏ bound cận trên khi `appliedToAll`; guard khi `cycleStartAt`/`cycleEndAt`
Invalid thay vì im lặng trả false; ghi danh sách contract bị skip vào background activity.

**Chưa chứng minh:** triệu chứng "đổi sang ngày ngẫu nhiên" mới là giả thuyết (từ `:198`,
đếm job theo `lastOrder.cycleIndex`), chưa đo trên contract cụ thể. Đọc kỹ chỗ này khi review.

### [ ] [P0] SB-16437 — order kẹt `Queued` vĩnh viễn vì claim-before-charge

Jira: https://space.avada.net/browse/SB-16437 · shop `1qnaqs-3s.myshopify.com` ·
contract `21859533043` · order doc `orders/Cn9JRvKCcbTHfrFGKtsk`

**Root cause (đã chứng minh bằng dữ liệu Firestore thật):** cron billing đánh dấu
`processed=true` cho mọi scheduled order **trước khi** charge. Attempt không hoàn tất và
không ghi `enabledRetry`/errorCode, nên order mồ côi: không còn lọt vào `getOnScheduledOrders`
(đòi `processed==false`) lẫn `getRetryOrders` (đòi `enabledRetry==true`) → kẹt `UNBILLED` +
`processed=true` vĩnh viễn, chưa từng charge.

- `services/cron/automaticBillingAttemptService.js:32` — `batchMarkOrdersProcessed` claim trước khi charge
- `repositories/orderRepository.js:688` — `getOnScheduledOrders` đòi `processed==false`
- `repositories/orderRepository.js:708` — `getRetryOrders` đòi `enabledRetry==true`
- `commands/orders/resetProcessedOrders.js:12` — script remediation ĐÃ CÓ SẴN

**Bằng chứng:** `updatedAt` = `billingAttemptExpectedDate` + 32s — doc chỉ bị chạm đúng một
lần lúc claim 18/8, không có ghi nào sau đó. `billingHistory` và `charges` rỗng; order Shopify
billed gần nhất là cycle 9 (21/07) → Shopify **chưa** charge cycle 10.
Hai commit cũ xác nhận đây là failure mode đã biết mà chưa có fix triệt để:
`c738869cc` "Fix queue order due to function timeout" · `caa9b6bb7` "Reset queued order to retry billing".

**Việc của task này là fix TRIỆT ĐỂ, không phải chữa cháy.** Hai hướng, chọn một rồi bàn:
1. Sweeper định kỳ: tìm order `status=UNBILLED` + `processed=true` + `billingAttempts` rỗng +
   không `enabledRetry` + `billingAttemptExpectedDate` quá hạn → reset `processed=false`.
2. Đảo thứ tự claim: đánh dấu `processed` **sau** khi có kết quả chắc chắn thay vì trước.

**TUYỆT ĐỐI KHÔNG** đổi semantics của lock / `idempotencyKey` / thứ tự delete-recreate trong
luồng billing attempt mà không bàn trước — đây là code nguy hiểm nhất app. Hướng (2) chạm
thẳng vào đó nên cần duyệt.

**Chữa cháy cho shop này là việc TAY của dantt, không phải của task:** chạy
`commands/orders/resetProcessedOrders.js` cho `Cn9JRvKCcbTHfrFGKtsk`. **Kiểm khách chưa bị
charge trùng ở Shopify trước khi chạy.**

**Chưa kiểm được:** vì sao `handleAutomaticBillingAttempt` không hoàn tất ngày 18/8 (timeout
hay một nhánh return-không-ghi) — log Cloud Logging 18/8 đã hết hạn lưu, chỉ còn từ ~24/8.

### [ ] [P1] SB-16531 — app nuốt userError khi associate selling plan group thất bại

Jira: https://space.avada.net/browse/SB-16531 · shop `eb18c0-00.myshopify.com` ·
delivery profile `143004500315`

**Triệu chứng:** checkout hiện shipping options của General profile thay vì profile
subscription merchant đã cấu hình.

**Root cause:** merchant tự add product variants vào delivery profile subscription lúc setup
zone Czechia. Shopify từ chối associate selling plan group vào profile đã có variants →
checkout rơi về General profile.

- `services/graphql/shippingProfileService.js:330` — `updateDeliveryProfile` ném lỗi khi Shopify trả userError
- `services/shippingProfile/shippingProfileService.js:591` — **catch nuốt lỗi im lặng**, vẫn trả
  success và đã ghi `sellingPlanGroupIds` lạc quan vào Firestore

**Phần sửa code của task này chỉ là chỗ thứ hai:** surface userError ra UI thay vì nuốt, và
đừng ghi `sellingPlanGroupIds` khi associate thất bại — Firestore đang nói dối trạng thái thật.

**Không sửa được phía app:** merchant phải tự gỡ product variants khỏi profile trong Shopify
Admin. Đó là việc của support, đã có hướng dẫn trong case.

**Chưa kiểm:** chưa query được Admin API để xác nhận trạng thái association hiện tại — kết luận
suy từ userError lặp lại.

### [ ] [P1] SB-16530 — Customer Account "Edit subscription" hiện trang trắng, phải reload

Jira: https://space.avada.net/browse/SB-16530 · shop `g-niib-uk.myshopify.com` ·
độ tin cậy **medium** (thấp hơn các case trên — đọc kỹ trước khi sửa)

**Root cause:** guard chặn render bị vô hiệu hoá bởi hai thứ cộng lại — `defaultData={}` làm
`contractData` luôn truthy, và `loading` chỉ bật **sau** `await sessionToken.get()`. Kết quả:
render `Page` với contract rỗng thay vì `Spinner`.

- `extensions/customer-account-ui/src/pages/SubscriptionDetail.js:227` — guard dựa vào `contractDataLoading + !contractData`, cả hai đều không bắt được trạng thái đang tải
- `:86` — `defaultData:{}` khiến `!contractData` luôn false
- `hooks/api/useFetchApi.js:50` — `setLoading(true)` đặt sau `await` → `loading` còn false lúc mount

**Hướng sửa đã đề xuất:** sửa guard tại `:227` thành `if (!fetchedContract || !contractId || isChanging)`,
bỏ phụ thuộc vào `contractData` truthy và `loading`.

**KHÔNG đụng `useFetchApi.js`** — hook dùng chung, sửa `setLoading` ở đó là đổi hành vi mọi
màn hình. Fix cục bộ trong `SubscriptionDetail` thôi.

**Chưa kiểm:** không xem được video jam.dev, và extension render race không đẩy log lên Cloud
Logging nên chưa chứng minh vì sao trang trắng kéo dài tới lúc reload.

### [ ] [P0] JSUB-260904 — bật free trial cho đơn đầu nhưng checkout vẫn charge

**Đây là task ĐIỀU TRA, chưa có root cause.** Deliverable là kết luận có bằng chứng, không
phải patch đoán mò.

**Nguồn:** CS báo trong thread của case cũ —
[Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1788526914719909) ·
ticket [JSUB-260904-wG5Bjb](https://helpdesk.avada.net/tickets/JSUB-260904-wG5Bjb) ·
ảnh cấu hình https://capture.avada.io/i/q5bdxxuJLEu8 · ảnh checkout bị charge https://capture.avada.io/i/KIEHyoJ3mCCO

**Shop:** `9fe9fd-3.myshopify.com` (grivesperfumes.com) · plan starter · shopId `DHkbOSHKmssaPrCnyEiG`
Cùng shop và cùng page với `SB-16436`, nhưng là lỗi **khác hẳn** — đừng gộp hai cái.

**Triệu chứng:** merchant bật free trial cho đơn đầu tiên, nhưng khách checkout vẫn bị thu tiền.

**ĐÃ LOẠI TRỪ (kiểm trên Firestore prod, không phải suy luận):**
Giả thuyết ban đầu — *"trial bị bỏ qua khi plan không có discount tier"* — **SAI**.
Lý do nó nghe hợp lý: `trialConfig` chỉ được đọc ở **đúng một chỗ** trong toàn bộ `src`,
là `helpers/utils/getSellingPlanVariables.js:50` bên trong `pricingPolicyDetailByFirstTier`;
mà hàm đó chỉ được gọi khi `plan.discountConfig.tiers.length > 0` (dòng `:285`).
Nhưng dữ liệu thật bác bỏ: **cả 6 plan của shop đều có `tiers=1`**, và 3 plan bật
`trialConfig.enabled=true` với `100 percentage`. Nhánh trial CÓ chạy.

**Hướng còn lại, chưa kiểm:**
1. Selling plan trên **Shopify** có thật sự mang pricing policy `fixed 100%` không? Có khả năng
   app cập nhật plan trong Firestore nhưng `sellingPlanGroupUpdate` không đẩy lên, hoặc Shopify
   từ chối. So `pricingPolicies` thật trên Shopify với thứ app định gửi.
2. Khách checkout bằng **plan nào**? Shop có 6 plan, 3 cái `trial.enabled=false`. Có thể widget
   chào đúng plan nhưng checkout gắn selling plan khác.
3. Có phải cùng họ với `JSUB-260826-BLxRXu` không (charge 72 EUR thay vì 6, do
   `pricingPolicy afterCycle:0` bị Shopify re-anchor trên contract legacy)? Đối chiếu hai ca.

**Bẫy khi đọc test — đừng tin độ phủ ở đây:**
`__tests__/helpers/utils/getSellingPlanVariables.test.js` có case *"trial không kèm discount
tier nào"*, nhưng nó gọi **thẳng** `pricingPolicyDetailByFirstTier(plan)`, **không đi qua**
`getSellingPlanVariables`. Tức nó bỏ qua đúng dòng `:285` quyết định có gọi hàm đó hay không.
Test xanh không chứng minh đường thật chạy đúng. Nếu sửa ở đây, **thêm test đi từ
`getSellingPlanVariables`** chứ đừng thêm case cho builder.

**Ràng buộc dữ liệu:** được đọc Firestore/BigQuery/Shopify API prod, **KHÔNG ghi**, không chạy
script sửa. Mọi query chạm dữ liệu thật ghi nguyên văn vào report.

**Cần trả cho CS:** nguyên nhân + khách phải làm gì ngay (workaround), vì đây là chạm tiền khách.

### [ ] [P0] SB-16563 — autoSwap giữ giá sản phẩm cũ, recurring charge 143.99 thay vì 13.99

**URGENT** — khách đang muốn go-live, và đây là **charge sai tiền thật**.

Jira: https://space.avada.net/browse/SB-16563 ·
[Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1788754517864659) ·
ticket [JSUB-260907-WN53ga](https://helpdesk.avada.net/t/JSUB-260907-WN53ga)
Shop `ranvoostyle.myshopify.com` · plan starter · subscription `#38342426935`

**Triệu chứng:** đơn đầu là bàn chải (149.99 − 6% = 140.99), các kỳ sau swap sang đầu bàn chải
(19.99 − $6 = 13.99). Nhưng kỳ recurring đang bị tính **143.99** — không khớp giá cũ lẫn giá mới.

**Root cause (đã chứng minh trên contract thật):** autoSwap chạy ở mode `keep` nên **chỉ đổi
variant, giữ nguyên `basePrice` của sản phẩm gốc**. Line hàng thành: variant = heads (19.99)
nhưng `basePrice` = 149.99 → `149.99 − $6 = 143.99`.

- `services/autoSwapService.js:149` — `effectivePriceMode='keep'` là **mặc định** khi shop
  không có `enableAovBundleSwap` → không reprice `basePrice`
- `services/autoSwapService.js:184` — chỉ nhánh `'catalog'` mới set `basePrice` = giá catalog của
  sản phẩm swap, mà nhánh đó bị gate sau một cờ DevZone ẩn
- `helpers/order/prepareLineDiscountData.js:62` — lấy `line.product.basePrice` (149.99 còn sót) rồi
  tính `currentPrice` = 143.99

**Bằng chứng:** contract có `variant.price=19.99` / `basePrice=149.99` / `currentPrice=143.99`.
Mọi order cycle 1–9 đều `basePrice=149.99`, riêng cycle 0 là 140.99 (đúng).
`discountConfig`: order 1 = 6%, order 2+ = fixed $6 → `149.99−6=143.99`, khớp chính xác.

**Đã loại trừ:** chẩn đoán ban đầu của BA (*"prepareLineDiscountData giữ line cũ"*) **sai** — hàm
đó chỉ re-derive từ `basePrice`; `basePrice` sai là do autoSwap keep-mode. Cũng đã loại webhook
miss (log cho thấy create + nhiều update đều tới và đã re-sync) và loại sai tier
(`findApplicableTier` trả đúng tier 2).

**Chữa cháy cho shop này:** bật `enableAovBundleSwap` để swap reprice `basePrice` về giá catalog.
**Việc tay của dantt, không phải của task** — và kiểm khách chưa bị charge trùng trước khi đụng.

**Fix lâu dài — cần bạn quyết trước khi ai nhận task:** autoSwap rotation nên reprice `basePrice`
theo giá sản phẩm swap khi hai giá khác nhau, thay vì chỉ làm sau cờ AOV. **Đây là đổi hành vi
mặc định của autoSwap cho mọi shop** — không tự ý làm.

**Chưa biết:** mode `keep` có **cố ý** dùng cho rotation sản phẩm khác giá không, hay chỉ dành cho
AOV bundle cùng giá. Trả lời được câu này mới chốt được hướng fix.

**Test tái hiện:** unit test `autoSwapService` keep-mode — swap variant sang sản phẩm rẻ hơn rồi
assert `basePrice`/`currentPrice` bằng giá catalog của sản phẩm swap trừ tier discount, chứ không
giữ `basePrice` gốc.

**Lưu ý khi đọc ticket:** CS mô tả cả "đơn đầu bị charge 143.99" nhưng dữ liệu cho thấy cycle 0 =
140.99 (đúng). Nhiều khả năng CS đọc nhầm số của kỳ sắp tới. Xác nhận lại với CS trước khi sửa
thêm gì cho đơn đầu.
