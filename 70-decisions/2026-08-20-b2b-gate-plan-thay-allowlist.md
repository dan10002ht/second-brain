---
type: decision
title: PDF Invoice — B2B early payment discount gate theo plan Wholesale, bỏ allowlist env
summary: Bỏ hẳn `B2B_DISCOUNT_SHOP_ALLOWLIST` (env `B2B_DISCOUNT_SHOPS`) làm điều kiện chạy auto-apply discount, thay bằng `isShopWholesale(shop)` — cùng entitlement mà phần còn lại của app đã gate B2B.
tags: [avada, pdf, shopify, billing]
created: 2026-08-20
updated: 2026-08-20
review: 2026-11-20
source: repo `pdf` — commit `de0db552f` nhánh `feat/early-payment-benefit`
---

# B2B early payment discount: gate theo plan, không theo allowlist

Bằng chứng: `de0db552f` (2026-08-18, nhánh `feat/early-payment-benefit`), chồng lên
`7e54649ca` — commit 205 file dựng cơ chế mới, đã ghi ở [[shipped-pdf-2026-08-19]] và
[[2026-08-19-b2b-rule-thay-discount-thu-cong]]. Allowlist ra đời trong chính `7e54649ca`
(`constants/b2bDiscount.js`) rồi bị gỡ hai ngày sau, khi tính năng vẫn **chưa lên master**.

Sau thay đổi, chuỗi gate là: `isShopWholesale(shop)` → phải có một rule khớp
(`matchRuleForOrder`) → mới apply. Gate plan giữ **vị trí đầu tiên** để `lookupRule` không
chạy cho ~62k shop không dùng được, và **cố ý không log** ở đó vì nó chạy trên mọi
`orders/create` — log vào là dìm stream `B2B_DISCOUNT` mà alert `apply:failed` dựa vào.

Kèm theo, hai chỗ được vá cùng luật:
- `CompanyPaymentRuleController` thêm `assertShopWholesale` (khuôn `PaymentReminderController`)
  — rule ghi qua API chính là thứ webhook auto-apply, không thể chỉ dựa vào gate ở FE;
- `PaymentTerms` chặn Save khi shop chưa grant `wholesaleScopes` và render `UpdateScopeB2B`
  ngay trên trang (logic đọc scope tách ra `hooks/useB2BScopes.js`). Trước đó banner chỉ có ở
  `/b2b` và `/b2b/:id`, **dismiss được và không chặn gì**, nên merchant lưu được rule khi
  thiếu `write_order_edits` rồi mọi đơn rơi vào `apply:failed` mà không ai thấy.

## Why

**Allowlist là công cụ rollout từng shop, không phải điều kiện dùng tính năng.** Phần còn
lại của app đã gate B2B bằng entitlement thật ở ba chỗ độc lập — `routes.js` (`isShopifyPlus`),
`Companies.js` (đá về trang giá), `PaymentReminderController` (chặn ở API). Để riêng đường
auto-apply gate bằng một biến env là để nó lệch khỏi ba chỗ kia.

**Không thể bỏ trống hẳn gate.** Shop downgrade khỏi Wholesale vẫn giữ nguyên doc
`companyPaymentRules`; không có gate plan thì app tiếp tục **tự giảm giá vô thời hạn trên
plan không còn trả tiền** — cùng loại lỗ với `getOrdersEarlyPaymentDiscount()`.

Cùng hướng với [[2026-08-11-bo-feature-flag-payment-reminder]]: một biến env không được set
ở đâu trong repo là một cái công tắc giả — nó chỉ tạo ảo giác kiểm soát, còn hành vi thật do
điều kiện khác quyết định.

## Tradeoff

- **Mất đường canary theo từng shop.** Không còn cách bật cho 1–2 store thật rồi quan sát
  trước khi mở cho toàn bộ Wholesale. Thứ đang giữ chỗ đó là "phải có rule khớp" — nhưng
  rule do **merchant** tạo, không phải mình, nên mốc mở cửa không còn nằm trong tay dev.
- **Bề mặt rủi ro là tiền thật**: khi merge, mọi shop Wholesale tạo một rule là đơn kế tiếp
  bị sửa giá qua `orderEditBegin`. Rào chắn còn lại chỉ là validate rule + gate scope.
- **Đổi lấy**: một nguồn sự thật cho "shop này có được dùng B2B không", và shop downgrade
  ngừng được giảm giá ngay thay vì trôi vô thời hạn.
- Commit tự khẳng định "không bật gì cho shop nào: production đang có 0 rule" — đúng ở thời
  điểm này vì tính năng **chưa lên master**. Câu đó hết hiệu lực đúng lúc MR merge; đó cũng
  là lúc tradeoff trên bắt đầu tính.

Liên quan: [[pdf]] · [[shipped-pdf-2026-08-20]] · [[2026-08-19-b2b-rule-thay-discount-thu-cong]] ·
[[feedback-feature-moi-mac-dinh-opt-in]] · [[2026-08-13-khong-validate-button-url-pdf]]
