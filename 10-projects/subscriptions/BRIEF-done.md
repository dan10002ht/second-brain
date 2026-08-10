# Joy Subscription — BRIEF (done archive)

<!-- Task xong được /looptasks cắt từ BRIEF.md sang đây, giữ nguyên tóm tắt. -->

## 2026-08-04

1. [✅ 2026-08-04] Tôi muốn tạo 1 endpoint read-only như sau:
   Tuy nhiên cần tạo worktree mới do tôi đang chạy ở một task khác ở session khác nhé
   GET /api/v1/products/best-selling?first=10 vào tsToolRouter (packages/functions/src/routes/tsTool.js), scope read, header như các endpoint TS Tool khác.
   Không phải viết logic mới đâu, gọi lại getBestSellingProducts({shop, first}) có sẵn ở services/shopify/storefrontApiService.js:123 (Onboarding V5 đang dùng), không cần xin scope mới.
   trả kèm cờ hasOrders (hasAnyOrder() ở services/graphql/orderService.js:143) — store chưa có đơn nào thì Shopify tự đổi BEST_SELLING thành sort mới nhất mà không báo lỗi, bên mình cần biết để khỏi hiện nhầm nhãn best seller.
   - nhánh `feat/tstool-best-selling` · commit `9b3b179e6` · base `origin/master` (949d8965c)
   - đã push origin, MR do user tự tạo · worktree `~/projects/subscriptions-wt-bestselling` (chưa gỡ)
   - Mới: `controllers/tsTool/tsToolProductController.js` (getBestSelling — Promise.all getBestSellingProducts + hasAnyOrder, trả `{success, data, hasOrders, pagination}`)
   - Sửa: `routes/tsTool.js` (GET /products/best-selling), `const/tsTool.js` (BEST_SELLING_FIRST_MIN/MAX/DEFAULT), `helpers/tsToolHelper.js` (clampBestSellingFirst)
   - Không cần scope mới: GET không có `?type=` đã mặc định scope `read` ở tsToolAuthMiddleware
   - Test: `__tests__/controllers/tsTool/tsToolProductController.test.js` + clamp cases trong `__tests__/helpers/tsToolHelper.test.js`
   - Verify: jest 19/19 pass, eslint exit 0 (main agent tự chạy lại trong worktree)

2. [✅ 2026-08-04] Hiện tại tôi đang muốn quay lại nhánh custom/delivery-date-spray để tiếp tục làm task liên quan đến feature này
   Nhưng mà nhánh hiện tại của tôi đang bị out of date so với master, tôi muốn bạn pull code từ master về nhánh này, conflict thì resolve giúp tôi nhé!
   - nhánh `custom/delivery-date-spray` · merge commit `148006e63` · đã push (MR sẵn có !2229)
   - worktree `~/projects/subscriptions-wt-spray` (chưa gỡ) — merge `origin/master` (949d8965c), từ behind 1058 → behind 0
   - 3 conflict: `.gitlab/ci/staging2.yml` (giữ STAGING2_BRANCH của nhánh mình), `devZoneController.js` (giữ cả case `enable-delivery-anchored-billing` + block `{}` của master)
   - **Conflict đáng nhớ**: master đã rút `controllers/apiHookV1/subscriptionController.js` từ 2079 → 44 dòng (migrate gen2), logic dời sang `services/webhook/subscriptionContractCreateService.js`. Nhánh chỉ sửa 2 dòng trong file bị xoá → phải lấy bản master rồi PORT `shop` vào call `prepareOrdersData` ở service mới (~dòng 312). Không port thì `prepareOrdersData` nhận `shop=null` → `isDeliveryAnchoredBillingEnabled` luôn false → **delivery-anchored billing tắt im lặng, không lỗi gì**
   - Verify: jest 1722 pass / 5 fail — 5 fail này pre-existing, tự kiểm bằng cách chạy lại trên worktree base origin/master ra đúng 5 fail y hệt (`automaticBillingAttemptService` thiếu mock `batchMarkOrdersProcessed`; `autoSwapService` so string "7.00" vs number 7). eslint clean

3. [✅ 2026-08-04] Ở task #1 không update document à TS_TOOL_API.MD?
   - cùng nhánh `feat/tstool-best-selling` · commit `75d3bdc71` · đã push
   - Thêm section `### GET /products/best-selling` vào `packages/functions/src/docs/TS_TOOL_API.md` (+55 dòng, bám khuôn các entry GET sẵn có)
   - Bắt được 1 lỗi doc lúc verify: ví dụ JSON ban đầu ghi có tồn kho, nhưng `BEST_SELLING_PRODUCTS_QUERY` dùng `STOREFRONT_PRODUCT_FIELDS_NO_INVENTORY` → `totalInventory`/`inventoryQuantity` không có trong response, `tracksInventory` + `inventoryItem.tracked` LUÔN false. Đã sửa ví dụ + thêm note cảnh báo
   - File `lib/docs/TS_TOOL_API.md` là build output, không đụng
## 2026-08-06

4. [✅ 2026-08-06] Check giúp tôi tại sao ở store http://ranvoostyle.myshopify.com/ đang không vào được trang subscription products
   Log: polaris-Dt80DnEy.js:32 TypeError: Cannot read properties of undefined (reading 'status')
   at index-DvbhthoG.js:1:8176
   at Array.some (<anonymous>)
   at Us (index-DvbhthoG.js:1:8158)
   at Tm (polaris-Dt80DnEy.js:30:19519)
   at Sd (polaris-Dt80DnEy.js:32:3139)
   at Ab (polaris-Dt80DnEy.js:32:44804)
   at wb (polaris-Dt80DnEy.js:32:39766)
   at tx (polaris-Dt80DnEy.js:32:39694)
   at Qs (polaris-Dt80DnEy.js:32:39547)
   at Md (polaris-Dt80DnEy.js:32:35914)
   Ed @ polaris-Dt80DnEy.js:32
   app-Bn2Tm1dj.js:17 TypeError: Cannot read properties of undefined (reading 'status')
   at index-DvbhthoG.js:1:8176
   at Array.some (<anonymous>)
   at Us (index-DvbhthoG.js:1:8158)
   at Tm (polaris-Dt80DnEy.js:30:19519)
   at Sd (polaris-Dt80DnEy.js:32:3139)
   at Ab (polaris-Dt80DnEy.js:32:44804)
   at wb (polaris-Dt80DnEy.js:32:39766)
   at tx (polaris-Dt80DnEy.js:32:39694)
   at Qs (polaris-Dt80DnEy.js:32:39547)
   at Md (polaris-Dt80DnEy.js:32:35914) Object
   - nhánh `fix/subproducts-crash` · commit `64764171f` · base `origin/master` (d3cfffd6e)
   - worktree `~/projects/subscriptions-wt-subproducts` (chưa gỡ) · đã push · MR !2444 (reviewer dantt2, target master, remove-source-branch)
   - **Root cause**: doc `subscriptionProducts/zN7S0jOs2r6HdfI6y7v4` (productId `10476069978423`, shop ranvoostyle) thiếu HẲN field `product` top-level — 7/8 doc khác đều có. `getSubscriptionProducts` khi query KHÔNG có `getPlans`/`getPlanCount` (đúng case trang list) trả **raw Firestore doc**, bỏ qua `prepareSubscriptionProductRepository` — nơi DUY NHẤT fallback `product: {}`. FE `planItems.some(x => x.product.status)` chạy trong render → TypeError → trắng trang
   - Doc lỗi tạo lúc `2026-08-06T03:51:56Z`, createdAt/updatedAt cách 0.5s (khớp pattern 2 write của `createSubscriptionProduct`); thiếu ngay từ WRITE #1 `addSubscriptionProduct` vì repo không validate/default `product`. **2 caller đã biết (Create.js, bulk-create) đều bọc `pick()`/`cleanEmptyField` nên worst case chỉ ra `{}` → còn path ghi thứ 3 chưa truy ra**
   - Sửa: `repositories/subscriptionProductsRepository.js` (normalize nhánh raw doc + guard `getSubscriptionProductInventory`, `getPopularSubscriptionProducts`), `services/subscription/subscriptionProductService.js` (guard `getSubscriptionProductsByIds` :186, `removeSubscriptionPlans` :592), `pages/SubscriptionProducts/SubscriptionProducts.js` (optional chain :172 + destructure default :478)
   - Test mới: `__tests__/repositories/subscriptionProductsRepository.test.js`, `__tests__/services/subscription/subscriptionProductService.test.js` — verifier tự revert source rồi chạy lại: 4/7 fail đúng TypeError của bug, khôi phục thì 7/7 pass (test không suông)
   - Verify (verifier độc lập, vòng 2 sau 1 vòng FAIL): `yarn check` exit 0 · functions jest 181 suites/1846 tests exit 0 · assets jest 8 pass exit 0
   - Vòng 1 FAIL vì coder quét theo "trang admin này gọi gì" thay vì "chỗ nào đọc cùng nguồn data" → sót `subscriptionProductService.js:186` (live: Add product / Change frequency, cả admin lẫn customer portal)
   - **Gotcha môi trường**: worktree mới KHÔNG có `.env.local` (gitignored) → `@avada/core` `Shopify.Context.initialize` đọc undefined → 2 suite `orderService`/`conditionEvaluation` chết lúc import. Phải `set -a && source .env.local && set +a` trước `npx jest`
   - **Gotcha rtk**: filter jest của rtk chỉ đếm test CHẠY được, che mất suite chết lúc load — báo `PASS (1809) FAIL (0)` trong khi thật ra `2 failed, 179 passed`. Nghi ngờ thì xem exit code / raw log
   - Còn sót (đã biết, cố ý không sửa): `devZoneController.js:1005` (dev-only, `.select()` không loại doc thiếu field nên vẫn crash được), `getConfig.js:293` (scripttag, riêng shop GINGER_MILK, chưa truy được cùng root cause)
   - Ngoài scope nhưng cùng chữ ký lỗi: `helpers/subscription/presentPopularProductList.js:11,14` + `scripttag ProductList.js:127` — data từ collection `subscriptionPlans`, không phải `subscriptionProducts`

## 2026-08-07

5. [✅ 2026-08-07] Check giúp tôi issue: https://avadaio.slack.com/archives/C07URV6QMJ8/p1786008064120649
   - Ticket JSUB-260806-LpVLDX · Jira SB-15333 · shop `e68d1a-d2.myshopify.com` (installedAt 2026-06-12)
   - Triệu chứng: bấm **"Select all products"** ở trang Plans (Create/Edit) → reload mất hết; chọn tay vài SP thì còn
   - **Không phải trang Subscription Products.** Đúng chỗ: `pages/Plans/Create/Create.js` + `Edit.js` → `components/molecules/SubscriptionPlansForm/ProductCard/ProductCard.js` → `hooks/modal/useSelectProducts.js:192` (`handleSelectAll` chỉ set cờ `isAllSelected`, KHÔNG liệt kê ID). Cờ đi qua **query string** `?isAllSelected=true`
   - **Root cause (code-evidenced, chưa confirm prod log)**: chuỗi nuốt lỗi khiến app **ghi đè selection bằng mảng rỗng**:
     1. `services/subscription/subscriptionPlanService.js:156` `getSelectedItems` → `isAllSelected` → `getAllShopProducts(shop)`
     2. `services/bigQuery/productBQService.js:19` query BQ shard theo THÁNG CÀI (`determineTableByMonth(shop.installedAt, 'shopifyProducts_changelog')`). Shard rỗng/throw → fallback Shopify
     3. `services/graphql/productService.js:198-200` GraphQL `errors` → `break` im lặng; `:219-222` catch → **`return []`**. Không throw, không log ra merchant
     4. → `selectedItems = []`. `isEmptySelectedItems` (`:229`, `:372`) CHỈ dùng để skip background activity, **không chặn ghi**
     5. `subscriptionPlanService.js:234-243` (create) và `:490-508` (update) ghi thẳng `selectedItems: []` + `selectedProducts: []`. `cleanEmptyField(..., [undefined])` chỉ lọc undefined, KHÔNG lọc `[]` → **plan đang có SP bị wipe sạch khi update**
     6. Read path sạch (`subscriptionPlansRepository.js:136` chỉ filter shopId) → reload trả đúng cái rỗng đã ghi
   - **Bug #2 (độc lập, đã verify bằng đọc code)**: FE không bao giờ hiện lỗi. Backend trả `{success:false, message}` (`subscriptionPlanController.js` 10/10 nhánh lỗi) nhưng `hooks/api/useCreateApi.js:38` và `useEditApi.js:47` check `resp.error` → luôn undefined. Cộng thêm `Create.js:226-230` truyền `hideToast:true` → **im tuyệt đối** dù save fail kiểu gì
   - Cap liên quan: `MAX_SELECT_ALL_PRODUCTS = 3000` (`productBQService.js:17`) — vượt thì cắt âm thầm, không cảnh báo merchant
   - **Chưa xác nhận được** bước nào (BQ shard hay Shopify fallback) fail thật cho shop này: `gcloud logging read` đòi `gcloud auth login` (interactive). Cần chạy để chốt
   - **Chưa sửa code** — fix chạm write path + shared hooks (`useCreateApi`/`useEditApi` dùng toàn app) → CLAUDE.md "Ask First", chờ user duyệt hướng

6. [✅ 2026-08-07] Check giúp tôi getUserShops lịch sử xem tại sao mà giờ ko có biến widgets nữa nhỉ ?
   - Câu hỏi là điều tra lịch sử, nhưng sau đó user chốt **thêm lại** (xem phần "Đã restore" cuối task)
   - **Bị bỏ ở commit `03322bf58` "Test getCrmWidgets"** (DamHV, 2026-07-20, đã trên `master`). Đây là commit cuối cùng chạm `shopController.js`
   - Bối cảnh: trước đó 1 commit cùng ngày — `f7e3c557f` "[deploy-functions] perf: split /shops so first paint stops waiting on Shopify" — tách 10 Shopify Admin API call ra `/shops/integrations`. `03322bf58` là bước dọn tiếp theo của cùng đợt perf đó
   - **Lý do (ghi nguyên văn trong docblock `getUserShops` hiện tại, dòng 47)**: `getCrmWidgets` là HTTP call sang public.avada.io tốn **0.6–1.4s** nằm trong `Promise.all` chặn first paint. Và nó **lãng phí hoàn toàn**: kết quả nhét vào `shop.widgets` mà **không chỗ nào đọc**, trong khi `@avada/app-widget-hook` tự fetch lại đúng list đó từ browser
   - Chuỗi đã xoá: BE `shopController.js` bỏ import + bỏ `getCrmWidgets(shopId)` khỏi `Promise.all` (4 read → 3) + bỏ `widgetData` khỏi `ctx.body`; FE `storeReducer.js` bỏ destructure `widgetData`, `shopService.js` bỏ `widgets: widgetData.widgets` khỏi `collectActiveShopData`, `standalone.js` bỏ tương ứng
   - **`getCrmWidgets` vẫn còn sống** ở `services/widgetService.js:10` — chỉ là không còn caller nào. Dead code, có thể dọn nếu muốn
   - Verify: `grep -rn "widgets" packages/assets/src` → 0 match (ngoài WidgetEditor/WidgetSettings không liên quan); widget UI giờ chỉ đi qua `WidgetInlineBannerV2`/`WidgetWhatNews` từ `@avada/app-widget-hook` (Home, Orders, Subscribers, SubscriptionProducts, Subscriptions)
   - **Đã restore theo yêu cầu**: nhánh `feat/restore-shop-widgets` · commit `9e7b7a084` · base `origin/master` · đã push (MR chưa tạo)
     - User chọn trả về `/shops` như cũ (thay vì đặt ở `/shops/integrations` cho non-blocking) → chấp nhận cộng 0.6–1.4s vào first paint để `shop.widgets` có sẵn ngay frame đầu, khỏi xử lý trạng thái "chưa biết"
     - Revert đúng phần widgets của `03322bf58`, **giữ nguyên** refactor `fetchIntegrations`/`mark` cùng commit đó và phần split `/shops/integrations` của `f7e3c557f`
     - Khác bản gốc 1 điểm: `widgets: widgetData?.widgets` (optional chaining) — `collectActiveShopData` giờ còn được gọi từ path cache, bản cũ `widgetData.widgets` sẽ ném TypeError
     - Verify: `yarn check` exit 0 · assets jest 6 suites/86 tests exit 0 · eslint 4 file exit 0 · functions jest 8 suite/5 test fail **nhưng pre-existing** — stash rồi chạy lại đúng 8 suite đó trên `origin/master` sạch ra fail y hệt
     - **Đánh đổi đã biết, ghi trong commit message**: timeout `helpers/api` là 20s → public.avada.io treo thì first frame treo 20s (nhưng `getCrmWidgets` có try/catch trả `{widgets: []}` nên outage chỉ degrade, không 500). Và public.avada.io giờ bị gọi **2 lần/load**: 1 ở server đây + 1 từ `@avada/app-widget-hook` trong browser
