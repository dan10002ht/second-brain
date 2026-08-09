---
type: resource
title: koa-yup-validator + yup 0.29 — validator ghi đè body, và hai kiểu hỏng ngược nhau
summary: Middleware validate không chỉ kiểm tra mà còn GHI ĐÈ `ctx.request.body` bằng giá trị yup đã cast; với yup 0.29 điều đó sinh nested object toàn `undefined` (hỏng ồn ào 422 hoặc hỏng im lặng 200-mà-không-ghi) và `stripUnknown` âm thầm vứt field mới.
tags: [koa, nodejs, backend, avada, firestore, debug]
created: 2026-08-09
updated: 2026-08-09
source: [[digest-pdf-2026-08-07]] · [[shipped-pdf-2026-08-04]] · [[digest-subscriptions-2026-08-03]] · [[digest-subscriptions-2026-07-17]]
---

# koa-yup-validator + yup 0.29

Áp dụng cho mọi app Avada dùng `@avada/core` (xem [[shopify-app-dev]]). Đây là một
middleware, không phải một hàm kiểm tra thuần — và toàn bộ họ bug dưới đây đến từ chỗ đó.

## Điều phải biết trước

Sau khi validate, middleware chạy `set(ctx, path, data)` — tức **ghi đè `ctx.request.body`
bằng giá trị yup đã cast**, không phải body gốc client gửi lên. Vậy nên schema không chỉ
quyết định *cái gì bị từ chối*, nó quyết định luôn *cái gì controller thật sự nhìn thấy*.

## Ba kiểu hỏng, cùng một gốc

| Triệu chứng | Cơ chế | Xử lý |
|---|---|---|
| **422 khi Save** | yup 0.29 tự dựng default cho nested object không có trong input | Khai `.default(undefined)` cho nested object |
| **200 `success` nhưng DB rỗng** | Cùng gốc trên: object dựng ra có mọi field = `undefined`; Firestore ném `Cannot use "undefined" as a Firestore value`; lỗi bị nuốt ở tầng trên nên controller vẫn trả 200 | `.default(undefined)`, và **đừng tin status code** — xem dấu hiệu nhận biết dưới |
| **Field mới lưu không lên** | `stripUnknown` vứt sạch field chưa khai báo trong schema | Mở schema **trước** khi thêm field ở FE hay ở instrumentation |

Hai kiểu đầu ngược nhau về độ ồn: một cái lộ ra ngay, một cái im lặng nhiều ngày.
Cùng một dòng schema sinh ra cả hai — khác nhau chỉ ở tầng dưới nuốt lỗi hay không.

## Dấu hiệu nhận biết ca im lặng

**Response GET trả data nhưng không có field `id`.** Repository map `id` từ document
thật; data không kèm `id` nghĩa là bạn đang nhìn **default của schema**, không phải doc
trong DB. Ghép với kiểm chứng cứng hơn: `updatedAt` có đổi sau khi bấm Save không —
xem [[bang-chung-phan-biet-duoc]].

## Kỷ luật rút ra

- **Khi thêm field mới đi xuyên tầng, sửa schema là bước ĐẦU**, không phải bước cuối.
  Trường hợp instrumentation (thêm field đo đạc gửi về backend) đặc biệt dễ quên vì
  không ai "review" một field telemetry.
- **`200 success` không chứng minh đã ghi.** Đường ghi và đường trả response tách nhau
  được. Muốn chứng minh, đọc lại doc hoặc so mốc `updatedAt`.
- **Phân biệt "đường ghi hỏng" với "request không tới"** bằng probe thẳng vào DB bằng
  service account (`query` → `add()` → đọc lại → xoá). Lưu ý app local thường chạy bằng
  **ADC của user** còn probe chạy bằng **service account** — hai danh tính khác nhau,
  phải thử đúng cách app xác thực mới kết luận được.

## Liên quan

- [[controller-service-repository]] — tầng nào được phép chạm Firestore.
- [[firestore-multitenant]] · [[shopify-app-dev]]
- Nguồn: [[digest-pdf-2026-08-07]] · [[shipped-pdf-2026-08-04]] · [[digest-subscriptions-2026-08-03]] · [[digest-subscriptions-2026-07-17]] · [[subscription-digest-2026-07-14]]
