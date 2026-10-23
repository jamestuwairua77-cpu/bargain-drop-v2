function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function toNum(p){return Number(String(p||0).replace(/[^0-9.]/g,""))||0}
function fmt(p){return"A$"+toNum(p).toFixed(2)}
var pc="",pd=0;

function getCart(){
  try{
    var c=JSON.parse(localStorage.getItem("bd_cart")||"[]");
    if((!Array.isArray(c)||!c.length)&&localStorage.getItem("bd_cart_items_v1")){
      var v1=JSON.parse(localStorage.getItem("bd_cart_items_v1")||"[]");
      if(Array.isArray(v1)&&v1.length){
        c=v1.map(function(row){
          var p=row.product||row||{};
          return {
            product_id:p.id||row.id||"",
            id:p.id||row.id||"",
            title:p.title||"Product",
            price:toNum(row.selectedVariant&&row.selectedVariant.price?row.selectedVariant.price:p.price),
            comparePrice:toNum(p.old_price||p.compare_at_price||0),
            image:p.image||(Array.isArray(p.images)?p.images[0]:"")||"",
            qty:Number(row.quantity||row.qty||1)||1,
            variants:row.selectedVariant&&row.selectedVariant.option1?row.selectedVariant.option1:""
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
          old_price:toNum(x.comparePrice||x.compare_at_price||0)||undefined,
          image:x.image||(x.images||[])[0]||""
        },
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
        cp=toNum(x.comparePrice||x.compare_at_price||0),
        hd=cp>p,
        ct=hd?Math.round((1-p/cp)*100):0,
        img=x.image||(x.images||[])[0]||"",
        pid=esc(x.product_id||x.id||""),
        qty=Number(x.qty)||1;
    var parts=[];
    if(x.size)parts.push("Size: "+x.size);
    if(x.color)parts.push("Colour: "+x.color);
    if(!parts.length&&x.variants&&typeof x.variants==="string")parts.push(x.variants);
    var vhtml=parts.length?'<div class="civ">'+esc(parts.join(" · "))+"</div>":"";
    h+='<div class="cit">'+
       '<a href="product.html?id='+pid+'" class="ciimg">'+(img?'<img src="'+esc(img)+'" onerror="this.remove()" alt="">':"")+(hd?'<span class="cidb">-'+ct+"%</span>":"")+'</a>'+
       '<div class="ciinf">'+
         '<a href="product.html?id='+pid+'" class="cititle">'+esc(x.title||"Untitled")+'</a>'+
         vhtml+
         '<div class="cip">'+(hd?'<span class="cipo">'+fmt(cp)+"</span>":"")+'<span class="cipp">'+fmt(p)+'</span></div>'+
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

function recalcPromo(sub){
  if(!pc){pd=0;return;}
  if(pc==="BARGAIN26")pd=Math.round(sub*0.30*100)/100;
  else if(pc==="SAVE10"||pc==="WELCOME10"||pc==="COMEBACK10"||pc.indexOf("COMEBACK10")===0)pd=Math.round(sub*0.10*100)/100;
  else if(pc==="FREESHIP")pd=0;
}

function updateSummary(){
  var it=getCart(),
      sub=it.reduce(function(s,i){return s+toNum(i.price)*(Number(i.qty)||1)},0);
  recalcPromo(sub);
  var ssbEl=document.getElementById("ssb");
  if(ssbEl)ssbEl.textContent=fmt(sub);
  var disc=pd||0,
      afterDisc=Math.max(0,sub-disc),
      freeShip=afterDisc>=29||afterDisc===0||pc==="FREESHIP",
      shipCost=freeShip?0:4.95,
      tot=afterDisc+shipCost;
  var sshEl=document.getElementById("ssh");
  if(sshEl){
    sshEl.textContent=afterDisc===0?"Calculated at checkout":(freeShip?"FREE (A$29+ Express)":fmt(shipCost));
  }
  var fs=document.getElementById("fs-bar");
  if(fs&&it.length>0){
    fs.style.display="block";
    if(freeShip){
      fs.innerHTML='<span style="color:#4ade80;">&#x2705; You unlocked <b>FREE Tracked Express Shipping</b>!</span>';
    }else{
      var rem=Math.max(0,29-afterDisc);
      fs.innerHTML='&#x1f69a; Add <b style="color:#fe3442;">'+fmt(rem)+'</b> more to unlock <b>FREE Express Shipping</b>';
    }
  }
  var plEl=document.getElementById("pl"),sdiEl=document.getElementById("sdi");
  if(disc>0){
    if(plEl)plEl.style.display="flex";
    if(sdiEl)sdiEl.textContent="-"+fmt(disc);
  }else{
    if(plEl)plEl.style.display="none";
  }
  var stoEl=document.getElementById("sto");
  if(stoEl)stoEl.textContent=fmt(tot);
}

function tp(){
  var pf=document.getElementById("pf");
  if(pf)pf.classList.toggle("on");
}

function ap(){
  var pi=document.getElementById("pi");
  var c=(pi&&pi.value||"").trim().toUpperCase();
  if(!c){toast("Enter a promo code");return}
  var it=getCart(),sub=it.reduce(function(s,i){return s+toNum(i.price)*(Number(i.qty)||1)},0);
  if(c==="BARGAIN26"){
    pc="BARGAIN26";
    recalcPromo(sub);
  }else if(c==="SAVE10"||c==="WELCOME10"||c==="COMEBACK10"||c.indexOf("COMEBACK10")===0){
    pc=c;
    recalcPromo(sub);
  }else if(c==="FREESHIP"){
    pc="FREESHIP";
    pd=0;
  }else{
    toast("Invalid code — try BARGAIN26 (30% OFF)");
    return;
  }
  try{localStorage.setItem("bd_promo",pc)}catch(e){}
  document.getElementById("pf").classList.remove("on");
  document.getElementById("pa").classList.add("on");
  document.getElementById("pcn").textContent=pc;
  document.getElementById("psv").textContent=pd>0?"-"+fmt(pd):"Free Shipping";
  if(pi)pi.value="";
  updateSummary();
  toast("Promo "+pc+" applied!");
}

function rp(){
  pc="";pd=0;
  try{localStorage.removeItem("bd_promo")}catch(e){}
  document.getElementById("pa").classList.remove("on");
  updateSummary();
  toast("Promo removed");
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

try{
  var savedPromo=localStorage.getItem("bd_promo");
  if(savedPromo&&["BARGAIN26","SAVE10","WELCOME10","COMEBACK10","FREESHIP"].indexOf(savedPromo)>=0){
    pc=savedPromo;
    var paEl=document.getElementById("pa"),pcnEl=document.getElementById("pcn"),psvEl=document.getElementById("psv");
    if(paEl&&pcnEl&&psvEl){
      var sub0=getCart().reduce(function(s,i){return s+toNum(i.price)*(Number(i.qty)||1)},0);
      recalcPromo(sub0);
      paEl.classList.add("on");
      pcnEl.textContent=pc;
      psvEl.textContent=pd>0?"-"+fmt(pd):"Free Shipping";
    }
  }
}catch(e){}

renderCart();
un();