---
type: note
title: Digest Joy Subscription — 2026-09-12 (vòng polish portal Wholefoods)
summary: Vòng đo-và-sửa chi tiết của portal Wholefoods: đo computed font-size/color của CẢ mockup và build bằng cùng một probe mới lộ ra giá từng dòng MẤT HẲN (giá nằm dưới `product.variant`, không ở line), `if (disabled) return null` làm bấm `+ Add` là unmount cả lưới sản phẩm, banner lỗi đơn không bao giờ tắt vì `errorCode` không ai xoá khi khách skip, và picker collections rỗng vì chính thiết kế lọc của tôi.
tags: [avada, subscription, shopify, extensions, debug]
created: 2026-09-12
updated: 2026-09-12
source: project `subscriptions` — session history (session 0fb64e0c, `feat/wholefoods-portal`, phần SAU khi context bị compact)
---

# Digest — `subscriptions`, 2026-09-12

Cùng một session với [[digest-subscriptions-2026-09-11]] (họ lỗi "ghi đè thay vì gộp", bảng giới hạn
cứng của Customer Account UI extension, cách dựng data test đi đường của app, `grep` qua wrapper trả
kết quả sai). Note này **CHỈ phần mới** — vòng polish sau khi hai màn đã khớp cấu trúc mockup.

## Bugs

**Giá từng dòng mất hẳn — và chỉ lộ ra khi đo, không khi nhìn.** Card sản phẩm chỉ hiện tên: giá
nằm dưới `product` / `variant` chứ không ở cấp line, nên mọi chỗ đọc `line.price` ra `undefined` và
render rỗng thay vì báo lỗi. Phát hiện được vì đem **cùng một probe** đo computed
`font-size` / `weight` / `color` từng dòng ở *cả mockup lẫn build* — rà ra card lệch **8/9 dòng**,
không riêng dòng Subtotal. Thêm một chi tiết làm lệch chồng lên: **mockup dùng hai kiểu Subtotal
khác nhau ở hai chỗ**, nên "copy theo mockup" mà không phân biệt chỗ nào là sai cả hai.

**Bấm `+ Add` là mất cả lưới sản phẩm.** `ProductPicker` có `if (disabled) return null`, trong khi
`disabled` nghĩa là *"đang có request bay"* ⇒ mỗi lần thêm món là unmount toàn bộ picker. Handler
vốn async nên giữ được lưới và chỉ khoá đúng nút vừa bấm (kèm trạng thái đang chạy trên nút đó).
Cùng họ với lỗi `initLoad` ở [[digest-subscriptions-2026-09-11]]: một cờ kỹ thuật bị dùng làm điều
kiện hiển thị.

**Banner lỗi đơn không bao giờ tắt.** `errorCode` trên đơn **không bị xoá** khi khách skip đơn, mà
banner viết theo "có `errorCode` hay không" ⇒ đơn đã skip vẫn báo lỗi. Lỗi của chính lượt trước đó
của tôi. Bài học lặp lại từ [[digest-pdf-2026-07-21]]: một cờ trạng thái không có ai chịu trách
nhiệm **xoá** thì "có cờ" không đồng nghĩa "đang ở trạng thái đó".

**`Payment method` rỗng — regression do tôi.** Sửa để cắt 4 số cuối, nhưng dữ liệu thật không mang
dạng đó (trước đó hiện `ending with •••• •••• •••• 1`). Làm đẹp một chuỗi trước khi biết hình dạng
thật của nó thì đổi một lỗi hiển thị thành một ô trắng.

**Picker collections không có gì để chọn — lỗi thiết kế lọc, không phải lỗi UI.**
`subscriptionProducts` của shop có 31 sản phẩm, nhưng **không cái nào** trong 4 staple đã pin, nên
sau khi lọc theo scope thì danh sách rỗng và UI hiện "No products match your search". Triệu chứng
giống "chọn xong không lọc được", nguyên nhân là "không có gì để chọn".

**Lý do đơn Failed chưa từng được hiển thị ở đâu.** Dữ liệu đã nằm sẵn trong Firestore (mã lỗi theo
từng `cycle`), chỉ là không surface nào render — đọc thẳng đơn Failed của dev store là thấy.

**`405 Method Not Allowed`** trên thao tác sửa dòng one-off: route ở `routes/clientApi.js:91` khai
method không khớp lời gọi của extension. *(Chi tiết method/đường dẫn chính xác: chưa xác minh từ
transcript.)*

## Techniques

**Thang chữ của surface này là 12 / 14 / 16 — không có 13px.** Nên "chữ meta hơi to" không sửa được
bằng cách chọn số px; phải dùng bậc `small` + tone `subdued` để giữ quan hệ "tiêu đề nổi, meta chìm"
như mockup. Đo cả hai bên bằng cùng một thước là cách duy nhất tách *lệch thẩm mỹ không sửa được*
khỏi *lỗi thật* — lần này nó lôi ra được một lỗi mất dữ liệu. → [[so-anh-khong-so-chu]]

**Hai lần nữa "platform không hỗ trợ" là kết luận sai.** `background` nhận **conditional style**
(`MaybeConditionalStyle`) ⇒ hover làm được dù surface không cho CSS; `View border` nhận `'dashed'`
⇒ divider đứt nét làm được dù `Divider` chỉ vẽ nét liền. Ngược lại `Button kind="plain"` **bị surface
render kèm gạch chân**, trong khi mockup `.pen` không gạch chân — nên chỗ đó phải dựng bằng cách
khác. Trước khi tuyên bố giới hạn, tra type union của đúng surface đang import.
→ [[prop-sai-bi-bo-qua-im-lang]]

**Nút destructive: `Button appearance="critical"`, và quét HẾT chỗ destructive** chứ không chỉ chỗ
được chỉ — Skip order / Cancel subscription đã đỏ, chỉ `Remove` trong menu `⋯` là chưa. Đo màu thật
sau khi mở menu (`rgb(217, 28, 28)`) thay vì tin là đã đỏ.

**Chứng minh "hết thò thụt" bằng số, không bằng ảnh:** đo từng hàng lưới —
`heights [299, 299, 299]`, `buttonTops [1066, 1066, 1066]` — thì mới nói được là thẳng hàng. Và ảnh
chụp rất dễ trúng lúc skeleton còn hiện; phải chờ nội dung settle rồi mới bấm chụp, nếu không
chính ảnh "bằng chứng" lại mô tả một màn khác.

## Context

- **Mockup có chỗ sai, nhưng label thì vẫn giữ theo mockup.** Card `Your weekly subscription` trong
  mockup liệt kê cả sản phẩm one-time; chốt là **chỉ hiện hàng định kỳ**. Card tổng bên phải giữ nội
  dung của *upcoming order* nhưng đổi nhãn thành `Next order`. Hai việc khác nhau: *logic* sửa theo
  nghiệp vụ, *chữ* giữ theo mockup.
- `ProductPicker` render **trước** danh sách nên món vừa thêm bị đẩy xuống dưới cả lưới — đảo thứ tự.
- Card `Order detail` lặp lại đúng lỗi nhãn của card `Delivery info` ⇒ tách một atom `Field` dùng
  chung, thay vì sửa lần thứ hai.
- **Skeleton lệch là một dạng nói dối về layout**: skeleton cũ chỉ là một dòng chữ + ô ảnh 300×200
  cố định, còn card thật có panel xám, ảnh gần vuông, 3 dòng tiêu đề, 2 pill. Dựng skeleton theo
  đúng hình card thật.

## Liên quan

[[subscriptions]] · [[digest-subscriptions-2026-09-11]] · [[digest-subscriptions-2026-09-10]] ·
[[2026-09-09-portal-wholefoods-extension-rieng]] · [[so-anh-khong-so-chu]] ·
[[prop-sai-bi-bo-qua-im-lang]] · [[bang-chung-phan-biet-duoc]] · [[digest-pdf-2026-07-21]] ·
[[shipped-subscriptions-2026-09-12]] (cái gì landed cùng ngày) · [[cau-extension-chay-that-tren-store]]
