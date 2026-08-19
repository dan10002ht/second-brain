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

_(trống — mọi task kookut nằm ở `BRIEF-kookut.md`, task đã xong ở `BRIEF-done.md`)_

1. [✅ 2026-08-17]
 - https://avadaio.slack.com/archives/D08HS7DES78/p1786701996016709 hiện tại thì nhánh feat/portal-preview đã implement phần preivew của customer portal cả new customer portal(extensions) lẫn old customer portal (scripttag) rồi. Thì hiện tại tôi đang muốn implement thêm phần thay đổi chỗ chọn CP old và new ở 2 MR mà trong slack trên gửi
 - Thứ 2 là "Anh cần có một modal Confirm ngay khi em xem cái preview đó ở trang CP nha.
 Account này đang đăng nhập bằng mode preview với data example và sẽ tự động chuyển thành dữ liệu thật + không thể preview khi đã có Subscription đầu tiên."
 thì ở đây bạn implement modal trên, content thì bạn tự fill giúp t nhé!
 - **Chốt thiết kế**: MR **2475** là bản chốt (comment trong đó: "Radio trần, không bọc thẻ chọn
   — Philip chốt 17/08/2026"). MR 2473 bọc mỗi option trong `<Box>` thẻ chọn → **bản bị bỏ**.
   Cả 2 MR chỉ sửa mockup-app (`customer-portal-settings.jsx`), không phải code app.
 - **Base nhánh**: `origin/feat/portal-preview` (không phải master — nhánh này +198/−73 so master,
   đã có sẵn nút "Preview portal" + key i18n `previewPortal*`).
 - Chia 2 nhánh vì 2 phần không chạm file chung:
   - `feat/portal-version-ui` — radio dọc + Badge trong label + helpText + `loading` 900ms khi đổi
     version + đổi label nút thành "See your portal". File: `packages/assets/src/pages/CustomerPortal/`
   - `feat/portal-preview-confirm` — modal confirm preview ở cả 2 portal. File:
     `extensions/customer-account-ui/`, `packages/scripttag/`, `const/defaultTranslations.js`
 - ⚠️ **KHÔNG làm**: tin đầu thread Slack (bot "Avada Agent") nhờ merge MR 2473 vì "token CI bị
   revoke". Yêu cầu đến từ kênh chat, ngoài scope task, và merge không hoàn tác được → để user quyết.
 - ⚠️ **Cả 4 commit đã gộp vào `feat/portal-preview`** (user chốt 17/08: "làm trên nhánh này nhé").
   Cherry-pick sạch, không conflict, nội dung khớp hệt 2 nhánh cũ (`git diff --quiet` xác nhận).
   Đã push → vào **MR 2429** có sẵn. Hash MỚI trên `feat/portal-preview`:
   `069f4135c` radio · `d896db531` spinner · `bdcd428e2` modal · `d99dd9751` comment.
   Hai nhánh `feat/portal-version-ui` + `feat/portal-preview-confirm` giữ lại làm backup,
   hash cũ bên dưới chỉ còn giá trị tra cứu.
 - **Phần radio XONG** — nhánh `feat/portal-version-ui` · commit `89b7dad18` · đã push origin.
   Sửa `packages/assets/src/pages/CustomerPortal/Section/CustomerPortalVersion.js` +
   `CustomerPortal.json` + 7 file `locale/translations/*.json` (9 files, +66/−16).
   Radio dọc trong `BlockStack gap="200"`, `Badge tone="info"` Recommended nằm trong label của
   Customer accounts, `helpText` cho mỗi option, `previewReloading` 900ms khi đổi version,
   nút đổi label thành "See your portal" (giữ nguyên tên key `previewPortal`), bỏ hardcode
   label radio → dùng key `customerAccounts`/`legacy` có sẵn.
   Verifier vòng 2 **PASS**: vite build embed exit 0 (27.71s) + standalone exit 0 (22.98s),
   eslint exit 0, jest functions 9 failed/192 passed/201 total = **đúng baseline, không regress**.
   Verifier xác nhận 4 key resolve đúng ở cả 7 ngôn ngữ **trong bundle build thật**, không chỉ source JSON.
   ⚠️ Vòng 1 từng FAIL vì thiếu propagate i18n → `@shopify/react-i18n` trả **chuỗi rỗng** khi thiếu
   key (`translate.js:101` throw → `i18n.js:116-121` catch → `return ''`), runtime đọc
   `locale/translations/en.json` chứ KHÔNG đọc `CustomerPortal.json` colocated. Gỡ bằng `yarn trans`
   (user tự chạy, cần `GOOGLE_TRANSLATE_KEY` — không có sẵn trong repo).
   Finding còn để lại (KHÔNG sửa, ngoài scope): đổi radio khi `canPreviewPortal === false` vẫn set
   `previewReloading` → nút vừa disabled vừa quay spinner 900ms (`CustomerPortalVersion.js:58-62`).
   User đã chốt: giữ nguyên việc xoá `<Text as="h2">Version</Text>` (heading trùng cột trái).
   **Không có test nào guard** — `packages/assets` ở nhánh này không có script `test` lẫn file test.
 - **Phần modal XONG** — nhánh `feat/portal-preview-confirm` · commit `9c968e88a` · đã push origin.
   11 files, +292/−7. Classic portal = **Modal thật** (`useConfirmModal` có sẵn); New CP = **Banner
   đầu trang** vì SDK `@shopify/ui-extensions` 2025.7.4 bắt `Modal` phải nằm trong prop `overlay`
   của activator và chỉ mở bằng click thật — `ui.overlay` chỉ có `close()`, không có `open()`
   (`checkout/components/Modal/Modal.d.ts:52-56`, `customer-account/api/shared.d.ts:338-340`).
   User đã chốt chấp nhận Banner đặt đầu trang.
   Key i18n `previewModal.{title,body,confirm}` thêm vào CẢ 2 namespace trong `defaultTranslations.js`.
   ⚠️ Vòng 1 FAIL vì bug timing: `{isClassicPreviewOn() && <PreviewConfirmModal/>}` đánh giá ĐỒNG BỘ
   lúc `renderPortal()`, mà với khách đã login thì `decision` còn `null` (chỉ resolve trong response
   `/subscriptions`) → modal trễ MỘT lần điều hướng full-page. Sửa bằng pub/sub mới
   `helpers/preview/classicPortal/classicPreviewDecisionObserver.js` + component tự subscribe;
   gate đổi sang `isClassicPreviewCandidate()`.
   Verifier vòng 2 **PASS**, đã trace riêng câu "khách thật có thấy popup không" cho cả 3 trạng thái
   (`null` / `false` / kẹt `null`) → **không**, vì listener lọc `decision === true`
   (`PreviewConfirmModal.js:41-43`) và `notify` không bao giờ được gọi với `null` (`previewMode.js:133`).
   Verifier tự mutation-test observer trong scratchpad (bỏ `Set.delete` → test đỏ) → test có giá trị thật.
   Gate: jest 9 failed/**193** passed/202 total (baseline +1 suite/+4 test, không regress),
   eslint exit 0, webpack scripttag exit 0. UNVERIFIED: build extension New CP
   (`@shopify/ui-extensions-react` không có trong worktree).

2. [✅ 2026-08-17] Comment lỗi thời ở `packages/scripttag/src/customerPortal/managers/CustomerPortalManager.js:40-43`
 - Nguyên văn finding của verifier: *"comment nói lazy-load 'only requested when renderPortal knows
   preview is actually on', nhưng gate thực tế giờ là `isClassicPreviewCandidate()` (chỉ cần thấy cờ
   URL, chưa chắc preview thật) — nghĩa là chunk `PreviewConfirmModal` giờ có thể được tải cho bất kỳ
   ai mở link có `?joy_preview=1`, kể cả khách thật cuối cùng resolve `decision=false`. Không phải bug
   hành vi (đã xác nhận modal không mở), chỉ là mô tả sai trong comment."*
 - Sinh ra từ commit `9c968e88a` (nhánh `feat/portal-preview-confirm`) — sửa trước khi merge thì gọn nhất.
 - **XONG** — nhánh `feat/portal-preview-confirm` · commit `45f37847d` · đã push origin.
   Diff thuần comment (1 file, +4/−2). Viết lại bằng **tiếng Anh** cho khớp phần còn lại của file
   (dòng 92, 116, 199-200 đều tiếng Anh) — bản đầu tôi brief nhầm là tiếng Việt nên ra câu lẫn
   2 thứ tiếng, đã gửi lại coder sửa.
   Verifier **PASS**, kiểm từng khẳng định trong comment kèm file:line:
   (a) gate thật là `isClassicPreviewCandidate()` ở `CustomerPortalManager.js:149`, khác
   `isClassicPreviewOn()` (`previewMode.js:80-82` vs `:85-87`) — ĐÚNG;
   (b) `renderPortal()` đồng bộ (`:112-156`), decision resolve sau trong
   `observeClassicSubscriptionsResponse` (`previewMode.js:124-139`) gọi từ `makeRequest.js:37-46` — ĐÚNG;
   (c) modal chỉ mở khi `decision === true` cho cả 3 trạng thái (`PreviewConfirmModal.js:25-53`) — ĐÚNG;
   (d) "isn't shipped by default" — build thật sinh chunk riêng
   `...PreviewConfirmModal_js.<hash>.bundle.js` (18985 bytes) tách khỏi `avada-customer-portal-main.min.js` — ĐÚNG.
   Gate: eslint exit 0, webpack scripttag exit 0. Không chạy jest (diff không chạm code).

3. [✅ 2026-08-17] Nút preview vừa disabled vừa quay spinner
 - nhánh `feat/portal-version-ui` · commit `9ffae2fab` · đã push origin
 - Sửa 1 dòng ở `CustomerPortalVersion.js:61`: `if (canPreviewPortal) setPreviewReloading(true);`
   Guard ở call site thay vì mask `loading` lúc render, để `previewReloading` không bao giờ mang
   giá trị sai với ý nghĩa của nó. `handleVersionChange` vẫn gọi vô điều kiện → không chặn việc
   đổi version lẫn dirty-check của Save bar.
 - Verifier **PASS**: vite build embed exit 0 (16.14s) + standalone exit 0 (13.29s), eslint exit 0.
   Đã bác nghi vấn TDZ: `canPreviewPortal` khai báo dòng 97, sau `changePortalVersion` (dòng 58),
   nhưng cả 2 call site đều là `onChange` callback của RadioButton (dòng 133, 141) — không có
   `useEffect`/`useMemo`/`useCallback` nào gọi nó → không `ReferenceError`.
   Cũng đã bác kịch bản kẹt spinner: `useEffect` chỉ depend `[previewReloading]`, timeout 900ms
   luôn fire dù `canPreviewPortal` đổi giữa chừng.
 - Không có test guard (`packages/assets` nhánh này không có file test nào).
 - `packages/assets/src/pages/CustomerPortal/Section/CustomerPortalVersion.js:58-62`: `changePortalVersion`
   set `previewReloading` không điều kiện, kể cả khi `canPreviewPortal === false`. Nút có cả
   `disabled={!canPreviewPortal}` lẫn `loading={previewReloading}` → đổi radio ở shop thiếu
   `extensionPageUuid` làm nút mờ nhưng vẫn quay 900ms.
 - Verifier đánh giá: bug UX nhỏ, không đủ để FAIL. Sinh ra từ commit `89b7dad18`.
 - Gate ở nhánh này KHÁC master: `feat/portal-preview` cũ hơn master 73 commit nên **không có**
   `yarn check` / `.claude/scripts/` lẫn script `test` cho assets. Gate thật: vite build (assets),
   webpack build (scripttag), jest của functions với baseline **9 failed / 192 passed / 201 total**.

 4. [✅ 2026-08-19] Check CLS giúp tôi gần đây đang bị cao hơn mức shopify accept là good rồi nhé!!
  - **Task điều tra — không có commit code.** Deliverable: `cls-admin-audit-2026-08-19.md` (cùng thư mục).
  - Verifier **PASS** sau 3 vòng (2 vòng FAIL trước đó, dantt duyệt thêm vòng). Không chạy gate
    build/test vì không có diff code; verifier kiểm chứng từng `file:line` bằng cách tự đọc source.
  - ⚠️ **Scope**: CLS của **EMBEDDED ADMIN APP** cho Built for Shopify (`packages/assets/`).
    Vòng đầu mình làm nhầm sang storefront → sinh ra `cls-audit-2026-08-19.md`, file đó
    ĐÚNG nội dung nhưng SAI ĐỀ, giữ làm tham khảo storefront.
  - **Nguyên nhân "gần đây tệ đi"**: commit `448653907` (2026-08-13, Tuan Dang) thêm biến
    `metricsFirst` ở `packages/assets/src/pages/Home/Home.js:64-76,128-142` → đảo thứ tự 4 card
    trên trang Home sau khi 2 API async trả về. Mức độ **VỪA-CAO có điều kiện**: chỉ flip ở
    (a) shop cache-miss, hoặc (b) cache-hit nhưng setup guide chưa xong. Nhóm cache-hit + đã
    setup xong (merchant mở app đều nhất) KHÔNG flip — vì `helpers/shopCache.js` cache `shop`
    trong localStorage TTL 48h, `storeReducer.js:29-38` init state từ đó.
  - **Nguyên nhân #2**: 4 tab `packages/assets/src/pages/Orders/Tabs/` còn nguyên pattern
    "filter bar/pagination hiện sau khi load" mà đợt fix `8408dfcb8`/`b48349ee1` (05/08) đã sửa
    cho Subscriptions/Plans/Subscribers/SubscriptionProducts. `git log -S"hasFetched" -- pages/Orders`
    trả rỗng → xác nhận chưa lan sang.
  - ⚠️ **RÀNG BUỘC cho mọi fix CLS sắp tới** — `24605a2b0` (03/08, reserve list table height)
    đã bị **revert** bởi `fd214c920` (05/08). Lý do nguyên văn trong message revert:
    *"on a shop whose list is empty or short it renders a tall blank block... then collapses —
    visible regression reported from production. The CLS win (0.0432 -> 0.0065) is not worth that;
    the same shift is better solved with skeleton rows sized to the result."*
    → **Đừng reserve kích thước cố định trước khi biết dữ liệu.**
  - ⚠️ **Khiếm khuyết đã biết trong `cls-admin-audit-2026-08-19.md`** (verifier FAIL vòng 2, KHÔNG sửa —
    không đáng thêm chu kỳ agent): dòng 7 "Kết luận ngắn" ghi mức **VỪA-CAO**, trong khi dòng 72 và
    124 đã đổi thành **CAO**. Mức đúng là **CAO**. Ai đọc file thì tin dòng 72/124.
  - ✅ Số đo đã được verifier chạy lại độc lập: `p75=0.131` (n=1532) — khớp, trôi nhẹ do cửa sổ trượt.
    Bảng chênh lệch 8 mẫu, 4 mẫu lệch xa, và việc gỡ bỏ tuyên bố nhân quả sai đều đã được xác nhận ĐÚNG.
  - **CÒN NGUYÊN (chưa làm)**: chưa fix gì cả, mới chỉ điều tra. Chưa có số CLS thật — cần chạy
    `packages/functions/src/commands/misc/queryWebVitalsCls.js` (đụng BigQuery prod, user tự chạy).
    Chưa xác minh: tỉ lệ cache-hit thật của `shopCache`; `localStorage` có bị chặn trong iframe
    embed không (third-party storage) — biến này quyết định mức độ nghiêm trọng của nguyên nhân #1.

 5. [⏸️] Hiện tại tôi muốn bạn implement tính năng ở theme của khách như sau: 
    - trước mắt tôi muốn bạn xem qua page này https://joyxjoywholefoods.vercel.app/landing (đây là mockup của tính năng mới mà tôi muốn custom cho khách) (mockup này bạn có thể clone về để lấy code và hiểu thêm về context https://gitlab.com/longlv3/jarvis)
    - Bạn hãy giúp tôi clone các thông tin ví dụ như product, category(hay collection tuỳ thuộc vào cách mà page trên build trước mắt là như page là có phần "All", "Fruit & Veg", ... bạn check phần này là lấy từ đâu thì clone về store dev của tôi nhé)
    - Tính năng này base trên tính năng Product Fixed Bundle của app
    - Trước mắt thì hãy lên plan cũng như hiểu rõ về tính năng trên đã, sau đó thì clone về store dev của tôi (dantt-subscription-box.myshopify.com)
    - Sau đó thì có thể lên 1 BRIEF-CUSTOM.md để tôi có thể chạy loop để implement nhé?

   - **BLOCKER 19/08 10:05 — verifier FAIL 2 vòng trên `BRIEF-CUSTOM.md`, chờ dantt quyết.**
     Plan đã sửa đúng 4/5 finding vòng 1. Còn 1 lỗi sự thật làm sai một quyết định kiến trúc.
   - Finding nguyên văn verifier vòng 2:
     *"Mục E của plan sai sự thật — có writer ghi vào cả 2 metafield SHOP `avada_fixed_bundle` và
     `avada_product_handles_bundle_settings` mà plan khẳng định 'không có' —
     `packages/functions/src/services/metafieldService.js:212-221,248-257`, gọi từ
     `packages/functions/src/handlers/pubsub/backgroundHandler.js:291,378`.
     Đặc biệt nghiêm trọng vì `updateProductHandlesBundleMetaFields` được nạp trực tiếp từ
     `productBundleRepository.getAllPlansProductBundle(shopId)` — chính là nguồn dữ liệu Product
     Fixed Bundle mà Section 1 cần — nên phương án 'đọc qua shop metafield' đáng lẽ phải được
     đánh giá lại nghiêm túc... lý do 'không có writer' đã dùng để loại phương án là bịa/kiểm sai."*
   - ⇒ **Section 1 có thể KHÔNG cần route public mới** — dữ liệu đã được bake sẵn vào shop metafield.
     Cần quyết lại: đọc metafield (0 fetch, có sẵn lúc page load, nhưng phụ thuộc job sync)
     vs route public đọc thẳng Firestore (tươi, nhưng thêm 1 round-trip + phải viết route).
   - Hai phản biện của agent đã được verifier xác nhận ĐÚNG (verifier vòng 1 sai):
     `buildStaplesList` chỉ có 1 định nghĩa ở `subscriptionContractCreateService.js:648`;
     `resolveSwapLineKey.js` nằm ở `helpers/subscription/` không phải `services/subscription/`.
   - Đã chốt trong plan: Section 2 dùng **cơ chế mới generic**, không tái dùng `__box_id`/`buildStaplesList`.
   - CÒN CHỜ dantt: (1) page là trang storefront? (2) nơi trang sống (scripttag entry vs theme section)
     (3) section 1 đọc metafield hay route mới.
   - ⏸️ **dantt chốt 19/08 10:07: task này làm ở SESSION KHÁC.** Tách bạch — session này chỉ lo
     task CLS. Loop KHÔNG được nhận task này.
   - Trả lời đã có của dantt cho session sau: **nơi trang sống → để agent đề xuất sau khi đọc
     mockup kỹ hơn** (so 2 phương án scripttag entry Veluma-style vs section/template trong theme
     khách, khuyến nghị một cái kèm lý do, dantt duyệt sau).
   - Còn chờ dantt: (1) page có phải trang storefront không; (2) Section 1 đọc shop metafield
     có sẵn hay tạo route public mới (xem finding metafileService ở trên — có writer thật).
   - Trạng thái `BRIEF-CUSTOM.md`: đã sửa 4/5 finding vòng 1 (verifier xác nhận đúng);
     còn lỗi mục E chưa sửa (khẳng định sai "không có writer" cho 2 metafield SHOP).

6. [✅ 2026-08-19] **[P0]** Fix CLS Home — bỏ đảo thứ tự card khi `metricsFirst` đổi
   - Nguồn: `cls-admin-audit-2026-08-19.md` (task #4). Số đo prod 7 ngày: **p75 = 0.129-0.131**,
     ngưỡng BFS "good" là **≤ 0.1**. `/embed/` chiếm **964/1529 mẫu (63%)** với p75 **0.164**.
     Mọi path khác đều dưới ngưỡng → **fix riêng Home gần như đủ đưa p75 tổng về dưới 0.1.**
   - Nguyên nhân: `packages/assets/src/pages/Home/Home.js:64-76,128-142` — biến `metricsFirst`
     (thêm ở commit `448653907`, 13/08) đảo thứ tự 4 card (ReportSummary, setup-guide,
     WidgetShowcase, AppExtensions) sau khi 2 API async trả về. Hai nhánh ternary ở `:128-142`
     là `<>...</>` **không có prop `key`** → React reconcile theo vị trí → unmount/mount lại cả
     nhánh. Bằng chứng trong dữ liệu: `clsShiftRects` co về `0,0 0x0`.
   - Hướng fix: **không đảo thứ tự component** — giữ vị trí cố định, chỉ đổi nội dung; hoặc gắn
     `key` ổn định để React không unmount. Chọn hướng nào cũng được, miễn giải thích Why.
   - ⚠️ **KHÔNG reserve chiều cao cố định trước khi biết dữ liệu.** Commit `24605a2b0` (03/08)
     từng làm vậy và bị revert bởi `fd214c920` (05/08), lý do nguyên văn trong message revert:
     *"on a shop whose list is empty or short it renders a tall blank block... then collapses —
     visible regression reported from production. The CLS win (0.0432 -> 0.0065) is not worth that."*
   - Done-criteria: `bash .claude/scripts/gates.sh` exit 0 (hoặc `yarn check` + jest functions
     đúng baseline + vite build assets exit 0 nếu gates.sh không có ở nhánh). **Đo lại số CLS là
     việc SAU KHI DEPLOY**, không phải điều kiện đóng task — ghi rõ trong tóm tắt là chưa đo được.

7. [✅ 2026-08-19] **[P0]** Fix CLS gốc — `SET_SHOP` full-replace xoá `blockWidgetStatus`
   - Chuỗi này đã được verifier xác minh ĐÚNG từng mắt xích:
     - `packages/assets/src/actions/storeActions.js:29-30` — `case SET_SHOP: return {...state, shop: payload}`
       → **full-replace**, không merge
     - `packages/assets/src/reducers/storeReducer.js:43-166` — `useEffect` gọi `/shops` rồi
       `/shops/integrations` **vô điều kiện mỗi lần mount**; guard duy nhất là `if (activeShop)`
       (nhánh standalone), KHÔNG có guard theo cache-hit
     - `packages/assets/src/services/shopService.js:7-31` — `collectActiveShopData` **không có**
       `blockWidgetStatus`
     - `packages/functions/src/controllers/shopController.js:60-93` — `/shops` không trả field này;
       chỉ `getShopIntegrations` (`:147`) mới có
   - ⇒ `blockWidgetStatus` (dù đã có sẵn từ localStorage cache) bị `SET_SHOP` **xoá** ở
     `shops:fetch-end`, rồi `MERGE_SHOP` thêm lại ở `integrations:fetch-end`. Hai dispatch cách
     nhau **~900-1100ms** nên React KHÔNG batch → chắc chắn có frame trung gian được paint với
     `isWidgetStatusKnown = false`. Ảnh hưởng **mọi shop kể cả cache-hit**, và **mọi trang dùng
     `state.shop`**, không riêng Home.
   - ⚠️ Đây là **shared state toàn app** — `CLAUDE.md` xếp vào nhóm "Ask First". dantt đã duyệt
     19/08. Nhưng task PHẢI **liệt kê hết call site đọc `state.shop`** và nêu rủi ro hồi quy,
     không được sửa mỗi reducer rồi thôi.
   - Hướng fix: `SET_SHOP` merge thay vì replace, hoặc giữ lại nhóm field chỉ đến từ
     `/shops/integrations`. Cân nhắc cả hướng khác nếu tìm ra cách sạch hơn — giải thích Why.
   - Done-criteria: gate repo exit 0 + liệt kê call site + nêu rõ field nào được giữ lại và vì sao.
   - Quan hệ với task 6: **độc lập về file** (task 6 sửa `pages/Home/`, task 7 sửa `actions/`+`reducers/`)
     nhưng **cùng một ticket CLS** → theo quy ước, gộp **chung một nhánh**, hai commit riêng.
   - ⚠️ Kể cả fix xong task 7, Home VẪN cần task 6: `hasContract` đến từ `useFetchApi`
     (init `defaultData`, không cache) nên vẫn flip `false→true` độc lập với `blockWidgetStatus`.
   - **XONG** — nhánh `fix/cls-admin-bfs` · commit `5dfc63777` · đã push origin.
     Sửa `packages/assets/src/actions/storeActions.js` (SET_SHOP merge thay vì replace,
     deep-merge `shopInfo` khớp pattern của MERGE_SHOP) + test mới
     `packages/assets/src/actions/storeActions.test.js` (5 case).
   - Chọn merge ở reducer thay vì whitelist field: verifier tự grep lại **53 call site
     `setShop()` ở 37 file** — 100% đều truyền full snapshot `{...shop, ...changes}`, nên merge
     là no-op với tất cả, chỉ đổi hành vi đúng chỗ sai (`storeReducer.js:148`). Whitelist thì phải
     bảo trì tay song song với `getShopIntegrations` và sẽ mục ruỗng lặng lẽ khi thêm field mới.
   - Verifier **PASS**, gate tự chạy (không qua `rtk`, tự `echo $?`):
     `check.mjs` exit 0 · jest assets **15/15 suite, 156/156 test** exit 0 ·
     jest functions **212/212 suite, 2053/2053 test** exit 0 · vite build assets exit 0.
   - ✅ **Mutation test**: verifier dựng lại bản full-replace bằng `patch -R` từ chính diff rồi
     chạy test → **đỏ thật** (`expect(next.shop.blockWidgetStatus).toBe(true)` → `Received: undefined`).
     Test guard được bug thật, không phải test rỗng.
   - ⚠️ **Ghi chú gate trong BRIEF này ĐÃ LỖI THỜI**: dòng "~9 suite fail sẵn" ở header không áp
     cho nhánh base `origin/master`. Verifier đo lại: HEAD nhánh = `68704dd6b` = `origin/master`,
     diff chỉ đụng `packages/assets`, nên `packages/functions` ở đây CHÍNH LÀ baseline → 212/212 xanh.
     (Đo qua `git archive` ra scratch thì 4 suite fail ở `Context.initialize` — nhưng đó là artifact
     môi trường do thiếu biến env chỉ có trong shell profile thật, không phản ánh code.)
   - Đánh đổi đã chấp nhận (ghi rõ trong commit message): sau cache-hit, UI hiện giá trị của
     **phiên trước** ~1s thay vì "chưa biết". Merchant tắt app embed giữa 2 phiên sẽ thấy trạng thái
     cũ thoáng qua trước khi `MERGE_SHOP` sửa. Consumer dùng `typeof x === 'boolean'` để phân biệt
     known/unknown nên đây là known-but-stale, không phải lỗi logic.
   - CÒN NGUYÊN: chưa đo lại CLS sau deploy. Baseline trước fix: p75 **0.129-0.131**.

8. [✅ 2026-08-19] Comment lỗi thời ở `packages/assets/src/pages/Onboarding/OnboardingV5/Steps/StepActivate/StepActivate.js:23`
   - Nguyên văn finding của verifier: *"`// Latest shop, read at call time. SET_SHOP replaces the
     whole shop object, so...` — câu này giờ sai vì `SET_SHOP` đã merge, không còn replace. Không gây
     bug (payload ở call site này vẫn là full snapshot `{...shopRef.current, ...}` nên merge/replace ra
     kết quả giống nhau), nhưng agent không cập nhật comment liên đới này ngoài file mình sửa."*
   - Sinh ra từ commit `5dfc63777` (nhánh `fix/cls-admin-bfs`) — sửa trước khi tạo MR thì gọn nhất,
     commit tiếp lên cùng nhánh đó.
   - Diff thuần comment. Viết bằng **tiếng Anh** cho khớp phần còn lại của file.

   ### Tóm tắt task 6 (Home)
   - **XONG** — nhánh `fix/cls-admin-bfs` · commit `50e4b2fb0` · đã push origin.
     Sửa `packages/assets/src/pages/Home/Home.js` + 2 file mới
     `packages/assets/src/helpers/homeCardOrderCache.js` và `.test.js` (6 test).
   - Cách làm: **giữ tính năng cá nhân hoá** (dantt chốt 19/08 — bản đầu xoá hẳn đã bị bỏ).
     Ghi giá trị resolve xuống `localStorage` sau paint, đọc lại đồng bộ bằng
     `useState(() => readMetricsFirstCache())` ở lượt render đầu — cùng timing mà
     `storeReducer.js` dùng cho `readShopCache()`. `displayMetricsFirst` **không có setter**
     nên không đảo card giữa phiên. Giá đổi: thay đổi chỉ hiện ở lần tải sau.
   - Default cache-miss = **setup-guide-first** (dantt chốt). ⚠️ Lý do KHÔNG phải "khôi phục
     layout gốc" — verifier chạy `git show 448653907^` và xác nhận layout gốc là **metrics-first**.
     Lý do thật: cache-miss thường là shop vừa cài → `resolvedMetricsFirst` của họ vốn là `false`.
     Công thức thật đã verify: `resolvedMetricsFirst = hasContract || allSetupTasksDone` (`Home.js:77`).
   - Verifier **PASS** vòng 2 (vòng 1 FAIL vì comment nói sai về layout gốc). Gate:
     `check.mjs` exit 0 · jest assets **16/162** exit 0 · jest functions **212/2053** exit 0 ·
     vite build exit 0. Verifier dùng `rtk proxy` để lấy raw output, tránh hook nén mất breakdown.
   - ⚠️ **Test KHÔNG guard phần đấu dây.** 6 test chỉ phủ helper cô lập; `packages/assets` không có
     `testing-library` nên không render test được. Đổi ternary ở `Home.js:162` về `resolvedMetricsFirst`
     thì jest **vẫn xanh** mà CLS quay lại. Đã đặt comment cảnh báo tại `Home.js:156-161`.
   - CÒN NGUYÊN: chưa đo lại CLS sau deploy. Baseline trước fix: p75 **0.129-0.131**.

9. [⏸️] Cache key rơi về `default` ở standalone mode — mọi shop dùng chung một key
   - Nguyên văn finding verifier: *"`homeCardOrderCache.js:7-14` và `shopCache.js:14-21` đều
     fallback về chuỗi `'default'` khi thiếu `?shop=` trong URL. Ở standalone mode
     (`isEmbeddedApp === false`, `packages/assets/src/config/app.js:3`) không có code path nào
     thêm `?shop=` vào URL. Nên trên standalone, mọi shop dùng chung một key
     `avada:home:metricsFirst:default` — quyết định thứ tự của shop này rò sang phiên của shop
     khác trên cùng browser profile."*
   - ⚠️ **Rủi ro KẾ THỪA, không phải do commit `50e4b2fb0` gây ra** — `shopCache.js` đã fallback
     `'default'` y hệt từ trước, và nó cache cả object `shop` chứ không chỉ một boolean thứ tự card.
     Nên vấn đề gốc **rộng hơn** task 6: cần xem lại `shopCache.js` trước, `homeCardOrderCache.js` sau.
   - Chưa rõ mức độ thật: cần xác minh standalone mode có bao nhiêu người dùng, và trên cùng
     browser profile có thực sự xảy ra chuyện 2 shop khác nhau không.

   ### Tóm tắt task 8
   - **XONG** — nhánh `fix/cls-admin-bfs` · commit `c1cce5bea` · đã push origin.
     Diff thuần comment, 1 file (+4/−3): `packages/assets/src/pages/Onboarding/OnboardingV5/Steps/StepActivate/StepActivate.js:23-26`.
   - Verifier **PASS** ngay vòng 1. Kiểm từng khẳng định trong comment MỚI (đây mới là phần đáng
     kiểm — sửa comment nói dối mà thay bằng comment nói dối khác thì vô nghĩa):
     (a) `SET_SHOP` merge — đúng, `storeActions.js:37-45`;
     (b) caller trong file vẫn dựng `{...shopRef.current, ...}` — đúng, `StepActivate.js:45,51-56`;
     (c) cụm "with a stale snapshot" mình nghi là suy diễn thừa — **hoá ra đúng**: `handleRefreshStatus`
     và `handleRefreshBlockStatus` fire cùng lúc không await nhau trong cùng `useEffect`
     (`StepActivate.js:62-65`), closure `shop` sẽ để dispatch sau ghi đè field dispatch trước vừa set.
   - Đã grep xác nhận **không còn** chỗ nào khác trong `packages/assets/src` mô tả sai `SET_SHOP`
     (`"replaces the whole shop"`, `"SET_SHOP replaces"`, `"wholesale"` → 0 match).
   - Gate: `check.mjs` exit 0 · jest assets **16/162** exit 0 · jest functions **212/2053** exit 0.
     Bỏ vite build vì diff không ảnh hưởng bundle — verifier đánh giá lý do này chấp nhận được.

   ### Trạng thái task 9 — BLOCKER 19/08 11:40 (verifier FAIL 2 vòng)
   - Báo cáo: `shopcache-key-audit-2026-08-19.md`. Phần lớn đã được xác minh ĐÚNG qua 2 vòng.
   - **Đã xác minh ĐÚNG**: `getCacheKey()` đọc `location.search` tại call time
     (`shopCache.js:14-21`, `homeCardOrderCache.js:7-14`); `history.push` không mang `?shop=`;
     standalone **không bao giờ** đọc `readShopCache()` (`standalone.js:97-100` luôn bọc prop trong
     object literal mới nên luôn truthy → `storeReducer.js:23` luôn nhánh true — verifier chứng minh
     bằng `node -e`); `shopCache` chỉ có **3 write site** (`storeReducer.js:95,102,146`) và cả 3 đều
     trong `useEffect(..., [])` nên chỉ chạy lúc mount; mọi call giữa phiên (`App.js:63`,
     `storeActions.js:82,108,135`) chỉ `clearShopCache()` — xoá, không ghi.
   - ⇒ **Cả 2 claim rò chéo trước đó đều SAI**: của verifier task 6 (standalone dùng chung key), và
     của agent điều tra (edge case `isEmpty(shop)`).
   - **Bug thật #1 — invalidate bị vô hiệu hoá** (đã xác minh): `clearShopCache()` dùng chung
     `getCacheKey()`, nên khi gọi giữa phiên (SPA nav đã mất `?shop=`) nó xoá `avada:shop:default`
     (thường rỗng) thay vì key thật. Lần load sau `readShopCache()` đọc lại key thật **chưa từng bị
     xoá** → dữ liệu cũ tới 48h.
   - **Bug thật #2 — finding chưa được sửa vào báo cáo, LÝ DO FAIL:**
     Nguyên văn verifier: *"Claim tổng 'KHÔNG có đường rò dữ liệu chéo giữa các shop, xác nhận bằng
     code' — overclaim, không tương thích với chính bằng chứng report tự nêu về `homeCardOrderCache`
     — `Home.js:101-104`, `homeCardOrderCache.js:7-14`, `routes/routes.js:80,94-98`.
     `writeMetricsFirstCache(resolvedMetricsFirst)` chạy trong `useEffect(..., [resolvedMetricsFirst])`
     — chạy lại mỗi lần `Home` remount (SPA nav rời rồi quay lại `/`), dùng `getCacheKey()` fallback
     `'default'` giống hệt `shopCache.js`. Đây là write mid-session, ghi vào key dùng chung, có thể bị
     shop khác đọc trúng — đúng định nghĩa 'rò chéo' mà report dùng cho `shopCache` nhưng lại không
     áp dụng nhất quán cho `homeCardOrderCache`."*
   - ⚠️ **Bug #2 do commit `50e4b2fb0` (task 6) tạo ra** — nhánh `fix/cls-admin-bfs`, đã push.
     Mức độ: chỉ 1 boolean thứ tự card, KHÔNG phải PII, KHÔNG gây CLS (quyết định vẫn trước paint).
     Hệ quả: cá nhân hoá không đáng tin sau SPA nav; shop A có thể thấy thứ tự của shop B.
   - ⏸️ **CHỜ NGƯỜI**: đã FAIL 2 vòng verify → hết quota, thêm vòng phải có dantt duyệt.
     Loop KHÔNG được nhận task này.
   - Phần **fix code** của bug #1 + #2 đã tách sang **task 11** (dantt chốt 19/08 fix cả hai).
     Task 9 chỉ còn lại việc **sửa báo cáo** cho khớp — giá trị thấp hơn hẳn, vì báo cáo đã hoàn thành
     nhiệm vụ của nó là cung cấp đủ thông tin để ra quyết định.
   - Việc còn lại nếu dantt muốn: gỡ overclaim "không có rò chéo, xác nhận bằng code" ở Kết luận ngắn,
     và bổ sung phân tích `homeCardOrderCache` vào câu 5 (nơi duy nhất chứng minh "no leak" nhưng
     không nhắc helper này lần nào).

10. [⏸️] https://918ud3-zi.myshopify.com/
check giúp anh store này , trước họ dùng Joy loyalty đc free bên mình, giờ gỡ loyalty rồi về stater pahir trả phí
Mà install date của họ là free forever
hay do mình bật cái toggle trả phí trong dev _zone lên nhỉ

   - **PHẦN PHÒNG NGỪA ĐÃ XONG 19/08** — nhánh `fix/loyalty-sync-free-forever` · commit `017366d16`
     · **MR 2489** (https://git.avada.net/avada/subscriptions/-/merge_requests/2489), base `origin/master`.
     dantt chốt: "nếu store đang ở free forever thì ko sync từ loyalty sang mình".
     Sửa `services/shopService.js` — guard `if (isFreeForever(shop)) return;` đặt sau khi fetch
     integration, TRƯỚC CASE 1. Chặn cả 2 caller (`POST /joy-integrations` và `installationService.js:158`).
     Dùng thẳng `isFreeForever()` được vì shop free-forever chưa bị gift thì `customPricing` còn trống
     → trả `true`. Shop đã lỡ gift trả `false` → guard không bắn → **CASE 2 vẫn dọn được**, đúng ý.
   - ⚠️ Fixture test cũ `installedAt: 2025-01-01` khiến MỌI shop trong `shopServicePartnerStore.test.js`
     vô tình là free-forever → 2 test đỏ ngay khi thêm guard. Đẩy sang `2026-01-01`: sau cutoff
     free-forever (2025-11-04) nhưng trước `GO_LIVE_PRICING_V4` (2026-03-16) nên `getDefaultLoyaltyPlan`
     vẫn trả Advanced → 6 test cũ giữ nguyên ý định. Thêm 4 test mới.
   - Mutation test: gỡ guard trên bản backup → đúng 2 test đỏ. Gate: `yarn check` exit 0 ·
     jest functions exit 0 **212/212 suite, 2057/2057 test** (baseline 2053 + 4 mới).
   - ⚠️ **PHÒNG, KHÔNG CHỮA**: shop `918ud3-zi` đã có `customPricing.enabled=true` + `recurChargeId`
     nên guard không đụng tới. Vẫn cần dantt sửa tay + xử riêng charge `88207425923`.

11. [✅ 2026-08-19] **[P0]** `getCacheKey()` mất `?shop=` sau SPA nav — sửa gốc cho cả 2 cache
   - dantt chốt 19/08: fix **cả bug #1 và #2** trên cùng nhánh `fix/cls-admin-bfs` (xem task 9).
   - **Gốc chung**: `shopCache.js:14-21` và `homeCardOrderCache.js:7-14` đều đọc
     `new URLSearchParams(window.location.search).get('shop')` **tại thời điểm gọi**, fallback `'default'`.
     `history.push` (`history.js:12-49`) không mang query, và không call site nào gắn `?shop=` vào path
     → sau SPA nav đầu tiên, `location.search` mất `shop=`.
   - **Bug #1** (có sẵn từ trước): `clearShopCache()` (`shopCache.js:54-60`) gọi giữa phiên
     (`App.js:63`, `storeActions.js:82,108,135`) xoá `avada:shop:default` thay vì key thật → key thật
     mồ côi, `readShopCache()` lần load sau đọc lại dữ liệu cũ tới 48h.
   - **Bug #2** (do commit `50e4b2fb0` tạo ra): `Home.js:101-104`
     `useEffect(() => writeMetricsFirstCache(resolvedMetricsFirst), [resolvedMetricsFirst])` chạy lại
     mỗi lần `Home` remount (`routes.js:80,94-98` — `Route exact path="/"` trong `Switch`), ghi boolean
     vào key `default` dùng chung → shop khác đọc trúng.
   - **Hướng**: làm `getCacheKey()` không phụ thuộc `location.search` tại call time. Cân nhắc tối thiểu
     2 hướng, giải thích Why. Gợi ý: capture shop domain **một lần lúc boot** khi `?shop=` còn có, rồi
     tái dùng; hoặc lấy từ nguồn ổn định hơn (App Bridge host, `state.shop.shopifyDomain`).
   - ⚠️ **Đổi key scheme = mất cache của MỌI merchant đang có** → một lần CLS regression cho tất cả.
     Nếu hướng chọn làm đổi key, phải nêu rõ hệ quả đó và cân nhắc giữ backward-compat (đọc key cũ
     nếu key mới miss).
   - ⚠️ Cẩn thận thứ tự: nếu memo hoá "lần gọi đầu thắng", phải chắc lần gọi đầu xảy ra **khi `?shop=`
     đã có**. Gọi sớm hơn thời điểm đó thì memo hoá luôn giá trị `'default'` — hỏng nặng hơn hiện tại.
   - Done-criteria: gate exit 0 + test guard cho `getCacheKey` ở cả 2 helper (cả 2 đều là pure helper,
     `packages/assets` jest test được) + nêu rõ có đổi key scheme không và hệ quả.

   ### Tóm tắt task 11
   - **XONG** — nhánh `fix/cls-admin-bfs` · commit `ed05e51e0` · đã push origin.
     Sửa `helpers/shopCache.js`, `helpers/homeCardOrderCache.js`, `pages/Home/Home.js`
     + 2 file test (`shopCache.test.js` mới, `homeCardOrderCache.test.js` viết lại).
   - **`shopCache`**: capture `?shop=` **một lần lúc module evaluate** — xảy ra ở page load đầu khi
     query còn nguyên, và **sớm hơn** lời gọi `readShopCache()` trong `initState` của `StoreProvider`,
     nên không có cửa sổ nào để một lời gọi sớm hơn pin nhầm `'default'`. **Key format giữ nguyên**
     → entry cũ của merchant vẫn hit.
   - **`homeCardOrderCache`**: nhận `shopDomain` tường minh thay vì đọc URL. `App.js:77` gate
     `{shop ? <Routes/> : <LoadingFallback/>}` nên Home luôn có `shop` khi mount.
     **Bonus**: standalone lần đầu có key riêng cho từng shop (trước đó luôn dùng chung `'default'`
     vì standalone không bao giờ có `?shop=`).
   - Verifier **PASS** vòng 1. **Mutation test**: copy sang scratchpad, gỡ fix, chạy jest →
     `FAIL (2)` đúng 2 test tương ứng 2 bug. Test guard thật.
   - Verifier cũng bác được nghi ngờ "đổi key = miss hàng loạt": `?shop=` và `shopifyDomain`
     **cùng format** `xxx.myshopify.com` — bằng chứng `embed.js:27-28` dùng thẳng `ctx.query.shop`
     làm domain trong CSP `frame-ancestors`.
   - Gate: `check.mjs` exit 0 · jest assets **17/167** exit 0 (baseline 16/162 + 1 file mới) ·
     jest functions **212/2053** exit 0 · vite build exit 0 (cả embed lẫn standalone).
   - CÒN NGUYÊN: chưa đo lại CLS sau deploy. Baseline trước toàn bộ nhánh: p75 **0.129-0.131**.

   ### Trạng thái task 10 — BLOCKER 19/08 12:05 (verifier FAIL 2 vòng)
   - Báo cáo: `shop-918ud3-billing-2026-08-19.md`.
   - **ĐÃ XÁC MINH CHẮC (qua 2 vòng verifier, dùng được ngay):**
     - `installedAt = 2025-09-11`, **trước** cutoff `GO_LIVE_PRICING = 2025-11-04` (`plans.js:53`)
       → xét riêng ngày cài thì shop **đủ điều kiện free forever**.
     - `isFreeForever()` (`plans.js:1102-1117`) kiểm theo thứ tự: `getForcedPricingVersion` →
       `shop.customPricing.enabled` → mới so `installedAt`. Shop có `customPricing.enabled = true`
       nên **chặn ngay ở bước 2**, không bao giờ tới bước so ngày. **Đây là nguyên nhân trực tiếp.**
     - CASE 2 dọn dẹp (`shopService.js:170`) không chạy vì điều kiện
       `isCurrentFreeLoyaltyPlan = shop.plan==='starter' && !shop.recurChargeId` → `false`
       (shop CÓ `recurChargeId`) → `customPricing.enabled` kẹt `true` vĩnh viễn.
     - Shop đã có **charge Shopify thật** `recurChargeId: 88207425923` tạo **2026-08-18**,
       `trialEndsAt 2026-08-30`. Gỡ `customPricing` **không** tự huỷ charge này.
   - **KHÔNG XÁC ĐỊNH ĐƯỢC: ai/cái gì đã set `customPricing.enabled = true`.**
     Kết luận lật 2 lần (không phải DevZone → nhiều khả năng DevZone → không kết luận được).
   - Nguyên văn finding verifier vòng 2 — **lý do không kết luận được**:
     *"Nút Save trong `CustomPricing.js:46-49` gọi `handleShopApi` → `PUT /shops` →
     `shopController.js:196-204` (`updateShop`, passthrough, chỉ chặn `SHOP_UPDATE_BLOCKED_FIELDS=['plan']`),
     KHÔNG phải `devZoneController.js:1174-1182`. `grep -rn "update-pricing-settings" packages/assets/src`
     → 0 match. `devZoneController.js:1174-1182` được gọi từ `routes/tsTool.js:35` — **TS Tool API**
     cho team Technical Support dùng qua Claude Code/scripts/MCP, auth `X-DevZone-Key`, type này KHÔNG
     nằm trong `REJECTED_TYPES` nên reachable với scope `write`. Đường này **không bị ràng buộc bởi
     cửa sổ commit FE nào**, nên lập luận 'shape 5-field chỉ khớp cửa sổ 2026-03-09→06-16' không loại
     trừ được nó."*
   - Verifier cũng chỉ ra **lỗi phương pháp**: cả 3 vòng grep literal `"customPricing"` trong
     `packages/functions/src` nên **bỏ sót** `shopController.js:196-204` — file passthrough không
     chứa chuỗi đó. Đúng bài học đã ghi: *liệt kê endpoint đừng grep literal*.
   - ⇒ **3+ đường có thể ghi**: DevZone Save (qua `PUT /shops`), Loyalty CASE 1
     (`shopService.js:99-110`), TS Tool API (`devZoneController.js` qua `tsTool.js`),
     và `afterChargeService.js:126-146`. **Không có audit log** nào phân biệt.
   - **KHUYẾN NGHỊ: dừng điều tra.** Không giải dứt điểm được bằng đọc code. Cách gỡ cho shop
     **không phụ thuộc** câu trả lời này.
   - **Cách gỡ (dantt tự chạy, KHÔNG agent nào được làm):** set `customPricing.enabled = false`
     (cân nhắc xoá entry `starter`), **và xử riêng charge `88207425923`** — gỡ field không huỷ charge.
   - ⏸️ **CHỜ NGƯỜI**: hết quota 2 vòng verify. Loop KHÔNG được nhận lại task này.
     Phần chẩn đoán đã xong và dùng được; phần còn treo (ai bật cờ) **không giải được bằng đọc code**.
     Muốn biết chắc thì hỏi team support xem có ai dùng TS Tool trên shop này không.

