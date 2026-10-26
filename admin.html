<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<meta name="robots" content="noindex,nofollow">
<title>Admin &amp; Orders Command Center — Bargain Drop</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/css/shared.css">
<style>
:root{
  --bg: #09090b;
  --card: #121515;
  --card2: #181b1c;
  --fg: #ffffff;
  --muted: #dedede;
  --meta: #818181;
  --accent: #fe3442;
  --gold: #facc15;
  --green: #22c55e;
  --line: #222425;
  --line2: #2d3032;
  --radius: 8px;
}
*{margin:0;padding:0;box-sizing:border-box}
body{
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;
  background:var(--bg);
  color:var(--fg);
  -webkit-font-smoothing:antialiased;
  height:100vh;
  overflow:hidden;
  display:flex;
  flex-direction:column;
}
a{color:inherit;text-decoration:none}

/* Keypad PIN Overlay */
.overlay{position:fixed;inset:0;background:rgba(8,9,10,0.98);backdrop-filter:blur(16px);z-index:9999;display:flex;align-items:center;justify-content:center}
.overlay.hidden{display:none}
.keypad-wrap{text-align:center;max-width:320px;padding:24px;background:#0d0e10;border:1px solid var(--line);border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,0.8)}
.keypad-wrap h1{font-size:1.35rem;font-weight:900;margin-bottom:4px;letter-spacing:-0.5px}
.keypad-wrap h1 span{color:var(--accent)}
.keypad-wrap p{font-size:.72rem;color:var(--meta);margin-bottom:20px}
.keypad-display{display:flex;justify-content:center;gap:10px;margin-bottom:20px}
.keypad-dot{width:14px;height:14px;border-radius:50%;border:2px solid var(--line2);background:#08090a;transition:all .15s}
.keypad-dot.filled{background:var(--accent);border-color:var(--accent);box-shadow:0 0 10px rgba(254,52,66,0.6)}
.keypad-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:240px;margin:0 auto 16px}
.keypad-btn{aspect-ratio:1;border-radius:var(--radius);background:var(--card);border:1px solid var(--line);color:var(--fg);font-size:1.25rem;font-weight:700;cursor:pointer;transition:all .1s;display:flex;align-items:center;justify-content:center}
.keypad-btn:hover{border-color:var(--accent);color:#fff;background:var(--card2)}
.keypad-btn:active{background:var(--accent);color:#fff;transform:scale(.95)}
.keypad-btn.del{font-size:.85rem;background:transparent;border-color:transparent;color:var(--meta)}
.keypad-error{font-size:.7rem;color:var(--accent);min-height:20px;margin-bottom:8px;font-weight:700}

/* Header & Navigation Bar */
.admin-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 16px;
  height:58px;
  border-bottom:1px solid var(--line);
  background:rgba(8,9,10,0.98);
  flex-shrink:0;
  gap:12px;
}
.brand{display:flex;align-items:center;gap:10px}
.brand img{width:32px;height:32px;border-radius:6px;object-fit:contain;border:1px solid #363636;background:#08090a}
.brand-title{font-size:1rem;font-weight:900;letter-spacing:-0.3px;white-space:nowrap}
.brand-title .red{color:var(--accent)}

.tabs{display:flex;align-items:center;gap:6px;background:#060708;padding:3px;border-radius:8px;border:1px solid var(--line)}
.tab-btn{
  background:transparent;
  border:none;
  color:var(--muted);
  font-size:0.75rem;
  font-weight:800;
  padding:7px 14px;
  border-radius:6px;
  cursor:pointer;
  display:inline-flex;
  align-items:center;
  gap:6px;
  transition:all .15s;
}
.tab-btn:hover{color:#fff}
.tab-btn.active{
  background:linear-gradient(180deg,#fe3442 0%,#d32b3f 100%);
  color:#fff;
  box-shadow:0 2px 8px rgba(254,52,66,0.35);
}
.tab-badge{
  font-size:0.65rem;
  font-weight:900;
  padding:1px 6px;
  border-radius:10px;
  background:#111827;
  color:#fff;
  border:1px solid rgba(255,255,255,0.15);
}
.tab-btn.active .tab-badge{
  background:#fff;
  color:var(--accent);
  border-color:#fff;
}

.header-actions{display:flex;align-items:center;gap:8px}
.live-pill{
  display:inline-flex;
  align-items:center;
  gap:6px;
  font-size:0.68rem;
  font-weight:800;
  color:var(--green);
  background:rgba(34,197,94,0.1);
  border:1px solid rgba(34,197,94,0.25);
  padding:5px 10px;
  border-radius:999px;
  white-space:nowrap;
}
.live-dot{
  width:7px;
  height:7px;
  border-radius:50%;
  background:var(--green);
  box-shadow:0 0 8px var(--green);
  animation:pulse 2s infinite;
}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.85)}}

.btn{
  height:34px;
  padding:0 12px;
  border-radius:6px;
  border:1px solid var(--line);
  background:var(--card);
  color:var(--fg);
  font-size:.75rem;
  font-weight:700;
  cursor:pointer;
  display:inline-flex;
  align-items:center;
  gap:6px;
  transition:all .15s;
  white-space:nowrap;
}
.btn:hover{border-color:var(--accent);color:#fff;background:var(--card2)}
.btn.primary{background:linear-gradient(180deg,#fe3442 0%,#d32b3f 100%);border-color:var(--accent);color:#fff}
.btn.primary:hover{opacity:.92;box-shadow:0 2px 10px rgba(254,52,66,0.4)}
.btn.warning{background:#18130a;border-color:var(--gold);color:var(--gold)}
.btn.warning:hover{background:var(--gold);color:#08090a}

/* Metrics Banner */
.metrics-strip{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:10px;
  padding:12px 16px;
  background:#08090a;
  border-bottom:1px solid var(--line);
  flex-shrink:0;
}
.metric-box{
  background:var(--card);
  border:1px solid var(--line);
  border-radius:6px;
  padding:8px 12px;
  display:flex;
  flex-direction:column;
  gap:2px;
}
.metric-lbl{font-size:.65rem;font-weight:800;color:var(--meta);text-transform:uppercase;letter-spacing:0.5px}
.metric-val{font-size:1.1rem;font-weight:900;color:#fff}
.metric-val.accent{color:var(--accent)}
.metric-val.gold{color:var(--gold)}
.metric-val.green{color:var(--green)}

/* Real-Time Order Notification Toast / Alert Banner */
.order-alert-banner{
  position:fixed;
  top:12px;
  right:16px;
  z-index:9000;
  background:linear-gradient(135deg,#121515,#1f0c0f);
  border:2px solid var(--accent);
  box-shadow:0 10px 30px rgba(254,52,66,0.5),0 0 20px rgba(0,0,0,0.8);
  border-radius:10px;
  padding:14px 18px;
  max-width:440px;
  display:none;
  align-items:center;
  gap:12px;
  animation:slideIn .3s ease-out;
}
.order-alert-banner.show{display:flex}
@keyframes slideIn{from{transform:translateY(-30px);opacity:0}to{transform:translateY(0);opacity:1}}
.alert-icon{font-size:1.8rem;color:var(--gold);flex-shrink:0;animation:bounce 1s infinite alternate}
@keyframes bounce{from{transform:scale(1)}to{transform:scale(1.15)}}
.alert-content{flex:1;min-width:0}
.alert-title{font-size:.85rem;font-weight:900;color:#fff;margin-bottom:2px}
.alert-desc{font-size:.72rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.alert-actions{display:flex;gap:6px;margin-top:6px}
.alert-btn{padding:4px 10px;font-size:.68rem;font-weight:800;border-radius:4px;cursor:pointer;border:none}
.alert-btn.view{background:var(--accent);color:#fff}
.alert-btn.close{background:var(--card2);color:var(--muted);border:1px solid var(--line)}

/* Toolbar for Search & Filtering */
.toolbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:8px 16px;
  background:#08090a;
  border-bottom:1px solid var(--line);
  gap:10px;
  flex-shrink:0;
  flex-wrap:wrap;
}
.search-wrap{display:flex;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:6px;padding:0 10px;height:32px;gap:6px;flex:1;max-width:320px}
.search-wrap input{background:transparent;border:none;outline:none;color:#fff;font-size:.75rem;font-family:inherit;width:100%}
.search-wrap input::placeholder{color:var(--meta)}
.filter-group{display:flex;align-items:center;gap:4px;overflow-x:auto}
.filter-btn{
  height:28px;
  padding:0 10px;
  font-size:.68rem;
  font-weight:800;
  background:var(--card);
  border:1px solid var(--line);
  border-radius:4px;
  color:var(--muted);
  cursor:pointer;
  transition:all .15s;
  white-space:nowrap;
}
.filter-btn:hover{color:#fff;border-color:var(--accent)}
.filter-btn.active{background:var(--accent);border-color:var(--accent);color:#fff}

.toggle-switch{
  display:inline-flex;
  align-items:center;
  gap:6px;
  font-size:.7rem;
  font-weight:700;
  color:var(--muted);
  cursor:pointer;
  user-select:none;
}
.toggle-switch input{cursor:pointer}

/* Two-Pane Workspace Layout */
.workspace{flex:1;display:flex;overflow:hidden;position:relative}
.pane-list{width:380px;border-right:1px solid var(--line);overflow-y:auto;background:var(--bg);display:flex;flex-direction:column}
.pane-detail{flex:1;display:flex;flex-direction:column;overflow:hidden;background:#08090a}

/* Orders List Items */
.order-card{
  padding:12px 16px;
  border-bottom:1px solid var(--line);
  cursor:pointer;
  transition:all .12s;
  position:relative;
  display:flex;
  flex-direction:column;
  gap:6px;
}
.order-card:hover{background:var(--card)}
.order-card.active{background:var(--card2);box-shadow:inset 3px 0 0 var(--accent)}
.order-card.is-new{animation:flashNew 2s infinite alternate;border-left:3px solid var(--gold)}
@keyframes flashNew{from{background:rgba(250,204,21,0.08)}to{background:rgba(254,52,66,0.12)}}

.order-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.order-id{font-size:.82rem;font-weight:900;color:#fff;font-family:monospace;letter-spacing:0.5px}
.order-price{font-size:.88rem;font-weight:900;color:var(--gold)}

.order-mid{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:.72rem}
.order-customer{color:var(--muted);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.order-date{color:var(--meta);font-size:.65rem;flex-shrink:0}

.order-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:2px}
.order-snippet{font-size:.68rem;color:var(--meta);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* Status Badges */
.badge{
  font-size:.62rem;
  font-weight:900;
  padding:2px 8px;
  border-radius:4px;
  text-transform:uppercase;
  letter-spacing:0.5px;
  display:inline-flex;
  align-items:center;
  gap:4px;
}
.badge.paid{background:rgba(34,197,94,0.15);color:var(--green);border:1px solid rgba(34,197,94,0.3)}
.badge.processing{background:rgba(250,204,21,0.15);color:var(--gold);border:1px solid rgba(250,204,21,0.3)}
.badge.shipped{background:rgba(59,130,246,0.15);color:#60a5fa;border:1px solid rgba(59,130,246,0.3)}
.badge.unpaid{background:rgba(254,52,66,0.15);color:var(--accent);border:1px solid rgba(254,52,66,0.3)}
.badge.cancelled{background:rgba(129,129,129,0.15);color:var(--meta);border:1px solid var(--line)}
.badge.new-tag{background:var(--accent);color:#fff;box-shadow:0 0 6px var(--accent)}

/* Order Inspection Details Pane */
.detail-scroll{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px}
.detail-empty{flex:1;display:flex;align-items:center;justify-content:center;color:var(--meta);font-size:.85rem;flex-direction:column;gap:8px}

.section-card{
  background:var(--card);
  border:1px solid var(--line);
  border-radius:8px;
  padding:16px;
  display:flex;
  flex-direction:column;
  gap:12px;
}
.sec-title{
  font-size:.75rem;
  font-weight:900;
  text-transform:uppercase;
  letter-spacing:0.5px;
  color:var(--accent);
  display:flex;
  align-items:center;
  justify-content:space-between;
}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:800px){.grid-2{grid-template-columns:1fr}}

.info-row{font-size:.78rem;line-height:1.5}
.info-row strong{color:#fff;display:inline-block;min-width:90px}
.info-row span{color:var(--muted)}

/* Items Table */
.items-table{width:100%;border-collapse:collapse;font-size:.75rem}
.items-table th{text-align:left;color:var(--meta);font-size:.65rem;text-transform:uppercase;padding:6px 8px;border-bottom:1px solid var(--line)}
.items-table td{padding:10px 8px;border-bottom:1px solid var(--line);vertical-align:middle}
.item-thumb{width:36px;height:36px;border-radius:6px;object-fit:cover;border:1px solid var(--line);background:#08090a}
.item-info{display:flex;align-items:center;gap:10px}
.item-title{font-weight:700;color:#fff}
.item-var{font-size:.65rem;color:var(--meta)}

/* Status Bar & Toast */
.status-toast{
  position:fixed;
  bottom:16px;
  left:50%;
  transform:translateX(-50%);
  background:var(--card2);
  border:1px solid var(--line);
  border-radius:8px;
  padding:10px 18px;
  font-size:.75rem;
  z-index:9999;
  display:none;
  box-shadow:0 8px 24px rgba(0,0,0,0.8);
}
.status-toast.show{display:block}
.status-toast.err{border-color:var(--accent);color:var(--accent)}

/* Inbox specific view */
.inbox-view{flex:1;display:none;overflow:hidden}
.inbox-view.active{display:flex}
.orders-view{flex:1;display:flex;flex-direction:column;overflow:hidden}
.orders-view.hidden{display:none}

@media(max-width:768px){
  .pane-list{width:100%;border-right:none}
  .pane-detail{display:none}
  .pane-detail.open{display:flex;position:fixed;inset:58px 0 0 0;z-index:500}
  .metrics-strip{grid-template-columns:1fr 1fr}
}
</style>
</head>
<body>

<!-- KEYPAD PIN LOCK OVERLAY -->
<div class="overlay" id="overlay">
  <div class="keypad-wrap">
    <div style="margin-bottom:12px;">
      <img src="/official-logo.jpg" alt="Logo" style="width:40px;height:40px;border-radius:8px;border:1px solid #363636;">
    </div>
    <h1>Bargain Drop <span>Admin</span></h1>
    <p>Enter Master PIN to access Store Orders &amp; Live Alerts</p>
    <div class="keypad-display" id="dots"></div>
    <div class="keypad-error" id="err"></div>
    <div class="keypad-grid" id="grid"></div>
    <p style="font-size:0.65rem;color:var(--meta);margin-top:10px;">Authorized Staff &amp; Store Owner Access</p>
  </div>
</div>

<!-- REAL-TIME NEW ORDER NOTIFICATION BANNER -->
<div class="order-alert-banner" id="orderAlertBanner">
  <div class="alert-icon">🔔</div>
  <div class="alert-content">
    <div class="alert-title" id="alertTitle">New Order Received!</div>
    <div class="alert-desc" id="alertDesc">Order BD-XXXX · A$0.00 from Customer</div>
    <div class="alert-actions">
      <button class="alert-btn view" id="alertViewBtn">View Order Now</button>
      <button class="alert-btn close" onclick="dismissOrderAlert()">Dismiss</button>
    </div>
  </div>
</div>

<!-- ADMIN HEADER -->
<header class="admin-header">
  <div class="brand">
    <a href="/" title="Open Storefront"><img src="/official-logo.jpg" alt="Bargain Drop"></a>
    <div class="brand-title"><span class="red">BARGAIN</span> DROP <span style="font-size:0.75rem;color:var(--meta);font-weight:700;">COMMAND</span></div>
  </div>

  <div class="tabs">
    <button class="tab-btn active" id="tabOrders" onclick="switchTab('orders')">
      <span>📦 Store Orders</span>
      <span class="tab-badge" id="ordersCountBadge">0</span>
    </button>
    <button class="tab-btn" id="tabInbox" onclick="switchTab('inbox')">
      <span>✉ Support Inbox</span>
      <span class="tab-badge" id="inboxCountBadge">0</span>
    </button>
  </div>

  <div class="header-actions">
    <div class="live-pill" title="Connected to real-time order stream">
      <span class="live-dot"></span>
      <span id="liveStatusText">Live Orders Active</span>
    </div>
    <button class="btn warning" id="testOrderBtn" title="Creates a live test order and fires the audio chime, notification banner, and table update">⚡ Test Notification</button>
    <button class="btn" id="refreshAllBtn" title="Refresh data">↻ Refresh</button>
    <a href="/adpulse" class="btn primary" target="_blank" title="Open AdPulse Marketing & Ad Command Center">🎯 AdPulse &nearr;</a>
    <a href="/" class="btn" target="_blank" title="Open Storefront in new tab">Storefront &nearr;</a>
  </div>
</header>

<!-- ORDERS MANAGEMENT VIEW -->
<div class="orders-view" id="ordersView">
  <!-- Metrics Strip -->
  <div class="metrics-strip">
    <div class="metric-box">
      <span class="metric-lbl">Total Store Orders</span>
      <span class="metric-val" id="metricTotalOrders">0</span>
    </div>
    <div class="metric-box">
      <span class="metric-lbl">Gross Store Volume</span>
      <span class="metric-val gold" id="metricTotalRevenue">A$0.00</span>
    </div>
    <div class="metric-box">
      <span class="metric-lbl">Today's Orders</span>
      <span class="metric-val accent" id="metricTodayOrders">0</span>
    </div>
    <div class="metric-box">
      <span class="metric-lbl">Fulfillment / Shipped</span>
      <span class="metric-val green" id="metricShippedOrders">0</span>
    </div>
  </div>

  <!-- Filter & Audio Toolbar -->
  <div class="toolbar">
    <div class="search-wrap">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input type="text" id="orderSearchInput" placeholder="Search orders, customers, emails...">
    </div>

    <div class="filter-group">
      <button class="filter-btn active" data-filter="all">All (<span id="countAll">0</span>)</button>
      <button class="filter-btn" data-filter="paid">Paid (<span id="countPaid">0</span>)</button>
      <button class="filter-btn" data-filter="processing">Processing (<span id="countProcessing">0</span>)</button>
      <button class="filter-btn" data-filter="shipped">Shipped (<span id="countShipped">0</span>)</button>
      <button class="filter-btn" data-filter="unpaid">Unpaid (<span id="countUnpaid">0</span>)</button>
    </div>

    <div style="display:flex;align-items:center;gap:12px;margin-left:auto;">
      <label class="toggle-switch" title="Toggle audio chime on new orders">
        <input type="checkbox" id="soundToggle" checked>
        <span id="soundLabel">🔊 Chime Sound ON</span>
      </label>
      <button class="btn" id="reqNotificationBtn" style="height:28px;font-size:0.68rem;padding:0 8px;">🔔 Enable Desktop Push</button>
    </div>
  </div>

  <!-- Two-Pane Orders Content -->
  <div class="workspace">
    <div class="pane-list" id="ordersList">
      <div style="padding:30px;text-align:center;color:var(--meta);font-size:0.75rem;">Loading orders...</div>
    </div>

    <div class="pane-detail" id="orderDetailPane">
      <div class="detail-empty">
        <div style="font-size:2.2rem;opacity:0.4;">📦</div>
        <div>Select an order from the list to view full customer, shipping, and fulfillment details.</div>
      </div>
    </div>
  </div>
</div>

<!-- SUPPORT INBOX VIEW -->
<div class="inbox-view" id="inboxView">
  <div class="workspace">
    <div class="pane-list" id="inboxList">
      <div style="padding:30px;text-align:center;color:var(--meta);font-size:0.75rem;">Loading inbox messages...</div>
    </div>
    <div class="pane-detail" id="inboxDetailPane">
      <div class="detail-empty">
        <div style="font-size:2.2rem;opacity:0.4;">✉</div>
        <div>Select a message to read.</div>
      </div>
    </div>
  </div>
</div>

<!-- COMPOSE MODAL (INBOX) -->
<div class="compose hidden" id="composeModal">
  <div class="compose-card">
    <h3 style="font-size:1rem;font-weight:900;color:#fff;">New Support Reply / Email</h3>
    <input type="text" id="cTo" placeholder="To (email address)">
    <input type="text" id="cReply" placeholder="Reply-To (optional)">
    <input type="text" id="cSubject" placeholder="Subject">
    <textarea id="cBody" placeholder="Message body..."></textarea>
    <div class="row" style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn" onclick="document.getElementById('composeModal').classList.add('hidden')">Cancel</button>
      <button class="btn primary" id="sendEmailBtn">Send Email</button>
    </div>
  </div>
</div>

<!-- GLOBAL TOAST STATUS -->
<div class="status-toast" id="statusToast"></div>

<script>
// ============================================================================
// BARGAIN DROP ADMIN & LIVE ORDER NOTIFICATION ENGINE
// ============================================================================
let PIN = ''; // Never hardcoded on frontend; set only after backend POST verification
const PIN_LENGTH = 8;
let enteredPin = '';
let isSubmittingPin = false;
let lockoutCountdownTimer = null;
let allOrders = [];
let knownOrderIds = new Set();
let selectedOrderId = null;
let currentFilter = 'all';
let soundEnabled = true;
let desktopNotificationsAllowed = (typeof Notification !== 'undefined' && Notification.permission === 'granted');
let sseConnection = null;
let pollTimer = null;
let titleFlashTimer = null;
const originalDocTitle = document.title;

const $ = id => document.getElementById(id);

// ── KEYPAD PIN SECURITY (8-Digit Masked Input + POST /api/admin/orders) ──────
const overlay = $('overlay');
const dots = $('dots');
const errEl = $('err');
const grid = $('grid');

function renderDots() {
  dots.innerHTML = '';
  for (let i = 0; i < PIN_LENGTH; i++) {
    const d = document.createElement('div');
    d.className = 'keypad-dot' + (i < enteredPin.length ? ' filled' : '');
    dots.appendChild(d);
  }
}

function renderGrid(disabled = false) {
  grid.innerHTML = '';
  ['1','2','3','4','5','6','7','8','9','C','0','OK'].forEach(k => {
    const b = document.createElement('button');
    b.type = 'button';
    b.disabled = disabled;
    if (k === 'C') {
      b.className = 'keypad-btn';
      b.style.color = 'var(--gold)';
      b.style.fontSize = '0.95rem';
    } else if (k === 'OK') {
      b.className = 'keypad-btn';
      b.style.background = 'linear-gradient(180deg, #fe3442 0%, #d32b3f 100%)';
      b.style.borderColor = 'var(--accent)';
      b.style.color = '#ffffff';
      b.style.fontSize = '0.95rem';
    } else {
      b.className = 'keypad-btn';
    }
    if (disabled) b.style.opacity = '0.45';
    b.textContent = k;
    b.addEventListener('click', () => handleKey(k));
    grid.appendChild(b);
  });
}

function startLockoutCountdown(seconds) {
  clearInterval(lockoutCountdownTimer);
  let remaining = Math.max(1, Math.ceil(seconds));
  renderGrid(true);

  const updateMsg = () => {
    const mins = Math.floor(remaining / 60);
    const secs = String(remaining % 60).padStart(2, '0');
    errEl.textContent = `Locked out due to >5 failed attempts. Try again in ${mins}:${secs}`;
  };
  updateMsg();

  lockoutCountdownTimer = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(lockoutCountdownTimer);
      errEl.textContent = '';
      renderGrid(false);
    } else {
      updateMsg();
    }
  }, 1000);
}

async function submitPinToBackend() {
  if (isSubmittingPin) return;
  if (enteredPin.length !== PIN_LENGTH) {
    errEl.textContent = `Please enter all ${PIN_LENGTH} digits before pressing OK.`;
    return;
  }

  isSubmittingPin = true;
  errEl.style.color = 'var(--muted)';
  errEl.textContent = 'Verifying PIN...';

  try {
    const res = await fetch('/api/admin/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: enteredPin })
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 429 || data.lockedOut) {
      enteredPin = '';
      renderDots();
      errEl.style.color = 'var(--accent)';
      startLockoutCountdown(data.retryAfterSeconds || 900);
      return;
    }

    if (!res.ok || !data.ok) {
      enteredPin = '';
      renderDots();
      errEl.style.color = 'var(--accent)';
      errEl.textContent = data.error || 'Incorrect Admin PIN.';
      return;
    }

    // Success! Store authenticated PIN in memory and reveal dashboard
    PIN = enteredPin;
    overlay.classList.add('hidden');
    initAdminDashboard(data);
  } catch (err) {
    errEl.style.color = 'var(--accent)';
    errEl.textContent = 'Network error verifying PIN. Please try again.';
  } finally {
    isSubmittingPin = false;
  }
}

function handleKey(k) {
  if (isSubmittingPin) return;
  errEl.textContent = '';
  if (k === 'C') {
    enteredPin = '';
    renderDots();
  } else if (k === 'Backspace') {
    enteredPin = enteredPin.slice(0, -1);
    renderDots();
  } else if (k === 'OK') {
    submitPinToBackend();
  } else if (/^[0-9]$/.test(k)) {
    if (enteredPin.length < PIN_LENGTH) {
      enteredPin += k;
      renderDots();
    }
  }
}

// Physical keyboard support on PIN screen
window.addEventListener('keydown', (e) => {
  if (overlay.classList.contains('hidden')) return;
  if (e.key >= '0' && e.key <= '9') {
    handleKey(e.key);
  } else if (e.key === 'Backspace') {
    handleKey('Backspace');
  } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
    handleKey('C');
  } else if (e.key === 'Enter') {
    e.preventDefault();
    handleKey('OK');
  }
});

renderDots();
renderGrid();

function showToast(msg, isErr = false) {
  const t = $('statusToast');
  t.textContent = msg;
  t.className = 'status-toast show' + (isErr ? ' err' : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ── AUDIO CHIME ENGINE (Web Audio API Synthesizer) ─────────────────────────
// Generates a crisp, pleasant 3-tone ascending bell chime (E5 -> G5 -> C6)
// Zero external mp3 dependencies, reliable across all modern browsers.
let audioCtx = null;
function playNewOrderChime() {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const notes = [659.25, 783.99, 1046.50]; // E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.28, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.55);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.6);
    });
  } catch (e) {
    console.warn('Audio chime playback failed:', e);
  }
}

// ── DESKTOP PUSH NOTIFICATIONS ──────────────────────────────────────────────
function requestDesktopNotificationPermission() {
  if (typeof Notification === 'undefined') {
    showToast('Desktop notifications not supported in this browser', true);
    return;
  }
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      desktopNotificationsAllowed = true;
      $('reqNotificationBtn').textContent = '✅ Desktop Alerts On';
      $('reqNotificationBtn').style.color = 'var(--green)';
      showToast('Desktop push notifications enabled!');
      new Notification('Bargain Drop Admin', {
        body: 'Real-time order alerts are active and ready!',
        icon: '/official-logo.jpg'
      });
    } else {
      showToast('Notification permission was denied or dismissed', true);
    }
  });
}

function triggerDesktopNotification(order) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    const notif = new Notification('🎉 New Store Order Received!', {
      body: `Order ${order.id} — A$${Number(order.total || 0).toFixed(2)} from ${order.customer?.name || 'Customer'}`,
      icon: '/official-logo.jpg',
      tag: order.id,
      renotify: true
    });
    notif.onclick = () => {
      window.focus();
      selectOrder(order.id);
      notif.close();
    };
  } catch (e) {}
}

// ── TAB TITLE FLASH ────────────────────────────────────────────────────────
function startTitleFlash(orderId) {
  clearTimeout(titleFlashTimer);
  let step = 0;
  titleFlashTimer = setInterval(() => {
    step++;
    document.title = (step % 2 === 0) ? `🔔 (1) NEW ORDER ${orderId}!` : `✨ A$ NEW ORDER RECEIVED ✨`;
  }, 900);
}

function stopTitleFlash() {
  clearInterval(titleFlashTimer);
  document.title = originalDocTitle;
}

window.addEventListener('focus', stopTitleFlash);
window.addEventListener('click', stopTitleFlash);

// ── TAB SWITCHING (Orders vs Inbox) ────────────────────────────────────────
function switchTab(tab) {
  if (tab === 'orders') {
    $('tabOrders').classList.add('active');
    $('tabInbox').classList.remove('active');
    $('ordersView').classList.remove('hidden');
    $('inboxView').classList.remove('active');
  } else {
    $('tabInbox').classList.add('active');
    $('tabOrders').classList.remove('active');
    $('ordersView').classList.add('hidden');
    $('inboxView').classList.add('active');
    loadInbox();
  }
}

// ── INIT ADMIN DASHBOARD ────────────────────────────────────────────────────
function initAdminDashboard() {
  // Sound toggle setup
  $('soundToggle').addEventListener('change', (e) => {
    soundEnabled = e.target.checked;
    $('soundLabel').textContent = soundEnabled ? '🔊 Chime Sound ON' : '🔇 Chime Muted';
    if (soundEnabled) playNewOrderChime();
  });

  // Desktop notification button setup
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    $('reqNotificationBtn').textContent = '✅ Desktop Alerts On';
    $('reqNotificationBtn').style.color = 'var(--green)';
  } else {
    $('reqNotificationBtn').addEventListener('click', requestDesktopNotificationPermission);
  }

  // Search and filter listeners
  $('orderSearchInput').addEventListener('input', renderOrdersList);
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderOrdersList();
    });
  });

  $('refreshAllBtn').addEventListener('click', () => {
    loadOrders(true);
    showToast('Orders refreshed');
  });

  $('testOrderBtn').addEventListener('click', triggerTestOrder);

  // Initial load
  loadOrders();
  initRealtimeSSE();

  // Periodic polling fallback (every 8 seconds)
  pollTimer = setInterval(() => {
    loadOrders(false);
  }, 8000);
}

// ── LOAD ORDERS FROM SERVER ────────────────────────────────────────────────
async function loadOrders(isManualRefresh = false) {
  try {
    const res = await fetch('/api/admin/orders', {
      headers: { 'X-Admin-Pin': PIN }
    });
    if (!res.ok) throw new Error('Failed to load orders: HTTP ' + res.status);
    const data = await res.json();
    const fetched = data.orders || [];

    // Check for newly arrived orders
    let newlyReceived = [];
    if (knownOrderIds.size > 0) {
      for (const ord of fetched) {
        if (!knownOrderIds.has(ord.id)) {
          ord.isNew = true;
          newlyReceived.push(ord);
        }
      }
    }

    // Populate knownOrderIds
    fetched.forEach(o => knownOrderIds.add(o.id));
    allOrders = fetched;

    // Update metrics and badges
    updateMetrics(data.stats || {});
    renderOrdersList();

    // If new orders were detected during poll, alert!
    if (newlyReceived.length > 0 && !isManualRefresh) {
      const latest = newlyReceived[0];
      handleNewOrderAlert(latest);
    }
  } catch (err) {
    if (isManualRefresh) showToast('Error: ' + err.message, true);
  }
}

// ── REAL-TIME SERVER-SENT EVENTS (SSE) ─────────────────────────────────────
function initRealtimeSSE() {
  try {
    if (sseConnection) sseConnection.close();
    sseConnection = new EventSource('/api/admin/orders/stream');

    sseConnection.addEventListener('connected', () => {
      $('liveStatusText').textContent = 'Live Orders Stream Active';
      $('liveStatusText').style.color = 'var(--green)';
    });

    sseConnection.addEventListener('new_order', (e) => {
      try {
        const order = JSON.parse(e.data);
        order.isNew = true;
        // Avoid duplicate
        if (!knownOrderIds.has(order.id)) {
          knownOrderIds.add(order.id);
          allOrders.unshift(order);
          renderOrdersList();
          updateMetricsFromOrders();
          handleNewOrderAlert(order);
        }
      } catch (err) {
        console.error('SSE order parse error:', err);
      }
    });

    sseConnection.onerror = () => {
      $('liveStatusText').textContent = 'Polling Active (Reconnect)';
      $('liveStatusText').style.color = 'var(--gold)';
    };
  } catch (e) {
    console.warn('SSE not available, using periodic poll:', e);
  }
}

// ── HANDLE NEW ORDER ALERT (Banner, Audio, Push, Title) ───────────────────
function handleNewOrderAlert(order) {
  // 1. Play audio chime
  playNewOrderChime();

  // 2. Trigger browser desktop notification
  triggerDesktopNotification(order);

  // 3. Start browser title flash
  startTitleFlash(order.id);

  // 4. Show top notification banner
  const banner = $('orderAlertBanner');
  $('alertTitle').textContent = `🎉 New Order: ${order.id} (A$${Number(order.total || 0).toFixed(2)})`;
  $('alertDesc').textContent = `${order.customer?.name || 'Customer'} · ${order.items?.length || 1} item(s) to ${order.shipping?.city || 'AU'}`;
  banner.classList.add('show');

  $('alertViewBtn').onclick = () => {
    selectOrder(order.id);
    dismissOrderAlert();
  };
}

function dismissOrderAlert() {
  $('orderAlertBanner').classList.remove('show');
  stopTitleFlash();
}

// ── TEST ORDER GENERATOR ───────────────────────────────────────────────────
async function triggerTestOrder() {
  const btn = $('testOrderBtn');
  btn.disabled = true;
  btn.textContent = '⚡ Generating...';
  try {
    const res = await fetch('/api/admin/orders/create-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Pin': PIN
      },
      body: JSON.stringify({
        name: 'James Wharawhara Tuwairua',
        email: 'jamestuwairua77@gmail.com',
        phone: '+61460507911'
      })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || 'Test order failed');
    showToast('🎉 Test order created & alert fired!');
    loadOrders(true);
  } catch (e) {
    showToast('Test order failed: ' + e.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = '⚡ Test Notification';
  }
}

// ── METRICS & BADGES ───────────────────────────────────────────────────────
function updateMetrics(stats) {
  $('metricTotalOrders').textContent = stats.totalOrders || allOrders.length;
  $('metricTotalRevenue').textContent = 'A$' + Number(stats.totalRevenue || 0).toFixed(2);
  $('metricTodayOrders').textContent = stats.todayCount || 0;
  $('metricShippedOrders').textContent = stats.shippedCount || 0;
  $('ordersCountBadge').textContent = allOrders.length;

  updateFilterCounts();
}

function updateMetricsFromOrders() {
  const rev = allOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);
  const shipped = allOrders.filter(o => o.status === 'shipped' || o.status === 'delivered').length;
  $('metricTotalOrders').textContent = allOrders.length;
  $('metricTotalRevenue').textContent = 'A$' + rev.toFixed(2);
  $('metricShippedOrders').textContent = shipped;
  $('ordersCountBadge').textContent = allOrders.length;
  updateFilterCounts();
}

function updateFilterCounts() {
  $('countAll').textContent = allOrders.length;
  $('countPaid').textContent = allOrders.filter(o => o.status === 'paid').length;
  $('countProcessing').textContent = allOrders.filter(o => o.status === 'processing').length;
  $('countShipped').textContent = allOrders.filter(o => o.status === 'shipped' || o.status === 'delivered').length;
  $('countUnpaid').textContent = allOrders.filter(o => o.status === 'unpaid').length;
}

// ── RENDER ORDERS LIST ─────────────────────────────────────────────────────
function renderOrdersList() {
  const listEl = $('ordersList');
  const search = $('orderSearchInput').value.trim().toLowerCase();

  let filtered = allOrders.filter(o => {
    if (currentFilter !== 'all') {
      if (currentFilter === 'shipped') {
        if (o.status !== 'shipped' && o.status !== 'delivered') return false;
      } else if (o.status !== currentFilter) {
        return false;
      }
    }
    if (search) {
      const q = [
        o.id,
        o.customer?.name,
        o.customer?.email,
        o.customer?.phone,
        o.shipping?.city,
        ...(o.items || []).map(i => i.title)
      ].filter(Boolean).join(' ').toLowerCase();
      if (!q.includes(search)) return false;
    }
    return true;
  });

  if (!filtered.length) {
    listEl.innerHTML = `<div style="padding:40px 20px;text-align:center;color:var(--meta);font-size:0.8rem;">
      No orders match the current filter.
    </div>`;
    return;
  }

  listEl.innerHTML = filtered.map(o => {
    const isAct = o.id === selectedOrderId;
    const isNew = Boolean(o.isNew);
    const dateFormatted = fmtOrderDate(o.date);
    const itemsSummary = (o.items || []).map(i => `${i.quantity}x ${i.title}`).join(', ');

    return `
      <div class="order-card ${isAct ? 'active' : ''} ${isNew ? 'is-new' : ''}" onclick="selectOrder('${o.id}')">
        <div class="order-top">
          <span class="order-id">${esc(o.id)}</span>
          <span class="order-price">A$${Number(o.total || 0).toFixed(2)}</span>
        </div>
        <div class="order-mid">
          <span class="order-customer">${esc(o.customer?.name || 'Customer')}</span>
          <span class="order-date">${dateFormatted}</span>
        </div>
        <div class="order-bottom">
          <span class="badge ${o.status}">${o.status.toUpperCase()}</span>
          ${isNew ? '<span class="badge new-tag">NEW</span>' : ''}
          <span class="order-snippet" title="${esc(itemsSummary)}">${esc(itemsSummary)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function fmtOrderDate(d) {
  try {
    const x = new Date(d);
    if (isNaN(x.getTime())) return String(d || '');
    const now = Date.now();
    const diff = (now - x.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return x.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return String(d || '');
  }
}

// ── SELECT & INSPECT AN ORDER ──────────────────────────────────────────────
function selectOrder(orderId) {
  selectedOrderId = orderId;
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  // Clear isNew flag on click
  if (order.isNew) {
    delete order.isNew;
  }

  renderOrdersList();

  const pane = $('orderDetailPane');
  pane.classList.add('open');

  const itemsHtml = (order.items || []).map(it => `
    <tr>
      <td style="width:46px;">
        <img src="${esc(it.image || '/official-logo.jpg')}" class="item-thumb" alt="${esc(it.title)}">
      </td>
      <td>
        <div class="item-title">${esc(it.title)}</div>
        ${it.variant ? `<div class="item-var">Variant: ${esc(it.variant)}</div>` : ''}
      </td>
      <td style="text-align:right;">A$${Number(it.price || 0).toFixed(2)}</td>
      <td style="text-align:center;">x${it.quantity || 1}</td>
      <td style="text-align:right;font-weight:900;color:#fff;">A$${(Number(it.price || 0) * Number(it.quantity || 1)).toFixed(2)}</td>
    </tr>
  `).join('');

  const trackingLink = order.cjOrder?.trackingNumber
    ? `<a href="/store/order-tracking.html?order=${encodeURIComponent(order.id)}&tracking=${encodeURIComponent(order.cjOrder.trackingNumber)}" target="_blank" style="color:var(--accent);font-weight:800;text-decoration:underline;">Track Live &rarr;</a>`
    : '';

  pane.innerHTML = `
    <div class="detail-scroll">
      <!-- Header Banner -->
      <div class="section-card" style="border-left:4px solid var(--accent);">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <div>
            <span style="font-size:0.7rem;color:var(--meta);text-transform:uppercase;font-weight:800;">Order Inspection</span>
            <h2 style="font-size:1.3rem;font-weight:900;font-family:monospace;color:#fff;">${esc(order.id)}</h2>
            <div style="font-size:0.75rem;color:var(--muted);">${new Date(order.date).toLocaleString('en-AU')}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="badge ${order.status}" style="font-size:0.75rem;padding:4px 10px;">${order.status.toUpperCase()}</span>
            <button class="btn" onclick="window.print()" style="font-size:0.7rem;">🖨 Print Invoice</button>
          </div>
        </div>
      </div>

      <!-- Customer & Shipping Grid -->
      <div class="grid-2">
        <div class="section-card">
          <div class="sec-title">
            <span>👤 Customer Information</span>
            <button class="btn" style="height:24px;font-size:0.65rem;padding:0 8px;" onclick="openEmailCompose('${esc(order.customer?.email)}', 'Update regarding Order ${esc(order.id)}')">✉ Email</button>
          </div>
          <div class="info-row"><strong>Full Name:</strong> <span>${esc(order.customer?.name || 'Customer')}</span></div>
          <div class="info-row"><strong>Email:</strong> <span><a href="mailto:${esc(order.customer?.email)}" style="color:var(--accent);text-decoration:underline;">${esc(order.customer?.email)}</a></span></div>
          <div class="info-row"><strong>Phone:</strong> <span><a href="tel:${esc(order.customer?.phone)}" style="color:var(--gold);">${esc(order.customer?.phone || 'N/A')}</a></span></div>
          <div class="info-row"><strong>Payment:</strong> <span>${esc(order.payment?.method || 'Online Checkout')} (${order.payment?.status || 'PAID'})</span></div>
        </div>

        <div class="section-card">
          <div class="sec-title">
            <span>🚚 Shipping Destination</span>
          </div>
          <div class="info-row"><strong>Recipient:</strong> <span>${esc(order.shipping?.fullName || order.customer?.name)}</span></div>
          <div class="info-row"><strong>Address 1:</strong> <span>${esc(order.shipping?.street1 || '100 George St')}</span></div>
          ${order.shipping?.street2 ? `<div class="info-row"><strong>Address 2:</strong> <span>${esc(order.shipping.street2)}</span></div>` : ''}
          <div class="info-row"><strong>City, State:</strong> <span>${esc(order.shipping?.city || 'Sydney')}, ${esc(order.shipping?.state || 'NSW')} ${esc(order.shipping?.postcode || '2000')}</span></div>
          <div class="info-row"><strong>Country:</strong> <span>${esc(order.shipping?.country || 'Australia')}</span></div>
        </div>
      </div>

      <!-- Line Items Table -->
      <div class="section-card">
        <div class="sec-title">
          <span>📦 Order Items (${(order.items || []).length})</span>
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product Details</th>
              <th style="text-align:right;">Price</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals Summary -->
        <div style="align-self:flex-end;width:260px;margin-top:12px;font-size:0.78rem;display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;justify-content:space-between;color:var(--muted);">
            <span>Subtotal:</span>
            <span>A$${Number(order.subtotal || order.total * 0.9).toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:var(--muted);">
            <span>Shipping:</span>
            <span>${order.shippingFee === 0 ? '<strong style="color:var(--green)">FREE</strong>' : 'A$' + Number(order.shippingFee).toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:var(--muted);">
            <span>Estimated GST (10%):</span>
            <span>A$${Number(order.tax || order.total * 0.1).toFixed(2)}</span>
          </div>
          <div style="height:1px;background:var(--line);margin:4px 0;"></div>
          <div style="display:flex;justify-content:space-between;font-size:1.05rem;font-weight:900;color:var(--gold);">
            <span>Total Paid:</span>
            <span>A$${Number(order.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- CJ Dropshipping & Logistics Status -->
      <div class="section-card">
        <div class="sec-title">
          <span>⚡ CJ Dropshipping &amp; Tracking Dispatch</span>
          ${trackingLink}
        </div>
        <div class="grid-2">
          <div>
            <div class="info-row"><strong>CJ Order ID:</strong> <span>${esc(order.cjOrder?.orderId || 'CJ-DISPATCH-QUEUED')}</span></div>
            <div class="info-row"><strong>Carrier:</strong> <span>${esc(order.cjOrder?.carrier || 'CJ Packet Tracked Air')}</span></div>
          </div>
          <div>
            <div class="info-row"><strong>Tracking #:</strong> <span style="font-family:monospace;color:var(--gold);font-weight:700;">${esc(order.cjOrder?.trackingNumber || 'Tracking assigned on dispatch')}</span></div>
            <div class="info-row"><strong>Source Engine:</strong> <span>${esc(order.source || 'Storefront')}</span></div>
          </div>
        </div>
      </div>

      <!-- Status Quick-Changer Action Bar -->
      <div class="section-card" style="background:#08090a;">
        <div class="sec-title"><span>Update Order Status</span></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn" onclick="updateOrderStatus('${order.id}', 'paid')">Mark Paid</button>
          <button class="btn" onclick="updateOrderStatus('${order.id}', 'processing')">Mark Processing</button>
          <button class="btn primary" onclick="updateOrderStatus('${order.id}', 'shipped')">Mark Shipped</button>
          <button class="btn" onclick="updateOrderStatus('${order.id}', 'delivered')">Mark Delivered</button>
          <button class="btn warning" onclick="updateOrderStatus('${order.id}', 'cancelled')">Cancel Order</button>
        </div>
      </div>
    </div>
  `;
}

// ── UPDATE ORDER STATUS ────────────────────────────────────────────────────
async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch('/api/admin/orders/update-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Pin': PIN
      },
      body: JSON.stringify({ id: orderId, status })
    });
    const d = await res.json();
    if (!d.ok) throw new Error('Status update failed');
    showToast(`Order ${orderId} marked as ${status}`);

    const ord = allOrders.find(o => o.id === orderId);
    if (ord) {
      ord.status = status;
      selectOrder(orderId);
      renderOrdersList();
      updateMetricsFromOrders();
    }
  } catch (e) {
    showToast('Failed to update status: ' + e.message, true);
  }
}

// ── SUPPORT INBOX MODULE ───────────────────────────────────────────────────
let inboxMessages = [];
async function loadInbox() {
  try {
    const res = await fetch('/api/admin-inbox?action=list', {
      headers: { 'X-Admin-Pin': PIN }
    });
    if (!res.ok) throw new Error('Failed to load inbox');
    const data = await res.json();
    inboxMessages = data.messages || [];
    $('inboxCountBadge').textContent = inboxMessages.length;
    renderInboxList();
  } catch (e) {
    $('inboxList').innerHTML = `<div style="padding:30px;text-align:center;color:var(--accent);">Failed to load inbox: ${esc(e.message)}</div>`;
  }
}

function renderInboxList() {
  const el = $('inboxList');
  if (!inboxMessages.length) {
    el.innerHTML = '<div style="padding:30px;text-align:center;color:var(--meta);font-size:0.75rem;">No messages in inbox.</div>';
    return;
  }
  el.innerHTML = inboxMessages.map((m, i) => `
    <div class="order-card" onclick="openInboxMessage(${m.uid})">
      <div class="order-top">
        <span style="font-weight:800;color:#fff;font-size:0.8rem;">${esc(m.from || 'User')}</span>
        <span class="order-date">${fmtOrderDate(m.date)}</span>
      </div>
      <div style="font-size:0.75rem;font-weight:700;color:var(--gold);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
        ${esc(m.subject || '(no subject)')}
      </div>
      <div style="font-size:0.68rem;color:var(--meta);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
        ${esc(m.snippet || '')}
      </div>
    </div>
  `).join('');
}

async function openInboxMessage(uid) {
  const pane = $('inboxDetailPane');
  pane.innerHTML = '<div style="padding:40px;text-align:center;color:var(--meta);">Loading message...</div>';
  try {
    const res = await fetch(`/api/admin-inbox?action=read&uid=${uid}`, {
      headers: { 'X-Admin-Pin': PIN }
    });
    const m = await res.json();
    pane.innerHTML = `
      <div class="detail-scroll">
        <div class="section-card">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h2 style="font-size:1.1rem;font-weight:900;color:#fff;">${esc(m.subject || '(no subject)')}</h2>
            <button class="btn primary" onclick="openEmailCompose('${esc(m.from)}', 'Re: ${esc(m.subject)}')">✉ Reply</button>
          </div>
          <div class="info-row"><strong>From:</strong> <span>${esc(m.from || '')}</span></div>
          <div class="info-row"><strong>To:</strong> <span>${esc(m.to || '')}</span></div>
          <div class="info-row"><strong>Date:</strong> <span>${new Date(m.date).toLocaleString()}</span></div>
        </div>
        <div class="section-card" style="font-size:0.85rem;line-height:1.6;color:var(--fg);white-space:pre-wrap;">${esc(m.text || m.html || '')}</div>
      </div>
    `;
  } catch (e) {
    pane.innerHTML = `<div class="detail-empty">Error loading message: ${esc(e.message)}</div>`;
  }
}

function openEmailCompose(to = '', subject = '') {
  $('cTo').value = to;
  $('cSubject').value = subject;
  $('cBody').value = '';
  $('composeModal').classList.remove('hidden');
}

$('sendEmailBtn').addEventListener('click', async () => {
  const to = $('cTo').value.trim();
  const subject = $('cSubject').value.trim();
  const body = $('cBody').value.trim();
  if (!to || !subject) {
    showToast('Please provide a recipient and subject', true);
    return;
  }
  try {
    $('sendEmailBtn').disabled = true;
    $('sendEmailBtn').textContent = 'Sending...';
    const res = await fetch('/api/admin-inbox?action=send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Pin': PIN
      },
      body: JSON.stringify({ to, subject, body })
    });
    const d = await res.json();
    if (!d.ok) throw new Error(d.error || 'Failed to send email');
    showToast('Email successfully sent to ' + to);
    $('composeModal').classList.add('hidden');
  } catch (e) {
    showToast('Send failed: ' + e.message, true);
  } finally {
    $('sendEmailBtn').disabled = false;
    $('sendEmailBtn').textContent = 'Send Email';
  }
});

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
</script>
<script src="/js/logo-handler.js"></script>
</body>
</html>