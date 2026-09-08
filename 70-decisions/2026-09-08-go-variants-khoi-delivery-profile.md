---
type: decision
title: Gỡ product variants khỏi delivery profile subscription, thay vì bảo merchant gán thêm vào
summary: Joy Subscription đảo hướng xử lý phí ship sai — thay vì yêu cầu merchant gán sản phẩm vào delivery profile subscription (hướng đã gửi CS ngày 08-28), app viết command ops GỠ product variants ra khỏi profile đó, vì Shopify cấm một profile vừa có variants vừa có selling plan group nên mọi lần associate đều userError.
tags: [avada, subscription, shopify, shipping, architecture]
created: 2026-09-08
updated: 2026-09-08
status: active
review: 2026-12-08
source: repo `subscriptions` — commit `16a10659e`, `5f03f8bcc` (git log 2026-09-07)
---

## Quyết định

Khi delivery profile subscription của một shop không có hiệu lực ở checkout, cách xử lý là
**app gỡ product variants ra khỏi profile** bằng một command ops chạy tay, chứ không phải nhờ
merchant gán thêm sản phẩm vào.

- Command: `SA_ENV=prod node packages/functions/lib/commands/misc/clearDeliveryProfileVariants.js
  <shopDomain> <deliveryProfileId> [--apply]` — **mặc định dry-run**, chỉ ghi khi có `--apply`.
- Validate selling plan group trên **Shopify** TRƯỚC khi gỡ bất kỳ variant nào (mirror Firestore
  có thể đã lệch; GID chết thì dừng ngay, chưa phá gì).
- Có đường khôi phục: associate thất bại → trả lại **toàn bộ** variants đã gỡ, cả batch đã xong
  chứ không chỉ batch đang dở. Khôi phục cũng thất bại → in `CRITICAL` kèm nguyên văn mutation để
  chạy tay, `exit 1`.
- Dùng lại `makeGraphQlApi` (có `shopifyRetryGraphQL`) thay vì tự viết fetch; `getShopById`
  `bypassCache` vì token stale sau reinstall gây 401. Validate với Admin API 2025-10.

Bằng chứng: `16a10659e` (SB-16531, 8 file, +1.229 — gồm 3 file test và
`buildClearDeliveryProfileVariables`), `5f03f8bcc` (chore, gỡ file báo cáo lọt vào commit trước).
Còn trên nhánh `shipping-profile-clear-variants`, **chưa merge master**.

## Why

Ràng buộc nền là của Shopify chứ không phải của app: **một delivery profile không được vừa chứa
product variants vừa chứa selling plan group**. Merchant khi setup zone thì phản xạ tự nhiên là add
sản phẩm vào profile — và chính hành động đó làm mọi lần app gọi associate selling plan group trả
`userError`. Kết quả ở checkout: Shopify dùng shipping của profile *General*, đúng cái triệu chứng
"bảng giá subscription merchant tạo ra chưa bao giờ có hiệu lực".

Hướng cũ ([[kookut-yeu-cau-cau-hinh-shipping]], gửi CS 08-28) đọc triệu chứng "profile có 0 sản
phẩm" và suy ra thiếu sản phẩm ⇒ bảo merchant gán vào. Nếu ràng buộc trên đúng thì đó là **đúng
hành động sinh ra lỗi**, và profile 0-sản-phẩm rất có thể là *hậu quả* của việc app phải giữ nó
sạch để associate được, chứ không phải nguyên nhân.

Chọn command ops chạy tay thay vì tự chữa trong luồng app vì Shopify **không có transaction** cho
chuỗi mutation này — thao tác nửa chừng làm variants rơi về default profile, tức đổi phí ship của
đơn mua lẻ. Việc đó phải có người bấm và đọc dry-run trước.

## Tradeoff

| Được | Mất |
|---|---|
| Associate selling plan group chạy được ⇒ profile subscription có hiệu lực ở checkout | Variants bị gỡ **về default profile** — phí ship đơn mua lẻ của chính những sản phẩm đó đổi theo. Dry-run có in cảnh báo, nhưng người chạy phải hiểu hệ quả |
| Dry-run mặc định + validate trước khi ghi ⇒ sai thì dừng khi chưa phá gì | Phải chạy tay từng shop, từng profile. Không scale nếu nhiều shop cùng dính |
| Có đường khôi phục toàn phần, và ca xấu nhất vẫn in mutation để chạy tay | Shopify không có transaction ⇒ vẫn tồn tại trạng thái nửa chừng thật; đường khôi phục là quy trình, không phải bảo đảm |
| Ngược lại với hướng cũ: không cần merchant làm gì | **Mâu thuẫn với yêu cầu đã gửi CS** ngày 08-28. Nếu merchant làm theo yêu cầu cũ trong lúc này thì tự tay tái tạo lỗi |

## Chưa xác minh

- SB-16531 có phải cùng shop **kookut** hay một shop khác — log không nói tên shop.
- Ràng buộc "profile không được vừa có variants vừa có selling plan group" mới chỉ đọc từ commit
  body, **chưa đối chiếu tài liệu Shopify**. Đây là tiền đề chịu lực của cả quyết định này lẫn
  việc có nên rút yêu cầu đã gửi CS hay không.
- Chưa merge master ⇒ chưa có bằng chứng chạy thật trên prod.

## Liên quan

[[shipped-subscriptions-2026-09-08]] · [[2026-08-28-shipping-lay-gia-tu-rate-table]] ·
[[digest-subscriptions-2026-08-27]] · [[kookut-yeu-cau-cau-hinh-shipping]] ·
[[ack-khong-phai-hieu-ung]] · [[subscriptions]]
