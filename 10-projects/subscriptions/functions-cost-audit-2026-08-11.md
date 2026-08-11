---
type: note
title: Audit chi phí Cloud Functions — Joy Subscription (2026-08-11)
summary: apiHookV2 chạy v2 tốn ~$36/tháng, gần bằng đúng chi phí nếu ở v1 — concurrency 10 không tiết kiệm gì vì in-flight chỉ 0.34; 38 hàm v1 còn lại KHÔNG nên migrate (sẽ đắt thêm ~$29/tháng).
tags: [subscription, firebase, cloud, cost, performance]
created: 2026-08-11
updated: 2026-08-11
source: Cloud Monitoring API + gcp_billing_export (project avada-subscription-app), 30 ngày tính đến 2026-08-11
---

# Audit chi phí Cloud Functions — Joy Subscription

Nền lý thuyết: [[functions-pricing-v1-v2]]. Note này là **số thật của prod**, không phải ước tính.

## 0. Model đã được đối chiếu với hoá đơn thật

Trước khi tin bất kỳ con số nào bên dưới — model tính giá đã được kiểm với `gcp_billing_export`:

| SKU (30 ngày, project `avada-subscription-app`) | Hoá đơn thật | Model | Lệch |
|---|---|---|---|
| Cloud Run functions CPU (gen2) us-central1 | $55.70 | $55.38 | −0.6% |
| Cloud Run functions Memory (gen2) us-central1 | $10.05 | $10.01 | −0.4% |
| Cloud Run functions (1st Gen) CPU + Memory + Invocations | $39.46 | $39.68 | +0.6% |

> ⚠️ `gcp_billing_export` chứa **toàn bộ billing account** (25+ project, tổng $4.4k/30d).
> Phải lọc `project.id = "avada-subscription-app"` — không lọc thì đọc nhầm sang `air-reviews` ($1,407).

## 1. Tiền đang đi đâu — $317/tháng cho cả project

| Khoản | $/30d | |
|---|---:|---|
| **Cloud Functions (tất cả SKU)** | **117.84** | **37%** |
| — gen2 CPU | 55.70 | `apiHookV2` + `productWebhookSubscriberV2` |
| — gen1 CPU | 31.51 | 38 hàm |
| — gen2 Memory | 10.05 | |
| — gen2 Invocations | 8.24 | |
| — gen1 Memory | 5.51 | |
| — gen1 Egress | 4.39 | |
| — gen1 Invocations | 2.44 | |
| BigQuery Analysis | 54.55 | |
| Redis M1 | 34.99 | |
| Firestore Read Ops | 33.77 | |
| Firestore Entity Writes | 12.35 | |
| Còn lại (Build, Hosting, Pub/Sub, GCE…) | ~63 | |

Functions là khoản lớn nhất, nhưng **2 function gen2 chiếm 63% chi phí Functions** — đó là chỗ đáng soi, không phải 38 hàm v1.

## 2. `apiHookV2` — verdict: cấu hình ổn, nhưng concurrency không làm gì cả

### Số thật (window **sau** khi vá pubsub leak, 23/07→11/08, scale về 30 ngày)

| Chỉ số | Giá trị |
|---|---|
| Request | 15.52 triệu (≈ 6.0 req/s) |
| Mean latency | **56.6 ms** |
| Tổng thời gian request (raw) | 878.086 s |
| Tổng instance-time bị tính tiền | **1.109.058 s** |
| vCPU-giây | 1.115.772 → **$26.78** |
| GiB-giây | 1.109.058 → **$2.77** |
| Invocations | → **$6.21** |
| **Tổng** | **~$35.8/tháng** |

### Phát hiện 1 — concurrency 10 đang tiết kiệm **0 đồng**

```
in-flight trung bình = 878.086 s / 2.592.000 s = 0.34 request
```

Chưa tới **một** request chạy đồng thời. Concurrency chỉ tiết kiệm khi in-flight > 1 — đặt 10 hay 80 đều ra cùng hoá đơn.

Tệ hơn: instance-time bị tính tiền (1.109.058s) **lớn hơn** tổng thời gian request (878.086s) **1.26×** — phần dôi là instance nằm chờ trước khi Cloud Run scale-down. Concurrency không những không giúp, hoá đơn còn có 21% là thời gian idle.

❌ Nên **đừng** tăng `concurrency` để mong rẻ hơn. Không có gì để lấy.

### Phát hiện 2 — so với v1 thì hoà, không lãi

Dựng phản-thực: cùng traffic đó chạy trên v1, tính đúng luật **làm tròn 100ms** của v1 (mean 56.6ms → hệ số phạt **×1.95**, billed 1.712.893s):

| | $/tháng |
|---|---:|
| **v2 hiện tại** (1 vCPU, 1GiB, conc 10) | **35.8** |
| v1 @ 1GB (1.4 GHz) — cấu hình tương đương | 34.5 |
| v1 @ 512MB (0.8 GHz) | 22.1 ⚠️ |

- v2 đang **đắt hơn v1 ~$1.3/tháng (+4%)**. Migrate không mang lại tiền.
- Con số $22.1 ở 512MB **không đạt được**: CPU utilization p99 đang là **82% của 1 vCPU**. Hạ xuống 0.8 GHz (1/3 vCPU) thì 56.6ms sẽ giãn ra nhiều lần, billed time tăng theo — số $22 chỉ đúng nếu duration không đổi, mà nó sẽ đổi.

### Vậy migrate v2 có sai không? — Không

Tiền hoà, nhưng đổi lại:
- Capacity 10 instance × 10 concurrency = **100 request đồng thời**, thay vì v1 phải mở 100 instance.
- Không còn OOM churn (p95 latency 679ms → 124ms sau leak-fix, ghi ở [[shipped-subscriptions-2026-07-23]]).
- Cấu hình CPU/RAM tách rời để right-size về sau.

✅ **Coi ~$1.3/tháng là phí bảo hiểm cho burst. Giữ nguyên.**

### Chỉnh duy nhất nên làm: `memory` 1GiB → 512MiB

Memory p99 theo ngày của `apiHookV2` (% của 1GiB):

```
07-13 → 07-22   91–99%     ← TRƯỚC khi vá pubsub leak
07-23 → 08-11   24–29%     ← SAU khi vá
```

Sau fix, p99 ổn định **24–29%** (~250–290 MB) — đúng như đo được hồi 22/07. 1GiB đang thừa ~3.5×.

⚠️ **Comment trong `index.js` đang nói sai:** nó ghi "1GiB gives ~4x headroom" — đúng về mặt ý định, nhưng cũng ghi *"Memory is always-allocated per instance, so 1GiB also makes a higher maxInstances affordable"*. Điều này không đúng theo cách hiểu đó: memory ở request-based billing tính theo GiB-giây thực dùng, `maxInstances` cao **không** tốn thêm nếu instance không chạy. Hai thứ độc lập.

- Hạ 512MiB → p99 lên ~50–58%, vẫn còn 2× headroom. Tiết kiệm ~**$1.4/tháng**.
- Nhỏ, nhưng miễn phí. Làm cùng lần deploy sau.

## 3. `productWebhookSubscriberV2` — đây mới là chỗ đang lỗ

| Chỉ số | Giá trị |
|---|---|
| Message | 4.41 triệu (≈1.7/s), mean **229 ms** |
| vCPU-giây | 845.176 → **$20.28** |
| Memory + requests | → $2.80 |
| **Tổng** | **~$23.1/tháng** |
| **Cùng traffic ở v1 @512MB** | **$13.0/tháng** |

→ Migrate hàm này lên v2 làm **tăng $10.1/tháng (+77%)**.

Lý do rất rõ trong metric:

| | v1 @512MB | v2 hiện tại |
|---|---|---|
| CPU được cấp | 0.8 GHz | 1 vCPU (2.4 GHz) — **3×** |
| CPU utilization thật | — | p50 **6.5%**, p99 46% |
| Phạt làm tròn 100ms | ×1.21 (mean 229ms → nhẹ) | không có |
| Concurrency tiết kiệm | — | chỉ 17% (in-flight 0.39) |

Trả gấp 3 tiền CPU để dùng 6.5%, mà concurrency chỉ bù lại được 17%. Đây đúng là cái bẫy đã mô tả ở [[functions-pricing-v1-v2]].

**Nhưng chưa chắc nên rollback.** Hàm này lên v2 để chịu được flood `products/update` — capacity hiện tại 30 × 10 = **300 message đồng thời**, v1 không có. Hạ `cpu` xuống 0.5 sẽ ép `concurrency = 1` → capacity còn 30, tức là bỏ đúng thứ đã mua.

📌 Đề xuất: **giữ v2, ghi nhận $10/tháng là phí bảo hiểm chống flood.** Đòn bẩy thật là **mean 229ms** — cắt duration mới giảm được tiền mà không mất capacity. Review lại nếu flood không còn là vấn đề.

## 4. 38 hàm v1 còn lại — KHÔNG migrate

Migrate toàn bộ sang v2 (cpu=1, giữ nguyên memory) sẽ **tăng $29.2/tháng** ($39.7 → $68.9).

Lý do là số học, không phải cảm tính. Muốn giữ concurrency thì `cpu` phải ≥ 1 = 2.4 GHz. Hầu hết hàm đang ở 256MB = 0.4 GHz → **giá CPU nhảy 6×**, trong khi concurrency ở traffic thưa chỉ cứu được ~16%.

### Ngưỡng hoà vốn theo memory tier

Số lần billable-time phải giảm đi thì v2 mới hoà với v1:

| v1 memory | CPU v1 | Cần giảm billable-time | Thực tế đạt được |
|---|---|---|---|
| 256 MB | 0.4 GHz | **5.3×** | ~1.2× ❌ |
| 512 MB | 0.8 GHz | **2.7×** | ~1.2× ❌ |
| 1024 MB | 1.4 GHz | **1.6×** | ~1.2× ❌ |
| **2048 MB** | 2.4 GHz | **1.0×** | — ✅ hoà ngay |
| 4096 MB | 4.8 GHz | 1.0× | — ✅ hoà ngay |

> **Luật rút ra: chỉ hàm v1 ≥ 2GB mới chắc chắn lãi khi lên v2** (vì ở đó v1 buộc mua 2.4GHz + 2GB RAM, còn v2 cho tách rời). Từ 1GB trở xuống, phải chứng minh in-flight > 1 trước khi migrate.
>
> Ngoại lệ: hàm rất ngắn (< 100ms) được v2 cứu khỏi phạt làm tròn 100ms — đó là lý do `apiHookV2` (56.6ms, phạt ×1.95) hoà được, còn `productWebhookSubscriberV2` (229ms, phạt ×1.21) thì lỗ.

### Các hàm ≥2GB đang có

| Function | Memory | Invocations/30d | v1 hiện tại | v2 ước tính | Chênh |
|---|---|---:|---:|---:|---:|
| `clientApi` | 2048 MB | 462.474 | $8.50 | ~$6.35 | −$2.15 |
| `storefrontApi` | 2048 MB | 539 | ~$0.01 | ~$0.01 | 0 |
| `apiHookV1` | 2048 MB | **0** | $0 | — | — |

Ứng viên duy nhất có thật là `clientApi`, tiết kiệm **~$2/tháng**. Không đáng đổi lấy rủi ro regression.

✅ **Kết luận: đóng chủ đề migrate. Không hàm nào còn lại đáng lên v2.**

## 5. Việc nên làm (xếp theo tỉ lệ lợi/công)

| # | Việc | Tiết kiệm | Rủi ro |
|---|---|---|---|
| 1 | **Xoá `apiHookV1`** (2GB, 0 invocation/30 ngày) | ~$0 compute, nhưng đóng một **endpoint public đang mở** dùng chung handler với `apiHookV2` | Thấp — đã xác minh, xem bên dưới |

> ⚠️ **Đính chính (2026-08-11).** Bản đầu của note này đề xuất xoá **5** function "chết".
> Sai — chỉ `apiHookV1` là chết thật. "0 invocation trong 30 ngày" **không** đồng nghĩa với chết:
>
> | Function | 0 invocation vì | Kết luận |
> |---|---|---|
> | `apiHookV1` | Hosting rewrite `/app/api/v1/**` → `apiHookV2`, `shopifyService.js:527` đăng ký webhook đúng path đó. Không request nào tới được Gen 1 | ✅ Xoá được |
> | `syncOrdersSubscriber` | **Có publisher đang sống** (`publishTopic.js:60`) + `docs/golive-sync-orders-checklist.md`. Feature chưa được kích hoạt, không phải code chết | ❌ Giữ |
> | `ext-firestore-bigquery-export-{init,setup,sync}BigQuerySync` | Là **lifecycle function của Firebase Extension** — chỉ chạy lúc install/backfill. Idle là đúng thiết kế | ❌ Giữ, xoá sẽ hỏng extension |
>
> Bài học: đọc metric mà không đọc code thì "0 invocation" trông y hệt nhau ở cả ba trường hợp.
| 2 | `apiHookV2` memory 1GiB → **512MiB** | ~$1.4/tháng | Thấp — p99 sẽ ở ~55% |
| 3 | Sửa comment sai về `maxInstances`/memory trong `index.js` | $0 | Không |
| 4 | Cắt duration `productWebhookSubscriberV2` (229ms) | tới ~$10/tháng | Trung bình — cần profile |
| 5 | ❌ **Không** tăng concurrency, **không** migrate thêm hàm nào | — | — |

Tổng tiết kiệm thực tế ở Functions: **vài đô/tháng**. Nếu mục tiêu là cắt hoá đơn thật thì chỗ đáng nhìn tiếp là **BigQuery Analysis $54.55** và **Firestore Read Ops $33.77** — không phải Functions.

## Cách tái lập số liệu

```bash
gcloud auth login && gcloud config set project avada-subscription-app
# CPU/memory allocation gen2 (Cloud Run)
#   metric: run.googleapis.com/container/{cpu,memory}/allocation_time  (ALIGN_SUM / REDUCE_SUM)
#   memory/allocation_time trả thẳng GiB-giây — KHÔNG chia cho 1024^3
# thời gian chạy gen1 + gen2
#   metric: cloudfunctions.googleapis.com/function/execution_times (DISTRIBUTION, ns)
#   phải đọc bucketCounts để tính đúng phạt làm tròn 100ms của v1
# hoá đơn thật
bq query --use_legacy_sql=false 'SELECT sku.description, SUM(cost) FROM
  `avada-subscription-app.gcp_billing_export.gcp_billing_export_resource_v1_01D3BA_954BAD_940ACB`
  WHERE project.id="avada-subscription-app" AND DATE(usage_start_time)>=DATE_SUB(CURRENT_DATE(),INTERVAL 30 DAY)
  GROUP BY 1 ORDER BY 2 DESC'
```

## Liên quan

- [[functions-pricing-v1-v2]] — mô hình giá v1/v2 và các đòn bẩy tối ưu.
- [[shipped-subscriptions-2026-07-23]] — pubsub singleton leak-fix + right-size `apiHookV2` 4GiB→1GiB.
- [[caching-layers]] — cắt Firestore read, khoản $33.77/tháng.
