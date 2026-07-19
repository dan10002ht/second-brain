---
type: note
title: Digest moonie 2026-07-18 — security hardening (auth/proxy/CSRF/upload), cross-platform lock, held-out-too-strict
summary: Phần MỚI so với digest 07-17 (cùng session, giai đoạn 4–6) — JWT/auth hardening, trusted-proxy X-Forwarded-For, CSRF Origin fallback, upload magic-byte, int truncation tài chính, root cause package-lock lệch platform (Tailwind v4 native), và failure mode "held-out quá khắt khe".
tags: [nextjs, backend, auth, debug, method]
created: 2026-07-18
source: moonie (session history)
---

# Digest moonie — 2026-07-18

> Tiếp nối [[digest-moonie-2026-07-17]] (CÙNG session f1f95dd7, giai đoạn 4–6: Admin API + Admin UI +
> Deploy hardening). Chỉ ghi phần MỚI, không lặp harness/testcontainers/Colima-socket/golangci-lint
> đã có ở digest 07-17. "chưa xác minh" nếu không confirm.

## Bugs (root cause) — do go-reviewer / verify độc lập bắt

- **int truncation = hỏng dữ liệu tài chính âm thầm**: `quantity=4294967301` bị cắt qua int32 → `5`, đơn tính tiền sai mà không lỗi. Fix: validate biên (`maxOrderItemQuantity`, int64 overflow guard `MaxOrderAmount`, quá lớn → 400) + map FK `23503`→400. Loại bug này held-out chạy đơn thường KHÔNG thấy — reviewer phải chủ động test input cực đoan.
- **TOCTOU race convert lead→order** (nhắc lại 07-17 nhưng đây là lần bắt ở admin): go-reviewer **tự viết test 2-goroutine** chứng minh 2 đơn/1 lead mồ côi; fix guard atomic `WHERE order_id IS NULL` + `FOR UPDATE` + rollback.
- **CSRF production detection sai do so sánh chặt**: phát hiện prod bằng `==` → `APP_ENV="Production"` (hoa) âm thầm tắt seed-guard. Fix: case-fold. Kèm bug prefix: `requiresOriginCheck` khớp `/adminx` nhầm là `admin` → phải **segment-aware** (so theo path segment, không `strings.HasPrefix`).
- **Origin-check bỏ lọt khi `ALLOWED_ORIGIN` rỗng**: generator skip check khi env rỗng → foreign Origin lọt (held-out boot không set env mới lộ). Fix: fallback same-origin theo `Host`.

## Techniques / gotchas (tái dùng)

- **JWT/auth hardening (Go, golang-jwt/v5, HS256)**: chặn `alg=none` + alg-confusion; chống user-enumeration bằng **dummy bcrypt** (luôn hash kể cả user không tồn tại); `ValidateJWTSecret` **fail-fast lúc khởi động** khi secret <32 ký tự hoặc là placeholder. go-reviewer nên "thử tấn công thật" (token giả, alg=none, path-confusion, dò tài khoản).
- **Trusted-proxy X-Forwarded-For resolver**: lấy IP **rightmost-non-trusted** (không leftmost — leftmost bị spoof), có spoof-guard, default an toàn khi không có proxy. Cần cho rate-limit & log IP đúng sau Caddy. Contract qua `TRUSTED_PROXIES`.
- **Upload security**: KHÔNG tin đuôi file / `Content-Type` — sniff **magic byte** (file thực thi đổi đuôi .png / giả Content-Type đều bị chặn). Hardening slug regex + escape field: slug bẩn phá URL/SEO, XSS trong field admin **ảnh hưởng thẳng trang khách**.
- **Server Actions để né CORS**: form browser gọi thẳng Go API (:8080) từ origin :3000 sẽ bị CORS; đẩy call qua Next Server Action (server-to-server, forward cookie) thay vì mở CORS.
- **`package-lock.json` lệch platform — root cause sâu**: lock sinh trên **darwin thiếu native binary linux/wasm** của Tailwind v4 (`@tailwindcss/oxide-wasm`, `@emnapi/*`, `@napi-rs/wasm-runtime`) → `npm ci` fail trên linux CI ("picomatch không thỏa"). Regenerate trên linux là fix đúng bản chất **nhưng** Colima I/O bất ổn liên tục kill container pull → fallback thực dụng: đổi `npm ci`→`npm install --no-audit --no-fund` ở CI **và** Dockerfile (vẫn tôn trọng lock, chỉ reconcile native binary lệch platform). (mở rộng mục "package-lock không portable" ở [[digest-moonie-2026-07-17]])
- **Colima I/O instability tái diễn**: daemon "running" nhưng không phản hồi, container pull bị kill giữa chừng → restart colima (giữ volume/data) để phục hồi. Không nên phụ thuộc Colima cho pull nặng lúc đang tải.
- **security-review skill cần git diff ref** (`origin/HEAD`): thay đổi untracked/unstaged thì skill không bắt được diff → chỉ định thẳng danh sách file cho subagent review.

## Feedback / method

- **"Held-out quá khắt khe" là failure mode thật — điều tra trước khi sửa CODE.** Nhiều lần held-out FAIL không phải do code sai: `/admin/register` trả 401 (đúng, do middleware) vs held-out kỳ vọng 404; rate-limit 5/phút chặn nhầm assert; thiếu `name` attribute / va chạm label-selector. **Why:** sửa mù theo held-out có thể làm hỏng code đúng. **How:** khi FAIL, verify độc lập hành vi thật → nếu code đúng thì sửa held-out (qa-evaluator), không sửa code. Nhưng cũng có ca held-out đúng chỗ (thiếu `name` là thiếu sót thật) → phân biệt bằng bằng chứng.
- **Agent nền có thể tự commit thêm sau khi mark xong** (tối ưu image ~68 phút sau) → `git fsck` + kiểm diff phạm vi trước khi chấp nhận (nhắc lại, tái xác nhận ở GĐ4–6).

## Liên quan
- [[digest-moonie-2026-07-17]] · [[dev-skills]] · [[headless-demo]] · [[controller-service-repository]] · [[caching-layers]]
