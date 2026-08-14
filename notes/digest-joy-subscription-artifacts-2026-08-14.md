---
type: note
title: Digest joy-subscription-artifacts 2026-08-14 — dọn 28% file, và remote `onprem` là mirror cũ chứ không phải nguồn
summary: Lần chạy `/clean-artifacts` này lộ ra hai thứ đáng nhớ hơn cả việc dọn: remote `onprem` lag 1755 commit nên tuyệt đối không được coi là nguồn, và hook chặn `main` chặn nhầm ở đúng repo mà `main` là nhánh làm việc.
tags: [avada, artifacts, cdn, tooling]
created: 2026-08-14
updated: 2026-08-14
source: project "joy-subscription-artifacts" — session history 2026-08-14
---

# Digest joy-subscription-artifacts — 2026-08-14

## Techniques

**Guardrail của `/clean-artifacts` đủ dùng, nhưng phải chạy dry-run tới khi sạch.** Năm điều kiện
được kiểm trước khi xoá: HEAD đồng bộ với remote · bản build mới nhất còn tươi (1 ngày) ·
`changed_files` có dữ liệu · tỉ lệ xoá dưới ngưỡng (28% < 90%) · entrypoint không hash còn nguyên.
Kết quả: xoá **2.586/9.112 file (28%)**, `static/` còn **245M** (`assets/` 6.185 file,
`scripttag/` 341 file).

**Remote nào là nguồn thì phải đo, đừng suy từ tên.** Dry-run đầu fail vì `origin` (gitlab.com)
timeout, và repo có thêm remote `onprem` (`git.avada.net`). Fetch `onprem` được — nhưng nó **lag
1755 commit**, tức là mirror cũ, không phải nguồn. Nếu lúc đó lấy `onprem` làm mốc so sánh thì
guardrail "HEAD sync" sẽ đọc ra kết luận ngược. Đúng thứ [[2026-08-10-remote-gitlab-on-premise]]
đã ghi: repo artifacts **không** sync lịch sử giữa hai bên.

## Context

- Hook `guard-main-branch.py` chặn push `main`. Ở repo này **push thẳng `main` mới đúng** —
  Firebase Hosting pull chính nhánh đó, tạo branch là vô nghĩa. Đây là ca hook đúng luật chung
  nhưng sai với repo cụ thể; cùng lớp vấn đề với [[feedback-git-guard-chi-chan-master]] và cách
  xử ở `ticket-mcrsv` (thêm vào `EXEMPT_REPOS` thay vì gỡ lưới).
- Push thành công `72d1355f72..75d0b53e67` lên `origin/main`. `.git` không co lại — vẫn là giới hạn
  đã ghi ở [[digest-artifact-2026-07-24]].
- Cùng ngày, phía `subscriptions` chuyển CI sang clone repo artifacts trên on-prem:
  [[2026-08-14-artifacts-onprem-seed-khong-lich-su]].

Liên quan: [[joy-subscription-artifacts]] · [[subscriptions]]
