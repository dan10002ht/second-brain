---
type: note
title: Digest Joy Subscription — 2026-08-03 (CLS, security audit, deploy CLI)
summary: CHỈ phần mới — chiến dịch giảm CLS in-app (skeleton lệch chiều cao, Crisp wrapper 0.916/lượt) với kỷ luật đo A/B, skill security-audit chủ động lộ ra storage.rules public, bug pricingGate chặn nhầm gói trả tiền, và deploy extensions chết vì CI pin Shopify CLI cũ.
tags: [subscription, shopify, avada, performance, auth, debug]
created: 2026-08-03
source: project "subscriptions" — session history (2026-07-31 → 08-02)
---

# Joy Subscription — digest 2026-08-03

> CHỈ ghi phần **chưa có** trong các digest trước. Auto-swap race, one-time bundle,
> SB-14700/14773, IDOR/open-redirect/tenant-isolation đã nằm ở
> [[digest-subscriptions-2026-07-28]], [[shipped-subscriptions-2026-07-28]],
> [[digest-subscriptions-2026-07-29]], [[digest-subscriptions-2026-07-31]].

## Feedback (cách làm việc)

- **"Làm xong bước nào verify ngay bước đó"** — không làm một lèo rồi mới sửa. Áp
  dụng trong suốt vòng CLS: mỗi fix đo A/B ngay, gỡ fix ra đo lại, rồi mới sang fix kế.
- **Đừng comment nhiều** — code đọc hiểu được thì thôi; chỉ comment chỗ có magic
  number (vd `24px line box`) hoặc lý do bắt buộc (`reportAllChanges`).
- Khi báo cáo sai → **đính chính thẳng**, không bảo vệ kết luận cũ. Trong session này
  có 2 lần tự đính chính đáng giá (xem mục Bugs).
- Nhánh có thể **bị đổi ngoài session** (`git status` snapshot đầu phiên hết hạn) —
  kiểm tra nhánh hiện tại trước mọi commit. Liên quan [[feedback-git-branch-discipline]].

## Decisions

- **Giữ chỗ bảng bằng `min-height: 820px` (10 dòng), chấp nhận mặt trái.** Trang
  nhiều dòng CLS về 0; trang **ít dòng** (1–4 dòng) lại sinh shift co ngược
  (0.0406 vs baseline 0.0127). Chọn tối ưu cho số đông vì đa số shop có ≥10 dòng.
  Làm **thuần CSS** (class + `min-height`), bỏ hướng "nhớ chiều cao lần trước qua
  storage" cho gọn.
- **Không sửa layout cuối** — chỉ đổi trạng thái đang loading. Merchant thấy giao
  diện y hệt sau khi data về.
- **Skill `security` nâng cấp thành playbook chủ động** (map attack surface → detect
  → verify), **bám riêng repo này** (đường dẫn + tên hàm + lệnh grep cụ thể) thay vì
  reference tĩnh chung chung. Why: bảng pattern chung không tự tìm ra endpoint nào cần soi.
- **Skill `slack` để local-only** (gitignore `.claude/skills/slack/` + `bin/slack`) —
  không push token/tooling cá nhân lên repo team.

## Bugs (root cause)

**CLS in-app**
- **Skeleton lệch chiều cao thật** là nguồn shift chính, lặp ở nhiều chỗ:
  `SkeletonBodyText` cao **8px** trong khi `Text variant="headingLg"` cao **24px**
  → cú `275x63 → 275x77`. Polaris skeleton small dùng `line-height-700` (**28px**)
  ở màn ≥768px trong khi ô giá trị thật 24px → dư đúng 4px.
- **Không render gì lúc loading rồi chèn nguyên block** khi data về → đẩy toàn bộ
  layout xuống +29px (`ReportSummary` ở Home).
- **Crisp**: wrapper `position: fixed` phình từ `120x120` góc phải sang
  `100vw × 100vh` khi mở chat → **0.916 mỗi lượt**, mở+đóng = **1.832**. Shift chỉ
  được miễn trừ nếu state đổi trong ~500ms sau input; round-trip `crisp:opened`
  vượt ngưỡng nên bị tính. Fix → 0, và vẫn phải verify 2 hành vi: wheel xuyên qua
  lúc đóng, nút bubble còn bấm được.
- **`body` bị Polaris khoá `height: 100%`** nên rect của `body` **luôn bằng
  viewport** — nó chỉ "dịch chuyển" chứ không cao lên, làm nhóm `html>body`
  (74% khối CLS) khó quy trách nhiệm nếu instrumentation không ghi `rect`.
- **`standalone.js` chạy một nhánh web-vitals riêng, tách rời** — chỉ `console.log`,
  không gửi về backend → 80% sample không có CLS. Sửa instrumentation (ghi thêm rect)
  là **điều kiện cần** trước khi fix, và phải mở schema backend cho field mới
  (`stripUnknown` sẽ vứt hết — bẫy Yup đã gặp lại lần nữa).

**Khác**
- **`pricingGate` chặn nhầm merchant trả tiền**: `limitPlanCal` trả
  `maxRevenue: maxRevenue || 0`, mà Advanced/Enterprise có `maxRevenue = null` →
  thành `0` → gate hiểu là "cap = 0" và chặn. Fix bằng `hasRealCap(limit)`
  (`isV5FreeCapModel` HOẶC `maxRevenue > 0`), viết regression test **fail trước khi fix**.
- **`storage.rules` có `allow read, write;`** — public read/write, chưa từng xuất
  hiện trong bản scan nào. Do skill audit mới lộ ra.
- **`getPendingRetryOrders`** dùng `.limit(100)` không phân trang → âm thầm bỏ sót
  đơn khi hàng đợi retry dài.
- **Deploy extensions chết ở CI nhưng local chạy được**: nguyên nhân là **CI pin
  Shopify CLI 3.86.1** còn local 3.94.3. CLI cũ không đóng gói asset
  (`tools.json` / `instructions.md`) → Shopify trả về `Assets are required for links
  using the admin.app.intent.link target`. Đây là lỗi **server-side lúc release**,
  không phải lỗi CI/CD hay config extension.
- Function extension `defer-last-discount` build fail vì thiếu script
  `graphql-code-generator` (thiếu `@graphql-codegen/cli`). Bên trong extension còn
  **shadow yarn classic 1.22.22** — codegen chạy bằng yarn 1 chứ không phải yarn 4 của repo.

## Techniques

- **Đo CLS bằng `PerformanceObserver({type: 'layout-shift', buffered: true})`** kèm
  in `previousRect → currentRect` và selector của `sources[].node`. Bẫy: mặc định
  console chạy ở frame **`top` (Shopify Admin)**, phải đổi context sang
  **`app-iframe`** — app prod ở origin riêng (`subscription.joy.so`).
- **Dev server serve `packages/assets/index.html`, không phải `standalone.html`** —
  sửa nhầm file làm cả một vòng "verified 0.0141 → 0" thành vô nghĩa. Luôn xác nhận
  file nào thật sự được serve trước khi tuyên bố đã fix.
- **Local không tái hiện được CLS** vì API trả quá nhanh (state `loading` không kịp
  paint) → phải **throttle mạng** và nới thời gian chờ (app dev + throttle boot ~17s).
- **Baseline chập chờn thì "0 ×3" không chứng minh gì** — chạy **5 lần mỗi bên**, và
  kiểm tra fix *thật sự đang chạy* (đọc giá trị đã lưu / probe DOM lúc đang load),
  đừng tin con số 0 có thể là do trang vỡ hoàn toàn (một lần `useEffect` tham chiếu
  biến trước khi khai báo làm trang trắng → CLS 0 giả).
- **Automation qua `agent-browser --profile`**: không mượn được session Chrome
  thường (cần `--remote-debugging-port`, Firebase auth nằm trong IndexedDB nên
  không dùng state file được) → cho user login **một lần** vào profile riêng, sau đó
  sweep tự động mọi route.
- **Audit script pattern**: đặt script vào `lib/` (build output, đã gitignore) để
  module resolution chạy đúng; nạp env bằng `set -a; . packages/functions/.env.local`
  (key prod là `ACCESS_TOKEN_KEY_PROD`).
- **Open-redirect ở store đã đổi domain**: allowlist phải lấy **cả hai** field mà
  `@avada/core` lưu — `shopifyDomain` (`*.myshopify.com`, không đổi) **và** `domain`
  (primary/custom domain). Mặc định an toàn là **path-only**.
- **Review nhánh lớn (170 file)**: chia 3 nhóm file cho subagent review song song,
  rồi **tự verify từng finding trên code thật** trước khi báo — finding High được 2
  agent độc lập tìm ra là tín hiệu mạnh. Chạy eslint + jest song song làm tín hiệu
  khách quan trong lúc chờ.
- **Theme block (Horizon/custom)**:
  - `{{ all_products[block.settings.x | default: 'y'] }}` **sai cú pháp** — không
    dùng filter trong `[...]` lookup, phải `assign` trước.
  - `all_products` chỉ resolve khi product **đã publish lên Online Store**; chưa
    publish thì ra `$0.00` + title là variant id.
  - Theme locale `en.default.json` (Horizon) có **comment header `/* */`** →
    `JSON.parse` thẳng sẽ vỡ; phải chèn dạng text.
  - Giới hạn: schema `name` ≤ 25 ký tự, setting `label` ≤ 70 ký tự.

## Liên kết

[[subscriptions]] · [[subscriptions-debug-runbook]] · [[digest-subscriptions-2026-07-31]] ·
[[shipped-subscriptions-2026-08-01]] · [[app-development]] · [[caching-layers]] ·
[[subscription-work-style]] · [[feedback-follow-conventions]]
