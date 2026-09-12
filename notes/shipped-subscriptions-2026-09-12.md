---
type: note
title: Shipped Joy Subscription — commit landed 2026-09-11
summary: Master chỉ nhận đúng một merge (`c60f34ffa`, !2550 — auto swap setting, đóng nhánh `feat/adama-auto-swap-setting` đang treo từ hôm trước); khối lượng thật nằm trên nhánh `fix/cart-goal-rerender` — vá vòng ba của cụm cart drawer, và commit sau tự phủ nhận giả định của commit trước; không revert, không migration, không cờ deploy.
tags: [avada, subscription, shopify, storefront]
created: 2026-09-12
updated: 2026-09-12
source: repo `subscriptions` — git log (mọi hash dưới đây lấy thẳng từ log, đã verify, không suy đoán)
---

# Shipped — `subscriptions`, ngày 2026-09-11

Bối cảnh cụm cart drawer (SB-16667 Minimog, `CART_DRAWER_ELEMENTS`) ở
[[digest-subscriptions-2026-09-10]] và [[shipped-subscriptions-2026-09-11]]. Note này chỉ ghi
**cái gì landed ở đâu**, kèm hash.

## Shipped

**Trên `master` (`origin/master` = `c60f34ffa`) — đúng 1 merge, không tag trong log:**

| Merge | Việc |
|-------|------|
| `c60f34ffa` (!2550) | Add auto swap setting |

`!2550` là số MR **cũ hơn** cả loạt !2569–!2576 đã merge hôm 09-10 — tức MR mở từ trước, merge muộn.
Nó đóng nhánh `feat/adama-auto-swap-setting` mà [[shipped-subscriptions-2026-09-11]] ghi là còn treo
(`a75251a30`, `79770efaa`, `d77d8fc76` — rule auto-swap + `docs/features/auto-swap/upcoming-order-sync.md`,
chạm `swapAllowlist` và `subscriptionContractUpdateService`). Log của merge commit không mang stat file
nên **không suy được** nó bê nguyên ba commit đó hay đã rebase/sửa — cần đối chiếu diff khi cần chi tiết.

**Trên nhánh `fix/cart-goal-rerender`, chưa vào master — vá vòng ba của cart drawer:**

- `7b6dfe1df` — *re-announce the cart change after the theme re-renders its drawer.* Theme render lại
  cart drawer từ một section sau `cart:refresh`, vứt luôn block của merchant nằm trong đó
  (free-shipping meter, goal bar) cùng giá trị mà inline script của họ vừa ghi — và script đó **không
  tự chạy lại**. Vá bằng cách theo dõi drawer chờ lượt swap rồi bắn `cart:updated` / `on:cart:updated`
  một lần để chúng tính lại trên markup đã settle; kèm timeout cho theme không bao giờ swap.
  (+84 dòng, `openThemeCartDrawer.js` + test.)
- `a26205166` — *narrow the settled announcement to cart:updated.* Thu hẹp lại: chỉ bắn **đúng cái tên
  mà script của store báo lỗi đang nghe**, để event không chạm theme vốn dùng `on:cart:updated` làm
  hook refresh của chính nó; đồng thời bỏ qua mutation kiểu *thêm node* — một spinner rơi vào drawer
  không phải lượt swap làm mất markup. (+36/−14.)

Cả hai chỉ đụng `packages/assets/src/helpers/bundle/openThemeCartDrawer.js` và file test của nó —
cùng chỗ mà `48c8bf30b` / `1350ab449` đã sửa hôm 09-10.

## Reverted

Không có revert. Không hotfix, không tag bị rút.

`a26205166` là **thu hẹp phạm vi** của `7b6dfe1df` trong cùng nhánh trước khi merge, không phải revert
sau khi ship — cùng kiểu với cặp `bbfff20ab` → `1dfd5e7f2` (bucket 1 giờ → 5 phút) hôm trước.

## Deploy notes

- Không `[deploy-functions]`, không `[deploy-extensions]`, không version bump trong log.
- Không file migration, không `firestore.indexes.json`.
- Thay đổi nhánh `fix/cart-goal-rerender` nằm trong `packages/assets` ⇒ khi merge sẽ đi đường
  bundle/CDN, tức chịu chung ràng buộc cache-bust 5 phút đã ghi ở [[shipped-subscriptions-2026-09-11]].

## ⚠️ Cần xác nhận

**"Không theme nào nghe hai tên đó" — sai, và chính commit sau nói vậy.**

| Nguồn | Khẳng định |
|-------|-----------|
| `7b6dfe1df` (commit body) | bắn `cart:updated` **và** `on:cart:updated` an toàn vì *"No theme listens to those names, so this cannot start another re-render"* |
| `a26205166` (commit body, cùng ngày) | phải thu hẹp còn một tên, vì `on:cart:updated` **có** theme dùng làm hook refresh của chính nó |

Giả định "không ai nghe" được dùng làm *lý do an toàn* để bắn event vào theme của khách, và nó bị bác
sau đúng một commit. Ghi ra vì: (a) bản đang nằm trên nhánh là bản đã thu hẹp — ai đọc `7b6dfe1df`
một mình sẽ tin nhầm là bắn cả hai tên vẫn an toàn; (b) `a26205166` **chỉ chứng minh cho store đã báo
lỗi**, chưa chứng minh tên còn lại an toàn trên mọi theme — vẫn là bằng chứng vắng mặt.
→ [[bang-chung-phan-biet-duoc]]

**Chồng lấn với `cart-update` + pub/sub Dawn của !2569?** [[digest-subscriptions-2026-09-10]] ghi
`48c8bf30b` đã thêm event `cart-update` và pub/sub Dawn vào cùng file này. Nhánh mới thêm một đường
thông báo nữa (`cart:updated`) cũng trong file đó. Chưa xác minh hai đường có thể cùng bắn trong một
lượt add-to-cart hay không — nếu có thì merchant block tính lại hai lần. Cần đọc diff hợp nhất trước
khi merge, không suy từ log.

## Liên quan

[[subscriptions]] · [[shipped-subscriptions-2026-09-11]] · [[digest-subscriptions-2026-09-11]] ·
[[digest-subscriptions-2026-09-10]] · [[bang-chung-phan-biet-duoc]] ·
[[gate-hop-nhat-truoc-khi-merge]] · [[caching-layers]] ·
[[digest-subscriptions-2026-09-12]] (điều tra trong cùng ngày)
