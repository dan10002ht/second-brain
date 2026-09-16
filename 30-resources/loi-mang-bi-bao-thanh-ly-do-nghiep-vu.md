---
type: resource
title: Lỗi mạng bị báo thành lý do nghiệp vụ — và một lần chạy 0 việc trông y hệt thành công
summary: Lệnh migrate không có retry gặp `AggregateError` thì in `skipped: parent-line-not-found` (một lý do nghiệp vụ nghe rất hợp lý) hoặc `applied 0/0` — không có chữ "lỗi" nào, nên người vận hành đọc thành "contract này không cần vá" rồi đi tiếp.
tags: [method, debug, backend, automation, nodejs]
created: 2026-09-16
updated: 2026-09-16
source: [[digest-subscriptions-2026-09-16]] · project `subscriptions` (migrate contract Simple Bundles → Fixed Bundle trên prod)
---

# Lỗi mạng bị báo thành lý do nghiệp vụ

Chạy `migrateContractsToFixedBundle.js` trên production. Output:

```
to expand 0 | skipped 1        lý do: parent-line-not-found
```

`parent-line-not-found` là một lý do nghiệp vụ hoàn toàn hợp lý — contract không có line cha thì
đúng là không vá được. Trừ việc nguyên nhân thật là **`AggregateError` lúc fetch contract**: lệnh
không đọc được contract, rồi kết luận về nội dung của thứ nó chưa đọc.

Biến thể thứ hai, nguy hiểm hơn:

```
applied 0/0
```

Không có chữ "lỗi", không có exit code khác 0. **Giống hệt** một lần chạy thành công mà không có
việc gì để làm. Chỉ phân biệt được bằng cách mở `results.json` ra thấy nó **rỗng**.

## Hình dạng chung

| Tầng | Điều thật sự xảy ra | Điều được in ra |
|---|---|---|
| I/O | không đọc được dữ liệu | — |
| Phân loại | không có dữ liệu ⇒ rơi vào nhánh "không đủ điều kiện" | `skipped: <lý do nghiệp vụ>` |
| Tổng kết | 0 việc làm được | `applied 0/0` — trông như 0 việc **cần** làm |

Mỗi tầng đều "chạy đúng". Thông tin *"tôi đã thất bại"* bị mất ở ranh giới giữa tầng 1 và tầng 2, và
không tầng nào sau đó có cách biết. Cùng họ với
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]].

## Luật

> Một lý do nghiệp vụ chỉ được phép in ra khi đã **đọc được** dữ liệu để kết luận. Không đọc được là
> một kết quả thứ ba — không phải "đạt", cũng không phải "không đủ điều kiện".

Ba việc cụ thể:

1. **Ba trạng thái, không phải hai.** `ok` / `skipped-vì-<lý-do>` / `failed-vì-không-đọc-được`. Gộp
   cái thứ ba vào cái thứ hai là chỗ mất thông tin.
2. **Retry ở mọi lệnh chạm mạng, không chỉ ở lệnh chính.** Script migrate gốc có `withRetry` (4
   lần); script sửa chữa tôi viết sau **không có** — và chết đúng vào `AggregateError`. Chép lại
   đúng cơ chế của lệnh gốc cho nhất quán, kèm `describeError` để unwrap `AggregateError` (`.message`
   của nó **rỗng**, nên log trần không nói gì).
3. **`applied 0/0` phải được đọc là đáng ngờ, không phải sạch.** Cách xác nhận rẻ nhất: mở file kết
   quả ghi tăng dần. Nó cũng chính là thứ cho phép resume khi lệnh bị shell cắt giữa chừng.

Hệ quả thật đã xảy ra trong đợt đó: một lần `retry 1/4 fetch parents: AggregateError` cho ra bản
parent khuyết, và `inventoryItem.tracked` bị ghi sai trên đúng 1/16 sản phẩm — **sai dữ liệu tồn
kho** chứ không chỉ sai báo cáo. Xem [[mutation-ghi-nguyen-khoi-xoa-field-khong-gui]].

Liên quan: [[ack-khong-phai-hieu-ung]] · [[bang-chung-phan-biet-duoc]] ·
[[dong-bo-chan-luong-khong-phai-chuyen-hieu-nang]] · [[gate-tu-viet-la-nguon-xanh-gia]]
