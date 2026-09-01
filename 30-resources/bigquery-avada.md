---
type: resource
title: BigQuery ở các app Avada — cost, partition/shard, và pipeline Firestore→BQ
summary: Trang gốc cho mọi thứ BigQuery ở Avada — cost bị phồng vì attribution sai chứ hiếm khi vì query nặng, pruning chỉ chạy khi filter đúng cột partition, và bảng shard/mirror hỏng âm thầm cho tới khi UI crash.
tags: [bigquery, cost, firestore, avada, performance]
created: 2026-09-01
updated: 2026-09-01
source: [[subscriptions-debug-runbook]] · [[subscription-digest-2026-07-10]] · [[subscription-digest-2026-07-13]] · [[subscription-digest-2026-07-15]] · [[digest-subscriptions-2026-07-19]] · [[digest-subscriptions-2026-07-24]] · [[digest-subscriptions-2026-07-28]] · [[digest-subscriptions-2026-08-13]] · [[shipped-subscriptions-2026-08-11]] · [[digest-pdf-2026-07-23]] · [[crm]]
---

# BigQuery ở Avada

> Trang gom cụm 14 note nhắc BigQuery trải trên 4 project (subscriptions, pdf, crm, backup).
> Trước khi có nó, mỗi lần chạm lại phải đọc lại từng digest.

## Trang này là gì

BigQuery ở Avada **không phải data warehouse để phân tích tự do**. Nó là bản mirror của
Firestore (dataset `firestore_sync`) phục vụ đúng vài màn hình trong app: log hợp đồng,
upcoming orders, changelog sản phẩm. Ba hệ quả nằm ở mọi note trong cụm:

1. **Cost do sai attribution nhiều hơn do query nặng.**
2. **Pruning là mặc định TẮT** — chỉ bật khi query viết đúng kiểu.
3. **Mirror sai lệch âm thầm**; nó chỉ lộ khi UI crash hoặc số liệu vô lý.

## Khi nào mở trang này

- Trước khi chạy bất kỳ query cost/billing nào (rất dễ đo nhầm app).
- Khi hoá đơn GCP nhảy và cần biết chỗ nào đáng nghi trước.
- Khi một màn hình đọc BQ trả thiếu dữ liệu / 500 mà Firestore vẫn đúng.
- Trước khi mirror prod → staging.

## 1. Attribution — đo nhầm là mặc định

| Bẫy | Hậu quả thật đã gặp | Nguồn |
|---|---|---|
| Bảng billing-export **gộp cost mọi project Avada** | Không filter `project = avada-subscription-app` → cost phồng **~7×** (báo $6, thật ~$0.8), từng dẫn tới chẩn đoán sai | [[subscription-digest-2026-07-13]] · [[subscription-digest-2026-07-10]] |
| `gcloud`/`bq` lấy project từ **config toàn cục của máy**, không theo `cwd` | Đang ở `~/projects/pdf` nhưng default là `avada-subscription-app` → suýt chạy cost query lên nhầm app. Luôn `--project` tường minh | [[digest-pdf-2026-07-23]] |
| Query đến từ **Service Account**, không phải từ dòng code | Job `subscriptionPlans_latest` đến từ SA `avada-subscription-app@appspot.gserviceaccount.com`; soi cost phải quy về SA rồi mới lần ngược về caller | [[subscription-digest-2026-07-15]] |
| Chart billing console ≠ resource-level export | Console tính thêm slot cost không có trong export → **không reconcile chính xác được** với `INFORMATION_SCHEMA`; đừng cố khớp hai con số | [[subscription-digest-2026-07-13]] |
| Spike cost tưởng là rò rỉ | $3→$4 hoá ra là **burst traffic một ngày**; tăng `maxInstances` chỉ làm đắt thêm | [[digest-subscriptions-2026-08-13]] |

## 2. Pruning — quy tắc viết query

Chi tiết thao tác nằm ở [[subscriptions-debug-runbook]] mục 2; đây là phần *vì sao*:

- Bảng prod partition theo `timestamp` (DAY) + clustered (`shop_id`, `subscription_contract_id`).
  **Staging không có partition spec** → mirror phải backup → `DROP + CREATE` → verify `diff=0`,
  vì BQ không cho `CREATE OR REPLACE` đổi partition spec.
- **View có `ORDER BY` chặn partition pruning** → query thẳng base table. Đây là loại lỗi
  không báo gì cả, chỉ thấy tiền. Hiệu quả quan sát được: no-filter 962 MB → 90 ngày 249 MB → 7 ngày thấp hơn nữa.
- **CTE đặt điều kiện quá muộn cũng không prune.** Thủ phạm ~$85/ngày là stored proc
  `firestore_sync.get_subscription_logs`: các CTE để `WHERE @target_shop` ở ngoài / theo pattern OR.
  Fix đúng là **sửa procedure** (đẩy `shopId` + date-range vào từng CTE), không rewrite caller. [[subscription-digest-2026-07-15]]
- Một `CALL` spawn ~6 child query, mỗi call scan ~26.85 GB (~$0.13) trước khi tối ưu.
- Thêm cluster là **DDL thuần**, không cần deploy code: `ALTER TABLE ... SET OPTIONS (clustering_fields=...)`.
- Luôn `bq` **dry-run xem bytes trước** khi chạy thật — quy tắc của user, không phải gợi ý.

## 3. Bảng shard / mirror hỏng âm thầm

- **Shard thiếu cột → crash trang, không phải trả thiếu dữ liệu.** Bảng orders là monthly shard
  `orders_<mmm>_<yy>` chọn theo `shop.installedAt`; script tạo shard hằng tháng không cập nhật sau
  migration nên shard từ `JUN_26` chỉ có 23 cột thay vì 25 (thiếu `cycle_start_at`, `cycle_end_at`)
  → procedure `orders.upcoming_orders` ném `Unrecognized name` → Order Detail 500 (SB-14774). [[digest-subscriptions-2026-07-28]]
- **`ROW_NUMBER() OVER (PARTITION BY ...)` trong stored proc = giới hạn dữ liệu người dùng thấy.**
  `get_upcoming_orders` khiến shop kookut có 829 đơn UNBILLED nhưng tab chỉ hiện 83. Con số "ít bất
  thường" trên UI nên nghi procedure trước khi nghi data. [[digest-subscriptions-2026-08-13]]
- **Changelog vẫn liệt kê thứ đã xoá.** "Select all products" đọc changelog BQ, mà changelog còn cả
  sản phẩm merchant đã xoá trên Shopify; `sellingPlanGroupCreate` là all-or-nothing nên **một id chết
  làm hỏng cả plan** (JSUB-260806). Cơ chế dọn: xoá doc mirror `shopifyProducts` → trigger `onWrite`
  append row `operation: DELETE` → `get_shopify_products_latest` lọc ra. [[shipped-subscriptions-2026-08-11]]
- **Field camelCase khi insert vào BQ** từng là bug pipeline ở crm; backfill chia 2 phase (SQL rồi API,
  phân trang cursor 1 page/call). [[crm]]

## 4. BQ như công cụ điều tra (không chỉ để báo cáo)

`firestore_sync.subscriptionContracts_changelog` cho phép dựng **timeline per-write tới ms** (contract
vs order) để chứng minh thứ tự ghi stale — cách đã dùng để chứng minh race auto-swap lúc contract-create
thay vì đoán. Luôn filter đúng partition (1 ngày) + cluster key và dry-run trước.
[[digest-subscriptions-2026-07-19]] · [[digest-subscriptions-2026-07-24]]

## Xem thêm

[[subscriptions-debug-runbook]] giữ phần **thao tác** (lệnh `bq`, dry-run, mirror prod→staging);
trang này chỉ giải thích *vì sao*, không copy lại. Cùng họ với [[caching-layers]] ở chỗ chi phí thật
nằm ở tầng nào đọc dữ liệu, không ở công nghệ.

## ⚠️ Chưa xác minh

- Dataset/bảng billing cụ thể của app **pdf** (`pdf-invoice-4717c`) — [[digest-pdf-2026-07-23]] dừng
  trước khi chạy được query.
- Các con số cost ở trên là **giá trị đo tại thời điểm note gốc** (tháng 7–8/2026), không phải hiện trạng.
- Pipeline BQ của `backup` và `shipping-labels` chưa được đọc trong lần distill này.
