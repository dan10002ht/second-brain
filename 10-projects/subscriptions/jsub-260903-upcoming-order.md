---
type: note
title: JSUB-260903 — contract 18289688830 không có upcoming order
summary: Contract manual ACTIVE nhưng Firestore chưa từng persist upcoming cycle nào ngoài cycle 0 BILLED; cron billing chỉ đọc order doc có sẵn nên không self-heal — 80 contract/30 shop cùng triệu chứng.
tags: [shopify, firebase]
created: 2026-09-03
updated: 2026-09-03
---


Thời điểm chốt số liệu: 2026-09-03 10:12 ICT (03:12 UTC). Chỉ đọc Firestore, Shopify GraphQL, BigQuery và Cloud Logging; không ghi dữ liệu prod, không sửa source repo.

## Kết luận ngắn

**Nguyên nhân trực tiếp đã chứng minh:** contract đang ACTIVE nhưng bản mirror Firestore chưa từng có upcoming-cycle document; chỉ có origin order cycle 0 đã `BILLED`. Cron charge không tự sinh cycle — nó chỉ lấy các order doc đã tới lịch — nên contract này không thể được job billing nhặt lên và ngày 2026-08-28 đã trôi qua mà không có attempt.

**Điểm hỏng sâu hơn, mức kết luận:** đây là contract tạo thủ công (`isManual: true` theo dữ liệu Firestore). Code path create lẽ ra lấy Shopify cycles và ghi chúng ở `subscriptionContractCreateService.js:1258-1315,1395-1400`; kết quả thực tế cho thấy bước đó không tạo doc nào. Không còn log contract-specific tại cửa sổ tạo 2026-07-17 (Cloud Logging trả 0 entry, ngoài retention hiện hữu), nên chưa thể phân biệt chắc chắn giữa: (a) create handler nhận `orders=[]`, (b) nhánh sync bị skip theo status/webhook ở bản deploy lúc đó, hoặc (c) lỗi sync không còn log. Vì vậy **không gán một exception cụ thể khi không có log**.

Có thêm một sai lệch cấu hình rõ ràng: Joy lưu plan **Every 6 weeks** (`frequencyValue=6`) nhưng Shopify live lưu billing policy **mỗi 14 tuần**. Shopify còn tự mâu thuẫn: `nextBillingDate=2026-08-28T10:00:00Z` đã quá hạn, trong khi billing cycle 1 hiện được trả về ở `2026-10-23T10:00:00Z`; cycle 1-5 đều không skipped và không có billing attempt. Sai lệch này cần được xử lý trong task fix/resync riêng, nhưng bằng chứng hiện tại không cho phép nói chính nó đã làm Firestore mất toàn bộ upcoming doc.

## Trả lời 4 câu bắt buộc

### 1. Firestore có cycle/upcoming order không?

- Collection `orders` có đúng **1 doc** cho contract: `RdmH1eEy6eker1RZlXFy`, `cycleIndex=0`, `status=BILLED`, `orderId=6828276285694`, expected/created `2026-07-17T10:40:45/52Z`.
- Không có cycle 1+, không có `UNBILLED`, `SKIPPED`, `CANCELLED` hay error doc; tức không phải cycle sinh rồi fail/skip/cancel mà là **chưa hề được persist**.
- Contract mirror ACTIVE, `currentBillingCycle=1`, `isManual=true`, `originStartDate=2026-08-28T10:40:45Z`, maximum order disabled. Do đó lẽ ra phải có upcoming doc cycle 1 và các cycle kế tiếp.
- Trong chính shop: 506 ACTIVE contract; 505 có ít nhất một future order, chỉ **1/506** không có — chính contract `18289688830`.

### 2. Shopify nói gì và lệch Firestore ở đâu?

- Shopify contract: `ACTIVE`, `nextBillingDate=2026-08-28T10:00:00Z` (quá hạn 5 ngày lúc điều tra), created `2026-07-17T10:40:47Z`, updated `10:40:51Z`.
- Billing policy Shopify: `WEEK × 14`, `minCycles=2`, `maxCycles=null` (không giới hạn số cycle còn lại).
- Cycles 1..5 Shopify: 2026-10-23, 2027-01-29, 2027-05-07, 2027-08-13, 2027-11-19; tất cả `skipped=false`, `edited=false`, attempts `[]`.
- Lệch cụ thể:
  1. Shopify có cycle tương lai, Firestore không có cycle 1+ nào.
  2. Shopify `nextBillingDate` vẫn là 2026-08-28 nhưng cycle 1 API là 2026-10-23.
  3. Firestore/Joy plan là 6 tuần, Shopify billing policy là 14 tuần.
- OAuth scope inventory storefront `unauthenticated_read_product_inventory` thiếu, nhưng loại trừ đây là nguyên nhân: cùng token vẫn đọc được subscription contract và billing cycles thành công; scope này không phải scope billing contract.

### 3. Code path/job chịu trách nhiệm, lần chạy gần nhất, log lỗi

- Tạo manual contract đi vào `handleManualContractCreate`: `packages/functions/src/services/webhook/subscriptionContractCreateService.js:152-173`.
- Handler lấy upcoming cycles ở `:1258-1279`, chuẩn hoá cycle 1 theo `nextBillingDate` ở `:1291-1315`, và phải persist qua `syncSubscriptionContractOrders` ở `:1395-1400`.
- Upsert Firestore thực tế ở `packages/functions/src/repositories/orderRepository.js:111-166`.
- Update webhook của contract ACTIVE phải gọi `syncManualUpcomingOrders`: `packages/functions/src/services/webhook/subscriptionContractUpdateService.js:172-190`; hàm dựng 10 cycle và persist tại `packages/functions/src/services/subscription/subscriptionService.js:1653-1661,1707-1730,1756-1805,1843-1854`.
- Cron billing chạy mỗi phút tại `packages/functions/src/index.js:229-232`, nhưng chỉ đọc scheduled/retry order docs rồi xử lý (`automaticBillingAttemptService.js:25-34`); nó không tạo missing upcoming doc, nên không có khả năng self-heal case này.
- Background path sau một billing attempt là `SYNC_UPCOMING_ORDERS_AFTER_ATTEMPT` (`backgroundHandler.js:163,412-435`). Lần gần nhất path này chạy cho shop là **2026-09-03T01:53:26.957472Z**; execution `9tshlof15k0w` kết thúc `ok` lúc 01:53:27.920706Z, không có error. Log đó không ghi contractId nên không được coi là đã chạy cho contract 18289688830; contract này không có attempt để enqueue path ấy.
- Query log đúng cửa sổ create 2026-07-17 10:35–10:50 UTC trả **0**, và query contract-specific trong retention 2026-08-04–09-03 cũng trả **0**. Vì vậy không có log lỗi còn giữ lại để kết luận exception cụ thể.

### 4. Riêng case hay diện rộng?

- **Trong shop kc-watson:** riêng contract này — 1/506 ACTIVE contract không có future order.
- **Toàn hệ thống theo BigQuery latest, phép đếm thô:** 80 ACTIVE contract tại 30 shop không có bất kỳ future order; target contract được đếm đúng 1 lần, target shop có đúng 1.
- **Phép đếm status-aware:** loại `SKIPPED`/`CANCELLED` khỏi vế “có future order” vẫn cho **80 contract / 30 shop**. Phân bố status tại thời điểm query chỉ có 270,968 future `UNBILLED` và 8 future `BILLED`, không có future `SKIPPED`/`CANCELLED`, nên caveat undercount do hai status này không làm thay đổi con số trong snapshot này. Raw query/output: `21-bq-status-aware-count-and-latency.txt`.
- **Độ trễ `firestore_sync.*_latest`:** với chính target doc lịch sử, timestamp export sau `updated_at/created_at` lần lượt 0 giây (contract) và 9 giây (order). Ở phép đo hiện tại 03:29:01Z, newest event trong contracts view cũ hơn 230 giây và orders view cũ hơn 399 giây; đây là chỉ báo freshness, không chứng minh mọi doc đều lag đúng mức đó. Nếu một future order mới chưa vào view thì 80 sẽ **bị đếm cao**; nếu một ACTIVE contract mới chưa vào view thì 80 sẽ **bị đếm thấp**. Target đã tồn tại từ tháng 7 và Firestore direct cũng xác nhận nó, nên độ trễ phút hiện tại không đổi kết luận riêng target/shop.
- Đây là một symptom class có tồn tại diện rộng nhưng không phải outage hàng loạt ở kc-watson; chưa chứng minh cả 80 contract cùng root cause manual-create.

## Câu trả CS + workaround ngay

“Subscription này đang ACTIVE nhưng dữ liệu lịch giao kế tiếp chưa được đồng bộ sang Joy, nên đơn ngày 28/08 đã không được tạo; để khách có hàng ngay, vui lòng cho khách đặt sản phẩm bằng đơn mua một lần/checkout thường (hoặc shop tạo manual order trong Shopify) và giữ nguyên subscription, team kỹ thuật sẽ resync lịch subscription riêng sau để tránh huỷ nhầm hợp đồng.”

## Query prod đã chạy — nguyên văn

Raw output tương ứng nằm cùng thư mục, file `01` đến `20`.

1. `SA_ENV=prod node packages/functions/src/commands/misc/inspectContractPricing.js kc-watson.myshopify.com 18289688830`
   - Firestore: `shops.where('shopifyDomain','==','kc-watson.myshopify.com').limit(1).get()`; `subscriptionContracts.where('shopId','==',shopId).where('subscriptionContractId','==',18289688830).limit(3).get()`.
2. `SA_ENV=prod node packages/functions/src/commands/misc/inspectContractOrders.js 9jtujpdIpXKCAqW6TWOY 18289688830 50`
   - `orders.where('shopId','==','9jtujpdIpXKCAqW6TWOY').where('subscriptionContractId','==',18289688830).limit(50).get()`.
3. `SA_ENV=prod node packages/functions/src/commands/misc/inspectContractActivities.js 9jtujpdIpXKCAqW6TWOY 18289688830 100`
   - `activities.where('shopId','==','9jtujpdIpXKCAqW6TWOY').where('subscriptionContractId','==',18289688830).limit(100).get()`.
4. `queryBillingCycles.js` đọc `shops.doc('9jtujpdIpXKCAqW6TWOY').get()` và gửi nguyên GraphQL trong `04-shopify-billing-cycles.txt`; fixed range `2026-04-01..2026-08-31` bị Shopify từ chối `Billing cycle start date out of range`.
5. Shopify GraphQL custom read-only, nguyên văn trong `05` và `06`; lần đầu selector `{startIndex:0,endIndex:20}` bị từ chối, lần thành công:

```graphql
query ContractAndCycles($contractId: ID!) {
  subscriptionContract(id: $contractId) {
    id status nextBillingDate createdAt updatedAt
    billingPolicy { interval intervalCount minCycles maxCycles }
  }
  subscriptionBillingCycles(
    contractId: $contractId
    first: 20
    billingCyclesIndexRangeSelector: {startIndex: 1, endIndex: 5}
  ) {
    edges { node { cycleIndex skipped billingAttemptExpectedDate edited billingAttempts(first: 10) { nodes { id idempotencyKey ready errorCode errorMessage createdAt completedAt order { id name } } } } }
  }
}
```

Variables: `{"contractId":"gid://shopify/SubscriptionContract/18289688830"}`. Script cũng đọc `shops.doc('9jtujpdIpXKCAqW6TWOY').get()` để giải mã token.

6. Firestore detail/count (`09-firestore-detail-and-shop-count.txt`):
   - `db.collection("shops").doc("9jtujpdIpXKCAqW6TWOY").get()`
   - `db.collection("subscriptionContracts").where("shopId", "==", "9jtujpdIpXKCAqW6TWOY").where("subscriptionContractId", "==", 18289688830).get()`
   - `db.collection("subscriptionContracts").where("shopId", "==", "9jtujpdIpXKCAqW6TWOY").where("status", "==", "ACTIVE").select("subscriptionContractId").get()`
   - `db.collection("orders").where("shopId", "==", "9jtujpdIpXKCAqW6TWOY").where("billingAttemptExpectedDate", ">", new Date("2026-09-03T03:12:51.897Z")).select("subscriptionContractId").get()`
   - Một lần thử trước đó đã chạy `subscriptionContracts.where('shopId','==',shopId).get()` và `orders.where('shopId','==',shopId).get()` nhưng process không hoàn tất phần tổng hợp; không dùng làm bằng chứng định lượng.
7. Scope check: `shops.doc('9jtujpdIpXKCAqW6TWOY').get()` và GraphQL `currentAppInstallation { accessScopes { handle } app { handle title } }` (nguyên văn `checkShopScopes.js`).
8. Background activity: `db.collection("backgroundActivities").where("shopId", "==", "9jtujpdIpXKCAqW6TWOY").where("contractId", "==", 18289688830).get()` → 0.
9. BigQuery schema/count — nguyên văn đầy đủ trong `12-bq-schema.txt`, `13-bq-system-count.txt`. Query kết luận:

```sql
SELECT
  COUNT(*) AS active_without_future_order_count,
  COUNTIF(c.shop_id = '9jtujpdIpXKCAqW6TWOY') AS target_shop_count,
  COUNTIF(c.subscription_contract_id = '18289688830') AS target_contract_count,
  COUNT(DISTINCT c.shop_id) AS affected_shop_count
FROM `avada-subscription-app.firestore_sync.subscriptionContracts_latest` c
WHERE UPPER(c.status) = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1
    FROM `avada-subscription-app.firestore_sync.orders_latest` o
    WHERE o.shop_id = c.shop_id
      AND o.subscription_contract_id = c.subscription_contract_id
      AND o.billing_attempt_expected_date > CURRENT_TIMESTAMP()
  )
```

Đã chạy thêm query group theo `shop_id ORDER BY affected_contract_count DESC LIMIT 20`, nguyên văn trong file `13`.

9b. BigQuery status-aware và latency/freshness — nguyên văn đầy đủ trong `21-bq-status-aware-count-and-latency.txt` và `22-bq-pipeline-freshness.txt`. Phép đếm thứ hai thêm chính xác điều kiện sau vào subquery `NOT EXISTS`:

```sql
AND UPPER(COALESCE(o.status, '')) NOT IN ('SKIPPED', 'CANCELLED')
```

File `21` còn chứa query group/count future order theo `status` và query so timestamp target giữa latest view với field nguồn; file `22` chứa `MAX(timestamp)`, `CURRENT_TIMESTAMP()` và `TIMESTAMP_DIFF` cho cả hai latest view.

10. Cloud Logging `POST https://logging.googleapis.com/v2/entries:list`, body/filter nguyên văn trong `14`–`19`:
    - create window: `timestamp >= "2026-07-17T10:35:00Z" AND timestamp <= "2026-07-17T10:50:00Z" AND (SEARCH("18289688830") OR SEARCH("9jtujpdIpXKCAqW6TWOY"))`
    - retention contract: `timestamp >= "2026-08-04T00:00:00Z" AND timestamp <= "2026-09-03T23:59:59Z" AND SEARCH("18289688830")`
    - latest shop sync: cùng range, `SEARCH("9jtujpdIpXKCAqW6TWOY") AND SEARCH("sync-upcoming")`, order desc
    - execution detail: `timestamp >= "2026-09-03T01:53:20Z" AND timestamp <= "2026-09-03T01:54:00Z" AND SEARCH("9tshlof15k0w")`.

## Artifact

- Báo cáo này: `/tmp/lt-orca/kc-watson/report.md`
- Raw evidence: `/tmp/lt-orca/kc-watson/*.txt`
- Read-only helper scripts: `/tmp/lt-orca/kc-watson/*-readonly.js`
