---
type: note
title: Shipped Joy Subscription — commit landed 2026-09-16 (v2.35.33 → v2.35.37, 6 merge vào master)
summary: Master nhận 6 merge trong một ngày (5 tag `v2.35.33`→`v2.35.37`) — đổi nguồn box của landing joyxjoy sang `collection_list`, nối staples vào selling plan thật, command sửa lại field variant mà migrate xoá, custom sender đi SES thay Mailgun; vòng portal Wholefoods và bản `--clear-cycle-edits` quét hết cycle vẫn còn trên nhánh.
tags: [subscription, shopify, avada, backend, storefront, extensions]
created: 2026-09-17
updated: 2026-09-17
source: repo `subscriptions` — git log 2026-09-16 (hash đã verify)
---

# Shipped — `subscriptions`, commit landed 2026-09-16

Root cause của hầu hết mục dưới đã nằm ở [[digest-subscriptions-2026-09-16]] — note này chỉ ghi
**cái gì đáp xuống đâu**. Đợt trước: [[shipped-subscriptions-2026-09-16]] (commit landed 09-15).

## Shipped

### Vào `master` — 6 merge, 5 version bump

| Merge | Tag | MR | Việc | Commit nhánh |
|---|---|---|---|---|
| `72ebb2969` | `v2.35.37` | !2596 | landing joyxjoy: thứ tự frequency, swap modal, skeleton loading | `9de51b48e` |
| `987dfa629` | `v2.35.36` | !2594 | landing joyxjoy: plan wiring, đổi nguồn box, ảnh step | `d562e2ec0` · `40de9a2e9` (=`37ff1bc7d`) · `5a0752571` (=`432e95e3e`) |
| `7c685d6c8` | `v2.35.35` | !2592 | command khôi phục field variant mà migrate xoá | `a2fe34b48` (=`1ef5e72c0`) |
| `34e578e89` | `v2.35.34` | !2585 | home — `BookCallModal` + 3 entry point, dọn link cal.com cũ | `88ecfcac7` |
| `82bb4567d` | `v2.35.33` | !2586 | email — custom sender gửi qua **SES thay Mailgun**, From `noreply` + Reply-To mail shop | `fa6d9d992` |
| `d59426ab7` | *(không tag)* | !2593 | migrate contract fixed bundle: xử lý contract bị chặn bởi billing cycle edit | `b599d0001` |

Bốn điểm đáng giữ trong đợt merge này:

- **`40de9a2e9` — đổi nguồn lặp của section 1 sang `collection_list`.** Quyết định + tradeoff đã có
  ở [[2026-09-16-landing-doi-nguon-lap-sang-collection-list]]; đây là mốc nó **thật sự vào master**
  (`v2.35.36`). Kèm hai sửa trong nhánh `all_products` giữ lại làm fallback: gate trên `p.id` thay vì
  `p` (EmptyDrop truthy) làm payload mỗi lượt tải rơi từ **22.768 → 10.631 byte**, và một cảnh báo
  trong theme editor khi shop có >20 bundle mà chưa chọn collection.
- **`d562e2ec0` — staples ngừng vào giỏ dạng one-time.** `buildLandingPlanProducts` đổi shape emit
  từ mảng trần sang `{plans, items}` theo group; `getAllActiveSubscriptionPlans` chỉ trả doc group
  nên `fixedBundleService` phải gắn plan con qua `getPlansBySubscriptionPlanId` **trước khi** dựng
  snapshot — thiếu bước đó thì mảng `plans` luôn rỗng và cả thay đổi này vô tác dụng.
  `buildAllowedProductIndex` vẫn nhận shape mảng trần cũ nên shop chưa rebuild metafield không chết.
  Verify trên store thật: `selling_plan=(none)` → `selling_plan=5811241175`.
- **`a2fe34b48` — `restoreVariantFields.js`**: đọc snapshot phase-1 làm nguồn chuẩn thay vì tin thứ
  fetch giữa run, dry-run mặc định, idempotent, và **chỉ đặt giá trị TRỞ LẠI, không bao giờ ghi
  `null` đè lên cái đang sống**. Nó tự mang `withRetry` (4 lần, cùng hằng số với lệnh migrate) vì
  lần chạy thật đầu tiên chết bằng đúng một dòng `AggregateError` —
  [[mutation-ghi-nguyen-khoi-xoa-field-khong-gui]] · [[loi-mang-bi-bao-thanh-ly-do-nghiep-vu]].
- **`82bb4567d` — đổi đường gửi email của custom sender từ Mailgun sang SES.** Đây là thay một
  dependency ở đường ra, có cổng theo ngày install ⇒ tách quyết định riêng:
  [[2026-09-17-custom-sender-ses]].

### Còn trên nhánh

**`feat/wholefoods-portal`** — vòng đóng ticket JIRA tiếp theo (chưa merge):

| Hash | Việc |
|---|---|
| `ad3e1c2f7` | SB-16888 — thêm **bước chọn variant + số lượng** trước khi thêm sản phẩm (trước đây bấm là thêm luôn, quantity 1, variant đầu tiên) |
| `a687dfc50` | hai block cùng một điều kiện ⇒ picker rỗng in **hai** câu empty state chồng nhau |
| `7b7feaa96` | SB-16809 — khử trùng ảnh card theo **URL** |
| `dfca362cc` | SB-16867 + SB-16809 — khử trùng lại theo **danh tính sản phẩm** (đè `7b7feaa96` trong cùng ngày), và split Seasonal boxes đọc `__joy_bundle_parent` ngay trên line thay vì chờ `bundleProductIds` |
| `7772f8fe1` | SB-16861 — nhịp giao lấy từ **plan**, policy chỉ còn là fallback; header và các dòng sản phẩm gộp về **một** helper (trước đó header tự tính `frequency.intervalCount \|\| 1` nên hai chỗ nói khác nhau) |
| `912fd562b` | SB-16889/92/94 — picker xin `limitPerPage=60`, `filterProductsByScope` thêm `excludeProductIds` (áp cho **cả** staples lẫn one-off), bỏ `console.log` chạy mỗi request, gộp hai định dạng tiền về mặc định `en` |
| `bd9ab1cf8` | SB-16889/94/900 — infinite scroll có `ref` chặn `onScrolledToEdge` bắn lặp, "Add another box" thêm thẳng khi đang ở trong modal (surface này **không mở overlay trong overlay**), và `Delivery Location` / `Customer TimeZone` đọc đúng cái contract mang thay vì fallback `Australia/Brisbane` hardcode |

**Backend cho SB-16866** (đã ở trên nhánh, chưa thấy merge trong log này):
`471f3270d` (spec + plan, chưa có code) rồi `ac3e5f2f1` — thêm bản sinh đôi v2 của
`getPopularSubscriptionProducts`, resolve scope từ `selectedItems` / `isAllSelected` /
`isAllFromCollections` của doc plan, trả đúng shape mà picker, `planCompatibility` và
`prepareLineAddPayload` đang dùng nên **client không phải đổi gì**. Đường v1 không đụng tới và có
test chốt shop v1 vẫn đi đường cũ.

**`fix/migration-scan-all-cycle-edits`** — `395c93f8e`: `--clear-cycle-edits` (vừa merge ở !2593)
chỉ suy ra **2 index** từ đơn BILLED gần nhất nên bỏ sót edit ở cycle khác — prod có contract
`BQdzs9TS8XIoNvF2txS2` edit ở 4/6/10 và `pi5hntWL6NEcaJisqVLA` ở 14, và vẫn bị Shopify chặn. Bản mới
quét mọi cycle từ index 1 tới khi hết cycle hoặc quá 1 năm. Tái hiện trên staging-3: code cũ fail,
code mới vá được.

**`feat/customer-portal-ui`** — tích hợp Froonze + dọn nhánh:

- `292e1119f` nút "Go to app" dùng `useInstalledShopifyApps` như Zapiet (đã cài → vào admin, chưa
  cài → ra trang listing), thêm thẻ Guide. `9ce82548c` tách `appHandle` (`froonze-app`) khỏi
  `adminHandle` (slug App Store `customer-accounts`) — dùng chung một giá trị nên nút trỏ sai chỗ và
  check "đã cài app" **luôn trả về false**.
- `f835dfea0` **bỏ hẳn harness verify khỏi repo** (−2903 dòng): `packages/e2e/harness/embedded-portal`
  và `portal-ui` không nằm trong CI, không nằm trong done-criteria, không test nào import — mà
  `portal-ui` lại import 23 đường dẫn nội bộ của `scripttag` nên gãy âm thầm mỗi lần refactor.
- `ba7e41b63` dọn doc/scaffolding/comment (−1106 dòng): xoá `docs/embedded-customer-portal.md`,
  `tasks/`, `theme-custom/froonze-mock/` (giữ trên đĩa, thêm vào `.gitignore`), và **45 dòng comment
  / 17 file** mà nhánh này thêm vào — giữ JSDoc và pragma eslint.
- `a84e9a768` merge nhánh chính vào, **6 conflict**, đáng nhớ nhất: `app-embed.liquid` phải giữ **cả
  hai** cờ `froonzeIntegrationEnabled` và `enableAovBundleSwap`; `jest.config.js` lấy cấu hình
  2-project của nhánh chính (cấu hình vừa sinh ra ở đợt trước, xem [[shipped-subscriptions-2026-09-16]]).

## Reverted / đảo hướng

**Không có `git revert` nào.** Ba lần đè lên lựa chọn trước, cả ba đều trong vòng dựng:

- `dfca362cc` đè `7b7feaa96` **trong cùng ngày**: khử trùng ảnh theo URL không đủ vì snapshot và
  line giữ hai tấm ảnh khác nhau của cùng một sản phẩm.
- `dfca362cc` cũng **lật lại nhánh fallback của SB-16867** ghi ở [[shipped-subscriptions-2026-09-16]]
  (*"một dòng là box chỉ khi product của nó là fixed bundle"*): fixed bundle do app tạo không mang
  marker `__joy_bundle_parent` nào, nên chỗ không nhận diện được thì **mọi line lại là box, như
  trước**. Lý do commit đưa ra: *"Better a box that might be a staple than every box becoming one."*
- `395c93f8e` đè `b599d0001` sau khi `b599d0001` đã merge (xem Deploy notes).

Cả ba là sửa trong vòng dựng, không phải đổi hướng kiến trúc — không tách decision. Thứ **có** tách
decision là đổi đường gửi email: [[2026-09-17-custom-sender-ses]].

## Deploy notes

- **Không commit nào mang `[deploy-functions]`, `[deploy-all]` hay `[deploy-extensions]`** trong đợt
  này. Toàn bộ 6 merge đi đường CI mặc định.
- **5 version bump**: `v2.35.33` → `v2.35.37`. Riêng `d59426ab7` (!2593) merge **không kèm tag** —
  chưa rõ đây là quy ước cho MR chỉ thêm command hay là một bump bị bỏ sót.
- **Master đang mang bản `--clear-cycle-edits` đã biết là sót.** `b599d0001` merge qua `d59426ab7`,
  còn bản quét hết cycle (`395c93f8e`) vẫn nằm trên `fix/migration-scan-all-cycle-edits`. Ai chạy
  lệnh migrate từ master trong khoảng này sẽ gặp lại đúng hai contract prod mà commit nêu tên.
- **Không có file migration mới.** Hai thứ sinh ra trong đợt là **command chạy tay**
  (`restoreVariantFields.js`, cờ `--clear-cycle-edits`), đều theo runbook
  `docs/features/migrateSimpleBundlesToFixedBundle/runbook.md` — runbook được cập nhật ở cả ba
  commit `a2fe34b48`, `b599d0001`, `395c93f8e`.
- **Liquid không đi qua CI.** `40de9a2e9` sửa `docs/joyxjoy-theme/` — bespoke theme khách, merchant
  paste tay ([[2026-09-08-bespoke-khong-vao-theme-app-extension]]). Commit ghi thẳng: *"The Liquid
  itself is NOT yet rendered on a store: validate in a theme preview before this goes to a live
  theme."* Theme Check pass ≠ đã render.
- **Con trỏ staging suýt bị ghi đè — ngày thứ ba liên tiếp.** `18d60a302` trả `STAGING_BRANCH` trong
  `.gitlab/ci/staging.yml` về giá trị gốc sau khi mượn tạm để đẩy `feat/customer-portal-ui` lên
  staging1. Hai lần trước (`STAGING4_BRANCH`, rồi conflict `STAGING_BRANCH` lúc merge) đã ghi ở
  [[shipped-subscriptions-2026-09-16]]. Ba lần trong ba ngày thì không còn là tai nạn.
- `d562e2ec0` tự ghi một mục **chưa verify**: *"whether Shopify accepts that selling plan for that
  variant at checkout"* — cần một đơn thật trên store mới biết. Cùng lớp với
  [[ack-khong-phai-hieu-ung]].

## ⚠️ Cần xác nhận

**1. Landing joyxjoy: 19 hay 16 handle resolve được, và đo trên store nào?**

| Nguồn | Nói gì |
|---|---|
| [[2026-09-16-landing-doi-nguon-lap-sang-collection-list]] (+ [[digest-subscriptions-2026-09-16]]) | *"Chỉ 19 handle đầu resolve được; từ vị trí 19 trở đi rỗng hết"* |
| Commit `40de9a2e9` | *"Measured on **joywholefoods.com.au**: 72 bundles, the first 20 handles attempted, **16 resolved**, 4 slots burnt on unpublished boxes, 52 never looked at"* |
| Commit `5a0752571` | *"On **sprayfreefarmacy** that is **72 bundles** in the metafield, **16** that Liquid can resolve, exactly 1 with a selling plan"* |

Hai chỗ lệch: số resolve (19 vs 16) và **cùng một bộ số 72/16 được gán cho hai store khác nhau**.
Nhiều khả năng một trong hai commit chép nhầm tên store, nhưng đây là con số sẽ bị trích lại làm
bằng chứng cho trần `all_products` — cần chốt đo trên store nào. Đúng lớp lỗi của
[[con-so-trong-tieu-chi-phai-kem-cach-do]].

**2. SB-16866 — brain đang ghi fix ở sai tầng.**

- [[shipped-subscriptions-2026-09-16]] ghi fix là: *"picker staples còn lọc bỏ product có plan không
  khớp contract ⇒ picker rỗng; bỏ lọc ở danh sách, giữ chốt chặn lúc bấm"* (commit `0fa1ebbef`).
- Commit `ac3e5f2f1` hôm nay nói gốc nằm ở tầng khác hẳn và **rộng hơn**: shop chạy plan v2 nên
  `getPopularSubscriptions` đọc collection `subscriptionProducts` (v1) vốn rỗng hợp lệ ⇒ endpoint
  trả `[]`. Và: *"The stock customer portal has the same gap on that shop; this is an **app-wide
  bug**, not a Wholefoods-portal defect."*

Tức bản ghi hôm qua mô tả một triệu chứng phụ chứ không phải gốc, và phạm vi ảnh hưởng (mọi shop
plan v2, cả portal gốc) chưa được ghi ở đâu. Cần sửa lại note hôm qua khi mature.

**3. `plan_v2` rỗng ở *mọi* bundle hay 15/16?**
[[digest-subscriptions-2026-09-16]] ghi *"`plan_v2` của mọi bundle là `false`"*; commit `d562e2ec0`
ghi *"15 of the 16 boxes the page can read carry no such metafield"* — tức có **một** box mang
metafield thật. Khác biệt này quan trọng vì nó quyết định `resolveAppPlans` có bao giờ trả về gì
không.

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-09-16]] · [[shipped-subscriptions-2026-09-16]] ·
[[2026-09-16-landing-doi-nguon-lap-sang-collection-list]] · [[2026-09-17-custom-sender-ses]] ·
[[2026-09-09-portal-wholefoods-extension-rieng]] · [[mutation-ghi-nguyen-khoi-xoa-field-khong-gui]] ·
[[loi-mang-bi-bao-thanh-ly-do-nghiep-vu]] · [[prop-sai-bi-bo-qua-im-lang]] ·
[[khong-error-boundary-hong-ca-man-hinh]] · [[ack-khong-phai-hieu-ung]]
