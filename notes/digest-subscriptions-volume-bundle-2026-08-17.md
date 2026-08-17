---
type: note
title: Digest Volume Bundle — chọn option nào cũng không ăn discount (2026-08-17)
summary: Volume Bundle suy tier từ quantity của line nên hai option cùng quantity khác discount thì option thứ hai không bao giờ ăn giảm giá; fix là storefront gửi kèm tier đã chọn và Shopify Function ưu tiên tier đó.
tags: [subscription, shopify, extensions, debug, avada]
created: 2026-08-17
updated: 2026-08-17
source: project "subscriptions" (worktree fix/volume-bundle-discount) session history
---

# Digest Volume Bundle — 2026-08-17

Bug của [[subscriptions]], làm trong worktree `.claude/worktrees/fix+volume-bundle-discount`
tách từ `origin/master`.

## Bug

Merchant setup 2 option volume bundle **cùng `product quantity: 1`**, discount `0%` và
`10%`. Chọn option 2 vẫn không ăn discount.

**Root cause**: Shopify Function bỏ qua option khách chọn — nó chỉ nhìn `quantity` của
line rồi **tự suy ra tier**. Hai option cùng quantity ⇒ luôn khớp tier đầu tiên ⇒ option
`10%` không bao giờ được áp. Đây là lỗi mô hình, không phải lỗi số học: tier lẽ ra là
thứ khách **chọn**, không phải thứ hệ thống **đoán**.

**Fix**: storefront gửi kèm tier đã chọn (line attribute) ở cả **hai** luồng ATC —
`handleVolumeAddToCart` và `handleAovVolumeAddToCart` — và Shopify Function đọc thêm
attribute đó, ưu tiên tier đã pin hơn tier suy ra từ quantity.

Fix nằm trọn ở **luồng internal của app**, không đụng AOV — chứng minh bằng
`handleAovVolumeAddToCart.js` không có trong commit. Phân biệt widget nào đang render
trên product page: `data-avada-volume-source="native"` vs `"aov"`
(`VolumeBundleSection.js:254`).

## Techniques

- **Chứng minh test bắt được bug thật**: tạm ép helper bỏ qua tier đã pin → test đỏ đúng
  triệu chứng khách gặp (`expected [] to deeply equal [10]`, tức *không có discount nào*),
  rồi revert. Cùng kỷ luật với [[digest-pdf-2026-07-21]].
- `vite.config.js` của extension tồn tại để **chặn kế thừa** config cha; thêm alias vào
  đó là đụng build config chung → siết lại thành alias scoped riêng cho test
  (commit `07d54b0f1`) thay vì để nguyên.
- Config extension trống thì vitest không resolve được `@functions` — phải khai alias
  trước khi viết test.

Gate sau fix: `check` ok, `jest:fn` 203/203 suite, `jest:as` 13/13.
Nhánh `fix/volume-bundle-discount`, 2 commit.

Liên quan: [[subscription-digest-2026-07-11]] (bug volume discount đa tầng) ·
[[digest-subscriptions-2026-08-04]] (luật hiện badge của AOV volume) ·
[[shipped-subscriptions-2026-08-13]] (Volume Bundle native quantity-break SB-13947)
