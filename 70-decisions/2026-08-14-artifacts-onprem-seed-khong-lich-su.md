---
type: decision
title: CI của subscriptions clone artifacts từ on-prem; repo on-prem được seed bằng một commit gốc không cha
summary: Job `publish-fe` đổi sang clone `joy-subscription-artifacts` trên git.avada.net; bản on-prem bị force push về một commit gốc không cha mang đúng cây thư mục hiện tại — bỏ toàn bộ lịch sử ở phía on-prem, giữ gitlab.com làm đường lùi.
tags: [avada, artifacts, cdn, tooling]
created: 2026-08-14
updated: 2026-08-14
status: active
review: 2026-11-14
source: project "subscriptions" — session history 2026-08-14
---

# Quyết định

Job `publish-fe` (`.gitlab/ci/production.yml`) đang clone `joy-subscription-artifacts` từ
**gitlab.com** và chết `exit 128` vì token hết hạn/sai scope. Thay vì cấp lại token cho
gitlab.com, chuyển hẳn sang **`https://git.avada.net/avada/artifacts/joy-subscription-artifacts`**
(MR !2472, đúng một dòng đổi host + username).

Bản on-prem đã được import sẵn lúc migrate nhưng cũ (16 commit riêng, 03–07/08). Cách seed:
tạo **một commit gốc không cha** mang đúng cây thư mục của bản gitlab.com đang chạy, rồi
`git push --force` sang `onprem/main`. **Không đụng gitlab.com.**

## Why

- `CI_JOB_TOKEN` chỉ đọc, không push được sang repo khác → dù ở lại gitlab.com vẫn phải nuôi một
  PAT riêng. Đã phải nuôi token thì nuôi ở nơi mọi repo khác đã chuyển tới
  ([[2026-08-10-remote-gitlab-on-premise]]) hợp lý hơn.
- 16 commit "riêng" của on-prem chứng minh được là bản sao — hash **cây thư mục** trùng
  (`15d90c2a0a`), không phải chỉ trùng commit message. Nên chúng không mang thông tin nào bị mất.
- Repo artifacts là kho build, giá trị nằm ở **cây file hiện tại**, không ở lịch sử: chunk cũ
  được giữ để chống blank/404, còn ai đã cần đọc lịch sử commit của nó bao giờ.

## Tradeoff

- **Mất lịch sử ở phía on-prem.** Muốn truy "chunk này ra đời lúc nào" phải quay về gitlab.com —
  và gitlab.com đang là bản được cố ý giữ nguyên làm đường lùi, nếu sau này nó bị dọn thì lịch sử
  mất thật.
- Phải bật tạm `Allowed to force push` trên protected branch để seed (Maintainer **không**
  tự động có quyền này) — một cửa mở phải nhớ đóng lại.
- Hai bên giờ rời nhau hẳn: từ nay bất kỳ ai push nhầm vào bản gitlab.com sẽ không tới CI, và
  không có cơ chế nào báo.
- Vẫn còn nợ: chọn token nào cho CI variable `GIT_ACCESS_TOKEN` và rotate PAT cũ (`glpat-w06k0…`
  đã lộ qua remote URL, cũng chính là `ON_PREMISE_GITLAB_TOKEN` trong `.env.local` — đã revoke).

Liên quan: [[digest-subscriptions-2026-08-14]] · [[digest-joy-subscription-artifacts-2026-08-14]] ·
[[joy-subscription-artifacts]] · [[migrate-repo-gitlab-on-prem]] · [[digest-artifact-2026-07-24]] ·
[[2026-08-10-remote-gitlab-on-premise]]
