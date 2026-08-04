---
type: feedback
title: Kỷ luật git — nhánh theo loại repo, hỏi trước khi commit
summary: Repo code project (subscriptions, pdf, crm…) không push thẳng master/main và phải hỏi trước khi commit; riêng my-brain push thẳng master được. Nhánh có thể bị đổi ngoài session nên phải kiểm tra lại trước mọi commit.
tags: [feedback, avada, skills]
created: 2026-08-04
updated: 2026-08-04
source: [[digest-subscriptions-2026-08-03]]
---

# Kỷ luật git — nhánh theo loại repo

| Repo | Quy tắc |
|------|---------|
| **Project code** (subscriptions, pdf, crm, backup, aws, joy…) | KHÔNG push thẳng `master`/`main`. Tạo nhánh rồi commit. **Hỏi trước khi commit.** |
| **my-brain** | Push thẳng `master` được (brain-sync tự commit mỗi tối 20:00). |

**"Implement thử" = làm nhưng CHƯA commit**, trừ khi user nói rõ.

**Nhánh có thể bị đổi ngoài session.** `git status` chụp ở đầu phiên hết hạn ngay khi user
tự checkout nhánh khác ở terminal riêng — đã gặp trong session Joy Subscription
([[digest-subscriptions-2026-08-03]]). Phải chạy lại `git branch --show-current` trước
**mọi** commit, không tin snapshot đầu phiên.

**Why:** commit nhầm nhánh trên repo team là việc phải nhờ người khác dọn (revert, force
push, sửa MR). Còn commit khi user chỉ muốn xem thử thì làm bẩn lịch sử của nhánh họ đang
làm dở. Cả hai đều không tự sửa được từ phía mình.

**How to apply:** trước khi commit ở repo project — kiểm tra nhánh hiện tại, xác nhận không
phải `master`/`main`, rồi hỏi user. Ở my-brain thì commit thẳng, không cần hỏi.
Message theo [[feedback-commit-style]].

## Liên quan
- [[feedback-commit-style]] · [[subscription-work-style]] · [[digest-subscriptions-2026-08-03]]
