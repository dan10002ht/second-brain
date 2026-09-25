---
type: resource
title: CSS variable thay thế nguyên văn — một giá trị không hợp lệ giết cả declaration, kể cả phần fallback
summary: `var()` được thay bằng token thô rồi mới parse, nên một tên font không quote có chứa token lạ (`DM Sans 9pt`) làm CẢ dòng `font-family` vô hiệu — phần fallback viết sau dấu phẩy không cứu được, và triệu chứng là font mặc định của trình duyệt chứ không phải lỗi nào.
tags: [storefront, shopify, gotcha, debug, writing]
created: 2026-09-25
updated: 2026-09-25
source: project `subscriptions` — session history 2026-09-25 (landing Joy Wholefoods), repro chạy trên store thật. Cơ chế "invalid at computed-value time" là spec CSS, chưa tra lại nguyên văn spec trong session — **chưa xác minh** ở mức trích dẫn.
---

# Giá trị không quote trong CSS variable giết cả declaration

## Cơ chế

`var(--x)` **không** là một giá trị — nó là một phép thay thế **token thô** xảy ra trước khi
declaration được parse. Hệ quả: tính hợp lệ của `font-family: var(--x), sans-serif` chỉ được quyết
định **sau khi** `--x` đã được ghép vào. Nếu bản ghép ra một thứ không parse được thì **cả
declaration** bị vứt, chứ không phải chỉ phần hỏng.

Đây là chỗ khác hẳn trực giác của người viết CSS: dấu phẩy trong `font-family` thường được đọc là
"thử lần lượt", nên ai cũng tin fallback sẽ cứu. Nó **không** cứu — vì không có "lần lượt" nào chạy
cả, dòng đó đã chết từ bước parse.

| CSS | `--raw` = `DM Sans 9pt` (không quote) |
|---|---|
| `font-family: var(--raw)` | chết → font mặc định trình duyệt |
| `font-family: var(--raw), -apple-system, sans-serif` | **vẫn chết** |
| `font-family: "DM Sans 9pt", sans-serif` | đúng |

## Vì sao khó thấy

1. **Triệu chứng là font mặc định** (Times trên nhiều máy), trông y hệt "CSS chưa load" hoặc "font
   chưa tải về" — hai chẩn đoán sai rất dễ theo đuổi. Kiểm được bằng cách chụp trang: nếu chỗ khác
   render đúng font thì file font **có** tải thật.
2. **Cùng một trang có chỗ sống chỗ chết.** Selector nào hard-code chuỗi có nháy thì chạy; selector
   nào thay biến thô thì chết. Dấu hiệu phân biệt nhanh nhất: `p` đúng font mà `body` sai.
3. Giá trị chỉ hỏng **với một số tên font**. `DM Sans` không quote vẫn chạy (identifier hợp lệ nối
   nhau); `DM Sans 9pt` thì không, vì `9pt` không phải identifier. Nên cùng một dòng Liquid/JS sinh
   CSS có thể chạy đúng nhiều năm rồi chết khi merchant đổi font.

## Luật rút ra

- **Tên font đi qua biến thì phải quote tại chỗ sinh ra biến**, không phải tại chỗ dùng —
  `--font-body-family: "{{ settings.x }}";`. Chỗ dùng không biết giá trị sẽ là gì.
- **Đừng nối thêm biến có thể rỗng vào sau dấu phẩy.** `"X", {{ fallback }}` mà fallback rỗng ra
  `"X", ;` — lại chết đúng kiểu vừa sửa. Bỏ phụ thuộc, viết fallback cứng.
- Mở rộng ra ngoài font: mọi giá trị **do người khác nhập** (theme setting, config merchant, biến
  môi trường) đi vào CSS qua `var()` đều là token chưa kiểm; nó không gây lỗi ở chỗ ghi, chỉ gây
  triệu chứng câm ở chỗ đọc.

Cùng họ với [[prop-sai-bi-bo-qua-im-lang]]: hệ thống không báo lỗi cho giá trị sai, nó chỉ lặng lẽ
bỏ qua — nên trước khi đi tìm cache hay build cũ, phải kiểm chính **giá trị đang được thay vào**.

## Liên quan
- [[digest-subscriptions-wholefoods-font-2026-09-25]] — ca cụ thể, kèm cách test bằng `--init-script`
- [[prop-sai-bi-bo-qua-im-lang]]
- [[bang-chung-phan-biet-duoc]]
- [[2026-09-25-fix-font-trong-file-cua-app]] — quyết định đặt bản vá ở đâu khi lỗi nằm trong theme khách
- [[app-development]] · [[shopify-app-dev]]
