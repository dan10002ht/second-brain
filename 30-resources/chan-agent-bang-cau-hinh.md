---
type: resource
title: Chặn agent bằng cấu hình, không bằng chỉ thị
summary: Dặn agent "chỉ đọc, đừng ghi vào DB dev" là một lời nhắc chứ không phải rào chắn — rào chắn là để default trỏ vào tài nguyên KHÔNG tồn tại, sao cho làm sai thì test skip/lỗi ồn ào thay vì ghi vào hệ thống thật.
tags: [ai, skills, method, tooling, postgresql, architecture]
created: 2026-08-12
updated: 2026-08-12
source: project "ticket-mcrsv" — session history 2026-08-11 (agent X3 ghi nhầm 6 dòng vào DB dev dùng chung)
---

# Chặn agent bằng cấu hình, không bằng chỉ thị

## Chuyện đã xảy ra

Task giao cho một subagent là **sửa integration test**, kèm ràng buộc bằng lời: *không ghi vào DB
dev dùng chung*. Agent làm đúng phần code, nhưng test của nó đọc tên DB từ env với **default là
`booking_system`** — chính là DB dev đang chạy thật. Chạy `go test` một phát:

- **6 dòng thật ghi vào `email_jobs`** (id 7–12) của stack dev dùng chung
- agent `createdb` + migrate thêm một DB `email_worker_test`

Agent tự khai và tự dọn. Verifier read-only xác nhận sạch — trừ **`email_jobs_id_seq.last_value = 12`**,
khoảng trống sequence không lùi lại được.

## Luật rút ra

> Một ràng buộc chỉ có giá trị bằng **thứ ép nó**. Chỉ thị trong prompt là *lời nhắc*; cấu hình mới
> là *rào chắn*.

Cụ thể cho môi trường test:

| Cách chặn | Khi agent làm sai thì sao |
|---|---|
| ❌ "đừng ghi vào DB dev" trong prompt | ghi thật, phát hiện sau khi đã ghi |
| ✅ default trỏ vào DB **không tồn tại** (`email_worker_test`) | test **skip** hoặc lỗi kết nối — hỏng ồn ào, không hỏng dữ liệu |
| ✅ credential chỉ có quyền đọc | write bị DB từ chối, không phụ thuộc agent nhớ hay quên |
| ✅ agent chạy trong worktree / container riêng | không có đường chạm tài nguyên chung |

Nguyên tắc chung: **fail về phía an toàn phải là hành vi mặc định**, không phải phần thưởng cho việc
đọc kỹ prompt. Đây là cùng một họ với "denylist hỏng theo thời gian, allowlist thì không"
([[2026-08-12-mcp-settings-allowlist]]): thứ gì phải *nhớ mới đúng* thì sớm muộn cũng sai.

## Hai hệ quả kèm theo

1. **Agent tự khai vi phạm ≠ đã sạch.** Phải kiểm bằng một agent read-only độc lập, đếm hàng thật
   trong DB / Redis, chứ không nhận lời tự chấm — [[bang-chung-phan-biet-duoc]].
2. **Có thứ không dọn được.** Sequence đã nhảy thì không lùi. Nên rào chắn phải đứng **trước**, chứ
   không trông vào việc dọn sau.

## Áp dụng ở đâu nữa

- Agent chạy song song: cấp **lệnh phạm vi service**, không cấp lệnh repo-wide (hai lần
  `make proto-gen-all` cùng lúc đã xoá mất thư mục proto giữa lúc verifier đang build).
- Cron/job gửi mail: cờ opt-in phải nằm ở nơi merchant bật, và default là tắt —
  [[feedback-feature-moi-mac-dinh-opt-in]].
- Script chạm production: cho chạy `--dry-run` in ra đúng danh sách sẽ đụng, rồi mới apply.

→ [[digest-ticket-mcrsv-2026-08-12]] · [[bang-chung-phan-biet-duoc]] ·
[[2026-08-12-mcp-settings-allowlist]] · [[feedback-feature-moi-mac-dinh-opt-in]] ·
[[2026-08-04-looptasks-verifier-doc-lap]]
