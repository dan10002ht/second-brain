---
type: note
title: Shipped Joy Subscription — commit landed 2026-09-09
summary: Master chỉ nhận đúng 1 MR (!2552 — tier discount bắt đầu sai vị trí khi bật Trial + lấy nhầm tier theo cycle), không version bump, không revert; toàn bộ khối lượng còn lại nằm trên nhánh `feat/wholefoods-portal` (16 commit dựng extension customer account riêng, BE là 4 helper thuần + test, không endpoint mới).
tags: [avada, subscription, shopify, extensions, billing]
created: 2026-09-10
updated: 2026-09-10
source: repo `subscriptions` — git log (các hash dưới đây đã verify từ log, không suy đoán)
---

# Shipped — `subscriptions`, ngày 2026-09-09

Bối cảnh và root cause của phần extension đã ghi ở [[digest-subscriptions-2026-09-09]] và
[[2026-09-09-portal-wholefoods-extension-rieng]] — note này chỉ ghi **cái gì đã landed ở đâu**,
kèm hash.

## Shipped

**Trên `master` (`origin/master` = `5f7579d08`) — đúng 1 MR:**

| Hash | Việc |
|------|------|
| `5f7579d08` | merge `!2552` — *fix - be/fe - discount tier bắt đầu sai vị trí khi bật Trial và lấy nhầm tier theo cycle* |
| `c50d6d1d2` | chore đi kèm: xoá comment thừa ở nhánh discount tier trial (6 file: `TrialForm`, `planSummaryContents`, `discountTierUtils`, `OrderProductLine`, `bulkAddProducts`, `prepareLineAddPayload`) |

Không tag version, không migration, không revert.

**Trên nhánh `feat/wholefoods-portal` (HEAD `d3d34c61c`) — 16 commit, chia 3 lớp:**

- *Spec & plan:* `52414636d` (design spec 156 dòng) → `a7ec5d5b2` (plan 759 dòng).
- *Backend — 4 helper thuần + test, KHÔNG endpoint mới:* `37c141888` (sort/filter list),
  `7ed2ae8b9` (gom line thành box/staples/one-off — nhận diện one-off bằng marker
  `__joy_one_off`, có trace `expandBundleLine.js:137-142` chứng minh custom attribute sống sót
  qua commit draft nên *không cần đổi backend*), `52ec957c5` (bảng cutoff hardcode +
  ordering-closed), `4142f173e` (bổ sung test phủ dòng Saturday theo *hành vi*: mutation
  `cutoffWeekday 3→4` làm 2/10 đỏ, trong khi bộ test cũ 7/7 vẫn xanh).
- *Frontend — extension `customer-account-ui-wholefoods`:* `44edf6fab` (scaffold, copy
  byte-identical, cố ý bỏ dòng `uid` để CLI cấp uid mới ⇒ không đè extension live) →
  `7c3f75556` (copy nốt `constants/default` còn thiếu làm build đứt + đăng ký workspace trong
  `yarn.lock`) → `58ca161f4` (list + sort/filter; kèm fix `useFetchGraphql` khởi tạo
  `loading=false` làm mọi request bay đi thiếu `X-Shopify-Shop-Id` → 401) → `e1a815796`
  (detail shell 3 tab; điều hướng bằng view state chứ không URL) → `0e0cbf300` (tab General:
  box/staples/one-off/cutoff; 3 fix render trên dev store thật) → `589b49027` (nối action +
  one-off, mọi mutation đi qua `settle()`; `actionPayloads` chuyển sang
  `packages/functions/src/helpers/wholefoodsPortal/` để test thật sự có gate chạm tới) →
  `4e7905306` (màn Order detail + helper `deliveryAttributes` dùng chung — key thật là
  `Delivery-Location-Id` của Zapiet và `locationId` của Bird, không phải fuzzy match) →
  `d3d34c61c` (README 99 dòng ghi lại 2 sai lệch convention được chấp nhận + 4 giới hạn đã biết).

**Tooling:** `3270ae12c` — `gates.sh` gọi thẳng binary jest để né `rtk` parse hỏng (khớp với
`rtk 0.42.4` exit 194 đã ghi ở digest). `503640b74` — gitignore `manifest.json` per-extension do
Shopify CLI tự sinh.

## Reverted

Không có. Không revert, không hotfix, không tag bị rút.

## Deploy notes

- Hai commit CI mang cờ `[deploy-all]`, đều là **pin staging4 sang nhánh khác** — không phải
  deploy code của ngày này: `1cd3c940d` (`feat-email-daily-cap`) và `ddc4282ef`
  (`feat-select-all-subs`). Đây cũng là dấu hiệu duy nhất trong log cho biết có 2 nhánh khác
  đang chạy song song.
- Không có `[deploy-functions]`, không có file migration, không có `firestore.indexes.json`.
- Nhánh wholefoods **chưa merge** ⇒ prod chưa có extension mới. `7c3f75556` nói thẳng: repo
  **không có gate build/test nào phủ `extensions/`**, nên xanh CI không nói gì về extension này.

## Chưa xác minh (do chính commit body khai)

- `58ca161f4`: `LANDING_PAGE_PATH` chưa đối chiếu store live — có ứng viên cạnh tranh ghi trong
  comment ở `src/constants/landing.js`.
- `589b49027`: đã chứng minh nút Add bắn **đúng một** request `PUT /clientApi/order/product/add`,
  nhưng dev store trả `200 {"success":false,"error":"Subscription contract is invalid"}` — tức
  đường đi đúng còn *hiệu ứng* thì chưa. → [[ack-khong-phai-hieu-ung]].
- `4e7905306`: payment method vẫn render `ending with **** **** **** 1`, kế thừa nguyên từ
  `customer-account-ui` và cố ý để ngoài scope.

## ⚠️ Cần xác nhận

**`!2552` (`5f7579d08`) nói tier bị "lấy nhầm theo cycle"; runbook chốt ngày 08-27 lại nói
chọn tier theo trục cycle của app là ĐÚNG.**

- [[discount-per-cycle-audit-2026-08-27]] ghi thành luật (và đã đẩy vào
  `knowledge/apps/subscriptions.md` mục 4b-ter trên VM): *"Hai trục `cycleIndex` — app và Shopify
  không bằng nhau… cố ý. Tier chọn theo trục app, draft ghi theo trục Shopify, **cả hai đều
  đúng**"*. Audit đó cũng kết luận cái thu dư 8 EUR **không** phải do tier mà do `plans[]` lệch
  `sellingPlanId`.
- Tiêu đề `!2552` khẳng định ngược lại: có một đường lấy tier **theo cycle** đang sai, cộng thêm
  một vế mới mà audit chưa từng xét — **Trial làm tier bắt đầu sai vị trí**.

Chưa kết luận được bên nào sai vì log chỉ có merge commit, không có diff. Cần mở `!2552` và trả
lời: (a) tier lấy nhầm ở trục nào — nếu là trục Shopify thì luật 4b-ter vẫn đúng và chỉ thiếu
trường hợp Trial; (b) nếu là trục app thì luật 4b-ter sai và phải sửa cả runbook trên VM lẫn
[[discount-per-cycle-audit-2026-08-27]], vì agent support đang đọc nó để triage.

## Liên quan

[[subscriptions]] · [[digest-subscriptions-2026-09-09]] ·
[[2026-09-09-portal-wholefoods-extension-rieng]] · [[cau-extension-chay-that-tren-store]] ·
[[discount-per-cycle-audit-2026-08-27]] · [[digest-subscriptions-2026-09-03]] ·
[[ack-khong-phai-hieu-ung]] · [[fixture-khong-phai-hop-dong-du-lieu]]
