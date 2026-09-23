---
type: note
title: Digest ticket-mcrsv — 2026-09-23 (gỡ một manh mối chết khỏi BRIEF, và ~180 vòng loop rỗng trong 12 tiếng)
summary: Một chỉ dẫn điều tra trong `BRIEF.md` trỏ tới route và test đã bị xoá 5 ngày SAU phép đo sinh ra nó — manh mối chết phải bị gạch kèm bằng chứng chứ không để nguyên; và loop nền chạy ~180 vòng rỗng suốt 12 tiếng vì blocker nằm ngoài repo lẫn ngoài quyền của agent, đúng ca mà luật tự-dừng-sau-15-vòng đã có nhưng không được áp dụng.
tags: [agent, method, tooling, automation, project]
created: 2026-09-23
updated: 2026-09-23
source: project `ticket-mcrsv` — session history (session 72710e0b, phần sau F61: chuyển loop sang `BRIEF.md` backend)
---

# Digest — `ticket-mcrsv`, 2026-09-23

Đợt venue 3D (V1→V3, F31–F61) đã ghi hết ở [[digest-ticket-mcrsv-2026-09-14]] →
[[digest-ticket-mcrsv-2026-09-16]]. Note này **CHỈ phần sau đó**: `BRIEF-FRONTEND.md` hết task,
loop được trỏ sang `BRIEF.md` (backend), và 12 tiếng không nhặt được gì.

## Bugs — trong chính task list, không trong code

**Manh mối chết sống trong `BRIEF.md` và sẽ đốt một phiên của agent sau.** Mục 2 phần "còn lại phải
làm" của `H71` bảo: *đi tìm riêng kiểu hỏng `Expected: 500, Received: 200`, đọc mock của scenario
`availability/block` xem có state dùng chung giữa các test không.* Chuỗi ngày làm nó vô hiệu:

| Mốc | Việc |
|---|---|
| 2026-08-13 | phép đo vòng 2 quan sát được kiểu hỏng đó |
| 2026-08-18 | `B24` xoá **cả route lẫn hai test** (`routes/event.js:173`, `handlers/availabilityHandlers.js:95`, hai khối comment thay chỗ test cũ ở `h27BusinessErrorStatus.test.js:195` và `:252`) |

`POST .../availability/block` **không còn tồn tại** ⇒ kiểu hỏng không tái diễn được, và không còn
mock nào để đọc. Cách xử đúng là **gạch ngang tại chỗ kèm bằng chứng và ngày xác minh**, không phải
xoá dòng — người sau cần biết hướng này đã bị đóng và vì sao, nếu không sẽ có người mở lại. Xác minh
bằng grep qua ba file, không suy từ chữ trong brief.

Đây là kiểu thối thứ năm của `BRIEF.md`, ngoài bốn kiểu đã liệt ở [[brief-state-agent-loop]]:
**một quan sát đúng tại thời điểm đo, biến thành chỉ dẫn hành động, rồi bị thực tế vượt qua** — nó
không nói dối như checkbox sai, nó chỉ đơn giản đã hết hiệu lực mà không ai báo.

## Techniques

**Tiêu chí boolean và tiêu chí thống kê chịu máy bận khác hẳn nhau.** Ba task backend còn lại cùng
bị chặn bởi một blocker máy, nhưng không cùng mức độ:

| Task | Loại tiêu chí | Máy bận thì sao |
|---|---|---|
| `145` A1c — PDF có đúng magic bytes `%PDF` không | boolean | **chậm**, không sai |
| `97` H71 · `137` TEST-1 — tỉ lệ fail qua ≥30 lần chạy | thống kê | **sai**, và con số rác sẽ được ghi vào `REFERENCES.md` dạy sai agent sau |

Vì vậy `145` chạy được ngay khi có hạ tầng; `97`/`137` phải đợi máy thật sự rảnh. Tách riêng ở
[[tieu-chi-boolean-chiu-duoc-may-ban]].

**Không tự bật VM cấp máy trong loop nền.** `colima start` lúc swap 89% là quyết định của dantt, không
phải của agent chạy nền — hai lệnh gỡ chặn (`colima start`, `brew install k3d helm`) được bàn giao
thành câu chữ thay vì tự chạy. Cùng tinh thần với [[chan-agent-bang-cau-hinh]]: việc vượt phạm vi
thì đưa ra, không làm hộ.

## Context

- **Loop chạy ~180 vòng rỗng trong ~12 tiếng** (17:41 hôm trước → 09:22 hôm sau), mỗi vòng in đúng
  một dòng `2d3eb62 sạch, Colima tắt, swap ~89%, k3d/helm chưa có`, cho tới khi dantt gõ
  `stop loop nhé`. Trước đó `BRIEF-FRONTEND.md` cũng đã chạy **115 vòng rỗng** liên tiếp.
  Luật tự dừng sau ~15 vòng rỗng **đã có từ 2026-08-12** ([[feedback-dung-loop-khi-rong]]) và mô tả
  đúng ca này — vấn đề không phải thiếu luật mà là luật không được áp dụng khi loop chạy nền qua
  nhiều lần compact. *Chưa xác minh* liệu luật có sống sót qua context summary hay không.
- **Commit message có dấu nháy làm `git commit -m` hỏng** (git đọc các từ thành pathspec) → dùng
  `git commit -F <file>` ngay từ đầu.
- **`cd frontend` rồi dùng đường dẫn tính từ gốc repo** — lỗi tự gây ra hai lần trong cùng phiên;
  cách chắc là mọi lệnh dùng đường dẫn tuyệt đối hoặc tính từ gốc trong **một** lần gọi Bash.
- Trạng thái lúc dừng: `main` ở `2d3eb62`, cây sạch, local = remote. Frontend đóng hoàn toàn
  (61 task F31→F61, verifier PASS trừ F57 đóng với kết luận "không khả thi như đã đặc tả").

## Liên quan

[[moc-ticket-mcrsv]] · [[digest-ticket-mcrsv-2026-09-16]] ·
[[brief-state-agent-loop]] · [[feedback-dung-loop-khi-rong]] ·
[[tieu-chi-boolean-chiu-duoc-may-ban]] · [[con-so-trong-tieu-chi-phai-kem-cach-do]] ·
[[cham-viec-agent-nen]] · [[chan-agent-bang-cau-hinh]]
