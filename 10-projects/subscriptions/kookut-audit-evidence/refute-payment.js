/* eslint-disable */
// READ-ONLY adversarial verification
const admin = require('firebase-admin');
const serviceAccount = require('/Users/dantt1002/projects/subscriptions/packages/functions/serviceAccount.prod.json');
const {prepareShopData} = require('@avada/core');
const API_VERSION = '2025-10';
const KEY = process.env.SHOPIFY_ACCESS_TOKEN_KEY || '';
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();
const FieldPath = admin.firestore.FieldPath;
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
async function pageAll(base, cb) {
  let last = null, n = 0;
  for (;;) {
    let q = base.orderBy(FieldPath.documentId()).limit(2000);
    if (last) q = q.startAfter(last);
    const s = await q.get();
    if (s.empty) break;
    s.docs.forEach(cb);
    n += s.size;
    last = s.docs[s.docs.length - 1].id;
    if (s.size < 2000) break;
  }
  return n;
}

(async () => {
  const q = await db.collection('shops').where('shopifyDomain', '==', 'kookut.myshopify.com').limit(1).get();
  const shop = prepareShopData(q.docs[0].id, q.docs[0].data(), KEY);
  console.log('shop', shop.id, shop.shopifyDomain);

  // ---- 1. re-derive mismatch numbers independently
  const orders = [];
  const total = await pageAll(db.collection('orders').where('shopId', '==', SHOP), d => {
    const o = d.data();
    orders.push({id: d.id, c: o.subscriptionContractId, cy: o.cycleIndex, st: o.status, pm: o.customerPaymentMethod || {}, keys: o.idempotencyKeys, ba: o.billingAttempts || [], upd: o.updatedAt && o.updatedAt.toDate && o.updatedAt.toDate().toISOString()});
  });
  const withMasked = orders.filter(o => o.pm && o.pm.maskedNumber);
  const mm = withMasked.filter(o => {
    const t = String(o.pm.maskedNumber).replace(/[^0-9]/g, '').slice(-4);
    return o.pm.lastDigits && t && t !== String(o.pm.lastDigits);
  });
  console.log(`\n[1] total=${total} withMasked=${withMasked.length} mismatch=${mm.length} contracts=${new Set(mm.map(m=>m.c)).size}`);

  // ---- 2. is the "wrong" masked tail an OLD card of the SAME contract, or someone else's?
  const tailsByContract = {};
  orders.forEach(o => {
    if (!o.pm) return;
    const s = (tailsByContract[o.c] = tailsByContract[o.c] || new Set());
    if (o.pm.lastDigits) s.add(String(o.pm.lastDigits));
  });
  const globalTail = {};
  orders.forEach(o => { if (o.pm && o.pm.lastDigits) (globalTail[String(o.pm.lastDigits)] = globalTail[String(o.pm.lastDigits)] || new Set()).add(o.c); });
  let sameContract = 0, otherContractOnly = 0, nowhere = 0;
  const otherEx = [], nowhereEx = [];
  mm.forEach(m => {
    const t = String(m.pm.maskedNumber).replace(/[^0-9]/g, '').slice(-4);
    if (tailsByContract[m.c] && tailsByContract[m.c].has(t)) sameContract++;
    else if (globalTail[t]) { otherContractOnly++; if (otherEx.length < 8) otherEx.push({doc: m.id, c: m.c, cy: m.cy, last: m.pm.lastDigits, masked: m.pm.maskedNumber, alsoOn: [...globalTail[t]].slice(0, 4)}); }
    else { nowhere++; if (nowhereEx.length < 8) nowhereEx.push({doc: m.id, c: m.c, cy: m.cy, last: m.pm.lastDigits, masked: m.pm.maskedNumber, pmId: (m.pm.id||'').slice(-12)}); }
  });
  console.log(`[2] mismatched masked-tail origin: sameContractOldCard=${sameContract} otherContract=${otherContractOnly} nowhereInShop=${nowhere}`);
  console.log('   other-contract examples:', JSON.stringify(otherEx, null, 1));
  console.log('   nowhere examples:', JSON.stringify(nowhereEx, null, 1));

  // ---- 2b. Caroline specifically: does 7216 exist anywhere as lastDigits in shop?
  console.log('[2b] "7216" as lastDigits anywhere in kookut orders:', globalTail['7216'] ? [...globalTail['7216']] : 'NO');
  const c121 = orders.filter(o => String(o.c) === '121065865597').sort((a,b)=>a.cy-b.cy);
  c121.forEach(o => console.log(`   cy${o.cy} ${o.st} last=${o.pm.lastDigits} masked=${o.pm.maskedNumber} pmId=${(o.pm.id||'').slice(-12)} upd=${o.upd}`));

  // ---- 3. Live Shopify: Caroline payment methods (independent re-run)
  const d1 = await gql(shop, `query($id:ID!){subscriptionContract(id:$id){id status
      customerPaymentMethod(showRevoked:true){id revokedReason instrument{__typename ... on CustomerCreditCard{brand expiryMonth expiryYear lastDigits maskedNumber}}}
      customer{id displayName email paymentMethods(first:20, showRevoked:true){nodes{id revokedReason instrument{__typename ... on CustomerCreditCard{brand expiryMonth expiryYear lastDigits maskedNumber} ... on CustomerPaypalBillingAgreement{paypalAccountEmail}}}}}}}`,
    {id: 'gid://shopify/SubscriptionContract/121065865597'});
  console.log('\n[3] LIVE caroline:', JSON.stringify(d1, null, 1));

  // ---- 4. verify the broken GraphQL actually errors against live Shopify (read-only query)
  const pmId = d1?.subscriptionContract?.customerPaymentMethod?.id;
  const broken = await gql(shop, `query customerPaymentMethodById($id: ID!, showRevoked: Boolean) { customerPaymentMethod(id: $id, showRevoked: showRevoked) { id revokedReason instrument { ... on CustomerCreditCard { lastDigits maskedNumber } } __typename } }`, {id: pmId, showRevoked: true});
  console.log('[4] broken-query data =', JSON.stringify(broken));

  // ---- 5. isCreateAttemptFailed count (independent)
  let icaf = 0, attempts = 0;
  orders.forEach(o => o.ba.forEach(a => { attempts++; if (a.isCreateAttemptFailed) icaf++; }));
  console.log(`\n[5] billingAttempts total=${attempts} isCreateAttemptFailed=${icaf}`);

  // ---- 6. contracts flags + expired cards
  const cs = await db.collection('subscriptionContracts').where('shopId', '==', SHOP).get();
  let pf = 0, mr = 0, rev = 0; const exp = []; const statuses = {};
  const now = new Date();
  cs.docs.forEach(d => {
    const x = d.data();
    statuses[x.status] = (statuses[x.status] || 0) + 1;
    if (x.isPaymentFailed) pf++;
    if (x.isMaximumRetry) mr++;
    const pm = x.customerPaymentMethod || {};
    if (pm.revoked) rev++;
    if (x.status === 'ACTIVE' && pm.expiryYear && pm.expiryMonth) {
      const e = new Date(pm.expiryYear, pm.expiryMonth, 1);
      if (e <= now) exp.push({c: x.subscriptionContractId, exp: `${pm.expiryMonth}/${pm.expiryYear}`, last: pm.lastDigits, rev: !!pm.revoked});
    }
  });
  console.log(`[6] contracts=${cs.size} statuses=${JSON.stringify(statuses)} isPaymentFailed=${pf} isMaximumRetry=${mr} pmRevoked=${rev}`);
  console.log('    ACTIVE+expired card:', JSON.stringify(exp));

  // ---- 7. retries per (contract,cycle) vs maximumRetryAttempts=3
  const perCycle = {};
  orders.forEach(o => { const f = o.ba.filter(a => a.errorCode).length; if (f) perCycle[`${o.c}|${o.cy}`] = f; });
  const over = Object.entries(perCycle).filter(([, v]) => v > 4).sort((a, b) => b[1] - a[1]);
  console.log(`[7] (contract,cycle) with >4 failed attempts (setting maximumRetryAttempts=3): ${over.length}`);
  over.slice(0, 20).forEach(([k, v]) => console.log('   ', k, v));

  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
