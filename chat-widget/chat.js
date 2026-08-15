// Bargain Drop Support Widget — self-contained (no framework)
(function(){
  if(window.__bdChatLoaded) return; window.__bdChatLoaded = true;

  var API = (window.BD_CHAT && window.BD_CHAT.config && window.BD_CHAT.config.api) || window.location.origin;
  var sessionId = (function(){ try { var s=sessionStorage.getItem('bdchat_sid'); if(!s){ s='s'+Date.now().toString(36)+Math.random().toString(36).slice(2,8); sessionStorage.setItem('bdchat_sid',s);} return s; }catch(e){ return 's'+Math.random().toString(36).slice(2); } })();

  // Client-side conversation memory (capped) — sent with each request for multi-turn context.
  var history = [];
  try {
    var h = sessionStorage.getItem('bdchat_history');
    if (h) { var j = JSON.parse(h); if (Array.isArray(j)) history = j; }
  } catch(e) { history = []; }
  function pushHistory(role, text){
    history.push({ role: role, text: text });
    if (history.length > 30) history = history.slice(-30);
    try { sessionStorage.setItem('bdchat_history', JSON.stringify(history)); } catch(e){}
  }

  function el(tag, cls, txt){ var e=document.createElement(tag); if(cls)e.className=cls; if(txt)e.textContent=txt; return e; }

  // Build DOM
  var root = el('div'); root.id='bdchat-root';
  var launcher = el('button'); launcher.id='bdchat-launcher'; launcher.innerHTML='💬'; launcher.setAttribute('aria-label','Chat with support');
  var panel = el('div'); panel.id='bdchat-panel';

  var head = el('div'); head.id='bdchat-head';
  head.appendChild(el('span','dot',''));
  var htx = el('div'); htx.appendChild(el('div','ttl','Ruby · Bargain Drop AI')); htx.appendChild(el('div','sub','Online now · replies instantly'));
  head.appendChild(htx);

  var msgs = el('div'); msgs.id='bdchat-msgs';
  var sugs = el('div'); sugs.id='bdchat-sugs';
  var inp = el('div'); inp.id='bdchat-in';
  var input = el('input'); input.placeholder='Type your question…';
  var send = el('button','','Send');

  inp.appendChild(input); inp.appendChild(send);
  panel.appendChild(head); panel.appendChild(msgs); panel.appendChild(sugs); panel.appendChild(inp);
  root.appendChild(launcher); root.appendChild(panel);
  document.body.appendChild(root);

  function fmt(t){
    var s = String(t||'');
    s = s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\n/g, '<br>');
    return s;
  }
  function addMsg(text, who){
    var m = el('div','m '+who); m.innerHTML = fmt(text); msgs.appendChild(m); msgs.scrollTop=msgs.scrollHeight; return m;
  }

  function setSugs(list){
    sugs.innerHTML='';
    (list||[]).slice(0,5).forEach(function(s){
      var b=el('button','',s); b.onclick=function(){ input.value=s; ask(s); };
      sugs.appendChild(b);
    });
  }

  function ask(msg){
    var orderNumber=''; var m = String(msg||'');
    var om = m.match(/#?\b(BD-[A-Z0-9-]+)\b/i);
    if(om) orderNumber = om[1];
    var email=''; try{ email = (JSON.parse(localStorage.getItem('bd_user_email')||'null')) || ''; }catch(e){}
    if(email && String(email).replace(/"/g,'')==='null') email='';
    addMsg(m,'user');
    pushHistory('user', m);
    var typing = addMsg('<span class="dots"><span></span><span></span><span></span></span>','bot typing');
    fetch(API+'/api/chat',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ session_id: sessionId, message: m, history: history, context:{ order_number: orderNumber, email: email } })
    }).then(function(r){ return r.json(); }).then(function(d){
      typing.remove();
      var reply = d.reply || 'Sorry, something went wrong. Please try again.';
      addMsg(reply,'bot');
      pushHistory('assistant', reply);
      setSugs(d.suggestions);
    }).catch(function(){
      typing.remove();
      addMsg('Sorry, I\'m having trouble connecting. Please try again shortly.','bot');
    });
  }

  function toggle(){
    panel.classList.toggle('open');
    if(panel.classList.contains('open') && !msgs.childElementCount){
      addMsg('Hi! 👋 I\'m Ruby, your Bargain Drop assistant. I can help with:\n• Finding the perfect product or gift\n• Sizing, materials & stock\n• Tracking your order\n• Shipping & returns\n\nWhat can I do for you today?','bot');
      setSugs(['Where is my order?','Find a gift idea','Do you have size M?','Returns policy','Shipping times']);
    }
    if(panel.classList.contains('open')) input.focus();
  }

  launcher.onclick = toggle;
  send.onclick = function(){ var v=input.value.trim(); if(v){ input.value=''; ask(v); } };
  input.addEventListener('keydown', function(e){ if(e.key==='Enter'){ send.onclick(); } });
})();
