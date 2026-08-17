/* eslint-disable */
// READ-ONLY. Scan every kookut contract line and report currentPrice/basePrice ratio.
// Usage: SA_ENV=prod node scanDiscountRatio.js <shopifyDomain> [status|ANY]
const path = require('path');
const FN = '/Users/dantt1002/projects/subscriptions/packages/functions';
const envSuffix = process.env.SA_ENV || 'development';
const serviceAccount = require(path.join(FN, `serviceAccount.${envSuffix}.json`));
const admin = require('/Users/dantt1002/projects/subscriptions/node_modules/firebase-admin');
const app = admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = app.firestore();

const r2 = n => Math.round(n * 10000) / 10000;

async function run() {
  const [domain, statusArg] = process.argv.slice(2);
  const statusFilter = statusArg || 'ACTIVE';

  const shopSnap = await db
    .collection('shops')
    .where('shopifyDomain', '==', domain)
    .limit(1)
    .get();
  if (shopSnap.empty) throw new Error('no shop');
  const shopId = shopSnap.docs[0].id;

  let query = db.collection('subscriptionContracts').where('shopId', '==', shopId);
  if (statusFilter !== 'ANY') query = query.where('status', '==', statusFilter);
  query = query.orderBy(admin.firestore.FieldPath.documentId()).limit(2000);

  const ratioHist = {};
  const rows = [];
  let cursor = null;
  let scanned = 0;
  for (;;) {
    const page = await (cursor ? query.startAfter(cursor) : query).get();
    if (page.empty) break;
    cursor = page.docs[page.docs.length - 1];
    scanned += page.size;
    page.docs.forEach(doc => {
      const d = doc.data();
      const products = d.products || [];
      const lineRatios = [];
      products.forEach((p, i) => {
        const bp = Number(p.basePrice);
        const cp = Number(p.currentPrice);
        const vp = Number(p.variant?.price);
        if (!(bp > 0) || !(cp >= 0)) {
          lineRatios.push({i, ratio: null, bp, cp, vp, title: p.title, variant: p.variant?.title, qty: p.quantity, spid: p.sellingPlanId});
          return;
        }
        const ratio = r2(cp / bp);
        const key = ratio.toFixed(4);
        ratioHist[key] = (ratioHist[key] || 0) + 1;
        lineRatios.push({i, ratio, bp, cp, vp, title: p.title, variant: p.variant?.title, qty: p.quantity, spid: p.sellingPlanId, afterCycle: p.afterCycle, afterCyclesPrice: p.afterCyclesPrice});
      });
      rows.push({
        contractId: d.subscriptionContractId,
        docId: doc.id,
        status: d.status,
        currency: d.currencyCode || d.currency,
        country: d.countryCode,
        sellingPlanId: d.sellingPlanId,
        lines: lineRatios
      });
    });
    if (page.size < 2000) break;
  }

  console.log(`scanned=${scanned} status=${statusFilter}`);
  console.log('\n=== RATIO HISTOGRAM (currentPrice/basePrice, all lines) ===');
  Object.entries(ratioHist)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .forEach(([k, v]) => console.log(`  ratio=${k}  lines=${v}`));

  console.log('\n=== LINES WITH ratio != 0.95 (tol 0.002) ===');
  rows.forEach(r => {
    const bad = r.lines.filter(l => l.ratio === null || Math.abs(l.ratio - 0.95) > 0.002);
    if (!bad.length) return;
    const all = r.lines.map(l => (l.ratio === null ? 'NA' : l.ratio.toFixed(4))).join(',');
    console.log(`\ncontract ${r.contractId} ${r.status} ${r.currency} country=${r.country} doc=${r.docId} ratios=[${all}]`);
    bad.forEach(l =>
      console.log(
        `   [${l.i}] ${l.title} / ${l.variant} qty=${l.qty} base=${l.bp} current=${l.cp} variantPrice=${l.vp} ratio=${l.ratio} afterCycle=${l.afterCycle} afterCyclesPrice=${l.afterCyclesPrice} spid=${l.spid}`
      )
    );
  });

  console.log('\n=== MIXED-RATIO CONTRACTS (some line 1.0 while sibling 0.95) ===');
  rows.forEach(r => {
    const rs = r.lines.filter(l => l.ratio !== null).map(l => l.ratio);
    if (rs.length < 2) return;
    const hasFull = rs.some(x => Math.abs(x - 1) <= 0.002);
    const hasDisc = rs.some(x => Math.abs(x - 0.95) <= 0.002);
    if (hasFull && hasDisc)
      console.log(`  ${r.contractId} ${r.status} ratios=[${rs.map(x => x.toFixed(4)).join(',')}]`);
  });

  console.log('\n=== ALL CONTRACTS SUMMARY ===');
  rows.forEach(r =>
    console.log(
      `${r.contractId} ${r.status} ${r.currency} lines=${r.lines.length} ratios=[${r.lines
        .map(l => (l.ratio === null ? 'NA' : l.ratio.toFixed(4)))
        .join(',')}]`
    )
  );
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
