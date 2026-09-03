/* READ-ONLY Firestore investigation; all operations are get/count. */
const admin = require('/Users/dantt1002/projects/subscriptions/node_modules/firebase-admin');
const serviceAccount = require('/Users/dantt1002/projects/subscriptions/packages/functions/serviceAccount.prod.json');
admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();
const iso = value => value && typeof value.toDate === 'function' ? value.toDate().toISOString() : value;
const normalize = value => {
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalize(v)]));
  return value;
};
(async () => {
  const shopId = '9jtujpdIpXKCAqW6TWOY';
  const contractId = 18289688830;
  const shopDoc = await db.collection('shops').doc(shopId).get();
  const shop = shopDoc.data();
  console.log('QUERY 1 (verbatim): db.collection("shops").doc("9jtujpdIpXKCAqW6TWOY").get()');
  console.log(JSON.stringify(normalize({id: shopDoc.id, shopifyDomain: shop.shopifyDomain, plan: shop.plan, status: shop.status, stopAutoAttempt: shop.stopAutoAttempt, createdAt: shop.createdAt, updatedAt: shop.updatedAt}), null, 2));

  const contractSnap = await db.collection('subscriptionContracts').where('shopId', '==', shopId).where('subscriptionContractId', '==', contractId).get();
  console.log('QUERY 2 (verbatim): db.collection("subscriptionContracts").where("shopId", "==", "9jtujpdIpXKCAqW6TWOY").where("subscriptionContractId", "==", 18289688830).get()');
  for (const doc of contractSnap.docs) console.log(JSON.stringify(normalize({docId: doc.id, ...doc.data()}), null, 2));

  const shopContracts = await db.collection('subscriptionContracts').where('shopId', '==', shopId).where('status', '==', 'ACTIVE').select('subscriptionContractId').get();
  const now = new Date();
  const shopOrders = await db.collection('orders').where('shopId', '==', shopId).where('billingAttemptExpectedDate', '>', now).select('subscriptionContractId').get();
  console.log('QUERY 3 (verbatim): db.collection("subscriptionContracts").where("shopId", "==", "9jtujpdIpXKCAqW6TWOY").where("status", "==", "ACTIVE").select("subscriptionContractId").get()');
  console.log('QUERY 4 (verbatim): db.collection("orders").where("shopId", "==", "9jtujpdIpXKCAqW6TWOY").where("billingAttemptExpectedDate", ">", new Date("' + now.toISOString() + '")).select("subscriptionContractId").get()');
  const futureByContract = new Set(shopOrders.docs.map(d => Number(d.data().subscriptionContractId)));
  const active = shopContracts.docs.map(d => d.data());
  const missingFuture = active.filter(c => !futureByContract.has(Number(c.subscriptionContractId)));
  console.log(JSON.stringify({asOf: now.toISOString(), futureOrderDocCount: shopOrders.size, activeContractCount: active.length, activeWithoutFutureOrderCount: missingFuture.length, activeWithoutFutureOrderIds: missingFuture.map(c => c.subscriptionContractId)}, null, 2));
  process.exit(0);
})().catch(error => {console.error(error); process.exit(1);});
