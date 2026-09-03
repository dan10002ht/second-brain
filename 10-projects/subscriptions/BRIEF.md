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

### [✅ 2026-09-03] [P0] cycle-ship — phí ship không được tính lại khi khách sửa một kỳ

**Triệu chứng (CS báo, kookut):** khách sửa đơn sắp tới để giỏ hàng vượt ngưỡng miễn phí
(51.48 CHF > ngưỡng 50), nhưng vẫn bị thu 10 CHF. Contract `147888865661`, và
`150579708285` (2 kỳ). Đo trên 4 shop: 3 kỳ sai / 64 kỳ bị sửa thật.

**Root cause:** app coi `deliveryPrice` là thuộc tính của CONTRACT, còn `lines` là thuộc
tính của từng CYCLE. Merchant dùng rate phân tầng theo `TOTAL_PRICE` nên phí ship là hàm
của giỏ hàng — giỏ đã thành per-cycle, phí ship thì không đi theo. Hai chỗ hở:

1. `services/order/orderService.js` → `handleOrderUpdate`, các case `line-add` /
   `line-remove` / `line-update` / `line`: ghi lines vào cycle draft, **không đụng
   `deliveryPrice`**. Kỳ thừa hưởng giá của contract.
2. `services/subscription/contractService.js` →
   `handleSyncEditedContractToCurrentCycle`: lúc billing, copy lines sang kỳ hiện tại của
   Shopify nhưng **không mang `deliveryPrice`**. Chỉ nhánh `else if` trong
   `services/shopifyService.js:~884` mới đẩy giá, và chỉ khi `isCustomDeliveryPrice`.

**Phải sửa CẢ HAI.** Chỉ (1) thì khách thấy đúng nhưng vẫn bị thu sai — vì lúc charge app
xoá edit trên kỳ hiện tại rồi dựng lại từ source contract, mọi thứ ghi ở (1) bị wipe.
Chỉ (2) thì thu đúng nhưng màn hình hiện sai cho tới lúc charge.

**Công cụ đã có sẵn, ĐỪNG viết lại:**
- `helpers/shipping/resolveRateFromProfile.js` — tính giá từ rate table, đã test
- `services/shippingProfile/shippingProfileService.js` → `resolveRecurringShippingPrice({shop, contract, plan})`
  Đã kiểm trên 50 contract thật, khớp 100% với giá Shopify tự chào cho nhóm ONE_TIME.

**TUYỆT ĐỐI KHÔNG:**
- KHÔNG lấy giá từ cart quote. Shopify trả tier miễn phí cho giỏ DƯỚI ngưỡng ở nhóm
  SUBSCRIPTION — đo trên 2 zone của kookut và tái lập trên 1 shop khác. Đây là lý do
  `resolveRecurringShippingPrice` tồn tại.
- KHÔNG để `{skip}` làm hỏng lượt charge. Trong đường billing, không tính được giá thì
  **giữ giá cũ và charge tiếp**, không abort. Ngược triết lý fail-closed của helper —
  phải viết rõ trong comment.
- KHÔNG ghi đè khi `isCustomDeliveryPrice` (có lưu trên contract doc và order doc).
- KHÔNG đổi semantics của lock / idempotencyKey / thứ tự delete-recreate trong luồng
  billing attempt. Đây là code nguy hiểm nhất app.
- KHÔNG bật cho mọi shop. Gate sau `recurringOption === lowest` + toggle
  `updateOnItemsChange`, giống nhánh lúc tạo contract. 5.306 shop đang ở mặc định phải
  không đổi gì.

**Lưu ý hiệu năng:** đường charge chạy cho hàng nghìn contract mỗi lượt cron. Việc tính
giá thêm 2 API call (variant→profile, profile→rate table). Phải cache theo shop trong
một lượt chạy.

**Bug tiềm ẩn cùng họ, sửa luôn nếu gọn:** `else if` ở `shopifyService.js:~884` khiến kỳ
vừa bị sửa dòng vừa có giá ship tự nhập thì giá tự nhập KHÔNG BAO GIỜ được đẩy — nhánh
đầu nuốt mất.

**Test bắt buộc:** unit test cho cả hai đường, gồm ca `{skip}` không được chặn charge, ca
`isCustomDeliveryPrice` không bị ghi đè, và ca shop không bật toggle thì không đổi gì.

**Ngữ cảnh đầy đủ:** `BRIEF-kookut.md`, và các script đọc-thôi
`commands/misc/auditEditedCycleShipping.js`, `auditRateTablePricing.js`.

### [✅ 2026-09-03] [P0] kc-watson — subscription #18289688830 không có upcoming order nào

- **Không có commit** — task điều tra, không sửa code. Verifier PASS sau 1 vòng sửa.
- Kết luận + evidence: `jsub-260903-upcoming-order.md` · raw query trong `jsub-260903-evidence/`
- Root cause đã chứng minh: contract `isManual` ACTIVE nhưng Firestore **chưa từng persist**
  upcoming cycle nào ngoài cycle 0 `BILLED`. Cron billing (`services/cron/automaticBillingAttemptService.js:25-34`)
  chỉ đọc order doc có sẵn → **không self-heal được**. Log cửa sổ tạo 17/07 đã ngoài retention nên
  không chốt được exception cụ thể.
- Diện rộng: **80 contract ACTIVE / 30 shop** cùng triệu chứng (đếm status-aware, đã loại
  SKIPPED/CANCELLED). Trong shop kc-watson chỉ 1/506.
- Chạy bằng `/lt-orca`: worker codex điều tra, verifier Claude chấm FAIL (thiếu provenance
  `source: manual`, thiếu caveat undercount) → sửa 1 vòng → PASS.

**Nguồn:** Slack #urgent 2026-09-03 09:38 (Hiền NT/Iris) ·
ticket [JSUB-260903-mZGHXw](https://helpdesk.avada.net/t/JSUB-260903-mZGHXw) ·
[Crisp chat](https://helpdesk.avada.net/inbox/4c596ff3-74ec-42aa-a5a6-086556f7cd79/session_0930d4a3-8148-4cee-85b6-a5ae8374e6c9) ·
ảnh chụp: https://capture.avada.io/i/Rx4fR2iXvPfn

**Shop:** `kc-watson.myshopify.com` · plan **free** · install 2025-09-24.
**Đối tượng:** subscription contract `18289688830`.

**Triệu chứng:** màn hình subscription hiển thị **không có upcoming order nào**, trong khi
khách đang cần đặt hàng gấp. CS gắn URGENT, khách có khả năng để lại 1 sao.

**Chưa biết gì cả — đây là task ĐIỀU TRA, không phải task sửa code.** Deliverable là
**kết luận có bằng chứng**, không phải một patch đoán mò. Phải trả lời được:

1. Firestore có doc cycle/upcoming order nào cho contract này không? Nếu có thì trạng thái gì
   (đã bill, skipped, cancelled, hay bị lỗi giữa chừng)?
2. Trạng thái contract trên **Shopify** ra sao (`active`/`paused`/`cancelled`, `nextBillingDate`)?
   Lệch với Firestore chỗ nào?
3. Nếu upcoming order lẽ ra phải được sinh: **job nào chịu trách nhiệm sinh nó**, lần chạy gần
   nhất cho shop này là khi nào, có log lỗi không?
4. Đây là lỗi **của riêng shop/contract này** hay đang ảnh hưởng nhiều shop? Đếm ra con số —
   một contract hỏng và 500 contract hỏng là hai task khác nhau.

**Ràng buộc dữ liệu:** được đọc Firestore/BigQuery/Shopify API của prod, **KHÔNG ghi**,
KHÔNG chạy script sửa/backfill. Mọi query chạm dữ liệu thật phải ghi lại nguyên văn trong report.

**Không tự sửa code trong task này.** Ra được root cause thì **thêm task mới** vào `BRIEF.md`
kèm file:line, rồi dừng — fix sẽ là task riêng có scope rõ.

**Cần trả cho CS:** một câu giải thích nguyên nhân + khách phải làm gì ngay bây giờ để đặt
được hàng (workaround), vì ticket đang URGENT.

  **Xong 2026-09-03** · nhánh `fix/cycle-ship` · commit `d2d3a9a56` · executor: codex lane T32 (gpt-5.6-sol, xhigh)
  - Sửa 2 chỗ: `handleOrderUpdate` (tính lại lúc khách sửa) + `handleSyncEditedContractToCurrentCycle`
    (đẩy giá lúc charge). Mỗi chỗ một mình đều không đủ.
  - Cache 2 lượt đọc Shopify theo object shop trong một lượt cron (WeakMap, cache promise).
  - Gate: `check` exit 0 · `jest:fn` 271 suite / 2899 test (baseline 270/2882) · `jest:as` 25/239
  - Verifier: FAIL vòng 1 (tiêu chí cache — **lỗi brief của tôi**, cấp thiếu quyền sửa file),
    nới scope, PASS vòng 2. Verifier tự mutation-test: tắt logic → 5 test đỏ, restore → xanh.
  - **Tự kiểm dữ liệu prod thật** (không chỉ unit test): giỏ 51.48 → 0.00 CHF, giỏ 47.88 → 10.00 CHF.
  - Còn treo: `autoUpdateShippingRate` vẫn `{...shop, ...ensured}` nên cache miss ở path đó —
    code cũ, ngoài scope, hiện không nằm trên vòng lặp N-contract nên chưa hại.
  - **CHƯA tạo MR** — chờ dantt duyệt.


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

### [✅ 2026-09-03] [P1] SB-16175 — [Admin] Improve UI card "Customer portal version"

Ticket: https://space.avada.net/browse/SB-16175 · nằm trên nhánh `feat/portal-preview`.

  **Xong 2026-09-03** · nhánh `feat/portal-ui-16175` (off `origin/feat/portal-preview`) · commit `30532a9f9`
  · executor: worker codex qua Orca · verifier Claude **PASS ngay vòng 1**, không finding
  - Ticket chỉ có 5 mockup trên capture.avada.io. Kéo ảnh thật qua `og:image` → CloudFront
    (`https://d2798l25hiaz3h.cloudfront.net/<id>.webp`) nên đọc được chữ chính xác, không đoán.
  - 3 việc: (1) đổi helptext 2 radio + nội dung 2 banner setup; (2) dismiss banner persist theo shop
    — tái dùng `shop.dismissedBanners` + `useEditApi('/shops')` của `WidgetRebuildBanner`, trước đó
    chỉ `useState` nên reload là hiện lại; (3) bỏ nút "Go to theme" khỏi banner → nút secondary riêng
    cạnh "See your portal", **luôn hiện**: `Add subscriptions page` / `Enable app embed`.
  - Giữ key dismiss **tách theo portal version** (const `portalSetupBanner.js`) — dismiss cảnh báo
    Customer accounts không được nuốt luôn cảnh báo Legacy. Dismiss chỉ ẩn banner, KHÔNG mở khoá
    nút preview (vẫn gate bằng `canPreviewPortal`).
  - Gate: `yarn check` exit 0 (7 rule groups) · assets jest exit 0, 14 suite / 157 test — khớp baseline.
  - ⚠️ **`yarn workspace @avada/assets test` HỎNG SẴN ở checkout này**: `command not found: jest`,
    root `node_modules/.bin/jest` không tồn tại dù package đã cài. Không phải lỗi của thay đổi này.
    Đường vòng: `cd packages/assets && node ../../node_modules/jest/bin/jest.js`. Cần `yarn install` lại.
  - **Đã push 2026-09-03 theo yêu cầu dantt**: `origin/feat/portal-ui-16175` (nhánh mới) và
    fast-forward thẳng `origin/feat/portal-preview` `af19715a9..4256f6c0f` (2 commit) — không merge commit.
    Xác minh bằng `git fetch` + `rev-parse`, không tin dòng "ok" của push. Không tạo MR riêng.
    Worktree `~/projects/subscriptions-sb16175` giữ lại (node_modules là symlink sang repo chính —
    gỡ symlink trước khi xoá worktree).
  - **Còn treo, cố ý ngoài scope:** mockup Legacy còn cho thấy banner info "Contact us…" biến mất và
    mô tả dưới *Customer portal link* gộp thêm link quản lý navigation menu (thay checkbox hiện tại).
    Ticket chỉ liệt kê 3 mục trên → chưa làm, cần dantt xác nhận rồi mở task riêng.
  - **Đã chạy `yarn trans`** (commit `4256f6c0f`) — propagate 6 key sang en/origin + fr/de/it/es/ja,
    diff đúng 6 thêm / 4 xoá mỗi file, không đụng key của việc khác. `yarn check` exit 0 sau đó.
    ⚠️ Script đọc key từ `packages/functions/.env.development` — **file này KHÔNG tồn tại**;
    `GOOGLE_TRANSLATE_KEY` thật nằm ở `packages/functions/.env.local`. Cách chạy được:
    `GOOGLE_TRANSLATE_KEY="$(grep '^GOOGLE_TRANSLATE_KEY=' packages/functions/.env.local | cut -d= -f2-)" yarn trans`.
    Dòng "Translate 377 words" là tổng số từ script đếm, KHÔNG phải backlog — log cho thấy nó chỉ
    thật sự gửi 6 chuỗi của mình đi dịch.
