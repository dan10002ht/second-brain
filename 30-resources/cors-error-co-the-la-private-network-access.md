---
type: resource
title: "\"CORS error\" có thể là Private Network Access, không phải CORS"
summary: Khi một trang HTTPS công khai gọi backend local qua tunnel, Chrome chặn bằng Private Network Access nhưng báo ra dưới nhãn CORS — dấu hiệu phân biệt là request có `0.0 kB / 0 ms` ở cả preflight lẫn fetch, tức nó chưa từng rời trình duyệt.
tags: [http, debug, tooling, method, extensions]
created: 2026-09-22
updated: 2026-09-22
source: project `subscriptions` — session history 2026-09-22 (verify Customer Account extension ở khổ 390px, UI từ dev preview của Shopify, data từ backend local qua Tailscale Funnel)
---

# "CORS error" có thể là Private Network Access

## Triệu chứng

Trang chạy trên origin HTTPS công khai (ở đây là `shopify.com` phục vụ dev preview của một
Customer Account extension) gọi backend local qua tunnel. DevTools báo CORS error. Nhưng:

| Kiểm | Kết quả |
|---|---|
| `curl` tới đúng URL đó | `401` sau 2s — **tới nơi**, chỉ thiếu auth |
| `fetch` từ trong trang | CORS error |
| Cột Size / Time của cả preflight lẫn fetch | `0.0 kB / 0 ms` |

Server có bật CORS đầy đủ, kể cả `content-type`. Server không hề nhận được request nào.

## Vì sao

`0.0 kB / 0 ms` ở **cả hai** request là dấu hiệu phân biệt: nếu là CORS thật thì preflight phải
bay đi, có byte, có thời gian, rồi response mới bị từ chối vì thiếu header. Ở đây request chưa từng
rời trình duyệt — Chrome chặn trước khi gửi, vì **Private Network Access**: một trang ở origin
public không được gọi thẳng vào địa chỉ private. Tunnel (Tailscale Funnel, `*.ts.net`) phân giải ra
IP trong dải private của tailnet, nên nó rơi đúng vào luật đó. Chrome gộp thông báo này vào nhãn
CORS, và đó là chỗ làm người debug đi lạc.

## Cách gỡ khi đang dev

Ép Chrome phân giải host tunnel ra **IP công cộng** thay vì IP tailnet, bằng flag truyền thẳng cho
trình duyệt (`--host-resolver-rules`). Sau khi ép, cùng một request trả
`{"success":false,"error":"Authentication required"}` — tức đã tới backend local, PNA hết chặn.

Đây là biện pháp cho máy dev, không phải cấu hình sản phẩm.

## Dấu hiệu nhận dạng, gom lại

1. `curl` tới được, trình duyệt thì không → không phải lỗi server, không phải lỗi CORS header.
2. `0.0 kB / 0 ms` ở preflight → request bị chặn tại chỗ, không phải bị từ chối ở đầu kia.
3. Host đích phân giải ra IP private (`100.x` của tailnet, `192.168.x`, `10.x`) trong khi trang
   đứng ở origin public.

Đủ ba dấu hiệu thì đừng đi sửa CORS nữa.

## Liên quan

[[khong-cache-response-co-auth]] · [[do-be-ngang-headless-chrome]] ·
[[feedback-dung-agent-browser-cua-project]] · [[digest-subscriptions-2026-09-22]]
