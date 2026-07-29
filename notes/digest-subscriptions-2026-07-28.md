---
type: note
title: Digest Joy Subscription — 2026-07-28
summary: CHỈ phần mới — build Customer Portal Preview (mixin tại 1 seam, deep-link qua login) với họ lỗi "preview trả shape khác backend thật", bug đổi frequency chỉ sync 1 line, backfill shipping suy carrier từ lịch sử khách, và chuỗi BigQuery shard thiếu cột làm crash portal.
tags: [shopify, subscription, avada, debug, bigquery]
created: 2026-07-28
source: project "subscriptions" — session history
---

# Digest Joy Subscription — 2026-07-28

> Chỉ ghi phần **mới** so với [[digest-subscriptions-2026-07-27]],
> [[shipped-subscriptions-2026-07-28]], [[digest-subscriptions-2026-07-24]].

## Feedback

- **Đừng chấp nhận "ngoài phạm vi" khi lý do là độ khó, không phải phạm vi.** Agent
  từ chối dựng data V2 vì "shape phức tạp"; user bác lại ("chỉ sample thôi mà sao lại
  ko hiển thị?") và đúng. Sau đó user còn cắt tiếp: *"chỉ sample thì k cần theo logic
  gì cả, cứ hiển thị các sản phẩm thôi"* → phải tách rõ **logic backend cần chuẩn**
  vs **dữ liệu mẫu chỉ cần đúng shape**.
- **Cấm subagent tự dispatch subagent.** Một fork được giao nhiệm vụ *chỉ nghiên cứu*
  đã tự ý implement và commit. Đã thêm dòng "do the work yourself" vào brief.
- **Không push thẳng master** (đã có ở [[feedback-git-branch-discipline]]) — tái khẳng
  định giữa phiên; và **merged ≠ deployed**: phải thấy tag/CI mới coi là đã lên.
- Giọng Slack: tiếp tục bị bắt lỗi "sao như AI nhắn vậy?" — bỏ heading/bullet/emoji,
  viết liền mạch, viết tắt (e, r, k, nhá, ạ). → [[subscription-work-style]].

## Decisions

- **Customer Portal Preview = mixin tại đúng MỘT seam.** Mọi hook
  (`useFetchApi/useCreateApi/useEditApi/useDeleteApi`) đều đi qua `fetchPublicApi()`
  → chặn ở đó, không đụng từng hook. Why: không ảnh hưởng performance/logic đường
  thật; tắt cờ thì là pass-through thuần (`if (!isEnabled || !url) return url;`).
  Tradeoff: **không** dùng cơ chế `HelperManager`/`BaseManager` sẵn có vì nó nặng và
  làm rối cho một việc chỉ cần một điểm chặn.
- **Vào preview bằng deep-link + cờ query, không tự dựng auth.** Sau khi tra docs:
  New Customer Accounts **không có login link** (Multipass không áp dụng). Nhưng
  deep-link `https://shopify.com/<id>/account/pages/<appExtensionUuid>?joy_preview=1`
  **giữ nguyên đích đến qua login** (đã verify thật bằng OTP) và app đã có sẵn 3 tầng
  fallback lấy `appExtensionUuid` (Admin GraphQL `CustomerAccountAppExtensionPage`).
  Lưu ý: URL dùng **UUID**, không phải handle; `/account/pages/...` trên **shop
  domain** trả 404 (store dùng new customer accounts host ở `shopify.com/<id>/...`).
- **Một đường tính giá duy nhất cho preview:** dùng lại `calculatePricing` thay vì
  viết công thức riêng. Why: sai công thức thì merchant thấy giá sai mà test không
  bắt. Kèm test bắt buộc chứng minh discount thật sự chạy qua đường đó.
- **Update frequency phải loop từng line.** Shopify **không có** mutation update
  nhiều line cùng lúc (`subscriptionDraftLineUpdate` bắt buộc `lineId: ID!`) → chấp
  nhận vòng lặp.

## Bugs (root cause)

- **Đổi frequency chỉ đồng bộ 1 line** (JSUB-260727-Yba5fc) — line còn lại mất
  discount và bị charge giá gốc. Root cause: `subscriptionDeliveryUpdate` chỉ gọi
  `changeSubscriptionContractLine` cho **một** `lineId`, trong khi hàm đó ghi cả
  `sellingPlanId` + `pricingPolicy{basePrice, cycleDiscounts}` + `currentPrice`.
  Tức là **đổi frequency CÓ ghi lại giá** (chủ ý thiết kế) — nên bỏ sót line = line
  đó giữ plan/giá cũ. Defect phụ: `getCycleDiscountTiersVariables` khi
  `discountConfig.enabled` mà không resolve được tier thì **âm thầm ghi giá gốc** →
  đã thêm guard throw (phân biệt với "plan không cấu hình discount").
- **Họ lỗi lặp lại 6 lần: preview trả shape khác backend thật.** Mọi bug nghiêm trọng
  của phiên đều cùng một họ — preview trả contract thô trong khi thật trả
  contract + upcoming; `/analytics` trả khác; `contract.lines` (mảng song song với
  `products`) bị thiếu → `ProductCards.js` crash; `originOrder.createdAt` thiếu →
  `Invalid Date`; `haveCompareAtPrice` bị hardcode `false` → mất giá gạch. Cách chữa
  hiệu quả nhất: **chạy router thật, in response thật, so với read-site** — chứ không
  phải đọc code rồi suy ra field nào thiếu (cách đó vá được 2 chỗ vẫn sót).
- **Route chết vì path dựng động.** Bảng route có `GET /collections` nhưng caller gửi
  `/collections/order` và `/collections/subscription` → rơi vào nhánh unhandled. Quét
  toàn bộ tìm ra **23 call site động**, 5 lỗ GET, 8 route mutation lệch method/path.
  Bài học: sweep ban đầu chỉ quét `extensions/customer-account-ui/src/` là **sai phạm
  vi** — extension import cả code ngoài thư mục đó (bẫy V1/V2 hai bản portal).
- **160 unit test xanh nhưng chưa ai mở portal lên nhìn.** Task chạy thật (Task 11)
  lộ **6 lỗi** không test nào bắt được. Tương tự: test "handler throws" **pass giả**
  suốt từ Task 5 — chỉ phát hiện khi cố tình gỡ `try/catch` và thấy test vẫn xanh.
- **BigQuery shard thiếu cột → crash trang Order Detail** (SB-14774). Chuỗi nhân quả:
  bảng orders là **monthly shard** `orders_<mmm>_<yy>`, chọn theo `shop.installedAt`
  (`determineTableByMonth`); script tạo shard hằng tháng chưa cập nhật sau migration
  nên shard từ `JUN_26` chỉ có 23 cột thay vì 25 (thiếu `cycle_start_at`,
  `cycle_end_at`) → procedure `orders.upcoming_orders` ném `Unrecognized name` → API
  trả lỗi → `orderDetailData` rỗng → `deliveryMethod.firstName` **không optional
  chaining** → crash trắng trang. Hai lớp lỗi độc lập: dữ liệu hạ tầng + thiếu guard UI.
- **Cờ flag phải qua 3 tầng whitelist** (SB-14773): `forceOneTimeAddProduct` không
  xuống được classic portal vì `app-embed.liquid` destructure metafield bằng
  **whitelist tường minh** và dùng field ở **2 chỗ** (destructure + gán vào
  `window.AVADA_SUBSCRIPTION`). Cùng họ với "hàm `ensure` chỉ create-if-missing" ở
  [[digest-subscriptions-2026-07-27]]: thêm field thì phải quét mọi chỗ liệt kê tên field.
- **`git revert` xoá file âm thầm.** Revert MR Grow card để lại status `D` cho nhiều
  path → phải khôi phục toàn bộ path revert đã đụng rồi verify không còn import gãy,
  và `git merge-tree` mô phỏng merge trước khi push.

## Techniques

- **Dry-run backfill cứu một bàn thua.** Dry-run trên prod (read-only) cho thấy
  16/19 contract "no origin name" — ngược hẳn giả định — và lộ ra một **regression
  đang chạy production** (code lấy bừa `nodes[0]` trong nhiều shipping line →
  ghi đè tên đúng thành sai). Fix: helper `resolveShippingOptionUpdate` nhận **tất
  cả** shipping line và quyết định ghi hay không, thay vì `nodes[0]`.
- **Suy carrier từ lịch sử checkout của chính khách hàng.** Với contract import không
  có origin order, dò các order checkout trước đó của cùng khách → suy ra được 16/16,
  trong đó 10 contract Zásilkovna đủ tự tin để ghi (whitelist theo carrier, chạy
  `--limit=1` verify trước rồi mới chạy hết).
- **Contract import: `deliveryPrice` và tên shipping lấy thẳng từ cột trong file
  import của merchant** — flow không có bug logic, validation để lọt giá 0 và tên
  rỗng. Free shipping của app đi bằng **discount**
  (`subscriptionDraftFreeShippingDiscountAdd`), không đụng `deliveryPrice` → hai
  đường độc lập, đừng suy giá 0 là do free-shipping policy.
- **Chạy script prod local:** alias `@functions` chỉ resolve lúc build → viết shim
  runtime trong scratchpad (không đụng repo) hoặc build sang `lib/`; key giải mã token
  đọc từ `.env.local` (`ACCESS_TOKEN_KEY_PROD`) chứ **không hardcode vào source** —
  `.env.local` mặc định chứa key **dev**, dùng nhầm sẽ giải mã ra rác.
- **`deletion` accessibility role** của Shopify UI extensions = render ra `<del>`,
  screen reader đọc "deleted" → đúng ca cho **giá gốc bị gạch**. Đã verify bằng DOM
  (3 phần tử `<del>`). Layout: dùng `GridItem` theo tiền lệ đang chạy trong chính
  extension, đừng giả định flexbox có sẵn.
- **agent-browser có giới hạn thật:** không click được link là web component (không
  phải `<a>`), không đọc được nội dung trong shadow DOM/popover → phải vào thẳng URL
  hoặc nhờ người test thao tác. Console bị **bugsnag của Shopify nuốt** → dùng
  network log làm bằng chứng thay vì đoán từ console.
- **Đo an toàn preview bằng network log:** 0 request lọt ra backend
  (`localhost:3001`, `/clientApi`), chỉ còn call Storefront API — đúng thiết kế.
- **Skill `deploy-extensions`**: patch `scripttag` URL (`avada-subscription`) +
  `NEW_CP_BASE_URL` (`newCustomerPortal`) theo env (dev `localhost:3001`, staging1-4
  `ag-subscriptions-staging{,-2,-3,-4}.firebaseapp.com`), deploy rồi **revert sạch 2
  file**; không cho deploy production.
- **Khi session gồm nhiều mạch việc không liên quan → start new chat, đừng compact**
  (và tự soạn prompt bàn giao có: đường dẫn plan doc, tên nhánh, lệnh kiểm nhánh,
  phạm vi được/không được làm).

## Liên quan

[[subscriptions]] · [[subscriptions-debug-runbook]] · [[shipped-subscriptions-2026-07-29]] (cái gì đã landed từ phiên này) ·
[[digest-subscriptions-2026-07-27]] ·
[[shipped-subscriptions-2026-07-28]] · [[digest-subscriptions-2026-07-24]] ·
[[subscription-work-style]] · [[feedback-git-branch-discipline]] · [[shopify-app-dev]]
