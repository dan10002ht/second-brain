---
type: decision
title: Phân tầng verifier theo độ rộng diff thay vì full adversarial mọi task
summary: `/looptasks` chọn hạng verify (surgical / trung / cao) theo độ rộng diff và mức rủi ro, thay vì chạy verifier đầy đủ cho mọi task như trước.
tags: [skills, avada, method, tooling]
created: 2026-08-07
review: 2026-11-07
source: project "pdf" — session history (SB-15301, task 10–16)
---

Bước verify của `/looptasks` không còn chạy một mức duy nhất. Brief giao cho `verifier`
được chọn theo độ rộng thay đổi:

| Hạng | Khi nào | Brief giao cho verifier |
|------|---------|-------------------------|
| **Surgical** | delta 1 file / vòng sửa một finding | chỉ gate + đúng finding đó |
| **Trung** | task thường | gate + 3–4 điểm nghi cụ thể đã nêu tên |
| **Cao** | refactor rộng, đụng file dùng chung, đụng tiền/mail ra ngoài | full adversarial, không rút gọn |

Vai trò **độc lập** của verifier giữ nguyên — vẫn context sạch, không Edit/Write, vẫn trả
PASS/FAIL/UNVERIFIED. Đây là sửa *phạm vi soi*, không phải nới quyền.
Bổ sung cho [[2026-08-04-looptasks-verifier-doc-lap]].

## Why

Số thật của một ngày làm SB-15301: verifier là chặng tốn thời gian nhất của gần như mọi
task, có lần chạy 7,7 phút cho một delta một file; task P1 phải qua **4 vòng** verifier mới
PASS, tốn nhiều hơn cả P0+P2+P4 cộng lại. Trong khi đó những finding thật sự cứu được việc
đều đến từ các task diện rộng (hồi quy `Promise.all` của cron, i18n key tự chế, xoá nhầm
key locale) — chứ không phải từ các delta một dòng. Chạy cùng một mức soi cho cả hai loại
là trả giá đắt ở chỗ không có gì để tìm.

## Tradeoff

- **Được:** ship nhanh hơn rõ rệt ở các vòng sửa nhỏ, vốn chiếm phần lớn số lượt verify.
- **Mất:** hạng surgical **cố ý không quét hồi quy diện rộng**. Nếu một "delta một file"
  hoá ra đụng file dùng chung (locale, constants, config) thì bug sẽ lọt — chính vì thế
  file dùng chung được liệt kê thẳng vào tiêu chí lên hạng cao, chứ không xét theo số dòng.
- **Rủi ro thật:** người giao brief là bên chọn hạng, mà bên đó chính là bên vừa spawn agent
  viết code. Đây là đúng loại tự-chấm mà [[2026-08-04-looptasks-verifier-doc-lap]] muốn
  tránh — nhưng ở đây chỉ chọn *phạm vi*, không chọn *verdict*. Nếu về sau thấy hạng
  surgical bị chọn cho những thứ không xứng đáng, đó là tín hiệu phải quay lại một mức duy nhất.

## Review 2026-11-07

Câu hỏi để đánh giá: trong 3 tháng, có bug nào lọt qua vì được verify ở hạng thấp không?
Có thì hoặc siết tiêu chí lên hạng, hoặc bỏ hẳn phân tầng.

→ [[digest-pdf-2026-08-07]] · [[looptasks-vs-workflow]]
