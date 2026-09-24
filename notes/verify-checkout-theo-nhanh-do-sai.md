---
type: note
title: Cổng đỏ→xanh đo sai vì checkout theo tên nhánh, không theo SHA
summary: SB-17166 bị chặn oan dù test xanh 42/42 — verify checkout bước "xanh" theo tên nhánh mà codex đã đổi tên, checkout thất bại im lặng nên nó đo lại đúng commit chưa sửa; hai lỗi cộng lại là checkout theo ref biến đổi được và run() không bao giờ reject.
tags: [agent, automation, tooling, git]
created: 2026-09-24
updated: 2026-09-24
---

# Cổng đỏ→xanh đo sai vì checkout theo tên nhánh

`verify.js` chứng minh "test đỏ trước, xanh sau" bằng cách checkout hai commit rồi chạy test.
Bước đỏ checkout theo **SHA**, bước xanh checkout theo **tên nhánh** (`rec.branch`). Chênh lệch
đó im lặng suốt cho tới khi có một case mà nhánh không còn tên cũ.

## Chuỗi nhân quả (SB-17166, 24/09)

1. `implement.js` tạo worktree trên nhánh `agent/SB-17166` và ghi tên đó vào record.
2. Codex **đổi tên nhánh** thành `fix/stale-billing-attempts` — reflog ghi rõ
   `Branch: renamed refs/heads/agent/SB-17166 to refs/heads/fix/stale-billing-attempts`.
   Nó làm vậy vì luật `[[feedback-ten-nhanh-ngan]]` vừa được nối sang VM ngày 23/09 và
   luật đó không có ngoại lệ cho nhánh do harness tạo.
3. Bước xanh chạy `git checkout agent/SB-17166` → **thất bại**, nhưng `run()` luôn `resolve`
   và chỗ gọi không kiểm mã thoát, nên lỗi bị bỏ qua hoàn toàn.
4. Worktree đứng nguyên ở commit chỉ-test → test chạy lại cho **đúng kết quả đỏ** của bước trước.
5. Cổng kết luận "sửa rồi vẫn đỏ", chặn MR. Chạy tay ở commit fix: **42/42 pass**.

Dấu hiệu nhận ra sớm mà tôi đã bỏ qua một lượt: `red.tail` và `green.tail` trong record
**giống hệt nhau**. Hai lần chạy ở hai commit khác nhau không thể ra output trùng từng chữ.

## Ba thứ đã sửa

| Chỗ | Trước | Sau |
|---|---|---|
| `proveRedGreen` | checkout theo `rec.branch` | `checkout --detach <sha>`, và **throw** nếu mã thoát ≠ 0 |
| `openMergeRequest` | `push --set-upstream origin <branch>` | `push origin <sha>:refs/heads/<branch>` — không cần nhánh local |
| prompt `implement.js` | không nói gì về tên nhánh | cấm `branch -m` / `checkout -b`; nêu rõ tên nhánh là khoá liên kết |

Cộng thêm: tạo MR ngay sau push nhận `400 {"source_branch":["does not exist"]}` dù nhánh
trên origin đã trỏ đúng commit — push xong **không** đồng nghĩa ref đã hiện trong API. Nay có
vòng hỏi `repository/branches/<branch>` tới khi thấy mới gọi tạo MR.

## Bài học chung

**Ref biến đổi được thì đừng dùng làm mốc đo.** Tên nhánh là con trỏ người/máy khác sửa được;
SHA thì không. Mọi phép đo cần so hai trạng thái phải neo vào SHA.

**Một hàm không bao giờ reject là một lớp che lỗi.** `run()` cố ý trả `{code, out}` để chỗ gọi
tự quyết — nhưng như vậy mỗi chỗ gọi phải kiểm `code`, và chỗ nào quên thì lỗi mất hẳn. Nơi
sai không được phép đi tiếp thì phải bọc thành hàm tự throw.

## Liên quan
- [[feedback-ten-nhanh-ngan]] · [[agent-mat-dang-nhap-claude-sb-17107]] · [[feedback-ra-het-duong-verify]]
