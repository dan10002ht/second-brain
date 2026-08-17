/* eslint-disable */
// READ-ONLY
const admin = require('firebase-admin');
const serviceAccount = require('/Users/dantt1002/projects/subscriptions/packages/functions/serviceAccount.prod.json');
const {prepareShopData} = require('@avada/core');
const API_VERSION='2025-10';
const KEY = process.env.SHOPIFY_ACCESS_TOKEN_KEY || '';
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();
const FieldPath = admin.firestore.FieldPath;
const SHOP='4VgCcf9Ov5cIBx2tCkcT';

async function gql(shop, query, variables) {
  const res = await fetch(`https://${shop.shopifyDomain}/admin/api/${API_VERSION}/graphql.json`, {
    method:'POST', headers:{'X-Shopify-Access-Token':shop.accessToken,'Content-Type':'application/json'},
    body: JSON.stringify({query, variables})});
  const j = await res.json();
  if (j.errors) console.error('GQL', JSON.stringify(j.errors).slice(0,300));
  return j.data;
}
async function pageAll(base, cb){let last=null,n=0;for(;;){let q=base.orderBy(FieldPath.documentId()).limit(2000);if(last)q=q.startAfter(last);const s=await q.get();if(s.empty)break;s.docs.forEach(cb);n+=s.size;last=s.docs[s.docs.length-1].id;if(s.size<2000)break;}return n;}

(async () => {
  const q = await db.collection('shops').where('shopifyDomain','==','kookut.myshopify.com').limit(1).get();
  const shop = prepareShopData(q.docs[0].id, q.docs[0].data(), KEY);

  // A. idempotencyKeys with hardcoded shopifyCycleIndex=1 from getFailedData: pattern `<n>__1_`
  const bad = [];
  const allKeys = {};
  const scanned = await pageAll(db.collection('orders').where('shopId','==',SHOP), d=>{
    const o=d.data();
    const k=o.idempotencyKeys;
    if(!k || typeof k!=='string') return;
    const parts=k.split('_');
    allKeys[`${parts[1]||''}|${parts[2]||''}|${parts[3]||''}`]=(allKeys[`${parts[1]||''}|${parts[2]||''}|${parts[3]||''}`]||0)+1;
    if(parts[2]==='1' && parts[0]!=='1'){
      bad.push({doc:d.id, contract:o.subscriptionContractId, cycle:o.cycleIndex, status:o.status, key:k, err:o.errorCode, upd:o.updatedAt&&o.updatedAt.toDate&&o.updatedAt.toDate().toISOString()});
    }
  });
  console.log('orders scanned', scanned);
  console.log('idempotencyKeys shape counts (auto|shopifyCycle|retry):', JSON.stringify(allKeys,null,1).slice(0,1500));
  console.log('\n### orders whose idempotencyKeys claims shopifyCycleIndex=1 but appCycle!=1 :', bad.length);
  bad.slice(0,30).forEach(b=>console.log('  ',JSON.stringify(b)));

  // A2. same scan but any isCreateAttemptFailed attempts
  let icaf=0; const icafSample=[];
  await pageAll(db.collection('orders').where('shopId','==',SHOP), d=>{
    const o=d.data();
    (o.billingAttempts||[]).forEach(a=>{ if(a.isCreateAttemptFailed){icaf++; if(icafSample.length<10) icafSample.push({doc:d.id,contract:o.subscriptionContractId,cycle:o.cycleIndex,key:a.idempotencyKey,err:a.errorCode,msg:(a.errorMessage||'').slice(0,120)});} });
  });
  console.log('\n### billingAttempts with isCreateAttemptFailed=true:', icaf);
  icafSample.forEach(s=>console.log('  ',JSON.stringify(s)));

  // B. live compare payment method for mismatch contracts
  const targets=[122251772285,142987559293,140389712253,129462731133,127423086973];
  console.log('\n### live vs stored payment method');
  for (const cid of targets){
    const os = await db.collection('orders').where('shopId','==',SHOP).where('subscriptionContractId','==',cid).get();
    const rows = os.docs.map(d=>({c:d.data().cycleIndex, pm:d.data().customerPaymentMethod||{}})).sort((a,b)=>a.c-b.c);
    const d1 = await gql(shop, `query($id:ID!){subscriptionContract(id:$id){customerPaymentMethod(showRevoked:true){id revokedReason instrument{__typename ... on CustomerCreditCard{lastDigits maskedNumber expiryMonth expiryYear brand} ... on CustomerShopPayAgreement{lastDigits maskedNumber expiryMonth expiryYear} ... on CustomerPaypalBillingAgreement{paypalAccountEmail}}}}}`,{id:`gid://shopify/SubscriptionContract/${cid}`});
    const li=d1?.subscriptionContract?.customerPaymentMethod?.instrument||{};
    console.log(`\ncontract ${cid} LIVE: type=${li.__typename} last=${li.lastDigits} masked=${li.maskedNumber} exp=${li.expiryMonth}/${li.expiryYear}`);
    rows.forEach(r=>console.log(`   cycle ${r.c}: last=${r.pm.lastDigits} masked=${r.pm.maskedNumber} type=${r.pm.__typename||r.pm.type} pmId=${(r.pm.id||'').slice(-10)}`));
  }
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
