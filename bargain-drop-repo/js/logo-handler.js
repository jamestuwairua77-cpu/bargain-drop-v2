/**
 * Bargain Drop — Universal Custom Logo Handler
 * Renders selected custom logo across all site headers, footers, drawers, and checkout pages.
 */

(function () {
  const LOGO_TEMPLATES = {
    opt1: `
      <a href="/" class="nav-logo bd-logo-custom" aria-label="Bargain Drop Home" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none;">
        <svg style="width:34px;height:34px;flex-shrink:0;filter:drop-shadow(0 2px 8px rgba(255,26,60,0.4));" viewBox="0 0 40 40" fill="none">
          <defs>
            <linearGradient id="opt1-g-main" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff1a3c"/>
              <stop offset="100%" stop-color="#e11d48"/>
            </linearGradient>
          </defs>
          <path d="M20 3 C12 14, 6 22, 6 28 A14 14 0 0 0 34 28 C34 22, 28 14, 20 3 Z" fill="url(#opt1-g-main)"/>
          <circle cx="16" cy="22" r="2.5" fill="#ffffff"/>
          <circle cx="24" cy="30" r="2.5" fill="#ffffff"/>
          <line x1="25" y1="20" x2="15" y2="32" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        <div class="logo-text" style="font-size:1.1rem;font-weight:900;letter-spacing:-0.5px;text-transform:uppercase;font-family:system-ui,-apple-system,sans-serif;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;color:#ffffff;">
          <span style="color:#ff1a3c!important;font-weight:900;">BARGAIN</span>
          <span style="color:#ffffff!important;font-weight:900;">DROP</span>
        </div>
      </a>
    `,

    opt2: `
      <a href="/" class="nav-logo bd-logo-custom" aria-label="Bargain Drop Home" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none;">
        <svg style="width:36px;height:36px;flex-shrink:0;" viewBox="0 0 40 40" fill="none">
          <rect x="2" y="2" width="36" height="36" rx="10" fill="#18181b" stroke="rgba(255,26,60,0.5)" stroke-width="2"/>
          <path d="M11 10 H22 C26 10, 28 12, 28 15 C28 17.5, 26 19, 23 19.5 C27 20, 29 22, 29 25 C29 28.5, 26 30, 21 30 H11 V10 Z" stroke="#ffffff" stroke-width="3" fill="none" stroke-linejoin="round"/>
          <path d="M21 16 L21 24 M17 20 L21 24 L25 20" stroke="#ff1a3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="logo-text" style="font-size:1.05rem;font-weight:900;letter-spacing:0.3px;text-transform:uppercase;font-family:system-ui,-apple-system,sans-serif;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;color:#ffffff;">
          <span style="color:#ff1a3c!important;font-weight:900;">BARGAIN</span>
          <span style="color:#ffffff!important;font-weight:900;">DROP</span>
        </div>
      </a>
    `,

    opt3: `
      <a href="/" class="nav-logo bd-logo-custom" aria-label="Bargain Drop Home" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none;">
        <svg style="width:34px;height:34px;flex-shrink:0;" viewBox="0 0 40 40" fill="none">
          <path d="M6 8 L24 4 L36 16 L18 34 L6 22 Z" fill="#ff1a3c"/>
          <circle cx="14" cy="12" r="3" fill="#09090b"/>
          <path d="M24 10 L18 20 H23 L17 30 L26 18 H21 L24 10 Z" fill="#ffffff"/>
        </svg>
        <div class="logo-text" style="font-size:1.15rem;font-weight:900;font-style:italic;letter-spacing:-0.5px;text-transform:uppercase;font-family:system-ui,-apple-system,sans-serif;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;color:#ffffff;">
          <span style="color:#ff1a3c!important;font-weight:900;">BARGAIN</span>
          <span style="color:#ffffff!important;font-weight:900;">DROP</span>
        </div>
      </a>
    `,

    opt4: `
      <a href="/" class="nav-logo bd-logo-custom" aria-label="Bargain Drop Home" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none;">
        <svg style="width:32px;height:32px;flex-shrink:0;" viewBox="0 0 40 40" fill="none">
          <path d="M20 4 C28 16 34 22 34 28 A14 14 0 0 1 6 28 C6 22 12 16 20 4 Z" stroke="#ff1a3c" stroke-width="3" fill="none"/>
          <path d="M20 12 C24 20 28 24 28 28 A8 8 0 0 1 12 28 C12 24 16 20 20 12 Z" fill="#ff1a3c"/>
        </svg>
        <div class="logo-text" style="font-size:1.05rem;font-weight:900;letter-spacing:-0.3px;text-transform:uppercase;font-family:system-ui,-apple-system,sans-serif;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;color:#ffffff;">
          <span style="background:#ff1a3c;color:#ffffff!important;padding:2px 7px;border-radius:5px;font-weight:900;">BARGAIN</span>
          <span style="color:#ffffff!important;font-weight:900;">DROP</span>
        </div>
      </a>
    `,

    opt5: `
      <a href="/" class="nav-logo bd-logo-custom" aria-label="Bargain Drop Home" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none;">
        <svg style="width:34px;height:34px;flex-shrink:0;" viewBox="0 0 40 40" fill="none">
          <path d="M10 14 H30 V32 C30 34 28 36 26 36 H14 C12 36 10 34 10 32 V14 Z" fill="#18181b" stroke="#ff1a3c" stroke-width="2.5"/>
          <path d="M15 14 C15 9 25 9 25 14" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <path d="M20 20 C16 26 14 28 14 30 A6 6 0 0 0 26 30 C26 28 24 26 20 20 Z" fill="#ff1a3c"/>
        </svg>
        <div class="logo-text" style="font-size:1.05rem;font-weight:900;letter-spacing:-0.3px;text-transform:uppercase;font-family:system-ui,-apple-system,sans-serif;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;color:#ffffff;">
          <span style="color:#ff1a3c!important;font-weight:900;">BARGAIN</span>
          <span style="color:#ffffff!important;font-weight:900;">DROP</span>
        </div>
      </a>
    `
  };

  function getActiveLogoId() {
    return localStorage.getItem('bd_selected_logo') || 'opt1';
  }

  function applyLogo(logoId) {
    const key = logoId || getActiveLogoId();
    const htmlSnippet = LOGO_TEMPLATES[key] || LOGO_TEMPLATES.opt1;

    // Find all logo instances on current page
    const logoTargets = document.querySelectorAll('.nav-logo, .logo, .nlogo, .auth-logo-text, .header .logo');
    logoTargets.forEach((el) => {
      // Don't overwrite inside the logo switcher page controls if marked
      if (el.closest('.logo-preview-box') || el.closest('#live-navbar-logo')) return;

      // Replace wrapper with custom logo markup
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlSnippet.trim();
      const newLogoNode = tempDiv.firstElementChild;

      if (el.parentNode) {
        el.parentNode.replaceChild(newLogoNode, el);
      }
    });
  }

  window.BargainDropLogo = {
    applyLogo: applyLogo,
    templates: LOGO_TEMPLATES
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyLogo());
  } else {
    applyLogo();
  }
})();
