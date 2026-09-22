---
type: feedback
scope: agent
title: "Không verify được" chỉ nói sau khi đã rà hết đường — một công cụ bị chặn không phải kết luận
summary: Dừng ở "extension Chrome không kết nối" rồi báo là không chạy được kiểm thử trên trang thật, trong khi skill `agent-browser` vẫn dùng được — công cụ đầu tiên hỏng là tín hiệu đổi đường, không phải kết luận về khả năng verify.
tags: [feedback, method, tooling, debug]
created: 2026-09-14
updated: 2026-09-14
source: project `subscriptions` — session history 2026-09-14 (verify SB-16764 trên prod, session 4b3f8c93)
---

# "Không verify được" phải là kết luận sau khi rà hết đường

User nói nguyên văn:

> "ủa bạn ko dùng được playwright mcp hay agent-browser à ?"

Bối cảnh: cần xác minh bản fix đã live chạy đúng trên storefront thật. Extension Chrome không kết
nối → tôi chuyển sang soi asset đã deploy bằng HTTP, đào bundle minified, rồi báo cáo *"đây là những
gì tôi thật sự verify được và những gì không"*. Danh sách "không" đó **sai** — `agent-browser` vẫn
dùng được, và khi mở trang thật thì verify được đầy đủ đến tận thao tác cuối (untick selling plan →
badge giảm giá biến mất, tổng khớp từng dòng).

Cùng lỗi này đã xảy ra một lần nữa trong ngày ở phiên portal Wholefoods: tuyên bố "surface không hỗ
trợ nét đứt" khi mới đọc `Divider`, trong khi `View` có `border: 'dashed'`.

**Why:** một danh sách "không verify được" là bằng chứng vắng mặt do chính mình tạo ra
([[bang-chung-phan-biet-duoc]]). Nó được người đọc tin như một giới hạn của hệ thống, trong khi thực
tế nó chỉ ghi lại **công cụ đầu tiên tôi thử bị hỏng**. Chi phí sai lệch là bất đối xứng: thử thêm
một đường tốn vài phút, còn báo sai làm mất một vòng nhắc và để bản fix lên prod không ai nhìn tận
mắt.

**How to apply:** trước khi viết bất kỳ câu nào dạng "không verify được / không hỗ trợ / không có
cách":

1. Liệt kê **tất cả** đường còn lại cho đúng việc đó — skill sẵn có (`agent-browser`, MCP), CLI,
   HTTP trực tiếp, đọc từ nguồn chuẩn bằng đường khác đường vừa ghi.
2. Thử ít nhất đường thứ hai. Một công cụ chết là tín hiệu đổi đường, không phải kết luận.
3. Nếu vẫn không được: viết ra **đã thử những gì và mỗi cái chết ở đâu**, chứ không viết "không
   verify được".
4. Với câu "platform không hỗ trợ X": quét toàn bộ component/API có thể làm X, không chỉ cái mang
   đúng tên X.

Liên quan: [[bang-chung-phan-biet-duoc]] · [[feedback-khong-khep-viec-khi-con-khe-ho]] ·
[[prop-sai-bi-bo-qua-im-lang]] · [[digest-subscriptions-bird-2026-09-14]] ·
[[digest-subscriptions-2026-09-14]] (ca `Divider` nét đứt) · [[feedback-bug-la-bug-khong-cho-po-chot]] ·
[[feedback-debug-phai-query-data-that]]
