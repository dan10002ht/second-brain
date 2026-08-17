# Joy Subscription — BRIEF Kookut (shop `kookut.myshopify.com`)

<!--
  `[ ]` chưa làm · `[⏳ HH:MM]` đang chạy · `[⏸️]` chờ người, đừng nhận · `[✅ YYYY-MM-DD]` xong
  Task xong quá 3 ngày → /looptasks tự dọn sang BRIEF-done.md
  Chạy (cwd = repo subscriptions, không phải brain):
  /loop 5m /looptasks ~/projects/my-brain/10-projects/subscriptions/BRIEF-kookut.md

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


<!-- Tách khỏi BRIEF.md ngày 2026-08-17 theo yêu cầu dantt: gom mọi task liên quan
     shop kookut về một file. Số task giữ NGUYÊN (#28/#32/#40/#44/#51) để mọi
     wiki-link [[#nn]] trong hai file vẫn trỏ đúng. -->

## Tasks

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

51. [⏸️] **[P0] Kookut — audit TOÀN BỘ issue CS tổng hợp, tìm chỗ fix chưa triệt để / còn sót**
   - **✅ AUDIT ĐÃ CHẠY 17/08** (13 agent, 6 chiều + đối kháng, ~48 phút, read-only, 0 mutation).
     **📄 KẾT QUẢ: `docs/kookut-audit-51.md`** (repo, untracked, 226 dòng) · bằng chứng thô giữ ở
     `~/projects/my-brain/10-projects/subscriptions/kookut-audit-evidence/` (92 file, 1.2M — scratchpad đã copy ra vì sẽ bị dọn)
   - Còn ⏸️ vì **mọi việc sửa đều cần người duyệt** (merchant/Product/Lead) — audit chỉ đọc, không sửa gì
   - **5 con số chảy máu hôm nay**: 28 contract/36 line sai `basePrice` (+81/−70 mỗi kỳ) · 5 contract mất hẳn discount 5%, **8.73 CHF đã thu thừa trên 4 đơn PAID** · 5 contract free ship vĩnh viễn · 4 contract ACTIVE gắn thẻ đã hết hạn · 13 cặp (contract,cycle) retry vượt cấu hình 3 lần, cao nhất **13 lần/cycle** trong khi `sendEmail: true`
   - **🔴 BA ĐIỀU PHẢI ĐÍNH CHÍNH — đã nói sai, xem mục 5 của report**:
     1. **`••••7216` CÓ THẬT** — charge thành công 8 lần (#7266→#10041), verify bằng `transactions.paymentDetails.number` trên Shopify + `maskedNumber` trong 8 order doc. Kết luận "không tồn tại card đó / lỗi hiển thị" là **sai**. ⚠️ **KHÔNG backfill `maskedNumber`** — sẽ xoá dữ liệu lịch sử vốn ĐÚNG
     2. **"Sync không ghi đè nên sửa tay an toàn" SAI với contract cross-currency** — detector so `shopifyPrice`(EUR) với `p.variant.price`(snapshot CHF), khác đơn vị nên **luôn true** → ghi đè `basePrice` mỗi webhook `product/update`. Đúng ở nhánh cùng currency (CHF), sai ở nhánh EUR. Sửa [[#28]] cho đúng
     3. **"Khách không cancel được là do config merchant" SAI** — `cancelSubscription=true`, 86 contract ACTIVE không cái nào `enabledMinimumOrder=true`. **Khách đúng, team sai**
   - **🛑 CHẶN TRƯỚC MỌI LẦN APPLY GIÁ**: Pacific Tuna & Sardine **chưa publish** vào catalog Europe/France → giá FIXED 1.70/40.00 đang **vô hiệu**, Shopify tự quy đổi ra 1.95/45.95. Ghi 1.70 mà chưa publish thì lần sync sau đẩy về 1.95. ⇒ Việc đầu tiên là **bảo merchant publish**, không phải chạy script
   - ⚠️ **`repairContractLinePrices.js` là NGUỒN HỎNG DỮ LIỆU** — bản sửa tay 12/08 tự nó hạ sai một dòng vốn đúng (Chicken & Duck Dry Cat 1.5kg `23 → 1.7`). Phải review lại script trước khi dùng, cộng thêm cảnh báo 🛑 sẵn có ở [[#28]]
   - **⚠️ BLAST RADIUS NGOÀI KOOKUT**: `recurringOption: lowest` là **mặc định toàn hệ thống** (`const/default.js:270`), và code đang quote nhóm `ONE_TIME_PURCHASE` cho contract subscription (`shippingProfileService.js:500`, probe 4/4 ca). Bật tính lại phí ship mỗi kỳ bằng code hiện tại = **thu dư hàng loạt trên MỌI shop**. Phải lọc `groupType == SUBSCRIPTION` trước → **Product/BU duyệt**, không phải quyết định kỹ thuật. Sửa lại nhận định ở [[#32]]
   - **Cơ chế chung của "33/54 fix rồi lại bị"**: `subscriptionDraftLineItemUpdate` **nuốt lỗi** (`contractService.js:682-700` chỉ `console.error` + return undefined), caller không kiểm rồi vẫn commit draft — 3 call-site. Đây là ứng viên hợp lý nhất, và trùng đúng rủi ro đã ghi ở [[#44]]
   - **Report CS phải sửa**: nhóm #2 (discount sellingPlanId) hạ **🟢 → 🟠** — code fix 16/06 **không repair dữ liệu cũ**, 5 contract còn nhiễm tới hôm nay
   - **`docs/kookut-shipping-audit.md` có 2 dòng sai** (lấy số từ Firestore stale): `150579708285` thực tế Shopify đã thu 10 CHF · `156384657789` thực tế thu đúng 5.90. Danh sách mất phí ship: **6 → 5**
   - Report có mục **"Đã bác bỏ — đừng điều tra lại"** (12 kết luận, kèm lý do) và mục **"Chưa kiểm được"** (17 khoảng trống, nói thẳng) — đọc trước khi ai mở điều tra mới
   - **Việc tiếp theo**: (1) đính chính với CS trước khi họ trả lời khách · (2) gửi merchant 4 contract thẻ hết hạn — rẻ nhất, chặn 3 ticket mới · (3) yêu cầu merchant publish Tuna vào catalog · (4) chưa lượng hoá tiền hoàn ở trục giá (mới có 8.73 CHF ở trục discount)
   - _(dantt giao 17/08, sẽ chạy ở session RIÊNG — task này là điều tra, không phải sửa vội)_
   - **Yêu cầu gốc của CS (Slack, `U07GD3PHXKP`)**: _"Với KH này c sẽ tổng hợp lại issue với thread các thứ, xong c cần nhờ e review giúp xem còn lỗi nào fix chưa ổn thoả hay sót gì đó không. Để giảm tần suất báo lỗi của KH này xuống. Chứ cho 1* đến nơi rồi"_
   - **2 mối quan tâm lớn nhất của khách** (CS chốt): (1) **charge sai** — phí ship, discount, giá sản phẩm → dev check; (2) **customer của họ khó tự manage sub** — muốn sửa gì cũng lỗi (page lỗi / không hiện gì) → phải nhờ CS edit hộ. CS đang tự check phần (2)
   - Shop: `kookut.myshopify.com` · plan free · Shopify unlimited · install 2025-05-31 · Crisp session `3c64268e-a3f0-4881-b2f5-a7b6a273136f`
   - **⚠️ CHƯA ĐỌC ĐƯỢC report tổng hợp của CS**: https://claude.ai/code/artifact/000c62db-83ae-4e29-9c87-0205eb846362 → `WebFetch` trả `artifact read failed: served to you as a public (non-member) reader, reading public artifacts that way is not enabled yet`. **Việc đầu tiên của session sau**: nhờ dantt mở artifact rồi paste nội dung vào, hoặc share lại cho account có quyền. Report này là bản CS map từng lỗi ↔ ticket ↔ thread, thiếu nó thì audit sẽ sót
   - **Thread gốc**: https://avadaio.slack.com/archives/C07URV6QMJ8/p1786732644004469?thread_ts=1786494004.579699 (31 messages, đã đọc — tóm tắt bên dưới)

   **Danh sách issue đã dựng lại được từ Slack — cần verify từng cái:**

   | # | Issue | Contract/Order | Trạng thái theo Slack | Cần kiểm |
   |---|---|---|---|---|
   | A | Salmon 70g lấy giá pack 24x70g (€38 thay vì €1.71), sub hiện €228 | `#151147970941` | dev báo "đã sửa", đơn 14/08 €313.69 → €95.95 | root cause đã chặn chưa, hay chỉ vá dữ liệu |
   | B | Tuna & Sardines 24x70 tăng 40 → 43,65 EUR · Tuna 70g hiện 1,95 EUR (khách nói chưa bao giờ có giá này) | `#151147970941` | dev xác nhận **khách nói đúng**, app ghi sai từ 11/08 lúc thêm variant 24x70g | **nối thẳng với [[#28]] [[#44]] đang ⏸️** |
   | C | Free shipping áp cho MỌI upcoming order, expected chỉ free đơn đầu | `#154109116797`, order 10799 | dev "fix lỗi cho khách rồi", **root cause chưa xong** | contract nào khác cũng dính |
   | D | Shipping thu 7.99 EUR thay vì 10 EUR đã cấu hình | `#151147970941` | Jira **SB-14315** + MR !2344. Chẩn đoán: `autoUpdateShippingRate()` gọi `convertBaseCurrencyToSpecificCurrency()` cả khi shopCurrency === contractCurrency (EUR→EUR), tỷ giá không map 1.0 → 10.00 rescale thành ~7.99 | MR đã merge/deploy chưa · **nối [[#32]]** |
   | E | Company name không lưu + đổi shipping option xong save thì revert về option cũ | `#153505399165` | fix bằng MR !2398 (đã merge, pipeline từng fail phải retry). Phần revert: do merchant để "update when items/address change" | verify fix còn sống sau các đợt deploy |
   | F | Free shipping cho đơn > 50 EUR: đơn đầu 0 EUR đúng, các đơn sau bị tính €5.90 | `#153505399165` | dev trả lời "chỉ áp cho checkout, không áp recurring — biz của Shopify" | **câu trả lời này đáng nghi**, cần kiểm lại chứ đừng nhận luôn |
   | G | Charge fail 4 lần (12/08 10:03, 13/08 06:46, 13/08 08:00, 14/08 08:01 UTC), đều `PAYMENT_METHOD_DECLINED` | khách Caroline Charbonneau | dev kết luận **không phải lỗi hệ thống**: Mastercard ••••1932 hạn **07/2026** → hết hạn trước lúc charge (8/2026); 9 kỳ trước 09/2025–06/2026 đều ok | ⚠️ **CS phản biện: order cũ của contract đó dùng card đuôi ••••7216, không phải 1932** → có khả năng đổi payment method giữa chừng, hoặc app đọc nhầm card. **Chưa ai giải thích mâu thuẫn này** |

   - **Cách làm gợi ý**: đây là task **audit nhiều chiều**, hợp với skill `/audit-sweep` (mỗi chiều 1 agent read-only, rồi đối kháng từng finding). Chiều đề xuất: pricing/contract · shipping/recurring · payment method · customer portal (phần (2) của CS) · dữ liệu contract còn sai trên prod
   - **Ràng buộc**: chỉ ĐỌC prod, **KHÔNG `--apply`**, không ghi Firestore/Shopify. [[#28]] có cảnh báo 🛑 đừng chạy `repairContractLinePrices.js --apply` — vẫn còn hiệu lực
   - Deliverable mong muốn: bảng "issue → root cause → đã fix triệt để chưa → còn contract nào dính" đủ để CS confirm với khách, đúng như dev đã đề nghị trong thread: _"e list ra các contract cũng như phần giá và risk của từng contract để a/c confirm với khách"_


   1. [✅ 2026-08-17] Check report tổng hợp của CS — **đã đọc đủ**, bản local: `~/projects/my-brain/10-projects/subscriptions/kookut-bug-report.md` (236 dòng, CS `U07GD3PHXKP` post 15/08). Nguồn Slack: https://files.slack.com/files-pri/TS59J9C31-F0BQEP5S8F5/kookut-bug-report.md
      - ⚠️ **Không tải được file Slack bằng token hiện tại** — thiếu scope `files:read` (`~/.config/avada/slack` chỉ có identify/history/search/chat:write/reactions). `slack-files.com` permalink public trả 404 vì file chưa share public. Muốn agent tự đọc file Slack lần sau: reinstall token tại https://slack-oauth.avada.net/slack/install. Metadata + 5 dòng preview thì `conversations.replies` lấy được (field `files[].preview`, truncated)
      - ⚠️ `slack api conversations.replies` qua helper **fail** (`invalid_arguments`) — helper gửi JSON body, method này đòi form-encode. Dùng `curl -H "Authorization: Bearer $TOKEN" "https://slack.com/api/conversations.replies?channel=...&ts=..."` thay thế
      - **Report chứa gì**: 54 lượt báo lỗi / 14,5 tháng (2 inbox Crisp + Slack + 20+ ticket) → 15 nhóm lỗi, 8 chuỗi tái diễn, xếp hạng theo mức khách QUAN TÂM. Crisp segment `high_risk_don't_ask_for-review`
      - **Số đắt nhất**: **33/54 là "fix rồi lại bị"**; 7 lỗi/tháng ngay tháng đầu sau cài. Khách tự nêu 2 main issue: (1) giá/overcharge, (2) không tự quản lý sub được
      - **Khớp task sẵn có, không có gì mới**: #9 → [[#28]][[#40]][[#44]] · #1 → [[#32]] · #7 → #51-D · #8 → #51-E · #11 → #51-G · #15 → #51 phần (2). BRIEF sâu hơn report ở cả 3 case đang mở
      - **🔴 BA CHỖ REPORT LẠC QUAN HƠN THỰC TẾ — phải báo lại CS trước khi họ dùng trả khách**:
        1. #9 ghi *"sửa tay 14/08 €313.69→€95.95"* — chỉ đúng 2 dòng **Salmon**. Hai dòng **Tuna vẫn sai** (1.95 vs 1.70 · 45.95 vs 40.00) và order **#10831 (14/08, Paid) đã thu thừa ~7.06 EUR** → khách **đã bị trừ tiền sai thật**, chưa hoàn. Xem [[#44]]
        2. #11 xếp ⚫ *"không phải bug app"* **quá sớm** — mâu thuẫn card `••••7216` vs `••••1932` do chính CS nêu vẫn chưa ai giải thích (#51-G)
        3. §4 *"Sửa tay không ăn vì lần sync sau ghi đè lại"* — **sai cơ chế**. `findContractsNeedPriceUpdate` so `variant.price`, không so `basePrice` → sync **không** ghi đè dòng đã sửa. Hệ quả đúng còn tệ hơn: dòng hỏng **vô hình** với sync, chạy lại bao nhiêu lần cũng không tự chữa ([[#28]])
      - **🆕 NĂM NHÓM CHƯA CÓ TASK NÀO** (bổ sung vào phạm vi #51):
        - **#5 sai currency CHF thay vì EUR** (fix 06/07, MR 2284/2293) — **cùng họ root cause đang nghi ở [[#44]]** (không truyền country/market context). Là manh mối, không phải case đã đóng
        - **#12 khách của Kookut không cancel được sub** — team đổ cho config, KH phủ nhận, nhắc lại 10/06 · 03/07 · 15/07. Thuộc "main issue #2"
        - **#2 discount 5% không áp khi swap product cùng `sellingPlanId`** (fix 16/06) — chính tỉ lệ 0.95 này đang là giả định trong script repair của [[#44]]
        - **"Page Not Found" khi edit sub** (21/11 → fix → 01/12 lại bị, dev không repro) — trùng gotcha đã biết `embed-route-404`, đáng thử lại theo hướng đó
        - **Frequency hiển thị sai** — "fixed" ≥2 lần vẫn tái diễn (01/07/25 · 05/10/25 · 16/01/26 · 02/03/26)
      - **📌 THREAD GỐC 41 message (đọc lại 17/08, `C07URV6QMJ8` ts `1786494004.579699`) — 3 thứ report KHÔNG có**:
        - **🔴 HAI CÂU ĐÃ NÓI VỚI CS/KHÁCH NAY ĐÃ SAI — phải chủ động đính chính, đừng để khách tự phát hiện**:
          1. *"Khách chưa bị thu sai đồng nào… kỳ 14/08 mới là lần đầu sai — **không cần hoàn tiền**"* (mình nói 12/08 16:34). Nhưng order **#10831 ngày 14/08 đã Paid, thu thừa ~7.06 EUR** trên 2 dòng Tuna ([[#44]]) → **có phải hoàn tiền**. Đây là chỗ dễ thành "lại nói sai" nhất với khách đang doạ 1★
          2. *"giá sai lưu bên Shopify nên sửa trong app không tác dụng, **lần đồng bộ sau lại ghi đè**"* (mình nói 12/08 16:34) → **đây chính là nguồn của §4 report CS**, và nó **sai cơ chế** (xem gạch đầu dòng 3 ở trên). Câu này là lời mình, không phải CS suy diễn
        - **🆕 YÊU CẦU MỚI CỦA CS 17/08 11:00, chưa nằm trong #51**: *"cho claude check qua xong e **verify lại chỗ data của sub hay bị sai (giá, shipping, discount) 1 lần nữa** giúp c"* + *"Họ dùng cái **market**, chỗ ý lỗi mấy lượt rồi"* → **CS tự chỉ đúng vào Markets**, khớp root cause đang nghi ở [[#44]] (không truyền country/market context) và #5 (currency CHF/EUR). ⇒ audit #51 phải có **chiều Markets/catalog** riêng, và phải phủ **cả 3 trục giá–ship–discount** chứ không chỉ giá
        - **Card `••••1932` vs `••••7216`**: CS xem ảnh rồi xác nhận *"Nhưng mà show expire tháng 7 thật"* — tức hạn 07/2026 là thật, mâu thuẫn nằm ở **order cũ dùng đuôi 7216**. Giả thuyết chưa kiểm: khách đổi payment method giữa chừng, hoặc app đọc payment method hiện tại thay vì cái đã dùng ở order đó (#51-G)
      - Khuyến nghị của CS đáng giữ nguyên khi lên plan #51: dứt điểm #9 trước → gom họ lỗi giá/ship thành 1 ticket root-cause hệ thống (thay vì fix tay từng contract) → trả lời roadmap self-service UI → chốt chính thức 2 case won't-fix (#4 pickup Mondial Relay, #13 tag-gating) → 1 owner duy nhất cho Kookut
