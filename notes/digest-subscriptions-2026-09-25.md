---
type: note
title: Digest subscriptions — 2026-09-25 ("billing failed" không phải "kẹt", và bốn thứ chồng nhau làm `yarn dev` rơi khỏi cloudflare)
summary: Ba session: một cái gọi sai tên hiện tượng (doc `UNBILLED + processed:true + errorCode` là dunning bình thường chứ không phải cycle kẹt) nên suýt flip cờ `processed` sai bản chất; một cái mất nửa ngày vì `yarn dev` chạy localhost thay vì tunnel do BỐN nguyên nhân chồng lên nhau, mỗi cái che một cái; và điều kiện tiên quyết của SB-17176 không nằm trong code mà nằm ở cấu hình store (Admin API không có mutation bật Local delivery).
tags: [subscription, shopify, avada, billing, backend, firestore, debug, gotcha, tooling]
created: 2026-09-25
updated: 2026-09-25
source: project `subscriptions` — session history (session `f4a437fd` metafield `{}`, `bd7ec1a3` SB-17176 + môi trường dev, `b4c6162b` bulk next-order-date bnagdp-cx)
---

# Digest — Joy Subscription, 2026-09-25

Bối cảnh liền trước: [[digest-subscriptions-2026-09-24]] · [[shipped-subscriptions-2026-09-25]].

## Bugs

### 1. Gọi sai tên hiện tượng suýt làm hỏng 127 contract (shop `bnagdp-cx`)

Merchant xin: **toàn bộ 127 sub charge ngày 24/12/2026 13:00 EST**. Auto-triage trong thread — và
tôi ở lượt đầu — mô tả các cycle không charge là **"kẹt"**, và đề xuất `processed: false` để cron
nhặt lại. dantt bác hai lần liên tiếp, cả hai đều đúng:

> "set processed là false thì cron sẽ charge luôn các order đấy đó? ko ổn nhé?"
> "ủa có phải kẹt đâu nhỉ? nó billing failed mà?"

Raw doc nói rõ, và nó không phải "kẹt":

```json
"status": "UNBILLED", "processed": true, "errorCode": "CARD_NUMBER_INCORRECT"
```

Đó là **dunning chạy đúng thiết kế**: cycle đã thử charge, thẻ hỏng, `processed: true` đánh dấu
"đã xử lý xong kỳ này" rồi đi tiếp. Gọi nó là "kẹt" dẫn thẳng tới một hành động sai bản chất.
Đính chính thứ hai: flip `processed` **cũng không** làm cron charge ngay như dantt lo — query charge
ở `orderRepository.js` có **cận dưới**, không chỉ cận trên — nhưng "không gây hại" không làm cho
việc đó đúng. Cùng họ [[bang-chung-phan-biet-duoc]]: phải đọc raw doc mới phân biệt được hai giả
thuyết, đọc tên trạng thái thì không.

Thực tế sau khi đo lại (không dùng bucket "doc unbilled sớm nhất" — trong đó có cả doc chết — mà
dùng "**lần charge sống tiếp theo**": `UNBILLED + ready + processed=false + không skipped`):
92 contract đúng ngày sai giờ, 35 sai ngày.

Kết quả chạy: **124/127**. Ghi chú vận hành đáng giữ:

| Hiện tượng | Ghi chú |
|---|---|
| Terminal timeout 2 phút, mới xong 15/127 | Script **idempotent** nên chạy lại từ đầu vô hại; chuyển sang chạy nền |
| 10 contract trượt | Đúng 10 cái lỗi **rate limit Shopify** — thêm delay rồi chạy lại nhóm đó |
| ~8–11 s/contract | Cỡ 17 phút cho 127 cái, phải tính trước thay vì gõ rồi chờ |
| Watcher bắt chữ `Error` | **Fire sớm** trong khi process vẫn chạy — điều kiện dừng của watcher phải là `APPLIED:` hoặc process chết, không phải một từ khoá xuất hiện trong log |

Lệnh `--apply` bị classifier chặn (ghi thật lên prod). Không lách — dantt chạy bằng prefix `!`.

### 2. SB-17176 — điều kiện tiên quyết nằm ở cấu hình store, không ở code (MR !2639)

Tạo subscription tay trong app không giữ được `deliveryMethod` Local delivery / Pickup. Ngoài phần
code (tách IIFE `contractDeliveryMethod` thành helper thuần dùng chung BE + `Create.js`, validator
bắt buộc phone khi chọn Local delivery ở cả BE `case 'address'` lẫn 2 bề mặt FE), phần tốn thời gian
nhất là **test không chạy được vì store dev chưa cấu hình**:

- Gate ẩn option: `.filter(x => x.value !== DELIVERY_PICKUP || locationActive.length …)` — cả 4
  location đều `localPickupSettingsV2 = null` nên Pickup bị ẩn **đúng**, không phải bug.
- **Admin API 2026-07 không có mutation bật local delivery** — `locationLocalDeliveryEnable` không
  tồn tại. Tra schema trước khi hứa "để tôi setup hộ"; việc này buộc phải làm tay trong admin.
- Shopify chỉ trả `availableLocalDeliveryRates` khi location có **street/city/zip** thật; địa chỉ chỉ
  có mỗi `US` thì rate luôn rỗng. Và zone báo *"Postal codes required to activate this delivery zone"*
  cho tới khi mã được chốt trong ô nhập.
- Contract `33705689206` dantt đưa để test **không phải bản test của MR** (tạo từ 4 ngày trước,
  `deliveryMethod.type = pickup` ở cả Shopify lẫn Firestore) — kiểm nguồn gốc dữ liệu test trước khi
  kết luận tính năng hỏng.

Một đính chính đã đưa ra trong session: luồng **edit** thực ra đã được MR gốc fix rồi, lượt trước
tôi nói sai.

**Bẫy script dịch:** `translate` ghi `en.json` ở **dòng 183** nhưng prompt xác nhận dịch ở **dòng
194** — trả lời `n` vẫn merge key mới vào `en.json` mà không gọi Google Translate, nên `en.json` và
`origin.json` lệch nhau và lượt sau script báo "0 words" (nó so `en` với `origin` để tìm chuỗi mới).

### 3. Metafield plan còn `{}` — store thứ hai (`npsvyn-5h`)

Root cause đã ghi ở [[digest-subscriptions-2026-09-24]]; phần mới của lần này:

- Cùng mốc `2026-09-23T14:22:47Z` có **3 product bị đụng cùng lúc**: 1 được ghi đầy, 2 bị xoá rỗng.
  Đó là bằng chứng payload webhook `selling_plan_group/update` về thiếu, không phải theme, không
  phải đoạn Custom Liquid mà auto-triage đổ lỗi.
- Vì sao chỉ một store báo, trong khi code path dùng chung cho mọi shop: **triệu chứng im lặng**
  (widget mất không báo lỗi) + điều kiện trigger hẹp + merchant save lại plan là **tự lành**. Không
  có store nào "không dính", chỉ có store không nhận ra.

## Techniques

### `yarn dev` rơi khỏi cloudflare tunnel — bốn nguyên nhân chồng lên nhau

Triệu chứng: `app_home │ Using URL: https://localhost:3001/embed/` thay vì URL trycloudflare, rồi
`Invalid path /embed/…`, rồi 500. dantt hỏi đúng 5 lần "bình thường vẫn chạy mà?" — và đúng: **không
phải branch, không phải CLI**. Gỡ đủ bốn tầng mới chạy:

| # | Nguyên nhân | Dấu hiệu |
|---|---|---|
| 1 | `.claude/worktrees/` chứa **6 bản sao** `shopify.web.toml` | CLI glob toàn cây, thấy N bản cấu hình — đúng [[worktree-trong-repo-lam-hong-tooling]] |
| 2 | Một session ngày **11/09 10:55** thêm dòng `web_directories` vào **cả 4 file toml** | Đọc thẳng source CLI 3.94.3: có `web_directories` thì nó bỏ đường tunnel |
| 3 | `static/assets` và `lib` là **build cũ** | Chạy được rồi vẫn test nhầm code cũ |
| 4 | `yarn dev --tunnel-url=…:5002` làm CLI **tự chiếm cổng 5002** | `emudev` báo `Could not start Hosting Emulator, port taken` |

Hai điều đáng giữ về cách chẩn đoán:

- **Giả thuyết IPv4/IPv6 tự bị bác.** `vite` LISTEN `[::1]:3002`, firebase `127.0.0.1` — nghe rất
  hợp lý, nhưng Node có Happy Eyeballs (`autoSelectFamily = true`) và test trực tiếp gọi được
  `localhost:5002` → 200. Rút lại ngay thay vì xây tiếp lên nó.
- **Thí nghiệm có đối chứng mới chốt được:** cùng một lệnh vite, cùng config, chỉ khác một biến môi
  trường → `BACKEND_PORT` không đặt cho `/embed/` = 200, `BACKEND_PORT=62962` = 500. Đó là biến CLI
  bơm vào, không phải thứ đọc được từ file nào.

### Chạy service của app mà không cần deploy

Pattern sẵn có trong repo (`backfillContractDeliveryPrice.js:22-31`): init `firebase-admin` bằng
`serviceAccount.prod.json` rồi gọi thẳng service. Muốn dùng thì phải **export hàm xử lý từng
contract** ra khỏi bulk handler để không đụng pubsub/timeout của handler đó. Lưu ý
`serviceAccount.development.json` nằm trong `packages/functions/`, không phải root — `ls` bị cắt ở
40 dòng đầu từng làm tôi báo "không có file" nhầm.

## Context

- MR !2639 (`agent/SB-17176`, 4 commit) — đây là MR do agent support mở, phiên này review + dọn +
  bổ sung, đúng khuôn [[feedback-chi-tao-mr-user-merge]].
- Tin nhắn trả thread Slack phải viết lại **bỏ tính chất kỹ thuật** — lượt đầu tôi viết bản đầy đủ
  root cause, dantt yêu cầu rút gọn. Xem [[feedback-mac-dinh-tra-loi-ngan]].

Liên quan: [[subscriptions]] · [[shipped-subscriptions-2026-09-25]] · [[digest-subscriptions-2026-09-24]] ·
[[digest-subscriptions-wholefoods-font-2026-09-25]] · [[worktree-trong-repo-lam-hong-tooling]] ·
[[bang-chung-phan-biet-duoc]] · [[cham-viec-agent-nen]] · [[feedback-chi-tao-mr-user-merge]] ·
[[feedback-debug-phai-query-data-that]] · [[shopify-app-dev]]
