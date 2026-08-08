---
type: note
title: Shipped Joy Subscription — commit landed 2026-08-07 (v2.34.58)
summary: Commit landed 08-07 — master chỉ nhận 1 MR (`v2.34.58`, endpoint clientApi công khai tạo CRM lead cho demo site); trên nhánh: bịt rò rỉ tên plan/số usage/lời mời nâng gói khi Sidekick bị pricing-gate, và khôi phục `shop.widgets` trên `/shops` — undo có chủ đích một tối ưu perf 0.6–1.4s; không revert trên master.
tags: [subscription, shopify, avada, backend, performance]
created: 2026-08-08
source: repo "subscriptions" — git log (2026-08-07); mọi hash + tag dưới đây lấy nguyên từ log
---

# Joy Subscription — shipped 2026-08-07

> Ngày trước: [[shipped-subscriptions-2026-08-07]] · [[digest-subscriptions-2026-08-07]].
> Bối cảnh project: [[subscriptions]].

Log ngày này rất mỏng (4 commit thật) nhưng có **hai thứ đáng dừng lại**: một endpoint
*public* mới trên master, và một lần undo tối ưu perf vừa ghi vào brain hôm qua.

## Shipped

### Vào master — 1 MR

- **`395302ec6` — tag `v2.34.58`, MR !2450** — *"Feat - be - public clientApi endpoint tạo
  CRM lead cho demo site"*. Log chỉ có dòng tiêu đề merge, **không có diff stat** nên
  không biết endpoint đụng file nào. Xem ⚠️ bên dưới — chữ "public" ở repo này có tiền sử.

### Còn trên nhánh

- **`fdab8c02c`** (`fix/sidekick-plan-gate-message`) — *Sidekick lộ tên plan, số usage và
  lời mời nâng gói khi tool bị gate*. Ba đường rò cùng một thông tin:
  - `pricingGate` bỏ `buildLimitMessage`, cả 3 nhánh từ chối trả về một hằng
    `AGENT_TOOL_GATE_MESSAGE` trung tính ("This action isn't available on the shop's
    current plan") — đây là nguồn của câu "the Free plan allows up to 50 active
    subscriptions" lọt ra chat.
  - `toolController` bỏ `upgradeRequired` khỏi body 403 — chính cờ đó mời gọi giọng upsell.
  - extension `sidekick-subscription-tools`: `callGateway` **vứt body khi non-2xx** và chỉ
    báo status trần, nên 403 tới Sidekick không kèm lý do và **model tự bịa** giải thích về
    permission/plan. Đọc body trước rồi mới surface lỗi gateway.

  Ranh giới được giữ có ý thức: `ToolGateBanner` trong app **vẫn** hiện chi tiết plan +
  CTA Upgrade — đó là UI của app, không phải chat của agent. Nối tiếp mạch audit "cấm
  quảng cáo trong agent" đã thấy bên `pdf` ở [[shipped-pdf-2026-08-07]] (Sidekick SB-14254).
- **`9e7b7a084`** (`feat/restore-shop-widgets`) — khôi phục `shop.widgets` trên payload
  `/shops`. Đây là undo *một nửa* commit `03322bf58`; xem
  [[2026-08-08-khoi-phuc-shop-widgets]] (đề xuất cùng đợt) và ⚠️ bên dưới.
- `ace6a2d8f` (`feat/sb-13947-volume-bundle`) — i18n 7 dòng cho Volume Bundle. Ghi lại chỉ
  vì nó cho thấy nhánh SB-13947 vẫn sống (theo dõi từ [[subscription-shipped-2026-07-13]]).

## Reverted

Không có revert nào trên master. `9e7b7a084` **là** một revert về bản chất (undo phần
`getCrmWidgets` của `03322bf58`) nhưng đang ở nhánh, chưa merge.

## Deploy notes

- **`824f641e6` mang cờ `[deploy-all]`** — nhưng chỉ đổi 1 dòng trong `.gitlab/ci/staging2.yml`
  để trỏ staging2 vào `fix/sidekick-plan-gate-message`. Tức là **cờ deploy ở đây để đẩy
  staging2, không phải để ship prod** — đúng pattern đã thấy ở `9939823ae` bên `pdf`.
- Version bump: `v2.34.58` (từ `v2.34.53` ở [[shipped-subscriptions-2026-08-07]]).
- Không có file migration trong log ngày này.
- Nếu `9e7b7a084` được merge: nó **thêm một call `public.avada.io` vào critical path**
  của mọi lần load app, timeout `helpers/api` là 20s. Đây là thay đổi hiệu năng, không
  phải thay đổi tính năng — nên đo lại boot time sau khi deploy (kỷ luật đo A/B đã ghi ở
  [[digest-subscriptions-2026-08-03]] và [[do-layout-shift-bang-browser-automation]]).

## ⚠️ Cần xác nhận

**1. Endpoint `clientApi` *public* mới vs quyết định xoá hẳn `publicApi`.**

| Nguồn | Nói gì |
|---|---|
| [[digest-subscriptions-2026-07-20]] + [[shipped-subscriptions-2026-07-21]] | app **xoá hẳn `publicApi`** thay vì vá guard, secrets đưa về env — hướng đi là *bỏ bề mặt không auth* |
| commit `395302ec6` (`v2.34.58`, MR !2450, đã trên master) | thêm **"public clientApi endpoint"** tạo CRM lead cho demo site |

Hai cái có thể cùng đúng — `clientApi` là namespace khác `publicApi`, và endpoint tạo lead
cho demo site có thể có rate-limit/verify riêng. Nhưng brain hiện chỉ ghi hướng "bỏ bề mặt
public", nên **một endpoint public mới cần được ghi nhận rõ ràng chứ không lặng lẽ**. Cần
xác nhận: endpoint này auth/chống lạm dụng bằng gì? Nó có nằm ngoài phạm vi quyết định
07-20 không? (Tiền lệ đáng lo: lỗ tải PDF không auth ở [[digest-subscriptions-2026-07-21]],
IDOR contract lookup ở [[shipped-subscriptions-2026-07-24]].)

**2. `shop.widgets`: bỏ vì perf (07-08-07) vs khôi phục theo yêu cầu (08-07).**

| Nguồn | Nói gì |
|---|---|
| [[digest-subscriptions-2026-08-07]] | field `widgets` bị bỏ **có chủ đích** vì `getCrmWidgets` tốn **0.6–1.4s trên critical path mọi lần load app**; "nhét lại vào `Promise.all` của `/shops` là undo quyết định đó" |
| commit `9e7b7a084` (08-07) | khôi phục **"by request"** để `shop.widgets` có mặt ngay frame đầu, consumer đọc đồng bộ thay vì xử lý trạng thái "chưa biết" |

Đây **không phải hai bên nói ngược nhau về sự thật** — commit body tự thừa nhận đúng cái
giá 0.6–1.4s đó. Nhưng nó là **đảo hướng ưu tiên**: hôm qua brain ghi "bỏ đi là quyết định
perf", hôm nay đưa lại vì DX/đúng đắn của consumer. Cần người thật chốt và ghi lý do —
đã tách ra thành đề xuất decision riêng: [[2026-08-08-khoi-phuc-shop-widgets]].

## Liên quan

[[shipped-subscriptions-2026-08-07]] · [[digest-subscriptions-2026-08-07]] ·
[[shipped-subscriptions-2026-08-06]] · [[digest-subscriptions-2026-08-03]] ·
[[shipped-subscriptions-2026-07-21]] · [[digest-subscriptions-2026-07-20]] ·
[[subscriptions]] · [[subscriptions-debug-runbook]]
