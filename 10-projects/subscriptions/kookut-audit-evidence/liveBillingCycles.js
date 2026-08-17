/* eslint-disable */
// READ-ONLY. List Shopify billing cycles + resulting orders (with line prices) for a contract.
const FN = '/Users/dantt1002/projects/subscriptions/packages/functions';
const ROOT = '/Users/dantt1002/projects/subscriptions';
const envSuffix = process.env.SA_ENV || 'development';
const serviceAccount = require(`${FN}/serviceAccount.${envSuffix}.json`);
const admin = require(`${ROOT}/node_modules/firebase-admin`);
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();
const {prepareShopData} = require(`${ROOT}/node_modules/@avada/core`);
const API_VERSION = '2025-10';

async function gql(shop, query, variables) {
  const res = await fetch(`https://${shop.shopifyDomain}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': shop.accessToken},
    body: JSON.stringify({query, variables})
  });
  const j = await res.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

const Q = `query($id: ID!) {
  subscriptionContract(id: $id) {
    status
    nextBillingDate
    billingPolicy { interval intervalCount }
    orders(first: 20, reverse: true) { edges { node {
      id name createdAt displayFinancialStatus totalPriceSet { shopMoney { amount currencyCode } }
      lineItems(first: 20) { edges { node { title variantTitle quantity originalUnitPriceSet { shopMoney { amount } } discountedUnitPriceSet { shopMoney { amount } } } } }
    } } }
  }
}`;

async function run() {
  const [domain, ...ids] = process.argv.slice(2);
  const snap = await db.collection('shops').where('shopifyDomain', '==', domain).limit(1).get();
  const shop = prepareShopData(snap.docs[0].id, snap.docs[0].data(), process.env.SHOPIFY_ACCESS_TOKEN_KEY);
  for (const id of ids) {
    const d = await gql(shop, Q, {id: `gid://shopify/SubscriptionContract/${id}`});
    const c = d.subscriptionContract;
    console.log(`\n### ${id} status=${c.status} next=${c.nextBillingDate} every ${c.billingPolicy.intervalCount} ${c.billingPolicy.interval}`);
    c.orders.edges.forEach(({node: o}) => {
      console.log(`  ${o.name} ${o.createdAt} ${o.displayFinancialStatus} total=${o.totalPriceSet.shopMoney.amount} ${o.totalPriceSet.shopMoney.currencyCode}`);
      o.lineItems.edges.forEach(({node: li}) =>
        console.log(`      ${li.title} / ${li.variantTitle} x${li.quantity} orig=${li.originalUnitPriceSet.shopMoney.amount} disc=${li.discountedUnitPriceSet.shopMoney.amount}`)
      );
    });
  }
  process.exit(0);
}
run().catch(e => {
  console.error(e);
  process.exit(1);
});
