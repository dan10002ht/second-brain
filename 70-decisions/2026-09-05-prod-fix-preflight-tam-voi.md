---
type: decision
title: prod-fix-preflight chia ranh giới theo TẦM VỚI của bug, không theo công nghệ
summary: Skill preflight vốn viết ra từ một sự cố billing và mang toàn bộ giả định của case đó (hot-zone chỉ billing/charge/contract/order, đo bằng BigQuery, rollback = git revert); nay đổi thành bảng 6 lớp bug theo bề mặt bị ảnh hưởng, ô "đo thiệt hại" thành công thức có trạng thái CHƯA ĐO hợp lệ, và ô rollback tách theo từng kênh deploy.
tags: [avada, subscription, skills, agent, tooling]
created: 2026-09-05
updated: 2026-09-05
status: active
review: 2026-12-05
source: repo `subscriptions` — git log 2026-09-04, commit `202032eec` + fact-check `d09f8b08b`, merge `aaa46d576` (!2527)
---

Bằng chứng: `202032eec` (3 file, **+638**: `SKILL.md` 194 dòng, `references/blast-radius-queries.md`
284, `references/preflight-template.md` 160), `d09f8b08b` (fact-check, sửa 2 claim CI sai), merged vào
master ở `aaa46d576` (!2527).

Thay đổi chính:

- **Ranh giới theo tầm với, không theo công nghệ**: bảng 6 lớp bug (billing, widget/theme ext, customer
  account UI, Shopify Function/extension, admin, email). *"Styling thôi mà"* không còn được miễn preflight
  khi thứ đang render nằm trên storefront đang bán hàng.
- **Ô 0 mới — prod đang chạy artifact nào**: extension chỉ lên qua CI khi title có `[deploy-extensions]`;
  functions có 2 path (tag đổi scope vs job master gate cứng); FE deploy vô điều kiện mỗi tag; widget kiểm
  bằng etag CDN.
- **Ô 4 từ mệnh lệnh sang công thức**: bảng chọn dụng cụ theo lớp bug + 3 trạng thái DO ĐƯỢC / CHẶN TRÊN /
  CHƯA ĐO. CHƯA ĐO phải gọi đích danh dụng cụ đã thử kèm lệnh + lỗi.
- **Ô 5 thành bảng rollback theo bề mặt**; **ô 3** sửa lệnh gate sai (`gates.sh` exit 2 không phải pass;
  `yarn test` ở root vốn không tồn tại).

## Why

- Skill sinh ra từ sự cố dedupe billing attempt 14/07 và thừa hưởng nguyên giả định của case đó. Đếm commit
  `fix` từ 01/05/2026: **fe 75 + storefront 32 + frontend 11 = 118** so với **be 86 + backend 20 = 106** —
  bug prod thật của repo phần lớn **không** nằm trong hot-zone cũ.
- Gate cũ không thể pass được với bug client-render: cả 3 bảng trong cookbook chỉ chứa contract/order **đã
  tạo**, còn thiệt hại của bug render nằm ở shopper thấy sai rồi bỏ đi — không sinh dòng nào để đếm. Cộng
  luật "ô nào trống → dừng" thành deadlock: không đo được, không được để trống, không được bịa.
- Bằng chứng gate bị bỏ qua trong thực tế, không phải suy đoán: skill viết 31/07 nhưng thư mục
  `docs/superpowers/preflight/` **chưa từng tồn tại**. Một gate không ai qua nổi là một gate không ai dùng —
  đúng họ với [[gate-tu-viet-la-nguon-xanh-gia]].
- Ví dụ đắt: `eb80b3013` (thiếu scheme ở `publicPath`) làm chết toàn bộ lazy chunk trên **mọi shop** và vẫn
  được xếp là "lỗi config/JS".

## Tradeoff

- **Skill dài hơn đáng kể** (638 dòng mới). Đổi độ phủ lấy chi phí đọc; nếu agent bỏ qua vì dài thì lại rơi
  về đúng trạng thái cũ — đây là thứ phải đo ở mốc review, không phải giả định là đã xong.
- **Chấp nhận trạng thái CHƯA ĐO.** Gate không còn chặn cứng khi không đo được thiệt hại — nó chỉ chặn quyết
  định *"fix gấp hay xếp sprint"*. Đánh đổi có ý thức: gate mềm mà chạy được hơn gate cứng bị bỏ qua, nhưng
  nó mở đường cho việc khai "CHƯA ĐO" cho tiện. Chốt chặn duy nhất là buộc gọi đích danh dụng cụ đã thử kèm
  lệnh + lỗi — cùng một luật với [[bang-chung-phan-biet-duoc]].
- **Rollback không còn là một câu.** Mỗi bề mặt một cơ chế: extension = release lại app version, kéo theo cả
  31 extension; widget = CDN `max-age=86400` nên deploy không tức thời; cờ nướng vào doc lúc install khác
  đánh giá lúc chạy. Đúng hơn, nhưng người dùng skill phải biết mình đang ở lớp nào trước đã.
- **Tài liệu tự nó là thứ có thể sai.** `d09f8b08b` phải sửa 2 claim CI **ngay ngày viết** (path master
  `production:deploy-functions` không build FE; trích dẫn dòng `publish-fe` lệch 1) — cùng rủi ro đã ghi ở
  [[truong-last-verified]].

Kiểm chứng đã chạy: 2 scenario baseline (widget hiện sai giá; nút Cancel im lặng trong New Customer Account)
điền được ô 4 ở trạng thái CHƯA ĐO mà không bịa query, ra đúng cơ chế rollback, hết deadlock. Verifier chạy
`gates.sh` (check/jest:fn/jest:as xanh) + đối chiếu 12 dữ kiện với repo thật; reviewer bắt 1 claim sai đã sửa.

Liên quan: [[subscriptions]] · [[shipped-subscriptions-2026-09-05]] · [[gate-tu-viet-la-nguon-xanh-gia]] ·
[[bang-chung-phan-biet-duoc]] · [[truong-last-verified]] · [[subscription-digest-2026-07-09]]
