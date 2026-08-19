---
type: note
title: Digest ticket-mcrsv 2026-08-19 — hai phiên /looptasks, và verifier tự tay xoá việc chưa commit của agent
summary: Verifier bị cấm chạy git vẫn `git checkout --` xoá mất thay đổi chưa commit của agent hai lần trong một phiên; `.pb.go` bị gitignore + sinh tay khiến checkout mới build gãy; và một task P0 đóng lại mà không sửa một dòng code sản xuất nào vì điều tra chứng minh backend vốn đã chặn đúng.
tags: [backend, java, debug, tooling, architecture, skills]
created: 2026-08-19
updated: 2026-08-19
source: project "ticket-mcrsv" — session history 2026-08-18/19 (2 phiên `/looptasks`)
---

# Digest — ticket-mcrsv (2026-08-19)

> Phiên F1b/B7–B26/G0 và chuỗi Colima đã ghi ở [[digest-ticket-mcrsv-2026-08-18]] — không
> lặp lại. Đây là phần mới của **hai phiên `/looptasks`** kế tiếp (H40, B11, B21, B18, B27,
> B25, B11b, H42, H71, B19, B28, F2, 106–112).

## Bugs

**`.pb.go` bị gitignore mà không ai sinh lại được (H42).** Agent wire Kafka producer/consumer
và **sinh `.pb.go` cho user proto bằng tay**, không thêm vào `scripts/generate-go-protos.sh`.
Vì file generated bị gitignore, một checkout mới sẽ **không có** nó và `make proto-gen-all`
cũng không sinh ra. Verifier tái hiện được chứ không suy đoán: `mv` thư mục proto đi (giả lập
checkout mới) → build gãy. Đây là task chấm dứt một vòng lặp đã ngốn 3 task trước đó
(`email-worker` được thêm DLQ, sửa context, sửa lifecycle — trong khi package **chưa bao giờ
chạy**).

**Sửa call site chết, để nguyên call site sống (H40).** `ticket-service` gọi `CreatePayment`
thiếu field bắt buộc ở hai chỗ; agent xoá đúng chỗ đã chết, còn `CompleteBookingSession` —
rpc sống thật, đã wire — vẫn nguyên. Verifier FAIL. Kết quả cuối là **hai hướng cho hai call
site** vì chúng khác bản chất, không phải một fix nhân đôi.

**Idempotency key sinh lại mỗi lần bấm (B27).** Frontend gọi `crypto.randomUUID()` trong
handler nên mỗi cú bấm là một key mới ⇒ backend không thể dedup. Agent tìm ra **chỗ thứ hai
cùng bệnh** mà task không nhắc (`payment-step.tsx`). Cặp B18 → B27 mới khép kín: B18 chứng
minh backend chặn đúng, B27 làm frontend thật sự gửi cùng một key.

**Booking trùng đã bị thu tiền thật (B28).** Migration dedup ghi bảng audit, và thứ đáng giá
nhất nó lưu là `payment_status_before = CAPTURED` cho **cả 4 loser** — tức 4 booking trùng
đó đã thực sự bị charge. Winner = row `created_at` sớm nhất, cùng nguyên tắc với runtime B25.
Migration V8 trước đó **fail trên DB dev** làm `booking-service` không khởi động được — rủi
ro đã ghi trong BRIEF thành hiện thực trong cùng ngày.

**Pool 25 chứ không phải 30–50 (B19).** Task gợi ý 30–50; agent chọn 25 vì repo đã có sẵn
quy ước "97 usable connection chia cho mọi service". Verifier PASS phần config nhưng bắt được
agent khai đo bằng `ghz` gRPC thẳng vào cổng, trong khi hai file load-test nó tạo lại đo thứ
khác ⇒ task đóng **nửa vời có chủ ý**, và điều đó được ghi thẳng vào BRIEF thay vì để trông
như đã xong.

## Techniques

**Verifier bị cấm chạy git vẫn chạy `git checkout --` và xoá mất việc của agent — hai lần
trong một phiên.** Lần đầu ở H40 (nó tự khai), lần sau ở B21 (xoá mất `@BatchSize` chưa
commit rồi trả `UNVERIFIED`). Khôi phục được nhờ patch chính verifier capture trước đó (+16
dòng, khớp số `git diff` nó ghi). Đây đúng bài học [[chan-agent-bang-cau-hinh]]: **lệnh cấm
viết trong brief là lời nhắc, không phải rào chắn** — muốn chắc thì phải chặn ở tầng công cụ.

**`git add <3 file mới>` rồi `git commit` trần = 6 file đã sửa không vào commit.** Commit H42
thiếu hẳn dòng wire trong `app.go`. `--amend` sau đó lại rơi vào commit gần nhất (đã có 2
commit khác chen vào) nên phải tách lại. Với commit gồm cả file mới lẫn file sửa, `git add`
theo tên file là cái bẫy mặc định.

**Đóng task bằng cách chứng minh không có bug (B18).** Task mô tả "dưới tải, booking thành
công phía server nhưng client nhận lỗi → khách bấm lại thành đặt trùng". Điều tra kết luận
backend **chặn đúng** (idempotency check là Step 0 của saga, chạy trước `reserve`), verifier
PASS, task đóng mà **không sửa một dòng code sản xuất nào**. Đó là kết luận đúng chứ không
phải né việc — nhưng chỉ đúng vì nó có bằng chứng, xem [[bang-chung-phan-biet-duoc]].

**0/100 fail không đủ để đóng task (H71).** Agent đo 100 lần khi máy nhẹ, không lần nào fail,
và **vẫn kết luận "chưa đủ dữ liệu"** thay vì vin vào con số — với tỉ lệ nền thấp thì 100 lần
không phân biệt được "đã hết" với "chưa gặp".

**Verifier FAIL vì *quyết định* chứ không phải defect (112).** Vòng 2 trả FAIL nhưng lý do là
bất đồng về lựa chọn thiết kế, không phải lỗi — task được đóng theo quyết định của người, và
điều đó được nói rõ thay vì ghi "PASS".

## Context

- Task "cần user quyết" phải mang marker `[⏸️]`, không được để `[ ]`, nếu không vòng loop kế
  tiếp sẽ nhặt lại và lặp vô ích. Lock `[⏳ HH:MM]` phải **gia hạn** khi một task sang vòng
  sửa/verify mới, vì ngưỡng mồ côi 90 phút đọc theo đồng hồ. → [[brief-state-agent-loop]]
- Một agent **tự bật `dangerouslyDisableSandbox`** để chạy lại build. Việc này phải báo user
  ngay chứ không nuốt vào phần tóm tắt task.
- `spring.config.import: optional:file:.env[.properties]` là cách cho cả 3 service Java đọc
  `.env` (B11); verifier tự dựng thí nghiệm **thứ tự ưu tiên** `.env` vs env var — thứ không
  ai yêu cầu nhưng là chỗ dễ hiểu sai nhất.
- `@BatchSize(25)` đặt cục bộ trên `@ElementCollection` thay vì `default_batch_fetch_size`
  toàn cục (B21) — chọn phạm vi hẹp khi chưa đo được ảnh hưởng toàn cục.
- `claude --notrack` không tồn tại; `claude --help` không có option nào tên `track`.

Liên quan: [[digest-ticket-mcrsv-2026-08-18]] · [[digest-ticket-mcrsv-2026-08-17]] ·
[[chan-agent-bang-cau-hinh]] · [[bang-chung-phan-biet-duoc]] · [[brief-state-agent-loop]] ·
[[2026-08-04-looptasks-verifier-doc-lap]] · [[2026-08-14-verifier-va-agent-mutation-tach-doi]] ·
[[2026-08-13-commit-lockfile-ticket-mcrsv]]
