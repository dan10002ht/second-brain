---
type: note
title: Digest subscriptions 2026-08-28 — đóng vụ kookut, import từ Loop, ATC volume bundle
summary: Xoá cycle edit sau commit draft cũng revert luôn skip nhưng Firestore mới là nguồn chọn đơn để charge; app không hề đọc được giá của phương thức khách chọn vì `deliveryOptions` bị comment out; và import từ Loop dựng lại được contract từ order + transaction log chứ không cần contract của app kia.
tags: [avada, subscription, shopify, billing, shipping, debug]
created: 2026-08-28
updated: 2026-08-28
source: project `subscriptions` — session history 2026-08-28 (5 session: kookut shipping, import Loop, ATC volume bundle)
---

Nối tiếp [[digest-subscriptions-2026-08-27]] (phí ship 0 EUR của kookut) và
[[digest-subscriptions-2026-08-15]] (dữ liệu giá hỏng sống sót qua ba lớp).
Chỉ ghi phần **chưa có** trong brain.

## Bugs

**`subscriptionBillingCycleEditsDelete(targetSelection: ALL)` revert luôn cả skip.**
Docs Shopify nói nguyên văn nó *"deletes the schedule and contract edits on the current and
all future billing cycles, and reverts the schedules"* — mà **skip chính là một schedule edit**
(`subscriptionBillingCycleScheduleEdit`). Nên sync giá gọi nó là un-skip mọi kỳ khách đã skip.
Điều cứu tình huống: **app chọn đơn để charge bằng Firestore** (`.where('skipped','==',false)`
ở 6 chỗ trong `orderRepository`), không đọc lịch Shopify — nên revert bên Shopify không sinh
charge. Đường sync ngược có nhưng không kín: app chỉ đăng ký webhook
`subscription_billing_cycle_edits/update` trong 5 topic về cycle (không có `cycles/skip`,
`edits/delete`), còn job nền thì `orders.filter(o => !o.skipped)` nên cycle Shopify đã un-skip
vẫn lọt qua. Kèm theo: cả **24 call site** trong repo đều xoá cycle edit **trước** khi mở draft
— không chỗ nào xoá lúc draft đang mở, đó là căn cứ để đảo thứ tự an toàn.

**App không thể biết giá của phương thức khách chọn — `deliveryOptions` bị comment out.**
Query cart chỉ lấy `selectedDeliveryOption` (Shopify tự chọn = rẻ nhất), nên "lowest" của app
thực chất là "cái Shopify pre-select", không phải "giá hiện tại của đúng phương thức khách đã
chọn". Bỏ comment mới có danh sách để so.

**`Number(null) === 0` biến rate carrier thành miễn phí.** Rate không có giá (carrier-calculated)
lọt qua thành 0đ thay vì bị skip — test bắt được đúng loại nguy hiểm nhất khi dựng bảng giá từ
delivery profile.

**Guard query cycle edits hardcode cửa sổ 2 năm bị Shopify từ chối.** `Billing cycle start date
out of range` rồi `Upcoming billing cycle selected past limit` — phải neo cửa sổ vào **hiện tại**,
không dùng hằng số ngày. 14/25 contract "lỗi" hoá ra là lỗi của guard, không phải của dữ liệu.

**Widget volume bundle không cướp được nút ATC của theme Horizon** → theme tự submit form với
`quantity=1`, khách chọn pack 3 vẫn chỉ 1 chai. Lời giải: listener `click` **capture trên
`window`** — đăng ký muộn vẫn chạy trước handler của theme (thử nghiệm: `[ProductForm Debug]`
không xuất hiện, cart = 0). MR !2518.

## Techniques

**Import contract từ app khác (Loop → Joy) mà không đọc được contract của app kia.**
Shopify chỉ có scope `read_own_subscription_contracts` — Joy không bao giờ đọc được contract
của Loop. Đường đi được: dựng lại từ **order gốc** (`read_all_orders` + `read_customers` +
`read_customer_payment_methods`) → lấy `line_variant_id`, `contract_currency_code`,
`customer_id`, địa chỉ, và cả `customer_payment_method_id`. Kiểm chứng cách đoán bằng
**Transaction logs CSV** của Loop: cột `Payment instrument` chứa nguyên
`gid://shopify/CustomerPaymentMethod/<token>` của đúng subscription đó — 33/33 khớp với giá trị
script tự đoán ("thẻ chưa revoke đầu tiên"), tức cách đoán đúng và 4 ca fallback đều chỉ có 1 thẻ.
Kỷ luật đáng giữ: chạy file cuối qua **chính `validateImportSubscriptions` của app**, không phải
check tự chế.

**Đo trên dữ liệu prod trước khi kết luận tính năng "ai cũng dùng".** Quét 16.065 shop để biết
bao nhiêu shop thật sự bật `shippingProfile.recurringOption` trước khi đổi hành vi mặc định —
số đo đổi hẳn khuyến nghị.

## Context / gotcha

- **401 của Shopify không có nghĩa là token sai** — shell chưa nạp `ACCESS_TOKEN_KEY_PROD` thì
  script giải mã access token ra rác và Shopify trả 401 chứ không báo "sai key".
- **`importService` đổi contract `CANCELLED`/`EXPIRED` thành `PAUSED` lúc tạo** và không có bước
  huỷ nào — import nhầm 88 contract đã huỷ là dựng lại 88 contract sống. Import cũng **tự tạo
  plan giả (uuid)** cho từng line nên không cần tạo plan trước. Cap 50 subscription của V5 chỉ áp
  cho plan `free`, không áp `starter`.
- **UI hiển thị ngày theo timezone của shop, code so theo UTC.** Ca JSUB-260828 "đơn quá hạn chưa
  charge" là `2026-08-28T12:00:00Z` = 8:00 AM ở `America/New_York` — chưa tới giờ, cron
  `automaticBillingAttemptSchedule` chạy mỗi phút sẽ nhặt ngay. Đối chiếu phải bằng ISO UTC.
- **Đọc code từ worktree đang mở là đọc sai.** Audit chạy trên `feat/portal-preview` — **198
  commit sau master** — làm 3/14 file trích dẫn lệch, trong đó có đúng file mang fix
  index-misalignment đã có trên master. Cùng bài học với [[feedback-audit-code-doc-tu-nhanh-prod]];
  cách đo rẻ: `git rev-list --left-right --count origin/master...HEAD`.
- **`git reset --mixed origin/master` giữ nguyên working tree cũ** nên nó "hoàn tác" luôn 13 commit
  của master thành 143 path dirty. Khôi phục: `git checkout -- <path>`, và `xargs -a` không có
  trên macOS (dùng `tr '\n' '\0' | xargs -0`).
- Chèn dòng `import` "sau dòng import cuối cùng" rơi vào **giữa một import nhiều dòng** → SyntaxError,
  6 suite chết. Neo theo dòng `} from '...'` đóng.
- Skill `/security-review` chấm `git status` của **repo chính** chứ không phải worktree đang làm →
  diff rỗng, review vô nghĩa. Cùng họ với gate soi nhầm repo ở [[digest-subscriptions-2026-08-11]].
- Đo CLS trên **dev standalone không tái hiện được prod** (0.0146 vs 0.0916) vì bundle dev không
  minify, mất >14s dưới throttle. Muốn dùng lại session Chrome đang đăng nhập thì không copy được
  profile (bị chặn vì cookie store) — phải mở Playwright với profile riêng trong scratchpad và
  đăng nhập một lần, vòng chờ phải theo dõi **mọi tab** vì OAuth đổi tab giữa chừng.

→ Quyết định tách riêng: [[2026-08-28-shipping-lay-gia-tu-rate-table]] ·
[[2026-08-28-import-loop-chi-contract-song-paused]]

## Liên quan

[[subscriptions]] · [[shipped-subscriptions-2026-08-28]] · [[subscriptions-debug-runbook]] ·
[[kookut-yeu-cau-cau-hinh-shipping]] · [[bang-chung-phan-biet-duoc]] ·
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] · [[ack-khong-phai-hieu-ung]]
