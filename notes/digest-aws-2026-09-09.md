---
type: note
title: Digest aws — 2026-09-09 (dựng course Game Server 42 bài, subagent viết bài + main agent tính lại từng số)
summary: Course mới trong repo học tập được viết bằng subagent chạy song song, còn main agent tự tính lại mọi con số trước khi commit — bắt được một lỗi sai 10 lần (`0,17%` đáng ra `1,67%`) mà gate/SVG/build đều không thấy; và hook chặn commit thẳng `main` chứng minh một ghi nhớ cũ đã lỗi thời.
tags: [aws, learning, agent, tooling, method]
created: 2026-09-09
updated: 2026-09-09
source: project `aws` — session history (session 092f4c54, course `gameserver` chương 1–2)
---

Phiên này bắt đầu bằng một việc **của repo khác**: session `game-server` giao viết lại lesson 02 qua
cross-session message (chi tiết ở [[digest-game-server-2026-09-09]]). Xong việc đó, dantt yêu cầu làm
**course Game Server ngay trong repo `aws`** — đây mới là phần thuộc về repo này.

## Context — repo học tập lớn hơn README của nó nói

Rà thực tế: **27 course đăng ký / 336 bài**, README đã lỗi thời so với registry của web app. Chỗ hổng
thật không nằm ở chỗ tôi đoán ban đầu. Course mới lập lộ trình ở `roadmap/gameserver.md`: **42 bài /
10 chương**, xếp thành dây suy diễn chứ không phải danh sách song song.

Convention của repo (phải bám, không chế thêm): bài = `lessons/<course>/<slug>.md`, markdown thuần,
**không frontmatter**; khung `## 1. Mục tiêu` → `## 2. Lý thuyết` → …; sơ đồ là **SVG** và repo có
gate `check-svg`; `tsc --noEmit` + `next build` là gate thật. Bài chưa viết degrade thành trang
placeholder 37 KB, không crash build — nên "build xanh" **không** chứng minh bài đã có.

## Techniques

**Giao subagent viết bài, main agent tự tính lại từng con số.** Đây là yêu cầu của dantt ("đưa các
sub agent sinh bài thay vì làm đầy context của main session") và nó có giá đo được: verify độc lập
bắt được một agent khai `8,2cm / 4,9m = 0,17%` — **sai 10 lần**, đúng phải là `1,67%`. Không gate nào
bắt được loại lỗi này: SVG hợp lệ, id không trùng, `tsc` sạch, `next build` xanh. Với nội dung dạy
học thì **số là hợp đồng**, và cách kiểm duy nhất là tính lại. → [[bang-chung-phan-biet-duoc]] ·
[[cham-viec-agent-nen]].

**Brief dùng chung quyết định có slop hay không.** 9,8 KB brief viết một lần rồi giao cho 4 agent
chạy song song: template 6 nhịp, cấm emoji trang trí và câu sáo, sơ đồ ASCII/SVG chứ không gen ảnh,
số thập phân dùng dấu phẩy, chỗ không chắc phải ghi rõ là ước lượng.

**Hai trong bốn agent tự sửa lại brief của tôi — và đúng.** Một agent phát hiện một con số trong brief
**không tái tạo được** và thay bằng số nó tự đo, có chú thích lần chạy trước. Đó là hành vi đúng: brief
là giả thuyết, phép đo mới là nguồn. Soát chéo giữa 4 bài viết song song (chúng không thấy nhau) cũng
là bước bắt buộc — kiểm trùng id SVG và mâu thuẫn số giữa các bài.

**Hook là hiện tại, ghi nhớ là quá khứ.** Hook chặn commit thẳng `main` ở repo này, trái với một ghi
nhớ cũ của tôi ("aws: push thẳng main được"). Theo hook, tạo nhánh `feat/gameserver-course` — rồi sửa
lại ghi nhớ đã sai thay vì để nó tiếp tục sai. Khi cấu hình thực thi và trí nhớ mâu thuẫn, cấu hình
thắng và trí nhớ phải được cập nhật ngay lượt đó.

## Con số đắt nhất của chương 1–2

Giữ lại vì chúng là lý do các thể loại game chọn kiến trúc khác nhau, và đều đã tự tính:

- **Lockstep rẻ hơn client-server 500 lần và không phụ thuộc số unit** — đó là lý do RTS không bao giờ
  chọn client-server.
- **Doom lockstep tốn 2,24 kbps** — vừa một modem 2400 baud.
- Lag compensation ở RTT 200 ms tua ngược 200 ms, đúng lúc nạn nhân đã chạy được ~1 mét.

Tiến độ: **8/42 bài, 2/10 chương**, đã lên `main` (chương 1 `6df4c3d`, chương 2 `3ce8105`), commit
theo từng chương.

Liên quan: [[aws]] · [[digest-game-server-2026-09-09]] · [[digest-aws-2026-08-18]] ·
[[cham-viec-agent-nen]] · [[bang-chung-phan-biet-duoc]]
