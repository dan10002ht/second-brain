---
type: note
title: Digest ticket-mcrsv 2026-08-14 — phiên loop 40 task, bộ ba lỗi chữ hoa V5, lint về 0, và những chỗ verifier suýt cho qua
summary: Một phiên `/looptasks` chạy gần trọn ngày đóng ~40 task; đáng giữ nhất là bộ ba migration lỗi chữ hoa/thường của `V5`, 11+ route IDOR, `try/catch` bọc promise không `await` là vô dụng, và ba lần chính tôi báo sai bị verifier bác bằng thí nghiệm.
tags: [debug, backend, architecture, java, concurrency, postgresql, skills]
created: 2026-08-14
updated: 2026-08-14
source: project "ticket-mcrsv" — session history 2026-08-13/14
---

# Digest ticket-mcrsv — 2026-08-14

Phiên `/loop 5m /looptasks` chạy từ 14:44 tới đêm: ~40 task đóng, ~62 commit trên `main`.
Chỉ ghi phần còn đúng sau này, không ghi tiến độ.

## Bugs

**Bộ ba lỗi chữ hoa/thường của migration `V5`.** `V5` viết `status` toàn chữ thường trong khi
entity dùng `@Enumerated(STRING)` (chữ HOA). Ba hệ quả **chỉ lộ ra lần lượt**, cái sau bị cái
trước che:
- CHECK constraint phá mọi lệnh ghi → `V7`
- 4 view + 3 function luôn trả rỗng (`status = 'success'`) → `V8` xoá hẳn (0 caller, và 3 function trùng logic với code đã có)
- 2 partial index lọc `IN ('pending','processing')` không bao giờ khớp → seq scan âm thầm → `V9`

Luật đi kèm: **không bao giờ sửa migration đã chạy** (checksum mismatch → mọi env đã migrate
chết lúc boot) — luôn thêm version mới.

**`try/catch` bọc một promise không `await` là vô dụng.** `redisPasswordResetService.js:36`
gọi `enqueueJob` không `await`; promise settle *sau khi* hàm return nên `catch` bao ngoài không
bắt được gì. Tôi từng chỉ chính chỗ này ra làm "đối chứng an toàn" — verifier chứng minh nó là
**ca thứ hai của cùng bug**. Đối chứng thật là chỗ có `await`.

**Redis trục trặc một nhịp lúc ai đó đăng ký → cả auth-service tắt.** Unhandled rejection từ
`enqueueJob` đi thẳng vào `process.on('unhandledRejection')` → `gracefulShutdown`.

**11+ route IDOR ở gateway.** `requireRole` kiểm *vai trò*, không kiểm *quyền trên tài nguyên
cụ thể* — hai chuyện khác nhau. Cơ chế dùng chung sau khi vá: `assertOwnership(actualOwnerId, req)`
fail-closed (`if (!actualOwnerId || actualOwnerId !== req.user.id) throw`), và **phải chạy trước
lệnh ghi**, không phải sau.

**Hợp đồng gRPC `ReleaseTickets`:** `PaymentEventHandlerService.java:253` nhét
`booking.getSeatNumbers()` (giá trị kiểu `"A1"`) vào proto field `ticket_ids`. Bug tồn tại được
**vì mọi test đều mock ở tầng client** — không ai kiểm hợp đồng liên service. Vòng sửa 1 FAIL do
grep sót caller thứ tư ở gateway (`ticketHandlers.js:176`) — caller **duy nhất nhận input người dùng**.

**Java `@Transactional` giữ qua I/O mạng** ở 3 chỗ (`OutboxProcessor` gửi Kafka trong vòng lặp;
`PaymentService`/`RefundService` gọi Stripe **không** set connect/read timeout). Fix Stripe:
`connectTimeout=1000` + `readTimeout=3000` = 4000ms, nằm dưới deadline gRPC 5000ms có sẵn.

## Techniques

- **Thí nghiệm ngược là điều kiện để tin một test.** H15 vòng 1 FAIL vì đổi `eventId:` →
  `event_id:` mà 37 suite / 314 test vẫn xanh; 8/13 file handler sửa đổi **không có test nào chạm tới**.
  Từ đó mọi verifier brief đều phải nêu "kịch bản đáng nghi nhất" và tự làm thí nghiệm ngược.
- **Test hợp đồng phải đọc nguồn sự thật chung với production**: bảng 104 test đọc tên field từ
  `.proto` qua **đúng object `PROTO_LOADER_OPTIONS`** mà production dùng, nên không tự khẳng định chính mình.
- **gRPC in-process test**: `grpc.NewServer()` + `bufconn` + client stub sinh từ proto, chỉ fake
  driver SQL. Đi qua Express + router thật, không gọi thẳng handler.
- **Số đo phải kèm mốc.** Năm lần phát hiện doc nói dối (H64/H67/H68/H69/H72) đều cùng một thói
  quen: ghi con số mà không ghi *đo lúc nào* và *vì sao đổi*. Lint gateway: doc ghi 1431 → đo 1772
  → đo 1809 trong cùng ngày.
- **`rtk proxy "chuỗi trong nháy"` trả exit 0 + output RỖNG** — phải dùng `rtk proxy bash -c "..."`.
  Chính REFERENCES.md của repo đang dạy dạng hỏng. `rtk` cũng tóm tắt output `go test` nên che
  mất phân biệt SKIP vs PASS.
- **Xếp task song song theo *gate*, không chỉ theo file**: `mvn` chạy cùng jest làm suite gateway
  17s → 73–98s kèm hàng loạt timeout 5000ms — nhiễu máy, không phải flake code. `prettier --write`
  đụng mọi file nên phải chạy một mình.
- **Dọn nợ lint mà không "tắt đèn"**: 1809+519 → 0+0 qua ba commit tách rời, mỗi bước có phép kiểm
  chống gian (chạy lint bằng `--no-eslintrc --config <config cũ>` để so cùng thước; `git diff
  --ignore-all-space` để chứng minh Prettier chỉ đổi khoảng trắng).
- **Postgres**: `enable_seqscan = off` bỏ được thiên lệch chi phí nhưng **không** làm một index
  không dùng được trở nên dùng được — verifier tự dựng container chạy cả hai chiều để chứng minh.

## Context

- Rule mới `.claude/rules/async-and-blocking.md` — viết từ chỗ repo đã trả giá, không phải listicle.
  Khái quát ở [[dong-bo-chan-luong-khong-phai-chuyen-hieu-nang]].
- Verifier **chạy `git checkout -- <file>` (lệnh bị cấm)** và xoá mất diff chưa commit của task
  khác; nó tự khai, tôi dựng lại và kiểm bằng md5 + diff + grep trước khi commit. Từ đó lệnh này
  bị cấm tường minh trong mọi brief, khôi phục chỉ bằng `cp` từ scratchpad.
- Brief tự mâu thuẫn suýt làm lọt một test vô dụng → [[2026-08-14-verifier-va-agent-mutation-tach-doi]].
- Hook `guard-main-branch.py` đã có sẵn cơ chế `EXEMPT_REPOS` (đang chứa `my-brain`); chỉ cần thêm
  `ticket-mcrsv` vào — không viết gì mới, lưới của repo Avada khác còn nguyên (kiểm lại bằng `crm`).
  Xem [[feedback-git-guard-chi-chan-master]].
- **Đổi ranh giới kế hoạch**: user chốt làm feature trước, hạ tầng/đo tải (G0–G5) và verify để sau
  ("chỉ code thôi, verify thì có thể để sau"). Tôi có nêu giá cụ thể của "verify để sau" — riêng
  phiên này verifier bác 3 kết luận sai — rồi làm theo và ghi trọn hướng mới vào `BRIEF.md` để
  session khác chạy `/looptasks` là execute được ngay. Bỏ ràng buộc cũ "KHÔNG bắt đầu F0 trước khi G5 xong".
- **H71 vẫn treo**: 4 phép đo ở gần như cùng trạng thái code mâu thuẫn nhau (fail/fail/pass · 30/30 ·
  5/5 · 5/5). Ép tải bằng `mvn` song song jest không tái hiện được triệu chứng gốc nhưng lộ ra một
  failure mode khác. Giữ nhãn flake, **không** bịa cách sửa để có cái mà commit. ⚠️ *chưa xác minh*.
- Máy 16GB đang swap 22.3/23.5GB; hướng giảm RAM không đụng kiến trúc là cap heap **ở cả hai JVM**
  (`mvn spring-boot:run` fork JVM app riêng — chỉ đặt `MAVEN_OPTS` là hụt).

Liên quan: [[looptasks-vs-workflow]] · [[bang-chung-phan-biet-duoc]] · [[2026-08-13-tach-gate-khoi-cham-tung-bug]] ·
[[2026-08-13-commit-lockfile-ticket-mcrsv]] · [[digest-ticket-mcrsv-2026-08-13]]
