---
type: note
title: ticket-mcrsv — digest 2026-08-27
summary: Bypass middleware phía server không đủ vì `(admin)`/`(org)` còn `RoleGuard` phía client chuyển hướng sau hydrate — phải chứng minh bằng DOM sau hydrate chứ không phải mã HTTP; kèm dòng `public` của template Gatsby nuốt `frontend/public/` của Next, quarantine bảng chết bằng `SET SCHEMA`, và tràn ngang thật 11px đúng tại breakpoint 768px.
tags: [backend, postgresql, react, agent, automation, debug]
created: 2026-08-27
updated: 2026-08-27
source: project `ticket-mcrsv` — session history 2026-08-27 (3 session: looptasksv2 backend 142–150, dọn service chưa dùng, đợt frontend F1–F14)
---

# ticket-mcrsv — digest 2026-08-27

CHỈ phần mới so với [[digest-ticket-mcrsv-2026-08-26]], [[digest-ticket-mcrsv-2026-08-25]]
(bảng trùng tên `public.tickets` vs `tickets.tickets`) và [[digest-ticket-mcrsv-2026-08-22]]
(gate tự viết là nguồn xanh giả).

## Bugs

### Bypass auth cho dev: chặn được middleware vẫn chưa vào được trang

Dựng cơ chế bypass để tự nhìn màn admin/org, hai lớp khoá để không lọt production. `curl` trả
**200** nhưng trình duyệt vẫn ra trang login — vì `(admin)` và `(org)` còn một **`RoleGuard` phía
client** chuyển hướng *sau khi hydrate*. Middleware là lớp server, guard là lớp client; bịt một
lớp không mở được đường.

Hệ quả về phép đo: mọi số viewport tôi đo trước đó là **đo trang login**, không phải trang admin.
Bằng chứng đúng phải là **nội dung DOM sau hydrate**, không phải mã HTTP. Đây đúng họ với
[[ack-khong-phai-hieu-ung]].

### `.gitignore` của template Node nuốt `frontend/public/`

Lane không commit được ảnh; truy ra `.gitignore:92` là dòng `public` thuộc khối **Gatsby** của
template Node chung. Repo không dùng Gatsby và không có thư mục `public` nào khác trên đĩa — dòng
đó không bảo vệ gì, chỉ gài mìn. Sửa cho đúng phạm vi thay vì `git add -f` từng lần.

### Tràn ngang thật 11px tại đúng 768px

Công cụ đo viewport (F14) tìm ra tràn **11px trên `/` và `/events` tại đúng 768px** — ở 760 và 800
đều sạch. Lỗi biên breakpoint `md:`, không ai kiểm vì không ai test đúng con số đó. Xác nhận độc
lập bằng phương pháp khác trước khi tin.

### Ảo ảnh 390px tái phát, và lần này đã có cách đo đúng

Chụp headless ở `--window-size=390,844` cho ảnh **trông như tràn** ở 4 trang liên tiếp; tôi đã giao
hai lane đi sửa một thứ không hỏng rồi phải gọi cả hai dừng. `scrollWidth == clientWidth == 375`
— không hề tràn. Cách đo tin được là **iframe rộng đúng 375px** rồi đọc bounding box bên trong.
Đã khái quát ở [[do-be-ngang-headless-chrome]]; đây là lần vấp thứ hai của cùng một cái thước.

## Techniques

### Quarantine bảng chết bằng `SET SCHEMA`, không drop và không rename

Tôi đưa hai lựa chọn (drop hoặc rename), lane chọn cách thứ ba: chuyển 22 bảng chết sang schema
`public_dead_20260825` bằng `SET SCHEMA`. Lùi lại được, không mất dữ liệu, và tách sạch khỏi
`search_path` của service. Nó cũng tìm ra **4 bảng `public` hợp lệ** mà email-worker thật sự dùng
(22 chuyển + 4 giữ = 26, khớp DB) — và bắt được một lỗi đếm của tôi.

Kèm hai bug đang sống: `migrate-user` và `migrate-checkin` cũng thiếu `PGOPTIONS: "-c
search_path=..."` như `migrate-ticket` từng thiếu.

### Công cụ đo phải phân biệt "không tràn" với "không đo được"

Bản sửa của công cụ viewport không chỉ vá timeout mà thêm một **bất biến đếm**:

```
MEASUREMENT INVARIANT: FAIL measured=0 expected=12
OVERFLOW CHECK: **ERROR** (incomplete measurements)
```

Trước đó nó exit 0, không một dòng output, không PNG khi Chrome segfault — cắm vào CI thì xanh mà
không đo gì. Cùng cơ chế với [[gate-tu-viet-la-nguon-xanh-gia]], lần này là công cụ *sinh ra để
diệt bằng chứng giả* lại tự sinh bằng chứng giả.

## Context

- **Quyền migration được cấp**: dự án chưa lên prod nên được xoá và viết lại toàn bộ migration,
  không cần giữ lịch sử theo tiến độ. Tôi ghi kèm ba giới hạn vào `BRIEF.md` thay vì để nó nằm
  trong hội thoại — hội thoại không sống qua session sau ([[brief-state-agent-loop]]).
- **Swap là biến quyết định lịch trình**: swap 92–97% suốt phiên, và đó là ngưỡng đã giết Colima
  hai lần. Nó quyết định *task nào được nhặt* (hoãn mọi task cần k3d/JVM), không phải chỉ là ghi
  chú môi trường. Nối tiếp [[digest-ticket-mcrsv-2026-08-18]].
- **13+ task đóng qua looptasksv2 backend** (142–150 chuỗi check-in, 126–141 chuỗi email/config),
  mỗi task đều có bước "tự bắn lại trên đường thật qua gateway" sau merge. Vài verdict đáng giữ:
  T149 lane **từ chối** hai lối tắt (sửa file ngoài allowlist, thêm bypass test-only làm yếu
  fail-closed); T139 phải tới **vòng 3** mới PASS và cả hai lần FAIL đều đúng.
- Message gửi vào TUI lane nằm im trong ô prompt (Enter chưa submit) **hai lần nữa** trong phiên —
  dấu hiệu là *không có spinner* và `Worked for Xm` là tóm tắt turn cũ. Xem
  [[gui-viec-cho-lane-khong-co-ack]].
- Đợt frontend F1–F14 đóng 10+ task; hướng thị giác và bộ gate chống AI slop ghi riêng ở
  [[2026-08-27-he-thi-giac-chong-ai-slop]], hai luật code UI ở
  [[feedback-ui-component-300-dong-atomic]], và bài học gate hợp nhất ở
  [[gate-hop-nhat-truoc-khi-merge]].
- Quyết định dọn service chưa dùng của phiên trước: [[2026-08-24-cleanup-service-chua-dung-ticket-mcrsv]]
  (và luật đi kèm [[feedback-khong-dung-vs-chua-lam-toi]]); cấu trúc doc theo vòng đời:
  [[2026-08-22-cau-truc-doc-theo-vong-doi]].
