---
type: resource
title: Gate hợp nhất phải chạy TRƯỚC merge, không phải sau
summary: Mỗi lane chạy trong worktree riêng nên verifier của nó không thể thấy tương tác với task khác cùng landed — hai task cùng PASS vẫn làm đỏ gate ngay sau khi merge cả hai, và không có ai trong quy trình có nghĩa vụ bắt được điều đó.
tags: [agent, automation, tooling, method, patterns]
created: 2026-08-27
updated: 2026-08-27
source: project `ticket-mcrsv` — session history 2026-08-27 (đợt frontend F1/F2), lặp lại ở `pdf` (verifier T1/T4 FAIL giả)
---

# Gate hợp nhất phải chạy TRƯỚC merge, không phải sau

## Chuyện đã xảy ra

F1 (hệ token thị giác + trang `/design`) và F2 (gate `check-ui.sh`) chạy song song, mỗi cái một
worktree. **Cả hai đều PASS verifier độc lập.** Merge cả hai về `main` → gate đỏ ngay: 10 giá trị
Tailwind tuỳ tiện mới, 6 trong đó là `tracking-[0.12em]` trên chính trang `/design` của F1 — đúng
loại thứ F2 sinh ra để cấm.

Không lane nào sai. Không verifier nào sai. Verifier của F1 chạy gate **bản cũ** (F2 chưa tồn tại
trong worktree nó); verifier của F2 chạy gate mới trên **code cũ** (F1 chưa tồn tại). Cái hỏng chỉ
tồn tại ở trạng thái hợp nhất — trạng thái mà **không ai trong quy trình từng nhìn thấy** trước
khi nó vào `main`.

## Vì sao cách ly worktree tự sinh ra lỗ này

Cách ly worktree là thứ làm cho chạy song song an toàn — nó ngăn hai lane giẫm file của nhau. Cái
giá là mỗi lane (và mỗi verifier) nhìn một *nhánh của thực tại* chứ không nhìn thực tại. Hai loại
tương tác không lane nào bắt được:

| Loại | Ví dụ |
|------|-------|
| Task A đổi **luật**, task B vi phạm luật mới | F2 thêm gate, F1 viết code mà gate mới cấm |
| Task A đổi **dữ liệu/hàm dùng chung**, task B gọi nó theo hợp đồng cũ | `pdf`: verifier T1 báo "mất download link" — thật ra T2 đã gỡ cả khối, và nhánh T1 không có T2 |

Loại thứ hai còn sinh ra **FAIL giả**: verifier tố cáo một hồi quy chỉ tồn tại vì nhánh nó đọc
thiếu commit của lane khác. Ở `pdf` chuyện này xảy ra hai lần liên tiếp (T1 rồi T4) và cả hai lần
tôi suýt giao lane đi sửa thứ không hỏng.

## Luật rút ra

1. **Dựng trạng thái hợp nhất rồi mới chấm.** Hoặc merge các nhánh vào một nhánh tích hợp và chạy
   gate ở đó, hoặc merge nhánh của lane kia vào worktree đang verify. Merge trước, chấm sau.
2. **Task đổi luật (gate, lint, type, schema) không chạy song song với task viết code chịu luật
   đó.** Nếu buộc phải, coi nó là ràng buộc thứ tự có bằng chứng, không phải "hai vùng file rời
   nhau".
3. **Trước khi tin một FAIL, kiểm nhánh của verifier có đủ commit không.** `git show
   <nhánh-kia>:<path> | grep <symbol>` trả 0 kết quả là dấu hiệu artefact chia nhánh chứ không
   phải hồi quy — cùng họ với [[cham-viec-agent-nen]] (một FAIL phải được phân loại trước khi giao
   lại).
4. **Siết baseline sau khi merge, không phải trước.** Gate đếm số (màu hardcode, giá trị tuỳ tiện,
   file dài) phải lấy số đo trên trạng thái hợp nhất — để lỏng thì nó cho phép trôi ngược lại.

Liên quan: [[gate-tu-viet-la-nguon-xanh-gia]] · [[bang-chung-phan-biet-duoc]] ·
[[2026-08-04-looptasks-verifier-doc-lap]] · [[looptasks-vs-workflow]] ·
[[2026-08-13-tach-gate-khoi-cham-tung-bug]] · [[2026-08-27-he-thi-giac-chong-ai-slop]] ·
[[feedback-ui-component-300-dong-atomic]] · [[brief-state-agent-loop]]
