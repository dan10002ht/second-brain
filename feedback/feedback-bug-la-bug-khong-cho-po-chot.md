---
type: feedback
scope: agent
title: Bug là bug — đừng bê framing "cần PO chốt" từ report của agent khác
summary: Khi một report (của agent, của người khác) kết luận "cần PO quyết fix cho mọi shop hay không", phải tự soi lại bản chất trước khi nhắc lại — dòng và tổng trong cùng một widget chênh nhau là bug, và bug thì fix.
tags: [feedback, method, avada, agent]
created: 2026-09-14
updated: 2026-09-14
source: project `subscriptions` — session history 2026-09-14 (case SB-16764, session 4b3f8c93)
---

# Bug là bug — đừng bê nguyên framing của report khác

User nói nguyên văn:

> "ở đây là bug mà ? sao lại bảo fix cho mọi shop hay ko ? nếu là bug phải fix chứ ?"

Bối cảnh: case SB-16764 đã có một agent điều tra và viết report, trong đó kết luận là **"cần PO chốt
có fix cho mọi shop hay không"**. Tôi đọc report, xác minh được phần kỹ thuật bằng code thật, rồi
**nhắc lại luôn cái framing đó** mà không soi lại nó. Thực tế: dòng giá và tổng tiền **trong cùng
một widget** chênh nhau — đó là sai số học, không phải lựa chọn sản phẩm. Không có shop nào muốn số
của mình sai.

**Why:** framing đi kèm một kết luận thường được thừa kế im lặng. Verify được *dữ kiện* của report
mà không verify *cách nó đóng khung vấn đề* thì vẫn truyền tiếp nguyên một quyết định sai — và ở đây
cái giá là một bug số tiền nằm lại trên prod để chờ một cuộc họp không cần thiết. "Cần PO chốt" là
câu đúng cho **thay đổi hành vi có lựa chọn** (bật/tắt tính năng, đổi mặc định, đổi copy), không
phải cho **thứ đang sai**.

**How to apply:** khi tiếp nhận report/kết luận của agent khác hoặc của người khác:

1. Verify dữ kiện bằng code/dữ liệu thật (đang làm đúng).
2. **Rồi verify cả cách đóng khung**: đây là *sai* hay là *lựa chọn*? Nếu hai thứ trong cùng một màn
   mâu thuẫn nhau, hoặc kết quả trái với hợp đồng dữ liệu của chính app — đó là sai, và sai thì fix.
3. Chỉ hỏi PO khi câu hỏi thật sự là **phạm vi áp dụng của một lựa chọn**, không phải khi câu hỏi là
   "có nên để sai tiếp không".
4. Nếu vẫn thấy cần hỏi: nói rõ **đây là bug**, và hỏi về *thứ tự ưu tiên / thời điểm ship*, chứ
   không hỏi *có fix hay không*.

Liên quan: [[digest-subscriptions-bird-2026-09-14]] · [[bang-chung-phan-biet-duoc]] ·
[[feedback-dung-xin-chot-khi-chi-thi-da-co]] · [[cham-viec-agent-nen]] ·
[[feedback-khong-khep-viec-khi-con-khe-ho]] · [[feedback-ra-het-duong-verify]]
