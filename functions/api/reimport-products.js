// Cloudflare Pages Function: /api/reimport-products (UPDATE IN PLACE)
// Fixes flattened products by updating their existing Shopify product with correct
// options (Color + Size) and variants (color/size/price/sku) fetched fresh from CJ.
// Keeps the SAME Shopify product id (update-in-place, no delete/create).
//
// GET ?dryRun=1        -> count only
// GET ?run=1&limit=N   -> update up to N products in place
// Resumable via data/reimport-progress.json.

import { corsHeaders, cjFetch, shopifyFetch, ghRead, ghWrite } from '../_sync-lib.js';

const RAW = 'https://raw.githubusercontent.com/jamestuwairua77-cpu/bargain-drop-v2/main/slim-products.json';
const MARKUP = 2.5;

const LETTER = new Set('XS S M L XL XXL XXXL 2XL 3XL 4XL 5XL 6XL 7XL 8XL 1X 2X 3X 4X 5X SM MED MEDIUM LARGE XLARGE FREE SIZE ONE SIZE'.split(' '));
function isSize(s){ if(!s) return false; const u=String(s).trim().toUpperCase(); if(LETTER.has(u)||u==='FREE SIZE'||u==='ONE SIZE') return true; if(/^\d{1,2}(\.\d+)?$/.test(String(s).trim())){const n=parseFloat(s);return n>=20&&n<=60;} return false; }
function parseVariantKey(key, nameEn=''){
  const k=(key||'').trim(); const parts=k?k.split(/[-/]/).map(s=>s.trim()).filter(Boolean):[];
  let color='', size='';
  if(parts.length===1) color=parts[0];
  else if(parts.length>=2){ if(isSize(parts[parts.length-1])){size=parts[parts.length-1];color=parts.slice(0,-1).join(' ');} else color=parts.join(' '); }
  if(!size&&nameEn){ const t=String(nameEn).split(/\s+/).filter(Boolean); if(t.length&&isSize(t[t.length-1])) size=t[t.length-1]; }
  return [color.trim(), size.trim()];
}

// Normalize a variant SKU to its CJ parent SKU for product/list lookup.
// Patterns: 'CJYD299047601AZ' -> 'CJYD2990476' (strip NNXX suffix)
//           'CJYD2990476-2'   -> 'CJYD2990476' (strip -N suffix)
//           'CJYD2990954'     -> unchanged (base)
function parentSku(sku) {
  if (!sku) return sku;
  let s = String(sku).trim();
  // strip '-N' suffix first
  s = s.replace(/-(\d+)$/, '');
  // strip trailing 'NNXX' where NN digits + XX letters (variant marker)
  s = s.replace(/(\d{2})([A-Z]{2})$/, '');
  return s;
}

function needsReimport(p){
  const v=p.variants||[];
  if(!v.length) return false;
  const noSize = !v.some(x=>x.option2);
  const hasCJK = v.some(x=>/[\u4e00-\u9fff]/.test(String(x.option1||'')));
  return noSize || hasCJK;
}

async function reimport(env, p){
  // Build a SMALL candidate set (max 2): the first variant's parent SKU + the first raw SKU.
  // We only try the parent (base) SKU — querying every variant SKU burns subrequests/points.
  const firstRaw = (p.variants||[]).map(v=>v.sku).filter(Boolean)[0];
  const candidates = [];
  if (firstRaw) {
    const ps = parentSku(firstRaw);
    if (ps && !candidates.includes(ps)) candidates.push(ps);
    if (firstRaw !== ps && !candidates.includes(firstRaw)) candidates.push(firstRaw);
  }
  if (!candidates.length) return { ok:false, skip:'no-sku' };
  // Single 10-point call: /product/query?productSku=<parentSku> returns full product + variants.
  let cj = null;
  for (const sku of candidates) {
    const r = await cjFetch(env, `/product/query?productSku=${encodeURIComponent(sku)}`);
    if (r && r.data && r.data.variants && r.data.variants.length) { cj = r.data; break; }
  }
  if (!cj) return { ok:false, skip:'no-pid' };
  const cjv = cj.variants || [];
  if(!cjv.length) return { ok:false, skip:'no-variants' };
  await new Promise(r=>setTimeout(r,150));

  // existing variants by id + by sku (map old Shopify variants for id preservation)
  const existingByOpt1 = {};
  for(const v of (p.variants||[])){ const c=String(v.option1||''); if(c && !(c in existingByOpt1)) existingByOpt1[c]=v; }

  // build new options + variant list
  const colors=[], sizes=[], seenC=new Set(), seenS=new Set();
  const colorImg=new Map();
  for(const v of cjv){
    const [color,size]=parseVariantKey(v.variantKey, v.variantNameEn||v.variantName);
    const c=color||(v.variantNameEn||'Default'); const sz=size||'';
    if(c&&!seenC.has(c)){seenC.add(c);colors.push(c);}
    if(sz&&!seenS.has(sz)){seenS.add(sz);sizes.push(sz);}
    if(v.variantImage&&!colorImg.has(c)) colorImg.set(c,v.variantImage);
  }

  const variants = cjv.map(v=>{
    const [color,size]=parseVariantKey(v.variantKey, v.variantNameEn||v.variantName);
    const c=color||(v.variantNameEn||'Default');
    const price=((parseFloat(v.variantSellPrice)||parseFloat(cj.sellPrice)||0)*MARKUP).toFixed(2);
    const grams=Math.round(parseFloat(v.variantWeight)||0);
    // preserve existing Shopify variant id when the color matches (so we EDIT, not duplicate)
    const existing = existingByOpt1[c];
    const obj = {
      sku: v.variantSku, price,
      option1: c, option2: size||null, option3: null,
      grams, weight: grams/1000, weight_unit:'kg',
      inventory_management:'shopify', inventory_policy:'deny',
      fulfillment_service:'manual', requires_shipping:true, taxable:true,
    };
    if(existing && existing.id) obj.id = existing.id;
    return obj;
  });

  const options=[];
  if(colors.length) options.push({name:'Color', values:colors});
  if(sizes.length) options.push({name:'Size', values:sizes});
  if(!options.length) options.push({name:'Title', values:['Default Title']});

  // images: color images first, then existing
  const images=[]; const seenImg=new Set();
  const pusher=(u)=>{ if(u&&!seenImg.has(u)){seenImg.add(u);images.push({src:u});} };
  for(const c of colors){ const u=colorImg.get(c); if(u) pusher(u); }
  try{ const set=Array.isArray(cj.productImageSet)?cj.productImageSet:(typeof cj.productImageSet==='string'?JSON.parse(cj.productImageSet):[]); for(const u of set) pusher(u); }catch{}
  for(const u of (p.images||[])) if(typeof u==='string') pusher(u);

  // PUT update in place (same product id)
  const payload = { product: { id: p.id, title: cj.productNameEn || p.title, options, variants, images } };
  const res = await shopifyFetch(env, `/products/${p.id}.json`, { method:'PUT', body:JSON.stringify(payload) });
  if(!res.ok) return { ok:false, error:'put '+res.status+' '+(res.body&&res.body.errors?JSON.stringify(res.body.errors).slice(0,150):'') };

  return { ok:true, id:p.id, variants:variants.length, colors:colors.length, sizes:sizes.length };
}

export async function onRequest(context){
  try{
    const { request, env } = context;
    if(request.method==='OPTIONS') return new Response(null,{status:200,headers:corsHeaders()});
    const url=new URL(request.url);
    const run=url.searchParams.get('run')==='1';
    const dryRun=url.searchParams.get('dryRun')==='1';
    const limit=parseInt(url.searchParams.get('limit')||'30',10);

    const rr=await fetch(RAW);
    if(!rr.ok) return new Response(JSON.stringify({error:'read '+rr.status}),{status:500,headers:{'Content-Type':'application/json',...corsHeaders()}});
    const catalog=await rr.json();
    const todo=catalog.filter(needsReimport);

    const progDoc=await ghRead(env,'data/reimport-progress.json');
    const prog=progDoc&&progDoc.content?JSON.parse(atob(progDoc.content.replace(/\n/g,''))):{};
    const attempts = prog.attempts || {};

    if(dryRun) return new Response(JSON.stringify({ total:catalog.length, toReimport:todo.length }),{headers:{'Content-Type':'application/json',...corsHeaders()}});
    if(!run) return new Response(JSON.stringify({ total:catalog.length, toReimport:todo.length }),{headers:{'Content-Type':'application/json',...corsHeaders()}});

    const MAX_ATTEMPTS = 3;
    const remaining=todo.filter(p=>(attempts[String(p.id)]||0) < MAX_ATTEMPTS).slice(0,limit);
    let ok=0, fail=0; const results=[];
    for(const p of remaining){
      const id=String(p.id);
      let r_ok = false;
      try{
        const r=await reimport(env,p);
        prog[id]=r.ok?{n:r.variants,colors:r.colors,sizes:r.sizes}:{skip:r.skip||r.error||'fail'};
        r_ok = !!r.ok;
        if(r_ok) ok++; else fail++;
        results.push({id, ok:r_ok, variants:r.variants, colors:r.colors, sizes:r.sizes, err:r.error||r.skip});
      }catch(e){ prog[id]={skip:'ex:'+String(e.message||e).slice(0,50)}; fail++; results.push({id, ok:false, err:String(e.message||e).slice(0,80)}); }
      if(!r_ok) attempts[id]=(attempts[id]||0)+1;
      await new Promise(r=>setTimeout(r,400));
    }
    prog.attempts = attempts;
    // Persist progress best-effort: pass the sha we read, and NEVER abort the run on a write conflict.
    // (The webhook auto-rebuilds + concurrent runs change data/ files, so writes can 422 on sha mismatch.
    //  The re-import itself is idempotent — a lost progress row just means a product gets retried.)
    try {
      await ghWrite(env, 'data/reimport-progress.json', JSON.stringify(prog), 'auto: reimport progress', progDoc && progDoc.sha);
    } catch (we) {
      // retry once after re-reading the latest sha
      try {
        const fresh = await ghRead(env, 'data/reimport-progress.json');
        await ghWrite(env, 'data/reimport-progress.json', JSON.stringify(prog), 'auto: reimport progress (retry)', fresh && fresh.sha);
      } catch {}
    }
    return new Response(JSON.stringify({ processed:remaining.length, ok, fail, results }),{headers:{'Content-Type':'application/json',...corsHeaders()}});
  }catch(err){
    return new Response(JSON.stringify({error:String(err&&err.message||err),stack:String(err&&err.stack||'').slice(0,400)}),{status:500,headers:{'Content-Type':'application/json',...corsHeaders()}});
  }
}
