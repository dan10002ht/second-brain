---
type: note
title: PDF Invoice — digest 2026-08-27
summary: Khối địa chỉ rỗng trong mail reminder là dữ liệu thật của đơn B2B tạo tay chứ không phải app làm mất, nên fix là ẩn cả khối; cách Joy giữ hai cột không bao giờ rơi là hai `<td>` thật cộng `width: calc((100% - 1px)/2)` chứ không `min-width`; và gửi mail bằng data store thật phải đi đường script với người nhận ghi cứng.
tags: [avada, pdf, invoice, shopify, debug, nodejs]
created: 2026-08-27
updated: 2026-08-27
source: project `pdf` — session history 2026-08-27 (session c145bb9a, phần sau compaction)
---

# PDF Invoice — digest 2026-08-27

CHỈ phần mới so với [[digest-pdf-2026-08-25]] (cột ảnh co được, script trong `src/commands/`),
[[digest-pdf-2026-08-24]] (padding chồng ba tầng, comment mockup port nguyên) và
[[digest-pdf-2026-08-22]] (422 là vỏ của lỗi SMTP, đơn B2B không có địa chỉ trên order).

## Bugs

### Shipping/Billing address rỗng trong mail thật — không phải app làm mất

Mail gửi thử từ order `#1004` của `dantt-pdf-dev` ra khối "Customer information" trống trơn. Tra
hết ba tầng: `orderParse.service.js` **không đụng gì tới địa chỉ**, và order thật có
`shipping_address: null` + `billing_address: null` vì đó là **đơn B2B công ty tạo tay**
(`purchasing_entity: PurchasingCompany`) không nhập địa chỉ. `companyQuery.js` có sẵn
`billingAddress`/`shippingAddress` của company location, nhưng `getOrderForPdf` không nạp.

Hướng chốt: **ẩn từ tiêu đề "Customer information" đổ xuống khi cả hai cột rỗng** — không cố kéo
địa chỉ company vào mail reminder. Cột nào rỗng thì không vẽ, cả khối biến mất nếu không có địa
chỉ nào (`162516813`).

### Hai cột rơi xuống hàng: `inline-block` + `min-width` là sai cách

Joy giữ "Order details" và "Customer information" luôn 2 cột ở mọi khổ bằng **hai `<td>` thật
trong một `<tr>`** cộng CSS:

```css
.Avada-Email__Order--DetailItem { width: calc((100% - 1px) / 2); }
```

Ô bảng thì không bao giờ rơi xuống, và **không có `min-width` nào**. Bản của mình dùng
`inline-block` + `min-width` nên rơi. Sau khi đổi: 2 cột ở cả 277/375/600px, không số nào bị ngắt
(`842192488`). Đây là mảnh thứ ba của cùng một bài học đã ghi ở [[digest-pdf-2026-08-25]] —
mọi lần chẩn đoán bằng `min-width` trong phiên này đều sai.

### Font-size đang to hơn Joy đúng một nấc ở 5 chỗ

Soi từng chỗ đối chiếu Joy: 5 chỗ to hơn một nấc, 4 chỗ vốn đã khớp. Hạ theo cách tách — giữ 14px
cho đúng hai chỗ (**Pay now** và **nội dung merchant**), còn lại hạ. Trước đó tôi đã trả lời sai
rằng font-size là nguyên nhân email không co được: số liệu ngược lại, font của mình **nhỏ hơn** Joy
(20/15/14/13/12 so với 24/20/16/15/12).

## Techniques

### Gửi mail bằng dữ liệu store thật (không phải sample order)

Nút "Send test" dùng `sampleOrder` ở `storage/order.json`, không phải data store thật. Muốn data
thật thì đi đường script:

1. Script một lần trong `src/commands/` theo quy ước sẵn có của repo.
2. Repository dùng instance Firestore riêng ⇒ truyền credential qua **biến môi trường**.
3. Shopify cần khoá giải mã access token trong `.env.local` ⇒ nạp env **trước** khi jest khởi động,
   không in ra.
4. **Người nhận ghi cứng trong script**, không bao giờ lấy từ `order.customer?.email` — đường gửi
   thật lấy địa chỉ từ order, và gửi nhầm khách thật thì không lùi lại được.

Dọn file tạm ngay sau khi gửi.

### Bẫy môi trường của repo chính, không phải regression

Build assets đỏ vì `morphdom` khai trong `package.json` nhưng **chưa cài** ở repo chính — bẫy này
đã ghi sẵn trong `BRIEF.md`. Verify bằng worktree khác trước khi nghi thay đổi của mình.

## Context

- Giả định "feature payment reminder chưa ai dùng" **sai với production** — đếm thật trên
  `pdf-invoice-4717c` ra 2 shop đã có doc `paymentReminder`. Nên yêu cầu "reset layout cho toàn bộ
  khách đã dùng" là **ghi vào dữ liệu thật của khách**, không lùi lại được. Nút DevZone reset hiện
  chỉ áp cho shop đang mở DevZone, reset mọi thứ trừ cờ `enabled`.
- Hai phép đếm của chính tôi sai liên tiếp khi đo con số này (cột "có đặt màu" chỉ kiểm khác rỗng
  mà default cũng khác rỗng; mảng `diff` dựng từ `Object.entries(DEF)` nên in ra default chứ không
  phải giá trị đang lưu) — cùng họ với [[digest-pdf-2026-08-24]].
- MR !529 gộp toàn bộ SB-15857; các commit chiều 08-27 (địa chỉ rỗng, font-size, hai `<td>`) vào
  cùng nhánh theo yêu cầu "gộp chung luôn".
- `mockup-app/yarn.lock` vẫn untracked từ đầu phiên — cố ý không commit.

⚠️ *Chưa xác minh*: T10–T13 chưa qua verifier độc lập (agent chết vì hết quota tuần); các commit
đều ghi rõ điều đó trong message.

## Liên quan

[[pdf]] · [[runbook-agent-pdf-invoice]] · [[digest-pdf-2026-08-25]] · [[digest-pdf-2026-08-24]] ·
[[digest-pdf-2026-08-22]] · [[2026-08-21-line-item-email-kieu-joy]] ·
[[gate-hop-nhat-truoc-khi-merge]] (FAIL giả của verifier T1/T4 cùng phiên) ·
[[brief-state-agent-loop]] · [[feedback-khong-in-secret-ra-chat]] · [[bang-chung-phan-biet-duoc]]
