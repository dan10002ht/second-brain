---
type: note
title: Digest ticket-mcrsv 2026-08-25 — hai bảng trùng tên ở hai schema, CI Go chưa từng chạy được, và env.example là nguồn của .env sai
summary: `public.tickets` và `tickets.tickets` là hai bảng trùng tên khác schema nên `SELECT` không đặt `search_path` đọc ra bảng rỗng và làm tôi kết luận sai hai lần; job `test-go` đỏ mọi lần chạy vì 0 file `.pb.go` được track mà CI không có bước sinh proto; và `env.example` được track chính là thứ sinh ra `.env` sai.
tags: [system-design, backend, postgresql, architecture, agent, automation]
created: 2026-08-25
updated: 2026-08-25
source: project "ticket-mcrsv" — session history (1 session `/looptasksv2`, 12 task đóng)
---

# Digest ticket-mcrsv — 2026-08-25

Một phiên `/looptasksv2` chạy gần trọn ngày, đóng **12 task**. Phần đáng giữ không phải số task mà
là bốn thứ dưới đây.

## Bugs

### `public` và `<service>` là hai schema có bảng trùng tên

`ticket-service` hardcode `search_path=tickets` ở `internal/app/app.go`. Nhưng DB còn nguyên schema
`public` với **26 bảng** trùng tên (mỗi schema service chỉ có 2–9 bảng). Hệ quả:

```
SET search_path TO tickets  →  booking_sessions=254, seat_reservations=254, tickets=0
không đặt search_path        →  đọc public.*, rỗng
```

Tôi kết luận sai **hai lần** vì chuyện này: lần đầu tưởng "ticket không bao giờ được tạo", lần sau
tưởng "DB bị xoá sạch do Colima chết". Report của lane mới là thứ đính chính tôi — và cái sai của
tôi lại làm bằng chứng mạnh hơn.

Nguyên nhân gốc **đã được sửa từ trước** (task G0 thêm `PGOPTIONS: "-c search_path=tickets"` vào
`migrate-ticket`), và ghi chú trong compose giải thích đúng y hệt cái vừa lừa tôi. Phần còn lại chỉ
là dọn di chứng — cộng hai bug đang sống mà lane tìm thêm: `migrate-user` và `migrate-checkin`
**cũng thiếu** `PGOPTIONS`.

Cách dọn được chọn: **quarantine bằng `SET SCHEMA public_dead_20260825`** thay vì drop hay rename —
22 bảng chuyển, 4 giữ lại (đúng 4 bảng email-worker thật sự dùng). Lùi lại được, và một `SELECT`
nhầm vào bảng chết sẽ lỗi ồn ào thay vì trả rỗng.

### Toàn bộ test Go của repo chưa bao giờ chạy được trên CI

`email-worker/grpc/server.go` import protos, nhưng **0 file `.pb.go` được track** và job `test-go`
**không có bước sinh proto**, cũng không có `go:generate`. Đo trên checkout sạch: **cả 7 service Go
đều fail `go vet`** ⇒ job đỏ mọi lần chạy.

Nghĩa là mọi test vừa thêm trong phiên đều là test **chưa từng chạy trên CI**. Fix chỉ **+18/−1**
trên một file (`make proto-gen-service` theo matrix, pin version protoc lấy từ header của stub thật,
sinh proto **trước** `vet`/`test`) nhưng nó mở khoá toàn bộ phần còn lại.

Không có `gh` CLI nên không xác nhận được bằng một CI run thật — phải tự chứng minh bằng
`git archive` ra checkout sạch rồi chạy. Verifier lặp lại độc lập trên cả 7 service.

### `ProcessorEmailJobCreator` chỉ publish, không ghi DB

Task giao đi để **smoke**, nhưng đo thật thì lộ ra bug: creator chỉ publish job vào Redis mà không
INSERT vào Postgres. Bản vá đưa cả hai vào một đường (`adapters.go` INSERT trước, publish sau, **cả
hai đều `return err`**). Bài học lặp lại: một task "chỉ để đi thử một lượt" là chỗ bug thật hay lộ ra nhất.

### `env.example` được track chính là nguồn của `.env` sai

`.env` bị gitignore nên lane không sửa được, nhưng thứ sinh ra `.env` sai lại **đang được track**:
`env.example` không hề khai `KAFKA_TOPIC`, và ghi `KAFKA_BROKERS=localhost:9092` trong khi Kafka
thật ở `50092`. Sửa 6 `env.example` + thêm drift guard đối chiếu hai chiều với code.

Nhưng vòng 1 của việc này bị verifier trả **FAIL đúng**: lane xoá mất `LOG_LEVEL=info` — biến có
thật, đọc thật ở `internal/logger/logger.go:15`. Guard cũ **mù** với nó vì chỉ quét hẹp một file;
vòng 2 đổi sang `filepath.WalkDir` quét cả cây (bỏ `_test.go`) và thí nghiệm quyết định cho kết quả
đúng: guard hẹp PASS, guard rộng bắt được `missing: [LOG_LEVEL LOG_OUTPUT_PATH]`.
→ [[gate-tu-viet-la-nguon-xanh-gia]]

## Techniques

- **Chọn Redis instance theo chính sách eviction, không theo tên.** email-worker dùng **queue** nên
  phải trỏ `dev-redis-queue` (`50380`), không phải `dev-redis-cache` (`50379`) — lý do quyết định là
  `noeviction`: item trên cache có thể bị đuổi, mà job trong queue thì không được phép biến mất.
- **`GREATEST(retry_count, in-memory)` trong một `UPDATE` atomic** vừa không lùi số đếm vừa tự chữa
  job đã nằm trong queue trước bản vá. Chỗ đáng ngờ đi kèm: `RetryJob` set status → `pending` nhưng
  **không reset `retry_count`** dù comment ghi *"Reset job for retry"* — hiện là tiềm ẩn vì
  `RetryJob` không có caller production nào, và cũng không có poller nào đọc `status=pending`.
- **Verify bằng cổng thứ ba mình tự chọn.** Để chứng minh metric port đọc từ config chứ không
  hardcode, chạy với `PORT=8077` — 40 dòng metric ở 8077, `8086`/`2112` đều không nghe.
- Git tự nhận `loader_test.go → config/config_test.go` là **rename**, tức xác nhận độc lập rằng test
  được chuyển chứ không bị xoá.

## Context / gotcha

- **`git merge-base --is-ancestor` trả true vì nhánh chưa có commit nào** — tôi tưởng đã merge,
  thật ra chưa commit T135, việc vẫn nằm trên đĩa worktree. "True" ở đây trả lời một câu hỏi khác
  với câu đang hỏi. → [[cham-viec-agent-nen]]
- **`timeout` không có trên macOS** — exit 127 là *command not found*, không phải kết quả thật.
- **Go bind `[::]:8091` dual-stack còn python giữ IPv4 `0.0.0.0:8091`** — trên macOS hai cái cùng
  tồn tại được, nên "cổng đã bị chiếm" không chứng minh được gì.
- Lỗi `pq: unrecognized configuration parameter "WORKER_COUNT"` **không tái hiện được** — DSN dựng
  từ field tường minh, không nuốt env. Là artefact của instance thứ hai; dừng đào đúng lúc.
- **Lock quá hạn 2h26m nhưng lane KHÔNG chết** (spinner chạy, `xhigh`, vừa chạy proto 4 phút trước).
  Dấu hiệu đáng xem không phải lock quá hạn mà là "2h26m chưa đổi file nguồn nào". Và tôi kết luận
  sai một lượt rằng Monitor cũ chết âm thầm — nó vẫn sống và vừa báo đúng.
- **Verifier FAIL hai vòng liên tiếp = blocker**, không tự cho vòng 3; việc giữ nguyên chưa commit
  cho tới khi user chốt. Vòng 3 chạy sau khi user cho phép, và khớp chính xác bảng 5 ca tôi dựng sẵn.
- Vênh số test 131 vs 133 không phải mất test — **đếm khác đơn vị** (hàm `func Test` top-level vs
  số case). 124 trên `main` → 131 trong worktree ⇒ +7.

## Liên quan

[[digest-ticket-mcrsv-2026-08-24]] · [[digest-ticket-mcrsv-2026-08-22]] ·
[[digest-ticket-mcrsv-2026-08-19]] · [[2026-08-25-ticket-phat-hanh-luc-confirm-reservation]] ·
[[gate-tu-viet-la-nguon-xanh-gia]] · [[cham-viec-agent-nen]] · [[bang-chung-phan-biet-duoc]] ·
[[gui-viec-cho-lane-khong-co-ack]] · [[2026-08-13-commit-lockfile-ticket-mcrsv]]
