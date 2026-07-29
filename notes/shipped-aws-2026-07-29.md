---
type: note
title: Shipped AWS study-app 2026-07-28 — đóng nốt DATASTORES ch7 + phủ quiz cho toàn bộ course infra/blockchain (1.716 câu, bank 3.416)
summary: Commit landed 07-28 trên `main`: hoàn tất chapter cuối của DATASTORES (7 lesson production-ops, gold lesson trước rồi author phần còn lại) rồi chạy pipeline sinh quiz cho 6 course/chapter mới — BLOCKCHAIN 636, DATASTORES 312, MESSAGING 228, DISTRIBUTED 276, CLOUDNATIVE 216, SRE 48, BACKEND 36 câu — mọi lần đều "0 validation error, build passes"; không revert, không tín hiệu deploy.
tags: [aws, cloud, learning, certification, method]
created: 2026-07-29
source: repo "aws" — git log (hash đã verify)
---

# Shipped — AWS study-app, commit landed 2026-07-28

9 commit, tất cả trên `main` (HEAD `f0c77a3`), không branch phụ.
Phần *cách làm / gotcha* ở [[digest-aws-2026-07-28]] và [[digest-aws-2026-07-27]] — ở đây chỉ ghi *cái gì đã landed*.

## Shipped

### 1. Đóng nốt nội dung: DATASTORES chapter 7 (Data ops at scale)

Vẫn đúng nhịp "gold lesson làm chuẩn style → author phần còn lại" như [[shipped-aws-2026-07-25]]:

- `a277ceb` — mở chapter 7 + **gold lesson `dst-19`** (migration & online schema change ở quy mô lớn: áp lực IO, lock level, `CREATE INDEX CONCURRENTLY`, gh-ost/pt-osc, replication lag physical vs logical, expand-contract, playbook zero-downtime). Chapter này sinh ra từ **một câu hỏi ops thật**, không phải từ outline.
- `98b11f8` — 6 lesson còn lại: index ops (IO/bloat/REINDEX), storage reclamation (VACUUM/txid-wraparound, LSM compaction), replication lag & bẫy read-replica, cạn connection pool (PgBouncer), hot key/partition & noisy neighbor, + capstone chẩn đoán data-incident đầu-cuối. 13 agent, 19 SVG render sạch. **DATASTORES chốt ở 26 lesson / 7 chapter.**

### 2. Phủ quiz cho toàn bộ course mới — 1.716 câu, một ngày

Mỗi commit = 1 course, đều theo **gen + adversarial verify**, 12 câu/lesson, tỉ lệ multi-answer ~17%, và đều báo "0 validation error / build passes":

| Course | Commit | Lesson × 12 | Câu | Kiểu đề |
|---|---|---|---|---|
| MESSAGING | `8c7f1df` | 19 | 228 | scenario/trade-off: chọn broker, delivery semantics, Event Sourcing/CQRS/Saga |
| CLOUDNATIVE | `6698c47` | 18 | 216 | ops: chọn workload, Service/Ingress, debug CrashLoopBackOff/OOMKilled, Helm/GitOps/mesh |
| DISTRIBUTED | `d76bf9e` | 23 | 276 | lý thuyết/trade-off: CAP, consistency model, quorum, Raft, vector clock, 2PC vs Saga, idempotency |
| DATASTORES | `a34adc7` | 26 | 312 | production: chọn store, Redis pattern, bẫy cache, NoSQL modeling, migration/replication-lag/pool/hotspot |
| BLOCKCHAIN | `7b42388` | 53 | **636** | consensus/token/L2, soi lỗ hổng smart-contract, toán AMM, vì sao hack xảy ra, ZK/non-EVM |
| SRE Observability | `4a96179` | 4 | 48 | OTel/3 pillars, Prometheus/PromQL, tracing, logging |
| BACKEND Service Comm. | `f0c77a3` | 3 | 36 | gRPC/Protobuf, API Gateway & LB, reverse proxy & rate limiting |

- `8c7f1df` cũng là commit thêm **`.claude/workflows/build-content-loop/scripts/knowledge-quiz-file.workflow.js`** (127 dòng) — tức là workflow sinh quiz được viết một lần rồi tái dùng cho 6 course sau.
- **Kỹ thuật chống trùng id:** mỗi lần append vào bank sẵn có đều **re-id theo offset** (`sre-q-079..126` = +78, `be-q-105..140` = +104) thay vì đánh lại từ 1. Đây là quy ước cần nhớ nếu sau này thêm câu vào cùng course.
- Bank kết thúc ở **3.416 câu** (3.332 sau BLOCKCHAIN → +48 SRE → +36 BACKEND). Sau commit cuối: quiz đã phủ **hết** course infra + blockchain mới.

## Reverted

_Không có revert trong khoảng này._

## Deploy notes

- **Không có tín hiệu deploy** — repo này không dùng `[deploy-functions]`/tag CI, không migration, không version bump. Gate duy nhất nằm trong commit message: "0 validation errors", "build passes", "all 19 SVGs render clean".
- **File state cần để ý khi resume:** `.claude/content-plan/QUIZ-NEW-COURSES.json` bị đụng ở 6/7 commit quiz (giống vai trò `INFRA-TRACK.json` với phần lesson) → đây là source of truth "course nào đã có quiz".
- **Cảnh báo kích thước:** `web/data/generatedKnowledge.ts` + bản `.data.json` song sinh nhận **~74k dòng thêm** chỉ trong ngày (riêng BLOCKCHAIN +27k). Cặp file này bị ghi ở mọi commit quiz → điểm conflict chắc chắn nếu chạy nhiều nhánh song song, và là lý do JSON sidecar được dùng làm nguồn sự thật thay cho union type TS (xem [[digest-aws-2026-07-27]]).

## Liên kết gợi ý

[[aws]] · [[aws-certification]] · [[shipped-aws-2026-07-25]] · [[digest-aws-2026-07-28]] · [[digest-aws-2026-07-27]] · [[digest-aws-2026-07-24]] · [[caching-layers]] (giao với DATASTORES) · [[moc-learning-pkm]]
