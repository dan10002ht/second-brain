---
type: decision
title: Vá font cho Joy Wholefoods trong file của app, không sửa `layout/theme.liquid` của khách
summary: Lỗi nằm ở theme khách (biến font không quote) nhưng bản vá chỉ được đặt trong hai file do app sở hữu — chấp nhận phần còn lại của store vẫn sai font — thay vì sửa khối `:root` toàn cục trong `layout/theme.liquid`.
tags: [subscription, shopify, avada, storefront]
created: 2026-09-25
updated: 2026-09-25
review: 2026-12-25
source: project `subscriptions` — session history 2026-09-25; dantt chốt bằng câu "B chứ nhỉ?" sau khi được nêu ranh giới sở hữu file. MR !2641 (phương án A, đã merge rồi revert) → MR !2642 (phương án B).
---

# Fix font đặt trong file của app, không đặt trong theme khách

**Quyết định:** với lỗi font của Joy Wholefoods, bản vá nằm trong **hai file do app sở hữu**
(`sections/joy-subscription-landing.liquid` + snippet CTA), tự khai báo lại `font-family` có dấu
nháy cho phạm vi của mình. **Không** sửa khối `:root` trong `layout/theme.liquid` của khách.

Hệ quả đã chấp nhận và đã nói rõ với dantt: store chỉ đúng font ở **trang subscription + nút CTA**;
`body` của các trang khác (collection, product, home) **vẫn là Times** cho tới khi khách tự sửa
theme của họ.

## Why

Nguyên nhân thật nằm ở theme khách — `--font-body-family:{{ settings.custom_font2 }}` in ra
`DM Sans 9pt` không có dấu nháy, làm chết cả declaration
([[css-var-khong-quote-lam-chet-ca-declaration]]). Sửa đúng gốc **là** sửa `layout/theme.liquid`.
Nhưng:

- `layout/theme.liquid` là **layout toàn cục**: khối `:root` đó áp cho mọi trang. Một thay đổi ở đó
  không còn là "fix cho app của mình" — nó là thay đổi diện mạo toàn store, và nếu sai thì sai ở
  những trang không ai trong cuộc trao đổi này đang nhìn.
- Nó cũng **không phải file app deploy được**. Bản trong repo (`docs/joyxjoy-theme/`) chỉ là bản
  export để đối chiếu; muốn nó tới store thì khách phải tự dán trong Shopify admin. Tức phương án A
  không hề "tự động" hơn — nó chỉ chuyển một việc dán tay sang một file rủi ro hơn.
- dantt dừng lại hỏi đúng chỗ (*"ủa sửa như này là sửa cả theme khách hả?"*) trước khi dán — nên
  ranh giới sở hữu file được nêu ra trước khi có thiệt hại.

Cùng đường với [[2026-09-18-cta-product-page-giu-add-to-cart-cua-theme]]: app đứng trong phạm vi của
mình và mời người dùng đi tiếp, thay vì chiếm chỗ của theme.

Cả hai phương án đều đã được **test thật** trên store bằng `--init-script` của agent-browser trước
khi chọn, và cho kết quả **giống hệt nhau trên trang subscription** — nên việc chọn B không đánh đổi
gì về hiệu quả ở đúng chỗ khách phàn nàn.

## Tradeoff

**Mất:**

- Store còn **không nhất quán về mặt thị giác**: trang subscription đúng brand font, các trang khác
  Times. Khách có thể quay lại phàn nàn tiếp, và lần đó câu trả lời là "phải sửa theme của anh".
- Bug gốc trong theme khách **vẫn sống**, cùng với bug anh em của nó (`--font-heading-weight` rỗng vì
  lấy `.weight` của một chuỗi) — không ai sửa cho tới khi có người yêu cầu.
- Trả giá quy trình ngay trong lượt này: A đã merge vào master (`b39a00591`) nên phải tạo MR revert
  rồi tạo MR mới cho B — hai MR cho một việc.

**Được:**

- Bán kính hỏng của một bản vá bằng đúng bán kính của app. Không có đường nào để một dòng CSS của
  Joy làm hỏng trang checkout hay trang sản phẩm của merchant.
- Khách dán **2 file của app** thay vì sửa `layout/theme.liquid` — file sau là thứ mọi theme update
  đều đụng vào, nên fix đặt ở đó sẽ bị ghi đè lặng lẽ ở lần cập nhật theme kế tiếp.

## Khi nào review lại (2026-12-25)

Đảo quyết định nếu: khách yêu cầu font đúng trên **toàn store** (lúc đó việc đúng là hướng dẫn họ
sửa theme, không phải app tự chiếm `:root`), hoặc nếu app bắt đầu có thêm bề mặt ngoài trang
subscription làm danh sách "file của mình" phình ra tới mức lặp lại cùng một khai báo font ở 5 chỗ.

Liên quan: [[digest-subscriptions-wholefoods-font-2026-09-25]] (ca cụ thể + cách test bằng `--init-script`) ·
[[css-var-khong-quote-lam-chet-ca-declaration]] (cơ chế) · [[2026-09-08-bespoke-khong-vao-theme-app-extension]] ·
[[2026-08-19-page-custom-o-theme-khach]] · [[subscriptions]] · [[shopify-app-dev]]
