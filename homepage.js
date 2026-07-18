// v1784408348
if(typeof BD!="undefined")BD.initCurrency();var C={"womens-clothing":"👗","mens-clothing":"👔","bags-shoes":"👜","jewelry-watches":"💍","home-garden-furniture":"🏡","home-improvement":"🔧","health-beauty-hair":"💄","sports-outdoors":"⚽","toys-kids-babies":"🧸","phones-accessories":"📱","consumer-electronics":"🎧","automobiles-motorcycles":"🚗","pet-supplies":"🐾","other":"📦"};function esc(s){return(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}var ALL=[];(function loadCats(){var x=new XMLHttpRequest();x.open("GET","/categories-data.json",true);x.timeout=10000;x.onload=function(){if(x.status>=200&&x.status<400){var d=JSON.parse(x.responseText);var cats=Object.keys(d);renderSubcatSlider(cats,d);renderSubcatGrid(cats,d);}};x.onerror=function(){document.getElementById("subcat-slider").innerHTML="<div class=\"loading-text\">Subcategories loading...</div>";document.getElementById("subcat-scroll-wrap").innerHTML="<div class=\"loading-text\">Categories loading...</div>";};x.send();})();(function loadProds(){
  var x=new XMLHttpRequest();
  x.open("GET","/data/all-products.json",true);
  x.timeout=15000;
  x.onload=function(){
    if(x.status>=200&&x.status<400){
      var d=JSON.parse(x.responseText);
      ALL=Array.isArray(d)?d.slice(0,50):[];
      renderProds(ALL);
    }
  };
  x.onerror=function(){
    document.getElementById("product-grid").innerHTML="<div class=\"loading-text\">Products unavailable</div>"
  };
  x.send();
})();function renderSubcatSlider(cats,catData){var g=document.getElementById("subcat-slider");if(!g)return;g.innerHTML="";var slugs=Object.keys(C);for(var k=0;k<slugs.length;k++){var s=slugs[k],c=catData[s]||{name:s,count:0};var a=document.createElement("a");a.className="subcat-btn fade-in";a.href="category.html?cat="+encodeURIComponent(s)+"&name="+encodeURIComponent(c.name||s);a.innerHTML=(C[s]||"📦")+esc(c.name||s);g.appendChild(a);}}



function renderSubcatGrid(cats,catData){
  var g=document.getElementById("subcat-scroll-wrap");
  if(!g)return;
  g.innerHTML="";
  var slugs=Object.keys(C);
  for(var i=0;i<slugs.length;i++){
    var s=slugs[i],c=catData[s]||{name:s,count:0};
    var img=c.image||"";
    var imgHtml=img?'<div class="cat-card-img"><img src="'+img+'" alt="" loading="lazy" onerror="this.parentElement.innerHTML=\'<div class=cat-card-placeholder>'+(C[s]||"📦")+'</div>\'"></div>':'<div class="cat-card-placeholder">'+(C[s]||"📦")+'</div>';
    var a=document.createElement("a");
    a.className="category-card-new fade-in";
    a.href="category.html?cat="+encodeURIComponent(s)+"&name="+encodeURIComponent(c.name||s);
    a.innerHTML=imgHtml+'<div class="cat-card-info"><div class="cat-card-name">'+esc(c.name||s)+'</div><div class="cat-card-count">'+(c.count||0)+' products →</div></div>';
    g.appendChild(a);
  }
}

function renderProds(prods){var g=document.getElementById("product-grid");g.innerHTML="";if(!prods.length){g.innerHTML="<div class=\"loading-text\">No products found</div>";return}for(var i=0;i<prods.length;i++){var p=prods[i],rawImg=p.image||(Array.isArray(p.images)?p.images[0]:"")||"";var img=typeof rawImg==="object"?(rawImg.src||""):rawImg;var a=document.createElement("a");a.className="product-card fade-in";a.href="product.html?id="+p.id;var imgHtml;if(img){imgHtml="<img src=\""+img+"\" alt=\""+esc(p.title)+"\" width=\"200\" height=\"200\" loading=\"lazy\" onerror=\"this.parentElement.innerHTML='<div class=prod-img-placeholder>📦</div>'\">";}else{imgHtml="<div class=\"prod-img-placeholder\">📦</div>";}var priceHtml;if(typeof BD!="undefined"){priceHtml=BD.formatMoneyCompact(p.price||0);}else{priceHtml="A$"+(p.price||0).toFixed(2);}var pc=p.compare_at_price&&p.compare_at_price>p.price?"<span class=\"prod-compare\">A$"+(p.compare_at_price||0).toFixed(2)+"</span>":"";a.innerHTML="<div class=\"prod-img\">"+imgHtml+"</div><div class=\"prod-info\"><div class=\"prod-title\">"+esc(p.title)+"</div><div class=\"prod-price-row\"><span class=\"prod-price\">"+priceHtml+"</span>"+pc+"</div></div>";g.appendChild(a);}}var searchTimeout;function doSearch(){var q=document.getElementById("search-input").value.toLowerCase().trim();var clr=document.getElementById("search-clear");if(clr)clr.style.display=q?"flex":"none";clearTimeout(searchTimeout);searchTimeout=setTimeout(function(){if(q){document.getElementById("subcat-slider-wrap").style.display="none";document.getElementById("cat-section").style.display="none";document.getElementById("trending-title").style.display="none";var st=document.getElementById("search-title");if(st)st.style.display="flex";var sc=document.getElementById("search-count");if(sc)sc.textContent=q?all.length.toLocaleString()+" results":"";var x=new XMLHttpRequest();x.open("GET","/api/search-products?limit=50&q="+encodeURIComponent(q),true);x.timeout=10000;x.onload=function(){if(x.status>=200&&x.status<400){var d=JSON.parse(x.responseText);renderProds(d.products||[]);}};x.onerror=function(){renderProds(ALL.slice(0,50))};x.send();}else{document.getElementById("subcat-slider-wrap").style.display="";document.getElementById("cat-section").style.display="";document.getElementById("trending-title").style.display="";document.getElementById("search-title").style.display="none";renderProds(ALL.slice(0,50));}},300);}function clearSearch(){document.getElementById("search-input").value="";doSearch();document.getElementById("search-input").focus();}