const fs = require('fs');

// 1. Update icon-library.js to pure Black, Red & White theme
let lib = fs.readFileSync('/bargain-drop-repo/js/icon-library.js', 'utf8');

// Replace all hex color codes in I.* = { ..., c: '#...' } with '#E50914'
lib = lib.replace(/c:\s*'#[0-9a-fA-F]{6}'/g, "c: '#E50914'");
lib = lib.replace(/accent\s*\|\|\s*d\.c\s*\|\|\s*'#34495E'/g, "accent || '#E50914'");
lib = lib.replace(/stroke\s*\|\|\s*'currentColor'/g, "stroke || '#FFFFFF'");

fs.writeFileSync('/bargain-drop-repo/js/icon-library.js', lib);
console.log('Successfully updated js/icon-library.js to Black, Red & White');

// 2. Update slide-icons.js to Black, Red & White
let slide = fs.readFileSync('/bargain-drop-repo/js/slide-icons.js', 'utf8');
slide = slide.replace(/accent:\s*'#[0-9a-fA-F]{6}'/g, "accent: '#E50914'");
slide = slide.replace(/return 'rgba\(' \+ r \+ ',' \+ g \+ ',' \+ b \+ ',0\.14\)'/g, "return '#161616'");
slide = slide.replace(/ico\.style\.background = hexToSoftTint\(accent\);/g, "ico.style.background = '#181818'; ico.style.border = '1px solid #2C2C2C';");

fs.writeFileSync('/bargain-drop-repo/js/slide-icons.js', slide);
console.log('Successfully updated js/slide-icons.js to Black, Red & White');
