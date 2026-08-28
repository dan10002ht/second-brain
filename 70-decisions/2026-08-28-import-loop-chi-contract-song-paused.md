---
type: decision
title: Import subscription từ Loop — chỉ 37 contract còn sống, tất cả để Paused
summary: Bỏ 88 contract Cancelled khỏi file import và ép toàn bộ 37 contract còn sống về trạng thái Paused, để việc bật lại là thao tác có chủ ý của merchant sau khi đã huỷ bên Loop — thay vì import nguyên 125 dòng theo trạng thái gốc.
tags: [avada, subscription, shopify, backend, patterns]
created: 2026-08-28
updated: 2026-08-28
status: active
review: 2026-11-28
source: project `subscriptions` — session history 2026-08-28 (TIEL Energy, migrate từ Loop)
---

## Quyết định

- File export của Loop có **125 dòng** (25 Active + 12 Paused + 88 Cancelled). Chỉ import **37
  cái còn sống**; 88 Cancelled bỏ hẳn.
- Toàn bộ 37 contract đặt `Paused` trong file import (có hẳn flag trong script để tái lập), kèm
  một file đối chiếu để bật lại đúng trạng thái gốc sau này.

## Why

- `importService` đổi contract status `CANCELLED`/`EXPIRED` thành **`PAUSED`** lúc tạo và
  **không có bước huỷ nào phía sau** — import 88 contract đã huỷ là dựng lại 88 contract sống
  trong Joy. Không phải rủi ro giả định: nó nằm trong code (`importService:587`).
- Import xong mà contract Active thì cron của Joy có thể charge trong khi Loop **chưa bị huỷ** —
  khách bị thu tiền hai lần. Để `Paused` là biến cửa sổ đó thành thao tác có chủ ý: huỷ bên Loop
  trước, rồi mới bật.
- Trạng thái gốc không mất — file đối chiếu giữ đủ để khôi phục.

## Tradeoff

- Merchant phải **bật tay 37 contract**, và nếu quên thì khách không bị thu tiền kỳ nào cả —
  lỗi im lặng theo hướng ngược lại.
- Bỏ 88 Cancelled nghĩa là mất lịch sử của khách cũ trong Joy; muốn báo cáo churn/LTV theo dữ
  liệu Loop thì phải nhập lại bằng đường khác.
- Chỉ đúng khi merchant thật sự huỷ bên Loop; hai app cùng sống song song thì quyết định này
  không bảo vệ được gì.

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-08-28]] ·
[[2026-08-28-shipping-lay-gia-tu-rate-table]] (cùng phiên kookut/import) ·
[[subscriptions-debug-runbook]]
