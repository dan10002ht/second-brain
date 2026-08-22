---
type: note
title: MOC — Học tập & Quản lý tri thức cá nhân
summary: MOC — điểm vào chủ đề học tập & PKM, gom link tới các note liên quan.
tags: [moc, pkm, learning, index]
created: 2026-07-06
updated: 2026-08-22
---

# MOC — Học tập & Quản lý tri thức cá nhân

> Map of Content: điểm vào cho chủ đề học tập và tri thức kỹ thuật.
> Không chứa nội dung mới — chỉ gom link tới các note khác.

## Phương pháp

- [[atomic-notes-principle]] — mỗi note một ý, liên kết bằng wiki-link.
- [[learning-in-public]] — vì sao viết ra giúp học nhanh hơn.
- [[bang-chung-phan-biet-duoc]] — mở khi một kết luận cho phép *dừng* điều tra ("gate đỏ là
  pre-existing", "không thấy log", "verifier PASS"): bằng chứng vắng mặt và báo cáo tự chấm
  không phân biệt được "ổn" với "phép đo hỏng".
- [[chan-agent-bang-cau-hinh]] — mở khi định ràng buộc một agent bằng lời dặn trong prompt: rào
  chắn thật là cấu hình (default trỏ vào tài nguyên không tồn tại, credential read-only, worktree
  riêng), lời dặn chỉ là lời nhắc.
- [[feedback-dung-loop-khi-rong]] — mở khi một `/loop` chạy hoài không nhặt được việc: ~15 lượt
  rỗng liên tiếp thì tự huỷ cron và tổng kết chỗ đang bị chặn.
- [[feedback-khong-khep-viec-khi-con-khe-ho]] — mở khi định đóng một task với lý lẽ "khe còn lại
  nhỏ": fail 2–3 vòng cùng hướng là tín hiệu sai cách tiếp cận, không phải cần thêm một vòng.
- [[gate-quet-ma-nguon-bang-ast]] — mở khi định viết một gate "cấm log/gọi thứ này" bằng
  `grep`/regex: cú pháp là biến số nên gate luôn còn khe; AST làm nó hết là biến số.
- [[2026-08-13-tach-gate-khoi-cham-tung-bug]] — mở khi chi phí verify của một task nhiều bug phình
  lên: gate tốn như nhau bất kể sửa mấy bug, nên chạy một lần chung thay vì mỗi verifier chạy lại.
- [[2026-08-14-verifier-va-agent-mutation-tach-doi]] — mở khi định nới quyền cho verifier để nó
  tự "phá code xem test có bắt không": brief vừa cấm sửa file vừa đòi thí nghiệm ngược là brief
  tự mâu thuẫn, và agent trung thực sẽ báo "chưa xác minh" thay vì FAIL ồn ào.
- [[brief-state-agent-loop]] — mở khi một session sau sắp tin `BRIEF.md` như tin sự thật: file
  task list là shared state bền của agent loop và nó thối theo bốn kiểu (checkbox nói dối, lock
  treo, con số cũ bị đọc như phép đo, doc lạc hậu ở đầu file).
- [[feedback-hoi-be-mat-truoc-khi-audit]] — mở khi nhận một task điều tra/audit: nếu danh từ trong
  task có hơn một hiện thân trong hệ thống (CLS storefront hay admin app, "widget", "portal",
  "giá"), hỏi một câu trước khi spawn agent — verify chính xác một sai đề vẫn là sai đề.
- [[feedback-debug-phai-query-data-that]] — mở khi một kết luận root cause chỉ dựa vào đọc code:
  code cho biết đường đi *có thể* xảy ra, chỉ dữ liệu prod mới cho biết đường nào **đã** xảy ra.
- [[feedback-audit-code-doc-tu-nhanh-prod]] — mở khi sắp kết luận "code hiện đang thế nào" từ
  worktree đang mở: đọc đúng file nhưng sai **phiên bản** thì bằng chứng không phân biệt được gì;
  đo độ lệch nhánh trước, rồi đọc bằng `git show origin/master:<path>`.
- [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] — mở khi một dữ liệu sai nằm im hàng tháng mà
  job đồng bộ và detector đều báo sạch: hỏi lớp đồng bộ đang so *trường nào*, detector lấy chuẩn
  từ đâu, và ngưỡng dung sai đang che mất dải hỏng nào.
- [[feedback-xoa-secret-khoi-code-chua-phai-vo-hieu-hoa]] — mở khi định báo xong một việc dọn
  secret ở bước "đã tạo MR": xoá dòng code chỉ đóng *nguồn rò rỉ*, còn *giá trị đang sống* thì
  vẫn dùng được và git history vẫn phát lại nó. Deliverable là MR **+** danh sách rotate có thứ
  tự. Phân loại secret thật vs định danh công khai: [[api-key-cong-khai-khong-phai-secret]].
- [[truong-last-verified]] — mở khi định thêm một trường "đã kiểm" (`last-verified`, `status: done`,
  checkbox BRIEF) hoặc điền nó hàng loạt: gate chỉ kiểm được *có trường hay không*, nên một trường
  sai làm người sau **ngừng** kiểm — để trống là câu trả lời hợp lệ.
- [[do-be-ngang-headless-chrome]] — mở khi sắp kết luận "tràn / không tràn" từ một phép đo trong
  headless Chrome: sàn viewport 500px, `scrollWidth` trong iframe và `documentElement.scrollWidth`
  đều nói dối; assert chính cái thước trước, và một con số giả đưa vào brief sẽ ship ra code sai.
- [[feedback-khong-dung-vs-chua-lam-toi]] — mở khi định gắn nhãn một service/module là thừa và đề
  xuất xoá: zero-reference khớp với cả "không ai cần" lẫn "chưa ai viết" — phải đọc plan/roadmap
  mới phân biệt được.
- [[gate-tu-viet-la-nguon-xanh-gia]] — mở khi sắp tin verdict PASS của một gate script mình tự viết:
  `$?` bị nuốt bởi lệnh cuối trong subshell và test thiếu hạ tầng thì SKIP im lặng mà vẫn in `ok` —
  tiêm một lỗi thật vào và xem gate có đỏ không, trước khi dùng nó chấm ai.
- [[feedback-dung-xin-chot-khi-chi-thi-da-co]] — mở khi đang soạn một câu "anh chốt giúp em cái nào":
  nếu chỉ thị đứng sẵn đã trả lời và hai nhánh không đánh đổi nhau thì hỏi chốt là xin thu hẹp phạm
  vi, không phải cẩn thận — tự quyết, làm, rồi báo kết quả.
- [[2026-08-22-cau-truc-doc-theo-vong-doi]] — mở khi một cây doc trôi thành sai mà không ai chịu trách
  nhiệm: xếp theo *hợp đồng với sự thật* (living / plans / archive) chứ không theo chủ đề, vì chỉ khi
  có ranh giới đó thì CI mới gate được mà không đỏ vĩnh viễn.
- [[feedback-khong-in-secret-ra-chat]] — mở khi một token đang đi qua tay mình trong lúc làm việc:
  chỉ nhắc **tên biến** và truyền qua env của đúng lệnh đó; transcript được lưu ra đĩa và
  `brain-digest` đọc lại mỗi tối nên một lần in ra chat là không rút lại được.

## Rust

- [[rust-ownership]] — mô hình sở hữu một owner.
- [[borrow-checker]] — mượn tham chiếu an toàn tại compile time.

## TypeScript

- [[ts-type-narrowing]] — thu hẹp union theo control flow.
- [[discriminated-unions]] — tagged union + exhaustiveness check.

## Python

- [[python-asyncio-blocking]] — đừng chặn event loop.
- [[asyncio-gotchas]] — các bẫy asyncio thường gặp.

## Hệ thống phân tán & chịu tải (tự học, ngoài Avada)

- [[digest-ticket-mcrsv-2026-08-11]] — mở khi cần khảo sát một repo microservice lạ: doc của repo
  có thể mô tả sai hiện trạng, và bước 0 bắt buộc (generate proto) không nằm trong README.
- [[2026-08-11-ban-do-tai-k3d-k6]] — mở khi định chọn công cụ để *học* chịu tải: vì sao LocalStack
  không giải bài toán này, và vì sao phải đo mốc gốc trước khi dựng hạ tầng.
- [[digest-ticket-mcrsv-2026-08-12]] — mở khi một bàn đo tải ra số lạ: rate limiter theo IP của
  gateway có thể quyết định luôn con số baseline khi bắn từ một máy.
- [[2026-08-12-va-triet-de-saga-ticket]] — mở khi một ranh giới spec ("không sửa business logic")
  chặn đúng thứ phải sửa mới đo được.
- [[digest-ticket-mcrsv-2026-08-13]] — mở khi nghi một tính năng "hỏng gần đây": ở repo này cả một
  họ tính năng chưa bao giờ chạy được lần nào, và mock ở tầng client vẫn xanh.
- [[2026-08-13-commit-lockfile-ticket-mcrsv]] — mở khi một job CI "vẫn xanh" mà thật ra chưa từng
  chạy: repo ignore mọi lockfile thì `npm ci` chết ngay từ bước cài.
- [[digest-ticket-mcrsv-2026-08-14]] — mở khi một migration "đã chạy rồi" mà truy vấn vẫn trả rỗng:
  lỗi chữ hoa/thường của `V5` sinh ba hệ quả che nhau, và không bao giờ sửa migration đã chạy.
- [[digest-ticket-mcrsv-2026-08-17]] — mở khi định vá một lỗ rò tài nguyên bằng cách quét từng call
  site: ở đây vá cơ học đổi lỗ rò lấy oversell, và lời giải là một chokepoint kèm test tự grep
  source để chặn call site mới đi vòng.
- [[digest-ticket-mcrsv-2026-08-19]] — mở khi một agent báo "đã sửa" mà thay đổi biến mất, hoặc khi
  một file generated bị gitignore: verifier bị cấm chạy git vẫn `git checkout --` hai lần trong một
  phiên, và `.pb.go` sinh tay không tái tạo được ở checkout mới.
- [[digest-ticket-mcrsv-2026-08-20]] — mở khi định dựng lane agent ngoài Claude để chạy song song:
  bản `codex` nào dùng được, vì sao `cmux new-split` không thành lane riêng, và vì sao file marker
  thắng hook store; kèm bẫy suy luận "trạng thái X nghĩa là Y chưa xảy ra" lặp lần thứ ba.
- [[digest-ticket-mcrsv-2026-08-21]] — mở khi BRIEF đã hết task và mọi gate xanh: bắn thật một
  chuỗi end-to-end vẫn lòi ra 3 lỗ P0 (nặng nhất là bán trùng ghế đã trả tiền); kèm `env.example`
  sai cổng là bug thật chứ không phải chuyện tài liệu, và doc nói dối theo cả hai chiều.
- [[digest-ticket-mcrsv-2026-08-22]] — mở khi một gate/CI của chính mình đang là thứ quyết định
  PASS/FAIL: hai kiểu xanh giả trong một phiên, migration đã merge chưa bao giờ được áp lên DB dev,
  và `env.example` khai biến mà code không đọc.
- [[dong-bo-chan-luong-khong-phai-chuyen-hieu-nang]] — mở khi câu hỏi là "viết đồng bộ thì chậm
  đúng không?": trọng tâm sai — hậu quả nặng là mất việc âm thầm và gửi trùng, không phải chậm.

## Bối cảnh

- [[build-my-brain]] — project dựng chính brain này.
- [[dev-skills]] — area duy trì kỹ năng lập trình.

## Liên quan
- [[atomic-notes-principle]]
