---
type: resource
title: Ghi 0 lên dòng con làm mất thông tin — giữ giá thật rồi giảm 100%
summary: Khi tiền đã gom về một dòng cha, ghi `price = 0` lên các dòng con là xoá luôn dữ kiện "món này đáng bao nhiêu" — người vận hành không swap ngang giá được và hệ thống hiểu "bỏ món ra" thành "khách bị thiếu hàng" nên đòi hoàn tiền; cách đúng là giữ giá thật rồi đặt một discount 100% lên chính dòng đó.
tags: [shopify, subscription, billing, avada, patterns, architecture]
created: 2026-09-21
updated: 2026-09-21
source: project `subscriptions` — session history 2026-09-20/21 (đối chiếu Simple Bundles vs Joy trên đơn thật của `sprayfreefarmacy` + store dev)
---

# Ghi 0 lên dòng con làm mất thông tin

## Hai cách cùng cho ra đúng số tiền

```
Cách A (Simple Bundles)              Cách B (Joy, đường cũ)
Hộp trái cây          $60.00         Hộp trái cây          $60.00
  ├ Táo Pink Lady   $14.50  −100%      ├ Táo Pink Lady      $0.00
  └ Chuối 750g       $6.50  −100%      └ Chuối 750g         $0.00
```

Tổng thu **giống hệt nhau**. Khác nhau ở chỗ cách B đã **xoá mất** một dữ kiện mà không ai nhận ra
là mình đang xoá: *món này đáng bao nhiêu*.

## Cái mất, không phải cái sai

Con số tiền không sai, nên không gate nào đỏ được — hỏng chỉ lộ ở hai chỗ **ngoài** phép cộng:

1. **Người vận hành mù giá.** Khách đòi bỏ đu đủ, nhân viên không biết bù món gì cho ngang giá vì
   mọi món đều hiện $0. Thông tin đó chỉ còn trong catalog, không còn trên chứng từ.
2. **Hệ thống hiểu nhầm hành động.** Bỏ một dòng $0 ra khỏi đơn: theo cách B, giá trị đơn không đổi
   nhưng số hàng giảm → luồng order-edit hiểu là *khách bị thiếu hàng* → đòi **refund**, trong khi
   khách đã trả trọn gói và nhận món thay thế. Merchant tự trả tiền lại vô cớ.

Theo cách A, dòng con mang giá thật + một discount thật (trên Shopify là
`ManualDiscountApplication`, `allocationMethod: ACROSS`) nên "giá trị bị bỏ đi" và "giá trị đã được
miễn" là **hai đại lượng phân biệt được** — đúng tinh thần [[bang-chung-phan-biet-duoc]].

## Luật rút ra

> `0` không phải cách biểu diễn "đã trả ở chỗ khác". Nó đồng nghĩa với "không có giá trị", và mọi
> lớp phía sau sẽ đọc đúng theo nghĩa đó.

Khi gom tiền về một dòng/bản ghi cha, giữ nguyên giá trị thật ở dòng con và biểu diễn việc "đã thu
ở cha" bằng một **phép giảm tường minh** đặt trên chính dòng đó. Mẫu này áp cho mọi chỗ có
parent/child pricing: bundle, combo, gói dịch vụ, line item của invoice, hạng mục trong hợp đồng.

Dấu hiệu đang dính lỗi này: chứng từ có cột giá toàn `0`; code có một nhánh `if (isChild) price = 0`;
hoặc nghiệp vụ phải *đoán* giá từ nguồn khác để xử lý một thao tác trên chứng từ.

## Gotcha đi kèm (Shopify)

`lineExpand` của cart transform **thay thế** dòng cha bằng các dòng con, không thêm con cạnh cha —
nên chừng nào còn expand ở giỏ thì đơn không có dòng cha để mang tiền, và mọi biến thể "set giá cha
= X, con = 0" đều không dựng được. Xem [[2026-09-21-fixed-bundle-con-them-luc-order-create]].

Liên quan: [[subscriptions]] · [[app-development]] · [[tien-khong-duoc-lay-float-lam-chuan]] ·
[[bang-chung-phan-biet-duoc]] · [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] ·
[[resolve-luc-doc-thay-vi-ghi-truoc]] · [[digest-subscriptions-2026-09-21]]
