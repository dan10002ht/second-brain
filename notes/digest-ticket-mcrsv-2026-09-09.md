---
type: note
title: Digest ticket-mcrsv — 2026-09-09 (đóng V1 venue 3D, mở V2)
summary: Tiêu chí fps không đo được trên máy này nên `F34` bị `Blocked On` — lỗi ở tiêu chí chứ không ở worker, thay bằng delta draw call = 1; trần độ cao bị tắt bằng một cờ TOÀN SCENE nên chỉ cần một zone override là cả scene mất trần; ghế bị tô đen vì `var()` bọc hai lần từ chính câu trả lời của tôi cho worker; và ảnh cho thấy khối 3D "bay" đã có từ V1 chứ không phải do task mới.
tags: [agent, automation, debug, architecture]
created: 2026-09-09
updated: 2026-09-09
source: project `ticket-mcrsv` — session history (F34/F38 đóng V1, plan V2 + F39/F40/F41/F46)
---

CHỈ phần mới so với [[digest-ticket-mcrsv-2026-09-08]]. Bản đồ chủ đề: [[moc-ticket-mcrsv]].

## Bugs

**Trần độ cao bị tắt bằng một cờ TOÀN SCENE.** Verifier trả FAIL cho `F38` vòng 1: bản vá tắt trần
bằng `.some()` trên cả scene, nên **chỉ cần một zone có override** là mọi zone khác cũng mất trần.
Vòng 2 sửa thành "chuỗi heuristic luôn bị trần, override thắng theo **đúng field của đúng zone**", và
lane tự tái lập được con số verifier đưa ra (`2171.52`). Đây là lỗi phạm vi (scope) chứ không phải lỗi
công thức — loại mà test "có trần hay không" không bắt được, phải test "trần còn đúng khi trộn
override và auto không".

**Ghế 3D tô đen vì `var()` bị bọc hai lần — và một phần do câu trả lời của tôi.** Tôi dặn worker
*"`getPriceColor` trả `var(--...)`, three.js không hiểu CSS var ⇒ dùng helper `tokenColor`"*, nhưng
`tokenColor()` gán `probe.style.color = \`var(${variable})\`` — tức nó nhận **tên biến trần**. Chỗ gọi
truyền chuỗi đã bọc ⇒ `var(var(--x))` ⇒ màu rỗng ⇒ đen. Fix: helper thuần `toCssColorExpression` chỉ
bọc khi chuỗi bắt đầu bằng `--`. Khi trả lời một câu hỏi của worker, câu trả lời đó thành **spec** —
sai ở đó thì worker làm đúng vẫn ra sai.

**`rake` bị lật ngược dấu** (`F46`, verifier FAIL): độ lớn góc đúng, dấu đảo. Verifier chứng minh bằng
cách **dựng lại với `three` thật** thay vì suy diễn tay — với phép biến đổi hình học thì đọc code rồi
gật là không đủ.

**Test đỏ ở checkout chính trong khi worktree xanh 18/18.** Không phải lỗi code: checkout chính chưa
cài `three`/R3F (chúng được thêm ở `F33`, còn `node_modules` ở đây có từ trước đó). Cùng họ với
worktree thiếu env đã ghi nhiều lần — trước khi kết luận "gộp làm vỡ", kiểm dependency của chính chỗ
đang chạy. → [[gate-hop-nhat-truoc-khi-merge]].

**Ảnh cho thấy khối zone "bay lơ lửng" — nhưng nó bay từ V1.** Gate mềm (mở ảnh ra nhìn) ở `F41` phát
hiện bốn khối tách hẳn khỏi sàn. Phản xạ tự nhiên là đổ cho task vừa làm; đối chiếu ảnh `F38` cho thấy
khối **đã bay từ trước**, `F41` chỉ khuếch đại. Ghi đúng như vậy vào brief thay vì đổ cho task mới —
nếu không thì vòng sửa sẽ đi tìm bug ở chỗ không có.

**Verifier `F41` FAIL vì thí nghiệm ngược KHÔNG đỏ.** Không có test nào canh việc gộp nhầm hai nhánh
cộng dồn — tức bộ test xanh mà không guard gì ở đúng chỗ nguy hiểm. Vòng 2 khớp chính xác con số
verifier dự đoán (`235,69` vs `169,35`). Cùng họ [[gate-tu-viet-la-nguon-xanh-gia]].

## Techniques / vận hành

**Tiêu chí nghiệm thu phải trả lời được "đo bằng cách nào, máy này đo được không".** `F34` báo
`Blocked On` vì không đạt mốc fps — và **đó là lỗi tiêu chí của tôi**, không phải lỗi code: máy này
chỉ chạy được `chrome-headless-shell` + swiftshader (render phần mềm), fps đo ra vô nghĩa. Thay bằng
thứ đo được và đúng thứ muốn chứng minh: **delta draw call = 1** ở cả 2.000 lẫn 5.000 ghế, triangles
tăng đúng 12/ghế ⇒ instancing thật. Đây là lần thứ hai trong đợt V1 phải sửa tiêu chí giữa chừng
(lần trước là ngưỡng bundle ở `F33`), nên nó đã thành một mục bắt buộc trong prompt của phiên sau.

**Worker báo `Blocked On` với số đo thật, không làm tròn lên.** Đó là hành vi đúng và phải giữ; chỗ
phải sửa là tiêu chí. Cùng kết luận với `F33` ở [[digest-ticket-mcrsv-2026-09-08]].

**Chờ verifier thì phải phân biệt "đang làm việc" với "treo".** Dấu hiệu dùng được: file gate nó ghi
ra (`/tmp/vf34c-*`) tăng dần — 7 file nghĩa là đã qua typecheck/lint/build. Chờ mà không phân biệt
được hai trạng thái đó thì cũng như không chờ. → [[cham-viec-agent-nen]].

**Chặn task theo file, không theo thứ tự trong brief.** `F34` phải chờ `F38` merge vì cùng sửa
`venue-3d-view.tsx`; `F41–F44` phụ thuộc nhau nên phải chặn **tường minh** trong brief, vì `/lt-orca`
nhặt 4 task song song và không tự biết.

**Câu hỏi của worker đã trả lời rồi thì phải ack.** Tin chưa ack nằm lại trong hàng đợi và hiện lại
mỗi vòng, làm mọi lượt loop trông như "có việc mới".

## Context

- **V1 venue 3D hoàn tất** (`F31`→`F38`), `BRIEF-FRONTEND.md` sạch task, loop `e21cb0b6` đã huỷ.
- **V2 và V3 không phải hai lựa chọn thay thế nhau** — tôi trình bày sai như vậy; user vá đúng chỗ:
  V2 là chỉnh (designer, người tổ chức), V3 là xem (trang bán vé, khách mua), **hai nửa của một tính
  năng**. Chốt làm cả hai, V2 trước. Ghi vào mục 6 của spec để phiên mới đọc từ file chứ không phụ
  thuộc việc dán đúng chữ.
- Plan V2: `docs/superpowers/plans/2026-09-09-venue-3d-v2.md`, 6 task; batch đầu `F39`/`F40`/`F41` ba
  file tách rời chạy song song, `F46` sau.
- Bẫy môi trường phải dán nguyên văn vào **mọi** brief: `CHROME_BIN` trỏ `chrome-headless-shell` của
  `ms-playwright` + `--enable-unsafe-swiftshader`; `find_chrome()` dò PATH trước và chọn nhầm
  `/opt/homebrew/bin/chromium` (treo `Runtime.evaluate`, có lần crash SEGV).
- `Files You May Edit` suy từ ACCEPTANCE, **không** từ chỗ phát hiện bug — `F31` mất một vòng vì thế.

Liên quan: [[moc-ticket-mcrsv]] · [[digest-ticket-mcrsv-2026-09-08]] ·
[[2026-09-04-venue-2d-dung-3d-xem]] · [[phep-kiem-quan-sat-sai-tang]] · [[cham-viec-agent-nen]]
