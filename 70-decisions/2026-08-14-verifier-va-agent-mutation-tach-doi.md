---
type: decision
title: Verifier vẫn không có Edit/Write — thí nghiệm ngược giao cho một agent mutation riêng
summary: Giữ nguyên verifier context sạch không sửa file, nhưng chuyển phần "phá code để đo test có bắt lỗi không" sang một agent riêng có Edit + kỷ luật `cp`/`md5` khôi phục, thay vì nới quyền cho verifier.
tags: [skills, method, debug]
created: 2026-08-14
updated: 2026-08-14
status: active
review: 2026-11-14
source: project "ticket-mcrsv" — session history 2026-08-13/14
---

# Quyết định

Brief của tôi vừa **cấm verifier sửa file** vừa **bắt nó tự làm thí nghiệm ngược**. Verifier không
có Edit/Write nên nó báo trung thực "chưa xác minh" — và một test vô dụng (assert helper qua
reflection thay vì assert call site thật) suýt lọt qua với verdict PASS.

Chốt: **không** cấp Edit/Write cho verifier. Tách làm hai lượt —
1. `verifier` (context sạch, chỉ đọc + chạy gate) ra verdict;
2. nếu verdict phụ thuộc vào "test này có thật sự bắt lỗi không" thì giao một **agent mutation
   riêng** có Edit: `cp` file ra scratchpad → phá → chạy gate → khôi phục → **kiểm bằng `md5`**.

Bổ sung cho [[2026-08-04-looptasks-verifier-doc-lap]] và [[2026-08-07-phan-tang-verifier]].

## Why

- Cái verifier bảo vệ là **context sạch + không có động cơ chữa cháy**. Cho nó quyền sửa file là
  mở đúng cánh cửa mà thiết kế ban đầu đóng lại: agent chấm bài có thể "sửa cho xanh".
- Thí nghiệm ngược là thứ **duy nhất** phân biệt "test xanh" với "test có guard". Phiên này H15
  chứng minh: đổi `eventId:` → `event_id:` mà 314 test vẫn xanh. Bỏ thí nghiệm ngược thì gate chỉ
  còn là nghi lễ.
- Brief tự mâu thuẫn thì agent trung thực sẽ chọn tuân lệnh cấm và báo "chưa xác minh" — nghĩa là
  **lỗi thiết kế brief lại hiện ra dưới dạng một dòng chú thích dễ bỏ qua**, không phải một FAIL ồn ào.

## Tradeoff

- **Tốn thêm một lượt agent** cho mỗi task cần chứng minh test, đúng lúc chi phí verify vốn đã
  tăng tuyến tính theo số bug ([[digest-pdf-2026-08-13]]).
- Agent mutation **có quyền sửa file thật** trong khi các task khác có thể đang giữ thay đổi chưa
  commit — rủi ro thật, đã xảy ra một lần ở phiên này (một agent chạy `git checkout -- <file>` và
  xoá mất diff của task khác). Nên kỷ luật `cp` + `md5` là bắt buộc, và `git checkout -- <file>` /
  `git stash` bị cấm tường minh trong brief.
- Kết quả thí nghiệm do agent mutation tự chạy vẫn là **tự chấm một phần** — phiên này phải thêm
  một context độc lập nữa để kiểm lại vòng sửa H62. Chuỗi có thể dài ra nếu không tự giới hạn.
- Phương án đã bỏ: cấp Edit cho verifier (rẻ hơn một lượt agent, nhưng phá đúng tính chất làm nên
  giá trị của nó).

Liên quan: [[digest-ticket-mcrsv-2026-08-14]] · [[bang-chung-phan-biet-duoc]] · [[looptasks-vs-workflow]] ·
[[2026-08-13-tach-gate-khoi-cham-tung-bug]] · [[chan-agent-bang-cau-hinh]]
