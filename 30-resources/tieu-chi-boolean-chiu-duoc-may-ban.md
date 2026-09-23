---
type: resource
title: Tiêu chí boolean chịu được máy bận, tiêu chí thống kê thì không
summary: Máy tải nặng làm một phép kiểm boolean (file có đúng magic bytes không, endpoint có trả 200 không) *chậm* đi nhưng không sai; còn một tiêu chí dạng tỉ lệ (fail rate, p99, fps) thì cho ra con số SAI mà vẫn trông hợp lệ — nên khi hàng đợi task bị chặn bởi tài nguyên máy, phải tách hai loại ra thay vì chặn cả lô.
tags: [method, agent, tooling, automation, performance]
created: 2026-09-23
updated: 2026-09-23
source: [[digest-ticket-mcrsv-2026-09-23]] · project `ticket-mcrsv` — session history 2026-09-23 (ba task backend `97`/`137`/`145` cùng chặn ở một blocker máy)
---

# Tiêu chí boolean chịu được máy bận, tiêu chí thống kê thì không

Khi một hàng đợi task bị chặn vì máy hết tài nguyên, phản xạ là treo **cả lô**. Nhưng hai loại tiêu
chí phản ứng với máy bận theo hai cách khác hẳn nhau, và trộn chúng làm một là vừa chặn nhầm việc
chạy được, vừa cho phép chạy việc sẽ ra số rác.

| | Tiêu chí **boolean** | Tiêu chí **thống kê** |
|---|---|---|
| Ví dụ | PDF trả về có đúng magic bytes `%PDF` không · capture payment có sinh invoice không · gate exit 0 hay khác 0 | tỉ lệ fail qua ≥30 lần chạy · p99 latency · fps · thời gian build |
| Máy bận | **chậm** — kết quả không đổi | **sai** — và vẫn trông như một phép đo hợp lệ |
| Chạy được lúc máy 90% swap? | Có | Không |

## Vì sao phân biệt này đáng nhớ

Hỏng của loại thống kê là **hỏng im lặng và lâu dài**. Một tỉ lệ đo trên máy đang swap 90% không
báo lỗi, không đỏ gate — nó chỉ là một con số. Con số đó được ghi vào tài liệu tham chiếu, và agent
/người sau đọc nó như một sự thật đã đo, rồi thiết kế theo. Loại boolean không có đường hỏng đó:
nó chỉ tốn thêm thời gian.

Hệ quả thực hành: **điều kiện dừng phải gắn vào từng task, không gắn vào cả hàng đợi.** Task boolean
chỉ cần hạ tầng có mặt; task thống kê cần thêm một điều kiện về tải máy (ví dụ "free > 50%",
"swap < X%") và phải **tôn trọng điều kiện đó ngay cả khi đang có sức ép tiến độ** — bỏ qua nó
không làm task fail, nó làm task *thành công với số sai*.

## Nối với các luật đã có

- [[con-so-trong-tieu-chi-phai-kem-cach-do]] — một con số trong tiêu chí phải kèm cách đo. Note này
  thêm một tầng: **cách đo phải kèm điều kiện môi trường mà nó còn đúng**.
- [[bang-chung-phan-biet-duoc]] — một phép đo ra số trên máy bận không phân biệt được "hệ thống
  chậm" với "máy chậm", nên nó không kết luận được gì.
- [[phep-kiem-quan-sat-sai-tang]] — họ hàng gần: ở đó phép kiểm quan sát sai *tầng*, ở đây nó quan
  sát đúng tầng nhưng trong *điều kiện* làm số vô nghĩa.
- [[cham-viec-agent-nen]] — cùng chủ đề: tín hiệu tiện tay thường trả lời một câu hỏi khác.

→ [[digest-ticket-mcrsv-2026-09-23]] · [[brief-state-agent-loop]]
