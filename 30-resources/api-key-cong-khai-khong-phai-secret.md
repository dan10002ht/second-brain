---
type: resource
title: Key in ra browser không phải secret — rotate không đóng được lỗ, restrict mới đóng
summary: Với secret thật thì rotate = xong, vì toàn bộ vấn đề là vô hiệu hoá giá trị cũ; nhưng với một key vốn được in ra browser (Firebase/Google API key, publishable key), giá trị mới cũng lộ ngay lượt tải trang đầu tiên, nên biện pháp thật là restrict theo referrer/API + thứ tự "đổi mọi consumer → redeploy → verify → mới xoá key cũ".
tags: [auth, firebase, cloud, backend, http]
created: 2026-08-18
updated: 2026-08-18
source: project "pdf" — session history 2026-08-18 (cleanup hardcoded secrets)
---

# Key công khai ≠ secret

Khi một scanner báo "hardcoded API key", phản xạ mặc định là *rotate*. Phản xạ đó đúng cho
**secret thật** và sai cho **định danh công khai**. Phân biệt trước khi hành động, vì hai
loại có biện pháp khác nhau hoàn toàn.

| | Secret thật | Định danh công khai |
|---|---|---|
| Ví dụ | access token, client_secret, SMTP key, khoá mã hoá | Firebase Web API key, Google Picker key, Stripe publishable key |
| Nó ở đâu | chỉ ở server / secret manager | **in thẳng vào bundle FE**, ai mở DevTools cũng thấy |
| Rotate giải quyết gì | toàn bộ vấn đề — giá trị cũ chết là xong | gần như không gì: giá trị mới lộ ngay lượt tải trang đầu |
| Biện pháp thật | rotate + chuyển sang env/secret manager | **restrict** key (HTTP referrer, API allowlist, quota) + rule phía backend |

## Ba điều luôn đúng

**1. Xoá dòng code chỉ chặn rò rỉ mới.** Giá trị cũ vẫn nằm trong git history (checkout
commit cũ là lôi ra được) và vẫn còn hiệu lực. Ai đã thấy thì vẫn xài được. Xem
[[feedback-xoa-secret-khoi-code-chua-phai-vo-hieu-hoa]].

**2. Probe xem credential còn sống trước khi xếp thứ tự khẩn.** Read-only, không in giá
trị ra chat. "Chưa revoke" hay "đã revoke" đổi hẳn mức độ khẩn. Và probe phải đi **đúng
đường mà app dùng** — một SendGrid key có thể chết với v3 REST API nhưng vẫn sống qua SMTP;
kết luận từ sai đường là kết luận sai.

**3. Thứ tự đổi key không đảo được.** Xoá là không lùi được, nên:

```
liệt kê MỌI nơi consume key  →  đổi giá trị ở tất cả (kể cả biến CI build bundle FE)
  →  redeploy (nhiều runtime chỉ nạp env LÚC deploy, không nạp lại)
  →  verify trên chính bề mặt thật
  →  mới xoá key cũ
```

Bước "liệt kê mọi nơi" là bước hay hụt nhất: cùng một giá trị thường nằm ở ≥3 chỗ (env của
service, biến CI, và bundle FE đã build).

## Bẫy khi verify

"Grep bundle prod không thấy key cũ" là **bằng chứng vắng mặt**, không phải bằng chứng
phân biệt được — thường chỉ phủ được trang gốc và vài file JS đầu. Nói rõ giới hạn đó thay
vì để nó thành căn cứ cho thao tác không lùi được. Xem [[bang-chung-phan-biet-duoc]].

Và phân biệt **API key** (định danh để tính quota/billing — xoá không mất data) với **khoá
mã hoá** (đổi là mất dữ liệu đã mã hoá). Trong cùng một repo hai thứ này hay nằm cạnh nhau.
