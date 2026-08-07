---
type: feedback
title: Feature mới phải opt-in — mặc định tắt, nhất là khi nó gửi mail thay merchant
summary: Default của một feature mới là `enabled: false`; khách cũ không bao giờ được tự nhiên bật một hành vi gửi mail ra ngoài mà họ chưa đồng ý.
tags: [feedback, avada, shopify, saas]
created: 2026-08-07
updated: 2026-08-07
source: project "pdf" — session history (SB-15301 payment reminder)
---

Feature mới ship ra phải **mặc định tắt**. Với feature có hành vi ra bên ngoài (gửi mail
cho khách của merchant, gọi webhook, đẩy thông báo) thì đây là bắt buộc, không phải sở thích.

**Why:** default `enabled: true` nghĩa là **mọi shop cũ đang dùng plan đó tự nhiên bị bật**
một hành vi họ chưa từng đồng ý — ở ca payment reminder là app tự gửi mail cho khách của
merchant. Merchant không biết, không duyệt nội dung, và người nhận đầu tiên biết chuyện là
khách cuối. Rủi ro danh tiếng lớn hơn nhiều so với giá trị của "bật sẵn cho tiện".

**How to apply:** đặt default ở **đúng một nguồn sự thật** (`constants/defaultData.js`) rồi
kiểm hai chỗ hay lệch trước khi kết luận là xong:

1. **Cron/worker có coi `undefined` là bật không** — kiểu `enabled !== false` sẽ vô hiệu hoá
   việc đổi default, phải sửa thành `enabled === true`.
2. **Đơn/doc đã tồn tại** — nếu cờ chỉ được seed ở nhánh tạo mới (`.add()`), dữ liệu cũ
   không có cờ và sẽ rơi vào nhánh nào? Trả lời được rồi mới đóng task; nếu hoãn backfill
   thì ghi rõ là **cố ý hoãn** kèm lý do.

→ [[digest-pdf-2026-08-07]] · [[pdf]]
