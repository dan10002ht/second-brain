---
type: note
title: Mooni digest 2026-07-25 — gate UI: held-out Playwright cần hook ổn định, design-evaluator bắt lỗi thật
summary: Held-out UI chỉ chắc khi form có name/aria-label rõ (nhãn nhập nhằng hại cả test lẫn người dùng), design-evaluator bắt overflow cắt cột + font thiếu dấu tiếng Việt, và bài học đọc thẳng mockup thay vì phán từ trí nhớ.
tags: [method, debug, nextjs]
created: 2026-07-25
source: project "moonie" (Mooni) session history
---

# Mooni digest 2026-07-25 — chỉ phần MỚI

Loạt digest trước ([[digest-moonie-2026-07-17]] · [[digest-moonie-2026-07-18]] ·
[[digest-moonie-2026-07-20]] · [[digest-moonie-2026-07-22]] · [[digest-moonie-2026-07-24]])
đã phủ harness, backend, CI, Colima, bảo mật. Phần dưới là mảng **UI (giai đoạn 3 & 5)** chưa được ghi.

## Techniques — held-out UI (Playwright) muốn chắc thì code phải có "chỗ bám"

- **Input trong form phải có `name`.** Held-out FAIL không phải vì CRUD hỏng (generator tự test
  Playwright vẫn chạy) mà vì test không định vị được field. Thiếu `name` là **thiếu sót thật của HTML
  form**, không phải test khó tính → sửa code, không nới test.
- **Nhãn va chạm nhau thì sửa CẢ HAI phía.** Nút "Chuyển thành đơn" và trạng thái "Đã chuyển đơn" va
  selector của held-out. Không chỉ làm chắc selector: đổi trạng thái thành "Đã lên đơn" +
  `aria-label="Chuyển thành đơn"` cho nút. Why: **nhập nhằng làm rối test thì cũng làm rối người dùng
  thật** — held-out fail vì mơ hồ thường là tín hiệu UX, không phải nhiễu.
- **Selector nên structural / theo `aria-label` gắn id**, không bám vào text hiển thị (text còn đổi theo
  copywriting và i18n). `aria-label` ô status đừng nhét tên khách vào — trùng lặp và lộ dữ liệu.
- Dùng `setInputFiles` cho upload; với shadcn/Radix `Select` phải xử lý riêng (không phải `<select>` thật).
- **Build Next fail do fetch Google Fonts là transient** — chạy lại trước khi kết luận là regression.

## Bugs (root cause) — do design-evaluator bắt, không phải test chức năng

- **Bảng chi tiết đơn trên mobile mất cột "Thành tiền":** container dùng `overflow-hidden` → nội dung
  tràn bị cắt hẳn (khác `overflow-x-auto` cho cuộn). Held-out chức năng không thấy vì data vẫn đúng.
- **Font Playfair thiếu subset tiếng Việt** → mất dấu, ảnh hưởng **toàn app** (cả landing lẫn admin) chứ
  không riêng trang đang làm.
- **Hardcode hex trong JSX** dù CLAUDE.md của chính dự án cấm — quy tắc trong file hướng dẫn **không tự
  thực thi**; cần một gate đọc lại quy tắc đó (ở đây là design-evaluator) mới bắt được.

## Feedback / cách làm việc

- **Đọc thẳng artifact nguồn, đừng phán từ trí nhớ.** Hai lần khẳng định sai về mockup ("mockup không
  hiện giá", "có 3 loại bánh lẻ") — đọc HTML mockup mới thấy: **có** hiện giá, **4** loại bánh, badge là
  badge marketing ("Bán chạy"/"Mới") chứ không phải trạng thái kho. Sai chỗ này không chỉ lệch UI mà lệch
  **mô hình dữ liệu** (phải thêm `compare_at_price` + nhãn phân loại, seed lại sản phẩm).
- **Gom bài học của task trước vào lệnh cho generator task sau** (input có `name`, không hardcode hex,
  overflow-x cho bảng) → task cuối qua thẳng cả 2 gate, không cần vòng sửa. Đây là cách rẻ nhất để
  harness "học" giữa các task.

Liên quan: [[digest-moonie-2026-07-24]] · [[digest-moonie-2026-07-17]] (vòng screenshot/design-evaluator) ·
[[digest-aws-2026-07-24]] (cùng mô-típ evaluator–optimizer + gate deterministic chạy trước) ·
[[dev-skills]] · [[moc-learning-pkm]]
