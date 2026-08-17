/* eslint-disable */
// READ-ONLY. Check whether the variants whose contextualPricing disagrees with the
// price list are actually published to that catalog's publication.
const path = require('path');
const FN = '/Users/dantt1002/projects/subscriptions/packages/functions';
const serviceAccount = require(path.join(FN, `serviceAccount.${process.env.SA_ENV}.json`));
const admin = require('/Users/dantt1002/projects/subscriptions/node_modules/firebase-admin');
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();
const {prepareShopData} = require('/Users/dantt1002/projects/subscriptions/node_modules/@avada/core');

async function gql(shop, query, variables) {
  const res = await fetch(`https://${shop.shopifyDomain}/admin/api/2025-10/graphql.json`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': shop.accessToken},
    body: JSON.stringify({query, variables})
  });
  const j = await res.json();
  if (j.errors) console.log('ERRORS', JSON.stringify(j.errors));
  return j.data;
}

async function run() {
  const snap = await db.collection('shops').where('shopifyDomain', '==', 'kookut.myshopify.com').limit(1).get();
  const shop = prepareShopData(snap.docs[0].id, snap.docs[0].data(), process.env.SHOPIFY_ACCESS_TOKEN_KEY);

  const cat = await gql(
    shop,
    `{ catalogs(first: 20, type: MARKET) { nodes { id title
        ... on MarketCatalog { publication { id autoPublish } priceList { id } } } } }`,
    {}
  );
  const cats = cat.catalogs.nodes;
  cats.forEach(c => console.log(`${c.title} publication=${c.publication && c.publication.id} autoPublish=${c.publication && c.publication.autoPublish}`));

  // variant -> product
  const vids = ['39412882735312', '39412882702544', '39412859404496', '57407416893821', '43340379422928', '39404501696720'];
  for (const vid of vids) {
    const d = await gql(
      shop,
      `query($id: ID!){ node(id:$id){ ... on ProductVariant { id title product { id title
        ${cats.map((c, i) => `p${i}: publishedOnPublication(publicationId: "${c.publication.id}")`).join('\n')}
      } } } }`,
      {id: `gid://shopify/ProductVariant/${vid}`}
    );
    const p = d.node.product;
    console.log(
      `\n${vid} ${p.title} / ${d.node.title}  ` +
        cats.map((c, i) => `${c.title}:published=${p['p' + i]}`).join('  ')
    );
  }
  process.exit(0);
}
run().catch(e => {
  console.error(e);
  process.exit(1);
});
