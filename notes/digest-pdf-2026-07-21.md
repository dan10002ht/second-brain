---
type: note
title: Digest PDF Invoice 2026-07-21 — tracking "Claim now" và kỷ luật phân tầng controller/service/repository
summary: Cờ trạng thái trong DB không thay được tracking hành vi (bị set ở 5 chỗ), Firestore phải nằm ở repository chứ không phải service, và mutation check là cách rẻ để chứng minh test thật sự bắt lỗi.
tags: [pdf, invoice, shopify, firestore, patterns, avada]
created: 2026-07-21
updated: 2026-07-21
source: project "pdf" — session history (mined 2026-07-21)
---

# Digest PDF Invoice — 2026-07-21

## Feedback

- **Firestore KHÔNG được nằm trong service.** Phân tầng của repo: controller = transport (đọc `ctx.req.body`, gọi service), service = business logic, repository = làm việc với DB — **kể cả `runTransaction`** (`orderRepository.js:60` đã có tiền lệ). Mình đã viết Firestore + transaction thẳng trong service và bị bắt lỗi đúng. *How to apply:* trước khi viết tầng mới, đọc file đại diện của cả 3 tầng để bắt chước, và khi tách tầng thì tách **cả test** theo đúng 2 tầng. → [[controller-service-repository]], [[feedback-follow-conventions]]
- **Convention body của repo pdf là `ctx.req.body`, không phải `ctx.request.body`** (Firebase Functions tự parse, `koa-body` không được mount).
- **Nhánh + MR, không commit thẳng master** — làm xong mới tạo nhánh `feat/new-templates-claim-tracking` rồi push + mở MR.
- `docs/` bị gitignore trong repo này → spec viết ra không commit được, chỉ nằm local (cần nhớ khi bàn giao).

## Decisions

- **Phải gắn tracking mới, không query cờ `shop.newTemplatesUnlocked` sẵn có.** *Why:* cờ đó được set ở **5 chỗ**, chỉ 2 chỗ là hành vi merchant tự bấm "Claim now" → con số BA muốn không tách được. *Tradeoff:* thêm code + hook thay vì query 1 phát, đổi lại số liệu đúng nghĩa.
- **Tách 2 nguồn bằng field `source`**: merchant tự bấm "Claim now" (banner Home) vs team bấm "Add selected (N)" ở DevZone (`devZone.service.js`). Chính chỗ gating `source` là chỗ dễ sai nhất → viết test riêng cho nó.

## Techniques

- **Mutation check để chứng minh test có giá trị**: cố tình bỏ điều kiện gating `source` → đúng 3 test fail như dự đoán → restore. Rẻ hơn nhiều so với tin vào "246/246 pass".
- **TDD thật sự chạy được ở repo này** (jest infra sẵn): viết test đỏ trước → implement → 26 test mới, full suite 246/246 + lint sạch.
- Bẫy test hay gặp: **mock call count không tự reset giữa các case** → phải reset trong `beforeEach`.

## Liên kết gợi ý

[[pdf]] · [[controller-service-repository]] · [[shopify-app-dev]] · [[digest-pdf-apiv1-workflow-2026-07-21]] · [[app-development]]
