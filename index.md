# index.md — Bản đồ toàn bộ brain

> LLM đọc file này ĐẦU TIÊN để biết brain có gì, rồi mới drill vào file cụ thể.
> Cập nhật file này mỗi khi thêm/di chuyển note đáng kể.

_Cập nhật: 2026-08-06 · Trạng thái: đã seed 12 project + notes học tập từ ~/projects · inbox trống (xử lý 10 item ngày 08-06: 2 digest + 2 shipped + 3 decision + 2 feedback + 1 resource)_

> **Brain ở project khác:** `brain-core.md` (root) được `~/.claude/CLAUDE.md` import nên
> vào context ở MỌI repo — giữ mỏng, chỉ thứ luôn đúng. Tra sâu từ repo khác: skill `/brain`.

## 🎯 Projects (10-projects/) — việc có mục tiêu + deadline

- [[build-my-brain]] — dựng wiki tri thức cá nhân này (status: active, deadline 2026-07-31).
- [[ai-eng-guide]] — bộ guide 5 layer (Prompt → Context → Harness → Loop → Graph) cho team dev Avada dùng Claude Code. → [[ai-eng-thuat-ngu]] · [[ai-eng-01-prompt]] · [[ai-eng-02-context]] · [[ai-eng-03-harness]] · [[ai-eng-04-loop]] · [[ai-eng-05-graph]] · [[ai-eng-cho-tester]] (cho QA)

**AVADA / Shopify apps (work):**
- [[subscriptions]] — Joy Subscription: app bán hàng theo gói định kỳ (deep). → [[subscriptions-debug-runbook]] (debug/ops).
  _Project đầu tiên dùng cấu trúc thư mục `10-projects/<project>/` — project nào phình thêm file thì gom vào folder, project nhỏ giữ note phẳng. Task list là `BRIEF.md` trong folder đó (state của `/looptasks`, cố ý nằm ngoài graph)._
- [[joy]] — Joy Loyalty & Rewards SaaS (deep).
- [[joy-subscription-artifacts]] — kho artifact/CDN build của Joy Subscription.
- [[crm]] — AVADA CRM marketing automation (monorepo + ML).
- [[backup]] — Avada Backups & Restore.
- [[pdf]] — PDF Invoice for Shopify. ⚠️ có secrets hardcode trong RELEASE_NOTE.
  _Dùng cấu trúc `10-projects/pdf/` — task list `BRIEF.md` (state của `/looptasks`, ngoài graph). Agent `verifier` riêng cho repo pdf ở `agents/pdf/verifier.md` (symlink vào `.claude/agents/` của repo vì `.claude` bị gitignore ở đó)._
- [[shipping-labels]] — in nhãn vận chuyển Shopify. → [[digest-shipping-labels-2026-07-27]] (2 lỗ auth đã vá).

**Khác:**
- [[aws]] — nền tảng tự học AWS & chứng chỉ.
- [[detect]] — Pipe Counter, AI on-device (YOLOv8 + Flutter).
- [[customer-manager-mono]] — quản lý khách/đơn cho cơ sở may đo (WhatsApp).

## 🔁 Areas (20-areas/) — trách nhiệm duy trì lâu dài

- [[shopify-app-dev]] — phát triển & bảo trì app Shopify tại AVADA (mảng chính).
- [[dev-skills]] — kỹ năng lập trình (JS/TS/Node chính; Rust/Python học thêm).
- [[aws-certification]] — học AWS & lấy chứng chỉ.

## 📚 Resources (30-resources/) — chủ đề & học tập

**Tech stack dùng hằng ngày (tham chiếu xuyên project):**
- `shopify/` — [[app-development]]: extensions, billing, Polaris, embedded app.
- `firebase/` — [[firestore-multitenant]]: cô lập dữ liệu theo `shopId`.
- `patterns/` — [[controller-service-repository]], [[monorepo-yarn-workspaces]], [[lich-dinh-ky-neo-theo-ngay-du-kien]] (scheduler định kỳ neo theo mốc *dự kiến* của kỳ trước, không theo ngày xử lý thực tế — chống drift).
- [[do-layout-shift-bang-browser-automation]] — đo CLS bằng agent-browser/Playwright: phần lớn "0 shift" là harness hỏng, luôn chạy control test, `buffered: true`, đo ≥5 lần, assert trang đã render trước khi tin con số.
- [[caching-layers]] — caching qua các layer (client→CDN→proxy→app→Redis→DB): 3 pattern lõi + 3 cái khó (invalidation, key, stampede).

**Học tập:**
- `learns/rust/`
  - [[borrow-checker]] — mượn tham chiếu an toàn tại compile time.
- `learns/typescript/`
  - [[discriminated-unions]] — tagged union + exhaustiveness check.
- `learns/python/`
  - [[asyncio-gotchas]] — các bẫy asyncio thường gặp.
- `learns/java/`
  - [[dsa]] — luyện cấu trúc dữ liệu & giải thuật (Java).

## 🧠 Notes (notes/) — Zettelkasten, note atomic liên kết

- [[atomic-notes-principle]] — mỗi note một ý, liên kết bằng wiki-link.
- [[learning-in-public]] — viết ra để học sâu hơn.
- [[graph-engineering]] — lớp thứ 5 (node/edge/shared-state); trong Claude Code, graph đúng nghĩa nhất là dynamic workflow — kế hoạch nằm trong script chứ không trong context window.
- [[looptasks-vs-workflow]] — looptasks đã là graph viết bằng văn xuôi với state trên đĩa; workflow thắng ở điều phối rerun được, thua ở state bền + git tập trung → hybrid. Harness là gate làm graph đáng tin.
- [[rust-ownership]] — mô hình sở hữu một owner trong Rust.
- [[ts-type-narrowing]] — thu hẹp union type theo control flow.
- [[python-asyncio-blocking]] — đừng chặn event loop asyncio.
- [[subscription-installment-horizon-digest]] — root cause race auto-swap + gotchas Horizon theme block (Joy Subscription).
- [[subscription-digest-2026-07-09]] — bug MRR hardcode v5, best-seller API Shopify, bẫy selective-deploy CI, dedup BigQuery, multi-agent workflow.
- [[subscription-digest-2026-07-10]] — soi Redis prod qua GCE+IAP tạm, bẫy attribution cost BigQuery, pattern controller cho widget AOV, gotcha option widget subscription.
- [[subscription-digest-2026-07-11]] — giá installment ăn theo variant (bỏ enforceFixedPrice), 2 mode partial/defer-last, bug volume discount đa tầng (display-path/discount code AOV/stale lib), gotcha 2 cart-form + AOV chiếm add-to-cart, deploy 1 block đa theme.
- [[subscription-digest-2026-07-12]] — bỏ hẳn app-side capture/reprice volume (vol% đến từ Shopify discount code của AOV — supersede giả định 07-11), update installment chỉ đụng metafield bỏ validate giá, verify helper phải rebuild lib.
- [[subscription-digest-2026-07-13]] — cart-transform chỉ one-time (sub expansion ở contract-create), 2 quy ước cycleIndex, property `_`prefix ẩn/hiện, convert snippet→Horizon block, ẩn badge native AOV + đọc giá render (tránh double-discount), rtk/Serena chỉ tối ưu leaf-ops, BigQuery billing gộp nhiều project → phồng ~7×.
- [[subscription-shipped-2026-07-13]] — commit landed 07-13: redis distributed lock chống double-charge + syncPlansFrequency (v2.33.76), Volume Bundle quantity-break (SB-13947, chưa merge), Dynamic Widget Editor block system (WIP), LTV order-revenue analytics + deploy-functions staging.
- [[subscription-digest-2026-07-14]] — build Dynamic Widget Editor 3-pane theo pattern SubscriptionBox/FixedBundleBox + verify UI thật bằng screenshot; root cause race sync orders lúc contract-create (gate theo trigger); gotcha Yup stripUnknown, barrel export, Polaris v12 Card.
- [[subscription-shipped-2026-07-14]] — commit landed 07-14: guard chống double-charge ship rồi REVERT sạch cùng ngày (v2.33.78/80 → v2.33.82), LTV analytics merged master (v2.33.83), Joy rebrand landed, Dynamic Widget Editor + Discovery Product build tiếp (chưa merge).
- [[subscription-digest-2026-07-15]] — tối ưu stored-procedure BigQuery (partition-prune + verify equivalence), logic report legacy pricing v3, gotcha widget requires_selling_plan/default-option, CSS theme ebay-bootstrap đè select.
- [[subscription-digest-2026-07-16]] — one-time bundle qua Cart Transform `expand` (không `update` Plus-only), installment discount 1 Shopify Function 2 mode per-product metafield, flag ẩn `enableAovBundleSwap`, bug placeholder-date `WIDGET_V4_DATE` đã thành quá khứ, Shopify Functions limits/register/deploy, self-healing metafield/discount lúc save.
- [[subscription-shipped-2026-07-16]] — commit landed 07-16: Widget V4 merged (v2.33.91) + polish, RE-APPLY guard double-charge scoped (v2.33.90, đóng câu hỏi mở 07-14), fix price-sync stuck PENDING (v2.33.88), fix LCP Home (v2.33.89); WIP one-time cart-transform + defer-last-discount (2 migration), shipping-rate FX SB-14315, Discovery multi-currency.
- [[digest-subscriptions-2026-07-17]] — CHỈ phần mới: sandbox test ≈ staging (2 loại data own bởi 2 bên), app dùng Billing API cũ (chưa App Events), expose tsTool DFY API + gotcha Yup stripUnknown/2 mô hình Plan.
- [[shipped-subscriptions-2026-07-18]] — commit landed 07-17 (v2.33.94→100): Onboarding V5 Concierge [deploy-all], fix cuối giá ATC Cellexia (populate selling_plan input) sau khi revert cách MutationObserver, Bird Delivery Location Name (attr + backfill), dời Payment Recovery sang Retention hub.
- [[digest-subscriptions-2026-07-18]] — app handle 3DS/SCA chỉ "một nửa" (attempt kẹt SCA → tự gửi verify3dsSecure email qua Pub/Sub, Shopify không tự gửi link), charge nhiều lần/cycle là bình thường, chẩn đoán order "from App (via import)" ≠ Online Store checkout, query MRR loại dev store.
- [[digest-subscriptions-2026-07-19]] — CHỈ phần mới của build installment custom: discount nướng thẳng vào giá selling-plan + whitelist từ `sellingPlanIds` thật, bug strikethrough/double-discount (`prepareLineDiscountData` chỉ ở `orderController.getOne`) + inject selling_plan sai form, và kỹ thuật tái dùng (decrypt token query Shopify local, Storefront API khi admin token stale, BQ changelog forensics, validate JS Liquid, Shopify Functions byte-limits, metafield-def chỉ ensure lúc install).
- [[digest-subscriptions-2026-07-20]] — CHỈ phần mới: xoá hẳn `publicApi` thay vì vá guard, `recurringCycleLimit` phải là `0` (không phải `null`), app discount không bake vào contract nên phải trừ theo từng surface, deploy cart-transform không rebuild wasm khi build command rỗng.
- [[shipped-subscriptions-2026-07-21]] — commit landed 07-20 (v2.34.02→05): xoá publicApi + secrets về env, bỏ cờ chết `discountConfig.enabled`, mở lại Crisp/Contact sau cửa sổ review Shopify, fix `installAt` [deploy-functions]; LCP/web-vitals và transform-discount còn WIP.
- [[digest-subscriptions-2026-07-21]] — CHỈ phần mới: freeze discount vào line attribute lúc mua, chuỗi bug giá email billing/reschedule do lấy sai order nguồn, `AVADA_BUNDLE` global lag phải đọc DOM, lỗ hổng download PDF không auth, loạt gotcha Liquid/Horizon + kỷ luật branch.
- [[shipped-subscriptions-2026-07-22]] — commit landed 07-21 (v2.34.09→13): SB-14396 chặn contract cancel/pause vẫn giữ upcoming orders bằng per-contract Redis lock, fix fixed-bundle ghi tồn đúng location (SB-14486), LCP/web-vitals [deploy-functions] merged, sửa copy limit-banner lifetime/monthly.
- [[digest-subscriptions-2026-07-22]] — CHỈ phần mới: nhúng Customer Portal vào Chatty (iframe same-origin, trang login Shopify chặn framing → popup-OAuth cho ca chưa login), loạt bẫy widget preview (field vô nghĩa nếu scripttag không đọc, gate theo version chứ không layout, 2 endpoint schema khác).
- [[shipped-subscriptions-2026-07-23]] — commit landed 07-22 (v2.34.16→21): fixed-bundle one-time cart-transform expand [deploy-all], fix pubsub memory-leak + right-size apiHookV2 [deploy-functions], shipping-rate lấy đúng contract currency (SB-14315), admin boot LCP, fix standalone dev boot nhầm embed.js (vite replace ăn comment CSS); transform-discount/onboarding-v5/discovery/chatty-embed còn WIP.
- [[shipped-subscriptions-2026-07-24]] — commit landed 07-23 (v2.34.22→26): vá IDOR contract lookup + open-redirect returnUrl [deploy-all], chặn discount function tin attribute client-set, one-time bundle price về 1 field merchant-set multi-currency (+ fix giá add-on theo variant), onboarding-v5 expert questions vào Step 1; WIP lớn Win Back flow builder [deploy-functions] + Grow card/Help center.
- [[digest-subscriptions-2026-07-24]] — CHỈ phần mới: bug tên shipping recurring (SB-14649) + backfill ghi đè, race auto-swap lúc contract-create, PubSub singleton leak OOM, `shopify app deploy` không rebuild wasm khi build command rỗng, cụm gotcha Horizon theme block + giọng Slack.
- [[shipped-subscriptions-2026-07-25]] — commit landed 07-24 (v2.34.29→32): chuỗi SB-14649 (fix → backfill [deploy-functions] → hotfix chặn ghi đè carrier đúng → audit script), fix address mất company/zip ở 6 chỗ, portal highlight chờ skeleton; Grow card merge rồi revert sau 8 giây (+ bẫy merge revert); WIP Mystery Product + bundle sync banner.
- [[digest-artifact-2026-07-24]] — Joy Subscription artifacts: tách hosting khỏi deploy để giữ chunk cũ (chống blank/404), cách dọn repo phồng an toàn (`comm -23` + `xargs`), `.git` không co lại. *(digest đầu tiên cho [[joy-subscription-artifacts]])*
- [[digest-pdf-2026-07-21]] — PDF Invoice: cờ trạng thái DB không thay được tracking hành vi (set ở 5 chỗ), Firestore phải ở repository không phải service, mutation check chứng minh test thật sự bắt lỗi. *(digest đầu tiên cho [[pdf]])*
- [[digest-pdf-apiv1-workflow-2026-07-21]] — workflow multi-agent extend apiV1 của PDF Invoice: ràng buộc kiến trúc apiV1, 2 lỗi critical (Puppeteer lọt cold start 256MiB, resend luôn fail), blacklist field bị bypass qua route legacy, chứng minh lint finding pre-existing.
- [[shipped-pdf-2026-07-22]] — commit landed 07-21 (v3.1.53→54): apiV1 refactor sang controller-service-repository + 16 write endpoint (14→30 route). WIP: tracking store unlock template (banner_claim vs devzone_manual) + docs public-api.
- [[digest-pdf-2026-07-23]] — PDF Invoice: gcloud/bq lấy project từ config toàn cục của máy (không theo cwd) → dễ query cost/metric nhầm app; prod = GCP `pdf-invoice-4717c`; token hết hạn không refresh được ở non-interactive.
- [[digest-pdf-2026-07-29]] — CHỈ phần mới: root cause dòng hàng bị xẻ đôi qua biên trang (engine tự cộng dồn chiều cao + Chrome tự scale khi nội dung tràn khổ, `PAGE_HEIGHT.TECH = 1220`), `break-inside` vô hiệu trong flex container, leak Chromium ở nhánh `outputFormat: 'html'`, đảo hướng từ fix chung sang vá CSS riêng cho 1 store, cụm gotcha dev store `access_scopes` rỗng / managed install.
- [[shipped-pdf-2026-07-30]] — commit landed 07-29 (v3.1.58→59): engine row-integrity merged master rồi **revert nguyên merge trên nhánh** `revert/print-page-break` (chưa vào master → prod vẫn mang bản fix bị đánh giá chưa chín), draft-order pro metafield; WIP Templates redesign + Setup Checklist Card SB-14770.
- [[digest-pdf-2026-07-30]] — CHỈ phần mới: khối tổng tiền vắt qua biên trang (CSS vá trước chỉ bảo vệ dòng hàng), header bảng không lặp vì là `<tr>` trần — Chrome chỉ lặp header trong `<thead>`, "lặp header bằng CSS" vô tác dụng; quét selector `nth-child` trước khi bọc `<thead>`, và phải kiểm cả hai đường in (đơn lẻ vs in gộp). ⚠️ có mục "chưa xác minh" (khách chưa xác nhận fix khối tổng).
- [[shipped-pdf-2026-07-31]] — commit landed 07-30: master CHỈ nhận 1 MR đổi **1 dòng** (devzone navigation standalone, `v3.1.61`); khối lượng thật còn trên nhánh — CrossAppPromoModal chia 70-30 bằng **hash tất định từ `shop.id`** (không DB, không migration), quickstart mở thẳng màn edit template, Setup Checklist Card SB-14770, skeleton Templates đếm theo `newTemplatesUnlocked`, fix mất data emulator lúc `pm2 stop`; không revert, không `[deploy-functions]`.
- [[digest-pdf-2026-07-31]] — CHỈ phần mới: app không có SMTP riêng mà đi nhờ creds SES của Chatty (`CHATTY_SMTP_*`) — grep theo **công dụng** chứ không theo tên biến mình đoán; tên app deploy thật ("AG Order Printer") lệch tên marketing giữ trong email; link CTA `admin.shopify.com/apps/<handle>/embed` tự resolve theo store đang đăng nhập nên để tĩnh; export recipient phải tái dùng đúng hàm phân loại plan của app.
- [[shipped-pdf-2026-08-01]] — commit landed 07-31 (v3.1.64→65): dev-zone custom currency + seed money format từ Shopify lúc install (kèm 2 fix có sẵn của filter `money`: đường email chưa từng đăng ký filter, `toFixed` lệch cent), fix nhận diện dev store đã chọn plan test để không rơi nhầm vào bucket promo 70%; còn trên nhánh: HS code + country of origin phủ 77/83 theme (SB-14896), Email Sender/Custom SMTP (có 1 fix XSS), Setup Checklist Card SB-14770; không revert.
- [[digest-pdf-2026-08-03]] — CHỈ phần mới: dựng luồng unsubscribe HMAC không cần DB migration, chuỗi bẫy Firebase Hosting/emulator/koa-bodyparser, và kỷ luật vận hành khi gửi hàng loạt (resume qua progress file, batch ngắn vì tiến trình bị giết).
- [[shipped-pdf-2026-08-04]] — commit landed 08-03 — master nhận 5 MR: unsubscribe cho email marketing (HMAC stateless, RFC 8058), HS code/country of origin phủ 102 theme + 113 ngôn ngữ + gate theo plan, fix 422 khi Save Settings (yup 0.29 tự dựng default cho nested object), font DM Sans, quickstart; nhánh còn script gửi bulk resume được; không revert. ⚠️ nợ bảo mật: 3 key Google Translate còn trong git history — cần rotate.
- [[digest-pdf-2026-08-05]] — CHỈ số chốt của chiến dịch email marketing đầu tiên (27.626/27.626 gửi thành công, 1 lỗi, ~0.09% unsubscribe) và ngưỡng batch thực dụng ≈1.000 mail/lượt trong môi trường hay giết tiến trình nền. ⚠️ con số unsubscribe cuối *chưa xác minh*.
- [[shipped-pdf-2026-08-06]] — commit landed 08-04/08-05: master chỉ nhận 3 MR (2 mockup-app/PRD + `v3.1.71` bump `@avada/app-widget-hook` vá banner appList rỗng làm trắng trang); trên nhánh: bỏ pagination client của preview rồi dựng lại highlight theo marker, Sidekick agent extensions SB-14254, redesign template editor.
- [[digest-pdf-2026-08-06]] — CHỈ phần mới: feature SB-15301 payment reminder **không có PRD** nên spec dựng từ mockup + đối thoại (field trong mockup chính là Shopify payment terms đã lưu sẵn), verifier bắt off-by-one tham chiếu dòng và default lệch mockup không comment, "gate đỏ là pre-existing" phải chứng minh bằng `git diff --name-only`, cron `/looptasks` dựng trong session không ghi ra đĩa, lock looptasks đọc theo thời gian nên phải gia hạn. ⚠️ có mục "chưa xác minh" (verifier vòng P2).
- [[shipped-subscriptions-2026-08-06]] — commit landed 08-04/08-05 (v2.34.47→53): giá theo từng line của order, tsTool best-selling, delivery-anchored billing enterprise (+1 migration SQL), 3 lát CLS; revert reservation chiều cao list table vừa ship hôm trước → thay bằng skeleton rows; trên nhánh: bỏ App Bridge v3 + box editor sang max modal, classic portal preview, manual delivery attributes.
- [[digest-subscriptions-2026-08-06]] — CHỈ phần mới: doc Firestore thiếu hẳn field `product` làm trắng trang (4 chỗ deref không guard), worktree thiếu `.env.local` làm gate đỏ giả rồi bị khai là "pre-existing", loạt bẫy đo layout-shift → khái quát ở [[do-layout-shift-bang-browser-automation]], và luồng auto-merge MR tài liệu của BA.
- [[digest-moonie-2026-07-17]] — build website Mooni bằng harness AI (generator→evaluator độc lập→held-out test mù→screenshot loop) + loạt gotcha Go/testcontainers/Colima/golangci-lint/CI (greenfield, ngoài Avada).
- [[digest-moonie-2026-07-18]] — security hardening Mooni (JWT/auth alg=none + dummy-bcrypt, trusted-proxy XFF rightmost, CSRF Origin fallback + segment-aware prefix, upload magic-byte, int truncation tài chính), root cause package-lock lệch platform (Tailwind v4 native), failure mode "held-out quá khắt khe".
- [[digest-moonie-2026-07-20]] — phần mới của Mooni: bỏ giỏ hàng để né đăng ký TMĐT, bộ artifact QA 5 file mỗi file 1 owner, bug `ORDER BY` không tất định + rate-limit thiết kế sai, kỹ thuật viết held-out chống gian lận.
- [[digest-moonie-2026-07-22]] — phần mới của Mooni (CI + giai đoạn 4/5): golangci-lint fail trên CI dù local xanh (CGO/version action/checksum), testcontainers Postgres flaky do wait-strategy yếu, race TOCTOU convert lead→đơn, doanh thu tháng lệch múi giờ (UTC).
- [[digest-subscriptions-2026-07-25]] — CHỈ phần mới: bake giá vào metafield gây stale + lẫn currency (one-time $3.741), Firestore snapshot không chứa `discountAllocations` nên đừng kết luận "không có discount", chẩn đoán ATC chết bằng Admin API vs Storefront API `@inContext`, bỏ nhánh `frozenDiscount` (line attribute client-settable).
- [[digest-subscriptions-2026-07-27]] — CHỈ phần mới: chuỗi bug lấy sai nguồn sự thật (cycleIndex Firestore ≠ Shopify billing cycle, `line.product.customAttributes` ≠ `line.customAttributes`, plan doc id đổi sau khi mua nên auto-swap không bao giờ chạy), hàm `ensure` chỉ create-if-missing nên cấu hình sai cũ không được chữa (SB-14456), widget inject `selling_plan` nhầm form (product page có 2 form), thiếu scope `*_cart_transforms` ở staging.
- [[digest-subscriptions-2026-07-28]] — CHỈ phần mới: build Customer Portal Preview (mixin tại đúng 1 seam `fetchPublicApi`, deep-link `?joy_preview=1` giữ đích qua login) với họ lỗi lặp 6 lần "preview trả shape khác backend thật", bug đổi frequency chỉ sync 1 line (JSUB-260727-Yba5fc), backfill suy carrier từ lịch sử checkout của khách, BigQuery monthly shard thiếu cột → crash trang Order Detail (SB-14774), cờ phải qua 3 tầng whitelist (SB-14773).
- [[shipped-subscriptions-2026-07-29]] — commit landed 07-28: master CHỈ nhận 3 MR mockup-app/PRD (không code app, không version bump — `v2.34.36` vẫn là mốc gần nhất); khối lượng thật nằm trên branch: Customer Portal Preview (~30 commit), JOY red rebrand toàn admin (57 file), widget badge style card, `forceOneTimeAddProduct` SB-14773; không revert.
- [[digest-subscriptions-2026-07-29]] — CHỈ phần mới: mỗi surface đọc một nguồn `customAttributes` khác nhau (CP **list** lấy Firestore contract nên không có `lines[]` → luôn ra 0), mảng rỗng là truthy làm fallback không bao giờ chạy, old CP có HAI màn detail (parity trong cùng một bản portal), email billing-failed lấy order gốc thay vì order của cycle, reinstall không clear `uninstalledAt` (SB-14784), và deploy đi bằng hai kênh khác nhau (`shopify app deploy` không đụng scripttag). ⚠️ có mục "chưa xác minh" về `frozenDiscount`.
- [[shipped-subscriptions-2026-07-30]] — commit landed 07-29 (v2.34.37→43, 7 tag trong 1 ngày): fix reinstall kẹt onboarding + script chữa data, shipping price custom trên đường auto-billing (SB-14694 vế 2), one-time-only 2 lát, JOY red rebrand vào master, `forceOneTimeAddProduct` SB-14773; partner plan postfix ship ở v2.34.40 rồi revert ở v2.34.41 để đổi sang cờ `isPartnerStore`; WIP khổng lồ Win Back flow `[deploy-functions]` 252 file + `firestore.indexes.json`.
- [[digest-subscriptions-2026-07-31]] — CHỈ phần mới: dựng preview cho classic portal tại đúng một seam `makeRequest` (21 file import), Jest xanh không chứng minh bundle build được → webpack thành gate bắt buộc, `/products.json` trả giá dạng CHUỖI làm `NaN` lan âm thầm, nút Preview không render vì thiếu key ở file locale RUNTIME (`locale/translations/en.json`, không phải file colocated); đóng câu hỏi treo 07-25: automatic discount **không** chạy lại mỗi billing attempt.
- [[shipped-subscriptions-2026-08-01]] — commit landed 07-31: master CHỈ nhận 1 MR (`v2.34.44`, nút Add product standalone, JSUB-260730); khối lượng thật trên `feat/portal-preview` — preview classic portal (plan 2.864 dòng, router + `safeSessionStorage` + catalog từ storefront `products.json`) và preview mode new-CP đổi thành **tri-state** quyết theo response `/subscriptions` thật, cộng 2 fix fail-closed; 3 commit `[deploy-all]` đều còn trên nhánh; không revert.
- [[digest-subscriptions-2026-08-03]] — CHỈ phần mới: chiến dịch giảm CLS in-app (skeleton lệch chiều cao, Crisp wrapper 0.916/lượt) với kỷ luật đo A/B, skill security-audit chủ động lộ ra `storage.rules` public, bug `pricingGate` chặn nhầm gói trả tiền, và deploy extensions chết vì CI pin Shopify CLI cũ.
- [[shipped-subscriptions-2026-08-04]] — commit landed 08-03 (v2.34.45→46): master nhận 2 MR (docs Sidekick Phase 1 `[deploy-extensions]`, chiến dịch giảm CLS boot/home/crisp/list table kèm số đo trước-sau); trên nhánh còn chuỗi fix CI build extension (pin yarn 1.22.22, bump Shopify CLI 3.94.3), fix pricing gate uncapped plan, Volume Bundle `[deploy-all]`; không revert.
- [[digest-subscriptions-2026-08-04]] — CHỈ phần mới: pattern "block của mình = controller, block AOV bị ẩn = engine" khi custom theme cho khách, kèm luật hiện badge của AOV volume (`isDefault` → badge global, còn lại theo `isShowBadgeEachTier`). ⚠️ có mục "chưa xác minh" về fix BQ cost.
- [[digest-subscriptions-2026-08-05]] — CHỈ phần mới: delivery-anchored billing cho Spray Farmacy (tính Delivery Date trước rồi suy Charge Date, mốc là delivery *dự kiến* kỳ trước nên không drift), gate "chỉ contract mới" phải ghi cờ lên contract chứ không theo flag shop (3 call site), + gotcha storefront không expose metafield của function. → khái quát hoá ở [[lich-dinh-ky-neo-theo-ngay-du-kien]]. ⚠️ 2 mục treo: offset Sun/Mon/Tue, timezone của "00:00".
- [[shipped-subscriptions-2026-07-28]] — commit landed 07-27 (v2.34.33→36): vá tenant-isolation `X-Shopify-Shop-Id` + 403 tripwire, 2 dev-zone override (force pricing version, `disableSubCountLimit`), shipping price theo billed cycle SB-14694 + audit script, propagate address ra mọi upcoming order; WIP lớn: one-time-only add product SB-14700, Mystery Product, bulk error banner SB-14564.
- [[digest-moonie-2026-07-24]] — phần mới của Mooni: skill QA tái dùng (mọi thứ riêng-app vào 1 config ở root, docs derived + trace REQ), giá trị harness = gate mỗi task chứ không phải mốc phase, root cause chính xác Colima/testcontainers Ryuk + golangci-lint CI, npm lock lệch platform.
- [[digest-moonie-2026-07-25]] — phần mới của Mooni (UI giai đoạn 3 & 5): held-out Playwright chỉ chắc khi form có `name`/`aria-label` rõ (nhãn nhập nhằng là tín hiệu UX chứ không phải test khó tính), design-evaluator bắt lỗi thật (overflow-hidden cắt cột, font thiếu subset tiếng Việt, hardcode hex), đọc thẳng mockup thay vì phán từ trí nhớ.
- [[digest-moonie-2026-07-27]] — chốt hạ bỏ `npm ci` (lock darwin không bao giờ đủ cho linux — Tailwind v4 oxide native), Colima mất ổn định I/O giữa session, skill `security-review` chỉ soi `git diff` nên bỏ sót file untracked, `timeout` không có trên macOS.
- [[digest-moonie-2026-08-01]] — CHỈ 2 điểm chưa ghi: warning collation glibc→musl khi đổi `postgres:16` sang `16-alpine` trên volume cũ không refresh được (phải tạo volume mới), và admin gọi API qua Server Action (server-to-server, forward cookie) nên không chạm CORS. ⚠️ có mục "chưa xác minh" về việc CORS/Server Action cùng tồn tại hay thay thế nhau.
- [[digest-claude-chat-2026-07-17]] — cleanup disk macOS: thủ phạm thật thường là Docker/Colima VM (qcow2) + build cache, không phải project files hay macOS update; cách dọn an toàn.
- [[digest-aws-2026-07-23]] — build course/ngân hàng đề AWS quy mô lớn bằng workflow author→critic + plan bền trên đĩa; root cause SVG inline vỡ render do dòng trống (CommonMark), truyền list qua file thay vì args, verify ground-truth không tin report workflow. *(digest đầu tiên cho [[aws]])*
- [[digest-aws-2026-07-24]] — CHỈ phần mới: vòng tự nhịp nhiều phần (`build-content-loop`) + evaluator–optimizer, chạy gate deterministic TRƯỚC evaluator LLM, SVG inline theme-aware bằng `currentColor`, loạt gotcha viết Workflow script + bug appender/TS union.
- [[shipped-aws-2026-07-25]] — commit landed 07-24 trên `main`: trọn infra track (~90 lesson) — 4 course mới (DISTRIBUTED/DATASTORES/MESSAGING/CLOUDNATIVE) theo nhịp scaffold + gold lesson → workflow `author-course`, cộng 2 chapter extension (SRE Observability, BACKEND Service Communication); không revert, không tín hiệu deploy.
- [[digest-aws-2026-07-27]] — CHỈ phần mới: workflow `thorough` thay `/loop` để chống "làm qua loa trong 1 phiên", union type TS vỡ khi mảng >1.100 phần tử (JSON sidecar làm nguồn sự thật), SVG dòng-trống tái phát 279 block/116 file → gate phải chạy trên đường render thật, hljs theme sáng trên nền tối, `/search-index.json` force-static; kỷ luật không tin report của agent mà dùng ground truth.
- [[digest-aws-2026-07-28]] — CHỈ phần mới: phủ sơ đồ inline SVG cho 19 course (idiom catalog + tự soi bằng `rsvg-convert` cả 2 theme), bẫy `order` thập phân lộ ra UI, dịch đề thi sang tiếng Anh nhưng giữ `explanation` tiếng Việt, hash link đề thi không cần backend, gate false-positive và agent chết âm thầm làm pass gate.
- [[shipped-aws-2026-07-29]] — commit landed 07-28 trên `main` (9 commit): đóng nốt DATASTORES chapter 7 (26 lesson/7 chapter) rồi phủ quiz cho 6 course/chapter mới — 1.716 câu trong một ngày, bank chốt 3.416; workflow `knowledge-quiz-file` viết một lần tái dùng, re-id theo offset chống trùng; không revert, không tín hiệu deploy.
- [[digest-aws-2026-08-03]] — CHỈ phần mới: công thức dựng course mới (scaffold + gold lesson + fan-out author→critic đọc job từ file), audit SAA-C03 theo *task statements* phát hiện 2 lỗi factual, và loạt gotcha khi để agent trong Workflow tự thao tác file (không có Node API → dùng Bash + `schema`).
- [[shipped-aws-2026-08-04]] — commit landed 08-03 trên `main` — 4 commit đóng gap SAA-C03 phát hiện qua audit theo task statements: 2 lesson mới (ch2-05 Migration & Transfer, ch2-06 Data Ingestion & Analytics) + 24 câu scenario (bank 795) + 2 sửa sai factual; không revert, không tín hiệu deploy.
- [[digest-shipping-labels-2026-07-27]] — Shipping Labels: `verifyExtensionToken` không verify chữ ký session token + webhook thiếu HMAC → fix fail-closed, phải bơm `SHOPIFY_API_KEY`/`SECRET` qua `PROD_ENV_FILE` của GitLab CI và bỏ dòng echo secret. *(digest đầu tiên cho [[shipping-labels]])*
- [[digest-avada-project-2026-07-23]] — app Next.js nội bộ: `NODE_ENV=production` trong `.env` làm `next dev` 404 mọi route (route manifest không compile) + cookie OAuth secure fail trên http; wedged dev server giữ `.next/dev/lock`; setup Google OAuth Internal cho email tổ chức chạy localhost.
- [[moc-learning-pkm]] — **MOC**: điểm vào chủ đề học tập & PKM.

## 📅 Daily (10-daily/) — nhật ký ngày (ephemeral)

_Mỗi ngày 1 file `YYYY-MM-DD.md`. Không liệt kê từng ngày ở đây — dùng skill `/today`._

## 🧭 Decisions (70-decisions/) — quyết định + Why + Tradeoff

- [[2026-07-07-brain-lay-gi-tu-avader-folder]] — chỉ mượn daily/decisions/skills từ avader-folder, bỏ agent-board & role system (review 2026-10-07).
- [[2026-07-08-installment-mode-design]] — thiết kế installment 2 mode (partial vs defer-last), giá bám variant product (review 2026-10-08).
- [[2026-08-04-looptasks-verifier-doc-lap]] — `/looptasks` Bước 5 giao cho agent `verifier` context sạch (không Edit/Write, verdict PASS/FAIL/UNVERIFIED); main agent không tự chấm code do chính nó spawn (review 2026-11-04).
- [[2026-08-06-appbridge-v3-sang-max-modal]] — Joy Subscription gỡ hẳn App Bridge v3, box editor fullscreen → max modal v4 + iframe route `/box-frame/*`; đổi lại tự dựng bridge 2 chiều, Save/Discard ở TitleBar do host sở hữu, nút X đóng làm mất thay đổi chưa lưu (review 2026-11-06).
- [[2026-08-06-auto-merge-mr-tai-lieu-ba]] — `subscriptions` + `pdf` tự merge MR khi toàn bộ diff nằm trong `product-team/` và author trong whitelist, chạy bằng job pipeline MR với PAT scope `api` Protected; bỏ phương án scheduled poll 15 phút (review 2026-11-06).
- [[2026-08-06-bo-pagination-preview-pdf]] — PDF Invoice xoá toàn bộ pagination phía client của preview (~3.9k dòng, cùng ngày viết ra), PDF server là nguồn phân trang duy nhất, công sức dồn vào highlight theo marker liquid inert (review 2026-11-06).

## 💬 Feedback (feedback/)

- [[write-shorter-notes]] — viết note ngắn, atomic hơn.
- [[subscription-work-style]] — text khách tiếng Anh, batch commit type-role-scope, ràng buộc kiến trúc fix swap.
- [[feedback-follow-conventions]] — research code hiện tại trước khi viết (đúng 4 tầng route→controller→service→repository), và khi sửa lỗi thì grep quét HẾT chỗ dùng cùng pattern.
- [[feedback-git-branch-discipline]] — repo code project không push thẳng master/main + hỏi trước khi commit; my-brain push thẳng được; nhánh có thể bị đổi ngoài session nên phải kiểm tra lại.
- [[feedback-commit-style]] — `type - role - scope` ở repo Avada, mô tả trần ở my-brain; không trailer `Co-Authored-By`.
- [[feedback-comment-chi-khi-code-roi]] — mặc định không comment; chỉ giữ comment cho magic number hoặc ràng buộc bên ngoài mà code không nói được.
- [[feedback-plan-o-subagent-hoac-ghi-brief]] — plan/tổng hợp giao subagent để session chính chỉ giữ kết luận; nếu làm tại chỗ thì ghi tiến độ + câu hỏi treo vào `BRIEF.md`.

## 📦 Sources (sources/) — nguồn thô immutable

_(chưa có)_

## 🗄️ Archive (40-archive/)

- [[avada-core]] — thư viện lõi auth Shopify + Firebase (Koa/TS). Archived 2026-08-04: repo không còn trên máy.
- [[headless-demo]] — demo store Shopify headless (Next.js 15). Archived 2026-08-04: repo không còn trên máy.

---

### Maps of Content (MOC) — điểm vào theo chủ đề
_Khi một chủ đề có nhiều note, tạo một MOC ở đây để gom link._

- [[moc-learning-pkm]] — Học tập & Quản lý tri thức cá nhân (Rust / TS / Python + phương pháp).
