// Bargain Drop v11 — 5-Zone JS
(function(){
  var ALL=[];
  function skuOf(p){var v=(p.variants||[])[0];var s=v&&v.sku;return(s&&String(s).trim())||null}
  function dedupeProducts(list){if(!list||!list.length)return list;var seen={},out=[];for(var i=0;i<list.length;i++){var p=list[i],s=skuOf(p),k;if(s)k='sku:'+s;else{var img=p.image||(Array.isArray(p.images)?p.images[0]:'')||'';k='tpi:'+String(p.title||'').trim().toLowerCase()+'|'+Number(p.price||0)+'|'+img}if(k&&seen[k])continue;if(k)seen[k]=1;out.push(p)}return out}
  var wishlist=JSON.parse(localStorage.getItem('bd_wishlist')||'[]');

  // Init cart count
  try{
    var cart=JSON.parse(localStorage.getItem('bd_cart')||'[]');
    var n=cart.reduce(function(s,i){return s+(i.qty||1)},0);
    var b=document.getElementById('cart-count');
    if(b&&n>0){b.textContent=n;b.style.display=''}
  }catch(e){}

  // Hero carousel
  var slides=document.querySelectorAll('.hero-slide');
  var dots=document.querySelectorAll('.hero-dot');
  var currentSlide=0;
  var totalSlides=slides.length;
  var slideInterval;

  function showSlide(idx){
    slides.forEach(function(s){s.classList.remove('active')});
    dots.forEach(function(d){d.classList.remove('active')});
    if(slides[idx])slides[idx].classList.add('active');
    if(dots[idx])dots[idx].classList.add('active');
    currentSlide=idx;
  }

  dots.forEach(function(d){
    d.addEventListener('click',function(){
      showSlide(parseInt(this.dataset.idx));
      resetInterval();
    });
  });

  function nextSlide(){showSlide((currentSlide+1)%totalSlides)}
  function resetInterval(){clearInterval(slideInterval);slideInterval=setInterval(nextSlide,4000)}
  if(totalSlides>1){slideInterval=setInterval(nextSlide,4000)}

  // Touch swipe for hero
  var hero=document.getElementById('hero');
  var touchStart=0;
  if(hero){
    hero.addEventListener('touchstart',function(e){touchStart=e.touches[0].clientX});
    hero.addEventListener('touchend',function(e){
      var diff=touchStart-e.changedTouches[0].clientX;
      if(Math.abs(diff)>50){
        if(diff>0)showSlide((currentSlide+1)%totalSlides);
        else showSlide((currentSlide-1+totalSlides)%totalSlides);
        resetInterval();
      }
    });
  }

  // Wishlist toggle
  window.toggleWishlist=function(btn,pid){
    btn.classList.toggle('liked');
    var idx=wishlist.indexOf(pid);
    if(idx>=0){wishlist.splice(idx,1);btn.textContent='\u2661'}
    else{wishlist.push(pid);btn.textContent='\u2665'}
    localStorage.setItem('bd_wishlist',JSON.stringify(wishlist));
  };

  // Init wishlist hearts
  document.querySelectorAll('.wishlist-btn').forEach(function(b){
    if(wishlist.indexOf(b.dataset.id)>=0){b.classList.add('liked');b.textContent='\u2665'}
  });

  // Load all products for search
  (function(){
    var x=new XMLHttpRequest();
    x.open('GET','/all-products.json?v=11ed6fb19c',true);
    x.timeout=15000;
    x.onload=function(){
      if(x.status>=200&&x.status<400){
        try{ALL=JSON.parse(x.responseText);ALL=ALL.filter(function(p){return p.visible!==false});ALL=dedupeProducts(ALL)}catch(e){ALL=[]}
      }
    };
    x.send();
  })();

  // Search
  var searchTimeout;
  window.doSearch=function(){
    clearTimeout(searchTimeout);
    searchTimeout=setTimeout(function(){
      var q=document.getElementById('search-input').value.toLowerCase().trim();
      var trendingHdr=document.getElementById('trending-header');
      var searchHdr=document.getElementById('search-header');
      var scroll=document.getElementById('product-scroll');
      var count=document.getElementById('search-count');

      if(!q){
        if(trendingHdr)trendingHdr.style.display='';
        if(searchHdr)searchHdr.style.display='none';
        return;
      }
      if(trendingHdr)trendingHdr.style.display='none';
      if(searchHdr)searchHdr.style.display='';

      var words=q.split(/\s+/).filter(Boolean);
      var scored=[];
      ALL.forEach(function(p){
        var title=String(p.title||'').toLowerCase();
        var type=String(p.product_type||'').toLowerCase();
        var tags=String(p.tags||'').toLowerCase();
        var vendor=String(p.vendor||'').toLowerCase();
        var body=String(p.body_html||'').replace(/<[^>]*>/g,' ').toLowerCase();
        var hay=title+' | '+type+' | '+tags+' | '+vendor+' | '+body;
        var score=0, matched=0;
        for(var w=0;w<words.length;w++){
          var wd=words[w];
          if(!wd)continue;
          // word-boundary match: reject substring hits like "washed" matching "shed"
          function hasW(txt,term){
            if(txt.indexOf(term)>=0){
              if(term.length>=4) return true; // long terms: substring ok (e.g. "gazebo" in "gazebos")
              var re=new RegExp('(^|[^a-z0-9])'+term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-z0-9]|$)');
              if(re.test(txt)) return true;
              // fallback: plural/singular
              var re2=new RegExp('(^|[^a-z0-9])'+term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'s?([^a-z0-9]|$)');
              return re2.test(txt);
            }
            return false;
          }
          if(hasW(title,wd)){score+=10;matched++;}
          else if(hasW(type,wd)||hasW(tags,wd)){score+=6;matched++;}
          else if(hasW(body,wd)){score+=3;matched++;}
          else if(hasW(hay,wd)){score+=1;matched++;}
        }
        if(matched>=words.length){scored.push({p:p,score:score});}
      });
      scored.sort(function(a,b){return b.score-a.score;});
      var results=scored.slice(0,120).map(function(x){return x.p;});

      if(count)count.textContent=results.length+' result'+(results.length===1?'':'s')+' for "'+esc(q)+'"';
      if(!results.length){
        scroll.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;color:#888;">No products found. Try a different keyword.</div>';
        return;
      }

      scroll.innerHTML='';
      results.forEach(function(p,i){
        var img=p.image||'';
        var delay=i<20?' style="animation-delay:'+(i*0.03)+'s"':'';
        scroll.innerHTML+='<div class="product-card-z4 fade-in"'+delay+'><div class="img-wrap"><a href="product.html?id='+p.id+'"><img src="'+img+'" alt="" loading="lazy" onerror="this.parentElement.innerHTML=\'<div style=width:100%;aspect-ratio:1;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:2rem>\ud83d\udce6</div>\'"></a><button class="wishlist-btn" data-id="'+p.id+'" onclick="toggleWishlist(this,\''+p.id+'\')">\u2661</button></div><div class="info"><a href="product.html?id='+p.id+'"><div class="title">'+esc(p.title).substring(0,45)+'</div></a><div class="stars">\u2605\u2605\u2605\u2605\u2605</div><div class="price">A$'+(p.price||0).toFixed(2)+'</div></div><a href="product.html?id='+p.id+'" class="quick-add">Quick Add +</a></div>';
      });
    },300);
  };

  function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

  // Profile pic
  try{
    var sess=JSON.parse(localStorage.getItem('bd_session')||'null');
    if(sess&&sess.picture){
      var pic=document.getElementById('header-profile-pic');
      if(pic){pic.src=sess.picture;pic.style.display='';}
      var icon=document.getElementById('header-profile-icon');
      if(icon)icon.style.display='none';
    }
  }catch(e){}
})();
