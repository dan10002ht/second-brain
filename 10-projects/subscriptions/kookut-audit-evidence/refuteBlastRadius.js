/* eslint-disable */
const FN = '/Users/dantt1002/projects/subscriptions/packages/functions';
const ROOT = '/Users/dantt1002/projects/subscriptions';
const serviceAccount = require(`${FN}/serviceAccount.${process.env.SA_ENV || 'development'}.json`);
const admin = require(`${ROOT}/node_modules/firebase-admin`);
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();
async function run() {
  const s = await db.collection('shops').where('shopifyDomain','==','kookut.myshopify.com').limit(1).get();
  const shopId = s.docs[0].id;
  const snap = await db.collection('subscriptionContracts').where('shopId','==',shopId).get();
  console.log('total contracts in Firestore:', snap.size);
  const byStatus = {};
  let poisonedContracts = 0, poisonedEntries = 0;
  let contractPlanPoisoned = 0, contractPlanPoisonedButLinesOk = 0;
  const rows = [];
  snap.docs.forEach(d => {
    const c = d.data();
    byStatus[c.status] = (byStatus[c.status]||0)+1;
    const plans = c.plans || [];
    // poisoned = intends a discount (value>0) but a flag disables it
    const bad = plans.filter(p => Number(p.discountValue) > 0 && (p.enabledDiscount === false || p.enabledAmountDiscount === false));
    const cp = c.plan;
    const cpBad = cp && Number(cp.discountValue) > 0 && (cp.enabledDiscount === false || cp.enabledAmountDiscount === false);
    if (cpBad) contractPlanPoisoned++;
    if (bad.length) {
      poisonedContracts++; poisonedEntries += bad.length;
      rows.push(`${c.subscriptionContractId} fsStatus=${c.status} poisoned=${bad.length}/${plans.length} contractPlanPoisoned=${!!cpBad} keys=[${bad.map(p=>p.sellingPlanId).join(',')}]`);
    } else if (cpBad) {
      contractPlanPoisonedButLinesOk++;
      rows.push(`${c.subscriptionContractId} fsStatus=${c.status} poisoned=0/${plans.length} contractPlanPoisoned=TRUE  <-- only contract.plan`);
    }
  });
  console.log('by status:', JSON.stringify(byStatus));
  console.log(`contracts with >=1 poisoned plans[] entry: ${poisonedContracts} (entries=${poisonedEntries})`);
  console.log(`contracts with poisoned contract.plan: ${contractPlanPoisoned} (of which lines clean: ${contractPlanPoisonedButLinesOk})`);
  console.log('---');
  rows.sort().forEach(r => console.log('  ' + r));
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});
