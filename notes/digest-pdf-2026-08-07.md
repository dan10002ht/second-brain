---
type: note
title: PDF Invoice — digest 2026-08-07 (payment reminder SB-15301)
summary: Save trả 200 mà Firestore rỗng do koa-yup-validator ghi đè body bằng object toàn `undefined` (yup 0.29), editor tự chế chỉ commit onBlur, mail gửi không bọc theme, cron không bao giờ chọn được đơn vì cờ chỉ seed ở nhánh `.add()`.
tags: [pdf, invoice, avada, firebase, firestore, nodejs, debug, skills]
created: 2026-08-07
source: project "pdf" — session history (SB-15301 payment reminder, task 7→16)
---

> Bối cảnh project: [[pdf]]. Commit landed cùng đợt: [[shipped-pdf-2026-08-07]].

Nối tiếp [[digest-pdf-2026-08-06]] (dựng spec SB-15301 từ mockup, không có PRD).
Đây là ngày implement + debug feature payment reminder due/overdue cho Wholesale plan.

## Bugs (root cause)

**Save settings trả `200 success` nhưng collection Firestore rỗng hoàn toàn.**
Chuỗi đã chứng minh: `koa-yup-validator/src/index.ts:93` sau khi validate thì
`set(ctx, path, data)` — **ghi đè `ctx.req.body` bằng giá trị yup đã cast**. Yup 0.29.3
biến một `object().notRequired()` *vắng mặt trong input* thành object đầy đủ với mọi
field = `undefined`. Firestore ném `Cannot use "undefined" as a Firestore value`, lỗi bị
nuốt ở tầng trên → controller vẫn trả 200. Fix: `.default(undefined)` cho nested object.
Cùng gốc yup 0.29 với lỗi 422 ghi ở [[shipped-pdf-2026-08-04]] nhưng triệu chứng ngược
nhau — 422 lộ ra, còn ca này im lặng. **Dấu hiệu nhận biết: response GET không có field
`id`** (repository map từ doc) trong khi vẫn trả data → data đó là default, không phải doc thật.

**Toggle đổi được nhưng save bar không hiện.** `RichTextEditor` tự chế chỉ commit vào
state lúc `onBlur` — bấm toggle rồi bấm Save ngay thì state chưa đổi. Vòng đầu agent kết
luận "không phải bug, đúng thiết kế gate plan"; verifier PASS kết luận đó. Chỉ đến khi
user gửi **ảnh chụp màn hình** mới lật lại được — verifier chỉ trace được đường code, không
chứng minh được hành vi UI. Ảnh chụp là bằng chứng rẻ nhất phá được kết luận sai kiểu này.

**Mail gửi ra chỉ có plain text, không có style như preview.** Cả hai đường gửi đều
`MailService.sendMail({ html: content })` — nội dung rich text thô, **không bọc theme**.
Preview áp theme, đường gửi thì không → hai đường render khác nhau. Bài học lặp lại của
repo này: luôn kiểm **cả hai đường** (xem trước vs gửi thật), giống ca in đơn lẻ vs in gộp
ở [[digest-pdf-2026-07-30]].

**Cron sẽ không bao giờ chọn được đơn nào.** `wholesaleOrdersRepository.createOrUpdateOrder`
/`updateOrder` chỉ seed cờ ở nhánh `.add()`, nên toàn bộ đơn đã tồn tại không có cờ và
query của cron loại hết. Phát hiện *trước* khi user mất công dựng đơn test. Ghi thành task
riêng kèm 3 hướng sửa + đánh đổi thay vì tự chốt một hướng.

**Agent kết luận sai một ca logic JS:** `Number(config.resendDays || 0)` — `|| 0` nằm
**bên trong** `Number()` nên áp lên chuỗi trước khi đổi kiểu (`"0"` là truthy). Agent điều
tra đọc lướt thành `Number(...) || 0`. Kết luận của agent điều tra phải đọc lại chính biểu
thức, không nhận nguyên trạng.

## Techniques

- **Phân biệt "đường ghi hỏng" với "request không tới"**: dùng service account probe thẳng
  vào Firestore (`query` → `add()` → đọc lại → `xoá`). Đường ghi khoẻ ⇒ lỗi nằm ở app.
  Lưu ý app local chạy bằng **ADC của user**, còn probe chạy bằng **service account** —
  hai danh tính khác nhau, phải thử đúng cách app xác thực mới kết luận được.
- **Gộp nhiều nhánh bằng cherry-pick tuyến tính**, không merge — MR review được từng bước.
  6/6 cherry-pick sạch; nhánh gộp base từ `origin/master` mới fetch nên kéo theo fix
  upstream mà các nhánh cũ chưa có → phải chạy lại gate sau khi gộp.
- **`git add` khi repo đang merge dở** sẽ đẩy file vào index của merge đó. Kiểm
  `git status` trước khi add nếu working tree không phải do mình để lại.
- **Lock `/looptasks` đọc theo thời gian là không đủ.** Một agent chạy 61 phút wall-clock
  bị coi là mồ côi → spawn agent trùng. Phải hỏi `ListAgents` xác nhận agent còn sống
  trước khi nhận lại task; ngưỡng đã nâng 30 → 90 phút. Nối tiếp ghi chú ở [[digest-pdf-2026-08-06]].
- **Đọc nguyên văn file skill, đừng tin bản tóm tắt WebFetch.** Bản tóm tắt lần fetch đầu
  đã lược mất đoạn "Skill này chạy trong khung `/loop`", dẫn đến trả lời sai hai lượt liền
  về việc `/looptasks` có tự lặp hay không. `/looptasks` = nhặt task rồi làm, chạy **một
  lượt**; phần lặp là `/loop` bọc ngoài **hoặc** nhánh tự tạo cron trong chính skill.

## Context

- Feature gate theo **Wholesale plan**; shop dev `dantt-pdf-dev.myshopify.com`
  (`AYctc8Mrxl664GaFbRUj`, `avada-staging`) đã set `plan=wholesale` + `useChattySmtp: true`
  để test đường gửi. App **không** bắt merchant nhập SMTP — `getSmtpConfig` chỉ dùng SMTP
  của merchant nếu có, còn lại rơi về creds Chatty (xem [[digest-pdf-2026-07-31]]).
- 16 task đóng trong ngày, mỗi task một nhánh rồi gộp về `feature/payment-reminder`.
  P1 (FE) phải qua **4 vòng verifier** mới PASS — riêng nó tốn nhiều thời gian hơn cả P0+P2+P4.
- Backfill cờ cho đơn cũ: **cố ý hoãn** tới khi BA có requirement, ghi rõ trong BRIEF để
  sau không ai tưởng là quên.
- Refactor tách component theo **tiền lệ sẵn có của repo** (`pages/DevZone/` 13 file,
  subcomponent nằm cạnh page) thay vì tự chế pattern → xem [[feedback-follow-conventions]].
- Editor ô Content chuyển sang **CKEditor 5 có sẵn trong repo**
  (`@ckeditor/ckeditor5-build-classic` + `components/CkeditorInput`), bỏ editor tự chế.

→ Kỷ luật verify tách tầng ghi ở [[2026-08-07-phan-tang-verifier]];
default opt-in ghi ở [[feedback-feature-moi-mac-dinh-opt-in]];
tên nhánh `feature/payment-reminder` theo [[feedback-ten-nhanh-ngan]].
