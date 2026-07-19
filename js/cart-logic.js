function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function toNum(p){return Number(String(p||0).replace(/[^0-9.]/g,''))||0}
function fmt(p){var n=Number(String(p||0).replace(/[^0-9.]/g,''));return A$'+(n||0).toFixed(2)}

var promoCode='',promoDiscount=0;
function getCart(){try{return JSON.parse(localStorage.getItem('bd_cart')||'[]')}catch(e){return[]}}
function saveCart(arr){localStorage.setItem('bd_cart',JSON.stringify(arr))}

function renderCart(){
  var items=getCart(),c=document.getElementById('cart-items'),
      e=document.getElementById('empty-state'),
      s=document.getElementById('summary-section'),
      b=document.getElementById('cart-count-badge'),
      ic=document.getElementById('cart-item-count');
  if(b)b.textContent=items.length?'('+items.length+')':'';
  var tq=items.reduce(function(s,i){return s+(i.qty||1)},0);
  if(ic)ic.textContent=tq+' item'+(tq!=1?'s':'');
  if(!items.length){c.innerHTML='';e.style.display='block';s.style.display='none';return}
  e.style.display='none';s.style.display='block';
var h='';items.forEach(function(it,i){
    var p=toNum(it.price),cp=toNum(it.comparePrice||it.compare_at_price||0),
        hasD=cp>p,dpct=hasD?Math.round((1-p/cp)*100):0,
        img=it.image||(it.images||[])[0]||'',
        lTotal=p*(it.qty||1);
    h+='<div class="cart_item"><a href="product.html?id='+esc(it.id||'')+'" class="cart_img">'+
      (img?'<img src="'+esc(img)+'" onerror="this.remove()" alt="">':'')+
      (hasD?'<span class="cart_discount_badge">-'+dpct+'</span>':'')+
      '</a><a href="product.html?id='+esc(it.id||'')+'" class="cart_info"><div class="cart_title">'+
      esc(it.title||'Untitled')+'</div>'+
      (it.variants?"<div class=\"cart_variant\">"+esc(it.variants)+"</div>":"")+
      '<div class="cart_pricing">'+(hasD?'<span class="cart_original">'+fmt(cp)+'</span>':'')+'<span class="cart_price">'+fmt(p)+'</span></div>'+'<div class="qty_row"><button class="qty_btn" onclick="changeQty('+i+',-1)" '+((it.qty||1)<=1?'disabled":'')+'>−</button><span class="qty_val">'+(it.qty||1)+'</span>'+'<button class="qty_btn" onclick="changeQty('+i+',1)">+</button><span class="qty_remove" onclick="removeItem('+i+')">📕 Remove</span><span class="qty_save" onclick="saveForLater('+i+')">❤️ Save</span></div></a></div>';});c.innerHTML=h;updateSummary()}