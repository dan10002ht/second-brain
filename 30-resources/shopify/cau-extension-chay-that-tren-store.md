---
type: resource
title: Customer Account UI extension — điều kiện để nó thật sự chạy trên store
summary: Một full-page Customer Account extension chỉ xuất hiện trong editor qua **dev preview**, không qua bản release; nó cần một mục menu mới đến được; nó gọi backend qua HTTPS công khai nên `localhost` không dùng được; và "Clean dev preview" xoá luôn page + menu item vừa dựng.
tags: [shopify, extensions, avada, tooling]
created: 2026-09-09
updated: 2026-09-09
source: project `subscriptions` — session history 2026-09-09 (dựng `customer-account-ui-wholefoods` trên `dantt-subscription-box`)
---

# Customer Account UI extension — bốn điều kiện, đo được từng cái

Dựng một extension full-page cho customer account (`customer-account.page.render`) thì code chạy được
là phần nhỏ. Bốn ràng buộc dưới đây từng ngốn phần lớn thời gian của một phiên, và chúng **không nằm
trong lỗi nào** — mọi thứ đều "thành công" cho tới khi mở trang ra và thấy không có gì.

## 1. Bản release KHÔNG đưa extension vào editor — chỉ dev preview đưa

| Trạng thái | Extension có trong dropdown của customer-account editor? |
|---|---|
| `shopify app deploy` (release) | **không** |
| `shopify app dev` (dev preview) | có |

Đo được: sau khi deploy version mới, dropdown chỉ còn Sign-in / Orders / Order status / Profile.
Nghĩa là **`shopify app dev` phải đang chạy** thì mới cấu hình và xem được trang này.

## 2. "Clean dev preview" xoá luôn page + menu item

Hộp xác nhận của Shopify nói đúng thứ nó làm: bấm Clean dev preview thì page của extension và **mục
menu** trỏ tới nó biến mất, nav quay về Orders / Profile / Subscriptions. Nếu đang dùng nó để ép store
lấy bundle mới thay vì dev bundle thì phải biết cái giá này — và biết rằng deploy lại **không** khôi
phục được (xem mục 1).

## 3. Page tồn tại ≠ khách tới được — phải add vào menu

Editor nói thẳng: *"To give customers access to this page, create a new menu for Store default or add
this page to an existing menu."* Trước khi thêm mục menu, extension **có render** (preview hiện đúng
tiêu đề) nhưng không có đường nào từ tài khoản khách đi tới. Đường đi trong admin:
Settings → Customer accounts → Configurations → **Customize** → editor → đổi surface bằng dropdown ở
thanh trên → chọn trang của extension → **Add to menu**. Thứ tự bấm khi lưu rất dễ trượt: ✓ xác nhận
dòng menu → Save của panel → Save của editor; bỏ bước nào cũng mất thay đổi mà không báo.

## 4. Backend phải HTTPS công khai — `localhost` không dùng được

Extension chạy trong customer account của Shopify, nên nó gọi ra ngoài: `localhost:3001` không tới
được. Hai lối:

- **Tunnel HTTPS** trỏ về backend local (Tailscale Funnel `https://<name>.ts.net` → `127.0.0.1:5002`
  chạy được; tunnel `trycloudflare` mà CLI ghi lên app là **của phiên dev trước** và thường đã chết).
- Patch hằng URL (`NEW_CP_BASE_URL`) rồi deploy — nhưng nếu dev preview đang bật thì **store vẫn lấy
  dev bundle**, nên bản deploy đã patch không có tác dụng. Phải đo URL nằm trong bundle nào, đừng suy luận.

Hai chi tiết vận hành đi kèm, đều đã trả giá:

- `shopify app dev` hardcode **port 3002**, trùng với script dev backend của app ⇒ **không chạy song
  song được**; phải chọn một trong hai chế độ.
- `shopify app dev` **chỉ watch thư mục extension**, không watch `packages/functions/src/`. Sửa hằng số
  ngoài extension thì không cần restart — chỉ cần **chạm (touch) một file trong extension có import
  nó**, dev rebuild trong ~4 giây.

## Kiểm chứng: chỉ tin URL trong request thật

Mọi bước ở trên đều có cách "trông như đã xong": deploy báo released, dev báo rebuild, nút báo đã bấm.
Thứ duy nhất kết luận được là **đọc request thật trong browser** (URL nào được gọi, mã trả về gì) và
grep **URL nằm trong bundle đang được phục vụ**. → [[ack-khong-phai-hieu-ung]].

Liên quan: [[app-development]] · [[digest-subscriptions-2026-09-09]] ·
[[2026-09-09-portal-wholefoods-extension-rieng]] · [[shopify-token-exchange-migrate-offline-token]]
