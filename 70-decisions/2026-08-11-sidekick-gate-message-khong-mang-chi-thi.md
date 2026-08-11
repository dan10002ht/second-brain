---
type: decision
title: Ràng buộc "không nhắc gói/giá" của Sidekick sống ở instructions.md, không ở tool response
summary: Joy Subscription gỡ chỉ thị agent-facing vừa nhét vào `AGENT_TOOL_GATE_MESSAGE` một commit trước đó — tool response trả về một câu trần thuật duy nhất ("This action isn't available for this shop."), còn lệnh cấm suy đoán/upsell nằm ở `instructions.md` của từng extension; lý do là content policy của Shopify cấm "embedded directives" trong response và kiểm ở runtime.
tags: [subscription, shopify, avada, extensions, ai]
created: 2026-08-11
updated: 2026-08-11
review: 2026-11-11
source: repo "subscriptions" — git log 2026-08-10, commit `f2a623c9c` → `f2269ded5` (nhánh `fix/sidekick-plan-gate-message`, chưa merge master)
---

# Thông điệp gate của Sidekick không được mang chỉ thị

**Bối cảnh:** khi một tool của Sidekick bị pricing-gate, app phải nói "không dùng được" mà
**không** để agent biến câu đó thành lời mời nâng gói. Chuỗi này đã đi qua 3 vòng:

| Vòng | Commit | Cách làm |
|---|---|---|
| 1 (08-07) | `fdab8c02c` — [[shipped-subscriptions-2026-08-08]] | một hằng trung tính: *"This action isn't available on the shop's current plan"*, bỏ `buildLimitMessage` và cờ `upgradeRequired` |
| 2 (08-10) | `f2a623c9c` | câu trên **vẫn là** một lời mời nâng gói ("agent chỉ việc viết nốt câu"), nên bỏ chữ "plan" **và** thêm **chỉ thị agent-facing** vào `AGENT_TOOL_GATE_MESSAGE` bảo agent báo lại rồi dừng (mượn thủ thuật của `get_subscriber` not-found, SB-14374); đồng thời cấm giọng upsell trong `instructions.md` của 3 extension |
| 3 (08-10) | `f2269ded5` | **gỡ chỉ thị khỏi tool response.** Message về lại một câu trần thuật: *"This action isn't available for this shop."* Ràng buộc chỉ còn sống ở `instructions.md` |

**Quyết định (vòng 3):** tool response chỉ mang *sự kiện*; mọi thứ mang tính *chỉ dẫn cho
agent* chuyển hết sang `instructions.md` của từng extension.

## Why

- Content and safety policy của Shopify Sidekick (https://shopify.dev/docs/apps/build/sidekick)
  liệt **"embedded directives"** vào những thứ một tool response **không được** mang, và
  **response bị kiểm lúc runtime**. Chỉ thị của vòng 2 nằm đúng trên bề mặt bị kiểm đó.
- `instructions.md` là bề mặt Shopify **chỉ định** cho việc hướng dẫn agent, và nó được kiểm
  **lúc deploy** chứ không phải từng response — sai ở đó thì biết trước khi ship, sai trong
  response thì hỏng lúc khách đang chat.
- Cùng policy cấm thẳng nudge nâng gói, nên cách diễn đạt của vòng 1 (`"current plan"`) tự nó
  đã sai — bỏ chữ "plan" không phải chuyện văn phong.
- Phần `instructions.md` đã ship ở vòng 2 và đang chạy trên staging2, nên vòng 3
  **không cần redeploy extension** — đổi ngược lại cũng không mất gì.

## Tradeoff

- **Được:** response nằm trong phạm vi policy, kiểm được lúc deploy; test assert được **cả hai
  vế** — không chứa chữ plan/price/upgrade, **và** không phải chỉ thị (không động từ mệnh
  lệnh, không ngôi thứ hai, không quá một câu).
- **Mất — không còn ép được hành vi agent theo từng response.** `instructions.md` là gợi ý
  mức system prompt: model có thể phớt lờ, và không có gì ở runtime bắt nó dừng. Vòng 2 sinh
  ra chính vì vòng 1 tin rằng "câu trung tính là đủ" — nay ta lại quay về tin vào một tầng
  yếu hơn, chỉ khác là tầng đó **được phép tồn tại**.
- **Mất — luật bị nhân bản 3 chỗ.** `sidekick-subscription-tools`,
  `create-subscription-action`, `create-product-bundle-action` mỗi cái giữ một bản. Thêm
  extension thứ 4 mà quên chép là im lặng hở lại.
- **Mất — thông tin cho merchant nghèo đi.** "This action isn't available for this shop" không
  nói *vì sao*. Bù lại ở UI app: `ToolGateBanner` **vẫn** hiện chi tiết plan + CTA Upgrade —
  ranh giới cố ý giữ (UI của app ≠ chat của agent), xem [[shipped-subscriptions-2026-08-08]].
- `reason: 'plan_too_low'` vẫn nằm trong body 403; hôm nay `callGateway` chỉ đọc `error` nên nó
  không tới agent — **nhưng đó là một sự trùng hợp về code, không phải một rào chắn**. Ai sửa
  `callGateway` để đọc thêm body sẽ mở lại đúng lỗ rò này.

## Phương án đã bỏ

- **Giữ chỉ thị trong response** (vòng 2) — bỏ vì vi phạm policy, và vi phạm ở bề mặt bị kiểm
  runtime.
- **Trả 403 trần không kèm lý do** — đã thử ở tiền sử: extension `callGateway` vứt body khi
  non-2xx làm agent **tự bịa** giải thích về permission/plan ([[shipped-subscriptions-2026-08-08]]).
  Im lặng không phải là an toàn.

## Cần theo dõi tới ngày review

1. Chuỗi này **chưa vào master** (`v2.34.62` không chứa nó). Nếu tới 2026-11-11 vẫn nằm nhánh
   thì quyết định này chỉ mô tả staging.
2. Có ai quan sát được agent **vẫn** upsell dù `instructions.md` đã cấm không? Đó là bằng chứng
   phân biệt được duy nhất cho câu hỏi "tầng deploy-time có đủ không"
   ([[bang-chung-phan-biet-duoc]]).
3. Extension mới thêm vào có được chép luật không.

→ [[shipped-subscriptions-2026-08-11]] · [[shipped-subscriptions-2026-08-08]] ·
[[shipped-subscriptions-2026-08-04]] · [[subscriptions]] · [[bang-chung-phan-biet-duoc]]
