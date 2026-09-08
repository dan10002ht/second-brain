---
type: note
title: Shipped Joy Subscription — commit landed 2026-09-07
summary: Master nhận 3 tag trong một ngày (`v2.35.9` modal chọn sản phẩm cuộn được trong iframe, `v2.35.10` SB-16532 bỏ cận trên khi đổi tất cả cycle, `v2.35.11` `[deploy-extensions]` SB-16530 Edit subscription hết blank page) cộng 2 MR theme block riêng cho khách và 2 MR mockup/PRD; trên nhánh: cap 1000 email/shop/ngày cho SMTP tự cấu hình (+1.506 dòng, có `firestore.indexes.json`), command ops gỡ product variants khỏi delivery profile SB-16531, store credit hiện trên 4 màn order, discount tier không bắt đầu từ order 1 khi bật trial, và mở dev zone trên staging/local. Không revert feature.
tags: [avada, subscription, shopify, shipping, billing, firestore, extensions]
created: 2026-09-08
updated: 2026-09-08
source: repo `subscriptions` — git log 2026-09-06/09-07 (hash đã xác minh trong log)
---

Ngày 09-07 master nhận **3 tag** (`v2.35.9` → `v2.35.11`) và 4 MR không tag.
Khối lượng nặng nhất lại nằm trên nhánh: một feature hạ tầng email và một command ops
đụng thẳng vào chủ đề phí ship đang treo trong brain.
Nối tiếp [[shipped-subscriptions-2026-09-05]].

## Shipped

### Master

| Tag / hash | Việc |
|---|---|
| `b3c5fe883` **v2.35.11** `[deploy-extensions]` (!2536) ← `b91b07a11` | **Edit subscription không còn blank page (SB-16530).** Root cause là state, không phải data: `index.jsx` giữ `viewType` và `currentId` thành 2 state riêng, mọi call site gọi `setViewType` rồi `setCurrentId` liên tiếp. Press event của customer-account UI extension đi qua **remote reconciler** nên 2 `setState` không được batch → sinh một render trung gian mang type mới nhưng id của trang trước ⇒ trang subscription mount bằng id của order và gọi `/subscription/<orderId>`. Gộp thành **một state commit duy nhất**. Kèm 3 lớp guard: `orderController.getOrder` trả về `subscriptionContract` (ProductListCard destructure thẳng field này), `getSubscription` guard `!contract` thay vì fall-through vào `contract.customerId`, `SubscriptionDetail` guard theo `fetchedContract` (vì `contractData` luôn truthy do `defaultData = {}`) và hiện banner lỗi thay vì render rỗng. |
| `cc487201b` **v2.35.10** (!2532) ← `29954c9e9`, `5efec381f`, `e37375907`, `704b381d4`, `a9a0c46ab`, `cf9d8c4e3` | **Bulk next order date: bỏ cận trên khi áp cho tất cả cycle (SB-16532)** — test đỏ trước (`29954c9e9`) rồi xanh sau (`5efec381f`, đúng 2 dòng). Đi kèm trong cùng cụm là bug nặng hơn nhiều ở `e37375907`: `getNextOrder`/`updateSubscriptionByContractId` nhận **Firestore doc id** trong khi cả hai đều `parseInt` rồi tra cứu theo `subscriptionContractId` dạng số ⇒ không match gì, nên `nextBillingOrderDate`/`rescheduleFromIndex`/`rescheduleFromDate` **chưa bao giờ được ghi** sau bulk reschedule (126/130 contract của shop `bnagdp-cx` đang lệch). Contract bị validate loại ra vẫn được đếm là processed nên activity báo DONE — nay gom vào `skippedContractIds`, giữ qua các lần resume sau timeout, banner đổi sang warning kèm số lượng. |
| `2f7f061d4` **v2.35.9** (!2533) ← `1ffabdfc1` | **Modal chọn sản phẩm cuộn được trong iframe, không kéo theo admin.** Thay Polaris `Scrollable` (height cứng 500px) bằng div có ref của `useEmbeddedScroll` để wheel event bị chặn lại trong list thay vì bubble ra iframe và cuộn Shopify admin. `useEmbeddedScroll` bỏ dep array để effect gắn lại listener khi element mount muộn (list chỉ tồn tại sau khi modal mở). |
| `8257860b7` (!2522) · `0e6bca8b9` (!2530) | **Hai theme block riêng cho khách:** subscription box block liquid cho `tielenergy.se`, và block clone giao diện Recharge cho `ranvoostyle`. Không có stat trong log (merge commit) — chưa biết phạm vi. |
| `f22293b71` (!2539) ← `d9990dc05` · `ecb2fcc74` (!2534) ← `2a5b878aa` | **Mockup-app + PRD của BA** (đường auto-merge tài liệu, xem [[2026-08-06-auto-merge-mr-tai-lieu-ba]]). `2a5b878aa` to bất thường: **138 file, +3.771** — mockup Wholefoods portal (2 trang HTML tĩnh + ~120 ảnh), `BrowsePlanModal`, và PRD **Auto swap** (+261 dòng) với màn `auto-swap-edit` viết lại gần trọn (892 dòng đổi). Tức Auto swap đang được spec lại — chưa có code app. |

### Trên nhánh

| Nhánh / hash | Việc |
|---|---|
| `feat-email-daily-cap` — `b5862a9de` | **Cap 1000 email/shop/ngày cho SMTP tự cấu hình + outbox bền.** 25 file, **+1.506**. Shop dùng custom SMTP trước đó gửi lặp vô hạn, và nút *Verify SMTP* báo xanh dù chưa gửi được. Trần 1000 chọn theo BigQuery: shop cao nhất **95,9 email/ngày trong 91/91 ngày**. Mọi đường gửi đi qua `sendWithDailyCap`; `counter-{shopId}` + payload claim trong **cùng một transaction**, đếm theo ngày UTC. Vượt cap thì **hoãn sang hôm sau (không drop)**, cron `deferredEmailPublisher` chạy mỗi phút nhặt tối đa 100 delivery đến hạn. Hết 5 attempt → terminal failed, **xoá ngay** recipient/HTML/SMTP settings/token, chỉ giữ metadata. *Verify SMTP* gọi thẳng `sendSmtpDelivery` nên lỗi thật (vd `535 Authentication failed`) đi nguyên văn về merchant. |
| `shipping-profile-clear-variants` — `16a10659e`, `5f03f8bcc` | **Command ops gỡ product variants khỏi delivery profile subscription (SB-16531).** +1.229 dòng, mặc định dry-run, chỉ ghi khi `--apply`. Tiền đề: **Shopify cấm một delivery profile vừa có product variants vừa có selling plan group**; merchant tự add sản phẩm vào profile khi setup zone nên mọi lần app gọi associate đều `userError`, và checkout hiện shipping của profile *General* thay vì profile subscription đã cấu hình. → xem ⚠️ bên dưới, và [[2026-09-08-go-variants-khoi-delivery-profile]]. `5f03f8bcc` xoá file báo cáo 131 dòng của lane lọt vào commit trước. |
| `feat-store-credit-order-display` — `8ce66e720` | **Đơn đã bill hiện đúng số store credit đã trừ trên cả 4 màn order.** Cả 4 đọc **snapshot post-credit đã lưu trên order doc** thay vì tính lại từ số dư live của customer; helper dùng chung `collectOrderDetailSummary.js` đặt ở functions theo rule shared-code, FE import qua `@functions/*`. Bỏ `?? order.isCustomDeliveryPrice` — fallback này làm **rớt thuế khỏi Total** cho đơn KHÔNG có store credit khi field cấp contract undefined. Không tính lại tiền, không tạo dòng discount mới. |
| `Feature/fix-index-trial` — `f2d7b2ad4` | **Discount tier không được bắt đầu từ order 1 khi bật trial.** `mergeTrialTiers` bên BE prepend một tier ảo `{fromOrder: 1, toOrder: 1}` cho trial, nhưng `generateOrderIndexList` bên FE không biết gì về `trialConfig` nên picker "Apply from" vẫn cho chọn 1 ⇒ hai tier cùng claim order #1, `findApplicableTier` lấy nhầm. Thêm `getMinFromOrder(trialEnabled)` (trial → 2) dùng ở cả ba chỗ: picker disable option < min, tier mới lấy default từ min, `clampTiersToMinFromOrder` đẩy tier cũ lên và dựng lại chuỗi `toOrder`. `useBulkEditDiscountTierModal` **cố ý giữ nguyên** vì nó bulk-edit nhiều contract nên không đọc được `trialConfig` của từng cái. |
| `fix/select-products-modal-scroll` — `8b9fe8f2e` | **Mở dev zone trên staging và local, không cần CRM login-as.** Gộp `canRenderDevZone` vào `canAccessDevZone`, thêm tham số `isStaging`; **production giữ nguyên gate `isCrmLogin === true`**. `isStaging` truyền từ ngoài vào chứ không đọc trong helper (file share với FE, FE resolve env qua `import.meta.env` của Vite) — call site quên truyền cờ thì **fail-closed**. Test tách ma trận production/staging + case fail-closed. |

## Reverted

Không có revert feature nào. Hai thứ trông giống revert nhưng không phải:

- `017326624` — CI trỏ slot **staging 4** về nhánh `feature/fix-index-trial`, tức revert lại
  `feat/sb-15077-mcp-server` trước khi merge vào master. Đây là đổi 1 dòng trong
  `.gitlab/ci/staging4.yml`, đúng cơ chế neo slot theo `STAGING_BRANCH` mà
  [[digest-subscriptions-2026-08-12]] đã ghi — không phải rút feature.
- `5f03f8bcc` — xoá file báo cáo của lane lọt vào commit trước, chore thuần.

## Deploy notes

- **3 tag trong một ngày:** `v2.35.9`, `v2.35.10`, `v2.35.11`.
- **Một cờ deploy:** `[deploy-extensions]` trên `b3c5fe883` (v2.35.11) — đúng vì fix nằm trong
  `extensions/customer-account-ui`.
- **Có đụng `firestore.indexes.json`** — nhưng còn trên nhánh `feat-email-daily-cap`
  (`b5862a9de`, +10 dòng). Đáng chú ý: đây là **`fieldOverrides` TẮT index** cho
  `emailDeliveries.payload` và `failureReason`, không phải thêm index. Lý do trong commit body:
  `payload` chứa nguyên HTML email, index-entry vượt trần sẽ làm `ref.create()` throw và
  **cap sẽ không bao giờ áp dụng cho email nào**. Deploy feature này mà quên deploy index config
  thì cap chết ngay từ email đầu tiên.
- Hai self-caveat merchant-facing trong `b5862a9de`, ghi lại vì chúng là hành vi cố ý chứ không
  phải bug chưa biết: **retry vẫn tính vào cap** (đếm bảo thủ; nhả slot sau timeout có thể cho gửi
  vượt trần), và **fail-open khi Firestore không ghi được** — vẫn gửi, chặn bằng trần
  50/instance/ngày.
- Không có migration SQL.

## ⚠️ Cần xác nhận

**Delivery profile subscription: merchant NÊN gán sản phẩm vào, hay app phải GỠ sản phẩm ra?
Brain và commit hôm nay nói ngược nhau.**

- [[kookut-yeu-cau-cau-hinh-shipping]] (đã **gửi CS**) và [[digest-subscriptions-2026-08-27]]
  kết luận: profile `Shipping rates for subscription` có **0 sản phẩm** nên "chưa bao giờ có hiệu
  lực" ⇒ yêu cầu merchant **gán sản phẩm vào profile**.
- Commit `16a10659e` (SB-16531) nói ngược: *"Shopify cấm một delivery profile vừa có product
  variants vừa có selling plan group. Merchant tự add sản phẩm vào profile khi setup zone nên mỗi
  lần app gọi associate đều userError, checkout hiện shipping của profile General"* — và cách sửa
  là viết command **gỡ variants ra**.

Nếu commit đúng, thì yêu cầu đã gửi CS có thể **tự tay tạo ra đúng lỗi này**. Chưa xác minh được:
(a) SB-16531 có phải cùng shop kookut hay một shop khác, (b) profile 0-sản-phẩm của kookut là hậu
quả của chính ràng buộc Shopify này hay là chuyện độc lập. Cần đọc lại ticket SB-16531 trước khi
CS đẩy yêu cầu cũ đi tiếp.

Chưa đóng mục treo từ [[shipped-subscriptions-2026-08-29]] ("cấu hình merchant hay hành vi
Shopify") — commit hôm nay thêm **giả thuyết thứ ba** chứ không chọn giữa hai cái cũ.

## Liên quan

[[subscriptions]] · [[subscriptions-debug-runbook]] · [[2026-08-28-shipping-lay-gia-tu-rate-table]] ·
[[digest-subscriptions-2026-09-06]] · [[digest-subscriptions-2026-09-07]] ·
[[ack-khong-phai-hieu-ung]] (associate báo OK nhưng group không tồn tại — cùng họ với `userError`
của SB-16531)
