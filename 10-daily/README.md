# 10-daily/ — Daily notes

Nhật ký ngày. Mỗi ngày = 1 file `YYYY-MM-DD.md`.

## Vai trò trong brain

Đây là **nguyên liệu thô của nhịp làm việc**:
- Capture nhanh trong ngày (focus, việc đã làm, phát hiện, carry-over).
- Là nguồn để roll-up thành weekly / monthly review sau này.
- Ý đáng giữ trong mục "Ghi chú / phát hiện" → promote thành note atomic ở `notes/`.

## Cách dùng

- Sáng đầu ngày: chạy skill `/today` (tạo note hôm nay, kéo carry-over từ hôm qua).
- Hoặc thủ công: `cp _template.md $(date +%F).md`.
- Daily note là **ephemeral** — không cần chín. Cái gì đáng giữ thì link/promote đi nơi khác.

## Naming

`YYYY-MM-DD.md` — ví dụ `2026-07-06.md`. Không thêm slug.
