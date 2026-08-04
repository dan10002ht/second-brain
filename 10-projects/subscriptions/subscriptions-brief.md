---
type: project
title: Joy Subscription — task brief
summary: Danh sách task đang chờ làm cho Joy Subscription, nguồn cho skill /looptasks.
tags: [avada, shopify]
created: 2026-08-04
updated: 2026-08-04
---

# Joy Subscription — brief

State của `/looptasks` cho [[subscriptions]]. Sống ở brain chứ không trong repo code:
repo của team sạch, tự sync đa máy qua brain-sync, và worktree không thấy file này
nên subagent không thể commit nhầm làm revert trạng thái checkbox lúc merge.

Chạy (cwd là repo `subscriptions`, không phải brain):

```
/loop 5m /looptasks ~/projects/my-brain/10-projects/subscriptions/subscriptions-brief.md
```

## Cách viết task

Dòng đánh số + checkbox. Mô tả càng cụ thể càng ít bị agent đoán sai:

```markdown
1. [ ] <việc cần làm — nói rõ file/màn hình/hành vi mong muốn>
   - chi tiết bổ sung, done-criteria, ràng buộc
```

Marker: `[ ]` chưa làm · `[⏳ HH:MM]` đang chạy · `[✅]` xong (bỏ qua vĩnh viễn).
Agent tự phân tích task nào độc lập để chạy song song — không cần đánh dấu gì.

## Tasks

_(chưa có task — thêm dòng vào đây, loop sẽ tự nhặt ở lần quét sau)_
