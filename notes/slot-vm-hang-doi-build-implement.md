---
type: note
title: Slot VM — hàng đợi build + cgroup đã chạy thật (21/09)
summary: Quyết định 14/09 được implement ngày 21/09 và chạy đủ 4 slot (tổng RSS 1388MB); đo thật heap 2048MB trong scope 4000M, slot idle ~300MB thay vì 2100MB, và ba giả định "hai app giống nhau" đều gãy khi mở rộng sang pdf-invoice.
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
| **4 slot cùng chạy** | tổng RSS **1388MB**, slice 3066/5700MB, cả 4 domain HTTP 200 |

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

## Hai slot pdf chưa bao giờ chạy được — và lý do không phải RAM

Khi mở rộng từ 2 lên 4 slot, ba giả định "hai app giống nhau" gãy liên tiếp. Cả ba đều im lặng
theo kiểu khác nhau, và không cái nào liên quan tới hàng đợi:

| Giả định | Sự thật | Triệu chứng |
|---|---|---|
| cùng bản Node | subscriptions `engines.node` = 20, pdf-invoice = **22** | yarn chặn ở engines giữa bước build |
| cùng tên artifact | sub ghi `embed-template.html`, pdf ghi **`embed.html`** | "build xong (mã 0) nhưng không ghi artifact" — trong khi nó ghi đủ |
| cùng cách đọc config | sub dùng `functions.config()` (cần `.runtimeconfig.json`), pdf dùng **dotenv** (`.env.local`) | pdf chết ở bước cuối đòi `firebase login`, vì một thứ nó không dùng |

Node 22 cài ra `/opt/node-22` (tải nodejs.org, kiểm SHASUMS256) và `duongDanLenh()` đặt nó lên
đầu PATH cho đúng slot cần — trước cả shim corepack, vì `corepack yarn` cũng phải chạy đúng bản.
Bằng chứng nó có hiệu lực: emulator in `✔ functions: Using node@22 from host`.

Credential Shopify của pdf **đã nằm sẵn trên VM** trong `packages/functions/.env.local` của chính
slot (sinh từ biến CI/CD `STAGING<N>_FUNCTIONS_ENV`) — chỉ khác tên: repo gọi `SHOPIFY_SECRET`,
slotctl đòi `SHOPIFY_API_SECRET`. Không phải đi xin secret, chỉ phải đọc kỹ chỗ đã có.

## Ràng buộc mới là đĩa, đúng như dự đoán

Sau khi install `sub-s4` + `pdf-s4`: `/srv` còn 5,4GB / 48GB (89%). RAM không còn là thứ chặn —
3 slot chạy cùng lúc chỉ tốn **1950MB / 5700MB** ngân sách slice.

Dọn được 2,1GB mà không mất gì đang dùng: `journalctl --vacuum-size=300M` (1,4GB) + `apt clean`
(0,6GB). Chỗ chiếm thật sự là `node_modules` của mỗi slot (~2,5GB) và `/home/agent/repos` (4,9GB).
Muốn hơn 4 slot thì phải xin đĩa, đúng như tradeoff đã ghi.

## Liên quan

- [[2026-09-14-slot-build-queue]] — quyết định gốc, Why + Tradeoff
- [[agent-support-design]]
