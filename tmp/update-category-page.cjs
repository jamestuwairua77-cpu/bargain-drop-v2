const fs = require('fs');

let catHtml = fs.readFileSync('/bargain-drop-repo/category.html', 'utf8');

// 1. Support both p.get('cat') and p.get('c'), and default name from CJ slug map
const oldParamHandling = `  var p = new URLSearchParams(location.search);
  var uc = (p.get('cat') || '').trim();
  var un = p.get('name') || 'Products';`;

const newParamHandling = `  var p = new URLSearchParams(location.search);
  var uc = (p.get('cat') || p.get('c') || '').trim();
  var CJ_NAMES = {
    "womens-clothing": "Women's Clothing",
    "mens-clothing": "Men's Clothing",
    "pet-supplies": "Pet Supplies",
    "home-garden-furniture": "Home, Garden & Furniture",
    "health-beauty-hair": "Health, Beauty & Hair",
    "jewelry-watches": "Jewelry & Watches",
    "bags-shoes": "Bags & Shoes",
    "toys-kids-babies": "Toys, Kids & Babies",
    "sports-outdoors": "Sports & Outdoors",
    "consumer-electronics": "Consumer Electronics",
    "home-improvement": "Home Improvement",
    "automobiles-motorcycles": "Automobiles & Motorcycles",
    "phones-accessories": "Phones & Accessories",
    "computer-office": "Computer & Office"
  };
  var un = p.get('name') || CJ_NAMES[uc] || (uc ? uc.split(/[-_>]/).map(function(w){return w.charAt(0).toUpperCase()+w.slice(1)}).join(' ') : 'All Products');`;

catHtml = catHtml.replace(oldParamHandling, newParamHandling);

// 2. Filter out all empty subcategories and render clean chips with live count badge
const oldChipLogic = `    if (cb) {
      cb.innerHTML = '';
      var chips = uc ? subs.filter(function(s){ return s.key === uc || s.key.indexOf(uc) === 0; }) : subs;
      if (!chips.length) chips = subs;
      chips.forEach(function(s) {
        var ch = document.createElement('button');
        ch.className = 'subcat-chip' + (s.key === uc ? ' active' : '');
        var fp0 = s.prods && s.prods[0];
        var img = fp0 && fp0.image ? fp0.image : '';
        var visual = img ? '<img class="subcat-chip-img" src="' + img + '" alt="' + s.label + '" loading="lazy" onerror="this.outerHTML=\\'<div class=subcat-chip-placeholder>📦</div>\\'">' : '<div class="subcat-chip-placeholder">📦</div>';
        ch.innerHTML = visual + '<span class="subcat-chip-label">' + s.label + '</span>';
        ch.onclick = function() { fp(s.key); };
        cb.appendChild(ch);
      });
    }`;

const newChipLogic = `    if (cb) {
      cb.innerHTML = '';
      // Ensure only non-empty subcategories are shown — all empty subcategories are 100% invisible!
      var validSubs = subs.filter(function(s) { return s.prods && s.prods.length > 0; });
      var chips = [];
      if (uc) {
        // Group chips by Level 2 if on an L1 category
        var matched = validSubs.filter(function(s) { return s.key === uc || s.key.indexOf(uc + '->') === 0; });
        var parentRes = resolve(uc);
        var totalInCat = (parentRes && parentRes.prods && parentRes.prods.length) || 0;
        if (totalInCat > 0) {
          chips.push({ key: uc, label: 'All ' + un, count: totalInCat, prods: parentRes.prods });
        }
        // Extract distinct Level 2 subcategories
        var l2Map = {};
        matched.forEach(function(s) {
          var parts = s.key.split('->');
          var l2Key = parts.length >= 2 ? parts[0] + '->' + parts[1] : s.key;
          if (!l2Map[l2Key]) {
            var subLabel = (s.label || '').replace(/^All\\s+/i, '');
            if (parts.length >= 2) {
              subLabel = parts[1].split('-').map(function(w){return w.charAt(0).toUpperCase()+w.slice(1);}).join(' ');
            }
            l2Map[l2Key] = { key: l2Key, label: subLabel, count: 0, prods: [], image: (s.prods && s.prods[0] && s.prods[0].image) || '' };
          }
          l2Map[l2Key].count += (s.prods ? s.prods.length : 0);
          l2Map[l2Key].prods = l2Map[l2Key].prods.concat(s.prods || []);
        });
        Object.keys(l2Map).forEach(function(k) {
          var item = l2Map[k];
          if (item.count > 0 && item.key !== uc) {
            chips.push(item);
          }
        });
      } else {
        // Top level: show all non-empty CJ categories
        chips = validSubs;
      }

      chips.forEach(function(s) {
        var ch = document.createElement('button');
        ch.className = 'subcat-chip' + (s.key === uc ? ' active' : '');
        var fp0 = s.prods && s.prods[0];
        var img = s.image || (fp0 && fp0.image ? fp0.image : '');
        var visual = img ? '<img class="subcat-chip-img" src="' + img + '" alt="' + s.label + '" loading="lazy" onerror="this.outerHTML=\\'<div class=subcat-chip-placeholder>📦</div>\\'">' : '<div class="subcat-chip-placeholder">📦</div>';
        var countBadge = s.count ? ' <span style="opacity:.7;font-weight:400">(' + (s.count >= 1000 ? (s.count/1000).toFixed(1) + 'k' : s.count) + ')</span>' : '';
        ch.innerHTML = visual + '<span class="subcat-chip-label">' + s.label + countBadge + '</span>';
        ch.onclick = function() { fp(s.key); };
        cb.appendChild(ch);
      });
    }`;

catHtml = catHtml.replace(oldChipLogic, newChipLogic);

// 3. Update result count display in rg()
const oldRgStart = `    var s = (cpg - 1) * PP, e = Math.min(s + PP, ps.length), pp = ps.slice(s, e);`;
const newRgStart = `    var rc = document.getElementById('result-count');
    if (rc) {
      rc.style.display = 'block';
      rc.textContent = 'Showing ' + (ps.length === 0 ? '0' : (cpg - 1) * PP + 1) + '–' + Math.min(cpg * PP, ps.length) + ' of ' + ps.length.toLocaleString() + ' products';
    }
    var s = (cpg - 1) * PP, e = Math.min(s + PP, ps.length), pp = ps.slice(s, e);`;

catHtml = catHtml.replace(oldRgStart, newRgStart);

fs.writeFileSync('/bargain-drop-repo/category.html', catHtml);
console.log('Successfully updated category.html with dynamic CJ subcategories and non-empty filter');
