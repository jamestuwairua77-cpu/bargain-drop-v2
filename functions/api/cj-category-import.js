// Category-driven CJ → Shopify bulk importer (background, idempotent, resumable).
//
// Discovers products across 5 CJ top-level categories, pulls full detail
// (variants + images + description) for each, and bulk-creates them in Shopify
// as published products with flat 2.5x USD→AUD pricing. Progress is persisted
// to GitHub so overlapping/repeated runs are safe and it self-continues.
//
// Triggered by GitHub Actions cron with ADMIN_PIN, so it runs fully in the
// background with no browser page required.

import { corsHeaders, isAdmin, adminDenied, shopifyFetch, cjFetchMulti, ghRead, ghWrite, appendSyncLog } from '../_sync-lib.js';

// ── Config ────────────────────────────────────────────────────────────────
const STATE_PATH = 'data/cj-category-import-state.json';
const MARKUP = 2.5;              // flat 2.5x (USD cost → AUD retail, no conversion)
const AUD_FLOOR = 9.95;          // minimum retail (AUD)
const MAX_PER_RUN = 80;          // products per run: fits in one Pages Function request
const BATCH = 200;               // max products bundled into ONE Shopify bulk-create call
const LIST_PAGE_SIZE = 10;       // CJ listV2 hard cap
const SHOP_INVENTORY_QTY = 100;  // seed stock so products are live & trackable

// ── Category map (leaf subcategory UUIDs per top-level category) ─────────
const CATEGORY_MAP = {
"Toys, Kids & Babies": ["6614840A-DB50-4FBB-80FD-705F4FD59BFA", "835F7743-8432-4D0F-90F0-E76C89F7C5B7", "AEABDF3C-35E9-4BDA-8F5B-DA602BC5B9C8", "DD918287-C279-466A-B9C6-56079DE4B37A", "F18491A9-2F33-4D85-A154-78EE4CD2AD33", "2502190154341624400", "5AF1783E-547C-44E5-AD8A-82B354860BCB", "62A4235C-31EE-40E3-9D61-8F310470FEBC", "929F5F58-AFBB-43AE-B1BB-CC6AA3844530", "C6FBABFE-2E34-4BD8-B643-C3060E9D343B", "C7FEF0C8-C59D-44DC-9715-7C377441ECFE", "7BF9295D-69A0-483C-871C-9E3AF2A3496C", "8DA1BB63-9FC2-4817-9271-3474CDBDDB30", "BB0B0BAD-326B-4328-B1BF-319C420DF782", "BE16F1EB-5C31-4A1E-B80F-F1905F046E7F", "C938C806-CB88-46AB-B782-89ECD0B25E25", "D91A4505-6495-4DFD-9984-C8E728913127", "04D82B39-7CF8-4CA5-ABC9-279181DE7E26", "80304DEB-99FB-4E29-9065-A99F732702C4", "8F8C7970-3965-4EB6-8E13-ED77EB686DBA", "A91DDCDF-A80E-40EE-ADB6-C3CB20CCB07E", "B34957D5-3AF6-4BE7-AC9F-72BAB8433CB6", "B81FEFAC-C995-4665-8154-631E447F7236", "0B08F5C8-0381-446D-A1C0-B90F69F45041", "4065FFF7-4AAA-4CFA-B04B-639C93624469", "5C374126-AE88-4617-B732-011174077E00", "77A1D79C-B67E-42C0-850F-00005042548C", "CBAB567C-28EA-4916-97C9-786EEA80A3B8", "1357514957859721216", "2601070549181635500", "5795C34B-0DF0-4838-A78C-C125AA3BED18", "5CC68C6B-8D69-41B2-838A-A98CB7DDD744", "6ED3E32C-89DD-4DD1-A991-FEAA4F3C1BFD", "713CBA54-B38E-4C86-9323-1252113E437F", "88856603-65DA-419C-8C64-4C1E91A9E983", "C421D769-76CC-4515-909E-4E7167EE6ABE"],
  "Consumer Electronics": ["40CC2ED1-8998-4515-9139-787CC25D42A7", "599DFE31-C6AD-42D2-93AA-762126BBA475", "66D0D817-353B-492E-87A5-024091FF9000", "6DB79FAF-593D-4F52-B6FF-AB1D14331862", "A0D39205-3770-4F0B-91BD-65E711263577", "AD2B299F-EC10-4209-998A-8916AE4D4900", "0AC6B44A-12CC-456F-831F-54064C77D303", "0F932A8E-47CB-4CB6-B7C3-C4D9F7CF62EC", "3A557A5A-FDAF-48BF-A989-3ED90B9ED228", "872FA218-4F48-4F03-8FEE-ADE7CF21BC45", "A9B643D0-7AA9-4703-A59B-D01C4526CDF9", "D6C23AAE-B8EE-481C-9B61-34557971D45F", "D8515A8C-ECAC-422B-9963-14D7B07E10DB", "11D33F89-9B90-4D1A-B977-DE229BAA7E86", "36F73513-6A5A-445D-87F9-BF3D6629E649", "4336FAFE-B9C9-4673-8706-BCFAE1448DA2", "895CF515-0F6B-481D-8A32-604EDCBEFBED", "C83EF2A0-8FA3-4713-9901-2FD6E4554D97", "E95322D2-FF23-4837-A0C0-0CA686B9F062", "11D96803-A0A3-4175-B49B-2102EC285965", "907BBB40-C131-4D3C-BA05-794D47EEBC90", "A2B55BEF-9B7D-44A0-8E80-A14FFFBBBD94", "AA40156F-A334-475E-9CA0-7E5520645980", "AD21D6F7-42CB-44E7-89B2-542692C7D101", "DE5A9724-8B92-404F-B15E-1FCAD6594BAF", "1F23F16D-0A39-4D38-AB9C-1F21EEDEBEDD", "2F6CCFAA-853F-41EF-8B91-24028A333948", "56892B7E-0C59-4DAB-8336-57C6CA548043", "A8EBE688-6787-4ECF-8E5A-8802AC9C2135", "A96C59E8-C39A-4C8E-BA75-5B4AA347FCCC", "8FD4CA46-AA88-4CDC-8EBA-EBD8412152E2", "C1AB7563-AED4-44D8-9F01-05BD91C65307", "DAECCC3B-13D8-4978-86A8-61D3DF186134", "EE64B306-1A1F-4879-A080-BF0ACA4400A9", "F34292A3-2774-4380-9ADF-78F90AB90863"],
  "Automobiles & Motorcycles": ["255A489E-8518-4E31-AC84-A2E8EB645C78", "ED1BECF0-0B39-41EE-968C-2948FED771C3", "ED8B5070-DA72-451A-A0BF-DBE65FDA465E", "090E48F4-B406-438B-9EBF-D52450AC370A", "2601070551311618400", "2601070551481626500", "309854A6-BDC2-4F52-80D8-93E5109B3A53", "5559DD57-7F12-44BC-9C29-9E9BD1CDB029", "808A409E-8E16-43A8-879A-153672135DB9", "D44C3391-0AF1-455A-A671-29214DA68F27", "00E6FC51-B865-4D50-9EF9-21E7050F5653", "3627FAE5-F4A4-4227-8066-A7D460BA6E21", "77A90826-779B-47DD-AB79-8FEE91AE0A3E", "D24CEB99-1ABB-4643-B0B6-33C60AF9B101", "10B94E89-4E22-4BC8-8E6C-9A5CB2119F03", "2A64C22F-F04A-4AAA-9C1C-8AF89323FB63", "4B2ED078-B253-4105-98A2-1203875448F5", "5D2C4AD8-AF51-4258-A329-45A675E2805D", "5F6BBD36-AFDE-4433-81D1-8684781E04DE", "A3E67E41-8A5C-449F-8C22-739889760AAD", "B39B6F95-9C89-4D6C-9E98-1633DA6A51CF", "B43C754E-838C-4028-99E7-D3D0E029C68C", "BCC009E7-B5FF-4E4B-8D1D-7DE5B5DBFAE0", "C7B399B2-4D26-4363-8062-C6F451DA55B3", "11B12208-A434-467B-8AD3-DC65E32EC2E5", "45EA5F91-6654-48C5-8D3A-0E5E97156F16", "482DBC73-CA1B-4FF5-A943-D282D7FBC18F", "4FB5AA23-AA52-4928-A653-616ED3347074", "628E44C8-73BF-4D4C-87C9-0B4F9A60D0C3", "683FC820-3B12-4F92-A250-FF213D8D3899", "9EB55782-830D-41A5-B29C-B5A13520923E", "28508884-954A-4F76-83BC-FAEA0E0C43FE", "3166F1D4-5213-42D7-A2B6-670ACF0D489A", "9F6B73A9-0E4F-4EE9-978F-69984CF3E300", "C8B7A95E-0E98-41F8-892B-35B5679713A6", "CAE924E7-EB56-4299-A5B0-8DB86C9ECB52", "CB255FA6-9B4C-4542-82CC-F774DE8F8C68", "E987126C-FF3D-4BCF-B496-40990D39D2F8", "FF672D98-F632-4C18-ABA3-E86C9C8951FE"],
  "Phones & Accessories": ["00134C46-B7DF-4500-A3D9-ABB7B779EFD0", "491E5474-524C-4666-BDD7-4E35E38900EA", "51D68796-F1B5-4BDC-B9E0-32C3D9FF6994", "82643737-E055-4FDF-AD69-4E2C3FB6970B", "9170B3F9-5B9C-4C39-8CD6-7DC00E481D47", "B200FABB-A76B-4750-9957-FEA3DCB21F1F", "0480D511-C923-4F7A-90F2-435F439DFE00", "0B52E7DF-CBBD-4C4C-A43D-46B53056313C", "1EE2EA4E-87BC-4108-BBF3-0A98A4A1EF89", "2CF32BF2-246D-4EC7-A060-6835C7EFD4AD", "496A6FD1-4D2C-4E96-93B3-1BEBF5D7DA34", "4E8B1C9C-3126-4115-A5CA-357A8C164AD2", "65AC23D3-BA63-438B-B8FE-71E117D717AF", "7CB75550-C920-47A8-8A65-27C34ED1C05E", "7FD2D2BD-852D-4028-870E-AEB73594A95E", "948E69C1-D825-4797-B7F9-8D4FC69A20DA", "C19F0351-2A98-43FF-BEA2-952BA6F75997", "DD47EFC1-E65E-469A-94DA-658707A124B3", "E6C70353-4E58-4253-A840-3760667A9BE4", "F77E8C4C-649A-4553-BD44-7604FADBB0BD", "14CC2DBB-21D3-4D3B-A263-75BF069ED074", "2C46D1EB-148D-4DF3-8F23-EC0C5D5FDC1D", "3F222BC3-4864-487B-8E89-CE516D55638B", "4C9F6BA4-70BB-49BC-A350-3D5E4E685B84", "5FE5E389-0B85-4592-A08D-B4AD79B164D4", "FF1E0375-F5BF-40D9-8B18-708F79D52E44", "0AADEC4E-024A-41DF-8801-4A0204F0E568", "20278181-7942-4E22-B3CB-7CDFEE89297E", "40FFAFDA-47CD-473A-B654-94D1923B15CF", "B1C9BC0B-A019-48C5-A06A-F25FB45DD9A9", "D0E7FF56-E94C-460D-8DB1-6695458475F4", "F22F83A5-633C-4269-85A7-3FE844BD555F"],
  "Computer & Office": ["2252588B-72E3-4397-8C92-7D9967161084", "2502190343061609600", "874B7C94-D225-43FE-AB79-FFAF1B800651", "C7365895-913A-4078-9946-681EFD45D2B8", "D8BBE038-9ECD-4698-8CB1-DE63E27F33C7", "E33443F7-144C-4CBE-8D34-C1B6256A6325", "F8024D10-AB96-4558-AC79-C49625F768DA", "0598E853-9BF7-4939-A571-2407E819C91E", "0ACCE01C-2C83-4767-B9E8-736B7E0CC38D", "0B50EC4B-F78C-4D2D-839C-4767D6B4B7C7", "28F0E5A1-0A9A-43C5-8197-F1420A9BD10B", "BB57B72C-A8C6-40FF-BCBB-EAE0251273C6", "4D3B9582-E92E-46BF-B00E-715E70FB4742", "591E8920-019B-42FA-AE0B-420052E6C4F0", "76B88FB8-9B37-4B55-AA09-082C5627DFE8", "7E65A403-CF6E-4B55-96FF-B7C3C376A47A", "C62BC6BF-BA2B-41ED-AB12-599A6D7FCAA5", "24FAA1AB-BF10-41ED-8405-A9FA53031B3A", "3F3EFC96-82B8-44C1-BF7A-2E3E7083A875", "74B144C9-321D-4E78-986C-757BA551DD8C", "87A618B5-7CB0-4AF7-BCF8-9E9455F06B7E", "EDC3EDAF-1ED7-4776-8416-E9F8F0A5B4C6", "1E9A3E86-7E5A-439E-9B33-CBD495421F0B", "25E64DFD-1ED3-4171-86CD-0C2F40052F3B", "7D962F30-E20E-4DE9-8911-EB8AB078FB23", "D190FBF9-A352-48BD-9F4B-B6AB432988E5", "E3963C40-89BE-46AC-985D-A86FA417F6B8", "4F7EE88B-4209-42E8-A501-5F634B58BB35", "76CD1BD4-2A0A-4D72-913C-6DAADD7E9EDB", "9A33970D-F4BC-48EC-BEAB-FEC19C130963", "A77A4E59-D931-4BBE-9D48-FF995C481B66", "C019C59C-C274-44F9-B04B-5520F1EBE5FA"],
};

// ── CJ price: USD cost × 2.5 (no extra AUD conversion) ───────────────────
function computePrice(usdCost) {
  const c = parseFloat(usdCost) || 0;
  if (c <= 0) return null;
  let raw = c * MARKUP;
  if (raw < AUD_FLOOR) raw = AUD_FLOOR;
  let rr = Math.floor(raw) + 0.95;      // .95 psychological pricing
  if (rr < raw - 0.02) rr += 1.0;
  return +rr.toFixed(2);
}

function extractImages(p) {
  const out = [];
  const seen = new Set();
  const push = (u) => { if (u && typeof u === 'string' && !seen.has(u)) { seen.add(u); out.push({ src: u }); } };
  for (const key of ['productImageSet', 'productImage']) {
    const v = p[key];
    const arr = Array.isArray(v) ? v : (typeof v === 'string' ? (() => { try { return JSON.parse(v); } catch { return []; } })() : []);
    for (const u of arr) push(u);
  }
  if (p.bigImage) push(p.bigImage);
  return out;
}

function buildShopifyProduct(pid, d) {
  const variants = Array.isArray(d.variants) ? d.variants : [];
  if (!variants.length) return null;

  const keyParts = variants.map(v => String(v.variantKey || '').split('-').length);
  const maxParts = Math.max(...keyParts, 1);
  const optionNames = maxParts === 1 ? ['Title']
    : maxParts === 2 ? ['Color', 'Size']
    : ['Color', 'Size', 'Style'].slice(0, maxParts);

  const shopVariants = variants.map(v => {
    const parts = String(v.variantKey || '').split('-');
    const ov = {};
    optionNames.forEach((_, i) => { ov['option' + (i + 1)] = parts[i] != null ? String(parts[i]) : (i === 0 ? 'Default Title' : ''); });
    const price = computePrice(v.variantSellPrice);
    return {
      ...ov,
      price: price != null ? String(price) : '0',
      compare_at_price: price != null ? String(price) : undefined,
      sku: v.variantSku != null ? String(v.variantSku) : undefined,
      grams: v.variantWeight != null ? Number(v.variantWeight) : undefined,
      inventory_management: 'shopify',
      inventory_policy: 'deny',
      inventory_quantity: SHOP_INVENTORY_QTY,
    };
  });

  const title = d.productNameEn || d.productName || 'Imported Product';
  const options = optionNames.map((name, i) => ({
    name,
    position: i + 1,
    values: [...new Set(shopVariants.map(sv => sv['option' + (i + 1)]))],
  }));

  const type = d.categoryName || d.entryNameEn || d.entryName || '';

  return {
    title,
    body_html: d.description || '',
    vendor: d.supplierName || 'CJ Dropshipping',
    product_type: type,
    tags: `cj-import, cj-pid-${pid}`,
    variants: shopVariants,
    options: options.length ? options : undefined,
    images: extractImages(d),
    status: 'active',
    published: true,
  };
}

// ── State helpers (GitHub-backed, resumable) ──────────────────────────────
async function loadState(env) {
  const r = await ghRead(env, STATE_PATH).catch(() => null);
  if (r && r.content) {
    try { return JSON.parse(atob(r.content.replace(/\n/g, ''))); } catch {}
  }
  return { donePids: {}, fetchedPids: {}, catCursor: {}, imported: 0 };
}

async function saveState(env, state) {
  const r = await ghRead(env, STATE_PATH).catch(() => null);
  const sha = r && r.sha ? r.sha : null;
  await ghWrite(env, STATE_PATH, JSON.stringify(state, null, 2), 'cj-category-import progress', sha);
}

// ── Discovery: page listV2 for a category, return new (unfetched) pids ───
async function discoverPids(env, catName, subcats, state, budget) {
  const found = [];
  const startPage = state.catCursor[catName] || 1;
  let page = startPage;
  while (found.length < budget && page - startPage < 60) {
    const cid = subcats[(page - 1) % subcats.length];
    const res = await cjFetchMulti(env, `/product/listV2?pageNum=${page}&pageSize=${LIST_PAGE_SIZE}&categoryId=${cid}`);
    const content = (res && res.data && res.data.content) || [];
    let n = 0;
    for (const grp of content) {
      for (const pl of (grp.productList || [])) {
        const pid = String(pl.id || '');
        if (pid && !state.fetchedPids[pid] && !state.donePids[pid]) { found.push(pid); n++; }
      }
    }
    page++;
    state.catCursor[catName] = page;
    if (n < LIST_PAGE_SIZE) break;
    await new Promise(r => setTimeout(r, 300));
  }
  return found;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();

  const url = new URL(request.url);
  const wantReset = url.searchParams.get('reset') === '1';
  const limit = Math.max(1, Math.min(MAX_PER_RUN, parseInt(url.searchParams.get('limit') || String(MAX_PER_RUN), 10)));

  const state = await loadState(env);
  if (wantReset) {
    Object.assign(state, { donePids: {}, fetchedPids: {}, catCursor: {}, imported: 0 });
  }

  const summary = { run: new Date().toISOString(), discovered: 0, fetched: 0, created: 0, skipped: 0, totalImported: state.imported || 0, errors: [] };

  // 1. Discover pids across categories until quota met or exhausted.
  const catNames = Object.keys(CATEGORY_MAP);
  const discovered = [];
  let exhausted = 0;
  while (discovered.length < limit && exhausted < catNames.length) {
    let progressed = false;
    for (const cat of catNames) {
      if (discovered.length >= limit) break;
      const fresh = await discoverPids(env, cat, CATEGORY_MAP[cat], state, limit - discovered.length);
      if (fresh.length) { discovered.push(...fresh); progressed = true; }
      else exhausted++;
    }
    if (!progressed) break;
  }
  summary.discovered = discovered.length;

  // 2. Fetch full detail for each pid, build Shopify products.
  const toCreate = [];
  for (const pid of discovered) {
    if (toCreate.length >= limit) break;
    try {
      const d = await cjFetchMulti(env, `/product/query?pid=${pid}`);
      if (!d || d.code !== 200 || !d.data) { state.fetchedPids[pid] = true; state.donePids[pid] = 'nodata'; summary.skipped++; continue; }
      const prod = buildShopifyProduct(pid, d.data);
      if (!prod) { state.fetchedPids[pid] = true; state.donePids[pid] = 'novariants'; summary.skipped++; continue; }
      toCreate.push(prod);
      state.fetchedPids[pid] = true;
      summary.fetched++;
      await new Promise(r => setTimeout(r, 220));
    } catch (e) {
      summary.errors.push({ pid, error: String(e && e.message) });
    }
  }

  // 3. Bulk-create in Shopify — bundle up to BATCH products per request,
  //    each carrying its full variants + images + description so none are lost.
  for (let i = 0; i < toCreate.length; i += BATCH) {
    const chunk = toCreate.slice(i, i + BATCH);
    const r = await shopifyFetch(env, `/products.json`, {
      method: 'POST',
      body: JSON.stringify({ products: chunk }),
    });
    if (r.ok) {
      const out = r.body && (Array.isArray(r.body.products) ? r.body.products : (r.body.product ? [r.body.product] : []));
      const made = out.length || 1;
      summary.created += made;
      for (const p of chunk) {
        const m = String(p.tags || '').match(/cj-pid-([^,\s]+)/);
        if (m) state.donePids[m[1]] = true;
      }
    } else {
      const msg = String((r.body && (r.body.errors || r.body.error || r.body.message)) || r.status);
      summary.errors.push({ batch: i, error: 'shopify bulk create: ' + msg });
      for (const p of chunk) {
        const m = String(p.tags || '').match(/cj-pid-([^,\s]+)/);
        if (m) delete state.fetchedPids[m[1]]; // un-fetch to retry next run
      }
    }
    await new Promise(r => setTimeout(r, 400));
  }

  state.imported = (state.imported || 0) + summary.created;
  summary.totalImported = state.imported;

  await saveState(env, state).catch(e => summary.errors.push({ phase: 'save', error: String(e && e.message) }));

  summary.finished = new Date().toISOString();
  try { await appendSyncLog(env, { type: 'cj-category-import', ...summary }); } catch {}

  return new Response(JSON.stringify(summary), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
