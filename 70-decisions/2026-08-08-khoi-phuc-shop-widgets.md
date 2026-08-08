---
type: decision
title: Khôi phục shop.widgets trên /shops — nhận lại 0.6–1.4s critical path để consumer đọc đồng bộ
summary: Joy Subscription đưa `getCrmWidgets` trở lại payload `/shops` (undo nửa perf của `03322bf58`) để `shop.widgets` có mặt ngay frame đầu; đổi lại critical path mọi lần load app gánh thêm 0.6–1.4s và `public.avada.io` bị gọi 2 lần mỗi lượt.
tags: [subscription, shopify, avada, performance, backend]
created: 2026-08-08
review: 2026-11-08
source: repo "subscriptions" — git log, commit `9e7b7a084` (nhánh `feat/restore-shop-widgets`)
---

# Khôi phục `shop.widgets` trên payload `/shops`

**Trạng thái: CHƯA MERGE.** Mới nằm trên nhánh `feat/restore-shop-widgets`
(`9e7b7a084`, 2026-08-07). Ghi ra đây vì nó đảo một quyết định đã được ghi vào brain
một ngày trước đó, và nếu không ghi thì lần sau lại có người "tối ưu" nó đi lần nữa.

## Bối cảnh

| Mốc | Commit | Việc |
|---|---|---|
| 2026-07-20 | `03322bf58` (DamHV, đã trên master) | gỡ `getCrmWidgets` khỏi `getUserShops` — kết quả đi vào `shop.widgets` mà **không ai đọc**, trong khi `@avada/app-widget-hook` vẫn tự fetch lại đúng list đó từ browser. Tiết kiệm **0.6–1.4s** trên critical path mọi lần load app. |
| — | `f7e3c557f` | tách `/shops/integrations` — phần này **giữ nguyên**, không bị đụng tới |
| 2026-08-07 | `9e7b7a084` | khôi phục **chỉ nửa widgets** của `03322bf58` |

Ghi chép phía brain: [[digest-subscriptions-2026-08-07]] (task #6) đã kết luận đúng rằng
field này *bị bỏ có chủ đích, không phải mất tự nhiên*, và cố ý dựng nhánh riêng để người
thật cân nhắc thay vì tự merge.

## Why

- `shop.widgets` phải có mặt **ngay frame đầu** để consumer đọc đồng bộ, thay vì mỗi nơi
  dùng phải tự xử lý trạng thái "chưa biết" (loading/undefined). Đây là lý do được ghi
  thẳng trong commit body — *"restoring it by request"*.
- Giả định của `03322bf58` ("nothing read `shop.widgets`") **đã hết đúng**: có consumer
  cần nó, và cần nó sớm.
- Fail-safe đã có sẵn: `getCrmWidgets` bắt lỗi và trả response rỗng, nên `public.avada.io`
  chết thì suy biến thành `widgets: []` chứ không phải 500.
- `collectActiveShopData` đổi sang đọc `widgetData?.widgets` (optional chaining) vì đường
  cached-shop cũng chạy qua đây và ở đó field có thể vắng.

## Tradeoff

**Trả giá — commit body tự khai, không giấu:**

- **+0.6–1.4s trên critical path của mọi lần load app.** Đúng bằng con số mà
  `03322bf58` đã cắt đi. Đây là nhận lại nguyên vẹn cái giá cũ.
- **Timeout `helpers/api` là 20s.** Nếu `public.avada.io` treo (không chết hẳn), frame đầu
  bị giữ tới 20 giây. Catch chỉ cứu được trường hợp *lỗi*, không cứu được trường hợp *chậm*.
- **`public.avada.io` bị gọi 2 lần mỗi lần load app** — một lần ở đây (server), một lần từ
  `@avada/app-widget-hook` (browser). Trùng lặp này chưa được khử.

**Đổi lại:** consumer đọc đồng bộ, không phải viết code phòng thủ cho trạng thái "chưa biết".

**Phương án không chọn** (chưa thấy được cân nhắc trong commit body, đáng hỏi khi review):
để `@avada/app-widget-hook` là nguồn duy nhất và cho consumer đọc qua hook đó — giữ được
critical path sạch mà vẫn bỏ được trạng thái "chưa biết" ở phía consumer.

## Điều kiện review lại (2026-11-08)

Quyết định này **chỉ đúng nếu cái giá perf được đo lại chứ không phải giả định**. Khi
review, kiểm ba điều:

1. Đã đo boot time trước/sau khi merge chưa? Con số thật là bao nhiêu — vẫn 0.6–1.4s hay
   đã khác? (Kỷ luật đo A/B đã dùng trong chiến dịch CLS: [[digest-subscriptions-2026-08-03]].)
2. Consumer nào thật sự đọc `shop.widgets` đồng bộ? Nếu tới lúc review vẫn không ai đọc,
   đây lại thành đúng tình huống mà `03322bf58` đã dọn — và vòng lặp sẽ lặp lần thứ ba.
3. Đã khử được cú gọi trùng `public.avada.io` chưa (server + browser)?

## Liên quan

[[shipped-subscriptions-2026-08-08]] · [[digest-subscriptions-2026-08-07]] ·
[[digest-subscriptions-2026-08-03]] · [[subscriptions]] ·
[[do-layout-shift-bang-browser-automation]] · [[caching-layers]]
