---
type: note
title: Type narrowing trong TypeScript
tags: [typescript, types, narrowing]
created: 2026-07-06
updated: 2026-07-06
source: [[discriminated-unions]]
---

# Type narrowing trong TypeScript

Narrowing là quá trình TypeScript **thu hẹp** một union type xuống type cụ thể
hơn dựa vào control flow. Đây là lý do bạn hiếm khi cần `as` (type assertion).

Các cách narrow phổ biến:

- `typeof x === "string"` — narrow primitive.
- `"prop" in obj` — narrow theo sự tồn tại của property.
- `x instanceof Foo` — narrow theo class.
- Truthiness check `if (x)` — loại `null`/`undefined`.
- **Discriminated union** — narrow theo field literal chung (xem [[discriminated-unions]]).

```ts
function len(x: string | string[]): number {
  if (typeof x === "string") return x.length; // x: string
  return x.length;                            // x: string[]
}
```

User-defined type guard mở rộng narrowing cho logic tùy ý:

```ts
function isString(v: unknown): v is string {
  return typeof v === "string";
}
```

Narrowing khiến compiler làm việc thay bạn — ít cast, ít bug runtime hơn.

## Liên quan
- [[discriminated-unions]]
- [[atomic-notes-principle]]
