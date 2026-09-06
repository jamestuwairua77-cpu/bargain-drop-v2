/* catalog-loader.js — load the sharded catalog and merge into a single array/object.
 * The catalog is split across all-products-N.json / categories-data-N.json with
 * all-products.json / categories-data.json serving as { shards: N, count: M } manifests.
 * This keeps the whole catalog (5,700+ products) deployable under Cloudflare Pages'
 * 25 MiB per-file limit. */
(function(){
  function fetchJSON(url, timeoutMs){
    return new Promise(function(resolve, reject){
      var x = new XMLHttpRequest();
      x.open('GET', url, true);
      x.timeout = timeoutMs || 20000;
      x.onload = function(){ if(x.status>=200 && x.status<400){ try{ resolve(JSON.parse(x.responseText)); }catch(e){ reject(e); } } else { reject(new Error('HTTP '+x.status)); } };
      x.onerror = function(){ reject(new Error('network')); };
      x.ontimeout = function(){ reject(new Error('timeout')); };
      x.send();
    });
  }
  function merge(shards){
    var out = [];
    for(var i=0;i<shards.length;i++){ if(Array.isArray(shards[i])) out = out.concat(shards[i]); }
    return out;
  }
  function bust(){ return '?v=' + encodeURIComponent(Date.now().toString(36)); }

  // Load the sharded product catalog as one array.
  window.loadCatalog = function(cb){
    if(window.__catalogAll){ cb(window.__catalogAll); return; }
    fetchJSON('/all-products.json' + bust(), 15000).then(function(manifest){
      if(Array.isArray(manifest)){ window.__catalogAll = manifest; cb(manifest); return; }
      var n = (manifest && manifest.shards) || 0;
      if(!n){ cb([]); return; }
      var jobs = [];
      for(var i=0;i<n;i++){ jobs.push(fetchJSON('/all-products-' + i + '.json' + bust(), 25000)); }
      Promise.all(jobs).then(function(shards){
        var all = merge(shards);
        window.__catalogAll = all;
        cb(all);
      }).catch(function(){ cb([]); });
    }).catch(function(){ cb([]); });
  };

  // Load the sharded categories catalog as { key: { name, products: [...] } }.
  window.loadCategories = function(cb){
    if(window.__catalogCats){ cb(window.__catalogCats); return; }
    fetchJSON('/categories-data.json' + bust(), 15000).then(function(manifest){
      function rebuild(shards){
        var obj = {};
        for(var a=0;a<shards.length;a++){ var arr=shards[a]||[]; for(var b=0;b<arr.length;b++){ var e=arr[b]; if(e && e.key){ obj[e.key] = { name: e.name, products: e.products }; } } }
        return obj;
      }
      if(!Array.isArray(manifest) && manifest && manifest.shards){
        var n = manifest.shards;
        var jobs = [];
        for(var i=0;i<n;i++){ jobs.push(fetchJSON('/categories-data-' + i + '.json' + bust(), 25000)); }
        Promise.all(jobs).then(function(shards){ var obj = rebuild(shards); window.__catalogCats = obj; cb(obj); }).catch(function(){ cb({}); });
      } else {
        var obj = (!Array.isArray(manifest) && manifest) ? manifest : {};
        window.__catalogCats = obj;
        cb(obj);
      }
    }).catch(function(){ cb({}); });
  };
})();
