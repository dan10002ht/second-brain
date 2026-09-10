---
type: decision
title: Ẩn dòng "then $X every month" bằng cờ DevZone tường minh, không suy ra từ autoSwap
summary: Bỏ phương án "plan có bật autoSwap thì không đẩy `pricingPolicies.recurring` lên Shopify" và thay bằng một toggle DevZone theo shop cộng một nút repush — vì `autoSwap` không có mặt ở chỗ build payload, còn plan cũ thì `isEqualPlan` so bằng `JSON.stringify` nên save lại không đẩy gì.
tags: [avada, subscription, shopify, billing]
created: 2026-09-10
updated: 2026-09-10
status: active
review: 2026-12-10
source: project `subscriptions` — session history 2026-09-10 (MR !2573)
---

## Quyết định

Chuỗi `First payment $780.95, then $775.95 every month` ở checkout là **Shopify tự render** từ
`pricingPolicies` mình gửi lên, không phải text app đẩy. Khách muốn bỏ vế `then …`.

- **Bỏ** phương án đầu: *"plan nào bật `autoSwap` thì không gửi `pricingPolicies.recurring`"* — đã
  implement 4 file, có test, rồi **revert nguyên trạng**.
- **Chốt**: một **toggle DevZone theo shop** (`Hide recurring pricing policy`, DevZone → General →
  card *Feature management* → mục *Checkout*). Bật cờ ⇒ từ đó về sau mọi lần create/update plan không
  gửi `pricingPolicies.recurring`.
- Kèm một **nút repush** ngay cạnh toggle, vì plan đã tồn tại không tự cập nhật.

## Why

- **`autoSwap` không có mặt ở chỗ cần dùng.** Nó nằm trong `dataSubscriptionProduct` của form plan, ở
  một tầng dữ liệu khác với chỗ build payload `sellingPlanGroupCreate/Update`. Muốn dùng nó phải kéo
  một field xuyên nhiều tầng chỉ để suy ra một hành vi hiển thị — nối hai thứ không liên quan về ngữ
  nghĩa vào nhau.
- **Suy diễn ngầm thì không tắt được.** Merchant không có cách nào chọn; hành vi checkout đổi vì một
  cờ có mục đích hoàn toàn khác. Cờ tường minh nói đúng cái nó làm.
- **Save lại không đủ để đẩy plan cũ.** `isEqualPlan` so bằng `JSON.stringify` trên bản đã lọc, mà
  payload cũ và mới **giống nhau ở phía app** — nên không có gì để push. Đó là lý do phải có nút repush
  riêng, và cũng là lý do phương án ngầm sẽ im lặng không áp cho plan hiện có.
- **Rủi ro giới hạn ở hiển thị, đã kiểm chứ không đoán.** Tiền charge vẫn đúng vì app tự đẩy giá theo
  kỳ qua billing cycle edit, và `handleSyncEditedContractToCurrentCycle` **có chạy** với discount 2
  tier. Điểm treo về email cũng đã đóng: `afterCyclesPrice` chỉ được đọc ở đúng một chỗ
  (`emailService.js:1430`).
- Repo đã có sẵn pattern DevZone bật tính năng theo shop — đi theo pattern có sẵn thay vì hardcode
  domain. Cùng nguyên tắc với [[chan-agent-bang-cau-hinh]]: cấu hình là rào chắn, suy diễn là lời nhắc.

## Tradeoff

- **Mất lưới an toàn hiển thị.** Không gửi `pricingPolicies.recurring` nghĩa là Shopify không còn mô tả
  giá kỳ sau ở checkout; nếu một ngày app đẩy sai giá per-cycle thì không còn chỗ nào đối chiếu được
  trước khi charge.
- **Cờ theo shop, không theo plan.** Shop bật cờ thì mọi plan đều bị ảnh hưởng — không có ca "một plan
  ẩn, plan khác giữ". Nếu sau này cần độ mịn đó thì phải thiết kế lại chỗ lưu cờ.
- **Nút repush là thao tác tay.** Ai bật cờ mà quên bấm sẽ thấy plan cũ vẫn hiện `then …` và tưởng cờ
  hỏng. Không có gì tự nhắc.
- Cùng MR có refactor `sellingPlanVariables` sang object param (11 call site) — MR gọn hơn nhưng
  revert cờ sau này sẽ kéo theo cả refactor.

Liên quan: [[digest-subscriptions-2026-09-10]] · [[subscriptions]] ·
[[feedback-feature-moi-mac-dinh-opt-in]] · [[chan-agent-bang-cau-hinh]]
