/* READ-ONLY BigQuery queries only. */
const {BigQuery} = require('/Users/dantt1002/projects/subscriptions/node_modules/@google-cloud/bigquery');
const keyFilename = '/Users/dantt1002/projects/subscriptions/packages/functions/serviceAccount.prod.json';
const client = new BigQuery({projectId: 'avada-subscription-app', keyFilename});
const queries = [
  `SELECT table_name FROM \`avada-subscription-app.firestore_sync.INFORMATION_SCHEMA.TABLES\` WHERE table_name IN ('orders_latest', 'subscriptionContracts_latest') ORDER BY table_name`,
  `SELECT table_name, column_name, data_type FROM \`avada-subscription-app.firestore_sync.INFORMATION_SCHEMA.COLUMNS\` WHERE table_name IN ('orders_latest', 'subscriptionContracts_latest') ORDER BY table_name, ordinal_position`,
  `SELECT
  COUNT(*) AS active_without_future_order_count,
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
  )`,
  `SELECT c.shop_id, COUNT(*) AS affected_contract_count
FROM \`avada-subscription-app.firestore_sync.subscriptionContracts_latest\` c
WHERE UPPER(c.status) = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1
    FROM \`avada-subscription-app.firestore_sync.orders_latest\` o
    WHERE o.shop_id = c.shop_id
      AND o.subscription_contract_id = c.subscription_contract_id
      AND o.billing_attempt_expected_date > CURRENT_TIMESTAMP()
  )
GROUP BY c.shop_id
ORDER BY affected_contract_count DESC
LIMIT 20`
];
(async () => {
  for (const query of queries) {
    console.log('QUERY (verbatim):\n' + query);
    const [rows] = await client.query({query, location: 'US'});
    console.log(JSON.stringify(rows, null, 2));
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
