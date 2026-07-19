---
type: note
title: Digest Joy Subscription 2026-07-18 — 3DS/SCA billing recovery + BigQuery "via import" attribution
summary: Chỉ phần MỚI — app handle 3DS chỉ "một nửa", khi attempt kẹt SCA phải tự gửi verify3dsSecure email qua Pub/Sub (Shopify KHÔNG tự gửi link); và dấu hiệu chẩn đoán order "from App (via import)" ≠ Online Store checkout.
tags: [subscription, shopify, billing, avada, debug]
created: 2026-07-18
source: subscriptions (session history)
---

# Digest Joy Subscription — 2026-07-18

> CHỈ phần MỚI so với các digest trước. Loạt việc installment/one-time/defer-last/widget/liquid/
> auto-swap race/BigQuery-multi-project-inflation đã nằm ở [[subscription-digest-2026-07-16]],
> [[digest-subscriptions-2026-07-17]], [[subscription-installment-horizon-digest]] — KHÔNG lặp.

## Bugs / facts (root cause)

- **App handle 3DS/SCA chỉ "một nửa".** `billingCycleService.js:323-333` có xử lý 3DS, nhưng case attempt bị **kẹt phía Shopify chờ khách xác thực SCA** rơi vào nửa thiếu: order treo ở `Queued`/processing, nút "Process Payment" báo "order already processed" nhưng thực tế chưa charge. **Shopify KHÔNG tự gửi link xác thực** cho khách trong case này → app phải tự gửi. (chưa xác minh: điều kiện chính xác Shopify gửi/không gửi)
- **Một cycle bị charge nhiều lần là BÌNH THƯỜNG** theo logic app (guard chống double-charge chỉ block retry khi attempt còn `processing`). Khi debug đừng coi charge-nhiều-lần là bug — check field trạng thái attempt (`ready`, còn ở `processing` không) mới là điểm quyết định.

## Techniques (runbook)

- **Recover 3DS stuck: gửi verify-3ds-secure email qua Pub/Sub**, không gửi link cho merchant (kì). Publish topic `background`, project `avada-subscription-app`, message:
  `{"action":"send-verify-3ds-secure-email","shopId":...,"subscriptionContractId":...,"idempotencyKey":...,"nextActionUrl":...}`.
  Email dùng template branded `verify3dsSecureEmail`, đi **thẳng đến end-customer** (email lấy từ contract), `nextActionUrl` = link `/subscriptions/billing/.../auth` của Shopify. Idempotent qua `idempotencyKey`.
- **Auto-mode classifier chặn publish thẳng prod Pub/Sub** → user tự chạy lệnh `gcloud pubsub topics publish` ở terminal (hoặc prefix `! `). (bổ sung [[subscriptions-debug-runbook]])
- **Chẩn đoán "from Joy Subscription App (via import)" trên order events**: Sales-channel attribution kiểu này = order KHÔNG tạo qua Online Store checkout thường mà qua luồng import/Admin của app. Khi thấy → check store có **SDK/headless** không (grep marker `AVADA_SUBSCRIPTION_HEADLESS` trong HTML page thật) hoặc custom script của store; đừng mặc định "mua thì phải from Online Store". (bổ sung góc attribution ở [[subscription-digest-2026-07-10]])
- **Query prod số tiền/MRR phải dùng `serviceAccount.prod.json`** và **loại store dev** ra khỏi tổng (report v3 legacy: MRR + transaction fee MTD dễ sai nếu gộp dev store). (tái xác nhận [[subscriptions-debug-runbook]])

## Liên quan
- [[subscriptions]] · [[subscriptions-debug-runbook]] · [[digest-subscriptions-2026-07-17]] · [[subscription-digest-2026-07-16]] · [[shipped-subscriptions-2026-07-18]] · [[billing]]
