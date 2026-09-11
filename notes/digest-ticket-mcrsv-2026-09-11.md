---
type: note
title: Digest ticket-mcrsv — 2026-09-11
summary: Đóng V2 venue 3D 10 task; phần mới so với hôm trước là ba bước dọn sau merge không ai nhắc (release worker + xoá worktree) mà triệu chứng duy nhất là pane thừa trên sidebar, gate hợp nhất bắt được đúng ca rule đổi warning→error giữa hai task, và verifier tự dựng vi phạm ở file thứ hai để chứng minh rule chặn cả repo.
tags: [agent, automation, tooling, debug]
created: 2026-09-11
updated: 2026-09-11
source: project `ticket-mcrsv` — session history 2026-09-10/11 (V2 venue 3D, F39–F49)
---

# Digest — `ticket-mcrsv`, 2026-09-11

Ba lần worker chết mà vẫn báo "đang chạy", tiêu chí nghiệm thu bất khả thi về toán học, và bug
legend 5 màu / hàm trả 4 màu đã ghi ở [[digest-ticket-mcrsv-2026-09-10]]. Đây CHỈ phần mới.

## Bugs

- **`rake` bị lật ngược dấu** — độ lớn góc đúng, dấu đảo. Verifier bắt được bằng cách **dựng lại
  với `three` thật** chứ không suy diễn tay; một vòng sửa là xong. Bài học không phải ở bug mà ở chỗ
  verifier chịu dựng runtime thật thay vì đọc code.
- **Diff `.ts` là tích luỹ so với `HEAD`, không phải thay đổi của vòng 2** — tôi mô tả sai cho
  verifier trước khi nó kịp chấm. Khi giao lại việc cho verifier vòng N, phải nói rõ mốc so sánh,
  nếu không nó chấm nhầm phạm vi. → [[phep-kiem-quan-sat-sai-tang]].

## Techniques

- **Gate hợp nhất đã bắt đúng ca nó sinh ra để bắt.** F43 chạy gate lúc một rule còn ở mức
  `warning`; tới lúc merge thì `main` đã nâng rule đó lên `error`. Cả hai task đều PASS trong
  worktree riêng, chỉ gate chạy SAU khi gộp mới đỏ. Giữ nguyên luật: merge cục bộ → gate hợp nhất →
  mới push. → [[gate-hop-nhat-truoc-khi-merge]].
- **Positive control do verifier tự dựng.** Verifier F47 không chỉ chạy lại ca đã biết — nó **tự
  thêm một vi phạm ở một hook hoàn toàn khác** (`admin/events/page.tsx`) để chứng minh rule chặn cả
  repo chứ không trùng hợp đúng một dòng. Tương tự F44: verifier build lại baseline từ đầu và xác
  nhận `entry=false` ở cả hai bản. Đây là hình mẫu nên yêu cầu trong brief verifier.
- **Đo điều kiện tiên quyết trên `main` trước khi dispatch**, không giả định (`0 warning` trước khi
  giao F47).

## Context

- **Bước dọn sau merge không có ai trong quy trình nhắc.** Merge F42/F43/F47 xong nhưng quên
  `release worker` + xoá worktree cho cả ba; triệu chứng duy nhất là pane codex còn sống trên
  sidebar và card vẫn `in-progress` — và người phát hiện là dantt, không phải tôi. Coi "release +
  xoá worktree" là một phần của bước đóng task, ngang với commit. Liên quan:
  [[cham-viec-agent-nen]] · [[brief-state-agent-loop]].
- **Worker báo `failed` theo đúng chữ của tiêu chí là hành vi ĐÚNG** (tiền lệ F33 và giờ F44) —
  quyết định nới tiêu chí là việc của main agent sau khi đọc bằng chứng, không phải việc của worker.
  → [[phep-kiem-quan-sat-sai-tang]]
- Gate mềm (mở ảnh ra nhìn) vẫn bắt được thứ mọi gate tự động bỏ sót: khối zone "bay lơ lửng" tách
  khỏi sàn, ca override cực đoan thành chồng tường che nhau. → [[so-anh-khong-so-chu]].

## Liên quan

[[moc-ticket-mcrsv]] · [[digest-ticket-mcrsv-2026-09-10]] · [[digest-ticket-mcrsv-2026-09-09]] ·
[[gate-tu-viet-la-nguon-xanh-gia]] (positive control chính là phép chứng minh gate đỏ được) ·
[[gate-hop-nhat-truoc-khi-merge]] · [[cham-viec-agent-nen]] · [[brief-state-agent-loop]]
