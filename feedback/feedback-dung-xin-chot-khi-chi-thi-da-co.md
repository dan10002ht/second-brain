---
type: feedback
title: Đừng xin chốt lại thứ mà chỉ thị đứng sẵn đã trả lời
summary: Khi user đã ra một chỉ thị bao trùm ("hoàn thiện nhất có thể, không làm qua loa"), việc dừng lại hỏi "anh chốt cái nào" cho hai việc rõ ràng nằm trong đó là đẩy quyết định ngược về phía user, không phải cẩn thận.
tags: [feedback, method, skills]
created: 2026-08-22
updated: 2026-08-22
source: project "ticket-mcrsv" — session history
---

Sau khi trình bày hai việc còn lại (port `ticket-service` gọi nhầm hai service khác, và vùng mù 17 README cấp service không được checker quét), tôi kết bằng một câu xin user chốt. User trả lời:

> "Bạn muốn tôi chốt cái gì chứ ?"

Chỉ thị đứng sẵn từ đầu phiên đã là: *"project này để học nên tôi muốn nó hoàn thiện nhất có thể, chứ không phải kiểu làm qua loa"*. Cả hai việc đều là **lỗi thật đã có bằng chứng**, đều nằm gọn trong phạm vi đó, và không có phương án nào đánh đổi để user cân.

**Why:** hỏi chốt chỉ có giá trị khi hai lựa chọn dẫn tới việc **khác nhau về bản chất** và user là người duy nhất quyết được (nghiệp vụ, ưu tiên, tiền, dữ liệu thật). Hỏi chốt một việc đã rõ đúng/sai thì không giảm rủi ro — nó chuyển gánh nặng suy nghĩ về phía user, làm chậm việc, và trên thực tế là một cách xin thu hẹp phạm vi. Cùng họ với [[feedback-khong-khep-viec-khi-con-khe-ho]].

**How to apply:** trước khi soạn một câu hỏi chốt, kiểm hai điều — (1) chỉ thị/ràng buộc user đã ra trước đó có trả lời sẵn không, (2) hai nhánh có thật sự đánh đổi nhau không. Nếu chỉ là "làm hay không làm một việc rõ ràng đúng" thì **tự quyết, làm, rồi báo kết quả**. Vẫn giữ nguyên các trường hợp phải hỏi: ghi vào dữ liệu thật của khách, gửi mail ra ngoài, xoá không lùi được, và quyết định nghiệp vụ kiểu "All nghĩa là gì" (phải hỏi BA). Hỏi thì vẫn hỏi ngắn, mỗi lần 1–2 lựa chọn.

Liên quan: [[digest-ticket-mcrsv-2026-08-22]] · [[feedback-khong-khep-viec-khi-con-khe-ho]] · [[feedback-khong-dung-vs-chua-lam-toi]]
