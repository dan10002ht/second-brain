---
type: decision
title: Link trong email không được có tác dụng phụ trên GET — GET render trang confirm, nút POST mới thi hành
summary: Paste link win-back vào Slack làm Slackbot GET 3 lần và tạo ra một contract sống đã charge, nên mọi link email có tác dụng (accept, confirm, decline, unsubscribe) đổi sang: GET chỉ render trang confirm, nút trên trang POST lại cùng URL mới thi hành.
tags: [subscription, shopify, avada, auth, http, backend]
created: 2026-09-25
updated: 2026-09-25
review: 2026-12-25
source: repo `subscriptions` — git log, nhánh `feat/adama-add-win-back-flow`: `e725e65e7` (23/09), `b3ba8e0ce` (24/09)
---

# Link email không được có tác dụng phụ trên GET

**Quyết định:** với mọi link trong email mà việc bấm vào có **tác dụng** (win-back accept,
confirm/decline subscription, unsubscribe), `GET` chỉ được render một trang confirm. Việc thật chỉ
chạy khi trang đó `POST` lại **cùng URL**. Link cũ trong email đã gửi vẫn dùng được — chúng mở trang
confirm.

Phạm vi đã thi hành: `GET /win-back/accept` (`e725e65e7`), và confirm / decline / unsubscribe của
email thường (`b3ba8e0ce` — `emailController.js`, `routes/clientApi.js`,
`views/subscription-status.html`, `views/unsubscribe.html`).

## Why

Không phải phòng xa — đã xảy ra, đo được:

- Paste link email win-back vào Slack → **Slackbot-LinkExpanding GET nó 3 lần**. Một lượt GET đó
  **tạo một contract sống, đã charge**, và log một lượt reactivation. Không ai bấm gì.
- Mail scanner của doanh nghiệp (Safe Links, Mimecast) fetch link **y hệt cách đó** — tức mọi khách
  dùng Outlook/Exchange có thể bị "accept" hộ trước khi nhìn thấy email.
- `koa-router` route cả **HEAD** vào handler GET, nên một lượt HEAD cũng đủ.

Tác dụng phụ trên GET không phải lỗi implement — nó là vi phạm ngữ nghĩa HTTP (GET phải là
safe method), và hạ tầng của người khác (Slack, mail gateway, prefetch của browser) **có quyền**
GET bất kỳ URL nào nó thấy. Không có cách nào "dặn" chúng đừng làm. Xác minh sau khi sửa: Slack
unfurl và một loạt HEAD/GET **không tạo gì**; bấm Confirm thật thì contract được tạo.

Cùng lớp với [[khong-cache-response-co-auth]]: đường đi mặc định của hạ tầng trung gian là thứ phải
tính vào thiết kế, không phải thứ để giả định nó sẽ không xảy ra.

## Tradeoff

**Trả bằng một cú click của khách.** Mọi khách nay phải bấm hai lần (mở link → bấm Confirm). Với một
email win-back đang cố kéo khách quay lại, thêm một bước là thêm chỗ rơi. Đã bù một phần bằng cách
làm trang confirm nói rõ nó sắp làm gì (`"Confirm your new subscription"` / `"Reactivate your
subscription"`, `9bddf7046` thêm spinner và nêu tên contract) thay vì một trang trung gian trống
nghĩa.

**Trả bằng bề mặt phải giữ đồng bộ.** Nay có hai handler cho cùng một URL (GET render, POST thi
hành) và một file view cho mỗi luồng. Mỗi lần thêm một loại link email có tác dụng là thêm cả hai
phía — và quên POST-hoá một cái là quay về đúng lỗ cũ, không có test nào tự bắt được.

**Không chọn cách rẻ hơn, có lý do.** Hai cách rẻ hơn đều không đủ:
- *Chặn theo user-agent (Slackbot, Safe Links)*: danh sách không bao giờ đủ, và nó biến vấn đề
  ngữ nghĩa thành một allowlist phải bảo trì mãi.
- *Token dùng một lần*: vẫn bị GET đầu tiên (của bot) tiêu mất token, khách bấm sau thì link chết —
  đổi lỗi "tự accept" thành lỗi "link không dùng được", không sửa gì.

**Điều kiện làm quyết định này sai:** nếu đo được tỉ lệ khách mở trang confirm mà **không** bấm nút
cao đáng kể so với trước, thì chi phí chuyển đổi đã vượt lợi ích và phải tìm cách thứ ba (ví dụ POST
tự động bằng JS ngay khi trang load với một token gắn interaction thật) — nhưng **không** được quay
về thi hành trên GET.

Liên quan: [[shipped-subscriptions-2026-09-25]] · [[subscriptions]] · [[khong-cache-response-co-auth]] ·
[[bang-chung-phan-biet-duoc]] · [[shopify-app-dev]]
