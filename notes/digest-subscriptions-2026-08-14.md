---
type: note
title: Digest subscriptions 2026-08-14 — Klaviyo rò dữ liệu giữa shop, CI artifacts on-prem, giá contract kookut
summary: Sample event Klaviyo mutate const module-level nên email shop A rò sang shop B; CI publish-fe chết vì clone repo artifacts gitlab.com bằng token đã hết hạn; và chuỗi đảo kết luận khi truy "app tự sửa giá" ở kookut — chốt được là app ghi sai `basePrice` lúc tạo dòng, khách bị thu sai tiền thật.
tags: [avada, subscription, shopify, marketing-automation, debug, cdn]
created: 2026-08-14
updated: 2026-08-14
source: project "subscriptions" — session history 2026-08-13/14
---

# Digest subscriptions — 2026-08-14

Ba mạch việc trong ngày: dọn nốt cụm Klaviyo qua `/looptasks`, chuyển CI khỏi repo
artifacts trên gitlab.com, và truy ticket "app tự điều chỉnh giá sản phẩm" của store kookut.

## Bugs

**Sample event Klaviyo rò dữ liệu giữa các shop (P0).** `SAMPLE_EVENT_DATA`,
`SAMPLE_SUBSCRIPTION_BASE_DATA`, `SAMPLE_ORDER_BASE_DATA` là **const ở module level**;
mỗi lần gửi sample cho một shop, code mutate thẳng lên object dùng chung → email/thông tin
shop A còn dính lại và đi theo request của shop B. Sửa bằng **factory** `buildSampleEventData()`
(xoá hẳn 3 const) chứ không deep-clone — clone chỉ vá triệu chứng, factory làm nguồn dữ liệu
không còn tồn tại để mà chia sẻ. Cùng họ với [[firestore-multitenant]]: state dùng chung ở tầng
module là một kênh rò tenant, không chỉ là chuyện code sạch.

**2 metric Klaviyo thiếu `chargeId` / `shopify_order_id` / `scheduled_at`** vì quên
`isOrder: true` ở call site. Quét ra 25 lời gọi `sendKlaviyoEvent` trên 10 file để chắc
không còn chỗ nào cùng bệnh — đúng thói quen "sửa là quét hết" ([[feedback-follow-conventions]]).

**Publish sample event nằm ngay trong OAuth callback.** `getKlaviyoAuthUrl` được nối thẳng
vào `router.get('/klaviyo/callback')` — tức chính URL Klaviyo redirect merchant về. Publish
throw ở đó là merchant kẹt giữa luồng connect. Verifier bắt đúng chỗ này (FAIL vòng 1);
fix là bọc try/catch, log qua `logKlaviyoEventFailure`, vẫn redirect như cũ.

**Job `publish-fe` fail exit 128** (`.gitlab/ci/production.yml`): bước clone
`joy-subscription-artifacts` từ **gitlab.com** trả `HTTP Basic: Access denied` — token CI
hết hạn/sai scope. Không dính gì tới MR đang mở (job checkout tag `v2.34.69`). Điểm phải nhớ:
**`CI_JOB_TOKEN` chỉ đọc, không push được sang repo khác** — muốn CI ghi vào repo artifacts
thì phải là PAT/Project Access Token riêng.

**kookut — "app tự điều chỉnh giá sản phẩm" (case #151147970941).** Chuỗi này đảo kết luận
ba lần, và mỗi lần đảo đều do verifier tự đọc prod chứ không tin vòng trước:

| Kết luận từng nói | Thực tế |
|---|---|
| "Không phải bug hoán giá index vì `basePrice` khớp catalog" | Verifier phá được — so nhầm nguồn giá |
| "1,95 và 45,95 khớp catalog nên app ghi đúng" | Sai; đối chiếu lại `variantId → product.title` mới lộ ra lệch |
| "Thẻ hết hạn 07/2026, chưa hết hạn lúc fail" | Hôm nay là 14/08/2026 — thẻ **đã** hết hạn |
| "Hai order dùng hai thẻ khác nhau (`1932` vs `7216`)" | Chỉ một thẻ; `showRevoked: true` chứng minh |

Phần đứng vững: **app không sửa giá catalog Shopify** (không có đường code nào ghi giá sản phẩm),
nhưng **ghi sai `basePrice` lúc tạo dòng contract** — dòng Salmon 24x70g sinh ra đã mang
`basePrice = 40` ngay tại `cycleIndex=2`. Khách bị thu sai tiền thật (mọi dòng đúng bằng
`basePrice × 0,95`), không phải "chỉ hiển thị sai". Đường nghi phạm: khách tự thêm variant
vào contract đang chạy qua Classic Customer Portal (`managementController`), và store này
đang **bật `syncProductPrice`** — thứ mà giả định ban đầu cho là tắt.

Nút bulk **"Edit product price"** trên trang Subscriptions **không phải route mồ côi** như
tưởng — merchant dùng hằng ngày (có gate ở frontend, vòng điều tra đầu bỏ sót).

## Techniques

- **zsh nuốt `:r` trong refspec.** `git push onprem "$NEW:refs/heads/main"` bị zsh hiểu
  `$NEW:r` là modifier "bỏ đuôi" → refspec thành rác. Xảy ra **kể cả trong nháy kép**; chỉ
  thoát khi viết sha literal. Gặp hai lần trong một phiên.
- **Chứng minh hai repo trùng nội dung bằng hash cây thư mục**, không bằng commit message:
  onprem HEAD và bản đối chiếu cùng tree `15d90c2a0a` → 16 commit "riêng" của onprem là bản sao.
- **GitLab: Maintainer ≠ được force push.** `Allowed to push and merge = Maintainers` và
  cột `Allowed to force push` là **hai quyền tách rời** trên protected branch.
- **Gỡ token khỏi `.git/config` không làm token hết hiệu lực** — phải revoke ở GitLab.
  Token `glpat-w06k0…` bị lộ qua remote URL cũng chính là `ON_PREMISE_GITLAB_TOKEN` trong
  `packages/functions/.env.local` (lượt trước tôi khẳng định "token khác" — sai).
- **Slack token thiếu scope `files:read`** → tải file đính kèm trả về HTML login. Lối vòng:
  file gốc là Google Sheet public → `export?format=csv` lấy thẳng.
- **Công cụ sửa giá phải nhận giá tường minh.** `applyContractLinePrices.js` được thiết kế
  nhận `--line=<variantId>:<price>` thay vì tự suy từ catalog — vì mọi nguồn tự suy hiện có
  đều đang là nguồn sai. Rủi ro verifier nêu: vòng update từng line không kiểm lỗi trả về
  (ghi nửa chừng), và mutation thiếu field `pricingPolicy` sẽ **reset discount 5% của khách**.

## Context

- MR gộp Klaviyo: **!2470** (6 commit — audit doc, order-shape, sample leak, event logging,
  auto-send sample lúc connect, đổi link sample sang `https://www.joysubscription.com/`).
- MR **!2472** — đổi CI clone artifacts sang on-prem (một dòng host + username).
  Chi tiết seed repo on-prem: [[2026-08-14-artifacts-onprem-seed-khong-lich-su]].
- Một agent chạy `git stash` / `git stash pop` dù brief cấm chạy git — lặp lại đúng rủi ro đã
  ghi ở [[digest-ticket-mcrsv-2026-08-14]] (agent tự ý chạy lệnh git phá hoại diff của người khác).
- `BRIEF.md` 584 → 298 dòng, 19 task chuyển sang `BRIEF-done.md`.
- Lệnh `--apply` sửa giá contract kookut **bị user chặn, chưa ghi gì lên prod** — root cause
  tầng code vẫn chưa được xác nhận bằng dữ liệu, ⚠️ *chưa xác minh*.

Liên quan: [[subscriptions]] · [[digest-subscriptions-2026-08-13]] · [[bang-chung-phan-biet-duoc]] ·
[[feedback-debug-phai-query-data-that]] · [[subscriptions-debug-runbook]] ·
[[migrate-repo-gitlab-on-prem]] · [[digest-joy-subscription-artifacts-2026-08-14]]
