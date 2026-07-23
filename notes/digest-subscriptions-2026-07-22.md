---
type: note
title: Digest Joy Subscription 2026-07-22 — nhúng Customer Portal vào Chatty (iframe/OAuth) và bẫy widget preview strip âm thầm
summary: Chỉ phần MỚI — nhúng CP vào popup Chatty same-origin (trang login Shopify chặn framing → popup-OAuth cho ca chưa login), và loạt bẫy widget preview (thêm field vô nghĩa nếu scripttag không đọc, gate theo version chứ không layout).
tags: [subscription, shopify, storefront, auth, avada]
created: 2026-07-22
source: subscriptions (session history)
---

# Digest Joy Subscription — 2026-07-22 (CHỈ phần mới)

> Đã loại phần đã có: expose tsTool DFY API + Yup `stripUnknown` + 2 mô hình Plan +
> DevZone audit (`disable-powered-by` no-op, `reset-migration-data` reject) nằm ở
> [[digest-subscriptions-2026-07-17]]; kỷ luật branch (commit nhầm master) ở
> [[digest-subscriptions-2026-07-21]]; apiV1 pdf + lỗ hổng download PDF không auth ở
> [[digest-pdf-apiv1-workflow-2026-07-21]]/[[digest-subscriptions-2026-07-21]].

## Decisions

- **Nhúng Customer Portal vào Chatty bằng iframe URL (Kiểu A), không dựng lại UI trong popup Chatty.** *Why:* 2 app khác team → ranh giới càng mỏng càng dễ vỡ; iframe-URL contract rõ ràng hơn. *Tradeoff:* phải xử nhánh auth trong embed mode. Chatty chỉ thêm **nút "Manage subscription" + 1 iframe**, Joy lo toàn bộ nội dung (chưa login → trang login hiện tại, đã login → CP hiện tại).
- **Ca chưa login dùng popup-OAuth, KHÔNG dùng OTP** (đã suýt chốt OTP). *Why:* verify thực tế lật lại giả định — xem Bugs.

## Bugs / facts (đã verify bằng code + shop thật)

- **Trang login Shopify (new customer accounts, OAuth PKCE) đặt `x-frame-options: DENY` + `content-security-policy: frame-ancestors 'none'`** → KHÔNG thể nhét trang login vào iframe. Đây là bằng chứng quyết định giết phương án "iframe cả luồng login". → ca chưa login phải bật popup-OAuth (cửa sổ riêng), không frame.
- **Portal HIỆN TẠI đã seamless khi khách đã login storefront**: dùng chính `logged_in_customer_id` của Shopify same-origin → không cần login lại. `/login-shopify` (`authController`) verify App-Proxy HMAC + tự tạo token — chính là mảnh seamless-auth cần tận dụng.
- **Chatty là widget same-origin, KHÔNG dùng iframe** (soi DOM trực tiếp trên shop thật). Tín hiệu nhận biết: class Tailwind có prefix `chatty:` (`chatty:bg-background`...) → build Tailwind có prefix, tức cùng document chứ không phải iframe cách ly. Panel render qua React portal ở chỗ khác trong DOM.

## Techniques / gotchas (widget preview — tsTool)

- **Thêm field vào schema là VÔ NGHĨA nếu storefront không đọc lúc render** — bug "strip âm thầm". `widgetCustomCSS`/`activeTextColor` chỉ có ở admin (`PreviewPanel`/`WidgetSettings`), KHÔNG xuất hiện trong `packages/scripttag/src` → phải trace tới đường render trước khi hứa "đã hỗ trợ". Có test chặn tái diễn (field bị strip mà không ai biết).
- **`activeTextColor` gate theo PHIÊN BẢN widget, không phải layout** — cái bẫy "số Block ≠ số Layout" (đừng tin "chỉ layout 2/4/6"). Còn 2 lớp nữa: **label hiển thị cho merchant ≠ value lưu DB**, và có **2 bộ layout options** (basic vs advanced). → luôn trace value thật, đừng đọc theo tên.
- **Preview có 2 endpoint tsTool khác nhau dùng schema khác nhau** (`PUT /api/v1/widget-settings` vs preview) → phải fix cả hai, không vá một.
- **Fix một field thì đối chiếu TOÀN BỘ field một lần** (thiếu 4 field, trong đó 2 là giao diện, 2 là luật hiển thị `countryAvailability`/`customerTagAvailability`) — không vá lẻ. Củng cố [[feedback-follow-conventions]].

## Liên kết gợi ý

[[subscriptions]] · [[subscriptions-debug-runbook]] · [[digest-subscriptions-2026-07-17]] · [[app-development]] · [[firestore-multitenant]] · [[subscription-work-style]]
