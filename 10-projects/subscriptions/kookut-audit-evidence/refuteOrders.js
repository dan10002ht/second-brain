/* eslint-disable */
const FN = '/Users/dantt1002/projects/subscriptions/packages/functions';
const ROOT = '/Users/dantt1002/projects/subscriptions';
const serviceAccount = require(`${FN}/serviceAccount.${process.env.SA_ENV || 'development'}.json`);
const admin = require(`${ROOT}/node_modules/firebase-admin`);
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();
const {prepareShopData} = require(`${ROOT}/node_modules/@avada/core`);
const API_VERSION = '2025-10';
async function gql(shop, query, variables) {
  for (let a = 0; a < 6; a++) {
    const res = await fetch(`https://${shop.shopifyDomain}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': shop.accessToken},
      body: JSON.stringify({query, variables})
    });
    const j = await res.json();
    if (j.errors && JSON.stringify(j.errors).includes('Throttled')) { await new Promise(r=>setTimeout(r,2500*(a+1))); continue; }
    if (j.errors) throw new Error(JSON.stringify(j.errors));
    return j.data;
  }
  throw new Error('throttled');
}
const Q = `query($id: ID!) { subscriptionContract(id: $id) { orders(first: 25) { edges { node {
  name createdAt displayFinancialStatus totalPriceSet { shopMoney { amount currencyCode } }
  lineItems(first: 50) { edges { node { title variantTitle quantity
    originalUnitPriceSet { shopMoney { amount } }
    discountedUnitPriceSet { shopMoney { amount } } } } }
} } } } }`;
async function run() {
  const snap = await db.collection('shops').where('shopifyDomain','==','kookut.myshopify.com').limit(1).get();
  const shop = prepareShopData(snap.docs[0].id, snap.docs[0].data(), process.env.SHOPIFY_ACCESS_TOKEN_KEY);
  for (const id of process.argv.slice(2)) {
    const d = await gql(shop, Q, {id: `gid://shopify/SubscriptionContract/${id}`});
    console.log(`\n########## contract ${id}`);
    for (const oe of d.subscriptionContract.orders.edges) {
      const o = oe.node;
      console.log(`\n  ORDER ${o.name} ${o.createdAt.slice(0,10)} ${o.displayFinancialStatus} total=${o.totalPriceSet.shopMoney.amount} ${o.totalPriceSet.shopMoney.currencyCode}`);
      o.lineItems.edges.forEach(le => {
        const l = le.node;
        console.log(`     ${l.title} / ${l.variantTitle} qty=${l.quantity} orig=${l.originalUnitPriceSet.shopMoney.amount} disc=${l.discountedUnitPriceSet.shopMoney.amount}`);
      });
    }
  }
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});
