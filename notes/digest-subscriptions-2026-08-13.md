---
type: note
title: Digest Joy Subscription 2026-08-13 — hoán giá theo index, mirror lệch Shopify, spike cost
summary: Bug lệch index khi bulk-swap làm 19/26.338 contract ACTIVE thu sai tiền thật; mirror Firestore lệch Shopify nên audit đọc sai; spike cost $3→$4 là burst traffic 1 ngày, tăng maxInstances chỉ làm đắt thêm.
tags: [subscription, shopify, billing, firestore, bigquery, cost, cloud, debug]
created: 2026-08-13
updated: 2026-08-13
source: project "subscriptions" — session history (9ea1a907, 4475ef75, f4a75361)
---

# Digest Joy Subscription — 2026-08-13

CHỈ phần mới. Nền: [[subscriptions]] · [[subscriptions-debug-runbook]] ·
[[functions-cost-audit-2026-08-11]].

## Bugs

**Hoán giá giữa các line vì lấy `lineItems` theo index.**
`contractBulkActionService.js:74` lấy `contract.lineItems[idx]` trong khi mảng
`products[]` được **nhóm theo product** (thứ tự cố ý, có 2 commit tạo ra nó) → khi
hai mảng lệch nhau, `bulkSwapProduct` gửi `variantId` MỚI kèm `price` lấy từ line
CŨ. Hình dạng kinh điển: variant đúng, giá của line khác. Ví dụ thật: Salmon 70g
mang `basePrice = 40` (giá của gói 24×70g), khách bị thu 6 × 38 thay vì 6 × 1.71.

Quy mô sau khi quét toàn hệ thống: **26.338 contract ACTIVE → 268 lệch index → 19
hỏng giá thật**; PAUSED 12.144 → 90 lệch → thêm vài ca. CANCELLED (38.334) bỏ qua
vì không bao giờ charge nữa. Hỏng **theo cụm shop**, không extrapolate được từ mẫu.

**Deploy không tự chữa dữ liệu đã hỏng.** `findContractsNeedPriceUpdate` so
`shopifyPrice !== Number(p.variant.price)` — `variant.price` vẫn ĐÚNG, chỉ
`pricingPolicy.basePrice` trên contract mới sai. Nên contract hỏng không bao giờ
lọt vào job sync; phải chạy script sửa dữ liệu riêng.

**Vì sao sai `pricingPolicy` = thu sai tiền thật:** `createBillingAttempt` không
truyền giá, chỉ `contractId` + `idempotencyKey` + `billingCycleSelector`. Shopify
tự tính tiền từ `pricingPolicy` của contract. App có bước sync trước khi charge và
phân biệt hai cycle index (app vs Shopify), nhưng không chỗ nào chặn giá sai.

**Mirror Firestore lệch Shopify.** Audit `deliveryPrice` đọc doc Firestore ra kết
luận sai — có contract Shopify = 10 mà Firestore vẫn `0.0`, và ngược lại. Khi user
nói "tôi thấy vẫn là 10 CHF mà nhỉ?" thì đúng, còn script sai. **Với phí ship, chỉ
bản live từ Shopify mới là nguồn sự thật; Firestore là bản hiển thị.**

**Free shipping đơn đầu không bao giờ hết.** `shippingProfile.recurringOption =
'lowest'` chỉ tính lại rate khi items/address đổi (`updateOnItemsChange`), nên gói
khuyến mãi *"Première livraison offerte"* (0đ) dính vĩnh viễn ở mọi kỳ. UI hứa với
merchant **"Always use lowest shipping rate — apply the lowest available rate"** →
mismatch giữa lời hứa của UI và hành vi code, nên đây **là bug**, không phải cấu
hình. (Ghi thành task #32.)

**Orders tab chỉ hiện 1 upcoming order/contract.** Stored procedure BigQuery
`get_upcoming_orders` có `ROW_NUMBER() OVER (PARTITION BY subscription_contract_id
...)` → kookut có 829 đơn UNBILLED tương lai nhưng tab chỉ hiện **83**, ẩn 746.

**"PayPal luôn failed" là cảm giác sai.** Số thật: PayPal fail **27,6%**, phần còn
lại **42,6%**. Bẫy khi phân loại: `customerPaymentMethod.type` **luôn** là
`"CustomerPaymentMethod"` với mọi contract (vô dụng) — thứ phân biệt PayPal là có
field `paypalAccountEmail`.

## Techniques

**Heuristic "hỏng dữ liệu" phải phân biệt được hỏng với hợp lệ-nhưng-khác.**
Detector v1 ("`basePrice` ≠ giá catalog") báo 83 contract hỏng, phần lớn là
**subscription discount hợp lệ** (28.792 vs 35.99). Detector v2 chỉ tính là hỏng
khi có **line khác trong cùng contract đang mang đúng con số đó** — tức chứng minh
được cặp hoán. 83 → 19. Cùng nguyên tắc với [[bang-chung-phan-biet-duoc]].

**Script sửa dữ liệu tiền bạc:** dry-run mặc định, chỉ ghi khi `--apply`; tái dùng
`processLine…` của app thay vì tự gọi API (logic discount tier nằm trong đó);
`--allow-increase` mở cho **mọi** dòng thu thiếu của contract chứ không riêng dòng
mình muốn → phải kiểm trước khi bật. Hàm ghi **nuốt lỗi**, nên bắt buộc đọc lại dữ
liệu sau apply chứ không tin log.

**Quét Firestore quy mô lớn:** `.limit(200000).get()` → OOM-kill; phân trang 2000
doc/lần, và kiểm ngược trên một shop đã biết số (kookut ra đúng 83/15/3) trước khi
chạy full.

**Lọc store test nội bộ trước khi xếp ưu tiên.** Danh sách "thiệt hại theo số tiền"
lẫn `joy-sub-prod6` — sắp xếp theo tiền mà quên lọc dev store thì ưu tiên sai.

**Chạy script prod:** phải `export` env vào shell (không chỉ có file trên đĩa) và
`ACCESS_TOKEN_KEY_PROD` nằm ở `.env.local` — thiếu nó thì token giải mã sai và
Shopify trả 401 ở bước cuối.

**Đọc thread Slack tận gốc.** Phân tích dựng trên mô tả ticket do agent đọc lại đã
suýt dẫn tới một "quyết định thương mại" không cần thiết; đọc thread gốc gỡ luôn nó.
Helper gửi JSON cho `conversations.replies` không chạy — method này cần form-encoding.

## Context

- **Cost $3 → $4/ngày không phải do đợt cost-optimize** — ngược lại, right-size
  memory đang chạy đúng. Nguyên nhân: **burst traffic đúng 1 ngày** (08-11, đỉnh
  18h), toàn 2xx nên là traffic thật chứ không phải retry.
- **Tăng `maxInstances` không giảm cost, chỉ làm tăng.** Với request-based billing,
  Cloud Run tính CPU **suốt thời gian request**, nên "CPU-second" không phải CPU
  thật; thêm instance = thêm instance-time được tính tiền. Memory là SKU **rẻ nhất**
  và chịu burst tốt. → [[functions-pricing-v1-v2]]
- **Gate hook chặn commit từ worktree** vì nó chạy `yarn check` ở **repo chính**
  chứ không phải worktree đang commit — worktree sạch vẫn bị chặn. Đã vấp 3 lần
  cùng nguyên nhân (task #12 ở `avada-core`, #22, #25) trước khi nhìn ra.
- Worktree mới thiếu cả `node_modules` lẫn `.env.local` — chuẩn bị trước khi giao
  agent, nếu không agent đứng chờ `yarn install`.
- "2 suite fail pre-existing" dán vào mọi brief hoá ra **không còn đúng** — baseline
  copy đi copy lại là thứ tự nó cũ đi.
- **Dọn disk:** 4 worktree + `static/` chiếm ~13GB; xoá worktree sau khi verify sạch
  + đã push (9.8GB → 2.8GB, trống 1.7GB → 15GB). Nhớ `yarn predeploy` sinh lại
  `static/` trước lần deploy kế tiếp.
- User nhắc giữa phiên: **viết gọn, bỏ đoạn râu ria** — báo cáo dài làm chính user
  miss thông tin.

→ [[digest-subscriptions-2026-08-12]] · [[shipped-subscriptions-2026-08-13]] ·
[[bang-chung-phan-biet-duoc]] · [[lich-dinh-ky-neo-theo-ngay-du-kien]] ·
[[functions-pricing-v1-v2]]
