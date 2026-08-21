# Joy Wholefoods "Build Your Subscription" landing — BRIEF CUSTOM

<!--
  `[ ]` chưa làm · `[⏳ HH:MM]` đang chạy · `[⏸️]` chờ người, đừng nhận · `[✅ YYYY-MM-DD]` xong
  Chạy: /loop 5m /looptasks ~/projects/my-brain/10-projects/subscriptions/BRIEF-CUSTOM.md

  Gate của repo này (JS thuần — KHÔNG có tsc):
    ⚠️ CHẠY THẲNG BINARY, ĐỪNG QUA `rtk` — `rtk` NUỐT EXIT CODE.
    bash .claude/scripts/gates.sh            # ~6s, chấm cả 4 gate. exit 2 KHÔNG phải pass
    yarn workspace @avada/scripttag run webpack-<script-name>-main   # build 1 bundle
    # ⚠️ KHÔNG có script `production` trong @avada/scripttag — tài liệu cũ ghi sai, đã kiểm.

  BASELINE ĐÃ ĐO (cập nhật 2026-08-21 sau task 26/27, @ 645f9fb):
    check    exit 0 · 7 rule groups clean
    jest:fn  exit 0 · 214 passed, 214 total   ← KHÔNG có suite fail sẵn
    jest:as  exit 0 ·  28 passed,  28 total   ← 13 suite của landing đã cộng vào đây
    tree     clean
  ⇒ Chấm "phải XANH TUYỆT ĐỐI", không phải "không suite nào MỚI đỏ".
     Suite < 214 / < 28 nghĩa là có suite chết lúc load → thiếu env, KHÔNG phải pass.
  ⚠️ Số 212/14 và 214/24 ở bản cũ là baseline của các giai đoạn trước. Đừng dùng lại.
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

## ✅ Vị trí làm việc — ĐÃ ĐỔI 2026-08-20

**Làm việc tại `~/projects/subscriptions` (REPO CHÍNH), nhánh `feat/joyxjoy-landing`.**
KHÔNG đụng `~/projects/subscriptions-kookut`.

⚠️ **Worktree `~/projects/subscriptions-joyxjoy` ĐÃ BỊ XOÁ** (2026-08-20, dantt yêu cầu gộp về
repo chính vì repo chính không dùng vào việc gì). Mọi đường dẫn cũ trỏ vào đó đều chết.
Đã bê theo: `docs/joyxjoy-theme/` (task 13, chưa commit) + 165 file ảnh mockup 14MB
(nằm trong `.git/info/exclude` nên `git status` KHÔNG hiện — đừng tưởng là sạch rồi xoá).
Gate đo lại tại vị trí mới: check 0 · jest:fn 214/214 · jest:as 28/28.

Nhánh `feat/joyxjoy-landing` giờ nằm thẳng ở repo chính. **Không còn worktree nào để dựng.**
4 file bị gitignore (`.env`, `packages/functions/.env.local`, `.runtimeconfig.json`,
`serviceAccount.development.json`) vốn đã có sẵn ở repo chính — không phải copy gì nữa.
Spec + mockup đã commit (`2143407`); riêng 165 file ảnh mockup vẫn là file local, đã bê theo
khi gộp, nằm ở `docs/mockups/joyxjoy-wholefoods-landing/{boxes,staples,oneoff,cat}/` + `farmbox.jpg`.


Đã cắn 2 lần rồi, đừng lặp lại:

- **Thiếu `.runtimeconfig.json` / `.env.local`** → 2 suite chết ngay lúc load ở
  `@avada/core` `Context.initialize`. Jest vẫn in `Tests: … passed` trông như xanh.
  **Chấm theo dòng `Test Suites:`, đừng bao giờ chấm theo dòng `Tests:`.**
- **Gate hook chạy `yarn check` ở REPO CHÍNH**, không phải worktree → repo chính cũ thì worktree
  sạch vẫn bị chặn. Nếu gặp, ff repo chính về master trước.

Subagent: chỉ được đọc/ghi trong `~/projects/subscriptions`. **BỊ CẤM chạy git**
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

2. [⏸️] **Seed thật** — bước 1+2 XONG (main agent chạy 2026-08-19), **chỉ còn bước 3 cần UI admin**. **Ba bước, đủ cả ba mới có dữ liệu:**

   ```bash
   # 1. PHẢI build trước — script import qua alias @functions/*, chạy thẳng src/ sẽ lỗi
   #    "Cannot find module '@functions/repositories/productBundleRepository'" (verifier đã thử)
   cd ~/projects/subscriptions
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

14. [⏸️] **Verify end-to-end 1 đơn thật trên store dev** — chọn box + staple + one-off, checkout.
    Kiểm: (a) contract có line staple lặp mọi cycle; (b) one-off KHÔNG có trong contract, chỉ trên
    order gốc; (c) box mang đúng selling plan của tần suất đã chọn; (d) "Save swaps" → order note
    chứa nội dung → contract + upcoming order kế thừa; (e) "No swaps" → không note rác;
    (f) `?bundle=` pre-select đúng.

17. [✅ 2026-08-21] **Thay 3 emoji ở "Three simple steps" bằng ảnh SẢN PHẨM THẬT** — hết chờ ảnh (dantt 2026-08-21)
    - nhánh `feat/jw-steps-images` · commit `0c9ef59` · executor: codex lane T17 (gpt-5.6-sol high)
    - Sửa `HowItWorksSection.js`, `LandingApp.js`, `joyxjoyLandingCss.js` + test mới `howItWorksImages.test.js`
    - Ảnh lấy từ `bundles[].image` / `products[].featured_image` qua `filterCategoriesByStep`, lọc URL rỗng, cap 4 ảnh/step.
      **Không render wrapper `.jw-box-stack` khi mảng rỗng** — tránh `div:empty{display:none}` của theme khách.
    - verifier PASS: `check` exit 0 · `jest:fn` 214/214 · `jest:as` 29/29 (baseline 28 +1 suite mới) · `tree` dirty là kỳ vọng.
      Mutation test: gỡ `.filter(Boolean).slice(0,4)` ⇒ test đỏ đúng như phải thế, đã hoàn nguyên.
    Trước ghi "chờ dantt cấp ảnh". **Không cần nữa**: dùng luôn ảnh sản phẩm đã có trong
    `window.AVADA_JW` — chúng là URL CDN thật của store.
    - Step 1 "Choose your seasonal box" → ảnh từ `bundles[].image`
    - Step 2 "Add your staples"        → ảnh sản phẩm của các category step 2
    - Step 3 "Top up weekly"           → ảnh sản phẩm của các category step 3

    Docblock hiện tại của `HowItWorksSection.js` giải thích vì sao dùng emoji: *"ảnh mockup chỉ nằm
    trên đĩa dưới docs/mockups/ (git-excluded, không có URL CDN)"*. **Lý do đó nay hết hiệu lực** —
    phải sửa luôn docblock, đừng để nó nói sai.

    Mockup (`landing-src.html:257-289`) dựng chồng **4 ảnh** mỗi step:
    ```css
    .box-stack{display:flex;align-items:center;margin-bottom:16px;padding-left:6px}
    .box-stack img{width:56px;height:56px;border-radius:12px;object-fit:cover;
      border:3px solid #fff;box-shadow:0 4px 12px -4px rgba(47,74,58,.4);
      margin-left:-16px;transition:transform .18s, margin .18s;background:var(--tint)}
    .box-stack img:first-child{margin-left:0}
    .box-stack:hover img{margin-left:4px}          /* hover thi gian ra */
    .box-stack img:hover{transform:translateY(-4px)}
    ```
    **Bẫy phải xử:**
    - **12/14 box hiện KHÔNG có ảnh** (xem task box-image còn treo) ⇒ step 1 có thể không đủ 4 ảnh.
      Lấy 4 sản phẩm ĐẦU TIÊN CÓ ẢNH; ít hơn 4 thì hiện bấy nhiêu; **0 ảnh thì đừng render div rỗng**
      (theme khách có `div:empty{display:none}`, và một stack rỗng nhìn như lỗi).
    - Category lazy-load ⇒ lúc mới mở trang step 2/3 có thể chưa có sản phẩm nào. Stack sẽ tự đầy khi
      [[task 26]] tải ngầm xong — **không được chờ** dữ liệu rồi mới render step.
    ⚠️ Đụng `LandingApp.js` nên **không chạy song song** với task 26/27.
    Hiện đang là emoji badge 🥦/🥛/🍓 (`components/HowItWorksSection/HowItWorksSection.js:5-13`),
    là bản tạm có chủ ý vì ảnh mockup (`boxes/box1.jpg`, `staples/s1.jpg`, `oneoff/o1.jpg`) bị
    git-exclude và không có URL CDN.
    Cách làm khi có ảnh: upload lên **Shopify Files** của `dantt-subscription-box`, lấy URL CDN
    (`https://cdn.shopify.com/s/files/...`), thay mảng emoji bằng mảng URL rồi render `<img>` với
    `alt` mô tả. **Đừng copy file ảnh vào `packages/scripttag/`** — bundle không phải nơi chứa ảnh.

---

29. [ ] **Rule CSS `.jw-step-icon` thành code chết sau task 17**
    `packages/scripttag/src/subscriptionBoxJoyxjoy/styles/joyxjoyLandingCss.js:215` — emoji
    `<span className="jw-step-icon">` đã bị gỡ khỏi `HowItWorksSection.js`, grep toàn component tree
    còn **0** chỗ dùng. Vô hại, chỉ là rác. Verifier T17 tìm ra, cố ý KHÔNG sửa để giữ diff surgical.

30. [ ] **Docblock `HowItWorksSection.js` nói ảnh "can appear on a later render" — chưa ai chứng minh được**
    Verifier T17 truy `LandingApp.js`: `categories` là prop destructure thuần, không `useState`/`useEffect`;
    lazy-fetch của `ProductPickerSection` chỉ cập nhật state NỘI BỘ section đó, **không chảy ngược lên**
    `stapleImages`/`oneOffImages`. ⇒ category vượt trần eager (`c.products_count <= 50`) nhiều khả năng
    để stack ảnh step 2/3 **rỗng vĩnh viễn**, chứ không "hiện sau" như docblock nói.
    Không crash, không vỡ layout (degrade êm) nên không chặn task 17.
    **Việc cần làm**: đếm `products_count` thật của 7 collection trên store dev. Nếu có cái nào >50 ⇒
    phải đẩy data lên `LandingApp` (hoặc sửa docblock cho đúng nếu tất cả đều <50).

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

20. [⏸️] **Seed store dev bằng dữ liệu THẬT của khách — dantt chạy `--apply`**
    Thay cho seed dựng tay. Ba script, chạy theo thứ tự. **Cần `sdd` + `emudev` đang chạy**
    cho script thứ 3.
    ```bash
    cd ~/projects/subscriptions
    yarn workspace @avada/functions run production
    set -a; source packages/functions/.env.local; set +a
    export GOOGLE_APPLICATION_CREDENTIALS="$PWD/packages/functions/serviceAccount.development.json"
    L=packages/functions/lib/commands/misc

    node $L/cleanJunkFixedBundles.js dantt-subscription-box.myshopify.com \
      --keep=gcLPB5jNtJZ2JyRSbPMS,2Oal5MZXq3P7kgdzledG      # xem trước, thêm --apply để dọn
    node $L/cloneCatalogFromSprayfree.js                     # 113 sp catalog; thêm --apply
    node $L/cloneFixedBundlesFromSprayfree.js                # 15 Fixed Bundle; thêm --apply
    ```
    - **Store khách là `sprayfreefarmacy.myshopify.com`** ("Spray-Free Farmacy"), shopId prod
      `FbvC6UZKBpw9TaXRTMLk`. `joywholefoods.com.au` chỉ là domain storefront, KHÔNG phải
      `shopifyDomain` — tìm bằng domain đó sẽ không ra gì.
    - **Mockup dựng từ bộ box CŨ.** 15 Fixed Bundle thật của khách có handle khác hẳn
      (`ultimate-organic-farm-box-1`, `budget-box`, …, tên có tiền tố `"JOY "`), không cái nào
      nằm trong mockup. Mockup chỉ dùng đối chiếu **UI + logic**; seed phải theo sản phẩm thật.
    - Cả 15 box đều có đúng **`WEEK×1, WEEK×2, WEEK×4`** — xác nhận ràng buộc "mọi box cùng
      chu kỳ" của landing đúng với thực tế khách.
    - `cloneFixedBundlesFromSprayfree.js` đi **qua route HTTP thật** nên `avada_custom_landing`
      **tự sinh** ⇒ **bỏ được bước 3 của task 2** (vào admin save lại từng bundle).
    - Kỳ vọng sau khi apply: **12 box** (không phải 15 — 3 box có ruột trỏ vào sản phẩm
      `8974713880791` đã bị xoá trên store khách), 16 sản phẩm ruột, 113 sp catalog, 7 collection.
    - nhánh `feat/joyxjoy-landing` · commit `962cda1` (catalog) · `b9e8df1` (fixed bundle)
      · `2976cea` (dọn rác)

21. [✅ 2026-08-21] **`BoxCard` lệch mockup — thiếu dòng vendor + badge save/was**
    - nhánh `feat/jw-boxcard` · commit `92d3ba6` · executor: codex lane T21 (gpt-5.6-sol high)
    - Sửa `BoxCard.js`, `joyxjoyLandingCss.js`, `joy-subscription-landing.liquid` + test mới `boxCard.test.js`
    - 🔴 **Scope phải mở rộng giữa chừng**: BoxCard render đúng nhưng vòng `for b in cfg.bundles`
      trong Liquid KHÔNG emit `vendor`/`compare_at_price` ⇒ badge là code chết trên trang thật.
      Đã thêm 2 dòng vào đúng vòng bundles (KHÔNG phải vòng products ~dòng 291 vốn đã có sẵn 2 tên field này —
      grep tên field rồi kết luận là bẫy, phải đọc đúng block).
    - Tiền: `formatMoney()` chia 100; Liquid trả **cents**. Cả `price` lẫn `compare_at_price` qua cùng hàm ⇒
      không trộn đơn vị. `8000/10000` → "Save 20%" / "$100.00", trùng công thức mockup `landing-src.html:640`.
      Data bẩn (`null`/`"10000"`/`0`/bằng nhau/thấp hơn) không ra `NaN%`/`Infinity`.
    - verifier PASS: `check` 0 · `jest:fn` 214/214 · `jest:as` 29/29.
    - **Lỗ hổng test verifier tìm ra bằng mutation, đã vá**: ban đầu đổi `>` → `>=` mà cả 4 test vẫn xanh
      (biên `compare_at_price === price` không ai phủ). Đã thêm case thứ 5; main agent tự mutation lại:
      `>=` ⇒ 1 test đỏ, hoàn nguyên ⇒ 5/5 xanh. Guard là thật.
    Audit UI vòng 2 (2026-08-20) tìm ra, **chưa sửa** vì nằm ngoài phạm vi task filterbar:
    - Mockup `renderBoxes` (`landing-src.html:638-654`): `card.box-card` > `thumb` (+ badge
      save/was price) + `body` ( `.desc` = dòng vendor, `h4`, `priceline`, `box-select` )
    - `packages/scripttag/src/subscriptionBoxJoyxjoy/components/BoxSection/BoxCard.js`:
      **thiếu hẳn `div.jw-desc`** (dòng vendor) và **thiếu markup badge save/was**
    - Không nhất quán ngay trong chính codebase: `ProductCard.js` **có** `.jw-desc`, `BoxCard` thì không.
    Lưu ý khi sửa: 10 suite test landing ở `packages/assets/src/scripttagTests/subscriptionBoxJoyxjoy/`
    phải giữ 24/24 xanh; đổi markup dễ làm đỏ — sửa cho khớp lại, đừng sửa test để né.

## Responsive — plan đã chốt 2026-08-20

Mockup CÓ responsive nhưng dừng ở mức desktop thu nhỏ: breakpoint 1180 (card 4→3),
960 (grid 2 cột→1, summary hết sticky), 860 (card 3→2), 680 (steps/info-box 1 cột),
560 (swap modal). **Từ 560px xuống — tức toàn bộ điện thoại — mockup không vẽ.**

Quyết định của dantt: **thanh CTA dính đáy màn hình** trên mobile; **lưới card dùng
`auto-fill minmax`** thay vì breakpoint theo màn hình.

25. [⏸️] **Tab "All" nên là 7 category hay TOÀN BỘ catalog? — dantt hỏi BA (2026-08-20)**
    **Hiện trạng đo được**: `filterProducts` (`pickerLogic.js:44-52`) gộp sản phẩm của các
    category block rồi `ALL_CATEGORY` trả toàn bộ mảng đó ⇒ "All" = **97 sản phẩm** từ 7 collection
    merchant chọn trong theme editor. Store dev có ~1.210 sản phẩm, **store khách có 1.416**.
    **Search cũng chỉ lọc trong 97 cái đã nạp** — gõ tên một sản phẩm có thật ngoài 7 collection
    sẽ ra "không tìm thấy" dù sản phẩm tồn tại. Đây là phần chắc chắn sai dù chọn hướng nào.

    | Hướng | "All" nghĩa là | Đánh đổi |
    |---|---|---|
    | Giữ nguyên | 7 collection curated | Merchant kiểm soát thứ khách thấy — có thể là **cố ý** |
    | `/collections/all/products.js` phân trang | toàn bộ catalog | Lẫn cả thẻ quà tặng, hàng đông lạnh, hàng ẩn… |
    | Tab curated + search `/search/suggest.json` | tab = curated, **search = toàn store** | Giữ kiểm soát phần duyệt, khách vẫn tìm được mọi thứ |

    **Lập luận để hỏi BA**: trên store khách có 1.416 sản phẩm gồm hàng đông lạnh, hàng theo mùa,
    thẻ quà tặng — "tất cả" gần như chắc chắn KHÔNG phải thứ nên hiện trong trang đăng ký
    subscription. Việc merchant chọn 7 danh mục nhiều khả năng là có chủ đích. Nhưng khách gõ
    "salmon" mà không ra gì thì là lỗi thật, không cãi được.
    ⇒ Câu hỏi cho BA: **khách được chọn staples/one-off từ toàn bộ catalog, hay chỉ từ danh mục
    merchant duyệt?** Nếu "chỉ danh mục duyệt" thì search vẫn nên bắn toàn store hay giới hạn theo?

26. [✅ 2026-08-21] **Tab "All" không tải gì → trên store khách section 2/3 TRỐNG lúc mở trang**
    `ProductPickerSection.js:141-146`:
    ```js
    if (category === ALL_CATEGORY) { return; }        // thoát sớm, KHÔNG fetch
    const target = categoryData.find(c => c.handle === category);
    if (target && target.products.length === 0) fetchCategoryProducts(category);
    ```
    Lazy-fetch **chỉ chạy khi bấm một tab cụ thể**. Mà `activeCategory` mặc định lúc mount **chính
    là `ALL_CATEGORY`**.
    Ghép với ngưỡng eager-load (`eager_product_limit`, mặc định 25, trần 50):

    | | Store dev | Store khách |
    |---|---|---|
    | Category | 5–16 sp, đều ≤25 → nhúng sẵn | 145 / 211 / 435 sp, đều >50 → **rỗng hết** |
    | Mở trang (tab All) | 97 sp | **0 sp** |
    | Search ở tab All | tìm trong 97 | **tìm trong mảng rỗng → luôn không thấy gì** |

    **dantt chốt cách xử (2026-08-21)**: giữ nguyên hành vi lúc mở trang, rồi **tải ngầm** bù vào —
    khách vào trang còn lướt hero/steps/chọn box, đó là vài giây rảnh dùng được.
    - Bắt đầu ngay khi mount, **không spinner toàn cục**, không chặn render
    - **Tối đa 1–2 request cùng lúc**, KHÔNG bắn 7 phát song song (mobile mạng yếu sẽ giành băng
      thông với ảnh sản phẩm)
    - Category nào về trước hiện ngay, danh sách "All" lớn dần
    - Khách bấm tab chưa tải xong → **ưu tiên tab đó lên đầu hàng đợi**
    - Một request hỏng → `reportWarn`, không phá phần còn lại

27. [✅ 2026-08-21] **`fetchCategoryProducts` chỉ lấy TRANG ĐẦU, coi như toàn bộ category**
    `ProductPickerSection.js:114-133`:
    ```js
    const response = await fetch(`/collections/${handle}/products.js`);   // KHÔNG có ?page
    const products = Array.isArray(data?.products) ? data.products : [];
    setCategoryData(prev => prev.map(c => c.handle===handle ? {...c, products} : c));
    ```
    Gọi không kèm tham số phân trang và **coi kết quả là toàn bộ category**. Endpoint `.js` của
    Shopify có phân trang (tài liệu nói mặc định ~50/trang) ⇒ category 435 sản phẩm chỉ hiện ~50,
    phần còn lại **không có đường lấy**.
    ⚠️ **CHƯA XÁC MINH ĐƯỢC số 50**: thử đo trên `automated-collection` (658 sp) của store dev và 2
    collection của store khách đều trả 404/0 — nhiều khả năng chưa publish ra Online Store. Nên
    con số lấy từ tài liệu, chưa phải đo thật. **Người làm task này phải tự đo lại** trên một
    collection đã publish có >50 sản phẩm.
    Cùng lớp lỗi với bug Liquid đã sửa: **dữ liệu thiếu được trình bày như đủ**, không báo gì.
    Liên quan [[task 26]] — tải ngầm mà chỉ lấy trang đầu thì search vẫn miss.

    - **26 + 27 chung commit `645f9fb`** · nhánh `feat/joyxjoy-landing` · executor: **sonnet
      (fallback — cmux CLI từ chối kết nối ngoài cmux, không dựng được lane)**
    - **Root cause ngoài dự kiến**: `/collections/{h}/products.js` **404 trên mọi collection**
      (kể cả collection đang publish) — đường đúng là `.json`. Lỗi bị `catch` nuốt nên lazy-fetch
      **chưa từng chạy**. Tôi từng thử `.js` bị 404 rồi kết luận nhầm là "collection chưa publish".
    - Đo thật: mặc định **30 sp/trang**, `limit=250` chạy đúng, `automated-collection` =
      250+250+156+0 = **656 sp**. Dừng khi trang ngắn hơn limit đã yêu cầu.
    - Trần an toàn **2000 chứ không phải 500** — 500 sẽ cắt đúng category 656 sp vừa đo.
    - Verify Chrome thật (ép `eager_product_limit=0`): Liquid nhúng 7 category / **0 sp** →
      sau **1,2s** đã có **21 card**; cả 7 category `products.json?page=1&limit=250` đều 200.
    - `jest:as` 25 → **28 suite** · `jest:fn` 214/214 · check 0 · bundle 74.9 → 80.8 KiB

28. [ ] **Tải ngầm chạy 2 lần cho mỗi category — gấp đôi băng thông**
    Đo lúc verify task 26: **14 request cho 7 category**. Vì `StapleSection` và `OneOffSection` là
    hai instance `ProductPickerSection` riêng, mỗi cái chạy hàng đợi tải ngầm của mình nên tải
    trùng y hệt nhau.
    Trên store dev không đáng kể (category 5–16 sp). Trên **store khách** category 145/211/435 sp
    ⇒ gấp đôi băng thông vô ích, và trên mobile là gấp đôi thời gian giành với ảnh sản phẩm.
    Hướng sửa: nâng phần tải/lưu sản phẩm lên `LandingApp` (một nguồn dùng chung cho cả hai
    section), hoặc một cache theo handle ở tầng module. **Đừng** để hai section tự quản lý dữ liệu
    riêng rồi đồng bộ bằng tay — sẽ lệch.

