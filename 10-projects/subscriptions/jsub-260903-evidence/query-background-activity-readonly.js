/* READ-ONLY Firestore query. */
const admin = require('/Users/dantt1002/projects/subscriptions/node_modules/firebase-admin');
const sa = require('/Users/dantt1002/projects/subscriptions/packages/functions/serviceAccount.prod.json');
admin.initializeApp({credential: admin.credential.cert(sa)});
const db = admin.firestore();
const clean = v => v && typeof v.toDate === 'function' ? v.toDate().toISOString() : Array.isArray(v) ? v.map(clean) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k,x]) => [k,clean(x)])) : v;
(async () => {
  console.log('QUERY (verbatim): db.collection("backgroundActivities").where("shopId", "==", "9jtujpdIpXKCAqW6TWOY").where("contractId", "==", 18289688830).get()');
  const snap = await db.collection('backgroundActivities').where('shopId', '==', '9jtujpdIpXKCAqW6TWOY').where('contractId', '==', 18289688830).get();
  console.log('COUNT:', snap.size);
  for (const d of snap.docs) console.log(JSON.stringify(clean({docId:d.id,...d.data()}), null, 2));
})().catch(e => {console.error(e);process.exitCode=1});
