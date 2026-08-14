---
type: decision
title: staging 4 thành môi trường riêng của nhánh sidekick, master lùi về staging 3
summary: PDF Invoice gỡ master khỏi `deploy_staging_4` để nhánh `feature/sidekick-agent-extensions` sở hữu trọn slot đó; master chỉ còn `deploy_staging_3` — đổi lại mất một môi trường có sẵn của master và nhánh sidekick vừa mất slot staging 2 trong một merge.
tags: [pdf, avada, shopify, extensions, tooling]
created: 2026-08-14
updated: 2026-08-14
status: active
review: 2026-11-14
source: repo "pdf" — git log 2026-08-13, hash `a0f6d79a8` · `e333c63b7` · `67742edbe`
---

# staging 4 thành môi trường riêng của nhánh sidekick (2026-08-13)

Trạng thái cuối ngày: **master → `deploy_staging_3`**, **`feature/sidekick-agent-extensions`
→ `deploy_staging_4`**. Nhánh sidekick không còn deploy lên staging 2.

Đường đi (đúng thứ tự trong log):

1. `a0f6d79a8` — merge master vào nhánh sidekick, conflict `.gitlab-ci.yml` **lấy phía
   master** ⇒ nhánh **rơi khỏi** `deploy_staging_2` (job vẫn còn, chỉ mất `only:` target).
2. `e333c63b7` — bù lại bằng cách trỏ nhánh sang `deploy_staging_4`. Commit body lúc này
   còn ghi *"master keeps deploying to staging 4 as before"* — tức chấp nhận **dùng chung**.
3. `67742edbe` — cùng ngày, **xoá master khỏi `only:` của `deploy_staging_4`**. Dùng chung
   bị bác bỏ sau vài giờ.

## Why

Slot staging là tài nguyên **ghi đè lẫn nhau**, không phải tài nguyên chia sẻ được: một
push lên master sẽ deploy đè lên đúng thứ nhánh sidekick vừa đẩy lên staging 4. Với một
nhánh extension sống dài và cần môi trường ổn định để QA (Sidekick SB-14254 đã chạy nhiều
tuần — [[shipped-pdf-2026-08-13]], [[shipped-pdf-2026-08-07]]), "môi trường có thể bị xoá
bất cứ lúc nào ai đó merge vào master" tương đương không có môi trường. Bước 2 → 3 chính là
nhận ra điều đó: `e333c63b7` để hai bên dùng chung, `67742edbe` thừa nhận dùng chung là
không dùng được.

Slot 3 và 4 vừa được mở hôm trước (MR !507, `880fb1b0f` — [[shipped-pdf-2026-08-13]]), nên
cấp hẳn một slot cho nhánh rẻ hơn nhiều so với việc chờ provision thêm project Firebase
(chuỗi service agent Gen2 / UBLA / bật Firebase Authentication thủ công ở
[[digest-pdf-2026-08-12]]).

## Tradeoff

**Được:** nhánh sidekick có môi trường không bị ai đá; QA test được extension mà không hẹn
giờ với người merge master.

**Mất:**
- **Master còn đúng một slot staging (`staging_3`).** Trước đó master có 3 và 4; muốn test
  song song hai thứ trên master thì hết chỗ.
- **Slot bị neo bằng tên nhánh nằm trong file CI**, không phải bằng biến hay cấu hình môi
  trường. Đổi tên nhánh, hoặc mở nhánh mới mà quên sửa dòng `only:`, thì pipeline **im lặng
  không chạy** — đúng cơ chế đã ghi cho subscriptions ở [[digest-subscriptions-2026-08-12]]
  và cho chính repo này ở [[shipped-pdf-2026-08-13]]. Không có cảnh báo, chỉ là "sao chưa
  thấy lên staging".
- **Cấu hình này sống trong `.gitlab-ci.yml` monolith**, trong khi nhánh
  `feature/SB-14329-customer-card-actions` (`764e7f4ac`) đang xẻ file đó thành
  `.gitlab/ci/*.yml`. Nhánh nào merge sau sẽ conflict hoặc nuốt mất thay đổi của bên kia —
  đúng kiểu hỏng đã xảy ra ở bước 1. Xem mục "Cần xác nhận" của
  [[shipped-pdf-2026-08-14]].
- Việc "nhánh sở hữu slot" không được ghi ở đâu ngoài chính file CI: người mở nhánh feature
  tiếp theo không có cách nào biết staging 4 đã có chủ.

## Liên quan

[[shipped-pdf-2026-08-14]] · [[shipped-pdf-2026-08-13]] · [[digest-pdf-2026-08-12]] ·
[[digest-subscriptions-2026-08-12]] · [[shipped-pdf-2026-08-07]] · [[pdf]] ·
[[migrate-repo-gitlab-on-prem]]
