---
type: note
title: Gọi hàm blocking làm nghẽn event loop asyncio
tags: [python, asyncio, concurrency]
created: 2026-07-06
updated: 2026-07-06
source: [[asyncio-gotchas]]
---

# Gọi hàm blocking làm nghẽn event loop asyncio

Trong asyncio chỉ có **một event loop chạy trên một thread**. Bất kỳ lời gọi
blocking đồng bộ nào (đọc file sync, `time.sleep`, `requests.get`, CPU nặng)
sẽ **đóng băng toàn bộ loop** — mọi coroutine khác dừng lại cho tới khi xong.

```python
async def bad():
    time.sleep(5)  # ❌ chặn CẢ loop 5 giây

async def good():
    await asyncio.sleep(5)  # ✅ nhường quyền cho coroutine khác
```

Với code blocking không thể tránh (thư viện sync), đẩy ra thread pool:

```python
await asyncio.to_thread(requests.get, url)  # Python 3.9+
```

Nguyên tắc: `await` chỉ tạo điểm nhường (yield point). Không có `await` nào
trong một đoạn thì đoạn đó chạy liền mạch, không cho coroutine khác xen vào —
xem thêm các bẫy khác ở [[asyncio-gotchas]].

## Liên quan
- [[asyncio-gotchas]]
- [[atomic-notes-principle]]
