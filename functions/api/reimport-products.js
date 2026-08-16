// Cloudflare Pages Function: /api/reimport-products
// Re-imports "flattened" products (no size / Chinese color names) from CJ so Shopify
// gets full variants (color + size + per-color image). For each product:
//   1. resolve its SKU -> CJ pid
//   2. DELETE the old flattened Shopify product
//   3. re-create it from CJ with correct variants (calls the same corrected logic)
//
// GET ?run=1&limit=N    -> re-import up to N products
// GET ?dryRun=1         -> list count only (no mutation)
// Resumable via data/reimport-progress.json.

import { corsHeaders, cjFetch, shopifyFetch, ghRead, ghWrite, appendSyncLog } from '../_sync-lib.js';

const RAW = 'https://raw.githubusercontent.com/jamestuwairua77-cpu/bargain-drop-v2/main/all-products.json';
const MARKUP = 2.5;
const LOCATION_ID = 91452932227;

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
  // needs re-import if no variant has a size, OR option1 contains CJK (untranslated)
  const noSize = !v.some(x=>x.option2);
  const hasCJK = v.some(x=>/[\u4e00-\u9fff]/.test(String(x.option1||'')));
  return noSize || hasCJK;
}

async function reimport(env, p){
  const sku = (p.variants&&p.variants[0]&&p.variants[0].sku) || '';
  if(!sku) return { ok:false, skip:'no-sku' };
  // resolve pid
  const lr = await cjFetch(env, `/product/list?productSku=${encodeURIComponent(sku)}&pageNum=1&pageSize=10`);
  const list=(lr&&lr.data&&lr.data.list)||[];
  if(!list.length) return { ok:false, skip:'no-pid' };
  const pid = list[0].pid;
  await new Promise(r=>setTimeout(r,200));

  // fetch full detail + variants
  const detail = await cjFetch(env, `/product/query?pid=${encodeURIComponent(pid)}`);
  const cj = detail && detail.data;
  const cjv = (cj && cj.variants) || [];
  if(!cjv.length) return { ok:false, skip:'no-variants' };
  await new Promise(r=>setTimeout(r,200));

  // build color->image map + option slots
  const slots=[[],[]]; const colorImg=new Map(); const s1=new Set(), s2=new Set();
  for(const v of cjv){
    const [color,size]=parseVariantKey(v.variantKey, v.variantNameEn||v.variantName);
    const c=color||(v.variantNameEn||'Default');
    const sz=size||'';
    if(c&&!s1.has(c)){s1.add(c);slots[0].push(c);}
    if(sz&&!s2.has(sz)){s2.add(sz);slots[1].push(sz);}
    if(v.variantImage&&!colorImg.has(c)) colorImg.set(c, v.variantImage);
  }

  // images: colors first
  const images=[]; const seen=new Set();
  const pusher=(u)=>{ if(u&&!seen.has(u)){seen.add(u);images.push({src:u});} };
  for(const c of slots[0]){ const u=colorImg.get(c); if(u) pusher(u); }
  // productImageSet / productImage / bigImage
  try{ const set=Array.isArray(cj.productImageSet)?cj.productImageSet:(typeof cj.productImageSet==='string'?JSON.parse(cj.productImageSet):[]); for(const u of set) pusher(u); }catch{}
  if(p.image&&!seen.has(p.image)) pusher(p.image);
  if(cj.bigImage) pusher(cj.bigImage);

  // shopify variants
  const shopifyVariants = cjv.map(v=>{
    const [color,size]=parseVariantKey(v.variantKey, v.variantNameEn||v.variantName);
    const price=((parseFloat(v.variantSellPrice)||parseFloat(cj.sellPrice)||0)*MARKUP).toFixed(2);
    const grams=Math.round(parseFloat(v.variantWeight)||0);
    return { sku:v.variantSku, price, option1:color||'Default', option2:size||null, option3:null,
      grams, weight:grams/1000, weight_unit:'kg', inventory_management:'shopify', inventory_policy:'deny',
      fulfillment_service:'manual', requires_shipping:true, taxable:true };
  });

  const finalOptions=[];
  if(slots[0].length) finalOptions.push({name:'Color', values:slots[0]});
  if(slots[1].length) finalOptions.push({name:'Size', values:slots[1]});
  if(!finalOptions.length) finalOptions.push({name:'Title', values:['Default Title']});

  // create new product
  const payload = { product: {
    title: cj.productNameEn || p.title || `CJ ${pid}`,
    body_html: cj.description || p.body_html || '',
    vendor: 'CJ Dropshipping',
    product_type: cj.categoryName || p.product_type || '',
    tags: `cj-import,cj-pid-${pid}`,
    status: 'active',
    options: finalOptions,
    variants: shopifyVariants,
    images,
  }};

  const createRes = await shopifyFetch(env, '/products.json', { method:'POST', body:JSON.stringify(payload) });
  if(!createRes.ok) return { ok:false, error:'create '+createRes.status+' '+(createRes.body&&createRes.body.errors?JSON.stringify(createRes.body.errors).slice(0,150):'') };
  const created = createRes.body.product;

  // assign per-color images to variants (image.variant_ids)
  try {
    const vidByColor=new Map();
    for(const v of created.variants){ const key=v.option1; if(key&&!vidByColor.has(key)) vidByColor.set(key,v); }
    const imgUpd=[];
    for(const [color,url] of colorImg){
      const si=created.images.find(im=>im.src===url); if(!si) continue;
      const vv=vidByColor.get(color); if(vv) imgUpd.push({id:si.id, variant_ids:[vv.id], position:si.position});
    }
    if(imgUpd.length) await shopifyFetch(env, `/products/${created.id}.json`, { method:'PUT', body:JSON.stringify({product:{id:created.id, images:imgUpd}}) });
  } catch(e){}

  // set inventory
  for(const v of created.variants){
    try{ await shopifyFetch(env, '/inventory_levels/set.json', { method:'POST', body:JSON.stringify({ location_id:LOCATION_ID, inventory_item_id:v.inventory_item_id, available:100 }) }); }catch{}
  }

  // DELETE the old flattened product AFTER successfully creating the new one
  const del = await shopifyFetch(env, `/products/${p.id}.json`, { method:'DELETE' });

  return { ok:true, newId: created.id, oldId: p.id, variants: created.variants.length, deletedOld: del.ok||del.status===404 };
}

export async function onRequest(context){
  try{
    const { request, env } = context;
    if(request.method==='OPTIONS') return new Response(null,{status:200,headers:corsHeaders()});
    const url=new URL(request.url);
    const run=url.searchParams.get('run')==='1';
    const dryRun=url.searchParams.get('dryRun')==='1';
    const limit=parseInt(url.searchParams.get('limit')||'8',10);

    const rr=await fetch(RAW);
    if(!rr.ok) return new Response(JSON.stringify({error:'read '+rr.status}),{status:500,headers:{'Content-Type':'application/json',...corsHeaders()}});
    const catalog=await rr.json();
    const todo=catalog.filter(needsReimport);

    const progDoc=await ghRead(env,'data/reimport-progress.json');
    const prog=progDoc&&progDoc.content?JSON.parse(atob(progDoc.content.replace(/\n/g,''))):{};
    const saveProg=()=>ghWrite(env,'data/reimport-progress.json',JSON.stringify(prog),'auto: reimport progress',progDoc?progDoc.sha:undefined);

    if(dryRun) return new Response(JSON.stringify({ total:catalog.length, toReimport:todo.length }),{headers:{'Content-Type':'application/json',...corsHeaders()}});
    if(!run) return new Response(JSON.stringify({ total:catalog.length, toReimport:todo.length, done:Object.keys(prog).length }),{headers:{'Content-Type':'application/json',...corsHeaders()}});

    const remaining=todo.filter(p=>!(String(p.id) in prog)).slice(0,limit);
    let ok=0, fail=0;
    const results=[];
    for(const p of remaining){
      const id=String(p.id);
      try{
        const r=await reimport(env,p);
        prog[id]=r.ok?{newId:r.newId}:{skip:r.skip||r.error||'fail'};
        if(r.ok) ok++; else fail++;
        results.push({id, ok:r.ok, newId:r.newId, err:r.error||r.skip});
      }catch(e){
        prog[id]={skip:'ex:'+String(e.message||e).slice(0,60)}; fail++;
        results.push({id, ok:false, err:String(e.message||e).slice(0,80)});
      }
      await new Promise(r=>setTimeout(r,300));
    }
    await saveProg();
    return new Response(JSON.stringify({ processed:remaining.length, ok, fail, doneTotal:Object.keys(prog).length, results }),{headers:{'Content-Type':'application/json',...corsHeaders()}});
  }catch(err){
    return new Response(JSON.stringify({error:String(err&&err.message||err),stack:String(err&&err.stack||'').slice(0,400)}),{status:500,headers:{'Content-Type':'application/json',...corsHeaders()}});
  }
}
