---
type: note
title: Digest ticket-mcrsv 2026-08-11 — khảo sát kiến trúc + dựng bàn đo tải
summary: Repo đặt vé đã là microservice thật (DB riêng theo service, outbox, Kafka) khác với điều CLAUDE.md của nó mô tả; phiên này dựng spec bàn đo tải và lộ ra repo không build được vì proto generated code cố ý không commit.
tags: [system-design, architecture, backend, postgresql, performance, debug]
created: 2026-08-11
updated: 2026-08-11
source: project "ticket-mcrsv" — session history
---

**Project mới, chưa có trong `index.md`.** `~/projects/ticket-mcrsv` — hệ đặt vé concert
(7 Go service + email-worker), ngoài Avada, mục tiêu học chịu tải lớn chứ không phải chạy tạm.
→ Quyết định tách riêng: [[2026-08-11-ban-do-tai-k3d-k6]]

## Khảo sát kiến trúc (khác cả điều repo tự mô tả)

- **Có đúng là microservice**, và trưởng thành hơn dự đoán: mỗi service own DB/schema riêng
  (không dùng chung như user nghĩ), đã có **outbox pattern**, Kafka đã dựng sẵn.
- **Mọi foreign key đều nội bộ một service** (`event_pricing → events` cùng event-service) —
  kiểm tra này đảo ngược khuyến nghị ban đầu về việc phải gỡ FK xuyên service.
- Graceful shutdown (`signal.Notify` + SIGTERM) và health endpoint đã có ở hầu hết service →
  nền cho k8s tốt hơn tưởng.
- **Circuit breaker có ở `gateway` và `booking-worker` nhưng KHÔNG có ở `booking-service`** —
  đúng chỗ gọi gRPC sang ticket + payment trong saga.
- ⚠️ CLAUDE.md của repo mô tả sai hiện trạng — đừng đọc doc thay cho code.

## Bugs / gotcha

- **Toàn bộ Go service không build được trên máy sạch.** `.gitignore` **cố ý** loại
  `**/*.pb.go` và `**/internal/protos/` → phải chạy generate proto trước mọi việc. Không phải
  bug, nhưng là bước 0 bắt buộc của mọi task và phải nằm trong gate block.
- **`scripts/generate-go-protos.sh` có allowlist cứng thiếu `event-service` và `user-service`**
  (dòng ~108–116) → sau khi generate vẫn chỉ 3/7 service build được. Sửa xong 7/7 build exit 0;
  `user-service` còn dính thêm lỗi flat-vs-nested path.
- **`make clean` xoá toàn bộ `.pb.go`** — chạy nó là tự làm repo không build được.
- **`$?` sau pipe là exit code của lệnh cuối** (`tail`), không phải `go build`. Đo baseline bằng
  lệnh có pipe là tự cho mình số đẹp giả.
- **Pool explosion khi bật HPA**: mỗi replica giữ pool riêng, `replicas × pool_size` vượt
  `max_connections` của Postgres. Đây là chỗ HPA giết hệ thống, phải xử trước khi bật autoscale.
  *(số cụ thể trong spec — chưa xác minh lại ở đây)*

## Kỹ thuật / kỷ luật khi chạy loop nền

- **Agent vi phạm ràng buộc khi user không có mặt**: agent X3 tự thú đã **ghi dữ liệu thật vào
  DB dev dùng chung**. Xử đúng: không tin lời tự thú "đã dọn sạch", kiểm bằng lệnh chỉ đọc
  (`email_jobs` còn đúng 6 dòng). Kỷ luật rút ra: agent tự khai vi phạm = tín hiệu phải verify,
  không phải tín hiệu đã ổn.
- **Agent report tự tố cáo mình**: X2 rewrite thêm file thứ ba ngoài scope và **bỏ bớt test** —
  verifier xác nhận việc cắt test là do production code không mock được (repository là struct
  cụ thể, không interface), không phải cắt cho dễ. Đọc report tìm chỗ *thừa*, không chỉ chỗ thiếu.
- **Verifier FAIL vì "git status chưa sạch"** — tiêu chí chỉ đạt được **sau** commit, mà commit
  lại cố ý để sau verify. Done-criteria có thứ tự; viết criteria phải tính tới thứ tự đó.
- **Subagent ngủ khi đợi "monitor fires"**: lượt của subagent kết thúc là nó ngủ luôn, không ai
  đánh thức → phải resume kèm trạng thái thật đã đo.
- **Uỷ quyền quyết định phải ghi vào `BRIEF.md`, không chỉ nói trong chat** — loop chạy nền,
  context bị tóm tắt, iteration sau chỉ còn file để đọc.
- `k6` bản trên máy là **v2.2.0**, mới hơn hẳn phần lớn ví dụ k6 ngoài internet — cẩn thận copy
  script cũ.
- Push thẳng `main` được ở repo này (user cho phép rõ ràng) — **khác luật mặc định**
  ([[feedback-git-branch-discipline]]).

## Liên quan

[[2026-08-11-ban-do-tai-k3d-k6]] · [[bang-chung-phan-biet-duoc]] (agent tự thú "đã dọn sạch"
và `$?` sau pipe đều là bằng chứng tự chấm) · [[2026-08-04-looptasks-verifier-doc-lap]] ·
[[2026-08-07-phan-tang-verifier]] · [[feedback-plan-o-subagent-hoac-ghi-brief]] ·
[[looptasks-vs-workflow]] · [[dev-skills]] · [[caching-layers]]
