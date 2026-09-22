---
type: note
title: Digest subscriptions — 2026-09-22 (order "upcoming" trỏ vào cycle đã trôi qua, portal vỡ chữ ở 390px, và vá xong 9 contract bị sync giá)
summary: Shopify từ chối mọi `billingCycleSelector` trỏ vào cycle nằm TRƯỚC cycle đã billed nên 38/230 order mà portal vẫn gọi là "upcoming" không thao tác được; khung `Grid ['68%','fill']` không có breakpoint làm chữ ở 390px xuống dòng mỗi dòng một ký tự; và 9 contract bị sync giá ghi giá catalog vào line con đã được đưa về $0 — con số thật là 9 chứ không phải 8 như report của dev.
tags: [shopify, subscription, debug, avada, project, extensions]
created: 2026-09-22
updated: 2026-09-22
source: project `subscriptions` — session history (session 65eb4665 đóng vòng fixed-bundle + landing joyxjoy, session 0fb64e0c portal Wholefoods SB-17032 + responsive)
---

# Digest — `subscriptions`, 2026-09-22

Phần thiết kế "con dựng lại lúc `orders/create`" đã ghi ở
[[2026-09-21-fixed-bundle-con-them-luc-order-create]]; phần charge đúp và cart transform ở
[[digest-subscriptions-2026-09-21]]. Note này **CHỈ phần mới**: đóng vòng bằng backfill trên prod,
vá dữ liệu vụ sync giá, và đợt bug SB-17032 của portal Wholefoods.

## Bugs

**Order "upcoming" trỏ vào cycle đã trôi qua — Shopify từ chối, không phải vì khách skip.**
Portal liệt kê 38/230 order của store khách là upcoming trong khi cycle của chúng đã qua, trải trên
17 contract, cái cũ nhất đề ngày 22/02/2026. Giả thuyết đầu tiên là "do cycle bị skip" — **sai**,
và thí nghiệm đối chứng trên cùng một contract ở staging chứng minh điều đó:

| Cycle | Kết quả |
|---|---|
| 1, 2 (trước cycle đã billed) | `REJECTED: Billing cycle selector is invalid` |
| 4 (hiện tại) | OK |

Luật thật: selector chỉ hợp lệ từ cycle đang chạy trở đi. Cả hai cycle bị từ chối đều **chưa từng
bị skip**, chỉ đơn giản là nằm trước cycle đã billed.

Chỗ đáng nhớ ở bản vá: khoá phải neo theo **ngày charge của chính order đó**, không được dùng
`resolveDeliveryDate` — hàm này ưu tiên attribute ở **cấp contract**, mà attribute cấp contract luôn
mang ngày tương lai, nên nếu dùng nó thì không order quá khứ nào bị khoá. Cùng họ với
[[2026-09-18-timezone-resolve-luc-doc]]: một giá trị "cấp contract" không mô tả được từng kỳ.

**Chữ vỡ thành mỗi dòng một ký tự ở 390px — khung hai cột không có breakpoint.**
`General.js` và `OrderDetail.js` khai `Grid ['68%','fill']` cứng, không điều kiện. Ở khổ iPhone
390px cột phải còn ~60px nên `Next delivery` render thành `N/e/x/t d/e/l/i/v/e/r/y`, `Subtotal`
thành `S/u/b/t/o/t/a/l`. Hai chi tiết đắt hơn cả bản vá:

- Breakpoint `small` của Shopify nằm **dưới 375px**, nên đặt điều kiện ở `small` là vô tác dụng cho
  mọi điện thoại thật. Phải dùng `medium`.
- `Style` áp vào `columns` của `InlineLayout` **không** có tác dụng như khi áp vào `Grid` — pill
  "Editing open until …" vẫn nằm cạnh sau khi đổi. Đã revert thay đổi đó. *Chưa xác minh* vì sao;
  cũng có thể là giới hạn của platform, giống [[feedback-gioi-han-platform-thi-go-khong-chan]].
- Hàng 4 cột trong `DeliverySection` tưởng là một bug riêng, hoá ra chỉ là hệ quả của cột cha bị
  bóp — sửa khung là hết. Một triệu chứng, hai lớp nguyên nhân.

**Sync giá ghi giá catalog vào line con — vá xong dữ liệu, và số thật lớn hơn report.**
Digest 09-16 để treo ở mức "chưa có bản vá". Nay đã đưa **9 contract / 21 line** về `$0` (phải ghi
cả ba chỗ: `currentPrice`, `pricingPolicy.basePrice`, `cycleDiscounts[].computedPrice`). Dev report
8 contract / $135.60; đo lại ra **9 / $186.95** vì sync còn chạy thêm một lượt nữa trước khi cờ được
tắt — con số trong một report luôn là ảnh chụp tại thời điểm viết, phải đo lại trước khi hành động.

Root cause nằm ở tầng tìm contract: `getAllSubscriptionContractsByProductId` query
`productIds array-contains`, mà `productIds` chứa **cả id của line con**, nên mọi contract có sản
phẩm con đều bị kéo vào diện sync. Không tầng nào phía sau loại line con ra.

Tác dụng phụ phải biết trước: commit contract để ghi giá **xoá cycle edit** của contract đó (một
contract dính, đã restore từ snapshot chụp trước khi chạy). Đây là lý do snapshot phải nằm ngoài
worktree — mất worktree là mất luôn dữ liệu rollback.

**Nhãn discount `Joy Bundles: out-of-stock bundle child` hiện trên MỌI dòng con.** Đúng với ca
DamHV viết nó (thêm lại hàng hết tồn), sai với ca mới (mọi đơn bundle giờ đều đi qua job đó). Nhân
viên khách mở đơn mỗi ngày để swap nên chữ hiển thị sai không phải chuyện cosmetic thuần.

## Techniques

**Trước khi xoá dòng con khỏi contract, phải chứng minh dựng lại được.** Script backfill ban đầu
chỉ xét rotation snapshot / con có giá / cycle edit — **không** xác nhận dòng cha còn dựng lại được
bộ con. Bổ sung phép kiểm đọc **cả hai nguồn**: metafield trên Shopify **và** doc `productBundle`
trong Firestore, cộng `getBundleSyncBlockReason` trả ALLOWED. Xoá 74 dòng khỏi 4 contract prod,
kiểm lại hình dạng sau khi ghi. Cùng nguyên tắc với [[ack-khong-phai-hieu-ung]].

**Clone contract prod sang store dev: ghi Firestore là chưa đủ.** Contract không tồn tại trên
Shopify thì mọi mutation của portal fail, và đó là thứ cần test. Đường đúng là dùng chính tính năng
có sẵn của app — `manual-create` → `subscriptionContractAtomicCreate` — rồi gọi thẳng webhook
handler `handleSubscriptionContractCreate` để sync ngược về app, thay vì tự bịa doc. Hai bẫy vấp
phải trên đường đó:

| Bẫy | Hậu quả |
|---|---|
| `subscriptionDraftUpdate` thay **cả mảng** custom attribute | xoá mất `_joy_source: 'manual'` → handler rẽ sang nhánh checkout và đòi `originOrder` |
| `String(x).endsWith('')` luôn `true` | chế độ PATCH với `boxVariantId: ''` gán **mọi** line thành box, xoá sạch marker staple |

**Kiểm tra data thật của store prod trước khi live, không tin staging.** Prod `sprayfreefarmacy`
khác staging ở chỗ chí mạng: `newPlanVersion: true`, 78 fixed bundle (staging có 3), và contract
mang **cả hai cách viết** attribute giao hàng — Bird (`Delivery Date`, `Delivery Day`) lẫn Zapiet
(`Delivery-Date`, `Pickup-Date`). Ba hàm đọc chỉ hiểu cách viết của Bird, nên contract Zapiet rơi về
ngày billing và không resolve được múi giờ. Lỗi này **không thể** lộ ra ở staging.

## Context

- **`simpleBundleMapping` là suite hỏng sẵn trên MỌI checkout sạch** — nó đọc fixture trong
  `memory-bank/`, thư mục bị gitignore. Đừng đếm nó là hồi quy; mọi con số gate trong đợt này đều
  ghi kèm ngoại lệ đó.
- **Working copy bị đổi nhánh từ ngoài session hai lần** (`fix/bundle-child-guards` →
  `feat/reward-qty-milestone-be`, thay đổi rơi vào stash). Máy này có session/người khác dùng chung
  checkout — nên "tree sạch" không phải là một trạng thái mình kiểm soát được.
- **`yarn eslint-fix` reformat 90+ file không liên quan.** Phải revert hết, chỉ giữ file của mình,
  nếu không diff review không đọc được.
- **Comment nhiều lần thứ ba bị nhắc** trong cùng đợt, và lần này còn bị bác cả phần comment một
  dòng ("đọc code là hiểu mà"). Ghi ở [[feedback-comment-chi-khi-code-roi]] — vấn đề không phải
  chưa biết luật, mà là luật bị quên giữa một task dài.
- **Đợt SB-17032 được gộp về một MR duy nhất** (!2631, 4 commit tách theo từng việc) theo yêu cầu,
  sau ba lần trước đó push nhầm vào nhánh đã merge.

## Liên quan

[[subscriptions]] · [[2026-09-21-fixed-bundle-con-them-luc-order-create]] ·
[[digest-subscriptions-2026-09-21]] · [[shipped-subscriptions-2026-09-22]] ·
[[digest-subscriptions-2026-09-16]] · [[gia-0-tren-dong-con-lam-mat-thong-tin]] ·
[[cors-error-co-the-la-private-network-access]] · [[feedback-dung-agent-browser-cua-project]] ·
[[bang-chung-phan-biet-duoc]] · [[con-so-trong-tieu-chi-phai-kem-cach-do]] ·
[[khong-error-boundary-hong-ca-man-hinh]]
