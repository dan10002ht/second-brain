---
type: feedback
title: Gặp giới hạn platform thì đi tìm đường gỡ, đừng dựng quota chặn
summary: Tôi đề xuất cap danh sách ở 20 và cảnh báo merchant khi vượt; dantt bác thẳng — với khách enterprise, một cái chặn chỉ đổi lỗi im lặng thành lỗi ồn ào, còn sản phẩm thứ 21 vẫn không bán được.
tags: [feedback, avada, shopify, method, architecture]
created: 2026-09-16
updated: 2026-09-16
source: project `subscriptions` — session history 2026-09-16 (landing joyxjoy, trần 20 handle của `all_products`)
---

# Giới hạn platform thì gỡ, không chặn

Landing chỉ hiện 1/72 box vì `all_products` của Shopify Liquid có trần **20 unique handle mỗi
trang**. Tôi đề xuất: cap ở 20, thêm cảnh báo trong design mode để merchant thấy **lý do** box biến
mất thay vì mất im lặng.

dantt bác:

> *"vậy kiếm cách nào để nó work được chứ ? chứ khách enterprise làm mấy cái chặn như vậy ko ổn đâu
> cha"*

Bỏ hướng đó, đổi nguồn lặp sang `collection_list` (20 collection × 50 sản phẩm ≈ 1000 box, không
đụng `all_products`) — xem [[2026-09-16-landing-doi-nguon-lap-sang-collection-list]].

**Why:** một cái chặn chỉ đổi **hình dạng** của lỗi, không đổi **hậu quả**. Merchant enterprise vẫn
không bán được box thứ 21; thứ duy nhất họ nhận thêm là một dòng cảnh báo nói rằng app không làm
được việc. Và trong ca này, docs của chính Shopify đã chỉ ra đường đi khác — nghĩa là cái trần đó
chưa bao giờ là trần thật, nó là trần của **cách tôi chọn đọc dữ liệu**.

**How to apply:**

- Khi chạm giới hạn của platform, trước khi đề xuất bất kỳ cap/quota/cảnh báo nào, phải tra docs xem
  platform có đường khác không. Ở Shopify, gần như luôn có: `all_products` → `collection.products`,
  `collection.products` → `{% paginate %}`, metafield → nguồn khác.
- Cap chỉ được đề xuất khi **đã chứng minh** không có đường gỡ, và khi đó phải nói rõ là "đã tra X,
  Y, Z, không có đường nào" — chứ không phải trình bày cái chặn như một giải pháp.
- Phân biệt hai loại giới hạn: giới hạn của **platform** (phải gỡ hoặc đi vòng) và giới hạn của
  **dữ liệu khách** (được phép nói thẳng với merchant). Nhầm loại thứ nhất thành loại thứ hai là đẩy
  công việc của mình sang cho khách.
- Cùng tinh thần với [[feedback-khong-khep-viec-khi-con-khe-ho]]: đừng đóng việc bằng cách thu hẹp
  phạm vi cho vừa thứ mình làm được.

Liên quan: [[2026-09-16-landing-doi-nguon-lap-sang-collection-list]] · [[digest-subscriptions-2026-09-16]] ·
[[feedback-khong-khep-viec-khi-con-khe-ho]] · [[shopify-app-dev]]
