---
type: note
title: Digest subscriptions 2026-08-15 — ba lớp mù giữ nguyên dòng giá hỏng ở kookut, nguồn giá đúng là PriceList FIXED
summary: Dữ liệu giá hỏng ở kookut sống sót vì cả ba lớp đều nhìn chỗ khác (ghi sai `basePrice`, sync so `variant.price`, detector dung sai 15% bỏ lọt lệch 12.1%); nguồn giá đáng tin là `PriceList.prices(originType: FIXED)` chứ không phải `contextualPricing`; kèm ticket import Appstle mô tả sai blocker và ca decline thẻ do account updater đổi 4 số cuối.
tags: [avada, subscription, shopify, debug, patterns]
created: 2026-08-15
updated: 2026-08-15
source: project "subscriptions" — session history 2026-08-14/15
---

# Digest subscriptions — 2026-08-15

Phần tiếp của ticket kookut (xem [[digest-subscriptions-2026-08-14]] cho vòng đầu) cộng
hai task lẻ từ CS. Chỉ ghi phần **chưa có** ở digest 08-14.

## Bugs

**Ba lớp đều mù nên một dòng giá hỏng sống sót.** Digest 08-14 mới chốt được lớp thứ nhất.
Đủ ba lớp mới giải thích được vì sao không ai phát hiện:

| Lớp | Lẽ ra phải bắt | Vì sao mù |
|---|---|---|
| Ghi | không ghi sai lúc thêm dòng | ghi `basePrice` sai lúc khách tự thêm variant qua Classic Portal (code đã vá `2dc2fb9fd`, **data thì chưa**) |
| Đồng bộ | chữa lại dòng hỏng | `contractBulkActionService.js:54-61` so `variant.price` — trường này đúng ở cả hai phía, nên `basePrice` hỏng không bao giờ bị đụng tới |
| Dò tìm | báo động | `scanLineIdMisalignment.js` lấy **median tỉ lệ của chính contract đó** làm chuẩn + `RATIO_TOLERANCE = 0.15`; dòng hỏng lệch 12.1% → lọt, báo `0 damaged` cho cả 84 contract ACTIVE của kookut |

Số thật: Tuna 70g `1.95 → 1.70`, Tuna 24x70g `45.95 → 40.00`; order #10831 (Paid) thu thừa
**~7.06 EUR**. Khái quát hoá ở [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]].

**Nguồn giá đáng tin là `PriceList.prices(originType: FIXED)`.** kookut có 3 market
(Switzerland CHF · Europe EUR PriceList `20665794768` · France EUR `20665860304`);
`contextualPricing(context:{country})` trả số không đáng tin trên shop này. Đường khách thêm
dòng qua portal lấy giá từ chính `contextualPricing` (`productService.js:1049-1054`), mà
`country` lại fallback về `shop.shopCountry` = **CH** trong khi contract là EUR
(`subscriptionProductController.js:50`, `subscriptionProductsRepository.js:487`) — **đúng họ lỗi
đã sửa ở `bulkSwapProducts.js`** (commit `84425caae`, dùng `deliveryMethod?.countryCode ||
contract?.countryCode`). Sửa một chỗ, còn nguyên chỗ kia: đúng bài [[feedback-follow-conventions]].

> Điều này trả lời một phần câu hỏi treo ở [[shipped-subscriptions-2026-08-15]]: PriceList FIXED
> không phải giả định thay thế — số nó cho (1.70 / 40.00) khớp đúng con số merchant khẳng định
> trong ticket. ⚠️ *chưa xác minh*: CS/merchant vẫn chưa confirm chính thức (task #40 còn `[⏸️]`).

**`getSubscriptionContractsByIds` không lọc `shopId`** (`subscriptionContractRepository.js:1048-1064`,
`where(documentId(), 'in', batch)`), trong khi `processContractsBatch` ngay cùng luồng thì có —
nên đây là sót cục bộ chứ không phải quy ước của repo. Cùng họ [[firestore-multitenant]].

**Ticket import Appstle mô tả sai chỗ hỏng.** Ticket nói lỗi ở `province_code`, thực tế
`importSubscription.js:21` để nó là `yup.string()` optional (và SG không cần province). Blocker
thật là `:176` `delivery_price: yup.number().min(0).required()` — rỗng **0/99 dòng**.
`customer_id` thì resolve được 99/99 từ email qua Shopify customer search (phải lọc khớp email
chính xác vì search là fuzzy).

**Decline thẻ: chỉ có MỘT thẻ, không phải hai.** 4 số cuối hiển thị đổi `1932 → 7216 → 1932`
là do **account updater của card network** cập nhật ngầm trên cùng một payment token
(`customer.paymentMethods(showRevoked: true)` chứng minh: một token, `revokedAt: null`).
Thẻ hạn 07/2026, lần charge thành công cuối 12/06/2026, chu kỳ 2 tháng → charge 12/08/2026
rơi vào thẻ đã hết hạn. Và Shopify **không trả gì hơn `PAYMENT_METHOD_DECLINED`** cho attempt
fail — vì attempt fail *không tạo order*, muốn biết ngân hàng từ chối vì gì phải mở transaction
detail bên Shopify Admin hoặc gateway.

## Techniques

- **Grep literal cho âm tính giả.** Kết luận "route bulk edit price là route mồ côi" sai vì
  frontend hardcode chuỗi: `useBulkEditProductPrice.js:35` viết thẳng
  `'update-subscription-product-price'` thay vì dùng hằng số → grep tên hằng ra 0 kết quả.
  Grep theo **công dụng**, không theo tên biến mình đoán ([[digest-pdf-2026-07-31]]).
- **`rtk` giấu suite chết lúc load** → dùng `rtk proxy npx jest` để lấy output thô. Và chấm gate
  jest theo **số suite**, không theo dòng `Tests:` — repo có baseline bẩn sẵn 9 suite / 5 test
  fail trên master sạch, không đọc đúng trục thì lại rơi vào "gate đỏ là pre-existing"
  ([[bang-chung-phan-biet-duoc]]).
- **Command trong `packages/functions` cần `GOOGLE_CLOUD_PROJECT=avada-subscription-app`** —
  `shopRepository.js:16` tự `new Firestore()` nên không thừa hưởng project từ đâu cả; thiếu là
  chết ngay bước `[1/5]` với `Unable to detect a Project Id`.
- **Mutation GraphQL "thành công" mà không thành công.** `contractService.js:659-697` không throw
  khi response có `errors`/`userErrors`, còn vòng apply từng line
  (`applyContractLinePrices.js:248-263`) không kiểm giá trị trả về → line 2 hỏng vẫn commit draft
  với line 1 đã đổi. Công cụ ghi lên tiền thật phải kiểm `userErrors` từng bước, không chỉ bắt exception.

## Context

- Vòng `/loop 10m /looptasks` chạy **~62 iteration rỗng liên tiếp** ("No pending tasks") vì cả 4
  task còn lại (`#28`/`#32`/`#40`/`#44`) đều `[⏸️]` chờ người. Đây đúng ca mà
  [[feedback-dung-loop-khi-rong]] đã mô tả — luật có rồi nhưng cron `07b25951` vẫn không tự huỷ;
  lỗ hổng nằm ở chỗ luật là lời dặn chứ không phải cơ chế.
- Lệnh `--apply` sửa giá contract `151147970941` **bị user chặn** — prod vẫn chưa bị ghi gì.
- Hai nhánh còn local chưa push (`feat/JSUB-260814-enrich-import` `0c88458`,
  `fix/JSUB-260811-price-source` `88f8bb4`) vì `git fetch`/`push` tới `git.avada.net` trả
  `HTTP Basic: Access denied` khi không có TTY cho keychain.
- ⚠️ *chưa xác minh* — câu hỏi gốc vẫn treo: **vì sao thêm một variant KHÁC lại ghi đè dòng
  Tuna 70g đang đúng**, trong khi bản vá index-swap đã merge. Chưa có bằng chứng, chỉ có giả thuyết.
- `#32` còn treo vì là quyết định thương mại, không phải kỹ thuật: sửa `recurringOption: lowest`
  để tính lại phí ship sẽ làm **mọi shop đang dùng `lowest`** bắt đầu bị thu tiền ship.

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-08-14]] · [[shipped-subscriptions-2026-08-15]] ·
[[feedback-debug-phai-query-data-that]] · [[subscriptions-debug-runbook]] ·
[[2026-08-04-looptasks-verifier-doc-lap]]
