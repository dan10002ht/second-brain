---
type: note
title: Joy Subscription — dựng landing joyxjoy trên theme khách (2026-08-20)
summary: Trang trống dù dữ liệu đủ vì ba tầng im lặng — `shop.metafields.ns.key.data` là Metafield drop phải qua `.value`, metafield không có definition `PUBLIC_READ` thì storefront không đọc được, và sản phẩm tạo qua API chưa publish thì Liquid không thấy; cộng `div:empty{display:none}` của theme khách ẩn sạch ô ảnh của mình.
tags: [avada, subscription, shopify, storefront, preact, cdn]
created: 2026-08-20
updated: 2026-08-20
source: project "subscriptions" — session history 2026-08-19→2026-08-20 (session e02dbd91)
---

# Landing "Build Your Subscription" — dựng trên theme khách

Bối cảnh + hướng đi đã chốt ở [[2026-08-19-page-custom-o-theme-khach]]. Đây CHỈ là phần
kỹ thuật mới lộ ra khi chạy thật trên store dev `dantt-subscription-box`.

## Bugs — "trang trống" có bốn nguyên nhân chồng nhau

Dữ liệu đủ (14 bundle, 7 collection, 113 sản phẩm) mà trang vẫn rỗng. Bóc từng tầng:

1. **`shop.metafields.ns.key.data` là Metafield *drop*, không phải object đã parse.**
   Với metafield kiểu `json`, muốn lấy object phải `.data.value`. Chỗ dễ nhầm: trong repo
   có sẵn `{{ shop.metafields.avada_subscription_settings.data | default: false }}` — nhưng
   đó là **in thẳng ra** (drop tự serialize thành JSON string), không phải `for` trên nó.
2. **Không có metafield definition thì storefront không đọc được.** Phải khai trong
   `ensureAppMetafieldDefinitions()` (`metafieldDefinitionService.js:124`) với
   `access: {storefront: PUBLIC_READ}`. Áp lên store dev qua `PUT /dev_zone` — và action
   lấy từ **query `type`** (`devZoneController.js:275`), không phải body, nên gọi sai thì
   trả `success:false` kèm HTTP 200.
3. **Theme block setting `collection` lưu handle trần**, không phải
   `shopify://collections/<handle>`. Bằng chứng lấy từ chính theme khách
   (`"collection": "best-selling"`), không phải đoán.
4. **Sản phẩm/collection tạo qua API chưa publish** ⇒ Liquid trả `handle=null`,
   `title=null`, 0 sản phẩm. 133/145 mục phải publish.

Cộng thêm hai thứ làm mọi lần đo trước đó vô nghĩa:

- **Shopify cache trang storefront**: kích thước trang giống hệt **từng byte**
  (`1189534`) qua mọi lần push. Chỉ `?preview_theme_id=<id>` mới thấy bản mới.
- **`base.css` của theme khách có `a:empty, ul:empty, div:empty { display:none }`** —
  ô ảnh của mình là `div` rỗng đặt ảnh bằng `background-image` ⇒ ảnh tải được, URL đúng,
  mà phần tử cao **0px**. Đây là bài học chung: component nhúng vào theme khách chịu
  toàn bộ CSS global của theme, và triệu chứng của nó trông y hệt "thiếu dữ liệu".

Ngoài ra:

- **`drop_console: true` (`webpack.config.js:156`) xoá cả `console.warn`** ⇒ nhánh
  "không match selling plan" âm thầm **ẩn box** mà không để lại dấu vết nào ở production.
  Không đụng config dùng chung (6 bundle / 112 call site) — thay bằng tham chiếu console
  **gián tiếp** qua biến để Terser không nhận diện được. Đã grep bundle minified để chứng
  minh chuỗi còn sống, không tin build log.
- **Đọc tần suất bằng regex trên *tên* selling plan là sai.** Verifier chứng minh
  `"Giao mỗi 2 tuần"`, `"Deliver every 14 days"`, `"Bi-weekly delivery"` đều → `null`.
  Nguồn đúng là `delivery_policy` → `billing_policy`, regex chỉ là fallback.
- **`sellingPlanGroupCreate` báo thành công mà group không gắn vào sản phẩm** — log ghi
  tạo 12 group, Admin API nói 9/14 box không có plan, script *có* kiểm `userErrors` và
  throw, exit 0. ⚠️ **chưa giải thích được** — treo lại.

## Techniques

- **Tách component KHÔNG giảm bundle size.** Webpack vẫn gộp; chỉ `import()`
  code-splitting mới giảm. (Trần 30KB tôi tự áp không tồn tại — đã ghi ở
  [[digest-subscriptions-2026-08-19]]; hai bundle cùng loại đang 198KB.)
- **Không dùng Web Component/Shadow DOM** cho ca này, có số đo chứ không phải cảm tính:
  `base.css` của theme khách chỉ còn `blockquote`/`hr`/`summary` là bare element selector,
  202 rule kết-thúc-bằng-element đều đã scope dưới class component của theme ⇒ Shadow DOM
  giải một bài toán gần như không tồn tại, đổi lại mất khả năng kế thừa font/màu của theme.
- **Phục vụ bundle cho theme khách bằng Shopify Files** (`fileCreate`, `GENERIC_FILE` —
  **không** hỗ trợ `REPLACE`, mặc định `APPEND_UUID` nên URL đổi mỗi lần). Được
  `content-type: text/javascript` + `access-control-allow-origin: *`, tránh hẳn chuyện
  cert của `https://localhost:3001`.
- **Verify UI phải render thật rồi đo, không đọc CSS rồi tin.** Playwright + Chrome hệ
  thống (`channel: chrome`) khi chromium build của gói lệch version cache. Đo được
  `.jw-thumb` `0×0` → `198×198`, grid `1175.72px 340px gap 40`, `scrollWidth` ở từng
  breakpoint. Lưu ý: thanh preview của Shopify là iframe cố định ở đáy — nó **che đúng chỗ**
  sticky bar mobile, đó là hiện tượng của preview chứ không phải lỗi sản phẩm.
- Responsive lưới: `repeat(auto-fill, minmax(240px, 1fr))` thắng cả hai phương án
  media-query vì lưới tự đếm theo chỗ trống thật, không theo bề rộng viewport.
- `git status` trong worktree chỉ báo **một** mục chưa commit, nhưng thư mục mockup có
  **165 file ảnh** bị `.git/info/exclude` giấu đi — gỡ worktree là mất sạch. Backup trước,
  đếm lại sau (168 = 3 theme + 165 ảnh).

## Context

- Nhánh `feat/joyxjoy-landing`; worktree riêng `~/projects/subscriptions-joyxjoy` sau đó
  được **gộp về repo chính** khi repo chính rảnh.
- Store khách thật là `sprayfreefarmacy.myshopify.com` (*Spray-Free Farmacy*, enterprise),
  không phải `joywholefoods` — `joywholefoods.com.au` chỉ là domain storefront. Tìm ra nhờ
  handle sản phẩm trong mockup **chính là handle thật của store**.
- Store khách có **hai bộ box khác nhau**: bộ mockup dùng và 15 box JOY thật (đều có đúng
  3 selling plan `WEEK×1/×2/×4` — xác nhận ràng buộc "các box cùng chu kỳ" là đúng thực tế).
- Mockup có 3 mảng: `BOXES` (16) + `STAPLES` (77) + **`ONEOFF` (23)**. Parser đầu bỏ sót
  hẳn `ONEOFF`, và regex của tôi dùng nháy đơn nên đếm hụt — con số "93 handle" là thiếu.
- Dữ liệu dev store được seed **qua route HTTP thật của app**, không ghi tắt Firestore —
  lý do và tradeoff ở [[2026-08-20-seed-dev-qua-luong-http-that]].
- Còn treo: staples và one-off đang nhận **cùng một mảng `categories`**
  (`LandingApp.js:183-184`) nên hiển thị y hệt nhau; "All" = gộp 7 category chứ không phải
  toàn store — đã ghi thành task `[⏸️]` chờ BA quyết.
