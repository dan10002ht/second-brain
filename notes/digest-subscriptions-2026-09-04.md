---
type: note
title: Digest Joy Subscription — 2026-09-04
summary: Customer portal không hiện ở store khách vì div marker app tạo lúc install đã biến mất khỏi page chứ không phải scripttag không load; endpoint chữa order kẹt bị tắt cứng trên prod; và một số shop không bị thu transaction fee là do ngưỡng tối thiểu $10, không phải bug.
tags: [avada, subscription, shopify, billing, cost, debug]
created: 2026-09-04
updated: 2026-09-04
source: project `subscriptions` — session history 2026-09-03/09-04 (tielenergy portal, JSUB-260828 order kẹt, số liệu transaction fee)
---

CHỈ phần mới so với [[digest-subscriptions-2026-09-01]], [[digest-subscriptions-2026-09-03]],
[[jsub-260903-upcoming-order]] và [[2026-08-28-import-loop-chi-contract-song-paused]].

## Bugs

**Portal không hiện ≠ scripttag không load (tielenergy.se).** App embed block **đang bật**, script
tải được — nhưng portal **không có chỗ để mount**: div marker mà app tạo lúc install đã biến mất
khỏi page. Chuỗi kiểm đúng thứ tự là: block còn bật? → script có tải? → **marker còn trong DOM
không?**, chứ đừng dừng ở hai câu đầu.

Mảnh thứ hai giải thích vì sao merchant "không thấy page đâu cả": `/pages/joy-subscription` **có
tồn tại** và đúng là do app tạo (title `Manage Subscription`, trả 200), nhưng đang **bị gán nhầm
template** — nên nó không xuất hiện ở chỗ merchant tìm trong theme editor. Page tồn tại và page
dựng đúng là hai câu hỏi khác nhau.

**Đường chữa order kẹt bị tắt cứng trên prod (JSUB-260828).** Order doc `UNBILLED` kẹt ở trạng thái
`processed=true, ready=true, 0 attempt`. `PUT /resync-order/:orderId` **không dùng được** —
`middleware/tsToolAuthMiddleware.js` chặn hẳn trên prod. Tôi đã nói ngược ở lượt trước rồi phải
đính chính; bài học là kiểm middleware của endpoint trước khi hứa với user rằng có đường chữa.

Để trả lời câu "một chỗ hay nhiều chỗ", viết command scan **read-only**
`packages/functions/src/commands/misc/scanStuckQueuedOrders.js`: quét 727 order doc `UNBILLED` của
shop → đúng **1** trường hợp. Câu hỏi của user là *phạm vi*, không phải *bản vá* — trả lời bằng
một phép đếm rẻ hơn nhiều so với đi sửa.

**Shop không bị thu transaction fee giữa T8 và T9 không phải bug.** `chargeUsageFee`
(`subscriptionService.js:489`) bỏ qua khi phí tính ra dưới **ngưỡng tối thiểu $10**. Đối chiếu từng
shop mới kết luận được điều này — nhìn bảng tổng thì nó trông y hệt một lỗ thu tiền.

## Techniques

**Cướp nút ATC của theme: dùng listener `capture` trên `window`.** Chốt hướng cho lỗi bundle chỉ
add 1 sản phẩm (xem [[digest-subscriptions-2026-09-01]]): listener `capture` đăng ký trên `window`
**dù đăng ký muộn vẫn chạy trước** handler của Horizon — chứng minh bằng Playwright trên trang
live (`[ProductForm Debug]` không xuất hiện, cart = 0). MR !2518, tách thành helper để test được.
Bẫy trong chính test: `stopImmediatePropagation` làm listener **rò rỉ giữa các case** — case sau
bị case trước chặn, nên phải gỡ listener trong teardown.

**Đo doanh thu phải lọc store nội bộ trước khi kết luận bất cứ điều gì.** Bản query đầu lấy toàn
bộ charge và cho một con số vô dụng.

| Ngày | Tổng | Shop | Store nội bộ Avada |
|---|---|---|---|
| 01/09/2026 | $3.042,87 | 38 | — (phần lọc chưa chép đủ) |
| 01/08/2026 | $2.763,27 | 33 | 22 shop · **$2.302,70 = 83%** |

Tức doanh thu thật từ khách ngoài nhỏ hơn nhiều so với bảng thô. Cùng đợt: **494 shop Starter thuộc
pricing V4** (grace 0% transaction fee) và tính tới 04/09 **chưa shop nào hết 6 tháng**, nên phần
doanh thu đó vẫn chưa bắt đầu chảy.

⚠️ **Chưa xác minh:** con số GMV subscription **$103M/tháng** (top 10 shop chiếm 99,5%) được xác
định là **giả** do một bug dữ liệu, nhưng phiên đứt trước khi chốt nguyên nhân. Đừng dùng lại con
số này, và đừng dùng lại kết luận "bug ở đâu" cho tới khi có người truy xong.

## Context

- Shell của session chạy mỗi lệnh `!` từ **working dir gốc**, không giữ `cd` giữa các lệnh — phải
  viết `cd <path> && <cmd>` trong cùng một dòng, nếu không lệnh thứ hai báo không tìm thấy path.
- `yarn trans` cần `GOOGLE_TRANSLATE_KEY`; key nằm ở `packages/functions/.env.local`, **không** ở
  `.env` root. Source file đó vào env, đừng in giá trị ra chat
  ([[feedback-khong-in-secret-ra-chat]]).
- Checkout có thể bị đổi nhánh **ngoài session** (đang `feat/portal-preview`, quay lại thấy
  `chore/book-call-link`). Kiểm `git status` + reflog trước khi sửa file, nếu không sẽ commit nhầm
  nhánh.
- MR đã tạo trong đợt: !2518 (ATC capture), !2528 (đổi link book call sang Calendly).

Liên quan: [[subscriptions]] · [[subscriptions-debug-runbook]]
