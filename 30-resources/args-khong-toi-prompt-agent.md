---
type: resource
title: Một workflow/skill bỏ qua `args` vẫn trả về báo cáo trông hoàn hảo — cho câu hỏi khác
summary: Khi brief không được thread vào prompt của subagent, agent chạy prompt mặc định và trả về đúng schema, đúng giọng, có verdict và điểm số — nên thứ duy nhất phân biệt được là grep xem `args` có xuất hiện trong script không, hoặc nhét một chuỗi mồi vào brief.
tags: [agent, method, tooling, automation]
created: 2026-09-15
updated: 2026-09-15
source: project `aws` — session history 2026-09-15 (skill `saa-domain-audit`)
---

# `args` không tới prompt của agent

## Triệu chứng

Chạy một skill audit với brief rất cụ thể (4 domain, checklist từng mục, danh sách service phải
soi). Kết quả về đúng schema: `verdict`, `coverageScore` 78–86, `wellCovered`, `thin`, `missing`,
`summary` — đọc trôi chảy, không có dấu hiệu hỏng nào.

Nhưng nó **không trả lời câu đã hỏi**: zero lần nhắc CloudFormation, Systems Manager, Rekognition,
Outposts, Service Catalog, RAM, Elastic Beanstalk — tức toàn bộ danh sách trọng tâm trong brief.

## Nguyên nhân

Script của skill **không dùng `args`** — `grep -c args` ra **0** trên 63 dòng. Brief đi vào tool
call rồi dừng ở đó; mỗi agent chạy prompt mặc định viết sẵn trong script.

## Vì sao khó phát hiện

Một agent chạy prompt mặc định vẫn:

- đọc đúng file, chạy đúng tool, tốn đúng thời gian;
- trả về đúng schema đã khai, nên mọi validate cấu trúc đều xanh;
- có verdict và điểm số, nên nhìn như một phép đo.

Không có tầng nào trong chuỗi đó đỏ được. Đây là cùng họ với
[[gate-tu-viet-la-nguon-xanh-gia]]: thứ trông như bằng chứng thật ra chỉ chứng minh *có chạy*, không
chứng minh *chạy cái gì*.

## Phép kiểm phân biệt được

| Kiểm | Làm thế nào |
|---|---|
| Rẻ nhất, làm trước | `grep -n 'args' <script>` — nếu 0 thì brief chưa bao giờ tới agent |
| Chuỗi mồi | Nhét vào brief một token vô nghĩa (`XREF-7731`) và yêu cầu agent trích lại; không thấy trong output ⇒ prompt không mang brief |
| Đối chiếu nội dung | Chọn 3 mục đặc thù nhất của brief, grep trong báo cáo — trùng 0 là tín hiệu đủ mạnh |

Và luật đi kèm: **một audit không xác nhận được là đã đọc brief thì không được dùng làm căn cứ** —
kết luận phải dựng lại từ nguồn có thẩm quyền (ở ca gốc là exam guide chính thức tải bằng
`pdftotext`), không phải từ báo cáo trông hợp lệ.

Liên quan: [[gate-tu-viet-la-nguon-xanh-gia]] · [[bang-chung-phan-biet-duoc]] · [[cham-viec-agent-nen]] ·
[[gui-viec-cho-lane-khong-co-ack]] · [[digest-aws-2026-09-15]] · [[graph-engineering]]
