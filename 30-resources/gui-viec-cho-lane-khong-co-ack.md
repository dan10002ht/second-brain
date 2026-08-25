---
type: resource
title: Gửi việc cho lane qua TUI không có ack — im lặng nghĩa là chưa nhận, không phải đang làm
summary: Message gửi vào TUI của agent lane có ba cách chết im lặng (newline hiểu thành Enter nên chỉ nửa câu tới, paste dài kẹt trong ô nhập, lane treo 0% CPU) — nên sau mỗi lần giao việc phải xác nhận bằng ba tín hiệu độc lập chứ không coi việc đã giao là đã nhận.
tags: [agent, automation, skills, tooling]
created: 2026-08-25
updated: 2026-08-25
source: project "subscriptions" + "pdf" + "ticket-mcrsv" — session history 2026-08-25 (user yêu cầu ghi lại)
---

# Gửi việc cho lane không có ack

Gửi một message vào TUI của agent lane (`cmux send` → codex) **không phải một lời gọi API**. Không
có mã trả về, không có ack. Nó là mô phỏng gõ phím vào một ứng dụng khác — và bàn phím có thể trượt.

Trong một ngày, chuyện này xảy ra **ba lần ở ba project khác nhau** với ba hình dạng khác nhau:

| Hình dạng | Dấu hiệu trên màn hình | Hậu quả |
|---|---|---|
| Message **nhiều dòng**: newline bị hiểu là Enter | chỉ dòng đầu được submit, phần sau rơi vào turn mới hoặc mất | lane làm theo nửa câu, tưởng đã sửa xong |
| **Paste dài** kẹt trong ô nhập | `› Vò[Pasted Content 2012 chars]`, **không có spinner**, `Worked for 20m` là turn cũ | lane không chạy gì, tôi ngồi chờ một việc chưa từng bắt đầu |
| Lane **treo** | tiến trình codex 0% CPU, cây làm việc sạch, không có file report | hai message liên tiếp không khởi động được gì |

Cả ba đều **im lặng theo cùng một kiểu**: không có lỗi, chỉ có một lane trông như đang làm việc.

## Cách gửi để không dính

**Một dòng, trỏ vào file.** Viết chỉ thị dài ra file (`.lanes/round2-T13.md`) rồi gửi đúng một dòng
ngắn: `Vong 2: doc .lanes/round2-T13.md va lam theo. Rang buoc da DOI.` File chịu được xuống dòng,
TUI thì không. Ưu điểm phụ: chỉ thị còn lại trên đĩa để verifier và session sau đọc được.

## Cách xác nhận đã nhận

Không tín hiệu nào dưới đây đủ một mình — dùng ít nhất hai, và phải trả lời đúng câu
*"lane đã bắt đầu turn mới trên nội dung tôi vừa gửi chưa"*:

1. **Đọc màn hình lane**, thấy **nguyên văn** message của mình, không phải chữ trong ô nhập.
2. **Spinner đang chạy** — `Worked for Nm Ns` là tóm tắt turn **cũ**, không phải bằng chứng hiện tại.
3. **Lane tự tóm tắt lại phạm vi** hoặc nhắc tên file brief nó vừa đọc.
4. **mtime của file nguồn đổi** sau mốc gửi. Chụp mốc **trước** khi gửi — chụp sau thì "thay đổi"
   đã xảy ra trước khi có mốc so sánh và waiter treo vĩnh viễn.

Còn một cách chết trái ngược: đọc `report-T*.md` cũ mà tưởng là report vòng mới. Report **vẫn nguyên
bản cũ, không nhắc gì tới lỗi vừa giao** là dấu hiệu message không tới — không phải dấu hiệu lane
bất đồng ý kiến.

## Vì sao đáng ghi riêng

[[cham-viec-agent-nen]] nói về việc *đọc trạng thái* của việc đang chạy. Cái này ở bước trước đó:
việc có **được giao** hay không. Hai câu hỏi khác nhau, và câu thứ hai thường bị bỏ qua vì thao tác
gửi trông giống một lời gọi hàm thành công.

Cùng một họ với [[ack-khong-phai-hieu-ung]]: gửi đi không chứng minh nhận được. Ở đây thậm chí còn
không có cái ack nào để mà tin nhầm.

## Liên quan

[[cham-viec-agent-nen]] · [[ack-khong-phai-hieu-ung]] · [[brief-state-agent-loop]] ·
[[bang-chung-phan-biet-duoc]] · [[looptasks-vs-workflow]] ·
[[digest-subscriptions-2026-08-25]] · [[digest-pdf-2026-08-25]] · [[digest-ticket-mcrsv-2026-08-20]]
