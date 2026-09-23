---
type: note
title: Digest subscriptions — 2026-09-23 (chuỗi để một Customer Account extension dev preview gọi được backend local)
summary: Extension dev preview do Shopify phục vụ từ CDN nhưng CLI vẫn rebuild khi `packages/functions/src` đổi — miễn là có file extension bị touch; Tailscale Funnel cho host cố định thay cloudflared; và Chrome vẫn chặn vì Private Network Access chứ không phải CORS — gỡ bằng cách ép phân giải host Tailscale ra IP công cộng.
tags: [shopify, subscription, extensions, tooling, debug, avada]
created: 2026-09-23
updated: 2026-09-23
source: project `subscriptions` — session history (session 0fb64e0c, phần dựng môi trường để xem portal Wholefoods ở 390px)
---

# Digest — `subscriptions`, 2026-09-23

Toàn bộ phần bug và bản vá của đợt này đã ghi ở [[digest-subscriptions-2026-09-22]] và
[[shipped-subscriptions-2026-09-23]]. Note này **CHỈ phần chưa ghi**: chuỗi hạ tầng phải thông
trước khi nhìn được portal thật ở khổ điện thoại — nó tốn nhiều lượt hơn cả bản vá.

## Techniques — nối dev preview của extension vào backend local

Bốn mắt xích, mỗi mắt xích từng làm tôi kết luận sai một lần:

**1. CLI *có* rebuild khi `packages/functions/src` đổi — nhưng phải touch một file extension.**
Lần đầu tôi kết luận `shopify app dev` không watch `packages/functions`; sai. Bằng chứng ngược:
ba bundle ứng với ba lần sửa hằng số host, mỗi bản mang đúng host mới. Bundle **do Shopify phục vụ
từ CDN**, không phải từ máy — nên "thấy CDN" không chứng minh được CLI chưa build.

**2. Host tunnel phải là host mà backend thật lắng nghe.** Link `trycloudflare.com` của
`shopify app dev` trả `500 Invalid path /clientApi/subscriptions` — nó trỏ vào tiến trình khác, không
phải hosting emulator có route `/clientApi`. Tailscale Funnel (`https://<host>.ts.net` → `127.0.0.1:5002`)
là hướng đúng: host **cố định** qua các lần restart, và đã bật sẵn CORS cho `https://shopify.com`.

**3. "CORS error" ở đây là Private Network Access.** Cùng một máy, cùng một lúc: `curl` tới host
Tailscale trả 401 (tức tới nơi), còn Chrome báo lỗi CORS với `0.0 kB / 0 ms` ở cả preflight lẫn
fetch — request chưa từng rời trình duyệt. Gỡ bằng cách truyền `--args` cho Chrome ép phân giải host
Tailscale ra **IP công cộng**, thế là không còn là "private network". Dấu hiệu nhận biết và cơ chế
đã ghi ở [[cors-error-co-the-la-private-network-access]]; điểm mới là nó đụng cả **Tailscale Funnel**,
không riêng tunnel local.

**4. Chọn store dev có data giống store khách, đừng test trên store trống.**
`dantt-subscription-box.myshopify.com`: 20 contract active, `newPlanVersion: true` (giống khách), có
contract mang dòng con bundle. Nhưng nó nằm ở project `ag-subscriptions-staging-3`, trong khi
extension mặc định gọi `avada-subscription-app.firebaseapp.com` (prod) ⇒ 401 — **shop doc chỉ tồn
tại ở một project**, nên 401 ở đây là "gọi nhầm môi trường", không phải "hỏng auth".

## Context

- Portal **không load** trên store dev cho tới khi menu được đổi sang **custom** — console **không có
  lỗi JS nào**, tức bundle extension không được phục vụ chứ không phải code chạy rồi ném. Console
  sạch trong một surface nhúng vẫn là một triệu chứng, không phải bằng chứng vô can
  ([[khong-error-boundary-hong-ca-man-hinh]]).
- Vòng này tốn nhiều lượt vì tôi **suy đoán rồi kết luận** hai lần (CLI không rebuild; dev không
  chạy) và cả hai lần dantt bác lại bằng sự thật đơn giản ("tôi đang chạy dev rồi mà ???"). Đường
  đúng là đo — `lsof` cho thấy emulator 5002/5012 listening, bundle hash đổi theo mỗi lần sửa.
- Bản thân việc dựng môi trường đã đi quá sâu so với việc chính; điểm dừng đúng là trả lại tree sạch
  (`newCustomerPortal.js` revert về nguyên trạng) trước khi commit MR.

## Liên quan

[[subscriptions]] · [[digest-subscriptions-2026-09-22]] · [[shipped-subscriptions-2026-09-23]] ·
[[2026-09-23-klaviyo-bis-goi-thang-client-api]] ·
[[cors-error-co-the-la-private-network-access]] · [[cau-extension-chay-that-tren-store]] ·
[[extension-khong-gioi-han-theo-shop]] · [[khong-error-boundary-hong-ca-man-hinh]] ·
[[feedback-dung-agent-browser-cua-project]]
