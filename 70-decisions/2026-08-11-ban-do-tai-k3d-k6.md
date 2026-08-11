---
type: decision
title: ticket-mcrsv học chịu tải bằng k3d + k6 + Prometheus tại chỗ, bỏ LocalStack
summary: Dựng "bàn đo" thật trên máy (k3d 3 node + Prometheus + k6, Kafka KRaft) trong ngân sách Docker 12GB thay vì mô phỏng AWS bằng LocalStack hay lên cloud.
tags: [system-design, architecture, performance, backend, localstack]
created: 2026-08-11
updated: 2026-08-11
review: 2026-11-11
source: project "ticket-mcrsv" — session history
---

Chốt 2026-08-11 (spec `docs/superpowers/specs/2026-08-11-k8s-load-testing-harness-design.md`,
BRIEF 14 task G-1 → F6, commit thẳng `main`):

- **Bỏ LocalStack.**
- **Giữ Kafka, chạy KRaft mode** (không ZooKeeper); cân nhắc Redpanda rồi bỏ.
- Hướng B: **k3d 3 node + Prometheus + k6 chạy local**, ngân sách baseline ~3,85 GB trong
  Docker 12 GB (máy 16 GB RAM).
- **Việc đầu tiên không phải dựng k3d** mà là chạy k6 vào compose hiện tại để có mốc gốc.

## Why

- **LocalStack mô phỏng *API* của AWS (SQS/SNS/S3/DynamoDB/Kinesis), không mô phỏng *hành vi
  dưới tải*.** Mục tiêu ở đây là học chịu tải và nhìn hệ thống gãy ở đâu — thứ LocalStack không
  bao giờ cho thấy. Nó giải bài toán "chạy code AWS offline", không phải bài toán này.
- **KRaft thay ZooKeeper**: bớt hẳn một tiến trình phải nuôi, ngân sách RAM xuống mức chạy được
  trên 12 GB. Redpanda cũng nói đúng giao thức Kafka và nhẹ hơn, nhưng đổi lấy việc rời khỏi
  hệ sinh thái Kafka thật — không đáng cho một dự án mà mục đích là *học* Kafka.
- **Đo trước, dựng sau**: không có mốc gốc thì mọi cải thiện sau này là cảm tính. Và trong chính
  phiên này, việc đo lộ ra rằng baseline **chưa đo được vì bug ứng dụng**, không phải vì thiếu
  hạ tầng — nếu dựng k3d trước thì đã đổ lỗi cho k8s.
- Ràng buộc cứng là **máy**: 16 GB RAM. Nếu B không đo được trên ngân sách đó thì cả bài tập vô nghĩa.

## Tradeoff

- **k3d local ≠ cloud thật**: không có network latency thật, không có node failure thật, không
  có managed service. Số đo dùng để *so sánh trước/sau*, không dùng để hứa capacity thật.
- **RAM là trần cứng và đã chạm**: có lúc host chỉ còn ~68 MB free, k3d 3 node không dựng nổi.
  Phải dọn tay trước mỗi lần đo → thao tác thủ công lặp lại.
- Bỏ LocalStack nghĩa là nếu sau này thật sự cần chạy code AWS offline thì phải dựng lại từ đầu.

## Xem lại 2026-11-11

Nếu tới lúc đó vẫn chưa có **một** con số baseline nào chạy được trên k3d, thì trần RAM đang
thắng và nên chuyển sang thuê một VPS nhỏ để đo — chi phí vài đô đổi lấy việc bài tập thật sự
chạy được.

→ [[digest-ticket-mcrsv-2026-08-11]] · [[bang-chung-phan-biet-duoc]] (mốc gốc là bằng chứng
phân biệt được duy nhất cho câu "cải thiện") · [[dev-skills]]
