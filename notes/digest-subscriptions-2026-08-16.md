---
type: note
title: Digest subscriptions 2026-08-16 — dev store / test order không nhận notification email của Shopify
summary: Charge recurring tạo order nhưng khách không nhận "Order confirmed" là hành vi đúng của Shopify chứ không phải bug app — `SubscriptionBillingAttemptInput` không có field nào điều khiển email, còn development store (`plan.partnerDevelopment: true`) và order `test: true` thì Shopify cố ý không gửi notification.
tags: [avada, subscription, shopify, debug]
created: 2026-08-16
updated: 2026-08-16
source: project "subscriptions" — session history (mined 2026-08-16)
---

# Digest subscriptions — 2026-08-16

Ngày 08-16 bản thân nó **không có việc mới**: vòng `/loop 10m /looptasks` bắn ~26 lượt
"No pending tasks" vì cả 4 task còn lại đều `[⏸️]` chờ người quyết — đúng ca đã ghi ở
[[digest-subscriptions-2026-08-15]] và [[feedback-dung-loop-khi-rong]].

Lượt mine này quét lại trọn session dài của cụm installment/widget custom, và gần như
toàn bộ đã nằm trong các digest 07-11 → 08-15. Chỉ còn **một mục chưa được ghi ở đâu**.

## Techniques

**"Charge recurring xong mà khách không nhận Order confirmed" thường không phải lỗi app.**
Khi truy ca này ở store test, root cause là hành vi cố ý của Shopify, và nó nằm ở hai tầng
tách biệt — kiểm đúng thứ tự thì khỏi đọc code app:

| Tầng | Sự thật | Hệ quả khi debug |
|---|---|---|
| API | `SubscriptionBillingAttemptInput` **không có field nào điều khiển email** (chỉ `billingCycle` / idempotency / inventory / `originTime` / payment) | App không có công tắc nào để bật/tắt mail này — đừng tìm bug trong code gửi mail của app |
| Store | Email do **notification settings của store** quyết định; development store (`plan.partnerDevelopment: true`) và order gắn `test: true` thì Shopify **không gửi** notification | Không tái hiện được trên dev store; muốn kiểm thật phải dùng store thường |

Cách chốt nhanh: query plan của shop (`plan.partnerDevelopment`) + xem cờ `test` của order
gần nhất. Hai số đó đủ để phân biệt "Shopify cố ý không gửi" với "app gửi hỏng" — đúng kiểu
bằng chứng phân biệt được hai giả thuyết ở [[bang-chung-phan-biet-duoc]].

⚠️ Gotcha khi tra tài liệu: phần này sống ở **Shopify Help Center**, không phải dev API docs
— nên MCP/`shopify-dev` không trả ra, phải tìm ngoài. Cùng bài học "đọc nguyên văn tài liệu
đúng chỗ" ở [[feedback-doc-nguyen-van-tai-lieu]].

Liên quan: [[subscriptions]] · [[subscriptions-debug-runbook]] · [[digest-subscriptions-2026-08-15]] ·
[[app-development]]
