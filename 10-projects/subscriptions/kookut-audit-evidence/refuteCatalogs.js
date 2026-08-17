/* eslint-disable */
const path=require('path');
const FN='/Users/dantt1002/projects/subscriptions/packages/functions';
const serviceAccount=require(path.join(FN,`serviceAccount.${process.env.SA_ENV}.json`));
const admin=require('/Users/dantt1002/projects/subscriptions/node_modules/firebase-admin');
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(serviceAccount)});
const db=admin.firestore();
const {prepareShopData}=require('/Users/dantt1002/projects/subscriptions/node_modules/@avada/core');
async function gql(shop,query,variables){const r=await fetch(`https://${shop.shopifyDomain}/admin/api/2025-10/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':shop.accessToken},body:JSON.stringify({query,variables})});const j=await r.json();if(j.errors)console.log('ERR',JSON.stringify(j.errors));return j.data;}
(async()=>{
const snap=await db.collection('shops').where('shopifyDomain','==','kookut.myshopify.com').limit(1).get();
const shop=prepareShopData(snap.docs[0].id,snap.docs[0].data(),process.env.SHOPIFY_ACCESS_TOKEN_KEY);
console.log('=== ALL CATALOGS ===');
const c=await gql(shop,`{ catalogs(first:50){ nodes{ id title status
  ... on MarketCatalog { publication{ id autoPublish } priceList{ id name currency parent{ adjustment{ type value } } } markets(first:10){nodes{ id name }} } } } }`,{});
(c.catalogs.nodes||[]).forEach(x=>console.log(JSON.stringify(x)));
console.log('\n=== ALL PRICE LISTS ===');
const p=await gql(shop,`{ priceLists(first:50){ nodes{ id name currency parent{ adjustment{ type value } } catalog{ id title } } } }`,{});
const pls=(p.priceLists&&p.priceLists.nodes)||[];
pls.forEach(x=>console.log(JSON.stringify(x)));
const vids=['39412882735312','39412882702544','39412859404496','39404525027536','42888438022352','39404501696720','43340379422928','39404501663952'];
console.log('\n=== PRICES PER LIST ===');
for(const vid of vids){
  console.log(`\nvariant ${vid}`);
  for(const pl of pls){
    const r=await gql(shop,`query($id:ID!,$q:String!){ priceList(id:$id){ prices(first:5,query:$q){ nodes{ originType price{amount currencyCode} } } } }`,{id:pl.id,q:`variant_id:${vid}`});
    const n=(r&&r.priceList&&r.priceList.prices&&r.priceList.prices.nodes)||[];
    console.log(`  [${pl.name}|${pl.currency}] ${n.length?n.map(y=>y.originType+'='+y.price.amount).join(','):'(none)'}`);
  }
}
process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
