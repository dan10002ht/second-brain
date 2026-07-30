---
type: note
title: Shipped PDF Invoice 2026-07-29 — engine row-integrity vào master (v3.1.59) rồi bị revert trên nhánh, draft pro metafield (v3.1.58)
summary: Commit landed 07-29 (v3.1.58→59): fix ngắt trang giữa dòng hàng merged vào master rồi bị revert nguyên merge trên nhánh `revert/print-page-break` (chưa vào master → prod vẫn đang mang bản fix bị đánh giá chưa chín), cộng draft-order pro metafield; WIP lớn: Templates redesign (selected card + skeleton + fullscreen close) và Setup Checklist Card SB-14770.
tags: [pdf, invoice, shopify, avada]
created: 2026-07-30
source: repo "pdf" — git log (hash đã verify)
---

# Shipped — PDF Invoice, commit landed 2026-07-29

Phần *root cause / bài học* nằm ở [[digest-pdf-2026-07-29]] — ở đây chỉ ghi **cái gì đã landed và ở đâu**.

## Shipped

### 1. `v3.1.59` — không để dòng hàng bị xẻ đôi qua biên trang (MR !477)

- Merge `009dec3b3` (tag `v3.1.59`, `origin/master`) ← nhánh `fix/quote-page-break-engine`.
- `a8b0f97be` — ticket **PDF-260728-c24J2k**. Thêm `#enforceRowIntegrity` trong `puppeteer.service.js`: đọc toạ độ thật của từng dòng, chỉ đẩy dòng đang vắt biên. Chạy cho **mọi** template nên vá được cả nhóm quote (toàn bộ template quote thiếu class `Container` → `#detectAndBreakPages` trả null, không engine nào chạy). Kèm: chờ font + ảnh **trước** khi đo, chạy xen kẽ với `#adjustTemplateContainers` đến khi ổn định, vá rò rỉ Chromium ở nhánh `outputFormat: 'html'`. +319/-2, 3 file.
- `40abfb683` — tính đúng chiều cao trang cho template bị Chrome thu nhỏ: suy tỉ lệ từ bề rộng thật (điều kiện `scrollWidth > clientWidth`), giải thích hằng số `PAGE_HEIGHT.TECH = 1220`. Bản nháp trước áp tỉ lệ cho cả template co giãn → làm Professional xẻ đôi item 33. Thêm `tech_quote` + `professional_quote` vào regression test.
- `e21fbc4a1` — xoá `__tests__/print/dbg.test.js` (script debug lọt vào commit đầu).

### 2. `v3.1.58` — draft-order pro metafield (MR !475)

- Merge `5e1ef7d10` (tag `v3.1.58`) ← `93c3917d5` (nhánh `feat/draft-pro-metafield`): `draftOrder.service.js` + `config/pickFields.js` + DevZone `ProductMetafieldSetting`. Commit message chỉ ghi "feat" — không tra được ý định từ message, phải đọc diff.

### WIP (còn trên nhánh, chưa merge)

- **Templates redesign** (`origin/feat/templates-redesign`): `fcb86f078` skeleton nhận `count` + chế độ unwrapped → `69e91347a` skeleton khi đổi document type bằng `isPlaceholderData` của react-query (type đã cache thì không nháy) → `613ed9f57` sửa comment mô tả `skeletonCount` → `53060a614` selected-state card theo mockup (chỉ layout mới, shop legacy giữ nguyên) → `4cb9091bc` **close ở fullscreen điều hướng về `/templates`**: `createApp()`/`Fullscreen.create()` chạy trong thân render nên mỗi render sinh instance mới, handler EXIT không bao giờ chạy → memo hoá + đọc props qua ref → `2dcdd7ef2` card đang chọn trùng màu nền vì `--p-color-bg-surface-selected` của **Polaris 13 bằng đúng `--p-color-bg`**.
- **Setup Checklist Card SB-14770** (`origin/feature/SB-14770-setup-checklist-card`): `b7ff678a8` — organism `SetupChecklistCard` (JS/JSON/SCSS 415 dòng), dựng lại `QuickStart`, `constants/quickstart/tasks.js`, DevZone hook để test, +17 key locale, sửa `vite.config.js` và **1 dòng `.gitlab-ci.yml`**. Commit message "Add checklish card" (typo) — 900 insertions trong 1 commit.

## Reverted

- `00effbb35` (`origin/revert/print-page-break`) — **revert nguyên merge `009dec3b3`**, tức bỏ toàn bộ mục Shipped #1 ở trên (-316 dòng, xoá cả `rowIntegrity.test.js`).
  Lý do trong message: (1) `cd_light_invoice` bật ảnh sản phẩm **vẫn** xẻ đôi dòng, và engine tự kiểm báo 0 dòng vắt biên trong khi PDF in ra vẫn cắt → toạ độ DOM không ánh xạ tin cậy sang biên trang lúc Chrome in; (2) blast radius quá rộng (template `vela` bị spacer tạo khoảng trắng dài, các store custom cũng trong tầm ảnh hưởng) cho một vấn đề đến từ **một** khách. Hướng thay thế: vá riêng qua doc template trong Firestore.
- ⚠️ **Revert này đang ở nhánh, chưa vào master.** `origin/master` = `009dec3b3` = `v3.1.59` → nếu trace "prod đang chạy gì" thì **prod vẫn mang bản fix bị đánh giá chưa chín**. Việc cần theo dõi: MR của `revert/print-page-break`.
- Phần chẩn đoán root cause được cố ý **giữ lại** trên `fix/quote-page-break-engine` (3 phát hiện: template quote thiếu class `Container`; `PAGE_HEIGHT.TECH = 1220` là do Chrome scale; leak Chromium ở nhánh html).

## Deploy notes

- **Không có commit `[deploy-functions]`** trong cửa sổ này.
- **2 version bump**: `v3.1.58` (`5e1ef7d10`), `v3.1.59` (`009dec3b3`) — cả hai đều landed 07-29.
- **Không migration file.** `.gitlab-ci.yml` chỉ bị đụng ở nhánh WIP `b7ff678a8` (1 dòng), chưa vào master.
- Bỏ qua như noise: `346876044` (gitignore `.superpowers` scratch dir).

## Liên kết gợi ý

[[pdf]] · [[digest-pdf-2026-07-29]] · [[shipped-pdf-2026-07-22]] · [[digest-pdf-2026-07-21]] · [[digest-pdf-2026-07-23]] · [[digest-pdf-apiv1-workflow-2026-07-21]] · [[shipped-subscriptions-2026-07-30]] · [[shopify-app-dev]] · [[feedback-git-branch-discipline]]
