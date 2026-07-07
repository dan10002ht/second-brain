---
type: resource
title: Discriminated unions
summary: Tagged union theo field discriminant + kiểm tra exhaustiveness trong TypeScript.
tags: [typescript, types, patterns]
created: 2026-07-06
updated: 2026-07-06
---

# Discriminated unions

Một discriminated (tagged) union là union các object cùng có một field literal
chung — gọi là **discriminant** — để TypeScript biết đang ở nhánh nào. Đây là
công cụ mạnh nhất cho [[ts-type-narrowing]].

```ts
type Shape =
  | { kind: "circle"; r: number }
  | { kind: "square"; side: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2; // s: circle
    case "square": return s.side ** 2;        // s: square
  }
}
```

Lợi ích lớn: **exhaustiveness checking**. Thêm một biến thể mới vào union,
`switch` sẽ báo lỗi nếu bạn quên xử lý — nhờ nhánh `never`:

```ts
default: {
  const _exhaustive: never = s; // ❌ error nếu thiếu case
  return _exhaustive;
}
```

Pattern này thay thế class hierarchy / visitor pattern trong nhiều trường hợp,
và map rất đẹp sang enum của Rust (xem [[rust-ownership]] cho tư duy tương tự).

## Liên quan
- [[ts-type-narrowing]]
- [[moc-learning-pkm]]
