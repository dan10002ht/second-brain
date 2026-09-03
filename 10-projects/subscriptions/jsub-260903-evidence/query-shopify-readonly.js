/* READ-ONLY: Shopify GraphQL queries only; no mutations. */
const admin = require('/Users/dantt1002/projects/subscriptions/node_modules/firebase-admin');
const fetch = require('/Users/dantt1002/projects/subscriptions/node_modules/node-fetch');
const {AES, enc} = require('/Users/dantt1002/projects/subscriptions/node_modules/crypto-js');
const serviceAccount = require('/Users/dantt1002/projects/subscriptions/packages/functions/serviceAccount.prod.json');

admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();

const query = `
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
    edges {
      node {
        cycleIndex skipped billingAttemptExpectedDate edited
        billingAttempts(first: 10) {
          nodes {
            id idempotencyKey ready errorCode errorMessage createdAt completedAt
            order { id name }
          }
        }
      }
    }
  }
}`;

(async () => {
  const shopDoc = await db.collection('shops').doc('9jtujpdIpXKCAqW6TWOY').get();
  const shop = shopDoc.data();
  const token = AES.decrypt(shop.accessTokenHash, process.env.ACCESS_TOKEN_KEY).toString(enc.Utf8);
  if (!token) throw new Error('Unable to decrypt shop access token');
  const response = await fetch(`https://${shop.shopifyDomain}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': token},
    body: JSON.stringify({query, variables: {contractId: 'gid://shopify/SubscriptionContract/18289688830'}})
  });
  console.log('GRAPHQL QUERY (verbatim):\n' + query);
  console.log('GRAPHQL VARIABLES:\n' + JSON.stringify({contractId: 'gid://shopify/SubscriptionContract/18289688830'}, null, 2));
  console.log('GRAPHQL RESPONSE:\n' + JSON.stringify(await response.json(), null, 2));
  process.exit(0);
})().catch(error => { console.error(error); process.exit(1); });
