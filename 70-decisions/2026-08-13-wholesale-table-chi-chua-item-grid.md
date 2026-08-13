---
type: decision
title: Wholesale template — `<table>` chỉ chứa item grid + totals, footer bỏ `<tfoot>` in một lần
summary: PDF Invoice đảo hướng trình bày wholesale: mọi khối không phải lưới hàng (banner Total, order tag, extra information, footer) rời khỏi `<table>` thành sibling block-level, và footer bỏ `<tfoot>` — chấp nhận mất tính năng "lặp footer mỗi trang" mà bản gốc Word cố ý có.
tags: [pdf, invoice, shopify, avada, patterns]
created: 2026-08-13
updated: 2026-08-13
status: active
review: 2026-11-13
source: repo "pdf" — git log 2026-08-12, commit `9892fb452` và `8e90b7927` (nhánh `feat/wholesale-invoice-template`, SB-15444); MR !506 = `6ba851e32`, tag `v3.1.78`
---

# Wholesale template: table chỉ chứa lưới hàng

**Quyết định.** Trong 7 theme wholesale, `<table>` từ nay **chỉ** chứa item grid và stack totals.
Banner Total, order tag, extra information (note của merchant, footer note, thank-you, QR code,
social links) và footer **không còn là `<tr>`** mà là block-level sibling của table. Footer
**không nằm trong `<tfoot>`** nữa mà là row cuối của `<tbody>` (`9892fb452`), rồi rời hẳn ra ngoài
table (`8e90b7927`). CSS của các khối này chuyển từ selector `td` sang chính block.

Đã landed master: MR !506 = `6ba851e32`, tag **`v3.1.78`**.

## Why

- **Bản cũ dùng `<tr>` chỉ để mượn full-width của table.** Đó là lý do trình bày, và một sibling
  block-level có full-width **miễn phí** — cái giá phải trả thì không miễn phí.
- **Cái giá đó là phân trang.** Chrome lặp `<thead>` trên mọi trang mà **TABLE trải qua**, không
  phải mọi trang có row. Bất kỳ khối nào trong số đó tràn sang trang mới đều **kéo dài table sang
  trang đó** và lôi theo heading ⇒ trang cuối chỉ có QR code + footer vẫn in
  `SKU / PRODUCT TITLE / QUANTITY`: tiêu đề cột trên một trang không có cột nào bên dưới. Đây là
  **mặt sau của đúng cơ chế** đã ghi ở [[digest-pdf-2026-07-30]] ("Chrome chỉ lặp header khi nó ở
  trong `<thead>`") — chỗ đó nói cách **bật** lặp, chỗ này nói cái giá của việc bật.
- **`<tfoot>` là quyết định cũ có lý do, và lý do đó hết hiệu lực.** Bản Word nguồn lặp footer ở
  mọi trang nên `<tfoot>` là dịch đúng ý đồ. Merchant nay muốn footer **một lần, ở cuối**. Không
  có cách nào cho `<tfoot>` chỉ hiện ở trang cuối ⇒ phải đổi cơ chế, không phải đổi CSS.
- **Phần thưởng kèm theo:** bỏ `<tfoot>` trả lại cho mỗi trang dải giấy nó đang giữ chỗ ⇒ **nhiều
  item lọt hơn mỗi trang**.

## Tradeoff

| Mất | Được |
|---|---|
| Footer **không còn lặp mỗi trang** — đúng thứ bản Word gốc cố ý có. Nếu merchant khác (hoặc chính merchant này) cần lại, không có đường quay lại bằng cấu hình: phải đảo cơ chế | Không còn trang "chỉ heading, không cột"; document đóng đúng thứ tự totals → Total → extra info → footer |
| CSS phải dời khỏi `td` sang block — **padding do cell mang sẽ bị vứt im lặng**, tức mỗi lần chuyển một khối ra ngoài table là một cơ hội mất style mà không ai báo | Mỗi khối tự mang `page-break-inside: avoid`, không bị xẻ đôi qua biên trang |
| Nhân bản 7 lần: sửa đúng cùng một thứ ở 7 theme (invoice, pro forma, credit note, packing slip, quote, refund, unpaid). `wholesale_refund` phải **giữ bản sao thứ hai** của footer trong nhánh empty-state, nếu không đơn không có dòng refund nào sẽ mất footer hoàn toàn | Verify được bằng đo: 49 tổ hợp (7 theme × 7 độ dài, tới 11 trang) assert mọi trang table trải qua đều có row thật; 35 render assert không khối nào sót trong `<tbody>` |
| Không có gate nào chặn việc thêm một `<tr>` "chỉ để full-width" lần sau | Assertion "không banner/note/message/footer nào trong `<tbody>`" là gate đó — nó **đã bắt** dòng balance-help của `wholesale_unpaid` |

**Chỉ markup không chứng minh được gì ở đây**: `<tfoot>` lặp lúc *print*, nên "một footer trong
DOM" và "một footer mỗi trang" nhìn từ markup là giống hệt nhau. Mọi kết luận phải đến từ geometry
đã render — cùng luật với [[bang-chung-phan-biet-duoc]].

## Cần theo dõi tới ngày review

1. Có merchant nào yêu cầu lại footer mỗi trang không? Nếu có ≥2, quyết định này phải thành **một
   setting** chứ không phải một lựa chọn cứng.
2. Bản sao footer thứ hai trong empty-state của `wholesale_refund` có trôi lệch khỏi bản chính
   không (hai chỗ, không ai đồng bộ hộ).
3. 2/49 run chết vì puppeteer navigation timeout — nếu tỉ lệ này tăng thì harness đo đang là
   nguồn nhiễu chứ không phải thước.

## Liên quan

[[shipped-pdf-2026-08-13]] · [[digest-pdf-2026-07-30]] · [[digest-pdf-2026-07-29]] ·
[[2026-08-06-bo-pagination-preview-pdf]] · [[bang-chung-phan-biet-duoc]] ·
[[feedback-follow-conventions]] · [[pdf]]
