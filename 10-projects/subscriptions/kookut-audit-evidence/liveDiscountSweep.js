/* eslint-disable */
// READ-ONLY. For every non-CANCELLED kookut contract, read LIVE Shopify pricingPolicy
// and report per-line discount percentage. Detects lines whose discount is missing.
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
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`https://${shop.shopifyDomain}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': shop.accessToken},
      body: JSON.stringify({query, variables})
    });
    const json = await res.json();
    if (json.errors && JSON.stringify(json.errors).includes('Throttled')) {
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    if (json.errors) throw new Error(JSON.stringify(json.errors));
    return json.data;
  }
  throw new Error('throttled out');
}

const Q = `query($id: ID!) {
  subscriptionContract(id: $id) {
    status currencyCode
    lines(first: 60) { edges { node {
      title variantTitle quantity
      currentPrice { amount }
      sellingPlanName sellingPlanId
      pricingPolicy { basePrice { amount } cycleDiscounts { adjustmentType adjustmentValue { __typename ... on SellingPlanPricingPolicyPercentageValue { percentage } ... on MoneyV2 { amount } } computedPrice { amount } } }
    } } }
  }
}`;

async function run() {
  const domain = process.argv[2] || 'kookut.myshopify.com';
  const snap = await db.collection('shops').where('shopifyDomain', '==', domain).limit(1).get();
  const shopDoc = snap.docs[0];
  const shop = prepareShopData(shopDoc.id, shopDoc.data(), process.env.SHOPIFY_ACCESS_TOKEN_KEY);

  const cSnap = await db
    .collection('subscriptionContracts')
    .where('shopId', '==', shopDoc.id)
    .get();
  const targets = cSnap.docs
    .map(d => ({id: d.data().subscriptionContractId, fsStatus: d.data().status}))
    .filter(c => c.fsStatus !== 'CANCELLED');
  console.log(`targets (non-cancelled per Firestore): ${targets.length}`);

  const zeroRows = [];
  const statusDrift = [];
  let ok = 0;
  let missing = 0;
  for (const t of targets) {
    let d;
    try {
      d = await gql(shop, Q, {id: `gid://shopify/SubscriptionContract/${t.id}`});
    } catch (e) {
      console.log(`  ${t.id} ERROR ${e.message}`);
      continue;
    }
    const c = d.subscriptionContract;
    if (!c) {
      missing++;
      console.log(`  ${t.id} NOT FOUND on Shopify (fs=${t.fsStatus})`);
      continue;
    }
    if (c.status !== t.fsStatus) statusDrift.push(`${t.id} firestore=${t.fsStatus} shopify=${c.status}`);
    const lines = c.lines.edges.map(e => e.node);
    const pcts = lines.map(l => {
      const cd = (l.pricingPolicy?.cycleDiscounts || [])[0];
      const v = cd?.adjustmentValue;
      return v && v.percentage !== undefined ? Number(v.percentage) : cd ? `AMT:${v?.amount}` : 'none';
    });
    const zeros = lines
      .map((l, i) => ({l, i, p: pcts[i]}))
      .filter(x => x.p === 0 || x.p === 'none');
    if (zeros.length) {
      zeroRows.push({id: t.id, status: c.status, cur: c.currencyCode, total: lines.length, pcts, zeros});
    } else ok++;
    if (c.status === 'ACTIVE' || c.status === 'PAUSED') {
      console.log(`  ${t.id} ${c.status} ${c.currencyCode} pcts=[${pcts.join(',')}]`);
    }
  }

  console.log(`\n=== SUMMARY === allDiscounted=${ok} withZeroLine=${zeroRows.length} notFound=${missing}`);
  console.log('\n=== CONTRACTS WITH 0%/MISSING DISCOUNT LINES ===');
  zeroRows.forEach(r => {
    const partial = r.zeros.length < r.total ? ' <-- PARTIAL (some lines discounted, some not)' : ' (whole contract undiscounted)';
    console.log(`\ncontract ${r.id} ${r.status} ${r.cur} lines=${r.total} pcts=[${r.pcts.join(',')}]${partial}`);
    r.zeros.forEach(z => {
      const bp = Number(z.l.pricingPolicy?.basePrice?.amount);
      const cp = Number(z.l.currentPrice?.amount);
      const loss = (bp - Math.round(bp * 0.95 * 100) / 100) * z.l.quantity;
      console.log(
        `   [${z.i}] ${z.l.title} / ${z.l.variantTitle} qty=${z.l.quantity} base=${bp} current=${cp} plan=${z.l.sellingPlanName} spid=${z.l.sellingPlanId} → customer overpays ${loss.toFixed(2)} ${r.cur}/cycle if 5% intended`
      );
    });
  });

  console.log('\n=== STATUS DRIFT firestore vs shopify ===');
  statusDrift.forEach(s => console.log('  ' + s));
  process.exit(0);
}
run().catch(e => {
  console.error(e);
  process.exit(1);
});
