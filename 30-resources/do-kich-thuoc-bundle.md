---
type: resource
title: Đo kích thước bundle — sai chế độ build hoặc sai lớp nén thì con số nào cũng vô nghĩa
summary: So bundle production với artifact dev cũ trong `static/` cho ra "vượt 14–25 lần" hoàn toàn sai; thứ truyền qua mạng là bản gzip/brotli chứ không phải raw; và cách quy trách nhiệm đúng là stub từng import rồi build lại, vì một `import` lấy 3 hằng số có thể kéo theo 32 KB.
tags: [js, performance, webpack, vite, method, shopify]
created: 2026-09-15
updated: 2026-09-15
source: project `subscriptions` — session history 2026-09-15 (refactor module `subscriptionBoxJoyxjoy`)
---

# Đo kích thước bundle

Ba lỗi đo, gặp liên tiếp trong một phiên, và **cả ba đều làm đảo kết luận** chứ không chỉ làm lệch
con số.

## 1. So nhầm chế độ build

Bảng đầu tiên kết luận các widget khác "2,4–4,8 MB, vượt 14–25 lần" so với bundle vừa tối ưu. Sai:
những file trong `static/` là **dev build cũ, không minify** (thư mục bị gitignore nên không ai để
ý), còn bundle đem so là production do chính mình vừa build. Build lại cả bộ ở cùng chế độ thì
`subscription-main` ra **382 KiB**, không phải 4,8 MB.

> Trước khi so hai artifact, chứng minh chúng cùng chế độ build — `mtime` và tên file không nói
> điều đó.

## 2. Đo raw thay vì đo bản nén

Thứ thực sự truyền qua mạng là gzip/brotli. Một thay đổi giảm raw có thể gần như không đổi brotli, và
ngược lại — ở ca gốc, ba bundle "tăng" sau khi áp plugin thực chất là **nhiễu nén** (raw của chúng
đều giảm hoặc đứng yên). Kết luận chỉ chắc khi biên độ lớn hơn nhiễu: ±100 byte brotli không phải
một phép đo.

## 3. Quy trách nhiệm bằng suy luận thay vì bằng stub

Cách chắc chắn: **stub từng import rồi build lại**, đọc chênh lệch.

```
146 KB → 114 KB   sau khi stub 2 dòng import trong summaryLogic.js
```

Hai dòng đó chỉ cần **3 thứ** từ module bị import (hai hằng số + một field của object default),
nhưng kéo về cả module hằng số — **32.811 byte**, gấp 3,5 lần thứ đang bị nghi ngờ lúc đầu
(PropTypes, +9,4 KB). Người ta hay đi tìm thủ phạm ở thư viện; thủ phạm thường là một `import`
tiện tay.

Hệ quả kỹ thuật đi kèm khi tách hằng số ra: **const trùng tên chưa chắc trùng nghĩa** — hai file có
thể cùng khai `DISCOUNT_TYPE_PERCENTAGE` với giá trị khác nhau, gộp bừa là đổi hành vi.

## Checklist

| Trước khi đưa ra con số | |
|---|---|
| Cùng chế độ build cho mọi artifact đem so | bắt buộc |
| Báo cả raw lẫn brotli/gzip | bắt buộc |
| Biên độ > nhiễu nén (~vài trăm byte) | nếu không, nói rõ là không kết luận được |
| Quy trách nhiệm bằng stub-và-build-lại | không suy từ kích thước file nguồn |
| Plugin kiểu strip-PropTypes chỉ bật ở production | kiểm dev build vẫn giữ để cảnh báo còn tác dụng |

Liên quan: [[digest-subscriptions-2026-09-15]] · [[bang-chung-phan-biet-duoc]] · [[phep-kiem-quan-sat-sai-tang]] ·
[[do-be-ngang-headless-chrome]] · [[caching-layers]]
