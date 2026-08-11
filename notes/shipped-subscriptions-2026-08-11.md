---
type: note
title: Shipped Joy Subscription — commit landed 2026-08-10 (v2.34.60→62)
summary: Commit landed 08-10 — master nhận 3 tag: `v2.34.60` một MR `[deploy-all]` không tiêu đề, `v2.34.61` banner rebuild widget SB-15248, `v2.34.62` surface lý do Shopify khi tạo selling plan group hỏng + action DevZone dọn sản phẩm đã xoá; trên nhánh: hai vòng sửa thông điệp gate của Sidekick (vòng sau gỡ chính chỉ thị vòng trước vừa thêm) và nới hook chặn git push; không revert, không migration.
tags: [subscription, shopify, avada, backend, extensions, bigquery]
created: 2026-08-11
updated: 2026-08-11
source: repo "subscriptions" — git log (2026-08-10); mọi hash + tag lấy nguyên từ log, branch suy từ ref decoration trong log (session không chạy được `git` trong repo)
---

# Joy Subscription — shipped 2026-08-10

> Ngày trước: [[shipped-subscriptions-2026-08-08]] · root cause của chùm selling-plan
> nằm ở [[digest-subscriptions-2026-08-10]] — note này **không lặp lại**.
> Bối cảnh project: [[subscriptions]] · [[subscriptions-debug-runbook]].

## Shipped

### Vào master — 3 tag

- **`0f0b810d7` — tag `v2.34.60`, MR !2455 — tiêu đề đúng bằng `[deploy-all]`, không gì khác.**
  Log không có diff stat, không có mô tả. Nguồn có thể là `dce46ea49` (nhánh
  `hotfix/deploy-functions`, cũng chỉ `[deploy-all]`). **Không thể biết cái gì đã lên prod ở
  tag này** từ git log — đây là một release mù, đáng ghi lại đúng vì thế.
- **`7adde06c2` — tag `v2.34.61`, MR !2442** — SB-15248 banner "free widget rebuild" trên
  trang widget settings.
- **`5f1b469ed` — tag `v2.34.62`, MR !2457** — gộp 3 commit, cùng một sợi từ JSUB-260806:
  - `e3d88ae5d` — `sellingPlanGroupCreate` trước đây log `userErrors` ra console rồi ném
    message chỉ chứa product gid, nên merchant/support đọc được đúng
    `"Error when create selling plan group, gid://..."` — **lý do thật bị vứt**. Nay lý do vào
    message, `subscriptionPlanController` trả nguyên văn qua `{success:false, message}`.
  - `2c2d529a8` — quét hết chỗ tương tự: cùng kiểu nuốt lỗi có ở `updateSellingPlanGroup`,
    `addProductVariantIds`, `removeProductVariantIds`, `addProductSellingPlan`,
    `removeProductSellingPlan`. Rút chung `helpers/shopify/graphqlErrorReason`, 6 call site
    một hình dạng. `GROUP_DOES_NOT_EXIST` **vẫn ném code trần** vì caller match theo chuỗi đó.
    ↳ đúng kỷ luật ở [[feedback-follow-conventions]].
  - `ad3a0d1b1` — action DevZone dọn sản phẩm đã xoá trên Shopify. "Select all products" đọc
    changelog BigQuery, mà changelog vẫn liệt kê sản phẩm merchant đã xoá;
    `sellingPlanGroupCreate` là all-or-nothing nên **một id chết làm hỏng cả plan** — shop
    trong JSUB-260806 chưa bao giờ tạo nổi selling plan group. Action đối chiếu id với Shopify
    rồi xoá doc mirror `shopifyProducts`; trigger `onWrite` sẵn có tự append row
    `operation: DELETE` và `get_shopify_products_latest` lọc nó ra.
    **Đường tạo plan không được thêm validation nào** — cố ý, ghi thẳng trong commit.

  Chỗ đáng dừng lại: commit tự nói đây là *"the write the **products/delete webhook** should
  have made"*. Tức là fix này **vá hệ quả, không vá nguyên nhân** (webhook early-return, xem
  [[digest-subscriptions-2026-08-10]]) — và làm bằng **thao tác tay trong DevZone**, không
  phải tự động. Nếu webhook chưa sửa thì mirror sẽ bẩn lại.

### Còn trên nhánh

- `fix/sidekick-plan-gate-message` — **hai vòng, vòng sau gỡ đúng thứ vòng trước thêm**:
  `f2a623c9c` thêm chỉ thị agent-facing vào `AGENT_TOOL_GATE_MESSAGE` + cấm giọng upsell trong
  `instructions.md` của 3 extension; `f2269ded5` **gỡ chỉ thị đó ra khỏi tool response** vì
  content policy của Shopify Sidekick liệt "embedded directives" vào thứ response không được
  mang, và **response bị kiểm lúc runtime**. → tách thành đề xuất decision riêng:
  [[2026-08-11-sidekick-gate-message-khong-mang-chi-thi]].
- `feat/widget-rebuild-banner` — `f93f48cf0` mirror banner sang skeleton của widget settings.
  Nằm **sau** tag `v2.34.61` trong log ⇒ bản lên prod là banner **chưa có** skeleton tương ứng
  (đúng loại lệch chiều cao đã gây CLS ở [[shipped-subscriptions-2026-08-06]]).
- `feat/widget-badge-customize` — `9fd81d9e1` đẩy key i18n của banner sang 6 locale
  (`origin.json` + 5 ngôn ngữ, **không có `en.json`**); `2cae52899` trỏ staging2 vào nhánh này.
- `feat/sb-13947-volume-bundle` — `9dc15c6d1` **"fix bug"**: 21 file, chạm preview, gift tier,
  `buildVolumeBundleMetafield`, `volumeBundleValidation`, `backgroundHandler`, 7 file locale.
  Tiêu đề không nói gì về 271 dòng đổi — nhánh SB-13947 vẫn sống (theo dõi từ
  [[subscription-shipped-2026-07-13]]) nhưng log không dùng được để biết nó sửa gì.
- `chore/push-guard` (`eb6dd2af9`) và bản trùng trên `fix/deleted-products` (`479da36ff`) —
  nới `guard-git.sh`: chặn push nhánh feature làm agent dừng ở việc vốn đã an toàn; nay chỉ
  chặn deploy branch, `--all`/`--mirror`, refspec có `master`/`main`, và mở MR. **Khi không
  resolve được nhánh đích thì guard từ chối** — đoán sai về phía cho phép thì push nhầm
  master, đoán sai về phía cấm chỉ tốn một câu lệnh gõ tay. Khớp
  [[feedback-git-guard-chi-chan-master]].
- `fix/update-automerge-author` — `247afe211`. Xem ⚠️ bên dưới.
- Trùng lặp cần biết khi đọc log: `597638ddc`/`5efe009f8`/`af77c5c2a` là cùng nội dung với
  `ad3a0d1b1`/`2c2d529a8`/`e3d88ae5d` trên nhánh nguồn. Bản nhánh `597638ddc` **có 3 entry
  `packages/*/node_modules`** trong diff (bị commit nhầm dạng gitlink), bản vào master thì
  không — liên quan trực tiếp tới `node_modules` symlink trỏ vào chính nó đã ghi ở
  [[digest-subscriptions-2026-08-10]]. Đây là thứ sẽ tái phát: kiểm `git status` trước commit.

## Reverted

Không có revert nào, cả trên master lẫn trên nhánh. `f2269ded5` **là** một đảo hướng về bản
chất (gỡ cách làm của `f2a623c9c`) nhưng cả hai đều chưa vào master.

## Deploy notes

- Version: `v2.34.58` → **`v2.34.62`** (4 tag trong ngày, 3 tag có nội dung tra được).
- **`[deploy-all]` xuất hiện 4 lần**, nhưng chỉ 1 lần là release thật (`0f0b810d7`/`v2.34.60`,
  MR !2455). Ba lần còn lại chỉ đổi 1 dòng file CI để trỏ staging:
  `dce46ea49` (hotfix branch), `c0df099d9` (staging3 → `fix/sidekick-plan-gate-message`),
  `2232e93b0` (staging2 → `custom/delivery-date-spray`). Đúng pattern đã ghi ở
  [[shipped-subscriptions-2026-08-08]]: **cờ deploy trên commit CI là để đẩy staging, không
  phải ship prod** — đừng đọc `[deploy-all]` trong log là "đã lên prod".
- **Không có file migration, không có `firestore.indexes.json`** trong log ngày này.
- `v2.34.62` thêm **hành động xoá dữ liệu** (`deleteShopifyProductsByShopifyIds`) vào DevZone.
  Không tự chạy, nhưng là nút xoá doc mirror — ai bấm nhầm shop thì mirror mất sản phẩm cho
  tới lần sync sau.

## ⚠️ Cần xác nhận

**Whitelist auto-merge: brain ghi `longlv3` là bản đã sửa, log 08-10 nói `longlv3` là bản sai.**

| Nguồn | Nói gì |
|---|---|
| [[2026-08-06-auto-merge-mr-tai-lieu-ba]] + [[shipped-subscriptions-2026-08-07]] (`e87e4def8`) | đổi `longlv` → **`longlv3`** là *fix* |
| `247afe211` (repo này) + `f4afb11f9` (repo `pdf`, body đầy đủ) | `longlv3` **không khớp tài khoản GitLab nào**, job auto-merge **chưa từng chạy** |

Cùng một mâu thuẫn với [[shipped-pdf-2026-08-11]] — chi tiết và câu hỏi mở ghi ở đó, không
chép lại. Ở repo này commit `247afe211` chỉ có tiêu đề *"Update auto merge author"*, không
nói username mới là gì.

## Liên quan

[[digest-subscriptions-2026-08-10]] · [[shipped-subscriptions-2026-08-08]] ·
[[2026-08-11-sidekick-gate-message-khong-mang-chi-thi]] · [[shipped-pdf-2026-08-11]] ·
[[2026-08-06-auto-merge-mr-tai-lieu-ba]] · [[feedback-git-guard-chi-chan-master]] ·
[[feedback-follow-conventions]] · [[shipped-subscriptions-2026-08-06]] ·
[[subscription-shipped-2026-07-13]] · [[subscriptions]]
