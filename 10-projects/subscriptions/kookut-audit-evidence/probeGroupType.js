/* eslint-disable */
// READ-ONLY probe: does deliveryGroups carry groupType? Is the 0.00 group a SUBSCRIPTION group?
const envSuffix = process.env.SA_ENV || 'development';
const admin = require('firebase-admin');
const path = require('path');
const FN = '/Users/dantt1002/projects/subscriptions/packages/functions';
const serviceAccount = require(path.join(FN, `serviceAccount.${envSuffix}.json`));
if (!admin.apps.length) {
  admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
}
const {getShopById} = require(path.join(FN, 'lib/repositories/shopRepository'));
const {
  getSubscriptionContractByContractId
} = require(path.join(FN, 'lib/repositories/subscriptionContractRepository'));
const {makeStoreFrontApi} = require(path.join(FN, 'lib/helpers/api'));
const {getLineShopifyPlanId} = require(path.join(FN, 'lib/helpers/subscription/getLineShopifyPlanId'));
const {getGraphqlId} = require(path.join(FN, 'lib/helpers/utils/convertGraphqlId'));

const db = admin.firestore();

const QUERY = `
  mutation cartCreate($input: CartInput, $country: CountryCode) @inContext(country: $country) {
    cartCreate(input: $input) {
      cart {
        id
        deliveryGroups(first: 250) {
          edges {
            node {
              id
              groupType
              deliveryOptions { title handle estimatedCost { amount currencyCode } }
              selectedDeliveryOption { title estimatedCost { amount currencyCode } }
              cartLines(first: 50) { edges { node { id quantity } } }
            }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

async function run() {
  const ids = process.argv.slice(2);
  const s = await db
    .collection('shops')
    .where('shopifyDomain', '==', 'kookut.myshopify.com')
    .limit(1)
    .get();
  const shop = await getShopById(s.docs[0].id);

  for (const raw of ids) {
    const cid = parseInt(raw);
    const [live] = await getSubscriptionContractByContractId({
      shop,
      subscriptionContractId: cid,
      fullResp: true
    });
    const {lines, deliveryMethod, customer} = live || {};
    const addr = deliveryMethod?.address || {};
    const countryCode = addr.countryCode;
    const linesInput = (lines || []).map(line => {
      const planId = getLineShopifyPlanId(line);
      const o = {
        merchandiseId: getGraphqlId(line.product.variant.id, 'ProductVariant'),
        quantity: line.product.quantity
      };
      if (planId) o.sellingPlanId = getGraphqlId(planId, 'SellingPlan');
      return o;
    });
    const country = /^[A-Za-z]{2}$/.test(countryCode || '')
      ? String(countryCode).toUpperCase()
      : undefined;

    const {data, errors} = await makeStoreFrontApi({
      shop,
      query: QUERY,
      variables: {
        country,
        input: {
          lines: linesInput,
          buyerIdentity: {
            email: customer?.email,
            countryCode: country,
            deliveryAddressPreferences: [
              {
                deliveryAddress: {
                  address1: addr.address1,
                  city: addr.city,
                  zip: addr.zip,
                  country: countryCode,
                  province: addr.provinceCode
                }
              }
            ]
          }
        }
      }
    });
    console.log('===== ' + cid, 'country=' + country, 'lines=' + linesInput.length);
    if (errors) console.log('  gqlErrors', JSON.stringify(errors).slice(0, 600));
    const ue = data?.cartCreate?.userErrors;
    if (ue && ue.length) console.log('  userErrors', JSON.stringify(ue));
    const groups = data?.cartCreate?.cart?.deliveryGroups?.edges || [];
    console.log('  groups=' + groups.length);
    groups.forEach((g, i) => {
      const n = g.node;
      console.log(
        `  [${i}] groupType=${n.groupType} lines=${n.cartLines?.edges?.length} opts=` +
          JSON.stringify(
            (n.deliveryOptions || []).map(o => [o.title, o.estimatedCost.amount, o.estimatedCost.currencyCode])
          ) +
          ' selected=' +
          JSON.stringify(n.selectedDeliveryOption)
      );
    });
  }
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
