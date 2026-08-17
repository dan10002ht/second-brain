---
type: decision
title: Installment fixed bundle dùng MỘT engine per-cycle rotation, không tách hai kiểu
summary: Hai kiểu bán trả góp (giao dần từng kỳ vs dồn giao ở kỳ cuối) đều dựng trên đúng engine "Customize each order" sẵn có, khác nhau ở cấu hình từng cycle chứ không ở nhánh code; giá mỗi kỳ ép theo giá sản phẩm cha.
tags: [subscription, shopify, architecture, patterns, avada]
created: 2026-08-17
updated: 2026-08-17
status: active
review: 2026-11-17
source: project "subscriptions" session history
---

# Quyết định — installment fixed bundle dùng một engine per-cycle rotation

Khách (`stringflags.com`, theme Horizon) bán lều giá cao, muốn bán **trả góp** thành N kỳ
— khác `prepaid` sẵn có của app (prepaid là thu tiền trước). Hai kiểu merchant yêu cầu:

- **Giao dần**: mỗi kỳ thu tiền và giao một phần bộ phận.
- **Dồn cuối**: các kỳ đầu chỉ thu tiền, kỳ cuối thu nốt **và giao toàn bộ**.

⚠️ *Chưa xác minh*: nhãn "(a)" / "(b)" trong hội thoại bị đảo qua lại vài lượt — khi
mature note này nên mô tả theo **hành vi** như trên, đừng dùng lại nhãn chữ cái.

## Chốt

1. **Một engine duy nhất**: tái dùng per-cycle rotation ("Customize each order") của
   tính năng *product fixed bundle* sẵn có, thêm một lớp "installment marker" mỏng để
   phân biệt contract installment với contract thường. Không dựng engine riêng cho từng
   kiểu — hai kiểu chỉ khác **cấu hình từng cycle row**.
2. **Sản phẩm cha vô hình giữ giá**: mọi order đều có line parent và charge giá cha
   (= tiền mỗi kỳ); children là sản phẩm thật, gắn `@0` ở kỳ nào có giao.
3. **Giá mỗi kỳ ép theo giá sản phẩm cha**: bật installment thì tự force fixed price =
   tiền/kỳ và **disable** (không ẩn) các ô "use product price" / giá riêng.
4. **Không hardcode số kỳ**: `period` = số cycle merchant setup, và **loop vô hạn** —
   hết một vòng N đơn thì quay lại từ đầu.
5. **Không tự xử lý billing failed** — để khách tự xử lý.

## Why

- App đã có **gần đủ nguyên liệu**: `applyRotationToOrders` / `buildChildLine` (đã hỗ trợ
  quantity per item), `isBundleChildLine` / `findBundleParentLine` để backend biết order
  nào có children. Xây engine thứ hai là nhân đôi một thứ đã chạy trên prod.
- Khác biệt thật giữa hai kiểu chỉ nằm ở **kỳ nào có children** — đó là dữ liệu, không
  phải luồng điều khiển. Nhét nó thành hai nhánh code là biến dữ liệu thành `if`.
- Giá cha là nguồn duy nhất nên không phải đồng bộ hai chỗ; đây cùng hướng với
  [[2026-08-09-gia-onetime-addon-merchant-nhap]] (một field merchant nhập, không copy
  giá từ variant).

## Tradeoff

- **Contract installment không còn "vô hại" với logic chính** — nó đi chung mọi đường mà
  bundle thường đi (auto-swap, edit order, expand line). Mỗi lần đụng engine rotation là
  đụng cả hai loại khách; phải có marker và test cho cả hai, không thì regression im lặng.
- **Ép fixed price** lấy mất khả năng merchant đặt giá riêng cho từng kỳ. Đổi lại không
  còn ca "giá kỳ 3 lệch giá cha" phải đi truy.
- Loop vô hạn nghĩa là **không có điểm kết thúc tự nhiên** — merchant muốn dừng phải huỷ
  contract; chưa có UI nào nói điều đó với khách.
- Sản phẩm cha vô hình vẫn phải tồn tại thật trên Shopify catalog → merchant thấy nó
  trong danh sách sản phẩm và có thể sửa/xoá nhầm.

Plan chi tiết ở `docs/plans/installment-fixed-bundle.md` (bản FINAL), build bằng workflow
`installment-build` (xương sống `thorough.js`, tuần tự theo phase, mỗi phase
produce → verify đối kháng → gate).

Liên quan: [[2026-07-08-installment-mode-design]] · [[subscription-digest-2026-07-16]] ·
[[digest-subscriptions-2026-08-17]] · [[graph-engineering]]
