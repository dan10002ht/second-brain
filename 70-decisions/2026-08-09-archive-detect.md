---
type: decision
title: Archive project detect (Pipe Counter)
summary: Đề xuất chuyển [[detect]] sang 40-archive — prototype 3 commit, không commit 131 ngày, chưa từng xuất hiện trong bất kỳ digest nào.
tags: [ai, computer-vision, mobile, project]
created: 2026-08-09
updated: 2026-08-09
review: 2026-11-09
source: [[detect]]
---

# Archive [[detect]] — Pipe Counter (On-device AI)

**Trạng thái hiện tại:** `status: active` trong `10-projects/detect.md`.
**Đề xuất:** đổi sang `status: done` (hoặc bỏ status) và move sang `40-archive/`.

## Why

- Commit cuối trong `~/projects/detect`: **2026-03-31, 131 ngày trước**. Đây là tín hiệu
  mạnh (commit thật trong repo), không phải "không ai viết note về nó".
- Chính note project tự mô tả là **"giai đoạn đầu, mới 3 commit"** — chưa có sản phẩm
  chạy được, chưa có model export, chưa có ai dùng. Không phải repo "im lặng vì đã ổn định".
- **Chưa từng xuất hiện trong một digest hay shipped note nào** kể từ khi brain được seed
  (grep toàn brain: chỉ có `index.md` và chính file project). Không có việc đang treo,
  không có câu hỏi mở, không có ai chờ.
- Đây là project cá nhân, không phải app công ty — không có bên thứ ba nào tiếp tục nó
  thay mình.

## Tradeoff

- **Mất:** `detect` rơi khỏi phạm vi quét của `brain-gitlog` → nếu quay lại code, những
  commit đầu tiên sẽ không tự sinh proposal `shipped-*`. Phải nhớ đưa lại vào
  `10-projects/` khi resume.
- **Mất:** biến mất khỏi mục Projects của `index.md`, nên khi tìm ý tưởng cũ phải nhớ ngó
  `40-archive/`.
- **Được:** danh sách project active phản ánh đúng việc thực sự đang chạy — hiện có 12
  project mà chỉ 3–4 cái có hoạt động trong tháng. Một danh sách active nói dối thì
  `brain-weekly` báo stale mãi mà không ai xử lý.
- Thao tác **lùi lại được**: move file ngược về `10-projects/` là đủ. Không xoá gì.

## Ghi chú

Kiến thức kỹ thuật trong note (workflow YOLOv8 → TFLite → Flutter, on-device inference)
vẫn giữ nguyên trong file khi archive — archive là đổi *trạng thái*, không phải xoá.
