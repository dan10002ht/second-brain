---
type: feedback
title: Trích code trong chat phải nguyên văn kèm `file:line`, không tự rút gọn
summary: Tôi viết một dòng code "rút gọn cho dễ đọc" trong tin nhắn, user đọc nó như code thật trong repo và mất một lượt đi tranh luận về dòng không hề tồn tại.
tags: [feedback, method, writing, debug]
created: 2026-08-30
updated: 2026-08-30
source: project "subscriptions" — session history 2026-08-30 (JSUB-260828, ATC volume bundle)
---

# Trích code trong chat phải nguyên văn kèm `file:line`

Trong lúc điều tra bug ATC của Volume Bundle, tôi viết trong tin nhắn:

```js
const els = document.querySelectorAll(ADD_TO_CART_BUTTON_SELECTORS);
```

Đó là bản **tôi tự rút gọn cho dễ đọc**, không phải dòng nào trong repo. User đọc nó như code
thật và quay lại hỏi *"tôi thấy code thế này mà?"* — mất trọn một lượt để đính chính, đúng giữa
lúc đang truy root cause.

**Why:** trong một phiên debug, mọi dòng code tôi dán ra đều được đọc như **bằng chứng**, không
phải minh hoạ. Một bản rút gọn trông y hệt bản thật thì không có cách nào phân biệt được, nên nó
không làm câu trả lời dễ hiểu hơn — nó làm hỏng nguồn sự thật chung giữa hai người. Cùng một bệnh
với [[feedback-doc-nguyen-van-tai-lieu]]: bản tóm tắt của tôi lược mất đúng chi tiết quyết định.

**How to apply:**

- Dán code là dán **nguyên văn** từ file, kèm `path:line`. Nếu phải cắt thì cắt bằng `…` ở giữa,
  không viết lại.
- Cần diễn giải cho gọn thì nói bằng văn xuôi ("chỗ này querySelectorAll trên danh sách selector"),
  **không** đóng gói nó thành code block.
- Nếu buộc phải viết pseudo-code, ghi thẳng ở dòng đầu là *"pseudo, không phải code trong repo"*.
- Khi user trích lại một đoạn code để hỏi, việc đầu tiên là **grep chuỗi đó trong repo** trước khi
  trả lời — nếu 0 kết quả thì nhiều khả năng nó đến từ chính tin nhắn của tôi.

## Liên quan

[[feedback-doc-nguyen-van-tai-lieu]] · [[bang-chung-phan-biet-duoc]] ·
[[digest-subscriptions-2026-08-28]] · [[subscriptions]]
