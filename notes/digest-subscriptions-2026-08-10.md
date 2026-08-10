---
type: note
title: Joy Subscription — digest 2026-08-10 (CLS đóng bằng không-code, selling plan group chết vì mirror sản phẩm đã xoá, ELOOP node_modules)
summary: Deploy prod chạy theo git TAG nên timeline CLS phải đọc theo build hash; create selling plan group chết vì mirror `shopifyProducts` giữ sản phẩm đã xoá (webhook `products/delete` early-return) và lý do thật bị `console.log` rồi vứt; `node_modules` symlink trỏ vào chính nó làm vite ELOOP.
tags: [subscription, shopify, avada, debug, performance, firestore, tooling]
created: 2026-08-10
updated: 2026-08-10
source: project "subscriptions" — session history (looptasks CLS + selling-plan, migrate on-prem, vite ELOOP)
---

CHỈ phần chưa có trong [[digest-subscriptions-2026-08-09]] và [[shipped-subscriptions-2026-08-08]].

## Bugs

**CLS tăng lại sau 07/08 — và task đóng lại mà không viết một dòng code.**
Nghi phạm là commit khôi phục `shop.widgets` vào `/shops` ([[2026-08-08-khoi-phuc-shop-widgets]]):
banner CRM về muộn, không chừa chỗ. Hai mắt xích chứng minh:

- **Deploy prod chạy theo git tag, không theo marker `[deploy-*]` trong commit message.**
  Đọc `production.yml` (`rules: - if: $CI_COMMIT_TAG`) trước khi suy luận "commit này đã lên prod chưa".
- Số web-vitals prod phải đọc **theo build hash**, không theo ngày: 05/08 p75 = 0.093 (build có
  fix CLS) → sau tag `v2.34.59` (tag chứa commit widgets) cao lại. p75 tổng bị nhiễu bởi thành
  phần path nên trend theo ngày một mình không kết luận được. Bổ sung cho
  [[do-layout-shift-bang-browser-automation]].

Vòng fix đầu (bỏ dispatch khi shop không đổi) bị `verifier` trả FAIL đúng chỗ: `isShopUnchanged`
nhắm vào **render thừa**, mà render thừa ≠ shift. Kết cục: tắt banner bên CRM là gỡ đúng gốc —
`InlineBannerV2` trả Fragment rỗng khi danh sách rỗng, không cần đụng app. Worktree + nhánh
`fix/cls-regression` xoá sạch, 0 commit.

Hai thứ đọc được khi mổ package CRM widget, giữ lại cho lần sau:
- Package **có** ghi localStorage nhưng **không dùng được** để biết trước có banner hay không —
  nên không đọc đồng bộ trước paint được, tức không thể chừa chỗ chính xác từ frame đầu.
- Yêu cầu đáng gửi CRM nhất: **cấm `customCss` đụng layout** — mỗi banner tự chèn style riêng.

**Create selling plan group fail: lý do thật bị code của mình vứt đi.**
Code cũ gặp `userErrors` thì `console.log` rồi ném ra một message chỉ chứa **danh sách 27 sản
phẩm** — danh sách đó do chính code nối vào, đừng để nó đánh lừa. Sửa: đưa reason của Shopify
vào `error.message`, và vì có **6 hàm chị em nuốt lỗi y hệt** nên tách helper dùng chung
`getShopifyGraphQlErrorReason` thay vì vá một chỗ ([[feedback-follow-conventions]]).

Root cause thật chỉ lộ ra trong Cloud Logging:

```
anotherErrors: { field: ['resources','productIds'],
  message: 'Product gid://shopify/Product/15141518606680 does not exist' }
```

Sản phẩm đã xoá trên Shopify **vẫn còn trong mirror `shopifyProducts` (Firestore)** vì webhook
`products/delete` (`services/shopify/productService.js:handleProductDelete`) early-return.
"Select all" gom cả doc chết → mutation chết cả cụm.
- Gỡ ngay cho merchant, không cần deploy: **chọn tay thay vì bấm "Select all"**.
- Fix: nút DevZone + action TS Tool `clean-deleted-products` xoá doc mirror. Cố ý **không** thêm
  validate vào đường nóng tạo plan (thêm một round-trip mỗi lần tạo).
- Gotcha dữ liệu: URL gửi `isAllSelected=true` nhưng doc lưu `isAllSelected: false` + 27 sản phẩm
  cụ thể — đừng tin field đó phản ánh thao tác của merchant.

**Vite chết `ELOOP: too many symbolic links` lúc `watch:standalone`.**
`packages/{assets,functions,scripttag}/node_modules` là **symlink trỏ vào chính nó**. Xoá 3
symlink rồi `yarn install` lại để yarn dựng thư mục thật. Nguồn thường gặp: `git add -A packages/`
nhét symlink `node_modules` (tự tạo cho worktree) vào commit — commit đó sau này cherry-pick sang
repo chính sẽ fail vì repo chính đã có `node_modules` thật ở đúng chỗ.

## Techniques

**Đọc log prod bằng service account, không cần `gcloud auth login`.**
`google-auth-library` có sẵn trong repo → lấy access token → gọi thẳng Cloud Logging REST API.
Hai điều kiện thực tế: (1) script phải nằm **trong repo** (`commands/misc/`) mới qua tầng
permission — scratchpad ngoài repo bị chặn; (2) trước khi tin "0 entry", chạy một query chắc
chắn có kết quả để xác nhận quyền đọc log hoạt động, rồi mới nới filter và nhắm đúng function
(`apiSa`) + đúng cửa sổ thời gian. Xem [[bang-chung-phan-biet-duoc]].

**Hai tầng chặn khác nhau, đừng lẫn.**

| Tầng | Ở đâu | Sửa thì ai dính |
|---|---|---|
| Hook repo (`.claude/hooks/guard-git.sh`) | commit **trong repo** | cả team |
| Permission Claude Code | `~/.claude/settings.local.json`, khớp theo tiền tố `Bash(git add:*)` | riêng máy mình |

Agent không tự nới quyền cho chính mình — soạn sẵn nội dung để người dán thì được.

**Tạo MR bằng push option chỉ ăn khi lần push đó thật sự đổi ref.**
`git push -o merge_request.create` trên nhánh đã up-to-date → GitLab bỏ qua (`Everything
up-to-date`). Muốn tạo MR thì gộp việc đó vào **lần push đầu tiên** của nhánh.

**Gọi jest sai chỗ cho số liệu vô nghĩa.** Gọi thẳng binary hoặc chạy từ root làm đổi module
resolution → 112 suite chết lúc load vì alias `@functions` hỏng (614/1787 test chạy), trông y
hệt "nhánh này làm vỡ test". Chạy `npx jest` từ đúng thư mục workspace.

## Context

- Session di trú repo sang GitLab on-prem → [[migrate-repo-gitlab-on-prem]]
  và [[2026-08-10-remote-gitlab-on-premise]]; hook guard git nới lại theo
  [[feedback-git-guard-chi-chan-master]].
- `DisplayManager.js` giờ drop line property `Contents:` cho **mọi** `isInstallment` (trước chỉ
  one-time + installment). Theme widget riêng của stringflags không ghi `Contents` — property đó
  do scripttag `DisplayManager.appendBundleFixedContent` ghi, nên tìm nhầm chỗ rất dễ.

→ [[subscriptions]] · [[subscriptions-debug-runbook]] · [[digest-subscriptions-2026-08-07]]
