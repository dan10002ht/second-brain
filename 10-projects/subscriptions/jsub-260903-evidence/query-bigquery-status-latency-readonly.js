/* READ-ONLY BigQuery queries only. */
const {BigQuery} = require('/Users/dantt1002/projects/subscriptions/node_modules/@google-cloud/bigquery');
const client = new BigQuery({
  projectId: 'avada-subscription-app',
  keyFilename: '/Users/dantt1002/projects/subscriptions/packages/functions/serviceAccount.prod.json'
});
const queries = [
  `SELECT status, COUNT(*) AS future_order_count
FROM \`avada-subscription-app.firestore_sync.orders_latest\`
WHERE billing_attempt_expected_date > CURRENT_TIMESTAMP()
GROUP BY status
ORDER BY future_order_count DESC`,
  `SELECT
  COUNT(*) AS active_without_actionable_future_order_count,
  COUNTIF(c.shop_id = '9jtujpdIpXKCAqW6TWOY') AS target_shop_count,
  COUNTIF(c.subscription_contract_id = '18289688830') AS target_contract_count,
  COUNT(DISTINCT c.shop_id) AS affected_shop_count
FROM \`avada-subscription-app.firestore_sync.subscriptionContracts_latest\` c
WHERE UPPER(c.status) = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1
    FROM \`avada-subscription-app.firestore_sync.orders_latest\` o
    WHERE o.shop_id = c.shop_id
      AND o.subscription_contract_id = c.subscription_contract_id
      AND o.billing_attempt_expected_date > CURRENT_TIMESTAMP()
      AND UPPER(COALESCE(o.status, '')) NOT IN ('SKIPPED', 'CANCELLED')
  )`,
  `SELECT 'contract' AS kind, document_id, timestamp, updated_at AS source_updated_at,
       TIMESTAMP_DIFF(timestamp, updated_at, SECOND) AS export_lag_seconds
FROM \`avada-subscription-app.firestore_sync.subscriptionContracts_latest\`
WHERE shop_id = '9jtujpdIpXKCAqW6TWOY' AND subscription_contract_id = '18289688830'
UNION ALL
SELECT 'order' AS kind, document_id, timestamp, created_at AS source_updated_at,
       TIMESTAMP_DIFF(timestamp, created_at, SECOND) AS export_lag_seconds
FROM \`avada-subscription-app.firestore_sync.orders_latest\`
WHERE shop_id = '9jtujpdIpXKCAqW6TWOY' AND subscription_contract_id = '18289688830'`
];
(async () => {
  for (const query of queries) {
    console.log('QUERY (verbatim):\n' + query);
    const [rows] = await client.query({query, location: 'US'});
    console.log(JSON.stringify(rows, null, 2));
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
