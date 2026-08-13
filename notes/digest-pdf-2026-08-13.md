---
type: note
title: Digest PDF Invoice 2026-08-13 — CSS global giấu DropZone, sender hardcode ở FE, verify tốn giờ
summary: Root cause "không thấy ô upload logo" là một rule CSS global chứ không phải default logo (giả thuyết cũ đã được verifier PASS nhầm); sender email sai vì FE hardcode chuỗi mặc định; chi phí verify tăng tuyến tính theo số bug.
tags: [pdf, invoice, avada, debug, skills, js]
created: 2026-08-13
updated: 2026-08-13
source: project "pdf" — session history (a2d7c194)
---

# Digest PDF Invoice — 2026-08-13

CHỈ phần mới của ngày chạy `/looptasks` trên `feature/payment-reminder`
(SB-15496 / SB-15545 / SB-15554 / SB-15563). Nền: [[pdf]] ·
[[digest-pdf-2026-08-12]] · [[digest-pdf-2026-08-11]].

## Bugs

**SB-15496 — ô upload logo không hiện: root cause thật là một rule CSS global.**
`packages/assets/src/styles/_template.scss` có rule global đè lên khung
`DropZone`. Giả thuyết ban đầu — `LogoSection.js` chỉ render `DropZone.FileUpload`
khi `logoImage` rỗng, mà mặc định là `DEFAULT_LOGO` — nghe rất hợp lý, **và đã
được một verifier trả `PASS`**. Nó vẫn sai. Thứ lật lại kết luận là **ảnh mockup
thật** (logo nằm TRONG khung dashed, tức khung phải luôn hiện). Bài học: verifier
xác nhận được *chuỗi giá trị trong code*, nhưng không chứng minh được *đó có phải
nguyên nhân của triệu chứng người dùng thấy hay không* — muốn thế phải quan sát
đường render thật. Cùng họ với [[bang-chung-phan-biet-duoc]].

**SB-15554 — custom sender email không hiện: chỉ sai ở UI.**
`GeneralSection.js:16` hardcode `const DEFAULT_SENDER = 'AVADA PDF Invoice
<noreply@avada.io>'` rồi đổ thẳng ra ô hiển thị. Cách sửa đúng **không phải** nhân
bản logic custom-vs-default ở FE, mà để BE trả sẵn `senderFrom` bằng **chính** hàm
`getSenderFrom(shop, emailNotifications)` app đang dùng khi gửi mail — một nguồn
sự thật, không hai.

**SB-15563 — nút "View invoice online" dẫn ra google.com.**
`buildReminderEmailHtml.js:55`: `const ctaHref = t.buttonUrl || invoiceLink || '#'`.
`buttonUrl` là field **cố ý** (có input thật ở `ButtonSection.js`, helpText ghi rõ
"để trống thì dùng link hoá đơn"), nhưng app nhận **bất kỳ chuỗi nào** không
validate. QA gõ `123###` → Gmail resolve href tương đối → ra ngoài. Kết luận cuối:
đóng không sửa → [[2026-08-13-khong-validate-button-url-pdf]].

## Techniques

- **Cấm `expect.any(String)` trong test assert nội dung.** Agent định dùng nó cho
  `senderFrom`; assert kiểu đó thì test mất hẳn khả năng bắt lỗi. Bắt mock
  repository rồi assert **đúng chuỗi** mong đợi.
- **Key i18n phải thêm vào cả `en.json` và `origin.json`** — verifier `FAIL` đúng
  chỗ này, và vòng sửa còn tự quét lại **18 key** đã đụng trong phiên, kiểm từng cái
  bằng cách gọi thật thay vì đọc mắt.
- **Verifier bắt được 2 lỗi thật ở vòng 1** (thiếu key locale; gate ghi sai
  baseline) trên 3 task — nên không bỏ verifier cho thay đổi rủi ro cao, chỉ đổi
  cách chạy → [[2026-08-13-tach-gate-khoi-cham-tung-bug]].
- **Lấy nội dung ticket dạng ảnh/video:** mô tả chỉ là link `capture.avada.io` (SPA,
  ảnh nạp bằng JS) → WebFetch chỉ thấy vỏ trang; URL ảnh thật nằm trong `og:image`
  (CloudFront). Video ScreenPal cần phiên đăng nhập, CloudFront trả 403; lấy được
  thumbnail thì dùng `ffmpeg` (`brew install ffmpeg`) để xem khung hình.
- **Đóng task điều tra không có commit** vẫn phải ghi trọn root cause + `file:line`
  vào `BRIEF.md` — brain-sync 20:00 commit hộ.

## Context

- **Chi phí verify tăng tuyến tính theo số bug** trong khi phần đắt nhất là gate
  (build + jest), vốn tốn **như nhau** bất kể sửa mấy bug: một lượt verifier ~13–16
  phút, hôm đó chạy 6 lượt. Đây là lỗi điều phối của tôi, không phải verifier chậm.
  → [[2026-08-13-tach-gate-khoi-cham-tung-bug]], bổ sung cho
  [[2026-08-07-phan-tang-verifier]].
- Lock `[⏳ HH:MM]` của `/looptasks` giữ 3 task suốt ~80 phút, dưới ngưỡng 90 —
  ngưỡng này đủ rộng cho một vòng verifier thật, đừng rút.
- 3 commit tách bạch theo vùng file (`5ef1dcd`, `9bb31de`, `28dfc99`) đã push lên
  `feature/payment-reminder`, **chưa tạo MR** (MR luôn hỏi trước).
- Lỗi 502 khi Send test ở local **không phải lỗi SMTP** — stack chỉ vào
  `nodemailer/lib/fetch`, tức nodemailer đang đi *tải một URL*: đúng vết
  attachment dạng `href` phụ thuộc `APP_BASE_URL` đã ghi ở [[digest-pdf-2026-08-11]].

→ [[shipped-pdf-2026-08-13]] · [[shipped-pdf-2026-08-11]] ·
[[2026-08-04-looptasks-verifier-doc-lap]] · [[2026-08-07-phan-tang-verifier]]
