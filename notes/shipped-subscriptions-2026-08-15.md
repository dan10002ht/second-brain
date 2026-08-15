---
type: note
title: Shipped subscriptions 2026-08-15 — master nhận 4 MR / 2 tag, khối Klaviyo vẫn nằm trên nhánh
summary: Commit landed 08-14 — master nhận 4 MR dưới 2 tag (`v2.34.68` onboarding v5 UI + `v2.34.69` boot tips, kèm 2 MR tooling không tag): gate commit soi đúng repo đang commit và bộ gate/audit-sweep/security-review trước MR; toàn bộ cụm Klaviyo (5 nhánh, restack) + 2 script chỉ-đọc + fix CI artifacts on-prem còn trên nhánh; không revert trên master, không cờ deploy, không migration.
tags: [avada, subscription, shopify, marketing-automation, tooling]
created: 2026-08-15
updated: 2026-08-15
source: repo "subscriptions" — git log (commit 2026-08-14, hash đã verify từ log)
---

# Shipped — subscriptions (commit landed 2026-08-14)

## Shipped — vào master

| Tag | MR | Nội dung |
|-----|----|----------|
| `v2.34.68` | !2466 (`fe23d5fa8`) | onboarding v5 UI polish + thứ tự card dashboard |
| — | !2467 (`832b61627`) | gate commit soi **repo đang được commit**, không phải checkout chính |
| — | !2468 (`a602ff7af`) | one-command done-criteria gate, workflow audit fan-out, security review trước MR |
| `v2.34.69` | !2469 (`8016e0ac0`) | vị trí boot loading tips & reload-notice |

**Gate commit soi nhầm repo** (`9e657a3bf`, nhánh `fix/guard-git-worktree-scope`, 1 file +39/−20).
Push rule đã resolve thư mục lệnh thật sự chạy, còn gate thì không — nó dùng `$CLAUDE_PROJECT_DIR`
(checkout lúc mở session), nên commit từ worktree bị chấm bằng working tree của checkout chính,
và commit ở repo khác bị chấm bằng repo này. Chặn đứng 3 lần commit của agent, `--no-verify`
vô dụng vì hook chạy **trước** git. Nay một resolver `target_dir()` phục vụ cả hai rule, xử được
`cd` nối bằng `;`/xuống dòng, đường dẫn tương đối, và resolve về toplevel. Đối chứng 11 case:
hook cũ sai 2/11.

**Bộ tooling MR** (`2d3121ed0` → !2468): `.claude/scripts/gates.sh` (82 dòng),
`.claude/workflows/audit-sweep.js` (233 dòng), `create-mr` thêm bước security review, CLAUDE.md +30.

**Boot loading tips** — 5 vòng trên nhánh mới ra hình cuối (`ba1dde8bb` → `a2fdc93ce` →
`8a4caa8f9` → `2a39692e9` → `6aa979c4b`). Hai điểm đáng giữ:
- Tra `#reload-notice` **inline** luôn trả `null` vì nó được parse sau script → tips không bao giờ ẩn.
- Thay `null` bằng **MutationObserver** cũng hỏng: observer *không bao giờ fire* trong thực tế.
  Chốt lại bằng cách ẩn thẳng trong timeout 15s của mỗi entry và bỏ observer.
  (Đây là lần thứ hai MutationObserver bị bỏ trong repo này — xem [[shipped-subscriptions-2026-07-18]].)
- Logo phải đứng yên: tips và notice cùng **absolute** ở một chỗ, cột chỉ còn logo ở mọi trạng thái.

**Preview onboarding v5**: chiều cao 460 → 640 (`62f735749`) → 870 (`3c13e41b8`) → **540**
(`10888ac23`), và vùng scroll chuyển từ cả `StorefrontFrame` xuống `.ProductPage` (`0bea96777`)
để browser bar + store header đứng yên.

## Reverted

Không có revert trên master. Hai revert nội bộ nhánh, đều là vòng lặp UI trong ngày:
- `10888ac23` — trả cap chiều cao preview về 540px (undo `3c13e41b8`).
- `1489b085a` — bỏ hẳn card "Overview" bọc metrics dashboard, `ReportSummary` về layout cũ,
  xoá key i18n `overview` khỏi source JSON + 6 file locale.

## Deploy notes

- **Không** commit nào mang `[deploy-functions]` / `[deploy-all]` / `[deploy-extensions]`.
- Version bump: `v2.34.68`, `v2.34.69`. Lặp lại pattern đã ghi ở [[shipped-subscriptions-2026-08-12]]:
  nhiều MR vào master nhưng tag chỉ đóng ở một số MR — !2467 và !2468 không có tag riêng.
- Không file migration, không `firestore.indexes.json`.
- `dee93442c` (nhánh `fix/ci-artifacts-onprem`) đổi `publish-fe` clone repo artifacts từ on-prem
  — **1 dòng** trong `.gitlab/ci/production.yml`, chưa vào master. Nền: [[2026-08-14-artifacts-onprem-seed-khong-lich-su]].

## Còn trên nhánh (chưa merge)

- **Cụm Klaviyo** — 5 nhánh đơn mục đích rồi restack thành một dãy (mỗi thay đổi xuất hiện 2 hash,
  nội dung y hệt): audit doc `facb11c35`/`d84721d42`, order-shape payload `fd6b29686`/`19f7e0509`,
  sample event dựng payload mới thay vì mutate const dùng chung `4a81c12ec`/`2ab509301`,
  log lỗi đủ context `4523763cd`/`feeddf19e`, tự bắn sample event lúc connect `8b05b2886`/`3c8ed6d06`,
  cộng `a8bdd1b8a` trỏ sample data về `joysubscription.com`. Root cause + chi tiết:
  [[digest-subscriptions-2026-08-14]] (MR !2470).
- **2 script chỉ-đọc** (`packages/functions/src/commands/misc/`):
  `88f8bb439` đối chiếu `basePrice` từng line contract với `PriceList.prices(originType: FIXED)`
  (298 dòng, không `--apply`, không mutation); `0c8445853` enrich CSV import Appstle —
  resolve `customer_id` từ email + điền province code chỉ khi country yêu cầu (262 dòng).

## ⚠️ Cần xác nhận

**Nguồn sự thật của giá contract.** [[digest-subscriptions-2026-08-14]] chốt rằng
"mọi nguồn tự suy hiện có đều đang là nguồn sai" nên công cụ sửa giá phải nhận giá tường minh
(`--line=<variantId>:<price>`). Commit `88f8bb439` lại chọn **`PriceList.prices(originType: FIXED)`
làm nguồn sự thật** để đối chiếu, và chỉ loại `contextualPricing` (giữ ở cột phụ) vì nguồn đó
"đã được chứng minh không đáng tin trên shop kookut".

Hai bên không nói cùng một điều: brain nói *không tin nguồn suy nào*, commit nói *chỉ không tin
contextualPricing, PriceList thì tin được*. Cần chốt: PriceList FIXED đã được đối chiếu với dữ liệu
prod kookut chưa, hay mới là giả định thay thế? Nếu đã chứng minh thì digest 08-14 cần sửa lại
phạm vi câu kết luận.

> Trả lời một phần ở [[digest-subscriptions-2026-08-15]]: số PriceList FIXED cho ra (1.70 / 40.00)
> khớp con số merchant khẳng định trong ticket, nên nó **không** chỉ là giả định thay thế.
> Vẫn treo phần CS/merchant confirm chính thức.

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-08-14]] · [[digest-subscriptions-2026-08-15]] ·
[[du-lieu-hong-song-sot-vi-ba-lop-nhin-cho-khac]] · [[shipped-subscriptions-2026-08-13]] ·
[[feedback-git-guard-chi-chan-master]] · [[2026-08-13-tach-gate-khoi-cham-tung-bug]] ·
[[bang-chung-phan-biet-duoc]]
