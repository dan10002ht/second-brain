---
type: decision
title: Bỏ checkbox "add portal link vào navigation menus", đổi sang link mở trình quản lý menu của Shopify
summary: App thôi giữ một toggle bật/tắt link Customer Portal trong navigation menu; thay bằng helptext "click here" gọi đúng `openManageMenus()` — merchant tự quản menu bên Shopify, còn giá trị `accessLink.customerPortalNavigation` đã lưu thì vẫn được hydrate và ghi lại nguyên vẹn.
tags: [avada, subscription, shopify, extensions]
created: 2026-09-04
updated: 2026-09-04
status: active
review: 2026-12-04
source: repo `subscriptions` — git log 2026-09-03, commit `bf272773b` (nhánh `feat/portal-preview`, SB-16175)
---

Card Customer Portal bỏ hai thứ: banner info *"Contact us … customize your URL"* và **checkbox
*Add link to the Subscriptions portal page to navigation menus*** (kèm divider). Việc quản lý menu
chuyển thành một dòng helptext dưới ô portal link: *"To manage your navigation menus, click here"* —
link gọi đúng `openManageMenus()` mà checkbox cũ vẫn gọi. `handleNavigationChange` thành dead code
nên gỡ khỏi `CustomerPortal.js` và khỏi provider value.

Bằng chứng: `bf272773b` (3 file, +12/−66) và `03cb24b8b` (propagate 2 key locale mới
`manageNavigationMenus`, `clickHere` sang 7 file translation). **Chưa vào master** — còn trên
`feat/portal-preview`.

## Why

- BA báo ticket "chưa đạt" **sau khi** 3 mục đánh số trong ticket đã làm xong, vì ảnh *UI mới*
  (capture `6zck0uXA6Uik`) được thêm vào description muộn và đòi thêm phần dưới cụm nút. Bản chốt
  UI đó không có checkbox.
- Checkbox và helptext gọi **cùng một hành động** (`openManageMenus()`), nên checkbox không phải là
  một khả năng riêng — nó là một cái công tắc đứng cạnh một cái nút cùng chức năng.
- Việc thêm/bớt mục trong navigation menu vốn là màn của Shopify; giữ một trạng thái song song
  trong app là giữ thêm một nguồn sự thật có thể lệch.

## Tradeoff

- **Merchant mất khả năng bật/tắt từ trong app.** Muốn đổi thì phải sang Shopify. Đã chấp nhận theo
  bản chốt UI của BA.
- **Setting cũ trở thành one-way.** `checked` vẫn được hydrate từ `accessLink.customerPortalNavigation`
  lúc load và `handleSave` ghi lại đúng giá trị đó — nên save một setting khác **không** tắt ngầm link
  của merchant. Nhưng cũng có nghĩa là: shop nào đang `true` thì sẽ mãi `true` trong DB, không còn
  đường nào trong app đặt nó về `false`. Một trường không ai ghi được nữa nhưng vẫn được đọc là loại
  dữ liệu dễ mục — nếu sau này có logic đọc nó, phải nhớ nó đóng băng từ 09-2026.
- **Đè thêm áp lực lên banner setup.** [[2026-08-26-banner-portal-theo-menu]] chốt banner "chưa setup
  customer portal" ẩn/hiện **theo việc extension có trong menu customer account hay không**. Giờ app
  không còn lever nào tự đưa link vào menu, nên đường duy nhất để tắt banner đó là merchant tự thao
  tác bên Shopify. Chưa đo được tỉ lệ merchant làm được bước này — là thứ đáng nhìn lại ở mốc review.

Liên quan: [[subscriptions]] · [[shipped-subscriptions-2026-09-04]] · [[2026-08-26-banner-portal-theo-menu]] ·
[[digest-subscriptions-2026-09-03]]
