---
type: note
title: Shipped aws — commit landed 2026-09-14: đóng cả hai course (gameserver 42/42, system-design 30/30)
summary: Toàn bộ 8 chương gameserver còn lại và 22 bài system-design đã lên `main` trong một ngày — cập nhật lại câu "chương 5 đã lên main" của digest cùng ngày, và bổ sung hash capstone `f1d40af` mà digest bỏ sót.
tags: [aws, learning, system-design]
created: 2026-09-15
updated: 2026-09-15
source: repo `aws` — git log 2026-09-14 (hash đã verify)
---

# Shipped — `aws`, commit landed 2026-09-14

Nội dung, bài học và các lỗi bắt được khi soát chéo đã ghi đủ ở [[digest-aws-2026-09-14]] — note này
**chỉ** ghi phần lịch sử đáp xuống mà digest chưa có.

## Shipped — đều lên thẳng `main`, một ngày

**Course `gameserver` — đóng ở 42/42 bài:**

| Hash | Chương |
|---|---|
| `016412e` | ch3 Determinism (3 bài) |
| `cb8dfb9` | ch4 Mạng nền tảng (5 bài) |
| `faaa551` | ch5 Netcode lõi (6 bài, chạy 2 đợt) |
| `75428bb` | ch6 Đồng bộ state & băng thông (5 bài) |
| `37588f6` | ch7 Kiến trúc & scale (5 bài) |
| `577184a` | ch8 Chống gian lận (3 bài) |
| `87e5012` | ch9 Hiệu năng & vận hành (5 bài) |
| `f1d40af` | ch10 Capstone (2 bài) — **42/42** |

**Course `system-design` — đóng ở 30/30 bài:**

| Hash | Chương |
|---|---|
| `67d08b5` | ch5 Concept lõi hệ phân tán — `sd-09` → `sd-12` |
| `9490ef0` | ch6 Scale, Search & Streaming — `sd-13` → `sd-16` |
| `9834cd0` | hết ch6 + mở ch7 — `sd-17` → `sd-20` |
| `e9c1dbb` | ch7 Media, Storage & Geo — `sd-21` → `sd-24` |
| `3215bf6` | ch8 Realtime & Money + Google Maps — `sd-25` → `sd-30`, **30/30** |

## Reverted

Không có revert, không có nhánh nào bị bỏ. Cả hai course đi thẳng lên `main` theo từng chương.

## Deploy notes

Repo nội dung, không có CI deploy. Mỗi commit đều đụng `web/data/lessons.ts` (đăng ký bài) và
`3215bf6` đụng `web/data/courses.ts` — tức số bài trong UI đổi theo từng commit chứ không có bước
publish riêng. `f1d40af` còn đồng bộ lại `roadmap/gameserver.md`: 26 tiêu đề trong roadmap đã trôi
so với file thật sau 42 bài do 40+ agent viết.

## Cập nhật so với digest cùng ngày

[[digest-aws-2026-09-14]] viết *"Chương 5 đã lên `main`"* cho course system-design và liệt kê chuỗi
hash gameserver dừng ở `87e5012`. Tại thời điểm git log này, **cả hai course đã đóng trọn**: thêm 5
commit system-design (đủ 30 bài) và commit capstone `f1d40af`. Không mâu thuẫn — digest viết theo
trạng thái lúc chạy session, đây là trạng thái cuối ngày.

Liên quan: [[aws]] · [[digest-aws-2026-09-14]] · [[digest-aws-2026-09-09]] ·
[[soat-cheo-noi-dung-sinh-song-song]] · [[viet-tai-lieu-day-duoc]] · [[dev-skills]]
