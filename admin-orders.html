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
        <img src="data:image/jpeg;base64,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" alt="Bargain Drop" />
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