<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BargainDrop AI — Gemini 3.8 Flash Autonomous Agent</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            gblue: '#4285F4',
            gred: '#EA4335',
            gyellow: '#FBBC05',
            ggreen: '#34A853',
            ink: '#0e1117',
            panel: '#131722',
            panel2: '#161b22',
            edge: '#2d333b',
          },
          fontFamily: {
            mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
            sans: ['Inter', 'Google Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    :root { color-scheme: dark; }
    body { background: #0e1117; color: #e8eaed; }
    .scrollbar-thin::-webkit-scrollbar { width: 8px; height: 8px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #2d333b; border-radius: 8px; }
    .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #4285F4; }
    .google-glow { box-shadow: 0 0 0 1px rgba(66,133,244,0.35), 0 8px 32px -8px rgba(66,133,244,0.45); }
    @keyframes pulse-dot { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
    .typing-dot { animation: pulse-dot 1.2s infinite ease-in-out; }
    .typing-dot:nth-child(2){ animation-delay:.15s }
    .typing-dot:nth-child(3){ animation-delay:.3s }
    .fade-in { animation: fadeIn .25s ease; }
    @keyframes fadeIn { from { opacity:0; transform: translateY(5px) } to { opacity:1; transform:none } }
    .spinner { width: 14px; height: 14px; border: 2px solid rgba(66,133,244,.25); border-top-color: #4285F4; border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .chat-attach-img { max-width: 16rem; max-height: 12rem; border-radius: 0.75rem; border: 1px solid rgba(255,255,255,.15); object-fit: cover; margin-top: 0.5rem; }
  </style>
</head>
<body class="bg-ink text-[#e8eaed] font-sans antialiased h-screen flex flex-col overflow-hidden">

  <!-- 1. ICONIC 4-COLOR GOOGLE ACCENT BAR -->
  <div class="h-1 w-full flex shrink-0">
    <div class="w-1/4 h-full bg-[#4285F4]"></div>
    <div class="w-1/4 h-full bg-[#EA4335]"></div>
    <div class="w-1/4 h-full bg-[#FBBC05]"></div>
    <div class="w-1/4 h-full bg-[#34A853]"></div>
  </div>

  <!-- 2. HEADER -->
  <header class="flex items-center justify-between px-4 py-2.5 border-b border-edge bg-panel shrink-0 gap-3">
    <div class="flex items-center gap-3 min-w-0">
      <div class="h-9 w-9 rounded-xl bg-panel2 border border-[#3c4043] flex items-center justify-center google-glow shrink-0 relative">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="gStar" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#4285F4"/>
              <stop offset="35%" stop-color="#EA4335"/>
              <stop offset="70%" stop-color="#FBBC05"/>
              <stop offset="100%" stop-color="#34A853"/>
            </linearGradient>
          </defs>
          <path d="M12 2C12 7.52 16.48 12 22 12C16.48 12 12 16.48 12 22C12 16.48 7.52 12 2 12C7.52 12 12 7.52 12 2Z" fill="url(#gStar)"/>
        </svg>
        <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#34A853] border-2 border-panel"></span>
      </div>
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1 class="text-sm font-bold tracking-tight text-white truncate">BargainDrop AI</h1>
          <span id="model-badge" class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#4285F4]/15 text-[#8ab4f8] border border-[#4285F4]/40">gemini-3.8-flash</span>
          <span class="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#34A853]/15 text-[#81c995] border border-[#34A853]/40">∞ No Token Limit</span>
        </div>
        <p class="text-[11px] text-[#9aa0a6] truncate">bargain-drop.online/bargaindrop-ai · Full Agent Permissions · Multimodal · Web Browser &amp; Live Preview</p>
      </div>
    </div>

    <!-- Center Mode Tabs -->
    <div class="flex items-center bg-ink p-1 rounded-xl border border-edge text-xs shrink-0">
      <button onclick="setWorkspaceView('split-preview')" id="tab-split-preview" class="px-3 py-1.5 rounded-lg font-semibold bg-[#4285F4] text-white transition">💬+👁️ Chat + Preview</button>
      <button onclick="setWorkspaceView('split-browser')" id="tab-split-browser" class="px-3 py-1.5 rounded-lg font-semibold text-[#9aa0a6] hover:text-white transition">💬+🌐 Chat + Browser</button>
      <button onclick="setWorkspaceView('chat')" id="tab-chat" class="px-3 py-1.5 rounded-lg font-semibold text-[#9aa0a6] hover:text-white transition">Chat</button>
      <button onclick="setWorkspaceView('browser')" id="tab-browser" class="px-3 py-1.5 rounded-lg font-semibold text-[#9aa0a6] hover:text-white transition">🌐 Browser</button>
      <button onclick="setWorkspaceView('preview')" id="tab-preview" class="px-3 py-1.5 rounded-lg font-semibold text-[#9aa0a6] hover:text-white transition">👁️ Preview</button>
    </div>

    <!-- Right Controls -->
    <div class="flex items-center gap-2 shrink-0">
      <button id="takeover-btn" onclick="toggleBrowserTakeover()" class="text-xs px-3 py-1.5 rounded-lg font-bold border border-[#3c4043] bg-panel2 text-white hover:border-[#FBBC05] transition">
        🖐️ Takeover Browser
      </button>
      <button id="clear-btn" class="text-xs px-2.5 py-1.5 rounded-lg border border-edge hover:bg-panel2 transition text-[#9aa0a6] hover:text-white">Clear</button>
      <button id="export-btn" class="text-xs px-2.5 py-1.5 rounded-lg border border-edge hover:bg-panel2 transition text-[#9aa0a6] hover:text-white hidden md:inline-block">Export JSON</button>
    </div>
  </header>

  <!-- 3. MAIN WORKSPACE -->
  <div class="flex-1 flex overflow-hidden">
    <!-- LEFT: CHAT CONSOLE -->
    <div id="pane-chat" class="w-full lg:w-[52%] flex flex-col h-full border-r border-edge bg-ink">
      <main id="chat-scroll" class="flex-1 overflow-y-auto scrollbar-thin px-4 py-5">
        <div id="chat" class="max-w-3xl mx-auto flex flex-col gap-4"></div>
      </main>

      <footer class="px-4 pb-3 pt-2 border-t border-edge bg-panel">
        <form id="composer" class="max-w-3xl mx-auto">
          <div id="previews" class="hidden flex-wrap gap-2 mb-2 p-2 rounded-xl bg-ink border border-edge"></div>
          <input id="file-input" type="file" multiple accept="image/*,.csv,.json,.xlsx,.xls,.txt,.md,.html,.js,.ts,.py,.pdf" class="hidden" />

          <div class="flex items-end gap-2 bg-ink border-2 border-[#3c4043] focus-within:border-[#4285F4] rounded-2xl px-3 py-2.5 transition shadow-lg">
            <button type="button" id="attach-btn" title="Attach pictures or files"
              class="h-9 w-9 shrink-0 rounded-xl bg-panel2 hover:bg-[#2d3548] flex items-center justify-center text-[#8ab4f8] transition">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57a4 4 0 0 1 5.66 5.66l-8.57 8.57a2 2 0 0 1-2.83-2.83l8.4-8.4"/></svg>
            </button>

            <textarea id="input" rows="1" placeholder="Ask Gemini 3.8 Flash to edit files, search the web, browse URLs, or audit Bargain Drop…"
              class="flex-1 bg-transparent resize-none outline-none text-sm text-white placeholder-[#9aa0a6] leading-relaxed max-h-40 py-1"></textarea>

            <button type="submit" id="send-btn" class="h-9 px-4 shrink-0 rounded-xl bg-[#4285F4] hover:bg-[#1a73e8] text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40">
              <span>Send</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 3 18 9-18 9 4-9z"/><path d="M7 12h14"/></svg>
            </button>
          </div>
          <div class="flex items-center justify-between text-[10px] text-[#9aa0a6] mt-1.5 px-1">
            <span class="text-[#81c995]">● Tools Active: Web Search · Browser · File R/W · Repricer · Zaro</span>
            <span>Model: <strong class="text-[#8ab4f8] font-mono">gemini-3.8-flash</strong> · Attach or Paste Images/Files</span>
          </div>
        </form>
      </footer>
    </div>

    <!-- RIGHT A: AGENT BROWSER WITH USER TAKEOVER -->
    <div id="pane-browser" class="hidden flex-1 flex-col h-full bg-panel overflow-hidden">
      <div id="browser-bar" class="px-3 py-2 border-b border-edge bg-panel2 flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span id="browser-mode-badge" class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#34A853] text-black">🤖 AGENT BROWSER</span>
            <span id="browser-mode-desc" class="text-[11px] text-[#9aa0a6]">Gemini 3.8 Flash automatically browses &amp; searches here.</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button type="button" onclick="toggleBrowserTakeover()" id="browser-takeover-inner-btn" class="px-3 py-1 rounded-lg text-xs font-bold bg-[#FBBC05] text-black border border-white">
              🖐️ Takeover Browser Now
            </button>
            <button type="button" onclick="sendBrowserContextToChat()" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#4285F4] text-white">
              📤 Send Page to Chat
            </button>
          </div>
        </div>
        <form onsubmit="event.preventDefault(); navigateAgentBrowser(document.getElementById('browser-url-input').value);" class="flex items-center gap-1.5">
          <input id="browser-url-input" type="text" value="/store/index.html" placeholder="Enter URL or web search query…"
            class="flex-1 bg-ink border border-[#3c4043] focus:border-[#4285F4] rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none" />
          <button type="submit" class="px-3 py-1.5 rounded-lg bg-[#4285F4] text-white text-xs font-bold">Go</button>
        </form>
      </div>
      <iframe id="browser-iframe" src="/store/index.html" class="w-full flex-1 border-0 bg-white"></iframe>
    </div>

    <!-- RIGHT B: LIVE STOREFRONT PREVIEW TAB -->
    <div id="pane-preview" class="flex-1 flex flex-col h-full bg-panel overflow-hidden">
      <div class="px-3 py-2 border-b border-edge bg-panel2 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-[#34A853]"></span>
          <span class="text-xs font-bold text-white">Live Store Preview</span>
          <select id="preview-route-select" onchange="document.getElementById('preview-iframe').src = this.value"
            class="bg-ink border border-[#3c4043] rounded-lg px-2.5 py-1 text-xs text-[#8ab4f8] font-mono outline-none">
            <option value="/store/index.html">Homepage (/store/index.html)</option>
            <option value="/store/products.html">Products (/store/products.html)</option>
            <option value="/store/categories.html">Categories (/store/categories.html)</option>
            <option value="/store/logos.html">Logos (/store/logos.html)</option>
            <option value="/store/admin.html">Admin (/store/admin.html)</option>
          </select>
        </div>
        <button onclick="reloadPreview()" class="px-2.5 py-1 rounded-lg bg-ink hover:bg-panel2 border border-[#3c4043] text-xs text-white">↻ Reload</button>
      </div>
      <div class="flex-1 bg-black p-2 flex items-center justify-center overflow-hidden">
        <iframe id="preview-iframe" src="/store/index.html" class="w-full h-full rounded-xl border border-[#3c4043] bg-white"></iframe>
      </div>
    </div>
  </div>

  <!-- EXECUTE MODAL -->
  <div id="exec-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/75 backdrop-blur-sm" onclick="closeExec()"></div>
    <div class="relative bg-panel border border-edge rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col fade-in">
      <div class="flex items-center justify-between px-5 py-3 border-b border-edge">
        <h2 class="text-sm font-semibold text-white">Execute via Zaro</h2>
        <button onclick="closeExec()" class="text-slate-400 hover:text-white text-lg leading-none">×</button>
      </div>
      <div class="px-5 py-3 text-xs text-[#9aa0a6] bg-panel2 border-b border-edge">
        This blueprint will be applied to <span class="font-mono text-[#8ab4f8]">/scripts/catalog-repricer.fixed.js</span>, then a live test loop runs across the 24 shards + Shopify.
      </div>
      <div id="exec-stream" class="hidden px-5 py-3 border-b border-edge bg-ink/60 max-h-40 overflow-y-auto scrollbar-thin space-y-1.5"></div>
      <div class="flex-1 overflow-y-auto scrollbar-thin p-5">
        <pre id="exec-code" class="text-xs font-mono whitespace-pre-wrap text-slate-300 bg-ink border border-edge rounded-lg p-4 max-h-[38vh] overflow-auto"></pre>
      </div>
      <div class="px-5 py-3 border-t border-edge flex items-center justify-between gap-3">
        <div class="flex flex-col gap-1">
          <div id="exec-status" class="text-xs text-[#9aa0a6]">Authenticate with admin PIN to execute.</div>
          <input id="exec-pin" type="password" placeholder="Admin PIN" class="hidden text-xs bg-panel2 border border-edge rounded-md px-3 py-1.5 outline-none focus:border-[#4285F4] w-48">
        </div>
        <div class="flex items-center gap-2">
          <button onclick="closeExec()" class="text-xs px-3 py-2 rounded-md border border-edge hover:bg-panel2 transition">Cancel</button>
          <button id="exec-confirm" onclick="confirmExec()" class="text-xs px-4 py-2 rounded-md bg-[#4285F4] hover:bg-[#1a73e8] text-white font-bold transition">Confirm &amp; Execute</button>
        </div>
      </div>
    </div>
  </div>

<script>
const CONFIG = {
  AGENT_STREAM: '/api/agent/stream',
  ARCHITECT_BASE: '/api/architect',
};

let pendingAttachments = [];
let pendingExec = null;
let browserTakeover = false;

function setWorkspaceView(mode) {
  const chat = document.getElementById('pane-chat');
  const browser = document.getElementById('pane-browser');
  const preview = document.getElementById('pane-preview');
  const tabs = ['split-preview', 'split-browser', 'chat', 'browser', 'preview'];
  tabs.forEach(t => {
    const el = document.getElementById('tab-' + t);
    if (el) el.className = 'px-3 py-1.5 rounded-lg font-semibold transition ' + (t === mode ? 'bg-[#4285F4] text-white' : 'text-[#9aa0a6] hover:text-white');
  });

  chat.classList.add('hidden');
  browser.classList.add('hidden');
  preview.classList.add('hidden');
  chat.classList.remove('lg:w-[52%]', 'w-full');

  if (mode === 'split-preview') {
    chat.classList.remove('hidden'); chat.classList.add('w-full', 'lg:w-[52%]');
    preview.classList.remove('hidden'); preview.classList.add('flex');
  } else if (mode === 'split-browser') {
    chat.classList.remove('hidden'); chat.classList.add('w-full', 'lg:w-[52%]');
    browser.classList.remove('hidden'); browser.classList.add('flex');
  } else if (mode === 'chat') {
    chat.classList.remove('hidden'); chat.classList.add('w-full');
  } else if (mode === 'browser') {
    browser.classList.remove('hidden'); browser.classList.add('flex');
  } else if (mode === 'preview') {
    preview.classList.remove('hidden'); preview.classList.add('flex');
  }
}

function toggleBrowserTakeover() {
  browserTakeover = !browserTakeover;
  const topBtn = document.getElementById('takeover-btn');
  const innerBtn = document.getElementById('browser-takeover-inner-btn');
  const badge = document.getElementById('browser-mode-badge');
  const desc = document.getElementById('browser-mode-desc');

  if (browserTakeover) {
    topBtn.textContent = '🎮 Browser Takeover: ON';
    topBtn.className = 'text-xs px-3 py-1.5 rounded-lg font-bold border border-white bg-[#FBBC05] text-black shadow';
    innerBtn.textContent = '✓ Release Control to Agent';
    innerBtn.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-[#34A853] text-black border border-white';
    badge.textContent = '🎮 USER TAKEOVER ACTIVE';
    badge.className = 'px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#FBBC05] text-black';
    desc.textContent = 'Manual control active — browse any page and click "Send Page to Chat".';
    setWorkspaceView('split-browser');
  } else {
    topBtn.textContent = '🖐️ Takeover Browser';
    topBtn.className = 'text-xs px-3 py-1.5 rounded-lg font-bold border border-[#3c4043] bg-panel2 text-white hover:border-[#FBBC05] transition';
    innerBtn.textContent = '🖐️ Takeover Browser Now';
    innerBtn.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-[#FBBC05] text-black border border-white';
    badge.textContent = '🤖 AGENT BROWSER';
    badge.className = 'px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#34A853] text-black';
    desc.textContent = 'Gemini 3.8 Flash automatically browses & searches here.';
  }
}

function navigateAgentBrowser(raw) {
  const val = String(raw || '').trim();
  if (!val) return;
  const iframe = document.getElementById('browser-iframe');
  const input = document.getElementById('browser-url-input');
  let target = val;
  if (!val.startsWith('/') && !val.startsWith('http://') && !val.startsWith('https://')) {
    target = 'https://www.google.com/search?igu=1&q=' + encodeURIComponent(val);
  }
  input.value = val;
  iframe.src = target;
}

function sendBrowserContextToChat() {
  const url = document.getElementById('browser-url-input').value;
  const input = document.getElementById('input');
  input.value = `Please inspect the current page open in the Agent Browser (${url}) and help me update or optimize it.`;
  document.getElementById('composer').requestSubmit();
}

function reloadPreview() {
  const iframe = document.getElementById('preview-iframe');
  iframe.src = iframe.src.split('?')[0] + '?t=' + Date.now();
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderMarkdown(text) {
  let out = escapeHtml(text);
  const codeBlocks = [];
  out = out.replace(/```([\s\S]*?)```/g, (m, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(code.replace(/^\s*[\r\n]+/, '').replace(/\s+$/,''));
    return `\u0000CODE${idx}\u0000`;
  });
  out = out.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-black/40 text-[#8ab4f8] font-mono text-[12px]">$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
  out = out.replace(/\n/g, '<br/>');
  codeBlocks.forEach((code, idx) => {
    out = out.replace(`\u0000CODE${idx}\u0000`,
      `<div class="code-block relative mt-2 mb-1">
         <pre class="bg-[#090b10] border border-edge rounded-xl p-3 overflow-x-auto text-[12px] leading-relaxed text-[#e8eaed]"><code>${code}</code></pre>
         <button class="exec-btn mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#4285F4] hover:bg-[#1a73e8] text-white transition"
                 data-code="${encodeURIComponent(code)}">
           ⚡ Execute via Zaro
         </button>
       </div>`);
  });
  return out;
}

const chatEl = document.getElementById('chat');
const scrollEl = document.getElementById('chat-scroll');
const CHAT_STORAGE_KEY = 'bargaindrop_ai_standalone_chat_v1';
let savedMessages = [];

function saveChatState() {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(savedMessages));
  } catch (e) {
    try {
      const compact = savedMessages.map(m => ({ ...m, attachments: (m.attachments || []).map(a => ({ ...a, url: a.kind === 'image' && a.url && a.url.length > 50000 ? '' : a.url })) }));
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(compact));
    } catch (_) {}
  }
}

function scrollBottom() { requestAnimationFrame(() => { scrollEl.scrollTop = scrollEl.scrollHeight; }); }

function addBubble(role, content, opts = {}) {
  const isUser = role === 'user';
  const wrapper = document.createElement('div');
  wrapper.className = 'fade-in flex ' + (isUser ? 'justify-end' : 'justify-start');
  const bubble = document.createElement('div');
  bubble.className = 'max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed ' +
    (isUser ? 'bg-[#1a73e8] text-white rounded-br-sm shadow-lg'
            : 'bg-panel2 border border-edge text-[#e8eaed] rounded-bl-sm shadow');
  bubble.innerHTML = opts.raw ? escapeHtml(content).replace(/\n/g,'<br/>') : renderMarkdown(content);

  if (opts.attachments && opts.attachments.length) {
    const attWrap = document.createElement('div');
    attWrap.className = 'flex flex-wrap gap-2 mt-2';
    for (const att of opts.attachments) {
      if (att.kind === 'image' && att.url) {
        const img = document.createElement('img');
        img.src = att.url; img.alt = att.name || 'image';
        img.className = 'chat-attach-img';
        attWrap.appendChild(img);
      } else {
        const chip = document.createElement('span');
        chip.className = 'inline-flex items-center gap-1.5 text-xs rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 font-mono';
        chip.textContent = '📄 ' + (att.name || 'file');
        attWrap.appendChild(chip);
      }
    }
    bubble.appendChild(attWrap);
  }

  if (!opts.skipSave) {
    savedMessages.push({ role, content, attachments: opts.attachments || [], ts: new Date().toISOString() });
    saveChatState();
  }

  wrapper.appendChild(bubble);
  chatEl.appendChild(wrapper);
  scrollBottom();
  return bubble;
}

const fileInput = document.getElementById('file-input');
const attachBtn = document.getElementById('attach-btn');
const previewsEl = document.getElementById('previews');

attachBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const files = Array.from(fileInput.files || []);
  fileInput.value = '';
  for (const f of files) addAttachment(f);
});

window.addEventListener('paste', (e) => {
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  for (let i = 0; i < items.length; i++) {
    if (items[i].kind === 'file') {
      const f = items[i].getAsFile();
      if (f) addAttachment(f);
    }
  }
});

function guessMime(name) {
  const ext = (name || '').split('.').pop().toLowerCase();
  const map = { png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', webp:'image/webp', svg:'image/svg+xml', csv:'text/csv', json:'application/json', xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xls:'application/vnd.ms-excel', txt:'text/plain', md:'text/markdown', html:'text/html', js:'text/javascript', ts:'text/plain' };
  return map[ext] || 'text/plain';
}

function addAttachment(file) {
  const id = 'att-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const mime = file.type || guessMime(file.name);
  const kind = mime.startsWith('image/') ? 'image' : 'document';
  const reader = new FileReader();
  reader.onload = () => {
    const dataB64 = String(reader.result || '');
    const entry = { id, kind, mime, name: file.name, dataB64 };
    pendingAttachments.push(entry);
    const card = document.createElement('div');
    card.className = 'relative group shrink-0 rounded-lg overflow-hidden border border-edge bg-panel2';
    if (kind === 'image') {
      card.innerHTML = `<img src="${dataB64}" class="h-14 w-14 object-cover" />`;
    } else {
      card.innerHTML = `<div class="h-14 w-36 px-2.5 flex flex-col justify-center"><span class="text-[11px] font-bold text-white truncate">📄 ${escapeHtml(file.name)}</span><span class="text-[9px] text-[#9aa0a6] uppercase">${escapeHtml(mime.split('/').pop())}</span></div>`;
    }
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'absolute top-1 right-1 h-4 w-4 rounded-full bg-black/80 text-white text-[10px] flex items-center justify-center hover:bg-[#EA4335]';
    rm.textContent = '×';
    rm.onclick = () => {
      card.remove();
      pendingAttachments = pendingAttachments.filter(a => a.id !== id);
      if (!pendingAttachments.length) previewsEl.classList.add('hidden');
    };
    card.appendChild(rm);
    previewsEl.appendChild(card);
    previewsEl.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

const form = document.getElementById('composer');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send-btn');

input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 160) + 'px'; });
input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  const attachments = pendingAttachments.map(a => ({ mime: a.mime, name: a.name, data: a.dataB64 }));
  if (!text && attachments.length === 0) return;

  input.value = ''; input.style.height = 'auto';
  const localAttach = pendingAttachments.map(a => ({ kind: a.kind, mime: a.mime, name: a.name, url: a.dataB64 }));
  addBubble('user', text || '(Attachment)', { attachments: localAttach });

  pendingAttachments = [];
  previewsEl.innerHTML = '';
  previewsEl.classList.add('hidden');
  sendBtn.disabled = true;

  // Create live streaming assistant bubble
  const streamBubble = addBubble('assistant', '⏳ Connecting to Gemini 3.8 Flash…', { skipSave: true });
  let accumulatedText = '';
  let phaseLogs = [];

  try {
    const res = await fetch(CONFIG.ARCHITECT_BASE + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
      body: JSON.stringify({ stream: true, message: text, attachments }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const frame = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        let ev = 'message', data = '';
        for (const ln of frame.split('\n')) {
          if (ln.startsWith('event:')) ev = ln.slice(6).trim();
          else if (ln.startsWith('data:')) data += ln.slice(5).trim();
        }
        let parsed; try { parsed = JSON.parse(data); } catch { continue; }

        if (ev === 'phase') {
          phaseLogs.push(`${parsed.icon || '⚙️'} ${parsed.text || ''}`);
          if (!accumulatedText) {
            streamBubble.innerHTML = `<div class="text-xs font-mono text-[#8ab4f8] space-y-1">${phaseLogs.map(escapeHtml).join('<br/>')}</div>`;
          }
        } else if (ev === 'token') {
          accumulatedText += (parsed.text || '');
          streamBubble.innerHTML = renderMarkdown(accumulatedText);
          scrollBottom();
        } else if (ev === 'browser_navigate' && !browserTakeover && parsed.url) {
          navigateAgentBrowser(parsed.url);
        } else if (ev === 'preview_refresh') {
          reloadPreview();
        } else if (ev === 'done') {
          const finalReply = accumulatedText || parsed.reply || '';
          streamBubble.innerHTML = renderMarkdown(finalReply);
          document.getElementById('model-badge').textContent = parsed.model || 'gemini-3.8-flash';
          savedMessages.push({ role: 'assistant', content: finalReply, ts: new Date().toISOString() });
          saveChatState();
          bindExecButtons();
        } else if (ev === 'error') {
          throw new Error(parsed.error || 'Stream error');
        }
      }
    }
  } catch (err) {
    const errMsg = `⚠️ **Error:** ${err.message}`;
    streamBubble.innerHTML = `⚠️ <strong>Error:</strong> ${escapeHtml(err.message)}`;
    savedMessages.push({ role: 'assistant', content: errMsg, ts: new Date().toISOString() });
    saveChatState();
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
});

function bindExecButtons() {
  document.querySelectorAll('.exec-btn').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => openExec(decodeURIComponent(btn.dataset.code)));
  });
}

function openExec(code) {
  pendingExec = code;
  document.getElementById('exec-code').textContent = code;
  document.getElementById('exec-pin').classList.remove('hidden');
  document.getElementById('exec-modal').classList.remove('hidden');
}
function closeExec() { pendingExec = null; document.getElementById('exec-modal').classList.add('hidden'); }

async function confirmExec() {
  if (!pendingExec) return;
  const pin = document.getElementById('exec-pin').value.trim();
  const statusEl = document.getElementById('exec-status');
  statusEl.textContent = 'Applying blueprint + running live test loop…';
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (pin) headers['X-Admin-Pin'] = pin;
    const res = await fetch(CONFIG.ARCHITECT_BASE + '/exec', {
      method: 'POST',
      headers,
      body: JSON.stringify({ blueprint: pendingExec }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || 'Exec failed');
    statusEl.textContent = 'Applied ✓';
    addBubble('assistant', `### ✅ Executed via Zaro\n- **Blueprint**: \`${d.stagePath || d.target}\``);
    setTimeout(closeExec, 1200);
  } catch (e) {
    statusEl.textContent = 'Failed: ' + e.message;
  }
}

document.getElementById('clear-btn').addEventListener('click', () => {
  savedMessages = [];
  try { localStorage.removeItem(CHAT_STORAGE_KEY); } catch (_) {}
  chatEl.innerHTML = '';
  renderWelcome();
});

function renderWelcome() {
  addBubble('assistant',
`### ✨ Gemini 3.8 Flash — Bargain Drop Autonomous Agent

Welcome to **BargainDrop AI** (\`bargain-drop.online/bargaindrop-ai\`). I am running **Gemini 3.8 Flash** with **unrestricted agent permissions**, **Google colors**, **real-time streaming**, **no token limit**, **multimodal image/file attachments**, **live web search & browser takeover**, and **integrated live preview**.`, { skipSave: true });
}

function initChatFromStorage() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        savedMessages = parsed;
        renderWelcome();
        for (const msg of savedMessages) {
          addBubble(msg.role, msg.content, { attachments: msg.attachments, skipSave: true });
        }
        bindExecButtons();
        return;
      }
    }
  } catch (e) {}
  renderWelcome();
}

function initLiveDomainRoutes() {
  if (window.location.hostname === 'bargain-drop.online' || !window.location.pathname.startsWith('/store/')) {
    const sel = document.getElementById('preview-route-select');
    const prevIframe = document.getElementById('preview-iframe');
    const browIframe = document.getElementById('browser-iframe');
    const browInput = document.getElementById('browser-url-input');
    if (sel && window.location.hostname === 'bargain-drop.online') {
      Array.from(sel.options).forEach(opt => {
        opt.value = opt.value.replace(/^\/store\//, '/');
        opt.textContent = opt.textContent.replace('/store/', '/');
      });
      if (prevIframe) prevIframe.src = '/index.html';
      if (browIframe) browIframe.src = '/index.html';
      if (browInput) browInput.value = '/index.html';
    }
  }
}

initLiveDomainRoutes();
initChatFromStorage();
</script>
  <script src="/js/logo-handler.js"></script>
</body>
</html>