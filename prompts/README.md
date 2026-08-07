# prompts/ — prompt của các job tự động

Mỗi job headless (`claude --print`) nạp prompt từ đây qua `render_prompt` trong
`bin/_brain.sh`, thay vì nhúng heredoc trong bash.

| File | Job dùng |
|------|----------|
| `digest.md` | `bin/brain-digest` (19:00 hằng ngày) |
| `gitlog.md` | `bin/brain-gitlog` (06:00 hằng ngày) |
| `weekly.md` | `bin/brain-weekly` (18:00 Chủ nhật) |
| `learn.md` | `bin/brain-learn` (gọi từ `brain-sync` 20:00) |
| `compact.md` | `bin/brain-compact` (mùng 1 hằng tháng) |
| `review.md` | `bin/brain-review` (thứ Hai hằng tuần) |

## Luật

1. **Biến viết bằng `{{TÊN_HOA}}`.** Không dùng `$VAR` — template không đi qua shell.
2. **Placeholder sót lại làm job dừng.** `render_prompt` exit != 0 nếu còn `{{...}}`
   chưa thay. Thà không chạy còn hơn gửi prompt khuyết rồi nhận kết quả sai.
3. **Backtick, `$`, dấu nháy dùng thoải mái** — thay thế là literal, không phải
   shell expansion. Đây chính là lý do tách file: heredoc không quote từng làm
   `` `type:` `` bị chạy như lệnh và prompt gửi đi bị mất chữ suốt nhiều tuần.
4. **Mọi template PHẢI có `{{DRY_RUN_NOTE}}`** ở cuối — job chèn chỉ dẫn dry-run
   vào đó, hoặc chuỗi rỗng khi chạy thật.
5. Sửa prompt là thay đổi hành vi hệ thống → commit riêng, diff đọc được.
