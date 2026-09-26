---
type: note
title: Digest pdf-review — 2026-09-26 (trùng lặp nằm trong CHÍNH MR, và cách đọc diff bắt được nó)
summary: Loại trùng lặp nặng nhất của MR 526 không phải trùng với code cũ trong repo mà nằm trong chính MR — cùng một MR sửa file cũ VÀ viết lại logic đó ở file mới, nên đọc diff theo từng file thì mỗi file đều hợp lý và không ai bắt được.
tags: [pdf, invoice, patterns, architecture, avada, gotcha]
created: 2026-09-26
updated: 2026-09-26
source: project `pdf-review` — session history (session ab3741b1, review MR !526 của `pdf-invoice/pdf-invoice-firebase`)
---

# Digest — `pdf-review`, 2026-09-26

Một lượt review MR duy nhất. Phần đáng giữ là **một khe hở của cách đọc diff**, không phải nội dung MR.

## Techniques

**Trùng lặp trong chính MR là loại khó thấy nhất khi review.** Chỗ nặng nhất của MR !526 không phải
"trùng với code đã có trong repo" — mà là **cùng một MR sửa file cũ *và* viết lại cùng logic đó ở file
mới**, thay vì tái dùng. Đọc diff theo mặc định (lần lượt từng file) không bắt được: mỗi file đọc riêng
đều hợp lý, và cả hai đều nằm trong phạm vi MR nên không có file nào trông "lạc".

Phép kiểm bắt được nó: với mỗi khối logic mới trong diff, hỏi **"logic này còn xuất hiện chỗ nào khác
trong CHÍNH diff này"** — grep trong phạm vi diff, không phải grep trong repo. Đây là câu hỏi khác với
câu "code này đã có sẵn trong repo chưa", và không có gate nào đặt nó. Cùng họ với
[[phep-kiem-quan-sat-sai-tang]]: phép kiểm chạy thật nhưng quét phạm vi không chứa chỗ hỏng.

**Không mở được trang MR thì review bằng diff local.** Máy không có `glab` và Chrome extension của
Claude không kết nối ⇒ review trên `git diff origin/master...<nhánh>`. Đổi lại: không thấy các comment
đã có trên MR, nên không biết chỗ nào reviewer khác đã nêu (cách tạo MR khi thiếu `glab` ghi ở
[[digest-pdf-2026-09-15]]).

## Context

- Đợt review cũng nêu lại **chỗ đặt `const` / component và helper chưa tách** — cùng loại feedback đã
  lặp nhiều lần: const thuộc `const/<domain>/`, helper thuần thuộc `helpers/<domain>/`, không viết lẫn
  trong file component. Xem [[feedback-follow-conventions]] · [[controller-service-repository]] ·
  [[feedback-ui-component-300-dong-atomic]].
- Số comment cụ thể trên MR !526 và danh sách file bị trùng: **chưa xác minh** — transcript không giữ
  chi tiết, và trang MR không mở được trong session đó.

Liên quan: [[pdf]] · [[digest-pdf-2026-09-15]] · [[phep-kiem-quan-sat-sai-tang]] ·
[[feedback-follow-conventions]] · [[shopify-app-dev]]
