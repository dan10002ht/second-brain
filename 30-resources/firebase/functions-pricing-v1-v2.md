---
type: resource
title: Firebase Functions v1 vs v2 — cách tính giá & hướng tối ưu v2
summary: v1 và v2 có đơn giá CPU/RAM/request y hệt nhau; tiền tiết kiệm được ở v2 đến từ concurrency và tách rời CPU/RAM, không đến từ đơn giá.
tags: [firebase, cloud, performance, cost, backend]
created: 2026-08-11
updated: 2026-08-11
source: https://cloud.google.com/functions/pricing-1stgen · https://cloud.google.com/run/pricing
---

# Firebase Functions v1 vs v2 — cách tính giá & hướng tối ưu v2

> Giá lấy từ trang chính thức GCP (kiểm 2026-08-11), region **Tier 1** (us-central1…).
> Tier 2 đắt hơn ~40%. Luôn đối chiếu lại bằng GCP Pricing Calculator trước khi báo số cho ai.

## TL;DR

1. **Đơn giá v1 và v2 gần như bằng nhau.** 1 vCPU-giây = $0.000024 ở cả hai; RAM = $0.0000025/GiB-giây ở cả hai; request = $0.40/triệu ở cả hai.
2. Vậy nên **migrate v1 → v2 KHÔNG tự động rẻ hơn.** Để `concurrency = 1` thì v2 chỉ ngang v1 — với function I/O-bound nhẹ còn **đắt hơn v1 gấp 2–3 lần**.
3. Ba đòn bẩy thật của v2: **concurrency** (chia đôi/chia mười thời gian tính tiền), **tách rời CPU và RAM** (v1 ép RAM kéo theo CPU), và **instance-based billing** cho service chạy liên tục.
4. Với app Shopify kiểu Joy, hoá đơn thường **không nằm ở Functions** mà ở Firestore reads + egress. Đo trước khi tối ưu.

## 1. Mô hình tính giá v1 (Cloud Functions 1st gen)

Ba khoản cộng lại:

| Khoản | Đơn giá Tier 1 | Free tier / tháng |
|-------|----------------|-------------------|
| Invocation | $0.40 / triệu | 2.000.000 |
| Memory | $0.0000025 / GB-giây | 400.000 GB-giây |
| CPU | $0.0000100 / GHz-giây | 200.000 GHz-giây |
| Egress | $0.12 / GB | 5 GB |

**Điểm chết người của v1: không chọn CPU được.** CPU bị buộc theo bậc RAM:

| RAM | CPU được cấp |
|-----|--------------|
| 128 MB | 200 MHz (~0.083 vCPU) |
| 256 MB | 400 MHz |
| 512 MB | 800 MHz |
| 1024 MB | 1.4 GHz |
| 2048 MB | 2.4 GHz (1 vCPU) |
| 4096 MB | 4.8 GHz (2 vCPU) |
| 8192 MB | 4.8 GHz (2 vCPU) |

Hệ quả: cần 1 vCPU cho một job CPU-bound → **buộc phải trả 2 GB RAM** dù chỉ dùng 300 MB. Đó là tiền vứt đi, và v1 không có cách nào tránh.

**Đơn vị tính tiền là request**, làm tròn lên 100ms. Mỗi instance xử lý **đúng 1 request tại một thời điểm** — không có concurrency. 100 request song song = 100 instance = 100 lần tính tiền song song.

## 2. Mô hình tính giá v2 (Cloud Run functions)

v2 **là Cloud Run**. Bỏ mô hình v1 đi, đọc theo Cloud Run.

### Request-based billing (mặc định)

| Khoản | Tier 1 | Tier 2 | Free tier / tháng |
|-------|--------|--------|-------------------|
| CPU | $0.000024 / vCPU-giây | $0.0000336 | 180.000 vCPU-giây |
| Memory | $0.0000025 / GiB-giây | $0.0000035 | 360.000 GiB-giây |
| Request | $0.40 / triệu | $0.40 / triệu | 2.000.000 |

Chỉ tính tiền khi instance **đang xử lý request** (+ startup + shutdown). Idle giữa hai request → không tính.

### Instance-based billing (CPU always allocated)

| Khoản | Tier 1 | Free tier / tháng |
|-------|--------|-------------------|
| CPU | $0.000018 / vCPU-giây | 240.000 vCPU-giây |
| Memory | $0.000002 / GiB-giây | 450.000 GiB-giây |
| Request | **không tính** | — |

Đơn giá rẻ hơn 25% nhưng tính tiền **toàn bộ vòng đời instance**, kể cả lúc ngồi không. Chỉ có lãi khi instance gần như luôn bận (traffic đều, hoặc cần background work sau khi trả response).

### So sánh free tier (quy về cùng đơn vị)

200.000 GHz-giây của v1 ≈ **83.000 vCPU-giây** (1 vCPU = 2.4 GHz). v2 cho **180.000 vCPU-giây**.
→ Free tier CPU của v2 rộng hơn v1 khoảng **2.2 lần**. RAM thì v1 rộng hơn (400k vs 360k) nhưng RAM hiếm khi là khoản tốn.

## 3. Ví dụ số thật — 10 triệu request/tháng, 200ms/request

Tổng compute time = 10M × 0.2s = **2.000.000 giây**.

### Trường hợp A — function CPU-bound, cần 1 vCPU

| Kịch bản | CPU | Memory | Request | **Tổng** |
|----------|-----|--------|---------|----------|
| **v1** — buộc chọn 2048MB để có 1 vCPU | 4.8M GHz-s → $46.00 | 4M GB-s → $9.00 | $3.20 | **~$58** |
| **v2** — 1 vCPU + 512MiB, concurrency = 1 | 2M vCPU-s → $43.68 | 1M GiB-s → $1.60 | $3.20 | **~$48** |
| **v2** — 1 vCPU + 512MiB, concurrency ≈ 10 | 200k vCPU-s → $0.48 | 100k GiB-s → $0 | $3.20 | **~$4** |

v2 với `concurrency = 1` chỉ rẻ hơn v1 ~17%, và toàn bộ phần chênh đó đến từ việc **không phải mua 2GB RAM thừa** — không phải từ đơn giá. Cú nhảy thật (14×) nằm ở concurrency.

### Trường hợp B — function I/O-bound nhẹ (gọi Shopify API rồi ghi Firestore), 512MB là đủ

| Kịch bản | CPU | Memory | Request | **Tổng** |
|----------|-----|--------|---------|----------|
| **v1** — 512MB (được 0.8 GHz) | 1.6M GHz-s → $14.00 | 1M GB-s → $1.50 | $3.20 | **~$19** |
| **v2** — mặc định 1 vCPU, concurrency = 1 | 2M vCPU-s → $43.68 | 1M GiB-s → $1.60 | $3.20 | **~$48** |
| **v2** — 1 vCPU, concurrency = 80 | ~25k vCPU-s → $0 (free tier) | $0 | $3.20 | **~$3** |

Đây là cái bẫy thật:

- ❌ Migrate v2 rồi để `concurrency = 1` → **đắt hơn v1 2.5 lần**. v1 cấp 0.8 GHz cho function nhẹ; v2 cấp trọn 1 vCPU và tính đủ tiền.
- ✅ v2 + concurrency → **rẻ hơn v1 ~6 lần**, và loại I/O-bound này chính là loại hưởng lợi nhiều nhất (phần lớn thời gian là chờ network, một instance thừa sức ôm hàng chục request).

Concurrency không phải "tối ưu thêm". Nó **là** lý do tồn tại của v2 về mặt chi phí.

## 4. Hướng tối ưu v2 — xếp theo mức tác động

### Nhóm A — tác động lớn (làm trước)

| # | Việc | Vì sao |
|---|------|--------|
| A1 | **Đặt `concurrency` đúng** (mặc định 80 khi cpu ≥ 1) | Chia thẳng hoá đơn CPU + RAM cho số request chạy song song. Đòn bẩy mạnh nhất, cách biệt. |
| A2 | **Không đặt `cpu < 1`** trừ khi cố ý | `cpu < 1` **ép `concurrency = 1`**. Tưởng tiết kiệm CPU nhưng giết mất A1 → tổng đắt hơn. |
| A3 | **Right-size CPU/RAM bằng số đo**, không đoán | v2 tách rời CPU/RAM — đây là thứ v1 không cho. Xem p95 memory thật trên Cloud Monitoring rồi cắt. |
| A4 | **Xoá `minInstances` ở chỗ không cần** | 1 min instance (1 vCPU / 512 MiB) chạy 24/7 ≈ **$45–50/tháng**, dù không ai gọi. Chỉ giữ cho function mà cold start thật sự làm hỏng UX. |
| A5 | **Giảm thời gian chạy** — cache Firestore bằng Redis, batch write, bỏ N+1 | Tiền tỉ lệ thuận với **giây**. Cắt 200ms → 80ms là cắt 60% hoá đơn compute. |
| A6 | **Chọn region Tier 1** và đặt cùng region với Firestore | Tier 2 đắt hơn ~40%; egress sang Google API **cùng region là miễn phí**, khác region thì không. |

### Nhóm B — chặn rủi ro & rò rỉ

| # | Việc | Vì sao |
|---|------|--------|
| B1 | **Luôn đặt `maxInstances`** | Loop vô hạn / retry storm trên serverless = hoá đơn không trần. Đây là bảo hiểm, không phải tối ưu. |
| B2 | **Cấu hình retry policy cho Eventarc/Pub/Sub trigger** | v2 trigger qua Eventarc. Retry mặc định nhân đôi/ba số lần chạy của function đang lỗi. |
| B3 | **Giảm payload trả về** | Egress $0.12/GB sau 5GB. Trả full document Firestore thay vì field cần → tiền egress + tiền đọc. |
| B4 | **Dọn image cũ ở Artifact Registry + đặt cleanup policy** | Mỗi lần deploy đẩy một image. Không dọn thì storage phình âm thầm hàng tháng. |
| B5 | **Tách function nặng khỏi function nhẹ** | v2 config từng function riêng. Đừng để một webhook nhẹ ăn theo cấu hình 4 vCPU của job import. |

### Nhóm C — cold start (ảnh hưởng cả tiền lẫn UX)

| # | Việc | Vì sao |
|---|------|--------|
| C1 | **Lazy import SDK nặng** (`firebase-admin`, `googleapis`, BigQuery client) | Startup time **cũng bị tính tiền**. Import 2s × mọi cold start là tiền thật. |
| C2 | **Khởi tạo client ở global scope**, tái dùng qua các request | Tạo lại connection Redis/Firestore mỗi request là trả tiền cho cùng một việc nhiều lần. |
| C3 | **Cân nhắc `startup CPU boost`** thay vì `minInstances` | Rẻ hơn nhiều so với giữ instance sống 24/7, mà vẫn cắt phần lớn cold start. |

### Nhóm D — kiểm tra lại giả định

- **Đo trước khi tối ưu.** Vào Cloud Billing → group by SKU. Nếu Functions chỉ chiếm 10% hoá đơn thì tối ưu nó là công cốc — vấn đề nằm ở Firestore reads hoặc BigQuery.
- **Concurrency có điều kiện.** Bật concurrency = nhiều request chia chung một process. Phải chắc: không có global state bị ghi đè, RAM đủ cho N request đồng thời, không rò rỉ memory. Bật mù rồi OOM còn đắt hơn.
- **Instance-based chỉ hợp với traffic đều.** Traffic bursty → request-based gần như luôn thắng.

## 5. Checklist migrate v1 → v2 (phần liên quan tiền)

- [ ] Đã đo p95 memory + p95 duration của function trên v1 chưa?
- [ ] `concurrency` đặt bao nhiêu, và code có an toàn khi chạy song song không?
- [ ] `cpu` có bị đặt < 1 (vô tình khoá concurrency = 1) không?
- [ ] `maxInstances` đã đặt chưa?
- [ ] `minInstances` — có function nào để > 0 mà không cần không?
- [ ] Region có cùng với Firestore, và có phải Tier 1 không?
- [ ] Trigger event đã có retry policy chưa?
- [ ] Đã dựng lại con số dự kiến bằng GCP Pricing Calculator chưa?

## Liên quan

- [[firestore-multitenant]] — dữ liệu theo `shopId`; số lượng read/shop là biến chính của hoá đơn.
- [[caching-layers]] — cắt Firestore read bằng cache là cách giảm cả tiền lẫn latency.
