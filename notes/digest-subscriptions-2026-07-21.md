---
type: note
title: Digest Joy Subscription 2026-07-21 — freeze discount theo contract, giá email/widget sai nguồn, gotcha Liquid Horizon
summary: Phần mới ngày 07-21 — freeze discount vào line attribute lúc mua, chuỗi bug giá email billing/reschedule do lấy sai order nguồn, AVADA_BUNDLE global bị lag phải đọc DOM, lỗ hổng download PDF không auth, và loạt gotcha Liquid/Horizon + kỷ luật branch.
tags: [subscription, shopify, debug, avada, method]
created: 2026-07-21
updated: 2026-07-21
source: project "subscriptions" — session history (mined 2026-07-21)
---

# Digest Joy Subscription — 2026-07-21 (CHỈ phần mới)

Đã loại phần đã có ở [[digest-subscriptions-2026-07-19]], [[digest-subscriptions-2026-07-20]],
[[shipped-subscriptions-2026-07-21]], [[digest-subscriptions-2026-07-18]].

## Feedback

- **Luôn `git branch --show-current` NGAY TRƯỚC mỗi commit/push.** Đã commit + push nhầm lên `master` vì `git pull` fast-forward kéo working copy về master rồi mình giả định vẫn ở nhánh feature. Xử lý đúng: cherry-pick sang nhánh feature, **KHÔNG tự rewrite `master`** (nhánh chung) — hỏi user. (củng cố [[feedback-git-branch-discipline]] trong memory)
- **Session bắt đầu trên `master` → tạo nhánh TRƯỚC khi chạy workflow**, đừng chờ bị nhắc. `git checkout -b` giữ nguyên working tree nên không mất việc đã sửa.
- **Text customer-facing của merchant nước ngoài phải là tiếng Anh** — note đi vào order (`buildNoShipNote`) + label Liquid đã bị viết tiếng Việt. Comment code tiếng Việt thì OK. Nhớ đổi cả assertion trong test. (nhắc lại [[subscription-work-style]], lần này ở tầng note/Liquid)
- **Doc sinh ra phải "dày" bằng chuẩn có sẵn** — bản đầu chỉ +94 dòng bảng khô, user hỏi "có bị ít quá ko?". Chuẩn tham chiếu là `TS_TOOL_API.md` (scenario + curl + response mẫu) → 251 lên 556 dòng. Doc là deliverable, không phải phần phụ.
- **Khi user đưa bản "latest" của họ: base = nguyên văn bản đó, chỉ apply đúng phần được yêu cầu.** Bị bắt "bạn sửa thêm CSS à?" vì sửa lan trong khi chỉ được yêu cầu sửa logic discount + text.
- **Parity V1/V2 Customer Account**: fix giá ở scripttag CP mà quên New Customer Account (CAU) → tester báo lại. Quét cả 2 CP + mọi email builder. (một dạng của [[feedback-follow-conventions]])

## Decisions

- **Freeze discount theo contract lúc mua** — ghi `_joy_installment_discount` vào line attribute, extension ưu tiên frozen và fallback metafield. *Why:* Discount Function đọc product metafield **tại thời điểm billing**, merchant sửa 10%→20% thì contract cũ bị đổi theo dù khách đã được báo 10% lúc mua. Chỉ áp cho installment để không đụng luồng khác.
- **Không làm fallback cho contract cũ** — nhánh chưa live production nên chỉ lo contract mới. *Tradeoff:* giảm scope + rủi ro, đổi lại nếu nhánh live muộn sẽ phải bổ sung.
- **Repo `pdf`: giữ tên `apiV1`, chỉ bổ sung, không rename thành `supportApi`/`opsApi`.** *Why:* `git log` cho thấy `apiV1` chính là bản tương đương tsTool (commit `a0dd2536`, 2026-03-31, "Public API v1 for AI Agent support", spec `docs/public-api-spec.md`) — đặt tên mới sẽ tạo 2 khái niệm song song. → [[digest-pdf-apiv1-workflow-2026-07-21]]
- **Hạ effort tier cho phase cơ học trong workflow.** *Why:* user hỏi "sao token hết nhanh dù có rtk + serena?" — rtk/Serena chỉ tối ưu leaf-ops; phần tốn là subagent (P1–P3: 12 agent ~930k token / 44 phút).
- **Widget reformlabs tự tính hết giá, chỉ dùng AOV để drive cart action** (không đọc DOM AOV lấy giá). *Why:* `.AOV-SubscriptionsWidget__OptionPrice` chỉ có 1 giá subscribe, không per-supply → đè sai lên card đang chọn.

## Bugs (root cause)

- **Email "Billing failed" hiện giá gốc (567 thay vì 283.50)** — 2 tầng: (1) `buildBillingEmailProps` dùng `originalTotalPriceSet` thay vì `totalPriceSet`; (2) sâu hơn, `getBillingCycleContract` trả `order: {...originOrder, lineItems}` = **order GỐC**, không phải order của cycle → luôn là giá pre-discount. Đổi mỗi field là chưa đủ.
- **Email RESCHEDULE dùng builder riêng** (`prepareEmailRescheduledUpcomingOrderData` → `prepareCommonOrderData` + `prepareTicketEmailData`), **không đi qua** `prepareOrderData` đã fix → sót. Bài học: mỗi email type có thể có path giá riêng, phải liệt kê hết trước khi fix.
- **`UpcomingOrderCard` có 3 nhánh render `InlineProduct`** (nonBox / `bundleFixedProducts` / box); bundle parent đi nhánh giữa với args khác (`prepareLine(lineForRender, !isParent)`) → thêm prop ở 2 chỗ vẫn còn sai.
- **`contract.discountAllocations` chỉ trả `SubscriptionManualDiscount` / `AppliedCodeDiscount`**, KHÔNG có `DiscountAutomaticApp` → không lấy được số tiền discount function từ contract.
- **`AVADA_BUNDLE` global state bị LAG** — `volumeDiscountSelecting.volumeQuantity` và `product.selectedVariant` chỉ update **sau** khi AOV render → đọc lúc đổi qty/variant ra giá của lựa chọn trước. Fix: đọc qty từ **DOM tier** + tên variant từ DOM, chỉ dùng AVADA_BUNDLE cho data tĩnh.
- **`volumeDiscountSelecting.finalPrice` là giá của option ĐANG CHỌN** (one-time hay subscribe), không phải giá one-time → giá 2 option nhảy khi đổi lựa chọn.
- **Checkout STACK cả 2 discount (nhân chồng)**: subscribe = volume tier × (1 − sub%). Widget tính 5% trên base là sai (1003.20 × 0.95 = 953.04).
- **`subPct` tính từ `variant.selling_plan_allocations` biến mất khi option subscribe được chọn** → badge mất, giá về nguyên giá. Fix: `getSubPct(planId)` (không phụ thuộc trạng thái chọn).
- **pdf-invoice — lỗ hổng Critical (đã xác nhận bằng code):** `GET /admin/print/:type/download` không auth (`printSchema` chỉ đòi `shop` + `id`) + `router.use(verifyProxy(...))` bị comment ở `proxy.js:23` → tải PDF hoá đơn (PII + tài chính) của **mọi shop** chỉ với raw order id. Cùng file: `/print/preview` lại có `verifyCrypto() + checkAppScope`.
- **Widget trên theme chưa được dán lại ≠ lỗi code** — contract mới thiếu `_joy_installment_discount` vì theme còn chạy widget cũ. Precondition đủ 3 điều kiện: widget mới trên theme → contract mua mới có frozen attr → code đã deploy.
- **Staging embed hiện skeleton — chưa xác minh root cause.** Đã loại trừ: build assets OK, `/api/ping` 200, `/api/shops` 401 đúng luồng; giả thuyết `firebase.json` rewrite `/api/v1/**` nuốt route là **sai** (app dùng `apiPrefix.embed = '/api'`). Nghi stale chunk (lazy import fail) — **chưa kết luận**.
- Email reschedule hiện `Previous payment date: undefined aN, NaN` (lỗi format date) — **chưa fix**.

## Techniques

- **Chứng minh test fail là pre-existing bằng `git stash`**: chạy baseline trên cây sạch (8 suite fail / 5 test fail / 1156 pass) rồi so cây có thay đổi (8/5/**1169**) → kết luận chắc thay vì cãi bằng cảm tính.
- **Gate của workflow KHÔNG được chạy `eslint --fix` toàn package** — làm bẩn 70+ file không liên quan (diff 82 file thay vì ~8) và gây "gate fail" báo động giả. Đổi gate sang jest-only + ghi vào RULES. Revert danh sách file dài phải dùng `xargs` (word-splitting làm `git checkout` coi cả list là 1 pathspec → không revert gì mà cũng không báo lỗi).
- **Liquid / Horizon gotchas mới:**
  - Không dùng filter trong `[...]` lookup: `all_products[handle | default: 'x']` lỗi parse → `assign` trước.
  - `{% style %}` / `{% schema %}` viết trong **comment JS** vẫn bị theme editor parse như tag thật.
  - Setting `type: "color_scheme"` kéo scheme của theme; theme không định nghĩa → lỗi hiển thị. Bỏ setting, để block kế thừa scheme của section.
  - Giới hạn schema: `name` ≤ 25 ký tự, `label` ≤ 70 ký tự.
  - `locales/en.default.json` của Horizon có comment header `/* */` → không `JSON.parse` thẳng được, phải chèn textual.
  - `.sf-subhead` cần `display: flex !important` (Horizon override `display` của `<label>`); `--color-border` của theme khách có thể là `#000000` → dùng `rgb(var(--color-foreground-rgb) / 0.15)`.
- **`all_products[handle]` chỉ resolve khi product đã publish lên Online Store** — chưa publish ra `$0.00` + title fallback là variant id (dễ tưởng bug code).
- **`yarn trans` là merge-only**: xoá key phải xoá tay ở source JSON **và cả 7 locale**; báo "Translate 0 words" là đúng.
- **macOS chặn `~/Downloads` (TCC)** — cả Bash lẫn Read đều `EPERM`, không phải lỗi sandbox agent; nhờ user move file vào project.
- **`.gitignore` không chặn file đã track**: `docs/` bị ignore ở repo pdf nhưng `docs/public-api-spec.md` vẫn track → `git add` báo lỗi pathspec **nhưng file đã staged**; kiểm bằng `git ls-files`.
- **Lấy ảnh bug từ prnt.sc**: extract meta `og:image` rồi tải về đọc (Jira sub-task hay đính link prnt.sc).
- **`widgetCustomCSS` không xuất hiện trong `packages/scripttag/src`** → thêm vào schema mà storefront không đọc là vô nghĩa. `activeTextColor` gate theo **phiên bản widget**, không theo layout; bẫy: **số Block ≠ số Layout** và **label hiển thị ≠ value lưu DB**.
- **`ensureInstallmentDiscount` là query-based nên tự tạo cho cả store mới lẫn cũ; Cart Transform thì KHÔNG** — nếu flag `isCreatedCartTransform` đã true mà transform biến mất thì phải register tay qua `cartTransformCreate`.
- **`pbcopy` artifact cho user dán vào theme editor** — vòng lặp nhanh hơn hẳn với Custom Liquid 1200+ dòng.
- **Test JS của block trước khi dán**: strip Liquid `{{...}}`→`0`, `{%...%}`→`` rồi `new Function(js)` (lỗi braces thường chỉ do Liquid).

## Liên kết gợi ý

[[subscriptions]] · [[subscriptions-debug-runbook]] · [[digest-subscriptions-2026-07-20]] · [[shipped-subscriptions-2026-07-21]] · [[subscription-work-style]] · [[pdf]] · [[app-development]]
