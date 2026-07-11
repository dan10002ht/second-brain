---
type: note
title: Digest Joy Subscription 2026-07-10 — Redis prod probe, BQ cost attribution, AOV widget controller
summary: Learning MỚI — cách soi Redis prod qua GCE+IAP tạm, bẫy attribution cost BigQuery (billing export chung project), pattern biến block custom thành controller cho AOV widget, và gotcha widget subscription (one-time do AOV render).
tags: [shopify, subscription, debug, storefront, redis, bigquery]
created: 2026-07-10
updated: 2026-07-10
source: subscriptions (session history — chưa xác minh hết chi tiết)
---

# Digest — Joy Subscription (2026-07-10)

> CHỈ chứa phần MỚI so với [[subscription-installment-horizon-digest]] (07-08),
> [[subscription-digest-2026-07-09]] và [[subscriptions-debug-runbook]].
> "chưa xác minh" = chưa confirm hết chi tiết trong session. Proposal chờ brain-learn duyệt.

## Techniques — Ops

- **Soi Redis prod (MemoryStore private) từ Cloud Shell qua GCE tạm + IAP.** Redis prod chỉ có internal IP (không expose ra ngoài). Quy trình:
  1. Tạo VM tạm cùng VPC (`redis-check-tmp`, zone `us-central1-a`).
  2. `gcloud compute ssh redis-check-tmp --tunnel-through-iap --command='python3 -c "..."'` — chạy **raw RESP client bằng socket** (`SCAN <cursor> MATCH <pattern> COUNT 500` → `GET`/`TTL`) tới `redis_ip:6379`. KHÔNG cần cài `redis-cli`.
  3. **Xoá VM ngay sau khi xong**: `gcloud compute instances delete redis-check-tmp --zone=... --quiet`.
  - Gotcha: **Cloud Shell không có egress ra apt mirror** (debian.map.fastly.net unreachable) → đừng cố `apt install redis-tools`; dùng `python3` socket có sẵn.
  - Warning `Regional Access Boundary ... 404 Account not found` là **vô hại**, lệnh vẫn chạy/xoá thành công — ignore.

- **Attribution cost BigQuery — 3 bẫy hay tính sai:**
  - **Billing export table dùng CHUNG cho nhiều project của Avada** → phải filter đúng `project = avada-subscription-app`, không thì cost bị inflate ~7×.
  - Job như `subscriptionPlans_latest`/`subscriptionContracts_changelog` chạy dưới SA scheduled `avada-subscription-app@appspot.gserviceaccount.com`, **không phải từ code handler** → "tôi không gọi bảng đó trong code" ≠ cost = 0.
  - Line **"regex fail (unknown, PROC/DECLARE queries)"** trong breakdown = query từ **stored procedure** (`firestore_sync.get_subscription_logs`) — thủ phạm chính quét `subscriptionContracts_changelog_partitioned_clean`. Soi caller (`contractLogController.js`) để biết luôn có `shopId`+`startDate/endDate` → prune được.
  - Số resource-level export (INFORMATION_SCHEMA) **không reconcile chính xác** với chart billing console (chart cộng thêm slot/khác) → đừng đuổi theo con số khớp tuyệt đối.

## Techniques — Storefront (bổ sung theme-block pattern)

- **Pattern "controller" cho widget app khác (AOV):** thay vì reimplement, biến block custom thành *controller* điều khiển widget AOV native:
  - `display:none !important` block AOV gốc (`.Avada-Bundle-Offer__Volume`).
  - Programmatically **click/select `role="radio"` item** của AOV để drive add-to-cart; đọc giá từ global `AVADA_BUNDLE` (nguồn authoritative), không scrape.
  - Tránh **duplicate CSS**: widget dùng `{% stylesheet %}` → thêm hide-rule vào đó, đừng chèn `<style>` riêng.
  - **Luật badge AOV volume** (soi từ config live): chỉ tier `isDefault` hiện **badge GLOBAL** (`setting.volumeDiscount.badgeText`); `badgeText` riêng của từng tier chỉ hiện khi tier có `isShowBadgeEachTier: true`. (Config có badgeText mọi tier nhưng AOV không hiện hết.)

- **Widget subscription — gotcha option:**
  - Option **"one-time" do app AOV render**, không phải block custom. Khi variant `requires_selling_plan: true` → phải **ẩn one-time** + **auto-select subscribe** (nếu không khách thấy radio trống → add-to-cart hụt). Auto-select phải **gate để không đè default option merchant đã set**.
  - Discount của subscription **ăn thẳng vào giá** (baked vào price), không phải discount code → có thể "mô phỏng" giá cho sản phẩm swap kể cả khi sản phẩm đó không setup selling plan.
  - "From 2nd payment..." phải phản ánh **discountValue của frequency đang chọn + discount volume**; giá gạch dùng `compare_at_price` kết hợp.
  - **Volume block gating**: chỉ hiện khi sản phẩm có subscription/selling plan; **ẩn volume block khi có installment block**.

## Liên quan
- [[subscriptions]] · [[subscription-installment-horizon-digest]] · [[subscription-digest-2026-07-09]] · [[subscriptions-debug-runbook]] · [[firestore-multitenant]] · [[app-development]]
