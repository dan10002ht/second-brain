---
type: resource
title: Caching qua các layer
summary: Request đi từ client→CDN→proxy→app→Redis→DB; mỗi chặng cache được, càng gần client càng nhanh/rẻ nhưng càng khó invalidate. 3 pattern lõi + 3 cái khó thật.
tags: [caching, performance, system-design, architecture, learning]
created: 2026-07-13
updated: 2026-07-13
---

# Caching qua các layer

> Nguyên tắc gốc: **cache = đánh đổi freshness lấy tốc độ/chi phí.** Càng cache
> gần client càng nhanh & rẻ, nhưng càng khó làm mới (invalidate).

Một request đi: client → CDN → reverse proxy → app → cache phân tán → DB.
Mỗi chặng bạn có thể chặn lại và trả kết quả đã lưu.

## Các layer

| # | Layer | Cache ở đâu | Công cụ | Invalidate bằng |
|---|-------|-------------|---------|-----------------|
| 1 | Client | Browser (mem/disk), app state | HTTP cache, Service Worker, React Query/SWR | TTL, `ETag`, revalidate |
| 2 | CDN / Edge | POP gần user | Cloudflare, Fastly, CloudFront | `Cache-Control`, purge API, cache tag |
| 3 | Reverse proxy | Trước app server | Nginx, Varnish | TTL, purge |
| 4 | Application | Trong process | in-memory LRU map, memoize | TTL, event xoá key |
| 5 | Distributed | Shared giữa nhiều instance | **Redis**, Memcached | TTL, `DEL key`, pub/sub |
| 6 | Database | Query / result | materialized view, query cache, pool | refresh, trigger |

## 3 pattern lõi

**Cache-Aside** (phổ biến nhất, đi với Redis):
```
đọc:  data = cache.get(key)
      if miss: data = db.query(); cache.set(key, data, ttl)
      return data
ghi:  db.write(); cache.del(key)   // xoá chứ đừng update value → tránh stale
```

**HTTP caching** (layer 1–3), không code thêm, chỉ set header:
```
Cache-Control: public, max-age=300, stale-while-revalidate=60
ETag: "abc123"   // client gửi If-None-Match → server trả 304 nếu chưa đổi
```

**Read-through / Write-through**: cache tự lo đọc/ghi DB (thư viện lo, app không
thấy). Đơn giản hơn nhưng kém linh hoạt hơn cache-aside.

## 3 cái khó thật sự

1. **Invalidation** — "một trong 2 thứ khó nhất trong CS". Ưu tiên **TTL ngắn +
   xoá theo event**, tránh tự tay cập nhật value.
2. **Key design** — key phải gồm mọi chiều ảnh hưởng kết quả, vd
   `product:{shopId}:{id}:{locale}`. Thiếu 1 chiều → trả nhầm data (đúng loại bug
   multitenant — xem [[firestore-multitenant]] cô lập theo `shopId`).
3. **Stampede / thundering herd** — key hết hạn, ngàn request cùng miss đập vào
   DB. Chống bằng lock / single-flight, hoặc `stale-while-revalidate`.

## Liên quan
- [[firestore-multitenant]] — cùng bài học "key/scope phải gồm `shopId`".
- Redis đã dùng thực tế trong Joy Subscription (xem [[subscription-digest-2026-07-10]]).
