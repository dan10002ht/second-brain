---
type: note
title: Joy Subscription digest 2026-07-24 — shipping name, race auto-swap, PubSub leak, Horizon blocks
summary: Bug tên shipping recurring (SB-14649) + race auto-swap lúc contract-create, PubSub singleton leak OOM, deploy wasm không rebuild, và cụm gotcha Horizon theme block + Slack voice.
tags: [subscription, shopify, debug, bigquery, redis]
created: 2026-07-24
source: project "subscriptions" (Joy Subscription) session history
---

# Joy Subscription digest 2026-07-24 — chỉ phần MỚI

Chỉ ghi cái CHƯA có trong loạt digest 07-09→07-22. Đã bỏ phần trùng (discount freeze vào
line-attribute, ràng buộc kiến trúc fix swap, self-heal metafield/discount...).

## Bugs (root cause)
- **Tên shipping recurring "Subscription shipping" (SB-14649).** Từ cycle 2, Shopify tự gán **rate rẻ
  nhất** cho recurring order; app tạo rate $0 tên "Subscription shipping" lúc install → recurring rơi vào
  đó. Fix: derive tên từ shipping line của **order gốc** (Order `ShippingLine` không có `presentmentTitle`
  → derive từ `title`). Xác nhận theo Shopify Help Center.
- **Backfill tên shipping ghi đè tên đúng.** Logic write chỉ lấy `nodes[0]` shipping line của contract →
  ghi đè tên đã đúng ở contract có nhiều shipping line. Fix: helper `resolveShippingOptionUpdate` quyết
  từ **TẤT CẢ** shipping line + guard chỉ write khi Shopify chưa set đúng. **Dry-run read-only bắt được
  đây là regression prod** trước khi write — good practice.
- **Auto-swap không áp cho upcoming order khi swap fire lúc contract-create (race).** `swapForNextBilling`
  set cờ `isAutoSwapUpdate`; guard re-sync webhook `isActive && !isManual && !isAutoSwapUpdate` bỏ re-sync
  trong `RACE_CONDITION_WINDOW_MS` (10s). Trên create path swap xảy ra <10s sau → cycle 2..N giữ product
  trước swap. Fix: luồn `trigger` qua RUN_AUTO_SWAP → cho re-sync khi `trigger === 'contract_create'` —
  **KHÔNG** bỏ guard (nó bảo vệ skip giữa vòng đời) và **KHÔNG** dùng Cloud Task (đổi kiến trúc). Chứng
  minh bằng BigQuery changelog forensics.
- **PubSub singleton memory leak (sawtooth OOM kinh điển).** `publishTopic` gọi `new PubSub()` mỗi lần
  publish → leak gRPC channel → apiHookV2 leo ~350-500 MB/h tới trần 4GiB rồi OOM. Fix: đưa `new PubSub()`
  ra **module scope (singleton)** — Google/Firebase docs khuyến nghị đúng vậy, an toàn trong Cloud/Firebase
  Functions. Sau fix memory phẳng ~250 MB (giữ traffic cố định để loại yếu tố tải) → right-size 4GiB→1GiB.
- **`shopify app deploy` KHÔNG rebuild wasm khi `[extensions.build] command = ""` rỗng.** Chỉ upload
  `dist/function.wasm` cũ; dist stale → deploy logic function CŨ dù đã "redeploy". Root cause của cuộc săn
  "registered + redeployed nhưng cart vẫn không expand". Verify wasm deployed có chứa string literal mới.

## Decisions / Gotchas kiến trúc
- **Mỗi app chỉ được MỘT cart transform function / shop (giới hạn cứng Shopify).** Muốn 2 hành vi
  (installment expand + one-time price bump) phải **mở rộng 1 function bằng nhánh**, không tạo function thứ 2.
- **Line property client-controlled là vector abuse cho discount function.** `_joy_installment_mode` có thể
  giả qua `POST /cart/add.js`. Phòng thủ: function chỉ discount khi ĐỦ điều kiện (selling plan whitelist +
  bundle metafield + mode hợp lệ) + check backend — không tin property đơn thuần.
- **Hai cơ chế discount hành xử khác nhau downstream.** Selling-plan discount **nướng thẳng vào** giá line;
  app *automatic* discount (vd ship-mode saving) là allocation **riêng, không nướng vào line**. Nên recurring
  order / email / tooltip đọc giá line hiện số **trước discount** (root cause bug `InlineProductPriceTooltip.
  finalPrice` — chỉ trừ `planDiscount` baked, bỏ allocation `productDiscounts`).
- **Managed install (`use_legacy_install_flow = false`) không tự register cart transform / không tự cấp
  scope mới.** Phải chạy `cartTransformCreate` để register, và ép re-grant scope qua OAuth/`updateScopes`
  sau khi deploy scope mới lên Partner app. Lưu ý: `shopify app deploy` trỏ `shopify.app.toml` = app PROD →
  chọn config staging để tránh deploy nhầm prod.

## Cụm gotcha Shopify Horizon theme block (durable cho custom Horizon sau này)
- `{% javascript %}` không lồng trong tag khác được; convention Horizon = `{% stylesheet %}`/`{% schema %}`
  top-level + inline `<script>`.
- Color var (`--color-foreground`, `--color-primary-button-background`...) chỉ tồn tại trong class
  `color-scheme-*` → root block cần `class="color-{{ block.settings.color_scheme }}"` + setting `color_scheme`,
  không thì màu resolve rỗng.
- Horizon bắn `variant:update`/`variant:selected` trên `document` (không phải `change` trên form) và set URL
  `?variant` **bất đồng bộ** (`yieldToMainThread`) → đọc `data-variant-id` trên option element **đồng bộ**
  thay vì URL để tránh lag giá.
- Liquid không dùng `| default` bên trong lookup `[...]` (`all_products[x | default: 'y']` fail) — assign trước.
- Metafield type `json` trong Liquid cần `.value` (`mf.value | json`).
- Property `_`prefix bị ẩn khỏi cart/checkout; dùng property không prefix để hiện lựa chọn cho khách.
- **Theme Check (MCP) lỏng hơn theme editor thật:** editor từ chối thứ Theme Check cho qua (text setting
  `default: ""` rỗng, `{`/`}` trong `default:` filter, schema `name` >25 ký tự, label >70 ký tự,
  `{% javascript %}` lồng). Validate ở editor thật, không chỉ Theme Check.

## Techniques
- **BigQuery cost hygiene:** bảng billing-export **dùng chung mọi project Avada** → filter theo
  `avada-subscription-app` hoặc cost phồng (~7×, từng dẫn tới chẩn đoán sai). Changelog forensics: query bảng
  sharded/partition/cluster, prune theo partition + cluster key (`shop_id`, `subscription_contract_id`),
  dry-run check bytes trước. (Quy tắc của user.)
- **Soi Memorystore Redis bằng raw Python socket:** khi không cài được redis-cli (GCE probe VM
  `--no-address` không có internet), nói RESP protocol qua `socket` built-in (`SCAN`/`GET`/`TTL`) qua tunnel
  GCE+IAP. (Mở rộng note GCE+IAP Redis sẵn có.)

## Feedback
- **Khớp giọng Slack của user khi soạn tin danh nghĩa anh ấy:** casual, chữ thường, viết tắt nhiều
  (e, r, k, nhá, ạ), văn xuôi liền, **KHÔNG** heading/bullet/emoji. Anh ấy dị ứng format kiểu AI
  ("sao như AI nhắn vậy? ... sao cứ có mấy cái icon"). Đọc tin gần đây của anh để calibrate tông trước.

Liên quan: [[subscriptions]] · [[subscriptions-debug-runbook]] · [[subscription-work-style]] ·
[[digest-subscriptions-2026-07-22]] · [[caching-layers]] ·
[[shipped-subscriptions-2026-07-25]] (commit landed của chính các fix trên) ·
[[digest-artifact-2026-07-24]] (pipeline artifact/hosting của app này) · [[shopify-app-dev]].
