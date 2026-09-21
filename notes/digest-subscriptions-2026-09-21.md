---
type: note
title: Digest subscriptions — 2026-09-21 (dòng con $0 của Fixed Bundle, và selling plan không ăn khi trang có nhiều form)
summary: Đơn $0-toàn-bộ của khách enterprise không đến từ cờ `enabledBundleSplitPrice` (0 shop bật trên toàn prod) mà từ nhân viên swap bằng Draft Order — dòng không selling plan thì cart transform chạy và `lineExpand` thay thế luôn dòng cha; kèm bug widget hỏi sai câu "input gần block nào" thay vì "input thuộc form nào", và một conflict hoá ra là đụng độ thiết kế với dev khác.
tags: [subscription, shopify, avada, backend, debug, storefront, billing]
created: 2026-09-21
updated: 2026-09-21
source: project `subscriptions` — session history 2026-09-20/21 (sessions 3e207f2a, 0fb64e0c; store `sprayfreefarmacy`, `grivesperfumes`, store dev `ag-dantt-prod1`)
---

# Digest — Joy Subscription, 2026-09-21

Vòng portal Wholefoods và migrate bundle đã ghi ở [[digest-subscriptions-2026-09-16]] →
[[digest-subscriptions-2026-09-19]]. Note này **CHỈ phần mới**.

## Bugs

**Đơn của khách toàn dòng $0 — nghi phạm đầu tiên sai hoàn toàn.** Cờ
`enabledBundleSplitPrice` trông như đúng thủ phạm (nó chọn giữa "giá gốc + giảm 100%" và "ghi thẳng
0"). Đo cả hai store rồi đo **toàn bộ database production**: `0` shop bật cờ đó, `10` shop bật
`enabledFixedBundle`. Nguyên nhân thật: nhân viên khách xử lý box swap bằng **Draft Order** trong
admin — đơn đó **không có selling plan**, mà dòng không selling plan thì Shopify cho cart transform
chạy → `lineExpand` xé tiền ra chia cho các món. Một cờ "nghe rất hợp lý" đã suýt thành kết luận.

**`lineExpand` thay thế dòng cha, không thêm con cạnh nó.** Đó là bản chất operation: Shopify xoá
cart line gốc rồi đặt các component vào chỗ đó. Vì thế đơn `#7177940598999` của khách *không chứa
sản phẩm cha* — và mọi phương án kiểu "để giá cha = X, con = 0 lúc cart transform" đều không dựng
được vì **không có dòng cha để set giá**.

**Ghi 0 lên dòng con là mất thông tin, không phải sai tiền.** Simple Bundles giữ giá thật trên dòng
con rồi đặt `ManualDiscountApplication` (`allocationMethod: ACROSS`) giảm 100%; Joy ghi thẳng 0. Cùng
số tiền, nhưng cách của Joy làm nhân viên mù giá khi swap và làm luồng order-edit hiểu "bỏ món ra"
thành "thiếu hàng" → đòi refund. Tách riêng ở [[gia-0-tren-dong-con-lam-mat-thong-tin]]; hướng xử lý
ở [[2026-09-21-fixed-bundle-con-them-luc-order-create]].

**Selling plan không ăn khi trang có nhiều form (`grivesperfumes`).** Hàm dò input của widget hỏi
**sai câu**: *"input có nằm trong 2 tầng quanh `data-block` không?"* — tức hỏi theo **khoảng cách**,
trong khi câu đúng là *"input này thuộc form nào?"* — hỏi theo **quyền sở hữu**. Commit trước đó đã
vá bằng cách nới thêm bậc cho một shop; nới tiếp là đi tiếp con đường đẻ ra bug. Sửa bằng một helper
chung cho cả hai call site, kết quả là **cả 3 form trên trang đều ăn** (form theme trên cùng, drawer,
và nút `type="button"` của PageFly tự gọi AJAX — cái cuối phải test riêng, không suy ra được).

**Ba dòng thừa trên đơn store dev không phải lỗi của app.** Đọc **mô tả discount** là ra ngay ai
thêm dòng nào: `"Joy Bundles: out-of-stock bundle child"` là job của mình, phần còn lại là app Simple
Bundles cùng chạy trên store đó. Nhân đó lộ một lỗi thật: cái tên đó đang hiện trên **mọi** đơn
bundle, không chỉ ca hết hàng mà nó được viết ra để phục vụ.

**"The Out of Stock Snowboard" chỉ là cái tên** — sản phẩm đó có tồn kho 10.909.840. Mất một vòng
đo vì tin tên sản phẩm là dữ kiện. Phải tìm variant `stock=0 policy=DENY` thật mới test được.

**18 contract ACTIVE đều OVERDUE ⇒ tưởng billing chết.** Quá hạn gần nhất 466h, xa nhất 6166h. Đo
tiếp thì 30 ngày qua có 600 đơn, trong đó **26 đơn có selling plan / contract**, đơn gần nhất vài
ngày trước → billing **không** chết. Một chỉ số quá hạn trên tập contract không trả lời được câu
"hệ thống còn charge không"; phải hỏi đúng đường đi của đơn.

## Techniques

- **Test một thay đổi frontend trên trang thật mà chưa deploy**: `network route --body` chỉ trả JSON
  nên không fulfill được file JS. Đường dùng được là **patch thẳng hook trong trang rồi click thật
  trong widget** — và chính nó lộ ra chỗ chốt sai: tự ghi giá trị vào input đi qua handler khác với
  click thật. (Bấm vào option **đang active sẵn** thì hook không chạy — phải kiểm riêng đường mount:
  `useEffect` có deps nên chạy cả lúc mount.)
- **Charge thử một recurring order trên store dev**: Shopify không cho charge cycle xa hơn **24h**.
  Dời lịch bằng selector-theo-date không ăn (nó chọn cycle *chứa* ngày đó, mà cycle đó đến hạn tháng
  12). Đường đi được: hạ chu kỳ contract xuống 1 ngày để **cycle kế tiếp** rơi trong 24h.
- **Đổi tunnel dev từ ngrok sang Tailscale Funnel**: `APP_BASE_URL` trong `.env.local` đã đúng host
  mới, nhưng **14 webhook đã đăng ký trên store vẫn trỏ ngrok cũ** — phải viết script đổi host cho
  từng cái. Webhook là state nằm ở Shopify, không phải ở env của mình.
- **Mutation test để chứng minh guard có răng**: đổi guard về "chỉ khớp key" → 4 test gãy. Trước đó
  9/9 xanh không chứng minh gì.
- **Dry-run trước khi ghi production**, và auto-mode classifier đã **chặn** lệnh xoá 74 dòng khỏi 4
  contract production — không tìm cách lách, chuyển cho dantt duyệt. Xem [[chan-agent-bang-cau-hinh]].
- `yarn eslint-fix` reformat **90+ file không liên quan** → revert hết, chỉ giữ file của mình.

## Context

**Một conflict không nên tự giải.** MR !2626 conflict vì master đã chạy thêm 17 commit — và người
sửa đúng file mình xoá (`bundleExpand.js`) là một dev khác vừa ship **cùng cơ chế** ngày 18/09
(`collectOosParentOnlyLines`, xử lý dòng chỉ-có-cha). Đây là đụng độ **thiết kế**, không phải đụng
độ văn bản: xử đúng là đọc job của họ, **bỏ service riêng của mình**, rebase lên cơ chế của họ và chỉ
nới cổng. Không có gate nào phát hiện được chuyện này — nó lộ ra vì đọc diff của người khác trước
khi resolve.

**Comment còn trỏ tới file đã xoá.** 5 comment trỏ `oneTimeBundleExpandService` sau khi xoá file.
Comment là thứ không có compiler nào kiểm.

- MR liên quan: `!2621` (selling plan scope), `!2626` (bundle parent-only, đã merge `db21c84ed`),
  `!2629` (hai guard sửa lỗi), `!2595`/`!2598` (dev khác, migrate contract + plan group landing).
- Đang treo: SB-17032 bug 1–3 (bug 4 + 5 đã có test xanh). Suite `simpleBundleMapping` fail sẵn trên
  master vì đọc fixture trong `memory-bank/` bị gitignore — **chưa xác minh** có ai đang sửa.

Liên quan: [[subscriptions]] · [[2026-09-21-fixed-bundle-con-them-luc-order-create]] ·
[[gia-0-tren-dong-con-lam-mat-thong-tin]] · [[digest-subscriptions-2026-09-19]] ·
[[bang-chung-phan-biet-duoc]] · [[chan-agent-bang-cau-hinh]] · [[subscriptions-debug-runbook]] ·
[[gate-tu-viet-la-nguon-xanh-gia]] · [[digest-subscriptions-2026-09-16]]
