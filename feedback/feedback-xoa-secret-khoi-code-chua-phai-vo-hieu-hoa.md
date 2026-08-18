---
type: feedback
title: Dọn secret hardcode thì phải chốt danh sách rotate, không dừng ở việc xoá code
summary: Xoá secret khỏi code + tạo MR chưa phải là fix — giá trị cũ còn trong git history và còn hiệu lực; phải rà lại danh sách, probe xem cái nào còn sống, xếp thứ tự rotate và báo team.
tags: [feedback, auth, avada, backend]
created: 2026-08-18
updated: 2026-08-18
source: project "pdf" — session history 2026-08-18 (user turn nguyên văn)
---

# Dọn secret: xoá code chưa phải là vô hiệu hoá

Nguyên văn yêu cầu:

> "xoá khỏi code thôi chưa đủ đâu nhé — mấy cái shopify-access-token / gcp-api-key / jwt
> trong list vẫn còn nguyên trong git history (checkout commit cũ là lôi ra đc), và quan
> trọng hơn là bản thân token vẫn còn hiệu lực. ai đã thấy giá trị cũ thì vẫn xài đc bình
> thường, nên xoá dòng code ko làm nó hết nguy hiểm. […] a rà lại list rồi chốt cái nào
> rotate trc, báo lại team sau nhé."

**Why:** một finding secret có hai mặt — *nguồn rò rỉ* (dòng code) và *giá trị đang sống*.
Xoá code chỉ đóng mặt thứ nhất; kẻ đã đọc được vẫn dùng bình thường, và git history vẫn
phát lại giá trị đó cho bất kỳ ai checkout commit cũ. Khép việc ở bước "đã tạo MR" là báo
xong một việc mới làm một nửa.

**How to apply:** khi được giao dọn secret, deliverable **không** chỉ là MR mà là MR **+
danh sách rotate có thứ tự**. Cụ thể:

1. Đọc thật các file được báo, đừng tin số finding của scanner — thường còn secret khác
   không match pattern nào (grep theo **công dụng**, không theo tên biến mình đoán).
2. Probe read-only từng credential xem còn sống không, **đúng đường mà app dùng**, và
   **không in giá trị ra chat**.
3. Với mỗi cái: rotate thì gãy cái gì, phải đổi ở những chỗ nào, thứ tự ra sao. Phân biệt
   secret thật với định danh công khai — xem [[api-key-cong-khai-khong-phai-secret]].
4. Báo lại danh sách để anh chốt và thông báo team; **đừng tự bấm** thao tác không lùi được.

Liên quan: [[feedback-khong-khep-viec-khi-con-khe-ho]] · [[bang-chung-phan-biet-duoc]]
