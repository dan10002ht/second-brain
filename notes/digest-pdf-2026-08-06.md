---
type: note
title: Digest PDF Invoice 2026-08-06 — spec SB-15301 payment reminder + vòng verifier qua đêm
summary: CHỈ phần mới — feature payment reminder không hề có PRD nên spec phải dựng từ mockup + quyết định của user; verifier bắt được cả tham chiếu code lệch 1 dòng lẫn default lệch mockup, và các bẫy khi để `/looptasks` tự chạy qua đêm (cron sống trong session, gate hỏng sẵn phải chứng minh, kiểm toàn vẹn repo trước khi tin PASS).
tags: [pdf, invoice, shopify, avada, skills]
created: 2026-08-06
source: project "pdf" — session history (session e991ea15, 2026-08-05 → 2026-08-06)
---

# PDF Invoice — digest 2026-08-06

> Bối cảnh: [[pdf]]. Digest gần nhất: [[digest-pdf-2026-08-05]] ·
> commit landed: [[shipped-pdf-2026-08-06]].

## Bugs

Không có bug production trong đợt này — session là viết spec + implement P0/P1/P2 cho
SB-15301. Những gì bị bắt đều do verifier, ghi ở Techniques.

## Techniques

**Feature không có PRD thì phải nói ra, đừng bịa nguồn.** SB-15301 (*Payment reminder —
due date & overdue*, chỉ cho **Wholesale plan**) **không có PRD nào của BA**: grep
`SB-15301` toàn repo = 0 kết quả, không nằm trong index `prd/README.md`. Nguồn duy nhất là
mockup + yêu cầu gốc của khách. Hệ quả thực tế: mọi hành vi không vẽ trong mockup (ví dụ
`resend`) là **suy diễn**, và phải hỏi user chứ không được viết vào spec như thể đã chốt.

Chốt được từ đối thoại: hai ô trong Card "Schedule" là **2 mốc gửi**, không phải vòng lặp —
gửi 1 lần khi overdue + 1 lần "send again after", rồi thôi. Cách đọc này khớp mockup hơn
cách hiểu ban đầu (lặp theo chu kỳ).

**Field trong mockup đã có sẵn trong data.** Dropdown đó chính là **Shopify payment terms**
trên order/draft order — app đã lưu sẵn, không cần thêm nguồn dữ liệu mới. Kiểm data mình
đang có trước khi thiết kế field mới.

**Verifier soi cả tham chiếu dòng trong tài liệu.** Vòng 1 trả **FAIL** vì đúng **1 lỗi
trên ~56 tham chiếu**: spec ghi `liquid.service.js:27` (dòng `export class LiquidService {`)
trong khi method `parse` thật ở dòng 28. Với spec nhiều trích dẫn code, off-by-one là lỗi
thật — người đọc nhảy tới đúng dòng đó và thấy sai thứ.

**Default lệch mockup mà không có comment cũng là FAIL.** Vòng verifier của P0 bắt 2 giá
trị default lệch mockup. Fix **không phải đổi giá trị** mà là thêm comment giải thích tại
sao lệch — giữ nguyên số, làm rõ chủ đích. Lệch có lý do là được; lệch im lặng thì lần sau
không ai biết là cố ý hay lỗi.

**"Gate đỏ là pre-existing" phải chứng minh, không nhận lời khai.** Agent implement báo gate
có lỗi nhưng khẳng định là lỗi sẵn có. Cách verifier chứng minh: đối chiếu danh sách file
fail với `git diff --name-only origin/...` — không giao nhau ⇒ đúng là pre-existing, không
phải hồi quy. Đã ghi bằng chứng (`npx jest` từ root hỏng sẵn) **vào BRIEF** để các iteration
đêm không tốn công điều tra lại. Cùng họ với ca worktree thiếu `.env.local` bên
[[digest-subscriptions-2026-08-06]] — khác kết luận, giống phương pháp.

**Kiểm toàn vẹn repo khi report của agent có dấu hiệu lạ.** Verifier trả PASS nhưng trong
report có dòng nhắc *"my accidental `rm` attempt"* (nó bị chặn Bash). Kiểm trước khi tin:
diff cho **167 dòng thêm, 0 dòng xoá**, không file nào mất ⇒ cảnh báo vô hại. Một dòng lạ
trong report của agent đáng một lệnh kiểm chứng, không đáng bỏ qua.

**Chạy song song bằng worktree khi vùng file không giao nhau.** P1 (`packages/assets`) và
P2 (`packages/functions`) chạy đồng thời, mỗi cái một worktree. P0 phải xong trước vì P1/P2
cần API + schema của nó.

**Cron `/looptasks` dựng trong session sống trong session.** Đã dựng `*/15 * * * *` để loop
tự nhặt task qua đêm — nó **không ghi ra đĩa**, tắt session là mất. Biết trước điều này rồi
mới rời máy.

**Lock của looptasks đọc theo thời gian, không theo trạng thái.** Iteration 18:34 không nhận
task mới vì task đang mang `[⏳ 18:17]` — 17 phút, dưới ngưỡng 30 phút ⇒ coi như đang chạy
thật. Muốn giữ task qua ngưỡng (đang chờ verifier lâu) thì phải **gia hạn lock** trong BRIEF.

## Context

- Deliverable spec: `product-team/marketing/product/prd/spec-payment-reminder-due-overdue.md`
  (344 dòng), nhánh `docs/SB-15301-payment-reminder-spec`, commit `af85e716a` — **chưa push**.
- P0 (API) đóng trên `feature/SB-15301-payment-reminder-api`, commit `52cf3f2f1`, 337 dòng
  thêm / 0 xoá, verifier PASS vòng 2 — **chưa push**.
- P2 sửa cấu trúc `Promise.all` của cron `handleOrderDaily` sẵn có và chọn chỉ quét shop đã
  có doc `paymentReminders` — hai điểm đã yêu cầu verifier soi kỹ vì đụng code cũ.
  *Chưa xác minh* kết quả verifier vòng đó (transcript dừng ở đây).
- Còn treo: cần Philip xác nhận *"Send again after"* là gửi 1 lần hay lặp.

## Liên quan

[[digest-pdf-2026-08-05]] · [[shipped-pdf-2026-08-06]] · [[digest-pdf-2026-08-03]] ·
[[2026-08-04-looptasks-verifier-doc-lap]] · [[feedback-plan-o-subagent-hoac-ghi-brief]] ·
[[pdf]]
