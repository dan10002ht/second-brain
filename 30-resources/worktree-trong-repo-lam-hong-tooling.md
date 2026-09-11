---
type: resource
title: Worktree nằm trong repo làm hỏng mọi tool quét cả cây
summary: Agent loop tạo git worktree bên trong chính repo (`.claude/worktrees/`), nên mọi tool định danh dự án bằng cách glob toàn cây sẽ thấy N bản sao của cùng một file cấu hình và từ chối chạy — cách vá đúng là khai báo phạm vi tường minh cho tool, không phải xoá worktree của session khác.
tags: [tooling, agent, automation, shopify, patterns]
created: 2026-09-11
updated: 2026-09-11
source: project `subscriptions` — session history 2026-09-11 (`yarn dev` fail, Shopify CLI 3.94)
---

# Worktree nằm trong repo làm hỏng mọi tool quét cả cây

## Triệu chứng

`yarn dev` chết trước khi khởi động:

```
Validation error in .claude/worktrees/devzone-editor-unlock/shopify.web.toml:
You can only have one "web" configuration file with the backend role in your app.
Conflicting configurations found at:
  .claude/worktrees/agent-af079930a68fb0393/shopify.web.toml
  ./shopify.web.toml
  .claude/worktrees/agent-a74a3e32648b18d6d/shopify.web.toml
  .claude/worktrees/devzone-editor-unlock/shopify.web.toml
```

Không có gì hỏng trong code. Cái hỏng là **hình dạng thư mục**: `/looptasks`, `/lt-orca` và các
skill tạo worktree đều đặt worktree **bên trong** repo, nên một checkout biến thành N+1 bản sao của
mọi file cấu hình ở root.

## Vì sao nó lặp lại

Rất nhiều tool xác định "dự án này gồm những gì" bằng một glob toàn cây, mặc định `**/<file>`:

- Shopify CLI: `**/shopify.web.toml` → báo trùng backend role.
- Cùng cơ chế với jest `roots`, eslint, tsconfig `include`, docker build context, bundler resolve.

Worktree không nằm trong `.gitignore` hiểu theo nghĩa tool hiểu — `.gitignore` chặn **git**, không
chặn glob của tool khác. Và số worktree tăng theo số task chạy song song, nên lỗi xuất hiện đúng lúc
đang bận nhất.

## Cách vá (theo thứ tự ưu tiên)

1. **Khai báo phạm vi tường minh cho tool.** Với Shopify CLI: thêm vào MỌI `shopify.app*.toml`

   ```toml
   web_directories = ["."]
   ```

   Đọc bundle của CLI để xác nhận cơ chế chứ không đoán: mặc định nó glob `**`, có `web_directories`
   thì chỉ nhìn đúng thư mục khai báo. Cùng kiểu vá: `roots` cho jest, `include` cho tsconfig,
   `.dockerignore` cho docker.
2. **Đừng xoá worktree của session khác.** Ba worktree trong ca này có hai cái đang giữ file chưa
   commit của người khác. `git worktree list` trước, đọc `git status` từng cái, rồi mới quyết.
3. Chỉ khi không khai báo được phạm vi mới tính tới chuyện dời worktree ra ngoài repo — nhưng lúc đó
   phải sửa mọi skill đang tạo chúng, và mất tiện lợi của đường dẫn tương đối.

## Rút ra

Khi một tool vốn chạy được bỗng báo "trùng cấu hình" / "nhiều hơn một X", nghi hình dạng thư mục
trước khi nghi cấu hình — đặc biệt ở repo có agent loop chạy nền. Đây là chi phí ẩn của việc để
shared state của agent sống **trong** cây làm việc, cùng họ với [[brief-state-agent-loop]].

Liên quan: [[gate-hop-nhat-truoc-khi-merge]] (worktree cô lập cũng giấu tương tác giữa các task) ·
[[chan-agent-bang-cau-hinh]].
