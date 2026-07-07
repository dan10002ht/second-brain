---
type: note
title: Ownership trong Rust
summary: Mỗi giá trị Rust có đúng một owner; hết scope thì giá trị được giải phóng.
tags: [rust, memory, ownership]
created: 2026-07-06
updated: 2026-07-06
source: [[borrow-checker]]
---

# Ownership trong Rust

Mỗi giá trị trong Rust có đúng **một owner**. Khi owner ra khỏi scope, giá trị
bị `drop` (giải phóng bộ nhớ) tự động — không cần GC, không cần `free()` thủ công.

Ba quy tắc cốt lõi:

1. Mỗi giá trị có một owner duy nhất.
2. Chỉ một owner tại một thời điểm — gán/truyền đi là **move**, owner cũ mất quyền.
3. Owner ra khỏi scope → giá trị bị drop.

Ví dụ move:

```rust
let s1 = String::from("hi");
let s2 = s1;          // move: s1 không còn hợp lệ
// println!("{s1}"); // ❌ compile error: value borrowed after move
```

Move áp dụng cho type không `Copy` (như `String`, `Vec`). Type nhỏ, nằm trên
stack (như `i32`, `bool`) là `Copy` nên được sao chép thay vì move.

Ownership là nền tảng để [[borrow-checker]] đảm bảo an toàn bộ nhớ tại compile time.

## Liên quan
- [[borrow-checker]]
- [[atomic-notes-principle]]
