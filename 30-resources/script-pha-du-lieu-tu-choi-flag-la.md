---
type: resource
title: Script phá dữ liệu phải từ chối flag lạ, vì mặc định an toàn là chỗ typo trốn vào
summary: Gõ `--appl` thay vì `--apply` làm script chạy dry-run và in ra đúng giọng "xong" — mặc định an toàn biến mọi typo thành một lượt chạy im lặng không làm gì; script sửa dữ liệu phải exit lỗi khi thấy flag không khai báo, và mọi flag đổi HÀNH VI phải được in lại trong header của lượt chạy.
tags: [tooling, backend, method, avada]
created: 2026-09-24
updated: 2026-09-24
source: project `subscriptions` — session history (session 65eb4665, script dọn dòng con contract parent-only)
---

Mẫu quen: script sửa dữ liệu prod mặc định **dry-run**, phải thêm `--apply` mới ghi. Mặc định đó
đúng — nhưng nó tạo ra một lỗ mà chính nó che:

> **Gõ sai tên flag = chạy dry-run, và không có gì phân biệt được với "chạy thật rồi không có gì phải
> sửa".**

Ca thật: `--appl` (thiếu `y`). Script chạy hết, in bảng kết quả, exit 0. Lần đó vô hại vì đang ở bước
kiểm. Nhưng hai kiểu typo khác trong cùng họ thì không:

| Typo | Hậu quả |
|---|---|
| `--appl` | không ghi gì, đọc thành "đã chạy, không có gì đổi" |
| `--all-childrenn` | ghi thật, nhưng **hẹp hơn ý định** — chỉ xoá dòng trong định nghĩa thay vì mọi dòng con, rồi báo thành công |

Loại thứ hai tệ hơn: nó chạy thật, có tác dụng thật, và con số nó in ra hợp lý — chỉ là ít hơn đúng.

## Luật

1. **Parse flag theo whitelist, thấy flag không khai báo thì `exit 1`.** Không có `process.argv`
   "đọc cái nào biết cái đó".
2. **Header của mỗi lượt chạy phải in lại toàn bộ flag đã được nhận diện, kèm mode.** `MODE: DRY-RUN`
   vs `MODE: APPLY` ở dòng đầu và dòng cuối. Người vận hành đọc dòng cuối.
3. **Flag đổi phạm vi (xoá cái gì, chạm bao nhiêu) phải in ra con số trước khi ghi**, để "ít hơn đúng"
   nhìn thấy được.
4. **Guard nào skip thì phải in ra đã skip cái gì và vì sao.** Một script "chạy xong" mà âm thầm bỏ
   qua đúng những bản ghi nặng nhất thì report của nó là bằng chứng vắng mặt —
   [[bang-chung-phan-biet-duoc]].
5. **Retry cho lỗi mạng và `THROTTLED`**, vì không có retry thì lỗi hạ tầng bị in ra dưới dạng lý do
   nghiệp vụ nghe rất hợp lý — [[loi-mang-bi-bao-thanh-ly-do-nghiep-vu]].

## Vì sao không chỉ là "cẩn thận hơn"

Lệnh loại này thường được gõ tay, một lần, dài vài dòng, có `set -a && . .env.local`, và người gõ
đang ở giữa một vụ khách phàn nàn. Đó đúng là hoàn cảnh sinh typo. Chặn bằng code thì hết là biến số —
cùng tinh thần với [[chan-agent-bang-cau-hinh]]: rào chắn là cấu hình, không phải lời nhắc.

Liên quan: [[digest-subscriptions-2026-09-24]] ·
[[2026-09-24-parent-only-xoa-het-dong-con]] · [[ack-khong-phai-hieu-ung]] ·
[[bang-chung-phan-biet-duoc]] · [[chan-agent-bang-cau-hinh]] ·
[[loi-mang-bi-bao-thanh-ly-do-nghiep-vu]]
