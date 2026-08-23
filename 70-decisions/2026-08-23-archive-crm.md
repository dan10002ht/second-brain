---
type: decision
title: Đề xuất chuyển crm sang 40-archive
summary: Repo `~/projects/crm` không có commit từ 2026-03-23 (153 ngày) và không xuất hiện trong bất kỳ digest/shipped nào suốt tháng 7–8 — đề xuất chuyển khỏi `10-projects/` theo nghĩa PARA "không active", app vẫn được liệt kê ở area [[shopify-app-dev]].
tags: [crm, avada, marketing-automation, project]
created: 2026-08-23
updated: 2026-08-23
review: 2026-11-23
source: [[crm]] · [[shopify-app-dev]] · [[2026-08-09-archive-customer-manager-mono]]
---

# Đề xuất: chuyển [[crm]] sang `40-archive/`

**Đây là proposal, chưa thực hiện.** `10-projects/crm.md` vẫn nguyên chỗ cũ với
`status: active`.

## Dữ kiện

| Tín hiệu | Giá trị |
|---|---|
| Commit gần nhất `~/projects/crm` | **2026-03-23** (153 ngày) |
| Xuất hiện trong digest/shipped tháng 7–8 | **0 lần** (`rg` toàn bộ `notes/`) |
| Note project | `updated: 2026-07-06`, `status: active` — chưa từng sửa từ lúc seed |
| Có mặt ở area [[shopify-app-dev]] | có, mục "Các app đang phụ trách" |

Phần "Trạng thái" của note đang ghi *"Active. Commit gần đây tập trung vào backfill/resync
transactions lên BigQuery"* — mô tả đó nói về công việc của **trước tháng 3**, và nó là loại
câu sẽ được người sau đọc như hiện trạng.

## Why

- **PARA: project là việc có mục tiêu + deadline.** `crm` không có mục tiêu nào đang chạy,
  không có deadline, không có task nào treo trong brain. Nó là một app còn tồn tại, không
  phải một dự án đang làm.
- **Cùng lập luận đã chốt ở [[2026-08-09-archive-customer-manager-mono]]**: app vẫn chạy
  production **không phải** lý do giữ nó ở Projects; nếu còn trách nhiệm bảo trì thì chỗ
  đúng là `20-areas/` — và trách nhiệm đó **đã** được ghi ở [[shopify-app-dev]], nên archive
  không làm rơi mất gì.
- **Note đang nói sai hiện trạng.** Giữ `status: active` cho một repo im 5 tháng làm hỏng
  chính thứ index.md phải đúng.
- 153 ngày ≫ ngưỡng 21 ngày của `brain-weekly`, và mốc **2026-03** nằm trước hẳn đợt
  chuyển remote on-prem (2026-08-10), nên không thể giải thích bằng "local clone chưa fetch
  bản on-prem".

## Tradeoff

- **Mất khỏi tầm quét của `brain-gitlog`** nếu job chỉ đọc repo của project active — commit
  crm sau này sẽ không tự sinh proposal `shipped-*`. Đây là cái mất thật; đổi lại là
  `10-projects/` chỉ còn thứ đang thực sự làm.
- **Note tech stack + gotcha BigQuery vẫn hữu ích** (bug field camelCase khi insert BQ,
  backfill 2 phase). Archive không xoá, nhưng làm nó khó gặp hơn khi tra ngẫu nhiên. Nếu
  gotcha đó đáng sống độc lập thì tách sang `30-resources/` **trước** khi archive.
- **Python/ML của crm đang là ví dụ neo trong [[dev-skills]]** ("churn/classify"). Archive
  crm mà không sửa dev-skills thì area trỏ vào một project đã archive — xem đề xuất
  `area-dev-skills-2026-08-23.md` cùng ngày.
- **Lùi lại được**: `40-archive/` → `10-projects/` là một lần `git mv` nếu crm sống lại.

Cùng đợt quét stale: [[2026-08-23-archive-joy]] (227 ngày), và hai đề xuất trước đó
[[2026-08-09-archive-detect]] · [[2026-08-09-archive-customer-manager-mono]].

## ⚠️ Chưa xác minh

- App có còn chạy production và có ai khác trong team đang commit lên remote hay không —
  ở đây chỉ đọc được **clone trên máy**. Kiểm rẻ nhất trước khi chốt: `git fetch --all` rồi
  đối chiếu `origin/master`, và xác định repo đã chuyển `git.avada.net` hay chưa (mục
  *chưa xác minh* về on-prem của `crm`/`backup`/`joy`/`shipping-labels` đang treo trong
  [[shopify-app-dev]]).
