---
type: area
title: Kỹ năng lập trình
summary: Duy trì & nâng kỹ năng lập trình — JS/TS/Node là trụ cột số một, Java (Spring Boot) và hạ tầng dịch vụ phân tán là trụ cột thứ hai (backend ngoài Avada), Go tách ra thành hướng học có lộ trình riêng (`game-server`), Rust vẫn là hướng học thêm.
tags: [career, skills, area, backend, java, system-design]
created: 2026-07-06
updated: 2026-09-13
---

# Kỹ năng lập trình

Trách nhiệm duy trì lâu dài, **không có "xong"**: giữ và nâng kỹ năng lập trình
cùng thói quen làm việc trong terminal.

## Trụ cột — theo thực tế công việc

- **JavaScript / Node.js / TypeScript** — ngôn ngữ CHÍNH hằng ngày (toàn bộ app
  Shopify tại AVADA, xem [[shopify-app-dev]]). Note: [[ts-type-narrowing]],
  [[discriminated-unions]]. _Lưu ý: nhiều repo AVADA cố tình chỉ dùng `.js`,
  không TS._
- **Java (Spring Boot)** — trụ cột thứ hai, backend dịch vụ phân tán ngoài Avada (`ticket-mcrsv`).
  Không còn là "luyện thuật toán": ORM & transaction (`@Transactional`, bẫy AOP
  self-invocation khi gọi `this.xxx()` trong cùng bean, `@BatchSize` phạm vi hẹp), Flyway
  migration, cấu hình qua `.env` và các kiểu **biến env chết**, gRPC/proto với code
  generated bị gitignore. Note: [[dsa]] (phần thuật toán vẫn giữ nguyên chỗ cũ).
- **Go** — hướng học có lộ trình riêng từ 2026-09-06, không phải ngôn ngữ dùng ở công việc trả
  lương. Project `~/projects/game-server`: backend game real-time từ số 0, ROADMAP 6 phase, đã có
  skeleton Phase 0 chạy được (tick loop + fixed timestep, `go test` xanh, `go vet` sạch). Cách học
  đã chốt: **khái niệm trước, code sau** — skeleton giữ lại để đối chiếu chứ không phải để gõ theo
  ([[digest-game-server-2026-09-07]] · [[digest-game-server-2026-09-08]] ·
  [[digest-game-server-2026-09-09]]).
- **Hạ tầng dịch vụ phân tán** — Kafka, outbox, saga + idempotency, Redis (script Lua cho
  thao tác nguyên tử), Postgres, Testcontainers; đo tải bằng k6 + Prometheus trên k3d
  ([[2026-08-11-ban-do-tai-k3d-k6]]). Bài học lặp nhiều nhất ở đây không phải cú pháp mà là
  [[bang-chung-phan-biet-duoc]]: gate xanh không nói gì về việc luồng có chạy không.
- **Python** — scripting, async, data/ML. Note: [[python-asyncio-blocking]],
  [[asyncio-gotchas]].

## Hướng học thêm (chưa dùng ở công việc thật)

- **Rust** — an toàn bộ nhớ, systems programming (sở thích/học sâu). Note:
  [[rust-ownership]], [[borrow-checker]].
- **Cloud/AWS** — xem area riêng [[aws-certification]].

## Kỹ năng không thuộc ngôn ngữ nào

Phần lớn thứ tốn thời gian nhất trong tuần không nằm ở ngôn ngữ mà ở cách vận hành:

- điều phối agent/lane nền và chấm việc của chúng → [[cham-viec-agent-nen]];
- không nhận ack thay cho hiệu ứng → [[ack-khong-phai-hieu-ung]];
- giữ state của loop khỏi thối → [[brief-state-agent-loop]];
- dựng gate đỏ được → [[gate-tu-viet-la-nguon-xanh-gia]];
- **viết tài liệu để người khác học được** — thứ tự nhân quả, và mọi con số trong văn xuôi phải
  tái tạo được vì không gate nào đỏ giúp → [[viet-tai-lieu-day-duoc]].

## Thói quen duy trì

- Mỗi khi học được điều mới → viết một atomic note ([[atomic-notes-principle]]).
- Định kỳ ôn qua [[moc-learning-pkm]].
- Áp dụng feedback: [[write-shorter-notes]].

## ⚠️ Chưa xác minh

- `ticket-mcrsv` là project ngoài Avada và **vẫn chưa có note trong `10-projects/`** (điểm vào là
  [[moc-ticket-mcrsv]]). Nó đã chạy liên tục 2026-08-11 → 2026-09-11 nên không còn là "một đợt học
  có điểm dừng" ([[digest-ticket-mcrsv-2026-09-08]] → [[digest-ticket-mcrsv-2026-09-11]]), nhưng
  vẫn chưa có ai phát biểu nó là việc dài hạn — mục trên cố ý chỉ mô tả kỹ năng đang thực sự dùng.
- `game-server` mới 3 ngày tuổi tính tới 2026-09-13 và **chưa có note trong `10-projects/`**; nêu ở
  đây vì có lộ trình viết ra, không phải vì đã chứng minh được là bền.
- Ví dụ ML của Python trước đây neo vào [[crm]]; repo đó không có commit từ 2026-03-23 nên
  ví dụ đã bỏ đi — xem [[2026-08-23-archive-crm]].

## Liên quan
- [[moc-learning-pkm]]
- [[build-my-brain]]
- [[shopify-app-dev]]
