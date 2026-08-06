---
type: feedback
title: Chỉ comment khi code rối — code đọc hiểu được thì đừng comment
summary: User cắt comment thừa trong code fix CLS; giữ comment ngắn đúng chỗ có magic number hoặc lý do không suy ra được từ code, bỏ phần diễn giải lại thứ code đã nói.
tags: [feedback, method, js, avada]
created: 2026-08-06
source: project "subscriptions" — session history 2026-08-05 (fix skeleton ReportSummary)
---

# Comment chỉ khi code rối

User nói nguyên văn:

> "ko cần comment nhiều đâu, code có thể đọc hiểu được mà? code bị rối thì mới comment chứ ba"

Bối cảnh: fix skeleton lệch chiều cao trong `ReportSummary` — mỗi thay đổi kèm một comment
giải thích, trong khi bản thân đoạn code đã đủ rõ.

**Why:** comment diễn giải lại thứ code đã nói không thêm thông tin, nhưng vẫn phải bảo trì
— sửa code mà quên sửa comment là sinh ra một câu sai nằm ngay cạnh câu đúng. Giá trị của
comment nằm ở thứ **không đọc ra được từ code**: một con số kỳ lạ ở đâu ra, hoặc vì sao
buộc phải làm cách này.

**How to apply:** sau khi sửa xong, xoá hết comment mô tả *cái gì*; chỉ giữ lại khi:
- có **magic number** cần nguồn (đã giữ: `24px` line box, lý do bắt buộc `reportAllChanges`);
- có một ràng buộc/nguyên nhân bên ngoài mà code không thể nói (workaround của thư viện, quirk
  của browser, quyết định sản phẩm).

Mặc định là **không comment**. Nếu thấy cần comment để đoạn code đọc được, cân nhắc sửa code
trước.

## Liên quan
- [[digest-subscriptions-2026-08-06]] — session gốc.
- [[feedback-follow-conventions]] — cùng hướng: bám convention sẵn có của repo.
- [[subscription-work-style]] · [[subscriptions]]
