---
type: note
title: Digest subscriptions — 2026-09-06
summary: Auto sync price của kookut chết vì một job bulk-action kẹt PENDING từ 31/12/2025 chứ không phải webhook không bắn; "giảm 50%" là basePrice bằng đúng nửa variantPrice và phải đối chiếu đơn ĐÃ CHARGE mới phân biệt được bug với đúng; và con số GMV $103M là do một shop rác đóng góp $102,4M.
tags: [avada, subscription, shopify, debug, backend]
created: 2026-09-06
updated: 2026-09-06
source: project `subscriptions` — session history (kookut CS thread 2026-09-04/09-05, số liệu doanh thu, phí ship store test)
---

Digest của [[subscriptions]]. CHỈ phần mới so với [[digest-subscriptions-2026-09-03]],
[[digest-subscriptions-2026-09-04]] và [[2026-09-05-usagecount-live-tu-shopify]].

## Bugs

**Auto sync price "không work" ở kookut: một job kẹt `PENDING` chặn mọi lần sync sau.**
Giả thuyết đầu của tôi là webhook `products/update` không bắn — dantt bác đúng chỗ: khách mua hàng
là tồn kho đổi, webhook bắn liên tục. Root cause thật là một job `bulk-action-subscription`
(`n484GjaS3QWsjS09Tknt`) tạo **31/12/2025** và **chưa bao giờ rời trạng thái `PENDING`**. Cờ dựng
ra để chống spam webhook (`products/update` bắn quá nhiều, mỗi lượt sync đọc giá nên cost tăng
mạnh) chỉ được xoá khi job **hoàn thành** — job chết là cờ nằm lại vĩnh viễn, và tính năng im lặng
không chạy suốt 8 tháng. Không riêng kookut: quét ra thêm shop khác (`24123e-4`) cũng đang kẹt.
dantt chốt **giữ cơ chế chặn spam, tạm bỏ tính năng sync** — hai thứ đó phải tách: chặn spam là
đúng, còn cờ không có đường tự thoát mới là lỗi.

**Bật lại sync sẽ xoá sạch cycle edit của contract.** `contractBulkActionService` gọi
`subscriptionBillingCycleEditsDelete` cho **cả contract** sau khi cập nhật giá. Đo trước khi lo:
**0/12** contract sắp bị sync chạm đang mang cycle edit ⇒ rủi ro không hiện thực ở thời điểm này,
nhưng vẫn đúng nếu về sau có khách sửa kỳ. Cùng họ với [[digest-subscriptions-2026-09-03]] (phí
ship tầng contract vs tầng cycle).

**"Giảm 50%" mà CS báo không phải discount.** Không contract nào có discount 50% — chỉ
`cycleDiscounts` 5% đúng gói. Con số 50% nằm ở `basePrice`: `117269365117` có `base=23.8` trong
khi `variantPrice=11.9`, tức dòng đang giữ một giá bằng đúng nửa giá variant. Câu chuyện CS kể
suốt nhiều tháng ("khách sale 50% từ tháng 12 rồi mới bật auto update price") không phải nguyên
nhân.

**Phép thử phân biệt bug với đúng: đối chiếu đơn ĐÃ CHARGE, không so với giá catalog hiện tại.**
Quét ra 4 contract đang giữ giá bằng nửa giá thị trường. Nhìn giá thôi thì cả 4 trông giống nhau;
so với đơn đã charge thì **3 là bug** (đơn cũ thu giá đầy đủ, contract giờ giữ một nửa) và **1 là
đúng** (khách vốn được giá đó). Cùng họ [[bang-chung-phan-biet-duoc]] — và cùng hình dạng với
[[phep-kiem-quan-sat-sai-tang]]: so với giá catalog hiện tại là quan sát sai *tầng*, vì nó không
phân biệt được hai giả thuyết.

**Giá EUR không áp dù merchant đã gõ giá — và ba tín hiệu nói khác nhau.** Admin search 3 catalog
đều không ra sản phẩm; API price list lại **có** dòng giá cố định; publication của sản phẩm hỏng
và sản phẩm chạy đúng **giống hệt nhau** (5 sales channel, không cái nào có catalog riêng) nên
"chưa publish" không phải điểm khác biệt. Hai lần tôi phải tự bác chẩn đoán của chính mình, một
lần vì tự ghép chuỗi ID price list nên có thể đã query sang bảng rỗng — phải lấy ID **nguyên văn
từ catalog** rồi hỏi lại. ⚠️ **Chưa xác minh**: phiên đứt trước khi chốt kết luận cuối; đừng dùng
lại bất kỳ nhánh giải thích nào ở trên cho tới khi có người truy xong. Liên quan:
[[digest-subscriptions-2026-08-15]] (`PriceList.prices(originType: FIXED)` mới là nguồn giá tin
được) · [[digest-subscriptions-2026-08-20]].

**GMV $103M/tháng là giả vì đúng một shop.** `abc-ban-rau.myshopify.com` một mình "đóng góp"
**$102.455.126**. Đây là mảnh đóng mục treo của [[digest-subscriptions-2026-09-04]] — con số vẫn
không dùng được, nhưng lý do thì đã biết: không phải bug pipeline tính toán mà là một shop rác
lọt vào tập tính. Mọi query doanh thu/GMV toàn hệ thống phải lọc shop nội bộ + shop rác **trước**
khi cộng, nếu không top-1 nuốt trọn tổng. ⚠️ tên nguyên nhân ở mức "shop rác" là suy đoán của
tôi — phiên đứt, **chưa xác minh**.

## Techniques

**Sửa dữ liệu hiển thị trên contract THẬT thì không được dùng "sửa dòng giả".** Cách rẻ là chỉnh
số lượng lên rồi xuống để ép app tính lại — nhưng nó tạo **hai lần chỉnh số lượng** trên contract
của khách và có thể bắn email thông báo. Đường đúng: chứng minh commit draft **không** làm mất
cycle edit, rồi ghi thẳng `deliveryPrice` do resolver tính, cuối cùng đọc lại bằng một **script
audit độc lập** chứ không tin lời script vừa ghi ([[ack-khong-phai-hieu-ung]]).

**Tái hiện ca merchant bằng bảng giá phân tầng dựng trên store test.** Store test không có ngưỡng
nào để vượt (chỉ một rate 0 vô điều kiện). Chi tiết dễ vấp: rate 0 **phải** có
`priceConditionsToCreate` (ví dụ `TOTAL_PRICE >= 500`), nếu không nó luôn thắng và mọi phép thử
đều ra 0 — trông y như code hỏng. Dựng xong thì phép thử phân biệt được: giỏ 420 ⇒ 30, giỏ 600 ⇒ 0.

## Context

- MR **!2518** (volume bundle không cướp được ATC của theme Horizon): fix là listener `click`
  **capture trên `window`** — đăng ký muộn vẫn chạy trước handler của Horizon. Bối cảnh bug ở
  [[digest-subscriptions-2026-09-01]].
- Script phí ship dùng lại được đã giữ trên nhánh `chore/shipping-tools` trước khi xoá worktree —
  worktree bị gỡ là mất sạch file untracked mà `git status` không nhắc
  ([[digest-subscriptions-2026-08-21]]).
- Hook gate chặn lệnh chỉ-đọc khi repo chính đang đứng ở `master`; truy vấn từ một worktree khác
  là qua được vì chúng dùng chung ref store.

## Liên quan

[[subscriptions]] · [[subscriptions-debug-runbook]] · [[phep-kiem-quan-sat-sai-tang]] ·
[[bang-chung-phan-biet-duoc]] · [[ack-khong-phai-hieu-ung]]
