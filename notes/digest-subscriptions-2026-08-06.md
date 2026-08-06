---
type: note
title: Digest Joy Subscription 2026-08-06 — crash subscriptionProducts, kỷ luật đo CLS, auto-merge MR tài liệu
summary: CHỈ phần mới của session 08-05/08-06 — doc Firestore thiếu hẳn field `product` làm trắng trang (4 chỗ deref không guard), worktree thiếu `.env.local` làm gate đỏ giả rồi bị khai là "pre-existing", loạt bẫy khi đo layout-shift bằng browser automation, và luồng auto-merge MR tài liệu của BA.
tags: [subscription, shopify, avada, performance, debug]
created: 2026-08-06
source: project "subscriptions" — session history (5 session mined, 2026-08-05 → 2026-08-06)
---

# Joy Subscription — digest 2026-08-06

> Chỉ ghi **phần chưa có trong brain**. Phần đã ghi rồi thì bỏ qua:
> chiến dịch CLS tổng quát ở [[digest-subscriptions-2026-08-03]], delivery-anchored
> billing ở [[digest-subscriptions-2026-08-05]], commit landed ở
> [[shipped-subscriptions-2026-08-06]], còn session installment stringflags
> (frozenDiscount, giá one-time metafield, chẩn đoán ATC storefront-vs-admin) đã nằm
> ở [[digest-subscriptions-2026-07-25]] và [[digest-subscriptions-2026-07-19]].
> Bối cảnh: [[subscriptions]] · runbook: [[subscriptions-debug-runbook]].

## Bugs

**Doc Firestore thiếu hẳn field `product` → trắng trang Subscription Products.**
`SubscriptionProducts.js:172` chạy `planItems.some(x => x.product.status === …)` ngay
trong render. Doc `subscriptionProducts/zN7S0jOs2r6HdfI6y7v4` (productId
`10476069978423`, shop `ranvoostyle`) **không có** field `product` — không phải null, là
thiếu hẳn. `createdAt`/`updatedAt` cách nhau 0.5s ⇒ doc được ghi 2 lần trong cùng nhịp
tạo, nghi ghi thiếu ở đường tạo chứ không phải data cũ (*chưa xác minh* nguyên nhân ghi thiếu).

Điều đáng học không phải chỗ crash mà là **phạm vi quét**: khi grep hết, có **4 chỗ
deref không guard** cùng kiểu — 2 ở repository, 2 ở service — cộng chỗ render FE. Fix
đúng là normalize `product` ở `subscriptionProductsRepository.js` (một nguồn) rồi guard
các chỗ còn lại, không phải vá đúng dòng 172. Đường `removeSubscriptionPlans` cũng đâm
vào cùng root cause qua background job — mà đó chính là **phản xạ đầu tiên của merchant
khi gặp trang lỗi** (xoá product hỏng), nên bỏ sót nhánh này là để merchant kẹt luôn.

**Gate jest đỏ vì worktree thiếu `.env.local`, không phải vì lỗi có sẵn.** Coder khai
"2 suite fail là pre-existing". Lời khai **đúng** (repo chính cũng đỏ) nhưng **chẩn đoán
sai**: `.env.local` / `.env.staging1` bị gitignore nên `git worktree add` không mang
sang, `@avada/core` không dựng được `Shopify.Context` → suite chết. Copy 2 file env sang
worktree: **1808 pass / 0 fail**. Bài học: "pre-existing" là kết luận **rẻ và dễ đúng bề
mặt** — phải hỏi tiếp *vì sao* đỏ, nếu không thì đang miễn trừ một gate lẽ ra xanh thật.

**`useEffect` tham chiếu biến trước khi khai báo → trang vỡ, và phép đo ra 0 giả.** Trong
lúc fix CLS list table, đặt `useEffect` dùng `loading` / `subscriptionContract` phía trên
chỗ khai báo chúng làm trang **không render table nào cả** — mà CLS của một trang vỡ thì
bằng 0. 10 lần đo ra 0 hoàn toàn là ảo; chỉ lộ ra khi kiểm `lastTableHeight` trong storage
và thấy nó **chưa từng được ghi** ⇒ fix chưa hề chạy. Xem thêm mục Techniques.

**Reservation chiều cao list table gây regression nhìn thấy được.** Bản giữ chỗ 820px kéo
CLS 0.0432 → 0, nhưng shop có 0–1 dòng thì vẽ một khối trắng cao kèm chữ "No subscriptions
found" rồi co lại (đo được: 1 dòng → **0.0406**, tệ hơn baseline 0.0334 của trang
products). Đã revert và thay bằng skeleton rows co theo kết quả thật. Chi tiết commit ở
[[shipped-subscriptions-2026-08-06]].

**Toàn bộ shift mức `body` trên production là một lỗi duy nhất, tầm thường.** 31/31 mẫu
trong ngày đọc `8,8 → 0,0`: browser vẽ boot screen trong margin 8px mặc định của UA rồi bỏ
nó khi stylesheet về. Chiếm **4.59 trên tổng ~25 CLS**, đỉnh 0.989 trên điện thoại. Fix là
`margin: 0` trong boot styles của 3 file HTML. Nhóm to nhất của cả chiến dịch hoá ra không
phải component nào — mà là thiếu reset ở `index.html`.

**`Polaris-Page` lật giữa 998px căn giữa ↔ full width = bucket 49%.** Không phải
`LoadingFallback` mà là chính các trang list: `useFetchGrid({initLoad: false})` khởi tạo
`loading: false`, nên lần render đầu không phân biệt được "chưa fetch" với "shop rỗng" →
trang paint ở default width rồi nhảy sang `fullWidth`. Đo trên production: `328,0 998x670
→ 0,0 1653x798`, và bản đo tại chỗ bắt được cú `431px → 894.5px = nhảy 464px`. Cùng
pattern còn ở **Plans** và **Subscribers**.

## Techniques

**Control test trước khi tin một phép đo ra 0.** Nhiều lần trong session, "0 shift" là do
**harness hỏng** chứ không phải do fix ăn. Ba cách hỏng đã gặp, mỗi cách một cơ chế:
- Script bám vào **tab nền** — tab ẩn không render nên không phát `layout-shift` entry nào.
- `PerformanceObserver` **live** không nhận entry vì eval chạy trong *isolated world*;
  chỉ `{type:'layout-shift', buffered: true}` mới đọc được.
- Tab chạy nhiều giờ qua nhiều navigation thì **ngừng ghi nhận shift** hẳn — kể cả
  `document.body.style.marginTop = '120px'` cũng không sinh entry.

Cách phát hiện cả ba: chèn một khối 200px vào đầu trang (hoặc set `marginTop`) làm
**control test**. Control ra 0 ⇒ vứt phép đo, đừng kết luận. Đã khái quát hoá ở
[[do-layout-shift-bang-browser-automation]].

**Baseline chập chờn thì "3 lần đều 0" không chứng minh gì.** Baseline của list table ra
0.0432 ở run 1 và 0 ở run 2 — tuỳ data về trước hay sau paint. Phải chạy ≥5 lần mỗi bên và
so tỉ lệ (3/5 có shift vs 0/5), cộng thêm **assert render** (`rows=10`) để loại trường hợp
0 do trang trắng.

**Local không tái hiện được thì tự tạo điều kiện, đừng suy diễn.** API local trả quá nhanh
nên state `loading` không kịp tồn tại → CLS luôn 0 ở cả 2 nhánh. Throttle request API
(chỉ request, không throttle module dev — để trang vẫn kịp cao lên và có chỗ cuộn) là bắt
được shift ngay. Kèm bẫy: dev + throttle làm app boot tới ~17s, đo với cửa sổ chờ 16s là
**hụt**, ra 0 giả.

**Dev server serve `packages/assets/index.html`, không phải `standalone.js`** — sửa nhầm
file thì "verified 0.0141 → 0" là kết luận sai. Kiểm tra đường phục vụ thật trước khi tin
số A/B.

**Mượn session đăng nhập bằng profile riêng của agent-browser.** Chrome của user không bật
remote-debugging và Firebase auth nằm trong IndexedDB nên **state file không dùng được** —
phải `--profile` riêng, user login **một lần**, sau đó sweep tự động mọi route. Đo trong
Shopify Admin thì phải chọn đúng frame `app-iframe`: app chạy ở origin
`subscription.joy.so`, admin ở `admin.shopify.com`, đo ở frame `top` chỉ ra shift của
chính giao diện Polaris của Shopify.

**Dựng skeleton bằng số đo thật của từng khối, không đếm dòng.** Skeleton tab Settings/Email
đi từ 48px → 1606px qua nhiều vòng: mỗi dòng email đúng **72px**, section 1 = 6 dòng
(437px), section 2 = 9 dòng nhưng cao 776px (≈86px/dòng vì mô tả xuống 2 dòng), sender card
đúng 144px. Đếm dòng ra sai; đo chiều cao từng block ra khớp còn lệch 5px/1611 (0.3%).
Kèm chi tiết dễ quên: **thứ tự phần tử cũng phải khớp** (toggle nằm bên phải cạnh mũi tên,
không phải bên trái) — nếu không thì skeleton đúng chiều cao nhưng vẫn "không giống màn thật".

**Cỡ mẫu nhỏ làm dashboard p75 nhảy loạn.** Ngày 6/8 dashboard chỉ ghi **21 loads**; với
21 mẫu thì p75 là mẫu xấu thứ 6 — một phiên xấu kéo cả điểm lên. Trước khi kết luận "app
tệ đi", kiểm số lượng sample.

**Worktree: nhánh tồn tại nhưng repo chính không thấy.** Nhánh `fix/subproducts-crash` sống
trong worktree `~/projects/subscriptions-wt-subproducts`; đứng ở repo chính (`~/projects/subscriptions`,
lúc đó đang ở `perf/cls-sources`) thì không thấy — và nguy hiểm hơn: nhánh của repo chính có
upstream trỏ thẳng `origin/master`, nên gợi ý `git push` mà git đưa ra sẽ **đẩy vào master**.
Luôn xác nhận đang đứng ở đâu trước khi nghe gợi ý của git. Xem [[feedback-git-branch-discipline]].

**macOS case-insensitive giấu lỗi `git add`.** Repo track file tên `changelog.md` (chữ
thường); edit vào `CHANGELOG.md` thì thực ra sửa **đúng** file, nhưng `git add CHANGELOG.md`
không khớp case nên thay đổi không vào commit.

**Brief giao cho verifier càng nhiều việc thì càng chậm.** Giao 6 việc thay vì "chạy test +
soát diff" là lý do chính verifier chạy lâu. Xem [[2026-08-04-looptasks-verifier-doc-lap]].

## Context

- Task #4 đóng bằng MR **!2444** (`fix/subproducts-crash`, commit `64764171f`, base
  `origin/master`), tạo qua skill `/create-mr` của repo.
- Hook guard `git push needs a human` chặn mọi lần push tự động — đây là hàng rào cố ý,
  không lách bằng cách gọi lại lệnh.
- Có một session tư vấn **MCP cho Joy Subscription**: chốt hướng "vừa nội bộ vừa có thể
  thành feature bán cho merchant" nhưng đó thực chất là **2 sản phẩm với 2 auth mode khác
  nhau**. Chưa build gì, mới dừng ở tư vấn kiến trúc.
- Luồng auto-merge MR tài liệu của BA tách riêng ở
  [[2026-08-06-auto-merge-mr-tai-lieu-ba]].

## Liên quan

[[digest-subscriptions-2026-08-05]] · [[digest-subscriptions-2026-08-03]] ·
[[shipped-subscriptions-2026-08-06]] · [[do-layout-shift-bang-browser-automation]] ·
[[2026-08-06-auto-merge-mr-tai-lieu-ba]] · [[2026-08-06-appbridge-v3-sang-max-modal]] ·
[[subscriptions]] · [[feedback-comment-chi-khi-code-roi]] · [[feedback-follow-conventions]]
