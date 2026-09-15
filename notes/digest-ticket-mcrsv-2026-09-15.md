---
type: note
title: Digest ticket-mcrsv — 2026-09-15 (hai worktree merge sạch nhưng kết quả gãy, và biến thể thứ ba của "prompt không chạy")
summary: F52 chuyển module còn F53 viết code import theo đường cũ — git merge không conflict nhưng import trỏ vào chỗ không còn file; và một lane codex đứng im 9 phút vì prompt đã paste mà chưa submit, gỡ bằng `--enter`, sau hai biến thể khác của cùng lớp lỗi trong cùng ngày.
tags: [agent, method, tooling, automation, project, debug]
created: 2026-09-15
updated: 2026-09-15
source: project `ticket-mcrsv` — session history 2026-09-14/15 (V3 venue 3D: F52–F55, vòng /loop 5m /lt-orca)
---

# Digest — `ticket-mcrsv`, 2026-09-15

Plan V3 và F50/F51 đã ghi ở [[digest-ticket-mcrsv-2026-09-14]]. Note này **CHỈ phần mới**: F52 → F55
và những gì vòng `/loop` bắt được.

## Bugs

**Merge sạch, kết quả gãy — F52 × F53.** F52 chuyển 14 file sang `venue-3d/`; F53 viết code lúc
`venue-3d-camera.ts` **vẫn còn ở** `org-events/`, nên nó import `../org-events/venue-3d-camera`.
Git merge không báo conflict (hai file khác nhau), nhưng bản gộp không resolve được import. Bắt được
vì đọc phạm vi file của từng worktree trước khi merge, không vì gate — gate của từng worktree đều
xanh. Đúng lớp lỗi ở [[gate-hop-nhat-truoc-khi-merge]]; cách chữa là 4 dòng import, sửa **như một
phần của việc hợp nhất**, không giao lại cho worker.

**`zoneViewpoint()` không bao giờ nhìn vào sân khấu — lỗi thiết kế trong plan, không phải worker
làm sai.** Ảnh `b-near` gần như một bức tường xám dù 4 số đo camera đều đạt tiêu chí. Truy ra:
`target[1] = eye[1]` và `polar` bị hard-code `π/2` ⇒ camera **luôn nhìn ngang**. Câu đó nằm trong
plan do chính mình viết. Worker chẩn đoán đúng, tôi xác nhận bằng code rồi sửa hợp đồng.

**Tiêu chí bất khả thi về toán học (F48, còn dư âm).** "5 giá mock ⇒ 5 token màu khác nhau" không
đạt được với bộ seed lệch — `700k` ở ratio `0,163` rơi cùng bậc với `350k`. Worker báo `failed`
đúng chữ của tiêu chí; đó là hành vi cần giữ, quyết định là việc của người điều phối.

**Legend vẽ 5 ô màu nhưng `getPriceColor` chỉ trả 4** — `mid` không bao giờ đạt tới trừ khi
`max <= min`. Có từ `F10`, không phải hồi quy của V2.

## Techniques — lane nền, và những tín hiệu nói dối

**Biến thể thứ ba của "prompt không chạy" trong cùng một ngày:**

| Biến thể | Dấu hiệu | Gỡ |
|---|---|---|
| `agent_prompt_blocked` ở `dispatch_input` | worker chết sau 9–23 giây, worktree rỗng | vá cho bản codex mới (`0.154.0` ra sau bản vá đầu phiên) |
| Terminal bị dựng lại | banner codex hiện **hai lần**, đứng ở màn khởi động | dispatch lại |
| Prompt paste nhưng chưa submit | `›[Pasted Content 24682 chars] tab to queue message` | gửi `--enter`, giữ nguyên nội dung đã paste |

Điểm chung: **13 phút chưa có `node_modules`** trong khi task tương đương xong sau 55 giây là tín
hiệu duy nhất đáng tin, và cách xử đúng luôn là **đọc thẳng terminal** thay vì đoán. Củng cố
[[gui-viec-cho-lane-khong-co-ack]] và [[cham-viec-agent-nen]].

**Đứng im ≠ treo.** F54 đứng 8 phút vì **đang chờ trả lời** — câu hỏi của nó không hiện ra vì queue
còn kẹt một delivery cũ chưa `ack`. Ack xong mới lấy được câu hỏi, và câu hỏi đó chỉ ra một chỗ
**tự mâu thuẫn trong brief của tôi**.

**Orca dựng worktree từ `origin/main`, không từ HEAD local.** Dispatch F43/F47 trước khi push ⇒ cả
hai worker đứng ở commit trước F42 một bậc. Luật: push xong mới dispatch, và xác nhận base commit
của worktree là một trong ba tín hiệu phải kiểm sau mỗi lần giao việc.

**Gate hợp nhất bắt được thứ gate từng worktree không thể thấy:** F43 chạy gate lúc một rule còn
`warning`, `main` giờ đã là `error`. Một ca khác: `gate.sh` exit 127 vì **macOS dọn `/tmp`** (file
tạo 09/09, quá 3 ngày) — dựng lại rồi chạy, đừng đọc 127 thành "gate hỏng".

**Gate mềm = mở ảnh ra nhìn, và nó tiếp tục trả công.** Bốn khối zone bay lơ lửng (có từ V1, F41
chỉ khuếch đại) · `rake` lật ngược dấu (verifier dựng lại bằng `three` thật để chứng minh) · ảnh
`b-near` vô dụng dù mọi số đo đạt. Gửi quan sát cho worker **trước khi nó viết xong report** đỡ được
trọn một vòng.

## Context

- V2 đóng đủ 8 task (`10b4da0`), V3 đang ở 3/5 sau F54 (`143c879`); F55 chạy dở khi phiên dừng.
- Bundle F54 về `+3.305 B` (ngưỡng 5.120) sau khi **tách parser** — số thật, không phải giấu bằng
  lazy preload.
- `/loop 5m /lt-orca BRIEF-FRONTEND.md` do dantt gõ (agent không tự bật được). Vòng rỗng thì làm
  housekeeping: cắt đợt F31–F38 khỏi `BRIEF-FRONTEND.md` (1123 dòng) sang file `-done`.
- Ba lần quên **release worker + xoá worktree** sau merge ⇒ pane thừa trên sidebar. Đóng task chưa
  phải là dọn.

Liên quan: [[digest-ticket-mcrsv-2026-09-14]] · [[moc-ticket-mcrsv]] · [[gate-hop-nhat-truoc-khi-merge]] ·
[[gui-viec-cho-lane-khong-co-ack]] · [[cham-viec-agent-nen]] · [[brief-state-agent-loop]] · [[so-anh-khong-so-chu]]
