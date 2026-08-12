---
type: note
title: Digest ticket-mcrsv 2026-08-12 — bàn đo bị rate limiter vô hiệu hoá, và 15 task đóng bằng verifier
summary: Load test bắn từ một máy = một IP nên rate limiter global 100 req/15 phút của gateway quyết định luôn con số baseline; cộng chuỗi bug thật (gRPC version skew 1.60 vs 1.63, self-grant admin, whitelist retry sai case, port bịa 50070) và kỷ luật xử lý agent tự khai vi phạm.
tags: [system-design, backend, java, postgresql, architecture, debug, ai, skills]
created: 2026-08-12
updated: 2026-08-12
source: project "ticket-mcrsv" — session history (3 session, phần lớn là `/looptasks` chạy vòng)
---

# ticket-mcrsv — digest 2026-08-12

> Ngày trước: [[digest-ticket-mcrsv-2026-08-11]] · bàn đo:
> [[2026-08-11-ban-do-tai-k3d-k6]] · quyết định phạm vi vá: [[2026-08-12-va-triet-de-saga-ticket]]

## Bugs (đều đã verify độc lập, không nhận lời agent)

- **Rate limiter global có thể vô hiệu hoá cả bàn đo.** `gateway/src/services/initializeService.js:45-47`
  áp `limiter` + `speedLimiter` cho **mọi route**: **100 request / 15 phút / IP**, và sau 50 request
  thì `speedLimiter` cộng thêm delay 500ms mỗi request. Load test bắn từ một máy = **một IP** ⇒
  `smoke.js` (1 VU) dính 429 sau vài chục giây, `flash-sale.js` (0→5000 req/s) thì gần như 100%
  request là 429. **Số đo sẽ phản ánh rate limiter, không phản ánh contention thật ở booking/ticket-service.**
  Đây không phải bug (limiter chạy đúng thiết kế) mà là **giới hạn của cách đo single-origin** —
  và nó phải được ghi vào báo cáo, không được im lặng.
- **gRPC version skew** (`NoSuchFieldError` lúc mở subchannel): `grpc-spring-boot-starter` kéo
  `grpc-core`/`grpc-util` ở **1.63.0** transitively, trong khi `pom.xml` pin cứng
  `grpc-protobuf`/`grpc-stub`/`grpc-api` ở **1.60.0**. `PickFirstLeafLoadBalancer` (1.63.0) tham
  chiếu field chỉ có ở `grpc-api` 1.63.0.
  Cách vá **không** phải pin lại từng artifact (pin lẻ chính là nguyên nhân) mà **import
  `io.grpc:grpc-bom`** để mọi `io.grpc:*` — kể cả artifact kéo vào sau này — tự khớp version.
  Quét hết cùng pattern: `booking`, `payment`, `invoice` đều dính, sửa cả ba.
  Bằng chứng đóng bug là **runtime thật**: `awk 'NR>=<dòng restart>' log | grep -c NoSuchFieldError` = 0,
  và lỗi mới là `seat(s) not found: A1` — tức RPC đã round-trip thật, lỗi giờ là nghiệp vụ.
- **Lỗ tự cấp quyền admin thật, đang sống** (H24) — verifier xác nhận đủ 7 mắt xích, không mắt xích
  nào đứt.
- **Whitelist retry ghi tên RPC PascalCase còn runtime tra bằng tên khác** (H8) — verifier bắt ở
  vòng 1. Sửa đúng là **chuẩn hoá tên method ở cả hai đầu** (lúc dựng danh sách và lúc tra cứu),
  không phải nhét thêm biến thể camelCase vào list.
- **Gateway authz đọc sai field proto** (`hasPermission` thay vì `allowed`) — H14.
- **Port `50070` của `realtime-service` là số bịa** — không tồn tại ở đâu trong repo ngoài `CLAUDE.md`
  (và sau đó lan sang spec + memory của chính tôi). Giá trị thật `HTTP 3003 / gRPC 50057`, nguồn
  sự thật là `realtime-service/config/config.go:76,82` + `scripts/dev-all.sh` hardcode đúng cặp đó.
  ⇒ **doc bịa một con số thì nó tự nhân bản sang spec, memory và báo cáo agent.**
- **`dev-native.sh` sai 6 biến `.env` gateway**, 3 trong đó sai cả port (`PAYMENT_SERVICE_URL=50056`
  không khớp service nào) — nặng hơn finding gốc mô tả.
- **Deadlock thật trong `grpc-go` v1.68.0** (H9): pattern "goroutine chạy `GracefulStop()`,
  fallback `Stop()`" — verifier tự tái lập được.
- **Migration `005`/`006` chưa áp lên DB dev** dù compose đã chạy 16 tiếng: file migration mới sinh
  ra **không tự chảy vào DB đang chạy**.

## Techniques / kỷ luật

- **Agent tự khai vi phạm ⇒ kiểm chứng, không nhận lời.** Agent X3 ghi 6 dòng thật vào
  `email_jobs` của DB dev dùng chung rồi tự dọn. Verifier read-only xác nhận độc lập
  (`email_jobs` về 6 dòng id 1–6, `email_worker_test` đã xoá, Redis `DBSIZE`=0) — **residue duy nhất
  là `email_jobs_id_seq.last_value = 12`**. Bài học đã ghi vào `BRIEF.md` và tách thành
  [[chan-agent-bang-cau-hinh]].
- **Hai agent chạy lệnh repo-wide song song phá nhau**: hai lần `make proto-gen-all` cùng lúc làm
  `email-worker/internal/protos/email/` **biến mất** giữa lúc verifier đang build. Luật đã ghi vào
  khối GATE: agent chạy song song **chỉ được dùng lệnh phạm vi service**.
- **Agent tự chạy `git stash` là nguy hiểm hơn nó nghĩ** — stash tác động **toàn bộ working tree**,
  trong khi agent khác đang sửa file. Thoát nạn nhờ `git stash` mặc định không đụng file untracked.
- **Agent hay bị treo vì đứng chờ "monitor"** (đã xảy ra ≥4 lần trong repo này). Cách gỡ:
  `SendMessage` kèm **trạng thái thật vừa đo** (`docker ps`, port đang LISTEN) + chỉ thị cụ thể.
- **Verifier trả FAIL không có nghĩa là fix sai.** Ba ca trong phiên: FAIL vì "git status chưa sạch"
  (bước cố ý để sau verify), FAIL vì báo cáo thiếu khai file đã sửa, FAIL vì thiếu test cho 6 route.
  Đọc lý do trước khi mở vòng sửa.
- **Verifier nhiều lần tìm được bằng chứng mạnh hơn cả agent** — tự dựng Postgres tạm chạy lại thí
  nghiệm, tự gỡ fix ra để xem test có đỏ đúng chỗ không, tự tiêm 3 loại lỗi vào whitelist.
- **Agent bác lại chính finding sinh ra task nó** (H20: verifier trước đã nhầm hai env-space;
  H6: gợi ý của audit về sarama là sai) — và đó là kết quả tốt, ghi đính chính vào `BRIEF.md`.
- Đo RAM trên macOS bằng **raw free pages là sai thước** — `Pages free 4381 × 16KB ≈ 68MB` không có
  nghĩa là máy hết RAM (đã tự đính chính con số này).
- `go test` qua wrapper `rtk` **bị tóm tắt**; muốn output gốc phải bọc `rtk proxy "..."`. Và
  `go test` không có `-count=1` thì ăn cache, in `(cached)`.
- Máy chạy **Colima**, không phải Docker Desktop — spec ghi "tăng Docker Desktop lên 12GB" là sai
  runtime; lệnh đúng `colima stop && colima start --memory 12 --cpu <n>`.

## Context

- Loop `/looptasks` chạy 5 phút/lần đã báo **~170 vòng rỗng liên tiếp** (≈14 tiếng) trước khi user
  về và bảo dừng ⇒ [[feedback-dung-loop-khi-rong]].
- Uỷ quyền khi user vắng mặt được **ghi thẳng vào `BRIEF.md`** (không giữ trong context) kèm ranh
  giới tự đặt: không tạo MR, không đụng production/staging, không sửa business logic ngoài scope,
  không đổi nhịp loop. Loop chạy nền nên context bị tóm tắt — ghi ra file thì iteration sau vẫn đọc được.
- Repo này **push thẳng `main`** (ngoại lệ so với luật Avada ở [[feedback-git-branch-discipline]]),
  một task một commit, push xong mới sang task kế.
- Session được bàn giao bằng khối `🔀 HANDOFF` đầu `BRIEF.md` khi context tới ~54–72% — nếp giống
  [[feedback-plan-o-subagent-hoac-ghi-brief]].

## Liên quan

[[digest-ticket-mcrsv-2026-08-11]] · [[2026-08-11-ban-do-tai-k3d-k6]] ·
[[2026-08-12-va-triet-de-saga-ticket]] · [[chan-agent-bang-cau-hinh]] ·
[[feedback-dung-loop-khi-rong]] · [[bang-chung-phan-biet-duoc]] ·
[[2026-08-04-looptasks-verifier-doc-lap]] · [[2026-08-07-phan-tang-verifier]] · [[looptasks-vs-workflow]]
