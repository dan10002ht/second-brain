---
type: note
title: Shipped subscriptions — 2026-09-24 (commit landed 23/09: !2578 + !2429, cả hai [deploy-extensions])
summary: Master chỉ nhận 2 merge, cả hai mang [deploy-extensions] và không kèm commit bump version — nhúng customer portal vào account page của Froonze (!2578, đóng vòng đã mở từ 17/09) và chuyển `readHandlers` từ CommonJS sang ESM (!2429, một MR rất cũ); ba nhánh portal vẫn treo, trong đó `backfillParentOnlyContracts.js` (+293 dòng) mới chỉ nằm trong stash và CI staging 1 đã bị trỏ khỏi master.
tags: [subscription, shopify, avada, backend, storefront, extensions, caching]
created: 2026-09-24
updated: 2026-09-24
source: repo `subscriptions` — git log 2026-09-23 (mọi hash trong note là hash thật, lấy từ log có decoration)
---

# Shipped — Joy Subscription, commit landed 2026-09-23

Chỉ ghi **cái gì thật sự lên master** và cái gì còn treo trên nhánh. Phần *vì sao* nằm ở các digest
link ở cuối. Kỳ trước: [[shipped-subscriptions-2026-09-23]] (dừng ở `v2.35.59` + !2595).

## Shipped (master)

| Tag | MR | Merge | Nội dung |
|-----|-----|-------|----------|
| — | !2578 | `eb7acfd63` | **[deploy-extensions]** `feat - fe - nhúng customer portal vào account page của app khác (Froonze)`. Đây là vòng Froonze mà [[shipped-subscriptions-2026-09-17]] ghi là "còn trên nhánh `feat/customer-portal-ui`" — nay đã lên master. |
| — | !2429 | `09d94a2f9` | **[deploy-extensions]** `Fix - be - readHandlers: convert CommonJS export to ESM`. |

Hai điểm đáng để ý về chính cái bảng này:

- **Không commit nào bump version trong slice log.** Mọi ngày trước đó master đều kèm `vX.Y.Z`;
  hôm nay dừng ở `v2.35.59` của kỳ trước. Chưa xác minh là tag được đẩy ngoài commit hay thật sự
  chưa release.
- **!2429 là một MR rất cũ** so với mặt bằng hiện tại (!2578, !2630). Một MR số thấp merge muộn
  thường đã rebase qua nhiều tháng thay đổi — đáng liếc xem nó có còn khớp với cách `readHandlers`
  được import hiện nay không.

## Chưa lên master (còn trên nhánh)

**`fix/bundle-swap-children`** — `e41757013` `fix - be - swap no longer writes bundle children onto
parent-only contracts`. Với shop bật `enabledSyncBundleToContracts`, contract chỉ giữ **dòng cha**;
dòng con được thêm vào từng order sau đó, mang **giá catalog dưới một discount 100%** — đúng khuôn
[[gia-0-tren-dong-con-lam-mat-thong-tin]]. Contract-create, charge path và restore phía order đều
tôn trọng điều đó; **swap và add-product thì không** (`expandBundleLine.js` chưa từng đọc cờ), nên
swap một box ghi lại toàn bộ component vào contract vừa được dọn, và kỳ charge sau ship mỗi
component **hai lần**: một lần từ dòng contract giá 0 (mất luôn giá gốc), một lần từ job restore.
Bản vá đưa cả hai entry point về **một predicate dùng chung**
(`shouldDeferBundleChildrenToOrder.js`), giữ nguyên attribute `JOY_BUNDLE_*` trên dòng cha để admin
UI / rotation / restore vẫn nhận ra box. Commit **cố ý chừa** `cycleRotationService.applyBundleToCycle`
— nó ghi vào billing cycle chứ không vào contract, charge path xoá nó, và thu hẹp nó sẽ làm gãy
collection swap.

**`feat/customer-portal-ui`** — ba commit sau khi !2578 đã lên master:

- `fbc6bf429` **trả lại chặn portal cho shop dưới STARTER ở hosted mode**. Nhánh bọc redirect vào
  `if (!isHostedPortal())` nhưng để luôn cả `return` bên trong, nên hosted rơi thẳng xuống
  `renderLogin` → shop dưới STARTER vẫn vào được full portal. Commit tự ghi: **client là nơi duy
  nhất chặn, `routes` và `clientApiMiddleware` không kiểm plan** — tức đây là rò rỉ quyền thật, không
  phải lỗi hiển thị. Hosted không được đổi URL trang của merchant nên gỡ skeleton bằng
  `render(null, blockElem)` rồi return; standalone giữ nguyên redirect.
- `911cf1bc0` **portal bundle đọc lại cache token của loader thay vì `Date.now()`**. `embedApi` đóng
  dấu `Date.now()` lên URL bundle nên mỗi page view một URL khác → **cache MISS 100%**, kéo cả bundle
  từ origin mỗi lần. Loader đã sửa bằng bucket 5 phút; thay vì chép lại con số đó, commit đọc thẳng
  token mà loader đã đóng lên bundle chính (cùng build ⇒ cùng URL, không lệch nhịp được), chỉ tự tính
  bucket khi đọc không được. Test đỏ trước fix, xanh sau.
- `cca3ebc07` merge master vào nhánh (lần 2), 4 conflict — đáng nhớ: `integrationsController` hai bên
  cùng thêm hàm ở cùng chỗ (giữ **cả** `getFroonzeData` lẫn `getBirdDeliveryOptions`), và
  `SubscriptionDetail` giữ `contractId` đọc qua `getRoute()` cho hosted routing.

**`feat/portal-preview`** — `ae23eaf3d` merge master vào nhánh với **8 conflict**, trong đó có cả hai
file CI (`staging.yml`, `staging3.yml`), `extensions/customer-account-ui/src/index.jsx` và 4 file
portal. `f2ccec41e` `chore - ci - point staging 1 at feat/portal-preview`.

## Reverted

Không có `git revert` nào trong slice này, và không có đổi hướng nào ở mức phải mở note quyết định
riêng — `e41757013` là **thi hành** quyết định [[2026-09-21-fixed-bundle-con-them-luc-order-create]]
ở hai đường còn sót, không phải đảo nó.

## Deploy notes

- **Cả 2 merge lên master đều mang `[deploy-extensions]`** (`eb7acfd63`, `09d94a2f9`) — buộc CI deploy
  extension. Một ngày chỉ có 2 merge mà cả 2 đều force deploy là mật độ bất thường.
- **`f2ccec41e` trỏ staging 1 sang `feat/portal-preview`.** Từ thời điểm này staging 1 **không còn
  phản ánh master** — ai verify trên staging 1 mà tưởng đang nhìn master sẽ kết luận sai. Cùng họ với
  `8d5adfbef` ở kỳ trước.
- **`backfillParentOnlyContracts.js` (+293 dòng) mới chỉ nằm trong stash**, không phải commit:
  `29d49a0b8` / `042ec7871` / `a8b53b624` đều là entry `refs/stash` của `feat/portal-preview`. Một
  command backfill 293 dòng sống trong stash là thứ mất trắng khi ai đó `git stash clear` hoặc dọn
  worktree.
- Không có file migration, không có `firestore.indexes.json` đổi trong slice này.

## ⚠️ Cần xác nhận

1. **"Contract chỉ giữ dòng cha" là mặc định toàn cục hay gated theo cờ shop?**
   - [[2026-09-21-fixed-bundle-con-them-luc-order-create]] (đã merge, `v2.35.54`/!2626) phát biểu như
     một quyết định **kiến trúc chung**: contract chỉ giữ dòng cha, con dựng lại lúc `orders/create`.
   - `e41757013` (23/09) mô tả hành vi đó là của **"a shop with `enabledSyncBundleToContracts`"**, và
     predicate mới tên `shouldDeferBundleChildrenToOrder` — tức có nhánh cho shop *không* bật cờ.
   - Nếu đúng là gated theo cờ thì đang có **hai hình dạng contract cùng tồn tại trên prod**, và mọi
     consumer (portal Wholefoods, restore job, backfill) phải biết mình đang ở hình dạng nào. Câu
     "backfill bắt buộc hay tuỳ chọn" treo từ [[shipped-subscriptions-2026-09-22]] và nhắc lại ở
     [[shipped-subscriptions-2026-09-23]] vẫn chưa có câu trả lời — và `backfillParentOnlyContracts.js`
     trong stash cho thấy có người đang trả lời nó mà chưa commit.

2. **Chặn theo plan (STARTER) của customer portal có tầng server nào không?**
   `fbc6bf429` khẳng định `routes` và `clientApiMiddleware` **không kiểm plan**, nên toàn bộ phép chặn
   nằm ở client. Bản vá này đóng đúng một đường (hosted mode) chứ không đổi điều đó — bất kỳ ai gọi
   thẳng client API vẫn không bị plan chặn. Chưa thấy note nào trong brain mô tả tầng chặn server-side
   cho portal; cần chốt đây là **nợ đã biết** hay là **giả định sai** đang được mang theo.

Liên quan: [[subscriptions]] · [[shipped-subscriptions-2026-09-23]] · [[shipped-subscriptions-2026-09-22]] ·
[[shipped-subscriptions-2026-09-17]] · [[digest-subscriptions-2026-09-23]] ·
[[2026-09-21-fixed-bundle-con-them-luc-order-create]] · [[gia-0-tren-dong-con-lam-mat-thong-tin]] ·
[[khong-cache-response-co-auth]] · [[caching-layers]] · [[extension-khong-gioi-han-theo-shop]] ·
[[cau-extension-chay-that-tren-store]] · [[bang-chung-phan-biet-duoc]] ·
[[digest-subscriptions-2026-09-24]] · [[2026-09-24-parent-only-xoa-het-dong-con]] ·
[[script-pha-du-lieu-tu-choi-flag-la]]
