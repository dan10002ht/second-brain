---
type: resource
title: Lịch định kỳ neo theo ngày dự kiến, không theo ngày xử lý thực tế
summary: Mọi scheduler định kỳ (billing, giao hàng, cron nghiệp vụ) nên tính kỳ kế từ mốc *dự kiến* của kỳ trước — lấy ngày xử lý thực tế làm mốc thì lịch trôi dần mỗi lần chậm/fail.
tags: [patterns, system-design, billing, subscription]
created: 2026-08-05
updated: 2026-08-05
source: project "subscriptions" (Joy Subscription) — session history, xem [[digest-subscriptions-2026-08-05]]
---

# Lịch định kỳ: neo theo ngày dự kiến, không theo ngày xử lý

## Vấn đề (drift)

Cách tự nhiên nhất để tính kỳ kế là `next = now + frequency` hoặc
`next = ngày xử lý kỳ trước + frequency`. Cả hai đều **trôi**: mỗi lần job chạy trễ,
retry, hoặc đơn fail rồi charge bù, mốc bị đẩy thêm — sau vài chu kỳ khách nhận hàng
lệch hẳn ngày mong đợi, và kết quả **phụ thuộc lúc cron quét** (không tất định).

## Cách làm

1. **Mốc = giá trị *dự kiến* đã lưu của kỳ trước** (intended date), không phải thời điểm
   xử lý thực tế, không phải `now`.
2. **Snap về mốc nghiệp vụ** nếu có (thứ cố định trong tuần, ngày cố định trong tháng):
   `next = mốc-nghiệp-vụ gần nhất ≥ (intended_trước + lead_time + frequency − chu_kỳ_snap)`.
3. **Tính một lần mỗi chu kỳ** — ngay sau khi kỳ hiện tại chạy xong — rồi **lưu** kết quả
   (`nextDeliveryDate`, `nextChargeDate`…). Không tính lại mỗi lần cron quét.
4. **Suy các mốc phụ từ mốc chính**, một chiều: giao hàng → charge (charge = giao − lead
   time), không tính ngược lại. Ngược chiều sẽ mâu thuẫn khi lead time đổi theo thứ.
5. Khai báo rõ **timezone** của mốc "00:00": của merchant hay của khách — chỗ này im lặng
   là lệch nguyên một ngày.

## Kiểm chứng

Test bằng lịch tham chiếu cố định (chọn một ngày mốc, liệt kê các thứ trong tuần) và
đối chiếu từng ví dụ trong doc nghiệp vụ. Property đáng khẳng định: **chạy lại nhiều lần
ở nhiều thời điểm khác nhau phải ra cùng kết quả** — đây chính là thứ mà cách "neo theo
ngày xử lý" không đảm bảo được.

## Liên quan

[[digest-subscriptions-2026-08-05]] · [[subscriptions]] · [[caching-layers]] ·
[[controller-service-repository]] · [[subscriptions-debug-runbook]]
