# 70-decisions/ — Decision log

Nhật ký các quyết định quan trọng. Mỗi quyết định = 1 file.

**Quy tắc bất di bất dịch:** mỗi decision PHẢI ghi rõ **Why** + **Tradeoff**.
Không có 2 field này → không phải decision note, chỉ là ghi chú thường (để ở `notes/`).

## Vì sao cần

Bạn (và Claude) 3 tháng sau sẽ quên *tại sao* đã chọn cái này. Decision log giữ lại
lý do + đánh đổi để không phải re-derive, và để review khi bối cảnh đổi.

## Cách dùng

- Tạo file: `cp _template.md YYYY-MM-DD-<slug>.md` (hoặc dùng skill `/decision`).
- `status`: `active` → `superseded` (khi có quyết định mới thay) → hoặc `revisit` (đến hạn xem lại).
- Đặt `review` mặc định +3 tháng kể từ `created`.
- Superseded thì link tới decision mới: `**Thay bởi:** [[...]]`.

## Naming

`YYYY-MM-DD-<slug-ngắn>.md` — ví dụ `2026-07-06-dung-sqlite-vec-cho-search.md`.
