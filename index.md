# index.md — Bản đồ toàn bộ brain

> LLM đọc file này ĐẦU TIÊN để biết brain có gì, rồi mới drill vào file cụ thể.
> Cập nhật file này mỗi khi thêm/di chuyển note đáng kể.

_Cập nhật: 2026-07-17 · Trạng thái: đã seed 12 project + notes học tập từ ~/projects_

## 🎯 Projects (10-projects/) — việc có mục tiêu + deadline

- [[build-my-brain]] — dựng wiki tri thức cá nhân này (status: active, deadline 2026-07-31).

**AVADA / Shopify apps (work):**
- [[subscriptions]] — Joy Subscription: app bán hàng theo gói định kỳ (deep). → [[subscriptions-debug-runbook]] (debug/ops).
- [[joy]] — Joy Loyalty & Rewards SaaS (deep).
- [[joy-subscription-artifacts]] — kho artifact/CDN build của Joy Subscription.
- [[avada-core]] — thư viện lõi auth Shopify + Firebase (Koa/TS).
- [[crm]] — AVADA CRM marketing automation (monorepo + ML).
- [[backup]] — Avada Backups & Restore.
- [[pdf]] — PDF Invoice for Shopify. ⚠️ có secrets hardcode trong RELEASE_NOTE.
- [[shipping-labels]] — in nhãn vận chuyển Shopify.
- [[headless-demo]] — demo store Shopify headless (Next.js 15).

**Khác:**
- [[aws]] — nền tảng tự học AWS & chứng chỉ.
- [[detect]] — Pipe Counter, AI on-device (YOLOv8 + Flutter).
- [[customer-manager-mono]] — quản lý khách/đơn cho cơ sở may đo (WhatsApp).

## 🔁 Areas (20-areas/) — trách nhiệm duy trì lâu dài

- [[shopify-app-dev]] — phát triển & bảo trì app Shopify tại AVADA (mảng chính).
- [[dev-skills]] — kỹ năng lập trình (JS/TS/Node chính; Rust/Python học thêm).
- [[aws-certification]] — học AWS & lấy chứng chỉ.

## 📚 Resources (30-resources/) — chủ đề & học tập

**Tech stack dùng hằng ngày (tham chiếu xuyên project):**
- `shopify/` — [[app-development]]: extensions, billing, Polaris, embedded app.
- `firebase/` — [[firestore-multitenant]]: cô lập dữ liệu theo `shopId`.
- `patterns/` — [[controller-service-repository]], [[monorepo-yarn-workspaces]].
- [[caching-layers]] — caching qua các layer (client→CDN→proxy→app→Redis→DB): 3 pattern lõi + 3 cái khó (invalidation, key, stampede).

**Học tập:**
- `learns/rust/`
  - [[borrow-checker]] — mượn tham chiếu an toàn tại compile time.
- `learns/typescript/`
  - [[discriminated-unions]] — tagged union + exhaustiveness check.
- `learns/python/`
  - [[asyncio-gotchas]] — các bẫy asyncio thường gặp.
- `learns/java/`
  - [[dsa]] — luyện cấu trúc dữ liệu & giải thuật (Java).

## 🧠 Notes (notes/) — Zettelkasten, note atomic liên kết

- [[atomic-notes-principle]] — mỗi note một ý, liên kết bằng wiki-link.
- [[learning-in-public]] — viết ra để học sâu hơn.
- [[rust-ownership]] — mô hình sở hữu một owner trong Rust.
- [[ts-type-narrowing]] — thu hẹp union type theo control flow.
- [[python-asyncio-blocking]] — đừng chặn event loop asyncio.
- [[subscription-installment-horizon-digest]] — root cause race auto-swap + gotchas Horizon theme block (Joy Subscription).
- [[subscription-digest-2026-07-09]] — bug MRR hardcode v5, best-seller API Shopify, bẫy selective-deploy CI, dedup BigQuery, multi-agent workflow.
- [[subscription-digest-2026-07-10]] — soi Redis prod qua GCE+IAP tạm, bẫy attribution cost BigQuery, pattern controller cho widget AOV, gotcha option widget subscription.
- [[subscription-digest-2026-07-11]] — giá installment ăn theo variant (bỏ enforceFixedPrice), 2 mode partial/defer-last, bug volume discount đa tầng (display-path/discount code AOV/stale lib), gotcha 2 cart-form + AOV chiếm add-to-cart, deploy 1 block đa theme.
- [[subscription-digest-2026-07-12]] — bỏ hẳn app-side capture/reprice volume (vol% đến từ Shopify discount code của AOV — supersede giả định 07-11), update installment chỉ đụng metafield bỏ validate giá, verify helper phải rebuild lib.
- [[subscription-digest-2026-07-13]] — cart-transform chỉ one-time (sub expansion ở contract-create), 2 quy ước cycleIndex, property `_`prefix ẩn/hiện, convert snippet→Horizon block, ẩn badge native AOV + đọc giá render (tránh double-discount), rtk/Serena chỉ tối ưu leaf-ops, BigQuery billing gộp nhiều project → phồng ~7×.
- [[subscription-shipped-2026-07-13]] — commit landed 07-13: redis distributed lock chống double-charge + syncPlansFrequency (v2.33.76), Volume Bundle quantity-break (SB-13947, chưa merge), Dynamic Widget Editor block system (WIP), LTV order-revenue analytics + deploy-functions staging.
- [[subscription-digest-2026-07-14]] — build Dynamic Widget Editor 3-pane theo pattern SubscriptionBox/FixedBundleBox + verify UI thật bằng screenshot; root cause race sync orders lúc contract-create (gate theo trigger); gotcha Yup stripUnknown, barrel export, Polaris v12 Card.
- [[subscription-shipped-2026-07-14]] — commit landed 07-14: guard chống double-charge ship rồi REVERT sạch cùng ngày (v2.33.78/80 → v2.33.82), LTV analytics merged master (v2.33.83), Joy rebrand landed, Dynamic Widget Editor + Discovery Product build tiếp (chưa merge).
- [[subscription-digest-2026-07-15]] — tối ưu stored-procedure BigQuery (partition-prune + verify equivalence), logic report legacy pricing v3, gotcha widget requires_selling_plan/default-option, CSS theme ebay-bootstrap đè select.
- [[subscription-digest-2026-07-16]] — one-time bundle qua Cart Transform `expand` (không `update` Plus-only), installment discount 1 Shopify Function 2 mode per-product metafield, flag ẩn `enableAovBundleSwap`, bug placeholder-date `WIDGET_V4_DATE` đã thành quá khứ, Shopify Functions limits/register/deploy, self-healing metafield/discount lúc save.
- [[subscription-shipped-2026-07-16]] — commit landed 07-16: Widget V4 merged (v2.33.91) + polish, RE-APPLY guard double-charge scoped (v2.33.90, đóng câu hỏi mở 07-14), fix price-sync stuck PENDING (v2.33.88), fix LCP Home (v2.33.89); WIP one-time cart-transform + defer-last-discount (2 migration), shipping-rate FX SB-14315, Discovery multi-currency.
- [[moc-learning-pkm]] — **MOC**: điểm vào chủ đề học tập & PKM.

## 📅 Daily (10-daily/) — nhật ký ngày (ephemeral)

_Mỗi ngày 1 file `YYYY-MM-DD.md`. Không liệt kê từng ngày ở đây — dùng skill `/today`._

## 🧭 Decisions (70-decisions/) — quyết định + Why + Tradeoff

- [[2026-07-07-brain-lay-gi-tu-avader-folder]] — chỉ mượn daily/decisions/skills từ avader-folder, bỏ agent-board & role system (review 2026-10-07).
- [[2026-07-08-installment-mode-design]] — thiết kế installment 2 mode (partial vs defer-last), giá bám variant product (review 2026-10-08).

## 💬 Feedback (feedback/)

- [[write-shorter-notes]] — viết note ngắn, atomic hơn.
- [[subscription-work-style]] — text khách tiếng Anh, batch commit type-role-scope, ràng buộc kiến trúc fix swap.

## 📦 Sources (sources/) — nguồn thô immutable

_(chưa có)_

## 🗄️ Archive (40-archive/)

_(chưa có)_

---

### Maps of Content (MOC) — điểm vào theo chủ đề
_Khi một chủ đề có nhiều note, tạo một MOC ở đây để gom link._

- [[moc-learning-pkm]] — Học tập & Quản lý tri thức cá nhân (Rust / TS / Python + phương pháp).
