// Cloudflare Pages Function: /api/reimport-products (UPDATE IN PLACE)
// Fixes flattened products by updating their existing Shopify product with correct
// options (Color + Size) and variants (color/size/price/sku) fetched fresh from CJ.
// Keeps the SAME Shopify product id (update-in-place, no delete/create).
//
// GET ?dryRun=1        -> count only
// GET ?run=1&limit=N   -> update up to N products in place
// Resumable via data/reimport-progress.json.

import { corsHeaders, cjFetch, cjFetchMulti, shopifyFetch, ghRead, ghWrite } from '../_sync-lib.js';

const RAW = 'https://raw.githubusercontent.com/jamestuwairua77-cpu/bargain-drop-v2/main/all-products.json';
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

function needsReimport(p){
  const v=p.variants||[];
  if(!v.length) return false;
  const noSize = !v.some(x=>x.option2);
  const hasCJK = v.some(x=>/[\u4e00-\u9fff]/.test(String(x.option1||'')));
  return noSize || hasCJK;
}

async function reimport(env, p){
  const sku = (p.variants&&p.variants[0]&&p.variants[0].sku) || '';
  if(!sku) return { ok:false, skip:'no-sku' };
  // resolve pid
  const lr = await cjFetchMulti(env, `/product/list?productSku=${encodeURIComponent(sku)}&pageNum=1&pageSize=10`);
  const list=(lr&&lr.data&&lr.data.list)||[];
  if(!list.length) return { ok:false, skip:'no-pid' };
  const pid = list[0].pid;
  await new Promise(r=>setTimeout(r,150));
  const detail = await cjFetchMulti(env, `/product/query?pid=${encodeURIComponent(pid)}`);
  const cj = detail && detail.data;
  const cjv = (cj && cj.variants) || [];
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
  const images=[]; const seen=new Set();
  const pusher=(u)=>{ if(u&&!seen.has(u)){seen.add(u);images.push({src:u});} };
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
    const saveProg=()=>ghWrite(env,'data/reimport-progress.json',JSON.stringify(prog),'auto: reimport progress',progDoc?progDoc.sha:undefined);

    if(dryRun) return new Response(JSON.stringify({ total:catalog.length, toReimport:todo.length }),{headers:{'Content-Type':'application/json',...corsHeaders()}});
    if(!run) return new Response(JSON.stringify({ total:catalog.length, toReimport:todo.length }),{headers:{'Content-Type':'application/json',...corsHeaders()}});

    const remaining=todo.filter(p=>!(String(p.id) in prog)).slice(0,limit);
    let ok=0, fail=0; const results=[];
    for(const p of remaining){
      const id=String(p.id);
      try{
        const r=await reimport(env,p);
        prog[id]=r.ok?{n:r.variants,colors:r.colors,sizes:r.sizes}:{skip:r.skip||r.error||'fail'};
        if(r.ok) ok++; else fail++;
        results.push({id, ok:r.ok, variants:r.variants, colors:r.colors, sizes:r.sizes, err:r.error||r.skip});
      }catch(e){ prog[id]={skip:'ex:'+String(e.message||e).slice(0,50)}; fail++; results.push({id, ok:false, err:String(e.message||e).slice(0,80)}); }
      await new Promise(r=>setTimeout(r,400));
    }
    // don't save progress here to avoid 2 writes / race; caller re-runs idempotently (needsReimport checks option2)
    return new Response(JSON.stringify({ processed:remaining.length, ok, fail, results }),{headers:{'Content-Type':'application/json',...corsHeaders()}});
  }catch(err){
    return new Response(JSON.stringify({error:String(err&&err.message||err),stack:String(err&&err.stack||'').slice(0,400)}),{status:500,headers:{'Content-Type':'application/json',...corsHeaders()}});
  }
}
