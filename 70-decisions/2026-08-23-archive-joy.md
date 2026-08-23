---
type: decision
title: Đề xuất chuyển joy sang 40-archive
summary: Repo `~/projects/joy` không có commit từ 2026-01-08 (227 ngày) và chưa từng có digest riêng, dù Joy Loyalty vẫn được chạm gián tiếp từ phía subscriptions — đề xuất chuyển khỏi `10-projects/` và để trách nhiệm bảo trì sống ở area [[shopify-app-dev]].
tags: [loyalty, avada, shopify, saas, project]
created: 2026-08-23
updated: 2026-08-23
review: 2026-11-23
source: [[joy]] · [[shopify-app-dev]] · [[shipped-subscriptions-2026-08-20]] · [[2026-08-09-archive-customer-manager-mono]]
---

# Đề xuất: chuyển [[joy]] sang `40-archive/`

**Đây là proposal, chưa thực hiện.**

## Dữ kiện

| Tín hiệu | Giá trị |
|---|---|
| Commit gần nhất `~/projects/joy` | **2026-01-08** (227 ngày — lâu nhất trong toàn bộ danh sách) |
| Digest riêng của project | **chưa có cái nào**, từ lúc seed brain 2026-07-06 |
| Note project | `updated: 2026-07-06`, `status: active` |
| Chạm gián tiếp gần nhất | `v2.34.79` — **loyalty sync bỏ qua shop free-forever**, nhưng commit đó nằm ở repo `subscriptions` ([[shipped-subscriptions-2026-08-20]]) |

`brain-core.md` liệt kê "joy loyalty" trong nhóm app đang làm. Đó là mô tả **phạm vi trách
nhiệm**, và nó vẫn đúng — nhưng nó không mâu thuẫn với việc repo im 7 tháng.

## Why

- **227 ngày không commit là bằng chứng mạnh nhất trong cả danh sách stale tuần này**, và
  mốc 2026-01 nằm trước hẳn đợt chuyển remote on-prem (2026-08-10) nên không giải thích
  được bằng "clone local chưa fetch".
- **PARA**: không có mục tiêu đang chạy, không deadline, không task treo. Việc thật đang
  chạm tới Joy Loyalty đi **từ repo khác** (tích hợp phía Joy Subscription), tức nó là bề
  mặt của [[subscriptions]] chứ không phải một project riêng đang mở.
- **Trách nhiệm bảo trì không rơi mất**: [[joy]] đã nằm trong mục "Các app đang phụ trách"
  của [[shopify-app-dev]] — đúng chỗ mà [[2026-08-09-archive-customer-manager-mono]] đã chốt
  cho ca này.
- **Note đang nói sai hiện trạng**: `status: active` cho repo im 7 tháng làm `index.md` mất
  giá trị đúng-lúc-tra.

## Tradeoff

- **Note `joy.md` là note dày nhất trong nhóm này** — mô tả 60+ extension, phân tầng
  repository/service/controller, mô hình billing. Nó là tài liệu định hướng thật sự hữu
  ích nếu ngày mai phải mở lại repo. Archive làm nó tụt khỏi đường tra mặc định.
- **Mất khỏi tầm quét `brain-gitlog`** — nếu Joy Loyalty được làm lại thì commit sẽ không tự
  sinh proposal `shipped-*` cho tới khi đưa project trở lại.
- **Rủi ro lệch với brain-core**: `brain-core.md` (vào context ở MỌI repo) đang nêu tên joy.
  Nếu archive thì hoặc sửa dòng đó, hoặc chấp nhận nó mô tả trách nhiệm chứ không mô tả
  project — nên nói rõ chọn cái nào thay vì để hai file nói khác nhau.
- **Lùi lại được** bằng một lần `git mv`.

Cùng đợt quét stale: [[2026-08-23-archive-crm]] (153 ngày), và hai đề xuất trước đó
[[2026-08-09-archive-detect]] · [[2026-08-09-archive-customer-manager-mono]].

## ⚠️ Chưa xác minh

- App chắc chắn còn chạy production (là SaaS multi-tenant nhiều nghìn merchant) — điều chưa
  xác minh là **có ai đang commit lên remote hay không**; ở đây chỉ đọc clone trên máy.
  Kiểm trước khi chốt: `git fetch --all` + đối chiếu `origin`, và xác định repo đã chuyển
  `git.avada.net` hay chưa (mục treo trong [[shopify-app-dev]]).
- Có một MCP server tên "Joy Loyalty" được cấu hình trong môi trường làm việc (chưa
  authorize). Chưa rõ nó nói lên việc đang dùng app thật hay chỉ là cấu hình còn sót.
