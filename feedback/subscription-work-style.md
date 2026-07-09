---
type: feedback
title: Cách làm việc trên Joy Subscription (text tiếng Anh, batch commit, ràng buộc kiến trúc)
summary: Feedback từ session subscriptions — text hướng khách phải tiếng Anh, batch commit theo type-role-scope, và các ràng buộc kiến trúc user chốt cho fix swap.
tags: [subscription, shopify, feedback, avada]
created: 2026-07-08
updated: 2026-07-08
source: [[subscription-installment-horizon-digest]]
---

# Cách làm việc trên Joy Subscription

Feedback rút từ session history khi làm [[subscriptions]] (07/2026).

- **Text hướng tới khách phải là tiếng Anh** (merchant nước ngoài) — dù trao đổi bằng tiếng Việt. Áp cho order note (`buildNoShipNote`) và mọi label/comment trong theme block.
- **Batch commit**: "làm xong 1 thể rồi commit" — không commit từng thay đổi nhỏ. Commit message dạng `type - role - scope` (gạch ngang), **không** thêm `Co-Authored-By`.
- **Ràng buộc kiến trúc do user chốt**: KHÔNG thêm mirror-write loop N order trong `swapForNextBilling` (vỡ memory Functions + cạn bucket Shopify API); KHÔNG dựng Cloud Task deferred re-sync (đổi kiến trúc app). Fix phải nằm gọn trong flow webhook re-sync sẵn có.
- **Workflow sequential-phase cho core logic**: produce → adversarial verify → gate → HARD STOP review (mẫu `thorough.js`), effort-tier từng phase để giảm token. Gate `eslint-fix` phải **jest-only** — chạy eslint cả package làm bẩn 70+ file không liên quan.

**Why:** đây là những ràng buộc do user chốt hoặc lỗi đã trả giá, không suy ra được từ code. Bỏ qua → viết text sai ngôn ngữ, commit sai style, hoặc đề xuất fix bị user bác vì phá kiến trúc/quota.

**How to apply:** trước khi sửa Joy Subscription — viết text khách bằng tiếng Anh; gộp thay đổi rồi commit một lần theo `type - role - scope`; khi đề xuất fix swap/re-sync, giữ trong flow webhook có sẵn, không thêm loop mirror-write hay Cloud Task.

## Liên quan
- [[subscriptions]] · [[subscriptions-debug-runbook]] · [[commit-style]] · [[subscription-installment-horizon-digest]]
