---
type: note
title: Joy Subscription — digest 2026-08-07 (select-all không lưu, widgets bị bỏ có chủ đích)
summary: Vắng log không chứng minh được gì khi flow không log `shopId`; `updatedAt` không đổi mới là bằng chứng save không xuống DB; field `widgets` bị bỏ có chủ đích vì tốn 0.6–1.4s trên critical path.
tags: [subscription, shopify, avada, firestore, bigquery, debug, performance]
created: 2026-08-07
source: project "subscriptions" — session history (BRIEF task #5, #6)
---

## Bugs

**SB-15333 / JSUB-260806-LpVLDX — "Add all products" ở Plans, F5 lại thì trống.**
Chưa chốt được root cause, nhưng đã loại trừ được nhiều thứ bằng data thật:

| Giả thuyết | Kết quả |
|---|---|
| Backend select-all trả rỗng | ❌ — chạy thẳng code `lib/` với service account: trả đủ **27 sản phẩm** |
| Data khách bị wipe về `[]` | ❌ — plan vẫn có 15 sản phẩm, đang active |
| Save không xuống Firestore | ✅ — `updatedAt` vẫn là mốc cũ (`2026-08-06T14:33`) sau khi user bấm Save |

Chỗ đáng ngờ nhất: `ProductCard.js:45-49` — lúc confirm, form state chỉ giữ
`{selectedProductId, selectedVariantIds}` và **vứt `productData`**. *Chưa xác minh* đây là
root cause.

Hai bài học vận hành từ ca này:
- **`updatedAt` không đổi là bằng chứng cứng hơn "không thấy log".** Nó phân biệt được
  "save fail" với "request không tới", còn log thì không.
- **Vắng log không chứng minh gì nếu flow không log `shopId`.** 30 giờ không có một dòng
  log nào chứa shop đó — nhưng flow này đơn giản là không log shopId, nên đó là *thiếu
  observability*, không phải bằng chứng "không có request".
- Cloud Logging đọc được **bằng service account**, không cần `gcloud auth login` — hữu ích
  trong session non-interactive (đối chiếu [[digest-pdf-2026-07-23]]).

**Task #6 — field `widgets` biến mất khỏi `/shops`: bị bỏ CÓ CHỦ ĐÍCH, không phải mất tự nhiên.**
Commit `03322bf58` "Test getCrmWidgets" (DamHV, 20/07/2026, đã trên `master`) gỡ nó ra vì
`getCrmWidgets` tốn **0.6–1.4s trên critical path của mọi lần load app**. Trước khi "thêm
lại cái đang thiếu", tra git history: thứ thiếu có thể là một quyết định perf. Nhét lại
vào `Promise.all` của `/shops` là undo quyết định đó — đã khôi phục trên nhánh riêng
`feat/restore-shop-widgets` để người thật cân nhắc, không tự merge.

## Techniques

- **Chứng minh gate đỏ là pre-existing bằng cách chạy trên `origin/master` sạch** —
  cùng 8 suite / 5 test fail ở cả hai bên ⇒ không phải hồi quy. Lặp lại kỷ luật đã ghi ở
  [[digest-subscriptions-2026-08-06]].
- Push bị **hook chặn, yêu cầu người thật bấm** — agent không push hộ được, phải đưa lệnh
  cho user chạy. Xem [[feedback-git-branch-discipline]].

→ [[subscriptions]] · [[subscriptions-debug-runbook]] · [[shipped-subscriptions-2026-08-07]]
