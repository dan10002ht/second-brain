---
type: note
title: Digest Joy Subscription — preview cho classic portal (scripttag) (2026-07-31)
summary: CHỈ phần mới — dựng preview cho old CP tại một seam `makeRequest`, Jest xanh vẫn không chứng minh bundle build được (webpack thành gate bắt buộc), `/products.json` trả giá dạng chuỗi làm NaN lan âm thầm, và nút Preview không render vì thiếu key i18n ở file locale runtime.
tags: [shopify, subscription, avada, debug]
created: 2026-07-31
source: project "subscriptions" (Joy Subscription) — session history
---

# Digest Joy Subscription — 2026-07-31

> Chỉ ghi phần **mới** so với [[digest-subscriptions-2026-07-29]],
> [[digest-subscriptions-2026-07-28]], [[digest-subscriptions-2026-07-25]],
> [[shipped-subscriptions-2026-07-30]].

## Feedback

- **"Xem có hướng nào can thiệp ít nhất vào codebase cũ?"** — user luôn hỏi câu này
  trước khi cho đụng vào `scripttag`. Cách trả lời được chấp nhận: **khảo sát tầng
  request rồi báo bằng số** (bao nhiêu file import qua seam nào), không phán đoán.
- **Viết bài học vào plan như ràng buộc, đừng để rút ra sau.** Plan cho classic portal
  đưa thẳng các bài học của vòng new CP vào phần Global Constraints — cụ thể là bắt
  **dựng bản đồ endpoint + shape từ call site thật trước khi code**, vì đúng chỗ đó đã
  sai 4 lần ở new CP (xem họ lỗi "preview trả shape khác backend thật" ở
  [[digest-subscriptions-2026-07-28]]).
- **Không nhận đánh giá "non-blocking" của reviewer khi lý do là xác suất thấp chứ
  không phải hậu quả nhẹ.** Lỗ `NaN` bị reviewer chấm Major-không-chặn; đã ghi đè và
  bắt sửa.

## Decisions

- **Preview cho classic portal cũng chặn tại đúng MỘT seam:**
  `packages/scripttag/src/subscription/helper/makeRequest.js` — 21 file import từ đây.
  *Why:* lặp lại pattern đã hiệu quả với `fetchPublicApi` của new CP; tắt cờ là
  pass-through thuần. *Tradeoff:* phải chứng minh **widget isolation** — cờ `enabled`
  là biến module-private, không phải global.
- **Quy tắc hiển thị preview chỉ áp cho luồng đi từ nút "Preview portal"** (có cờ), còn
  khách dùng bình thường thì không đổi gì (vẫn có thể thấy màn trống).
  | Trạng thái | Hiển thị |
  |---|---|
  | Chưa login (classic) | Preview — **0 request chạm backend** |
  | Đã login, không có contract | Preview |
  | Đã login, có contract | Portal thật |
  New CP thì **luôn** phải qua login. Gating nút: classic luôn bật, New CP cần
  `extensionPageUuid` (lỗi đã mắc ở trang settings — gate nhầm cả hai loại).
- **Lấy `accessLink` bằng cách bám vào request trang Home đã gọi sẵn**
  (`/shops/integrations` → thêm `getSettings(shopId)` vào `Promise.all` có sẵn, dùng
  chung Redis cache 5 phút với trang settings). *Why:* không thêm request nào nên
  **không tăng LCP**. Điều kiện dừng đặt sẵn trong dispatch: nếu tra cứu tốn kém thì
  báo lại và dừng, đừng ship trang Home chậm đi.

## Bugs (root cause)

- **Nút "Preview portal" không render — thiếu key ở file locale RUNTIME.**
  `middleAction={buttonMiddleText && {...}}` → `buttonMiddleText` falsy thì nút **biến
  mất hoàn toàn**, không phải render xám (dễ tưởng là build chưa cập nhật). Root cause:
  key `previewPortalButtonText` có trong `QuickStart.json` (colocated) nhưng **không có
  trong `locale/translations/en.json`** — file thật sự được đọc lúc chạy. Cả 6 key mới
  đều thiếu. Cùng họ với "thêm field thì phải quét mọi chỗ liệt kê tên field"
  ([[digest-subscriptions-2026-07-28]]).
- **Jest xanh không chứng minh bundle build được.** Reviewer chạy `webpack` thật và bắt
  2 Critical mà 197 test không thấy. → thêm **bước build webpack vào Global Constraints**
  cho mọi task classic. Kỹ thuật đi kèm: **grep vào bundle đã emit** để chứng minh stub
  preview nằm ở lazy chunk riêng chứ không lọt vào bundle eager.
- **`/products.json` trả giá dạng CHUỖI** → `Number("abc")` = `NaN` lan âm thầm qua
  pricing (không throw, không log, chỉ hiện giá rác). Shape của `/products.json` khác
  hẳn Storefront GraphQL — phải map tay, và product không có variant thì **loại bỏ**
  chứ không "điền đại" giá trị mặc định.
- **`sessionStorage` có thể throw** (Safari private mode, iframe sandbox) → mọi truy cập
  phải bọc try/catch. Điểm này cả implementer lẫn plan đều bỏ sót.
- **Cửa sổ trước khi `/shops/integrations` trả về** làm `isNewCustomerAccount` = `false`
  → nút quyết định nhầm loại portal trong lúc đang tải. Ghi chú: giải thích cơ chế của
  reviewer **sai** (thực tế `shopInfoData` là `undefined`), của implementer cũng sai →
  **cả báo cáo của reviewer cũng phải verify**, không chỉ báo cáo của implementer.
- **Định nghĩa "có contract" phải kiểm CẢ HAI CHIỀU.** Controller trả
  `{success: false}` ở ca lỗi → nếu coi đó là "không có contract" thì backend hỏng
  suốt phiên sẽ hiện preview cho merchant có contract thật. Fix: **không đóng băng
  quyết định khi backend lỗi**, và **retire cái test khẳng định sai** thay vì giữ nó
  cho xanh.

## Techniques / gotchas

- **`yarn trans` (script i18n) load `packages/functions/.env.development`, KHÔNG phải
  `.env.local`** — và thông báo lỗi của nó lại ghi "repo root", sai với hành vi thật.
  Script **merge `en.json` trước rồi mới hỏi xác nhận dịch**, nên nếu chỉ cần merge key
  mà không muốn dịch thì trả lời `n` vẫn có kết quả.
- **`getCustomerPortalUrl` là chỗ quyết định old vs new CP**, và **hai nút đang quyết
  theo hai nguồn khác nhau** (nút ở Setup guide gọi không truyền settings). Khi thêm
  entry point mới cho portal, kiểm cả hai nguồn.

## Điểm đối chiếu (đóng một câu hỏi treo)

- Câu hỏi "chưa xác minh" ở [[digest-subscriptions-2026-07-25]] — *automatic discount
  function có chạy lại ở mỗi billing attempt không* — đã được tra docs trong phiên và
  kết luận: **không**. Automatic discount được verify lúc tạo contract, các billing
  attempt sau **dùng lại giá đã discount** thay vì chạy lại function (mục docs "How are
  automatic discounts verified"). Hệ quả: cả tiền đề của việc "freeze discount theo
  contract bằng line attribute" là sai — nên việc **bỏ nhánh `frozenDiscount`** (đã ghi
  ở [[digest-subscriptions-2026-07-25]]) vừa đóng lỗ bảo mật vừa là kiến trúc đúng.
  *Chưa xác minh:* nguyên văn đoạn docs (transcript bị cắt) — đọc lại docs trước khi
  dựa vào cho thiết kế mới.

## Liên quan

[[subscriptions]] · [[shipped-subscriptions-2026-08-01]] (commit landed của chính nhánh này) ·
[[subscriptions-debug-runbook]] · [[digest-subscriptions-2026-07-29]] ·
[[digest-subscriptions-2026-07-28]] · [[digest-subscriptions-2026-07-25]] ·
[[shipped-subscriptions-2026-07-30]] · [[subscription-work-style]] · [[shopify-app-dev]]
