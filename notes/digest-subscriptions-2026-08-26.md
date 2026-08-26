---
type: note
title: Digest subscriptions 2026-08-26 — thứ Shopify API không nhìn thấy, một replace-all đẻ ra đệ quy, và ngõ cụt CLS mobile
summary: Add extension vào theme editor rồi Save không làm API đổi một chữ nào — chỉ khi vào MENU mới đo được; `replace_all` thay luôn dòng cuối của chính method mới nên `renderPortalForCustomer` gọi lại chính nó; và reserve chiều cao cho IndexTable mobile làm CLS xấu đi nên đã revert.
tags: [subscription, shopify, storefront, avada, debug, performance]
created: 2026-08-26
updated: 2026-08-26
source: project "subscriptions" — session history (3 session mới: portal preview/SB-16056+16059, setup store tester + audit V1→V2, đo CLS admin)
---

# Digest subscriptions — 2026-08-26

> CHỈ phần chưa có trong [[digest-subscriptions-2026-08-24]] và [[digest-subscriptions-2026-08-25]].
> Phần landing joyxjoy (inventory, add-to-cart, discount tier) đã ghi ở hai note đó.

## Bugs

**Shopify API không nhìn thấy việc merchant add extension vào theme editor.** Thí nghiệm 4 mốc
trên cùng một store (`dantt-subscription-box`), mỗi mốc query lại cùng một endpoint:

| Mốc | API đổi gì |
|---|---|
| Trước khi add | baseline |
| Add extension trong theme editor | **không đổi một chữ** |
| Bấm Save | **không đổi một chữ** |
| Add vào **menu** customer account | khác hẳn |

Nên câu hỏi "merchant đã bật extension chưa" là **không đo được** bằng API, còn "extension có
trong menu chưa" thì đo được. Đó là dữ kiện dẫn tới [[2026-08-26-banner-portal-theo-menu]].
Cùng lượt query đó lộ thêm một bug handle menu; tier 2 của chuỗi resolve chỉ chạy khi tier 1 rỗng
mà tier 1 luôn có giá trị, nên chữa handle **không** đổi URL đang chạy — an toàn để sửa.

**`replace_all` thay luôn dòng cuối của chính method mới → đệ quy vô hạn.** Khi sửa SB-16059
(classic portal), lệnh replace-all thay mọi lần xuất hiện của một chuỗi, trong đó có dòng nằm
**bên trong** `renderPortalForCustomer` vừa viết — thành ra method gọi lại chính nó. Gate không
bắt được (không có test đi qua đường đó); nó chỉ lộ ra vì user hỏi lại "bạn fix chưa?". Bài học
đúng dạng [[bang-chung-phan-biet-duoc]]: "đã sửa xong" không phải bằng chứng, đọc lại vùng vừa
sửa mới là.

**SB-16059 "store dev vẫn work" là dương tính giả.** Điều kiện tái hiện là **customer đã đăng
nhập** trên storefront; store dev đang không login nên không bao giờ thấy. Bản NEW portal không
đổi tab mà **probe**: tự gọi `GET /subscriptions` trước rồi chặn render tới khi decision settle
(timeout 6s) — cách đúng, và classic được chèn cùng probe đó tại đúng chokepoint trước khi render
portal cho customer đã login.

**Ngõ cụt CLS mobile (đã revert).** Skeleton của `Subscriptions.js` khớp **hoàn hảo ở desktop**
(60→60, table 637→637, không shift chút nào) nhưng hỏng ở mobile: row thật cao **101px** vì cell
Products chứa `ProductGroup` (thumbnail + tên) wrap ở viewport hẹp, còn skeleton chỉ 1 dòng text
mỗi cell. Không phải `IndexTable` condensed — vẫn 10 cột. Và chiều cao row **không đồng nhất**
(3 row đầu 101px, các row sau 60px), nên không có một con số để reserve. Thử reserve theo cache
đo thật (pattern `homeCardOrderCache`, key theo `shopDomain`) → CLS **xấu hơn** (0.31 → 0.505):
`minHeight` không cứu được vì table **dịch xuống 49px** (`y 140 → 189`) chứ không chỉ cao lên, và
không tái hiện nhất quán giữa các lần load. Đã bỏ, chỉ giữ fix boot logo (0.0146 → 0.0064).
Bản reserve cũ đã revert trước đây hardcode `min-height: 820px` — chính là thứ tạo khối trắng rồi
sập ở shop có list ngắn.

## Techniques

**Đo CLS của app *cần đăng nhập*.** Copy profile Chrome thật bị chặn (đụng cookie store) — hợp lý,
không lách. Đường đi được: Playwright mở cửa sổ với **profile riêng trong scratchpad**, user login
đúng một lần, session giữ lại cho mọi lần đo sau. Hai bẫy đã vấp:
- Vòng chờ login phải theo dõi **mọi tab trong cửa sổ**; OAuth Google → Shopify đổi tab làm waiter
  chết với `Target page... has been closed` (hai lần liên tiếp).
- Dưới throttle mạng, **dev bundle không minify mất >14s để tải** nên run đầu còn kẹt ở boot screen
  — số đo lúc đó không nói gì về trang. Phải assert đã render trước khi tin con số, đúng như
  [[do-layout-shift-bang-browser-automation]].

**Chặn add-to-cart ở PDP để chuyển hướng sang landing.** Thứ tự và chi tiết dễ hỏng:
- JSON template **không render snippet trực tiếp** → phải chèn qua `theme.liquid`.
- Push **snippet trước**, `theme.liquid` sau — ngược lại thì layout render một snippet chưa tồn tại
  và cả theme lỗi.
- Nút add-to-cart của theme khách là `<button class="product-form__submit">`, **không** phải submit
  trong form; nút sticky lúc chưa cuộn thì tồn tại nhưng ẩn — chọn nút đang hiển thị.
- "Buy it now" không có đường vòng vì `dynamicCheckout: []` (khách chưa bật). Lỗ hổng đó chỉ xuất
  hiện *im lặng* nếu sau này bật, nên để lại comment giải thích thay vì selector.

**Audit migration V1→V2 cho store khách bằng chính helper của app.** Đọc dữ liệu prod, **không ghi**,
chạy helper thật để biết trước kết quả: `sprayfreefarmacy` có 60 subscription product V1 / 168 plan
/ 15 product bundle / 1 box → gộp lại chỉ còn **3 plan V2**. Điều kiện để mô phỏng đáng tin: code
migration trên nhánh đang đọc phải **giống hệt `origin/master`** (đã kiểm), đúng tinh thần
[[feedback-audit-code-doc-tu-nhanh-prod]]. Box của khách không còn dùng và `getBoxesNotMigrated`
loại nó ra, nên hai finding về box tự tiêu. Bird Integration, Zapiet và các attribute kiểu
`Delivery Date` **không bị ảnh hưởng** — chúng đọc field khác, và contract đang chạy không bị đụng.

## Context

- Thư mục worktree bị xoá tay nhưng git vẫn giữ đăng ký → `git checkout` báo *"already used"*.
  `git worktree prune` (hoặc gỡ đăng ký mồ côi) là bước còn thiếu.
- Store tester `ngocvtb-prod` đã cài staging-1 nhưng `newPlanVersion=false`; bundle landing chỉ gọi
  Storefront API (`/collections/{handle}/products.json`, `/cart/add.js`) nên không phụ thuộc backend
  app — phần setup của người là 3 việc trong Shopify Admin, không cần build/upload.
- Tần suất hiển thị trên landing **không fix cứng 1/2/4 tuần** (đó là README/seed script cũ) — code
  hiện lấy theo plan của app, xem [[2026-08-24-landing-joyxjoy-dung-plan-cua-app]].

## Liên quan

[[subscriptions]] · [[2026-08-26-banner-portal-theo-menu]] · [[shipped-subscriptions-2026-08-26]] ·
[[digest-subscriptions-2026-08-25]] · [[digest-subscriptions-joyxjoy-2026-08-20]] ·
[[2026-08-19-page-custom-o-theme-khach]] · [[do-layout-shift-bang-browser-automation]] ·
[[bang-chung-phan-biet-duoc]] · [[feedback-audit-code-doc-tu-nhanh-prod]]
