---
type: decision
title: Múi giờ contract — bỏ backfill, resolve từ location của shop lúc đọc
summary: Sau hai vòng sửa backfill `Customer TimeZone` trong cùng một ngày, bỏ hẳn hướng backfill: múi giờ thuộc về delivery location chứ không thuộc về contract, nên đọc từ dữ liệu location của shop lúc render (cache 1 giờ), và không đoán khi location trả về nhiều giá trị mâu thuẫn.
tags: [subscription, shopify, avada, backend, firestore, extensions]
created: 2026-09-18
updated: 2026-09-18
review: 2026-12-18
source: repo `subscriptions` — git log 2026-09-17, hash `8c1852787` · `9b805d954` · `2a52c9ba3` · `527168c6f` (đã verify)
---

# Quyết định

Portal Wholefoods **thôi dựa vào một giá trị `Customer TimeZone` được backfill lên contract**. Múi
giờ nay được resolve **lúc đọc** từ dữ liệu location của chính shop, cache 1 giờ sau một lượt đọc
Firestore. Script backfill vẫn còn trong repo nhưng không còn là cơ chế mà tính năng phụ thuộc vào.

Điểm quan trọng: **không đoán**. Location mà dữ liệu shop trả về nhiều múi giờ mâu thuẫn thì để
**chưa resolve**, chứ không lấy giá trị xuất hiện nhiều nhất.

Đây không phải chuyện hiển thị. `deliveryDayLock` tính **mốc khoá sửa** bằng múi giờ này — xem
[[2026-09-10-cutoff-theo-delivery-day]] — nên sai múi giờ là khoá sửa đơn của khách nhầm ngày.

## Why

Hướng backfill sụp trong **đúng một ngày**, qua ba lần chạm:

1. **`8c1852787`** — viết `backfillCustomerTimeZone.js`, ghi **Firestore only, Shopify is never
   touched**. Chạy trên `ag-ngocvtb-subs-stg3-2`: 5 contract ghi xong, đọc lại báo sạch.
2. **`9b805d954`** — portal **vẫn không thấy gì**. Endpoint đọc contract bằng `fullResp: true`, tức
   fetch từ Shopify rồi **spread đè lên document Firestore** ⇒ bản Shopify thắng, mọi lượt ghi
   Firestore-only bị xoá ở mỗi lần đọc (điều này đã ghi ở [[digest-subscriptions-2026-09-17]]). Sửa
   thành ghi lên contract Shopify. Chạy lại: **6 cần, 5 ghi được**.
3. **`2a52c9ba3`** — bỏ hướng backfill. Ba lý do commit nêu, đều là giới hạn **cấu trúc** chứ không
   phải bug của script:
   - Bird **không bao giờ** đóng dấu `Customer TimeZone` cho contract Pick Up. Đo được: Delivery
     14/15 có, Pick Up **0/4**. Nguồn không ngừng sinh contract thiếu.
   - Contract tạo **sau** lượt chạy gần nhất luôn trắng ⇒ backfill là cuộc đuổi không bao giờ bắt kịp.
   - Shopify **từ chối update** contract đang giữ billing cycle edit — contract `164719034422` bị
     chặn đúng như vậy, và **không backfill nào chạm tới nó được**, hôm nay hay về sau.

Lý do khái niệm ở dưới cùng: **múi giờ là thuộc tính của delivery location, không phải của một
contract.** Chép nó vào từng contract là nhân bản một sự thật thuộc chỗ khác — và mọi bản sao đều có
đúng một cách hỏng: lệch bản gốc mà không ai biết. Đây là cùng một nước đi đã chọn cho bundle:
[[2026-09-15-bundle-sync-resolve-muon]] (bỏ job ghi ngược, resolve muộn lúc đọc) và là mặt trái của
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]].

Fallback shop timezone **không dùng được**, và điều này đã đo: shop đọc `America/New_York` trong khi
Bird ghi `Asia/Saigon` cho **cùng một location** (`826f061b1`). Một fallback sai còn tệ hơn không có
fallback, vì nó không bao giờ hiện ra như một lỗ trống.

## Tradeoff

**Được:**

- Contract mới không cần chờ ai chạy gì — có location là có múi giờ.
- Contract bị Shopify khoá vì billing cycle edit **vẫn resolve được**, vì không cần ghi gì lên nó.
- Một nguồn sự thật. Sửa location là mọi contract của nó đổi theo.

**Mất:**

- **Thêm một lượt đọc Firestore trên đường render** của một Customer Account extension. Cache 1 giờ
  giấu phần lớn chi phí, nhưng lượt đầu mỗi giờ mỗi shop nằm trên đường người dùng nhìn thấy.
- **Cache 1 giờ tức lệch tới 1 giờ** sau khi merchant sửa múi giờ location. Với mốc khoá sửa neo theo
  ngày thì hầu như vô hại, nhưng nó là độ trễ có thật, không phải 0.
- **Luật "mâu thuẫn thì bỏ trống" nghĩa là sẽ có contract không có múi giờ** — cố ý. Đổi lại là một
  field trống thay vì một con số sai trông như đúng. Chưa có cảnh báo nào cho merchant khi dữ liệu
  location của họ mâu thuẫn ⇒ trạng thái này hiện **im lặng**.
- Resolve lúc đọc nằm **trên đường nóng**: nó hỏng thì hỏng khi khách đang xem, không hỏng lúc chạy
  script. Trong surface không có error boundary thì hậu quả là trắng cả portal —
  [[khong-error-boundary-hong-ca-man-hinh]]. `8c1852787` đã gặp đúng ca đó với giá trị free text
  không parse được, nên phải validate ngay tại chỗ đọc.

## Cần kiểm lại vào 2026-12-18

- Còn bao nhiêu contract **chưa resolve được** múi giờ, và merchant có biết không?
- Cache 1 giờ đã gây ra ca lệch nào chưa, hay có thể nới ra?
- Bird có bắt đầu ghi `Customer TimeZone` cho Pick Up chưa — nếu có, lý do số 1 ở trên hết hiệu lực
  nhưng hai lý do còn lại **vẫn còn**.
- `backfillCustomerTimeZone.js` còn ai chạy không? Script sống mà không còn ai phụ thuộc là bẫy cho
  người sau.

Liên quan: [[subscriptions]] · [[shipped-subscriptions-2026-09-18]] ·
[[2026-09-15-bundle-sync-resolve-muon]] ·
[[2026-09-10-cutoff-theo-delivery-day]] · [[digest-subscriptions-2026-09-17]] ·
[[digest-subscriptions-bird-2026-09-14]] · [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] ·
[[khong-error-boundary-hong-ca-man-hinh]] · [[ack-khong-phai-hieu-ung]]
