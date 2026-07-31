---
type: note
title: Shipped PDF Invoice 2026-07-30 — chỉ 1 dòng vào master (v3.1.61), khối lượng thật nằm trên nhánh
summary: Commit landed 07-30 — master CHỈ nhận 1 MR đổi 1 dòng (devzone navigation ở standalone, tag `v3.1.61`); toàn bộ việc nặng còn trên nhánh chưa merge: CrossAppPromoModal chia 70-30 bằng hash tất định từ shop.id, quickstart mở thẳng màn edit template, Setup Checklist Card SB-14770, skeleton Templates đếm theo `newTemplatesUnlocked`, và fix mất data emulator lúc `pm2 stop`; không revert, không `[deploy-functions]`.
tags: [pdf, invoice, shopify, avada]
created: 2026-07-31
source: repo "pdf" — git log (hash đã verify)
---

# Shipped — PDF Invoice, commit landed 2026-07-30

Chỉ ghi **cái gì đã landed và ở đâu**. Root cause / bài học → [[digest-pdf-2026-07-30]]
(bản trước: [[digest-pdf-2026-07-29]]).

## Shipped (đã vào `master`)

### `v3.1.61` — devzone navigation ở standalone mode (MR !480)

- Merge `0ad724f9c` (tag `v3.1.61`, `origin/master`) ← `81baf3336` (nhánh `feat/embed-navigation`).
- Diff thật: **1 dòng** trong `AppNavigation.js` — mở mục DevZone khi chạy standalone.
- Đây là commit **duy nhất** vào master trong cửa sổ này.

## Còn trên nhánh (chưa merge) — nơi chứa khối lượng thật

- **Cross-app promo modal** (`origin/feat/cross-app-promo-modal`): `ab6cee0ae` thay `ShippingLabelPromoModal` bằng `CrossAppPromoModal` dùng chung 2 variant, chọn layout bằng field `layout` trong config — Joy Subscriptions (split 2 cột) cho 70% shop không phải dev store, Avada Online Course (media card) cho 30% còn lại + toàn bộ dev store. Chia nhóm bằng **hash tất định từ `shop.id`** (FNV-1a 32-bit + finalizer lowbias32) nên một shop luôn cùng nhóm: không random lại mỗi lần mở app, **không cần ghi DB, không cần migration**, và tính lại được bucket của bất kỳ shopId nào để debug (đo trên 200k id: 69.95% vào nhóm Joy, 100 bucket không rỗng). Hai kiểu đóng khác nhau: nút X ghi cờ dismiss xuống shop doc (không hiện lại), còn click ngoài/ESC chỉ đánh dấu trong redux — Polaris wire cùng một `onClose` cho X và backdrop nên phải ẩn nút X mặc định và tự render. Kèm `appLifecycle.service.js` reset 2 cờ dismiss khi uninstall, `pickFields` trả 2 cờ, ảnh nén sang webp (483KB→30KB, 25KB→886B, 177KB→16KB), preview variant qua localStorage bị vite loại khỏi build production. 32 file, +690/-384. `df31134d3` chỉ là "add todo" (1 dòng) — noise.
- **Quickstart customize template** (`origin/fix/custom-template-step`): `6092a7a41` — bấm "Customize template" đi thẳng `/templates/:id/edit?from=quickstart` (tự lấy template invoice đầu tiên trong default print list) và **tick done ngay lúc bấm** thay vì chờ save; xoá `useCustomizeTemplateModal` + label chết; thêm helper thuần `findTemplateToCustomize` + test.
- **Setup Checklist Card SB-14770** (`origin/feature/SB-14770-setup-checklist-card`): `e6966bb38` "Add check list guide" — nhánh này tiếp tục từ `b7ff678a8` của hôm trước; +1137/-153, dựng lại `QuickStart` (293 dòng đổi), `SetupChecklistCard` (JS/JSON/SCSS 415 dòng), `constants/quickstart/tasks.js`, +17 key × 11 locale, và **vẫn đụng `.gitlab-ci.yml` 1 dòng** + `vite.config.js` (+34).
- **Templates redesign** (`origin/feat/templates-redesign`): `4106700a2` — skeleton đếm theo **bộ template shop THỰC SỰ có**, không theo `defaultTemplates` của code hôm nay: bộ template là ảnh chụp catalogue lúc cài (`generateTemplates`), shop cài trước khi 4 design aria/spira/skyline/vela ra mắt phải claim qua banner mới có. Dùng cờ `newTemplatesUnlocked` (bật trong `onCreateShop`, có sẵn trong `shopInstance` → không tốn request) thay vì suy đoán theo ngày; cộng `wholesaleTemplates` cho tab Unpaid. Đối chiếu Firestore staging: 23/23 shop layout mới khớp.
- **Dev tooling** (`44bd9c6ca`, chưa rõ nhánh đích): giữ data emulator khi `pm2 stop` — wrapper `start-local-emulators.js` trước đây không bắt SIGINT/SIGTERM/SIGHUP nên firebase CLI con bị bỏ rơi và `--export-on-exit` không kịp chạy → **mất sạch data Firestore mỗi lần stop/restart**; giờ snapshot định kỳ qua Emulator Hub (2 phút) + forward tín hiệu + watchdog SIGKILL 25s. Kèm `watch-build:embed/standalone` thêm `--mode development` (vì `vite build` mặc định mode=production, repo chỉ có `.env.development` → mọi `VITE_*` thành `undefined`, bundle tunnel chết ở `initializeApp({apiKey: undefined})`) và plugin cảnh báo khi thiếu `VITE_FIREBASE_API_KEY`. Lưu ý ops trong message: phải đặt `treekill: false` cho `pdf-be` trong `ecosystem.config.js` (file nằm trong `.gitignore`).

## Reverted

- Không có revert trong cửa sổ này.
- ⚠️ Câu hỏi mở từ hôm trước **chưa đóng trong log này**: nhánh `revert/print-page-break` (`00effbb35`) không xuất hiện, tức chưa thấy dấu hiệu nó vào master. Xem [[shipped-pdf-2026-07-30]] để hiểu vì sao điều đó quan trọng cho câu "prod đang chạy gì".

## Deploy notes

- **Không có commit `[deploy-functions]`.**
- **1 version bump**: `v3.1.61` (`0ad724f9c`). Không thấy `v3.1.60` trong cửa sổ log này — có thể đã landed ngoài khoảng lấy log, **chưa xác minh**.
- **Không có migration file.** Đổi promo modal cố ý **không cần migration** (bucket suy từ hash `shop.id`) — đáng nhớ như một pattern.
- `.gitlab-ci.yml` chỉ bị đụng ở nhánh WIP `e6966bb38`, chưa vào master.
- Bỏ qua như noise: `df31134d3` (add todo, 1 dòng).

## Liên kết gợi ý

[[pdf]] · [[digest-pdf-2026-07-30]] · [[shipped-pdf-2026-07-30]] · [[digest-pdf-2026-07-29]] · [[shipped-pdf-2026-07-22]] · [[digest-pdf-2026-07-23]] · [[subscriptions]] · [[shipping-labels]] · [[shopify-app-dev]] · [[feedback-git-branch-discipline]]
