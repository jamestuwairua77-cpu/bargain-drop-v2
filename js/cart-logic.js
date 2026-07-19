function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function toNum(p){return Number(String(p||0).replace(/[^0-9.]/g,''))||0}
function fmt(p){var n=Number(String(p||0).replace(/[^0-9.]/g,''));return'A$'+(n||0).toFixed(2)}
var promoCode='', promoDiscount=0;
function getCart(){try{return JSON.parse(localStorage.getItem('bd_cart')||'[]')}catch(e){return[]}}
function saveCart(arr){localStorage.setItem('bd_cart',JSON.stringify(arr))}
function renderCart(){
  var items=getCart(),c=document.getElementById('cart-items'),e=document.getElementById('empty-state'),s=document.getElementById('summary-section'),b=document.getElementById('cart-count-badge'),ic=document.getElementById('cart-item-count');
  if(b)b.textContent=items.length?'('+items.length+')':'';
  var tq=items.reduce(function(s,i){return s+(i.qty||1)},0);
  if(ic)ic.textContent=tq+' item'+(tq!==1?'s':'');
  if(!items.length){c.innerHTML='';e.style.display='block';s.style.display='none';return}
  e.style.display='none';s.style.display='block';
  var h='';items.forEach(function(it,i){
    var p=toNum(it.price),cp=toNum(it.comparePrice||it.compare_at_price||0),hasD=cp>p,dpct=hasD?Math.round((1-p/cp)*100):0,img=it.image||(it.images||[])[0]||'';
    h+='<div class="cart_item"><a href="product.html?id='+esc(it.id||'')+'" class="cart_img">'+(img?'<img src="'+esc(img)+'" onerror="this.remove()" alt="">':'')+(hasD?'<span class="cart_discount_badge">-'+dpct+'%</span>':'')+'</a><a href="product.html?id='+esc(it.id||'')+'" class="cart_info"><div class="cart_title">'+esc(it.title||'Untitled')+'</div>'+(it.variants?'<div class="cart_variant">'+esc(it.variants)+'</div>':'')+'<div class="cart_pricing">'+(hasD?'<span class="cart_original">'+fmt(cp)+'</span>':'')+'<span class="cart_price">'+fmt(p)+'</span></div><div class="qty_row"><button class="qty_btn" onclick="changeQty('+i+',-1)" '++(it.qty||1)<=1?'disabled':'')+'>-</button><span class="qty_val">'+(it.qty||1)+'</span><button class="qty_btn" onclick="changeQty('+i+',1)">+</button><span class="qty_remove" onclick="removeItem('+i+')">Remove</span><span class="qty_save" onclick="saveForLater('+i+')">Save</span></div></a></div>'});c.innerHTML=h;updateSummary()}
function changeQty(i,d){var items=getCart();items[i].qty=(items[i].qty||1)+d;if(items[i].qty<1)items[i].qty=1;saveCart(items);renderCart();updateNavCart()}
function removeItem(i){var items=getCart(),removed=items[i];items.splice(i,1);saveCart(items);renderCart();updateNavCart();toast('Removed')}
function saveForLater(i){var items=getCart(),it=items[i];try{var wl=JSON.parse(localStorage.getItem('bd_wishlists_v2')||'null');if(wl&&wl.items){wl.items.push({id:'wl_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),product:it,folderId:'__default__',added:new Date().toISOString(),variants:it.variants||'',alertsOn:!1});localStorage.setItem('bd_wishlists_v2',JSON.stringify(wl))}}catch(e){}items.splice(i,1);saveCart(items);renderCart();updateNavCart();toast('Saved')}
function updateSummary(){var items=getCart(),sub=items.reduce(function(s,i){return s+toNum(i.price)*(i.qty||1)},0);document.getElementById('summary-subtotal').textContent=fmt(sub);var disc=promoDiscount||0,total=Math.max(0,sub-disc);if(disc>0){document.getElementById('promo-line').style.display='flex';document.getElementById('summary-discount').textContent='-'+fmt(disc)}else document.getElementById('promo-line').style.display='none';document.getElementById('summary-total').textContent=fmt(total)}
function togglePromo(){document.getElementById('promo-field').classList.toggle('show')}
function applyPromo(){var code=(document.getElementById('promo-input').value||'').trim().toUpperCase();if(!code){toast('Enter code');return}var items=getCart(),sub=items.reduce(function(s,i){return s+toNum(i.price)*(i.qty||1)},0);if(code==='SAVE10'){promoDiscount=Math.round(sub*0.1*100)/100;promoCode='SAVE10'}else if(code==='FREESHIP'){promoDiscount=0;promoCode='FREESHIP'}else{toast('Invalid code');return}document.getElementById('promo-field').classList.remove('show');document.getElementById('promo-applied').classList.add('show');document.getElementById('promo-code-name').textContent=promoCode;document.getElementById('promo-saved').textContent=promoDiscount>0?'-'+fmt(promoDiscount):'Free Ship';document.getElementById('promo-input').value='';updateSummary();toast('Promo applied')}
function removePromo(){promoCode='';promoDiscount=0;document.getElementById('promo-applied').classList.remove('show');updateSummary();toast('Promo removed')}
function toast(msg){var t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._tid);t._tid=setTimeout(function(){t.classList.remove('show')},2000)}
function updateNavCart(){try{var items=getCart(),n=items.reduce(function(s,i){return s+(i.qty||1)},0),b=document.getElementById('nav-cart-count');if(b){b.textContent=n;b.style.display=n>0?'':'none'}}catch(e){}}
renderCart();updateNavCart();