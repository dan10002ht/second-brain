---
type: decision
title: Setup guide chọn variant trước paint từ localStorage, bỏ hướng gate/skeleton
summary: Joy Subscription bỏ hai hướng trước đó cho CLS Home (gate cả hai variant sau `isWidgetStatusKnown`, và skeleton placeholder mà audit 08-19 khuyến nghị), thay bằng đóng băng lựa chọn variant từ localStorage trước frame đầu — đổi lại chấp nhận dữ liệu cũ tới 48h TTL.
tags: [avada, subscription, performance, caching]
created: 2026-08-21
updated: 2026-08-21
review: 2026-11-21
source: repo `subscriptions` — commit `772c408bd`, `fef9bac82` (nhánh `fix/cls-home`, 2026-08-20)
---

# Setup guide chọn variant trước paint từ localStorage

Trạng thái: ⚠️ **CHƯA MERGE** — mới ở nhánh `fix/cls-home`, không tag, không cờ deploy.

`showFullGuide` (4-task vs 8-task) đọc `blockWidgetStatus`, field chỉ về cùng
`/shops/integrations` — **đo trên prod: 3–5s sau paint**. Trong rect attribution của
`webVitals`, cú insert này là contributor CLS nặng nhất còn lại ở `/embed/`: shift dồn cụm ở
2–4s, đúng mốc `integrations:fetch-end`.

Chốt: đóng băng lựa chọn **trước paint** từ localStorage, tái dùng cơ chế
`homeCardOrderCache` mà `displayMetricsFirst` đã dùng. Guide mount ở frame một VÀ không bao
giờ swap. Chỉ ghi cache khi status thực sự đã biết — nếu không, shop đang ở guide 8 task sẽ
bị hạ về 4 task ở mọi lần load. Key format của entry `metricsFirst` giữ nguyên nên cache cũ
vẫn hợp lệ.

Đi kèm cùng nhánh (`fef9bac82`): rút luật ra `mergeShopSnapshot` và áp cho **cả 4** call site
(store, `window.activeShop`, 2 chỗ ghi cache) — vì `5dfc63777`/`v2.34.78` chỉ sửa store, để
lại mirror và cache tự mâu thuẫn với nhau về cùng một shop.

## Why

- **Hai hướng trước đều đã thử và đều tệ hơn.** Bản fix trước gate *cả hai* variant sau
  `isWidgetStatusKnown`: đổi một cú swap lấy một thứ tệ hơn — **không** variant nào render
  cho tới 3–5s, rồi một card ~450px bị chèn vào trang **đã vẽ xong và có thể đã cuộn**.
- **Skeleton placeholder không giải được bài này** dù đó chính là khuyến nghị #1 của
  `cls-admin-audit-2026-08-19`: hai variant khác chiều cao, nên placeholder chiều cao cố định
  chỉ **dời** shift sang chỗ khác chứ không xoá nó.
- **Nguồn của shift là thời điểm biết dữ liệu, không phải cách render.** Chừng nào quyết định
  còn chờ một request 3–5s thì mọi cách sắp xếp render đều chỉ đổi hình dạng của shift. Đọc
  từ storage đồng bộ là cách duy nhất đưa quyết định về trước frame một.
- **Cache bị strip mới là thứ làm phân bố lưỡng đỉnh.** ~24% mẫu report lúc
  `visibilitychange` — tab đóng trước khi integrations về, để lại snapshot thiếu field. Một
  lần load bị ngắt gây shift cho **mọi** lần load sau nó (p50 0.022 vs p95 0.36). Sửa chỗ ghi
  cache là điều kiện cần để việc đọc cache trước paint có nghĩa.

## Tradeoff

- **Chấp nhận dữ liệu cũ.** Một field server thật sự đã bỏ nay sống sót tới hết TTL 48h hoặc
  tới lần mutation local kế tiếp (`setShop` clear cache). Đây đúng là tradeoff mà `SET_SHOP`
  merge đã nhận từ trước — và là vế rẻ hơn: một boolean cũ render card sai một lần load, còn
  thiếu boolean thì không render gì rồi chèn card vào giữa lúc đang cuộn.
- **Merchant lần đầu (cache miss) không được lợi gì** — vẫn đi đúng đường cũ.
- **Thêm một nguồn sự thật nữa phải giữ đồng bộ.** Đổi lại `mergeShopSnapshot` gom luật về
  một chỗ cho cả 4 call site, thay vì 4 bản chép tay như trước.
- **Đi ngược khuyến nghị đã ghi trong brain** — `cls-admin-audit-2026-08-19` mục #1 phải được
  đánh dấu là đã bị thực nghiệm bác, nếu không lần đo sau sẽ lại đề xuất skeleton.
- **Chưa có số đo sau.** Lập luận dựa trên rect attribution + cơ chế; chưa có CLS trước–sau
  của chính bản vá này. Mốc review 3 tháng là lúc đòi con số đó.

## Liên quan

[[shipped-subscriptions-2026-08-21]] · [[digest-subscriptions-2026-08-19]] ·
[[shipped-subscriptions-2026-08-20]] · [[cls-admin-audit-2026-08-19]] ·
[[do-layout-shift-bang-browser-automation]] · [[subscriptions]]
