---
type: decision
title: Đọc usageCount của discount LIVE từ Shopify, thôi tin mirror trong Firestore
summary: Với mã giảm giá có `recurringCycleLimit`, app không còn lấy `usageCount` từ order doc (snapshot đóng băng lúc sync, đứng ở 0 sau khi bill) mà gọi thẳng Shopify với cache 60s, đánh dấu mã đã retire qua `expiredDiscountIds` rồi bỏ allocation của mã hết lượt trên MỌI surface đọc giá.
tags: [avada, subscription, shopify, billing, performance]
created: 2026-09-05
updated: 2026-09-05
status: active
review: 2026-12-05
source: repo `subscriptions` — git log 2026-09-04, commit `e042ac932` (+ `dfde49076`, `cee44e219`) trên nhánh `fix/spent-discount-usage`, SB-16382
---

Trước: mọi đường tính giá đọc `usageCount` từ dữ liệu app đang lưu (order doc / mirror contract).
Sau `e042ac932`: đường giá của contract **có mã giới hạn lượt** đọc `usageCount` trực tiếp từ Shopify
(cache 60s), đánh dấu mã đã hết lượt qua `expiredDiscountIds`, xếp rank theo lượt bill
(`billableRankService`) và **bỏ allocation** của mã đã retire. Phủ 4 endpoint upcoming-order, chi tiết
contract, chi tiết đơn, apply/remove discount của clientApi (portal cũ *và* mới), admin order detail,
admin contract detail, và endpoint list của cả admin lẫn portal.

Bằng chứng: `e042ac932` (26 file, +2.119/−46, trong đó ~1.580 dòng test), `dfde49076` (card subtotal
theo lượt bill của đơn kế tiếp), `cee44e219` (gom N+1 thành batch). **Chưa vào master** tính tới 09-04.

## Why

- Shopify tính `lineDiscountedPrice` của **mọi kỳ** theo TẤT CẢ discount của contract, không tự trừ theo
  `recurringCycleLimit`. Một mã 100% giới hạn 1 lượt ⇒ mọi upcoming order hiện **$0**. Đây đúng triệu
  chứng ticket `JSUB-260827-UjQwHh` đã ghi ở [[discount-per-cycle-audit-2026-08-27]].
- `usageCount` trong order doc là **snapshot lúc sync**, không phải số hiện tại — nó đứng nguyên ở 0 sau
  khi bill. Điều này trả lời câu hỏi treo số 1 của audit 27/08 bằng một khả năng thứ ba mà audit chưa
  liệt kê: field không sai, chỉ là ảnh chụp cũ.
- Logic lọc theo lượt (`getValidDiscounts`) đã có sẵn từ trước nhưng chỉ được gọi từ component render
  *danh sách* discount. Vá thêm một nhánh nữa trên dữ liệu mirror sai thì vẫn sai; phải đổi **nguồn**.

## Tradeoff

- **Thêm một call Shopify vào đường đọc giá.** Chấp nhận đổi lấy tính đúng, và trả bằng hai thứ: cache
  60s, cộng `cee44e219` gom query thành batch (`nodes(ids:)` 30 contract/lần, `first 10` discount) — nên
  tổng thể trang list còn **rẻ hơn** trước, dù mỗi contract nay chạm Shopify.
- **Cache 60s là một cửa sổ sai có thật.** Trong vòng 60s sau khi một kỳ được bill, giá hiển thị vẫn theo
  `usageCount` cũ. Ngắn, nhưng đừng debug một lệch giá vừa xảy ra mà quên cửa sổ này.
- **Phụ thuộc availability của Shopify trên đường đọc.** Trước đây trang list đọc được kể cả khi Shopify
  chậm/lỗi; nay contract có mã giới hạn lượt phụ thuộc call đó. Chưa rõ hành vi fail — đáng kiểm ở mốc
  review.
- **Vẫn còn một nguồn sự thật thứ hai chưa dọn.** `getExpiredDiscounts` có công thức
  `isInitialDiscount ? usageCount - 1 : usageCount` viết cho thế giới mirror cũ; và câu hỏi `null` vs `0`
  của `recurringCycleLimit` (câu 4 trong audit 27/08) **chưa được commit này đụng tới**. Đọc live giải
  quyết vế "số cũ", không giải quyết vế "hai bên hiểu ngược nhau về giới hạn".

Liên quan: [[subscriptions]] · [[discount-per-cycle-audit-2026-08-27]] ·
[[shipped-subscriptions-2026-09-05]] · [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] ·
[[caching-layers]] · [[subscriptions-debug-runbook]]
