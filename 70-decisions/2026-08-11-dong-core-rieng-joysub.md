---
type: decision
title: Dòng @avada/core riêng "5.0.0-joysub.N" thay vì giữ bản 4.8.0-alpha.18 tự làm
summary: Joy Subscription lên đường token của CTO (5.0.0-alpha.7) rồi rẽ nhánh riêng publish `5.0.0-joysub.N` với npm dist-tag `joysub`; bỏ hẳn dòng `4.8.0-alpha.18` tự làm trước đó.
tags: [subscription, shopify, auth, nodejs, avada]
created: 2026-08-11
updated: 2026-08-11
review: 2026-11-11
source: project "subscriptions" (+ repo `avada-core`) — session history
---

Chốt ngày 2026-08-11:

1. **Bỏ dòng `4.8.0-alpha.18`** (bản dantt tự làm để xử lý offline token hết hạn), lên dòng
   của CTO `5.0.0-alpha.7`, **giữ nguyên lớp app**.
2. Không bump tiếp `latest` và cũng không mở dòng thứ ba kiểu `4.8.0-alpha.19`: rẽ nhánh
   `fix/token-hardening` từ `origin/feature/get-valid-shop-token` và publish
   **`5.0.0-joysub.N`** với **npm dist-tag `joysub`** (`latest` vẫn thuộc về CTO).
   Đã ra `joysub.1` → `joysub.2` (port fix của alpha.9) → `joysub.3` (vá 7 gap so với alpha.12).
3. **Cache token nằm ở app, không ở core** — core không được ép Redis lên app không dùng Redis.

## Why

- Chất lượng không phải lý do — bản `.18` viết chắc. Lý do là **dòng chảy**: CTO còn push tiếp
  (alpha.9 → alpha.12 xuất hiện ngay trong lúc làm), nên bám dòng của CTO thì mỗi lần họ sửa
  là mình được hưởng, còn giữ dòng riêng hoàn toàn thì mãi mãi phải tự port.
- Tên `5.0.0-js.1` bị bác: `js` trong `package.json` người thứ ba đọc ra "javascript", không
  đọc ra "joy subscription". `joysub` không nhập nhằng.
- dist-tag riêng giải đúng bài toán "nhiều người cùng bump một dòng" mà npm sinh ra để giải:
  hai dòng cùng tồn tại trên registry, không ai đè ai.

## Tradeoff

- **Vẫn phải tự port.** joysub rẽ khỏi alpha.7 nên mọi bản CTO ra sau (alpha.9, .12, …) đều
  phải đối chiếu tay. Đúng lúc publish `joysub.2` thì CTO đã ở alpha.12 — và đối chiếu lòi ra
  **7 gap, 2 CRITICAL** trong bản vừa publish. Chi phí này lặp lại mỗi lần CTO push.
- Không có source TS gốc của alpha.9+ (CTO không push), nên phần port dựng lại từ bản **build**
  — mức tái tạo cao nhưng không phải cùng source; rủi ro lệch âm thầm tồn tại.
- `latest` và `joysub` cùng sống → ai cài nhầm tag sẽ nhận bản khác hẳn. Phải khoá tag trong
  `package.json` của app.
- Cache ở app: mỗi app dùng core phải tự làm lại lớp cache (lặp code), đổi lấy việc core không
  kéo Redis vào app không cần.

## Điểm phải xem lại vào 2026-11-11

- CTO đã merge `feature/get-valid-shop-token` vào `main` chưa. Nếu rồi, chi phí giữ dòng riêng
  đổi bản chất — có thể nên đóng dòng `joysub` và về `latest`.
- Số lần phải port thêm kể từ 08-11. Nếu >2 lần nữa mà lần nào cũng lòi gap CRITICAL, quyết
  định này đang trả giá cao hơn dự tính.

→ [[digest-subscriptions-2026-08-11]] · [[shopify-token-exchange-migrate-offline-token]] ·
[[avada-core]] · [[subscriptions]] · [[feedback-follow-conventions]]
