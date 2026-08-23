---
type: area
title: Kỹ năng lập trình
summary: Duy trì & nâng kỹ năng lập trình — JS/TS/Node là trụ cột số một, Java (Spring Boot) + Go và hạ tầng dịch vụ phân tán là trụ cột thứ hai (backend ngoài Avada), Rust vẫn là hướng học thêm.
tags: [career, skills, area, backend, java, system-design]
created: 2026-07-06
updated: 2026-08-23
---

# Kỹ năng lập trình

Trách nhiệm duy trì lâu dài, **không có "xong"**: giữ và nâng kỹ năng lập trình
cùng thói quen làm việc trong terminal.

## Trụ cột — theo thực tế công việc

- **JavaScript / Node.js / TypeScript** — ngôn ngữ CHÍNH hằng ngày (toàn bộ app
  Shopify tại AVADA, xem [[shopify-app-dev]]). Note: [[ts-type-narrowing]],
  [[discriminated-unions]]. _Lưu ý: nhiều repo AVADA cố tình chỉ dùng `.js`,
  không TS._
- **Java (Spring Boot) + Go** — trụ cột thứ hai, backend dịch vụ phân tán ngoài Avada.
  Không còn là "luyện thuật toán": ORM & transaction (`@Transactional`, bẫy AOP
  self-invocation khi gọi `this.xxx()` trong cùng bean, `@BatchSize` phạm vi hẹp), Flyway
  migration, cấu hình qua `.env` và các kiểu **biến env chết**, gRPC/proto với code
  generated bị gitignore. Note: [[dsa]] (phần thuật toán vẫn giữ nguyên chỗ cũ).
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
- dựng gate đỏ được → [[gate-tu-viet-la-nguon-xanh-gia]].

## Thói quen duy trì

- Mỗi khi học được điều mới → viết một atomic note ([[atomic-notes-principle]]).
- Định kỳ ôn qua [[moc-learning-pkm]].
- Áp dụng feedback: [[write-shorter-notes]].

## ⚠️ Chưa xác minh

- Trụ cột Java/Go + hạ tầng phân tán được suy ra từ 6 digest `ticket-mcrsv` trong tuần
  2026-08-17 → 08-22. Đó là project ngoài Avada và **chưa có note trong `10-projects/`** —
  chưa rõ nó là việc dài hạn hay một đợt học có điểm dừng. Mục trên mô tả **kỹ năng đang
  thực sự dùng**, cố ý không phát biểu gì về tương lai của repo đó.
- Ví dụ ML của Python trước đây neo vào [[crm]]; repo đó không có commit từ 2026-03-23 nên
  ví dụ đã bỏ đi — xem [[2026-08-23-archive-crm]].

## Liên quan
- [[moc-learning-pkm]]
- [[build-my-brain]]
- [[shopify-app-dev]]
