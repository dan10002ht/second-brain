---
type: note
title: Digest PDF Invoice — 2026-09-15 (cấp plan có hạn không cần cron, và một cái tên bịa trong câu trả lời ticket)
summary: Mở Ultimate 3 tuần cho một shop làm bằng 3 field trên doc shop + override lúc đọc plan, không cần `onSchedule` reset; và tôi bịa tên một người không có trong thread Slack — dantt bắt ngay.
tags: [pdf, invoice, avada, shopify, firestore, backend, agent]
created: 2026-09-15
updated: 2026-09-15
source: project `pdf` — session history 2026-09-15 (ticket PDF-260908-6Q5eqc, MR 572)
---

# Digest — PDF Invoice, 2026-09-15

## Context — cấp plan có hạn mà không cần job nền

Ticket `PDF-260908-6Q5eqc`, shop `nocentino-3.myshopify.com` (dev store): CS muốn mở plan Ultimate
trong 3 tuần. App **chưa có** cơ chế cấp plan có hạn.

Cách dựng, theo đúng gợi ý của dantt (mượn mô hình `isPartnerStore` bên Joy Subscription): ba field
trên doc `shops` — `temporaryPlan`, `temporaryPlanUntil` (Date ⇒ Firestore Timestamp), và cờ đi kèm
— rồi `getEffectivePlan(shop)` gộp plan gốc với plan tạm **lúc đọc**. Hết hạn là tự rơi về plan cũ,
**không cần `onSchedule` reset**. Quyết định chọn tầng chèn đã tách riêng ở
[[2026-09-15-pdf-temporary-plan-tang-gate]].

Ghi lên production: tìm doc theo email/domain (`shops/CEgPFCQPJiPo0lXwy1hW`), ghi bằng `updateMask`
đúng 3 field, rồi **đọc lại để xác nhận** — không ghi rồi báo xong.

Không làm phần hiển thị: merchant chỉ thấy Ultimate rồi tới hạn là mất, không có thông báo. Đó là
lựa chọn của dantt, ghi ra để người sau khỏi coi là thiếu sót.

## Techniques

- **Gate đỏ ở lần chạy nguội phải chứng minh là pre-existing.** Suite `handleOrderDailyResilience`
  fail; stash code của mình đi chạy lại thì **baseline fail y hệt** (1 fail + 2 pass, pass khi cache
  nóng). Chỉ sau bằng chứng đó mới để nguyên lỗi `admin.controller.js:77`.
- **Không có `glab`, không có token** vẫn mở được MR: đẩy bằng **git push options** của GitLab
  (đặt sẵn target, reviewer, xoá nhánh nguồn) → MR 572.
- Làm theo TDD cả hai lượt (helper plan, rồi chuẩn hoá input trước khi nối vào `bulkUpdateShops` +
  whitelist field).

## Feedback nhận được

- **Comment ít lại** — lặp lại nhiều lần. Cắt 51 dòng, thêm lại 9, chỉ giữ 3 chỗ đọc code không ra
  (ranh giới gate vs billing…). Xem [[feedback-comment-chi-khi-code-roi]].
- **Bịa tên người trong câu trả lời về thread Slack** — tách riêng ở
  [[feedback-khong-bia-ten-nguoi]].

Liên quan: [[pdf]] · [[2026-09-15-pdf-temporary-plan-tang-gate]] · [[feedback-khong-bia-ten-nguoi]] ·
[[feedback-comment-chi-khi-code-roi]] · [[feedback-chi-tao-mr-user-merge]] · [[bang-chung-phan-biet-duoc]]
