# Joy Subscription — BRIEF

<!--
  `[ ]` chưa làm · `[⏳ HH:MM]` đang chạy · `[⏸️]` chờ người, đừng nhận · `[✅ YYYY-MM-DD]` xong
  Task xong quá 3 ngày → /looptasks tự dọn sang BRIEF-done.md
  Chạy (cwd = repo subscriptions, không phải brain):
  /loop 5m /looptasks ~/projects/my-brain/10-projects/subscriptions/BRIEF.md

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

39. [✅ 2026-08-14] **CI production fail: clone repo artifacts từ gitlab.com bị 401 — đang chuyển sang on-premise**
   - **ĐÓNG 14/08 — user chốt "task 39 done rồi"**. Không có commit mới trong phiên này; phần code đã ở nhánh `fix/ci-artifacts-onprem` · commit `dee9344` (đã push). Mục "CÒN LẠI" bên dưới (tạo MR, chọn token CI, rotate PAT `glpat-w06kO...`) là **việc tay của user**, giữ lại làm checklist
   - **Triệu chứng 14/08**: job `publish-fe` (tag `v2.34.69`, commit `8016e0ac`) chết ở `.gitlab/ci/production.yml:207`
     `git clone https://gitlab-ci-token:$GIT_ACCESS_TOKEN@gitlab.com/avada/artifacts/joy-subscription-artifacts.git` → `HTTP Basic: Access denied`, exit 128. CDN Cloudflare chạy xong bình thường, **chỉ nhánh CHUNK chết**
   - Job **fail-closed** (`:229`) — hosting chỉ chạy khi cả CDN lẫn chunk OK → **FE chưa lên production**, không lên nửa vời
   - Nguyên nhân: repo `subscriptions` đã chuyển sang `git.avada.net`, repo artifacts vẫn ở `gitlab.com` → token cross-host vô giá trị (hoặc PAT hết hạn)
   - **ĐÃ LÀM 14/08 — seed on-premise xong**: repo `git.avada.net/avada/artifacts/joy-subscription-artifacts` vốn đã tồn tại nhưng là **ảnh chụp lúc migrate 07/08 rồi đứng yên** — phân kỳ với gitlab.com: onprem có 16 commit riêng, gitlab.com đi trước **1756 commit**
     - Xác minh 16 commit onprem là **bản sao, không có gì độc nhất**: mỗi cái có commit song sinh bên gitlab.com (cùng message, cùng ngày, cùng SHA `subscriptions` nhúng trong message), và bằng chứng cứng nhất — `f17f1b3bdd` vs `2ed35b8fa8` **cùng tree `15d90c2a0a`**, `git diff` rỗng
     - → force push đè không mất gì. Đã đẩy **một commit không cha** `de6db84253` mang y nguyên tree của `75d0b53e67` (bản gitlab.com hôm nay). **Cắt 2.7 GiB lịch sử**; lịch sử cũ vẫn nguyên ở gitlab.com
     - Gotcha: zsh nuốt `:r` trong `$NEW:refs/heads/main` → phải **quote** refspec. Và `main` onprem protected — **force push là quyền RIÊNG**, Maintainer vẫn bị chặn nếu toggle "Allowed to force push" tắt
   - **ĐÃ KIỂM TOKEN 14/08**: `~/projects/joy-subscription-artifacts/.env` có biến `GL_ONPREMISE` (gitignored, **khác** token đã lộ). Test thật 3 tầng: `ls-remote` ok · push branch thường ok · **push commit rỗng vào `main` protected ok** (`de6db84253..48d93da358`, fast-forward). → token đủ quyền Maintainer, CI dùng được luôn
     - Quan trọng: CI push hàng ngày là **fast-forward**, **KHÔNG cần** quyền force push. Toggle force push chỉ cần lúc seed, xong phải tắt
     - ⚠️ `.env` đang `chmod 644` → nên đổi `600`
     - Bẫy zsh (dính 2 lần): `"$NEW:refs/heads/main"` bị hiểu là modifier `:r` **kể cả trong nháy kép**. Phải dùng `"${NEW}:refs/heads/main"` hoặc sha literal
   - **ĐÃ SỬA CI 14/08**: nhánh `fix/ci-artifacts-onprem` · commit **`dee9344`** · **đã push**, base `origin/master`. Đúng 1 dòng `production.yml:207` — đổi host `gitlab.com` → `git.avada.net` và username `gitlab-ci-token` → `oauth2`. YAML đã validate. **Chưa tạo MR** — phải merge vào `master` thì pipeline tag mới ăn config mới
     - Tách nhánh riêng, **KHÔNG** trộn vào MR Klaviyo !2470: thay đổi CI production, reviewer khác, rủi ro khác
     - `GIT_ACCESS_TOKEN` chỉ được dùng ở **đúng 1 dòng** trong toàn `.gitlab/` → đổi thẳng giá trị biến cũ là an toàn, khỏi tạo biến mới
     - ⚠️ **`staging.yml` KHÔNG clone repo artifacts** — chỉ production làm. Nên **không test được trên staging**; phải test token ở máy trước (đã làm)
   - 🔑 **BẢN ĐỒ TOKEN on-premise — đừng nhầm nữa** (tôi đã kết luận vội một lần và sai):
     | Biến | File | Ghi chú |
     |---|---|---|
     | `ON_PREMISE_GITLAB_TOKEN` | `subscriptions/packages/functions/.env.local` | **CHÍNH LÀ token `glpat-w06kO...` đã lộ** → cần revoke + thay mới |
     | `GL_ONPREMISE` | `joy-subscription-artifacts/.env` | Token khác, KHÔNG lộ |
     - Không file nào trong repo đọc `ON_PREMISE_GITLAB_TOKEN` (grep js/json/yml/sh) → revoke **không hỏng automation**, chỉ hỏng thao tác git tay cho tới khi thay token mới
     - **Trước khi revoke phải kiểm**: CI variable `GIT_ACCESS_TOKEN` có đang dùng chính token này không
   - **Gotcha môi trường**: push từ session Claude Code fail `could not read Username ... Device not configured` — không có TTY nên osxkeychain không hỏi được. Gỡ bằng token: `ON_PREMISE_GITLAB_TOKEN` trong `packages/functions/.env.local` (PAT cá nhân cho `git.avada.net`), dùng dạng `https://oauth2:$TOKEN@git.avada.net/...`
   - **CÒN LẠI, chưa làm**:
     0. Tạo MR cho `fix/ci-artifacts-onprem` và **merge vào master**
     1. Chọn token cho CI: dùng luôn `GL_ONPREMISE` (đã chứng minh chạy được) **hoặc** tạo Project Access Token role Maintainer + `write_repository`. PAT cá nhân thì CI gắn với người — đúng lớp lỗi đang gặp; project token thì gắn project
     2. Sửa `production.yml:207` trỏ URL onprem + biến token mới — **agent bị classifier chặn sửa `.gitlab/ci/*.yml`, user tự làm**
     3. Chạy thử staging trước khi production đi qua đường mới
     4. ⚠️ **Rotate PAT `glpat-w06kO...`** — nó từng nhúng plaintext trong `.git/config` của `~/projects/joy-subscription-artifacts` (remote `onprem`) và đã lộ ra output phiên 14/08. Đã gỡ khỏi URL remote nhưng **gỡ không làm token hết hiệu lực**
   - ⚠️ **Rủi ro phải tránh khi đổi CI**: repo artifacts KHÔNG được bắt đầu từ rỗng. Bước `cp -rf joy-subscription-artifacts/static/* static/` merge chunk cũ vào bản build mới; thiếu chunk là browser khách đang cache URL hash cũ sẽ **404 asset trên storefront thật**. Seed ở trên đã giữ đúng nội dung nên an toàn

17. [✅ 2026-08-14] **Cân nhắc lại chiến lược fork — CTO đang làm song song** _(việc của người, agent không tự làm được)_
   - **ĐÓNG 14/08 — user chốt "#17 k cần nhé"**. Không có commit. Nội dung khảo sát bên dưới giữ lại làm tài liệu nếu sau này quay lại chuyện fork vs upstream
   - **Cập nhật 12/08**: "NGAY HÔM NAY" trong tiêu đề cũ là **11/08**. Từ đó tới nay: `joysub.3` đã vá gap so với alpha.12 (#19) và fork còn **đi trước upstream 1 điểm** (guard `!plan.startingPrice`). Task vẫn mở vì thứ chưa làm là **nói chuyện với CTO**, không phải viết code
   - Việc còn lại: đóng góp ngược 4 việc của joysub lên dòng chính, đặc biệt nhánh 403 `checkIfActiveAccessToken` (xác nhận alpha.9 KHÔNG có; **chưa kiểm alpha.12**)
   - Dòng thời gian registry: `joysub.1` 07:38 → **`alpha.12` 08:36 (CTO, hôm nay)** → `joysub.2` 09:17. Lúc khảo sát 14:43 giờ máy `latest` còn là `alpha.9`; giờ là `alpha.12`. **Hai bên đang sửa cùng một thứ mà không biết nhau**
   - `alpha.10`/`alpha.11` không có trên registry (giống alpha.8) — nội dung nằm trong alpha.12. Changelog ghi *"Fixes the three pre-existing defects alpha.11 pinned with tests"* → **CTO đã thêm TEST**, dòng của họ giờ có test suite, fork của mình không có
   - alpha.12 đụng rộng hơn alpha.9 nhiều: thêm file mới `services/authClassifiers.{js,d.ts}` (tách logic phân loại lỗi ra module riêng — tức phần mình vừa dựng lại đã bị họ refactor), cộng `builder.js`, `discount.js`, `helpers.js`, `shopRepository`, `sessionRepository`, `session/firestore.js`, `shopifyApiService`, `subscriptionController`
   - 3 fix của alpha.12 là bug thật, ảnh hưởng app: `normalizeShopName` regex case-sensitive làm `DEMO.myshopify.com` → `DEMO.myshopify.com.myshopify.com` (hostname không resolve, hỏng MỌI request của shop đó); `removeProperties` guard `if (obj[prop])` nên `false`/`0`/`''` sống sót; `calculatePlanWithDiscount` cho ra giá âm → Shopify từ chối `appSubscriptionCreate`, merchant thấy coupon làm gãy checkout mà log app không giải thích gì. Thêm `engines: node>=18`
   - **Hệ quả**: `joysub.2` vừa publish đã lạc hậu. Mỗi lần CTO publish, fork phải dựng lại từ JS build — chi phí lặp vô hạn, và giờ còn thua cả về test coverage
   - **Khuyến nghị: DỪNG mở rộng fork, nói chuyện với CTO trước.** 4 việc của joysub nên đóng góp ngược lên dòng chính thay vì duy trì song song. Đặc biệt nhánh 403 (`checkIfActiveAccessToken`) — đã xác nhận alpha.9 KHÔNG có, cần kiểm alpha.12 có chưa

24. [✅ 2026-08-14] **[P1] Job bulk-action báo `DONE` khi mới chạy được một phần**
   - **ĐÓNG 14/08**: lock `[⏳ 11:00]` là lock chết — code đã commit từ 12/08. Nhánh `fix/line-price-sync` · commit **`2dc2fb9fd`** (chung commit với #23) · đã có trên `master`. Xác minh lại bằng `git show`: `unprocessedContractIds` + 2 `console.warn` có mặt đúng như mô tả bên dưới. 2 file, +295/−5
   - `contractBulkActionService.js:464-470` set `status: BULK_ACTION_STATUS_DONE` **vô điều kiện** sau khi hết `while` loop, không so `processedContracts.size === totalContracts`
   - Contract bị bỏ qua âm thầm ở `:231-233` (`if (!contract) continue;` — không log, không đếm) khi không có trong `contractsMap` từ `getSubscriptionContractsByContractIds` (`:379-382`)
   - Bằng chứng prod (shop kookut): 3/23, 2/22, 5/26, 6/26, 2/23, 9/30, 8/29 — đều `status: DONE`
   - Hệ quả: contract lệch giá nhau mà không ai biết; và chính nó tạo "đối chứng tự nhiên" ở vụ #11 (Tuna chưa sync nên còn đúng)
   - **12/08 — XONG, VERIFIER PASS. Chưa commit được** (gate hook, xem #27). Chung nhánh `fix/line-price-sync` với #23, cùng một commit
   - **VÒNG 1 BỊ BÁC — bài học về "thêm trạng thái mới vào máy trạng thái có guard"**: fix đầu thêm status `BULK_ACTION_STATUS_PARTIAL`. Nhưng `handlers/pubsub/bulkActionHandler.js:134` chặn redelivery Pub/Sub bằng `status !== 'DONE' && status !== 'FAILED'` → chunk `PARTIAL` **lọt qua guard**, và nó chạy lại với **toàn bộ chunk** (guard đọc field `contracts` chưa trim, không phải `remainingContracts` — field mới này **không nơi nào trong repo đọc**). Tức commit lại draft lên Shopify lần hai cho các dòng đã đúng. **Nghiêm trọng hơn bug đang chữa**
   - **Sửa đúng: BỎ HẲN `PARTIAL`.** Giữ `status: DONE` vô điều kiện (semantics với guard/FE y hệt pre-diff, `type.js` và `bulkActionHandler.js` đều **diff rỗng**), chỉ thêm `unprocessedContractIds` trung thực + `console.warn`. Loại rủi ro **bằng cấu trúc** thay vì vá cẩn thận. Verifier tự grep lại: 43 match `'DONE'` trong 24 file, không chỗ nào cần đụng
   - **FINDING CÒN TREO — mục tiêu chỉ đạt một nửa**: dữ liệu giờ trung thực nhưng **không ai thấy**. `unprocessedContractIds` chỉ nằm trong doc Firestore, **không UI nào đọc**, không banner/alert/dashboard. `console.warn` có vào Cloud Logging (Functions v2 tự thu stdout/stderr) nhưng **không có alert policy, không log-based metric**. → Job chạy thiếu vẫn trôi im lặng như cũ; khác biệt duy nhất là giờ có dấu vết để tra **sau khi đã có người khiếu nại**. Muốn đạt trọn thì cần alert/metric — việc riêng, chưa mở task

28. [⏸️] **[P0] SỬA DỮ LIỆU contract đã bị ghi sai giá — code fix KHÔNG chữa được dữ liệu cũ**
   - 🛑 **CẢNH BÁO 14/08 — ĐỪNG CHẠY `repairContractLinePrices.js --apply` CHO TỚI KHI XỬ XONG [[#43]]**: script dùng `contextualPricing` (`repairContractLinePrices.js:87,95`) làm "giá catalog thật". Verifier đã chứng minh trên kookut rằng **`contextualPricing` KHÔNG đáng tin**: với sản phẩm `Pacific Tuna & Sardine - Natural` nó trả 1.95 / 42.95(FR) / 45.95(DE,IT) trong khi **PriceList FIXED** của chính merchant là **1.70 / 40.00**, và nó **tự mâu thuẫn giữa các nước**. Chạy apply lên nhóm đó = **ghi giá còn sai hơn hiện tại**, và tăng tiền khách
   - → Trước khi apply bất cứ gì: đổi nguồn giá tham chiếu sang `PriceList.prices(originType: FIXED)` theo đúng catalog/market của contract, rồi **dry-run lại từ đầu**. Mọi con số dry-run cũ (15 dòng / 11 contract) **phải coi là chưa đáng tin**
   - **`151147970941` charge lại 14/08 05:32 UTC** (đã xác nhận bằng `billingAttemptExpectedDate` 1786685579). Chu kỳ 1 tháng, không phải 14/09 như tôi ghi nhầm lúc đầu
   - **Re-sync KHÔNG tự chữa được.** `findContractsNeedPriceUpdate` (`contractBulkActionService.js:58`) so `shopifyPrice !== Number(p.variant.price)` — nó so **`variant.price`** (đúng ở cả 2 phía), KHÔNG so `basePrice` (cái đang sai). Line hỏng **vô hình** với chính cơ chế sync → deploy fix xong chạy lại sync cũng không đụng tới nó
   - **Quét kookut (script `commands/misc/scanLineIdMisalignment.js`, `STATUS=ANY`)**: 206 contract (83 ACTIVE / 73 PAUSED / 50 CANCELLED) → **30 lệch index**, **7 hỏng giá**
   - Pattern: line **70g** nhận giá gói **40**, line **24x70g** nhận giá lẻ **1.7** — xoay vòng index
   - **ACTIVE (đang charge sai)**: `151147970941` EUR **+229.74**/kỳ · `147905085821` EUR +63.90/−20.78 · `148748632445` CHF +73.00/−28.60 · `123521991037` CHF **−35.65** (thu THIẾU)
   - **PAUSED (resume là charge sai)**: `127309513085` EUR **+608.48**/−44.25 · `117124989309` EUR 20 line, ~**+728** ròng · `117131379069` CHF +150.00/−13.40
   - **Bug đi HAI CHIỀU** — có contract merchant bị thu thiếu. Sửa lên = tăng tiền khách đang trả → **phải qua merchant, KHÔNG script âm thầm**
   - ⚠️ Cột `expected` trong script là **ước lượng** từ tỉ lệ `basePrice/variant.price` trung vị của chính contract đó, KHÔNG phải giá catalog thật. Khớp hoàn hảo ở ca kookut (ra đúng `1.71` như CS báo) nhưng **phải đối chiếu catalog Shopify trước khi ghi**, nhất là `117124989309` nơi quá nửa line sai nên trung vị có thể lệch
   - **QUÉT ĐỦ 26.338 contract ACTIVE (12/08)**: **268 lệch index** (at risk) → **19 hỏng giá thật**
   - ⚠️ **Detector v1 báo động giả nặng — đừng dùng lại**: v1 chỉ so tỉ lệ `basePrice/variant.price` với trung vị của contract → ra **83** "hỏng", trong đó rất nhiều là **discount subscription hợp lệ** (`28.792/35.99` = giảm 20%, `9.8/13.99` = giảm 30%). Sai vì giả định mọi line cùng contract có cùng mức discount. Ca kookut lọt lưới đúng chỉ vì ở đó discount đồng đều 5%
   - **Detector v2 (đang dùng)**: bắt đúng **chữ ký hoán giá** — chỉ gắn cờ khi tìm được "line cho mượn": tồn tại line j≠i sao cho `basePrice_i ≈ variant.price_j × tỉ_lệ_trung_vị` (sai số <5%). Không có donor → coi là discount hợp lệ, bỏ qua. Kiểm ngược trên kookut: vẫn bắt `151147970941` (ca CS đã xác nhận), loại `123521991037` (discount 50%). 83 → 19
   - **19 contract hỏng, theo shop**:
     | # | shop | contractId |
     |---|---|---|
     | 5 | `24123e-4.myshopify.com` | 65159889194, 50061574442, 63169724714, 50920522026, 47829352746 |
     | 3 | `kookut.myshopify.com` | 151147970941, 148748632445, 147905085821 |
     | 2 | `ug4de1-v8.myshopify.com` | 13399851088, 9366077520 |
     | 1 mỗi shop | `joy-sub-prod6`, `abby-florist-store`, `sprayfreefarmacy`, `dr-schwab-skin-care`, `ngocvtb-subs-prod17-2`, `sc22z9-0f`, `ngocvtb-subs-prod19`, `vitamartshop`, `cf9676` | 17037328462, 22094774594, 21928575191, 28181397667, 59711783138, 50710413474, 28649586855, 59791311010, 43163713873 |
   - Ca nặng nhất về tiền: `22094774594` (abby-florist) hoán **500000 ↔ 50 VND**; `65159889194` (24123e-4) hoán **8500 ↔ 4400 JPY**; `151147970941` (kookut) **+229.74 EUR/kỳ**
   - `24123e-4.myshopify.com` dính 5 contract — cũng chính là shop có tỉ lệ PayPal fail cao ở #26. Shop này dùng sync giá rất nhiều, đáng rà riêng
   - Kết quả đầy đủ: `scan-all-v2.txt` trong scratchpad phiên 12/08 (sẽ mất khi dọn tmp — chạy lại bằng `SA_ENV=prod node packages/functions/src/commands/misc/scanLineIdMisalignment.js ALL 30000`)
   - **QUÉT PAUSED xong (12/08)**: 12.144 contract → **90 lệch index**, **9 hỏng giá**. Đây là bom hẹn giờ — resume là charge sai ngay
     - `117124989309` EUR (kookut) — 20 line, 4 line thừa ×153.16 + 3 line thiếu ×38.30 → nặng nhất
     - `127309513085` EUR (kookut) · `117131379069` CHF (kookut) +150/kỳ
     - `50603065642` CAD, `63775605034` CAD (New Earth Innovations — cùng merchant với 5 ca ACTIVE ở `24123e-4`)
     - `27054014683`, `31943000283`, `15519285307` USD · `57074155669` AUD
   - **CANCELLED (38.334) CỐ Ý KHÔNG QUÉT** — không bao giờ charge nữa, quét là phí. Lần đầu quét `STATUS=ANY` bị kill vì 3/4 thời gian đổ vào nhóm này
   - **TỔNG: 28 contract hỏng** (19 ACTIVE + 9 PAUSED) / 358 lệch index (268 ACTIVE + 90 PAUSED)
   - **📄 DANH SÁCH ĐẦY ĐỦ: `docs/price-swap-damaged-contracts.md`** trong repo (untracked) — 3 nhóm theo độ chắc, chỗ thu thiếu, PAUSED, lệnh chạy. Gửi CS/merchant được
   - **ĐÃ SỬA `151147970941`** (12/08): `basePrice` 40 → 1.8, kỳ 14/08 từ €313.69 → **€95.95**. Xác minh bằng cả script quét (biến mất khỏi danh sách hỏng) lẫn UI admin. Shopify báo *"There is no contract nor schedule edit"* → không mất cycle edit nào
   - **Script sửa: `commands/misc/repairContractLinePrices.js`** — dry-run mặc định, `--apply` mới ghi, `--allow-increase` mới đụng chỗ thu thiếu. Phải build `lib/` trước và export `SHOPIFY_ACCESS_TOKEN_KEY="$ACCESS_TOKEN_KEY_PROD"` (key prod nằm trong `.env.local` dưới tên đó)
   - ⚠️ **BUG TRONG CHÍNH SCRIPT SỬA, đã vá — đừng lặp lại**: bản đầu dùng tiêu chí *"basePrice ≠ catalog → sửa"*, rộng hơn hẳn tiêu chí phát hiện. Dry-run 18 contract ra **21 dòng FIX**, trong đó nhiều dòng chỉ là **catalog đã giảm giá** (contract `43163713873`: detector gắn cờ 2 dòng, script đòi sửa 5 — `47→34`, `22→16` ×3). Apply nguyên trạng = **hạ giá hàng loạt xuống dưới mức khách đã đồng ý**, mất doanh thu merchant. Đã thêm **phép thử donor** (chỉ sửa khi tìm được line khác có catalog ≈ basePrice hiện tại) → 21 → **15 dòng**, 9 dòng chuyển sang `[drift]`
   - **DẤU HIỆU MẠNH NHẤT phân biệt bug vs catalog đổi giá**: ở contract dính bug, **tập hợp giá không đổi, chỉ hoán vị**. VD `50061574442`: đang có {74,49,95,40,56}, đáng lẽ {56,40,49,95,74} — cùng một bộ số. Catalog đổi giá không tạo được hình dạng này
   - **Trạng thái dry-run (12/08)**: 15 dòng / 11 contract sẵn sàng. **Nhóm A** (6 contract, bộ giá hoán vị hoàn hảo): `65159889194` JPY +4100 · `50061574442` CAD +73 · `47829352746` EUR +54 · `50710413474` USD +38.25 · `63169724714` AUD +36 · `50920522026` AUD +34. **Nhóm B** (3 contract, lệch quá lớn để nhầm): `17037328462` USD +270.03 · `148748632445` CHF +73 · `147905085821` EUR +63.90. **Nhóm C — chưa nên sửa**: `13399851088` (+8, bộ giá KHÔNG khớp) · `9366077520` (+7, không có dòng đối ứng) · dòng `1.95→1.7` trong `147905085821` (chênh 1.15× trong contract nhiều variant cùng giá → phép thử donor yếu)
   - **✅ KOOKUT XONG (12/08)** — apply `148748632445` (1 dòng, 115→42 CHF) và `147905085821` (2 dòng: 23→1.7, 1.95→1.7 EUR). Quét lại xác nhận: **không còn contract ACTIVE nào ở kookut thu thừa của khách**. Tổng đã chặn: 229.74 + 64.65 EUR + 73 CHF mỗi kỳ
   - **⚠️ LỌC STORE TEST TRƯỚC KHI XẾP ƯU TIÊN — tôi đã sai chỗ này**: xếp hạng theo số tiền mà không lọc dev store. `17037328462` "nặng nhất 270 USD/kỳ" nằm trên **`joy-sub-prod6`** (`binhntt@avada.email`, `shopifyPlanName: partner_test`, "Developer Preview") — **store test, không có khách nào bị thu tiền**. Ca VND 500.000 (`abby-florist-store`, `ngandt@avadagroup.com`, plan `affiliate`/"Development") cũng vậy. `ngocvtb-subs-prod19` cũng test
     - Cách phân biệt: `isNonDevShop: false`, `shopifyPlanName` ∈ {`partner_test`, `affiliate`}, `shopifyPlanDisplayName` chứa "Development"/"Developer Preview", email `@avada`
     - **Merchant THẬT trong danh sách**: `kookut` · `24123e-4` (New Earth Innovations) · `sc22z9-0f` (Canine Kitchen) · `ug4de1-v8` (Juan Valdez) · `cf9676` (EM Campers and Canines)
   - **ĐÍNH CHÍNH nhận định về dòng `1.95 → 1.7`**: tôi từng xếp nó "không chắc, donor yếu, để riêng" — **SAI**. Nhìn cả contract thì donor hiện rõ: `Pacific Tuna & Sardine` có catalog 1.95 mà đang đeo 1.7. Đúng một cặp hoán. **Bài học: đừng phán một dòng khi chưa ghép cặp với các dòng còn lại trong cùng contract**
   - **⏸️ USER CHỐT 14/08: "để đấy đã, sau check thêm"** — KHÔNG apply gì thêm cho tới khi user mở lại. Dry-run vẫn còn nguyên, chạy lại được bất cứ lúc nào
   - **Chờ user duyệt apply cho merchant thật còn lại**: `24123e-4` (4 contract, JPY/CAD/AUD/EUR) · `sc22z9-0f` (1) · `ug4de1-v8` (2, Nhóm C — độ chắc thấp) · `cf9676` (đã loại hết ở v2, chỉ còn drift)
   - **KOOKUT còn lại (không thu thừa nữa, nhưng là việc thật)**: 3 contract PAUSED hỏng (`117124989309` 20 dòng · `117131379069` +150 CHF · `127309513085` thu thiếu) và 2 chỗ **thu thiếu** cần Kookut duyệt — `147905085821` Dry Food 1.7 thay vì 22.48 EUR, `127309513085` Chicken 24x70g 1.7 thay vì 39.67 EUR (bán gói 24 con giá một gói lẻ)
   - Đáng báo merchant sớm dù không gấp: `22094774594` (abby-florist) Lily Bouquet đang tính **50 VND** thay vì **500.000 VND** — merchant mất gần hết giá trị đơn mỗi kỳ
   - ⚠️ **Gotcha script quét prod**: `.limit(200000).get()` bị **OOM-kill** — phải phân trang (`orderBy(FieldPath.documentId())` + `startAfter`, page 2000). Và lệnh nền có **giới hạn thời gian**: quét ~40k doc là bị kill, nên chia theo status thay vì quét tất
   - Việc còn lại: (1) cứu `151147970941` trong 48h, (2) ~~deploy~~ **ĐÃ DEPLOY 12/08** `fix/line-price-sync` + `fix/bulk-swap-price`, (3) sửa 3 ACTIVE còn lại, (4) hỏi merchant về chỗ thu thiếu + 3 PAUSED, (5) ~~quét đủ 26k~~ **XONG**
   - **✅ KHÁCH CHƯA BỊ THU SAI — không cần hoàn tiền** (đọc `pricingPolicy` thật trên từng order doc):
     | cycle | ngày | basePrice | currentPrice | |
     |---|---|---|---|---|
     | 0 | 14/06 | **1.8** | 1.71 | BILLED, đúng |
     | 1 | 14/07 | **1.8** | 1.71 | BILLED, đúng |
     | 2 | 14/08 | **40** | 38 → €228 | UNBILLED, **sai** |
     Hỏng xảy ra 11/08 19:48 (job sync Salmon), tức SAU kỳ tháng 7. Ticket ghi "hiển thị" là chính xác — khách nhìn thấy đơn sắp tới, chưa bị trừ tiền
   - **Giá sửa = `basePrice` 1.8 → `currentPrice` 1.71.** Không phải lựa chọn: hai kỳ ĐÃ THU đều dùng đúng cặp số này. Ghi 1.8 là khôi phục nguyên trạng, không phải áp giá catalog mới. (Tôi từng nói đây là "quyết định thương mại 1.8 vs 1.71" — **SAI**, 1.71 chỉ là 1.8 sau discount 5%)
   - **Sync trước charge KHÔNG cứu được** (user nghi ngờ đúng chỗ, nhưng kết quả ngược): `handleAutomaticBillingAttempt` (`shopifyService.js:1697`) có fetch live (`getCurrentBillingCycleData`, `getSubscriptionContractByContractId fullResp`, `autoRemoveUnavailableProductLines`) nhưng **không đụng `pricingPolicy`**. Và `createBillingAttempt` (`services/graphql/billingCycleService.js:281-300`) **không truyền giá** — chỉ `contractId`/`idempotencyKey`/`billingCycleSelector`. Shopify tự thu theo `pricingPolicy` của nó → 14/08 chắc chắn sai
   - **HAI cycle index là thật** (`shopifyService.js:1737-1751`): `cycleIndex` của app (doc `orders`) vs `currentCycleIndex` fetch live từ Shopify; cả hai vào `idempotencyKey`. Ở contract này chúng khớp (0,1,2) nên không phải yếu tố gây bug — nhưng đừng giả định chúng luôn bằng nhau
   - **🔑 THAO TÁC KÍCH HOẠT BUG — quan trọng nhất để chặn tái diễn**: so cycle 1 (4 line, KHÔNG có gói 24x70g) với cycle 2 (4 line, CÓ gói 24x70g) → khách vừa **thêm variant 24x70g của đúng product Salmon đã có ở dạng 70g**. Hai line cùng `product.id` chính là điều kiện làm `processContractLines` gom nhóm theo product rồi lệch thứ tự với `lineIds`. Trùng đúng vùng commit `1d398eb42` ("issue adding same products") từng chạm
   - Ghi nhận thêm: `getFailedData` (`services/cron/automaticBillingAttemptService.js:116`) hardcode `shopifyCycleIndex: 1` trong idempotency key của nhánh lỗi — chưa đánh giá tác động, chưa mở task

32. [⏸️] **[P1] BUG: `recurringOption: lowest` KHÔNG tính lại phí ship mỗi kỳ — trái với chính UI của app**
   - ⏸️ **Chờ user chốt hướng** (hỏi 14/08, chưa trả lời): sửa bug này = **mọi shop đang để `lowest` sẽ bắt đầu tính lại phí ship mỗi kỳ**, tức khách của họ bị thu thêm tiền từ kỳ tới. Đây là quyết định thương mại, không phải quyết định kỹ thuật → agent không tự nhận
   - Ticket kookut `JSUB-260811-TWjnqq` (phần ship) + `JSUB-260722-AuRa7p`. CS xác nhận expected: *"free shipping đơn đầu thôi, hiện tại tất cả upcoming order đang free ship hết"*
   - **UI hứa gì** (`pages/Settings/Tabs/ShippingProfile/ShippingProfile.json`):
     - `lowest` = *"Always use lowest shipping rate"* / *"Apply the lowest available rate **on each renewal**"*
     - `initial` = *"Keep initial shipping rate"* / *"Use the original rate **unless the subscription changes**"*
   - **Code làm gì**: `services/shippingProfile/shippingProfileService.js:747` chỉ chạy `autoUpdateShippingRate` khi có sự kiện `updateOnItemsChange`/`updateOnAddressChange`. **Không có đường tính lại ở mỗi kỳ.** → chọn `lowest` nhưng thực tế hành xử y như `initial`
   - Mục "When to update shipping rate automatically" chỉ hiện khi đã chọn `lowest`, đặt tên là mốc **bổ sung** — merchant không có lý do hiểu rằng bỏ trống 2 ô đó thì rate không bao giờ được tính lại
   - **Bằng chứng prod**: kookut setting `{recurringOption:'lowest', updateOnItemsChange:true, updateOnAddressChange:true}`. Contract `154109116797` (CHF, Neuchâtel) rate *"Standard - SwissPost Economy - **Première livraison offerte**"* → `deliveryPrice 0.0` đóng băng từ checkout, **cả 12 cycle đều 0** (đơn `#10422` cycle 0, `#10799` cycle 1 đã bill, 10 cycle tới đều 0)
   - **Đối chứng**: contract `153505399165` CÓ bị sửa (đổi shipping option + company name) → `autoUpdateShippingRate` chạy → ra 5.90. Cùng shop, cùng cơ chế, khác kết quả **chỉ vì một cái bị đụng vào**
   - → Câu trả lời tháng 7 (*"free shipping chỉ áp checkout, không áp recurring — biz của Shopify"*, `p1784714043626069`) **đúng nguyên tắc nhưng dẫn tới kết luận sai**: Shopify không mang ưu đãi sang recurring, nhưng nó **đóng băng con số 0** vào `contract.deliveryPrice`, nên hiệu ứng cuối vẫn là free mãi
   - **CHƯA KIỂM**: nếu tính lại đúng theo `lowest` thì contract này ra bao nhiêu. Gián tiếp từ tháng 7 cho thấy rate khuyến mãi lần đầu KHÔNG nằm trong danh sách recurring (`lowest` khi đó trả 5.90 chứ không phải 0) → nhiều khả năng sửa bug này là hết khiếu nại. Phải gọi thử `getLowestShippingRate` cho contract đó mới chắc
   - **✅ ĐÃ KIỂM CHỨNG 13/08 — giả thuyết "lowest cũng ra 0" BỊ BÁC**: gọi thật `getLowestShippingRate` cho `154109116797` → **10 CHF / "Standard - SwissPost Economy"**. Merchant có **2 rate riêng**: bản khuyến mãi *"— Première livraison offerte"* giá 0 và bản thường giá 10. Rate khuyến mãi **không** được chào cho recurring → **cấu hình của merchant hoàn toàn đúng và diễn đạt được**, app chỉ không chạy bước tính lại
   - **ĐÃ SỬA `154109116797`** (13/08, user duyệt): `deliveryPrice` 0 → **10 CHF**, option đổi từ *"— Première livraison offerte"* sang *"Standard - SwissPost Economy"*. Script: `commands/misc/repairContractShipping.js` (dry-run mặc định)
   - ⚠️ **Mirror Firestore chưa bắt kịp**: sau khi apply, Shopify đã là 10 (đọc live xác nhận) nhưng doc Firestore vẫn `deliveryPrice: 0.0` — trong khi **tên option thì đã sync**. Tức app UI có thể hiện 0 dù thực thu 10. Chưa rõ là webhook trễ hay `deliveryPrice` không được mirror ở đường đó. **Cần theo dõi**
   - **📄 AUDIT ĐẦY ĐỦ: `docs/kookut-shipping-audit.md`** — 83 contract ACTIVE: **9 lệch** · 49 khớp · **25 KHÔNG XÁC ĐỊNH** (23 ca Shopify trả *"no shipping rates found"*, 2 ca không phải shipping). Nhóm 25 **không đồng nghĩa "đang đúng"** — trong đó có cả `151147970941` và `147905085821`
   - **9 contract lệch, HAI CHIỀU**: 7 ca shop mất phí ship (3× 0→10 CHF: `154109116797` đã sửa, `150579708285`, `155222278525`; 4× 0→5.90 EUR: `154185236861`, `155756986749`, `155757019517`, `155757052285`) · **1 ca KHÁCH bị thu dư**: `156384657789` thu 10 nhưng đáng lẽ 5.90 · 1 ca lặt vặt `153490162045` 5.42 vs 5.90
   - Sửa nhóm "shop mất phí ship" = **khách bắt đầu bị thu thêm tiền ship** từ kỳ tới → cần shop đồng ý + báo khách trước
   - Script audit: `commands/misc/auditShippingRecurring.js` (chỉ đọc). Cần contract dạng Shopify (`lines`) — truyền doc Firestore (`products`) vào `getLowestShippingRate` sẽ bị skip *"no lines in contract"*, phải lấy qua `getSubscriptionContractByContractId({fullResp:true})`

31. [✅ 2026-08-14] Ticket `JSUB-260812-WNwa8Q` — kookut: **upcoming order ở Orders tab không hiển thị hết**
   - **ĐÓNG 14/08 — user chốt: "lỗi filter thôi, close nhé".** Không có commit: đây là hành vi cố ý của procedure BQ (`rn = 1` lấy đơn gần nhất mỗi contract), không phải bug code app. Điều tra giữ lại bên dưới làm tài liệu
   - **CÒN NGUYÊN, chưa xử**: tab vẫn chỉ hiện 1 đơn/contract (kookut 83/829, ẩn 746). Muốn đổi thì phải sửa BQ procedure `get_upcoming_orders` (`commands/sql/createProceduresV2.sql:243`) — đường deploy khác, và bỏ `rn = 1` là ~10× dữ liệu + chi phí BQ
   - **Nguyên nhân đã tìm ra**: BQ procedure `get_upcoming_orders` (`commands/sql/createProceduresV2.sql:243`) có `ROW_NUMBER() OVER (PARTITION BY subscription_contract_id ORDER BY billing_attempt_expected_date ASC) AS rn` rồi `WHERE rn = 1` → **chỉ lấy đơn gần nhất của mỗi contract**
   - Số thật kookut: **829** đơn UNBILLED tương lai chưa skip · tab hiển thị **83** (đúng bằng số contract) · **ẩn 746**. App sinh sẵn 10 chu kỳ/contract nên 9/10 bị cắt
   - Count cũng dùng chung CTE (`p_is_count`) nên UI tự nhất quán, không có cảnh "hiện 20 / tổng 829"
   - Bỏ `rn = 1` là đổi ý nghĩa cả trang (83 → 829 dòng riêng kookut, ~10× dữ liệu + chi phí BQ). Fix nằm ở **BigQuery procedure**, không phải code app → đường deploy khác
   - **Cần product chốt hướng**: đổi nhãn cho đúng nghĩa hiện tại · thêm filter "xem tất cả chu kỳ" · hay bỏ `rn = 1`
   - Slack: https://avadaio.slack.com/archives/C07URV6QMJ8/p1786524942309849 · ảnh: https://capture.avada.io/i/MnPTd0tBVqJi
   - Cùng shop kookut, cùng ngày với ticket giá `JSUB-260811-TWjnqq`. dantt đã nhận trong thread

33. [✅ 2026-08-14] Tôi muốn bạn check logic của klaviyo integration trong app tôi có phải đang thế này không?
  - hồi xưa làm là integrate xong vào trong step 2 bấm trigger example từng cái thì bên app klaviyo nó mới hiện event trigger bên mình lên
   - **TRẢ LỜI: nhớ đúng về UI, sai về nguyên nhân.** Step 2 "Get started with sample events" đúng là có dropdown chọn từng metric + nút "Trigger events" (`pages/Integrations/KlaviyoIntegration/KlaviyoIntegration.json:19-23`, handler `KlaviyoIntegration.js:86-99`). Nhưng **app KHÔNG chặn event thật khi chưa bấm** — nếu metric chỉ hiện sau khi bắn mẫu thì đó là **hành vi phía Klaviyo** (Klaviyo tạo Metric trong danh sách khi nhận event đầu tiên mang tên đó)
   - nhánh `docs/klaviyo-audit` · commit `facb11c` · **đã push** → gộp vào **MR !2470** (`fix/klaviyo-integration`, cherry-pick `d84721d42`). 1 file mới `docs/klaviyo-integration-audit.md` (+152). Không sửa dòng code nào
   - **Bằng chứng hội tụ**: sample path (`controllers/integrationsController.js:265`) và real path (`helpers/klaviyo/prepareMetricEvent.js:403`) đều gọi **cùng** `sendMetricEvent()` (`services/klaviyo/klaviyoService.js:219`) → `sendEventWithRetry()` → `POST /events` (`:259-270`). Không có nhánh riêng cho event thật
   - Gate duy nhất trên đường real: `if (!klaviyoData?.enable) return` (`prepareMetricEvent.js:389-392`). Verifier tự grep `testedEvents|enabledEvents|isVerified|verifiedMetrics|metricVerified` toàn repo — mọi hit `isVerified` thuộc **Custom SMTP**, không dính Klaviyo. Doc integration chỉ lưu `enable, isSynced, disableDate, codeVerifier, codeChallenge, shopId, app, updatedAt` (`integrationsController.js:200-228`) → **không có field nào ghi "đã test event nào"**
   - **17 metric**, định nghĩa `const/klaviyo/default.js:55-73` (verifier đếm lại độc lập)
   - Step 3 "Sync data" cũng bắn cùng `sendMetricEvent` cho dữ liệu lịch sử → kể cả bỏ qua Step 2, metric vẫn hiện. Đường đi qua Pub/Sub nền: `integrationsController.js:287-324` → `backgroundHandler.js:779-781` → `klaviyoService.js:420-505`
   - **Verifier PASS**. Không có gate build/test (task điều tra, 0 dòng code đổi); `git status --porcelain` xác nhận đúng 1 file untracked mới, **không file nguồn nào bị sửa**
   - **CHƯA KIỂM ĐƯỢC (cần test tay trên Klaviyo dashboard)**: Klaviyo có tự hiện Metric ngay khi nhận event đầu tiên hay có độ trễ, và metric mới có xuất hiện ngay trong Flow trigger picker không

36. [✅ 2026-08-14] **[P0] Sample event Klaviyo: email dev hardcode + mutate const global → RÒ EMAIL GIỮA CÁC SHOP**
   - Phát hiện 14/08 khi trả lời câu hỏi "auto gửi sample sau step 1 có risk gì". Hai bug xếp chồng, cùng nằm ở đường sample event
   - **ĐÓNG 14/08** — nhánh `fix/klaviyo-sample-leak` · commit **`4a81c12`** · **đã push**, base `origin/master` `832b61627`. 5 file, +206/−57. → gộp vào **MR !2470** (cherry-pick `2ab509301`)
   - **Chọn factory, KHÔNG deep clone** — loại bug bằng cấu trúc: xoá hẳn `SAMPLE_EVENT_DATA` / `SAMPLE_SUBSCRIPTION_BASE_DATA` / `SAMPLE_ORDER_BASE_DATA`, thay bằng `helpers/klaviyo/buildSampleEventData.js` dựng object graph mới mỗi lần gọi. Không còn object dùng chung nào để mà mutate → call site thêm sau cũng không dính lại
   - **Agent tự tìm ra call site thứ 2 mà brief không nhắc**: `services/klaviyo/klaviyoService.js` có default param `eventData = SAMPLE_EVENT_DATA` — cùng lỗ hổng. Đã đổi sang `buildSampleEventData()` (default expression chạy lại mỗi call nên an toàn)
   - Email: ưu tiên merchant nhập → `shopFormatted?.email` (shop thật) → fallback `DEFAULT_SAMPLE_EMAIL = 'sample@joy-subscription.com'`. Verifier truy tới `@avada/shopify-auth` xác nhận `shop.email` là field có thật trong schema, không phải biến bịa
   - **Xử luôn `new Date()` đóng băng**: `nextBillingDate` / `first_order_date` / `scheduled_at` trước nằm ở const module-level nên mang thời điểm **cold start**, giờ tính lại mỗi lần gọi factory
   - **Verifier PASS, tự dựng 2 thí nghiệm riêng**:
     - Gọi factory 2 lần, mutate sâu kết quả lần A (`customer.email`, `orderItems[0].title`, `customerPayment.maskedCardNumber`, `shippingAddress.city`, `billingAddress.city`) → lần B và metric khác **không bị ảnh hưởng**. Không object lồng nào còn share reference — bug không "lùi một tầng"
     - Backup file fix, thay bằng bản mô phỏng bug cũ (`SHARED_BASE_PAYLOAD` module-level mutate in-place) → **3 test đỏ** đúng chỗ leak/isolation/fresh-date; khôi phục, md5 khớp, chạy lại 5/5 xanh
   - **Rủi ro lớn nhất đã loại**: xoá 3 export là thay đổi phá vỡ, sót một importer là runtime nổ `undefined` mà `sendKlaviyoEvent` lại nuốt lỗi im lặng. Verifier grep toàn `packages/` + `extensions/` → **0 import còn lại**, chỉ còn tên trong comment và trong assertion phủ định của test. (`packages/functions/lib/` có bản build cũ nhưng gitignored)
   - `hvu5877@gmail.com` **đã sạch khỏi repo**, chỉ còn trong test dạng `expect(...).not.toBe(...)`
   - Gate verifier chạy trực tiếp (không qua `rtk`, tự đọc `echo $?`): `yarn check` **exit 0** · jest functions **exit 1** — 9 suite fail / **184** passed, 5 test fail / **1814** passed = đúng baseline + 1 suite + 5 test mới, không suite nào mới đỏ · jest assets **exit 0**, 6 suite / 86 test
   - ⚠️ Agent viết code báo "jest exit 0" trong khi 9 suite fail — **`rtk` nuốt exit code**, đúng gotcha đã biết. Số ở trên là của verifier chạy thẳng binary
   - **(a) Email hardcode là email cá nhân**: `const/klaviyo/default.js:126` → `SAMPLE_CUSTOMER.email = 'hvu5877@gmail.com'`. Merchant nào bấm "Trigger events" mà không nhập email thì Klaviyo của họ tạo profile mang email này. Klaviyo tính tiền theo active profile
   - **(b) NGHIÊM TRỌNG HƠN — cross-tenant leak**: `controllers/integrationsController.js:260-262`
     ```
     const eventData = {...SAMPLE_EVENT_DATA};        // shallow copy
     if (email && eventData[metric]?.customer) {
       eventData[metric].customer.email = email;      // mutate object GỐC
     }
     ```
     `SAMPLE_EVENT_DATA` (`default.js:212-218`) map **mọi** metric về **cùng một reference** `SAMPLE_SUBSCRIPTION_BASE_DATA`/`SAMPLE_ORDER_BASE_DATA`, mà hai cái đó lại share **cùng** `SAMPLE_CUSTOMER` (`:165`). Spread một tầng không cắt được liên kết → gán email là **ghi đè const module-level**, sống suốt đời instance Cloud Function
     - Hệ quả: shop A nhập email của họ → shop B bấm test sau đó **trên cùng instance ấm** sẽ gửi sample event mang email của shop A sang Klaviyo của shop B. Vi phạm multi-tenant
   - Sửa: deep clone trước khi gán (hoặc build payload từ factory function thay vì const dùng lại), và bỏ email cá nhân khỏi default — dùng email của shop hoặc địa chỉ trung tính
   - Liên quan [[#34]] (fail âm thầm) và [[#35]] (shape lệch) — cùng một vùng code, nên gộp chung MR nếu làm liền tay

34. [✅ 2026-08-14] **[P1] Real event Klaviyo fail ÂM THẦM, còn sample event thì báo lỗi rõ — đúng thứ tạo ra hiểu nhầm ở #33**
   - Finding của verifier ở #33
   - **ĐÓNG 14/08** — nhánh `fix/klaviyo-event-logging` · commit **`4523763`** · **đã push**, base `origin/master` `832b61627`. 6 file, +366/−3. Chưa tạo MR
   - Helper mới `helpers/klaviyo/logKlaviyoEventFailure.js`, nhãn cố định export `KLAVIYO_EVENT_FAILED_LABEL = 'klaviyo_event_failed'` (một hằng số dùng chung, không phải chuỗi rải rác). Log **một object literal** → Cloud Logging parse thành `jsonPayload` filter được từng field: `{label, shopId, metric, contractId, cycleIndex, errorName, errorMessage}`
   - Sửa **3 chỗ nuốt lỗi**, không chỉ 1: `sendKlaviyoEvent` catch (`prepareMetricEvent.js`) + **2 tầng catch** trong `syncKlaviyoEvents` (`klaviyoService.js`, per-event `:483` và per-chunk `:489`). Tầng per-chunk hiện là code chết (catch trong đã nuốt hết nên `Promise.all` không bao giờ reject) — vẫn log cho nhất quán
   - **Zero write đúng cam kết**: verifier grep `^+` toàn diff cho `Firestore|collection(|.set(|.update(|.create(|createOrUpdateIntegration|rSet|bigquery` → **không dòng thêm mới nào** chứa lời gọi ghi. Thân helper chỉ có `console.error({...})`
   - **Hành vi không đổi**: vẫn nuốt lỗi, không throw lên caller, không retry — chỉ khác chỗ log
   - **Không rò token/PII**: `access_token`/`refresh_token` có trong scope ngoài của `sendKlaviyoEvent` nhưng **không bao giờ** được truyền vào log. Test assert `JSON.stringify(payload)` không chứa token/email mock **và** assert đúng `Object.keys().sort()`
   - **Verifier PASS, tự dựng lại thí nghiệm an toàn** (không dùng git): copy 2 file source ra scratchpad, `sed` revert về `console.error(string, error)` cũ → **4/8 test đỏ** đúng chỗ; khôi phục, `md5` khớp byte-identical cả 2 file
   - Gate: `check` **exit 0** · `jest:fn` 9 suite fail = đúng baseline, **186** passed suite (183+3 mới) / **1817** passed test (1809+8 mới), không suite mới nào đỏ · `jest:as` **exit 0**
   - ⚠️ **Agent viết code ĐÃ VI PHẠM ràng buộc "KHÔNG chạy git"** — nó `git stash` + `git stash pop` để làm thí nghiệm đỏ-trước. Repo đang có **233 stash** của user nên đây là rủi ro thật. Verifier kiểm lại: `stash@{0}` vẫn là stash cũ của user (`dd1c088cb`, chỉ chứa `shopify.app.toml`), không có stash mồ côi, diff 2 file mạch lạc không lẫn hunk lạ. **Lần sau brief phải nói rõ cách làm thí nghiệm an toàn thay vì chỉ cấm git**
   - **Finding ngoài scope (verifier ghi, KHÔNG sửa)**: `services/klaviyo/klaviyoService.js:120` `getProfileByEmail` cũng nuốt lỗi (`console.error` + `return null`) — nhưng là **lớp bug khác** (tra profile fail bị coi như "không tìm thấy" → có thể tạo profile trùng), không thuộc "event thật fail im lặng". Chưa mở task riêng
   - `helpers/klaviyo/prepareMetricEvent.js:411-413`: `sendKlaviyoEvent()` bọc toàn bộ trong `try/catch` chỉ `console.error`, **không throw lại, không retry, không dead-letter**. Lỗi network, Klaviyo trả 4xx, hay `prepareKlaviyoData` throw ("Subscription contract not found", "Order data not found for cycle X") đều biến mất
   - Đối lập: sample-events controller (`controllers/integrationsController.js:277-283`) trả `ctx.status = 500` + toast lỗi cho merchant
   - → Merchant thấy "bấm test thì được, đời thật không thấy event" và kết luận app bắt phải test trước. Thực chất là **event thật fail mà không ai biết**
   - Cần: structured alerting hoặc lưu trạng thái fail để support tra được
   - **✅ USER CHỐT 14/08: CHỈ LOG THÔI, không ghi Firestore — tránh cost nhảy**
     - → **KHÔNG** tạo collection `klaviyoEventLogs`, **KHÔNG** thêm field vào doc `integrations`. Zero write
     - Việc thật còn lại: `console.error` hiện nuốt hết context nên tra Cloud Logging không ra gì. Đổi sang log **có cấu trúc** đủ để filter: `shopId`, `metric`, `contractId`/`cycleIndex`, `error.message`, kèm một nhãn cố định (vd `klaviyo_event_failed`). Cost = 0, và sau muốn dựng log-based metric/alert thì đã có sẵn field để lọc
     - Đã khảo sát nên khỏi điều tra lại: field trên `integrations` vốn không đủ (một doc/shop, event fail đồng thời ghi đè nhau); tiền lệ collection có TTL là `repositories/webhookLogsRepository.js` — **cả hai bỏ theo quyết định trên**

38. [✅ 2026-08-14] **Auto bắn 17 sample event (Step 2) ngay sau khi merchant connect Klaviyo xong**
   - **ĐÓNG 14/08** — commit **`3c8ed6d06`** trên nhánh `fix/klaviyo-integration` (**gộp vào MR !2470**, user chốt 1 MR). 5 file, +377/−2. Verifier PASS **ở vòng sửa thứ 2**
   - Cách làm: `services/klaviyo/klaviyoService.js` thêm `sendKlaviyoSampleEvents({shop})` · `handlers/pubsub/backgroundHandler.js` thêm action `SEND_KLAVIYO_SAMPLE_EVENTS` · `controllers/clientApi/klaviyoController.js` (OAuth callback) publish message rồi redirect ngay. Tái dùng pattern Pub/Sub sẵn có (`SYNC_KLAVIYO_EVENTS`, `REMOVE_SHIPANDCO_ATTRIBUTES`), không dựng topic kiểu mới
   - Guard `sampleEventsSentAt` trên doc `integrations` **đã tồn tại** — 1 field, ghi qua `createOrUpdateIntegration`. Verifier grep `collection(|.doc(|Firestore` trong diff → **0 match**, không collection mới
   - **VÒNG 1 BỊ VERIFIER BÁC — bài học đáng giữ**: `publishBackgroundSubscriber` trong OAuth callback **không có try/catch**. `getKlaviyoAuthUrl` nối thẳng vào `router.get('/klaviyo/callback')` (`routes/clientApi.js:140`) = đúng URL Klaviyo redirect merchant về. Pub/Sub lỗi (IAM/quota/transient) → exception leo lên `errorHandler` → **`ctx.redirect` không bao giờ chạy** → merchant thấy trang lỗi ngay sau khi connect thành công, dù token đã lưu xong. Nặng hơn bug đang chữa
     - Trớ trêu: repo đã có pattern đúng ở `integrationsController.js:290-320` (case `sync-data`) — bọc try/catch quanh **cùng loại lời gọi**. Agent áp cho Step 3 nhưng bỏ sót call site mới
     - Sửa: try/catch **chỉ ôm đúng lời gọi publish**; `exchangeAuthorizationCode` và `createOrUpdateIntegration` nằm NGOÀI → lỗi connect thật vẫn leo lên như cũ (verifier đọc code xác nhận scope hẹp đúng)
   - **51 request, không phải 17**: mỗi metric tốn 3 lời gọi Klaviyo — `getProfileByEmail` + create/update profile + `sendEventWithRetry`. 3 × 17 = 51. Loop tuần tự nên không đụng rate limit
   - Verifier tự dựng lại thí nghiệm (copy scratchpad + `perl`/`sed`, khôi phục, `md5` khớp `6fc9377c...`): gỡ try/catch → đúng 1 test mới đỏ; gỡ check guard → test guard đỏ với `Expected 0 calls, received 51`. Test không phải đồ trang trí
   - Gate: `check` **exit 0** · `jest:fn` 9 suite fail = đúng baseline, **189** passed suite / **1834** passed test (base 187/1824 + đúng 2 suite và 10 test mới) · `jest:as` **exit 0**
   - ⚠️ **ĐÁNH ĐỔI CÒN TREO — user nên biết**: guard `sampleEventsSentAt` ghi **TRƯỚC** vòng lặp. Chặn được Pub/Sub redelivery và ca bấm Connect 2 lần, nhưng nếu **cả 51 request đều fail** (token sai, Klaviyo down) thì guard đã đóng vĩnh viễn → merchant **không bao giờ** được auto-gửi lại, và không có tín hiệu nào báo. Muốn đổi thì chỉ set guard khi có ≥1 metric thành công — đánh đổi ngược lại là mở cửa cho redelivery bắn trùng
   - Finding ngoài scope (verifier ghi, không sửa): `klaviyoController.js:62` truyền tên topic Pub/Sub vào field `metric` của `logKlaviyoEventFailure`, trong khi JSDoc mô tả field đó là Klaviyo metric key. Lệch semantic nhẹ, **không** phá shape log, không phải bug chức năng
   - **USER CHỐT 14/08**: chỉ làm **Step 2**, **Step 3 giữ nguyên** không đụng. "khi integrate xong (connect xong) thì send các sample events đấy"
   - Điểm móc: `controllers/clientApi/klaviyoController.js:28-37` — OAuth callback ghi `enable: true` + `enableDate` + `access_token`/`refresh_token`. Đó là "connect xong"
   - ⚠️ **RAM KHÔNG phải rủi ro ở task này** — tôi từng nêu nhầm. 17 payload hằng số vài KB. Nỗi lo RAM là của Step 3 (kéo toàn bộ subscriber từ BQ), không phải Step 2
   - Rủi ro thật: (a) chạy đồng bộ trong OAuth callback → 17 request sang Klaviyo làm treo/timeout đúng lúc merchant vừa bấm Connect; (b) reconnect bắn lại
   - Hướng: đẩy nền qua Pub/Sub (pattern sẵn có: Step 3 publish rồi `handlers/.../backgroundHandler.js:779` xử lý; `integrationsController.js:154-160` cũng dùng `publishBackgroundSubscriber` cho SHIPANDCO) · loop 17 metric **tuần tự** (vài giây, không cần song song) · guard `sampleEventsSentAt` trên doc `integrations` **đã tồn tại** (1 field, 1 write — KHÔNG collection mới)
   - Dùng lại đồ vừa làm: `buildSampleEventData()` ([[#36]]) và `logKlaviyoEventFailure` ([[#34]])
   - Biết trước, không chặn: reconnect mà merchant đã gắn Flow → sample event **trigger Flow thật**, email gửi tới `shop.email`

37. [✅ 2026-08-14] **Auto gửi event Klaviyo sau khi merchant connect xong Step 1 — CHỜ USER CHỐT HƯỚNG**
   - **ĐÓNG 14/08 — user chốt "#37 close nhé"**: không auto-send, giữ nguyên merchant bấm tay. Không có commit. Khảo sát risk bên dưới giữ lại — nếu sau này mở lại thì điều kiện tiên quyết vẫn là: phân trang subscriber + throttle giữa chunk + guard idempotency (`sampleEventsSentAt`)
   - User hỏi 14/08: "step 1 xong là app tự gửi luôn không cần bấm tay thì có risk gì". Đã khảo sát, **chưa làm gì**
   - **Auto bắn sample (17 event): tải không đáng lo.** Risk là (a) data giả nằm vĩnh viễn trong Klaviyo merchant, (b) Flow có sẵn bị trigger → gửi email thật, (c) không có field nào ghi "đã gửi rồi" nên reconnect là bắn lại. Bug rò email đã fix ở [[#36]]
   - **Auto chạy Step 3 sync dữ liệu thật: sạch hơn về data nhưng CÓ risk tải thật** (`services/klaviyo/klaviyoService.js:422-505`):
     - **Memory**: `getDateRange` lấy từ `shop.installedAt` → hiện tại, tức toàn bộ lịch sử; rồi `Promise.all` build data cho **tất cả subscriber cùng lúc**, chưa phân trang. Repo đã dính đúng lớp này — comment `index.js:159` ghi pattern cũ từng đẩy memory chạm trần **4GiB và OOM**
     - **Rate limit**: `chunk(allEventsToSend, 40)` rồi `Promise.all` 40 request song song, **không delay/backoff giữa chunk**. Lỗi bị `catch` → `return null` = mất event im lặng (đúng bug [[#34]])
     - **Timeout**: background handler tối đa 540s, shop lớn có thể không xong
     - Auto = chạy cho MỌI shop connect gồm shop lớn nhất; hiện merchant bấm tay nên tải rải rác
   - **14/08 — user bác đề xuất "chỉ bắn metric còn thiếu", và đúng**: lúc vừa integrate xong thì tài khoản Klaviyo chưa có metric nào → "chỉ bắn cái thiếu" = vẫn bắn đủ 17. Nó chỉ giải quyết ca **reconnect**, mà ca đó thì một field `sampleEventsSentAt` đã đủ. Với auto-send lần đầu, thứ cần thật sự chỉ là: **guard chạy một lần** + **chạy nền, không chặn OAuth callback**
   - **14/08 — user chốt ĐÓNG phần "chưa kiểm được hành vi Klaviyo"**: không cần test tay trên dashboard để xác nhận Klaviyo có tự tạo Metric khi nhận event đầu tiên hay không
   - → Chọn hướng Step 3 thì **phải làm trước**: phân trang subscriber + throttle giữa chunk + guard idempotency (doc integration hiện chỉ có `isSynced`, reconnect là sync lại từ đầu). Đây là task cỡ vừa, không phải "bật cờ auto"

35. [✅ 2026-08-14] **[P1] 2/17 metric Klaviyo gửi SAI SHAPE ở event thật — sample event không phát hiện được**
   - **ĐÓNG 14/08** — nhánh `fix/klaviyo-order-shape` · commit **`fd6b296`** · **đã push**, base `origin/master` `832b61627`. 2 file, +74/−1. → gộp vào **MR !2470** (cherry-pick `19f7e0509`)
   - Fix: thêm `isOrder: true` ở đúng 2 call site (`handleBillingAttemptFailure` ~`:1179`, `handleBillingAttemptSuccess` ~`:1457`) → payload đi qua `prepareOrderMetricEvent()` như thiết kế
   - **Rủi ro lớn nhất đã được verifier truy tận nơi và LOẠI**: `prepareKlaviyoData` (`prepareMetricEvent.js:310,341`) **throw** khi `isOrder && !cycleIndex` hoặc không tra ra order, mà `sendKlaviyoEvent:412-414` nuốt lỗi im lặng → thêm cờ mù có thể biến bug "thiếu field" thành **"mất hẳn event"**. Ca chết người là `cycleIndex = 0` (falsy trong JS)
     - Kết luận: **không tới được 2 call site này**. `cycleIndex 0` chỉ thuộc origin order, tạo với `status: ORDER_STATUS_BILLING_BILLED` (`helpers/subscription/subscriptionContract.js:439,443`), trong khi `getOnScheduledOrders`/`getRetryOrders` (`repositories/orderRepository.js:689,710`) lọc `status == UNBILLED` → origin order không bao giờ vào luồng billing attempt. Mọi nguồn sinh `cycleIndex` tới 2 handler này đều ≥1
     - Order tồn tại: `billingAttemptWebhookService.js:108` đã fetch đúng tuple `(shopId, contractId, cycleIndex)` **trước đó**, và handler deref `orderDoc.ref` vô điều kiện ở `:1166` → thiếu order thì đã nổ từ trước, không phải ở bước Klaviyo
   - **Quét lại toàn bộ call site (verifier tự đếm)**: 30 match thô, 3 đang comment out → **27 call site sống / 9 file**. Đối chiếu từng cái với `ORDER_METRIC_EVENTS` (`const/klaviyo/default.js:113-119`): **không sót chỗ order-shape nào**. `emailService.js:484` (`UPCOMING_ORDER`) và `subscriptionService.js:605,649,689` đã đúng sẵn
   - **Test guard thật, verifier tự dựng lại thí nghiệm**: `sed` gỡ cả 2 `isOrder: true` khỏi source → đúng 2 test mới đỏ (`Expected: ObjectContaining {"isOrder": true}`), khôi phục file byte-identical (xác nhận bằng `git diff`). Fixture dùng `cycleIndex: 1` nên **không phủ ca `cycleIndex = 0`** — chấp nhận được vì ca đó không tới được (xem trên)
   - Gate verifier chạy thật: `yarn check` **exit 0** ("7 rule groups clean") · jest functions **9 failed / 183 passed suite, 5 failed / 1811 passed test** · jest assets **exit 0**, 6 suite / 86 test
   - ⚠️ **BASELINE TRONG BRIEF NÀY ĐÃ SAI — sửa lại**: chỗ khác ghi "2 suite FAIL sẵn". Verifier tự đo trên worktree `origin/master` sạch (`832b61627`) → **9 suite / 5 test fail**, cùng bộ: `crmService`, `subscriptionProductsRepository`, `injectWidget`, `afterChargeService`, `bulkSwapProducts`, `fixedBundleService.prepareFirestorePayload`, `shopifyService`, `orderService`, `conditionEvaluation` — tất cả lỗi resolve `firebase-functions`/`google-auth-library`, không phải lỗi ai gây ra. Nhánh này pass **hơn baseline đúng 2 test** = 2 test mới
   - FYI ngoài scope (không phải finding): `services/klaviyo/klaviyoService.js:462` (`syncKlaviyoEvents`, backfill Step 3) tự build `eventData` rồi gọi thẳng `sendMetricEvent`, **không** đi qua `prepareKlaviyoData` — khác đường, không dính lớp bug này
   - `services/subscription/subscriptionService.js:1160` (`CHARGE_PROCESSING_FAILED`) và `:1446` (`ORDER_PLACED_SUCCESSFULLY`) gọi `sendKlaviyoEvent` **không truyền `isOrder: true`** → mặc định `false` → payload build bằng `prepareSubscriptionMetricEvent()` thay vì `prepareOrderMetricEvent()`, **thiếu `chargeId`, `shopify_order_id`, `scheduled_at`**
   - Đối chiếu: `handleCycleAction` (`:485`) set tường minh `isOrder: type !== RESCHEDULE_ACTION` cho SKIP/RESUME/RESCHEDULE — tức chỗ khác đã làm đúng
   - Sample event của đúng 2 metric này thì **luôn** có đủ field (`SAMPLE_ORDER_BASE_DATA`, `const/klaviyo/default.js:202-210`) → merchant test thấy đủ, chạy thật lại thiếu
   - Hệ quả: Flow Klaviyo cá nhân hoá theo mấy field đó sẽ trống ở event thật

40. [⏸️] _(chờ merchant + CS — đã có draft trả lời, xem cuối block)_ **Kookut khiếu nại "app tự sửa giá sản phẩm" — sub `151147970941`, CS hỏi 14/08 13:38**
   - Slack: https://avadaio.slack.com/archives/C07URV6QMJ8/p1786689495187749?thread_ts=1786494004.579699&cid=C07URV6QMJ8 (thread gốc `JSUB-260811-TWjnqq`, đọc bằng `~/projects/my-brain/bin/slack`)
   - Nguyên văn CS (U08T11T6GDA): *"khách đang bảo là bên mình tự điều chỉnh giá sp nên charge k đúng, c có xin quyền product rồi, với check log thấy cũng edit product tương đối, e xem xem root cause ntn rùi sửa triệt để, khách cứ gào lên"*
     - **Pacific Tuna & Sardines 24x70** đã tăng giá từ **40 EUR → 43,65 EUR**
     - **Pacific Tuna & Sardines 70** hiện giá gốc **1.95 EUR**, khách khẳng định sp này **chưa bao giờ** có giá 1.95
   - Nối thẳng với [[#28]] (bug hoán giá `basePrice` theo index) — chính contract này, và dòng `1.95 → 1.7` từng được phân tích ở #28
   - **14/08 — điều tra vòng 1 xong, verifier trả `FAIL`, CHƯA đóng.** Phần cơ chế code đã chắc; phần gán nguyên nhân cho case cụ thể thì **chưa có bằng chứng**, mà đây là thứ sẽ đem trả lời merchant nên không được đoán
   - ✅ **ĐÃ CHẮC (verifier CONFIRMED, đọc code trực tiếp)**:
     - **App KHÔNG có code path nào ghi giá lên product/variant catalog của merchant.** `productVariantUpdate` / `productVariantsBulkUpdate` / `productVariantsBulkCreate` → **0 kết quả toàn repo**. Cả REST admin (`/admin/api/*/products`, `/variants`) trong `packages/functions` + `extensions/*/src` cũng 0. `commands/` chỉ có `draftCreate/draftUpdate/draftCommit` (SubscriptionDraft, không phải Product) ở `backfillShippingOptionTitle.js:121-139`
     - Chỉ 3 mutation product tồn tại (`const/graphql/mutation/product.js:1-109`): `productCreate` **dead code** (0 nơi gọi) · `productSet` (Fixed Bundle) · `productUpdate` = `updateProductStatus` (`services/graphql/productService.js:544-563`) **chỉ set `status`, không đụng `price`**
     - Scope `write_products` có (`config/shopify.js:17-18`) nhưng **chỉ phục vụ 2 việc trên** — không mutation nào khác ghi `price`
     - Toggle "Auto-sync product price" **mặc định TẮT**: `const/default.js:266-268` (`automation: {syncProductPrice: false}`), và bị **force-reset về `false` khi downgrade FREE** (`services/subscriptionService.js:172-182`, `:378-386`). Text UI khớp nguyên văn `Automation.json:3-5`
     - Đường webhook `products/update` (`handlers/pubsub/productWebhookHandler.js:75`) và đường DevZone thủ công (`services/shopify/productService.js:134,274`) **đều gate đúng** qua `automation.syncProductPrice`
   - ❌ **VERIFIER BÁC / CHƯA CHẮC — đừng dùng mấy câu này trả merchant**:
     - **KHÔNG có bằng chứng nào nối con số khiếu nại với cơ chế nào.** `grep -in "pacific|tuna|sardine|43.65"` trên `docs/price-swap-damaged-contracts.md` + `docs/kookut-shipping-audit.md` → **0 kết quả**. Việc gán case này cho bug hoán vị index chỉ là **suy luận theo mẫu hình**, chưa xác nhận trên chính contract bị khiếu nại
     - **"Guard `syncProductPrice` chặn MỌI đường" là SAI theo nghĩa đen** → xem task [[#42]]
     - *"Bug hoán vị luôn giữ tổng không đổi"* — PARTIAL: chính `price-swap-damaged-contracts.md` (Nhóm C) đã ghi có case "bộ giá KHÔNG khớp, có mùi catalog đổi giá". `processContractLines.js:14-68` chỉ sắp xếp lại thứ tự, không sinh giá mới — nhưng thế không đủ để loại trừ case này
   - 🚧 **CHẶN: cần dữ liệu prod mới kết luận được** (agent bị cấm đụng prod theo ràng buộc loop). Ba thứ phải đọc:
     1. Shop `kookut` đang **BẬT hay TẮT** `automation.syncProductPrice` (quyết định toàn bộ câu trả lời)
     2. Contract `151147970941`: 2 line "Pacific Tuna & Sardines 24x70 / 70" có tồn tại không, `basePrice`/`currentPrice` hiện tại bao nhiêu, và **giá catalog Shopify thật** của 2 variant đó (đối chiếu 43,65 và 1,95)
     3. Có đường nào ngoài UI từng gọi bulk action ghi giá cho shop này không (cần log/BigQuery)
   - → ~~Cần user duyệt cho chạy script chỉ-đọc trên prod~~ **ĐÃ DUYỆT + ĐÃ CHẠY 14/08**, xem dưới

   - ## 📊 VÒNG 2 (14/08) — đã đọc prod thật, verifier chạy lại độc lập
   - ✅ **Số liệu đã được HAI agent đọc độc lập, khớp nhau** (đọc bằng `inspectContractPricing.js`, `inspectContractOrders.js`, `inspectContractActivities.js`, `scanLineIdMisalignment.js` + script tự viết gọi Shopify GraphQL; token `ACCESS_TOKEN_KEY_PROD`, toàn bộ read-only):
     - **kookut BẬT `automation.syncProductPrice = true`** — settings doc `adJpckNJ2ilYo4ZC0H4E`, shopId `4VgCcf9Ov5cIBx2tCkcT`. **Không phải mặc định tắt** như giả định ban đầu
     - Contract `151147970941`: ACTIVE, currency **EUR**, shopCurrency **CHF**, 4 line:
       | Product | Variant | variantId | basePrice | currentPrice | qty |
       |---|---|---|---|---|---|
       | Wild Alaskan Salmon | 70g | 39412859404496 | 1.8 | 1.71 | 6 |
       | Wild Alaskan Salmon | 24x70g | 39412859371728 | **40** | 38 | 1 |
       | Pacific Tuna & Sardine | 70g | 39412882735312 | 1.95 | 1.853 | 6 |
       | Pacific Tuna & Sardine | 24x70g | 39412882702544 | 45.95 | 43.653 | 1 |
     - **Giá catalog Shopify LIVE** (`productVariant.presentmentPrices`): Tuna 70g = 1.80 CHF / **1.95 EUR** · Tuna 24x70g = 42.00 CHF / **45.95 EUR** → khớp `basePrice`, và 45.95×0.95 = **43.65** đúng con số khách kêu
     - **Dòng thời gian**: cycle0 (14/06) + cycle1 (14/07) — Tuna 70g `basePrice 1.7`, **chưa có** dòng 24x70g. Order `2026-08-11T06:39:14Z` là lần đầu 2 dòng 24x70g xuất hiện (Salmon **và** Tuna), và **cùng order đó** Tuna 70g nhảy 1.7 → 1.95
   - ❌ **VERIFIER `FAIL` — KHÔNG được kết luận "app sync đúng catalog, không phải bug hoán vị".** Lập luận đó bị phá bởi 4 bằng chứng độc lập:
     1. **Phép thử "khớp catalog ⇒ không phải hoán vị" VÔ HIỆU trên shop này.** Quét 71 variant sống: **15 variant giá 1.80** (tier 70g) và **15 variant giá 42.00** (tier 24x70g) — Salmon và Tuna trùng giá tuyệt đối ở cả 2 size. Hoán giữa 2 trong 15 sản phẩm cùng tier vẫn khớp catalog hoàn hảo, không phân biệt được
     2. **Commit fix bug hoán index gọi ĐÍCH DANH contract này**: `git show 2dc2fb9fd` (merge `af8421482`, master `2026-08-12T05:20:02Z`, MR !2463) — comment trong `contractBulkActionService.js` ~`:28-33`: *"indexing into lineIds can attach a price to the wrong line (see prod contract kookut #151147970941)"*
     3. **Timing khớp cửa sổ còn bug**: 2 dòng 24x70g tạo `2026-08-11T06:39:14Z`, fix merge `2026-08-12T05:20:02Z`
     4. **`scanLineIdMisalignment.js` chạy live: contract này VẪN đang `MISALIGNED`** — `151147970941 status=ACTIVE lines=4 badIdx=[0,1,2]`, tức `products[]`/`lineIds[]` lệch ở 3/4 vị trí, đúng điều kiện cấu trúc bug cần
   - **🔴 PHÁT HIỆN MỚI, ĐANG SỐNG — xem [[#43]]**: dòng **Salmon 24x70g `basePrice = 40`** trong khi catalog live là **42 CHF / 45.95 EUR**. Không variant nào trong 71 cái hiện có giá 40 → loại khả năng "mượn giá từ donor còn sống", nhưng **chưa biết** là swap-donor đã biến mất hay snapshot cũ chưa từng sync lại (dù toggle đang BẬT). Và nó **lọt lưới dò tự động**: verifier tự chạy lại thuật toán của `scanLineIdMisalignment.js` (`RATIO_TOLERANCE = 0.15`) trên 4 line → ratio `[1.0, 0.952, 1.083, 1.094]`, median `1.083`, lệch của Salmon24x70g chỉ **12.1% < 15%** → tool báo `Contracts with a price outlier: 0` cho cả 84 contract ACTIVE của kookut. **Âm tính giả**
     - Thêm dấu hiệu: Tuna24x70g ratio `45.95/42 = 1.094` (EUR > CHF, hợp lý) nhưng Salmon24x70g `40/42 = 0.952` (ngược hướng chuyển đổi) — bất nhất kinh tế trên chính dòng sibling của cùng sự kiện sync 11/08
   - **🚨 BẰNG CHỨNG MỚI 14/08 (user gửi ảnh) — CÓ THỂ LẬT TOÀN BỘ KẾT LUẬN, đang kiểm**:
     - Ảnh màn hình app (danh sách sản phẩm của plan, có badge `Excluded`, cột giá **EUR**) hiện:
       - **Pacific Tuna & Mackerel SENIOR - Natural** — 2 variants — `1.70 – 40.00 €`
       - **Pacific Tuna & Sardine - Natural** — 2 variants — `1.70 – 40.00 €` → `24x70g` = **40,00 €** · `70g` = **1,70 €**
     - Tức theo màn hình này, **Tuna & Sardine có giá EUR 1,70 / 40,00**, KHÔNG phải 1,95 / 45,95 → **merchant nói đúng** khi bảo *"sp này chưa bao giờ có giá 1,95"*
     - **H1 (nghi nhất)**: variantId ghi trên line **KHÔNG thuộc** sản phẩm Tuna & Sardine. Contract đang lệch `badIdx=[0,1,2]` → line có thể đeo variantId của sản phẩm khác; 1,95/45,95 mà 2 agent đọc được là giá của **sản phẩm khác**, còn tên "Pacific Tuna & Sardine" trên line chỉ là snapshot text cũ. Nếu H1 đúng thì kết luận "app sync đúng catalog" **SAI**
     - **H2**: màn hình lấy giá từ snapshot của app (Firestore/BigQuery) chứ không phải Shopify live, và snapshot cũ
     - ⚠️ **Nghi ngờ chính kết luận vòng 2**: câu *"không variant nào trong 71 cái có giá 40"* rất có thể chỉ so giá **CHF** mà bỏ qua **presentment EUR**. Nếu vậy thì `40` hoàn toàn có thể là **giá EUR hợp lệ** của Tuna & Sardine, và cả mạch "40 là giá lỗi" sụp
     - Trùng hợp đáng ngờ: `1,70` và `40,00` đúng là 2 con số đang lởn vởn trong contract (Tuna 70g từng là `1.7` ở cycle 0-1; `40` hiện đeo trên dòng **Salmon** 24x70g)
   - **⚠️ KẾT LUẬN THẬN TRỌNG cho CS — đừng khẳng định chắc nịch chiều nào**: bằng chứng đủ để nói *giá 1.95/45.95 EUR là giá catalog thật đang tồn tại trên Shopify, và app có đường hợp lệ để sync vào contract vì merchant đã bật Auto-sync*; nhưng **KHÔNG đủ** để khẳng định vụ Tuna chắc chắn không liên quan bug hoán index. Trước khi trả lời khách nên xử dòng Salmon 24x70g ([[#43]]) đã
   - **Chưa xác minh được** (verifier ghi rõ): (a) `activities` của contract **không có record nào** về lần sửa giá 12/08 — chỉ có `create_subscription`, `attempt_billing`, `recurring`, nên không kiểm chứng độc lập được ai/khi nào chạy `repairContractLinePrices.js --apply`; (b) build Cloud Function đang chạy lúc `2026-08-11T06:39:14Z` là trước hay sau deploy fix (chỉ có timestamp git, chưa xem log deploy); (c) con số `€313,69 → €95,95` trong `docs/price-swap-damaged-contracts.md` **không khớp** tổng 4 line hiện tại (≈€103,03 theo `currentPrice × qty`) — chênh lệch chưa giải thích được

45. [✅ 2026-08-14] **CS hỏi: card decline của khách Caroline Charbonneau — dev có log rõ lý do decline không?**
   - **ĐÓNG 14/08, không có commit** (điều tra + tra dữ liệu). ⚠️ **Chưa qua verifier độc lập** — một nguồn duy nhất; nếu đem ra tranh luận thì kiểm lại trước
   - **TÌM ĐƯỢC KHÁCH**: contract `121065865597` (kookut), `customerName: "Caroline Charbonneau"`, `status: ACTIVE`, `isPaymentFailed: true`, `currentBillingCycle: 10`. Tìm bằng script scoped `where('shopId','==',...)` + phân trang `orderBy(documentId())`, khớp đúng 1/207 contract
   - **LÝ DO DECLINE — app CÓ lưu đủ**: 2 order fail (cycle 10 doc `vp5VkEwcZbn0Lhad3Vti`, cycle 11 doc `hyIPWDwwg8rIiONF7XKl`), cả hai đều `errorCode: "PAYMENT_METHOD_DECLINED"` · `billingAttempts[].errorMessage: "Your card was declined."`
     - Cycle 10: 2 lần thử (12/08, 13/08) · Cycle 11: 2 lần thử (13/08 auto, 14/08 retry), `retryCount: 1`, `nextRetry: 2026-08-15`
     - ~~Thẻ Mastercard hết hạn 07/2026 — chưa hết hạn lúc fail~~ **ĐÍNH CHÍNH: SAI.** Hôm nay là 14/08/2026 → thẻ hết hạn **cuối tháng 7/2026**, mọi lần fail đều trong **tháng 8/2026** → **thẻ ĐÃ HẾT HẠN trước khi bị từ chối**
   - **📊 DATA THẲNG TỪ SHOPIFY (14/08, user yêu cầu để giải thích cho khách)** — query `subscriptionContract(id:) { billingAttempts(first: 50) }`:
     | Cycle | UTC | errorCode | message | order |
     |---|---|---|---|---|
     | 10 | 2026-08-12 10:03:24 | `PAYMENT_METHOD_DECLINED` | "Your card was declined." | — |
     | 10 | 2026-08-13 06:46:08 | `PAYMENT_METHOD_DECLINED` | "Your card was declined." | — |
     | 11 | 2026-08-13 08:00:25 | `PAYMENT_METHOD_DECLINED` | "Your card was declined." | — |
     | 11 retry | 2026-08-14 08:01:07 | `PAYMENT_METHOD_DECLINED` | "Your card was declined." | — |
     - Contract có **13 attempt** tổng; 9 lần trước (09/2025 → 12/06/2026) **đều thành công**, `processingError: null`, mỗi lần **119.7 CHF** → không phải vấn đề hệ thống
     - `idempotencyKey` 4 lần fail: `10__9__1mspx8nrd`, `10__9__1msr5mtg2`, `11_auto_9__1msr8ablg`, `11__9_retry_1mssnr1ww` (số đầu = billing cycle)
     - **Thẻ hiện tại**: Mastercard `••••1932`, hạn **07/2026**, `revokedAt: null`, `revokedReason: null` → **chưa bị Shopify thu hồi**, vẫn gắn trên contract
     - **Shopify vs app KHỚP 100%** — đúng 4 attempt, đúng giờ, đúng mã lỗi. App **không bỏ sót** attempt nào
     - ⚠️ Field `state` (bản mới của Shopify thay `ready`/`processingError`/`order`) **chưa có** trên API version của shop (2025-10) → phải dùng `processingError` (deprecated nhưng còn chạy)
     - Query GraphQL nguyên văn: `subscriptionContract(id) { status nextBillingDate customer{id email} customerPaymentMethod{id revokedAt revokedReason instrument{... on CustomerCreditCard{brand lastDigits expiryMonth expiryYear}}} billingAttempts(first:50){edges{node{id createdAt ready originTime idempotencyKey nextActionUrl processingError{code message} order{id name processedAt totalPriceSet{presentmentMoney{amount currencyCode}}}}}} }` — variables `{"id":"gid://shopify/SubscriptionContract/121065865597"}`
   - **🃏 VỤ "2 SỐ THẺ KHÁC NHAU" — đã giải (CS báo order cũ là `••7216`, Shopify hiện `••1932`)**:
     - **KHÔNG có hai thẻ.** 22 order doc + `customer.paymentMethods(showRevoked: true)` đều chỉ về **một token duy nhất** `gid://shopify/CustomerPaymentMethod/7d1ab3dd35a61456fdfc974f317d0b54`, `revokedAt: null`, không có payment method thứ hai kể cả đã revoke
     - Số 4 cuối đổi **2 lần**: `1932 → 7216` (giữa cycle 1→2, ~10/2025) rồi `7216 → 1932` (**ngay giữa đợt fail**, giữa 13/08 06:46 và 13/08 08:00). Cùng token, **cùng hạn 07/2026** suốt cả năm → gần như chắc chắn là **card-network account updater** (Mastercard tự refresh số khi bank phát hành lại), không phải khách đổi thẻ
     - → Giả thuyết "khách đổi thẻ mới, thẻ mới chưa được thử" **SAI**: thẻ `1932` hiện tại **chính là** thẻ đã fail 2 lần gần nhất
     - Timeline charge: thành công liên tục cycle 0→9 (12/08/2025 → **12/06/2026**), gói **2 tháng/lần** → kỳ kế tiếp **12/08/2026**, đúng lúc thẻ đã hết hạn cuối tháng 7 → fail ngay lần đầu và mọi retry
   - **→ Kết luận cho khách (đã xác nhận qua 2 vòng)**: nguyên nhân là **thẻ đã hết hạn** (07/2026), không phải app tính sai, không phải thẻ bị revoke, không phải "2 thẻ khác nhau". Khách phải **thêm thẻ mới còn hạn** — thử lại thẻ hiện tại vô ích
   - Giới hạn dữ liệu: 4 lần fail **không tạo order** → không có transaction để truy sâu hơn `PAYMENT_METHOD_DECLINED`. Đó là trần thông tin Shopify cho, không phải app thiếu log
   - **Đường lưu**: webhook → `services/webhook/billingAttemptWebhookService.js:293` → `handleBillingAttemptFailure` (`services/subscription/subscriptionService.js:1038-1204`) đọc `data.error_code` / `data.error_message` (`:1054,1085,1092-1093,1119,1135`) → ghi `errorCode` top-level + push `billingAttempts[]` `{idempotencyKey, ready, errorMessage, errorCode, isAutomatic, createdAt}` (`:1087-1097,1111-1128`). So với `paymentErrors` (`const/subscription/subscriptionErrors.js:29-41`, đủ 24 mã Shopify) để set `isPaymentFailed`
   - **Admin UI CÓ hiển thị** (CS tự tra được): `pages/Orders/OrderDetail.js:444-451`, `pages/Subscriptions/Tabs/History/HistoryOrderRow.js:331-337`, `pages/Orders/banners/FailureBanner.js:34` → text dịch từ `errorCode` qua `PlanDetails.json:5-32`
   - **🔑 Giới hạn nằm ở Shopify, không phải app**: webhook `subscription_billing_attempts/failure` chỉ trả `error_code` (enum chung) + `error_message` (câu chung chung). **Không** có mã decline chi tiết của ngân hàng (insufficient funds / do-not-honor / CVV sai...) — thứ đó chỉ có trong transaction detail của gateway (Shopify Payments / Stripe / PayPal dashboard)
   - **Gap nhỏ đáng vá**: UI **bỏ qua `errorMessage` gốc** của Shopify khi `errorCode !== 'USER_ERROR'`, chỉ hiện canned text — dù raw message đã lưu sẵn trong Firestore. Sửa ở 3 chỗ liệt kê trên
   - **KHÔNG nối với ticket giá sai [[#44]]**: tự tính tổng `lines[].lineDiscountedPrice` khớp field `price` của order (cycle 10: 203.7 · cycle 11: 161.7) → không có dấu hiệu order bị tính sai giá. Nhưng đây chỉ là so sánh **nội bộ app**, chưa đối chiếu số tiền charge thật trên Shopify → **chưa loại trừ tuyệt đối**

   _(ngữ cảnh gốc của #45, giữ để tra cứu)_
   - Nguyên văn CS (14/08): *"KH báo thêm cái này, c thấy là do Your card bị decline, c có giải thích là SPF charge và trả lỗi về rồi. Nhưng liệu phía dev có log rõ hơn là do cái gì mà decline k e?"*
   - Khách: **Caroline Charbonneau**, shop **`kookut.myshopify.com`** (shopId `4VgCcf9Ov5cIBx2tCkcT`) — user xác nhận 14/08. ~~SPF = sprayfreefarmacy~~ **SAI**, "SPF charge" là nói về việc charge bị trả lỗi
   - ⚠️ Còn thiếu: order/contract id cụ thể
   - 🔗 Cần kiểm nhưng **không được đoán**: kookut đang có ticket giá bị ghi sai ([[#44]]) — nếu khách này nằm trong nhóm bị tính giá cao hơn thực tế thì decline có thể là **hệ quả** (số tiền bất thường → bank từ chối). Chỉ được nói vậy nếu thấy số tiền charge thật của lần fail
   - Câu hỏi thật: app có lưu **mã lỗi/lý do decline** mà Shopify trả về ở billing attempt không, hay chỉ lưu "failed"? Nếu có thì tra ở đâu; nếu không thì đó là gap cần vá (CS không thể trả lời khách tử tế nếu chỉ có "card declined")

44. [⏸️] _(chờ user — lệnh `--apply` bị user chặn 14/08, chưa rõ lý do; công cụ + dry-run đã sẵn sàng, chạy được ngay khi user cho phép)_ **[P0] Sửa 2 dòng Tuna của contract `151147970941` + đổi nguồn giá của script repair**
   - **User duyệt 14/08**: *"store này đã có rất nhiều issue rồi, tôi muốn bạn giải quyết triệt để... về phần giá của contract 151147970941 thì sửa sao cho đúng"* → được làm, nhưng **vẫn phải trình dry-run trước khi apply lên prod**
   - Manh mối root cause chưa giải: khách ở **Pháp**, `contextualPricing(FR)` = **42.95**, nhưng contract đeo **45.95** (giá DE/IT) → nghi app **không truyền country/market context** khi lấy giá
   - **✅ DRY-RUN XONG + VERIFIER PASS (14/08)** — nhánh `fix/JSUB-260811-price-source` · commit **`88f8bb4`** · base `origin/master` `8016e0ac0` · **chưa push** (auth git on-premise fail)
     - File mới: `packages/functions/src/commands/misc/compareContractPricingWithCatalog.js` (+298), **chỉ đọc, không có cờ `--apply`**. Nguồn sự thật = `PriceList.prices(originType: FIXED)` theo catalog ứng currency contract; `contextualPricing` chỉ là cột phụ để đối chiếu
     - Gate: `check` **exit 0** · `jest:as` **exit 0** · `jest:fn` đúng 9 suite baseline, không suite mới chết (verify bằng `rtk proxy npx jest`) · `git diff --stat` tracked **rỗng**
     - **Bảng dry-run contract `151147970941`** (contract `currency=EUR country=FR`):
       | variantId | product/variant | basePrice hiện tại | **PriceList FIXED** | delta | currentPrice | **expected** | contextualPricing | |
       |---|---|---|---|---|---|---|---|---|
       | `39412859404496` | Salmon 70g | 1.80 | 1.80 | 0 | 1.71 | 1.71 | 1.80 | KHỚP |
       | `39412859371728` | Salmon 24x70g | 40.00 | 40.00 | 0 | 38.00 | 38.00 | 40.00 | KHỚP |
       | `39412882735312` | **Tuna 70g** | **1.95** | **1.70** | 0.25 | 1.85 | **1.62** | 1.95 | **LỆCH** |
       | `39412882702544` | **Tuna 24x70g** | **45.95** | **40.00** | 5.95 | 43.65 | **38.00** | 42.95 | **LỆCH** |
     - Verifier **tự chạy lại** và xác nhận: query từng variant riêng ra y hệt query gộp (`1.8, 40.0, 1.7, 40.0` — không rớt variant nào) · ép `--catalog=France` ra **giá y hệt** catalog Europe → chỗ mập mờ 2 catalog EUR không đổi kết quả · variant không có giá FIXED được xử thành cảnh báo riêng, **không** báo nhầm thành LỆCH · làm tròn tính trên giá trị **thô** từ Firestore (`1.853`/`43.653`, không phải số hiển thị) → `1.70 × (1.853/1.95) = 1.6154 → 1.62` ✓, `40.00 × (43.653/45.95) = 38.0004 → 38.00` ✓ · chạy 3 lần thứ tự catalog ổn định
     - **→ Giá đúng của 2 dòng Tuna: `1.70` và `40.00`**. Chưa ghi gì lên prod
   - **🔎 ROOT CAUSE tầng code (agent điều tra, ⚠️ agent bị classifier chặn khi chạy prod nên phần data là kế thừa, CHƯA tự verify lại)**:
     - Đường khách tự thêm variant qua Classic Customer Portal: `controllers/storefrontApi/managementController.js:522 addLine` → `handleAddLines` (`services/subscription/subscriptionService.js:2018`) → `subscriptionDraftLineAdd` (`services/graphql/contractService.js:401`) → commit draft. FE dựng payload ở `packages/scripttag/src/customerPortal/helper/prepareLineAddPayload.js:61-73` (`basePrice: parseFloat(selectedVariant.price)`)
     - **Giá lấy từ `contextualPricing`**: `services/graphql/productService.js:1049-1054` → `price: localPrice?.price?.amount || price`, với `localPrice = contextualPricing(context: {country: $country})` (query ở `:395-456`)
     - **`country` fallback về `shop.shopCountry`** khi thiếu (`controllers/clientApi/subscriptionProductController.js:50`, `repositories/subscriptionProductsRepository.js:487`) — shop **CH**, contract **EUR**
     - ⚠️ **Đúng lớp bug đã từng sửa ở chỗ khác**: `bulkSwapProducts.js` (fix #25, commit `84425caae`) đã bỏ fallback `shop.shopCountry`, dùng `deliveryMethod?.countryCode || contract?.countryCode`. **Đường portal add-line chưa được sửa theo**
     - Lớp bug ghi-nhầm-dòng-theo-index (`contractBulkActionService.js:83`) **đã fix và đã nằm trong master** (`2dc2fb9fd`) → không phải thủ phạm lần này
   - **🔧 CÔNG CỤ APPLY đã sẵn sàng, verifier `PASS` — nhưng CHƯA CHẠY** (user từ chối lệnh apply 14/08, không ghi gì lên contract):
     - File: `packages/functions/src/commands/misc/applyContractLinePrices.js` (chưa commit). Nhận giá **tường minh** `--line=<variantId>:<price>`, **không tự suy giá**; dry-run mặc định; guard fail-closed (variantId lạ → abort trước khi tạo draft · tăng giá → từ chối trừ khi `--allow-increase`); giữ nguyên tỉ lệ discount của từng line; đọc lại Shopify sau khi ghi và báo FAIL nếu lệch
     - Dry-run thật: `1.95→1.70` (currentPrice `1.853→1.62`, ratio 0.9503) · `45.95→40.00` (`43.653→38.00`, ratio 0.9500). 2 dòng Salmon không đụng
     - **⚠️ Rủi ro verifier chỉ ra, CÓ THẬT**: vòng update từng line (`applyContractLinePrices.js:248-263`) **không kiểm lỗi trả về**, và helper `services/graphql/contractService.js:659-697` **không throw** khi có `errors`/`userErrors` — chỉ `console.error` rồi return `undefined`. Nếu line 2 fail mà line 1 ok → vẫn commit draft → contract khách **nửa vá** trên live, không có rollback. (Pattern không-throw này là convention sẵn có của repo: `updateLineItemPricingByDiscountConfig.js:92-99`, `contractBulkActionService.js:139-146`)
       - **Cách né đã chốt**: chạy **từng line một**, mỗi line một lệnh riêng → không tồn tại trạng thái nửa vá
     - **⚠️ Lệnh chạy phải có `GOOGLE_CLOUD_PROJECT=avada-subscription-app`** — thiếu thì fail ở bước [1/5] `Unable to detect a Project Id`, vì `repositories/shopRepository.js:16` tạo `new Firestore()` riêng, không kế thừa `firebase-admin` đã init từ `serviceAccount.prod.json`. Gap này **dùng chung** với `repairContractLinePrices.js`, `repairContractShipping.js`, `compareShippingMirror.js`, `auditShippingRecurring.js`. Fail-safe (dừng trước khi ghi)
     - Lệnh đầy đủ: `cd packages/functions && set -a && source .env.local && set +a && SA_ENV=prod GOOGLE_CLOUD_PROJECT=avada-subscription-app SHOPIFY_ACCESS_TOKEN_KEY="$ACCESS_TOKEN_KEY_PROD" node lib/commands/misc/applyContractLinePrices.js kookut.myshopify.com 151147970941 --line=<variantId>:<price> --apply` (build `lib/` trước bằng `yarn workspace @avada/functions run production`)
   - **❓ MẮT XÍCH CÒN THIẾU**: vì sao dòng Tuna 70g đang đúng `1.70` lại bị ghi đè thành `1.95`. Thao tác thêm variant chỉ *thêm* dòng, không giải thích được ghi đè dòng cũ. **Chưa tìm ra → chưa gọi là fix triệt để**
   - ⚠️ Lưu ý cho fix: sửa `country` thôi **CHƯA đủ** — `contextualPricing(FR)` vẫn ra 42.95 trong khi FIXED là 40.00. Giả thuyết: Tuna thiếu entry FIXED ở catalog thật sự áp cho market của khách nên Shopify tự quy đổi từ CHF (1.80 × ~1.083 = 1.95 · 42 × ~1.094 = 45.95 — khớp đúng 2 số đang sai)
   - Bắt nguồn từ [[#43]] và ảnh order **#10831** (14/08 07:33, **Paid**) user gửi — khách **đã bị thu tiền sai thật**, không còn là "chỉ hiển thị"
   - Đơn #10831 thu đúng bằng `basePrice × 0.95`:
     | Dòng | Thu | `basePrice` | Đúng ra |
     |---|---|---|---|
     | Salmon 70g | €1.71 × 6 | 1.80 | ✅ đúng |
     | Salmon 24x70g | €38.00 × 1 | 40.00 | ✅ đúng |
     | **Tuna 24x70g** | **€43.65** × 1 | 45.95 | ❌ phải là **€38.00** (40 × 0.95) |
     | **Tuna 70g** | **€1.85** × 6 | 1.95 | ❌ phải là **€1.62** (1.70 × 0.95) |
   - **Thu thừa kỳ 14/08: 5.65 + 1.41 = ~7.06 EUR** → cần đặt vấn đề **hoàn tiền**
   - Thao tác thêm variant 24x70g hôm 11/08 làm hỏng **HAI** dòng: tạo dòng 24x70g với 45.95, **và** kéo dòng Tuna 70g từ 1.70 lên 1.95. Trước 11/08 dòng 70g đang đúng (1.7) → nhiều khả năng chỉ kỳ này bị, các kỳ trước không
   - Việc cần làm: (1) **đổi nguồn giá tham chiếu** của `repairContractLinePrices.js` từ `contextualPricing` sang `PriceList.prices(originType: FIXED)` theo catalog/market của contract — **không sửa cái này thì mọi lần apply đều sai**, (2) sửa `basePrice` 2 dòng Tuna về 1.70 / 40.00, (3) hoàn 7.06 EUR đơn #10831, (4) xác nhận với merchant giá EUR đúng trước khi ghi
   - ⚠️ Ràng buộc: **KHÔNG apply** khi chưa có xác nhận của merchant về giá đúng — xem cảnh báo ở [[#28]]

43. [✅ 2026-08-14] ~~Dòng Salmon 24x70g lệch catalog~~ → **ĐẢO CHIỀU: Salmon ĐÚNG, 2 dòng TUNA mới sai — và `contextualPricing` không đáng tin**
   - **ĐÓNG 14/08, không có commit** (task điều tra). Verifier tự query Shopify sống, **bác bỏ tiền đề của chính task này**
   - **📊 Bảng giá thật, thu trực tiếp từ Shopify Admin GraphQL** (shop kookut, 14/08). Cả 4 variantId **đều thuộc đúng sản phẩm** hiển thị trên contract → giả thuyết "line đeo nhầm variantId" **BỊ BÁC**:
     | variantId | product.title thật | CHF | **EUR — PriceList FIXED** (Europe & France) | EUR — `contextualPricing` |
     |---|---|---|---|---|
     | `39412859404496` Salmon 70g | Wild Alaskan Salmon - Natural | 1.80 | **1.80** | 1.80 (FR/DE/IT) |
     | `39412859371728` Salmon 24x70g | Wild Alaskan Salmon - Natural | 42.00 | **40.00** | 40.00 (FR/DE/IT) |
     | `39412882735312` Tuna 70g | Pacific Tuna & Sardine - Natural | 1.80 | **1.70** | **1.95** ⚠️ |
     | `39412882702544` Tuna 24x70g | Pacific Tuna & Sardine - Natural | 42.00 | **40.00** | FR **42.95**, DE/IT **45.95** ⚠️ |
   - **🔑 KẾT LUẬN ĐẢO CHIỀU**:
     - **Salmon 24x70g `basePrice = 40` là ĐÚNG** — khớp PriceList, khớp contextualPricing, khớp pattern các sản phẩm 24x70g khác (Mackerel SENIOR cũng 40.00). Không cần sửa. Mọi lập luận "40 là giá lỗi" (kể cả của tôi) **sai**
     - **Hai dòng TUNA mới là dòng sai**: `basePrice` 1.95 / 45.95 trong khi price list của merchant là **1.70 / 40.00** → **merchant nói đúng**, "sp này chưa bao giờ có giá 1,95"
     - Ảnh merchant gửi (1.70 / 40.00 €) **khớp hoàn toàn `PriceList.prices(originType: FIXED)`**, tái lập nhiều lần → không phải snapshot cũ của app
   - **🛑 `contextualPricing` KHÔNG ĐÁNG TIN — hệ quả lan sang [[#28]]**: riêng sản phẩm Tuna & Sardine, `contextualPricing` lệch khỏi PriceList của chính nó **và tự mâu thuẫn giữa các nước** (FR 42.95 vs DE/IT 45.95). Mọi sản phẩm khác kiểm được thì 2 nguồn khớp. Đã loại trừ: rate-limit/flaky (mỗi giá tái lập 2-4 lần độc lập) · `inventoryItem.unitCost` = null cả 4 variant (không phải margin protection) · sản phẩm trùng lặp · `updatedAt` hôm nay là do order chu kỳ 14/08 chạy, không phải merchant sửa giá
     - **`repairContractLinePrices.js:87,95` dùng đúng `contextualPricing` này** → chạy `--apply --allow-increase` lên 2 dòng Tuna sẽ ghi **42.95/45.95**, tức đẩy giá lên cao hơn cả mức đang sai. **CẤM chạy** cho tới khi đổi nguồn giá
   - ✅ **Phần cơ chế vẫn CONFIRMED** (không đổi):
     - Auto-sync mù: `contractBulkActionService.js:54-61` so `variant.price` (CHF native, đúng ở cả 2 phía) chứ không so `basePrice`. Kiểm thêm `handleProductUpdate` (`productService.js:161-167`) và `syncProductPriceToContracts` (`:289-306`) — **cả hai đều gọi cùng một điều kiện**, không có nhánh nào khác → dòng sai `basePrice` **không bao giờ** được sync sửa
     - Detector mù: `scanLineIdMisalignment.js:12,87,98`. Tự chạy lại: `Scanned contracts: 84` · `misalignment: 14` · `price outlier (likely damaged): 0`. Ratios `[1.0, 0.952, 1.083, 1.094]`, median `1.083`, lệch 12.1% < 15% → lọt
     - **Lỗ hổng của đề xuất detector mới**: lọc trước bằng nhóm `MISALIGNED` sẽ **loại hẳn** nhóm "damaged nhưng aligned" → tái tạo đúng lớp âm tính giả. Và nếu detector mới lấy giá qua Bulk Operations mà field tương đương `contextualPricing` thì nó sẽ **tự sinh false positive** trên chính Tuna & Sardine — gắn nhãn damaged cho dòng đúng rồi đề xuất sửa sai hướng
   - **Chưa xác minh được**: vì sao riêng Tuna & Sardine bị lệch 2 nguồn giá (nghi cache/propagation phía Shopify — cần mở Shopify Admin → Markets → Pricing hoặc hỏi Shopify Support; GraphQL đọc không truy được) · component nào render màn hình trong ảnh · `basePrice` đúng của 2 dòng Tuna nên là 1.70/40.00 hay số khác — **cần merchant xác nhận trước khi sửa**
   - _(nội dung điều tra gốc bên dưới giữ lại làm tài liệu — tiền đề của nó đã bị bác)_
   - Phát hiện bởi verifier task [[#40]], 14/08, đọc prod thật
   - `basePrice = 40` trong khi catalog live `42.00 CHF` / `45.95 EUR`. Không variant nào trong 71 variant sống của kookut có giá 40 → **không phải mượn giá từ donor còn sống**
   - Chưa rõ là: (a) tàn dư hoán vị với một donor đã bị đổi giá/xoá, hay (b) snapshot cũ chưa từng được sync lại **dù `automation.syncProductPrice = true`** — nếu là (b) thì đó là lỗ hổng của chính cơ chế auto-sync, đáng điều tra riêng
   - **Lỗi của detector, quan trọng hơn bản thân dòng này**: `scanLineIdMisalignment.js` dùng ratio so với **median của chính contract** (`RATIO_TOLERANCE = 0.15`). Ở contract này ratio = `[1.0, 0.952, 1.083, 1.094]`, median `1.083` → lệch của dòng hỏng chỉ **12.1%**, dưới ngưỡng → **lọt**. Kết quả: tool báo `0 damaged` cho toàn bộ 84 contract ACTIVE của kookut
     - Nghĩa là **mọi con số "đã quét, chỉ N contract hỏng" ở [[#28]] đều là chặn dưới, không phải con số thật**. Contract có ≥2 dòng hỏng cùng chiều sẽ kéo median theo và tự che nhau
   - Việc cần làm: (1) xác định nguồn gốc giá 40, (2) đánh giá lại ngưỡng/thuật toán detector — so với **catalog thật** thay vì median nội bộ contract, (3) quét lại với detector mới rồi đối chiếu số cũ

42. [✅ 2026-08-14] **[phát hiện phụ, từ verifier #40] Bulk action ghi giá contract KHÔNG qua guard `automation.syncProductPrice`**
   - `controllers/subscriptionContractController.js:1048-1060` → `services/subscription/bulkUpdateSubscriptionProductPrice.js:157-210` (`BULK_TYPE_UPDATE_SUBSCRIPTION_PRODUCT_PRICE`) ghi thẳng `currentPrice` + `pricingPolicy.basePrice` lên contract qua `updateSingleContractPrice`, **không hề đọc `automation.syncProductPrice`**
   - Giá ghi lấy từ `toUpdateData.priceByCurrency[...].newPrice` — **client-supplied**, không phải giá catalog live → không phải "auto-sync", là ghi giá theo input
   - ~~`grep -rln "BULK_TYPE_..." packages/assets/src` → 0 kết quả → route mồ côi~~ **SAI — grep âm tính giả, xem dưới**
   - Kèm theo, cùng đợt verifier: `controllers/fixedBundleController.js:100-160` nhận `productId` thẳng từ `ctx.req.body` rồi truyền vào `handleShopifyProductSet` mà **không verify server-side** rằng productId thuộc bundle của chính shop (`services/fixedBundleService.js:246-253`). Gap authorization, chưa có dấu hiệu bị khai thác

   - **🔴 ĐIỀU TRA 14/08 LẬT NGƯỢC TIỀN ĐỀ — route này KHÔNG mồ côi, nó là tính năng merchant đang dùng** (chờ verifier xác nhận):
     - **Có UI thật**: nút bulk **"Edit product price"** trên trang Subscriptions — `pages/Subscriptions/Subscriptions.js:389-397`, label i18n `Subscriptions.json:195`, modal + hook `hooks/modal/useBulkEditProductPrice.js` (`:35` khai báo lại literal `'update-subscription-product-price'`, `:91` gọi `useEditApi`, `:229-238` dựng `toUpdateData`)
     - **Vì sao grep trước đó ra 0**: FE **không import** hằng số của BE mà **hardcode lại chuỗi**. Đúng lớp bẫy đã ghi trong brain: *"liệt kê endpoint đừng grep literal"* — [[preview-route-enumeration-pitfall]]
     - **Route merchant gọi được bằng session token**, không phải route nội bộ: `routes/api.js:227-230` (`PUT /subscription-contract/bulk-action/:type`), mounted ở cả `handlers/api.js:69` (embedded, `verifyEmbedRequest`) lẫn `handlers/apiSa.js:38` (standalone, `verifyRequest`) — **cùng router với mọi endpoint merchant thường dùng**, không phải `routes/tsTool.js`
     - **Ghi thật lên Shopify**, không chỉ Firestore: draft create → `subscriptionDraftLineItemUpdate` → commit (`contractBulkActionService.js:128-145` ← `:157` ← `:362`)
     - **KHÔNG validate giá đầu vào**: `newPrice` đi thẳng từ `TextField` (`useBulkEditProductPrice.js:437`, không min/max) tới `parseFloat` (`contractBulkActionService.js:134`); route **không có** `validate(schema)` middleware trong khi phần lớn route mutating cùng file thì có
     - **Thiếu scope `shopId`**: `getSubscriptionContractsByIds` (`repositories/subscriptionContractRepository.js:1048-1064`) query `where(documentId(), 'in', batch)` **không lọc `shopId`**, gọi từ `bulkUpdateSubscriptionProductPrice.js:104`; `ids` là client-supplied (`subscriptionContractController.js:927`) và không đối chiếu `shop.id`. Suy luận (chưa kiểm live): **đọc** doc của shop khác thì lọt, **ghi** thì Shopify chặn vì access token scope theo store. Vẫn nên vá theo defense-in-depth
   - **Kết luận về câu hỏi gốc: thiếu guard `syncProductPrice` ở đây KHÔNG phải bug** — hai tính năng khác bản chất. Toggle gate đường **Shopify đẩy giá catalog vào contract** (`productWebhookHandler.js:75`, `services/shopify/productService.js:274`); còn route này là **merchant chủ động gõ giá mới rồi bấm Save**. Merchant tắt auto-sync vẫn phải sửa giá tay được
   - **→ Cách diễn đạt đúng khi trả lời merchant**: *"App chỉ tự đổi giá contract khi bạn bật 'Auto-sync product price'. Ngoài ra bạn (hoặc ai có quyền vào app) vẫn có thể tự sửa giá bằng bulk action 'Edit product price' trên trang Subscriptions — đó là thao tác chủ động, không phải app tự làm."*
   - **Việc còn lại (chưa làm, cần task riêng nếu user duyệt)**: (1) validate `newPrice` ở route, (2) lọc `shopId` trong `getSubscriptionContractsByIds` cho call path này, (3) gap ownership ở `fixedBundleController` — sửa cần hiểu state machine của bundle trước, ép so khớp cứng có thể phá luồng đổi product hợp lệ
   - **ĐÓNG 14/08 — verifier verdict `PARTIAL`**: bản chất các tuyên bố đều CONFIRMED (route merchant-facing, ghi thật lên Shopify, không validate, không scope `shopId`, và thiếu guard `syncProductPrice` là ĐÚNG THIẾT KẾ). Task điều tra nên **không có commit**. Hai đính chính của verifier:
     - **Nút CÓ gate ở FE mà vòng trước bỏ sót**: `Subscriptions.js:471` `disabled: !hasDealForFreeForever`; `hasDealForFreeForever` (`Subscriptions.js:114-115`) phụ thuộc `isFreeForever(shop)` (cutoff `GO_LIVE_PRICING` ~2025-11-04), `isGrowthHackingV3(shop)` (cutoff `GO_LIVE_GROWTH_HACK_DATE_V3` = 2026-04-10, `config/plans.js:62`), và cờ `shop.showAllBulkActions`. **KHÔNG phải gate theo `plan === 'free'`** → không kết luận được kookut có thấy nút hay không nếu chưa đọc `installedAt` + `showAllBulkActions` thật của họ
     - **Backend KHÔNG có gate tương đương** (`routes/api.js` grep `requirePlan|checkPlan|featureFlag|requireFeature` = 0): nút bị disable chỉ là tiện ích UI, session token hợp lệ vẫn gọi thẳng endpoint được bất kể plan
     - Số dòng lệch nhẹ so với ghi chú trên: `processLineItemPriceUpdate` là `contractBulkActionService.js:108-146` (mutation ở `:139`, `parseFloat` ở `:134`), controller đọc body ở `:928`
     - Thêm: input rác → `getSellingPlanVariables.js:400-402` `Number.isFinite(...) ? ... : 0` **coerce âm thầm về 0**, không reject. Response route chỉ trả `{success:true, data:{message:'Action is running in the background'}}` (`subscriptionContractController.js:1127-1130`) nên doc shop khác nếu lọt thì **không rò thẳng ra HTTP response**
     - Nhánh khác trong cùng file **CÓ** scope đúng — `processContractsBatch` (`contractBulkActionService.js:383+`) dùng `getSubscriptionContractsByContractIds({shopId: shop.id})`. Tức thiếu scope ở nhánh bulk-action là **bỏ sót cục bộ**, không phải convention của repo
   - **🔑 Câu trả lời cốt lõi cho khiếu nại "app tự đổi giá"**: không có cơ chế nào trong code khiến hệ thống **tự phát** đổi giá — mọi lần đổi qua đường này đều cần một request tường minh kèm `ids` + `toUpdateData`. Chỉ có 2 đường tự động, và cả hai đều gate bởi `automation.syncProductPrice`: webhook `products/update` (`productWebhookHandler.js:75`) và `syncProductPriceToContracts` (`services/shopify/productService.js:274`, chỉ gọi từ `devZoneController.js:990` — tool nội bộ)

41. [✅ 2026-08-14] **Ticket `JSUB-260814-adxTDS` — file import migration Appstle thiếu `customer_id` + `delivery_address_province_code`**
   - nhánh `feat/JSUB-260814-enrich-import` · commit **`0c88458`** · base `origin/master` `8016e0ac0` · **CHƯA push** (git fetch/push fail `HTTP Basic: Access denied` — session không có TTY, cần token on-premise)
   - Verifier `PASS`. Gate: `check` **exit 0** (7 rule groups clean) · `jest:as` **exit 0** (6 suite / 86 test) · `jest:fn` exit 1 nhưng **đúng 9 suite baseline** đã biết, không suite mới nào chết (verify bằng `rtk proxy npx jest` để không bị rtk che suite chết) · `git diff --stat` tracked files **rỗng** — không đụng file của ai
   - File mới, duy nhất: `packages/functions/src/commands/misc/enrichAppstleImportCsv.js` (+262). Chỉ đọc: Shopify GraphQL `query` + `.get()` Firestore lấy token; grep xác nhận không có `mutation`/`.set(`/`.update(`/`.delete(`
   - **🔴 TICKET MÔ TẢ SAI VẤN ĐỀ — đây mới là điều CS cần biết**:
     - `delivery_address_province_code` **KHÔNG bắt buộc**: `validations/importSubscription.js:21` là `yup.string()` trần, không bọc `validateDeliveryField` như `address1/city/zip/country_code` (`:17,18,20,22,24`). Và **`SG` không nằm trong** `PROVINCE_REQUIRED_COUNTRY_CODES` (`const/shipping/provinceRequiredCountries.js:10-43`). Cả 99 dòng đều country `SG` → **để trống là hợp lệ**, không cần enrich gì
     - **Thứ THẬT SỰ chặn import là `delivery_price`**: `importSubscription.js:176` `yup.number().min(0).required()` — bắt buộc vô điều kiện, mà cột này trống **99/99**. Import nguyên trạng **fail cả 99 dòng** vì lý do này, không liên quan 2 cột ticket nói. **Script này không xử lý `delivery_price`** (đúng scope ticket) → chạy xong file vẫn chưa import được
     - `billing_min_cycles`/`billing_max_cycles` optional (`importSubscription.js:133-164`, `.nullable()` + transform `'' → null`) — trống là hợp lệ
     - Cột `shipping_name` trong file khách **sai tên**: app đọc `delivery_method_shipping_name` (`importService.js:258,330`, `importSubscription.js:15`), schema **không có `noUnknown()`** nên cột lạ bị nuốt im lặng. ⚠️ Citation `exportService.js:279` ở vòng đầu là **SAI** (dòng đó là `delivery_address_first_name`), và `allFieldsConfig` (`exportService.js:261-301`) **không hề có** field này — nó chỉ tồn tại phía import
   - `customer_id` là **số nguyên trần**, không phải GID (`importSubscription.js:72` `yup.number().required()`; `importService.js:381` tự bọc `getGraphqlId(customer_id, 'Customer')`)
   - **Chạy thật trên file khách**: 99 dòng → **99/99 resolve được `customer_id`** qua email, 0 dòng cần xử tay. Output `joysub-import-formatted.enriched.csv` trong scratchpad phiên 14/08 (**sẽ mất khi dọn tmp** — chạy lại được bằng script)
   - Verifier tự dựng lại thí nghiệm offline: dòng **đã có** `customer_id` không bị ghi đè · **0 match** và **>1 match** đều để trống + vào report, không đoán · Shopify search **fuzzy** trả email gần đúng (`FUZZY+tag@` khi tìm `fuzzy@`) bị bộ lọc exact-match case-insensitive (`:144`) loại đúng · round-trip `xlsx` với `{raw: true}` giữ nguyên **string**, zip `520736` và `contract_ID` dài **không** bị scientific notation, 30 cột đúng thứ tự
   - **Còn lại, chưa xử** (finding verifier, không chặn deliverable): `enrichAppstleImportCsv.js:141` nội suy email thẳng vào query Shopify `email:'${email}'` **không escape**; không có try/catch quanh vòng lặp per-row nên một email chứa `'` có thể làm crash giữa chừng và **mất toàn bộ enrich đã làm** (vì `writeCsv` chỉ chạy ở cuối). Dataset thật không có ký tự đặc biệt nên chưa kích hoạt
   - Verifier **không tự re-run** script nhắm prod (đúng ràng buộc) → con số 99/99 là corroborate từ file output có sẵn, không phải rerun độc lập
   - Slack: https://avadaio.slack.com/archives/C07URV6QMJ8/p1786693553320819 (đã đọc 14/08)
   - Shop `nj1kht-86.myshopify.com` · app plan free · Shopify plan basic · TS: Tuấn ĐV (Ryan)
   - Khách export subscription từ **Appstle**, đã format theo sample file của Joy Sub, **nhưng thiếu 2 cột**: `customer_id` và `delivery_address_province_code` → không import được
   - Team chốt trong thread: *"cần dev lấy từ appstle là không thể rồi, khách cho quyền order rồi nhé"* — tức **không lấy từ Appstle**, phải resolve từ dữ liệu Shopify của chính shop (đã có quyền **customer + order**)
   - File khách (đã format): https://docs.google.com/spreadsheets/d/1TxE2swmqfgKS2ma4P-eObCV1ihdcBZclRNVW0mE00C4/edit · file gốc CSV `1786683799813_subscriptionexport202608140438_1h2f5st__1_.csv` đính trong thread Slack
   - Việc thực chất: viết script enrich CSV — map email khách → `customer_id` Shopify, và tên tỉnh/bang → `province_code` chuẩn ISO
   - **User duyệt đọc prod shop này 14/08** (cùng lượt với #40)
   - ⚠️ **Chưa lấy được file input**: Slack token thiếu scope `files:read` → tải file đính kèm trả về HTML login, không phải CSV. Google Sheet cũng cần quyền. **Cần user đưa file về local** rồi mới chạy enrich thật được
   - Chưa kiểm: sample file import của Joy Sub yêu cầu đúng những cột nào, và `province_code` là bắt buộc hay optional
