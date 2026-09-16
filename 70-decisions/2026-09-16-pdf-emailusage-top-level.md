---
type: decision
title: Counter quota email (PDF Invoice) — top-level collection `emailUsage`, không subcollection của shop
summary: Bộ đếm email/shop/ngày dời từ `shops/{shopId}/emailUsage/{date}` sang top-level `emailUsage/{shopId}_{date}` để thôi phụ thuộc vào một mệnh đề chỉ mới verify trên emulator ("ghi 4 segment không kích `onUpdateShop`"), đổi lại mất tính tự-xoá-theo-shop nên phải dựa vào TTL 7 ngày.
tags: [pdf, invoice, avada, firebase, firestore, backend, architecture]
created: 2026-09-16
updated: 2026-09-16
review: 2026-12-16
source: repo `pdf` — git log 2026-09-15, commit `537ebd08c` · `c368cb0fe` · `df783339a` (hash đã verify)
---

# Counter quota email: top-level collection, không subcollection

## Bối cảnh

Feature cap email/shop/ngày đã merge master qua !560 (`d170904d6`). Bản đầu đếm quota bằng
subcollection `shops/{shopId}/emailUsage/{date}`. Commit `537ebd08c` trên nhánh
`feat/rate-limit-email-sending` dời nó sang top-level `emailUsage/{shopId}_{date}`.

## Quyết định

Top-level collection, doc id deterministic `{shopId}_{date}`. Cơ chế đọc/ghi giữ nguyên:
`.doc(id).get()` trong transaction, **không query, không index**. Kèm `expireAt = updatedAt +
7 ngày` cho TTL policy, khai bằng `fieldOverrides` trong `firestore.indexes.json`
(`c368cb0fe`) chứ không bật tay bằng `gcloud`. Doc chỉ giữ `count` + `expireAt` (`df783339a`).

## Why

- **Bỏ một phụ thuộc chưa được chứng minh ở đúng tầng.** Bản subcollection đứng trên mệnh đề
  "ghi 4 segment không khớp pattern `shops/{shopId}` 2 segment nên không kích `onUpdateShop`".
  Mệnh đề đó **mới verify trên Firestore emulator, chưa verify trên Eventarc thật**. Top-level
  xoá hẳn phụ thuộc — không cần biết trigger khớp pattern thế nào nữa. Cùng một lớp lỗi với
  [[bang-chung-phan-biet-duoc]]: emulator xanh không phân biệt được hai giả thuyết ở prod.
- **Nó là outlier convention.** Đó là subcollection **duy nhất** trong
  `packages/functions/src`, lệch với 29 top-level collection còn lại.
- **Thứ tự `{shopId}_{date}`** cho phép prefix range query "shop X bị chặn từ hôm nào" mà không
  cần thêm field nào.
- **TTL khai trong repo thì đi cùng code**, không phải một bước tay dễ quên khi dựng lại môi
  trường — đúng như `deletedTemplates.expireAt` đã làm.
- **Không tái dùng `updatedAt` làm field TTL**: nó luôn ở quá khứ nên sẽ xoá sạch trong 24h.

## Tradeoff

- **Mất tính dọn theo shop.** Subcollection chết cùng doc shop khi shop bị xoá; top-level thì
  không — vòng đời doc giờ **hoàn toàn phụ thuộc TTL policy**. TTL không bật (hoặc bật nhầm
  môi trường) là collection phình vô hạn, và không có gate nào đỏ vì đọc/ghi vẫn chạy đúng.
- **Không migration**, chấp nhận fail-open: counter reset mỗi ngày UTC, trường hợp xấu nhất là
  một shop được cấp lại quota giữa ngày. Rẻ, nhưng nghĩa là trong ngày chuyển đổi cap **không
  có hiệu lực chắc chắn**.
- Bỏ `shopId`/`date`/`updatedAt` khỏi doc làm doc **không còn tự đọc được độc lập** — muốn biết
  doc của shop nào, ngày nào thì phải parse doc id. Đổi lại tiết kiệm index và tránh hotspot
  trên timestamp tăng đơn điệu.
- Nhánh **chưa merge** trong khi bản subcollection **đã ở master** — trong khoảng thời gian này
  prod đang chạy đúng cái mệnh đề chưa verify.

## Điều kiện xem lại (2026-12-16)

Xem lại nếu: TTL policy trên `pdf-invoice-4717c` không thực sự xoá doc sau 7 ngày (đếm số doc
`emailUsage` cũ hơn 7 ngày — con số phải là 0), hoặc nếu quota chuyển sang Redis như tầng đếm
chính (cùng lập luận đã nêu ở [[redis-queue-khong-dung-chung-instance-cache]]) khiến collection
này thành thừa.

Liên quan: [[pdf]] · [[shipped-pdf-2026-09-16]] · [[digest-pdf-2026-09-15]] ·
[[bang-chung-phan-biet-duoc]] · [[firestore-multitenant]] ·
[[redis-queue-khong-dung-chung-instance-cache]]
