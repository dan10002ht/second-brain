---
type: note
title: Shipped AWS learning platform — commit landed 2026-08-17 (nhập 12 mock SAA-C03, bank 224 → 1004)
summary: Commit landed 08-17 trên `main` — một commit duy nhất nhập 12 đề mock SAA-C03 (780 câu, Tutorials Dojo + Neal Davis), thêm cờ `fixedOrder` giữ nguyên thứ tự đề gốc và cho gate `check.mjs` bỏ qua multi-ratio/domain-mix với đề import; 2 câu cố ý đi ngược đáp án đề gốc vì đề gốc tự mâu thuẫn; không revert, không tín hiệu deploy.
tags: [aws, certification, learning, ai]
created: 2026-08-18
updated: 2026-08-18
source: repo "aws" — git log (1 commit, 2026-08-17, nhánh `main`); hash dưới đây đã verify từ log
---

# AWS — shipped 2026-08-17

> Phần *học được* (parser bóc đề từ PDF hỏng im lặng, thụt lề bản `-layout` là tín hiệu
> đáng tin, không tin report của agent) nằm ở [[digest-aws-2026-08-17]] — không lặp lại ở đây.
> Đây chỉ là **cái gì đã landed**. Bối cảnh: [[aws]], [[aws-certification]].

## Shipped

**`d2da01e` — SAA-C03: nhập 12 mock exam (780 câu)** (`main` = HEAD, nhánh
`content/saa-c03-imported-mocks`; 5 file, +830/−15).

- 6 đề Tutorials Dojo + 6 đề Neal Davis → mock 4..15. Ngân hàng câu hỏi
  **224 → 1004**, lấp hết lesson còn rỗng/mỏng.
- Câu hỏi + option paraphrase sang tiếng Anh, giữ nguyên ràng buộc kỹ thuật và
  **thứ tự option**; explanation viết mới bằng tiếng Việt theo format ✓/✗ shuffle-safe
  của repo (đúng quy ước đã ghi ở [[digest-aws-2026-07-28]]: đề tiếng Anh, giải thích
  tiếng Việt).
- Cờ `fixedOrder` trong `sets.ts`: 12 đề này giữ nguyên thứ tự câu và thứ tự đáp án
  như đề gốc, `Runner.tsx` lấy cờ đó làm **mặc định** cho `shuffleQuestions`/
  `shuffleOptions` — checkbox trộn vẫn dùng được nếu muốn.
- Gate `check.mjs` **bỏ qua multi-ratio và domain-mix** cho mock import. Lý do trong
  commit body: hai chỉ số đó là đặc tính của đề nguồn (có đề tới 25% multi-answer),
  ép lại sẽ làm sai lệch đề. Đây là nới gate có chủ ý, không phải gate hỏng.

**Hai câu cố ý đi ngược đáp án đề gốc** (vì đề gốc tự mâu thuẫn):
- `saa-m6-027` — lời giải nói Lambda container image, ô đánh dấu trỏ ECS Fargate.
- `saa-m14-062` — ô đánh dấu trỏ Macie finding type `SensitiveData:S3Object/Health`,
  loại này không tồn tại; AWS docs xác nhận `Personal` mới bao gồm cả PHI lẫn PII.

**Verify ghi trong commit**: validate 780 câu vs bản parse PDF (0 lỗi về số option,
đáp án, lesson↔domain, số dòng ✓/✗, tham chiếu chữ cái), `check.mjs` PASS 0 issue,
`npm run build` OK. Khớp kỷ luật "đối chiếu ground truth thay vì tin report" ở
[[digest-aws-2026-07-27]].

## Reverted

Không có.

## Deploy notes

Không có tín hiệu deploy: không tag, không version bump, không migration, không
`[deploy-*]`. Repo này deploy theo site tĩnh nên commit content là đủ.

Liên quan: [[digest-aws-2026-08-18]] · [[shipped-aws-2026-08-04]] ·
[[shipped-aws-2026-07-29]] · [[digest-aws-2026-08-03]]
