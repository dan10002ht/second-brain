---
type: resource
title: Prop sai bị bỏ qua im lặng — khi UI không đổi thì "bundle cũ" là giả thuyết sai
summary: Sửa ba lần mà ảnh không đổi một pixel, trong khi grep chứng minh bundle mang code mới — vì một design system đóng không báo lỗi cho prop có giá trị không hợp lệ, nó chỉ lặng lẽ bỏ qua; nên trước khi đi tìm cache, phải tra bảng giá trị hợp lệ của chính prop đó.
tags: [method, debug, react, extensions, patterns]
created: 2026-09-10
updated: 2026-09-10
source: project `subscriptions` — session history 2026-09-10 (`@shopify/ui-extensions-react/customer-account`)
---

Triệu chứng: sửa layout ba lượt, chụp lại — **ảnh giống hệt nhau tới từng pixel**. Giả thuyết đầu tiên
ai cũng nghĩ tới là *bundle cũ / cache trình duyệt*. Nó sai. Đếm lại cho đúng trong bundle
(`grep -c` đếm **dòng**, mà bundle minify nên con số đó vô nghĩa — phải đếm số lần xuất hiện) cho thấy
code mới **có** ở đó. Vậy code mới chạy, và kết quả vẫn thế: nghĩa là **prop bị bỏ qua**.

## Vì sao lớp component đóng không kêu

Một design system đóng (Polaris Web Components, `@shopify/ui-extensions`, phần lớn thư viện UI của
nền tảng) nhận prop qua một enum hẹp. Giá trị ngoài enum **không ném lỗi, không cảnh báo** — nó rơi về
mặc định. Và prop *không tồn tại* thì rơi vào hư không. Cả một loạt ví dụ thật trong cùng một phiên:

| Thứ đặt | Thực tế |
|---------|---------|
| `BlockAlignment="stretch"` | enum chỉ có `start\|center\|end\|baseline` → bỏ qua |
| `Badge` tone amber / green | `Badge` chỉ có `default\|critical\|subdued` → không tới được; phải đi qua `Text appearance` (`warning`/`success`) |
| `Background` amber | chỉ có `transparent\|base\|subdued` → **bất khả thi**, không phải bug |
| `title` truyền cho `EditProductModal` | component không khai prop đó → rơi vào hư không |
| icon tên `product`, `check-circle`, `x-circle` | không tồn tại trong bộ icon → không render |

Thêm một hệ quả về bố cục cùng họ: `View` trong customer account extension **luôn fill bề ngang
parent**, nên một "pill" dựng bằng `View` sẽ full width dù nội dung ngắn; và `Pressable` thì ngược
lại — co theo nội dung, nên `Card` bên trong rộng theo ảnh gốc của từng sản phẩm và mỗi card một khổ.

## Thứ tự chẩn đoán đúng

1. **Chứng minh code mới thật sự có trong artifact đang chạy** — đếm đúng cách, đừng đếm dòng của file
   minify. Nếu không có: đúng là stale, dừng ở đây.
2. **Nếu có: tra bảng giá trị hợp lệ của prop trong `.d.ts` / type của chính version đang dùng**, không
   tra tài liệu của surface khác. (`Badge` ở surface `checkout` khác `Badge` ở `customer-account` —
   đọc nhầm surface là một lượt kết luận sai.)
3. Chỉ khi cả hai bước trên sạch mới nghi cache/CDN.

Và khi kết luận "API không hỗ trợ", phải quét **toàn bộ bề mặt component mà chỗ đó import**, rồi nói
rõ là không hỗ trợ — chứ không lặng lẽ để prop vô nghĩa nằm lại trong code. Prop vô nghĩa còn lại là
một lời hứa giả cho người đọc sau.

Liên quan: [[so-anh-khong-so-chu]] · [[bang-chung-phan-biet-duoc]] ·
[[digest-subscriptions-2026-09-10]] · [[cau-extension-chay-that-tren-store]]
