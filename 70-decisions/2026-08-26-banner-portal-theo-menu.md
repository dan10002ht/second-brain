---
type: decision
title: Banner "chưa setup customer portal" quyết theo MENU, không cố phát hiện extension đã bật
summary: Bỏ hướng dò xem merchant đã add customer-account extension trong theme editor hay chưa (chứng minh được là API không nhìn thấy), đổi sang điều kiện duy nhất đo được — extension có nằm trong menu customer account hay không.
tags: [subscription, shopify, extensions, avada]
created: 2026-08-26
updated: 2026-08-26
review: 2026-11-26
source: project "subscriptions" — session history 2026-08-26 (SB-16056, nhánh `feat/portal-preview`)
---

# Banner customer portal quyết theo menu

Banner nhắc merchant "chưa setup customer portal" giờ hiển thị theo đúng một điều kiện:
**extension của app có mặt trong menu customer account hay không**. Chưa có trong menu → cứ hiện
banner. Có rồi → ẩn. Bỏ mọi cố gắng suy ra "merchant đã add/bật extension".

## Why

Thí nghiệm 4 mốc trên cùng một store dev, mỗi mốc query lại cùng endpoint:

| Mốc | Kết quả API |
|---|---|
| Trước khi add extension | baseline |
| Add extension trong theme editor | **y hệt baseline** |
| Bấm Save | **y hệt baseline** |
| Add extension vào **menu** | khác hẳn |

Nghĩa là "đã add vào theme editor" là trạng thái **không quan sát được** từ phía app — mọi logic
banner dựa trên nó đều là đoán. Còn menu thì đo được, và về nghiệp vụ nó cũng đúng nghĩa hơn:
extension không nằm trong menu thì customer **không có đường vào**, tức merchant chưa thật sự
setup xong. Đây là trường hợp cụ thể của [[bang-chung-phan-biet-duoc]] — chọn tín hiệu phân biệt
được hai giả thuyết, thay vì tín hiệu tiện tay.

## Tradeoff

- **Dương tính giả còn lại:** merchant đã add extension nhưng cố ý không đưa vào menu (deep-link
  từ chỗ khác) vẫn thấy banner. Đã chấp nhận — user chốt "ko vấn đề gì cả".
- **Phụ thuộc handle menu đúng.** Chuỗi resolve có 2 tier; tier 2 chỉ chạy khi tier 1 rỗng mà tier 1
  luôn có giá trị, nên bug handle được chữa cùng lượt này **không** đổi URL đang chạy — nhưng nó
  làm sống lại một nhánh vốn chết, cần nhớ khi đọc lại đoạn này.
- **Mất khả năng phân biệt "chưa add" với "add rồi nhưng chưa vào menu"** trong mọi báo cáo/telemetry
  sau này. Nếu sau này cần phân biệt, phải tìm nguồn dữ liệu khác chứ không sửa được banner.

Chi tiết thí nghiệm ghi ở [[digest-subscriptions-2026-08-26]].
