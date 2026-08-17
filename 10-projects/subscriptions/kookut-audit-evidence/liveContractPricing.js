/* eslint-disable */
// READ-ONLY. Read live Shopify pricingPolicy of subscription contract lines.
// Usage: SA_ENV=prod ... node liveContractPricing.js <domain> <contractId> [contractId...]
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
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

const Q = `query($id: ID!) {
  subscriptionContract(id: $id) {
    id
    status
    currencyCode
    lines(first: 50) {
      edges { node {
        id
        title
        variantTitle
        quantity
        currentPrice { amount currencyCode }
        lineDiscountedPrice { amount currencyCode }
        sellingPlanId
        sellingPlanName
        pricingPolicy { basePrice { amount currencyCode } cycleDiscounts { adjustmentType adjustmentValue { __typename ... on SellingPlanPricingPolicyPercentageValue { percentage } ... on MoneyV2 { amount } } afterCycle computedPrice { amount } } }
        discountAllocations { amount { amount } }
      } }
    }
  }
}`;

async function run() {
  const [domain, ...ids] = process.argv.slice(2);
  const snap = await db
    .collection('shops')
    .where('shopifyDomain', '==', domain)
    .limit(1)
    .get();
  const shop = prepareShopData(snap.docs[0].id, snap.docs[0].data(), process.env.SHOPIFY_ACCESS_TOKEN_KEY);
  for (const id of ids) {
    const d = await gql(shop, Q, {id: `gid://shopify/SubscriptionContract/${id}`});
    const c = d.subscriptionContract;
    if (!c) {
      console.log(`\n### ${id}: NOT FOUND`);
      continue;
    }
    console.log(`\n### contract ${id} status=${c.status} currency=${c.currencyCode}`);
    c.lines.edges.forEach(({node: l}) => {
      const bp = Number(l.pricingPolicy?.basePrice?.amount);
      const cp = Number(l.currentPrice?.amount);
      const ratio = bp > 0 ? (cp / bp).toFixed(4) : 'NA';
      console.log(
        `  ${l.title} / ${l.variantTitle} qty=${l.quantity} base=${bp} current=${cp} ratio=${ratio} plan=${l.sellingPlanName} spid=${l.sellingPlanId} discAlloc=${JSON.stringify(l.discountAllocations)} cycleDiscounts=${JSON.stringify(l.pricingPolicy?.cycleDiscounts)}`
      );
    });
  }
  process.exit(0);
}
run().catch(e => {
  console.error(e);
  process.exit(1);
});
