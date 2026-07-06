# index.md — Bản đồ toàn bộ brain

> LLM đọc file này ĐẦU TIÊN để biết brain có gì, rồi mới drill vào file cụ thể.
> Cập nhật file này mỗi khi thêm/di chuyển note đáng kể.

_Cập nhật: 2026-07-06 · Trạng thái: đã seed 12 project + notes học tập từ ~/projects_

## 🎯 Projects (10-projects/) — việc có mục tiêu + deadline

- [[build-my-brain]] — dựng wiki tri thức cá nhân này (status: active, deadline 2026-07-31).

**AVADA / Shopify apps (work):**
- [[subscriptions]] — Joy Subscription: app bán hàng theo gói định kỳ (deep).
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
- [[moc-learning-pkm]] — **MOC**: điểm vào chủ đề học tập & PKM.

## 📅 Daily (10-daily/) — nhật ký ngày (ephemeral)

_Mỗi ngày 1 file `YYYY-MM-DD.md`. Không liệt kê từng ngày ở đây — dùng skill `/today`._

## 🧭 Decisions (70-decisions/) — quyết định + Why + Tradeoff

_(chưa có) — dùng skill `/decision` để thêm. Mỗi file bắt buộc có Why + Tradeoff._

## 💬 Feedback (feedback/)

- [[write-shorter-notes]] — viết note ngắn, atomic hơn.

## 📦 Sources (sources/) — nguồn thô immutable

_(chưa có)_

## 🗄️ Archive (40-archive/)

_(chưa có)_

---

### Maps of Content (MOC) — điểm vào theo chủ đề
_Khi một chủ đề có nhiều note, tạo một MOC ở đây để gom link._

- [[moc-learning-pkm]] — Học tập & Quản lý tri thức cá nhân (Rust / TS / Python + phương pháp).
