---
type: note
title: Digest aws — 2026-09-14 (course Game Server chạy hết 42 bài, và các lỗi chỉ lộ khi soát chéo giữa các bài)
summary: Chương 3–10 của course gameserver viết bằng subagent song song rồi main agent tính lại từng số — loại lỗi đắt nhất không phải phép tính sai mà là hệ số bịa cho bài chưa đọc, nhãn lệch giữa các bài, và hai vế của cùng một câu không khớp nhau; kèm hai đòn bẩy thật là trần KB trong brief và chia đợt để đợt sau đọc được đợt trước.
tags: [aws, learning, agent, method, tooling]
created: 2026-09-14
updated: 2026-09-14
source: project `aws` — session history (session 092f4c54 chương 3–10 course `gameserver`; session 750568b1 course system-design)
---

# Digest — `aws`, 2026-09-14

Chương 1–2 đã ghi ở [[digest-aws-2026-09-09]]. Note này **CHỈ phần mới**: chương 3 → 10 (đóng course
42 bài) và một course thứ hai mở ra ở session khác.

## Bugs — loại lỗi mà gate và verify-từng-số đều không bắt

**Hệ số bịa cho bài chưa đọc.** Các agent viết song song không thấy nhau, nên khi cần trích số của
một bài khác chúng **tự đặt**. Ba ca thật:

| Bài | Trích | Số đo thật của bài nguồn |
|---|---|---|
| gs-26 | quantization `10×` (100 B → 10 B) | bài 24 đo **13 B**, tỉ số **8,67×** |
| gs-27 | quantization `×4`, AOI `×2,5` | cả hai đều sai so với số đo |
| gs-34 vs 26 | 0,72 ns/phép (đo) vs 5 ns/phép (ước lượng) | phải hoà giải, ghi rõ cái nào là ước lượng |

Chữa được vì main agent verify từng bài và bắt lúc soát chéo. **Không gate nào bắt được** — SVG hợp
lệ, id không trùng, `tsc` sạch, `next build` xanh.

**Hai vế của cùng một câu không khớp nhau (gs-41).** Bài viết `35,4 MB/s = 297,1 Mbps`, mà
`35,4 × 8 = 283,2`. Đây là lỗi khó thấy nhất vì *không phép tính nào sai* — chỉ là hai con số đúng
đặt cạnh nhau bằng dấu bằng.

**Số đúng nhưng gán nhầm chỗ (gs-22).** Câu "Chênh đúng **19 lần**" nằm ngay dưới một bảng có cột
`90` và `630` bước sim/giây — `630/90 = 7,0`. Con số 19 chỉ đúng cho phần việc rollback, không đúng
cho cột đang in ngay trên nó.

**Nhãn lệch giữa các bài cùng chương.** gs-09/gs-10 dùng mức `A/B/C`, gs-11 dùng `(a)/(b)/(c)` cho
cùng một thang. Phải chuẩn hoá trước khi commit chương.

**Xung đột số không phải lúc nào cũng là lỗi.** gs-10 báo FMA lệch `13,96%` (1 triệu mẫu `[0,1)`),
gs-11 báo `19,92%` (200.000 mẫu `[-1,1]`). Đo độc lập ra `11,65%` cho `[0,1)` và `21,0%` cho `[-1,1]`
→ **cả hai đều đúng**, chỉ khác phân phối đầu vào. Bài học: trước khi "hoà giải" phải đọc điều kiện
đo, không chỉ đọc con số.

Một chi tiết của phép đo đó đáng giữ: test FMA đầu tiên của tôi cho ra 0% vì **compiler gộp FMA ở cả
hàm đối chứng** (`disasm` cho thấy cả hai đều là `FMADDD`) — phải ép làm tròn trung gian mới đo được.

## Techniques

**Agent bác lại brief bằng số đo — năm lần, và cả năm lần agent đúng.** gs-15 (mô hình
Gilbert–Elliott), gs-37 (GC pause theo heap sống), gs-39 (bảng chi phí CCU tôi ghi nhầm ở bài 16),
gs-17 (dấu của cột sai số ước lượng), gs-24 (`1166/10 = 116` đúng, làm tròn 117 mới sai). Cách xử
đúng mỗi lần là **tự đo lại**, không tin cả hai bên: mô phỏng độc lập của tôi tái tạo gần đúng số
của gs-15 (93,82 vs 93,72 · 92,60 vs 92,56) ⇒ chỉ dẫn của tôi sai.

**Trần KB trong brief có tác dụng đo được, và không mất nội dung.** Chương 3 ra 28–33 KB; siết trần
30 KB thì chương 4 về **22–24 KB**. Hai bài chương 3 vượt trần **không cắt hồi tố** — nội dung của
chúng phần lớn là output Go chạy thật.

**Chia đợt khi các bài phụ thuộc nhau.** Chương 5 (nặng nhất) chia 2 đợt: đợt 2 **đọc được** file
của đợt 1 trên đĩa nên không phải đoán hệ số. Đây là cách rẻ nhất để triệt chính cái lỗi "bịa hệ số"
ở trên. Chương 10 (capstone, phải viết code chạy được) cũng chia đôi vì lý do tương tự.

**Trả nợ con số xuyên course.** Con số "10 byte/entity" được cố ý để nợ từ chương 1, ba bài
(gs-03, gs-08, gs-15) trỏ tới, và bài 24 trả bằng số đo thật (13 B). Đây là thứ chỉ làm được nếu có
lộ trình viết trước, không phải viết tới đâu hay tới đó.

**Agent tự khai chỗ yếu là tín hiệu tốt, không phải cớ để bỏ qua.** Nhiều agent tự nêu "chỗ này tôi
chưa đọc bài kia", "số này phụ thuộc mô hình jitter", "đây là ước lượng chưa gắn nhãn" — mỗi lần như
vậy đều lộ ra một việc thật phải vá. Ngược lại, có lần agent tự báo mâu thuẫn mà kiểm ra **không có
mâu thuẫn** (gs-20: tôi kiểm nhầm hàng 150 ms trong khi bài ghi 200 ms) — nên vẫn phải tự kiểm.

Khái quát ra khỏi repo này: [[soat-cheo-noi-dung-sinh-song-song]].

## Context

- Course `gameserver`: **42 bài / 10 chương**, commit theo từng chương trên nhánh
  `feat/gameserver-course` rồi lên `main` (`6df4c3d` → `3ce8105` → `016412e` → `cb8dfb9` →
  `faaa551` → `75428bb` → `37588f6` → `577184a` → `87e5012`).
- Brief dùng chung sống ở `tmp/` (đã gitignore) chứ không ở scratchpad — scratchpad bị dọn giữa loop
  dài và brief biến mất một lần.
- Session `750568b1` mở **course thứ hai — system-design**, bám sách Alex Xu Vol 1+2 qua repo public
  `liquidslr/system-design-notes`: 22 bài `sd-09` → `sd-30`, 4 chương mới, cũng giao subagent theo
  batch. Chương 5 đã lên `main` (`sd-09` consistent hashing 47 KB, `sd-12` rate limiter 53 KB…);
  `sd-14` notification 84 KB dài hơn mặt bằng nhưng giữ nguyên vì không thừa.

Liên quan: [[viet-tai-lieu-day-duoc]] · [[bang-chung-phan-biet-duoc]] · [[cham-viec-agent-nen]] ·
[[digest-aws-2026-09-09]] · [[aws]]
