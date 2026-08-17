/* eslint-disable */
const P = '/Users/dantt1002/projects/subscriptions/packages/functions';
const admin = require('firebase-admin');
const serviceAccount = require(P + '/serviceAccount.prod.json');
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();
(async () => {
  const shopId = '4VgCcf9Ov5cIBx2tCkcT';
  const s = await db.collection('subscriptionContracts').where('shopId','==',shopId).where('status','==','ACTIVE').limit(500).get();
  console.log('ACTIVE contracts:', s.size);
  const agg = {};
  s.forEach(d => {
    const c = d.data();
    const k = `enabledMinimumOrder=${c.plan?.enabledMinimumOrder} minOrderCancel=${c.plan?.minimumOrderCancel} hideSubActions=${c.plan?.hideSubActions} paymentType=${c.plan?.paymentType}`;
    agg[k] = (agg[k]||0)+1;
  });
  Object.entries(agg).forEach(([k,v]) => console.log(v, '×', k));
})().catch(e => { console.error(e); process.exit(1); });
