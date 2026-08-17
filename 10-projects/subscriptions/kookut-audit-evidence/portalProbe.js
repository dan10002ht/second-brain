/* eslint-disable */
// READ-ONLY probe of kookut customer-portal wiring.
const P = '/Users/dantt1002/projects/subscriptions/packages/functions';
const admin = require('firebase-admin');
const serviceAccount = require(P + '/serviceAccount.prod.json');
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const {getShopById} = require(P + '/lib/repositories/shopRepository');
const {makeGraphQlApi} = require(P + '/lib/helpers/api');
const db = admin.firestore();

const q = async (shop, query) => {
  const r = await makeGraphQlApi({...shop, graphqlQuery: {query}});
  return r;
};

(async () => {
  const domain = 'kookut.myshopify.com';
  const snap = await db.collection('shops').where('shopifyDomain', '==', domain).limit(1).get();
  const shopId = snap.docs[0].id;
  const shop = await getShopById(shopId);
  console.log('shopId', shopId);
  console.log('shopInfo.id', shop?.shopInfo?.id);
  console.log('extensionPageUuid', shop?.extensionPageUuid);
  console.log('customerAccountsVersion', shop?.shopInfoData?.data?.customerAccountsV2?.customerAccountsVersion);
  console.log('menus', JSON.stringify(shop?.menus)?.slice(0, 1500));

  console.log('\n--- customerAccountPages ---');
  console.log(JSON.stringify((await q(shop, `{ customerAccountPages(first: 20){ nodes { handle title ... on CustomerAccountAppExtensionPage { appExtensionUuid } } } }`)), null, 1));

  console.log('\n--- shop metafield value present? ---');
  const mf = await q(shop, `{ shop { metafield(namespace:"avada_subscription_settings", key:"data"){ id key namespace type value } } }`);
  const val = mf?.data?.shop?.metafield?.value;
  console.log('metafield exists:', !!val, 'len', val ? val.length : 0);
  if (val) {
    try {
      const parsed = JSON.parse(val);
      console.log('metafield keys:', Object.keys(parsed).join(','));
      console.log('metafield.customerPortal:', JSON.stringify(parsed.customerPortal));
      console.log('metafield.shopId:', parsed.shopId);
      console.log('metafield.newPlanVersion:', parsed.newPlanVersion);
    } catch (e) { console.log('parse fail', e.message); }
  }

  console.log('\n--- metafield definitions (SHOP) access ---');
  const defs = await q(shop, `{ metafieldDefinitions(first: 50, ownerType: SHOP){ nodes { namespace key access { admin storefront customerAccount } } } }`);
  const nodes = defs?.data?.metafieldDefinitions?.nodes || [];
  nodes.forEach(n => console.log(`${n.namespace}.${n.key} storefront=${n.access?.storefront} customerAccount=${n.access?.customerAccount}`));
  if (defs?.errors) console.log('errors', JSON.stringify(defs.errors));

  console.log('\n--- translation metafield ---');
  const tr = await q(shop, `{ shop { metafield(namespace:"avada_translation", key:"data"){ id } } }`);
  console.log(JSON.stringify(tr?.data));
})().catch(e => { console.error('FATAL', e); process.exit(1); });
