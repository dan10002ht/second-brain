/* eslint-disable */
// READ-ONLY: was ••••7216 a REAL card actually charged on Caroline's early orders?
const admin = require('firebase-admin');
const serviceAccount = require('/Users/dantt1002/projects/subscriptions/packages/functions/serviceAccount.prod.json');
const {prepareShopData} = require('@avada/core');
const API_VERSION = '2025-10';
const KEY = process.env.SHOPIFY_ACCESS_TOKEN_KEY || '';
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();
const SHOP = '4VgCcf9Ov5cIBx2tCkcT';

async function gql(shop, query, variables) {
  const res = await fetch(`https://${shop.shopifyDomain}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {'X-Shopify-Access-Token': shop.accessToken, 'Content-Type': 'application/json'},
    body: JSON.stringify({query, variables})
  });
  const j = await res.json();
  if (j.errors) console.error('GQL', JSON.stringify(j.errors).slice(0, 400));
  return j.data;
}

(async () => {
  const q = await db.collection('shops').where('shopifyDomain', '==', 'kookut.myshopify.com').limit(1).get();
  const shop = prepareShopData(q.docs[0].id, q.docs[0].data(), KEY);

  const d = await gql(shop, `query($id:ID!){ subscriptionContract(id:$id){
      orders(first: 25){ nodes { id name createdAt
        paymentGatewayNames
        transactions(first:5){ id kind status paymentDetails { ... on CardPaymentDetails { number bin company expirationMonth expirationYear } } }
      } } } }`, {id: 'gid://shopify/SubscriptionContract/121065865597'});
  const nodes = d?.subscriptionContract?.orders?.nodes || [];
  console.log('=== Caroline shopify orders (oldest first) ===');
  nodes.slice().reverse().forEach(o => {
    const t = (o.transactions || []).map(x => `${x.kind}/${x.status} last4=${x.paymentDetails?.number+"|bin:"+x.paymentDetails?.bin} ${x.paymentDetails?.company} exp=${x.paymentDetails?.expirationMonth}/${x.paymentDetails?.expirationYear}`).join(' | ');
    console.log(`${o.name} ${o.createdAt} gw=${o.paymentGatewayNames} :: ${t}`);
  });

  // second sample contract with long mismatch run: 129462731133 (stored masked 2034 vs last 8906)
  const d2 = await gql(shop, `query($id:ID!){ subscriptionContract(id:$id){
      orders(first: 25){ nodes { id name createdAt
        transactions(first:5){ kind status paymentDetails { ... on CardPaymentDetails { number bin company } } }
      } } } }`, {id: 'gid://shopify/SubscriptionContract/129462731133'});
  console.log('\n=== 129462731133 shopify orders (stored masked 2034 / last 8906) ===');
  (d2?.subscriptionContract?.orders?.nodes || []).slice().reverse().forEach(o => {
    const t = (o.transactions || []).map(x => `${x.kind}/${x.status} last4=${x.paymentDetails?.number+"|bin:"+x.paymentDetails?.bin} ${x.paymentDetails?.company}`).join(' | ');
    console.log(`${o.name} ${o.createdAt} :: ${t}`);
  });

  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
