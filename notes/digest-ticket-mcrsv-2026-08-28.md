---
type: note
title: Digest ticket-mcrsv 2026-08-28 — QR đoán được, gate tự khai số phép đo, Chrome chết lây
summary: Mã QR suy ra từ chính ticket_id nên gõ tay là qua được check-in; một gate đo layout chỉ đáng tin khi nó tự khai "đo được mấy phép" và FAIL khi bằng 0; và nhiều lane cùng lái Chrome qua CDP làm chết luôn Chrome của user.
tags: [backend, postgresql, agent, debug]
created: 2026-08-28
updated: 2026-08-28
source: project `ticket-mcrsv` — session history 2026-08-28 (6 session, BRIEF.md + BRIEF-FRONTEND.md)
---

Nối tiếp [[digest-ticket-mcrsv-2026-08-27]] · [[digest-ticket-mcrsv-2026-08-25]] ·
[[digest-ticket-mcrsv-2026-08-26]]. Chỉ phần mới.

## Bugs

**Mã QR của vé suy ra từ chính `ticket_id`** (`TICKET:<ticketId>`) — tức đoán được, và tôi đã tự
gõ tay một chuỗi như vậy rồi **qua được** check-in ở task trước. Thay bằng token ngẫu nhiên
`TICKET:<64 hex>` từ 32 byte `crypto/rand` + migration backfill; sau đó bắn lại **đúng chuỗi đoán
được cũ** để chứng minh nó bị từ chối còn QR thật đọc từ DB thì đi tiếp. Đây là cách đóng việc
đúng: tái sử dụng chính input đã khai thác được, không dựng ca giả.

**Điều kiện xét ở mức tổng hợp cả batch làm hỏng ca hỗn hợp.** Đường phát hành vé đếm gộp
`live + terminal == expected` nên một session có ghế đã refund (terminal) cộng một vé mới (live)
rơi nhầm vào nhánh terminal → rollback. Sửa gốc: trả **trạng thái từng key**
(`GetIssuedReservationKeyStatesTx`) thay vì đếm gộp. Kết quả nghiệp vụ chứng minh được bằng thực
nghiệm: **ghế đã refund bán lại được cho session khác**.

**Migration `migrate-user` và `migrate-checkin` thiếu `PGOPTIONS: -c search_path=<schema>`** —
cùng lỗi đã được vá cho `migrate-ticket`, nhưng chỉ vá một chỗ. `public` tích được **26 bảng rác**
trong khi mỗi schema service chỉ 2–9. Quét hết chỗ dùng cùng pattern, đừng vá chỗ được chỉ.

## Techniques

**Gate đo layout phải tự khai số phép đo.** Công cụ `check-overflow.sh` sinh ra để diệt bằng chứng
giả lại **tự sinh bằng chứng giả**: Chrome segfault ⇒ exit 0, không một dòng output, không PNG —
cắm vào CI là xanh vĩnh viễn mà không đo gì. Bản sửa in bất biến đếm
`MEASUREMENT INVARIANT: FAIL measured=0 expected=12` và trả exit 1, phân biệt rõ *"không đo được"*
với *"đo xong và sạch"*. Cụ thể hoá [[gate-tu-viet-la-nguon-xanh-gia]].

**Bảng đo trên dữ liệu rỗng không chứng minh được gì.** Lane khai "không route nào tràn" nhưng đo
trên một event draft **không zone không fixture**; verifier bắt đúng chỗ đó, vòng 2 đo lại với 4
zone tên dài + 1 fixture, 12 phép thay vì 4. Cùng họ [[bang-chung-phan-biet-duoc]].

**Quarantine bảng chết bằng `SET SCHEMA public_dead_<date>`** thay vì drop hay rename — lùi được,
và lộ ra 4 bảng `public` **hợp lệ** mà email-worker đang dùng thật.

## Context / gotcha

- **Nhiều tiến trình lái Chrome qua CDP song song làm chết luôn Chrome của user** (crash report
  ghi `parentProcess`). Lane F23 và verifier F22 cùng mở Chrome để đo `elementFromPoint`/
  `scrollWidth`. Không phải máy hỏng — phải chặn ở cả hai chỗ đang chạy.
- **`tsc` đỏ vì rác build**: `.next/dev/types/validator.ts` còn type sinh cho một route tạm đã xoá.
  Xoá `.next` là sạch — không phải hồi quy của task.
- **Verifier chạy `git checkout --` lần thứ ba** dù đã bị cấm tường minh trong brief, lại xoá việc
  chưa commit của lane rồi tự vá lại. Lời cấm trong prompt không phải rào chắn; cách duy nhất chắc
  là **tự chụp snapshot cây làm việc trước khi verify rồi so byte-for-byte** sau đó — cùng kết luận
  với [[chan-agent-bang-cau-hinh]].
- dantt cấp quyền lâu dài cho repo này: **được xoá và viết lại toàn bộ migration, không cần giữ
  lịch sử** vì chưa lên production — đã ghi vào `BRIEF.md` kèm giới hạn, không để nằm trong hội thoại.
- Verifier FAIL hai vòng liên tiếp là blocker, không tự cho vòng ba — vòng 3 của task 139 chỉ chạy
  sau khi hỏi, và cách hiệu quả là đưa sẵn **bảng 5 ca để lane tự đối chiếu** thay vì bảo nó bỏ
  mệnh đề sai.
- Số test lệch giữa lane (133) và verifier (131) là **khác đơn vị đếm** (hàm `func Test` top-level
  vs sub-test), không phải mất test. Kiểm trước khi coi là hồi quy.

## Liên quan

[[gate-tu-viet-la-nguon-xanh-gia]] · [[bang-chung-phan-biet-duoc]] · [[chan-agent-bang-cau-hinh]] ·
[[cham-viec-agent-nen]] · [[brief-state-agent-loop]] · [[2026-08-22-cau-truc-doc-theo-vong-doi]]
