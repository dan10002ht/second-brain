/* eslint-disable */
const serviceAccount = require('/Users/dantt1002/projects/subscriptions/packages/functions/serviceAccount.prod.json');
const admin = require('firebase-admin');
const app = admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = app.firestore();
(async () => {
  const shopId = '4VgCcf9Ov5cIBx2tCkcT';
  for (const col of ['settings']) {
    const snap = await db.collection(col).where('shopId', '==', shopId).get();
    console.log(`### collection ${col}: ${snap.size} docs`);
    snap.forEach(d => {
      console.log('=== doc', d.id, '===');
      console.log(JSON.stringify(d.data(), null, 1));
    });
  }
})().catch(e => { console.error(e); process.exit(1); });
