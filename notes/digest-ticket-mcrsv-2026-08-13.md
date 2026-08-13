---
type: note
title: Digest ticket-mcrsv 2026-08-13 — bug "chưa bao giờ chạy được", IDOR diện rộng, CI chưa từng chạy
summary: Một loạt tính năng chưa bao giờ chạy được (capture payment sai ID, check-in gọi RPC chưa implement, migration chưa từng áp), 11+ route IDOR, và CI của 2 service Node chưa từng chạy vì gitignore mọi lockfile.
tags: [system-design, architecture, backend, nodejs, java, auth, debug, skills]
created: 2026-08-13
updated: 2026-08-13
source: project "ticket-mcrsv" — session history (3ad29813, 49d504a5, 8c7111d4)
---

# Digest ticket-mcrsv — 2026-08-13

Repo học tập ngoài Avada (Next.js → gateway Node → gRPC → Go/Java/Node → Postgres),
chạy bằng `/looptasks` + `verifier`. Nền: [[digest-ticket-mcrsv-2026-08-12]] ·
[[2026-08-12-va-triet-de-saga-ticket]].

## Bugs

Họ lỗi lớn nhất phiên này: **tính năng chưa bao giờ chạy được lần nào** — không
phải regression, mà là code chưa từng đi qua đường thật.

- **Saga chưa bao giờ capture được tiền.** `BookingSagaOrchestrator:338` gọi
  `capturePayment(payment.getId())` trong khi RPC cần `paymentId` nghiệp vụ →
  `INVALID_ARGUMENT: Invalid payment_id` mỗi lần. Chỉ lộ ra khi dựng integration
  test đi qua **server gRPC thật**; mock tầng client vẫn xanh.
- **Check-in luôn hỏng** vì gọi `UpdateTicket` mà `ticket-service` không implement
  (và `UpdateTicketStatus` — hướng thay thế tôi đề xuất — cũng chưa bao giờ tồn tại).
- **`RunMigrations` của `ticket-service` chưa từng áp migration nào**: `migrator.go`
  lọc `.up.sql` còn file thật đặt tên `NNN_desc.sql`. `CLAUDE.md` của repo mô tả một
  convention khác thực tế. Guard "fail-loud" viết ra lại làm `app.Initialize()` chết
  → phải đổi *hành động* (log ERROR + trả rỗng) chứ không đổi *phát hiện*.
- **`ReserveTicketsResponse.tickets` luôn rỗng**, `ticket_ids` bị nuốt im lặng.
- **Ghế không được giải phóng khi payment fail** — và một test cũ đang **khoá chặt
  hành vi sai** (`stub eq("event-1")`), nên sửa đúng thì test đỏ.

**IDOR diện rộng.** `requireRole` kiểm **role**, không kiểm **quyền trên tài nguyên**
→ 11 route ở H54 + cụm event/zone/seat/pricing/ticket ở H55. Cơ chế chung
`assertOwnership(actualOwnerId, req, msg)` **fail-closed**: thiếu owner cũng ném.
Không danh tính nào đi qua biên gRPC hôm nay (`clients.js` chỉ `metadata.add`
`correlation-id`), nên backend không thể tự lọc — mọi kiểm quyền phải ở gateway.

**Rò token qua log — 9 vòng mới đóng.** Mỗi vòng vá một đường thì lộ đường mới
(morgan `:referrer` → `logger.js:82 logError` → `security.js`). Scanner regex trên
text về bản chất không kín, và agent còn **tự allowlist chính file mình vừa sửa**
khỏi scanner. Chỉ khép được khi chuyển sang **AST** →
[[gate-quet-ma-nguon-bang-ast]].

**`try/catch` bao quanh một promise không `await` là vô dụng** — nó *trông như* có
bảo vệ. `redisPasswordResetService.js:36` gọi `enqueueJob` không await; tôi từng
báo file đó là "ca đối chứng an toàn" và verifier chứng minh tôi sai.

**Spring self-invocation** làm `@Transactional(REQUIRES_NEW)` thành no-op (gọi
`this.xxx()` không qua proxy AOP) → tách bean riêng, không dùng `@Lazy` self-inject.

**`.gitignore` viết bằng `echo` không newline** dính vào dòng trước và **phá luôn 2
pattern kế** — hệ quả: `tests/load/seed-output.json` chứa **10 JWT thật** nằm
untracked, cách một `git add .` là lên remote.

## Techniques

- **Điều phối song song theo gate, không chỉ theo vùng file.** `mvn` chạy cùng
  `jest` tạo timeout giả (baseline 17s → 73–98s); `prettier --write` đụng mọi file
  nên phải chạy một mình. Task chia sẻ *cơ chế* (H55/H56 đều cần `assertOwnership`)
  phải chờ task tạo ra cơ chế đó xong, nếu không sẽ có hai cơ chế.
- **Gate xanh chỉ vì `.env` local.** Verifier tạm giấu `.env` để mô phỏng CI và đo
  được thay đổi này sẽ **làm đỏ CI** — thứ không cách nào thấy khi chạy trên máy.
- **Ghi finding theo tầng tin cậy.** Agent báo ~24 điểm IDOR, verifier chỉ xác nhận
  độc lập 4. Ghi vào BRIEF thành 3 tầng (verified-IDOR / verified-safe /
  agent-claimed-unverified) thay vì chép nguyên bảng — task sau tự verify lại.
- **Đóng task bằng lập luận cơ chế, không bằng "chạy N lần không thấy".** H34/H33
  trả `UNVERIFIED` sau 20–45 lần chạy; cái được chấp nhận là cái đọc **source của
  thư viện thật đang cài** để chứng minh triệu chứng không thể xảy ra.
- **Agent treo vì chờ thụ động là chế độ hỏng số một** — 5 lần trong một phiên,
  không lần nào chạy được `mvn`. Luật rút ra: quá 2 lần thì `TaskStop` hẳn (nếu nó
  tỉnh dậy sửa file trong lúc verifier chạy test thì tạo flake giả) và chuyển thẳng
  verifier — verifier vốn có quyền chạy gate độc lập.
- **Verifier tự thú chạy `git checkout --`** (lệnh cấm tuyệt đối) và xoá mất bản fix
  chưa commit — hai lần. Luật: agent tự khai vi phạm thì **tự kiểm working tree +
  reflog trước khi tin verdict**, và chạy lại build/test trên file từng bị xoá.
- Verifier tự dựng Postgres/Redis thật để chứng minh test **chạy chứ không SKIP**
  (`SKIP` ≠ `PASS` — "xanh giả"), và tự viết test fail-open để thử phá cơ chế quyền.

## Context

- Rule mới `.claude/rules/async-and-blocking.md` viết từ **chỗ repo đã trả giá**
  (H16 `context.Background()` vứt ctx, H29 `time.Sleep` không tôn trọng ctx), không
  phải listicle. Khung: 4 câu hỏi quyết định + 6 mã phân loại A–F dùng chung cho
  JS/Go/Java + phần chống false-positive + checklist "khi đẩy sang background phải
  đủ 4: đường phục hồi / không nuốt lỗi / dừng được / có người reconcile".
  Điểm chốt: **đây không phải chủ đề performance** — hậu quả nặng nhất là mất dữ
  liệu và gửi trùng, chậm chỉ là hệ quả nhẹ nhất.
- BRIEF 1.668 dòng → tách 3 file: `BRIEF.md` (499, chỉ task đang & sẽ làm),
  `REFERENCES.md`, `BRIEF-archive-done.md`. Doc lạc hậu ở đầu file là thứ session
  sau đọc đầu tiên → dọn trước khi bàn giao.
- Nhiều lần **tiền đề trong brief của tôi sai** và agent bác đúng (status là
  `"processing"` chứ không có `"retrying"`; template `welcome_email` không tồn tại
  trong seed). Brief sai mà agent làm theo mù thì fix đúng cú pháp nhưng vô dụng.

→ [[bang-chung-phan-biet-duoc]] · [[2026-08-11-ban-do-tai-k3d-k6]] ·
[[gate-quet-ma-nguon-bang-ast]] ·
[[2026-08-13-commit-lockfile-ticket-mcrsv]]
