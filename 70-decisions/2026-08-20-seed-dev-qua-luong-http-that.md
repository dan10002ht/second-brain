---
type: decision
title: Seed store dev đi qua route HTTP thật của app, không ghi tắt Firestore
summary: Script seed Fixed Bundle gọi `POST /apiSa/apiSa/fixed-bundle` với Firebase ID token thay vì ghi thẳng Firestore + Shopify, để mọi hook phụ (metafield, selling plan, rebuild `avada_custom_landing`) tự chạy đúng như lúc merchant bấm Save.
tags: [avada, subscription, shopify, firestore, method]
created: 2026-08-20
updated: 2026-08-20
review: 2026-11-20
source: project "subscriptions" — session history 2026-08-20 (session e02dbd91)
---

# Seed dev đi qua luồng HTTP thật của app

Ngữ cảnh: dựng dữ liệu cho landing joyxjoy trên `dantt-subscription-box.myshopify.com`
(xem [[digest-subscriptions-joyxjoy-2026-08-20]]). Bản seed đầu ghi tắt: tạo product
Shopify + doc Firestore + metafield bằng tay.

## Why

Câu user hỏi đúng chỗ: *"nếu bạn seed thì có qua đúng các luồng của app ko?"*.
Đọc luồng thật thì `handleSetFixedBundle` (`fixedBundleService.js:270`) làm một chuỗi
việc, và **ghi tắt bỏ qua gần hết**:

- doc Firestore `productBundle` do controller ghi **sau khi** service trả về, kèm
  `bundleType` — seed tắt ghi thiếu field này, `getAllFixedBundlesByShopId` không thấy;
- selling plan group + metafield `avada_fixed_bundle`;
- `rebuildCustomLandingMetafield` — **hook mới của chính feature đang làm**.

Đó không phải chuyện sạch sẽ về mặt lý thuyết: task 1 đã FAIL đúng vì lý do này —
`--apply` chạy exit 0, log toàn `[CREATE]`, mà section 1 vẫn trống. Seed ghi tắt tạo ra
một môi trường **trông giống** production nhưng khác ở đúng chỗ feature đang dựa vào,
nên nó không test được thứ cần test.

Sau khi đổi: 12 box tạo qua route HTTP, và `avada_custom_landing` **tự sinh 14 bundle,
`type: json`** — bằng chứng rằng hook chạy thật, không phải tôi ghi hộ nó.

## Đường đi

`/api/**` (embedded) đòi session token App Bridge — script không tự ký được. Nhưng
`apiSa` mount **cùng router** và dùng `verifyRequest()` (Firebase ID token qua header
`x-auth-token`, `shopID` là custom claim) ⇒ script tự lấy token là chạy được.

## Tradeoff

- **Phụ thuộc app chạy local** (`sdd` + `emudev`). Seed không còn là script độc lập.
- **Chậm hơn** và kéo theo mọi side effect thật — không dry-run được bằng cách chỉ
  "không ghi DB" nữa, vì việc ghi nằm ở đầu kia của HTTP.
- **Path thật là `/apiSa/apiSa/fixed-bundle`, không có `/v1`** — tôi đoán sai một lần.
  Bẫy đi kèm: cú `curl` trả `401 {"error":"You must log in to continue"}` **không chứng
  minh path đúng**, nó chỉ chứng minh middleware auth đã chạy; verifier phải phân biệt
  path đúng/sai bằng token hợp lệ mới kết luận được. Cùng họ với
  [[bang-chung-phan-biet-duoc]].
- Hosting emulator có thể trả SPA `index.html` (200 + HTML) thay vì route sang function
  khi rewrite chưa ăn — gọi thẳng cổng function, và nhớ `Accept: application/json` vì
  `errorHandler` render HTML khi request không xin JSON.

## Phương án đã bỏ

**Ghi tắt Firestore + Shopify.** Nhanh, không cần app chạy, nhưng đúng như trên: nó dựng
một môi trường sai ở chỗ không nhìn thấy được, và mọi phút tiết kiệm được ở seed sẽ bị
tiêu lại nhiều lần khi đi truy "vì sao trang trống".
