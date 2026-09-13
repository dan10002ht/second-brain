---
type: note
title: Digest Joy Subscription — 2026-09-13 (metafield plan mồ côi trên product nhân bản; race gõ-rồi-xoá làm picker hỏng vĩnh viễn)
summary: Duplicate một product trên Shopify là copy luôn metafield `avada_subscription_plan_v2.data`, nên bản sao hiện widget subscription dù không nằm trong plan nào — và "re-sync / save lại plan" KHÔNG dọn được vì đường ghi chỉ chạm product plan tự nhận; cách đúng là xoá metafield. Kèm một race của picker: gõ rồi xoá nhanh thì response cũ về sau và danh sách rỗng vĩnh viễn chứ không chỉ một lượt.
tags: [avada, subscription, shopify, debug, extensions]
created: 2026-09-13
updated: 2026-09-13
source: project `subscriptions` — session history (session ced3d8bd ticket Slack `C07URV6QMJ8`; session 0fb64e0c `feat/wholefoods-portal`)
---

# Digest — `subscriptions`, 2026-09-13

Phần lớn session `0fb64e0c` đã được ghi ở [[digest-subscriptions-2026-09-11]] và
[[digest-subscriptions-2026-09-12]]. Note này **CHỈ hai thứ chưa có chỗ nào ghi**.

## Bugs

**Metafield plan mồ côi trên product nhân bản.** Ticket CS: một product hiện widget subscription
dù không có plan nào trỏ tới nó. Nguyên nhân: `avada_subscription_plan_v2.data` là metafield
**trên product**, nên khi merchant dùng chức năng Duplicate của Shopify thì bản sao **thừa kế luôn
metafield** — nội dung metafield không sai, nó **sai chỗ**. Widget đọc metafield chứ không đối chiếu
ngược với `plans[]`, nên bản sao vẫn render.

Điểm đắt nhất là **hướng sửa mà CS hay đề xuất thì không ăn thua**: "re-sync" hoặc "save lại plan"
chỉ ghi metafield cho những product mà plan **đang nhận**, nó không có mệnh đề nào dọn product
*không* nằm trong plan. Phải **xoá** metafield trên đúng product đó.

Cách làm đã dùng: script scan + xoá, **mặc định dry-run**, phải duyệt mới ghi vào Shopify prod.
Dry-run lòi ra thêm một product mồ côi thứ hai mà CS chưa báo — tức đếm bằng script rộng hơn phạm
vi ticket là bước đáng làm. Verify sau khi xoá bằng cách **đọc lại từ Admin API ngay lúc đó**
(`2 carry the metafield, 0 orphan`) chứ không đọc lại log của chính lượt ghi →
[[ack-khong-phai-hieu-ung]].

Cùng họ với [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]]: mỗi lớp đều "chạy đúng" — Shopify
copy đúng thứ được yêu cầu copy, đường sync ghi đúng tập product của plan, widget đọc đúng metafield
nó thấy — và không lớp nào có nghĩa vụ phát hiện product mang metafield của một plan không nhận nó.

**Gõ rồi xoá nhanh làm `ProductPicker` rỗng VĨNH VIỄN.** Khác với cơn bão 14 request đã sửa hôm
trước ([[digest-subscriptions-2026-09-11]]): lần này sequence chậm thì đúng, chỉ hỏng khi gõ
(`"Star"`) rồi xoá **trước lúc response về**. Response cũ về sau, ghi đè state (và cache) của truy
vấn đã bị huỷ, nên danh sách ở trạng thái nghỉ tụt từ 19 sản phẩm xuống rỗng và **không tự khỏi** —
không phải một lượt hiển thị sai mà là trạng thái hỏng dính lại.

Chẩn đoán được vì **tái hiện đúng thao tác của người báo lỗi** và ghi lại request, thay vì thử
"tìm kiếm rồi xem kết quả" theo nhịp của người đang debug. Bug chỉ tồn tại trong khoảng thời gian
mà thao tác nhanh hơn mạng — nhịp gõ của người test là một biến của phép thử.

Luật chung: một lời gọi bất đồng bộ có thể bị huỷ ý nghĩa trước khi nó trả về, nên response phải
tự khai nó thuộc truy vấn nào và bị **vứt đi nếu không còn là truy vấn hiện tại** — debounce chỉ
làm thưa request chứ không giải quyết chuyện response về sai thứ tự.
→ [[dong-bo-chan-luong-khong-phai-chuyen-hieu-nang]]

## Context

- Session `ced3d8bd` là một ticket CS độc lập, không liên quan nhánh `feat/wholefoods-portal`.
- Ba project còn lại của lượt mining hôm nay (`aws`, `game-server`, `ticket-mcrsv`) là **cùng những
  session đã ghi** ở [[digest-aws-2026-09-09]], [[digest-game-server-2026-09-09]] và
  [[digest-ticket-mcrsv-2026-09-11]] — không có gì mới.

## Liên quan

[[subscriptions]] · [[digest-subscriptions-2026-09-12]] · [[digest-subscriptions-2026-09-11]] ·
[[ack-khong-phai-hieu-ung]] · [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] ·
[[dong-bo-chan-luong-khong-phai-chuyen-hieu-nang]] · [[subscriptions-debug-runbook]]
