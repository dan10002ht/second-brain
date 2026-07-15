---
type: note
title: Subscriptions digest 2026-07-14 — Dynamic Widget Editor build + auto-swap contract-create race
summary: Build editor 3-pane theo pattern SubscriptionBox/FixedBundleBox, verify UI thật bằng screenshot; root cause race sync orders lúc contract-create (fix gate theo trigger); gotcha Yup stripUnknown, barrel export, Polaris v12 Card, eslint-fix repo-wide.
tags: [subscription, shopify, debug, polaris, patterns]
created: 2026-07-14
source: project "subscriptions" session history (2 session: Dynamic Widget Editor + installment/auto-swap)
---

# Subscriptions — 2026-07-14

Hai session lớn: (1) build **Dynamic Widget Editor** (3-pane, drag-drop block) từ đầu qua superpowers subagent-driven + polish UI dài; (2) tiếp tục installment fixed-bundle + fix một **race sync orders** thật ở auto-swap. Chỉ ghi phần durable, chưa có trong brain. Tiếp nối [[subscription-shipped-2026-07-13]] (editor liệt kê là WIP) và [[subscription-installment-horizon-digest]].

## Feedback (cách làm việc)
- **UI phải verify bằng mắt, không chỉ eslint+logic.** User đẩy lại nhiều lần ("sao layout xấu vậy", "vào subscription box xem"). Bài học: với việc UI, tự chạy app + screenshot/inspect so với reference, đừng tự đánh giá "khớp" ở mức cấu trúc (tabs/tiers/badge) rồi hứa quá. → củng cố [[write-shorter-notes]]? không — đây là working-style, gần [[subscription-work-style]].
- **Theo structure page khác, đừng "phá cách".** User: "save discard dùng save top bar giống các page khác chứ? phá cách thì cũng k tốt." → dùng `SaveTopBarContext` + `SaveChangeTopBar` chung, không tự chế TopBar. Củng cố [[feedback-follow-conventions]].
- **1 file = 1 component (atomic design).** Vi phạm rule `components.md` (nhét `EditorBody` + `WidgetEditor` chung file) bị nhắc. Củng cố [[feedback-follow-conventions]].
- **Custom cho khách nước ngoài → text/label tiếng Anh, không tiếng Việt.** Củng cố [[subscription-work-style]].

## Decisions
- **Editor mới là layer opt-in song song**, giữ widget cũ (Block1-6 legacy) nguyên vẹn; code dynamic chỉ trong `DynamicWidget/blocks/` (chỉ dùng bởi `layout='dynamic'`). Why: additive, giữ "vùng cấm giá", giảm rủi ro.
- **Badge per-plan theo *index option*** (không theo id) + hỗ trợ cả auto discount lẫn manual — vì `layoutTree` là global per-shop còn plan tùy sản phẩm.
- **Custom cho 1 merchant (Horizon theme): code custom Liquid block đọc metafield app** (biến global `AVADA_BUNDLE` / `AVADA_SUBSCRIPTION`) thay vì mở rộng app widget. Why: pixel-match mockup, chỉ 1 khách, Horizon hỗ trợ theme block. → liên quan [[subscription-digest-2026-07-13]] (convert snippet→Horizon block).

## Bugs (root cause)
- **Race sync orders lúc contract-create (auto-swap).** Flow create: `persistContractData → tạo orders (product gốc) → RUN_AUTO_SWAP` nhưng create-service **skip re-sync** (guard `!isAutoSwapUpdate`). Auto-swap bắn thêm `subscriptionContractUpdate`; hook Update sync trước với data **sau swap**, hook Create sync sau với snapshot **trước swap** → order create giữ product cũ (stale), sai. **KHÔNG phải lag** (LAG changelog rất nhỏ). Fix: cho re-sync riêng cho case create, gate theo **`trigger === 'contract_create'`** (không dùng `edited=true`) — an toàn vì lúc create chưa có skip/edit của khách để bảo vệ. 3 file, 17/17 test. Ràng buộc user đặt: **không** update mirror product line trực tiếp (break functions memory + shopify bucket), **không** deferred re-sync qua cloud task (đổi kiến trúc app).
- **Yup `stripUnknown: true` (validate.js) xóa mọi field không khai báo trong schema** → PUT /widget-settings làm mất field hiện có. Fix: khai báo đủ field; field kiểu container tùy ý phải là `yup.mixed()` chứ không `yup.object()` (object rỗng vẫn bị strip nội dung).
- **Barrel export sai: `export {default as X}` (named) nhưng import default** → block `undefined` lúc runtime (card render trắng). Gate/jest bắt được.
- **Plan card render trắng vì đọc sai field:** block giả định `plan.label`, nhưng label thật lấy từ `getPlanDisplayText(plan).title` (theo locale). Fix: enrich `productPlans` với `label` trước khi truyền vào blockContext.

## Techniques / Gotchas
- **`yarn eslint-fix` reformat repo-wide 100+ file** (noise trong working tree). → chỉ lint file cụ thể: `npx eslint <file>`. `git restore .` bị auto-mode chặn (bulk) → restore theo path cụ thể.
- **Polaris v12: `Card` render thành `.Polaris-ShadowBevel` + `.Polaris-Box`, KHÔNG có `.Polaris-Card`.** CSS full-height phải target 2 class đó. Panel "trôi nổi" là do Card không stretch trong Grid cell.
- **Verify UI thật:** copy profile Chrome đã login → Playwright mở `/widget-editor` → inspect computed styles + screenshot. Nhớ **xoá bản copy sau khi xong** (chứa cookie thật). Cẩn thận HMR chưa build kịp → ảnh cũ; check DOM trước khi tin screenshot.
- **Pattern editor chuẩn trong app:** học từ `SubscriptionBox`/`FixedBundleBox` (mỗi cái có `Editor/` + `Render/`): shared `Editor.scss` panel `height: calc(100vh - 65px)` để fill cột; LeftPanel = section header (`InformationContainer`) + rows `NavigationItem` có icon; segmented tabs bằng `GroupButtons` ("Blocks | Templates", "Design | Settings"); route dạng `/settings/subscription-box/create`, `/settings/bundle-box/create`.
- **BigQuery orders_changelog:** query bảng **shard hoặc clustered**, không thì cost rất cao. (bổ sung [[subscription-digest-2026-07-13]] về billing gộp project.)
- **Workflow (thorough.js pattern):** effort tier theo phase (low cho phase cơ học) để giảm token; rtk + Serena chỉ tối ưu leaf read-ops, không đụng phần generation tốn token nhất (đã có ở [[subscription-digest-2026-07-13]]). "Gate fail" có thể là **báo động giả** do `eslint-fix` reformat repo-wide làm phồng diff — verify bằng regression test trên cây đã dọn.

## Liên kết gợi ý
[[subscription-shipped-2026-07-13]] · [[subscription-installment-horizon-digest]] · [[subscription-digest-2026-07-13]] · [[subscriptions-debug-runbook]] · [[subscription-work-style]] · [[feedback-follow-conventions]] · [[app-development]] (Polaris)
