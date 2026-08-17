/* eslint-disable */
// READ-ONLY
const admin = require('firebase-admin');
const serviceAccount = require('/Users/dantt1002/projects/subscriptions/packages/functions/serviceAccount.prod.json');
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();
const SHOP = '4VgCcf9Ov5cIBx2tCkcT';
const FieldPath = admin.firestore.FieldPath;

async function pageAll(baseQuery, cb) {
  let last = null, n = 0;
  for (;;) {
    let q = baseQuery.orderBy(FieldPath.documentId()).limit(2000);
    if (last) q = q.startAfter(last);
    const s = await q.get();
    if (s.empty) break;
    s.docs.forEach(d => cb(d));
    n += s.size;
    last = s.docs[s.docs.length - 1].id;
    if (s.size < 2000) break;
  }
  return n;
}

(async () => {
  // --- 1. mismatch lastDigits vs maskedNumber across kookut orders
  const mismatch = [];
  const byContractPm = {};
  let withPm = 0;
  const total = await pageAll(db.collection('orders').where('shopId','==',SHOP), d => {
    const o = d.data();
    const pm = o.customerPaymentMethod;
    if (!pm || !pm.maskedNumber) return;
    withPm++;
    const tail = String(pm.maskedNumber).replace(/[^0-9]/g,'').slice(-4);
    if (pm.lastDigits && tail && tail !== String(pm.lastDigits)) {
      mismatch.push({doc:d.id, contract:o.subscriptionContractId, cycle:o.cycleIndex, status:o.status, last:pm.lastDigits, masked:pm.maskedNumber, pmId:(pm.id||'').slice(-12), upd:o.updatedAt && o.updatedAt.toDate && o.updatedAt.toDate().toISOString()});
    }
  });
  console.log('kookut orders scanned:', total, '| with maskedNumber:', withPm, '| MISMATCH lastDigits vs maskedNumber:', mismatch.length);
  const byC = {};
  mismatch.forEach(m => { (byC[m.contract] = byC[m.contract]||[]).push(m.cycle); });
  console.log('mismatch contracts:', Object.keys(byC).length);
  Object.entries(byC).slice(0,40).forEach(([c,cy]) => console.log('  contract', c, 'cycles', cy.sort((a,b)=>a-b).join(',')));
  console.log('sample:', JSON.stringify(mismatch.slice(0,3), null, 2));

  // --- 2. failing billing attempts on kookut
  const fails = {};
  const contractFail = {};
  await pageAll(db.collection('orders').where('shopId','==',SHOP), d => {
    const o = d.data();
    const at = o.billingAttempts || [];
    if (!at.length) return;
    at.forEach(a => {
      if (!a.errorCode) return;
      fails[a.errorCode] = (fails[a.errorCode]||0)+1;
      const k = o.subscriptionContractId;
      contractFail[k] = contractFail[k] || {n:0, codes:{}, cycles:new Set(), first:null, lastT:null};
      contractFail[k].n++;
      contractFail[k].codes[a.errorCode] = (contractFail[k].codes[a.errorCode]||0)+1;
      contractFail[k].cycles.add(o.cycleIndex);
      const t = a.createdAt && (a.createdAt.toDate ? a.createdAt.toDate().toISOString() : a.createdAt);
      if (!contractFail[k].first || t < contractFail[k].first) contractFail[k].first = t;
      if (!contractFail[k].lastT || t > contractFail[k].lastT) contractFail[k].lastT = t;
    });
  });
  console.log('\n=== kookut failed billing attempts by errorCode ===');
  Object.entries(fails).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(' ',k,v));
  console.log('\n=== contracts with >=2 failed attempts ===');
  Object.entries(contractFail).filter(([,v])=>v.n>=2).sort((a,b)=>b[1].n-a[1].n).slice(0,30)
    .forEach(([c,v]) => console.log(`  ${c}  fails=${v.n} cycles=${[...v.cycles].join(',')} ${JSON.stringify(v.codes)} ${v.first} -> ${v.lastT}`));

  // --- 3. contracts flagged isPaymentFailed / isMaximumRetry
  const cs = await db.collection('subscriptionContracts').where('shopId','==',SHOP).get();
  let pf=0, mr=0, revoked=0, expiredSoon=[];
  const now = new Date();
  cs.docs.forEach(d => {
    const x = d.data();
    if (x.isPaymentFailed) pf++;
    if (x.isMaximumRetry) mr++;
    const pm = x.customerPaymentMethod || {};
    if (pm.revoked) revoked++;
    if (x.status === 'ACTIVE' && pm.expiryYear && pm.expiryMonth) {
      const exp = new Date(pm.expiryYear, pm.expiryMonth, 1);
      if (exp <= now) expiredSoon.push({contract:x.subscriptionContractId, name:x.customerName||x.customer?.displayName, exp:`${pm.expiryMonth}/${pm.expiryYear}`, last:pm.lastDigits, next:x.nextBillingOrderDate});
    }
  });
  console.log(`\n=== kookut contracts: ${cs.size} | isPaymentFailed=${pf} | isMaximumRetry=${mr} | pm.revoked=${revoked}`);
  console.log(`ACTIVE contracts with ALREADY-EXPIRED card: ${expiredSoon.length}`);
  expiredSoon.slice(0,40).forEach(e => console.log('  ', JSON.stringify(e)));
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
