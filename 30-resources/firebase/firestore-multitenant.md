---
type: resource
title: Firestore multi-tenant theo shopId
tags: [firebase, firestore, multitenant, backend]
created: 2026-07-06
updated: 2026-07-06
---

# Firestore multi-tenant theo shopId

Mẫu dữ liệu dùng chung cho các app Shopify AVADA: mỗi shop là một tenant, cô lập
dữ liệu bằng `shopId`.

## Nguyên tắc số 1

> **MỌI query backend phải validate `shopId`.** Bỏ qua = rò rỉ dữ liệu chéo shop.

- 1 collection = 1 repository; repository luôn gắn điều kiện `shopId`.
- Không bao giờ tin `shopId` từ client thô — lấy từ session/auth (`getCurrentShop`).

## Vận hành

- **Composite index**: query mới (nhiều field + orderBy) thường phải thêm index
  trong `firestore.indexes.json`. File này có thể rất lớn (100KB+).
- **Firestore trigger** (`onWritten...`) để phản ứng thay đổi document.
- Việc nặng → đẩy sang **Pub/Sub / Cloud Tasks** (tránh timeout Functions), không
  xử lý đồng bộ trong request.

## Kèm theo

- **BigQuery** cho analytics (đồng bộ từ Firestore).
- **Redis** cache đọc nóng.
- Firebase Functions v2, Node.js runtime.

## Liên quan
- [[shopify-app-dev]] · [[controller-service-repository]]
- [[subscriptions]] · [[crm]]
