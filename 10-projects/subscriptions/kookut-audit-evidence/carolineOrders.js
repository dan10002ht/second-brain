/* eslint-disable */
const envSuffix = process.env.SA_ENV || 'development';
const serviceAccount = require(`/Users/dantt1002/projects/subscriptions/packages/functions/serviceAccount.${envSuffix}.json`);
const admin = require('firebase-admin');
const app = admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = app.firestore();
const ts = v => (v && v._seconds ? new Date(v._seconds * 1000).toISOString() : v);

async function run() {
  const contractId = 121065865597;
  const snap = await db.collection('orders').where('subscriptionContractId', '==', contractId).get();
  console.log('orders:', snap.size);
  const rows = snap.docs.map(d => ({__id: d.id, ...d.data()}));
  rows.sort((a,b)=> (a.cycleIndex||0)-(b.cycleIndex||0));
  rows.forEach(o => {
    console.log('\n--- doc', o.__id, '---');
    console.log(JSON.stringify({
      cycleIndex: o.cycleIndex, status: o.status, orderId: o.orderId, orderName: o.orderName,
      totalPrice: o.totalPrice, currency: o.currency,
      billingAttemptExpectedDate: o.billingAttemptExpectedDate,
      createdAt: ts(o.createdAt), updatedAt: ts(o.updatedAt),
      errorCode: o.errorCode, retryCount: o.retryCount, isMaximumRetry: o.isMaximumRetry,
      paymentMethod: o.paymentMethod, customerPaymentMethod: o.customerPaymentMethod,
      paymentMethodId: o.paymentMethodId,
      billingAttempts: (o.billingAttempts||[]).map(b=>({id:b.id, errorCode:b.errorCode, ready:b.ready, createdAt: ts(b.createdAt), orderId:b.orderId, idempotencyKey:b.idempotencyKey}))
    }, null, 2));
    console.log('keys:', Object.keys(o).join(', '));
  });
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});
