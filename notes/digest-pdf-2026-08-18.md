---
type: note
title: Digest pdf 2026-08-18 — dọn secret hardcode, probe xem key còn sống, và xếp hạng sai vì tưởng key nào cũng là secret
summary: Scanner báo 3 secret nhưng có nhiều hơn thế (client_secret, SendGrid key, cả một khoá mã hoá scanner bỏ sót ở `config/crypto.js`); probe read-only cho thấy KHÔNG cái nào bị revoke; và cái key `AIza…` trong RELEASE_NOTE hoá ra là Firebase/Picker API key in thẳng ra browser nên rotate gần như vô nghĩa — thứ phải làm là restrict key.
tags: [avada, pdf, invoice, auth, firebase, debug]
created: 2026-08-18
updated: 2026-08-18
source: project "pdf" — session history 2026-08-17/18 (cleanup hardcoded secrets)
---

# Digest — PDF Invoice (2026-08-18)

> Phần khái quát hoá (secret vs định danh công khai, thứ tự rotate) tách ra
> [[api-key-cong-khai-khong-phai-secret]]. Đây là phần thuộc riêng repo pdf.

## Bugs / phát hiện

**Scanner báo thiếu.** Báo cáo có 3 finding (gcp-api-key ×2, shopify-access-token).
Đọc thật 4 file thì còn `client_secret` và SendGrid key. Sau đó grep theo *công dụng* còn
lôi ra một secret nữa scanner **bỏ sót hoàn toàn**: `packages/functions/src/config/crypto.js:2`
— và cái này là **khoá mã hoá**, khác hẳn về hệ quả so với API key. Cùng bài học với
[[digest-pdf-2026-07-31]]: grep theo công dụng, không theo tên biến mình đoán.

**Không cái nào bị revoke.** Probe read-only từng credential (không in giá trị ra chat):
tất cả còn sống. Đó là dữ kiện quyết định mức khẩn — "đã xoá khỏi code" nói lên rất ít.

**Tôi kết luận SendGrid quá sớm.** Lần đầu nói "sống, gửi mail được" chỉ dựa trên một
tín hiệu gián tiếp. Key trả `2fa_required` với v3 API → **không** dùng được đường đó;
đường thật của nó là SMTP (`user: apikey`), mà SMTP bị chặn từ máy này nên **không verify
được**. Ghi "không verify được" thay vì đoán.

**Cái key ở `RELEASE_NOTE.md` là Google Picker / Firebase API key**, phục vụ tính năng
Google Drive delivery, và nó **được in thẳng ra browser** — cùng một giá trị nằm ở 3 chỗ:
`SHOPIFY_FIREBASE_API_KEY`, `GOOGLE_DEVELOPER_KEY`, và bundle FE do CI build. Vì vậy tôi
xếp hạng sai ở mấy lượt trước khi coi nó ngang hàng với token thật.

## Techniques

**Truy ngược key về đúng project trước khi bảo người khác đi revoke.** Từ giá trị key →
project number → map sang project id, để câu trả lời là "vào project X mà tắt", không phải
"đi regenerate đi".

**Thứ tự đổi key là không đảo được.** Firebase Functions chỉ nạp env **lúc deploy**, nên
phải: đổi giá trị ở cả `PROD_FIREBASE_*` (CI, cho bundle FE) lẫn env của Functions →
redeploy → verify → *rồi mới* xoá key cũ. Bấm xoá trước là gãy login của toàn bộ merchant.

**Bằng chứng "không thấy key cũ trên bundle prod" là bằng chứng yếu.** Tôi chỉ grep được
trang gốc + 3 file JS đầu; không phủ hết bundle. Nói rõ giới hạn đó thay vì để nó thành
căn cứ cho một thao tác không lùi được — cùng họ [[bang-chung-phan-biet-duoc]].

**Xoá key cũ không mất data.** API key là định danh để Google biết request thuộc project
nào (quota/billing), không phải khoá mã hoá. Nhưng trong repo *có* một biến dễ nhầm với nó
(`config/crypto.js`) mà đổi thì mất thật — phải phân biệt rõ khi trả lời.

Bối cảnh: [[pdf]] · [[feedback-xoa-secret-khoi-code-chua-phai-vo-hieu-hoa]]
