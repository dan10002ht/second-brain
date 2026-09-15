---
type: decision
title: Plan tạm thời (PDF Invoice) — override ở tầng gate tính năng, không ở repository
summary: `getEffectivePlan(shop)` gộp plan gốc với plan tạm ngay chỗ đọc plan để mở tính năng, thay vì sửa doc shop ở repository — nên billing, report và mọi truy vấn theo `plan` vẫn thấy plan thật, và hết hạn tự rơi về cũ mà không cần cron.
tags: [pdf, invoice, avada, shopify, firestore, backend, architecture]
created: 2026-09-15
updated: 2026-09-15
review: 2026-12-15
source: project `pdf` — session history 2026-09-15 (ticket PDF-260908-6Q5eqc, MR 572, nhánh `feat/temporary-plan`)
---

# Plan tạm thời: override ở tầng gate, không ở repository

## Bối cảnh

CS cần mở plan Ultimate **3 tuần** cho một shop. App chưa có cơ chế cấp plan có hạn. Hai cách chèn:

| | Cách A — repository | Cách B — tầng gate (đã chọn) |
|---|---|---|
| Chèn ở đâu | Lúc đọc doc shop, thay luôn `shop.plan` | `getEffectivePlan(shop)` trong `config/getPlans.js`, chỗ quyết định mở tính năng |
| Billing/report nhìn thấy gì | Plan **giả** — mọi nơi đọc `plan` đều bị đổi | Plan **thật** — chỉ đường gate thấy plan tạm |
| Hết hạn | Cần job reset hoặc phải nhớ so ngày ở mọi chỗ | So ngày ngay lúc đọc, tự rơi về plan cũ |

Phương án thứ ba — `onSchedule` reset field sau 3 tuần — bị dantt loại ngay từ đầu: "tôi không muốn
tốn công chạy thêm một `onSchedule` để reset".

## Quyết định

**B.** Ba field trên doc `shops` (`temporaryPlan`, `temporaryPlanUntil` dạng Date → Firestore
Timestamp, và cờ nội bộ kiểu `isPartnerStore` của Joy Subscription), cộng một hàm gộp duy nhất ở
đúng chỗ đọc plan. Ghi field bằng `bulkUpdateShops` có chuẩn hoá input + whitelist field.

## Why

- **Ranh giới đúng.** Plan tạm là chuyện *quyền dùng tính năng*, không phải chuyện *shop đang trả
  tiền gói nào*. Đổi ở repository là nói dối với billing và report — một loại nợ rất khó truy sau
  vài tháng.
- **Không thêm thứ phải giữ sống.** Hết hạn được quyết bằng phép so ngày lúc đọc; không có job nền
  nào có thể chết âm thầm rồi để một shop giữ Ultimate vĩnh viễn.
- **Có tiền lệ trong nhà.** Joy Subscription đã dùng đúng mô hình cờ-trên-shop cho `isPartnerStore`.

## Tradeoff

- Mọi đường gate mới phải đi qua `getEffectivePlan`; ai đọc thẳng `shop.plan` để gate sẽ **bỏ sót
  plan tạm** — lỗi im lặng, không có gate nào bắt.
- Merchant **không** được báo gì: thấy Ultimate rồi tới hạn là mất. Dantt chốt không làm phần hiển
  thị ("ko cần làm phần hiển thị đâu") — chấp nhận rủi ro ticket "sao mất tính năng".
- Field sống trên doc shop nên xoá tay là lỡ tay được; không có audit log hai chiều như cờ DevZone
  của Joy Subscription ([[2026-09-10-devzone-mo-khoa-rich-text]]).

## Điều kiện xem lại (2026-12-15)

Nếu có ≥3 shop được cấp plan tạm, hoặc CS cần tự bấm thay vì nhờ dev ghi Firestore, thì đây phải
thành một action DevZone có audit, không còn là ba field ghi tay.

Liên quan: [[pdf]] · [[digest-pdf-2026-09-15]] · [[2026-09-10-devzone-mo-khoa-rich-text]] ·
[[chan-agent-bang-cau-hinh]] · [[controller-service-repository]]
