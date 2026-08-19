# Joy Wholefoods "Build Your Subscription" landing — BRIEF CUSTOM

<!--
  `[ ]` chưa làm · `[⏳ HH:MM]` đang chạy · `[⏸️]` chờ người, đừng nhận · `[✅ YYYY-MM-DD]` xong
  Chạy: /loop 5m /looptasks ~/projects/my-brain/10-projects/subscriptions/BRIEF-CUSTOM.md

  Gate của repo này (JS thuần — KHÔNG có tsc):
    ⚠️ CHẠY THẲNG BINARY, ĐỪNG QUA `rtk` — `rtk` NUỐT EXIT CODE.
    bash .claude/scripts/gates.sh            # ~6s, chấm cả 4 gate. exit 2 KHÔNG phải pass
    yarn workspace @avada/scripttag run webpack-<script-name>-main   # build 1 bundle
    # ⚠️ KHÔNG có script `production` trong @avada/scripttag — tài liệu cũ ghi sai, đã kiểm.

  BASELINE ĐÃ ĐO trên worktree này (cập nhật 2026-08-19 sau task 16, @ 0ef4b273):
    check    exit 0 · 7 rule groups clean
    jest:fn  exit 0 · 214 passed, 214 total   ← KHÔNG có suite fail sẵn
    jest:as  exit 0 ·  24 passed,  24 total   ← 10 suite của landing đã cộng vào đây
    tree     clean
  ⇒ Chấm "phải XANH TUYỆT ĐỐI", không phải "không suite nào MỚI đỏ".
     Suite < 214 / < 24 nghĩa là có suite chết lúc load → thiếu env, KHÔNG phải pass.
  ⚠️ Số 212/14 ở bản brief cũ là baseline lúc CHƯA có task 6-16. Đừng dùng lại.
  ⚠️ `sharp@0.28.3` build fail lúc `yarn install` là NHIỄU VÔ HẠI — mọi gate vẫn xanh.
  ⚠️ Subagent BỊ CẤM chạy git; repo có ~233 stash của user.
  ⚠️ TUYỆT ĐỐI KHÔNG sửa: extensions/theme-app-extension/** (shared mọi shop),
     services/webhook/subscriptionContractCreateService.js, buildStaplesList,
     services/graphql/subscriptionContractService.js, packages/assets/**.
     Thiết kế này cố ý KHÔNG cần đụng chúng — nếu thấy "cần", DỪNG và hỏi.

  Thứ tự / song song:
    - Task 1 → 2 tuần tự. 3 → 4 tuần tự.
    - Task 5 phải xong trước 6-12.
    - Task 6,7,8,9,10,11,12 CÙNG chạm cây subscriptionBoxJoyxjoy → chạy TUẦN TỰ, đừng fan-out.
    - Nhóm chạy song song an toàn: {3,4} với {5}.

  Đường dẫn TRONG worktree (không phải repo chính):
    Spec  : docs/superpowers/specs/2026-08-19-joyxjoy-landing-design.md   ← đọc trước mọi task
    Mockup: docs/mockups/joyxjoy-wholefoods-landing/landing-src.html      ← mọi số dòng trỏ vào đây
-->

## ✅ Worktree — ĐÃ TẠO SẴN, không phải làm lại

**Làm việc tại `~/projects/subscriptions-joyxjoy`, nhánh `feat/joyxjoy-landing`.**
KHÔNG đụng `~/projects/subscriptions` (đang ở nhánh khác) và `~/projects/subscriptions-kookut`.

Đã xong hết: worktree tạo từ master `68704dd`, 4 file env đã copy, `yarn install` xong,
spec + mockup đã commit (`214340718`), ảnh mockup 13MB để local qua `.git/info/exclude`,
gates đã chạy xanh. **Bỏ qua phần dựng lại bên dưới**, nó chỉ để tham chiếu nếu cần dựng lại
từ đầu.

```bash
# tạo 1 lần, từ master (đã xác nhận master == origin/master @ 68704dd)
cd ~/projects/subscriptions
git worktree add ~/projects/subscriptions-joyxjoy -b feat/joyxjoy-landing master
```

**4 file bị gitignore → worktree mới THIẾU. Không copy là jest chết và script seed không chạy được:**

```bash
S=~/projects/subscriptions; D=~/projects/subscriptions-joyxjoy
cp $S/.env                                       $D/.env
cp $S/packages/functions/.env.local              $D/packages/functions/.env.local
cp $S/packages/functions/.runtimeconfig.json     $D/packages/functions/.runtimeconfig.json
cp $S/packages/functions/serviceAccount.development.json    $D/packages/functions/serviceAccount.development.json

# spec + mockup hiện là file UNTRACKED ở repo chính → worktree từ master KHÔNG có.
# Task 6-12 trỏ số dòng vào landing-src.html nên bắt buộc phải copy sang.
mkdir -p $D/docs
cp -r $S/docs/mockups     $D/docs/
cp -r $S/docs/superpowers $D/docs/

cd $D && yarn install
```

Đã cắn 2 lần rồi, đừng lặp lại:

- **Thiếu `.runtimeconfig.json` / `.env.local`** → 2 suite chết ngay lúc load ở
  `@avada/core` `Context.initialize`. Jest vẫn in `Tests: … passed` trông như xanh.
  **Chấm theo dòng `Test Suites:`, đừng bao giờ chấm theo dòng `Tests:`.**
- **Gate hook chạy `yarn check` ở REPO CHÍNH**, không phải worktree → repo chính cũ thì worktree
  sạch vẫn bị chặn. Nếu gặp, ff repo chính về master trước.

Subagent: chỉ được đọc/ghi trong `~/projects/subscriptions-joyxjoy`. **BỊ CẤM chạy git**
(repo có ~233 stash của user) — worktree do người tạo sẵn theo lệnh trên.

## Bối cảnh 30 giây

Page custom bespoke cho **một** khách (`dantt-subscription-box.myshopify.com`, theme thật của
`joywholefoods.com.au`). **Không phải feature chung của app.** Không liên quan Subscription Box.

Mockup đã bảo tồn trong repo: `docs/mockups/joyxjoy-wholefoods-landing/landing-src.html`
(nguồn `gitlab.com/longlv3/jarvis` @ `26b5d17`). Mọi số dòng dưới đây trỏ vào file đó.

**Kiến trúc đã chốt** (chi tiết + lý do loại các phương án khác: xem spec):

| Phần | Ở đâu |
|---|---|
| UI logic | Bundle scripttag mới `packages/scripttag/src/subscriptionBoxJoyxjoy/` |
| Data section 1 | Shop metafield mới, app ghi lại mỗi lần merchant save Fixed Bundle |
| Data section 2/3 | Shopify Collections, Liquid inject sẵn → 0 API call |
| Nhúng trang | Section Liquid trong **theme khách** (KHÔNG phải theme app extension) |
| Cart → contract | Luồng webhook có sẵn, **0 dòng thay đổi backend** |

**Backend chỉ có đúng 1 việc**: ghi shop metafield danh sách Fixed Bundle (task 3-4).

## Property contract cart — bất biến

| Loại | `selling_plan` | Properties |
|---|---|---|
| Bundle (sect.1) | `sellingPlanId` của tần suất đang chọn | — |
| Staple (sect.2) | `null` | `__staple: <sellingPlanId>` |
| One-off (sect.3) | `null` | `__purchase_type: 'one-time'` |

**TUYỆT ĐỐI KHÔNG dùng `__box_id`** — nó thuộc namespace Subscription Box. Set bậy sẽ phá
`resolveSwapLineKey.js:33` (mất per-line selling-plan key khi swap), làm line hiển thị sai ở
customer account (`processContractLines.js:41`), và có thể **áp sai discount**
(`extensions/product-discount/src/run.graphql:30`). `buildStaplesList` đọc `boxIdAttr?.value || ''`
nên bỏ hẳn là hợp lệ.

Swap note → `POST /cart/update.js {note}`. `signupNote` trong app **chính là order note**
(`subscriptionContractCreateService.js:196`) và tự propagate sang contract + upcoming orders
(`:939`, `:1040`) — không cần backend mới.

Tần suất chọn ở **cấp trang** (1/2/4 tuần, `:304-306`, `:624`, `:911`) → mọi box dùng cùng selling
plan → Shopify chỉ sinh **1 contract** → không có bài toán staples nhân đôi.

## ⚠️ Trần bundle — ĐỌC TRƯỚC KHI LÀM TASK UI

**KHÔNG áp trần 30KB.** `.claude/rules/storefront.md:27` ghi *"Bundle target per widget: < 25KB
(hard limit 30KB)"* — rule đó viết cho **widget nhúng vào MỌI trang** của shop. Bundle này là
**page bundle**, chỉ tải khi khách vào đúng trang landing.

Thực tế đo trong repo (`static/scripttag/`):

| Bundle | Size |
|---|---|
| `avada-subscription-box-veluma-main.min.js` | **198.1 KB** |
| `avada-subscription-box-fixed-bundle-main.min.js` | **197.9 KB** |
| `avada-subscription-box-joyxjoy-main.min.js` | 29.1 KB |

Hai bundle cùng loại đang gấp 6.6 lần "hard limit" và vẫn chạy production. Trần 30KB là nguyện
vọng chưa từng được thực thi cho loại page-bundle này.

**Mốc thực dụng: giữ dưới ~200KB** (ngang anh em, đủ để không ai phình bừa). dantt chốt
2026-08-19: *"1 page size chừng đó thì không vấn đề, trước mắt build được cho khách trước,
optimize sẽ tìm thêm cách"*.

⚠️ **Tách component KHÔNG giảm size** — webpack vẫn gom hết vào 1 file. Chỉ `import()` động
(code-splitting thành chunk riêng) mới giảm payload ban đầu. Đừng nhầm hai thứ này.

**Cái giá đã trả vì áp sai trần:** task 6 phải bỏ `preact/compat`, bỏ `.scss`, bỏ `prop-types`
và tự viết cơ chế inject CSS bằng string để ép từ ~39KB xuống 29KB — lệch convention của
`fixedBundleBox`/`subscriptionBox`. Đang chạy đúng nên **giữ nguyên, không sửa lại**; task UI sau
bám theo cây `subscriptionBoxJoyxjoy/` hiện có cho nhất quán trong feature.

---

## Tasks

### Chuẩn bị — seed store dev

1. [✅ 2026-08-19] **Viết script seed store dev** (cần `serviceAccount.development.json` — xem mục Worktree) — `packages/functions/src/commands/misc/seedJoyxjoyLanding.js`,
   theo pattern header của `commands/misc/inspectContractPricing.js` (serviceAccount + decrypt
   token + Shopify GraphQL). **Dry-run là mặc định**, chỉ ghi khi có cờ `--apply`. Idempotent:
   chạy 2 lần không tạo trùng (tìm theo handle trước khi tạo).
   Seed **ít thôi, đủ để test** — đừng seed full catalog:
   - **2 Product Fixed Bundle**: `ultimate-organic-farm-box` ($210), `organic-staples-box` ($89)
     — tên/giá lấy từ `landing-src.html:499-501`. Mỗi bundle có selling plan **cả 3 tần suất
     1/2/4 tuần** (ràng buộc bắt buộc, xem spec mục 1).
   - **6 sản phẩm thường** chia **3 collection**: `fruit-veg`, `bakery`, `pantry` (2 sp/collection)
     — subset của `CATS` tại `landing-src.html:659`.
   - Ảnh: dùng ảnh sẵn trong `docs/mockups/joyxjoy-wholefoods-landing/` hoặc để trống, đừng đi
     download.
   Done: `SA_ENV=development node ... dantt-subscription-box.myshopify.com` (không `--apply`) in ra
   kế hoạch tạo/bỏ qua từng item, **không ghi gì lên store**; `yarn check` exit 0.

   - nhánh `feat/joyxjoy-landing` · commit `876cca4`
   - Tạo `packages/functions/src/commands/misc/seedJoyxjoyLanding.js`
   - Vòng 1 FAIL (gate xanh nhưng sai chức năng): chỉ tạo product Shopify thuần nên
     `getAllFixedBundlesByShopId` không thấy → section 1 trống. Vòng 2 sửa: ghi doc Firestore
     `productBundle` qua `prepareFirestorePayload` + `addPlanProductBundle`
     (`bundleType='fixed-bundle'`, `const/productBundle/const.js:5`) và set metafield
     `avada_fixed_bundle` lên product.
   - Verify vòng 2: `check` 0 · `jest:fn` 214/214 · `jest:as` 15/15. Verifier chạy dry-run THẬT
     trên shop dev 2 lần (`diff` rỗng), liệt kê điểm gate của cả 6 hàm `*_apply`, tự unset
     `SHOPIFY_ACCESS_TOKEN_KEY` xác nhận `exit 1`.
2. [⏸️] **Seed thật** — bước 1+2 XONG (main agent chạy 2026-08-19), **chỉ còn bước 3 cần UI admin**. **Ba bước, đủ cả ba mới có dữ liệu:**

   ```bash
   # 1. PHẢI build trước — script import qua alias @functions/*, chạy thẳng src/ sẽ lỗi
   #    "Cannot find module '@functions/repositories/productBundleRepository'" (verifier đã thử)
   cd ~/projects/subscriptions-joyxjoy
   yarn workspace @avada/functions run production

   # 2. Xem trước rồi mới ghi
   set -a; source packages/functions/.env.local; set +a
   # BẮT BUỘC — thiếu dòng này là chết ở query productBundle với
   # "Unable to detect a Project Id in the current environment".
   # Lý do: productBundleRepository.js:2 tự tạo `new Firestore()` từ
   # @google-cloud/firestore, client đó KHÔNG dùng credential của firebase-admin
   # nên cần ADC. Các script misc khác dùng admin.firestore() trực tiếp nên chưa vấp.
   export GOOGLE_APPLICATION_CREDENTIALS="$PWD/packages/functions/serviceAccount.development.json"
   SA_ENV=development node packages/functions/lib/commands/misc/seedJoyxjoyLanding.js \
     dantt-subscription-box.myshopify.com            # dry-run, không ghi gì
   SA_ENV=development node packages/functions/lib/commands/misc/seedJoyxjoyLanding.js \
     dantt-subscription-box.myshopify.com --apply    # ghi thật
   ```

   **3. ⚠️ BƯỚC DỄ QUÊN NHẤT — vào app admin save lại từng bundle một lần.**
   Seed KHÔNG tự sinh metafield `avada_custom_landing`; nó chỉ được rebuild trong
   `handleSetFixedBundle` (`fixedBundleService.js:261`, commit `58bf3f1`). Bỏ bước này thì store
   có đủ bundle nhưng **landing vẫn trắng** — và sẽ rất khó đoán ra vì sao.

   Done: Shopify admin thấy 2 bundle đủ 3 tần suất + 3 collection có sản phẩm, và shop metafield
   `avada_custom_landing` có `bundles` không rỗng.

   **Đã chạy 2026-08-19 (main agent) — bước 1+2 xong, verify bằng cách đọc lại từ Shopify:**
   - `Ultimate Organic Farm Box` gid `8241065197686` · `Organic Staples Box` gid `8241065656438`
   - Mỗi box đúng **3 plan, `category=SUBSCRIPTION`, `WEEK ×1/×2/×4`, giống nhau giữa 2 box**
     ⇒ thoả ràng buộc "cùng selling plan" của landing.
   - 3 collection: `fruit-veg` `341674557558` · `bakery` `341674623094` · `pantry` `341674655862`,
     mỗi cái 2 product (theo log apply).
   - Firestore: 2 doc mới `gcLPB5jNtJZ2JyRSbPMS`, `2Oal5MZXq3P7kgdzledG`.
   - Phải sửa 1 dòng script mới chạy được: thiếu `category` ⇒ `sellingPlanGroupCreate` fail
     *"Category is not included in the list"*. Giá trị lấy từ chính app
     (`getSellingPlanVariables.js:302`). Commit `0ef4b273` trên `feat/joyxjoy-landing`.
   - ⚠️ **CÒN LẠI — bước 3, chỉ làm được qua UI**: `avada_custom_landing/data` hiện vẫn **NULL**
     (đã query xác nhận). Vào app admin save lại từng bundle một lần thì mới có.

### Backend — đúng 1 việc

3. [✅ 2026-08-19] **`updateCustomLandingMetaField`** — thêm `META_FIELD_CUSTOM_LANDING = 'avada_custom_landing'`
   vào `packages/functions/src/const/metafields.js`, và hàm mới trong
   `packages/functions/src/services/metafieldService.js` theo **đúng pattern
   `updateFixedBundleBoxMetaField` (`metafieldService.js:247`)**.
   Shape cố ý tối giản: `{shopId, bundles: [{productId, handle, name, status}]}` — KHÔNG nhét
   giá/ảnh/sellingPlan vào (dữ liệu chết, lệch khi merchant sửa giá, sai currency); Liquid sẽ lấy
   từ `all_products[handle]` lúc render. `handle` lấy qua `handleGetProductsByIds`
   (`fixedBundleService.js:20` đã import sẵn).
   Done: unit test theo `.claude/rules/tests.md`; `bash .claude/scripts/gates.sh` exit 0.

   - nhánh `feat/joyxjoy-landing` · commit `37f8cc5`
   - Sửa `const/metafields.js` (+1), `services/metafieldService.js` (+24/-1), test mới
     `__tests__/services/metafieldService.updateCustomLandingMetaField.test.js`
   - Bám đúng pattern `updateFixedBundleBoxMetaField`; shape tối giản
     `{shopId, bundles:[{productId, handle, name, status}]}`, không có price/image/sellingPlan
   - Chưa nối vào `handleSetFixedBundle` (đúng scope — đó là task 4)
   - Verify: `check` exit 0 · `jest:fn` 213/213 (baseline 212, +1 suite) · `jest:as` 14/14.
     Verifier tự đổi namespace và tự bỏ `shopId` khỏi implementation → cả 2 lần suite đỏ đúng chỗ,
     rồi khôi phục. Test guard thật, không phải trang trí.

4. [✅ 2026-08-19] **Hook rebuild metafield vào luồng save** — gọi `updateCustomLandingMetaField` trong
   `handleSetFixedBundle` (`packages/functions/src/services/fixedBundleService.js:207`), ghi đồng
   bộ. Nguồn danh sách: `getAllFixedBundlesByShopId`
   (`repositories/productBundleRepository.js:261`).
   Done: unit test cho cả nhánh tạo mới và cập nhật; gates exit 0.

### Scripttag — scaffold

   - nhánh `feat/joyxjoy-landing` · commit `58bf3f1`
   - Sửa `services/fixedBundleService.js`, test mới
     `__tests__/services/fixedBundleService.handleSetFixedBundle.landingMetafield.test.js`
   - **Không** đọc thẳng `getAllFixedBundlesByShopId` cho bundle đang lưu, vì controller ghi
     Firestore SAU khi `handleSetFixedBundle` return — verifier xác nhận bằng file:line
     (`fixedBundleController.js:56-70` tạo mới, `:117-160` cập nhật; `addPlanProductBundle` ghi
     doc `{shopId}` chưa có `bundleType` nên không lọt filter `productBundleRepository.js:261-270`).
     Entry bundle đang lưu dựng từ `product` + `data` rồi merge đè; `handle` enrich qua
     `handleGetProductsByIds`.
   - Lỗi ghi metafield chỉ `console.warn`, không throw. Verifier xác nhận try/catch **không**
     bao trùm `handleShopifyProductSet` (khối riêng ở `:317-334`, rebuild gọi ở `:337`).
   - Verify: `check` 0 · `jest:fn` 214/214 (baseline 213, +1) · `jest:as` 15/15.
     Verifier gỡ merge → cả 2 test đỏ; gỡ try/catch → test nuốt lỗi đỏ; khôi phục xác nhận bằng `diff`.

5. [✅ 2026-08-19] **Scaffold bundle mới** — `packages/scripttag/webpack.config.js` thêm case
   `subscription-box-joyxjoy-main` → `avada-subscription-box-joyxjoy-main.min.js` (copy y cấu trúc
   case `subscription-box-veluma-main`); `packages/scripttag/package.json` thêm 2 script
   `webpack-subscription-box-joyxjoy-main` + `-watch` và nối vào `webpack` / `webpack-watch`;
   `packages/scripttag/src/subscriptionBoxJoyxjoy/index.js` + `managers/DisplayManager.js` tối
   thiểu (đọc `window.AVADA_JW`, mount vào `.jw-landing-root`, chưa render gì).
   **KHÔNG sửa `.gitlab-ci.yml`** — CI đã đẩy toàn bộ `static/scripttag/*` lên CDN
   (`.gitlab/ci/production.yml:199-203`).
   Theo `.claude/rules/storefront.md`: Preact (KHÔNG React), prefix CSS `jw-`, KHÔNG import từ
   `fixedBundleBox`/`subscriptionBox`.
   Done: `SCRIPT_NAME=subscription-box-joyxjoy-main yarn workspace @avada/scripttag run production`
   build ra file bundle, không lỗi.

   - nhánh `feat/joyxjoy-landing` · commit `4feb1a6` (+ `451b6d8` sửa lệnh build sai trong spec)
   - Sửa `packages/scripttag/{package.json,webpack.config.js}`, tạo
     `src/subscriptionBoxJoyxjoy/{index.js,managers/DisplayManager.js}`
   - Bundle ra 5.9KB (trần 30KB). Không đụng `.gitlab-ci.yml`.
   - Verify: `check` 0 · `jest:fn` 213/213 · `jest:as` 14/14 · eslint 0 issue.
     Verifier build lại `veluma` + `fixed-bundle` (198KB, exit 0) chứng minh case mới không phá
     bundle cũ; parse JSON + kiểm mọi tên script trong chuỗi `webpack` tồn tại; grep xác nhận
     không import React / `fixedBundleBox` / `subscriptionBox`.
   - ⚠️ Phát hiện: `@avada/scripttag` KHÔNG có script `production` — brief và spec đều ghi sai,
     đã sửa cả hai.

### UI — TUẦN TỰ, cùng chạm một cây thư mục

6. [✅ 2026-08-19] **Frequency selector + section 1 (boxes)** — nút 1/2/4 tuần (`:304-306`), `state.weeks`,
   `setFreq` (`:911`); render box card từ `window.AVADA_JW.bundles` (`renderBoxes` `:638`),
   multi-select `toggleBox` (`:890`), badge "Required", `#reqMsg`.
   Lưới an toàn: bundle thiếu selling plan cho tần suất đang chọn thì **ẩn khỏi danh sách**.
   Done: đổi tần suất → danh sách render lại đúng; chọn/bỏ nhiều box hoạt động.

   - nhánh `feat/joyxjoy-landing` · commit `b403480`
   - Tạo `components/{LandingApp,FrequencySelector,BoxSection,BoxCard}/`, `styles/`, sửa
     `managers/DisplayManager.js`; test mới
     `packages/assets/src/scripttagTests/subscriptionBoxJoyxjoy/getBoxFrequencyPlan.test.js`
   - Vòng 1 FAIL: đọc tần suất bằng regex trên **tên** plan. Verifier chạy thật:
     `"Giao mỗi 2 tuần"` → null · `"Deliver every 14 days"` → null · `"Bi-weekly delivery"` → null,
     và vì lưới an toàn ẩn box khi không match → **box biến mất im lặng**.
     Vòng 2 sửa: `delivery_policy` → `billing_policy` → regex (fallback), quy đổi `DAY`+14 = 2 tuần,
     chuẩn hoá `interval` hoa/thường, và `console.warn` kèm handle khi không match.
   - Dùng Preact trần + inject CSS bằng string thay `preact/compat` + `.scss`: compat và
     style-loader/css-loader runtime tốn ~7KB, vượt trần 30KB.
   - Verify vòng 2: `check` 0 · `jest:fn` 214/214 · `jest:as` 16/16 · eslint 0 lỗi · bundle 29775B.
     Verifier gỡ nhánh `delivery_policy` → 3 test đỏ; gỡ `console.warn` → 1 test đỏ; render bundle
     ĐÃ BUILD trong jsdom xác nhận đổi tần suất, multi-select, drop stale selection, và
     `AVADA_JW` undefined không throw.

7. [✅ 2026-08-19] **Section 2 — staples** — category chips (`renderChips` `:736`, `setCat` `:759`), search
   (`onSearch` `:716`), variant selector (`variantIndex` `:870`, `keyOf(id,vi)` `:874`), quantity
   (`changeQty` `:899`), phân trang (`renderPager` `:838`). Data từ `window.AVADA_JW.categories`,
   lazy-fetch `/collections/{handle}/products.js` khi bấm tab nếu Liquid chưa inject sẵn.
   Done: chips/search/variant/qty/pager chạy đủ trên store dev.

   - nhánh `feat/joyxjoy-landing` · commit `bf7a0d9`
   - Tạo `components/StapleSection/{staplesLogic.js,StapleSection.js,CategoryChips.js,SearchBar.js,Pager.js,StapleCard.js}`,
     sửa `LandingApp.js`, `DisplayManager.js`, `styles/joyxjoyLandingCss.js`; test mới
     `scripttagTests/subscriptionBoxJoyxjoy/staplesLogic.test.js` (25 case)
   - Logic thuần tách ra `staplesLogic.js` để test độc lập; component chỉ lo render.
   - Lazy-fetch `/collections/{handle}/products.js`; chip vẫn hiện cả category rỗng (khác mockup
     `catsFor` `:719-722`) vì ẩn đi thì không bấm được để trigger fetch.
   - Verify: `check` 0 · `jest:fn` 214/214 · `jest:as` 17/17 · eslint 0 lỗi · bundle **41.0KB**.
     Verifier mutation-test 3 hàm đều đỏ đúng; render bundle đã build trong jsdom kiểm đủ
     chips/search/variant/qty/pager, lazy-fetch **không refetch lần 2**, lỗi fetch **không kẹt
     spinner**, và section 1 không bị phá.
   - Verifier **sửa lại agent**: "lệch mockup #3" (qty theo variant) KHÔNG phải lệch — mockup
     `onVariant()` `:882-886` vốn làm y vậy. Agent báo nhầm, code thì đúng.

8. [✅ 2026-08-19] **Section 3 — one-off** — tái dùng component của task 7, khác nhãn và khác property lúc
   add cart. Done: state tách bạch với section 2 (`state.oneoff` vs `state.staples`).

   - nhánh `feat/joyxjoy-landing` · commit `585075f`
   - Tách `components/ProductPickerSection/` config-driven (chips/search/variant/qty/pager + state);
     `StapleSection` và `OneOffSection` rút thành wrapper mỏng chỉ đặt copy. Xoá 4 file cũ trong
     `StapleSection/`, chuyển sang `ProductPickerSection/`.
   - **State tách bạch bằng HAI INSTANCE component riêng**, mỗi instance tự giữ `useState` — không
     singleton, không module state, không lift lên `LandingApp`. Chắc hơn khoá theo string key.
   - Bằng chứng tái dùng thật: bundle **41.0 → 41.6KB** dù thêm hẳn 1 section (nhân bản sẽ ~55KB).
   - Verify: `check` 0 · `jest:fn` 214/214 · `jest:as` 18/18 · eslint 0 lỗi.
     Verifier hoist `quantities` ra module-level **kèm event bus** để 2 instance cùng re-render
     (mô phỏng bug "share cho tiện" thật) → test đỏ đúng; dump `innerHTML` 1151 ký tự xác nhận
     jsdom render DOM thật chứ không no-op; chạy bundle ĐÃ BUILD kiểm đủ section 2, section 3 copy
     khớp mockup `:378-380`, section 1 không bị phá.

9. [✅ 2026-08-19] **Summary panel + CTA + swap modal** — summary tách 3 số recurring / savings / one-off
   (`update()` `:922`); CTA `checkout()` (`:980`) validate box → `openSwap()` (`:990`) → modal 2
   nút No swaps / Save swaps (`:483-495`, `submitSwap` `:1001`).
   Done: chưa chọn box mà bấm CTA → hiện `#reqMsg` + scroll section 1, KHÔNG add cart.

   - nhánh `feat/joyxjoy-landing` · commit `7c7b5d7`
   - Tạo `components/SummaryPanel/`, `components/SwapModal/`, `helpers/{buildOrderPayload,submitOrder}.js`;
     sửa `ProductPickerSection.js` (prop `sectionId`/`onChange`), `StapleSection`, `OneOffSection`,
     `staplesLogic.js` (`buildSelections()`), `LandingApp.js`, `styles/`; 4 test mới.
   - **State chảy lên bằng callback `onChange`**, KHÔNG lift lên `LandingApp` — picker báo lên giá
     trị **derived**, không lộ state thô. Nhờ vậy `productPickerStateSeparation.test.js`
     **không sửa một dòng** và vẫn xanh (verifier xác nhận bằng `git diff` rỗng).
   - CTA: chưa chọn box → `setShowRequiredError` + scroll `#jw-box` rồi **`return` TRƯỚC KHI mở
     modal**, nên `fetch` không bao giờ được gọi ở nhánh này. "No swaps" → `note=''` → **bỏ qua**
     `/cart/update.js`. "Save swaps" có nội dung → `/cart/update.js` trước `/cart/add.js`.
   - Payload verifier tự chạy ra: bundle `{id,quantity,selling_plan}` **không có key `properties`**;
     staple `__staple: "<sellingPlanId>"`; one-off `__purchase_type: 'one-time'`;
     `JSON.stringify(items).includes('__box_id')` → **false**.
   - Verify: `check` 0 · `jest:fn` 214/214 · `jest:as` 22/22 (baseline 18, +4) · eslint 0 lỗi ·
     bundle **58416B**. 4 mutation test: gỡ `return` sớm → đỏ; hoist `quantities` ra module-level →
     test tách bạch đỏ; thay `act()` bằng `setTimeout(0)` chạy 3 lần → đỏ 2/3, xác nhận `act()` che
     **race của jsdom** (`rAF` fallback, modal unmount khi đóng nên browser thật ~16ms không với tới)
     chứ không che bug sản phẩm.
   - Verifier tự ghi **chưa xác minh**: không dựng lại jsdom render thủ công cho 3 section cũ, dựa
     vào 8/8 suite xanh + mutation test đã chứng minh suite không rỗng.

10. [✅ 2026-08-19] **`buildCartItems` helper** — `subscriptionBoxJoyxjoy/helpers/buildCartItems.js`, build
    payload 3 loại theo bảng "Property contract cart" ở trên. **Viết bản riêng, KHÔNG import**
    `packages/scripttag/src/fixedBundleBox/helpers/handleAddToCart.js`.
    Nối luồng: `/cart/update.js {note}` → `/cart/add.js {items}` → `/checkout`.
    Done: unit test phủ cả 3 loại, khẳng định **không có key `__box_id`** trong payload.

   - ⚠️ **Vòng 1 verifier trả FAIL** vì vi phạm ràng buộc import. Đang sửa vòng 2.
     Finding: `helpers/buildCartItems.js:1` import `cleanEmptyField` từ
     `@scripttag/subscriptionBox/helpers/` — brief cấm tuyệt đối mọi import từ
     `subscriptionBox`/`fixedBundleBox`. Hàm đó chỉ 8 dòng `reduce` thuần, không kéo dependency
     nên rủi ro kỹ thuật thấp, nhưng inline được nên không có lý do giữ.
   - Phần đã verify ĐẠT, đừng làm hỏng khi sửa: property contract khớp chính xác bảng
     (bundle không có key `properties`; staple `__staple`; one-off `__purchase_type`;
     không bao giờ có `__box_id`); hàm thuần không đọc `window`; test guard thật (2/2 mutation đỏ).
   - Ghi nhận vị trí test: đặt ở `packages/assets/src/scripttagTests/` vì `packages/scripttag`
     KHÔNG có jest runner riêng, và `packages/assets/jest.config.js` đã có alias `@scripttag`.
     Verifier xác nhận suite này CHẠY THẬT trong gate (`jest:as` 14 → 15).

   - nhánh `feat/joyxjoy-landing` · commit `4d1b8e2`
   - Tạo `subscriptionBoxJoyxjoy/helpers/buildCartItems.js` + test
     `packages/assets/src/scripttagTests/subscriptionBoxJoyxjoy/buildCartItems.test.js`
   - **Zero import** — logic lọc field rỗng inline thay vì mượn `cleanEmptyField` từ
     `subscriptionBox`, giữ trang bespoke cách ly hoàn toàn (vòng 1 FAIL vì đúng điểm này).
   - Verify vòng 2: `check` 0 · `jest:fn` 214/214 · `jest:as` 15/15.
     Verifier tự thêm `__box_id` → suite đỏ; tự đổi `selling_plan` one-off → suite đỏ; khôi phục
     xác nhận byte-identical. Kiểm biên `sellingPlanId` = `null`/`undefined`/`0`/`''` đều KHÔNG
     sinh key rác.
   - ⚠️ Khác biệt hành vi có chủ đích so với `cleanEmptyField` gốc: hàm cũ loại trừ
     `['', null, undefined, false]` — **không loại `0`**, nên `sellingPlanId: 0` bản cũ giữ
     `__staple: 0`, bản inline drop hẳn. Verifier đánh giá hướng mới đúng spec hơn.

11. [✅ 2026-08-19] **Deep-link `?bundle=<handle>`** — landing đọc `URLSearchParams.get('bundle')` lúc init →
    `toggleBox(handle)` + scroll section 1. Convention app đã dùng:
    `fixedBundleBox/managers/DisplayManager.js:22`.
    Xử lý lệch: handle không tồn tại → bỏ qua, render trắng, không lỗi; bundle không có plan cho
    tần suất mặc định → chọn tần suất đầu tiên nó hỗ trợ.
    Done: unit test cho 3 nhánh (khớp / không tồn tại / thiếu tần suất).

    - nhánh `feat/joyxjoy-landing` · commit `0aef32c`
    - Tạo `helpers/resolvePreselect.js` (logic thuần 3 nhánh) + 2 test suite; sửa `LandingApp.js`
      (mount-only `useEffect`). **Không** đụng `DisplayManager.js` — logic sống hết trong
      `LandingApp` vì nó vốn giữ `weeks`/`selectedIds` và target `#jw-box`.
    - Nhánh quan trọng nhất: bundle có thật nhưng **thiếu plan cho tần suất mặc định** → **đổi tần
      suất** sang cái đầu tiên bundle hỗ trợ. Thiếu bước này thì lưới an toàn section 1 ẩn ngay
      bundle vừa chọn → khách bấm từ PDP sang thấy trang trắng.
    - `useEffect` dependency `[]` → chỉ chạy lúc mount, không ghi đè lựa chọn thủ công của khách.
    - Báo lỗi qua `reportWarn` (`helpers/report.js`), không `console.*`.
    - Verify: `check` 0 · `jest:fn` 214/214 · `jest:as` 24/24 (baseline 22, +2) · eslint 0 lỗi ·
      bundle 65.4KB. Verifier mutation-test **cả 3 nhánh** đều đỏ đúng; gỡ fallback tần suất →
      assertion `/2 week/i` nhận `"Every 1 week"` (đúng bug đã lo). In `innerHTML` xác nhận DOM
      render thật. Trên bundle production: 2 message mới **có mặt**, còn
      `grep -o "console\.[a-z]*("` → **rỗng** (xác nhận kép `drop_console` xoá thật và `report.js`
      lách thật).

12. [✅ 2026-08-19] **Khối tĩnh** — hero (`:242`), "Three simple steps" (`:251`), "When to order for your
    delivery day" (`:422`), FAQ (`:443`). Giữ nguyên copy + ảnh Joy Wholefoods trong mockup.
    Done: bundle build vẫn < 30KB (`.claude/rules/storefront.md`).

### Theme khách + verify

    - nhánh `feat/joyxjoy-landing` · commit `9b22dcb`
    - Tạo `components/{HeroSection,HowItWorksSection,DeliveryInfoSection,FaqSection}/`, sửa
      `LandingApp.js` (mount, diff thuần cộng thêm 8 dòng) và `styles/joyxjoyLandingCss.js`
      (thuần cộng thêm, không đổi rule cũ).
    - FAQ dùng `<details>/<summary>` native, `+`/`–` bằng CSS `[open]` — khớp mockup 1:1.
    - Verify: `check` 0 · `jest:fn` 214/214 · `jest:as` 22/22 · eslint 0 lỗi · bundle **64.6KB**.
      Verifier load bundle ĐÃ BUILD trong jsdom, dump thứ tự 9 section khớp chính xác mockup;
      đối chiếu copy `landing-src.html:240-479` **khớp từng ký tự**; click thật vào `<summary>` →
      `open` false→true; CTA chưa chọn box vẫn KHÔNG gọi `fetch`.
    - ⚠️ **Ảnh: thay bằng emoji, CẦN BẠN THAY ẢNH THẬT.** Mockup dùng ảnh local
      (`boxes/box1.jpg`, `staples/s1.jpg`, `oneoff/o1.jpg`) — bị git-exclude, không có URL CDN,
      và bundle không phải nơi chứa ảnh. Ship `<img src>` trỏ path local sẽ **404 trên storefront
      khách**, nên agent thay bằng emoji badge (🥦/🥛/🍓, `aria-hidden`) kèm comment ở
      `HowItWorksSection.js:5-13`. Verifier xác nhận không còn `<img>` nào và không file ảnh nào
      lọt vào `packages/scripttag`. → **Việc của bạn:** upload 3 ảnh lên Shopify Files rồi thay
      `src` vào (xem thêm task 17).
    - Lệch mockup duy nhất khác: `rel="noopener noreferrer"` thay vì `rel="noopener"` — superset
      an toàn hơn, verifier đánh giá không phải regression.
    - Verifier tự ghi **chưa xác minh**: không chạy lại sâu tương tác section 4/5/6 vì fixture của
      nó không khớp shape `delivery_policy` thật nên box bị lọc đúng logic (và bundle log ra
      `no selling plan matched 1 week(s)` — gián tiếp chứng minh kênh báo lỗi task 15 chạy thật).
      Dựa vào `jest:fn` 214/214 xanh + diff `LandingApp.js` thuần cộng thêm.

13. [⏸️] **Section Liquid + template page** — `sections/joy-subscription-landing.liquid` +
    `templates/page.build-your-subscription.json` trong theme khách. Section inject
    `window.AVADA_JW` (bundles từ `shop.metafields.avada_custom_landing.data` nhưng giá/ảnh/
    `selling_plan_groups` lấy từ `all_products[handle]` — xem spec mục 4), render `.jw-landing-root`,
    chèn `<script src="https://cdn-joy-sub.avada.io/scripttag/avada-subscription-box-joyxjoy-main.min.js" defer>`.
    **KHÔNG sửa file nào sẵn có của theme** (theme đã có BYOB riêng: `custom-box-product.liquid`,
    `product-customize-box.liquid`, `collection.seasonalboxes.json`). Cần theme access → chờ dantt.

    **TRẠNG THÁI 2026-08-19: code đã viết xong, CHƯA COMMIT — blocker sau 2 vòng FAIL.**
    File đã có (untracked, trong worktree): `docs/joyxjoy-theme/{sections/joy-subscription-landing.liquid,
    templates/page.build-your-subscription.json,README.md}`.
    Vòng 1 FAIL 3 finding (schema name >25 ký tự · `eager_product_limit` cắt im lặng · thiếu
    `compare_at_price`) → agent sửa → **vòng 2 vẫn FAIL**, vì cách sửa finding 2 tái sinh đúng bug đó
    ở ngưỡng khác:
    - Schema đặt `eager_product_limit: {min:0, max:60, step:4, default:24}` (`:258`)
    - Gate `{%- if eager_limit > 0 and c.products_count <= eager_limit -%}` rồi `for product in c.products`
      không `limit:` (`:149-150`)
    - Nhưng Liquid `collection.products` **chỉ trả tối đa 50** khi không có `{% paginate %}`
      (tài liệu Shopify chính thức, verifier fetch trực tiếp)
    ⇒ merchant set 52–60 + category có 51–60 sản phẩm → vào nhánh eager nhưng chỉ render 50
      ⇒ mảng **không rỗng nhưng bị cắt**, `ProductPickerSection.js:145` chỉ lazy-fetch khi rỗng
      ⇒ item 51+ vĩnh viễn không tới được.
    - Kéo theo: comment Liquid (`:112-127,142-148`), schema `info` (`:261`), README (`:67-82,186-190`)
      **khớp nhau nhưng cùng SAI** — cả ba khẳng định "never a partial/truncated list".
    **Cách sửa đã rõ và nhỏ**: `max: 50` (hoặc bọc `{% paginate %}` xử lý phần dư) + sửa lại 3 chỗ
    tài liệu. Nhưng luật là 2 vòng FAIL = blocker, **chờ dantt cho phép vòng 3**.
    Đã xác nhận TỐT ở vòng 2, không cần đụng lại: `compare_at_price` thêm đúng (`:166`) và
    `summaryLogic.js:26-31,49-62` đã có guard `compareAt > price` sẵn ở cả 2 tầng + `savings > 0`
    ở `SummaryPanel.js:72` ⇒ không có savings âm · `products_count` là field Liquid có thật ·
    `shopify theme check` exit 0 trên scaffold verifier tự dựng, `name` dài 24.

14. [⏸️] **Verify end-to-end 1 đơn thật trên store dev** — chọn box + staple + one-off, checkout.
    Kiểm: (a) contract có line staple lặp mọi cycle; (b) one-off KHÔNG có trong contract, chỉ trên
    order gốc; (c) box mang đúng selling plan của tần suất đã chọn; (d) "Save swaps" → order note
    chứa nội dung → contract + upcoming order kế thừa; (e) "No swaps" → không note rác;
    (f) `?bundle=` pre-select đúng.

15. [✅ 2026-08-19] **`drop_console` xoá mọi log ⇒ fix "chống im lặng" của task 6 vô hiệu ở production**
    Bằng chứng: `packages/scripttag/webpack.config.js:156` đặt `drop_console: true`, nên
    `console.warn` ở `components/BoxSection/getBoxFrequencyPlan.js:90` **bị Terser xoá khỏi bundle
    production**. Tự kiểm: `grep -c "no selling plan matched" static/scripttag/avada-subscription-box-joyxjoy-main.min.js`
    → **0**.
    Hệ quả: task 6 FAIL vòng 1 vì *"bundle thiếu selling plan cho tần suất đang chọn thì biến mất
    IM LẶNG, không lỗi không log"*. Phần sửa cấu trúc (đọc `delivery_policy`/`billing_policy`) có
    tác dụng thật, nhưng phần quan sát được thì **không** — trên store thật box vẫn biến mất không
    dấu vết. Cùng vấn đề với `console.error` ở `StapleSection.js` (lỗi lazy-fetch).
    Không phải regression riêng của feature này: 112 chỗ `console.*` khác trong
    `packages/scripttag/src` đều bị strip như vậy (verifier task 7 đã đếm).
    Cần chốt cách báo lỗi sống sót qua production build — vd render hint trong UI cho merchant,
    hoặc một kênh log không dùng `console`. **Đừng chỉ bỏ `drop_console`** — đó là cấu hình dùng
    chung cho mọi bundle scripttag.

    - nhánh `feat/joyxjoy-landing` · commit `51895e1`
    - Tạo `helpers/report.js` tham chiếu `console` **gián tiếp qua biến** — Terser `drop_console`
      chỉ nhận diện pattern gọi tĩnh `console.xxx()`, không truy giá trị qua biến. Vẫn là object
      `console` thật lúc runtime nên `jest.spyOn(console,'warn')` vẫn bắt được. Chuyển
      `getBoxFrequencyPlan.js` (`console.warn`) và `ProductPickerSection.js` (`console.error`) sang
      dùng nó. Để nguyên `console.log` khởi tạo ở `index.js`/`DisplayManager.js` (chỉ là noise).
    - **KHÔNG sửa `webpack.config.js`** — verifier xác nhận `git diff` rỗng, `drop_console: true`
      vẫn nguyên ở dòng 156, nên 6 bundle của các merchant khác không bị ảnh hưởng.
    - Verify: `check` 0 · `jest:fn` 214/214 · `jest:as` 22/22 · eslint 0 lỗi.
      `grep -c` trên bundle production: `"no selling plan matched"` = **1**, `"failed to lazy-fetch"`
      = **1** (trước là 0). Verifier **không chỉ grep chuỗi** mà tìm ra định nghĩa đã minify —
      `function Ce(){...window.console...}` / `function Ie(){var e=Ce();e.error.apply(...)}` —
      xác nhận có **lời gọi thật**, không phải string mồ côi trong dead code. Gỡ `reportWarn` →
      test đỏ đúng.
    - Verifier tự ghi **chưa xác minh**: chưa có test runtime nào spy `console.error` cho nhánh
      lazy-fetch ở `ProductPickerSection.js` (chỉ nhánh warn của `getBoxFrequencyPlan` có).
      Bằng chứng ở tầng bundle nhất quán nhưng không có assertion jsdom riêng.

16. [✅ 2026-08-19] **Dọn chỗ ở của `staplesLogic.js`** (nhỏ, code-quality — verifier task 8)
    File logic thuần dùng chung đang nằm ở `components/StapleSection/staplesLogic.js`, trong khi
    **mọi consumer đã chuyển sang** `components/ProductPickerSection/` và phải import ngược
    `../StapleSection/staplesLogic` — `ProductPickerSection.js:17`, `CategoryChips.js:6`,
    `Pager.js:6`, `ProductCard.js:7`.
    Lý do agent để lại: *"vì test `staplesLogic.test.js` import đúng path này"* — verifier đánh giá
    là **lý do yếu**, sửa 1 dòng import trong test là việc rẻ.
    Verifier kết luận: layout ngược thật, nhưng không vi phạm rule cứng nào, không gây bug, không
    ảnh hưởng test/build ⇒ **không đủ nặng để FAIL**, ghi thành việc dọn riêng.
    Gợi ý: đổi tên thành `pickerLogic.js` (không còn riêng "staple" nữa) và chuyển vào
    `ProductPickerSection/`, cập nhật 4 import + 1 import trong test.
    - nhánh `feat/joyxjoy-landing` · commit `ad6e3a2`
    - `StapleSection/staplesLogic.js` → `ProductPickerSection/pickerLogic.js`; test đổi tên theo.
      Reference thật là **9 chỗ, không phải 4+1** như brief ghi (task 9 thêm `summaryLogic.js`
      import + comment, và `buildOrderPayload.js`) — agent tự grep lại thay vì tin con số.
      `StapleSection/` giờ chỉ còn `StapleSection.js` + `index.js`, cả hai không đổi.
    - Verifier chấm bằng cách **diff với bản gốc lấy từ git** (`git show HEAD:...staplesLogic.js`):
      chỉ docblock/comment đổi, **KHÔNG dòng logic nào** — đúng tiêu chí của một lần move thuần.
      Test diff chỉ đổi import path + nhãn `describe`, assertion nguyên vẹn.
    - Verify: check 0 · jest:fn 214/214 · jest:as 24/24 · eslint 0 · `grep -rn "staplesLogic"
      packages/` **rỗng** · 10 suite scripttag / 72 test xanh · mutation đảo điều kiện lọc
      category (`pickerLogic.js:49`) ⇒ 3 test đỏ, restore rồi diff lại khớp.
    - **Chốt được một nghi vấn cũ**: bundle 65.4KB đo trên cây sạch (task 11 đã commit) ⇒ phần
      chênh 64.6→65.4KB là code task 11, không phải refactor này. Trước đó chỉ là suy đoán.

17. [⏸️] **Thay 3 emoji ở "Three simple steps" bằng ảnh thật** — chờ bạn cấp ảnh.
    Hiện đang là emoji badge 🥦/🥛/🍓 (`components/HowItWorksSection/HowItWorksSection.js:5-13`),
    là bản tạm có chủ ý vì ảnh mockup (`boxes/box1.jpg`, `staples/s1.jpg`, `oneoff/o1.jpg`) bị
    git-exclude và không có URL CDN.
    Cách làm khi có ảnh: upload lên **Shopify Files** của `dantt-subscription-box`, lấy URL CDN
    (`https://cdn.shopify.com/s/files/...`), thay mảng emoji bằng mảng URL rồi render `<img>` với
    `alt` mô tả. **Đừng copy file ảnh vào `packages/scripttag/`** — bundle không phải nơi chứa ảnh.

---

## Ngoài scope, ghi lại để không quên

- **Tối ưu bundle size — làm SAU khi trang chạy được.** Chốt hoãn có chủ đích, không phải quên.
  Khi đó đo thật trên trang thật rồi mới quyết: `webpack-bundle-analyzer` đã có sẵn trong
  `packages/scripttag/webpack.config.js` (đang comment), và `chunkFilename`/`chunkLoadingGlobal`
  đã nối sẵn cho bundle này nên `import()` động dùng được ngay khi cần.

- **Chỗ hook metafield có thể đơn giản hơn** (verifier task 4, không phải defect): đặt hook trong
  `fixedBundleController.js` **sau** `updateProductBundlePlan` thì chỉ cần đọc lại
  `getAllFixedBundlesByShopId`, bỏ được toàn bộ phần merge-from-memory ở
  `fixedBundleService.js`. Task 4 không làm vì brief cấm sửa controller. Cân nhắc khi nào rảnh.
- **`helpers/logger.js` KHÔNG TỒN TẠI** dù `.claude/rules/server-code.md` và `CLAUDE.md` bắt
  *"dùng `logger` from `helpers/logger.js` — NEVER `console.log`"*. Verifier task 4:
  `find packages/functions/src -iname "*logger*"` trả về rỗng, và **128 file** dưới
  `packages/functions/src/services` đang dùng `console.*`. Rule này hiện là nguyện vọng chưa có
  hạ tầng — hoặc bổ sung `helpers/logger.js`, hoặc sửa rule cho khớp thực tế.

- **PDP purchase-options widget** (`store.html:12607-12690`): radio "Subscribe & Save" / "Buy once"
  + teaser "Want this every week?". Đã chốt làm sau. Rủi ro cần cân nhắc trước khi làm: nó chiếm
  `.product-form__buttons` — đúng chỗ **Appstle** đang dùng trong theme thật.
- **Theme khách đang chạy Appstle Subscription** (`templates/product.subscription-box.json:30`),
  không có tham chiếu Avada/Joy nào. Đây là bối cảnh **migration**, ảnh hưởng kế hoạch go-live.
- **Bug tiềm ẩn trong app**: `buildStaplesList` (`subscriptionContractCreateService.js:651`) không
  lọc theo contract đang xử lý → 1 đơn sinh nhiều contract thì staples bị add vào cả hai. Trang này
  né được nhờ frequency selector cấp trang, nhưng Fixed Bundle Box vẫn dính. Task riêng: lọc theo
  selling plan của contract (với case 1 box hiện tại là no-op nên an toàn).

18. [✅ 2026-08-19] **Section 1 sẽ hiện 9 box thay vì 2 — dọn bundle rác trên store dev trước khi test**
    Query Firestore lúc verify seed (2026-08-19) cho ra **9 doc `bundleType='fixed-bundle'`**
    thuộc shop `tUs6Qo2JwHbHXohDitrQ`, trong đó 7 cái là rác từ test cũ:
    ```
    APX1KFIjjupWFAIt3m9z  Product Bundle #1
    Ai1gwhbCKmERpbafUIRG  Tent Package A 10×10 Subscription
    BJMsAcixj6XGf2x5XKTr  hehe cuoc doi 12111
    DxqMIgXLz6Z97P4K1wjf  haizzzzzzz
    sf8que0ixCdEhC6fgzn2  Sanr phaam bundle moi
    sxBbTB1XxrXi5Ea4SzkH  Product Bundle #6
    zVT0wfWk95sFnMbGW2jP  Bundle để fix bug
    ```
    `updateCustomLandingMetaField` build danh sách từ `getAllFixedBundlesByShopId` — **không lọc gì
    thêm** — nên section 1 sẽ nhận cả 9. Bảy cái rác hoặc không có selling plan hoặc tần suất khác
    2 box seed ⇒ theo fix task 6 chúng bị `getBoxFrequencyPlan` trả null rồi **ẩn kèm
    `reportWarn`**. Landing không crash, nhưng lúc test bạn sẽ thấy section 1 lộn xộn / thiếu box
    và rất dễ tưởng là bug của landing chứ không phải dữ liệu bẩn.
    **Đây là quyết định của bạn, không phải việc agent tự làm**: xoá/đổi `bundleType` mấy doc rác
    trên store dev, HOẶC chấp nhận và bỏ qua khi test. Chưa chốt thì đừng ai "tối ưu" bằng cách
    thêm filter vào `updateCustomLandingMetaField` — đó là hành vi chung của app, không phải của
    landing này.
    - nhánh `feat/joyxjoy-landing` · commit `2976cea`
    - Script `packages/functions/src/commands/misc/cleanJunkFixedBundles.js` — **dantt tự chạy
      `--apply`**, agent chỉ được dry-run.
      ```bash
      cd ~/projects/subscriptions-joyxjoy
      yarn workspace @avada/functions run production
      set -a; source packages/functions/.env.local; set +a
      export GOOGLE_APPLICATION_CREDENTIALS="$PWD/packages/functions/serviceAccount.development.json"
      SA_ENV=development node packages/functions/lib/commands/misc/cleanJunkFixedBundles.js \
        dantt-subscription-box.myshopify.com                      # chỉ liệt kê, không chọn gì
      SA_ENV=development node packages/functions/lib/commands/misc/cleanJunkFixedBundles.js \
        dantt-subscription-box.myshopify.com \
        --keep=gcLPB5jNtJZ2JyRSbPMS,2Oal5MZXq3P7kgdzledG          # xem 7 cái sẽ archive
      # thêm --apply khi đã đọc kỹ danh sách
      ```
    - Cách xử: **đổi `bundleType`, KHÔNG xoá doc** — đảo lại được bằng cách set lại
      `bundleType='fixed-bundle'`. Ghi qua `updateProductBundlePlan`, writer này có check
      ownership thật (`productBundleRepository.js:51-66` throw `Unauthorized` khi lệch `shopId`).
    - Không hardcode id nào trong code; nhận qua `--ids=`/`--keep=`. Chạy không flag thì chỉ liệt kê.
    - Verify (verifier độc lập, PASS): check 0 · jest:fn 214/214 · jest:as 24/24 · eslint 0 ·
      dry-run thật với 4 tổ hợp flag (`--keep` id không tồn tại → **exit 1 fail-closed**,
      `--ids`+`--keep` cùng lúc → exit 1) · mutation test đảo điều kiện lọc dòng 161 ⇒ output đảo
      đúng chiều, restore `diff` identical. Chạy lại dry-run sau khi sửa docblock: hành vi không đổi.
    - Side-effect đã ghi thành **task 19**.

19. [⏸️] **Admin tab "All" của Product Bundles không filter `bundleType` — doc lạ hiện với UI hỏng**
    Verifier task 18 tìm ra (2026-08-19), là **gap có sẵn trong code**, không phải do task 18 tạo:
    - `packages/assets/src/pages/Settings/Tabs/ProductBundles/ProductBundles.js:135` — tab "all"
      gửi `bundleType: ''`
    - `packages/functions/src/repositories/productBundleRepository.js:163-171` — `getList` khi
      `bundleType` falsy **và** không có `bundleTypeIn` thì **không filter theo `bundleType` chút nào**
      ⇒ trả về mọi `bundleType` của shop
    - Hệ quả với doc có `bundleType` mà UI không biết: edit-link build từ `bundleType`
      (`ProductBundles.js:303`) trỏ route không tồn tại · label i18n garble (`:316`, thiếu key
      `ProductBundles.bundleType.<value>`) · nút xoá rơi nhánh modal sai (`:387`, vì
      `bundleType !== BUNDLE_TYPE_FIXED_BUNDLE`)
    Với store dev sau khi chạy script task 18 thì đây chỉ là **chuyện thẩm mỹ** — 7 doc rác hiện ở
    tab "All" trông hỏng, landing vẫn đúng. Nhưng nó là hành vi chung của app: bất kỳ `bundleType`
    nào không nằm trong danh sách UI biết đều rơi vào tình trạng này.
    **Chưa chốt là bug cần sửa hay chấp nhận được** — `packages/assets/**` nằm trong danh sách
    KHÔNG ĐỤNG của project landing này, nên nếu sửa thì phải là task riêng ngoài scope landing,
    và cần dantt quyết vì nó ảnh hưởng mọi merchant chứ không riêng shop này.

