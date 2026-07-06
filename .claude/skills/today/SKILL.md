---
name: today
description: Tạo daily note cho hôm nay trong 10-daily/, tự kéo carry-over + phát hiện đáng giữ từ note ngày gần nhất. Dùng đầu ngày để mở nhịp làm việc.
---

# /today — Daily note hôm nay

Tạo/mở daily note của hôm nay, prefill từ ngày làm việc gần nhất.

## Quy trình

1. **Xác định ngày hôm nay** từ currentDate trong context (định dạng `YYYY-MM-DD`).
2. **Nếu `10-daily/<hôm-nay>.md` đã tồn tại** → mở ra, đọc, tóm tắt nhanh trạng thái, dừng.
   Không ghi đè.
3. **Nếu chưa có** → tìm file daily gần nhất trước đó (sort tên giảm dần trong `10-daily/`).
4. **Tạo file mới** từ `10-daily/_template.md`:
   - Điền ngày vào title/frontmatter/heading.
   - **Kéo carry-over**: copy mục "➡️ Carry-over" của note gần nhất vào "🎯 Focus hôm nay".
   - Nếu note gần nhất có mục "Ghi chú / phát hiện" chưa được promote, nhắc user 1 dòng:
     "hôm qua có X phát hiện — có muốn promote thành note không?"
5. **Không cập nhật index.md** cho từng daily (chúng ephemeral, sẽ nhiều). Chỉ đảm bảo mục
   "📅 Daily (10-daily/)" trong index.md trỏ tới thư mục, không liệt kê từng ngày.
6. Báo lại đường dẫn + carry-over đã kéo. Ngắn gọn, mở bằng focus hôm nay.

## Nguyên tắc

- Daily note là ephemeral — không cần chín, không cần link nhiều.
- Việc quan trọng: kéo được carry-over để không rơi việc dang dở.
- Cuối tuần dùng (tương lai) `/weekly` để roll-up. Đầu ngày chỉ cần `/today`.
