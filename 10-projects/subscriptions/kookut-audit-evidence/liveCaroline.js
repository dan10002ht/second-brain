/* eslint-disable no-console */
// READ-ONLY
const admin = require('firebase-admin');
const serviceAccount = require('/Users/dantt1002/projects/subscriptions/packages/functions/serviceAccount.prod.json');
const {prepareShopData} = require('@avada/core');
const API_VERSION = '2025-10';
const KEY = process.env.SHOPIFY_ACCESS_TOKEN_KEY || '';
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const fs = admin.firestore();

async function gql(shop, query, variables) {
  const res = await fetch(`https://${shop.shopifyDomain}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {'X-Shopify-Access-Token': shop.accessToken, 'Content-Type': 'application/json'},
    body: JSON.stringify({query, variables})
  });
  const json = await res.json();
  if (json.errors) console.error('GQL ERRORS', JSON.stringify(json.errors));
  return json.data;
}

const INSTR = `
  instrument {
    __typename
    ... on CustomerCreditCard { brand expiryMonth expiryYear lastDigits maskedNumber name }
    ... on CustomerPaypalBillingAgreement { paypalAccountEmail }
    ... on CustomerShopPayAgreement { expiryMonth expiryYear lastDigits maskedNumber name }
  }`;

(async () => {
  const q = await fs.collection('shops').where('shopifyDomain','==','kookut.myshopify.com').limit(1).get();
  const shop = prepareShopData(q.docs[0].id, q.docs[0].data(), KEY);
  console.log('shopId', shop.id, shop.shopifyDomain, 'API', API_VERSION);

  const gid = 'gid://shopify/SubscriptionContract/121065865597';
  const d1 = await gql(shop, `query($id: ID!){ subscriptionContract(id:$id){ id status
      customerPaymentMethod(showRevoked:true){ id revokedReason ${INSTR} }
      customer { id displayName email
        paymentMethods(first:10, showRevoked:true){ nodes { id revokedReason ${INSTR} } } }
    } }`, {id: gid});
  console.log('\n=== LIVE CONTRACT PM ===');
  console.log(JSON.stringify(d1, null, 2));

  const d2 = await gql(shop, `query($id: ID!){
    subscriptionBillingCycles(contractId:$id, first: 15, billingCyclesIndexRangeSelector:{startIndex:1, endIndex:12}){
      nodes { cycleIndex billingAttemptExpectedDate status edited
        sourceContract { id customerPaymentMethod(showRevoked:true){ id revokedReason ${INSTR} } }
        billingAttempts(first:10){ nodes { id ready errorMessage createdAt order { id name } } }
      } } }`, {id: gid});
  console.log('\n=== LIVE BILLING CYCLES ===');
  (d2?.subscriptionBillingCycles?.nodes||[]).forEach(n => {
    const i = n.sourceContract?.customerPaymentMethod?.instrument || {};
    console.log(`cycle ${n.cycleIndex} ${n.status} edited=${n.edited} pmId=${(n.sourceContract?.customerPaymentMethod?.id||'').slice(-12)} last=${i.lastDigits} masked=${i.maskedNumber} exp=${i.expiryMonth}/${i.expiryYear} type=${i.__typename}`);
    (n.billingAttempts?.nodes||[]).forEach(b => console.log(`    attempt ${b.createdAt} ready=${b.ready} order=${b.order?.name} err=${b.errorMessage}`));
  });
  process.exit(0);
})().catch(e => {console.error(e); process.exit(1);});
