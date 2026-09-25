---
type: decision
title: Skip/resume một kỳ chỉ ghi cờ local — Joy thôi đẩy trạng thái skip sang billing cycle của Shopify
summary: Skip và resume nay chỉ ghi cờ trong Firestore chứ không gọi mutation skip billing cycle của Shopify, resync thôi ghi đè cờ đó, và những cycle đã bị skip nhầm bên Shopify được dọn bằng một command dry-run riêng.
tags: [subscription, shopify, avada, billing, backend, firestore]
created: 2026-09-25
updated: 2026-09-25
review: 2026-12-25
source: repo `subscriptions` — git log, nhánh `fix/sb17107-skip-local-truth`: `c30b2551c` · `8343a2300` · `f617b80de` (24/09). Tiêu đề commit là bằng chứng; phần *vì sao* dưới đây có một đoạn suy luận, đã ghi rõ.
---

# Skip cycle: cờ local là nguồn sự thật

**Quyết định (SB-17107, chưa lên master):** trạng thái "kỳ này bị skip" là dữ liệu **của Joy**, sống
trong Firestore. Ba thay đổi hợp thành nó:

| Hash | Thay đổi |
|---|---|
| `c30b2551c` | `skip` và `resume` billing cycle **chỉ ghi cờ local** — `shopifyService.js` +14/−12, test `skipResumeLocalOnly.test.js` +335 |
| `8343a2300` | `resync` **thôi ghi đè** cờ skipped đã lưu — `orderRepository.js` +16, test `orderPreserveSkipped.test.js` +197 |
| `f617b80de` | command **dry-run** `unskipStrayShopifyCycles.js` (+357) + helper `strayShopifySkipPlan.js` (+44) để dọn cycle đã skip nhầm bên Shopify |

Tên nhánh tự khai báo: `fix/sb17107-skip-local-truth`.

## Why

Cái này **đảo một hướng cũ**, không phải vá một lỗi: trước đó app mirror trạng thái skip sang
Shopify, và vì mirror nên nó cần một đường resync đọc lại từ Shopify — chính đường đó ghi đè lên
chính cờ mình vừa ghi (`8343a2300`). Một trạng thái sống ở hai nơi thì luôn phải chọn bên nào thắng,
và app đã chọn sai bên: Shopify thắng, nên thao tác của merchant bị chính lượt sync sau đó xoá.

Bằng chứng nền đã có trong brain: [[digest-subscriptions-2026-09-22]] ghi Shopify **từ chối mọi
`billingCycleSelector` trỏ vào cycle nằm TRƯỚC cycle đã billed**. Tức việc mirror không chỉ dư — nó
**không thể đúng trong mọi ca**: có những cycle Joy cần đánh dấu skip mà Shopify từ chối nhận, nên hai
bên buộc phải lệch. Khi một trong hai hệ thống không thể biểu diễn được trạng thái, chọn nó làm nguồn
sự thật là chọn một nguồn khuyết.

Đúng khuôn [[resolve-luc-doc-thay-vi-ghi-truoc]] ở dạng liên hệ thống: chép một giá trị sang hệ thống
khác là tạo một bản sao phải giữ đồng bộ mãi, và phép "giữ đồng bộ" ấy chính là chỗ hỏng.

`f617b80de` là phần thừa nhận nợ: mirror cũ đã để lại **cycle bị skip thật bên Shopify** mà Joy không
còn coi là skip nữa, nên phải có command dọn. Nó ra mắt ở dạng **dry-run** trước — đúng kỷ luật
[[script-pha-du-lieu-tu-choi-flag-la]].

> **Chưa xác minh:** ba commit này **không có body**, nên câu "trước đó app mirror sang Shopify và
> resync ghi đè" được suy ra từ tiêu đề + diff size + tên nhánh, cộng dữ kiện Shopify-từ-chối ở digest
> 09-22. Ai mature note này nên đọc diff `c30b2551c` để chốt: mutation nào đã bị bỏ gọi.

## Tradeoff

**Trả bằng việc Shopify không còn biết kỳ đó bị skip.** Mọi bề mặt đọc trực tiếp từ Shopify — admin
Shopify của merchant, app thứ ba đọc billing cycle, và bất kỳ báo cáo nào không đi qua Joy — sẽ thấy
cycle đó **bình thường**. Nếu Shopify tự charge theo cycle của nó thì cờ local không cản được; điều
này chỉ an toàn nếu Joy là bên duy nhất khởi tạo charge. **Đây là giả định phải kiểm trước khi
merge**, không phải trước khi review lại sau 3 tháng.

**Trả bằng một lớp dữ liệu nữa phải backfill.** Cờ local chỉ đúng cho những gì Joy ghi từ nay; trạng
thái cũ đang nằm bên Shopify và phải chạy `unskipStrayShopifyCycles` để hai bên thôi mâu thuẫn. Cho
tới khi command đó chạy `--apply` trên prod, đang có hai nguồn sự thật cùng lúc — tức giai đoạn xấu
nhất của cả hai cách.

**Không chọn cách ngược lại, có lý do.** Cách "để Shopify là nguồn sự thật và sửa resync cho đúng"
rẻ hơn về code nhưng bất khả thi: Shopify không nhận skip cho cycle trước cycle đã billed, nên có
những trạng thái nó không lưu được.

**Điều kiện làm quyết định này sai:** phát hiện một đường charge **không đi qua Joy** vẫn tôn trọng
cycle của Shopify (ví dụ merchant charge tay từ admin Shopify, hoặc một retry do Shopify tự lên lịch).
Khi đó cờ local là một lời hứa app không thi hành được, và phải quay lại mirror — nhưng lần này với
một đường hoà giải tường minh cho những cycle Shopify từ chối.

Liên quan: [[shipped-subscriptions-2026-09-25]] · [[subscriptions]] · [[digest-subscriptions-2026-09-22]] ·
[[resolve-luc-doc-thay-vi-ghi-truoc]] · [[script-pha-du-lieu-tu-choi-flag-la]] ·
[[ack-khong-phai-hieu-ung]] · [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] ·
[[3ds-pending-billing-attempt-khong-co-webhook]]
