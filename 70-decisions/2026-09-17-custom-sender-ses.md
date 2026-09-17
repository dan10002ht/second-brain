---
type: decision
title: Email custom sender đi qua SES thay Mailgun, có cổng theo ngày install
summary: Đường gửi của tính năng custom sender đổi từ Mailgun sang SES với shape `From: noreply@<domain mình sở hữu>` + `Reply-To: mail của shop`; shop cài trước một mốc ngày cứng vẫn ở Mailgun, nên hai đường gửi cùng tồn tại vô thời hạn.
tags: [subscription, avada, backend, shopify, architecture]
created: 2026-09-17
updated: 2026-09-17
review: 2026-12-17
source: repo `subscriptions` — git log 2026-09-16, hash `82bb4567d` (merge !2586, tag `v2.35.33`), `fa6d9d992`, và `6e3260a33` ghi ở [[shipped-subscriptions-2026-09-16]] (hash đã verify)
---

# Custom sender: SES thay Mailgun

## Bối cảnh

Tính năng custom sender cho phép merchant để email của app đi dưới tên miền của chính shop. Đường
gửi trước đó là **Mailgun**. Ngày 2026-09-16, merge `82bb4567d` (!2586, tag `v2.35.33`) đưa nó sang
**SES**:

> `fix - be - email - custom sender gui qua SES thay Mailgun, From noreply + Reply-To mail shop`

Cổng bật là một mốc **ngày install** nằm trong `packages/functions/src/helpers/email/isCustomSenderSes.js`
(`6e3260a33`, ghi ở [[shipped-subscriptions-2026-09-16]]): shop cài trước mốc giữ nguyên Mailgun.
Mốc đó bị sửa thêm một lần nữa ngay trước khi merge (`fa6d9d992`, đúng **1 dòng**, message
*"edit go live date"*).

## Quyết định

1. Shop install **từ mốc go-live trở đi** → custom sender đi SES.
2. Shop install **trước mốc** → giữ Mailgun, không migrate.
3. Shape header không phải "From = mail shop" mà là **`From: noreply@…` + `Reply-To: mail của shop`**.

## Why

- **Một nhà cung cấp mới không được phép làm hỏng shop đang chạy.** Cổng theo ngày install là cách
  rẻ nhất để bản mới chỉ chạm shop chưa từng gửi email lần nào, nên một lỗi cấu hình SES không thể
  làm mất email của tập shop cũ. Cùng họ với cách gate bằng cờ DevZone tường minh ở
  [[2026-09-10-devzone-hide-recurring-pricing]] — điểm chung là **cổng nằm ở dữ liệu, không nằm ở
  domain hardcode**.
- **`From: noreply` + `Reply-To` shop là shape duy nhất không cần shop verify domain.** Đặt thẳng
  mail shop vào `From` thì gửi dưới tên miền mình không sở hữu — SPF/DKIM không khớp và mail rơi
  spam hoặc bị từ chối. Reply-To vẫn đưa được thư trả lời của khách về đúng hộp thư shop, tức giữ
  được gần hết giá trị nghiệp vụ mà không đòi merchant cấu hình DNS.
- **Mốc ngày sửa được bằng một dòng.** `fa6d9d992` chứng minh điều đó trên thực tế: dời go-live là
  đổi một hằng số rồi deploy, không phải migrate dữ liệu, không phải backfill.

## Tradeoff

- **Hai đường gửi cùng tồn tại vô thời hạn.** Không có bước migrate nào cho shop cũ, nên mọi bug về
  email từ đây trở đi phải hỏi trước "shop này install ngày nào" — và mọi sửa ở tầng gửi mail có thể
  phải làm hai lần. Không có ngày hết hạn cho nhánh Mailgun trong quyết định này.
- **Mốc là ngày install, không phải cờ bật/tắt theo shop.** Muốn cho một shop cũ dùng SES (hoặc trả
  một shop mới về Mailgun) thì không có nút nào — phải dời mốc, mà dời mốc thì kéo theo cả một dải
  shop khác.
- **`From` không còn là tên miền shop.** Khách nhận thư thấy `noreply@…` chứ không thấy thương hiệu
  shop ở chỗ dễ thấy nhất. Đây là cái giá trả cho việc không bắt merchant verify domain — đúng loại
  đánh đổi cần nói rõ với CS trước khi họ hứa với merchant.
- **Đổi nhà cung cấp là đổi cả tập lỗi vận hành.** Bounce/complaint/sandbox limit của SES khác
  Mailgun; chưa thấy commit nào trong đợt này nhắc tới xử lý bounce.

## Chưa xác minh

Ba điểm phải hỏi lại trước khi trích note này làm căn cứ — chúng **không** có trong commit, đây là
suy luận từ shape header và tên helper:

- Lý do thật sự đổi sang SES (chi phí? deliverability? gom về một nhà cung cấp với app khác của
  Avada?). Message merge chỉ nói *cái gì*, không nói *vì sao*.
- Giá trị mốc go-live cuối cùng là ngày nào, và vì sao nó bị dời ở `fa6d9d992`.
- Có kế hoạch migrate tập shop Mailgun hay không.

## Điều kiện xét lại

Đọc lại quyết định này khi: có ticket đầu tiên về email không tới trên shop đi SES; hoặc khi tập shop
Mailgun đủ nhỏ để tắt hẳn nhánh cũ; hoặc khi Avada gom email của nhiều app về một nhà cung cấp chung
— lúc đó cổng "theo ngày install" thành cản trở chứ không còn là bảo vệ.

Liên quan: [[subscriptions]] · [[shipped-subscriptions-2026-09-17]] · [[shipped-subscriptions-2026-09-16]] ·
[[2026-09-10-devzone-hide-recurring-pricing]] · [[shopify-app-dev]]
