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

 4. [] Check CLS giúp tôi gần đây đang bị cao hơn mức shopify accept là good rồi nhé!!
