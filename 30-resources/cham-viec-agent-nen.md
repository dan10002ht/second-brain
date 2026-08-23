---
type: resource
title: Chấm việc của agent nền — tín hiệu nào đáng tin
summary: Khi việc chạy ở agent/lane nền, mọi tín hiệu tiện tay (report, mtime, CPU, tên pane, verdict) đều trả lời một câu hỏi KHÁC với câu đang hỏi — và một FAIL phải được phân loại (defect / artefact môi trường / bất đồng thiết kế) trước khi giao lại.
tags: [method, tooling, skills, debug]
created: 2026-08-23
updated: 2026-08-23
source: [[digest-pdf-2026-08-21]] · [[digest-pdf-2026-08-22]] · [[digest-subscriptions-2026-08-21]] · [[digest-subscriptions-2026-08-22]] · [[digest-ticket-mcrsv-2026-08-19]] · [[digest-ticket-mcrsv-2026-08-20]] · [[digest-ticket-mcrsv-2026-08-21]] · [[digest-ticket-mcrsv-2026-08-22]]
---

# Chấm việc của agent nền — tín hiệu nào đáng tin

Giao việc cho agent/lane chạy nền là **đổi quan sát trực tiếp lấy tín hiệu gián tiếp**.
Đó mới là chỗ đắt, không phải chuyện chia task. Note này gom lại: tín hiệu nào trả lời
đúng câu mình đang hỏi, tín hiệu nào chỉ trông như thế.

Áp dụng cho mọi harness có worker chạy ngoài context của mình — `/looptasks`,
`/looptasksv2` + lane cmux/codex, subagent song song, hay một verifier độc lập.

## 1. Tín hiệu trả lời sai câu hỏi

| Câu hỏi thật | Tín hiệu hay dùng | Vì sao nó sai | Tín hiệu đáng tin |
|---|---|---|---|
| Lane xong chưa? | file report **xuất hiện** | report của vòng trước vẫn còn nằm đó | mtime **đổi** so với baseline chụp trước khi dispatch |
| Lane xong chưa? | mtime file nguồn cũ hơn lúc mình giao việc | nó vẫn đang chạy dở, chưa ghi | agent **đã kết thúc lượt** chưa |
| Lane còn sống? | tiêu đề cửa sổ đổi, `pgrep -x <bin>` | tiêu đề `[tmux]` ≠ TUI đã thoát; `pgrep` khớp cả binary trùng tên của bản khác | CPU + mtime working tree; lane có thể đứng im **0% CPU** mà không báo gì |
| Nó có làm thật không? | report / bảng audit nó tự viết | agent báo lại việc cũ như vừa làm; bảng "khớp mockup" đối chiếu tay ra thiếu ba thứ | đối chiếu **số** (baseline test), `git diff`, grep vùng file |
| Gate xanh? | `exit 0` của script | xem [[gate-tu-viet-la-nguon-xanh-gia]] | thí nghiệm ngược: tiêm lỗi, đòi gate phải đỏ |

Đối xứng của luật này: **cũng đừng kết luận agent bịa bằng mtime**. Grep ra 0 lần xuất
hiện + file sửa lần cuối trước lúc mình gửi yêu cầu ⇒ đã kết luận "agent báo cáo việc nó
không làm", trong khi nó vẫn đang chạy dở và phải đính chính. Ngưỡng đúng vẫn là
*đã kết thúc lượt chưa*.

## 2. Một FAIL không phải một loại

Phân loại trước khi giao lại — giao lại nhầm loại là đốt trọn một vòng.

| Loại | Dấu hiệu | Xử lý |
|---|---|---|
| **Defect thật** | tái hiện được trên **cây hợp nhất** | giao lại lane, kèm cách tái hiện |
| **Artefact môi trường** | verifier mô tả một trạng thái *không tồn tại ở đâu cả* | đưa lane lên ngang nhánh đích rồi chấm lại |
| **Bất đồng thiết kế** | không chỉ ra được hành vi sai, chỉ chê lựa chọn | người quyết; ghi rõ "đóng theo quyết định", **không** ghi PASS |

Ba nguồn artefact đã gặp, đều cùng một hình dạng — lane và người chấm nhìn hai cây khác nhau:

- lane base trên nhánh của lane trước ⇒ thiếu commit của lane đó ⇒ verifier thấy code khuyết;
- worktree mới thiếu file gitignored/untracked (env, spec, mockup) ⇒ gate đỏ giả;
- lane base từ **trước** một lần tái cấu trúc ⇒ nó báo link chết của cây thư mục đã bị thay.

Cách phân xử rẻ nhất: `git show <nhánh-hợp-nhất>:<file>` rồi mới đọc, thay vì đọc working
tree của lane. Cùng kỷ luật với [[feedback-audit-code-doc-tu-nhanh-prod]].

## 3. Verifier cũng là một agent

Nó chấm được, nên nó cũng **phá được**. Lệnh cấm viết trong brief là *lời nhắc*, không phải
rào chắn ([[chan-agent-bang-cau-hinh]]): một verifier bị cấm chạy git vẫn `git checkout --`
và xoá mất thay đổi chưa commit của lane — hai lần trong hai ngày, ở hai phiên khác nhau.
Thứ có tác dụng là chỉ thị **tường minh từng lệnh** (`git checkout --` / `git restore` /
`git stash`) cộng yêu cầu `cp` backup trước khi mutate — sau khi thêm, verifier chuyển sang
mutate bằng script + bản `cp` tự lưu.

Và verifier sai được theo cả hai chiều. Trong cùng một phiên đã xảy ra đủ ba kết cục:

- verifier đúng / mình sai (hai hệ config song song cho cùng một cổng);
- lane đúng / verifier sai (verifier `ls` một đường dẫn đã resolve từ root rồi kết luận
  "không tồn tại ở đâu trong repo" — kết luận vượt quá dữ kiện nó có);
- cả hai cùng sót (lỗi port còn ở hai chỗ nữa).

⇒ **Không có bên nào thắng theo mặc định.** Trọng tài là dữ kiện thứ ba do mình tự chạy,
không phải bên nào nói to hơn. Đây chính là [[bang-chung-phan-biet-duoc]] áp vào chỗ hai
agent mâu thuẫn.

Ngược lại, khi lane phản bác **mô tả task** thì thường phải nghe: đã có nhiều ca lane
chứng minh bằng dòng code cụ thể rằng giả định trong brief của mình sai, và nó đúng.

## 4. Kỷ luật chia lô

- **Chia theo vùng file, không theo số task** — mỗi vòng **grep lại** vùng file thật (cây
  file đổi liên tục giữa các vòng), không dựa trí nhớ vòng trước. Nhiều iteration cố ý
  *không* nhận task mới vì lý do này; đó là quyết định, không phải loop chạy rỗng.
- **Ghép theo toolchain và RAM đo được tại thời điểm nhận task**, không theo số lượng: hai
  build nặng song song đủ làm sập cả VM container.
- **Verify tuần tự** khi mutation test của verifier sẽ build/test đè lên file agent khác
  đang sửa.

## 5. Gotcha khi lane là process ngoài

Những thứ này không liên quan gì đến chất lượng code nhưng làm hỏng cả vòng:

- **Model tự tụt hạng giữa chừng** rồi báo "không thể chuyển model giữa chừng" — relaunch
  với model/effort tường minh, rồi **đọc lại dòng model nó in ra** để xác nhận.
- **Paste dài bị nuốt Enter**, đoạn brief kẹt trong ô nhập → ghi brief ra file, gửi một câu
  ngắn trỏ vào file.
- **Watcher nền bị kill** (không phải tự thoát) → dựa vào nhịp cron của chính loop, đừng
  dựa vào watcher.
- **Đặt tên lane trong ghi chép mà không dựng lane thật** là nguồn nhầm lẫn cho cả mình lẫn
  người đọc — "lane T15" không tồn tại, việc đi vào chính lane T13 cũ.
- Verifier có thể **chết vì hết quota** giữa chừng; khi đó ghi thẳng "chưa verify độc lập"
  vào commit message thay vì để trống.

## Liên quan

[[ack-khong-phai-hieu-ung]] · [[brief-state-agent-loop]] · [[gate-tu-viet-la-nguon-xanh-gia]] · [[chan-agent-bang-cau-hinh]] ·
[[bang-chung-phan-biet-duoc]] · [[truong-last-verified]] ·
[[2026-08-04-looptasks-verifier-doc-lap]] · [[2026-08-07-phan-tang-verifier]] ·
[[2026-08-14-verifier-va-agent-mutation-tach-doi]] · [[looptasks-vs-workflow]]
