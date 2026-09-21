---
type: note
title: Slot VM — hàng đợi build + cgroup đã chạy thật (21/09)
summary: Quyết định 14/09 được implement ngày 21/09; đo thật heap 2048MB trong scope 4000M, slot idle 250MB thay vì 2100MB, và ext-deploy phải là bước "hỏng không chí mạng" mới không nhuộm đỏ mọi lượt pull.
tags: [agent, automation, tooling, performance, vite]
created: 2026-09-21
updated: 2026-09-21
source: [[2026-09-14-slot-build-queue]]
---

# Slot VM: hàng đợi build đã chạy thật

Quyết định [[2026-09-14-slot-build-queue]] nằm ở trạng thái "đã duyệt thiết kế, chưa lập plan"
suốt một tuần. Trong tuần đó lỗi 11/09 **tái diễn nguyên văn** (21/09, `start sub-s3` từ
dashboard, OOM ở 1292MB) — vì bản `slotctl` đang chạy chưa có gì của quyết định đó.

Bài học không phải về kỹ thuật: **một quyết định chưa implement không bảo vệ được gì.**
`grep systemd-run /srv/slots/bin/slotctl` trả rỗng là thứ đáng kiểm ngay khi lỗi cũ quay lại,
trước khi đi chẩn đoán lại từ đầu.

## Số đo xác nhận lại (21/09, không phải chép từ spec)

| Đo | Giá trị |
|---|---|
| heap V8 trong scope `MemoryMax=4000M` | **2048 MB** |
| heap V8 trong cgroup dashboard (2600M) | 1348 MB |
| slice `slots.slice` khi 1 slot chạy, không watcher | **250 MB** (trước: ~2100MB có watcher) |
| `pull`/`start` trả về | 0,09 giây (trước: treo tới 10 phút) |
| build frontend một lượt | embed 51s, standalone 47s |
| install sub-s4 (yarn, cache ấm) | 74s |

## Bốn thứ chỉ lộ ra khi chạy thật

1. **`ext-deploy` không được phép làm hỏng cả job.** Đưa nó vào `pull` theo spec thì mọi lượt
   pull `sub-*` kết thúc "HỎNG" đỏ — vì repo subscriptions đang lỗi codegen
   (`codegen.schema` là đường dẫn tương đối, Shopify CLI gọi từ gốc repo). 7/8 bước xong, slot
   dùng được, nhưng thẻ slot đỏ. Để vậy thì tester học cách bỏ qua màu đỏ — mất luôn tín hiệu.
   → sinh khái niệm **bước không chí mạng**: hỏng thì ghi `canhBaoJob`, job vẫn tính xong.

2. **Số job không được dùng lại.** Đếm `max(so trong queue)+1` làm số quay về 1 mỗi khi hàng đợi
   rỗng; hai job khác nhau cùng tên "#1" trong cùng file log là thứ làm người đọc log tin sai.
   → bộ đếm bền ở `/srv/slots/state/so-job`.

3. **Gate phải chừa chỗ cho một lượt build (2200MB), không chỉ cho slot idle.** Lấp đầy slice
   bằng 4 slot idle rồi mới phát hiện không còn chỗ build là lặp lại đúng sai lầm cũ ở tầng khác.

4. **Giết runner để lại scope mồ côi, và tên scope cố định biến nó thành bế tắc.** `kill -9`
   runner không kéo theo vite; vite mồ côi giữ `slot-job.scope` sống, nên `systemd-run --unit=slot-job`
   của runner mới bị từ chối ("Unit slot-job.scope was already loaded") — **im lặng**, mỗi vòng quét
   3 giây lại hỏng một lần. Hệ thống tự khỏi sau ~9 giây khi vite mồ côi chạy xong, nhưng đó là
   may chứ không phải thiết kế: một tiến trình mồ côi sống lâu sẽ khoá hàng đợi vô thời hạn.
   → dọn `slot-job.scope` trước khi dựng runner (chỉ khi flock chứng minh không còn runner), và
   nếu vẫn không dọn được thì bỏ `--unit` để systemd tự đặt tên. Thà mất tên đẹp còn hơn kẹt.
   Đây cũng là lý do done-criteria "kill -9 giữa bước build" đáng tồn tại: không test thì lỗi này
   chỉ xuất hiện lần đầu vào lúc runner chết thật, giữa đêm.

## Ràng buộc mới là đĩa, đúng như dự đoán

Sau khi install `sub-s4` + `pdf-s4`: `/srv` còn **6,8GB / 48GB (86%)**. RAM không còn là thứ
chặn; muốn thêm slot có node_modules thì phải xin đĩa.

## Liên quan

- [[2026-09-14-slot-build-queue]] — quyết định gốc, Why + Tradeoff
- [[agent-support-design]]
