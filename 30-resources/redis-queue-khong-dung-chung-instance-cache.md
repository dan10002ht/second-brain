---
type: resource
title: Redis làm hàng đợi không được nằm chung instance với cache
summary: Instance cache cấu hình eviction để bảo vệ RAM, nên một job đẩy vào đó có thể bị đuổi lặng lẽ — hàng đợi phải nằm trên instance `noeviction`, và "cùng là Redis" không phải lý do gộp.
tags: [redis, backend, architecture]
created: 2026-09-01
updated: 2026-09-01
source: project `ticket-mcrsv` — session history (task 136), chốt bằng cấu hình thật của 2 instance
---

Khi một hệ thống có hai instance Redis — một cho cache, một cho hàng đợi — câu hỏi "job của tôi nên
nối vào cổng nào" trông như chuyện cấu hình, nhưng nó là chuyện **mất việc âm thầm**.

## Điều quyết định là `maxmemory-policy`, không phải cổng

| | Instance cache | Instance queue |
|---|---|---|
| `maxmemory-policy` | `allkeys-lru` / `volatile-*` | `noeviction` |
| Khi đầy RAM | **đuổi key cũ**, ghi vẫn thành công | **từ chối ghi**, client nhận lỗi |
| Hệ quả với một job | job biến mất, không ai biết | job không vào được, và bạn biết ngay |

Một cache được thiết kế để *chấp nhận mất dữ liệu* — đó chính là công dụng của nó. Đẩy job vào đấy
là chọn một kho chứa có quyền vứt hàng của bạn để tự cứu mình. Không có log, không có lỗi, không có
retry: `LPUSH` trả OK, và item nằm đó cho tới lượt eviction nào đó.

Ngược lại, `noeviction` biến "hết RAM" thành lỗi ồn ào ở đúng chỗ ghi — hỏng ồn ào bao giờ cũng rẻ
hơn hỏng im lặng. Đây là cùng một nguyên tắc với [[chan-agent-bang-cau-hinh]].

## Cách kiểm, không đoán

```bash
redis-cli -p <port> CONFIG GET maxmemory-policy
redis-cli -p <port> CONFIG GET maxmemory
redis-cli -p <port> LLEN <tên-queue>      # có job mồ côi ở instance sai không?
```

Bước `LLEN` trên **cả hai** instance mới là phép kiểm thật: nếu instance cache đang giữ job thì đã có
việc bị nối nhầm từ trước, và số 0 ở cả hai là bằng chứng chưa mất gì.

Đọc `docker-compose`/manifest cũng chưa đủ — tên service (`dev-redis-cache` vs `dev-redis-queue`) là
ý định của người viết, còn `CONFIG GET` là thứ đang thật sự chạy. Xem [[ack-khong-phai-hieu-ung]].

## Vì sao dễ nối nhầm

Cả hai đều nói cùng một protocol, cùng một client library, và `.env` chỉ khác nhau một chữ số ở cổng.
Không có tầng nào trong ứng dụng phân biệt được — code queue chạy hoàn hảo trên instance cache cho tới
ngày RAM đầy. Rào chắn duy nhất đặt được là ở tầng cấu hình: đặt tên instance theo *hợp đồng dữ liệu*
(mất được / không mất được) chứ không theo công nghệ, và để guard đối chiếu `env.example` với default
trong code.

→ [[caching-layers]] · [[chan-agent-bang-cau-hinh]] · [[dong-bo-chan-luong-khong-phai-chuyen-hieu-nang]] · [[ack-khong-phai-hieu-ung]]
