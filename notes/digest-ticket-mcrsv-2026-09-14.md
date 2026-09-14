---
type: note
title: Digest ticket-mcrsv — 2026-09-14 (research trước khi viết plan V3 bác bỏ hai tiền đề của spec)
summary: Spec V3 viết 2026-09-07 giả định trang bán vé có chọn ghế và cần đụng backend; đọc code thật thì luồng đặt vé chạy theo `ticketTypes` + số lượng (không chọn ghế), backend đã có ghế thật với id, và `getEventHandler` là passthrough nên `canvasConfig` tới được trang công khai — V3 không cần backend.
tags: [agent, method, react, project]
created: 2026-09-14
updated: 2026-09-14
source: project `ticket-mcrsv` — session history 2026-09-13/14 (đóng F48, viết plan V3, dispatch F50/F51)
---

# Digest — `ticket-mcrsv`, 2026-09-14

V2 venue 3D (F39–F49) đã ghi ở [[digest-ticket-mcrsv-2026-09-10]] và
[[digest-ticket-mcrsv-2026-09-11]]. Note này **CHỈ phần mới**: vòng viết plan V3.

## Techniques — research trước khi viết plan đã cứu cả plan

Spec V3 viết **2026-09-07**, plan viết **2026-09-13** — cách nhau 6 ngày, và trong khoảng đó hai
tiền đề của spec đã chết. Phát hiện bằng cách đọc code trang bán vé trước khi viết, không bằng cách
bám spec:

| Spec V3 giả định | Code thật |
|---|---|
| Trang bán vé có chọn ghế → toggle 3D gắn vào luồng chọn ghế | Luồng đặt vé chạy theo `ticketTypes` + **số lượng**, **không có chọn ghế** |
| V3 phải đụng backend để đưa dữ liệu `threeD` ra trang công khai | `getEventHandler` là **passthrough thuần** ⇒ `canvasConfig` đã tới được trang công khai; V3 **không đụng backend** |

Bổ sung: backend **có ghế thật** (id, `seat_number`, reserve/release) — frontend mới chỉ dùng tới
`seatCount`. Ba hướng xử lý ra ba khối lượng việc rất khác nhau, nên dừng lại hỏi dantt trước khi
viết thay vì chọn hộ.

Bài học chung: **spec là ảnh chụp tại thời điểm viết**. Với plan sinh ra sau spec vài ngày và sau
vài chục commit, bước đầu tiên không phải "bám khuôn plan cũ" mà là **đo lại tiền đề của spec**.
Cùng họ với luật đã chốt cho V2: tiêu chí nghiệm thu phải trả lời được "đo bằng cách nào, máy này đo
được không".

## Context

- Plan V3 đã push `a05c627`; F50 + F51 chạy nền song song (cả hai xác nhận `node_modules` đã có và
  base commit đúng trước khi coi là "đang chạy" — đúng bước đã thiếu và gây báo cáo sai ở lượt trước).
- Seed giá heat-map đổi sang **500k / 1tr / 1,5tr / 2tr / 2,5tr** — cách đều bước 500k, ra đủ 5 bậc
  màu. Bộ seed cũ phân bố lệch nên `700k` và `350k` rơi cùng bậc, làm tiêu chí "5 giá ⇒ 5 màu" **bất
  khả thi về toán học** (đã ghi ở [[digest-ticket-mcrsv-2026-09-11]]).

Liên quan: [[moc-ticket-mcrsv]] · [[digest-ticket-mcrsv-2026-09-11]] · [[bang-chung-phan-biet-duoc]] ·
[[2026-09-04-venue-2d-dung-3d-xem]] · [[feedback-audit-code-doc-tu-nhanh-prod]] ·
[[feedback-hoi-be-mat-truoc-khi-audit]] · [[brief-state-agent-loop]]
