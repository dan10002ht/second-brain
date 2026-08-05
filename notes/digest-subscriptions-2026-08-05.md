---
type: note
title: Digest Joy Subscription — 2026-08-05 (delivery-anchored billing cho Spray Farmacy)
summary: CHỈ phần mới — công thức tính Delivery/Charge date neo theo Delivery Day của khách (chống drift), gate "chỉ contract mới" ở 3 chỗ, và 2 gotcha nhỏ (helper gate theo shop, storefront không expose metafield của function).
tags: [subscription, shopify, billing, debug, avada]
created: 2026-08-05
source: project "subscriptions" (Joy Subscription) — session history
---

# Joy Subscription — digest 2026-08-05

> Các session mined lần này **trùng gần hết** với những gì đã ghi: freeze/bỏ
> `frozenDiscount` vì line attribute client-settable, one-time price bake vào metafield
> ($3.741 + lẫn currency), automatic discount không re-run mỗi billing attempt, mỗi app
> chỉ 1 cart transform, Shopify không gửi order-confirmation cho test order/dev store,
> block custom làm controller cho AOV, CLS in-app, portal preview, PubSub singleton,
> BigQuery cost → đã có ở [[digest-subscriptions-2026-07-24]],
> [[digest-subscriptions-2026-07-25]], [[digest-subscriptions-2026-07-27]],
> [[digest-subscriptions-2026-07-31]], [[digest-subscriptions-2026-08-03]],
> [[digest-subscriptions-2026-08-04]]. Dưới đây **chỉ** phần chưa nằm ở đâu cả.

## Techniques — delivery-anchored billing (nhánh `custom/delivery-date-spray`)

Custom cho Spray Free Farmacy: recurring order **neo theo Delivery Day** (thứ cố định
khách chọn) thay vì theo ngày đơn xử lý gần nhất.

- **Tính Delivery Date trước, Charge Date suy ra sau** (không tính ngược lại được).

  ```
  D = ngày [Delivery Day] gần nhất ≥ (today + 2 + frequency_days − 7)
  offset = 3 nếu D rơi Wed/Thu/Fri · 4 nếu D rơi Sat
  C = D − offset, chạy 00:00
  ```

  `+2` = lead time tối thiểu; `+frequency − 7` rồi snap về đúng Delivery Day.
  Thứ Bảy lùi 4 ngày vì đơn Fri & Sat được chuẩn bị **cùng lúc**.

- **`today` KHÔNG phải ngày dương lịch hiện tại** mà là **delivery date *dự kiến* của
  chu kỳ vừa xong**. Đây là chỗ dễ hiểu sai nhất và cũng là lý do công thức không drift:
  kết quả không đổi dù cron chạy lúc nào, dù đơn kỳ trước fail/charge trễ. Khái quát hoá
  ở [[lich-dinh-ky-neo-theo-ngay-du-kien]].
- **D luôn cùng thứ với delivery kỳ trước** (`deliveryAnchoredDates.js` lấy
  `prev.day()`) → bảng offset chỉ định nghĩa Wed/Thu/Fri/Sat là đủ cho contract hiện có;
  code fallback 3 ngày cho Sun/Mon/Tue. *Chưa xác minh:* BA chưa chốt chính thức offset
  cho Sun/Mon/Tue.
- **Chỉ tính & lưu `nextDeliveryDate`/`nextChargeDate` một lần mỗi chu kỳ**, ngay sau khi
  charge — để cron quét lại không ra kết quả khác.
- **Câu hỏi còn treo:** "00:00" theo timezone của shop hay của khách — chưa khai báo rõ.

### Gate "chỉ áp dụng contract mới"

Yêu cầu BA: contract cũ giữ nguyên logic cũ. Lần đầu code gate bằng **flag của shop** →
sai, vì flag bật là mọi contract ăn theo. Phải ghi cờ **lên chính contract lúc tạo** rồi
gate ở 3 chỗ: `prepareSubscriptionData` (ghi field), call site webhook contract-create,
và `backgroundHandler` sau billing attempt (`subscriptionContract?.delivery…`).
Cùng họ với bài học "cấu hình phải snapshot vào contract, không đọc live" ở
[[digest-subscriptions-2026-07-27]].

## Gotcha nhỏ

- **`moment-timezone` chỉ dùng trong file test** thì không làm nặng bundle production —
  và nó vốn đã là dependency sẵn của `packages/functions`. Trả lời trước khi user kịp lo
  "dùng moment có nặng không".
- **Storefront API không expose metafield `avada_fixed_bundle_variant`** dù function
  input đọc được → dùng storefront để kiểm "metafield có tồn tại không" cho kết quả
  **inconclusive**, đừng kết luận là không có.
- **Gate hành vi custom theo shop bằng helper trong `customShop.js`**, không rải điều
  kiện global: thêm constant domain + một hàm `isXxxShop()` (cùng pattern
  `isCustomRescheduleOrderShop`), store mới chỉ tốn 1 dòng.

## Liên kết

[[subscriptions]] · [[subscriptions-debug-runbook]] · [[digest-subscriptions-2026-08-04]] ·
[[digest-subscriptions-2026-07-27]] · [[lich-dinh-ky-neo-theo-ngay-du-kien]] ·
[[app-development]] · [[digest-subscriptions-2026-07-25]]
