---
type: resource
title: Đồng bộ repo sang GitLab on-premise mà không lỡ tay deploy
summary: Đổi `origin` là phần dễ; phần dễ hỏng là nhánh vẫn track remote cũ, push branch trigger deploy staging và push tag trigger deploy production — kèm cách xử lý nhánh diverged và tạo MR bằng push option.
tags: [avada, tooling, patterns]
created: 2026-08-10
updated: 2026-08-10
source: project "subscriptions" + "pdf" — session history 2026-08-10
---

Rút từ lần chuyển `subscriptions` + `pdf` sang `git.avada.net`
([[2026-08-10-remote-gitlab-on-premise]]). Còn `crm`, `backup`, `joy` chưa làm — dùng lại thứ tự này.

## Thứ tự làm

1. **Kiểm instance sống + token.** `GET /api/v4/version` trả `401` là instance sống (chỉ thiếu
   auth). Login web bằng SSO công ty **không** thay cho PAT — `git`/API cần PAT riêng.
2. **Đo delta trước khi đụng gì.** `git ls-remote` cả hai bên rồi so: nhánh mới, nhánh lệch,
   nhánh diverged, tag. Ghi ra bảng, đừng push mù.
3. **Đổi remote, giữ remote cũ.** `origin` → on-prem, cũ đổi tên `saas`.
4. **Set upstream cho từng nhánh active.** ⚠️ Bước hay quên nhất — đổi `origin` **không** đổi
   `branch.<name>.remote`, nên `git push` trần vẫn đi về gitlab.com. Kiểm bằng
   `git config --get-regexp 'branch\..*\.remote'`.
5. **Push branch → dùng `-o ci.skip`.** Push nhánh lên on-prem **đã trigger `deploy:staging` thật**.
6. **Push tag SAU CÙNG và luôn `-o ci.skip`.** `production.yml` có `rules: - if: $CI_COMMIT_TAG`
   cho cả job build lẫn deploy → push tag trần = **deploy production**.

## Nhánh diverged

Nhánh bị rebase/force-push bên cloud sau ngày import: on-prem giữ bản cũ, hai bên không
fast-forward được.

- `git patch-id` **không** kết luận được — rebase đổi context nên hash patch lệch dù nội dung y hệt.
  So bằng **nội dung file thật** (diff từng file giữa hai đầu nhánh).
- Xác nhận bản mới chứa đủ công việc của bản cũ rồi mới `--force-with-lease` với SHA on-prem thật
  (ghép SHA sai thì lease tự từ chối — đúng thiết kế, đừng bypass).

## Tạo MR

`git push -o merge_request.create -o merge_request.target=master` chỉ ăn khi lần push đó **thật
sự đổi ref**. Nhánh đã up-to-date → `Everything up-to-date`, GitLab bỏ qua push option. Gộp việc
tạo MR vào lần push đầu tiên của nhánh.

## Khi hai lịch sử rời nhau

Repo kiểu kho build (artifacts): gitlab.com 1.734 commit vs on-prem 16 — không có commit chung.
Đừng cố merge/graft; chỉ đổi remote và chấp nhận mất lịch sử cũ ở on-prem.

## Cạm bẫy đọc trạng thái import

`import_status: finished` **không** có nghĩa là đủ. Kiểm mốc MR cuối cùng được import
(`created_at` của MR mới nhất) rồi chốt cutoff — mọi MR tạo sau mốc đó là việc của team.

→ [[2026-08-10-remote-gitlab-on-premise]] · [[feedback-git-branch-discipline]] ·
[[feedback-git-guard-chi-chan-master]] · [[subscriptions]] · [[pdf]]
