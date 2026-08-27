---
type: decision
title: ticket-mcrsv — chống "AI slop" bằng hệ token + gate đếm được, không bằng lời dặn
summary: Chốt một hướng thị giác cụ thể (Dice/RA — ảnh làm chủ, chữ nén-đậm, góc sắc, nền trung tính) rồi biến nó thành gate đếm số trong CI, thay vì mô tả "làm đẹp" trong prompt; tách hẳn việc redesign 28 trang khỏi việc nâng cấp venue designer.
tags: [react, patterns, agent, method, tooling]
created: 2026-08-27
updated: 2026-08-27
review: 2026-11-27
source: project `ticket-mcrsv` — session history 2026-08-27 (đợt frontend F1–F14)
---

# Chống "AI slop" bằng hệ token + gate đếm được

## Bối cảnh

Yêu cầu ban đầu: *"tôi ko muốn bị vấn đề AI Slop, hiện tại UI AI viết rất khó chịu, bạn có gì để
design đẹp ko?"* — 28 trang đã tồn tại, nên đây là **thiết kế lại**, không phải viết mới.

Số đo đầu phiên: **7 file vượt 300 dòng** (4 file ở `org-events/` từ 640–709 dòng), **27 chỗ màu
hardcode**, **42 giá trị Tailwind tuỳ tiện**. Token hiện có: `--primary: oklch(0.457 0.24 277)`
(tím-indigo bão hoà), `--radius: 0.625rem` — đúng vẻ ngoài mặc định mà mọi sản phẩm AI-generated
đều mang.

## Quyết định

1. **Hướng thị giác: Dice/RA — ảnh làm chủ.** Chữ hiển thị nén-đậm, góc sắc 3px, nền trung tính
   không ám tím, accent cam-đỏ. Không card bo tròn + shadow, không medallion căn giữa.
2. **Hệ token trước, trang sau.** F1 dựng token + một trang `/design` làm bản mẫu sống; mọi trang
   sau tiêu thụ token, không tự chế màu.
3. **Gate `check-ui.sh` trong CI đếm ba chỉ số**: file >300 dòng, màu hardcode, giá trị Tailwind
   tuỳ tiện — mỗi lần đóng task thì **siết baseline** theo số mới.
4. **Tách hai dự án**: (A) hệ thị giác + redesign 28 trang, (B) nâng cấp venue designer 2D/3D.
   Gộp lại là gộp hai dự án khác nhau vào một.

Kết quả cuối đợt: file >300 dòng **1 → 0**, màu hardcode **19 → 12**, giá trị tuỳ tiện **35 → 11**
(phần còn lại tập trung hết trong `org-events/**`).

## Why

- **"Làm đẹp" trong prompt không kiểm được.** Mỗi lane sinh ra một cách hiểu riêng về đẹp, và
  không có bước nào trong quy trình bác được nó. Một con số thì bác được: `arbitrary_tailwind: 35`
  là một sự thật, không phải ý kiến.
- **AI slop có dấu hiệu đo được**, không chỉ là cảm giác: màu hardcode (không đi qua hệ thống),
  giá trị tuỳ tiện (`tracking-[0.12em]` gõ đại), file phình (không có ranh giới component). Đo ba
  cái đó là đo gần đúng cái người dùng đang phàn nàn.
- **Token phải có trước lane thứ hai.** Nếu bốn lane cùng chạy trước khi có token, mỗi lane tự chế
  một bảng màu và việc hợp nhất sau đó đắt hơn làm lại.
- **Gate đếm số cần baseline siết dần**, không cần về 0 ngay — cho phép landed từng phần mà vẫn
  không trôi ngược.

## Tradeoff

- **Gate không đo được cái quan trọng nhất.** Nó bắt được `tracking-[0.12em]` nhưng không bắt được
  một trang xấu dùng toàn token hợp lệ. Phần "nhìn tận mắt" vẫn là việc không uỷ quyền được — và
  chính nó tốn nhiều thời gian nhất phiên (cộng thêm một vòng đi sai vì cái thước hỏng, xem
  [[do-be-ngang-headless-chrome]]).
- **Mọi trang chạm token đều thành trang phải xem lại.** F1 đổi radius/màu toàn cục nên các task
  sau đều gánh rủi ro hồi quy thị giác.
- **Baseline siết dần dễ đóng băng nợ.** 12 màu hardcode còn lại nằm hết trong `org-events/**`;
  nếu không có task đóng dứt điểm thì con số đó sẽ sống mãi dưới danh nghĩa "baseline".
- **Chốt một hướng cụ thể là loại bỏ các hướng khác** — Dice/RA hợp một sản phẩm bán vé (khách nhớ
  poster chứ không nhớ nút), nhưng nếu sau này sản phẩm nghiêng về công cụ quản trị thì hướng
  ảnh-làm-chủ sẽ chống lại chính nó.

## Cần xem lại vào 2026-11-27

- Gate có còn đỏ được không, hay đã bị tự-allowlist? (xem [[gate-quet-ma-nguon-bang-ast]])
- 12 màu hardcode trong `org-events/**` đã về 0 chưa, hay baseline đã đóng băng chúng?
- Đã có bằng chứng thị giác nào cho các trang admin/org — vốn chỉ mở được qua bypass dev?

Liên quan: [[feedback-ui-component-300-dong-atomic]] ·
[[gate-hop-nhat-truoc-khi-merge]] · [[digest-ticket-mcrsv-2026-08-27]] ·
[[2026-08-24-cleanup-service-chua-dung-ticket-mcrsv]] · [[bang-chung-phan-biet-duoc]]
