// Bargain Drop v11 — 5-Zone JS
(function(){
  var ALL=[];
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
    x.open('GET','/data/all-products.json',true);
    x.timeout=15000;
    x.onload=function(){
      if(x.status>=200&&x.status<400){
        try{ALL=JSON.parse(x.responseText)}catch(e){ALL=[]}
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

      var results=ALL.filter(function(p){
        return (p.title||'').toLowerCase().indexOf(q)>=0;
      }).slice(0,30);

      if(count)count.textContent=results.length+' results';
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
