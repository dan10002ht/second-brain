---
type: decision
title: Archive project customer-manager-mono
summary: Đề xuất chuyển [[customer-manager-mono]] sang 40-archive theo nghĩa PARA "không active" — không commit 141 ngày, không xuất hiện trong digest nào; app có thể vẫn đang chạy production và đó không phải lý do giữ nó ở Projects.
tags: [monorepo, react, nodejs, postgresql, quan-ly-khach-hang, project]
created: 2026-08-09
updated: 2026-08-09
review: 2026-11-09
source: [[customer-manager-mono]]
---

# Archive [[customer-manager-mono]]

**Trạng thái hiện tại:** `status: active` trong `10-projects/customer-manager-mono.md`.
**Đề xuất:** move sang `40-archive/`, giữ nguyên nội dung.

## Why

- Commit cuối trong `~/projects/customer-manager-mono`: **2026-03-21, 141 ngày trước** —
  tín hiệu commit thật, không phải "không ai viết note".
- Git history theo mô tả trong note là **fix bug + tinh chỉnh**, không phải đang xây thêm.
  Feature lớn (login, backup, migrate data, nginx deploy) đã xong.
- **Không xuất hiện trong bất kỳ digest / shipped note nào** — 4,5 tháng không có một
  phiên làm việc nào được ghi lại.
- PARA định nghĩa Project là *có mục tiêu + deadline*. Cái này không còn mục tiêu đang
  chạy nào; nó là một app đã bàn giao.

## Tradeoff

- **Mất:** rơi khỏi `brain-gitlog` — nếu có đợt bảo trì (đổi máy chủ, sửa Baileys/WhatsApp
  khi API đổi) thì commit sẽ không tự sinh proposal. Đây là rủi ro **thật hơn** so với
  [[detect]] vì app này đang phục vụ một cơ sở kinh doanh thật.
- **Mất:** không còn trong mục Projects của `index.md` — khi có yêu cầu gấp từ phía dùng
  app, phải tra `40-archive/`.
- **Được:** danh sách active đúng với thực tế; `brain-weekly` thôi báo stale lặp lại.
- Lùi lại được bằng một lần move file.

## Điểm cần người quyết

App **có thể vẫn đang chạy production** (đã có nginx deploy + script backup). *Chưa xác
minh* trạng thái vận hành hiện tại — không kiểm tra được từ repo. Nếu nó vẫn đang phục vụ
người dùng thật, cân nhắc hướng thứ hai: chuyển sang **`20-areas/`** (trách nhiệm bảo trì
lâu dài, không có "xong") thay vì `40-archive/`. Archive đúng nếu mình đã hết trách nhiệm
với nó; area đúng nếu vẫn là người duy nhất sửa được khi nó hỏng.
