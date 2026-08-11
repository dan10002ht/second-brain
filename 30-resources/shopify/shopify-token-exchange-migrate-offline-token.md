---
type: resource
title: Migrate offline token sang token exchange — rủi ro nằm ở shop ngủ đông
summary: Token exchange cần session token nên chỉ chạy khi merchant mở app trong admin — không có command/cron nào migrate hộ; shop chưa vào lại vẫn chạy bình thường bằng token cũ, nên "bật cờ" không phải là mốc rủi ro, "shop không bao giờ vào lại" mới là.
tags: [shopify, auth, avada, backend]
created: 2026-08-11
updated: 2026-08-11
source: project "subscriptions" (+ repo `avada-core`) — session history
---

Áp dụng cho mọi app Shopify của Avada khi Shopify bỏ offline token không hết hạn.

## Ba sự thật quyết định cách lên kế hoạch

| Câu hỏi | Trả lời | Hệ quả |
|---|---|---|
| Migrate xảy ra lúc nào? | Lần merchant **mở app trong admin** kế tiếp | Không do mình điều khiển |
| Chạy bằng command/cron được không? | **Không** — token exchange cần **session token**, chỉ có khi có phiên admin | Đừng đi tìm script backfill; đây là ràng buộc của Shopify |
| Merchant có phải auth lại (OAuth) không? | **Không** — token exchange không phải OAuth redirect | Không có màn hình xin quyền, merchant không thấy gì |
| Shop chưa vào lại thì sao? | Token không-hết-hạn cũ **vẫn dùng được bình thường**, kể cả cron billing attempt | Bật cờ không đụng gì tới họ |

## Vì sao "bật cờ ngay" bị hiểu nhầm là an toàn

Vì cờ chỉ đổi hành vi của *phiên admin kế tiếp*, người ta dễ kết luận "cờ gần như vô hại".
Đảo lại cho đúng: cờ vô hại thì **tắt cờ cũng vô nghĩa** — shop vẫn giữ token không hết hạn,
đúng thứ Shopify đang bỏ. Mốc rủi ro thật không phải ngày bật, mà là **nhóm shop ngủ đông**:
merchant cài app rồi không bao giờ mở lại admin. Với nhóm đó không có đường migrate nào cả,
và họ chỉ lộ ra khi Shopify thật sự cắt token cũ.

→ Kế hoạch đúng là: bật sớm để nhóm shop hoạt động tự migrate dần qua các phiên bình thường,
song song **đo được** còn bao nhiêu shop chưa migrate, thay vì canh một "ngày bật" an toàn.

## Chỗ dễ sót khi vá đường token trong app

- Nếu mọi call site đều spread `{...shop}` thì sửa **một** helper (`makeGraphQlApi`) là phủ
  gần hết (224/225 call site ở Joy Subscription). Nhưng vẫn phải quét: header
  `X-Shopify-Access-Token` dựng tay, `fetch` thẳng tới `/admin/`, bulk operation, webhook path.
- `initShopify` là seam thứ hai — fallback khi token không refresh được nằm ở đây.

⚠️ Con số 224/225 và danh sách seam là của Joy Subscription tại 2026-08-11; app khác phải grep lại.

→ [[digest-subscriptions-2026-08-11]] · [[2026-08-11-dong-core-rieng-joysub]] · [[app-development]]
