---
type: resource
title: Mutation ghi nguyên khối xoá những field bạn không gửi
summary: Script migrate không hề nhắc `compareAtPrice` vẫn làm 3 sản phẩm mất giá gạch ngang trên storefront — vì `variants` là list field của `productSet`, mà mutation kiểu đó thay CẢ danh sách; và script sửa chữa cho lớp lỗi này chỉ được đặt giá trị TRỞ LẠI, không bao giờ ghi `null` đè lên cái đang sống.
tags: [shopify, backend, architecture, method, debug, patterns]
created: 2026-09-16
updated: 2026-09-16
source: [[digest-subscriptions-2026-09-16]] · project `subscriptions` (migrate Simple Bundles → Fixed Bundle, store joywholefoods.com.au)
---

# Mutation ghi nguyên khối xoá những field bạn không gửi

Chạy migrate 63 sản phẩm trên production. Sau đó 3 sản phẩm mất `compareAtPrice` — giá gạch ngang
đang hiển thị cho khách biến mất. Grep cả script: `compareAtPrice` **chỉ xuất hiện trong query
snapshot**, không có một chỗ nào ghi nó.

Nó bị xoá **gián tiếp**. Docs Shopify về `productSet`:

> *For **list fields**: creates new entries, updates existing entries, and **deletes existing
> entries that aren't included in the input**.*

`variants` là list field. Script gửi variant kèm `price` mà không kèm `compareAtPrice` ⇒ Shopify hiểu
là "danh sách mới không có field đó" ⇒ xoá. Cùng cơ chế làm lệch `inventoryItem.tracked`.

## Vì sao khó thấy

- **Diff của code sạch.** Không có dòng nào ghi field bị mất, nên đọc code không ra.
- **Triệu chứng ở xa nguyên nhân.** Sản phẩm còn nguyên, giá bán còn nguyên; thứ đổi là một field
  phụ, và nó chỉ lộ ra ở storefront (hoặc ở một smart collection đổi thành viên vì rule
  `IS_PRICE_REDUCED IS_NOT_SET`).
- **Lỗi mạng làm nó tệ hơn.** Bản snapshot dùng để khôi phục cũng đi qua mạng; một
  `retry 1/4 fetch parents: AggregateError` cho ra bản đọc khuyết, và `tracked` bị ghi sai ở đúng
  1/16 sản phẩm — xem [[loi-mang-bi-bao-thanh-ly-do-nghiep-vu]].

## Luật

> Trước khi gọi một mutation ghi-nguyên-khối, tra docs xem field nào là **list field**. Với list
> field, "không gửi" nghĩa là "xoá", không phải "giữ nguyên".

Nhận diện họ mutation này: `productSet`, `subscriptionDraftUpdate` (thay cả `customAttributes` —
từng xoá mất `_joy_source: 'manual'` khiến webhook đi nhầm nhánh checkout), `PUT` kiểu replace,
`firestore.set()` không `{merge: true}`, mọi API tên `set`/`replace`/`put`.

Hai hệ quả bắt buộc khi làm việc với chúng:

1. **Snapshot trước khi ghi, và để snapshot ngoài worktree.** Xoá worktree là mất luôn dữ liệu
   rollback nếu nó nằm dưới `--out` bên trong đó.
2. **Script sửa chữa chỉ được đặt giá trị TRỞ LẠI.** Bản đầu của script `restoreVariantFields` sẽ
   ghi `"0.00" → null` lên cả những sản phẩm **chưa** migrate — tức tự gây ra đúng lớp lỗi nó đi
   sửa. Invariant đã nướng vào code:

   ```js
   // Only ever put a value BACK. Never write null over whatever is live.
   if (wanted.compareAtPrice !== null &&
       String(live.compareAtPrice ?? '') !== String(wanted.compareAtPrice)) { ... }
   ```

   Bắt được vì **chạy thử không có `--only`** trước khi tin, không vì test. Script như vậy còn được
   một tính chất quý: idempotent — chạy nhầm cũng không hỏng gì.

3. **Phép nghiệm thu là đọc lại từ nguồn chuẩn**, không phải output của lệnh ghi
   ([[ack-khong-phai-hieu-ung]]). Ở đây: query Shopify live rồi so 6 mục với snapshot.

Liên quan: [[ack-khong-phai-hieu-ung]] · [[loi-mang-bi-bao-thanh-ly-do-nghiep-vu]] ·
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] · [[app-development]]
