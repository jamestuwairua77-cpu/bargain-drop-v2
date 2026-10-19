const fs = require('fs');

let syncLib = fs.readFileSync('/bargain-drop-repo/functions/_sync-lib.js', 'utf8');

// Replace CANONICAL_CATEGORIES with the 14 CJ categories
syncLib = syncLib.replace(
  `const CANONICAL_CATEGORIES = [
  'womens-clothing', 'mens-clothing', 'bags-shoes', 'jewelry-watches',
  'furniture', 'home-garden', 'consumer-electronics', 'sports-outdoors',
  'health-beauty-hair', 'phones-accessories', 'pet-supplies',
  'toys-kids-babies', 'home-improvement', 'automobiles-motorcycles', 'computer-office',
];`,
  `const CANONICAL_CATEGORIES = [
  'womens-clothing', 'mens-clothing', 'bags-shoes', 'jewelry-watches',
  'home-garden-furniture', 'consumer-electronics', 'sports-outdoors',
  'health-beauty-hair', 'phones-accessories', 'pet-supplies',
  'toys-kids-babies', 'home-improvement', 'automobiles-motorcycles', 'computer-office'
];`
);

// Map old furniture and home-garden aliases to home-garden-furniture
syncLib = syncLib.replace(
  `  ['furniture', 'furniture'], ['chair', 'furniture'], ['sofa', 'furniture'], ['couch', 'furniture'],
  ['table', 'furniture'], ['cabinet', 'furniture'], ['shelf', 'furniture'], ['shelves', 'furniture'],
  ['wardrobe', 'furniture'], ['bookcase', 'furniture'], ['desk', 'furniture'], ['stool', 'furniture'],
  ['bench', 'furniture'], ['dresser', 'furniture'], ['mattress', 'furniture'], ['headboard', 'furniture'],`,
  `  ['furniture', 'home-garden-furniture'], ['chair', 'home-garden-furniture'], ['sofa', 'home-garden-furniture'], ['couch', 'home-garden-furniture'],
  ['table', 'home-garden-furniture'], ['cabinet', 'home-garden-furniture'], ['shelf', 'home-garden-furniture'], ['shelves', 'home-garden-furniture'],
  ['wardrobe', 'home-garden-furniture'], ['bookcase', 'home-garden-furniture'], ['desk', 'home-garden-furniture'], ['stool', 'home-garden-furniture'],
  ['bench', 'home-garden-furniture'], ['dresser', 'home-garden-furniture'], ['mattress', 'home-garden-furniture'], ['headboard', 'home-garden-furniture'],`
);

syncLib = syncLib.replace(
  `      if (slug === 'home-garden' && /(^|-)furniture(-|$)/.test(norm)) {
        return isFurnitureProduct(title) ? 'furniture' : 'home-garden';
      }
      return slug;`,
  `      return slug;`
);

fs.writeFileSync('/bargain-drop-repo/functions/_sync-lib.js', syncLib);
console.log('Successfully updated _sync-lib.js categories to 14 CJ categories');
