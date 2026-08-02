---
type: note
title: Digest Mooni — bổ sung nhỏ cho lần đổi postgres alpine và cách né CORS ở admin (2026-08-01)
summary: CHỈ 2 điểm chưa ghi — warning collation glibc→musl khi đổi postgres:16 sang 16-alpine trên volume cũ không refresh được (phải tạo volume mới), và admin gọi API qua Server Action (server-to-server, forward cookie) nên không chạm CORS.
tags: [tooling, debug, postgresql, nextjs]
created: 2026-08-01
source: project "moonie" (Mooni Cake) — session history
---

# Digest Mooni — 2026-08-01

> Phiên được mine lần này **trùng gần như hoàn toàn** với loạt digest đã có
> ([[digest-moonie-2026-07-17]] → [[digest-moonie-2026-07-27]]): harness
> generator→evaluator→held-out, CI golangci-lint, testcontainers/Colima, npm lock lệch
> platform, race TOCTOU, timezone doanh thu, gate UI… đều đã ghi. Dưới đây **chỉ** là
> hai điểm chưa nằm ở đâu cả.

## Bugs / gotchas

- **Đổi `postgres:16` → `16-alpine` trên volume cũ để lại warning collation không chữa
  được.** Volume được initdb dưới **glibc** (image debian), giờ mở bằng **musl**
  (alpine) → Postgres cảnh báo lệch collation version. Không `REFRESH COLLATION VERSION`
  được vì đây là **đổi provider** (glibc → musl), không phải nâng version trong cùng
  provider. Cách xử đã dùng: DB dev nên **tạo volume mới**, migrate + seed lại → hết
  warning và mọi tầng (dev/test/CI/deploy) đồng nhất musl. Bổ sung cho mục "đổi alpine
  giữ volume" ở [[digest-moonie-2026-07-22]] — data **có** giữ được (cùng major 16),
  nhưng warning thì đi kèm.

## Techniques

- **Admin UI gọi API qua Server Action (server-to-server, forward cookie) nên không
  đụng CORS.** Khác với đường landing (browser gọi thẳng Go API `:8080` từ origin
  `:3000` → phải cấu hình CORS phía server, xem [[digest-moonie-2026-07-22]]). Ở admin,
  `web/app/actions/admin.ts` fetch từ Next server và tự forward cookie `mc_admin` →
  cookie httpOnly vẫn dùng được mà không phải mở CORS cho origin nào.
  *Chưa xác minh:* hai cách này cùng tồn tại (landing dùng CORS, admin dùng Server
  Action) hay Server Action đã thay hẳn CORS — đọc `web/app/actions/` và middleware CORS
  của Go trước khi dựa vào.

## Liên quan

[[digest-moonie-2026-07-27]] · [[digest-moonie-2026-07-25]] · [[digest-moonie-2026-07-22]] ·
[[dev-skills]] · [[moc-learning-pkm]]
