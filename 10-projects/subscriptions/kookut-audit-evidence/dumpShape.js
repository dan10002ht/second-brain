/* eslint-disable */
const admin = require('firebase-admin');
const path='/Users/dantt1002/projects/subscriptions/packages/functions/serviceAccount.prod.json';
admin.initializeApp({credential: admin.credential.cert(require(path))});
const db = admin.firestore();
(async () => {
  const s = await db.collection('shops').where('shopifyDomain','==','kookut.myshopify.com').limit(1).get();
  const shopId = s.docs[0].id;
  const snap = await db.collection('subscriptionContracts').where('shopId','==',shopId).where('status','==','ACTIVE').limit(2000).get();
  const shapes = {};
  const samples = {};
  snap.docs.forEach(d => {
    const v = d.data().deliveryPrice;
    let k;
    if (v === undefined) k='UNDEFINED';
    else if (v === null) k='NULL';
    else if (typeof v === 'object') k='OBJECT{'+Object.keys(v).sort().join(',')+'}';
    else k=typeof v;
    shapes[k]=(shapes[k]||0)+1;
    if(!samples[k]) samples[k]=[d.data().subscriptionContractId, JSON.stringify(v), 'isCustom='+d.data().isCustomDeliveryPrice, 'updatedAt='+(d.data().updatedAt&&d.data().updatedAt.toDate&&d.data().updatedAt.toDate().toISOString())];
  });
  console.log('shapes', shapes);
  console.log(JSON.stringify(samples,null,1));
  process.exit(0);
})();
