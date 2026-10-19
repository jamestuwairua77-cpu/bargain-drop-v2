// Bargain Drop — auto-iconify
// Runtime pass that replaces standalone "icon emoji" glyphs in the DOM with
// cohesive custom SVG icons from the Lumi library. It only touches known icon
// emoji (not functional symbols like ✓/✗/★ ratings, and not currency flags),
// and never touches <svg>, <script>, <style>, <code>, <pre>, or inputs.
(function (global) {
  'use strict';
  if (!(global.BDIcon && global.BDIcon.svg)) return;

  var ICON_FOR = {
    // category emoji
    '👗': 'womensClothing', '👔': 'mensClothing', '👕': 'mensClothing', '👜': 'bagsShoes',
    '👠': 'bagsShoes', '👟': 'bagsShoes', '💍': 'jewelry', '💎': 'jewelry', '⌚': 'jewelry',
    '🏡': 'homeGarden', '🌿': 'homeGarden', '🛋': 'homeGarden', '🔨': 'homeImprovement',
    '🔧': 'homeImprovement', '💄': 'beauty', '🧴': 'beauty', '🩺': 'beauty',
    '⚽': 'sports', '🏀': 'sports', '🎾': 'sports', '⚾': 'sports',
    '🧸': 'toys', '🎲': 'toys', '🚼': 'toys', '📱': 'phones', '🎧': 'electronics',
    '📺': 'electronics', '💻': 'computer', '🖥': 'computer', '⌨': 'computer',
    '🖱': 'computer', '🚗': 'automotive', '🏍': 'automotive', '🚙': 'automotive',
    '🐾': 'pets', '🐶': 'pets', '🐱': 'pets', '📦': 'orders', '🧳': 'bagsShoes',
    // nav / account / common
    '👤': 'account', '🔐': 'security', '🔒': 'security', '🔑': 'key', '❤️': 'wishlist',
    '❤': 'wishlist', '💗': 'wishlist', '💛': 'wishlist', '🛒': 'cart', '🛍': 'cart',
    '🏷️': 'priceDrop', '🏷': 'priceDrop', '🎁': 'gift', '🎀': 'gift', '💳': 'payment',
    '💰': 'credit', '🪙': 'credit', '📈': 'chartLine', '📊': 'chartBar', '📉': 'chartLine',
    '📋': 'clipboard', '🗂': 'clipboard', '🗑': 'trash', '🗑️': 'trash', '✉️': 'verifyEmail',
    '✉': 'verifyEmail', '📧': 'verifyEmail', '📬': 'mail', '📪': 'mail', '📥': 'download',
    '📲': 'phones', '🔄': 'refresh', '↻': 'refresh', '🔔': 'notifications', '🔕': 'notifications',
    '📍': 'location', '📞': 'phone', '☎': 'phone', '🚚': 'truck', '✅': 'check',
    '⭐': 'review', '🌟': 'review', '⚠️': 'warning', '⚠': 'warning', '⛔': 'warning',
    '🏭': 'factory', '⚙️': 'gear', '⚙': 'gear', '🔧️': 'gear', '🎯': 'target',
    '✨': 'sparkles', '💬': 'chat', '💭': 'chat', '🎧️': 'electronics', '🚀': 'flash',
    '📝': 'clipboard', '✏️': 'clipboard', '🏠': 'home', '🏡️': 'homeGarden',
    '📂': 'clipboard', '📁': 'clipboard', '🗂': 'clipboard', '🎫': 'discount', '🎟️': 'discount',
    '🎟': 'discount', '🔐': 'security', '🔓': 'security', '🛡️': 'privacy', '🛡': 'privacy',
    '💊': 'beauty', '🩹': 'beauty', '🧴️': 'beauty', '🧾': 'receipt',
    '🔍': 'search', '🔎': 'search', '📪': 'mail', '💾': 'database', '💿': 'database',
    '✏️': 'clipboard', '✏': 'clipboard', '🖊': 'clipboard', '🖋': 'clipboard'
  };

  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, CODE: 1, PRE: 1, SVG: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1 };

  function emojiAt(text, i) {
    // handle surrogate pairs
    var cp = text.codePointAt(i);
    var ch = String.fromCodePoint(cp);
    if (cp === 0xFE0F || cp === 0x200D) return null; // variation selectors / ZWJ handled by caller
    if (cp >= 0x1F1E6 && cp <= 0x1F1FF) return null; // flags — skip
    return ICON_FOR[ch] || (ICON_FOR[ch + '\uFE0F']) || null;
  }

  function walk(node) {
    var child = node.firstChild;
    while (child) {
      var next = child.nextSibling;
      if (child.nodeType === 1) { // element
        var tag = child.tagName;
        if (!SKIP_TAGS[tag]) walk(child);
      } else if (child.nodeType === 3) { // text
        var text = child.nodeValue;
        if (text && /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2700}-\u{27FF}\u{2B00}-\u{2BFF}\u{2764}]/u.test(text)) {
          processText(child, text);
        }
      }
      child = next;
    }
  }

  function processText(textNode, text) {
    var frag = document.createDocumentFragment();
    var last = 0;
    var span = null;
    for (var i = 0; i < text.length; i++) {
      var code = text.codePointAt(i);
      var ch = String.fromCodePoint(code);
      var name = emojiAt(text, i);
      if (name) {
        // flush text before
        if (last < i) frag.appendChild(document.createTextNode(text.slice(last, i)));
        var svg = global.BDIcon.svg(name, { size: 16, color: '#555', noAccent: false });
        var holder = document.createElement('span');
        holder.className = 'bd-ic-inline';
        holder.setAttribute('data-ic', name);
        holder.innerHTML = svg;
        holder.style.display = 'inline-flex';
        holder.style.verticalAlign = '-0.2em';
        holder.style.margin = '0 2px';
        frag.appendChild(holder);
        i += (code > 0xFFFF ? 1 : 0); // skip low surrogate half
        last = i + 1;
      } else if (code > 0xFFFF) {
        i++; // skip surrogate pair (non-icon emoji)
      }
    }
    if (last === 0) return; // nothing replaced
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    textNode.parentNode.replaceChild(frag, textNode);
  }

  global.BDIconifyAuto = { run: function () { walk(document.body); } };
  if (typeof document !== 'undefined') {
    var run = function () { walk(document.body); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
    // also run shortly after load for any SPA-injected content
    if (document.readyState !== 'complete') {
      window.addEventListener('load', function () { setTimeout(run, 50); });
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
