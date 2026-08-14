---
type: feedback
title: Debug thì phải query dữ liệu thật, đọc code chỉ là một nửa
summary: Khi truy root cause một ca production, không được dừng ở "đọc code rồi kết luận" — phải query dữ liệu prod để chứng minh, vì code chỉ dựng được giả thuyết.
tags: [feedback, debug, avada]
created: 2026-08-14
updated: 2026-08-14
source: project "subscriptions" — session history 2026-08-14
---

# Debug thì phải query dữ liệu thật, đọc code chỉ là một nửa

Nguyên văn khi tôi giao agent điều tra root cause "chỉ đọc code":

> "1. ko chỉ đọc code mà có thể query data prod nhé, tại vì đọc code cũng chỉ là 1 phần để debug thôi!!!"

**Why:** trong chính phiên đó, kết luận rút ra từ đọc code bị lật **ba lần liên tiếp**, và mỗi
lần lật đều do có người đi lấy dữ liệu thật: store kookut hoá ra đang **bật** `syncProductPrice`
trong khi giả định là tắt; "giá khớp catalog nên app ghi đúng" sụp khi đối chiếu lại
`variantId → product.title`; "thẻ chưa hết hạn" sai vì không ai nhìn ngày hôm nay. Code cho biết
đường đi *có thể* xảy ra; chỉ dữ liệu mới cho biết đường nào **đã** xảy ra ở shop này.

**How to apply:** với mọi task điều tra ca production, brief phải cấp quyền đọc prod ngay từ đầu
(read-only, cấm `--apply`/lệnh ghi) và **đòi bằng chứng là truy vấn**, không phải trích dẫn dòng
code. Kết luận dạng "code không có đường nào làm việc X" chỉ được ghi kèm câu hỏi "đã thử tìm bản
ghi chứng minh điều ngược lại chưa?". Trả lời merchant thì tách rõ **phần chắc chắn** (có số liệu
prod) khỏi **phần còn treo** — đừng gộp làm một.

Liên quan: [[bang-chung-phan-biet-duoc]] · [[digest-subscriptions-2026-08-14]] ·
[[feedback-khong-khep-viec-khi-con-khe-ho]] · [[subscriptions-debug-runbook]]
