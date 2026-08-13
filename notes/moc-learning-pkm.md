---
type: note
title: MOC — Học tập & Quản lý tri thức cá nhân
summary: MOC — điểm vào chủ đề học tập & PKM, gom link tới các note liên quan.
tags: [moc, pkm, learning, index]
created: 2026-07-06
updated: 2026-08-13
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

## Bối cảnh

- [[build-my-brain]] — project dựng chính brain này.
- [[dev-skills]] — area duy trì kỹ năng lập trình.

## Liên quan
- [[atomic-notes-principle]]
