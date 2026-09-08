---
type: note
title: MOC ticket-mcrsv — bản đồ chủ đề repo đặt vé microservice
summary: **MOC**: điểm vào theo chủ đề cho cụm `ticket-mcrsv` (19 digest + decision liên quan) — nghiệp vụ vé, hạ tầng/CI, bảo mật, quy trình agent/verifier; mỗi dòng nói KHI NÀO mở note đó.
tags: [moc, backend, architecture, debug]
created: 2026-09-01
updated: 2026-09-08
source: [[digest-ticket-mcrsv-2026-08-11]] · [[digest-ticket-mcrsv-2026-08-31]] · [[2026-08-11-ban-do-tai-k3d-k6]] · [[2026-08-25-ticket-phat-hanh-luc-confirm-reservation]]
---

# MOC: `ticket-mcrsv`

**Vì sao có trang này:** cụm này sinh liên tục từ 2026-08-11 tới 2026-09-01 — cụm lớn nhất tháng 8.
Nó **không có note project**, nên toàn bộ nằm phẳng trong `notes/` và chỉ tra được bằng ngày.
Đây cũng đúng lý do `index.md` phình: hơn 20 dòng digest của một repo nằm trong bản đồ toàn cục.

Repo: `~/projects/ticket-mcrsv` — **ngoài Avada**, microservice thật (DB riêng theo service,
outbox, Kafka), là nơi thử nghiệm quy trình agent/lane/verifier.

---

## Vào việc nhanh

- [[digest-ticket-mcrsv-2026-08-11]] — mở **đầu tiên nếu chưa từng chạm repo**: kiến trúc thật khác
  hẳn thứ `CLAUDE.md` của nó mô tả, và proto generated code cố ý không commit nên checkout mới không build.
- [[digest-ticket-mcrsv-2026-08-21]] — mở khi muốn biết **cái gì thực sự hỏng**: chạy thật end-to-end
  (đặt → capture → huỷ/hoàn tiền) lòi ra 3 lỗ nặng hơn mọi thứ đã đóng, gồm bán trùng ghế đã trả tiền.

## Nghiệp vụ đặt chỗ / vé

- [[2026-08-25-ticket-phat-hanh-luc-confirm-reservation]] — mở khi hỏi *"ai tạo ticket, lúc nào"*:
  ticket-service tự INSERT khi `ConfirmReservation` thành công, vì `checkin-service` đọc `ticket.Status`.
- [[2026-08-12-va-triet-de-saga-ticket]] — mở khi định vá tối thiểu: chốt làm đúng nghiệp vụ
  (partial unique index thay unique toàn cục) thay vì vá cho qua phép đo.
- [[digest-ticket-mcrsv-2026-08-17]] — mở trước khi sửa **rò seat**: vá từng call site đổi rò lấy
  oversell; lời giải là một chokepoint duy nhất + test guard.
- [[digest-ticket-mcrsv-2026-08-28]] — mở khi động vào **QR/check-in**: mã QR suy ra từ chính
  `ticket_id` nên gõ tay là qua được cổng.
- [[digest-ticket-mcrsv-2026-08-26]] — mở khi check-in chạy được ở CI mà chết ở dev: `.env` ghi hostname
  của Docker Compose; kèm `errors.New` trượt `errors.As`, cột `updated_by` uuid nhận chuỗi rỗng.
- [[digest-ticket-mcrsv-2026-09-01]] — mở khi sửa **rollback/idempotency của reservation**: điều kiện
  kiểm ở mức tổng (`live + terminal == expected`) gộp ghế đã refund với vé mới nên rollback nhầm giao
  dịch hợp lệ; phải trả trạng thái từng key.

## Hạ tầng, config, CI

- [[digest-ticket-mcrsv-2026-08-25]] — mở khi **`SELECT` trả bảng rỗng mà data chắc chắn có**:
  `public.tickets` và `tickets.tickets` trùng tên khác schema, thiếu `search_path` là đọc nhầm bảng.
- [[digest-ticket-mcrsv-2026-08-22]] — mở khi tin vào `env.example`: nó khai biến code không đọc,
  nên cấu hình "đã set" vẫn vô hiệu.
- [[2026-08-13-commit-lockfile-ticket-mcrsv]] — mở khi hỏi vì sao CI Node từng không chạy: gitignore
  mọi lockfile; đổi sang `yarn install --immutable`.
- [[digest-ticket-mcrsv-2026-08-24]] — mở khi service "còn sống" nhưng mọi request 500: migration chỉ
  chạy trong init container lúc `docker compose up`; log ngừng ghi 45 giờ mà health vẫn xanh.
- [[digest-ticket-mcrsv-2026-08-18]] — mở khi **Docker/Colima chết lặp lại**: thủ phạm là tổng RAM toàn máy,
  và trên macOS chỉ số đúng là `vm.swapusage`/`memory_pressure`, không phải `Pages free`.
- [[2026-08-11-ban-do-tai-k3d-k6]] — mở khi cần đo tải: bàn đo thật trên máy (k3d 3 node + Prometheus + k6)
  trong ngân sách Docker 12GB, không LocalStack, không cloud.
- [[digest-ticket-mcrsv-2026-08-12]] — mở khi con số load test trông vô lý: bắn từ một máy = một IP nên
  rate limiter 100 req/15 phút của gateway quyết định luôn baseline.
- [[digest-ticket-mcrsv-2026-09-04]] — mở khi một query `sqlx` hỏng mà SQL trông đúng: `sqlx` compile
  named parameter trước driver nên dấu `:` của `::timestamptz` bị ăn mất; kèm bài học test hồi quy so
  chuỗi SQL *trước* bước compile thì xanh cả khi bug còn nguyên, và field thiếu trong request message
  của proto làm client gửi bao nhiêu cũng vô nghĩa.
- [[digest-ticket-mcrsv-2026-09-08]] — mở khi frontend trả 500 mà `curl`/`node fetch` đều 200: Next
  cache lại một lần fetch font hỏng, phải xoá `.next` trước khi đi truy mạng/proxy.
- [[redis-queue-khong-dung-chung-instance-cache]] — mở trước khi nối một job vào Redis: instance cache
  có `maxmemory-policy` eviction nên nó được phép vứt job của bạn, im lặng. (Khái quát hoá từ task 136.)

## Bảo mật

- [[digest-ticket-mcrsv-2026-08-13]] — mở để thấy **quy mô**: 11+ route IDOR, capture payment sai ID,
  check-in gọi RPC chưa implement, migration chưa từng áp.
- [[digest-ticket-mcrsv-2026-08-27]] — mở khi kiểm tra phân quyền frontend: chặn phía server không đủ vì
  `RoleGuard` phía client chuyển hướng **sau hydrate** → phải chứng minh bằng DOM, không phải mã HTTP.

## Quy trình agent / verifier / gate

- [[digest-ticket-mcrsv-2026-08-22]] — mở trước khi tin gate tự viết: nó là **nguồn xanh giả** hai lần
  trong một phiên; và `last-verified` điền hàng loạt biến doc chưa ai kiểm thành doc "đã xác minh".
- [[digest-ticket-mcrsv-2026-08-30]] — mở khi đọc verdict verifier: PASS ở dòng tiêu đề nhưng FAIL ở một
  trong ba kết luận → phải đọc theo từng kết luận.
- [[digest-ticket-mcrsv-2026-08-19]] — mở khi giao việc cho verifier: verifier bị cấm chạy git vẫn
  `git checkout --` xoá mất thay đổi chưa commit hai lần trong một phiên.
- [[digest-ticket-mcrsv-2026-08-20]] — mở khi dựng lane: chỉ bản npm `@openai/codex` chạy được, watcher nền
  bị kill nên cron 5 phút mới là đồng hồ đáng tin; kèm bẫy suy luận lặp lần thứ ba
  *"trạng thái X nghĩa là Y chưa xảy ra"*.
- [[digest-ticket-mcrsv-2026-08-31]] — mở khi viết gate dạng regex/whitelist: nhóm miễn trừ nhận nhầm
  `7px`, whitelist chỉ đúng khi trích theo cấu trúc chứ không grep chuỗi; và một ảo ảnh ảnh chụp headless
  làm giao hai lane đi sửa lỗi không tồn tại.
- [[digest-ticket-mcrsv-2026-08-14]] — mở khi chạy `/looptasks` dài: ~40 task một ngày, ba lần tự báo sai
  bị verifier bác bằng thí nghiệm.
- [[digest-ticket-mcrsv-2026-09-08]] — mở khi một lệnh chờ Orca kẹt (`waiter_exists` mà không ai đánh
  thức), khi codex nuốt prompt, hoặc khi tiêu chí nghiệm thu là **thị giác**: cảnh 3D dẹt vì đơn vị
  chiều cao lệch hai bậc chỉ lộ ra khi mở ảnh ra nhìn, gate xanh và verifier PASS đều không thấy;
  kèm một FAIL đúng (bản vá đúng, test hồi quy không canh cơ chế hỏng) và một done-criteria viết
  quá tuyệt đối khiến worker báo `failed` đúng chữ.

## Doc & dọn dẹp

- [[2026-08-22-cau-truc-doc-theo-vong-doi]] — mở khi sắp xếp doc: xếp theo *hợp đồng với sự thật*
  (living / archive) chứ không theo chủ đề.
- [[2026-08-24-cleanup-service-chua-dung-ticket-mcrsv]] — mở khi hỏi service nào còn sống: 4 service
  chỉ-có-README đã xoá, thứ đã nối dây mà chưa bấm nút thì giữ.
- [[2026-08-27-he-thi-giac-chong-ai-slop]] — mở khi làm UI: chốt hướng thị giác rồi biến thành gate
  đếm số trong CI, thay vì mô tả "làm đẹp" trong prompt.
- [[2026-09-04-venue-2d-dung-3d-xem]] — mở trước khi động vào venue designer: 2D giữ vai authoring,
  3D chỉ là lớp xem (có ở cả designer lẫn trang bán vé), cả hai đọc **cùng một** model zone/seat.

## Chưa gom vào mục nào

Không có digest cho các ngày 08-15, 08-16, 08-23, 08-29, 09-02, 09-03 — chuỗi ngày **không liên tục**, đừng suy ra
là thiếu note. (Cố ý không viết thành wiki-link để `brain-lint` không báo link hỏng.)

Cụm này chưa từng sinh note `shipped-*`, khác với `subscriptions`/`pdf` — repo ngoài Avada nên
`brain-gitlog` không theo dõi.

## Việc còn treo

- **Rút gọn 18 dòng digest `ticket-mcrsv` trong `index.md`** xuống một dòng trỏ vào MOC này —
  phần cắt được nhiều nhất trong index. *Cần người duyệt: nó xoá dòng khỏi bản đồ toàn cục, và một
  note chỉ còn tra được qua MOC là một đánh đổi có thật.*
- Cân nhắc tạo `10-projects/ticket-mcrsv.md`: cụm này đang thiếu chỗ mô tả kiến trúc + trạng thái.

## ⚠️ Chưa xác minh

- Mỗi dòng "khi nào mở" ở trên được viết từ `summary:` của note trong `index.md`, không phải từ việc
  đọc lại toàn văn từng digest. Nội dung chi tiết trong note vẫn là nguồn đúng.
