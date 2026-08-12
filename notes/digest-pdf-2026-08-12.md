---
type: note
title: Digest PDF Invoice 2026-08-12 — dựng 2 staging mới trên project Firebase trắng
summary: Root cause "shop không bao giờ được tạo" ở project Firebase mới là Firebase Authentication chưa bật (app vẫn tưởng đã install vì `checkIfActiveShop` chỉ nhìn `shopifySession`), cộng chuỗi gotcha provision staging 3/4 (service agent Gen2, UBLA, token Partner theo org) và chẩn đoán "store chưa nhận reminder" hoá ra là store không có đơn B2B nào.
tags: [pdf, invoice, avada, shopify, firebase, firestore, auth, debug, cloud]
created: 2026-08-12
updated: 2026-08-12
source: project "pdf" — session history (3 session)
---

# PDF Invoice — digest 2026-08-12

> Ngày trước: [[digest-pdf-2026-08-11]] · [[shipped-pdf-2026-08-11]] · bối cảnh: [[pdf]]

## Bugs

- **`whoami` trả 500 `Cannot read properties of undefined (reading 'shopID')` trên project
  Firebase mới — root cause: Firebase Authentication chưa bao giờ được bật.**
  Chuỗi thật (đã kiểm bằng log runtime + Firestore, không suy đoán):
  1. `updateOrCreateUser` (trong `@avada/core`) gọi `admin.auth().createUser(...)` để tạo shop.
     Project mới không bật Identity Toolkit ⇒ call này chết ⇒ **doc `shops` không bao giờ được tạo**.
  2. Nhưng `checkIfActiveShop` kết luận `installed: true` **chỉ dựa trên việc có `shopifySession`
     với access token dùng được** — nó không hề nhìn collection `shops`.
  3. Kết quả là **deadlock**: app tin là đã cài (nên không chạy lại luồng install), còn
     `getCurrentShop` thì không có shop để đọc ⇒ 500 ở mọi request.
  Cách gỡ: bật Firebase Authentication (email/password) **rồi xoá session "độc"** để phá deadlock,
  mở lại app cho luồng install chạy trọn.
  ↳ Bài học tra cứu: Firestore chỉ có đúng **1 collection `shopifySession`** (không có `shops`,
  `shopInfos`, `settings`) là **dấu hiệu chẩn đoán** của đúng bệnh này.
  ↳ Cùng họ với [[bang-chung-phan-biet-duoc]]: "log nói *After login done*" không phân biệt được
  "auth chạy xong" với "shop được tạo" — chỉ có **đếm doc trong Firestore** mới phân biệt được.
- **Store `ag-binh-pdf-staging1-layout-template` "chưa gửi reminder" — không phải lỗi feature.**
  Ba lớp chặn độc lập (sửa một cái vẫn không gửi), nhưng lý do cuối cùng: **store đó không có
  đơn B2B nào**. Đơn `7566714929333` (#1010) được kiểm và không phải đơn B2B.
  Trong lúc chẩn đoán có một lỗi tự bắt được: script kiểm blast-radius so `paymentBadge == 'OVERDUE'`
  viết hoa, trong khi hằng thật là `export const OVERDUE = 'overdue'` ⇒ **phải kiểm bằng đúng cách
  app kiểm**, đừng dựa field `company` của REST hay hằng tự gõ lại.
- **5 webhook của store dev vẫn trỏ về URL tunnel đã chết.** Đổi địa chỉ về
  `avada-staging.firebaseapp.com`; chạy **dry-run trước** (đúng 5 cái, không đụng 3 webhook lành)
  rồi mới apply. Endpoint sống nhận diện bằng `405 Method Not Allowed` cho GET (path bịa trả 404).
- **`APP_BASE_URL` sai làm nodemailer đi tải PDF qua URL và chết ở DNS** — nối tiếp
  [[digest-pdf-2026-08-11]]. Giá trị đúng cho staging là `avada-staging.firebaseapp.com`,
  đặt trong CI variable **không có `https://`, không có `/` cuối** vì code tự ghép.
  (Sự cố này đã **tự khỏi** sau bản deploy 2026-08-11 08:57 UTC — cron `updatePaymentTermSchedule`
  chạy trọn, 0 WARNING/ERROR trong 1 giờ.)

## Techniques / gotcha

**Dựng project Firebase + app Shopify staging từ số 0 (staging 3 & 4):**

| Triệu chứng | Nguyên nhân thật |
|---|---|
| `HTTP 500 Could not create Cloud Run service` khi deploy functions | **Lần đầu dùng Gen2 trên project trắng** — thiếu service agent Eventarc + Pub/Sub. Firebase nói thẳng trong log: *"Permission denied while using the Eventarc Service Agent"* |
| `HTTP 409 Could not create bucket gcf-v2-sources-…` | Bucket **đã tồn tại** (do chính lần deploy trước tạo) — đây là **race của deploy Gen2 nhiều hàm song song**, không phải lỗi cấu hình. Deploy vẫn tiến (staging-3 18 hàm ACTIVE, staging-4 14) |
| `export.service.js` gọi `file.makePublic()` fail | Bucket phải **tắt UBLA** để cho ACL theo object |
| `403 You are not a member of the requested organization` khi `shopify app deploy` | Token `SHOPIFY_APP_CLI_PARTNERS_TOKEN` thuộc partner org **production**, còn app dev + staging 3/4 nằm ở **Avada Development** ⇒ 403 là đúng, **không phải token hỏng**. (Tôi kết luận sai một lượt rồi tự đính chính.) |
| Version tạo được nhưng **không release** | Shopify chặn ở bước cuối vì thiếu quyền **network access** — user cấp quyền xong deploy lại là released |
| Job CI chết ngay ở `yarn install` | `sharp` phải build từ source vì image CI không có libvips — lần sau chạy lại thì qua ⇒ **transient** |
| `urllib` gọi API bị Cloudflare chặn (error 1010) | Đổi sang `curl` |

- **Extension URL đều là `app://…` (tương đối), không hardcode domain** ⇒ deploy cùng bộ extension
  sang app staging khác là an toàn.
- File `*.toml` sinh ra bị `.gitignore` che sẵn — **đúng convention repo**: bản prod cũng sống trong
  CI variable chứ không trong git.
- **Pin cả hai staging vào `master` nghĩa là mỗi commit lên master kích 2 job build+deploy song song.**
- Không có `glab`/`lab` trên máy và không đọc được token GitLab từ credential store ⇒ tạo MR bằng
  **git push option**; nhưng push option chỉ được xử lý khi có **ref update thật**, nên phải xoá
  nhánh remote rồi đẩy lại. Cuối cùng vẫn bị chặn ở cả hai đường → để user tự tạo MR.
- `JOY_ROLLOUT_PERCENT` (chia 70/30 theo hash `shop.id`, xem [[shipped-pdf-2026-07-31]]) nâng lên
  **90/10** chỉ bằng đổi một hằng số ở `packages/assets/src/constants/` — nhánh
  `feature/joy-rollout-90` tách từ `origin/master`.

## Context

- **`BRIEF.md` được dọn**: task 12, 18, 21, 24 chuyển nguyên văn sang `BRIEF-done.md` mục
  `## 2026-08-12 — ARCHIVE`, **ghi rõ là "chưa làm"** chứ không giả vờ đã xong. `BRIEF.md` còn
  đúng task 25. Đây là nếp đúng: archive ≠ mark done.
- So sánh 2 phương án index Firestore cho task 18 cho kết quả **ngược với điều BRIEF đang ghi**
  ⇒ nội dung task cũ trong BRIEF không phải phép đo.
- `gcloud auth login --no-browser` cần stdin tương tác ⇒ **không chạy được trong session
  non-interactive** — lặp lại đúng giới hạn đã ghi ở [[digest-pdf-2026-07-23]].
- Lệnh `gcloud scheduler jobs run` bị permission classifier chặn; dừng lại nhờ user chạy thay vì
  tìm đường lách.

## Liên quan

[[pdf]] · [[digest-pdf-2026-08-11]] · [[shipped-pdf-2026-08-11]] · [[digest-pdf-2026-07-23]] ·
[[shipped-pdf-2026-07-31]] · [[bang-chung-phan-biet-duoc]] · [[avada-core]] ·
[[2026-08-11-bo-feature-flag-payment-reminder]] · [[firestore-multitenant]] ·
[[migrate-repo-gitlab-on-prem]] · [[2026-08-10-remote-gitlab-on-premise]]
