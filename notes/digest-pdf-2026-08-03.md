---
type: note
title: Digest PDF Invoice — 2026-08-03 (campaign unsubscribe + gửi 27.6k mail)
summary: CHỈ phần mới — dựng luồng unsubscribe HMAC không cần DB migration, chuỗi bẫy Firebase Hosting/emulator/koa-bodyparser, và kỷ luật vận hành khi gửi hàng loạt (resume qua progress file, batch ngắn vì tiến trình bị giết).
tags: [pdf, invoice, shopify, firebase, nodejs, avada]
created: 2026-08-03
source: project "pdf" — session history (2026-08-02 → 08-03)
---

# PDF Invoice — digest 2026-08-03

> Tiếp nối [[digest-pdf-2026-07-31]] (app đi nhờ SMTP của Chatty) — đây là phần
> **triển khai thật** chiến dịch email marketing đầu tiên.

## Feedback (cách làm việc)

- **Không bao giờ in secret ra message chat.** Ghi vào file `.env` (gitignored) rồi
  bảo user mở file copy. Secret đã lỡ nằm trong transcript coi như **đã lộ** → thay
  ngay, và thời điểm rẻ nhất là *trước* khi deploy/gửi.
- **Code phải theo pattern sẵn có của app**, không tự phát minh: 4 tầng
  route → controller → service → repository, response qua `ViewRes`. Lần này viết
  lệch 4 chỗ (logic nằm trong controller, route nhét chung file...) và phải refactor lại.
  Cùng bài học với [[feedback-follow-conventions]].
- **Kiểm chứng khuyến nghị thay vì khẳng định theo trí nhớ** — user hỏi "Google có
  thực sự khuyên vậy không?" trước khi cho đổi sang PubSub singleton.

## Decisions

- **Trang unsubscribe "ảo" nhưng có ghi nhận** (phương án 3): không chỉ hiện chữ.
  Why: trang chỉ hiện chữ mà không lưu gì thì lần gửi sau vẫn gửi lại cho người đã hủy.
  Phạm vi hẹp: **chỉ product news** → đúng **một field** `productNewsUnsubscribedAt`
  trên doc `shops`, không migration, không collection mới.
- **Token = HMAC-SHA256 trên `shopId`**, secret riêng `CAMPAIGN_UNSUBSCRIBE_SECRET`.
  - **Không dùng `SHOPIFY_SECRET`**: rotate nó sẽ giết toàn bộ link unsubscribe đã gửi.
  - **`SHOPIFY_ACCESS_TOKEN_KEY` tuyệt đối không phải secret** — giá trị của nó là
    chuỗi `avada-apps-access-token`, chỉ là *tên field* lưu access token.
- **Email giao dịch không cần nút unsubscribe; email marketing thì cần.** Codebase có
  3 luồng email nhưng đều transactional → việc "chưa có unsubscribe" không phải thiếu sót.
- **Một client Pub/Sub dùng chung** ở module scope (`helpers/pubsub/pubsubClient.js`,
  `publishJson`) cho cả 5 chỗ publish. Google khuyến nghị rõ tái dùng publisher client;
  constructor `PubSub` là lazy nên đưa lên module scope không gây I/O lúc import.
- **Sender name "Avada Order Printer"** dù app deploy thật tên "AG Order Printer" —
  giữ tên marketing (đã ghi ở [[digest-pdf-2026-07-31]]).

## Bugs (root cause)

- **`stream is not readable` khi bấm nút Unsubscribe (POST)**: lỗi kinh điển của
  `koa-bodyparser` trên Firebase Functions — runtime **đã đọc và parse body trước**,
  nên bodyparser gặp stream rỗng. Repo đã có tiền lệ ghi rõ trong
  `middleware/apiV1Validator.js`: *"handlers/apiV1.js does NOT mount koa-body, so
  ctx.request.body is always undefined"*.
- **Test local vào `localhost:3001` không ra trang**: rewrite `/unsubscribe` **chỉ tồn
  tại trong Firebase Hosting** → phải chạy hosting emulator (**port 5000**), không phải
  dev server frontend (3001) — mà dev server còn "cướp" luôn tham số `shop`.
- **Emulator chạy từ `lib/`** (bản babel compile), không phải `src/` → sửa `src` xong
  phải **build lại** mới thấy thay đổi.
- **`commands/lib/` bị eslint bỏ qua** vì trùng pattern ignore của thư mục build `lib`
  → đổi tên thư mục để file không lọt khỏi lint.
- **Crash `Cannot destructure property 'bannerHeading' of 'E'`** chỉ ở một store cụ thể:
  root cause nằm trong `@avada/app-widget-hook`
  (`dist/.../InlineBannerV2/InlineBannerV2.js:87-93`) — `appList` không có entry tương
  ứng cho store đó nên destructure trên `undefined`.

## Techniques

- **GitLab CI không khai từng biến functions**, nó đổ nguyên blob:
  `echo "$PROD_FUNCTIONS_ENV" > packages/functions/.env` → thêm biến mới **không cần
  sửa `.gitlab-ci.yml`**, chỉ cần thêm vào CI variable.
- **Chỉ Cloud Functions cần `CAMPAIGN_UNSUBSCRIBE_SECRET`** (để verify token đến);
  `CAMPAIGN_PUBLIC_URL` chỉ máy chạy script gửi đọc. Phân biệt "biến của runtime" vs
  "biến của script" trước khi bắt user set khắp nơi.
- **Test end-to-end trên staging thay vì prod**: store dev đã có sẵn trong
  `avada-staging` (cũng là project mặc định) → không phải chạm production.
- **Script gửi hàng loạt phải có progress file + resume**: `Already: N sent in a
  previous run` — đọc progress, bỏ qua người đã nhận, và **bỏ qua người vừa unsubscribe
  giữa chừng**. Script test và script bulk **dùng chung module gửi** để hai đường không lệch.
- **Không chạy 2 batch song song** — hai tiến trình cùng lúc sẽ gửi trùng.
- **Môi trường giết tiến trình nền dài** — batch 5.000 bị cắt giữa chừng nhiều lần,
  batch **1.000** thì chạy trọn. Chốt: chia nhỏ + vòng lặp "xong một batch thì chạy
  batch kế", dựa vào resume để không mất mát. Tốc độ thực tế **thấp hơn nhiều** con số
  script in ra (rate 8/s chỉ là ceiling).
- **Export danh sách người nhận phải tái dùng đúng hàm phân loại plan của app**
  (`config/getPlans.js`) — lọc dần 29.302 → 27.693 → **27.626** merchant, xuất kèm
  `recipients.excluded.csv` có cột `reason` để soi lại (`plus_partner_sandbox`,
  `fraudulent`, plan chết...).
- **Lộ origin hosting trong link không phải rủi ro bảo mật mới** — origin đó đã công
  khai từ trước; nhưng vẫn nên đổi sang domain thương hiệu (`pdfinvoice.apps.avada.io`)
  vì lý do hình ảnh.

## Liên kết

[[pdf]] · [[digest-pdf-2026-07-31]] · [[shipped-pdf-2026-08-01]] ·
[[digest-pdf-2026-07-21]] · [[controller-service-repository]] · [[firestore-multitenant]] ·
[[feedback-follow-conventions]] · [[feedback-commit-style]]
