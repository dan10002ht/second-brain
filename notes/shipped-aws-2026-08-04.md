---
type: note
title: Shipped AWS learning platform — commit landed 2026-08-03 (SAA-C03 lấp gap Migration + Analytics)
summary: Commit landed 08-03 trên `main` — 4 commit đóng gap SAA-C03 phát hiện qua audit theo task statements: 2 lesson mới (ch2-05 Migration & Transfer, ch2-06 Data Ingestion & Analytics) + 24 câu scenario (bank 795) + 2 sửa sai factual; không revert, không tín hiệu deploy.
tags: [aws, certification, learning, ai]
created: 2026-08-04
source: repo "aws" — git log (4 commit, 2026-08-03, nhánh `main`); các hash dưới đây đã verify
---

# AWS — shipped 2026-08-03

> Phần *học được* (cách chạy audit, workflow author→critic) nằm ở [[digest-aws-2026-08-03]].
> Đây chỉ là **cái gì đã landed**. Bối cảnh project: [[aws]], [[aws-certification]].

## Shipped

Cả 4 commit đều nằm thẳng trên `main` (`99c3c72` = HEAD = `origin/main`), một mạch
audit → lấp gap → phủ đề.

**1. Lấp gap nội dung phát hiện qua audit**
- `4e6217c` — lesson mới `ch2-05-migration-transfer`: DataSync vs Snow Family vs
  Storage Gateway (File/Volume/Tape) vs DMS+SCT vs Transfer Family vs MGN. Audit
  (exam guide chính thức + LIVE appendix) kết luận kiến trúc course đã đúng
  blueprint 4 domain 30/26/24/20, **chỉ có duy nhất 1 gap thật** là Migration &
  Transfer (D3 TS5 / D4 TS1). Wire vào Domain 3 order 13, Domain 4 dồn lên 14-17.
- `62c8229` — audit sâu theo từng domain (điểm 77-84, đều "minor-gaps") rồi sửa:
  lesson mới `ch2-06-data-ingestion-analytics` (Kinesis Streams/Firehose/Managed
  Flink/MSK, Athena+Parquet, Glue, Redshift vs Athena vs EMR, Lake Formation,
  QuickSight) lấp TS5; **2 sửa sai factual**: KMS là FIPS 140-2 **Level 3** (trước
  ghi Level 2), Aurora Serverless v2 scale-to-0 từ 11/2024 (bỏ câu "min 0.5 ACU"
  mâu thuẫn); enrich 6 lesson sẵn có (Directory Service, Cognito user vs identity
  pool, ABAC vs RBAC, S3 Block Public Access + Access Points, VPN vs DX, MQ/MSK,
  Step Functions, blue-green/immutable, DAX vs ElastiCache, so sánh chi phí
  NAT/DX/TGW và RDS vs DynamoDB). SAA-C03 chốt **18 lesson / 4 domain**.

**2. Ngân hàng đề — 24 câu scenario mới, bank 795**
- `0ade786` — `saa-ext-006..017` (12 câu) gắn lesson `ch2-05`, domain 3.
- `99c3c72` — `saa-ext-018..029` (12 câu) gắn lesson `ch2-06`, domain 3. Bank 795 câu.
- Cả hai đều gen + adversarial verify, 0 validation error, explanation shuffle-safe.

**Hạ tầng workflow** (đi kèm `62c8229`): thêm `.claude/workflows/saa-domain-audit.js`
và `saa-enrich.js` — audit/enrich giờ là workflow tái dùng, không phải thao tác một lần.

## Reverted

Không có.

## Deploy notes

Không có tín hiệu deploy: repo không dùng `[deploy-functions]`, không có version
bump, không migration. Gate duy nhất là **build passes + 18 SVG render clean** —
đúng kỷ luật "gate deterministic chạy trước evaluator LLM" ghi ở
[[digest-aws-2026-07-24]] / [[digest-aws-2026-07-27]].

## Liên quan

[[shipped-aws-2026-07-25]] · [[shipped-aws-2026-07-29]] (mốc trước: bank 3.416 câu
cho track hạ tầng — SAA-C03 là bank riêng) · [[digest-aws-2026-07-28]]
