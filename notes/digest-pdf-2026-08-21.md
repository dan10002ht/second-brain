---
type: note
title: Digest pdf 2026-08-21 — email payment reminder layout mới, và ba lần cái thước của tôi sai chứ không phải code
summary: Số tiền bị ngắt giữa chữ số vì `overflow-wrap:anywhere` trên ô amount; email fixed ~600px giấu sạch số tiền trên điện thoại; sàn 373px không đến từ `min-width` như tôi chẩn đoán mà từ line item + `white-space:nowrap`; và merge nhẹ theo từng sub-object của `getForShop` khiến shop đã lưu theme cũ không bao giờ ăn default mới.
tags: [avada, pdf, invoice, shopify, debug, performance]
created: 2026-08-21
updated: 2026-08-21
source: project "pdf" — session history 2026-08-20/21 (session c145bb9a — SB-15857 payment reminder layout, MR !529)
---

# Digest — PDF Invoice (2026-08-21)

Phiên `/looptasksv2` cho **SB-15857 — payment reminder email new layout**: 5 lane codex +
verifier Claude, gộp về `feature/payment-reminder-layout`, MR **!529**. Task mở rộng dần
thành nút DevZone reset + một chuỗi fix responsive cho email.

## Bugs

**Số tiền bị ngắt giữa chữ số trong mail đòi nợ.** `buildReminderEmailHtml.js:242` gắn
`overflow-wrap:anywhere; word-break:break-word` lên ô amount của bảng tổng. Hai thuộc tính đó
cho phép ngắt **bên trong** một token, nên `$1,493.35` xuống dòng thành `$1,493.3` / `5`.
Trong mail đòi tiền thì đây là lỗi nặng nhất có thể có. Nó **là hệ quả của một brief sai của
tôi** — xem mục thước đo bên dưới.

**Email fixed ~600px, không có media query.** User giả định "cắt chỉ ở preview, gửi đi chắc
không sao". Render đúng bản email cuối ở 375px chứng minh ngược lại: email **không co**, giữ
~600px, tràn ngang, cột phải (toàn bộ số tiền) nằm ngoài màn hình. Không có `width:600px`
cứng nào — cả hai chỗ đều `width:100%; max-width:600px` — thủ phạm là các `min-width` cứng và
`white-space:nowrap`.

**Sàn 373px: chẩn đoán của tôi sai, thí nghiệm cô lập của lane đúng.** Tôi khẳng định
`min-width:156px` ×2 + padding (312+48+16 = 376 ≈ 373) là nguyên nhân — tức là tôi *khớp mẫu
số học* chứ không thí nghiệm. Lane T13 bác bằng cách gỡ từng khối:

```
Bỏ Customer information: bảng vẫn 373.09px
Bỏ header ticket:        bảng vẫn 373.09px
Bỏ line item:            bảng còn 289.58px
Cho nowrap được ngắt:    bảng còn 311.59px
Bỏ cả hai:               bảng đúng 277px
```

⇒ sàn đến từ **line item + số tiền không ngắt được**, không phải `min-width`.

**Store đã dùng feature không bao giờ ăn layout mới.** `paymentReminderRepository.getForShop`
merge **nông theo từng sub-object**: `theme: {...default, ...saved}`. Field nào shop *chưa
từng lưu* thì tự ăn default mới; field đã lưu (`logoImage`, `logoSize`, `overdue.content`)
thì giữ giá trị cũ vĩnh viễn. Đó là lý do phải có nút DevZone **Reset payment reminder** —
reset mọi thứ **trừ cờ `enabled`**, và chỉ áp cho shop đang mở DevZone.
Giả định đi kèm ("feature mới, chưa ai dùng") **sai với production** — đếm bằng dữ liệu thật
mới thấy đã có store lưu theme cũ.

**422 khi Send test chỉ là cái vỏ.** Schema `reminderConfig` + `email` PASS khi ném payload
thật của FE qua. Lỗi thật nằm sâu hơn: nodemailer ném `Invalid status code 502` (SMTP), rồi
bị bọc lại thành 422 ở tầng ngoài. Đừng dừng ở mã lỗi ngoài cùng.

**Shipping/Billing address rỗng không phải app làm mất.** Order `#1004`/`#1003` là **đơn B2B
công ty** (`purchasing_entity: PurchasingCompany`) — `shipping_address`/`billing_address` trên
order thật sự `null`, địa chỉ nằm ở **company location** (`companyQuery.js` đã có sẵn
`billingAddress`/`shippingAddress`). `orderParse.service.js` không đụng gì tới địa chỉ. Chốt
theo ý user: ẩn cả tiêu đề *Customer information* đổ xuống khi cả hai rỗng.

**Nút "Send test" dùng `storage/order.json`**, không phải dữ liệu store thật. Muốn test bằng
data thật phải đi đường script (`src/commands/`), và người nhận **ghi cứng** trong script —
đường gửi thật lấy `to = order.customer?.email`, tuyệt đối không chạm.

## Techniques

**Joy làm line item email đúng và đơn giản hơn ta.** Đối chiếu `~/projects/subscriptions`:

| | Joy | PDF (bản lane vừa làm) |
|---|---|---|
| Cấu trúc | hai `<td>` **thật** trong một `<tr>` | `inline-block` + `min-width` |
| Ảnh | `width:60px` + `img{width:100%}` → **co được** | `width:60px` cứng |
| Giá | **không** `white-space:nowrap` | `nowrap` |
| Hai cột thông tin | `width: calc((100% - 1px) / 2)` | `min-width` |

Ô bảng thì **không bao giờ rơi xuống**, nên không cần ngưỡng stack nào cả. Chi tiết hướng đã
chốt ở [[2026-08-21-line-item-email-kieu-joy]].

**Không phải font-size.** User nghi font — số liệu ngược lại: font của ta **nhỏ hơn** Joy
(20/15/14/13/12 vs 24/20/16/15/12). Sau đó user vẫn hạ 5 chỗ về đúng nấc của Joy vì *đẹp
hơn*, không phải vì tràn.

**Padding chồng ba tầng**: td ngoài 8×2 + card 24×2 + ticket 24×2 = 112px/dòng, trong khi Joy
chỉ 8 + **12** + 24 = 88px. Trước khi đi tìm `min-width` nào giữ sàn, cộng padding trước.

**Preview trong settings page**: PDF bọc email trong `<iframe>`, Joy bơm thẳng bằng
`dangerouslySetInnerHTML`. Cả hai đều dùng `Layout.Section variant="oneThird"` — khác biệt
không nằm ở Polaris layout mà ở hai lựa chọn kiến trúc ngược nhau (và iframe là thứ làm
`scrollWidth` vô dụng, xem dưới).

**Backtick trong `git commit -m` bị shell chạy** (`command not found: revert`) và ăn mất chữ
trong message. Sửa bằng `git commit --amend -F -` + heredoc rồi `--force-with-lease`.

**Chọn file CSS đã build bằng `ls -S`** (lớn nhất) là sai — nhặt phải `index-ot7wnwZm.css`
trong khi rule nằm ở `index-CmiliOTa.css`, dẫn tới kết luận "fix không ăn". Chọn bằng
`grep -l <class>`.

## Context

- **Nguồn sự thật của layout mới là `/email-templates`** trong mockup-app, **không** phải
  preview ở `/automation_email/payment-reminders/*` (BA không dựng được ở trang kia).
- `mockup-app/src/utils/buildReminderEmail.js` chính là spec — và comment trong đó ghi lại
  từng quyết định + phương án đã loại. **Chúng bị port nguyên xi sang production**: 150/446
  dòng của `buildReminderEmailHtml.js` là comment (33%). User yêu cầu chỉ giữ comment ở luồng
  thật sự đặc biệt → xem [[feedback-comment-chi-khi-code-roi]]. Bài học mới: comment biện
  minh cho quyết định thuộc về **file spec**, không đi cùng code khi port.
- Verifier vòng 1 của T1 trả FAIL vì **artefact chia nhánh** (nhánh T1 không có T2/T3 nên
  thiếu khối đính kèm) — lỗi này lặp lại y hệt ở T4. Cách phân xử: `git show <branch>:<file>`
  trên nhánh **hợp nhất**, không phải nhánh của lane.
- Verifier Claude **chết giữa chừng vì hết quota tuần** (reset 16:00 VN) ⇒ T10–T13 không
  được verify độc lập; mỗi commit message ghi rõ điều đó.
- Codex **tự tụt model** `gpt-5.6-sol xhigh` → `gpt-5.6-luna low` giữa task và báo "không thể
  chuyển model giữa chừng". Cách xử: `ctrl+c` hai lần, relaunch với
  `-m gpt-5.6-sol -c model_reasoning_effort=xhigh`, rồi **đọc lại dòng model in ra**.
- `cmux send` với đoạn dán dài bị kẹt trong ô nhập (`› Vò[Pasted Content 2012 chars]`) —
  Enter bị nuốt. Cách chắc: ghi brief ra file rồi gửi một câu ngắn trỏ vào file.
- Lane có thể **đứng im 0% CPU** mà không báo gì. Kiểm bằng CPU + mtime của working tree,
  và khi việc nhỏ thì tự làm thay vì đấm tiếp.
- Dev server mockup chết vì **tôi gỡ chính worktree nó đang chạy từ đó**.
- Tạo MR không có `glab`, không có token trong env: dùng **git push options** hoặc
  `git credential fill` với credential đã lưu — xem [[feedback-khong-in-secret-ra-chat]].

## ⚠️ Chưa xác minh

- Email vẫn tràn ở viewport **320px** — giới hạn đã biết, chưa xử.
- Task 6 `[⏸️]` — `{{pay_link}}` lấy từ đâu (đang giả định `order.order_status_url`, fallback
  `invoiceLink`) chờ Philip xác nhận.
- Việc reset layout **hàng loạt cho mọi store đã dùng** mới chỉ đếm số, chưa chạy.

## Liên quan

[[pdf]] · [[2026-08-21-line-item-email-kieu-joy]] ·
[[do-be-ngang-headless-chrome]] ·
[[digest-pdf-2026-08-13]] · [[feedback-comment-chi-khi-code-roi]] ·
[[bang-chung-phan-biet-duoc]] · [[2026-08-07-phan-tang-verifier]]
