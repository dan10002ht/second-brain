---
name: slack
description: Gửi/đọc/tìm tin nhắn Slack và react/upload file bằng Avada user token (xoxp-...). Dùng khi user muốn gửi tin nhắn Slack, tìm tin cũ, đọc lịch sử kênh, thả emoji, hoặc share file lên Slack. Hành động hiện dưới danh nghĩa chính user.
---

# /slack — Dùng Slack bot (user token) qua helper `bin/slack`

Điều khiển Slack bằng **user token** (`xoxp-...`) của Avada. Helper: `bin/slack`
(Python, chuẩn thư viện, không cần cài gì). Nguồn: notes.avada.net/KJSEg65ZL1.

## ⚠️ An toàn — đọc trước

- Token là **user token**: mọi hành động (gửi, react, tìm) hiện **như chính user làm** trên Slack.
- Token **không hết hạn** trừ khi revoke. Coi như mật khẩu.
- KHÔNG in token ra chat, KHÔNG commit, KHÔNG log. Lộ → báo admin revoke + reissue.
- Trước khi **gửi tin / react / upload** (hành động ra bên ngoài): xác nhận với user
  nội dung + channel trước, rồi mới chạy. Đọc/tìm (whoami/search/history) thì cứ chạy.

## Setup (lần đầu)

1. User lấy token tại `https://slack-oauth.avada.net/slack/install` → nhấn **Allow** → copy `xoxp-...`.
2. Lưu vào file (chmod 600), KHÔNG vào repo:
   ```bash
   mkdir -p ~/.config/avada && umask 177
   printf '%s' 'xoxp-...' > ~/.config/avada/slack
   ```
   (Hoặc `export SLACK_TOKEN=xoxp-...` trong `~/.zshrc`.)
3. Verify: `bin/slack whoami` → thấy `"ok": true` + tên user là xong.

## Lệnh

| Lệnh | Việc | Loại |
|---|---|---|
| `bin/slack whoami` | kiểm tra token + danh tính | đọc |
| `bin/slack search <query...>` | tìm tin của mình (vd `from:me deadline`) | đọc |
| `bin/slack history <channel> [limit]` | đọc lịch sử kênh/DM | đọc |
| `bin/slack send <channel> <text...>` | gửi tin nhắn | ✋ ghi |
| `bin/slack react <channel> <ts> <emoji>` | thả emoji (tên không dấu `:`) | ✋ ghi |
| `bin/slack upload <channel> <file> [title]` | upload file (3 bước tự lo) | ✋ ghi |
| `bin/slack api <method> key=val ...` | gọi raw bất kỳ Slack Web API method | tuỳ |

- **channel**: ID `C0123ABCD` (kênh) / `U0123ABCD` (user/DM); `#ten-kenh` hoặc `@user` cũng gửi được.
- **ts**: timestamp tin nhắn dạng `1710000000.000100` (lấy từ `history`/`search`).
- `api` với method `search.*` tự dùng form-encoding; còn lại dùng JSON — helper lo sẵn.

## Cách làm việc

1. Chạy từ thư mục brain: `bin/slack <lệnh>` (hoặc thêm `bin/` vào PATH).
2. Lỗi hay gặp: `missing_scope` (thiếu quyền → báo user reinstall lấy scope), `not_in_channel`
   (chưa vào kênh đó → user cần join trước).
3. Muốn thao tác Slack chưa có lệnh riêng → dùng `bin/slack api <method> ...` thay vì viết code mới.
