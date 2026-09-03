---
type: feedback
title: Agent chỉ tạo MR — người bấm merge là user
summary: Ở repo project của Avada, agent dừng lại ở bước tạo MR; quyết định merge (và deploy theo sau) là của user, kể cả khi gate xanh và verifier PASS.
tags: [feedback, avada, skills]
created: 2026-09-03
updated: 2026-09-03
source: project `subscriptions` — session history 2026-09-03 (MR !2509 → !2513 → !2524)
---

# Agent chỉ tạo MR — người bấm merge là user

Trong phiên kookut, tôi tự merge `!2509` sau khi user nhắn *"vẫn merge"*. User chốt ngay sau đó:
**đó là ngoại lệ, không phải mặc định** — từ giờ agent chỉ tạo MR, user là người bấm merge.

Áp dụng kèm với [[feedback-git-branch-discipline]]: nhánh → commit (có hỏi) → push → **tạo MR** →
dừng, báo link. Không merge, không tự trigger deploy.

**Why:** merge vào `master` ở repo Avada là hành động **ra ngoài** — pipeline chạy, code lên staging
hoặc production, và người phải dọn nếu sai không phải agent. Gate xanh + verifier PASS chỉ chứng minh
code không làm đỏ thứ mình biết cách đo (xem [[gate-tu-viet-la-nguon-xanh-gia]],
[[bang-chung-phan-biet-duoc]]); nó không thay được quyết định "đã đến lúc đẩy cái này cho khách chưa".
Đó là quyết định về thời điểm và rủi ro nghiệp vụ, thuộc về user.

**How to apply:** đóng việc bằng câu *"MR !xxxx — đang mở, tôi không merge"* kèm link, số commit,
kết quả gate. Nếu user nói "merge đi" thì merge lượt đó và ghi rõ đó là chỉ thị của họ, không suy ra
thành quy tắc cho lần sau. Trước khi push thêm commit lên một nhánh cũ, **kiểm trạng thái MR** — MR
đã merged thì commit mới không vào được nó, phải mở MR mới.

## Liên quan
- [[feedback-git-branch-discipline]] · [[feedback-commit-style]] · [[feedback-khong-khep-viec-khi-con-khe-ho]] · [[digest-subscriptions-2026-09-03]]
