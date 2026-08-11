---
type: note
title: Shipped PDF Invoice — commit landed 2026-08-10
summary: Commit landed 08-10 — master CHỈ nhận 4 MR mockup/PRD của BA (!506–!509, không code app, không version bump); khối lượng thật trên hai nhánh — SB-15301 payment reminder 6 fix (theme email, attachment, modal, CKEditor echo guard) và feature B2B early payment discount P1–P5 mới tinh (7 commit, +1 dòng `firestore.indexes.json`, topic Pub/Sub + cron mới); không revert, không cờ deploy.
tags: [pdf, invoice, avada, backend, nodejs, firestore]
created: 2026-08-11
updated: 2026-08-11
source: repo "pdf" — git log (2026-08-10); mọi hash dưới đây lấy nguyên từ log, chưa đối chiếu bằng `git branch --contains` (session không chạy được lệnh trong repo)
---

# PDF Invoice — shipped 2026-08-10

> Ngày trước: [[shipped-pdf-2026-08-08]] · root cause chi tiết của SB-15301 nằm ở
> [[digest-pdf-2026-08-10]] — note này **không lặp lại**, chỉ ghi cái gì đã landed ở đâu.
> Bối cảnh project: [[pdf]].

Lặp lại đúng hình dạng đã thấy từ 07-31: **master là kênh của BA, không phải của dev**.
Bốn MR vào master ngày này đều là `Update mockup-app and PRD`; toàn bộ code app còn nằm trên
nhánh. Cái mới đáng chú ý nhất là một feature chưa từng xuất hiện trong brain: **B2B early
payment discount**.

## Shipped

### Vào master — 4 MR, 100% mockup/PRD

| Merge | MR | Nội dung |
|---|---|---|
| `29c7ae3aa` ← `19f332d50` | !509 | mockup automation-email + order-detail, PRD *Company Payment Terms* |
| `e44c2274c` ← `c335f08c4` | !508 | mockup automation-email viết lại lớn (~1.089 dòng), b2b company orders/payment terms, order-detail |
| `6bbfa7262` ← `aa029c980` | !507 | mockup company-payment-terms + PRD *Company Payment Terms* (bản đầu) |
| `59383b6d5` ← `365b2db86` | !506 | 23 file: toàn bộ `TemplateEditor` paper mockup, **xoá** `location-payment-terms.jsx`, thêm `crossAppUtm.js`, PRD ***Early Payment Discount on Invoice*** + test case |

Đáng để ý: PRD `Early Payment Discount on Invoice` (!506) vào master **cùng ngày** với
7 commit code cùng chủ đề trên nhánh `feat/add-order-discount-b2b` — tài liệu và code đi
song song, không phải doc viết sau.

### Còn trên nhánh — `feature/payment-reminder` (SB-15301)

Sáu fix, tất cả cùng một họ: *feature chạy đúng ở preview, sai ở mail thật*.

- **`6c162f4ec`** — mail reminder chưa từng được bọc theme; markup preview được rút ra
  `helpers/email/buildReminderEmailHtml.js` để cả hai đường (cron + send test) dùng chung.
  Hai gap cố ý bỏ ngỏ: `customCss` per-reminder-type vẫn chết, và copy mặc định vẫn nhắc
  "attached PDF" cả khi merchant chọn view-online.
- **`933e741c8`** — bọc theme rồi vẫn mất nền: `body`-level style bị Gmail strip → viết lại
  bằng `<table>` + `bgcolor` + inline style. Test strip mọi thứ tới `</style>` rồi assert màu
  còn sống, tức là *đưa màu về stylesheet là fail suite*.
- **`153e74913`** — PDF không đính kèm: `sendMail` nhận `attachments` ở tham số 2 nhưng đặt
  vào **config transport** thay vì options của message. Cố ý **không** sửa `mail.service.js`
  (tham số đó dùng chung mọi đường mail của app).
- **`1c7384742`** — modal send-test đóng trước khi request xong; thêm prop `closeOnAction`
  mặc định giữ hành vi cũ để `AutomationEmail.js` không đổi.
- **`177a4489c`** — khối `📎 tên-file.pdf` trong thân mail thành link tải thật
  (`generateViewOnlineOrDownloadLink` với `isDownload`); tham số optional để preview không
  leak `undefined` vào href.
- **`f2c6921ea`** — save bar tự bật khi đổi loại reminder: `@ckeditor/ckeditor5-react` gọi
  `editor.data.set()` khi prop `data` đổi, và cú đó phát cùng `change:data` như user gõ.
  Guard được đặt **đúng điều kiện thư viện dùng để quyết định gọi `data.set()`, đọc live từ
  editor** — nên không thể arm hụt cũng không thể kẹt. Vòng trước theo dõi "giá trị mình vừa
  emit" thì cờ kẹt và nuốt phím thật. State machine tách ra `echoGuard.js` + 140 dòng test vì
  `packages/assets` không có DOM harness và regression là *một chuỗi render*, không phải một render.
- `4aa514f0f` — 41 manual test case cho payment reminder, nêu trước 4 hành vi
  known-and-deliberate để tester không log thành bug (đơn cũ không bao giờ được nhắc →
  feature im lặng khoảng một tháng đầu; `customCss` chết; copy nhắc attachment ở mode view-online).
  ↳ Nối tiếp [[2026-08-09-hoan-backfill-co-don-cu-pdf]] — nay đã thành *tài liệu chính thức*,
  không còn là quyết định ngầm.
- `58fa236a4` — trỏ CI staging về nhánh này (1 dòng `.gitlab-ci.yml`).
- `f4afb11f9` — sửa `AUTO_MERGE_AUTHORS`. Xem ⚠️ bên dưới.

### Còn trên nhánh — `feat/add-order-discount-b2b` (feature mới, chưa có trong brain)

Tự động giảm giá "early payment" cho đơn B2B. **Cơ chế song song với `wholeSale.service.js`
legacy, không thay thế** (`aeefe91b3` nói thẳng điều đó).

- **`aeefe91b3` — P1–P4, 17 file / ~1.955 dòng.** Dùng `orderEditAddLineItemDiscount`.
  Điểm cốt lõi: Order Editing API **không giảm giá được dòng shipping**, nên phần trăm gửi
  cho Shopify được suy ngược để *tổng đơn* rơi đúng r% của `total_price`:
  `D = r/100 × total_price`, `denom = Σ(subtotal+tax)` các line sửa được, `p = D/denom × 100`.
  Ngưỡng nghiệm thu là **sai số tương đối ≤ 0,05%**, không phải ±0.01 — Shopify cắt
  `percentValue` còn 3 số lẻ nên chênh ~0.02 là không sửa được.
- **`6cd343775`** — hai bug chỉ lộ ra ở lần chạy E2E đầu (unit test mock Shopify đi nên mù):
  `discount_applications[]` **không bao giờ bị Shopify xoá** sau `orderEditRemoveDiscount` và
  cứ dồn lại, nên `length > 0` báo "đơn này đã có discount" vĩnh viễn; và record bắt đầu giữ
  `expectedDiscount` cạnh `discountAmount` (số Shopify thật sự trừ, đọc lại sau commit).
- **`5a6d46640`** — `maxInstances: 10`. Số học rate-limit đo trên store thật: bucket 2000
  điểm, hồi 100/s; `orderEditBegin` 14 điểm + mỗi `orderEditAddLineItemDiscount` 10 → đơn 3
  dòng ≈ 54 điểm ≈ 1,8 đơn/s. **Tổng lưu lượng không bao giờ là ràng buộc — đồng thời mới
  là.** Bị throttle ở đây đắt bất thường vì *không có gì hứng*: `autoLimit` của
  shopify-api-node chỉ bọc REST, `graphql()` gọi `got()` với `retry: 0`, và trigger Pub/Sub
  mặc định `retry: false` → message không bao giờ được gửi lại. Thêm
  `helpers/log/b2bDiscountLogger.js` để 5 outcome grep được bằng một filter Cloud Logging.
- **`9795baee0`** — cấm tính tiền từ payload webhook: trộn `total_price` của payload với
  subtotal đọc từ session `orderEditBegin` là trộn **hai snapshot khác thời điểm** — đo được
  83.33 thay vì 83.17. Nay consumer fetch lại đơn trước mọi phép tính, fetch fail thì
  **không apply** (sai số tiền tệ hơn không giảm giá) nhưng **vẫn publish invoice**.
  Gap còn treo có ghi rõ: store nào Shopify tính thuế bất đồng bộ sau khi tạo đơn thì cả hai
  vế cross-check cùng đồng ý trên một tổng chưa thuế.
- **`68643119f` — P5, cron fan-out.** Cron giờ đọc record tới hạn rồi publish mỗi cái một
  message; mọi việc chạm Shopify nằm ở consumer. Lý do **không** phải thẩm mỹ: đường legacy
  tương đương gọi thẳng Puppeteer từ trong vòng fan-out 10 đơn/lượt trong function 2GiB —
  đã đo 11 Chromium đồng thời ≈ 2.640MB, chỉ chưa nổ vì prod đúng 1 đơn loại đó.
  Bốn kết cục terminal, và **`failed` cố ý không gộp vào `expired`**: `expired` = khách mất
  discount; `failed` = khách **giữ** discount không còn đủ điều kiện và cần người can thiệp.
  `findDueRecords` cap 500/lượt **và log khi chạm cap** — để backlog xử lý dở không đọc thành
  "đã xong hết".
- **`a2beef5e0`** — allowlist shop chuyển từ source sang env `B2B_DISCOUNT_SHOPS`: bật cho
  một shop giờ là đổi config, không phải sửa code + build + deploy. Mặc định vẫn tắt.
- **`1e29d1da8`** — `discountAmount` = `totalBefore − totalAfter` (mức tổng đơn thật sự rơi),
  không phải tổng allocation của line. Trên đơn có thuế hai số **luôn** lệch: giảm giá một
  line cũng giảm thuế của line đó, mà phần giảm thuế không nằm trong allocation nào — đo trên
  damhv-test #1002: tổng rơi 88.73 / kỳ vọng 88.749 (đúng tới 0.02) trong khi allocation cộng
  ra 81.97, *nhìn như sai 6.78*. Đơn không thuế che hoàn toàn lỗi này (#1001 hai số bằng nhau),
  nên các lần chạy emulator trước không bắt được. Tổng allocation giữ lại dưới tên
  `lineItemDiscountAmount` vì đó là con số Shopify hiện cho merchant.

## Reverted

Không có revert nào trong log ngày này, cả trên master lẫn trên nhánh.

## Deploy notes

- **Không có `[deploy-functions]` / `[deploy-all]`** và **không có version bump** — mốc gần
  nhất vẫn là `v3.1.74` từ [[shipped-pdf-2026-08-08]].
- `68643119f` **thêm 1 index vào `firestore.indexes.json`** (`b2bDiscountRecords`:
  `status`, `deadline`) — commit ghi rõ *file không được regenerate*, chỉ append. Index
  composite mới cần thời gian "building" trước khi query dùng được (đã ghi ở
  [[digest-pdf-2026-08-10]]) → đừng chạy cron ngay sau deploy rồi kết luận query hỏng.
- `aeefe91b3` + `68643119f` thêm **topic Pub/Sub mới** (`applyB2BDiscount`, `expireB2BDiscount`)
  và **cron mới** trong `index.js` → deploy functions đầy đủ, không chọn lọc.
- Feature vào prod **im lặng theo thiết kế**: `B2B_DISCOUNT_SHOPS` rỗng = không shop nào bật.
  Nhưng nó là **env var**, nên bật/tắt không còn để lại dấu vết trong git — muốn biết shop
  nào đang bật phải đọc config function, không đọc code.
- `58fa236a4` đổi 1 dòng `.gitlab-ci.yml` để staging trỏ `feature/payment-reminder` — pattern
  "commit CI để đẩy staging" đã ghi ở [[shipped-subscriptions-2026-08-08]].

## ⚠️ Cần xác nhận

**Whitelist auto-merge: brain ghi `longlv3` là bản đã sửa, log 08-10 nói `longlv3` là bản sai.**

| Nguồn | Nói gì |
|---|---|
| [[2026-08-06-auto-merge-mr-tai-lieu-ba]] (summary) + [[shipped-pdf-2026-08-07]] (`9f3aaff8c`, MR !499) | hotfix ngay trong ngày đổi `longlv` → **`longlv3`**, coi như đã chữa xong |
| commit `f4afb11f9` (08-10, pdf) + `247afe211` (08-10, subscriptions) | *"AUTO_MERGE_AUTHORS listed longlv3, **which matches no GitLab account**, so the docs auto-merge job **never fired** for longlv"* |

Tức là hotfix 08-06 sửa **ngược hướng**, và auto-merge im lặng suốt 4 ngày mà không ai biết —
đúng cái rủi ro decision đã tự cảnh báo ("luật gắn cứng vào một username… đổi username là
auto-merge im lặng"). Cần xác nhận username đúng cuối cùng là gì, rồi **sửa `summary:` của
[[2026-08-06-auto-merge-mr-tai-lieu-ba]]** (đang ghi `longlv3`). Câu hỏi kèm theo: vì sao một
job CI không chạy suốt 4 ngày lại không có tín hiệu nào — 4 MR mockup ngày 08-10 đều được
merge, nên có thể ai đó vẫn merge tay mà tưởng là tự động.

## Liên quan

[[digest-pdf-2026-08-10]] · [[shipped-pdf-2026-08-08]] · [[digest-pdf-2026-08-09]] ·
[[2026-08-06-auto-merge-mr-tai-lieu-ba]] · [[2026-08-09-hoan-backfill-co-don-cu-pdf]] ·
[[feedback-feature-moi-mac-dinh-opt-in]] · [[digest-pdf-apiv1-workflow-2026-07-21]] ·
[[controller-service-repository]] · [[pdf]]
