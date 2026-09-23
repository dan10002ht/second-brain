---
type: note
title: Digest claude-chat — 2026-09-23 (vá collection Postman TikTok: path và param được validate TRƯỚC khi check token)
summary: TikTok Shop trả `36009009 Invalid path` và cả lỗi thiếu param trước khi kiểm `access_token`, nên một token đã hết hạn vẫn đủ để validate toàn bộ đường dẫn và tham số của một collection; `105002` là token hết hạn chứ không liên quan Postman web; và newman bắt được một lỗi mà đọc script không thấy — dấu `/` cuối path bị nuốt làm `bc/get` trả 404.
tags: [http, auth, tooling, method, debug]
created: 2026-09-23
updated: 2026-09-23
source: project `claude-chat` — session history (session 43fcc43a, collection `Abbott O2O.postman_collection.json`)
---

# Digest — `claude-chat`, 2026-09-23

Việc: một collection Postman v2.1 (15 request, TikTok Shop API + TikTok Business/TTMS) không chạy
được. Phần đáng giữ không phải chuyện vá file, mà là **thứ tự validate của API** và cách kiểm chứng.

## Techniques

**Thứ tự validate của API quyết định bạn kiểm được gì khi không có credential sống.** TikTok Shop
trả `36009009 Invalid path` **trước khi** động tới `access_token`, và phần kiểm tham số bắt buộc
cũng chạy trước auth. Hệ quả rất dùng được: với đúng một token đã hết hạn vẫn **validate được toàn
bộ** path + tham số bắt buộc của cả collection. Nhờ đó tìm ra `Statements` sai hai chỗ cùng lúc:
phải là `/finance/202309/` (không phải `202501`) và **bắt buộc** có `sort_field`.

Luật rút ra, dùng được cho mọi API lạ: **trước khi đi xin credential mới, hãy hỏi API còn trả lời
được câu gì khi chưa có credential.** Nhiều hợp đồng (path, tên param, enum) kiểm được miễn phí.

**Chạy thật bằng newman, đừng đọc script ký.** Script ký lại request "đọc thì đúng" nhưng newman
chạy thật phát hiện nó **nuốt dấu `/` cuối path** → `bc/get` trả 404, vì endpoint đó bắt buộc có
trailing slash. Loại lỗi này không lộ ra khi review code, chỉ lộ khi có một lượt gọi thật. Cùng họ
với [[ack-khong-phai-hieu-ung]] và [[gate-tu-viet-la-nguon-xanh-gia]].

**Dò endpoint thì dò có giới hạn, rồi dừng và ghi rõ.** 39 biến thể path cho 3 request
audience/trend đều `Not Found` ⇒ **không bịa endpoint**, để placeholder kèm ghi chú thay vì điền một
đường dẫn nghe hợp lý. Đây là chỗ dễ sinh tài liệu sai nhất.

## Context

- `105002 Expired credentials` là **token hết hạn**, không liên quan gì tới Postman web hay tới chữ
  ký `sign` — cả ba token TikTok Shop đều hết hạn, xác nhận bằng lượt gọi thật tới endpoint nhẹ
  nhất (`/authorization/202309/shops`).
- Token **TTMS (TikTok Business API)** còn sống trong khi token TikTok Shop đã chết — hai hệ auth
  riêng, nên "collection không chạy" là hai vấn đề khác nhau bị gộp làm một. 5/5 request Business
  API trả 200 sau khi lấy `advertiser_id` thật từ Business Center.
- File gốc **giữ nguyên không đụng**, bản vá ghi ra file mới + tách secret sang file environment
  riêng — xem [[feedback-khong-in-secret-ra-chat]].

## Liên quan

[[digest-claude-chat-2026-07-17]] · [[ack-khong-phai-hieu-ung]] ·
[[gate-tu-viet-la-nguon-xanh-gia]] · [[bang-chung-phan-biet-duoc]] ·
[[feedback-khong-in-secret-ra-chat]]
