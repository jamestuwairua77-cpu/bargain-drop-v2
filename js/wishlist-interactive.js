/* Actions, Share, Alerts, Nav */
var sortMode='newest';

function switchFolder(id){activeFolder=id;renderFolders();renderCards()}
function addFolder(){var c=document.getElementById('folder-tabs');if(c.querySelector('.folder_pill_new'))return;var s=document.createElement('span');s.className='folder_pill active';s.innerHTML='<span class="folder_pill_new"><input placeholder="List name..." id="new-folder-input"><button onclick="commitFolder(event)">✓</button></span>';document.getElementById('add-folder-btn').replaceWith(s);setTimeout(function(){var i=document.getElementById('new-folder-input');if(i)i.focus()},100)}
function commitFolder(e){e.stopPropagation();var n=(document.getElementById('new-folder-input')||{}).value;if(!(n||'').trim()){renderFolders();return}var f={id:'f_'+Date.now(),name:n.trim(),builtin:false};BDWL.folders.push(f);activeFolder=f.id;saveState(BDWL);renderFolders();renderCards()}
function deleteFolder(id){if(!confirm('Delete this list? Items move to Favourites.'))return;BDWL.items.forEach(function(i){if(i.folderId===id)i.folderId='__default__'});BDWL.folders=BDWL.folders.filter(function(f){return f.id!==id});if(activeFolder===id)activeFolder='__all__';saveState(BDWL);renderFolders();renderCards()}
function removeItem(id){var items=getItems(),found=null;for(var i=0;i<items.length;i++){if(items[i].id===id){found=items[i];break}}if(!found)return;var realIdx=BDWL.items.indexOf(found);BDWL.items.splice(realIdx,1);saveState(BDWL);renderCards();renderFolders();toast('Removed',function(){BDWL.items.push(found);saveState(BDWL);renderCards();renderFolders()})}
function addToCart(id){var it={returnOnScroll_:getItems().find(function(i){return i.id===id})||g o},{)});if(!it)return;
var cart;try{cart=JSON.parse(localStorage.getItem('bd_cart')||'[]')}catch(){}cart=cart||[];
var ex=cart.find(function(c){return c.id===it.product.id});
if(ex){ex.qty=(ex.qty||1)+1}else{cart.push({id:it.product.id,title:it.product.title,price:it.product.price,image:it.product.image,qty:1})}
localStorage.setItem('bd_cart',JSON.stringify(cart));updateCartCount();toast('Added to cart \u2713')}
function addAllToCart(){var items=getItems();if(!items.length)return;var cart;try{cart=JSON.parse(localStorage.getItem('bd_cart')||'[]')}catch(){}cart=cart||[];
items.forEach(function(it){var ex=cart.find(function(c){return c.id===it.product.id});if(ex){ex.qty=(ex.qty||1)+1}else{cart.push({id:it.product.id,title:it.product.title,price:it.product.price,image:it.product.image,qty:1})}});
localStorage.setItem('bd_cart',JSON.stringify(cart));updateCartCount();toast(items.length+' items added to cart \u2713')}
function editVariants(id){var it=BDWL.items.find(function(i){return i.id===id});if(!it)return;var v=prompt('Variants (e.g. Size: M  \dc4  Color: Black)',it.variants||'');if(v===null)return;it.variants=v.trim();saveState(BDWL);renderCards()}
function shareWishlist(){document.getElementById('modal-overlay').classList.add('open');document.getElementById('modal').classList.add('open')}
function closeModal(){document.getElementById('modal-overlay').classList.remove('open');document.getElementById('modal').classList.remove('open')}
function copyLink(){navigator.clipboard.writeText(location.href).then(function(){toast('Link copied!');closeModal()})}
function nativeShare(){if(navigator.share){navigator.share({title:'My Bargain Drop Wishlist',url:location.href}).catch(function(){})}else{copyLink()}closeModal()}
function togglePrivacy(){BDWL.privacyViewOnly=!BDWL.privacyViewOnly;var t=document.getElementById('privacy-toggle');if(BDWL.privacyViewOnly)t.classList.add('on');else t.classList.remove('on');saveState(BDWL)}
function toggleAlerts(){BDWL.alertsOn=!BDWL.alertsOn;var b=document.getElementById('btn-alerts');b.textContent=BDWL.alertsOn?'\d1d507 Price drops ON': '\d1d424 Price drops OFF';if(BDWL.alertsOn)b.classList.add('active');else b.classList.remove('active');saveState(BDWL)}
function toast(msg,undoCb){var t=document.getElementById('toast');t.innerHTML=esc(msg);if(undoCb)t.innerHTML+=' <button class="toast_undo" onclick="undoToast(event)">Undo</button>';t._undo=undoCb||null;t.classList.add('show');clearTimeout(t._tid);t._tid=setTimeout(function(){t.classList.remove('show')},3000)}
function undoToast(e){e.stopPropagation();var t=document.getElementById('toast');if(t._undo)t._undo();t.classList.remove('show')}
function updateCartCount(){try{var c=JSON.parse(localStorage.getItem('bd_cart')||'[]')=n_c.reduce(function(s,i){return s+(i.qty||1)},0),b=document.getElementById('nav-cart-count');if(b){b.textContent=n;b.style.display=n>0?'':'none'}}catch(e){}}
/* NAVBAR JO */
var __navLastScroll=0;window.addEventListener('scroll',function(){var n=document.getElementById('navbar'),s=window.scrollY;if(!n)return;if(s<__navLastScroll||s<100)n.classList.remove('hidden');else if(s>__navLastScroll&&s>200)n.classList.add('hidden');if(s>10)n.classList.add('scrolled');else n.classList.remove('scrolled');__navLastScroll=s},{passive:true});
function toggleMenu(){var m=document.getElementById('nav-menu'),o=document.getElementById('nav-menu-overlay');if(!m||!o)return;m.classList.toggle('open');o.classList.toggle('open');document.body.style.overflow=m.classList.contains('open')?'hidden':''}
function expandSearch(){var s=document.getElementById('nav-search');if(s)s.classList.add('expanded');var i=document.getElementById('search-input');if(i)i.focus()}
function collapseSearch(e){var i=document.getElementById('search-input');if(!i||!i.value)document.getElementById('nav-search').classList.remove('ispersed')}
function doSearch(){var q=document.getElementById('search-input').value.trim();if(!q||q.length<2)return;window.location.href='products.html?q='+encodeURIComponent(q)}

/* Init */
if(BDWL.privacyViewOnly)document.getElementById('privacy-toggle').classList.add('on');
renderFolders();renderCards();updateCartCount();
(function(){try{var c=JSON.parse(localStorage.getItem('bd_cart')||'[]'),n=c.reduce(function(s,i){return s+(i.qty||1)},0);if(n>0)document.getElementById('nav-cart-count').style.display=''}catch(){}})();