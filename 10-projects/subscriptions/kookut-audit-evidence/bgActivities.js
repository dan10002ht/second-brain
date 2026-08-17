/* eslint-disable */
// READ-ONLY. Dump background activities (bulk actions incl. price sync) for kookut.
const path = require('path');
const FN = '/Users/dantt1002/projects/subscriptions/packages/functions';
const serviceAccount = require(path.join(FN, `serviceAccount.${process.env.SA_ENV}.json`));
const admin = require('/Users/dantt1002/projects/subscriptions/node_modules/firebase-admin');
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();
const ts = v => (v && v._seconds ? new Date(v._seconds * 1000).toISOString() : v);

async function run() {
  const shopId = '4VgCcf9Ov5cIBx2tCkcT';
  const snap = await db
    .collection('backgroundActivities')
    .where('shopId', '==', shopId)
    .get();
  console.log('backgroundActivities:', snap.size);
  const rows = snap.docs.map(d => ({id: d.id, ...d.data()}));
  rows.sort((a, b) => (a.createdAt && a.createdAt._seconds || 0) - (b.createdAt && b.createdAt._seconds || 0));
  rows.forEach(r => {
    const keys = Object.keys(r);
    console.log(
      `${ts(r.createdAt)} | ${ts(r.updatedAt)} | type=${r.type} bulkActionType=${r.bulkActionType} status=${r.status} productId=${r.productId} total=${r.total || r.totalItem || ''} id=${r.id}`
    );
    if (r.data && typeof r.data === 'object') {
      const ks = Object.keys(r.data);
      console.log(`     data contracts=${ks.length} sample=${JSON.stringify(r.data[ks[0]]).slice(0, 400)}`);
    }
    console.log('     keys: ' + keys.join(','));
  });
  process.exit(0);
}
run().catch(e => {
  console.error(e);
  process.exit(1);
});
