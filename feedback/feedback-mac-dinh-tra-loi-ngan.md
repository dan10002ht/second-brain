---
type: feedback
title: Mặc định trả lời ngắn — dài là thứ phải được yêu cầu, không phải thứ mặc định
summary: dantt cắt độ dài tin nhắn ít nhất bốn lần trong hai ngày ("lúc nào cũng nhắn rất dài", "bạn nhắn dài quá", "viết dài thế rất khó đọc") — mặc định phải là câu trả lời đúng câu hỏi vừa hỏi, phần chi tiết chỉ mở ra khi được gọi.
tags: [feedback, method, writing, avada]
created: 2026-09-25
updated: 2026-09-25
source: project `subscriptions` — session history 2026-09-24/25 (`f4a437fd`, `b4c6162b`), và session `wholefoods-fonts`
---

# Mặc định trả lời ngắn

Bốn lần trong hai ngày, ở ba session khác nhau, cùng một lỗi:

> "trước mắt ở đây là do app lỗi hay do gì đã? ngắn gọn thôi **lúc nào cũng nhắn rất dài**, lúc nào
> tôi cần bạn đi chi tiết thì nhắn dài nhé?"

> "cái tôi quan tâm là ý muốn của merchant? **bạn nhắn dài quá**"

> "viết summary sao cho dễ đọc chứ? **bạn viết dài thế rất khó đọc** và nhận biết nó còn lỗi hay ko?"

> "ngắn gọn hơn bỏ tính chất kỹ thuật đi nhé" (soạn tin nhắn trả thread Slack)

Câu thứ nhất là câu định nghĩa: **dài là chế độ phải được bật, không phải chế độ mặc định.**

## Why

Ba câu trên đều rơi vào đúng lúc dantt đang cần **một quyết định**, không cần một bản điều tra:
"app lỗi hay không", "merchant muốn gì", "còn lỗi hay hết". Ở những lúc đó, mỗi đoạn bối cảnh thêm
vào là một lớp phải bới qua để tìm câu trả lời — nên bản dài **không phải là bản đầy đủ hơn, nó là
bản khó đọc hơn**. Lần thứ ba nói thẳng cái giá: không nhận biết được kết luận.

Và có một hệ quả nặng hơn độ dài: khi viết dài, tôi trả lời **câu hỏi của chính mình** (toàn bộ chuỗi
điều tra) thay vì câu dantt vừa hỏi. Bản dài che mất việc mình chưa trả lời đúng câu.

Không mâu thuẫn với [[feedback-tra-loi-trong-chat]] — ở đó luật là "phải nêu cơ chế, đừng đẩy sang
artifact". Cơ chế là phần **được giữ**; phần bị cắt là bối cảnh, quá trình điều tra, và những mục
không ai hỏi.

## How to apply

- Câu hỏi có/không hoặc "cái nào" → **trả lời ở câu đầu tiên**, rồi mới tới lý do trong 1–3 dòng.
  Không mở bài, không tóm tắt lại câu hỏi.
- Bản điều tra dài chỉ viết khi dantt gọi tên nó ("giải thích thêm", "step by step", "đưa bảng").
- Với **bảng trạng thái** (còn lỗi gì, contract nào): một hàng một mục, cột cuối là kết luận
  đọc-là-xong. Bỏ cột không dùng khi được bảo bỏ.
- Với **tin nhắn soạn cho người khác** (Slack, merchant, PO): mặc định bỏ chi tiết kỹ thuật, giữ
  nguyên nhân + việc đã làm + việc khách cần làm. Văn phong là của dantt, không phải của tôi.
- Nếu phần chi tiết thật sự cần tồn tại: đẩy nó vào note/MR description, không vào tin nhắn chat.

## Liên quan
- [[feedback-tra-loi-trong-chat]]
- [[write-shorter-notes]]
- [[digest-subscriptions-2026-09-25]]
