---
type: resource
title: Borrow checker — mượn tham chiếu an toàn
tags: [rust, memory, borrow-checker]
created: 2026-07-06
updated: 2026-07-06
---

# Borrow checker — mượn tham chiếu an toàn

Thay vì luôn move (xem [[rust-ownership]]), ta có thể **mượn** (borrow) một
tham chiếu tới giá trị mà không lấy quyền sở hữu. Borrow checker kiểm tra các
tham chiếu này tại compile time.

Quy tắc mượn (aliasing XOR mutation):

- Có thể có **nhiều** `&T` (shared/immutable borrow) cùng lúc, **hoặc**
- Đúng **một** `&mut T` (exclusive/mutable borrow) — nhưng không thể có cả hai.

```rust
let mut v = vec![1, 2, 3];
let a = &v;        // shared borrow
let b = &v;        // ok, nhiều shared borrow
println!("{a:?} {b:?}");
let m = &mut v;    // ok vì a, b không còn được dùng sau đây (NLL)
m.push(4);
```

Điểm hay: **Non-Lexical Lifetimes (NLL)** — borrow kết thúc ở lần dùng cuối,
không phải cuối scope. Nhờ đó nhiều code "trông sai" vẫn compile.

Lỗi thường gặp:

- "cannot borrow as mutable because it is also borrowed as immutable" → có
  `&` còn sống khi bạn cố lấy `&mut`. Thu hẹp scope của shared borrow.
- Trả về tham chiếu tới biến local → dùng lifetime hoặc trả owned value.

Borrow checker chính là lý do Rust ngăn được data race ngay khi biên dịch.

## Liên quan
- [[rust-ownership]]
- [[moc-learning-pkm]]
