/* eslint-disable */
const P = '/Users/dantt1002/projects/subscriptions/packages/functions';
const admin = require('firebase-admin');
const serviceAccount = require(P + '/serviceAccount.prod.json');
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();
const shopId = '4VgCcf9Ov5cIBx2tCkcT';
(async () => {
  const d = await db.collection('shopInfos').doc(shopId).get();
  console.log('shopInfos exists', d.exists);
  if (d.exists) {
    const x = d.data();
    console.log('id =', JSON.stringify(x.id), 'typeof', typeof x.id);
    console.log('keys:', Object.keys(x).join(','));
  }
  const s = await db.collection('shops').doc(shopId).get();
  const sd = s.data();
  console.log('\nshops keys:', Object.keys(sd).join(','));
  ['shopifyDomain','domain','plan','installedAt','isNonDevShop','shopifyPlanName'].forEach(k => console.log(k, '=', JSON.stringify(sd[k])));
})().catch(e => { console.error(e); process.exit(1); });
