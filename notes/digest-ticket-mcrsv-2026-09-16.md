---
type: note
title: Digest ticket-mcrsv — 2026-09-16 (F56–F60: cái "thất bại" cho kết quả giá trị nhất, và rake bị lật dấu từ V1)
summary: Task nghiệm thu báo `failed` lại là kết quả đúng nhất đợt — nó tự dựng lại baseline trước V3 để chứng minh lỗi 44px không phải hồi quy; F57 tìm ra mặt deck dốc NGƯỢC hướng sân khấu (sai dấu `rake`, sống từ V1 qua mọi vòng verify vì độ lớn góc đúng); và cơ chế chờ của Orca mất khả năng chặn sau khi waiter nền bị kill.
tags: [agent, method, tooling, automation, project, debug]
created: 2026-09-16
updated: 2026-09-16
source: project `ticket-mcrsv` — session history 2026-09-15/16 (F56 nghiệm thu V3, rồi F57–F60 dọn nợ, vòng `/loop 5m /lt-orca BRIEF-FRONTEND.md`)
---

# Digest — `ticket-mcrsv`, 2026-09-16

F52–F55 đã ghi ở [[digest-ticket-mcrsv-2026-09-15]]. Note này **CHỈ phần mới**: đóng V3 bằng F56,
rồi F57–F60.

## Bugs

**`rake` bị lật dấu — mặt ngồi dốc NGƯỢC hướng sân khấu, sống từ V1.** F57 giao việc dựng deck
nghiêng thay khối đặc; worker đo bằng geometry đang shipping và trả **failure trung thực**, kèm một
defect thứ hai: oracle `Matrix4` độc lập dự đoán đỉnh deck ở `238,60`, raycast trên mesh thật cho
`240,65` — khớp hướng, và hướng đó là **sai**. Sửa là phép thế `rake → −rake`, nhất quán ở **cả hai
số hạng** (giữ phép quay, không biến thành shear) và ở **cả hai consumer** — deck và ghế phải lật
cùng nhau, không thì ghế rời khỏi mặt deck.

Vì sao nó sống được lâu: **độ lớn góc luôn đúng, chỉ dấu sai**, nên mọi phép kiểm so độ cao đỉnh đều
xanh. Cùng cơ chế với F46 (`slope -0.3249` → `+0.3249`) đã ghi trước đây. Corroboration đắt nhất sau
khi sửa: pháp tuyến mặt chắn đổi `Z` từ `+0,2016` sang `−0,2016`.

**Vùng chạm resize handle 36,7px chứ không phải 44px — và gốc khác hẳn thứ brief mô tả.** Brief ghi
là clipPath cắt mất; thực tế `e` và `se` handle cách nhau **28,96 CSS px**, nên hai dải 44px không
chồng nhau là **bất khả thi về hình học**. Đáng chú ý: dòng 78 của file đó chứa một assertion tên
nguyên văn *"lost part of its 44px touch target"* — tức cơ chế đã được ai đó viết ra, nhưng con số
44 chưa bao giờ được **đo**. Lần thứ tư trong dự án; tách riêng ở
[[con-so-trong-tieu-chi-phai-kem-cach-do]].

**Phân bố lại đủ, không cần nới trần.** F60 (elevation chain) là task dễ bị "sửa" bằng cách fudge số
nhất, nên tiêu chí bắt đo trước. Kết quả đúng giả thuyết trung tâm của spec: phân bố mới
`0 · 0 · 9,88 · 45,20 · 78,47` với trần `252` giữ nguyên. Nhưng soft gate thấy một **đánh đổi thật,
không phải lỗi**: hình học đúng thì venue **bẹt đi rõ rệt** — đó là thứ chỉ người nhìn mới quyết
được, nên ghi ra thành F61 cho dantt thay vì tự chọn.

## Techniques

**Task nghiệm thu báo `failed` là kết quả hợp lệ.** F56 đo vùng chạm bằng hit-test thật, thấy không
đạt, rồi **tự dựng lại baseline `54de749`** (xác minh bằng `lsof -p <pid> | grep cwd` rằng server
đúng là đang phục vụ từ thư mục baseline) để trả lời câu "có phải hồi quy V3 không". Bằng chứng mạnh
nhất lại rẻ nhất: `git diff 54de749 HEAD -- use-svg-block-interaction.ts zone-block.tsx` **rỗng** —
hai file cai quản vùng chạm giống nhau từng byte, nên không thể là hồi quy. 7/8 đạt, 1 không đạt và
đã chứng minh là có sẵn.

**Verifier tự dựng lại cả hai phía là thứ đáng giá nhất.** Ở F56 nó build lại **hai** bản production
để so bundle; ở F57 nó gọi thẳng `zoneMeshVertex` production tại toạ độ world thay vì suy diễn; ở
F60 nó tự viết script build riêng và suy `zoneType` từ **tên zone** chứ không theo index của worker.
Mỗi lần đều là một đường đo độc lập với đường worker đã đi.

**Chạy gate làm chết server của worker.** `gate.sh` rebuild `.next` ⇒ đổi `BUILD_ID` ⇒ bản
`next start` đang chạy trên port 3156 phục vụ HTML trỏ vào chunk đã xoá (500). Verifier phải đối
chiếu mấy phép kiểm phụ qua artefact + timestamp và **tự gắn nhãn "độ độc lập thấp hơn"** — đúng
cách xử, không giả vờ đã chạy lại.

**Probe sống trong `/tmp` là probe sắp biến mất.** macOS dọn file cũ >3 ngày; F57 và F58 đều lấy
probe làm tiêu chí nghiệm thu, nên phải đưa chúng vào repo trước khi viết spec. Đã vấp một lần rồi
(`gate.sh` exit 127).

**Cơ chế chờ của Orca mất khả năng chặn.** `orca orchestration check --wait` trả về ngay lập tức dù
không có delivery treo lẫn waiter nào — sau khi một waiter nền bị kill. Polling nền cũng chết ngay
(0 byte, `sleep` bị chặn trong môi trường này). Không sao: `/loop 5m` **chính là** nhịp polling —
không cần dựng thêm cơ chế chờ nào.

**Biến thể "prompt paste mà chưa submit" tái xuất ở F60**, phát hiện bằng đúng cặp tín hiệu đã ghi:
`activity: unknown` + `attention: unverifiable` ⇒ đọc thẳng terminal ⇒ thấy `› [Pasted Content 19222
chars]` ⇒ gửi `--enter` ⇒ `activity` lật sang `working`. Xem [[gui-viec-cho-lane-khong-co-ack]].

**`[⏳]` là trạng thái vô hình.** F39 nằm ở `[⏳ 17:18]` từ 2026-09-09 trong khi đã merge xong 6
ngày — checkbox đó không lọt vào cả lượt quét "đang mở" lẫn lượt quét "đã xong". Cùng họ với
[[brief-state-agent-loop]]. Housekeeping đợt này cắt brief `1126 → 687` dòng (10 task sang
`BRIEF-FRONTEND-done.md`), và sửa một task ghi `[ ]` trong khi mô tả nói "chờ task khác" — để
nguyên thì vòng loop sau nhặt nhầm.

## Context

- Việc `/loop 5m /lt-orca BRIEF-FRONTEND.md` chỉ dantt gõ được — agent không tự khởi động được
  `/loop`. Vòng rỗng là trạng thái đúng, không phải bế tắc: tick nào không nhặt được task thì làm
  housekeeping (Bước 9) thay vì để trống.
- Hai lỗi quy trình của chính tôi trong đợt: merge F50/F51 **trước khi verify** (bắt được vì chưa
  push), và `cd frontend` làm hai lệnh cuối sai đường dẫn tương đối — lặp lại đúng lỗi đã mắc trước
  đó cùng phiên. Một lần nữa: tên nhánh bị Orca worktree chiếm nên `git checkout` fail và thay đổi
  bị stage lên `main`; không hỏng gì vì chưa commit, nhưng phải kiểm `HEAD` mới biết.
- Trạng thái: V1 (F31–F38), V2 (F39–F49), V3 (F50–F56) đóng hết, verifier PASS toàn bộ; F57/F58/F59
  /F60 đã merge; chỉ còn **F61** — câu hỏi thị giác về độ bẹt, thuộc quyết định của dantt.

Liên quan: [[digest-ticket-mcrsv-2026-09-15]] · [[so-anh-khong-so-chu]] ·
[[gate-hop-nhat-truoc-khi-merge]] · [[cham-viec-agent-nen]] · [[bang-chung-phan-biet-duoc]]
