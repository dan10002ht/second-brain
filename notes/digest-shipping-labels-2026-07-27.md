---
type: note
title: Digest Shipping Labels — vá 2 lỗ bảo mật auth (2026-07-27)
summary: Session token không verify chữ ký + webhook thiếu HMAC ở Shipping Labels; fix fail-closed nên phải bơm SHOPIFY_API_KEY/SECRET qua PROD_ENV_FILE của GitLab CI, và bỏ dòng echo secret trong pipeline.
tags: [shopify, avada, auth, debug]
created: 2026-07-27
source: project "shipping-labels" — session history
---

> Digest đầu tiên cho [[shipping-labels]]. Đề xuất từ inbox, chưa mature.

## Feedback (cách làm việc)

- **Research trước khi sửa**: user yêu cầu "research và check để fix" — đọc code thật + skill security của project trước, không vá theo mô tả của scanner.
- **Chứng minh test thật sự bắt lỗi**: sau khi viết test, tạm khôi phục code cũ và chạy lại để xác nhận test đỏ. Cùng kỷ luật đã ghi ở [[digest-pdf-2026-07-21]].
- **Tự soát lại thay vì đoán** khi được hỏi "có issue gì không" — và kết quả là tìm ra rủi ro triển khai (thiếu env prod) chứ không phải lỗi logic.
- Nhánh riêng + MR, không push thẳng master.

## Decisions

- **Fix theo hướng fail-closed**: thiếu `SHOPIFY_API_KEY`/`SHOPIFY_SECRET` thì middleware từ chối request thay vì cho qua. Tradeoff: nếu prod thiếu env thì app chết ngay → bù lại bằng **guard trong CI** kiểm tra env có mặt sau bước ghi `.env` (fail sớm ở pipeline thay vì fail ở runtime).

## Bugs (root cause)

- 🔴 **`verifyExtensionToken` không verify chữ ký session token.** Extension gọi `api.auth.idToken()` (`extensions/order-print-action/...`), server chỉ đọc payload mà không kiểm HMAC bằng app secret → token giả cũng lọt.
- 🔴 **Webhook middleware thiếu verify HMAC** của Shopify.
- Cả hai lỗ nằm **hoàn toàn trong code middleware**, không phụ thuộc cấu hình Shopify hay dữ liệu → deploy là đóng, miễn env đủ.

## Techniques / gotchas

- **Kênh Slack `#security-scan` (`C0BJ48BVAAY`)**: Solar Bot bắn digest scan bảo mật hằng đêm (gitleaks + deep-review SAST) cho 23 app BU Solar. Digest có thể đã cũ → **luôn đối chiếu với working tree thật** trước khi kết luận "đã fix"/"chưa fix".
- **GitLab CI của app ghi env bằng một dòng duy nhất**: `- echo "$PROD_ENV_FILE" >> packages/functions/.env`. Mọi secret mới chỉ cần thêm vào biến CI `PROD_ENV_FILE`, không phải sửa yaml.
- **Bỏ `echo $FIREBASE_DEPLOY_KEY`** trong `.gitlab-ci.yml` — dòng này in secret thẳng ra log pipeline.
- `packages/functions/.env` đã nằm trong `.gitignore` (an toàn để điền local).

## Liên quan

[[shipping-labels]] · [[shopify-app-dev]] · [[avada-core]] · [[digest-pdf-2026-07-21]]
