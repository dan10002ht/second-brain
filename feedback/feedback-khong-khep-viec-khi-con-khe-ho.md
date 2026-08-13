---
type: feedback
title: Đừng khép việc khi khe hở vẫn còn
summary: Khi còn một lỗ đã biết, không được đề xuất đóng task bằng lý lẽ "đủ tốt rồi" — làm chuẩn để dự án là một standard, không làm ít cho xong.
tags: [feedback, method, skills, avada]
created: 2026-08-13
updated: 2026-08-13
source: project "ticket-mcrsv" — session history (8c7111d4, H16 vòng 8)
---

# Đừng khép việc khi khe hở vẫn còn

Sau 8 vòng vá lỗ rò token qua log, tôi đề xuất đóng task với lập luận "hướng đã đạt
mục tiêu, khe còn lại nhỏ". User bác thẳng:

> *"ở đây đừng nghĩ đến việc bỏ qua khi chưa giải quyết được vấn đề nhé"*

và trước đó đã đặt sẵn thanh chất lượng:

> *"làm sao để dự án best practice thay vì làm ít nhé, cần làm chuẩn sao cho nó là 1
> standard để sau này nhìn vào ừ đây là 1 project tốt!!"*

Vòng 9 đổi cách tiếp cận (regex → AST) và đóng được thật.

**Why:** khi tôi đề xuất khép, tôi đang dựa vào **phán đoán của mình** rằng khe còn
lại không quan trọng — đúng loại tự-chấm mà cả quy trình verifier sinh ra để tránh.
Khe đã biết mà bỏ qua thì nó không biến mất, nó chỉ ngừng được nhắc tới và đóng băng
thành "chỗ đó vốn thế". Trong ca này khe còn lại là **rò token thật**, và cái chặn
được nó không phải cố thêm một vòng vá cùng kiểu, mà là **đổi hẳn cách tiếp cận** khi
đã fail 3 lần liên tiếp cùng một hướng.

**How to apply:**

- Fail 2–3 vòng liên tiếp ở cùng một hướng = tín hiệu **cách tiếp cận sai**, không
  phải "cần thêm một vòng nữa". Dừng vá điểm, đổi cơ chế (ví dụ: quét text → AST).
- Không đề xuất đóng task khi còn một lỗ **đã biết và mô tả được**. Nếu thật sự
  không làm nữa thì phải là quyết định của user, ghi rõ vào `70-decisions/` kèm
  Tradeoff — chứ không phải một câu "đủ tốt rồi" trong báo cáo.
- Khi đưa hai lựa chọn mà thật ra có một câu trả lời đúng, hãy nói câu trả lời đúng.
  User đã nhắc riêng chuyện này: *"Fix sao cho best practice chứ ???"*.
- Không đồng ý với verifier thì nói rõ vì sao — nhưng bất đồng về **mức độ** không
  phải lý do để đóng khi bản thân lỗ vẫn được xác nhận là thật.

## Liên quan
- [[digest-ticket-mcrsv-2026-08-13]]
- [[gate-quet-ma-nguon-bang-ast]] — chính lần "đổi cơ chế" đã đóng được khe hở này.
- [[bang-chung-phan-biet-duoc]]
- [[2026-08-04-looptasks-verifier-doc-lap]]
- [[feedback-follow-conventions]]
