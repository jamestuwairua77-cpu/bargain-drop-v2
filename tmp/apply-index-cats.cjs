const fs = require('fs');
const tree = JSON.parse(fs.readFileSync('/bargain-drop-repo/cj-categories.json', 'utf8'));

let html = '';
for (const c of tree) {
  const countStr = c.count >= 1000 ? (c.count / 1000).toFixed(1).replace(/\.0$/, '') + 'k items' : c.count + ' items';
  html += `      <a class="cat-card" href="category.html?cat=${c.slug}&name=${encodeURIComponent(c.name)}">\n`;
  html += `        <div class="cat-card-img-wrap"><img src="${c.image}" alt="${c.name}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=cat-card-emoji>📦</div>'" /></div>\n`;
  html += `        <div class="cat-card-label">${c.name}</div>\n`;
  html += `        <span class="cat-card-shop">${countStr}</span>\n`;
  html += `      </a>\n`;
}

let idxHtml = fs.readFileSync('/bargain-drop-repo/index.html', 'utf8');
const startMarker = '<div class="cat-grid" id="cat-grid">';
const tIdx = idxHtml.indexOf('id="trending-section"');
const endPos = idxHtml.lastIndexOf('</div></section>', tIdx);
const startPos = idxHtml.indexOf(startMarker);

if (startPos === -1 || endPos === -1) {
  console.error('Markers not found! start:', startPos, 'end:', endPos);
  process.exit(1);
}

const newCatSection = `${startMarker}\n${html}    `;
idxHtml = idxHtml.slice(0, startPos) + newCatSection + idxHtml.slice(endPos);

// Upgrade cat-card styling for a neat, modern look
idxHtml = idxHtml.replace(
  '.cat-card-img-wrap{width:56px;height:56px;border-radius:14px;overflow:hidden;background:#f5f5f5;flex-shrink:0}.cat-card-img-wrap img{width:100%;height:100%;object-fit:cover}',
  '.cat-card-img-wrap{width:64px;height:64px;border-radius:14px;overflow:hidden;background:#f5f5f5;flex-shrink:0;box-shadow:inset 0 0 0 1px rgba(0,0,0,.06)}.cat-card-img-wrap img{width:100%;height:100%;object-fit:cover;transition:transform .2s}.cat-card:hover .cat-card-img-wrap img{transform:scale(1.05)}'
);

// Update footer links
const oldFooterShop = `<div class="footer-col"><h5>Shop</h5><a href="products.html">All Products</a><a href="category.html?cat=womens-clothing&name=Women%27s%20Clothing">Women's Clothing</a><a href="category.html?cat=mens-clothing&name=Men%27s%20Clothing">Men's Clothing</a><a href="category.html?cat=consumer-electronics&name=Consumer%20Electronics">Electronics</a><a href="categories.html">All Categories</a></div>`;
const newFooterShop = `<div class="footer-col"><h5>Shop</h5><a href="products.html">All Products</a><a href="category.html?cat=womens-clothing&name=Women%27s%20Clothing">Women's Clothing</a><a href="category.html?cat=mens-clothing&name=Men%27s%20Clothing">Men's Clothing</a><a href="category.html?cat=home-garden-furniture&name=Home%2C%20Garden%20%26%20Furniture">Home & Garden</a><a href="category.html?cat=bags-shoes&name=Bags%20%26%20Shoes">Bags & Shoes</a><a href="categories.html">All 14 Categories</a></div>`;

if (idxHtml.includes(oldFooterShop)) {
  idxHtml = idxHtml.replace(oldFooterShop, newFooterShop);
}

fs.writeFileSync('/bargain-drop-repo/index.html', idxHtml);
console.log('Successfully updated index.html with all 14 CJ categories');
