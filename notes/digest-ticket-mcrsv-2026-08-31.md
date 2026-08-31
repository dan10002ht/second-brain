---
type: note
title: Digest ticket-mcrsv 2026-08-31 — chỗ thủng nằm ở nhánh MIỄN TRỪ của gate, và ảnh chụp là thước dối
summary: Nhóm miễn trừ `([[:alnum:]_-]+:)?` của gate arbitrary-value nhận cả `7px` nên `p-[7px:var(--x)]` lọt, và danh sách whitelist chỉ đúng khi trích theo cấu trúc chứ không grep chuỗi; ảnh chụp headless 390px bị cắt là ảo ảnh khiến tôi giao hai lane đi sửa lỗi không tồn tại; gate khởi động server phải giết cả process group.
tags: [agent, method, debug, tooling]
created: 2026-08-31
updated: 2026-08-31
source: project `ticket-mcrsv` — session history (4 session: `BRIEF-FRONTEND` F1–F20 và backend task 142–150 qua `/looptasksv2`)
---

Nối tiếp [[digest-ticket-mcrsv-2026-08-30]] · [[digest-ticket-mcrsv-2026-08-28]] ·
[[digest-ticket-mcrsv-2026-08-27]]. **Chỉ phần mới.** Những thứ đã ghi ở các digest trước và
KHÔNG lặp lại ở đây: QR suy từ `ticket_id` + migration backfill, gate `check-overflow.sh` tự sinh
bằng chứng giả, `RoleGuard` phía client sau hydrate, dòng `public` của Gatsby nuốt
`frontend/public/`, `errors.New` trượt `errors.As`, gate hợp nhất đỏ sau khi merge hai lane cùng
PASS, swap là biến quyết định lịch trình dispatch.

## Bugs

**Chỗ thủng của một gate nằm ở nhánh MIỄN TRỪ, không ở nhánh bắt lỗi.** Gate cấm giá trị Tailwind
tuỳ tiện có một nhóm "prop hint" trong regex miễn trừ: `([[:alnum:]_-]+:)?`. Nhóm đó nhận **bất kỳ**
chuỗi alnum nào — kể cả `7px` — nên `p-[7px:var(--x)]` được đọc thành "hint `7px` + token", tức lọt.
Phần bắt lỗi hoàn toàn đúng suốt thời gian đó; chỉ có cửa hậu là sai. Cụ thể hoá
[[gate-quet-ma-nguon-bang-ast]] ở đúng chỗ nó cảnh báo là "dễ bị tự-allowlist".

**Whitelist phải trích theo CẤU TRÚC, grep chuỗi là phép thử yếu.** Vòng sửa đầu thay nhóm mở bằng
whitelist 13 type-hint tường minh — nhưng chính danh sách đó sai: `shadow`, `string`,
`line-height` có mặt trong file thư viện vì lý do khác chứ không phải là data-type thật. Grep của
tôi thấy đủ 8 chuỗi trong `lib.js` và kết luận nhầm; verifier kiểm theo cấu trúc thì bác. Bản đúng
là một script **phân tích cấu trúc** — đọc mảng type của `Q(value,[...])` và case label trong
`switch (value.dataType ?? Q(...))` — và hai phương pháp trích độc lập hội tụ về cùng **16 mục**.
Phép kiểm cuối: ba hint bịa bị bắt lại, và lỗ hổng gốc `p-[7px:var(--x)]` vẫn bị chặn.

**Ảnh chụp headless là thước dối; tôi giao hai lane đi sửa một lỗi không tồn tại.** Chụp ở
`--window-size=390,844`, nội dung trong ảnh bị cắt ở mép phải ⇒ tôi báo "tràn ngang ở 390px" và
giao F5 + F7 mỗi lane một vòng sửa. Đo lại bằng số thì `scrollWidth == clientWidth == 375` ở **mọi**
trang: không trang nào tràn. Chrome không tôn trọng `--window-size` như tôi tưởng, ảnh vẫn 390×844
nhưng nội dung bị cắt xén. Phải bảo cả hai lane hoàn nguyên. Cùng họ với
[[do-be-ngang-headless-chrome]] — khác biệt đáng nhớ: lần này thước dối không phải con số mà là
**bức ảnh**, thứ trực giác nhất nên khó nghi nhất.

**Vé bị "đốt" vì check-in đổi trạng thái mà không ghi sổ.** Vé thành `used` nhưng bảng check-in 0
bản ghi ⇒ vé chết vĩnh viễn, không ai vào được. Lane chọn **idempotent-hoá** thay vì chỉ validate
sớm, nên nó trả lời được cả ca crash giữa chừng. Phần đóng việc: tôi không dựng ca giả mà dùng
**chính hàng dữ liệu mà bug cũ đã làm hỏng** làm input — vé đốt phục hồi được trên đường thật, và
bất biến trùng vẫn ra 409 `ALREADY_CHECKED_IN`. Cùng nguyên tắc với
[[bang-chung-phan-biet-duoc]]: input đã từng khai thác được là bằng chứng phân biệt được, ca giả
thì không.

## Techniques

**Gate khởi động server phải giết cả process group, không phải PID.** Script CI dựng dev server để
đo bố cục dùng `set -euo pipefail` + `set -m` rồi giết theo nhóm. Verifier chứng minh bằng thí
nghiệm đối chứng: `kill -9 $PID` kiểu ngây thơ để lại một `next-server` **mồ côi vẫn giữ port** —
lần chạy sau sẽ đo nhầm server cũ mà không biết. Hai chi tiết còn lại của bản chắc: preflight từ
chối chạy nếu port đã có người, và vòng chờ **kiểm process còn sống mỗi lượt** để server chết là
fail ngay thay vì chờ hết timeout rồi báo một lỗi sai.

**Verifier PASS không có nghĩa là được merge ngay.** F10 PASS nhưng verifier nêu kèm một rủi ro
ngoài tiêu chí: `zoneDrafts` không bao giờ được dọn (`setZoneDrafts({})` không tồn tại ở đâu) — tức
ghi đè ngầm dữ liệu người khác. Tôi giao thêm một vòng sửa thay vì merge rồi mở task. Ngược lại,
verdict **FAIL** cũng có lúc phải bác: F4 và F20 đều FAIL vì vi phạm ràng buộc trong brief, mà
ràng buộc đó do chính tôi viết sai (cấm đổi giao diện trong một task đổi bảng màu; đòi sửa một file
không hề chứa chữ "resize"). Verdict của verifier chấm theo brief, nên nó chỉ đúng bằng brief.

## Context / gotcha

- **Verifier xoá nhầm file rồi khôi phục "từ trí nhớ", không từ git.** Nó tự khai — nhưng lời khai
  đó không thay được việc kiểm: tôi phải tự đối chiếu đủ ba export và tên ảnh khớp hai file thật,
  rồi chạy probe riêng, mới dám merge. Biến thể mới của
  [[digest-ticket-mcrsv-2026-08-19]] (verifier bị cấm chạy git vẫn `git checkout --`).
- Skill của Claude (ví dụ `dataviz`) **không tồn tại với lane codex** — brief đừng trỏ vào nó. Lane
  tự xoay sang token `--chart-*` có sẵn và hướng đó đúng, nhưng đó là may chứ không phải thiết kế.
- `rm -rf .next` trong lúc dev server của user đang chạy làm process giữ port mà đã hỏng — user báo
  "sao không vào được". Sau đó chạy server tách hẳn khỏi session (`nohup`/`disown`) thì lệnh của
  tôi không giết lây được nữa; nhưng verifier dọn dẹp bằng `pkill` mẫu rộng vẫn giết được nó.

## Liên quan

[[digest-ticket-mcrsv-2026-08-30]] · [[gate-quet-ma-nguon-bang-ast]] ·
[[gate-tu-viet-la-nguon-xanh-gia]] · [[do-be-ngang-headless-chrome]] · [[bang-chung-phan-biet-duoc]]
· [[cham-viec-agent-nen]] · [[2026-08-27-he-thi-giac-chong-ai-slop]]
