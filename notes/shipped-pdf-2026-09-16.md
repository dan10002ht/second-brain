---
type: note
title: Shipped PDF Invoice — commit landed 2026-09-15 (cap email theo ngày + plan trả phí có hạn)
summary: Master nhận 2 MR (!560 cap email/shop/ngày, !572 `temporaryPlan` cấp plan có hạn); nhánh `feat/rate-limit-email-sending` còn đợt rework lớn hơn cả feature — counter dời khỏi subcollection, TTL khai trong repo thay vì gõ `gcloud`, thêm override `dailyEmailLimit` ở DevZone.
tags: [pdf, invoice, avada, shopify, firebase, firestore, backend]
created: 2026-09-16
updated: 2026-09-16
source: repo `pdf` — git log 2026-09-15 (hash đã verify)
---

# Shipped — `pdf`, commit landed 2026-09-15

Root cause và cách làm đã nằm ở [[digest-pdf-2026-09-15]] và
[[2026-09-15-pdf-temporary-plan-tang-gate]] — note này chỉ ghi **cái gì đáp xuống đâu**.

## Shipped

### Vào `master`

| Merge | MR | Việc |
|---|---|---|
| `d170904d6` | !560 | `feat(email)` — cap số email invoice gửi mỗi shop mỗi ngày |
| `51de2d90c` | !572 | `feat(plan)` — cấp plan trả phí **có hạn** cho store partner bằng `temporaryPlan` (commit feature `22b99740a`, 16 file) |

`22b99740a` chốt **ranh giới cố ý**: chỉ nhóm gate tính năng đọc plan hiệu lực
(`isPremium`, `isAvailablePremiumFeature`, `isShopPro/Ultimate/Wholesale`,
`isShopOrderUnlimited`, POS print, mass preview, đính PDF vào email, `omitFieldByPlan`,
theme trả phí, `giveFreeThemeToFreePlan`, `whoami`). **Billing (subscription/charge), report
(insightTracker, apiV1) và webhook reconcile vẫn đọc `shop.plan` thô** — nếu không thì charge
dựng sai gói gốc và report báo doanh thu không có thật. Cấp qua DevZone → Bulk Update Shops
như cũ, input đi qua `normalizeTemporaryPlanFields`.

### Còn trên nhánh

**`feat/rate-limit-email-sending`** (`df783339a` là tip) — đợt rework sau khi !560 đã merge,
khối lượng đáng kể hơn bản feature ban đầu:

- `537ebd08c` — counter quota dời từ subcollection `shops/{shopId}/emailUsage/{date}` sang
  **top-level `emailUsage/{shopId}_{date}`**, thêm `expireAt = updatedAt + 7 ngày` cho TTL.
  Đây là một đổi hướng có lý do kiến trúc → tách riêng ở
  [[2026-09-16-pdf-emailusage-top-level]].
- `c368cb0fe` — khai TTL policy bằng `fieldOverrides` trong `firestore.indexes.json` (giống
  `deletedTemplates.expireAt`) thay vì bật tay bằng `gcloud`. `"indexes": []` ở đây là
  **index exemption**, không phải chỗ để trống — Firestore mặc định index mọi field, mà index
  một timestamp TTL dễ tạo hotspot.
- `26a04e549` — DevZone: `POST /dev_zone/daily-email-limit` (sau `devZoneAccess`) + ô nhập ghi
  thẳng `shop.dailyEmailLimit`, để trống là xoá override. `normalizeDailyEmailLimit`
  **từ chối số 0** thay vì lưu, vì `getDailyEmailLimit` chỉ nhận override `> 0` — lưu 0 sẽ đọc
  ngược thành ngưỡng theo gói, tức tưởng chặn hết mà hoá ra mở.
- `df783339a` — counter chỉ giữ `count` + `expireAt`; bỏ `shopId`/`date` (đã nằm trong doc id)
  và `updatedAt` (không ai đọc, lại là timestamp tăng đơn điệu). Test khoá **đúng tập field**
  thay vì chỉ kiểm vài field có mặt.
- `44a3873b7` — gỡ file plan khỏi git (`/docs` vốn đã trong `.gitignore`, trước đó vào bằng
  `git add -f`); spec giữ lại vì đó mới là thiết kế.

**`feat/temporary-plan`** — `5ce31fc67` cắt bớt comment quanh `temporaryPlan` (−51/+9 dòng),
đúng feedback đã ghi ở [[feedback-comment-chi-khi-code-roi]]. Nằm sau merge !572.

**`feat/ba/add-more-fields`** — `faba6f3cd` dựng tài liệu `colors-definition.md` (455 dòng):
4 màu Primary/Background/Section/Text, map 9 template mockup + Blank + AI + CD Light/Dark,
17 chỗ lệch (G1–G17), 11 AC. Ba commit sau (`83f9d39bf`, `9e0efef09`, `4e3aa3c69`) gỡ phần
"hợp đồng màu chung" và đối chiếu AC theo phần 3/6 — tức **bản 455 dòng đầu tiên đã bị chính
tác giả rút lại một phần trong ngày**, đọc bản mới nhất chứ không đọc commit đầu.

## Reverted

Không có `git revert` nào trong đợt này.

## Deploy notes

- Không commit nào mang `[deploy-functions]`.
- Không thấy version bump (`v3.x`) trong log đợt này.
- **`firestore.indexes.json` đổi ở `c368cb0fe`** (+6 dòng `fieldOverrides` cho `emailUsage`) —
  vẫn **trên nhánh**, chưa vào master. Khi merge phải deploy index/TTL policy cùng lượt, không
  chỉ deploy functions.
- `537ebd08c` ghi rõ **không cần migration**: counter reset mỗi ngày UTC, trường hợp xấu nhất là
  một shop được cấp lại quota giữa ngày (fail-open).
- Route DevZone mới (`26a04e549`) nằm sau `devZoneAccess` như mọi route dev-zone — không mở cho
  merchant.

## ⚠️ Cần xác nhận

**1. Field thứ ba của `temporaryPlan`: cờ nội bộ hay ghi chú?**

- [[2026-09-15-pdf-temporary-plan-tang-gate]] (decision, đã chốt) ghi ba field là
  `temporaryPlan`, `temporaryPlanUntil`, **và "cờ nội bộ kiểu `isPartnerStore` của Joy
  Subscription"**.
- Commit `22b99740a` (đã merge master qua !572) ghi field thứ ba là **`temporaryPlanNote`** —
  "để biết ai cấp / ticket nào", tức là ghi chú người dùng, không phải cờ phân loại store.
- Hai thứ này phục vụ mục đích khác nhau (một cái để lọc store partner ra khỏi report, một cái
  để truy vết ai cấp). Cần xác nhận cái nào thực sự có trong code, vì điều kiện xem lại của
  decision (2026-12-15) giả định có cờ phân loại.

**2. TTL: bật bằng `gcloud` hay khai trong repo?**

- Commit `537ebd08c` viết: *"Policy bat bang gcloud, cau lenh trong spec muc 4."*
- Commit `c368cb0fe` **cùng ngày** bác lại: *"Spec truoc do ghi bat TTL bang gcloud, la sai:
  repo da co san co che khai bao qua fieldOverrides."*
- Bản sau thắng (spec đã sửa trong chính commit đó), nhưng nếu ai đã chạy lệnh `gcloud` theo
  spec cũ thì đang có **hai nguồn khai báo cho cùng một TTL policy** — cần kiểm policy thực tế
  trên project `pdf-invoice-4717c` trước khi merge nhánh.

Liên quan: [[pdf]] · [[digest-pdf-2026-09-15]] · [[2026-09-15-pdf-temporary-plan-tang-gate]] ·
[[2026-09-16-pdf-emailusage-top-level]] · [[feedback-comment-chi-khi-code-roi]] ·
[[shipped-pdf-2026-08-22]]
