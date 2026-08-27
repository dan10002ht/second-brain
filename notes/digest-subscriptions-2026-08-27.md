---
type: note
title: Joy Subscription — digest 2026-08-27
summary: Phí ship 0 EUR của kookut không phải lỗi code mà là cấu hình delivery profile của merchant (nhóm SUBSCRIPTION chỉ có MỘT rate, profile app trỏ vào lại 0 sản phẩm); hai file trùng tên `shippingProfileService.js` và một lần `grep -v` lọc nhầm khiến tôi kết luận sai ba lượt liên tiếp; audit V1→V2 cho store khách gộp 60 product thành 3 plan và không đụng Bird/Zapiet/delivery_date.
tags: [avada, subscription, shopify, shipping, debug, performance]
created: 2026-08-27
updated: 2026-08-27
source: project `subscriptions` — session history 2026-08-27 (3 session: setup tester + audit V2, kookut shipping, CLS boot screen)
---

# Joy Subscription — digest 2026-08-27

CHỈ phần mới so với [[digest-subscriptions-2026-08-26]], [[digest-subscriptions-2026-08-20]]
(vòng trước của chính chuỗi shipping kookut) và [[digest-subscriptions-2026-08-24]] (CLS boot screen).

## Bugs

### Phí ship 0 EUR của kookut: hai bug rời nhau, và cái thật nằm ngoài code

Chuỗi này tôi **đảo kết luận ba lần**, nên ghi lại theo đúng thứ tự đã sai:

| Lượt | Kết luận | Vì sao sai |
|------|----------|-----------|
| 1 | "Đã fix root cause" | Tôi vá `getLowestShippingRate` ở `services/graphql/shippingProfileService.js`, nhưng có **hai file trùng tên** — cái đọc `recurringOption` nằm ở `services/shippingProfile/`. Hàm tôi sửa không nằm trên đường tạo contract |
| 2 | "Tính năng auto-update chưa tồn tại" | Tôi grep call site với `grep -v "shippi…"` nên lọc mất chính `autoUpdateShippingRate`. Tính năng **có** tồn tại và hàm tôi sửa nằm đúng trên đường chạy của nó — trigger chỉ **2 sự kiện**, không có "renew" |
| 3 | "Auto-update ghi đè nên thành 0" | Đọc thẳng doc contract: cả hai contract **chưa từng bị sửa lần nào** (1 activity duy nhất lúc tạo). Số 0 sinh ra ngay lúc tạo |

**Kết luận cuối, bác bỏ luôn tiền đề của kế hoạch code:** quote thật cho 2 contract cho thấy
nhóm `SUBSCRIPTION` của kookut **chỉ có đúng MỘT rate**, và `shop.deliveryProfileId` trỏ vào
profile "Shipping rates for subscription" do app tạo — profile đó có **0 sản phẩm, 0 selling plan
group**, và rate France của nó không hề chứa option khách đang chọn. Tức app quote đúng theo cái nó
được cho; sai nằm ở cấu hình merchant. Việc chốt lại là **soạn yêu cầu cấu hình gửi CS**, không
phải viết code.

Bug thật đã fix trong `getLowestShippingRate`: nó lấy option Shopify **pre-select** (rẻ nhất) thay
vì option khách đã chọn — nay `deliveryOptions` được truyền vào cart mutation (trước bị comment
out) và skip khi option khách chọn không còn được offer. 11 test fixture phải viết lại theo ngữ
nghĩa mới. Liên quan: [[digest-subscriptions-2026-08-20]] (vòng đầu của chính bug này).

### Shopify KHÔNG tự tính lại phí ship cho subscription

Tra tài liệu chứ không suy đoán: phí ship của contract là thứ app phải tự quản. Nên "logic lowest
chạy automatic theo Shopify" là hiểu nhầm — mọi con số sai đều là số app đã ghi vào contract.

### Đọc code từ nhánh feature làm hỏng một audit 13 agent

Audit kookut chạy trên worktree `feat/portal-preview` — **198 commit sau master**. 11/14 file
trích dẫn giống hệt master nên finding vẫn đứng, nhưng **3 file lệch lại đúng 3 file
load-bearing nhất**: fix index-misalignment đã có trên master mà không có trên nhánh tôi đọc.
Dữ liệu prod thì không bị ảnh hưởng — chỉ kết luận về code bị. Hai lệnh phải chạy trước mọi audit:

```
git rev-list --left-right --count origin/master...HEAD
git show origin/master:<path>
```

Đây là [[feedback-audit-code-doc-tu-nhanh-prod]] tái phát ở quy mô 13 agent.

## Techniques

### Audit V1→V2 cho một store khách production (read-only)

Cách làm cho `sprayfreefarmacy` (enterprise, 60 subscription product / 168 plan / 15 product
bundle / 1 box): build `lib/` rồi **mô phỏng migration bằng chính helper thật của app**, đọc dữ
liệu prod và không ghi gì. Kết quả gộp rất gọn — **60 product V1 → 3 plan V2**.

Ba vùng khách lo mà migration **không** chạm tới:

| Vùng | Vì sao ngoài phạm vi |
|------|----------------------|
| Box không dùng nữa | `getBoxesNotMigrated` loại box đó ra; không `productBundle` nào trỏ tới (`boxId` rỗng ở cả 15 doc) |
| Bird Integration | Đọc dữ liệu integration, không đọc plan V1/V2 |
| Delivery Date / Zapiet attribute | Ba tầng (nơi sinh property, nơi lưu, nơi đồng bộ upcoming order tại `orderController.js:322-328`) đều nằm ngoài phạm vi migration |

### Đo CLS admin bằng session Chrome thật, không phải profile Chrome thật

Skill `playwright-session-capture` mở cửa sổ Playwright với **profile riêng trong scratchpad** rồi
để người dùng login một lần; session lưu lại, lần đo sau không phải login. Copy thẳng profile
Chrome thật thì bị chặn (đụng cookie store) — và không nên lách.

Hai bẫy gặp phải: vòng chờ chết ở `Target page has been closed` khi OAuth đổi tab (phải theo dõi
**mọi tab** trong cửa sổ, không bám một page), và **dev standalone không tái hiện được CLS của
prod** — dev bundle không minify mất >14s dưới network throttle nên run đầu còn kẹt ở boot screen.

### Classifier chặn `source .env.local` khi export token

`set -a && source .env.local && set +a` bị chặn khi chạy script prod, trong khi đọc Firestore thì
bình thường. Chẩn đoán bằng cách tách từng phần lệnh ra chạy riêng thay vì đoán. Liên quan:
[[feedback-khong-in-secret-ra-chat]].

## Context

- Store tester `ngocvtb-prod` cho landing JoyxJoy: bundle 129 KB **chỉ gọi Storefront API**
  (`/collections/{handle}/products.js`, `/cart/add.js`), không gọi backend app — nên tester chỉ
  cần 3 thao tác trong Shopify Admin, không build/upload gì. Tần suất hiển thị **không fix cứng
  1/2/4 tuần**: widget hiển thị theo plan của app (README/seed script cũ ghi sai). Xem
  [[2026-08-24-landing-joyxjoy-dung-plan-cua-app]].
- Quét toàn bộ **16.065 shop** để biết bao nhiêu shop dùng `shippingProfile` — con số đó đổi
  khuyến nghị của tôi từ "làm nút DevZone chạy logic cho kookut" sang "chưa cần". Kỷ luật đúng:
  đo mức độ phổ biến trước khi dựng công cụ vận hành.
- Fix boot-screen CLS (`0.0146 → 0.0064`) commit trên `feat/joyxjoy-landing` theo yêu cầu — cùng
  nhánh với landing để đẩy lên sớm. Chi tiết root cause `2rem` neo vào html font-size Polaris hạ
  16→13px đã ghi ở [[digest-subscriptions-2026-08-24]].
- Reserve chiều cao IndexTable mobile lại **không tái hiện được nhất quán** (table xuất hiện lần
  đầu đã ở `y=189` trong khi shift ghi nhận `140 → 189`) nên đã gỡ — khớp với kết luận đã ghi ở
  [[digest-subscriptions-2026-08-26]].

⚠️ *Chưa xác minh*: yêu cầu cấu hình gửi CS đã soạn nhưng merchant chưa xác nhận sửa delivery
profile, nên chưa có bằng chứng phí ship về đúng 10 EUR trên đơn mới.

## Liên quan

[[subscriptions]] · [[subscriptions-debug-runbook]] · [[discount-per-cycle-audit-2026-08-27]] ·
[[digest-subscriptions-2026-08-26]] · [[shipped-subscriptions-2026-08-27]] ·
[[feedback-debug-phai-query-data-that]] · [[do-layout-shift-bang-browser-automation]] ·
[[bang-chung-phan-biet-duoc]] · [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]]
