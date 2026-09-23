---
type: decision
title: Codex hết quota thì implement hạ xuống Claude, đổi lấy việc mất tính cross-family của verify
summary: Hàng đợi implement đứng im khi Codex hết quota, nên runExecutor() hạ xuống Claude — chấp nhận executor và verifier cùng họ model, và ghi `rec.executor` để chỗ nào cần thì biết mà giảm tin.
tags: [agent, automation, tooling]
created: 2026-09-23
updated: 2026-09-23
review: 2026-12-23
source: VM `dantt-solar` — SB-17107, đo trực tiếp 2026-09-23
---

# Fallback Codex → Claude khi hết quota

## Bối cảnh

Ngày 23/09, Codex báo `You've hit your usage limit … try again at Sep 26th`. Quota về sau **ba
ngày**. Trong ba ngày đó mọi case triage xong đều chết ở bước implement — hàng đợi đứng im mà
nhìn từ ngoài chỉ thấy `failed`.

Ba lỗi xếp chồng trên cùng một case (SB-17107) trong một buổi sáng, mỗi lỗi che lỗi sau:

| Lượt | Chết ở | Lý do thật | Thông báo hiện ra |
|---|---|---|---|
| 02:09 | triage 5s | Claude chưa đăng nhập | `claude bao loi: success` |
| 02:56 | implement 13s | Codex hết quota | `codex thoat ma 1 :: failed to load skill …` |
| 04:15 | — | — | ✅ MR nháp !2632 |

## Quyết định

1. `runExecutor()` thử Codex trước; **chỉ khi** lỗi khớp `RE_HET_QUOTA` mới hạ xuống Claude.
   Mọi lỗi khác ném nguyên để case fail đúng lý do.
2. Ghi `rec.executor` (`codex` | `claude`) và `cost.claudeImplementUsd` vào state.
3. Claude ở vai implement được `Write`/`Edit`/`Bash`; verify **giữ nguyên** read-only.

## Why

- **Fallback theo quota, không theo mọi lỗi.** Nếu bắt mọi lỗi mà chuyển executor thì timeout,
  thiếu khối ```json, lệnh không tồn tại… đều biến thành "chạy lại bằng model khác" — tốn tiền
  gấp đôi và giấu mất lỗi thật. Regex đã kiểm 7 trường hợp: bắt 3 dạng hết quota, bỏ 4 lỗi thật.
- **Quota Codex là ràng buộc theo ngày, không theo giờ.** Hết là hết ba ngày, không phải chờ vài
  phút. Cơ chế thử lại không cứu được, chỉ đổi executor mới cứu được.
- **Claude làm được việc này** — nó đang làm verify trên cùng repo, và đã chứng minh: 411 giây,
  3 file, 95 dòng, hai commit đúng thiết kế (test fail → fix pass), verify PASS, ra MR.

## Tradeoff

- **Mất tính cross-family của verify.** Verify chạy Claude; khi fallback kích hoạt thì executor
  và verifier cùng họ model, nên kết luận PASS kém độc lập hơn — mô hình dễ bỏ qua chính lỗi mà
  họ nhà nó hay mắc. Hiện chỉ **ghi lại** sự thật đó (`rec.executor`), chưa hạ ngưỡng tin cũng
  chưa bắt buộc người review. Đây là món nợ có ý thức, không phải chỗ quên.
- **Đắt hơn.** Implement bằng Claude tốn $2,49 cho case này; Codex tính theo token của gói riêng.
  Fallback chạy càng lâu thì hoá đơn Claude càng gánh cả hai vai.
- **Hai vai cùng một tài khoản Claude.** Triage + implement + verify cùng rút một quota; hết quota
  Claude thì mất cả ba, không còn đường lùi nào nữa. Codex hết quota còn có Claude; Claude hết thì
  không.

## Liên quan

- [[agent-mat-dang-nhap-claude-sb-17107]] — lỗi đầu tiên trong chuỗi, và bài học về thông báo lỗi
  cắt sai chỗ làm chẩn đoán đi sai hướng.
- [[agent-support-design]]
