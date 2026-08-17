/* eslint-disable */
// READ-ONLY. For each affected kookut contract: createdAt/updatedAt + per-order line
// price history of the variants of interest, to see WHEN basePrice flipped.
const path = require('path');
const FN = '/Users/dantt1002/projects/subscriptions/packages/functions';
const serviceAccount = require(path.join(FN, `serviceAccount.${process.env.SA_ENV}.json`));
const admin = require('/Users/dantt1002/projects/subscriptions/node_modules/firebase-admin');
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();

const ts = v => (v && v._seconds ? new Date(v._seconds * 1000).toISOString() : v);
const WATCH = new Set(['39412882735312', '39412882702544', '39412859404496', '39412859371728', '57407416893821', '39404501663952', '39404501696720', '43340379422928']);
const CONTRACTS = process.argv.slice(3).map(Number);

async function run() {
  const shopId = process.argv[2];
  for (const cid of CONTRACTS) {
    const snap = await db
      .collection('subscriptionContracts')
      .where('shopId', '==', shopId)
      .where('subscriptionContractId', '==', cid)
      .limit(1)
      .get();
    if (snap.empty) {
      console.log(`\n### ${cid} NOT FOUND`);
      continue;
    }
    const d = snap.docs[0].data();
    console.log(
      `\n### contract ${cid} status=${d.status} cur=${d.currency} created=${ts(d.createdAt)} updated=${ts(d.updatedAt)} updateBy=${d.updateBy || '-'} country=${(d.deliveryMethod && d.deliveryMethod.countryCode) || d.countryCode}`
    );
    (d.products || []).forEach((p, i) => {
      const vid = String((p.variant && p.variant.id) || '').split('/').pop();
      console.log(
        `   line[${i}] ${p.title}/${p.variant && p.variant.title} vid=${vid} base=${p.basePrice} cur=${p.currentPrice} vprice=${p.variant && p.variant.price} qty=${p.quantity}`
      );
    });
    const osnap = await db
      .collection('orders')
      .where('shopId', '==', shopId)
      .where('subscriptionContractId', '==', cid)
      .limit(40)
      .get();
    const rows = osnap.docs.map(x => x.data()).sort((a, b) => (a.cycleIndex || 0) - (b.cycleIndex || 0));
    rows.forEach(o => {
      const lines = (o.products || o.lines || []).filter(p => {
        const vid = String((p.variant && p.variant.id) || '').split('/').pop();
        return WATCH.has(vid);
      });
      if (!lines.length) return;
      console.log(
        `   order cycle=${o.cycleIndex} ${o.status} ${o.orderName || ''} created=${ts(o.createdAt)} billDate=${o.billingAttemptExpectedDate}`
      );
      lines.forEach(p => {
        const vid = String((p.variant && p.variant.id) || '').split('/').pop();
        console.log(`      vid=${vid} ${p.title}/${p.variant && p.variant.title} base=${p.basePrice} cur=${p.currentPrice}`);
      });
    });
  }
  process.exit(0);
}
run().catch(e => {
  console.error(e);
  process.exit(1);
});
