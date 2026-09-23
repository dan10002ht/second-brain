---
type: note
title: Case SB-17107 fail vì user agent mất đăng nhập Claude, và thông báo lỗi nói dối
summary: Token OAuth của user `agent` bị xoá rỗng nên mọi case fail; phong bì lỗi có is_error=true nhưng subtype="success" nên log ghi "claude bao loi: success" và giấu mất lý do thật nằm ở trường `result`.
tags: [agent, automation, debug]
created: 2026-09-23
updated: 2026-09-23
source: VM `dantt-solar` — điều tra trực tiếp 2026-09-23
---

# SB-17107: fail vì hạ tầng, nhưng log nói là lỗi khác

## Triệu chứng

Case `SB-17107` nằm trong `queue/failed/` với `triageError: "claude bao loi: success"` — một câu
vô nghĩa. Triage chạy **5 giây**, `usdClaude: 0` (không hề gọi inference).

## Nguyên nhân thật

Chạy `claude -p` dưới user `agent` trả về:

```json
{"subtype":"success","is_error":true,"api_error_status":null,
 "result":"Not logged in · Please run /login","total_cost_usd":0}
```

`.credentials.json` của `agent`: `accessToken` len=**0**, `refreshToken` len=**0**, `expiresAt`
**0** — CLI tự xoá sạch token khi refresh thất bại, và mtime file đúng bằng phút case chạy. Của
user `dantt` vẫn nguyên (len 108). Mất phiên sau lần VM reboot 21/09 15:01.

## Vì sao log nói dối

```js
if (env0.is_error) reject(new Error(`claude bao loi: ${env0.subtype||''} ${env0.api_error_status||''}`));
```

Phong bì này **không có** `api_error_status`, và `subtype` vẫn là `"success"` (session kết thúc
bình thường — chỉ nội dung trả về là lỗi). Lý do thật nằm ở trường **`result`**, mà code không đọc.

Ba chỗ cùng pattern, đã vá cả ba: `triage.js:521`, `verify.js:343`, `doi-chieu-mr.js:274`.
Giờ log ra `claude bao loi: success · Not logged in · Please run /login`.

## Bài học

**`is_error` và `subtype` là hai trục khác nhau.** `subtype` nói *session kết thúc thế nào*,
`is_error` nói *nội dung trả về có phải lỗi không*. Đọc một cái rồi kết luận về cái kia là cách
tạo ra thông báo vừa sai vừa tự tin. Khi bắt lỗi từ một phong bì JSON của công cụ ngoài: **in cả
trường chứa nội dung**, đừng chỉ in mã trạng thái.

Dấu hiệu nhận ra loại lỗi này mà không cần đọc code: thời gian chạy **quá ngắn** (5 giây cho một
việc thường mất vài phút) và **chi phí bằng 0**. Hai con số đó nói "chưa từng gọi model", tức lỗi
nằm trước khi công việc bắt đầu — hạ tầng, không phải nội dung case.

## Cách đăng nhập lại — ba cái bẫy liên tiếp

1. **`/login` không chạy headless** ("`/login` isn't available in this environment") và phiên
   Claude Code không cấp TTY thật. Phải mở Terminal riêng: `ssh -t dantt-solar`.
2. **`sudo -u agent` chạy trên máy Mac báo "unknown user agent"** — user đó chỉ có trên VM. Phải
   `ssh` vào trước rồi mới `sudo`.
3. **Login thành công nhưng rơi vào sai user.** Kiểm bằng mtime: sau lượt login,
   `/home/dantt/.claude/.credentials.json` mới (509B) còn `/home/agent/...` vẫn rỗng 243B. Token
   nằm ở user không chạy triage thì vô dụng.

Giả thiết ban đầu của tôi — "hai user dùng chung tài khoản nên refresh token bị thu hồi chéo" —
**sai**. Token của `dantt` trên VM đã chết từ 2026-08-25, chỉ chưa bị CLI dọn vì user đó không
chạy `claude` trên VM. Đơn giản là phiên hết hạn, không ai làm mới.

Đã xử lý bằng cách copy credentials của `dantt` sang `agent` (chọn nhanh, chấp nhận dùng chung
một refresh token). Đường sạch hơn nếu lặp lại: `claude setup-token` dưới chính user `agent` —
token dài hạn, không hết hạn theo phiên, hợp máy chạy 24/7.

## Còn treo

- Chưa có cảnh báo sớm: hiện phải mất một case mới biết. `morning-report` kiểm được việc này
  bằng một lần `claude -p` rẻ tiền mỗi sáng.
- Hai user vẫn dùng chung một refresh token — nếu rụng lần nữa thì đó mới là bằng chứng cho giả
  thiết thu hồi chéo.

## Liên quan

- [[agent-support-design]]
