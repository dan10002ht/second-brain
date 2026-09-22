---
type: note
title: Shipped subscriptions — 2026-09-22 (commit landed 21/09: v2.35.52 → v2.35.55)
summary: Master nhận 5 merge (`v2.35.52`→`v2.35.55` + !2621 không tag) — bundle parent thôi bị ép bật inventory tracking, selling plan ăn trên MỌI form add-to-cart của trang, interceptor EasySell COD thu hẹp về một shop, và [deploy-extensions] !2626 bỏ nhánh bundle của cart transform để dòng con mang giá catalog; cả chùm guard SB-16934 (cycleIndex, contract sync lock, charge trùng) và command strip contract vẫn nằm trên nhánh.
tags: [subscription, shopify, avada, backend, storefront, extensions, billing]
created: 2026-09-22
updated: 2026-09-22
source: repo `subscriptions` — git log 2026-09-21 (hash trong note là hash thật)
---

# Shipped — Joy Subscription, commit landed 2026-09-21

Phần *vì sao* đã ghi ở [[digest-subscriptions-2026-09-21]] và
[[2026-09-21-fixed-bundle-con-them-luc-order-create]]. Note này chỉ ghi **cái gì thật sự lên master**
và cái gì còn treo trên nhánh.

## Shipped (master)

| Tag | MR | Merge | Nội dung |
|-----|-----|-------|----------|
| — | !2621 | `cf968ac06` ← `56e98102f`, `94fad7825`, `6243e948b` | Selling plan được ghi vào **mọi** form add-to-cart của product page (trừ form trong cart drawer), thay vì dò 2 tầng quanh `data-block`. Shop dùng snippet DevZone + PageFly (`grivesperfumes`, JSUB-260902/260904) trước đó bị tính giá one-time cho gói sub — và hàm cũ `return false` trong im lặng, nên bug sống một năm trên prod. Tách helper `resolveSellingPlanInputs`, 7 fixture jsdom, override 36bicycle dùng chung helper. |
| `v2.35.52` | !2622 | `fbe41d9e7` ← `91b469882` | `buildVariant` hardcode `inventoryItem.tracked = true` cho bundle parent, mà `productSet` với `identifier.id` là full overwrite → mỗi lần merchant save bundle là tracking họ vừa tắt lại bật lên. Luật mới: create gửi `tracked = false`, update không gửi gì về inventory; bỏ luôn `inventoryQuantities` (nguồn sự thật thứ hai, stale gần như mọi lúc). |
| `v2.35.53` | !2623 | `792457280` ← `ddf735eb4`, `b88c981d0`, `9ef1374ef` | SB-16983: chèn `selling_plan` vào `/cart/add` cho shop chạy EasySell COD. Bản đầu (`b88c981d0`) móc vào `mixinFetch`/`mixinXhr` dùng chung — tức đổi hành vi add-to-cart của **mọi** store; `9ef1374ef` kéo về pattern `customShop.js` + dynamic import (custom theo shop), bọc try/catch toàn hàm và chặn bọc chồng khi install hai lần. |
| `v2.35.54` | !2626 | `db21c84ed` ← `4b4bc2348`, `c2b64aa85`, `18e473c0e`, `d4a65da9e` | **[deploy-extensions]** — bỏ hẳn nhánh bundle của cart transform (`bundleExpand.js` xoá), để `restoreDeferredBundleChildren` thêm dòng con ở catalog price + discount 100% sau khi đơn tạo. Kèm: `collectOosParentOnlyLines` → `collectUnexpandedBundleParentLines`, `shouldRestoreBundleChildrenToOrder`, `resolveOrderForCharge` bỏ dòng con đã lưu trước khi billing. Đo trên `dantt-subscription-box`: one-time / subscription / recurring đều ra cha + con giá catalog giảm về 0, và setQuantity/remove một dòng con không đụng subtotal. |
| `v2.35.55` | !2627 | `35141059e` ← `f978e0d9a` | Landing joyxjoy: bar tổng tiền + CTA mobile dock **trên** (ngay dưới header) vì chat launcher của shop che nút "Save and continue". Phép đo header cũ lấy chiều cao lớn nhất trong các phần tử pinned, mà theme pin 2 tầng (announcement `top:0`, header `top:40px`) → 122px thay vì 162px đo thật ở 440px trên joywholefoods.com.au; đổi sang lấy mép dưới của cả stack. |

## Chưa lên master (còn trên nhánh)

- **Chùm SB-16934 — charge trùng / cycle** (nối tiếp [[digest-subscriptions-2026-09-19]]):
  `1a9397e41` (`fix/skip-cycle-recharge`) một nguồn sự thật cho `cycleIndex` (+455 dòng test);
  `28965e619` (`fix/swap-contract-sync-lock`) `swapContractProduct` cầm `withContractSyncLock` khi
  ghi upcoming order — hai writer cách nhau 13.3s vẫn lọt guard đọc-trước-khi-ghi, chạy chồng vài ms
  thì cả hai đều đọc "chưa xung đột"; `3a0c3ed0f` + `f21f2f342` + `711ffe7fa` vô hiệu hoá
  billing instant trùng thay vì xoá order (kèm integration test trên Firestore emulator).
- **`agent/SB-16980`** (`5239e8a65` test → `915e51a21` fix): chặn charge thẻ bị thu hồi.
- **Đuôi của !2626**: `44d1e78f9` command `backfillParentOnlyContracts` (dry-run mặc định, từ chối
  contract có rotation snapshot / dòng con giá > 0 / cycle đã sửa / shop chưa bật
  `enabledSyncBundleToContracts`) + spec; `6cf9f7f8d` admin ẩn `Edit product` và `Swap product` trên
  dòng con (hai portal storefront đã ẩn sẵn); `8b3e46729`/`b89154f94` thêm cửa chặn thứ năm — parent
  variant còn `avada_fixed_bundle_variant/data` thì mới cho strip; `45bbc400d`/`20b14b57c` sửa hai
  chuỗi merchant-visible vẫn nói "out of stock" trên **mọi** đơn bundle.
  _Hai nhánh `fix/bundle-child-guards` và `fix/bundle-child-prices` mang cùng nội dung ở hash khác
  nhau (cherry-pick/rebase) — merge một cái thì cái kia thành thừa._

## Reverted

Không có revert trong khoảng này.

## Deploy notes

- `db21c84ed` mang **`[deploy-extensions]`** — bắt buộc vì diff xoá `bundleExpand.js` trong
  `cart-transform-extension`; extension không deploy thì cart vẫn nở bundle và cả cơ chế mới vô dụng.
- Không có commit `[deploy-functions]`, không có file migration, không có revert.
- 4 version bump liên tiếp trong một ngày: `v2.35.52` → `v2.35.55`.

## ⚠️ Cần xác nhận

1. **Backfill contract cũ: bắt buộc hay không?**
   - [[2026-09-21-fixed-bundle-con-them-luc-order-create]] ghi backfill xoá 74 dòng con khỏi 4
     contract production **trước** khi deploy, và coi cửa sổ giữa backfill–deploy là rủi ro hộp rỗng.
   - Commit `4b4bc2348` (đã merge) lại nói `resolveOrderForCharge` bỏ dòng con đã lưu trước khi
     billing nên *"contracts written earlier produce a parent-only order too"*, còn `44d1e78f9` mô tả
     strip chỉ để *"đưa contract sang đường đã verify end-to-end"* — tức tuỳ chọn, không bắt buộc.
   - Cần chốt: backfill là bước bắt buộc của rollout hay chỉ là dọn dẹp? Câu trả lời đổi hẳn mức độ
     khẩn của `44d1e78f9` (đang còn trên nhánh).
2. **"Rebase lên cơ chế của dev khác" — chính xác tới đâu?**
   [[digest-subscriptions-2026-09-21]] ghi cách xử conflict là *bỏ service riêng, rebase lên cơ chế
   của DamHV (`collectOosParentOnlyLines`), chỉ nới cổng*. Diff đã merge (`4b4bc2348`) cho thấy
   `collectOosParentOnlyLines.js` bị **xoá** và thay bằng `collectUnexpandedBundleParentLines.js`
   (job `restoreDeferredBundleChildren` thì đúng là dùng lại). Không mâu thuẫn về hướng, nhưng câu
   "chỉ nới cổng" nhẹ hơn thực tế — helper của họ đã bị đổi tên + đổi ngữ nghĩa.

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-09-22]] ·
[[digest-subscriptions-2026-09-21]] ·
[[2026-09-21-fixed-bundle-con-them-luc-order-create]] · [[gia-0-tren-dong-con-lam-mat-thong-tin]] ·
[[digest-subscriptions-2026-09-19]] · [[shipped-subscriptions-2026-09-19]] ·
[[mutation-ghi-nguyen-khoi-xoa-field-khong-gui]] · [[resolve-luc-doc-thay-vi-ghi-truoc]] ·
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]]
