---
type: note
title: Digest subscriptions — 2026-09-24 (dọn hậu quả swap bundle trên contract parent-only, và thủ phạm dòng cha trùng không phải swap)
summary: 16 contract của Joy Wholefoods bị nhồi dòng con sau swap box (thu sai $176,15/chu kỳ) — nhưng dòng cha TRÙNG thì do job sync giá fail lặp lại vì contract có cycle edit, không do swap; app chỉ theo dõi được MỘT bundle mỗi contract (`.find()` ở 8 module, !2637); backfill có guard all-or-nothing nên bỏ qua đúng những contract nặng nhất; và app tự xoá metafield plan còn `{}` làm widget mất hẳn trên storefront.
tags: [subscription, shopify, avada, billing, debug, backend, storefront]
created: 2026-09-24
updated: 2026-09-24
source: project `subscriptions` — session history (session 65eb4665 phần cuối: Joy Wholefoods + Bobbys Box; session f4a437fd: metafield plan; session c8d88bd6: worktree `fix/billing-failed-manual`)
---

# Digest — Joy Subscription, 2026-09-24

Phần *cái gì lên master* nằm ở [[shipped-subscriptions-2026-09-24]]. Note này ghi **phần điều tra**:
vì sao hỏng, cái gì đã bị chẩn đoán sai, và cái gì còn là nợ.

Bối cảnh mô hình: shop bật `enabledSyncBundleToContracts` thì contract **chỉ giữ dòng cha**, dòng con
được job `restoreDeferredBundleChildren` thêm vào từng order với giá catalog + discount 100% — quyết
định [[2026-09-21-fixed-bundle-con-them-luc-order-create]], khuôn
[[gia-0-tren-dong-con-lam-mat-thong-tin]].

## Bugs

**Swap box ghi ngược dòng con vào contract parent-only.** `applySwapBundleExpansion` (dùng chung bởi
`contractService.js:451` sửa cả subscription và `orderService.js:667` sửa riêng kỳ tới) **không kiểm
cờ** — nó xử như shop thường: đổi dòng cha rồi ghi lại toàn bộ ~20 món con vào contract ở
`currentPrice: '0.00'`. Kỳ charge sau, Shopify đưa cả 20 dòng đó lên order (lần 1), rồi job restore
thấy thiếu nên thêm tiếp (lần 2) — `subtractRestoredQuantities` chỉ trừ những dòng **chính nó** đã
thêm, không biết dòng nào đến từ contract. Vá bằng một predicate dùng chung
`shouldDeferBundleChildrenToOrder.js` (!2634 → `v2.35.64`).

Hai đơn lộ ra hai mức hậu quả khác nhau từ **cùng một cú swap**:

| Đơn | Triệu chứng | Mức |
|---|---|---|
| `#129513` Shannon Cant | 23 item — một hộp đủ món nhưng nằm ở **hai kiểu hiển thị** (dòng contract $0 không có giá gạch ngang, dòng restore có) | chỉ xấu |
| `#129512` Bon Smith | 42 item, `$95 × 2 = $190` — swap còn để lại **dòng cha thứ hai** nên restore nhân đôi theo số dòng cha | mất tiền |

**Dòng cha TRÙNG không do swap — do job sync giá fail lặp lại.** Đây là chỗ chẩn đoán bị đảo. Mốc
thời gian bác giả thuyết swap: Simone swap lúc 20/09 22:46 nhưng đơn trùng cha tạo 20/09 11:00,
**trước 12 tiếng**. Cloud Logging cho thấy job sync giá fail nhiều ngày trên đúng 4 contract đó với
lỗi Shopify *"cannot be updated if there is a current or upcoming billing cycle contract edit"* —
mọi lỗi trong hàm sync đều bị `console.error` nuốt nên không ai thấy. Bốn giả thuyết khác đã bị loại
bằng code, không bằng cảm tính: vòng xoá không chạy (chỉ một call site, truyền `false` ⇒ có chạy),
lệnh xoá throw rồi bỏ luôn vòng thêm (⇒ không đẻ dòng thừa), rotation tạo trùng (`nonBundleLines`
loại mọi dòng cùng group rồi ghi lại đúng một cha ⇒ nó **gộp**, không tạo), order doc dựng từ
contract (thực ra dựng từ `getUpcomingBillingCycles`).

**App chỉ theo dõi được MỘT bundle mỗi contract.** `findBundleParentInProducts` dùng `.find()`, và
giả định số ít đó nằm ở **8 module** (charge guard, strip children, rotation, parent-variant repair…).
Hệ quả hai chiều trên cùng một shop: contract của Kristen có hai box thì box thứ hai **không được gắn
thẻ** nên rơi khỏi flow bundle (job restore vẫn nhận ra nó qua định nghĩa, nhưng guard và rotation
thì không). Sửa ở !2637 (`feat/multi-bundle-contract`) — đây là **feature gap**, không phải bug một
dòng: sửa xong mới gắn thẻ được cho 4 contract paused.

**App tự xoá metafield plan của product, còn lại `{}`** (session f4a437fd, shop `npsvyn-5h`). Shopify
vẫn giữ đủ selling plan, nhưng widget không có data để render nên **mất hẳn, không báo lỗi gì**.
Auto-triage trong thread Slack chẩn đoán sai hướng (nghi `| json` trong snippet Dev Zone). Code path
dùng chung ⇒ **lỗi hệ thống**, chỉ bung khi webhook `selling_plan_group/update` về thiếu payload;
cùng mốc `2026-09-23T14:22:47Z` có **3 product bị đụng cùng lúc**, 1 được ghi đầy, 2 bị rỗng. Lý do
chỉ một store báo: triệu chứng im lặng, và merchant save lại plan là tự lành.

## Techniques

**Guard all-or-nothing của script sửa dữ liệu bỏ qua đúng ca nặng nhất.** `backfillParentOnlyContracts`
từ chối mọi contract có dòng con **bị tính tiền** — mà đó chính là 3 contract đang thu sai
$176,15/chu kỳ. Chạy backfill xong vẫn thấy "3 contract lỗi" nhìn như backfill hỏng; thật ra nó đã
chạy (21/09 09:14 UTC, dấu vết là 3 doc cùng `updatedAt` đúng phút đó) và **cố ý skip**. Bài học:
guard phải in ra *đã skip cái gì và vì sao*, nếu không người vận hành đọc "chạy xong" thành "đã sạch"
— cùng họ với [[loi-mang-bi-bao-thanh-ly-do-nghiep-vu]].

**Phân loại cycle edit thành "sống" và "chết" trước khi quyết.** Ba contract bị chặn vì "kỳ sắp tới
có edit"; soi ra edit của Tara nằm ở cycle #2 hạn **14/08 đã trôi qua** (và nội dung là box đời cũ),
trong khi cycle #3/#5 đã BILLED ⇒ edit chết, gỡ được. Một cờ "có edit" không phải tiêu chí — **hạn
của edit** mới là.

**Món khách tự thêm có thể chỉ sống trong cycle edit bên Shopify, không có trong order doc.** Sauerkraut
của Tahnee không có trong order doc ngày 29/09 — nó được thêm thẳng trong Shopify. Nên trước khi xoá
cycle edit phải kiểm món đó sống ở đâu, kẻo "dọn" thành mất hàng của khách.

**`uniqid` trên prod ngắn hơn hẳn trên máy.** Local ra `6vtbl1tpnmudycrbm` (mac + pid + time), prod
ra `1mubrceck` — **9 ký tự, mất phần mac, `pid = 1`**. Group id của bundle sinh bằng nó, nên không
gian giá trị hẹp hơn nhiều so với dự kiến. Chưa xác minh đã có va chạm thật.

**Group id tự khai ngày sinh.** Quét group id theo shop cho biết dòng con được ghi vào contract *lúc
nào* — đó là cách chứng minh "backfill chỉ dọn hiện trạng, không bịt lỗ" mà không cần log.

**Script sửa prod phải có retry cho `THROTTLED` và cho `fetch failed`.** Hai lần bị cắt giữa chừng
(timeout mạng ở bước liệt kê contract — trước mọi lệnh ghi; rate limit Shopify ở contract cuối). Cả
hai lần contract **không bị dọn dở** vì draft chưa commit, nhưng đó là may chứ không phải thiết kế.

**Kiểm chứng bằng đường khác với đường vừa ghi.** Sau mỗi đợt strip, audit độc lập quét lại toàn shop
(`MONEY 0 · GOODS 0 · 19 contract clean`) thay vì tin dòng script tự in — [[ack-khong-phai-hieu-ung]].

## Context

- **Kết quả dọn:** Joy Wholefoods 16 contract lỗi → 23 sạch, 0 finding; **137 dòng xoá,
  −$320,75/chu kỳ**. Bobbys Box (`2dqs78-kz`, shop thứ hai bật parent-only) cũng được dọn.
- **Quét 11 shop dùng Fixed Bundle:** 0 dòng con bị tính tiền trên cả 11; chỉ 2 shop bật parent-only;
  2 shop không đọc được vì đã **gỡ app** (`ktfs7b-if` 14/04, `caretuals` 17/07) — không phải lỗi token.
- Con số "5 contract mất giá gạch ngang" tôi báo là **sai**, thật là 3 — vì đếm cả cờ "staged edit"
  của hai edit đã chết. Cùng lớp lỗi với [[con-so-trong-tieu-chi-phai-kem-cach-do]].
- Dòng con nằm trên contract Shopify nhưng **Joy admin cố tình giấu**, nên "tôi không thấy sản phẩm
  đó" không phải bằng chứng nó không tồn tại.
- Session riêng `c8d88bd6` (worktree `fix+billing-failed-manual`): bỏ early-return `isAutomatic` trong
  `handleSend…` ⇒ billing attempt **thủ công** thất bại cũng gửi email như attempt tự động. MR
  [!2638](https://git.avada.net/avada/subscriptions/-/merge_requests/2638), security review sạch.
  Chưa xác minh đã merge.

## ⚠️ Còn nợ

1. **Bug sync giá fail trên contract có cycle edit chưa vá** — chỉ tắt tính năng cho shop này
   ("1. Ko cần nhé, tôi tắt cho khách r"). Nó vẫn đúng cho 9 shop Fixed Bundle còn lại vì contract
   của họ vốn lưu dòng con.
2. **Vì sao case Nicholas Muller không bị** — hai khả năng (swap sau khi fix lên 23/09 16:59 VN, hoặc
   contract đó vốn chưa được dọn sang parent-only nên swap xong vẫn nhất quán). Chưa kiểm.

Liên quan: [[subscriptions]] · [[shipped-subscriptions-2026-09-24]] ·
[[2026-09-21-fixed-bundle-con-them-luc-order-create]] · [[gia-0-tren-dong-con-lam-mat-thong-tin]] ·
[[2026-09-24-parent-only-xoa-het-dong-con]] · [[script-pha-du-lieu-tu-choi-flag-la]] ·
[[ack-khong-phai-hieu-ung]] · [[loi-mang-bi-bao-thanh-ly-do-nghiep-vu]] ·
[[con-so-trong-tieu-chi-phai-kem-cach-do]] · [[khong-error-boundary-hong-ca-man-hinh]]
