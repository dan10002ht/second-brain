---
type: feedback
title: Theo convention sẵn có + quét HẾT chỗ tương tự
summary: Research code hiện tại trước khi viết (đúng tầng route→controller→service→repository), và khi sửa lỗi thì grep mọi nơi dùng cùng pattern chứ không chỉ chỗ được chỉ.
tags: [feedback, patterns, architecture, avada]
created: 2026-08-04
updated: 2026-08-04
source: [[digest-pdf-2026-08-03]]
---

# Theo convention sẵn có + quét HẾT chỗ tương tự

Hai vế của cùng một kỷ luật, lặp lại ở nhiều app.

**1. Đọc convention của app rồi mới viết.** App Avada dùng 4 tầng
`route → controller → service → repository`, response qua `ViewRes`/`STATUS_CODE`.
Đợt campaign unsubscribe của PDF Invoice viết lệch 4 chỗ (logic nằm trong controller,
route nhét chung file…) và phải refactor lại nguyên MR — xem
[[digest-pdf-2026-08-03]], [[shipped-pdf-2026-08-04]], và tiền lệ Firestore-phải-ở-repository
ở [[digest-pdf-2026-07-21]]. Luật đầy đủ: [[controller-service-repository]].

**2. Sửa lỗi là quét hết chỗ tương tự.** Không dừng ở chỗ được chỉ. Ví dụ đã trả giá:
`customCurrency` gây 422 → quét toàn `src/schemas/` để xác nhận đó là nested `object()`
duy nhất; HS code render trắng ở 3 đường in (order/refund/quote) nên phải gom về một
helper; địa chỉ mất company/zip phải sửa ở 6 chỗ.

**Why:** code lệch convention thì review trả về và phải viết lại — đắt hơn nhiều so với
việc đọc trước 5 phút. Còn fix một chỗ trong khi cùng bug nằm ở 5 chỗ khác thì bug quay
lại dưới dạng ticket mới, và lần sau khó truy hơn vì đã "được fix rồi".

**How to apply:** trước khi viết file mới — mở 1-2 file cùng loại trong repo và bắt chước
cấu trúc. Sau khi tìm ra root cause — grep pattern đó trên toàn repo, liệt kê mọi call
site, sửa hết rồi mới báo xong.

## Liên quan
- [[controller-service-repository]] · [[subscription-work-style]] · [[feedback-commit-style]] ·
  [[digest-pdf-2026-08-03]] · [[digest-pdf-2026-07-21]] · [[digest-subscriptions-2026-08-03]]
