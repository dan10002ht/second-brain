/* eslint-disable */
// READ-ONLY
const envSuffix = process.env.SA_ENV || 'development';
const serviceAccount = require(`/Users/dantt1002/projects/subscriptions/packages/functions/serviceAccount.${envSuffix}.json`);
const admin = require('firebase-admin');
const app = admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = app.firestore();

async function run() {
  const shopSnap = await db.collection('shops').where('shopifyDomain', '==', 'kookut.myshopify.com').get();
  console.log('shops found:', shopSnap.size);
  shopSnap.docs.forEach(d => console.log('shopId=', d.id, JSON.stringify({domain: d.data().shopifyDomain, name: d.data().name})));
  const shopId = shopSnap.docs[0].id;

  const snap = await db.collection('subscriptionContracts').where('shopId', '==', shopId).get();
  console.log('contracts:', snap.size);
  const hits = [];
  snap.docs.forEach(d => {
    const x = d.data();
    const blob = JSON.stringify({c: x.customer, ca: x.customerAddress, e: x.email, dm: x.deliveryMethod}).toLowerCase();
    if (blob.includes('charbonneau') || blob.includes('caroline')) hits.push({id: d.id, x});
  });
  console.log('matches:', hits.length);
  hits.forEach(h => {
    const x = h.x;
    console.log('\n=== doc', h.id, '===');
    console.log(JSON.stringify({
      subscriptionContractId: x.subscriptionContractId,
      status: x.status,
      customer: x.customer,
      currencyCode: x.currencyCode,
      createdAt: x.createdAt && new Date(x.createdAt._seconds*1000).toISOString(),
      updatedAt: x.updatedAt && new Date(x.updatedAt._seconds*1000).toISOString(),
      customerPaymentMethod: x.customerPaymentMethod,
      nextBillingDate: x.nextBillingDate,
      lastPaymentStatus: x.lastPaymentStatus
    }, null, 2));
    console.log('top keys:', Object.keys(x).join(', '));
  });
  process.exit(0);
}
run().catch(e => {console.error(e); process.exit(1);});
