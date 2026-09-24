---
type: decision
title: Contract parent-only thì xoá HẾT dòng con, kể cả dòng có giá và dòng ngoài định nghĩa box
summary: Guard ban đầu của script dọn chỉ xoá dòng con nằm trong định nghĩa bundle và bỏ qua dòng có giá — đúng lúc đó lại là đúng những contract thu sai tiền; đổi sang "parent-only nghĩa là không được có dòng con nào", giữ lại đúng hai guard (parent không có định nghĩa, kỳ tới có edit sống).
tags: [subscription, shopify, avada, billing, backend]
created: 2026-09-24
updated: 2026-09-24
review: 2026-12-24
source: project `subscriptions` — session history (session 65eb4665, shop Joy Wholefoods + Bobbys Box)
---

# Quyết định

Với shop bật `enabledSyncBundleToContracts` (contract chỉ giữ dòng cha), script dọn
`backfillParentOnlyContracts` **xoá mọi dòng con trên contract**, không phân biệt:

- dòng nằm trong định nghĩa bundle hay không,
- dòng có giá ($18,95 · $23,45 …) hay ở `$0`.

Giữ lại đúng **hai** guard:

| Guard | Vì sao giữ |
|---|---|
| Dòng cha không resolve được về một định nghĩa bundle | xoá con mà không dựng lại được ⇒ khách mất hàng thật |
| Kỳ sắp tới có cycle edit **còn sống** (hạn chưa qua) | commit draft contract sẽ revert edit của khách |

Bỏ guard **"dòng con có giá thì skip cả contract"** (all-or-nothing).

## Why

Guard cũ tự mâu thuẫn với chính mô hình: *parent-only* nghĩa là contract **không được có dòng con
nào**, nên "chỉ xoá con thuộc định nghĩa" để lại đúng thứ mô hình cấm.

Nó còn sai theo hướng tệ nhất — **guard bỏ qua đúng các contract nặng nhất**. Ba contract đang thu
sai $176,15/chu kỳ đều có dòng con bị tính tiền, nên cả ba bị skip; chạy backfill xong audit vẫn báo
3 contract lỗi, nhìn như script hỏng.

Và tiền đề của guard sai: `applySwapBundleExpansion` ghi dòng con **luôn ở `currentPrice: '0.00'`** —
nên $18,95/$23,45 không phải do swap ghi, chúng là **rác từ box đời cũ** còn sót trên contract, không
phải món khách chủ động thêm. Xoá chúng là *giảm* tiền khách phải trả, không phải lấy hàng của khách:
14 contract · 64 dòng · **−$128,70/chu kỳ** (chỉ tính ACTIVE), tổng cả đợt 137 dòng · −$320,75.

## Tradeoff

- **Rủi ro nhận vào:** nếu một dòng con có giá *thật sự* là món khách tự swap thêm trong box thì xoá
  là mất món đó. Đã thấy dấu hiệu loại này (`Swapped…`) nên rủi ro không phải giả thuyết — chỉ là ở
  đợt này đo được rằng không ca nào như vậy. Lần sau phải đo lại, không kế thừa kết luận.
- **Mất tính tự vệ:** guard all-or-nothing là cái chặn "script phá dữ liệu có giá". Bỏ nó đi thì phép
  bảo vệ còn lại là **dry-run + audit độc lập sau khi ghi**, tức phụ thuộc vào quy trình người vận
  hành chứ không vào code. Đổi lại được: script không còn im lặng bỏ qua ca quan trọng nhất.
- **Phương án không chọn:** giữ guard rồi xử tay từng contract có giá. Bỏ vì 14 contract × nhiều dòng,
  và vì làm tay thì không có dry-run lẫn audit đối chiếu — sai một cái là mất tiền thật của khách.

Liên quan: [[digest-subscriptions-2026-09-24]] ·
[[2026-09-21-fixed-bundle-con-them-luc-order-create]] · [[gia-0-tren-dong-con-lam-mat-thong-tin]] ·
[[script-pha-du-lieu-tu-choi-flag-la]] · [[ack-khong-phai-hieu-ung]] ·
[[2026-09-14-backfill-bird-chi-don-chua-charge]]
