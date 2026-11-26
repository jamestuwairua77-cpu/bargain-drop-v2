(function () {
  if (window.__BD_RUBY_CHAT_LOADED__) return;
  window.__BD_RUBY_CHAT_LOADED__ = true;

  const STORAGE_KEY = 'bd_ruby_chat_history_v2';
  const WELCOME_MSG =
    "G'day! I'm **Ruby**, your Bargain Drop AI Specialist. I know every product, shipping rule, payment option, and live order status on the site.\n\n- **FREE Express Shipping** on orders A$29+ AUD\n- Paste your `BD-...` Order ID to track live\n- Tell me what you're shopping for or any issue you've hit — I'll solve it right away!";

  const QUICK_PROMPTS = [
    { label: '📦 Track My Order', text: 'How do I track my order and check live delivery status?' },
    { label: '🚚 Shipping & Delivery', text: 'How much is shipping and how long does delivery take?' },
    { label: '🔍 Items Under A$15', text: 'Show me your best in-stock items under $15' },
    { label: '↩️ Returns & Refunds', text: 'How do returns, damaged item replacements, and refunds work?' },
    { label: '💳 Payment Options', text: 'What payment methods do you accept at checkout?' },
  ];

  let history = [];
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(saved) && saved.length) history = saved.slice(-20);
  } catch (_) {}

  function saveHistory() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-20)));
    } catch (_) {}
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatMessageHtml(raw) {
    let text = escapeHtml(raw);

    // Inline code `CODE`
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold **text**
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Markdown links [Label](/path or https://...)
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g, function (_, label, url) {
      const safeUrl = url.replace(/"/g, '&quot;');
      const isExternal = /^https?:\/\//i.test(safeUrl);
      return '<a href="' + safeUrl + '"' + (isExternal ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + label + '</a>';
    });

    // Convert bullet lines (- item) into clean <ul>
    const lines = text.split('\n');
    let out = '';
    let inList = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
      if (bulletMatch) {
        if (!inList) {
          out += '<ul>';
          inList = true;
        }
        out += '<li>' + bulletMatch[1] + '</li>';
      } else {
        if (inList) {
          out += '</ul>';
          inList = false;
        }
        if (line) {
          out += (out && !out.endsWith('</ul>') ? '<br>' : '') + line;
        } else if (out && !out.endsWith('<br>')) {
          out += '<br>';
        }
      }
    }
    if (inList) out += '</ul>';
    return out;
  }

  function gatherClientContext() {
    const ctx = {
      page: window.location.pathname + window.location.search,
      productId: null,
      cartCount: 0,
      cartSubtotal: 0,
      userEmail: null,
    };
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('id')) ctx.productId = params.get('id');
    } catch (_) {}

    // Inspect localStorage cart (supports multiple cart key formats used across storefront)
    const cartKeys = ['bd_cart', 'bargain_drop_cart', 'cart'];
    for (let i = 0; i < cartKeys.length; i++) {
      try {
        const raw = localStorage.getItem(cartKeys[i]);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const items = Array.isArray(parsed) ? parsed : (parsed?.items || []);
        if (items.length) {
          ctx.cartCount = items.reduce(function (s, it) { return s + Number(it.quantity || it.qty || 1); }, 0);
          ctx.cartSubtotal = Number(items.reduce(function (s, it) {
            return s + Number(it.price || 0) * Number(it.quantity || it.qty || 1);
          }, 0).toFixed(2));
          break;
        }
      } catch (_) {}
    }

    try {
      const userRaw = localStorage.getItem('bd_user') || localStorage.getItem('bargain_drop_user');
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u && u.email) ctx.userEmail = u.email;
      }
    } catch (_) {}

    return ctx;
  }

  // Build DOM
  const fab = document.createElement('button');
  fab.id = 'bd-chat-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Open Ruby Bargain Drop AI Support');
  fab.innerHTML = '<span class="bd-fab-dot"></span><span>Ask Ruby AI</span>';

  const box = document.createElement('div');
  box.id = 'bd-chat-box';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', 'Ruby Bargain Drop AI Support');
  box.innerHTML =
    '<div id="bd-chat-head">' +
      '<div class="bd-chat-head-left">' +
        '<div class="bd-chat-avatar">R</div>' +
        '<div class="bd-chat-title-wrap">' +
          '<div class="bd-chat-title">Ruby · Bargain Drop AI</div>' +
          '<div class="bd-chat-sub">Instant Answers · Orders · Deals · Support</div>' +
        '</div>' +
      '</div>' +
      '<div class="bd-chat-head-actions">' +
        '<button type="button" class="bd-chat-icon-btn" id="bd-chat-reset" title="New conversation">↻</button>' +
        '<button type="button" class="bd-chat-icon-btn" id="bd-chat-close" title="Close chat">✕</button>' +
      '</div>' +
    '</div>' +
    '<div id="bd-chat-log"></div>' +
    '<div class="bd-quick-wrap" id="bd-quick-wrap"></div>' +
    '<form id="bd-chat-form">' +
      '<input id="bd-chat-input" type="text" placeholder="Ask anything, paste Order ID (BD-...), or search deals..." autocomplete="off" />' +
      '<button id="bd-chat-send" type="submit">Send</button>' +
    '</form>';

  document.body.appendChild(fab);
  document.body.appendChild(box);

  const log = box.querySelector('#bd-chat-log');
  const form = box.querySelector('#bd-chat-form');
  const input = box.querySelector('#bd-chat-input');
  const sendBtn = box.querySelector('#bd-chat-send');
  const quickWrap = box.querySelector('#bd-quick-wrap');
  const closeBtn = box.querySelector('#bd-chat-close');
  const resetBtn = box.querySelector('#bd-chat-reset');

  let isSending = false;

  function appendMsg(role, content, isTyping) {
    const d = document.createElement('div');
    d.className = 'bd-msg ' + role;
    if (isTyping) {
      d.innerHTML = '<div class="bd-typing">Ruby is checking <span></span><span></span><span></span></div>';
    } else if (role === 'bot') {
      d.innerHTML = formatMessageHtml(content);
    } else {
      d.textContent = content;
    }
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function renderInitialLog() {
    log.innerHTML = '';
    appendMsg('bot', WELCOME_MSG);
    for (let i = 0; i < history.length; i++) {
      const m = history[i];
      appendMsg(m.role === 'user' ? 'user' : 'bot', m.content);
    }
  }

  QUICK_PROMPTS.forEach(function (qp) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bd-quick-btn';
    b.textContent = qp.label;
    b.addEventListener('click', function () {
      sendMessage(qp.text);
    });
    quickWrap.appendChild(b);
  });

  renderInitialLog();

  function openChat() {
    box.classList.add('open');
    setTimeout(function () { input.focus(); }, 60);
  }

  function closeChat() {
    box.classList.remove('open');
  }

  fab.addEventListener('click', function () {
    if (box.classList.contains('open')) closeChat();
    else openChat();
  });

  closeBtn.addEventListener('click', closeChat);

  resetBtn.addEventListener('click', function () {
    history = [];
    saveHistory();
    renderInitialLog();
    input.focus();
  });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && box.classList.contains('open')) closeChat();
  });

  async function sendMessage(text) {
    const clean = String(text || '').trim();
    if (!clean || isSending) return;
    isSending = true;
    sendBtn.disabled = true;

    appendMsg('user', clean);
    history.push({ role: 'user', content: clean });
    saveHistory();
    input.value = '';

    const typingNode = appendMsg('bot', '', true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.slice(-14),
          context: gatherClientContext(),
        }),
      });
      const data = await res.json().catch(function () { return {}; });
      const reply = data.reply || data.error || 'I hit a quick connection snag — please try again or email Support@bargain-drop.online.';
      typingNode.innerHTML = formatMessageHtml(reply);
      history.push({ role: 'assistant', content: reply });
      saveHistory();
    } catch (_) {
      const errText = 'Connection interrupted — please check your internet and try again, or email **Support@bargain-drop.online** for immediate help.';
      typingNode.innerHTML = formatMessageHtml(errText);
    } finally {
      isSending = false;
      sendBtn.disabled = false;
      log.scrollTop = log.scrollHeight;
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    sendMessage(input.value);
  });

  // Expose helper so any button on the site can open Ruby with a question
  window.openBargainDropAI = function (prefill) {
    openChat();
    if (prefill) sendMessage(prefill);
  };
})();