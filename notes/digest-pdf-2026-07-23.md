---
type: note
title: Digest PDF Invoice 2026-07-23 — gcloud default project ≠ cwd, dễ chạy cost query nhầm app
summary: gcloud/bq lấy project từ config toàn cục của máy (đang là avada-subscription-app), không theo cwd — phải set/verify đúng project pdf-invoice-4717c trước khi chạy cost/memory query; token hết hạn không refresh được ở non-interactive.
tags: [pdf, cloud, bigquery, tooling]
created: 2026-07-23
source: project "pdf" — session history (mined 2026-07-23)
---

# Digest PDF Invoice — 2026-07-23

Session ngắn: check memory-peak function + cost app (skill tối ưu cost GCP), dừng vì auth hết hạn.

## Techniques / Gotchas

- **gcloud/bq lấy project từ config TOÀN CỤC của máy, không theo thư mục làm việc.** Đang ở `~/projects/pdf` nhưng default lại là `avada-subscription-app` → suýt chạy cost/metric query lên nhầm app. *Áp dụng:* luôn `--project` tường minh hoặc verify `gcloud config get project` trước khi query billing/metrics.
- **App pdf production = GCP project `pdf-invoice-4717c`** (account `dantt@avadagroup.com`). *(chưa xác minh billing table/dataset cụ thể — session dừng trước khi chạy được.)*
- **Token hết hạn → bq/gcloud KHÔNG refresh được ở chế độ non-interactive** (agent không chạy được OAuth flow). Cần user tự `gcloud auth login` trong khung chat/terminal trước.
- Script `function-metrics.sh` mặc định lấy memory **7 ngày** → sửa window nếu cần 30 ngày.

## Liên kết gợi ý

[[pdf]] · [[digest-pdf-2026-07-21]] · [[shipped-pdf-2026-07-22]]
