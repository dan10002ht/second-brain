---
type: note
title: Digest Joy Subscription 2026-07-13 — installment storefront ship, cart-transform≠subscription, workflow/rtk insight, BigQuery cost multi-project
summary: Learning MỚI so với horizon-digest + digest 07-12 — cart-transform chỉ one-time (không subscription), expansion sub nằm ở contract-create; 2 quy ước cycleIndex; property _prefix ẩn/hiện; convert snippet→Horizon block; ẩn badge native AOV + đọc giá render (tránh double-discount); rtk/Serena chỉ tối ưu leaf-ops; BigQuery billing gộp nhiều project → phồng ~7×.
tags: [subscription, shopify, storefront, debug, bigquery]
created: 2026-07-13
source: subscriptions (session history — chưa xác minh hết chi tiết)
---

# Digest — Joy Subscription (2026-07-13)

> CHỈ chứa phần MỚI. Loạt gotcha Horizon theme block (`{% javascript %}` nesting,
> color-scheme var, Theme Check MCP không bắt lỗi live-editor, metafield `.value`,
> `[hidden]` override, `variant:update`/`variant:selected` + `data-variant-id` instant,
> `all_products[handle]` rỗng tới khi publish, `synthBundleMetafieldFromDoc` cho variant-tay)
> ĐÃ nằm trong [[subscription-installment-horizon-digest]] — KHÔNG lặp lại.
> Rule vol-reprice / update installment chỉ đụng metafield → [[subscription-digest-2026-07-12]].

## Feedback (cách làm việc)

- **Được đưa 1 ví dụ lỗi → phải audit TOÀN BỘ, không chỉ sửa đúng chỗ được chỉ.**
  User: "ở trên là 1 ví dụ… sao chỉ check sửa mỗi chỗ mà t bảo vậy?". Sau đó phải
  render mockup ra ảnh rồi rà từng phần widget. → mở rộng [[feedback-follow-conventions]]
  (quét hết chỗ tương tự) sang cả UI/mockup, không chỉ code.
- **Có mockup thì COPY CSS gốc, đừng áng chừng.** Badge sai nhiều lần vì tự phỏng đoán;
  chỉ đúng khi trích thẳng `.pbadge` (thiếu `::after` = mũi tam giác hình cái tag).
- **Workflow tuần tự phải TỰ launch các phase, đừng dừng hỏi giữa chừng.** User: "workflows
  phải tự lauch luôn chứ?" — khi đã chốt chạy tuần tự thì HARD STOP chỉ ở gate cần review,
  không hỏi lại từng phase. → [[subscription-work-style]].

## Techniques / Insight

- **rtk + Serena chỉ tối ưu leaf-ops (đọc/tìm), KHÔNG giảm token phần nặng nhất = generation
  của agent trong workflow.** Token hết nhanh dù có rtk+Serena vì đó là chi phí produce/verify.
  Đòn bẩy thật: **hạ effort tier theo phase** (phase cơ học → effort thấp). Verify agent
  ĐÃ thực gọi Serena bằng cách grep transcript agent (`activate_project`, `find_symbol`…),
  đừng tin "đã bake instruction vào prompt".
- **Convert snippet Liquid phẳng → Horizon theme block**: thêm `{% schema %}`, schema `name`
  ≤25 ký tự; merge locale keys vào theme `locales/en.default.json` — file này có **comment
  header `/* */`** (kiểu Horizon) nên KHÔNG `JSON.parse` thẳng được (chèn textual, giữ comment).
  Repo chỉ track `blocks/`, không track theme locales (theme thật ở `.temp`).

## Bugs / Gotchas (mới)

- **`cart-transform` chỉ dùng cho mua ONE-TIME, KHÔNG cho subscription.** (user correction:
  "khi mua theo subscription thì có ăn theo logic cart transform đâu ??? ngáo à"). Với
  subscription, bundle expansion origin xảy ra ở **contract-create**: `executePreContractProcessing`
  → `executeJobsBeforeCreateContract` → `orderEditBegin` edit **origin order** thêm children @$0.
  Đừng suy từ cart-transform sang subscription.
- **2 quy ước `cycleIndex` khác nhau trong code** → "cycle" KHÔNG map 1-1 với 1 con số duy nhất.
  Phải verify từng chỗ, đừng phán bừa.
- **Origin order khác nhau theo mode**: `partial` = origin + mọi cycle synth children @$0;
  `defer-last` = origin KHÔNG thêm children, chỉ **payment cuối 1 lifecycle** mới giao toàn bộ.
  (làm rõ [[2026-07-08-installment-mode-design]]).
- **Line-item property tiền tố `_` bị Shopify ẩn khỏi cart/checkout; không tiền tố = hiện.**
  Cần cả 2: `_joy_installment_mode` (logic, ẩn) + `Shipping preference` (hiện cho khách xem).
- **AOV widget + installment/subscribe**: badge native AOV = `.AOV-SubscriptionsWidget__DiscountBadge`
  → ẩn bằng CSS scope `.aovc-ready` (chỉ ẩn khi block active). Giá phải **đọc số AOV render thật**
  (`.AOV-SubscriptionsWidget__OptionPrice`, `toCents`) chứ đừng tự tính lại → tự tính = double-discount
  (compound sub% × volume%). (bổ sung điểm "đọc giá render, scrape fragile" ở [[subscription-installment-horizon-digest]]).

## Ops / BigQuery (bổ sung runbook)

- **Billing export table gộp cost NHIỀU project của Avada** → aggregate không filter →
  cost phồng ~7× (báo $6 hóa ra ~$0.8). Luôn filter `project = avada-subscription-app`.
  Chart console (billing report) còn có thể tính thêm slot cost KHÔNG có trong resource-level
  export → khó reconcile chính xác với INFORMATION_SCHEMA. → [[subscriptions-debug-runbook]].
- **Order "from Joy Subscription App (via import)" (không phải "Online Store")** = order tạo
  qua custom script/Storefront API, không phải SDK/headless. Dấu hiệu flow mua bất thường
  (store không có `AVADA_SUBSCRIPTION_HEADLESS`, không dùng Joy box). (chưa xác minh sâu)

## Liên quan
- [[subscription-installment-horizon-digest]] · [[subscription-digest-2026-07-12]] · [[subscription-digest-2026-07-11]] · [[subscriptions]] · [[subscriptions-debug-runbook]] · [[2026-07-08-installment-mode-design]] · [[subscription-work-style]] · [[feedback-follow-conventions]]
