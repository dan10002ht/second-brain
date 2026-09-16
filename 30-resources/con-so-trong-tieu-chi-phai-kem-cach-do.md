---
type: resource
title: Một con số trong tiêu chí là lời khai, không phải phép đo
summary: Bốn lần trong cùng một dự án, một con số ai cũng tin ("legend 5 bậc", "giá đủ 5 bậc", "vùng chạm 44px") hoá ra chưa bao giờ đúng — chúng sống sót mọi vòng verify vì code có KHAI BÁO đúng con số đó, mà không ai đo xem người dùng có chạm được nó không.
tags: [method, debug, agent, project]
created: 2026-09-16
updated: 2026-09-16
source: [[digest-ticket-mcrsv-2026-09-16]] · [[digest-ticket-mcrsv-2026-09-15]] · project `ticket-mcrsv` (F33, F35, F48, F56/F58)
---

# Một con số trong tiêu chí là lời khai, không phải phép đo

Bốn ca, cùng một hình dạng:

| Con số | Vì sao ai cũng tin | Sự thật khi đo |
|---|---|---|
| Heat-map **5 bậc** | legend vẽ đủ 5 ô màu | `getPriceColor` chỉ trả 4 nhánh — `mid` không bao giờ đạt tới trừ khi `max <= min` |
| Pricing **đủ 5 bậc** | seed có 5 giá khác nhau | phân bố lệch: `700k` ở ratio `0,163` rơi cùng bậc với `350k` ⇒ chỉ ra 4 màu |
| Vùng chạm **44px** | handle khai `stroke-width=44`; có hẳn một assertion tên *"lost part of its 44px touch target"* | hit-test thật ra **36,7px**; hai handle cách nhau 28,96 CSS px nên hai dải 44px **bất khả thi về hình học** |
| Bundle "vượt 14–25 lần" | so file trong `static/` | những file đó là **dev build cũ**, không minify — xem [[do-kich-thuoc-bundle]] |

Cả bốn đều **không phải hồi quy**. Chúng có từ đầu, đi qua nhiều vòng worker + verifier, và không
vòng nào đỏ được — vì phép kiểm chạy trên **chính lời khai**: legend có 5 ô, thuộc tính ghi 44,
hằng số ghi 5.

## Điểm phân biệt

"Code khai N" và "người dùng chạm được N" là **hai mệnh đề khác nhau**. Phép kiểm đọc mệnh đề thứ
nhất không nói gì về mệnh đề thứ hai — nó không sai, nó trả lời câu hỏi khác
([[phep-kiem-quan-sat-sai-tang]]).

Còn một biến thể tệ hơn: tiêu chí **bất khả thi về toán học**. "5 giá seed ⇒ 5 token màu" không thể
đạt được với bộ seed lệch, nên worker sẽ hoặc báo `failed` (đúng), hoặc lặng lẽ fudge số cho xanh
(sai mà trông đúng). Người viết tiêu chí có nghĩa vụ tự tính trước.

## Luật

> Mọi tiêu chí nghiệm thu chứa một con số phải trả lời được **hai** câu: *đo bằng cách nào*, và *máy
> này đo được không*. Không trả lời được thì nó là lời khai, không phải tiêu chí.

Kèm theo:

- Khi tiêu chí là một con số, viết luôn **phép đo** vào brief — hit-test, computed style, raycast
  trên geometry đang shipping — chứ không viết "đảm bảo N".
- Tự tính thử tiêu chí trên dữ liệu thật **trước khi giao**. Nếu nó bất khả thi, worker sẽ mất một
  vòng để chứng minh điều đó cho bạn.
- Worker báo `failed` đúng theo chữ của tiêu chí là **hành vi cần giữ**. Quyết định sửa tiêu chí hay
  sửa code là việc của người điều phối, không phải của worker.
- Dựng bằng chứng cho "có phải hồi quy không" bằng đường rẻ nhất trước: `git diff <base> HEAD -- <2
  file cai quản hành vi đó>` rỗng là bằng chứng mạnh hơn cả một lần chạy lại probe.

Liên quan: [[bang-chung-phan-biet-duoc]] · [[phep-kiem-quan-sat-sai-tang]] · [[so-anh-khong-so-chu]] ·
[[gate-tu-viet-la-nguon-xanh-gia]] · [[do-kich-thuoc-bundle]]
