---
type: decision
title: ts-tool trên prod chặn theo LOẠI OPERATION, không chặn cả API
summary: Guard "tắt dev zone trên prod" đặt ở đầu tsToolAuthMiddleware đã làm cả /api/v1 ts-tool trả 403 cho mọi shop suốt ~12 ngày; đổi thành PROD_RESTRICTED_TYPES — read và write hỗ trợ thường chạy được trên prod, chỉ op cấp entitlement/đổi plan/billing mới bị chặn và phải đi qua CRM login-as.
tags: [avada, subscription, auth, backend, support, tooling]
created: 2026-09-09
updated: 2026-09-09
status: active
review: 2026-12-09
source: repo `subscriptions` — git log 2026-09-08, commit `1dcfcb40d` merged `401aeeb85` (!2546, tag `v2.35.16`); commit bị đảo là `7238937df`
---

# Chặn ts-tool trên production theo loại operation, thay vì chặn nguyên API

**Bối cảnh:** `7238937df` đặt guard production **ở đầu** `tsToolAuthMiddleware`, tức trước cả bước
kiểm master key. Hệ quả: **toàn bộ** app ts-tool `/api/v1` trả `403 DEV_ZONE_DISABLED` trên
production **cho mọi shop**, từ bản phát hành 27/08 (`v2.34.91`) trở đi — không chỉ đường ghi
dev-zone như ý định ban đầu. Đây là hạ tầng dùng chung của cả fleet: cookie-bar, order-limit,
accessibility, sea-appointment-booking, age-verification đều gọi qua đó.

**Quyết định:** `1dcfcb40d` (merge `401aeeb85`, tag `v2.35.16`) thay guard chặn-tất bằng danh sách
`PROD_RESTRICTED_TYPES` trong `const/tsTool.js`:

- **Chạy được trên prod** dưới key auth có sẵn: mọi read, và các write hỗ trợ thường ngày — `fix`,
  `sync`/`resync`, queue, DFY plan/widget/portal, email, export.
- **Chỉ non-production**: op cấp một entitlement trả tiền, hoặc chuyển shop giữa plan/pricing/charge.
  Những thứ này phải đi qua **CRM login-as** — đường có danh tính quy trách nhiệm được.
- Check chuyển xuống **sau** bước validate key: caller không xác thực nhận `401` và không học được
  gì về môi trường.
- `REJECTED_TYPES` vẫn chặn loại phá huỷ ở **mọi** môi trường — không đổi.

Bằng chứng: `1dcfcb40d` — 4 file, +187/−8 (`const/tsTool.js` +90, `middleware/tsToolAuthMiddleware.js`
+29/−?, test `tsToolProdScope.test.js` 65 dòng, `docs/TS_TOOL_API.md` +11).

**Why:**

- Guard cũ đảo lẫn hai trục: *"thao tác này có nguy hiểm không"* và *"môi trường nào"*. Đặt ở đầu
  middleware thì trục thứ nhất không còn được hỏi — mọi thứ thành nguy hiểm như nhau.
- Chi phí thật đã xảy ra, không phải giả định: **~12 ngày** (27/08 → 08/09) toàn bộ TS AI tooling
  offline trên prod cho mọi shop. Và nó không được phát hiện bằng alert mà bằng **hệ quả gián tiếp**
  — [[digest-subscriptions-2026-09-04]] ghi lại đúng triệu chứng đó dưới dạng "không có đường chữa
  order kẹt", tức đội support đã sống chung với nó như một sự thật cố định thay vì một sự cố.
- Ranh giới mới bám vào thứ thực sự cần quy trách nhiệm: **cấp quyền trả tiền / đổi plan**. Đó là
  loại thao tác mà "ai làm" quan trọng ngang "làm gì" — nên bắt nó đi qua CRM login-as là đúng chỗ,
  còn `resync` một order thì không.
- Trả `401` trước khi lộ thông tin môi trường: bớt một kênh rò rỉ rẻ tiền.

**Tradeoff / đánh đổi:**

- **Được:** fleet 5 app dùng lại được hạ tầng support trên prod; đường chữa order kẹt sống lại; ranh
  giới bảo mật nói được thành câu ("op nào cấp tiền/plan") thay vì "môi trường nào".
- **Mất:** bề mặt ghi trên production **rộng trở lại**. `fix`, `sync/resync`, queue, DFY, email,
  export đều ghi thật vào shop thật, chỉ đứng sau một master key dùng chung — key không mang danh
  tính, nên log chỉ trả lời được "có ai đó", không trả lời được "ai".
- **Rủi ro còn lại là `PROD_RESTRICTED_TYPES` bị thối**: nó là allowlist ngược, phải được cập nhật
  mỗi khi thêm một `type` mới cấp entitlement. Quên thêm = mặc định mở trên prod. Đây là thứ phải
  kiểm ở mốc review, và là lý do file test `tsToolProdScope.test.js` chỉ chứng minh được luật hiện
  tại đúng, không chứng minh được danh sách còn đủ.
- **Phương án đã loại — giữ chặn cả API, mở dần từng op:** an toàn hơn trên giấy nhưng chính là
  trạng thái vừa gây sự cố; và nó biến mỗi lần cần hỗ trợ khách thành một lần release.
- **Phương án đã loại — bắt mọi thứ đi qua CRM login-as:** có danh tính cho mọi thao tác, nhưng
  không dùng được cho đường máy-gọi-máy (cron, agent support), tức sẽ giết luôn thứ ts-tool sinh ra
  để phục vụ.

## Liên quan
- [[subscriptions]] · [[shipped-subscriptions-2026-09-09]]
- [[digest-subscriptions-2026-09-04]] — nơi ghi hệ quả (`resync-order` chặn cứng trên prod); **câu đó
  nay đã lỗi thời, cần sửa**
- [[digest-subscriptions-2026-07-17]] · [[digest-subscriptions-2026-07-20]] — `const/tsTool.js`,
  `REJECTED_TYPES`, mô hình scope của ts-tool
- [[chan-agent-bang-cau-hinh]] — rào chắn phải là cấu hình, không phải lời nhắc
- [[bang-chung-phan-biet-duoc]]
