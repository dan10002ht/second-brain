---
type: resource
title: Viết tài liệu dạy được — thứ tự nhân quả, và số là hợp đồng
summary: Một bài viết đúng và đủ vẫn không dạy được nếu nó đi "khái niệm → hệ quả"; và mọi con số trong văn xuôi là một claim không có gate nào đỏ được — chỉ tính lại/chạy lại mới kiểm được.
tags: [writing, learning, method, agent]
created: 2026-09-13
updated: 2026-09-13
source: [[digest-game-server-2026-09-07]] · [[digest-game-server-2026-09-08]] · [[digest-game-server-2026-09-09]] · [[digest-aws-2026-09-09]]
---

# Viết tài liệu dạy được

Áp cho mọi thứ viết ra để người khác (hoặc mình sau này) đọc mà hiểu: lesson trong repo học tập,
guide cho team ([[ai-eng-guide]]), runbook, và cả note trong brain này.

## 1. Đủ nội dung ≠ dạy được

Triệu chứng: đọc xong biết thêm định nghĩa, nhưng **không đổi được cách nghĩ**. Đó là
*tài liệu tham khảo giả dạng bài học*.

Chẩn đoán không nằm ở lượng chữ mà ở **thứ tự nhân quả**. Bài không dạy được đi theo
"khái niệm → hệ quả": bắt người đọc **tin trước, hiểu sau**. Bài dạy được đảo lại — đặt tình
huống hỏng trước, để người đọc tự thấy vì sao cần khái niệm, rồi mới đặt tên cho nó.

Thay đổi lớn nhất khi viết lại `lessons/01` không phải thêm nội dung mà là đảo thứ tự này
([[digest-game-server-2026-09-08]]). Nếu định "thêm ví dụ cho dễ hiểu" mà thứ tự vẫn cũ thì chỉ
làm bài dài hơn.

## 2. Số trong bài là hợp đồng — và không gate nào đỏ được

Code sai thì test đỏ. **Văn xuôi không chạy**, nên một con số sai nằm trong tài liệu nhiều ngày
mà mọi gate vẫn xanh:

| Ca | Gate lúc đó | Sai gì |
|----|-------------|--------|
| `8,2cm / 4,9m = 0,17%` | SVG hợp lệ, id không trùng, `tsc` sạch, `next build` xanh | sai **10 lần**, đúng là `1,67%` |
| "scheduler naive → world chậm 5%, sau 10 phút lệch 30 giây" | không có gate nào | sai hẳn bản chất: accumulator nạp thời gian thật nên sim step vẫn đủ |
| `dropped 132` trong lesson | không có gate nào | số lạc từ một lần chạy khác; đúng là 13 theo `floor(stall/dt) − MaxCatchUp` |

Cả ba chỉ bị bắt bằng **tính lại / chạy lại code thật**, không bằng đọc lại. Quy tắc rút ra:

- Mỗi con số trong bài phải **tái tạo được**: hoặc ghi kèm lệnh sinh ra nó, hoặc ghi rõ là ước lượng.
- Số đo phải nói rõ **lần chạy nào** — một số lạc từ run khác trông y hệt số đúng.
- Một claim định tính kèm số ("chậm 5%") phải kiểm cả **cơ chế**, không chỉ độ lớn: ở ca scheduler
  naive, thứ thật sự mất là độ phân giải input và drift *tăng theo tải*, không phải tốc độ world.

Liên quan: [[bang-chung-phan-biet-duoc]] (gate xanh không nói gì về thứ gate không quan sát) ·
[[phep-kiem-quan-sat-sai-tang]].

## 3. Khi giao nhiều agent viết song song

Cách đã chạy được ([[digest-aws-2026-09-09]]): subagent viết bài, **main agent tự tính lại từng số**
trước khi commit. Lý do giao subagent là giữ context của main session sạch, nên phần main giữ lại
phải là phần *kiểm*, không phải phần *viết*.

- **Brief dùng chung quyết định có slop hay không.** Một brief ~10 KB viết một lần rồi giao cho cả
  nhóm: template cố định, cấm emoji trang trí và câu sáo, sơ đồ ASCII/SVG, quy ước dấu thập phân,
  chỗ không chắc phải ghi rõ là ước lượng.
- **Brief là giả thuyết, phép đo mới là nguồn.** Agent phát hiện một con số trong brief không tái
  tạo được và thay bằng số nó tự đo (có chú thích) — đó là hành vi đúng, không phải đi chệch.
- **Soát chéo giữa các bài viết song song là bước bắt buộc**: chúng không thấy nhau, nên id SVG
  trùng và số mâu thuẫn giữa các bài chỉ lộ ra ở bước gộp.

→ [[cham-viec-agent-nen]].

## 4. Không dùng ảnh sinh bởi model cho sơ đồ kỹ thuật

Chữ và số trong ảnh sai, và **không sửa được một mũi tên** — phải sinh lại cả ảnh rồi hy vọng.
Sơ đồ kỹ thuật dùng SVG hoặc ASCII: sửa được từng phần, diff đọc được, và gate kiểu `check-svg`
kiểm được ([[digest-game-server-2026-09-07]]).

## Khi nào mở lại trang này

Trước khi viết lesson/guide/runbook mới, và trước khi commit bất kỳ tài liệu nào có số trong đó.

Liên quan: [[learning-in-public]] · [[atomic-notes-principle]] · [[write-shorter-notes]] ·
[[moc-learning-pkm]] · [[dev-skills]]
