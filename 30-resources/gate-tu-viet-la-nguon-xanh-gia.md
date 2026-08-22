---
type: resource
title: Gate script tự viết là nguồn "xanh giả" trước cả code
summary: Một gate script mình tự viết cho agent thường không thể đỏ được — vì `$?` bị nuốt bởi lệnh cuối trong subshell, và vì test thiếu hạ tầng thì SKIP im lặng mà vẫn in `ok`; nên trước khi tin verdict PASS phải chứng minh gate đỏ được.
tags: [tooling, method, skills, debug]
created: 2026-08-22
updated: 2026-08-22
source: project "ticket-mcrsv" — session history (task 122, và lặp lại ở gate doc cùng phiên)
---

Khi giao việc cho lane/agent, mình thường viết một `gate-<task>.sh` để chấm. Cái script đó là **thứ quyết định PASS/FAIL của mọi vòng sau**, nhưng lại là thứ duy nhất không ai chấm. Trong một phiên `ticket-mcrsv` nó hỏng **hai lần theo hai kiểu khác nhau**, và cả hai lần đều do verifier bắt chứ không phải tôi tự thấy.

## Hai kiểu hỏng

**1. `rc` không bao giờ thành 1.**

```bash
# SAI — echo cuối luôn thành công nên subshell luôn exit 0
( cd svc && go build ./... ; echo "--- exit $?" ) || rc=1

# ĐÚNG — bắt $? ngay sau lệnh thật
( cd svc && go build ./... ); c=$?; echo "--- exit $c"; [ $c -ne 0 ] && rc=1
```

Cùng họ với `cmd | tee log` (exit code của `tee`), `set -e` bị vô hiệu trong `if`/`||`, và `$?` đọc sau một lệnh trung gian.

**2. Test SKIP im lặng vẫn in `ok`.**

Gate không dựng Postgres/Redis ⇒ 36 test integration `SKIP`, `go test` in `ok` cho package, `GATE EXIT 0`. Không có dòng nào nói dối, nhưng kết luận thì sai hoàn toàn. Luật thêm vào:

```bash
if grep -q "^--- SKIP" "$log"; then
  echo "!!! CO TEST SKIP - day la xanh gia, tinh la FAIL:"; rc=1
fi
```

## Luật rút ra

| ❌ | ✅ |
|---|---|
| Viết gate rồi tin verdict của nó | **Tiêm một lỗi thật vào và xem gate có đỏ không** trước khi dùng để chấm ai |
| Gate dựng hạ tầng dùng chung với dev | Container disposable, **tên tách bạch** (`t122-verify-pg`), `trap cleanup EXIT` |
| Đếm "N tests passed" là đủ | Đọc dòng `Test Suites:`/`SKIP` — suite chết lúc load đóng góp **0 test** nên dòng `Tests:` vẫn trông xanh |
| Sửa gate cho xanh | Gate đỏ mà không giải thích được là **phát hiện**, không phải phiền toái |

Cùng lớp với [[truong-last-verified]] (dấu xác minh mà CI chỉ kiểm được *có trường*, không kiểm được *đúng*) và [[bang-chung-phan-biet-duoc]] (mọi kết luận tự chấm đều là bằng chứng vắng mặt). Trong `/looptasks` thì đây là lý do verifier phải là agent context sạch, xem [[2026-08-04-looptasks-verifier-doc-lap]] — nhưng verifier chỉ hữu ích nếu **thước nó cầm** cũng bị nghi ngờ.

Liên quan: [[gate-quet-ma-nguon-bang-ast]] · [[brief-state-agent-loop]] · [[digest-ticket-mcrsv-2026-08-22]] · [[2026-08-22-cau-truc-doc-theo-vong-doi]] · [[2026-08-13-tach-gate-khoi-cham-tung-bug]]
