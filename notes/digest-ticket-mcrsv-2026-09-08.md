---
type: note
title: Digest ticket-mcrsv — 2026-09-08 (đợt venue 3D + vận hành Orca/codex)
summary: Waiter của Orca chết ở phía process nhưng đăng ký phía Orca còn sống ~15 phút nên mọi lần arm lại đều `waiter_exists` mà chẳng ai đánh thức; codex nuốt prompt ba lần vì modal update bản mới bật lên; cảnh 3D dẹt vì đơn vị chiều cao lệch hai bậc so với mặt sàn — chỉ lộ ra khi NHÌN ảnh; và một FAIL đáng giá là bản vá đúng nhưng test hồi quy không canh cơ chế hỏng.
tags: [agent, tooling, automation, debug]
created: 2026-09-08
updated: 2026-09-08
source: project `ticket-mcrsv` — session history (F24–F37, H75, mock gateway, đợt venue 3D)
---

CHỈ phần mới so với [[digest-ticket-mcrsv-2026-09-04]]. Bản đồ chủ đề: [[moc-ticket-mcrsv]].

## Bugs

**Cảnh 3D "dẹt như tờ giấy" là lỗi đơn vị, không phải lỗi render.** Mặt sàn **900 × 550 đơn vị**, còn
khối zone cao `0.6–1.4 × HEIGHT_SCALE(12)` = **7–17 đơn vị** — lệch gần hai bậc, nên zone chỉ còn là
mấy đường gờ mờ. Điều đáng nhớ hơn cả con số: gate xanh, verifier PASS, dữ liệu đúng — **nó chỉ lộ ra
khi mở ảnh chụp ra nhìn**. Với task mà tiêu chí nghiệm thu là thị giác thì ảnh là bằng chứng, không
phải phụ lục. → [[phep-kiem-quan-sat-sai-tang]].

**Frontend 500 vì Next cache lại một lần fetch font hỏng.** `fonts.gstatic.com` timeout ở lần compile
đầu; `curl` và `node fetch` từ shell đều 200 trong 0.18s, nhưng dev server vẫn hỏng cho tới khi xoá
`.next`. Trước khi đi truy proxy/mạng thì loại trừ cache của chính build tool.

**Script cắt task done ra khỏi BRIEF nuốt mất một tiêu đề.** Khối task kết thúc ở `## ` nhưng
**không** ở `### `, nên `### Đợt 5 — venue 3D` nằm giữa hai task bị cuốn theo sang file done. Dry-run
"đúng" không phát hiện vì nó cũng chạy chính logic đó; thứ bắt được là bước kiểm toàn vẹn sau khi ghi
(không mất task, không trùng task, header còn đủ). → [[brief-state-agent-loop]].

## Techniques / vận hành agent

**Waiter chết ở phía process nhưng đăng ký phía Orca vẫn còn (~15 phút).** Hệ quả: mọi lần arm lại đều
bị `waiter_exists`, mà cũng chẳng có ai đánh thức mình — kẹt im lặng ở cả hai đầu. Lối ra là **chuyển
sang poll** thay vì `--wait` cho tới khi đăng ký cũ hết hạn.

**Heartbeat của worker cắt ngang lệnh chờ.** Một tin `phase: investigating` làm `--wait` trả về sớm và
waiter chết, dù worker vẫn chạy bình thường. Phải bọc vòng lặp quanh lệnh chờ để tin không-phải-kết-quả
không kết thúc phiên chờ. Cùng họ với [[cham-viec-agent-nen]].

**Codex nuốt prompt ba lần liên tiếp vì modal update.** Version nhích liên tục
(`0.153.0 → .2 → .4`) trong khi tôi mới dismiss bản trước, nên mỗi lần dispatch lại gặp modal mới ăn
mất prompt — dấu bracketed-paste còn nguyên trên màn hình. Cách xử: **dismiss update ngay trước mỗi lần
dispatch**, và không retry mù mà đọc màn hình trước. → [[gui-viec-cho-lane-khong-co-ack]].

**Một FAIL đáng giá: bản vá đúng nhưng test hồi quy vô dụng.** Verifier tự chứng minh `PUT` trả 200 và
ghi đúng giá trị, quét đủ lớp bệnh — rồi vẫn trả FAIL vì test không canh **cơ chế hỏng thật**. Vòng
sửa dùng `sqlmock.QueryMatcherFunc` kiểm SQL **sau bước compile named parameter của `sqlx`** và từ chối
mọi dấu `:` còn sót. Verdict PASS/FAIL phải đọc theo từng kết luận, và "vá đúng" không kéo theo
"test đúng".

**Worker báo `failed` theo đúng chữ của tiêu chí, và tiêu chí là của tôi.** Bundle 2D tăng 1.400 byte
(467.669 → 469.069) trong khi three/R3F không nằm trong entry — worker đo, thấy vi phạm, và **không tự
diễn giải thành pass**. Đó là hành vi đúng; chỗ sai là tiêu chí viết quá tuyệt đối. Khi viết
done-criteria phải nói rõ dung sai và cái gì mới thật sự là điều muốn chặn.

## Context

- `H75` chốt sửa thật thay vì tắt rule: frontend **không có hạ tầng test nào** (chỉ `dev`/`build`/
  `start`/`lint`), nên bằng chứng hành vi phải đi qua trình duyệt thật (CDP), không phải unit test; sau
  khi đóng, gate lint đổi từ "không tăng so với 2" thành **exit 0**.
- Đợt venue 3D chạy theo [[2026-09-04-venue-2d-dung-3d-xem]]; `bun test` được chọn làm test runner cho
  frontend vì chạy TS trực tiếp, 0 dependency.
- Housekeeping: `BRIEF.md` 417KB → 94KB, `BRIEF-FRONTEND.md` 67KB → 30KB.
