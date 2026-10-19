const fs = require('fs');
const path = require('path');

const dir = '/app/applet/public/store';
if (fs.existsSync(dir)) {
  fs.readdirSync(dir).forEach(file => {
    if (!file.endsWith('.html')) return;
    const filePath = path.join(dir, file);
    let html = fs.readFileSync(filePath, 'utf8');
    
    // Check if track button already present
    if (html.includes('order-tracking.html') && html.includes('nav-btn-track')) {
      return;
    }
    
    // Insert Track button into .nav-actions
    const trackBtnHtml = '<a href="order-tracking.html" class="nav-btn nav-btn-track" title="Track123 Order Tracking" style="background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;padding:0 8px;border-radius:8px;font-size:11px;font-weight:900;text-decoration:none;gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg><span>Track</span></a>';
    
    if (html.includes('class="nav-actions"')) {
      html = html.replace('class="nav-actions">', 'class="nav-actions">' + trackBtnHtml);
      fs.writeFileSync(filePath, html, 'utf8');
      console.log('Updated:', file);
    }
  });
}
