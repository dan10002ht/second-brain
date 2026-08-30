---
type: decision
title: Đề xuất chuyển backup khỏi 10-projects/
summary: Repo `~/projects/backup` không có commit 80 ngày và chưa từng xuất hiện trong bất kỳ digest/shipped nào — đề xuất chuyển khỏi `10-projects/` theo nghĩa PARA "không active", trách nhiệm bảo trì app vẫn sống ở area [[shopify-app-dev]].
tags: [project, backup, shopify, avada]
created: 2026-08-30
updated: 2026-08-30
review: 2026-11-30
source: [[backup]] · [[shopify-app-dev]] · brain-weekly 2026-08-30 (quét repo)
---

# Đề xuất: chuyển [[backup]] sang `40-archive/`

## Dữ kiện

| Tín hiệu | Giá trị |
|---|---|
| Commit gần nhất `~/projects/backup` | 2026-06-11 — **80 ngày** |
| Số lần xuất hiện trong `notes/` (digest + shipped) | **0**, suốt hai tháng job digest chạy hằng ngày |
| Số file trong brain có nhắc tới | 3 — và cả 3 chỉ là mục lục: `index.md`, `10-projects/backup.md`, `20-areas/shopify-app-dev.md` |
| Note project nói gì | "Đang phát triển active" — viết 2026-07-06, **chưa cập nhật lần nào** |

⚠️ *Chưa xác minh*: con số 80 ngày lấy từ lượt quét của `brain-weekly`; lệnh `git log` trên
`~/projects/backup` không chạy được trong phiên này (thiếu quyền), nên tôi chưa tự đối chiếu.
Phần **đã** tự kiểm là số lần xuất hiện trong brain — đúng là 0.

## Why

Nhãn `status: active` trong `10-projects/backup.md` đang **nói sai**. Nó được viết một lần lúc
seed brain rồi không ai chạm; đọc hôm nay thì nó tuyên bố một thứ mà không một dữ kiện nào trong
brain đỡ được. Một project nói dối về trạng thái của mình còn tệ hơn một project nằm trong
archive, vì nó làm hỏng chính cái danh sách mình dùng để biết đang gánh bao nhiêu việc.

PARA định nghĩa Project là **việc có mục tiêu + deadline**. Suốt hai tháng brain ghi lại từng
ngày làm việc trên 5 project (subscriptions, pdf, ticket-mcrsv, aws, artifacts), `backup` không
xuất hiện một lần — tức nó không có mục tiêu đang chạy, không có deadline nào đang tính.

App vẫn sống trên production và vẫn có thể có ticket bất cứ lúc nào. **Đó không phải lý do giữ nó
ở Projects** — đó chính xác là định nghĩa của Area, và [[shopify-app-dev]] đã liệt kê `backup`
trong "Các app đang phụ trách" rồi. Trách nhiệm không mất đi khi note project rời `10-projects/`.

Cùng khung lập luận đã dùng cho [[2026-08-23-archive-crm]] và [[2026-08-23-archive-joy]].

## Tradeoff

- **Mất khỏi tầm quét của `brain-gitlog`.** Nếu có một đợt commit vào `backup`, job 06:00 sẽ
  không sinh proposal `shipped-backup-*` nữa — công việc đó vào brain muộn hoặc không vào.
  Đây là mất mát thật, không phải hình thức.
- **80 ngày là ngưỡng yếu nhất trong nhóm đã archive.** So sánh: detect 131 ngày, crm 153,
  customer-manager-mono 162, joy 227. Với một app bảo trì, 80 ngày im lặng hoàn toàn có thể chỉ
  là "quý này không có ticket" chứ không phải "xong". Đây là chỗ đề xuất này yếu nhất, và là lý
  do nó cần người chốt chứ không tự chạy.
- **Đảo ngược rẻ**: `40-archive/` → `10-projects/` là một lần `git mv` + một dòng `index.md`.
  Tiền lệ đã có ở [[avada-core]] — archive vì "repo không còn trên máy", ba tuần sau repo quay
  lại và lý do archive hết đúng.

## Nếu chốt archive thì phải làm kèm

1. Sửa `status: active` trong `10-projects/backup.md` — đừng mang một dòng sai vào archive.
2. Ghi lý do + ngày archive vào đầu note, theo đúng kiểu [[avada-core]] / [[headless-demo]].
3. Cập nhật `index.md` và mục "Các app đang phụ trách" của [[shopify-app-dev]] để nó trỏ vào
   archive — app vẫn là trách nhiệm, chỉ không còn là project.
4. Đóng nốt câu hỏi treo đang ghi trong [[shopify-app-dev]]: `backup` đã chuyển GitLab on-prem
   hay chưa (hiện là *"chưa xác minh"*).

## Liên quan

[[backup]] · [[shopify-app-dev]] · [[2026-08-23-archive-crm]] · [[2026-08-23-archive-joy]] ·
[[2026-08-09-archive-detect]] · [[2026-08-09-archive-customer-manager-mono]] · [[avada-core]]
