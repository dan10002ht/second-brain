---
type: decision
title: Backfill Bird — chỉ sửa đơn chưa charge, không redate, không chạm đơn quá khứ
summary: Chốt phạm vi backfill ở 11 contract / 117 đơn chưa charge và chỉ sửa location/method/cờ; 25 đơn quá khứ trên 7 contract giữ nguyên vì chúng không phải queue đóng băng, và phần ngày đã lỡ sửa thì khôi phục từ snapshot để app tự tính lại.
tags: [avada, subscription, shipping, debug, method]
created: 2026-09-14
updated: 2026-09-14
status: active
review: 2026-12-14
source: project `subscriptions` (worktree `fix/bird-delivery-attrs`) — session history 2026-09-14 (ticket enterprise sprayfreefarmacy)
---

# Backfill Bird — phạm vi dừng ở đơn chưa charge

## Bối cảnh

Sau khi MR !2581 lên prod (`v2.35.27`), dữ liệu cũ vẫn mang id Bird sai. Dry-run cho **11 contract /
117 đơn chưa charge**. Ngoài ra còn **25 đơn quá khứ trên 7 contract** cũng mang id sai, và một cám
dỗ thứ ba: sửa luôn `Delivery Date` trên contract cho khớp `Delivery Day` của từng người.

## Quyết định

1. **Sửa**: 128 doc thuộc 11 contract có đơn **chưa charge** — chỉ các trường
   location / method / cờ `birdIntegrated`.
2. **Không chạm** 25 đơn quá khứ trên 7 contract.
3. **Không redate**: phần ngày đã lỡ sửa trong lượt trước được **khôi phục từ snapshot**, giữ nguyên
   phần location/method/cờ đã verify đúng.
4. Một chỉnh lại quan trọng so với báo cáo đầu: **đơn thật sự gửi đi phần lớn KHÔNG sai ngày** — con
   số "~100 đơn mang ngày sai" tôi nói lúc đầu là sai phạm vi.

## Why

- **Đơn chưa charge là thứ duy nhất còn ảnh hưởng tới khách.** Khách enterprise quan tâm đơn sắp tới
  route đúng chỗ, không quan tâm lịch sử trông thế nào.
- **25 đơn quá khứ không phải queue đóng băng.** Bằng chứng phân biệt: TJ Bodke đang ở cycle 14 mà
  cycle 1 và 3 vẫn `UNBILLED` với ngày cũ — đó là **rác lịch sử của một luồng đã đi qua**, không
  phải đơn đang chờ gửi. Sửa chúng không đổi gì ở Bird, chỉ thêm rủi ro ghi nhầm.
- **Redate là thừa sau khi code đã live.** `birdIntegrated` đã bật và code đã deploy ⇒ **app tự tính
  lại ngày** ở lần charge kế. Ngày trên đơn chưa charge không quyết định đơn thật. Tự sửa tay ở đây
  là ghi đè lên thứ hệ thống sắp tự làm đúng — đúng lớp lỗi "backfill ghi đè" đã gặp ở SB-14649
  ([[shipped-subscriptions-2026-07-25]]).

## Tradeoff

- **Mất**: lịch sử đơn trong app vẫn hiện id/ngày sai ở 25 dòng. Ai mở lịch sử ra đọc sẽ thấy dữ
  liệu không khớp thực tế, và không có ghi chú nào trên chính bản ghi nói vì sao. Nếu sau này cần
  báo cáo theo zone trên dữ liệu lịch sử thì 25 dòng đó sẽ làm lệch.
- **Được**: bề mặt ghi vào prod nhỏ nhất có thể (128 doc, đã verify trước/sau bằng scan độc lập:
  sai namespace 1 → 0, id Bird không biết 8 → 0, pickup thiếu tên location 0), và không giành việc
  với cơ chế tự tính của app.
- **Rủi ro còn lại**: nếu app **không** tự tính lại ngày như giả định (chưa xác minh qua một chu kỳ
  charge thật tại thời điểm chốt), 11 contract này sẽ cần một lượt sửa nữa. Mốc kiểm là ngày charge
  kế của từng khách — sớm nhất là Tara Hamilton 27/09.

## Việc phải làm tiếp

- Đối chiếu lại sau chu kỳ charge đầu tiên (từ 27/09) để đóng giả định "app tự tính lại ngày".
- Commit sửa lỗi đọc tham số của script backfill đang nằm trên nhánh **đã merge** → cần một MR nhỏ
  nữa, nếu không lần chạy sau lại vấp đúng chỗ đó.

Liên quan: [[digest-subscriptions-bird-2026-09-14]] · [[ack-khong-phai-hieu-ung]] ·
[[bang-chung-phan-biet-duoc]] · [[subscriptions]]
