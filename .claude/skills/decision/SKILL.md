---
name: decision
description: Ghi lại một quyết định quan trọng vào 70-decisions/ với Why + Tradeoff BẮT BUỘC. Dùng khi user vừa quyết định gì đáng nhớ (chọn tech, đổi hướng, bỏ phương án). Đặt review date +3 tháng.
---

# /decision — Log một quyết định

Ghi quyết định vào `70-decisions/` theo chuẩn brain. Mục tiêu: giữ lại **tại sao** và
**đánh đổi** để 3 tháng sau không phải re-derive.

## Quy trình

1. **Lấy nội dung quyết định** từ args hoặc hội thoại gần nhất. Nếu chưa rõ, hỏi ngắn gọn:
   quyết định gì? vì sao? đánh đổi gì? phương án nào đã loại?
2. **ENFORCE Why + Tradeoff.** Không được tạo file nếu thiếu một trong hai. Nếu user chưa
   nói, hỏi thẳng — đừng bịa.
3. **Tạo file** `70-decisions/YYYY-MM-DD-<slug>.md` từ `70-decisions/_template.md`:
   - `created`/`updated` = ngày hôm nay (xem currentDate trong context).
   - `review` = ngày hôm nay + 3 tháng.
   - `status: active`.
   - Slug ngắn, tiếng Việt không dấu hoặc tiếng Anh, kebab-case.
4. **Điền đủ**: Bối cảnh, Quyết định, Why, Tradeoff, Phương án khác đã cân nhắc.
5. **Gợi ý `[[links]]`** tới project/note/area liên quan (quét index.md nếu cần).
6. **Cập nhật `index.md`** — thêm mục "🧭 Decisions (70-decisions/)" nếu chưa có, thêm dòng
   `[[YYYY-MM-DD-slug]] — <1 câu>`.
7. Báo lại đường dẫn file + ngày review. Ngắn gọn.

## Nguyên tắc

- Decision note ≠ note thường. Không có Why + Tradeoff thì đừng dùng skill này — để ở `notes/`.
- Nếu quyết định này thay thế một decision cũ: set decision cũ `status: superseded` và thêm
  `**Thay bởi:** [[...]]`, decision mới thêm `**Thay cho:** [[...]]`.
