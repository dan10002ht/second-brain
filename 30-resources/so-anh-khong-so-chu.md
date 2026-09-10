---
type: resource
title: So ảnh, không so chữ — text không phải bằng chứng cho giao diện
summary: Sáu worker và năm verifier cùng xác nhận một màn hình "khớp mockup" trong khi nó sai bố cục và có một section rỗng, vì tất cả đều so `document.body.innerText` với chữ trong mockup — đơn vị đo đó không chứa bố cục và không phân biệt được "có nội dung" với "có tiêu đề trên khoảng trống".
tags: [method, agent, debug, extensions]
created: 2026-09-10
updated: 2026-09-10
source: project `subscriptions` — session history 2026-09-10 (extension `customer-account-ui-wholefoods`, 11 task đã "xong")
---

Một extension đi qua **11 task, 6 worker, 5 lượt verify, gate xanh hết** rồi mới lộ ra là **mọi màn
đều sai**. Không ai làm ẩu: mỗi brief đều ghi *"match structure, order and wording — not fonts or
colours"*, và mỗi lượt verify đều so `document.body.innerText` với chữ trong file mockup. Chữ khớp
thật. Chỉ là chưa ai **nhìn** hai màn hình.

## Hai kiểu sai mà phép so chữ không thể thấy

| Kiểu | Ví dụ thật |
|------|-----------|
| **Bố cục bị coi là "lớp sơn"** | mockup `repeat(3, 1fr)` — build 2 cột; mockup `68% / 1fr` — build 50/50. Ba cột vs hai cột là **cấu trúc**, không phải trang trí. |
| **Container rỗng được tính là section đã render** | `innerText` có chuỗi `"Your weekly subscription"` ⇒ kết luận "section có mặt". Thực tế đó là **một tiêu đề trên khoảng không** — không một dòng sản phẩm nào. |

Ngoài ra, phép so chữ còn bỏ lọt: thiếu 4/8 phần tử trong mỗi card (ảnh sản phẩm, badge cửa sổ sửa,
`Delivers <weekday>`, subtotal), tab render bằng `<Text>` nên **không bấm được**, badge bị cắt cụt
(`10:00am Tu…`), và toolbar đáng lẽ thu sau một nút bánh răng thì lại nằm inline.

## Luật rút ra

- **Done-criteria của một màn hình là ảnh mockup đặt cạnh ảnh build, từng màn.** So chữ không phải
  bằng chứng. Nếu mockup là HTML tĩnh thì **render nó ra ảnh** rồi mới so — đọc HTML của nó rồi dừng
  ở đó chính là cái sai này.
- **Liệt kê state space trước khi chụp.** Mockup dạng SPA giữ mọi màn sẵn trong DOM, nên danh sách
  control lộ ra toàn bộ bề mặt tính năng: ở đây là 7 màn (`my`/`up` × `grid`/`list`, detail, order
  detail, history). Chụp thiếu một state là bỏ lọt cả một layout khác.
- **Ảnh chụp cũng nói dối nếu chụp quá sớm.** Hai lần kết luận "trắng hoàn toàn" / "kẹt vĩnh viễn"
  hoá ra là chụp trước khi render xong (một request mất 6,6 s vì gọi ước tính thuế cho **từng** order).
  Trước khi tin ảnh, phải assert trang đã render. → [[do-layout-shift-bang-browser-automation]]
- **Ảnh không đổi sau khi sửa ≠ bundle cũ.** Xem [[prop-sai-bi-bo-qua-im-lang]].

## Vì sao cả một dây chuyền cùng trượt

Đây không phải lỗi của một verifier. Tiêu chí *"structure, order, wording — not fonts or colours"*
được viết để miễn trừ **cái không đạt được** (font, màu chính xác trong customer account extension),
nhưng nó bị đọc thành miễn trừ **bố cục**. Khi một tiêu chí có phần miễn trừ, phần miễn trừ đó phải
liệt kê đích danh cái được bỏ qua, chứ không dùng một chữ khái quát ("skin", "cosmetic") — vì mọi
người sau đó sẽ xếp thứ bất tiện nhất vào chữ khái quát đó.

Cùng họ nhưng khác chỗ hỏng: [[phep-kiem-quan-sat-sai-tang]] nói về phép kiểm quan sát **sai tầng**;
note này nói về phép kiểm dùng **sai đơn vị** — text đo được nội dung, không đo được hình.

Liên quan: [[phep-kiem-quan-sat-sai-tang]] · [[bang-chung-phan-biet-duoc]] ·
[[do-layout-shift-bang-browser-automation]] · [[digest-subscriptions-2026-09-10]] ·
[[2026-08-27-he-thi-giac-chong-ai-slop]]
