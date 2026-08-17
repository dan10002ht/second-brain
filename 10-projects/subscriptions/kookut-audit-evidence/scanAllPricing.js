/* eslint-disable */
// READ-ONLY bulk version of compareContractPricingWithCatalog.js
// Scans ALL ACTIVE + PAUSED contracts of a shop and compares each line's basePrice
// against every MARKET catalog price list matching the contract currency.
// No mutation of any kind.
//
// Usage: node scanAllPricing.js <shopifyDomain>
const path = require('path');
const FN = '/Users/dantt1002/projects/subscriptions/packages/functions';
const envSuffix = process.env.SA_ENV || 'development';
const serviceAccount = require(path.join(FN, `serviceAccount.${envSuffix}.json`));
const admin = require('/Users/dantt1002/projects/subscriptions/node_modules/firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
}
const db = admin.firestore();
const {prepareShopData} = require('/Users/dantt1002/projects/subscriptions/node_modules/@avada/core');

const API_VERSION = '2025-10';
const convertId = (gid = '') => {
  const s = String(gid || '');
  if (!s.includes('gid://shopify')) return s;
  return s.split('/').pop();
};

async function shopifyGraphQL(shop, query, variables) {
  const url = `https://${shop.shopifyDomain}/admin/api/${API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': shop.accessToken},
    body: JSON.stringify({query, variables})
  });
  const json = await res.json();
  if (json.errors) throw new Error('Shopify GraphQL error: ' + JSON.stringify(json.errors));
  return json.data;
}

async function loadShop(shopifyDomain) {
  const snap = await db
    .collection('shops')
    .where('shopifyDomain', '==', shopifyDomain)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return prepareShopData(snap.docs[0].id, snap.docs[0].data(), process.env.SHOPIFY_ACCESS_TOKEN_KEY);
}

async function listCatalogs(shop) {
  const query = `
    query listCatalogs {
      catalogs(first: 50, type: MARKET) {
        nodes {
          id title status
          priceList { id name currency }
          ... on MarketCatalog { markets(first: 20) { nodes { id name } } }
        }
      }
    }`;
  return (await shopifyGraphQL(shop, query, {})).catalogs.nodes;
}

// Pull the WHOLE price list (paginated) so we never depend on a query-string filter.
async function getAllFixedPrices(shop, priceListId) {
  const map = new Map();
  let cursor = null;
  for (;;) {
    const query = `
      query pl($id: ID!, $after: String) {
        priceList(id: $id) {
          prices(first: 250, originType: FIXED, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes { price { amount currencyCode } variant { id } }
          }
        }
      }`;
    const data = await shopifyGraphQL(shop, query, {id: priceListId, after: cursor});
    const conn = data.priceList && data.priceList.prices;
    if (!conn) break;
    conn.nodes.forEach(n => map.set(convertId(n.variant.id), parseFloat(n.price.amount)));
    if (!conn.pageInfo.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
  }
  return map;
}

async function run() {
  const [domain] = process.argv.slice(2);
  const shop = await loadShop(domain);
  if (!shop) {
    console.log('no shop');
    process.exit(1);
  }
  const catalogs = await listCatalogs(shop);
  console.log('=== MARKET CATALOGS ===');
  catalogs.forEach(c => {
    const markets = ((c.markets && c.markets.nodes) || []).map(m => m.name).join(', ');
    console.log(
      `${c.id} "${c.title}" status=${c.status} priceList=${c.priceList ? c.priceList.id + ' ' + c.priceList.currency : 'none'} markets=[${markets}]`
    );
  });

  const priceMaps = {};
  for (const c of catalogs) {
    if (!c.priceList) continue;
    priceMaps[c.priceList.id] = {
      catalog: c,
      prices: await getAllFixedPrices(shop, c.priceList.id)
    };
    console.log(
      `loaded priceList ${c.priceList.id} "${c.title}" ${c.priceList.currency}: ${priceMaps[c.priceList.id].prices.size} FIXED prices`
    );
  }

  // ---- cross-check catalogs sharing a currency ----
  console.log('\n=== SAME-CURRENCY CATALOG DIVERGENCE ===');
  const byCur = {};
  Object.entries(priceMaps).forEach(([plId, v]) => {
    const cur = v.catalog.priceList.currency;
    (byCur[cur] = byCur[cur] || []).push(plId);
  });
  Object.entries(byCur).forEach(([cur, ids]) => {
    if (ids.length < 2) return;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = priceMaps[ids[i]], b = priceMaps[ids[j]];
        const keys = new Set([...a.prices.keys(), ...b.prices.keys()]);
        let same = 0, diff = 0, onlyA = 0, onlyB = 0;
        const diffs = [];
        keys.forEach(k => {
          const pa = a.prices.get(k), pb = b.prices.get(k);
          if (pa == null) return onlyB++;
          if (pb == null) return onlyA++;
          if (Math.abs(pa - pb) < 0.005) same++;
          else {
            diff++;
            if (diffs.length < 30) diffs.push(`${k}: ${a.catalog.title}=${pa} vs ${b.catalog.title}=${pb}`);
          }
        });
        console.log(
          `${cur}: "${a.catalog.title}" vs "${b.catalog.title}" -> same=${same} diff=${diff} onlyIn_${a.catalog.title}=${onlyA} onlyIn_${b.catalog.title}=${onlyB}`
        );
        diffs.forEach(d => console.log('   ' + d));
      }
    }
  });

  // ---- scan contracts ----
  const snap = await db
    .collection('subscriptionContracts')
    .where('shopId', '==', shop.id)
    .get();
  console.log(`\n=== CONTRACTS (${snap.size} total docs for shop) ===`);
  const byStatus = {};
  const rows = [];
  const missingFixed = [];
  let scanned = 0;
  snap.docs.forEach(doc => {
    const d = doc.data();
    byStatus[d.status] = (byStatus[d.status] || 0) + 1;
    if (d.status !== 'ACTIVE' && d.status !== 'PAUSED') return;
    scanned++;
    const currency = d.currency || d.currencyCode;
    const country = (d.deliveryMethod && d.deliveryMethod.countryCode) || d.countryCode;
    const cands = Object.entries(priceMaps).filter(
      ([, v]) => v.catalog.priceList.currency === currency
    );
    const products = d.products || [];
    products.forEach((p, idx) => {
      const vid = convertId(p.variant && p.variant.id);
      if (!vid) return;
      const bp = Number(p.basePrice);
      const cp = Number(p.currentPrice);
      if (!(bp > 0)) return;
      const perCat = cands.map(([plId, v]) => ({
        title: v.catalog.title,
        fixed: v.prices.has(vid) ? v.prices.get(vid) : null
      }));
      const found = perCat.filter(x => x.fixed !== null);
      if (!found.length) {
        missingFixed.push({
          contractId: d.subscriptionContractId,
          status: d.status,
          currency,
          country,
          vid,
          title: `${p.title}/${p.variant && p.variant.title}`,
          bp
        });
        return;
      }
      const mismatchAll = found.every(x => Math.abs(bp - x.fixed) >= 0.01);
      if (!mismatchAll) return;
      rows.push({
        contractId: d.subscriptionContractId,
        docId: doc.id,
        status: d.status,
        currency,
        country,
        idx,
        vid,
        title: `${p.title} / ${p.variant && p.variant.title}`,
        qty: p.quantity || 1,
        bp,
        cp,
        variantPrice: Number(p.variant && p.variant.price),
        cats: found.map(x => `${x.title}=${x.fixed}`).join(' '),
        fixed: found[0].fixed
      });
    });
  });

  console.log('by status:', JSON.stringify(byStatus), 'scanned ACTIVE+PAUSED:', scanned);

  console.log(`\n=== LINES WHERE basePrice != PriceList FIXED (all matching catalogs) : ${rows.length} ===`);
  const byContract = {};
  rows.forEach(r => (byContract[r.contractId] = byContract[r.contractId] || []).push(r));
  let totalOver = 0, totalUnder = 0;
  Object.entries(byContract).forEach(([cid, rs]) => {
    console.log(`\ncontract ${cid} doc=${rs[0].docId} ${rs[0].status} ${rs[0].currency} country=${rs[0].country}`);
    rs.forEach(r => {
      const ratio = r.bp > 0 && r.cp > 0 ? r.cp / r.bp : 1;
      const expectedCur = r.fixed * ratio;
      const delta = (r.cp - expectedCur) * r.qty;
      if (delta > 0) totalOver += delta;
      else totalUnder += delta;
      console.log(
        `  [${r.idx}] ${r.title} vid=${r.vid} qty=${r.qty} basePrice=${r.bp} currentPrice=${r.cp} variant.price=${r.variantPrice} | catalog: ${r.cats} | expectedCurrent=${expectedCur.toFixed(2)} deltaPerCycle=${delta.toFixed(2)}`
      );
    });
  });
  console.log(
    `\nContracts affected: ${Object.keys(byContract).length}  lines: ${rows.length}  OVERCHARGE total/cycle=${totalOver.toFixed(2)}  UNDERCHARGE total/cycle=${totalUnder.toFixed(2)}`
  );

  console.log(`\n=== LINES WITH NO FIXED PRICE IN ANY MATCHING CATALOG : ${missingFixed.length} ===`);
  const mg = {};
  missingFixed.forEach(m => (mg[m.contractId] = mg[m.contractId] || []).push(m));
  Object.entries(mg).forEach(([cid, ms]) => {
    console.log(`contract ${cid} ${ms[0].status} ${ms[0].currency} country=${ms[0].country}`);
    ms.forEach(m => console.log(`   vid=${m.vid} ${m.title} basePrice=${m.bp}`));
  });
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
