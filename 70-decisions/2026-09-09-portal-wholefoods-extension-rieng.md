---
type: decision
title: Portal Joy Wholefoods đi bằng extension customer account RIÊNG, không sửa portal dùng chung
summary: Mockup portal của Joy Wholefoods được dựng thành một Customer Account UI extension riêng (`customer-account-ui-wholefoods`), không đụng một dòng nào vào extension/portal/scripttag đang phục vụ mọi shop — đổi lại là chấp nhận trùng lặp code và một mockup không dựng lại được 1:1 vì Polaris Web Components.
tags: [avada, subscription, shopify, extensions, architecture]
created: 2026-09-09
updated: 2026-09-09
review: 2026-12-09
source: project `subscriptions` — session history 2026-09-09; spec `docs/superpowers/specs/2026-09-09-wholefoods-portal-design.md` (`52414636d`), plan `docs/superpowers/plans/2026-09-09-wholefoods-portal.md` (`a7ec5d5b2`), nhánh `feat/wholefoods-portal`
---

# Portal Joy Wholefoods: extension riêng thay vì sửa portal dùng chung

**Bối cảnh.** Khách joyxjoy/Joy Wholefoods đưa mockup redesign cho trang customer account
(`product-page-clone/portal/index.html`). Phần lớn màn trong mockup đã có sẵn ở Customer Account UI
hiện tại (Subscriptions, SubscriptionDetail 3 tab, OrderDetail, các modal swap/pause/cancel/frequency/
skip). Câu hỏi là sửa cái đang có hay dựng cái mới.

**Quyết định.** Dựng extension mới `customer-account-ui-wholefoods` cho riêng shop này. Extension cũ,
theme app extension block và scripttag **không bị đụng một dòng nào** (đã audit ở task cuối). Nối vào
backend qua các endpoint sẵn có — **không viết endpoint mới**: `PUT /order/product/add`
(`orderController.addProductToOrder`) và `addOneTimeLinesToFirstCycle()`
(`manualSubscriptionService.js`) đã làm đúng luồng one-off. 10 task theo plan, codex implement /
Claude verify, mỗi task qua mutation test.

**Why:**

- Cùng lý do đã chốt cho phần landing ở [[2026-09-08-bespoke-khong-vao-theme-app-extension]]: đây là
  **bespoke một shop**. Thứ dùng chung cho cả fleet mà mang bố cục riêng của một khách thì mỗi lần
  khách đó đổi ý là một lần rủi ro cho mọi shop còn lại.
- Portal hiện tại là hạ tầng đang chạy tiền thật. Rủi ro không cân xứng: sửa nó để hợp mockup thì
  vùng ảnh hưởng là toàn bộ merchant, còn lợi ích chỉ thuộc về một shop.
- Backend không phải viết mới ⇒ chi phí thật của "extension riêng" chỉ nằm ở tầng UI, thấp hơn nhiều
  so với ước lượng ban đầu.

**Tradeoff / đánh đổi:**

- **Được:** cô lập tuyệt đối (audit chứng minh được bằng `git diff` rằng ba surface cũ không đổi);
  đổi UI cho khách không cần đụng release chung; mỗi task verify được độc lập.
- **Mất — trùng lặp:** phần lớn logic màn hình được **copy** từ extension cũ (task 1 chỉ scaffold +
  copy). Từ nay hai bản sống song song: một bug sửa ở bên này không tự sang bên kia. Đây là món nợ
  phải trả bằng kỷ luật, không có cơ chế nào bắt được.
- **Mất — bị bỏ quên tầng phân quyền:** hệ quả đã xảy ra ngay trong phiên. Portal cũ có
  `checkPermissionCustomerPortal.js` với **18 hàm gate** đọc từ `shop.customerPortal`; bản mới copy UI
  mà không copy tầng này, nên mọi thiết lập merchant tắt/bật đều vô hiệu cho tới khi được nối lại
  (task 11). Đây chính là hình dạng điển hình của cái giá "extension riêng".
- **Mockup không dựng lại được 1:1.** Extension chạy Polaris Web Components (`<s-button>`,
  `<s-section>`…) — thành phần và bố cục do Shopify quy định, không phải HTML tự do như trang mockup
  Next.js của khách. Phải nói trước với khách thay vì hứa giống hệt.
- **Phương án đã loại — sửa thẳng extension/portal hiện tại:** hết trùng lặp, nhưng đổi lấy rủi ro
  cho toàn bộ merchant và một luồng release chung bị một khách chi phối.
- **Phương án đã loại — làm bằng trang web ngoài (như mockup Next.js):** dựng đúng 1:1 được, nhưng
  rơi ra ngoài customer account của Shopify, mất luôn danh tính khách đã đăng nhập và phải tự làm auth.

**Điều kiện cần kiểm ở mốc review:** (a) hai bản portal đã lệch nhau tới mức nào — có bug nào đã sửa
một bên mà bên kia còn không; (b) tầng phân quyền đã được nối đủ chưa; (c) còn shop nào khác đòi
bespoke portal không — nếu có shop thứ hai thì cách này không nhân bản được và phải nghĩ lại.

## Liên quan
- [[subscriptions]] · [[digest-subscriptions-2026-09-09]] · [[cau-extension-chay-that-tren-store]]
- [[2026-09-08-bespoke-khong-vao-theme-app-extension]] — cùng nguyên tắc, tầng theme
- [[2026-08-19-page-custom-o-theme-khach]]
