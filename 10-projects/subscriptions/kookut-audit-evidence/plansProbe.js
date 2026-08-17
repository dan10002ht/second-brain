/* eslint-disable */
const P = '/Users/dantt1002/projects/subscriptions/packages/functions';
const admin = require('firebase-admin');
const serviceAccount = require(P + '/serviceAccount.prod.json');
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();
const shopId = '4VgCcf9Ov5cIBx2tCkcT';
(async () => {
  for (const col of ['subscriptionPlans', 'plans', 'sellingPlans']) {
    const s = await db.collection(col).where('shopId', '==', shopId).limit(50).get().catch(e => null);
    if (!s) { console.log(col, 'ERR'); continue; }
    console.log(`\n### ${col}: ${s.size}`);
    s.forEach(d => {
      const x = d.data();
      console.log(`- ${d.id} name=${JSON.stringify(x.name || x.title)} status=${x.status} enabledMinimumOrder=${x.enabledMinimumOrder} minimumOrderCancel=${x.minimumOrderCancel} hideSubActions=${x.hideSubActions} hideSubActionAfterOrder=${x.hideSubActionAfterOrder} paymentType=${x.paymentType}`);
    });
  }
  // cancellationFlow config
  for (const col of ['cancellationFlows', 'cancellationFlow']) {
    const s = await db.collection(col).where('shopId', '==', shopId).limit(10).get().catch(() => null);
    if (!s) continue;
    console.log(`\n### ${col}: ${s.size}`);
    s.forEach(d => console.log(JSON.stringify(d.data()).slice(0, 2000)));
  }
})().catch(e => { console.error(e); process.exit(1); });
