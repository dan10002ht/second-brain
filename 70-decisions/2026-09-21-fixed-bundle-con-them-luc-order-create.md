---
type: decision
title: Fixed Bundle — contract chỉ giữ dòng cha, con được thêm lúc `orders/create`
summary: Bỏ nhánh bundle của cart transform; contract và đơn định kỳ chỉ mang sản phẩm cha (+ sản phẩm độc lập), các dòng con do webhook `orders/create` dựng lại từ định nghĩa bundle mỗi lần — gate theo cờ `enabledSyncBundleToContracts` cho đơn subscription, còn đơn one-time đi flow mới vô điều kiện.
tags: [subscription, shopify, avada, backend, architecture, patterns]
created: 2026-09-21
updated: 2026-09-21
review: 2026-12-21
source: project `subscriptions` — session history 2026-09-20/21 (store `sprayfreefarmacy`, MR !2626 + !2629)
---

# Fixed Bundle: contract chỉ giữ cha, con dựng lại lúc `orders/create`

## Bối cảnh

Khách enterprise (`sprayfreefarmacy`) mở đơn ra thấy mọi dòng con **$0**, không biết món nào đáng
bao nhiêu để swap ngang giá; và bỏ một món ra thì hệ thống hiểu là *thiếu hàng* nên đòi **refund**
trong khi khách đã trả trọn gói ở dòng cha. Đây là phần còn treo của
[[digest-subscriptions-2026-09-16]] ("sync giá ghi giá catalog vào line con", chưa có bản vá).

Đường cũ: cart transform `lineExpand` nở dòng bundle ngay trong giỏ, contract lưu sẵn cả cha lẫn
con (giá 0), charge xong là đơn mang y nguyên bộ con đã đóng băng từ lúc mua.

## Quyết định

| | Đường cũ | Đường mới (đã chọn) |
|---|---|---|
| Giỏ hàng | cart transform nở bundle thành N dòng | dòng bundle đi qua nguyên vẹn, **một dòng** |
| Contract | `A(cha) + B(con của A) + B(độc lập)` | `A(cha) + B(độc lập)` — không chứa con |
| Con xuất hiện ở đâu | đóng băng trong contract | webhook `orders/create` dựng lại từ **định nghĩa bundle** mỗi lần |
| Gate | — | cờ DevZone `enabledSyncBundleToContracts` cho đơn subscription; one-time **vô điều kiện** |

Kèm theo: backfill xoá 74 dòng con khỏi 4 contract production *trước* khi deploy; ẩn `Edit product`
/ `Swap product` trên dòng con ở admin (hai portal đã ẩn sẵn từ trước).

## Why

- **Cơ chế đã tồn tại, không phải xây mới.** `enabledSyncBundleToContracts` (bundleSyncResolver) đã
  dựng lại con từ definition lúc charge; việc cần làm chỉ là **thôi ghi con vào contract**, đúng
  hướng của [[2026-09-15-bundle-sync-resolve-muon]] và [[resolve-luc-doc-thay-vi-ghi-truoc]].
- **Bộ con đóng băng trong contract là bản sao phải giữ đồng bộ.** Merchant đổi định nghĩa bundle
  thì contract cũ vẫn giao bộ cũ — đúng lớp lỗi ở [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]].
- **`lineExpand` thay thế dòng cha chứ không thêm con cạnh nó** — nên chừng nào còn expand ở cart
  thì đơn **không bao giờ** có dòng cha để mang tiền và mang ghi chú swap.
- **Blast radius đo được:** 10 shop / 84 bundle, riêng `sprayfreefarmacy` 64 bundle (76%); đúng 2
  shop bật cờ. Gate theo cờ ≈ gate theo đúng khách đang cần.

## Tradeoff

- **Cửa sổ giữa backfill và deploy**: contract nào charge trong đó ra **hộp rỗng** (khách trả đủ
  tiền, không có món nào). Chốt chạy backfill trước rồi deploy song song, và đã kiểm trước là 18
  contract ACTIVE không có cái nào sắp charge.
- **Con chỉ dựng lại được khi định nghĩa bundle còn sống.** Một test cũ gãy đã chỉ ra đúng chỗ này:
  bundle bị xoá thì không ai dựng lại con → strip đi là giao hộp rỗng. Nên chỉ strip khi chắc chắn
  dựng lại được (`getBundleSyncBlockReason` có 5 cửa chặn; dính cửa nào thì rơi về đường cũ).
- **Hai đường cùng tồn tại vô thời hạn** — 8 shop chưa bật cờ vẫn chạy contract-có-con, nên guard
  phải phân biệt được *con của bundle* với *cùng sản phẩm nhưng mua độc lập*. Mutation test (đổi
  guard về "chỉ khớp key") làm gãy 4 test → guard có răng thật.
- **Đụng độ thiết kế với dev khác**: DamHV ship 18/09 `collectOosParentOnlyLines` chồng lên đúng cơ
  chế này. Kết cục là bỏ service riêng, rebase lên cơ chế của họ, chỉ nới cổng — nhưng đó là may,
  không phải quy trình.

## Điều kiện xem lại (2026-12-21)

Nếu tất cả shop dùng Fixed Bundle đã bật cờ, thì bỏ hẳn nhánh contract-có-con thay vì nuôi hai
đường. Ngược lại, nếu có shop bật cờ rồi mà gặp hộp rỗng do bundle bị xoá, thì phải chặn xoá
definition khi còn contract tham chiếu.

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-09-21]] ·
[[2026-09-15-bundle-sync-resolve-muon]] · [[resolve-luc-doc-thay-vi-ghi-truoc]] ·
[[gia-0-tren-dong-con-lam-mat-thong-tin]] · [[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]]
