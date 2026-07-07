---
type: resource
title: Các bẫy thường gặp với asyncio
summary: Tổng hợp các bẫy asyncio thường gặp khi viết code Python.
tags: [python, asyncio, concurrency]
created: 2026-07-06
updated: 2026-07-06
---

# Các bẫy thường gặp với asyncio

Tổng hợp các lỗi hay mắc khi viết code asyncio (mở rộng từ
[[python-asyncio-blocking]]).

**1. Quên `await` một coroutine.** Gọi `foo()` mà không `await` chỉ tạo ra một
coroutine object rồi vứt đi — code không chạy, và có warning
"coroutine was never awaited".

**2. Chạy tuần tự khi tưởng là song song.**

```python
a = await fetch(u1)
b = await fetch(u2)   # chạy lần lượt, KHÔNG song song
```

Muốn song song thật sự, dùng `gather`:

```python
a, b = await asyncio.gather(fetch(u1), fetch(u2))
```

**3. Blocking call làm nghẽn loop** — xem [[python-asyncio-blocking]].

**4. "Fire-and-forget" bị GC.** `asyncio.create_task(...)` mà không giữ tham
chiếu có thể bị garbage-collect giữa chừng. Lưu task vào một set để giữ sống.

**5. Nuốt exception.** Exception trong task chỉ nổ ra khi bạn `await` task đó
(hoặc dùng `gather(..., return_exceptions=True)` để thu về). Task bị bỏ quên =
lỗi bị nuốt.

## Liên quan
- [[python-asyncio-blocking]]
- [[moc-learning-pkm]]
