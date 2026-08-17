---
type: resource
title: API có auth nằm sau CDN — cache key không chứa danh tính thì phải no-store
summary: Một API trả dữ liệu riêng theo người gọi mà đi qua CDN/hosting mặc định sẽ phát lại response của lượt gọi trước cho lượt sau; triệu chứng kinh điển là mọi request đều trả cùng một mã lỗi, kể cả request đáng lẽ phải 401.
tags: [caching, http, auth, firebase, backend, cdn]
created: 2026-08-17
updated: 2026-08-17
source: [[digest-subscriptions-2026-08-17]]
---

# API có auth nằm sau CDN — cache key không chứa danh tính thì phải no-store

## Luật

Một cache chỉ đúng khi **cache key chứa đủ mọi thứ quyết định response**. API trả dữ
liệu theo danh tính người gọi (JWT, cookie, header token) mà key chỉ là URL thì cache
đang trả lời hộ — và trả nhầm.

Vì vậy: response của endpoint có auth mặc định phải là `Cache-Control: no-store`.
Đây là quyết định **fail-closed**, không phải tối ưu — bật cache lại là việc phải chứng
minh, không phải mặc định phải chịu đựng.

## Triệu chứng nhận ra

Dấu hiệu rẻ nhất, kiểm được trong một phút:

| Quan sát | Nghĩa là |
|---|---|
| **Mọi** case trả cùng một mã, kể cả case ký sai secret (đáng lẽ 401) | response đang đến từ cache, không từ app |
| Gọi thẳng origin (bypass CDN) ra kết quả khác hẳn | code đúng, tầng cache mới là thủ phạm |
| `x-cache: HIT` / `cache-control: max-age=<n>` trên response không phải 200 | tầng hosting tự gắn, không phải app |

Cách tách bạch: gọi thẳng URL origin (với Firebase là
`https://<region>-<project>.cloudfunctions.net/<fn>/...`, không có CDN), và dùng
cache-buster trên một URL chưa từng gọi trong phiên để có ô cache trống.

## Bẫy cụ thể: Firebase Hosting rewrite → Cloud Function

Hosting gắn `cache-control` **mặc định** cho response của function rewrite dù
`firebase.json` không khai gì. Quan sát thực tế: `401` không bị cache, `200` ra
`private`, nhưng **`404` ra `max-age=600`**. Hệ quả: một khách không có dữ liệu gọi
trước → 404 nằm trong ô cache 10 phút → khách thật gọi sau vẫn nhận 404.
⚠️ *Chưa xác minh*: cơ chế vì sao 404 và 200 được đối xử khác nhau.

Vá bằng middleware set `Cache-Control: no-store` cho toàn bộ router có auth, đặt trước
handler. Việc này chỉ thêm một response header — không đụng đường phân quyền, nên không
tạo rủi ro mới; nhưng cũng vì thế nó **không** thay thế được phân quyền ở tầng query.

## Đừng nhầm với "cache là xấu"

Vấn đề không phải cache, mà là **cache sai key**. Nếu muốn giữ cache cho endpoint có
auth thì key phải gồm định danh người gọi (`Vary: Authorization`, hoặc cache ở tầng app
với key có shopId/customerId) — xem [[caching-layers]] mục invalidation & key.

Liên quan: [[digest-subscriptions-2026-08-17]] · [[bang-chung-phan-biet-duoc]] ·
[[mcp-auth-apikey-vs-oauth]]
