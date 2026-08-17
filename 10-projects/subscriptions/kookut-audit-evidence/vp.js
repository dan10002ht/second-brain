/* eslint-disable */
const path=require('path');const FN='/Users/dantt1002/projects/subscriptions/packages/functions';
const sa=require(path.join(FN,`serviceAccount.${process.env.SA_ENV}.json`));
const admin=require('/Users/dantt1002/projects/subscriptions/node_modules/firebase-admin');
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert(sa)});
const db=admin.firestore();
const {prepareShopData}=require('/Users/dantt1002/projects/subscriptions/node_modules/@avada/core');
async function gql(shop,q,v){const r=await fetch(`https://${shop.shopifyDomain}/admin/api/2025-10/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':shop.accessToken},body:JSON.stringify({query:q,variables:v})});const j=await r.json();if(j.errors)console.log('ERR',JSON.stringify(j.errors));return j.data;}
(async()=>{
const s=await db.collection('shops').where('shopifyDomain','==','kookut.myshopify.com').limit(1).get();
const shop=prepareShopData(s.docs[0].id,s.docs[0].data(),process.env.SHOPIFY_ACCESS_TOKEN_KEY);
for(const vid of ['39412882735312','39412859404496','57407416893821','43340379422928','39404501696720']){
 const d=await gql(shop,`query($id:ID!){node(id:$id){... on ProductVariant{title product{id title}}}}`,{id:`gid://shopify/ProductVariant/${vid}`});
 console.log(vid, d.node.product.id, d.node.product.title,'/',d.node.title);
}
for(const pid of ['15247427436925','6576427466960','6576417243344','6576443031760']){
 const d=await gql(shop,`query($id:ID!){node(id:$id){... on Product{id title status}}}`,{id:`gid://shopify/Product/${pid}`});
 console.log('product',pid, d.node?JSON.stringify(d.node):'NOT FOUND');
}
process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
