---
type: note
title: Digest Joy Subscription — 2026-09-08 (đóng đợt import Loop → Joy cho TIEL Energy)
summary: Import contract `CANCELLED` không huỷ được — app đổi thẳng sang `PAUSED` và không có bước huỷ nào, nên chỉ được import contract còn sống; mọi cột lạ trong CSV import đều bị ghi thành custom attribute lên contract mới; và `Orders completed to date` của Loop có tính cả origin order, chứng minh bằng 28 sub có số 1 mà transaction log 0 dòng.
tags: [avada, subscription, shopify, billing, debug]
created: 2026-09-08
updated: 2026-09-08
source: project `subscriptions` (worktree `feat/tielenergy-custom`) — session history
---

Nối tiếp [[digest-subscriptions-2026-09-01]] và [[digest-subscriptions-2026-09-07]] — phần đóng lại
của đợt migrate 37 contract từ Loop sang Joy cho `tiel-energy`, cộng hai việc custom theo shop.

## Bugs / gotcha

**Import contract đã huỷ tạo ra contract sống.** `importService.js:587` đổi status `CANCELLED` và
`EXPIRED` thành **`PAUSED`** lúc tạo, và **không có bước huỷ nào phía sau** — nghĩa là import 88 dòng
Cancelled của Loop sẽ sinh 88 contract PAUSED thật trên Shopify chờ ai đó bật nhầm. Chốt: chỉ import
37 contract còn sống (25 Active + 12 Paused).

**Mọi cột lạ trong CSV import thành custom attribute trên contract.** `extractCustomAttributes(
subscription, reservedKeys)` lấy **tất cả** key không nằm trong danh sách reserved và ghi lên contract
mới (cùng chỗ với `ORIGIN_STATUS`). Nên cột thêm vào file "chỉ để merchant đọc" (`loop_orders_completed`)
vẫn đi thẳng vào dữ liệu contract — không phải cột trung tính.

**`enrichLoopExport` khởi tạo Firebase ngay lúc `require`** → script thứ hai dùng chung app bị
double-init. Phải sửa cả 3 script cùng dùng một app.

**Parser CSV viết inline vỡ ở file có dấu phẩy trong ngoặc kép** — hai lần trong phiên khiến số liệu
đối chiếu lệch và suýt kết luận data sai. Cả hai lần nguyên nhân là công cụ kiểm, không phải dữ liệu.

## Techniques

**Chứng minh một định nghĩa bằng ca phân biệt được, không bằng tỉ lệ.** Câu hỏi: `Orders completed to
date` của Loop có tính origin order không? 83/102 lệch đúng +1 là gợi ý, chưa phải bằng chứng. Ca dứt
điểm: **28 sub báo `Orders completed = 1` nhưng transaction log có 0 dòng charge và `Last payment = "-"`**
— cái order duy nhất đó chỉ có thể là origin order. → [[bang-chung-phan-biet-duoc]].

**Chạy dữ liệu qua đúng validator của app, không qua check tự chế.** File import được nạp bằng jest
(toolchain sẵn có, không có `@babel/register`) để gọi thẳng `validateImportSubscriptions` — `exit 0,
VALID true, 0 lỗi`. Cùng phiên, `rtk` nuốt log jest nên phải ghi kết quả ra file mới đọc được.

**Contract mới không mang Loop ID — map ngược bằng `email` (37 email unique, 1:1), rồi kiểm chéo bằng
đường ngược lại** (Loop ID → email → Firestore) và so từng dòng: 37/37, lệch 0.

**Điểm mở rộng theo shop của repo:** `helpers/custom/customShop.js` + `isCustomShop` — đăng ký shop rồi
gắn hook trong `getHelperConfig.js`. Lưu ý rule repo: `src/const/` **không được import từ `helpers/`**,
nên hằng số riêng theo shop để luôn trong `customShop.js`. Số "Total successful orders" hiển thị ở
`PaymentOptionCard.js:76`; contract vừa import chưa bill lần nào cho ra **-1**, phải clamp về 0.

## Context

- File bàn giao khách: `id, loop_id, status, orders_completed` — `id` là contract Shopify **mới** (import
  tạo ID khác hoàn toàn), không phải `contract_ID` trong file Loop.
- Toàn bộ 37 contract import ở trạng thái `Paused` có chủ đích, để không có gì tự charge trước khi khách
  huỷ bên Loop; việc bật lại đã ghi ở [[digest-subscriptions-2026-09-07]].
- MR !2544 (`feat/tielenergy-custom`): nút chuyển sang `/pages/build-a-box` + hiển thị tổng order gồm
  cả số order đã có ở app cũ, kèm script backfill 37/37.
- Feedback rút ra từ phiên này: [[feedback-artifact-viet-tieng-anh]] (commit/MR/comment viết
  tiếng Anh, trả lời user bằng tiếng Việt).

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-09-08]] ·
[[2026-08-28-import-loop-chi-contract-song-paused]] · [[bang-chung-phan-biet-duoc]]
