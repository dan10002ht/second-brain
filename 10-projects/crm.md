---
type: project
title: AVADA CRM - Marketing Automation
tags: [crm, nodejs, firebase, bigquery, marketing-automation]
created: 2026-07-06
updated: 2026-07-06
status: active
repo: ~/projects/crm
---

# AVADA CRM - Marketing Automation

## Mục đích
Ứng dụng CRM & marketing automation nội bộ của AVADA (package `@avada/app`, v1.2.0). Quản lý khách hàng, KPI/ca làm việc của agent, gửi email tự động (SEO funnel, speed-up widget), và đồng bộ dữ liệu giao dịch (transactions/billing) lên BigQuery để phân tích.

## Tech stack
- **Backend**: Node.js + Firebase Cloud Functions (firebase-tools 13.x), Sequelize.
- **Frontend**: React + Shopify Polaris 12, CKEditor5 (custom plugins), scripttag (webpack).
- **Monorepo**: Yarn workspaces — `packages/{assets, functions, scripttag, cloudrun, ckeditor5-plugins}`.
- **ML/Python**: `python-functions/` — dự đoán churn (`predict_churn`) + phân loại ngành website (`classify_industrial`, model.pkl) qua functions-framework.
- **Data**: Firestore (rules + ~46KB indexes) + BigQuery cho transactions.
- CI: GitLab CI; deploy bằng `firebase deploy`.

## Trạng thái
Active. Commit gần đây tập trung vào backfill/resync dữ liệu transactions lên BigQuery (billing_interval, daily transactions, ~144k records), xử lý dead shops.

## Điểm đáng nhớ
- Chạy dev: `yarn start-dev` (concurrently watch assets + functions + scripttag); emulators qua `yarn emulators`.
- Pipeline BQ nhạy cảm: từng có bug do field camelCase khi insert vào BigQuery; backfill chia 2 phase (SQL rồi API, phân trang cursor 1 page/call).
- Docs tính năng nằm ở `docs/features/` + BUNDLE_CAMPAIGN, WHATS_NEW_API — tham khảo trước khi động vào campaign API.

## Liên quan
- [[bigquery-sync]]
- [[firebase-functions]]
