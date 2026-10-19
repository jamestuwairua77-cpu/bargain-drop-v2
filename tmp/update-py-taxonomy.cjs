const fs = require('fs');

let py = fs.readFileSync('/bargain-drop-repo/scripts/categorize_taxonomy.py', 'utf8');

// Replace TOP_LEVELS
const oldTop = `TOP_LEVELS = [
    ('womens-clothing',   "Women's Clothing"),
    ('mens-clothing',     "Men's Clothing"),
    ('bags-shoes',        "Bags & Shoes"),
    ('jewelry-watches',   "Jewelry & Watches"),
    ('furniture',         "Furniture"),
    ('home-garden',       "Home & Garden"),
    ('home-improvement',  "Home Improvement"),
    ('appliances',        "Appliances"),
    ('kitchen-dining',    "Kitchen & Dining"),
    ('lighting',          "Lighting"),
    ('bedding-bath',      "Bedding & Bath"),
    ('health-beauty-hair',"Health, Beauty & Hair"),
    ('sports-outdoors',   "Sports & Outdoors"),
    ('toys-kids-babies',  "Toys, Kids & Babies"),
    ('phones-accessories',"Phones & Accessories"),
    ('consumer-electronics', "Consumer Electronics"),
    ('automobiles-motorcycles', "Automobiles & Motorcycles"),
    ('pet-supplies',      "Pet Supplies"),
    ('computer-office',   "Computer & Office"),
    ('other',             "Other"),
]`;

const newTop = `TOP_LEVELS = [
    ('womens-clothing',         "Women's Clothing"),
    ('mens-clothing',           "Men's Clothing"),
    ('bags-shoes',              "Bags & Shoes"),
    ('jewelry-watches',         "Jewelry & Watches"),
    ('home-garden-furniture',   "Home, Garden & Furniture"),
    ('health-beauty-hair',      "Health, Beauty & Hair"),
    ('sports-outdoors',         "Sports & Outdoors"),
    ('toys-kids-babies',        "Toys, Kids & Babies"),
    ('phones-accessories',      "Phones & Accessories"),
    ('consumer-electronics',    "Consumer Electronics"),
    ('home-improvement',        "Home Improvement"),
    ('automobiles-motorcycles', "Automobiles & Motorcycles"),
    ('pet-supplies',            "Pet Supplies"),
    ('computer-office',         "Computer & Office"),
]`;

py = py.replace(oldTop, newTop);

// Map old categories in rules
py = py.replace(/'furniture'/g, "'home-garden-furniture'");
py = py.replace(/'home-garden'/g, "'home-garden-furniture'");
py = py.replace(/'kitchen-dining'/g, "'home-garden-furniture'");
py = py.replace(/'bedding-bath'/g, "'home-garden-furniture'");
py = py.replace(/'appliances'/g, "'home-improvement'");
py = py.replace(/'lighting'/g, "'home-improvement'");

fs.writeFileSync('/bargain-drop-repo/scripts/categorize_taxonomy.py', py);
console.log('Successfully updated scripts/categorize_taxonomy.py');
