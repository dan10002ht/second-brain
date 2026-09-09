---
type: note
title: Digest game-server — 2026-09-09 (hai con số sai trong bài đã viết, và cách bắt được)
summary: Claim "scheduler naive làm world chậm 5%, sau 10 phút lệch 30 giây" là SAI — accumulator nạp thời gian thật nên sim step vẫn đủ; cái naive thật sự mất là độ phân giải input và drift TĂNG THEO TẢI; và con số `dropped 132` trong lesson là số lạc từ một lần chạy khác, số đúng là 13 theo công thức `floor(stall/dt) − MaxCatchUp`.
tags: [learning, system-design, method]
created: 2026-09-09
updated: 2026-09-09
source: project `game-server` — session history (giao lesson 02 sang session `aws`, nhận báo cáo và tự kiểm lại)
---

Nối tiếp [[digest-game-server-2026-09-08]]. Phần đáng giữ của lượt này **không phải bài viết mới** mà
là hai con số sai bị bắt — cả hai đều là số của tôi, đều nằm trong tài liệu nhiều ngày, và đều được
phát hiện bằng cách **chạy lại code thật**, không bằng đọc lại.

## Hai lỗi số liệu

**1. "naive → world chậm 5%, sau 10 phút lệch 30 giây" là sai.** Claim này có ở cả
`lessons/02` bản cũ lẫn `PHASE0.md`. Chạy `-sched naive -duration 20s`:

```
ticks 1137/1200 (−5,25%)      ← đúng
sim steps 1200  catch-up 63  dropped 0   ← thời gian mô phỏng KHỚP TUYỆT ĐỐI
```

Vì accumulator nạp **thời gian thật đã trôi qua**, không đếm vòng lặp: tick tỉnh muộn chạy bù 2 step.
Không lệch một ms nào. Cái `naive` thật sự mất là:

- **độ phân giải input** — 56,9 Hz, input bị dùng muộn tới 33 ms;
- **nhịp gửi snapshot** nếu đếm theo vòng lặp;
- và quan trọng nhất, **drift tăng theo tải**: cùng máy, naive 1.000 entity `−5,32%` vs 200.000 entity
  `−10,00%`, còn `deadline` `0,00%` ở cả hai.

Chỗ đáng nhớ vượt ra ngoài chủ đề game: **một triệu chứng đo được (tick thiếu 5%) đã bị suy diễn
thẳng thành một hậu quả chưa từng đo (world chậm 30 giây)**, rồi hậu quả bịa đó sống trong hai file
và được trích như sự thật.

**2. `dropped 132` là số lạc từ một lần chạy khác.** Lesson ghi `-stall 300ms` → "catch-up 63, dropped
132"; `132` thực ra là số của run quá tải 20 triệu entity ở `PHASE0.md`. Số đúng là **13**. Đoán công
thức `dropped = floor(stall/dt) − MaxCatchUp` rồi kiểm 5 mốc — **khớp cả 5**: 60ms→0, 80ms→0, 100ms→1,
150ms→4, 300ms→13. Ngưỡng tha thứ = `5 × 16,67 = 83,3 ms`. Một con số lẻ được thay bằng một công thức
kiểm được — và bảng đó thành bài "Tính tay" trong lesson.

## Kỹ thuật rút ra

- **Kiểm chứng lời báo của session/agent khác bằng máy, không bằng lý lẽ.** Peer báo hai lỗi; tôi chạy
  lại cả hai trước khi nhận, và cả hai đều đúng. → [[bang-chung-phan-biet-duoc]].
- **Sửa luôn tài liệu bị bài viết trỏ tới.** `PHASE0.md` chứa đúng claim mà lesson vừa bác; để nguyên
  là để lại một mâu thuẫn có thật giữa hai file cùng được đọc.
- **Số đo lại trên máy khác thì ghi rõ là số đo, không phải hằng số.** `deadline 5s` cho p99 1,07ms ở
  máy này trong khi doc ghi 5,90ms — chênh do tải máy lúc đo.
- **Nói rõ chỗ không chắc thay vì làm ra vẻ chính xác.** Q3 125fps jump là **họ hàng gần** chứ không
  cùng lỗi với tích phân rời rạc (nó làm tròn frametime xuống ms nguyên) — ghi là giai thoại cộng
  đồng; Dark Souls II durability theo frame *chưa xác minh* từ nguồn gốc; năm của bài "Fix Your
  Timestep!" chỉ ghi "giữa những năm 2000".

## Giao việc sang session khác

Lượt này việc viết lesson được giao cho một session Claude khác (`092f4c54`, đang mở ở repo `aws`)
qua cross-session message. Hai điều đáng giữ:

- **Bắt session nhận xác nhận session id trước khi làm** — nó xác nhận đúng rồi mới nhận việc; gửi
  nhầm session là chuyện xảy ra được.
- Brief phải chở theo **template + tiêu chuẩn chất lượng + số đã kiểm chứng**, vì bên kia không có
  ngữ cảnh của phiên này. Prompt được ghi thành file (`lessons/_prompts/phase1.md`) để tái dùng cho
  các phase sau thay vì gõ lại.

## ROADMAP — 5 chủ đề bổ sung

Clock sync client–server thành **bước 0 của Phase 2** (ba bước sau đều giả định nó có; sửa lệch bằng
co giãn tick chứ không nhảy) · determinism cross-platform cuối Phase 2, trỏ hạn trả ở Phase 6
(fixed-point bắt buộc vì rollback không có trọng tài sửa giữa chừng) · tầng dưới của mạng
(MTU ~1200, fragmentation, NAT) ở Phase 3 · chi phí theo CCU ở Phase 3 · bot client headless ở Phase 5
(bot phải dùng lại client code thật và phải **động** — bot đứng im làm AOI/delta rẻ đi, cho số đẹp mà sai).

Liên quan: [[digest-game-server-2026-09-08]] · [[digest-game-server-2026-09-07]] ·
[[digest-aws-2026-09-09]] · [[bang-chung-phan-biet-duoc]] · [[learning-in-public]]
