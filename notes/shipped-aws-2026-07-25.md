---
type: note
title: Shipped AWS study-app 2026-07-24 — trọn infra track (4 course + 2 extension, ~90 lesson) landed main
summary: Commit landed 07-24 trên `main`: kickoff infra track + 4 course mới (DISTRIBUTED 23, DATASTORES 19, MESSAGING 19, CLOUDNATIVE 18 lesson) đều theo pattern scaffold+gold-lesson → author hàng loạt bằng workflow `author-course`, cộng 2 chapter extension (SRE Observability, BACKEND Service Communication); không revert, không migration, không tín hiệu deploy.
tags: [aws, cloud, learning, certification, method]
created: 2026-07-25
source: repo "aws" — git log (hash đã verify)
---

# Shipped — AWS study-app, commit landed 2026-07-24

Toàn bộ 9 commit trong khoảng này đều trên `main` (HEAD = `3309143`, không có branch phụ).
Phần *bài học / cách làm* nằm ở [[digest-aws-2026-07-24]] và [[digest-aws-2026-07-23]] — ở đây chỉ ghi *cái gì đã landed*.

## Shipped (merged main)

Một nhịp lặp lại đúng 4 lần: **scaffold + 1 "gold lesson" làm chuẩn style** → **author cả course bằng workflow `author-course` (author→critic)** → verify SVG render + build.

- **Kickoff infra track + course DISTRIBUTED** — `81d2ee9` (scaffold, thêm `.claude/workflows/author-course.js`, đăng ký 4 course ID mới ở `web/data/courses.ts`, gold lesson `ds-01`) → `b198dda` (22 lesson: system/failure model, CAP-PACELC, consistency, replication leader/multi-leader/quorum, partitioning + consistent hashing, consensus/Raft, logical & vector clock, 2PC/Saga/idempotency, capstone KV-store; 45 agent, 65 SVG).
- **Course DATASTORES (Data & Caching)** — `259f2eb` (scaffold + gold `dst-01` Redis intro) → `67b9e63` (18 lesson: Redis deep-dive, cache strategy & pitfall, NoSQL taxonomy, Elasticsearch, OLAP/ClickHouse/time-series, polyglot persistence + capstone; 37 agent, 45 SVG). Giao với [[caching-layers]] — đọc chéo, đừng viết lại.
- **Course MESSAGING (Messaging & Event Streaming)** — `b5f37db` (scaffold + gold `msg-01`) → `47624ca` (18 lesson: delivery semantics, RabbitMQ + reliability, SQS/SNS, Kafka core & ecosystem (Connect/CDC, Schema Registry, Streams), event-driven (Event Sourcing/CQRS/Saga/Outbox), capstone order-pipeline; 37 agent, 54 SVG).
- **Course CLOUDNATIVE (Kubernetes)** — `66e0e9a` (scaffold + gold `cn-01`) → `492693c` (17 lesson: k8s architecture, workloads, Service/Ingress/ConfigMap/Secret, PV-PVC/HPA/affinity, RBAC/NetworkPolicy/troubleshooting, Helm/Operator/GitOps/Service Mesh + capstone production-deploy; 35 agent, 49 SVG).
- **Extension SRE + BACKEND (đóng track)** — `3309143`: SRE ch3 Observability (3 pillars + OpenTelemetry, Prometheus/PromQL, Jaeger tracing, structured logging) và BACKEND ch4 Service Communication (gRPC/Protobuf, API Gateway & LB, reverse proxy nginx/Envoy + rate limiting). 7 lesson, 21 SVG.

**Quy mô:** ~90 lesson mới, ~26k dòng markdown trong một ngày. `web/data/lessons.ts` bị đụng ở **mọi** commit (registry tập trung → điểm conflict nếu chạy nhiều nhánh song song).

## Reverted

_Không có revert trong khoảng này._

## Deploy notes

- **Không có tín hiệu deploy** — repo này không dùng `[deploy-functions]`/CI deploy tag, không có migration file, không version bump. Chỉ có build check ("build passes") và gate render SVG trong từng commit message.
- Điểm cần chú ý duy nhất: `.claude/content-plan/INFRA-TRACK.json` là **state file của plan bền trên đĩa** — mỗi commit author-course cập nhật nó (+7 dòng). Nếu resume workflow, đây là source of truth cho phần nào đã xong.
- Gold lesson được đăng ký `available:false` cho phần chưa author (`259f2eb`) → registry có thể chứa lesson chưa tồn tại nội dung; kiểm cờ này trước khi tin số liệu "course đã đủ bài".

## Liên kết gợi ý

[[aws]] · [[aws-certification]] · [[digest-aws-2026-07-24]] · [[digest-aws-2026-07-23]] · [[caching-layers]] · [[learning-in-public]] · [[moc-learning-pkm]]
