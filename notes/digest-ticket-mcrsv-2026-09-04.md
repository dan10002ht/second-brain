---
type: note
title: Digest ticket-mcrsv — 2026-09-04
summary: Dấu `:` của `::timestamptz` bị `sqlx` nuốt thành named parameter nên query hỏng, và test hồi quy đầu tiên không canh được cơ chế đó; field thiếu trong request message của proto làm service không bao giờ nhận được giá trị dù client gửi; và mock gateway cho phép chạy frontend khi máy không đủ chỗ cho cả backend.
tags: [backend, postgresql, debug, agent, tooling]
created: 2026-09-04
updated: 2026-09-04
source: project `ticket-mcrsv` — session history 2026-09-02→09-04 (F24–F30, H75, mock gateway, `/lt-orca`)
---

CHỈ phần mới so với [[digest-ticket-mcrsv-2026-08-31]] và [[digest-ticket-mcrsv-2026-09-01]].
Bản đồ chủ đề: [[moc-ticket-mcrsv]].

## Bugs

**`::timestamptz` trong named query của `sqlx` là một lỗi cú pháp chờ nổ.** `sqlx` compile named
parameter (`:name`) trước khi gửi xuống driver, nên dấu `:` của cast kiểu Postgres bị nó ăn mất.
Dạng an toàn là `CAST(... AS timestamptz)`. Quét cả 7 service chỉ còn **một** chỗ
(`event_pricing_repository.go:49`) — `event_repository.go` đã dùng dạng an toàn từ trước.

Phần đáng giữ hơn cả bản vá: **test hồi quy vòng 1 vô dụng** vì nó so chuỗi SQL *trước* bước
compile của `sqlx` — tức nó xanh kể cả khi bug còn nguyên. Vòng 2 dùng `sqlmock.QueryMatcherFunc`
kiểm SQL **sau** bước compile và từ chối mọi dấu `:` còn sót, tức canh đúng cơ chế hỏng thật.
Cùng họ với [[fixture-khong-phai-hop-dong-du-lieu]]: test chạy qua không có nghĩa là test canh
đúng thứ nó nói.

**Field không có trong request message thì client gửi bao nhiêu cũng vô nghĩa.**
`CreateZoneRequest` / `UpdateZoneRequest` trong `event.proto` **không hề có** `seat_count` — chỉ
`EventSeatingZone` và `ZoneLayoutUpdate` có. Nên service không bao giờ nhận được giá trị, và
triệu chứng ("`seat_count` rơi mất") trông y hệt lỗi ghi DB. Thêm field ở số `7` (còn trống ở cả
hai message — không tái sử dụng số cũ). Gateway nạp proto **lúc khởi động** nên sau khi sửa phải
chạm một file để `nodemon` tự restart; nó không tự biết field mới.

**Một lớp bệnh, không phải một call site.** F29 giao sửa một repository, worker quét ra ba nhóm
controller khác cùng bệnh (seat, pricing, availability) và sửa luôn — đúng hướng. Mỗi task lại đẻ
ra task kế tiếp vì cùng một lý do, nên brief nên đòi **quét lớp bệnh** ngay từ đầu.

**`.next/dev/types` của một route đã xoá làm `tsc` đỏ giả.** Route tạm `tmp-m` bị xoá nhưng type
sinh sẵn vẫn nằm trong `.next/dev/` (artifact gitignore). Xoá `.next` là sạch — không phải hồi quy
của task đang làm.

**Next cache lại lần fetch font hỏng đầu tiên.** Frontend trả 500 vì Next timeout khi tải Manrope
từ `fonts.gstatic.com`, trong khi `curl` và `node fetch` đều 200 trong 0,18s. Không phải lỗi mock,
không phải mạng — xoá `.next` rồi chạy lại là hết.

**`use-countdown` render stale (H75).** Đây là đồng hồ đếm ngược lúc khách đang thanh toán
(`use-countdown` → `reservation-timer` → `payment-step`), nên sai là sai đúng chỗ đắt nhất. Sửa
theo khuôn React chính thức (điều chỉnh state trong render khi prop đổi). Frontend **không có hạ
tầng test nào** (chỉ `dev`/`build`/`start`/`lint`), nên bằng chứng hành vi phải đo qua trình duyệt
thật bằng CDP. Sau khi đóng, lint về `0 problem` ⇒ tiêu chí gate đổi từ *"không tăng so với 2"*
thành **exit 0**.

## Techniques

**Mock gateway để chạy frontend khi máy không còn chỗ.** 9 container + 6 service ăn hết tài nguyên
(còn ~33% free). Hợp đồng FE đủ hẹp để mock: `NEXT_PUBLIC_API_URL` (mặc định `:53000/api/v1`),
envelope `{data, meta}`, lỗi `{error:{code,message}}`, refresh token tự động. Một mock gateway 72
route + contract checker cho phép tắt sạch Docker và toàn bộ backend mà vẫn xem được 28 trang.
Điểm mấu chốt khi verify: contract checker do **chính worker viết ra**, nên verifier phải chứng
minh nó **đỏ được** (bỏ `id` khỏi fixture) trước khi tin — xem [[gate-tu-viet-la-nguon-xanh-gia]].

**Worker tự dựng stack riêng thay vì tranh process dùng chung.** Với F28, worker dựng gateway
`:54000` + event-service `:55053` của riêng nó để bắn thật — sạch hơn cách main agent đi gỡ
process đang chạy, và không dính rào sandbox cấm `kill` tiến trình của session khác.

**Orca (`/lt-orca`) — waiter là một hàng đợi, không phải một cái đồng hồ.** Mỗi Run chỉ có **một**
waiter; tin cũ chưa ack thì lần chờ kế tiếp **trả về ngay** với đúng tin đó. Phải ack rồi mới chờ
tiếp, nếu không sẽ tưởng worker vừa xong trong khi nó chưa chạy. Cùng họ với
[[cham-viec-agent-nen]].

**Codex nuốt prompt vì modal update, không phải vì TUI chậm.** Bản `0.153.2` vừa ra trong khi
`0.153.0` mới bị dismiss buổi sáng ⇒ modal update bật lên nuốt paste. Triệu chứng nhận ra được:
dấu bracketed-paste còn nguyên trong terminal, không có spinner. Đừng retry mù — đọc terminal
trước. Liên quan: [[gui-viec-cho-lane-khong-co-ack]].

## Context

- `BRIEF-FRONTEND.md` đóng hết `F24`–`F30` cộng `H75`; `F25` gỡ hẳn fallback Chrome full-GUI (nguồn
  đã giết Chrome của user ở [[digest-ticket-mcrsv-2026-08-28]]) và thay bằng glob cache tìm
  `chrome-headless-shell`.
- Hướng venue designer sang 2D + 3D — xem [[2026-09-04-venue-2d-dung-3d-xem]].
- Vai của hai họ model đã được chốt: [[feedback-claude-dieu-phoi-codex-implement]].
