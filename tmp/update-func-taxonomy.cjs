const fs = require('fs');

let code = fs.readFileSync('/bargain-drop-repo/functions/_categorize-taxonomy.js', 'utf8');

// Replace top levels
const oldTop = `export const TAXONOMY_TOP_LEVELS = [
  ["womens-clothing", "Women's Clothing"],
  ["mens-clothing", "Men's Clothing"],
  ["bags-shoes", "Bags & Shoes"],
  ["jewelry-watches", "Jewelry & Watches"],
  ["furniture", "Furniture"],
  ["home-garden", "Home & Garden"],
  ["home-improvement", "Home Improvement"],
  ["appliances", "Appliances"],
  ["kitchen-dining", "Kitchen & Dining"],
  ["lighting", "Lighting"],
  ["bedding-bath", "Bedding & Bath"],
  ["health-beauty-hair", "Health, Beauty & Hair"],
  ["sports-outdoors", "Sports & Outdoors"],
  ["toys-kids-babies", "Toys, Kids & Babies"],
  ["phones-accessories", "Phones & Accessories"],
  ["consumer-electronics", "Consumer Electronics"],
  ["automobiles-motorcycles", "Automobiles & Motorcycles"],
  ["pet-supplies", "Pet Supplies"],
  ["computer-office", "Computer & Office"],
  ["other", "Other"],
];`;

const newTop = `export const TAXONOMY_TOP_LEVELS = [
  ["womens-clothing", "Women's Clothing"],
  ["mens-clothing", "Men's Clothing"],
  ["bags-shoes", "Bags & Shoes"],
  ["jewelry-watches", "Jewelry & Watches"],
  ["home-garden-furniture", "Home, Garden & Furniture"],
  ["health-beauty-hair", "Health, Beauty & Hair"],
  ["sports-outdoors", "Sports & Outdoors"],
  ["toys-kids-babies", "Toys, Kids & Babies"],
  ["phones-accessories", "Phones & Accessories"],
  ["consumer-electronics", "Consumer Electronics"],
  ["home-improvement", "Home Improvement"],
  ["automobiles-motorcycles", "Automobiles & Motorcycles"],
  ["pet-supplies", "Pet Supplies"],
  ["computer-office", "Computer & Office"],
];`;

code = code.replace(oldTop, newTop);

// Map old categories in rules
code = code.replace(/"furniture"/g, '"home-garden-furniture"');
code = code.replace(/"home-garden"/g, '"home-garden-furniture"');
code = code.replace(/"kitchen-dining"/g, '"home-garden-furniture"');
code = code.replace(/"bedding-bath"/g, '"home-garden-furniture"');
code = code.replace(/"appliances"/g, '"home-improvement"');
code = code.replace(/"lighting"/g, '"home-improvement"');

fs.writeFileSync('/bargain-drop-repo/functions/_categorize-taxonomy.js', code);
console.log('Successfully updated functions/_categorize-taxonomy.js');
