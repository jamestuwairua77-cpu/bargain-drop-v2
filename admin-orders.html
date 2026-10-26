<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Customer Orders Admin Vault — Bargain Drop</title>
  <link rel="icon" type="image/jpeg" href="/official-logo.jpg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700&family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #08090a;
      --surface: #111315;
      --surface-elevated: #171a1d;
      --border: #23272b;
      --border-strong: #32373d;
      --text-primary: #f8fafc;
      --text-secondary: #cbd5e1;
      --text-muted: #64748b;
      --accent: #fe3442;
      --accent-dark: #d32b3f;
      --gold: #facc15;
      --emerald: #22c55e;
      --radius: 10px;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg);
      color: var(--text-primary);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
    }

    /* ── 1. CENTERED 8-DIGIT KEYPAD PIN GATE ─────────────────────────────── */
    .pin-gate-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }

    .pin-gate-wrapper.hidden {
      display: none !important;
    }

    .keypad-card {
      width: 100%;
      max-width: 360px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 28px 24px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.75);
      text-align: center;
    }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }

    .brand-mark img {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 1px solid var(--border-strong);
      object-fit: contain;
    }

    .brand-mark span {
      font-family: 'Outfit', sans-serif;
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .brand-mark span em {
      font-style: normal;
      color: var(--accent);
    }

    .keypad-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.35rem;
      font-weight: 800;
      margin-bottom: 6px;
      letter-spacing: -0.02em;
    }

    .keypad-subtitle {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-bottom: 22px;
      line-height: 1.4;
    }

    /* Masked 8-Dot Display (••••••••) */
    .pin-dots-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      height: 52px;
      background: #060708;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      margin-bottom: 12px;
      padding: 0 14px;
    }

    .pin-dot {
      width: 13px;
      height: 13px;
      border-radius: 50%;
      border: 2px solid var(--border-strong);
      background: transparent;
      transition: all 0.14s ease;
    }

    .pin-dot.filled {
      background: var(--accent);
      border-color: var(--accent);
      box-shadow: 0 0 10px rgba(254, 52, 66, 0.65);
      transform: scale(1.08);
    }

    .pin-feedback {
      min-height: 22px;
      font-size: 0.76rem;
      font-weight: 600;
      color: var(--accent);
      margin-bottom: 14px;
    }

    /* 3x4 Mobile-Friendly Keypad Grid */
    .keypad-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .key-btn {
      height: 58px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--surface-elevated);
      color: var(--text-primary);
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.25rem;
      font-weight: 700;
      cursor: pointer;
      user-select: none;
      transition: background 0.12s ease, border-color 0.12s ease, transform 0.08s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .key-btn:hover:not(:disabled) {
      border-color: var(--accent);
      background: #1e2226;
    }

    .key-btn:active:not(:disabled) {
      transform: scale(0.96);
    }

    .key-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .key-btn.key-clear {
      color: var(--gold);
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1rem;
      font-weight: 800;
    }

    .key-btn.key-submit {
      background: linear-gradient(180deg, var(--accent) 0%, var(--accent-dark) 100%);
      border-color: var(--accent);
      color: #ffffff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1rem;
      font-weight: 800;
      box-shadow: 0 4px 14px rgba(254, 52, 66, 0.35);
    }

    .key-btn.key-submit:hover:not(:disabled) {
      filter: brightness(1.08);
    }

    /* ── 2. CUSTOMER ORDERS DATA TABLE VIEW (HIDDEN UNTIL VERIFIED) ─────── */
    .orders-dashboard {
      display: none;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 28px 20px 64px;
    }

    .orders-dashboard.unlocked {
      display: block;
    }

    .top-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 24px;
    }

    .top-bar-left h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .top-bar-left p {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .top-bar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .action-btn {
      height: 38px;
      padding: 0 16px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-primary);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .action-btn:hover {
      border-color: var(--accent);
      background: var(--surface-elevated);
    }

    .summary-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }

    .summary-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px 18px;
    }

    .summary-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .summary-val {
      font-family: 'Outfit', sans-serif;
      font-size: 1.45rem;
      font-weight: 800;
    }

    .controls-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .search-input {
      flex: 1;
      min-width: 240px;
      height: 40px;
      padding: 0 14px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-primary);
      font-size: 0.84rem;
      outline: none;
    }

    .search-input:focus {
      border-color: var(--accent);
    }

    .table-container {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th {
      padding: 14px 16px;
      font-size: 0.73rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      background: #0c0e10;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }

    td {
      padding: 14px 16px;
      font-size: 0.85rem;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    .mono-id {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      color: var(--text-primary);
    }

    .amount-cell {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      color: var(--emerald);
    }

    .status-text {
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
    }

    .status-paid, .status-delivered, .status-shipped { color: var(--emerald); }
    .status-processing { color: var(--gold); }
    .status-unpaid, .status-cancelled { color: var(--accent); }
  </style>
</head>
<body>

  <!-- 1. SECURE 8-DIGIT KEYPAD PIN SCREEN -->
  <main class="pin-gate-wrapper" id="pinGateSection">
    <div class="keypad-card" role="region" aria-label="8-Digit Security Keypad">
      <div class="brand-mark">
        <img src="/official-logo.jpg" alt="Bargain Drop" />
        <span><em>BARGAIN</em> DROP</span>
      </div>
      <h1 class="keypad-title">Customer Orders Vault</h1>
      <p class="keypad-subtitle">Enter your 8-digit administrator PIN to unlock customer order records.</p>

      <!-- Masked Dots Display (••••••••) -->
      <div class="pin-dots-box" id="pinDotsDisplay" aria-live="polite" aria-label="Masked PIN Display">
        <span class="pin-dot"></span>
        <span class="pin-dot"></span>
        <span class="pin-dot"></span>
        <span class="pin-dot"></span>
        <span class="pin-dot"></span>
        <span class="pin-dot"></span>
        <span class="pin-dot"></span>
        <span class="pin-dot"></span>
      </div>

      <div class="pin-feedback" id="pinFeedback" role="alert"></div>

      <!-- Keypad 0-9, Clear ('C'), Submit ('OK') -->
      <div class="keypad-grid" id="keypadGrid">
        <button type="button" class="key-btn" data-key="1">1</button>
        <button type="button" class="key-btn" data-key="2">2</button>
        <button type="button" class="key-btn" data-key="3">3</button>
        <button type="button" class="key-btn" data-key="4">4</button>
        <button type="button" class="key-btn" data-key="5">5</button>
        <button type="button" class="key-btn" data-key="6">6</button>
        <button type="button" class="key-btn" data-key="7">7</button>
        <button type="button" class="key-btn" data-key="8">8</button>
        <button type="button" class="key-btn" data-key="9">9</button>
        <button type="button" class="key-btn key-clear" data-key="C" aria-label="Clear PIN">C</button>
        <button type="button" class="key-btn" data-key="0">0</button>
        <button type="button" class="key-btn key-submit" data-key="OK" aria-label="Submit PIN">OK</button>
      </div>
    </div>
  </main>

  <!-- 2. CUSTOMER ORDERS DATA TABLE (UNLOADED & HIDDEN UNTIL AUTHENTICATED) -->
  <section class="orders-dashboard" id="ordersDashboardSection" aria-hidden="true">
    <div class="top-bar">
      <div class="top-bar-left">
        <h1>All Customer Orders</h1>
        <p id="syncTimestampText">Verified session · Real-time database records</p>
      </div>
      <div class="top-bar-actions">
        <button type="button" class="action-btn" id="refreshOrdersBtn">↻ Refresh Orders</button>
        <a href="/admin.html" class="action-btn">Full Command Center</a>
        <button type="button" class="action-btn" id="lockVaultBtn">🔒 Lock Screen</button>
      </div>
    </div>

    <div class="summary-strip">
      <div class="summary-card">
        <div class="summary-label">Total Orders</div>
        <div class="summary-val" id="statTotalOrders">0</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Gross Revenue (AUD)</div>
        <div class="summary-val" id="statTotalRevenue">A$0.00</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Paid &amp; Fulfilled</div>
        <div class="summary-val" id="statPaidOrders">0</div>
      </div>
    </div>

    <div class="controls-row">
      <input
        type="search"
        id="searchOrdersInput"
        class="search-input"
        placeholder="Search by Order ID, Customer Name, Email, or Status..."
      />
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer Name</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Order Date</th>
            <th>Shipping Address</th>
          </tr>
        </thead>
        <tbody id="ordersTableBody">
          <!-- Remains completely unloaded until POST /api/admin/orders returns 200 OK -->
        </tbody>
      </table>
    </div>
  </section>

  <script>
    (() => {
      const PIN_LENGTH = 8;
      let enteredPin = '';
      let activeSessionPin = ''; // Never hardcoded; held in memory only after backend verification
      let loadedRecords = [];
      let isRequestPending = false;
      let lockoutInterval = null;

      const pinGateSection = document.getElementById('pinGateSection');
      const ordersDashboardSection = document.getElementById('ordersDashboardSection');
      const dots = document.querySelectorAll('#pinDotsDisplay .pin-dot');
      const pinFeedback = document.getElementById('pinFeedback');
      const keyButtons = document.querySelectorAll('#keypadGrid .key-btn');
      const ordersTableBody = document.getElementById('ordersTableBody');
      const searchOrdersInput = document.getElementById('searchOrdersInput');

      function updateDotsUI() {
        dots.forEach((dot, idx) => {
          dot.classList.toggle('filled', idx < enteredPin.length);
        });
      }

      function setKeypadDisabled(disabled) {
        keyButtons.forEach((btn) => {
          btn.disabled = disabled;
        });
      }

      function startLockoutCountdown(seconds) {
        clearInterval(lockoutInterval);
        let remaining = Math.max(1, Math.ceil(seconds));
        setKeypadDisabled(true);

        const renderCountdown = () => {
          const m = Math.floor(remaining / 60);
          const s = String(remaining % 60).padStart(2, '0');
          pinFeedback.textContent = `Too many failed attempts. Locked out for ${m}:${s}`;
        };
        renderCountdown();

        lockoutInterval = setInterval(() => {
          remaining -= 1;
          if (remaining <= 0) {
            clearInterval(lockoutInterval);
            pinFeedback.textContent = '';
            setKeypadDisabled(false);
          } else {
            renderCountdown();
          }
        }, 1000);
      }

      function escapeHtml(value) {
        return String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }

      function renderOrdersTable(filterQuery = '') {
        const q = filterQuery.trim().toLowerCase();
        const filtered = loadedRecords.filter((row) => {
          if (!q) return true;
          return (
            String(row.order_id).toLowerCase().includes(q) ||
            String(row.customer_name).toLowerCase().includes(q) ||
            String(row.customer_email || '').toLowerCase().includes(q) ||
            String(row.status).toLowerCase().includes(q)
          );
        });

        if (filtered.length === 0) {
          ordersTableBody.innerHTML = `
            <tr>
              <td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px;">
                No matching customer orders found.
              </td>
            </tr>
          `;
          return;
        }

        ordersTableBody.innerHTML = filtered
          .map((row) => {
            const statusClass = 'status-' + String(row.status || 'paid').toLowerCase();
            const dateFormatted = row.created_at
              ? new Date(row.created_at).toLocaleString('en-AU', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : '—';
            return `
              <tr>
                <td class="mono-id">${escapeHtml(row.order_id)}</td>
                <td>
                  <div style="font-weight:700;">${escapeHtml(row.customer_name)}</div>
                  <div style="font-size:0.75rem;color:var(--text-muted);">${escapeHtml(row.customer_email || '')}</div>
                </td>
                <td class="amount-cell">A$${Number(row.total_amount || 0).toFixed(2)}</td>
                <td><span class="status-text ${escapeHtml(statusClass)}">${escapeHtml(row.status)}</span></td>
                <td style="color:var(--text-secondary);font-size:0.8rem;">${escapeHtml(dateFormatted)}</td>
                <td style="color:var(--text-secondary);font-size:0.8rem;">${escapeHtml(row.shipping_address || '—')}</td>
              </tr>
            `;
          })
          .join('');
      }

      async function verifyPinAndLoadOrders(pinToSubmit) {
        if (isRequestPending) return;
        if (pinToSubmit.length !== PIN_LENGTH) {
          pinFeedback.textContent = 'Please enter an 8-digit PIN before pressing OK.';
          return;
        }

        isRequestPending = true;
        setKeypadDisabled(true);
        pinFeedback.style.color = 'var(--text-secondary)';
        pinFeedback.textContent = 'Authenticating with server...';

        try {
          const response = await fetch('/api/admin/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pin: pinToSubmit }),
          });

          const data = await response.json().catch(() => ({}));

          if (response.status === 429 || data.lockedOut) {
            enteredPin = '';
            updateDotsUI();
            pinFeedback.style.color = 'var(--accent)';
            startLockoutCountdown(data.retryAfterSeconds || 900);
            return;
          }

          if (!response.ok || !data.ok) {
            enteredPin = '';
            updateDotsUI();
            setKeypadDisabled(false);
            pinFeedback.style.color = 'var(--accent)';
            pinFeedback.textContent = data.error || 'Incorrect PIN. Access denied.';
            return;
          }

          // Authenticated! Populate and reveal the customer orders table
          activeSessionPin = pinToSubmit;
          enteredPin = '';
          updateDotsUI();
          pinFeedback.textContent = '';

          loadedRecords = Array.isArray(data.records)
            ? data.records
            : (data.orders || []).map((o) => ({
                order_id: o.id,
                customer_name: o.customer?.name || 'Customer',
                customer_email: o.customer?.email || '',
                total_amount: o.total || 0,
                status: o.status || 'paid',
                created_at: o.date,
                shipping_address: o.shipping
                  ? `${o.shipping.street1}, ${o.shipping.city} ${o.shipping.state} ${o.shipping.postcode}`
                  : '',
              }));

          document.getElementById('statTotalOrders').textContent = String(loadedRecords.length);
          document.getElementById('statTotalRevenue').textContent =
            'A$' + Number(data.stats?.totalRevenue || 0).toFixed(2);
          document.getElementById('statPaidOrders').textContent = String(data.stats?.paidCount || loadedRecords.length);
          document.getElementById('syncTimestampText').textContent =
            'Verified session · Synced ' + new Date().toLocaleTimeString();

          renderOrdersTable(searchOrdersInput.value);

          pinGateSection.classList.add('hidden');
          ordersDashboardSection.classList.add('unlocked');
          ordersDashboardSection.setAttribute('aria-hidden', 'false');
        } catch (error) {
          pinFeedback.style.color = 'var(--accent)';
          pinFeedback.textContent = 'Connection error. Please try again.';
          setKeypadDisabled(false);
        } finally {
          isRequestPending = false;
        }
      }

      function handleKeyInput(key) {
        if (isRequestPending) return;
        pinFeedback.textContent = '';

        if (key === 'C') {
          enteredPin = '';
          updateDotsUI();
        } else if (key === 'Backspace') {
          enteredPin = enteredPin.slice(0, -1);
          updateDotsUI();
        } else if (key === 'OK') {
          verifyPinAndLoadOrders(enteredPin);
        } else if (/^[0-9]$/.test(key)) {
          if (enteredPin.length < PIN_LENGTH) {
            enteredPin += key;
            updateDotsUI();
          }
        }
      }

      keyButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          handleKeyInput(btn.getAttribute('data-key'));
        });
      });

      window.addEventListener('keydown', (e) => {
        if (pinGateSection.classList.contains('hidden')) return;
        if (e.key >= '0' && e.key <= '9') {
          handleKeyInput(e.key);
        } else if (e.key === 'Backspace') {
          handleKeyInput('Backspace');
        } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
          handleKeyInput('C');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleKeyInput('OK');
        }
      });

      searchOrdersInput.addEventListener('input', (e) => {
        renderOrdersTable(e.target.value);
      });

      document.getElementById('refreshOrdersBtn').addEventListener('click', () => {
        if (activeSessionPin) {
          verifyPinAndLoadOrders(activeSessionPin);
        }
      });

      document.getElementById('lockVaultBtn').addEventListener('click', () => {
        activeSessionPin = '';
        loadedRecords = [];
        ordersTableBody.innerHTML = '';
        ordersDashboardSection.classList.remove('unlocked');
        ordersDashboardSection.setAttribute('aria-hidden', 'true');
        pinGateSection.classList.remove('hidden');
        setKeypadDisabled(false);
      });
    })();
  </script>
</body>
</html>