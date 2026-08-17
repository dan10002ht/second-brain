/* eslint-disable */
const P = '/Users/dantt1002/projects/subscriptions/packages/functions';
const admin = require('firebase-admin');
const serviceAccount = require(P + '/serviceAccount.prod.json');
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const {getShopById} = require(P + '/lib/repositories/shopRepository');
const {makeGraphQlApi} = require(P + '/lib/helpers/api');
const db = admin.firestore();
(async () => {
  const shopId = '4VgCcf9Ov5cIBx2tCkcT';
  const raw = (await db.collection('shops').doc(shopId).get()).data();
  console.log('shops.accessLink =', JSON.stringify(raw.accessLink));
  const shop = await getShopById(shopId);
  const r = await makeGraphQlApi({...shop, graphqlQuery: {query: `{
    pages(first: 100) { nodes { id handle title isPublished } }
  }`}});
  const nodes = r?.data?.pages?.nodes || [];
  console.log('total pages', nodes.length);
  nodes.filter(n => /joy|subscri|abonn/i.test(n.handle + n.title)).forEach(n => console.log(' *', n.handle, '|', n.title, '| published=', n.isPublished));
  console.log('has joy-subscription:', nodes.some(n => n.handle === 'joy-subscription'));
  if (r?.errors) console.log('errors', JSON.stringify(r.errors));

  const m = await makeGraphQlApi({...shop, graphqlQuery: {query: `{ shop { id name url myshopifyDomain } }`}});
  console.log('shop.id gid =', JSON.stringify(m?.data?.shop));
})().catch(e => { console.error(e); process.exit(1); });
