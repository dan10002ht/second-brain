/* eslint-disable */
// READ-ONLY. Probe Shopify Markets/catalog pricing for a few variants of kookut.
const path = require('path');
const FN = '/Users/dantt1002/projects/subscriptions/packages/functions';
const serviceAccount = require(path.join(FN, `serviceAccount.${process.env.SA_ENV}.json`));
const admin = require('/Users/dantt1002/projects/subscriptions/node_modules/firebase-admin');
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();
const {prepareShopData} = require('/Users/dantt1002/projects/subscriptions/node_modules/@avada/core');
const API_VERSION = '2025-10';

async function gql(shop, query, variables) {
  const res = await fetch(
    `https://${shop.shopifyDomain}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': shop.accessToken},
      body: JSON.stringify({query, variables})
    }
  );
  const json = await res.json();
  if (json.errors) console.log('GQL ERRORS', JSON.stringify(json.errors));
  return json.data;
}

const VIDS = [
  39412882735312, // Tuna & Sardine 70g
  39412882702544, // Tuna & Sardine 24x70g
  39412859404496, // Salmon 70g
  39412859371728, // Salmon 24x70g
  57407416893821, // Free Run Chicken & Duck 70g
  43340379422928, // discovery set
  39404501663952, // Kitten dry 1.5kg
  39404501696720, // Kitten dry 5kg
  39404525027536, // catalog divergence pair
  42888438022352
];

async function run() {
  const snap = await db
    .collection('shops')
    .where('shopifyDomain', '==', 'kookut.myshopify.com')
    .limit(1)
    .get();
  const shop = prepareShopData(
    snap.docs[0].id,
    snap.docs[0].data(),
    process.env.SHOPIFY_ACCESS_TOKEN_KEY
  );
  console.log('shopCountry =', snap.docs[0].data().shopCountry, ' currency =', snap.docs[0].data().currency || snap.docs[0].data().shopCurrency);

  console.log('\n=== MARKETS ===');
  const m = await gql(
    shop,
    `{ markets(first: 30) { nodes { id name handle status
        currencySettings { baseCurrency { currencyCode } localCurrencies }
        catalogsCount { count }
        webPresences(first:5){nodes{ id rootUrls{locale url} }}
        regions(first: 40) { nodes { ... on MarketRegionCountry { code name } } } } } }`,
    {}
  );
  (m.markets ? m.markets.nodes : []).forEach(mk => {
    const regions = (mk.regions ? mk.regions.nodes : []).map(r => r.code).join(',');
    console.log(
      `${mk.id} "${mk.name}" handle=${mk.handle} status=${mk.status} base=${mk.currencySettings && mk.currencySettings.baseCurrency && mk.currencySettings.baseCurrency.currencyCode} localCur=${mk.currencySettings && mk.currencySettings.localCurrencies} catalogs=${mk.catalogsCount && mk.catalogsCount.count} regions=[${regions}]`
    );
  });

  const countries = ['FR', 'DE', 'IT', 'BE', 'CH', 'ES', 'NL'];
  for (const vid of VIDS) {
    const gid = `gid://shopify/ProductVariant/${vid}`;
    const parts = countries
      .map(
        (c, i) =>
          `c${i}: contextualPricing(context: {country: ${c}}) { price { amount currencyCode } }`
      )
      .join('\n');
    const d = await gql(
      shop,
      `query($id: ID!) { node(id: $id) { ... on ProductVariant {
          id title price product { title }
          ${parts}
          contextualPricingByMarket: id
        } } }`,
      {id: gid}
    );
    const n = d && d.node;
    if (!n) {
      console.log(`\n${vid}: NOT FOUND`);
      continue;
    }
    console.log(`\n${vid} ${n.product.title} / ${n.title}  variant.price(shop cur)=${n.price}`);
    countries.forEach((c, i) => {
      const p = n[`c${i}`];
      console.log(
        `   contextualPricing(${c}) = ${p && p.price ? p.price.amount + ' ' + p.price.currencyCode : 'n/a'}`
      );
    });
    // price list entries (all origin types)
    for (const pl of [
      ['Switzerland', 'gid://shopify/PriceList/37466079613'],
      ['Europe', 'gid://shopify/PriceList/20665794768'],
      ['France', 'gid://shopify/PriceList/20665860304']
    ]) {
      const r = await gql(
        shop,
        `query($id: ID!, $q: String!) { priceList(id: $id) { prices(first: 5, query: $q) { nodes { originType price { amount currencyCode } compareAtPrice { amount } variant { id } } } } }`,
        {id: pl[1], q: `variant_id:${vid}`}
      );
      const nodes = (r && r.priceList && r.priceList.prices && r.priceList.prices.nodes) || [];
      nodes.forEach(x =>
        console.log(`   priceList[${pl[0]}] ${x.originType} = ${x.price.amount} ${x.price.currencyCode}`)
      );
      if (!nodes.length) console.log(`   priceList[${pl[0]}] (no entry)`);
    }
  }
  process.exit(0);
}
run().catch(e => {
  console.error(e);
  process.exit(1);
});
