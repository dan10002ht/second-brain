---
type: decision
title: Chuyển remote repo Avada sang GitLab on-premise, giữ gitlab.com dưới tên `saas`
summary: `origin` trỏ về `git.avada.net` (on-prem), gitlab.com giữ lại dưới tên `saas` để đối chiếu trong lúc chuyển; repo artifacts KHÔNG sync lịch sử vì hai bên rời nhau hoàn toàn.
tags: [avada, tooling, project]
created: 2026-08-10
updated: 2026-08-10
review: 2026-11-10
source: project "subscriptions" — session history (migrate on-prem, 2026-08-10)
---

Công ty chuyển Git sang GitLab on-premise `https://git.avada.net`. Đã làm cho `subscriptions`
(project 413) và `pdf` (project 358):

- `origin` → `https://git.avada.net/avada/<repo>.git`
- `saas` → `https://gitlab.com/avada/<repo>.git` (giữ lại, không xoá)
- CTO import xong phần "khoai" (commit + MR). Cutoff chốt cứng tại `!2454` / 09-08 10:20 —
  mọi MR tạo trên gitlab.com **sau** mốc đó không được import, team tự đẩy delta.
- `joy-subscription-artifacts` **không** sync lịch sử: gitlab.com 1.734 commit vs on-prem 16,
  hai lịch sử rời nhau hoàn toàn → chỉ đổi remote, không cố gộp.

## Why

- Chuyển là quyết định của công ty, không phải lựa chọn kỹ thuật của mình.
- Giữ `saas` thay vì xoá: trong lúc chuyển vẫn cần `git ls-remote` hai bên để so delta, và một
  số nhánh còn MR đang mở bên gitlab.com.
- Không sync lịch sử artifacts: repo đó là kho build, giá trị nằm ở **file đang phục vụ CDN**
  chứ không ở lịch sử; ghép hai lịch sử rời nhau tốn công mà không đổi lại được gì.

## Tradeoff

- **Hai remote = hai nguồn sự thật trong một thời gian.** Nhánh cũ vẫn `branch.<name>.remote =
  saas`, nên `git push` trần đẩy lên **gitlab.com** dù `origin` đã là on-prem — đã bị đúng một
  lần ở repo `pdf`. Phải set upstream cho từng nhánh active, không chỉ đổi `origin`.
- **Push lên on-prem chạy CI thật.** Push branch đã trigger `deploy:staging`; push **tag** sẽ
  chạy job deploy **production** (`rules: - if: $CI_COMMIT_TAG`). Đồng bộ tag phải kèm
  `-o ci.skip`.
- Nhánh bị rebase/force-push bên gitlab.com sau ngày import thì on-prem giữ bản cũ → phải
  `--force-with-lease` và tự chịu trách nhiệm kiểm nội dung trước.
- Bỏ sync artifacts nghĩa là on-prem không có lịch sử build cũ; nếu sau này cần truy vết một
  chunk cũ thì vẫn phải quay về gitlab.com.

Chi tiết thao tác: [[migrate-repo-gitlab-on-prem]] ·
→ [[subscriptions]] · [[pdf]] · [[joy-subscription-artifacts]] · [[feedback-git-branch-discipline]]
