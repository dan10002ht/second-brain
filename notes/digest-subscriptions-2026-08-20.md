---
type: note
title: Joy Subscription — đóng đợt kookut + portal preview (2026-08-20)
summary: Phí ship 0 của kookut là rate trùng trong shipping profile cộng `getLowestShippingRate` đọc option Shopify đang chọn chứ không phải rate thấp nhất; cap retry đếm theo order-doc nên 13 lần/kỳ; helper GraphQL nuốt `errors` rồi vẫn commit draft; và `resourcePublicationsV2` là kênh bán hàng chứ không phải catalog — đọc nhầm nó làm đảo kết luận hai lần.
tags: [avada, subscription, shopify, shipping, debug]
created: 2026-08-20
updated: 2026-08-20
source: project "subscriptions" — session history 2026-08-17→2026-08-20 (sessions ae2ad0b1, 5f9e876d, b334dbe9)
---

# Joy Subscription — đóng đợt kookut + portal preview

CHỈ phần chưa có trong [[digest-subscriptions-2026-08-15]] / [[digest-subscriptions-2026-08-17]] /
[[digest-subscriptions-2026-08-19]]. Kết quả code đã ghi ở [[shipped-subscriptions-2026-08-20]].

## Bugs

**Phí ship 0 — hai tầng, không phải một.** Tầng dữ liệu: shipping profile
*"Shipping rates …"* của kookut **có hai rate trùng**, một cái 0 — profile vẫn còn dù
TS/CS tưởng đã remove. Tầng code: `getLowestShippingRate` đọc `selectedDeliveryOption`
— **option Shopify đang chọn sẵn**, không phải rate thấp nhất — nên nó lấy đúng cái 0.
Contract tạo 19/08 vẫn `ship = 0.0` ⇒ còn sống, không phải chuyện lịch sử.
Nhưng khi probe cart theo từng nhóm thì `group[1] SUBSCRIPTION` lại có giá thật, và
Firestore khớp Shopify ở phần lớn contract ⇒ **kết luận là không backfill**.
⚠️ chưa xác minh: rate trùng đó có phải merchant tự tạo hay TS setup nhầm rồi remove hụt.

**API shipping-options trả sai currency lẫn giá.**
`/apiSa/subscription-contract/shipping-options` trả 4 option `0.0 CHF` cho một contract
EUR. Nó đi đường `draftOrderAvailableDeliveryOptions` (draft order), **khác hẳn**
`getLowestShippingRate` (cart), và input dựng ở `contractService.js:635` chỉ có
`lineItems` — thiếu địa chỉ/currency nên Shopify chào rate theo mặc định store.
Hai đường tính phí ship, hai kết quả, và không đường nào biết đường kia.

**`shopifySnapshot` mirror thiếu `deliveryPrice`.** Snapshot chỉ chép 4 field
(`customer`, `customerPaymentMethod`, `deliveryMethod`, `shopifySyncedAt`) trong khi
`deliveryPrice` **đã có sẵn trong query** (`contractService.js:478`) — chỉ là không được
đưa vào. Hệ quả: app hiện phí ship cũ, 27 contract lệch (nhiều hơn con số 11 ban đầu vì
lần sau tính cả PAUSED). Fix + backfill 27, verify bằng hai công cụ độc lập ra 0 lệch.
Cùng họ với [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]]: mirror đúng ở field mình
nhìn, sai ở field mình quên.

**Cap retry đếm sai đơn vị.** `maximumRetryAttempts` chỉ được kiểm ở
`shopifyService.js:1727` và đếm **trên order-doc của app**, không trên chu kỳ thanh toán
Shopify ⇒ một kỳ có thể fail 13 lần. Fix: đọc `billingAttempts` của cycle hiện tại từ
Shopify (`getBillingCycleExtraData`, decode segment 0 của `idempotencyKey`) và **thêm**
điều kiện chứ không thay điều kiện cũ — chỉ có thể chặt hơn, không thể lỏng hơn.
Chốt với user: nhiều order-doc cùng trỏ một Shopify cycle là bình thường, không sửa
tầng tạo order-doc; app `cycleIndex` ≠ Shopify `cycleIndex` là thiết kế cố ý.

**Job báo hoàn thành trong khi contract chưa xử lý.** `updateSingleContractPrice:389` và
`bulkUpdateSubscriptionProductPrice:221` đều `processedContracts.add()` **vô điều kiện**,
kể cả nhánh lỗi. Không đổi được terminal status (comment thiết kế `:492-500`: Pub/Sub
redelivery guard chỉ dừng ở `DONE`/`FAILED`, thêm status mới là rerun cả chunk), nên fix
đúng chỗ là không tính contract lỗi là đã xử lý.

**Helper nuốt lỗi rồi vẫn commit draft.** `contractService.js:683-697` đọc
`{data, errors}` nhưng không throw ⇒ line 2 fail mà draft vẫn commit với line 1 đã đổi.
Trước khi sửa phải đọc **từng** call site: `for` loop `:419-433` không có try/catch từng
contract nên throw sẽ giết cả batch; `bulkUpdateDiscount:142-207` thì có. Cách sửa:
throw ở biên helper, batch bắt từng contract, `ensureLineOwnsPlan` giữ nguyên hành vi.

**`subscriptionBillingCycleEditsDelete` xoá cả schedule edit — skip chính là một
schedule edit.** Docs Shopify: *"Deletes the schedule and contract edits on the current
and all future billing cycles"*. Nghĩa là sync giá có thể **un-skip** cycle khách đã skip.
Vòng gần kín chứ chưa kín: gate charge đọc `skipped` từ **Firestore** ở 6 chỗ
(`orderRepository` `:276/:352/:842/:1260/:1323/:1449`), job nền `backgroundHandler.js:606`
lọc `!order.skipped`, còn app chỉ đăng ký `subscription_billing_cycle_edits/update`
trong 5 topic cycle (không có `edits/delete`, `cycles/skip`, `cycles/unskip`).
Chốt phương án C — xoá cycle edit **trước** khi mở draft — với bằng chứng: **24/24
call site** trong repo đều làm đúng thứ tự đó, không chỗ nào xoá lúc draft đang mở.

**Customer Portal preview — 4 lỗi runtime ở màn detail** đều từ shape preview lệch
backend thật: preview trả `upcomingFulfillmentOrder: null`, và merge customer làm rơi
`id` nên `where()` nhận `undefined`. Kèm một lỗ riêng: `customerAccountService.js:24-25`
tìm page bằng `p.appExtensionUuid && p.title?.toLowerCase()` — `appExtensionUuid` **không
kèm thông tin app sở hữu** nên nó khớp trúng page của app khác.

## Techniques

- **`resourcePublicationsV2` là kênh bán hàng (Online Store, Facebook…), KHÔNG phải
  catalog publication.** Dùng nó để bác giả thuyết "sản phẩm chưa publish vào catalog EUR"
  làm tôi đảo kết luận hai lần và gửi thông tin sai cho CS. Kiểm publish vào catalog
  phải hỏi đúng catalog/PriceList của market.
- **Audit code phải đọc `git show origin/master:<path>`.** Worktree đang mở lệch
  **198 commit** sau master; 11/14 file trích dẫn giống master nhưng **3 file lệch đúng là
  3 file load-bearing nhất** — trong đó fix index-misalignment đã có trên master mà bản tôi
  đọc thì chưa. Đo trước bằng `git rev-list --left-right --count origin/master...HEAD`.
  Xác nhận lại [[feedback-audit-code-doc-tu-nhanh-prod]].
- **Script trong `commands/misc/` cần `GOOGLE_CLOUD_PROJECT` riêng** —
  `productBundleRepository.js:2` tự tạo `new Firestore()` nên nó **không** ăn theo
  `serviceAccount.*.json` đã load; thiếu thì chết ở "Unable to detect a Project Id".
- **Bẫy shell trên macOS**: `git reset --mixed` giữ working tree **cũ** (143 path dirty,
  đang "hoàn tác" 13 commit của master); `xargs -a` và `timeout` **không tồn tại** —
  lệnh khôi phục im lặng không chạy mà vẫn trông như đã chạy.
- **Slack token thiếu `files:read`** → không tải được file đính kèm (trả HTML login).
  Đường vòng: Google Sheet để public lấy thẳng bằng `export?format=csv`.
- **Verify deploy bằng pipeline, không bằng thời gian merge.** MR !2486 merge
  `18/08 09:24Z` nhưng pipeline mới nhất trên master là 02:44 cùng ngày ⇒ tôi kết luận
  "chưa deploy", rồi phải rút lại sau khi kiểm riêng commit merge.
- `yarn trans` đọc key từ `.env.development`, muốn dùng key khác phải export vào shell env
  (đi qua env của đúng lệnh đó, không in giá trị ra — [[feedback-khong-in-secret-ra-chat]]);
  "208 words" là tổng số **từ** của chuỗi đã đổi, không phải backlog của người khác.

## Context

- Toàn bộ kookut gom về **một nhánh `fix/kookut-issues`** (worktree
  `~/projects/subscriptions-kookut`, base `origin/master`), 11 commit → **MR !2486**,
  đã merge và **đã deploy**. Fix chỉ chặn tái diễn; dữ liệu cũ phải chữa riêng.
- Contract `151147970941` đã sửa 2 dòng Tuna về `1.70 / 40.00` bằng
  `applyContractLinePrices.js` (nhận giá **tường minh** `--line=<variantId>:<price>`,
  dry-run mặc định, từ chối tăng giá nếu không `--allow-increase`, giữ nguyên tỉ lệ
  discount từng dòng, đọc lại từ Shopify sau khi ghi). 21 contract còn lại chờ thêm quyền.
- Lượt `--apply` đầu tiên bị user **từ chối** — tôi dừng, ghi trạng thái vào BRIEF, không
  chạy lại cho tới khi được nói. Vòng loop sau đó rỗng ~150 lượt: xem
  [[feedback-dung-loop-khi-rong]].
- App **không** đăng ký `subscription_billing_cycle_edits/delete`; nếu sau này cần biết
  Shopify đã un-skip, đó là chỗ phải thêm.
- Changelog Shopify 19/08: app intent trên `admin.app.intent.link` chuyển từ overlay modal
  sang **full page navigation** — merchant rời khỏi chỗ đang đứng khi Sidekick bắn intent.
  Check page extension đã cài được bằng `customerAccountPages` (Admin GraphQL); block thì
  không có API tương đương.
