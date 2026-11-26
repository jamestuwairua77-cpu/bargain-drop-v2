function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function toNum(p){return Number(String(p||0).replace(/[^0-9.]/g,""))||0}
function fmt(p){return"A$"+toNum(p).toFixed(2)}

// Clear any previously saved promo codes (discounts disabled)
try{localStorage.removeItem("bd_promo")}catch(e){}

function getCart(){
  try{
    var c=JSON.parse(localStorage.getItem("bd_cart")||"[]");
    if((!Array.isArray(c)||!c.length)&&localStorage.getItem("bd_cart_items_v1")){
      var v1=JSON.parse(localStorage.getItem("bd_cart_items_v1")||"[]");
      if(Array.isArray(v1)&&v1.length){
        c=v1.map(function(row){
          var p=row.product||row||{};
          var sv=row.selectedVariant||{};
          return {
            product_id:p.id||row.id||"",
            id:p.id||row.id||"",
            variant_id:sv.id||row.variant_id||p.variant_id||"",
            cj_variant_id:sv.cj_vid||sv.vid||row.cj_variant_id||p.cj_variant_id||"",
            sku:sv.sku||row.sku||p.sku||"",
            title:p.title||"Product",
            price:toNum(sv.price?sv.price:p.price),
            image:p.image||(Array.isArray(p.images)?p.images[0]:"")||"",
            qty:Number(row.quantity||row.qty||1)||1,
            size:row.size||sv.size||"",
            color:row.color||sv.color||"",
            variants:sv.option1||row.variants||""
          };
        });
        localStorage.setItem("bd_cart",JSON.stringify(c));
      }
    }
    return Array.isArray(c)?c:[];
  }catch(e){return[]}
}

function saveCart(a){
  localStorage.setItem("bd_cart",JSON.stringify(a));
  try{
    var v1=a.map(function(x){
      return {
        product:{
          id:String(x.product_id||x.id||""),
          title:x.title||"Product",
          price:toNum(x.price),
          image:x.image||(x.images||[])[0]||"",
          sku:x.sku||""
        },
        selectedVariant:{
          id:x.variant_id||"",
          sku:x.sku||"",
          cj_vid:x.cj_variant_id||x.vid||"",
          price:toNum(x.price),
          option1:x.variants||x.size||x.color||""
        },
        variant_id:x.variant_id||"",
        cj_variant_id:x.cj_variant_id||x.vid||"",
        sku:x.sku||"",
        size:x.size||"",
        color:x.color||"",
        quantity:Number(x.qty||1)||1
      };
    });
    localStorage.setItem("bd_cart_items_v1",JSON.stringify(v1));
  }catch(e){}
}

function renderCart(){
  var it=getCart(),
      c=document.getElementById("ci"),
      e=document.getElementById("es"),
      ss=document.getElementById("ss"),
      fs=document.getElementById("fs-bar"),
      b=document.getElementById("ccb"),
      ic=document.getElementById("cic");
  if(b)b.textContent=it.length?"("+it.length+")":"";
  var tq=it.reduce(function(s,i){return s+(Number(i.qty)||1)},0);
  if(ic)ic.textContent=tq+" item"+(tq!==1?"s":"");
  if(!it.length){
    if(c)c.innerHTML="";
    if(e)e.style.display="block";
    if(ss)ss.style.display="none";
    if(fs)fs.style.display="none";
    updateSummary();
    return;
  }
  if(e)e.style.display="none";
  if(ss)ss.style.display="block";
  var h="";
  it.forEach(function(x,i){
    var p=toNum(x.price),
        img=x.image||(x.images||[])[0]||"",
        pid=esc(x.product_id||x.id||""),
        qty=Number(x.qty)||1;
    var parts=[];
    if(x.size)parts.push("Size: "+x.size);
    if(x.color)parts.push("Colour: "+x.color);
    if(!parts.length&&x.variants&&typeof x.variants==="string")parts.push(x.variants);
    var vhtml=parts.length?'<div class="civ">'+esc(parts.join(" · "))+"</div>":"";
    h+='<div class="cit">'+
       '<a href="product.html?id='+pid+'" class="ciimg">'+(img?'<img src="'+esc(img)+'" onerror="this.remove()" alt="">':"")+'</a>'+
       '<div class="ciinf">'+
         '<a href="product.html?id='+pid+'" class="cititle">'+esc(x.title||"Untitled")+'</a>'+
         vhtml+
         '<div class="cip"><span class="cipp">'+fmt(p)+'</span></div>'+
         '<div class="qr">'+
           '<button type="button" class="qbtn" onclick="cq('+i+',-1)"'+(qty<=1?" disabled":"")+'>-</button>'+
           '<span class="qv">'+qty+'</span>'+
           '<button type="button" class="qbtn" onclick="cq('+i+',1)">+</button>'+
           '<span class="qrm" onclick="ri('+i+')">Remove</span>'+
           '<span class="qsv" onclick="sl('+i+')">Save</span>'+
         '</div>'+
       '</div>'+
       '</div>';
  });
  if(c)c.innerHTML=h;
  updateSummary();
}

function cq(i,d){
  var it=getCart();
  if(!it[i])return;
  it[i].qty=(Number(it[i].qty)||1)+d;
  if(it[i].qty<1)it[i].qty=1;
  saveCart(it);
  renderCart();
  un();
}

function ri(i){
  var it=getCart();
  it.splice(i,1);
  saveCart(it);
  renderCart();
  un();
  toast("Removed from cart");
}

function sl(i){
  var it=getCart(),x=it[i];
  if(!x)return;
  var W=window.BDWishlist||{};
  if(W.add)W.add({id:(x.product_id||x.id||Date.now()),title:x.title||"Product",price:x.price||0,image:(x.image||(x.images||[])[0]||""),added:new Date().toISOString()});
  it.splice(i,1);
  saveCart(it);
  renderCart();
  un();
  toast("Saved to wishlist");
}

function updateSummary(){
  var it=getCart(),
      sub=it.reduce(function(s,i){return s+toNum(i.price)*(Number(i.qty)||1)},0);
  var ssbEl=document.getElementById("ssb");
  if(ssbEl)ssbEl.textContent=fmt(sub);
  var freeShip=sub>=29||sub===0,
      shipCost=freeShip?0:4.95,
      tot=sub+shipCost;
  var sshEl=document.getElementById("ssh");
  if(sshEl){
    sshEl.textContent=sub===0?"Calculated at checkout":(freeShip?"FREE (A$29+ Express)":fmt(shipCost));
  }
  var fs=document.getElementById("fs-bar");
  if(fs&&it.length>0){
    fs.style.display="block";
    if(freeShip){
      fs.innerHTML='<span style="color:#4ade80;">&#x2705; You unlocked <b>FREE Tracked Express Shipping</b>!</span>';
    }else{
      var rem=Math.max(0,29-sub);
      fs.innerHTML='&#x1f69a; Add <b style="color:#fe3442;">'+fmt(rem)+'</b> more to unlock <b>FREE Express Shipping</b>';
    }
  }
  var plEl=document.getElementById("pl");
  if(plEl)plEl.style.display="none";
  var stoEl=document.getElementById("sto");
  if(stoEl)stoEl.textContent=fmt(tot);
}

function toast(msg){
  var t=document.getElementById("to");
  if(!t)return;
  t.textContent=msg;
  t.classList.add("on");
  clearTimeout(t._tid);
  t._tid=setTimeout(function(){t.classList.remove("on")},2200);
}

function un(){
  try{
    var it=getCart(),
        n=it.reduce(function(s,i){return s+(Number(i.qty)||1)},0),
        b=document.getElementById("ncb");
    if(b){b.textContent=n;b.style.display=n>0?"":"none"}
  }catch(e){}
}

renderCart();
un();
