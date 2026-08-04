# Joy Subscription — BRIEF

<!--
  `[ ]` chưa làm · `[⏳ HH:MM]` đang chạy · `[✅ YYYY-MM-DD]` xong
  Task xong quá 3 ngày → /looptasks tự dọn sang BRIEF-done.md
  Chạy (cwd = repo subscriptions, không phải brain):
  /loop 5m /looptasks ~/projects/my-brain/10-projects/subscriptions/BRIEF.md
-->

## Tasks

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
