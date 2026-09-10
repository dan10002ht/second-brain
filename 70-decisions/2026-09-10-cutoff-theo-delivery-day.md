---
type: decision
title: Portal Wholefoods khoá sửa theo Delivery day của Bird, bỏ bảng cutoff hardcode từ mockup
summary: Điều kiện khoá box/staples/one-off chuyển từ bảng cut-off hardcode theo mockup sang luật "đúng ngày giao thì khoá mọi thao tác sửa, chỉ còn pause/resume/cancel/change frequency" — neo vào attribute Delivery Date của app Bird, fallback `nextBillingOrderDate`.
tags: [avada, subscription, shopify, extensions]
created: 2026-09-10
updated: 2026-09-10
status: active
review: 2026-12-10
source: project `subscriptions` — session history 2026-09-10 (portal Wholefoods, contract `#33476345974`)
---

## Quyết định

Trong extension `customer-account-ui-wholefoods`, điều kiện khoá thao tác sửa **không** còn lấy từ
bảng cut-off hardcode dựng theo mockup. Luật mới:

- **Đúng ngày giao ⇒ khoá toàn bộ thao tác sửa** — dòng sản phẩm (`⋯` edit/swap/remove), thêm staples,
  thêm one-off, ở cả màn detail lẫn order detail.
- **Vẫn mở** trong ngày giao: pause, resume, cancel, change frequency.
- Ngày giao = `Delivery Date` (attribute của app Bird) khi có, **fallback** `nextBillingOrderDate`.
- Nhãn hiển thị **giữ nguyên theo mockup** — chỉ đổi logic bên dưới.
- Luật này áp cho cả `SubscriptionCard` ở màn list, để hai màn nói cùng một chuyện.

Cutoff và permission là **hai cơ chế khác nhau, AND với nhau**: một control chỉ hiện khi
`checkPermissionCustomerPortal` cho phép **và** cửa sổ sửa đang mở.

## Why

- Bảng cut-off trong mockup là **mô tả một quy tắc vận hành**, không phải hợp đồng dữ liệu. App đã có
  `enabledCutOff` / `cutOffDayWeek` trên plan, và store thật có attribute Delivery Date của Bird — giữ
  một bảng hardcode song song là dựng nguồn sự thật thứ ba.
- Mục đích nghiệp vụ của việc khoá là **để kho chuẩn bị hàng trong ngày giao**, không phải một mốc giờ
  trừu tượng. Luật neo vào ngày giao mới diễn đạt đúng ý đó.
- Bảng hardcode cho kết quả **sai thấy được**: contract `#33476345974` giao **Saturday** bị khoá sạch
  staples/one-off/edit dù chưa tới ngày giao. Tính lại bằng chính helper thì luật mới mở đúng.
- Test khoá được luật này bằng mutation-check: đổi phép so ngày sang UTC thì test phải đỏ — và nó đỏ.

## Tradeoff

- **Phụ thuộc app Bird.** Contract nào không có attribute Delivery Date phải rơi về
  `nextBillingOrderDate`, mà hai thứ này không luôn cùng nghĩa: `Delivery Date` mô tả **kỳ giao**, còn
  ngày tính tiền là mốc billing. Ở order detail đã phải sửa `getDeliveryDayInfo` vì đúng chỗ lệch
  nghĩa này. Store không dùng Bird sẽ chạy hoàn toàn bằng fallback — hành vi khác so với store có Bird.
- **Cửa sổ khoá rộng hơn bảng cut-off cũ ở một số ca và hẹp hơn ở ca khác.** Khách quen với mốc cũ sẽ
  thấy hành vi đổi; không có đường thông báo nào cho chuyện đó.
- **Múi giờ là điểm gãy.** So ngày phải theo giờ store, không phải UTC — đã có test canh, nhưng đây là
  loại lỗi tái phát mỗi khi có người thêm đường tính ngày mới.
- Luật hiện sống trong extension custom. Nếu portal cũ về sau cũng cần luật này thì phải nâng lên
  helper dùng chung, và lúc đó phải quyết lại: `checkPermissionCustomerPortal.js` đang là vùng cấm sửa.

Liên quan: [[digest-subscriptions-2026-09-10]] · [[2026-09-09-portal-wholefoods-extension-rieng]] ·
[[subscriptions]] · [[lich-dinh-ky-neo-theo-ngay-du-kien]]
