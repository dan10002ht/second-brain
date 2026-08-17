/* eslint-disable */
// READ-ONLY independent re-verification of chieu "discount".
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
  for (let a = 0; a < 6; a++) {
    const res = await fetch(`https://${shop.shopifyDomain}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': shop.accessToken},
      body: JSON.stringify({query, variables})
    });
    const json = await res.json();
    if (json.errors && JSON.stringify(json.errors).includes('Throttled')) {
      await new Promise(r => setTimeout(r, 2500 * (a + 1)));
      continue;
    }
    if (json.errors) throw new Error(JSON.stringify(json.errors));
    return json.data;
  }
  throw new Error('throttled out');
}

// FULL cycleDiscounts array (not just [0]) + billing cycle count
const Q = `query($id: ID!) {
  subscriptionContract(id: $id) {
    id status currencyCode createdAt
    nextBillingDate
    lines(first: 60) { edges { node {
      id title variantTitle quantity currentPrice { amount }
      sellingPlanId sellingPlanName
      pricingPolicy { basePrice { amount } cycleDiscounts {
        afterCycle computedPrice { amount } adjustmentType
        adjustmentValue { __typename ... on SellingPlanPricingPolicyPercentageValue { percentage } ... on MoneyV2 { amount } }
      } }
    } } }
    orders(first: 25) { edges { node { name createdAt displayFinancialStatus } } }
  }
}`;

async function run() {
  const domain = 'kookut.myshopify.com';
  const ids = process.argv.slice(2);
  const snap = await db.collection('shops').where('shopifyDomain', '==', domain).limit(1).get();
  const shopDoc = snap.docs[0];
  const shop = prepareShopData(shopDoc.id, shopDoc.data(), process.env.SHOPIFY_ACCESS_TOKEN_KEY);
  console.log('shopId=' + shopDoc.id);

  for (const id of ids) {
    const d = await gql(shop, Q, {id: `gid://shopify/SubscriptionContract/${id}`});
    const c = d.subscriptionContract;
    if (!c) { console.log(`\n### ${id} NOT FOUND`); continue; }
    console.log(`\n### ${id} status=${c.status} cur=${c.currencyCode} created=${c.createdAt} nextBilling=${c.nextBillingDate}`);
    c.lines.edges.forEach((e, i) => {
      const l = e.node;
      const cds = (l.pricingPolicy?.cycleDiscounts || []).map(cd => {
        const v = cd.adjustmentValue;
        const val = v?.percentage !== undefined ? v.percentage + '%' : 'AMT ' + v?.amount;
        return `{afterCycle:${cd.afterCycle} ${cd.adjustmentType} ${val} computed:${cd.computedPrice?.amount}}`;
      });
      console.log(`  [${i}] ${l.title} / ${l.variantTitle} qty=${l.quantity} base=${l.pricingPolicy?.basePrice?.amount} current=${l.currentPrice?.amount} spid=${l.sellingPlanId}`);
      console.log(`       cycleDiscounts(n=${cds.length}): ${cds.join(' , ') || 'EMPTY'}`);
    });
    const ords = c.orders.edges.map(e => `${e.node.name}@${e.node.createdAt.slice(0,10)}/${e.node.displayFinancialStatus}`);
    console.log(`  ORDERS(n=${ords.length}): ${ords.join(', ')}`);
  }

  // Firestore plans[] for the same contracts
  for (const id of ids) {
    const s = await db.collection('subscriptionContracts')
      .where('shopId', '==', shopDoc.id)
      .where('subscriptionContractId', '==', parseInt(id)).limit(1).get();
    if (s.empty) { console.log(`\n--- FS ${id}: NOT IN FIRESTORE`); continue; }
    const data = s.docs[0].data();
    console.log(`\n--- FS ${id} status=${data.status} plansN=${(data.plans||[]).length} currentBillingCycle=${data.currentBillingCycle}`);
    (data.plans || []).forEach(p => {
      console.log(`    spid=${p.sellingPlanId} enabledDiscount=${p.enabledDiscount} enabledAmountDiscount=${p.enabledAmountDiscount} enabledChangeDiscount=${p.enabledChangeDiscount} discountValue=${p.discountValue} discountType=${p.discountType} hasDiscountConfig=${!!p.discountConfig}`);
    });
    if (data.plan) {
      const p = data.plan;
      console.log(`    [contract.plan] enabledDiscount=${p.enabledDiscount} enabledAmountDiscount=${p.enabledAmountDiscount} discountValue=${p.discountValue} hasDiscountConfig=${!!p.discountConfig}`);
    }
  }
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
