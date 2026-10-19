const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath, fileList);
    } else if (filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const files = walk('/app/applet/app/applet/public');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('id="slide-menu"')) {
    const cleanSlideMenu = `<div class="slide-menu" id="slide-menu">
      <div class="slide-backdrop" onclick="document.getElementById('slide-menu').classList.remove('open')"></div>
      <div class="slide-panel">
        <button class="slide-close" onclick="document.getElementById('slide-menu').classList.remove('open')">&times;</button>
        <div class="slide-heading">Shop</div>
        <a href="/" class="slide-item"><span class="slide-ico">H</span>Home</a>
        <a href="categories.html" class="slide-item"><span class="slide-ico">C</span>Categories</a>
        <a href="wishlist.html" class="slide-item"><span class="slide-ico">W</span>Wishlist</a>
        <a href="cart.html" class="slide-item"><span class="slide-ico">C</span>Cart</a>
        <div class="slide-divider"></div>
        <div class="slide-heading">Account</div>
        <div id="slide-auth-items"></div>
        <div id="slide-guest-items"></div>
        <div class="slide-divider"></div>
        <a href="profile.html" class="slide-item"><span class="slide-ico">P</span>Profile</a>
        <a href="orders.html" class="slide-item"><span class="slide-ico">O</span>Orders</a>
        <a href="wallet.html" class="slide-item"><span class="slide-ico">W</span>Wallet</a>
        <a href="settings.html" class="slide-item"><span class="slide-ico">S</span>Settings</a>
      </div>
    </div>`;

    const startIdx = content.indexOf('<div class="slide-menu" id="slide-menu">');
    if (startIdx !== -1) {
      let depth = 0;
      let endIdx = -1;
      for (let i = startIdx; i < content.length; i++) {
        if (content.substr(i, 4) === '<div') {
          depth++;
        } else if (content.substr(i, 6) === '</div>') {
          depth--;
          if (depth === 0) {
            endIdx = i + 6;
            break;
          }
        }
      }
      if (endIdx !== -1) {
        content = content.substring(0, startIdx) + cleanSlideMenu + content.substring(endIdx);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Restored slide menu in:', file);
      }
    }
  }
});
console.log('Done restoring slide menus.');
