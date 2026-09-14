---
type: decision
title: Slot VM bỏ vite watcher thường trú, đổi sang build queue toàn cục + cgroup riêng mỗi slot
summary: Watcher vite giữ 1885 MB khi đứng yên nên VM 7,9 GB chỉ chạy được 2 slot; đổi sang hàng đợi build một-job-một-lượt và cgroup riêng cho từng slot thì chạy được 4, và ràng buộc chuyển từ RAM sang đĩa.
tags: [agent, automation, tooling, performance, vite]
created: 2026-09-14
updated: 2026-09-14
review: 2026-12-14
source: VM `dantt-solar` — đo trực tiếp 2026-09-14; spec ở `~/agent/docs/2026-09-14-slot-build-queue.md`
---

# Slot VM: build queue thay cho watcher thường trú

## Bối cảnh

`start sub-s3` hỏng ngày 11/09 với `Reached heap limit` ở 1292 MB trong khi VM còn trống
7,1 GB. Ba tầng chồng lên nhau, không tầng nào sai một mình:

| Tầng | Sự thật |
|---|---|
| cgroup | `slotctl` do `dashboard.js` gọi → con thừa kế cgroup của `agent-dashboard.service` (`MemoryMax=2600M`). `setsid()` tách session, **không** tách cgroup |
| node | Node 20 lấy trần heap V8 theo bộ nhớ khả dụng của cgroup: 2600M → heap 1348 MB. `MemoryHigh` cũng hạ heap y hệt `MemoryMax` |
| gate | `tinhChoTrong()` đọc `/proc/meminfo`, mù với cgroup đang giam chính nó → gật đầu cho một slot nó không giữ nổi |

Số đo quyết định: `vite build --watch` giữ **1885 MB khi đứng yên** — 90% giá một slot.
Bỏ watcher thì slot chỉ còn **240 MB** idle.

## Quyết định

1. **Bỏ `vite build --watch` thường trú.** Frontend build qua **hàng đợi toàn cục, một job
   nặng một lượt** — đỉnh 2100 MB chỉ tồn tại trong lúc build rồi trả lại.
2. **Hàng đợi là thư mục job đánh số + `flock`; runner tự sinh khi có job rồi tự thoát.**
   Không daemon thường trú.
3. **Mỗi slot một cgroup riêng** (`systemd-run --scope`, slice `slots.slice` 5700M, slot
   2000M, job **4000M**).
4. **Pull tự làm hết cho tester**, kể cả `ext-deploy` — tester chỉ chọn nhánh rồi bấm.
5. **`slotctl` vào git**: nguồn ở `~/agent/slots/`, deploy bằng `cai-slotctl.sh`,
   `morning-report` cảnh báo khi bản chạy lệch bản repo.

## Why

- **1885 MB là chi phí đứng yên, không phải chi phí build.** Rollup giữ đồ thị module để
  chờ file đổi. Trả giá đó 24/7 cho một thứ tester hiếm khi cần (họ chạy nhánh có sẵn,
  không ngồi sửa frontend trên VM) là sai chỗ. 4 slot idle sau khi bỏ watcher: 960 MB.
- **4000M cho job build không phải con số tròn cho đẹp.** Đo: `MemoryMax` 2600→heap 1348,
  3200→1648, 4000→**2048**, không giới hạn→2096. 4000M là mức đầu tiên cho heap gần bằng
  lúc không giới hạn. Thấp hơn là tái diễn đúng lỗi 11/09.
- **`MemoryHigh` không phải van mềm.** Tưởng nó chỉ đẩy sang swap, nhưng node đọc cả
  `memory.high` nên nó cắt heap y hệt `MemoryMax`. Đã đo, không suy đoán.
- **Slice cha không hạ heap của con** (node chỉ đọc cgroup lá) — nên đặt được tường bảo vệ
  agent support ở slice mà không cắt heap job build.
- **Không thêm daemon.** Runner thường trú sẽ là thứ thứ N phải canh sống. `flock` do kernel
  giữ nên process chết là lock tự nhả — rẻ hơn mọi cơ chế tự viết.
- **`ext-deploy` là bước cuối** vì nó là bước duy nhất chạy lại hai lần thì có hại (đẩy
  theme extension lên app Shopify của slot). Chết ở bước cuối thì không kéo theo gì.

## Tradeoff

- **Mất "sửa là thấy ngay" trên VM.** Sửa frontend xong phải đi qua Pull/queue, chậm hơn
  watcher vài phút. Chấp nhận được vì người dùng thật là tester, không phải dev ngồi sửa
  frontend trên VM — nhưng nếu sau này có người làm thế thì quyết định này phải xem lại.
- **Tester thứ hai phải chờ.** Một job nặng một lượt nghĩa là hai người bấm Pull cùng lúc
  thì người sau chờ 3–5 phút. Đổi lấy việc đỉnh RAM không bao giờ vỡ. Chạy song song theo
  ngân sách RAM nhanh hơn nhưng phải đoán đúng đỉnh từng loại job — đoán thiếu là quay lại
  đúng lỗi 11/09.
- **Thêm một mặt phải bảo trì:** job file, state, runner. Đổi lấy việc bỏ được một tiến
  trình 1,9 GB chạy 24/7 mỗi slot.
- **Trần mới là đĩa, không phải RAM.** Còn 16 GB; `sub-s3` sau `yarn install` là 2,9 GB.
  Muốn hơn 4 slot thì phải xin đĩa, không phải xin RAM.
- **`slotctl` vào git là một bước lùi về tốc độ sửa** — không còn sửa thẳng trên VM rồi chạy
  luôn. Nhưng bản chụp cũ (`slotctl.snapshot`, 04/09) đã lệch 10 ngày mà không ai biết; một
  bản sao lưu lệch nguy hơn không có, vì nó trông như đã được sao lưu.

## Liên quan

- [[2026-08-27-he-thi-giac-chong-ai-slop]] — cùng bài học: ràng buộc phải đếm được ở code,
  không sống bằng lời dặn.
- [[agent-support-design]] — hệ agent support chạy trên chính VM này.
