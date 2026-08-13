---
type: decision
title: ticket-mcrsv commit lockfile và chuyển CI Node sang yarn --immutable
summary: Bỏ dòng gitignore mọi lockfile, commit lockfile thật của từng service Node và đổi CI từ `npm ci` sang `yarn install --immutable`; lint tạm thời chưa chặn để CI không đỏ vĩnh viễn.
tags: [tooling, nodejs, yarn, monorepo, architecture]
created: 2026-08-13
updated: 2026-08-13
status: active
review: 2026-11-13
source: project "ticket-mcrsv" — session history (8c7111d4, task H44)
---

# Commit lockfile, CI Node dùng `yarn install --immutable`

`.gitignore:13-15` của repo đang ignore **mọi** lockfile
(`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`). Hệ quả đo được: job CI
`test-node` của `gateway` và `auth-service` **chưa từng chạy thành công lần nào** —
`npm ci` bắt buộc phải có `package-lock.json`, không có thì `EUSAGE` ngay.

Chốt:
1. Bỏ 3 dòng gitignore lockfile; commit lockfile thật của từng service Node.
2. CI đổi `npm ci` → `yarn install --immutable` (tương đương của Yarn Berry), kèm
   `.yarnrc.yml` để `yarn test` chạy được **không cần biến môi trường** (gỡ footgun
   `YARN_NODE_LINKER` từng gây "đỏ giả").
3. Bước **Lint chưa chặn** ở lần này.

## Why

Gốc không phải "CI dùng nhầm npm" — đó chỉ là triệu chứng. Gốc là repo không giữ
lockfile nào cả, nên không có bản cài đặt tất định: CI, máy dev và container mỗi nơi
resolve một cây dependency khác nhau, và job CI của hai service Node im lặng không
bao giờ chạy. Việc này chỉ lộ ra khi kiểm một chi tiết nhỏ của task khác, tức nó có
thể nằm im thêm nhiều tháng nữa.

Chọn yarn thay vì sinh `package-lock.json`: hai service đó đang thật sự dùng yarn
(chỉ có `yarn.lock`), nên đổi package manager của CI là kê đúng thuốc, còn ép sang
npm là bắt code chạy theo công cụ.

## Tradeoff

- **Được:** cài đặt tất định; CI Node chạy lần đầu tiên; footgun biến env biến mất.
- **Mất / nợ có chủ ý:** lint **không chặn**, vì bật lên là CI đỏ ngay với **1.448 +
  433 vấn đề có sẵn** — mà CI đỏ vĩnh viễn chính là thứ đã tạo ra tình trạng "không
  ai nhìn CI" ban đầu. Nợ này phải trả bằng một task riêng (`prettier --write` +
  `env: {jest: true}` + gỡ `continue-on-error`), nếu không nó sẽ đóng băng thành
  "lint ở repo này không tính".
- **Chưa xác minh:** CI xanh thật chưa được chứng minh — cần push một nhánh test để
  xác nhận job `test-node` chạy, và đó là việc của user.

## Review 2026-11-13

Câu hỏi: lint đã được bật chặn chưa, hay vẫn `continue-on-error`? Vẫn thì hoặc lên
lịch trả nợ, hoặc thừa nhận là bỏ lint và gỡ luôn job cho khỏi giả vờ.

→ [[digest-ticket-mcrsv-2026-08-13]] · [[2026-08-11-ban-do-tai-k3d-k6]] ·
[[bang-chung-phan-biet-duoc]]
