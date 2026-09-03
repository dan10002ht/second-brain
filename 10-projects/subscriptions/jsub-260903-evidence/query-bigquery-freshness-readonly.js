/* READ-ONLY BigQuery freshness query. */
const {BigQuery} = require('/Users/dantt1002/projects/subscriptions/node_modules/@google-cloud/bigquery');
const client = new BigQuery({projectId:'avada-subscription-app',keyFilename:'/Users/dantt1002/projects/subscriptions/packages/functions/serviceAccount.prod.json'});
const query = `SELECT 'contracts' AS source, MAX(timestamp) AS latest_export_event, CURRENT_TIMESTAMP() AS measured_at,
  TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), MAX(timestamp), SECOND) AS seconds_behind_latest_event
FROM \`avada-subscription-app.firestore_sync.subscriptionContracts_latest\`
UNION ALL
SELECT 'orders' AS source, MAX(timestamp) AS latest_export_event, CURRENT_TIMESTAMP() AS measured_at,
  TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), MAX(timestamp), SECOND) AS seconds_behind_latest_event
FROM \`avada-subscription-app.firestore_sync.orders_latest\``;
(async()=>{console.log('QUERY (verbatim):\n'+query);const [rows]=await client.query({query,location:'US'});console.log(JSON.stringify(rows,null,2));})().catch(e=>{console.error(e);process.exitCode=1});
