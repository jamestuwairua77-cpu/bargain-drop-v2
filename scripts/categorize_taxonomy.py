# -*- coding: utf-8 -*-
"""Bargain Drop — title-first category + subcategory taxonomy.

Self-contained (no external imports). Used by rebuild_catalog.py and the
category-sync script. Each product is classified (title + existing product_type)
into a (top_level, subcategory). Rules match whole-words / word-prefixes only
(never substrings inside a word), in priority order (specific before broad).

Enhances the flat 16-category taxonomy with:
  - New top-levels: Appliances, Kitchen & Dining, Lighting, Bedding & Bath
  - Meaningful subcategories (e.g. Appliances > Fridges & Freezers).
"""
import re

RULES = [
    # === EYEWEAR (fix: sunglasses/glasses were landing in dinnerware) ===
    (['sunglasses','sun glasses','eyeglasses','eye glasses','reading glasses','eyewear','optical glasses','blue light glasses','blue light blocking','nose pad','nose pads','glasses frame','frame glasses','fashion glasses','plain glasses','decorated glasses','multi-purpose glasses','glasses for women','glasses for men','prescription glasses','polarized sunglasses','windproof goggles','cycling goggles','riding goggles','spectacles'], 'consumer-electronics', 'electronics', 'Eyewear & Glasses'),
    # === DUMBBELL / WEIGHTS (fix: 'weight plates' was landing in dinnerware) ===
    (['dumbbell','weight plate','weight plates','barbell weight','barbell weights','weight plate set','barbell','strength training'], 'sports-outdoors', 'fitness', 'Fitness & Yoga'),
    # === PET WATER BOTTLES / FEEDING (fix: 'water bottle' was landing in food-storage) ===
    (['dog water bottle','cat water bottle','pet water bottle','water bottle for dogs','water bottle for small dogs','dog drinking water','dog kettle','drinking water bottle','pet water','pet feeding','pet bowl','dog bowl','cat bowl','hamster cage','bird cage','animal cage','small animal cage','ferret cage','pet food storage','pet feeder','feeding station','bird cage feeder','pet drinking'], 'pet-supplies', 'pet-supplies', 'Pet Supplies'),
    # === SHOWER DRAIN (fix: 'drain' was landing in bathroom) ===
    (['shower drain','linear shower drain','floor drain','bathroom drain'], 'home-improvement', 'supplies', 'Home Improvement Supplies'),

    # === APPLIANCES (new top-level) ===
    (['air fryer','friteuse','deep fryer'], 'appliances', 'air-fryers', 'Air Fryers'),
    (['coffee maker','coffee machine','espresso','percolator','coffee filter','nespresso','french press','moka pot','coffee pot','milk frother'], 'appliances', 'coffee-machines', 'Coffee Machines'),
    (['electric kettle','water boiler','electric jug','tea kettle'], 'appliances', 'kettles', 'Kettles'),
    (['toaster'], 'appliances', 'toasters', 'Toasters'),
    (['blender','juicer','food processor','hand mixer','stand mixer','chef machine','smoothie maker','slushy'], 'appliances', 'blenders-mixers', 'Blenders & Mixers'),
    (['microwave'], 'appliances', 'microwaves', 'Microwaves'),
    (['oven','stove','cooktop','cooker','induction','gas hob','kitchen stove','hot plate'], 'appliances', 'ovens-cooktops', 'Ovens & Cooktops'),
    (['dishwasher'], 'appliances', 'dishwashers', 'Dishwashers'),
    (['washing machine','compact washer','laundry machine','tumble dryer','clothes dryer','spin dryer','clothes washing'], 'appliances', 'laundry', 'Laundry'),
    (['steam iron','garment steamer','clothes steamer','ironing'], 'appliances', 'irons-garment-care', 'Irons & Garment Care'),
    (['vacuum','robot vacuum','hopper vacuum','dust collector','cyclone','ash vacuum'], 'appliances', 'vacuums', 'Vacuums'),
    (['air purifier','water purifier','purifier','air cleaner'], 'appliances', 'purifiers', 'Air & Water Purifiers'),
    (['humidifier','dehumidifier'], 'appliances', 'climate-control', 'Climate Control'),
    (['space heater','room heater','patio heater','radiation heater','electric radiator','electric blanket','heating blanket'], 'appliances', 'heaters', 'Heaters'),
    (['ceiling fan','tower fan','standing fan','desk fan','exhaust fan','ventilation','duct fan','inline fan'], 'appliances', 'fans', 'Fans'),
    (['water dispenser','water pump','bottled water','water cooler','drinking fountain'], 'appliances', 'water', 'Water Dispensers & Pumps'),
    (['refrigerator','fridge','freezer','ice maker','mini fridge','chest freezer','ice machine','cool box','cooler box','car fridge'], 'appliances', 'fridges-freezers', 'Fridges & Freezers'),
    (['rice cooker','slow cooker','pressure cooker','instant pot','multi cooker','bread maker','yogurt maker','ice cream maker','egg cooker'], 'appliances', 'cookers', 'Cookers & Multi-Cookers'),
    (['air conditioner','portable ac','split ac','conditioner unit'], 'appliances', 'air-conditioners', 'Air Conditioners'),
    (['dehydrator','food dryer'], 'appliances', 'dehydrators', 'Food Dehydrators'),
    (['electric grill','bbq grill','tabletop grill','raclette','contact grill'], 'appliances', 'grills', 'Grills & BBQ'),

    # === FURNITURE ===
    (['bunk bed','loft bed','kids bed','children bed','kids bunk'], 'furniture', 'beds', 'Beds'),
    (['bed frame','bedframe','headboard','mattress','slatted base','bed base','bedstead','bed','beds'], 'furniture', 'beds', 'Beds'),
    ([' sofa','couch','loveseat','recliner','futon','sofa bed','sectional','chesterfield','corner sofa','bed sofa'], 'furniture', 'sofas', 'Sofas & Couches'),
    (['dining table','coffee table','side table','end table','console table','bar table','folding table','nightstand','bedside table','dressing table','vanity table','laptop table','nesting table'], 'furniture', 'tables', 'Tables'),
    ([' desk','writing desk','computer desk','study desk','office desk','standing desk','l-shaped desk','corner desk'], 'furniture', 'desks', 'Desks'),
    (['dining chair','bar stool','barstool','office chair','gaming chair','armchair','chaise','rocking chair','rocking','bench','ottoman','pouf','lounge chair','accent chair','swing chair','egg chair'], 'furniture', 'chairs', 'Chairs & Seating'),
    ([' chair','chairs','stool','seating'], 'furniture', 'chairs', 'Chairs & Seating'),
    (['wardrobe','dresser','chest of drawers','drawer unit','closet','armoire','sideboard','buffet','cabinet ','tv stand','tv cabinet','bookcase','shelving unit','shelf unit','display cabinet','display case','lowboard','highboard','locker','storage cabinet','media cabinet','shoe cabinet','curio cabinet','cabinet with'], 'furniture', 'cabinets-storage', 'Cabinets & Storage'),
    (['trolley','cart ','kitchen island','kitchen cart','utility cart','rolling cart','sideboard'], 'furniture', 'carts-trolleys', 'Carts & Trolleys'),

    # === LIGHTING (new top-level) ===
    (['chandelier','pendant lamp','pendant light','sconce','wall lamp','wall sconce','floor lamp','table lamp','desk lamp','bedside lamp','reading lamp','night light','ceiling light','ceiling lamp','floodlight','spotlight','lantern','fairy light','string light','strip light','led strip','light bulb','lightbulb','led bulb','downlight','recessed light','track light','lamp shade','lampshade','lava lamp','salt lamp'], 'lighting', 'lighting', 'Lighting'),

    # === KITCHEN & DINING (new top-level) ===
    (['frying pan','saucepan','wok','pot set','skillet','pan set','stockpot','casserole','griddle','cookware set','frypan','saucier'], 'kitchen-dining', 'cookware', 'Cookware'),
    (['chef knife','kitchen knife','knife set','knives','cutlery','pizza cutter','cheese knife','cleaver'], 'kitchen-dining', 'knives-cutlery', 'Knives & Cutlery'),
    (['cutting board','chopping board','chopping block'], 'kitchen-dining', 'cutting-boards', 'Cutting Boards'),
    (['dinnerware','plate set','plates','bowl set','serving bowl','cutlery set','mug set','cup set','glass set','glasses','tumbler','wine glass','coffee mug','teacup','ceramic dinnerware'], 'kitchen-dining', 'dinnerware', 'Dinnerware & Drinkware'),
    (['water bottle','lunch box','lunchbox','thermos','insulated bottle','food container','food jar','canister','food storage'], 'kitchen-dining', 'food-storage', 'Food & Drink Storage'),
    (['spice rack','kitchen utensil','utensils','kitchen gadget','kitchen tool','grater','peeler','colander','strainer','whisk','ladle','spatula','can opener','measuring cup','kitchen scale','pizza tray','baking tray','mixing bowl'], 'kitchen-dining', 'utensils-gadgets', 'Utensils & Gadgets'),
    (['kitchen sink','kitchen faucet','kitchen tap','mixing tap','pre-rinse'], 'kitchen-dining', 'sinks-faucets', 'Sinks & Faucets'),

    # === BEDDING & BATH ===
    (['duvet','quilt','pillow','blanket','bedding','comforter','bed sheet','sheet set','bedspread','mattress topper','mattress protector','pillowcase','duvet cover','quilt cover','body pillow','throw blanket','fitted sheet'], 'bedding-bath', 'bedding', 'Bedding'),
    (['bath towel','bath mat','bathroom mat','toilet ','shower ','bathtub','bathroom','soap dispenser','toothbrush','bidet','bathroom shelf','shower curtain','shower head','bath caddy','bathrobe','bathroom cabinet','bathroom mirror','toilet seat','shower panel'], 'bedding-bath', 'bathroom', 'Bathroom'),

    # === GARDEN & OUTDOOR ===
    (['greenhouse','gazebo','pergola','parasol','garden bridge','raised garden bed','raised bed','planter','flower pot','flower box','plant pot','garden bed','garden bench','garden chair','garden table','patio furniture','rattan furniture','outdoor furniture','sun lounger','garden lounge','garden sofa','garden furniture'], 'home-garden', 'garden-furniture', 'Garden Furniture'),
    (['sprinkler','watering','garden hose','hose reel','irrigation','lawn mower','grass trimmer','hedge trimmer','leaf blower','garden tools','garden tool','pruner','trowel','shovel','rake','spade'], 'home-garden', 'garden-tools', 'Garden Tools'),
    (['garden','gardening','outdoor ','terrace','yard ','patio','pond','fountain','compost','seed','fertilizer','plant stand','plant support','greenhouse'], 'home-garden', 'garden', 'Garden & Outdoor'),

    # === TOOLS & HOME IMPROVEMENT ===
    (['screwdriver','drill ','impact driver','wrench','saw ','hammer','pliers','ladder','tape measure','toolbox','socket set','bit set','workbench','power tool','hand tool','spirit level','clamp','sander','grinder','multimeter','soldering','work gloves','safety gloves','tool bag','wire stripper','cable stripper','angle grinder','bench grinder','jack ','car jack','floor jack'], 'home-improvement', 'tools', 'Tools'),
    (['handrail','stair','door handle','drawer handle','hinge','bracket','fastener','screw ','nail','dowel','wall plug','mounting','hardware','door knob','latch','door lock','barn door'], 'home-improvement', 'hardware', 'Hardware'),
    (['paint ','painting','brushes','tape ','sealant','adhesive','filler','sandpaper','masking','extension cord','cable','wire ','wiring'], 'home-improvement', 'supplies', 'Home Improvement Supplies'),

    # === HOME DECOR ===
    (['vase','ornament','figurine','statue','wall art','canvas','picture frame','photo frame','wall clock','mirror ','candle','candle holder','wall sticker','artificial plant','artificial flower','wall decor','wall hanging','decorative','decoration','decor ','gallery wall'], 'home-garden', 'decor', 'Home Decor'),
    ([' rug','carpet','doormat','door mat','floor mat','area rug','runner rug','hallway rug'], 'home-garden', 'rugs', 'Rugs & Mats'),
    (['curtain','blind ','curtain rod','curtain pole','drape','drapery','valance'], 'home-garden', 'curtains', 'Curtains & Blinds'),
    (['storage','organizer','organiser','shelving','storage box','storage bin','storage basket','laundry basket','hanging organizer','closet organizer','drawer organiser'], 'home-garden', 'storage', 'Storage & Organisation'),
    (['rack ','hook ','clothes rack','coat rack','towel rack','wall hook','pegboard','hanger'], 'home-garden', 'racks-hooks', 'Racks & Hooks'),

    # === WOMEN'S CLOTHING ===
    (['dress','dresses','maxi dress','midi dress','gown','evening dress','mini dress'], 'womens-clothing', 'dresses', 'Dresses'),
    (['skirt','skirts','midi skirt','maxi skirt'], 'womens-clothing', 'skirts', 'Skirts'),
    (['legging','leggings','yoga pant','yoga pants','athleisure','activewear'], 'womens-clothing', 'leggings', 'Leggings & Activewear'),
    (['bra','bralette','crop top','bodysuit','swimsuit','bikini','tankini','lingerie','swimwear','camisole'], 'womens-clothing', 'bras-swimwear', 'Bras & Swimwear'),
    (['blouse','shirt','top ','tops','camisole top','tee ','t-shirt','tshirt','sweater','cardigan','knit ','jumper','pullover','hoodie','sweatshirt'], 'womens-clothing', 'tops', 'Tops & Knitwear'),
    (['jacket','coat ','outerwear','blazer','trench','parka','puffer','fleece','windbreaker','bomber'], 'womens-clothing', 'outerwear', 'Jackets & Coats'),
    (['pants','trousers','jeans','culottes','shorts','capri','jumpsuit','romper','playsuit','overall','culottes','palazzo','sweatpants'], 'womens-clothing', 'bottoms', 'Pants & Shorts'),
    (['women','womens','lady','ladies','girls ','female'], 'womens-clothing', 'other-womens', "Women's Clothing"),

    # === MEN'S CLOTHING ===
    (['mens shirt','men shirt','polo shirt','tank top','men vest','mens tee'], 'mens-clothing', 'tops', 'Tops'),
    (['mens jeans','man jeans','mens pants','men pants','cargo pant','chino','slacks','men shorts','mens shorts'], 'mens-clothing', 'bottoms', 'Pants & Shorts'),
    (['mens jacket','men jacket','mens coat','men coat','men hoodie','sweatshirt men','bomber jacket','denim jacket','leather jacket'], 'mens-clothing', 'outerwear', 'Jackets & Outerwear'),
    (['mens sweater','men sweater','men cardigan','men knit','men pullover'], 'mens-clothing', 'sweaters', 'Sweaters & Knits'),
    (["men's",'mens ','men ','gents','male ','his '], 'mens-clothing', 'other-mens', "Men's Clothing"),

    # === BAGS & SHOES ===
    (['backpack','rucksack','school bag','daypack','laptop bag','messenger bag','travel backpack'], 'bags-shoes', 'backpacks', 'Backpacks'),
    (['handbag','tote bag','shoulder bag','crossbody','clutch','purse','wallet','luggage','suitcase','travel bag','duffel','makeup bag','cosmetic bag','coin purse','card holder','gym bag','drawstring bag'], 'bags-shoes', 'bags-wallets', 'Bags & Wallets'),
    (['shoes','sneakers','trainers','boots','boot ','slippers','sandals','flats','heels','pumps','loafers','moccasin','espadrille','mary jane','oxford','wedges','booties','chelsea boot'], 'bags-shoes', 'shoes', 'Shoes'),

    # === JEWELRY & WATCHES ===
    (['ring','rings','band ring','engagement ring','wedding ring','solitaire'], 'jewelry-watches', 'rings', 'Rings'),
    (['necklace','pendant','chain rack','choker','chain necklace'], 'jewelry-watches', 'necklaces', 'Necklaces & Pendants'),
    (['bracelet','bangle','cuff bracelet','anklet'], 'jewelry-watches', 'bracelets', 'Bracelets & Bangles'),
    (['earring','earrings','stud','hoop earring','ear cuff'], 'jewelry-watches', 'earrings', 'Earrings'),
    (['watch','watches','watch band','watch strap','chronograph','wristwatch','watch hands'], 'jewelry-watches', 'watches', 'Watches'),
    (['jewelry','jewellery','925 silver','sterling silver','gold necklace','silver ','gold ring'], 'jewelry-watches', 'jewelry-sets', 'Jewelry'),

    # === HEALTH, BEAUTY & HAIR ===
    (['nail polish','nail gel','nail art','nail care','manicure','pedicure','nail kit'], 'health-beauty-hair', 'nail', 'Nail Care'),
    (['makeup','foundation','lipstick','mascara','eyeshadow','concealer','eyeliner','blush','cosmetic','beauty blender','face powder','contour','lip gloss','lip balm','face paint'], 'health-beauty-hair', 'makeup', 'Makeup'),
    (['skin care','skincare','moisturizer','moisturiser','face cream','serum','essence','toner','cleanser','face mask','anti-aging','sunscreen','face wash','body lotion','hand cream'], 'health-beauty-hair', 'skincare', 'Skin Care'),
    (['shampoo','conditioner','wig','hair dryer','straightener','curling iron','hair extension','hairbrush','hair oil','hair clip','hair band','hairpin','hair accessory','headband'], 'health-beauty-hair', 'hair', 'Hair Care'),
    (['massager','massage gun','health device','wellness','supplement','vitamin','slimming','weight loss','foot spa','gua sha'], 'health-beauty-hair', 'wellness', 'Health & Wellness'),
    (['perfume','fragrance','cologne','eau de toilette','eau de parfum'], 'health-beauty-hair', 'fragrance', 'Fragrance'),

    # === SPORTS & OUTDOORS ===
    (['golf','putter','golf bag','golf club','golf grip'], 'sports-outdoors', 'golf', 'Golf'),
    (['camping','hiking','trekking','tent ','sleeping bag','walking stick','headlamp','fishing rod','fishing','backpacking','survival','compass'], 'sports-outdoors', 'camping-hiking', 'Camping & Hiking'),
    (['bicycle','bike stem','cycling','mountain bike','bike rack','bike pump','cycle'], 'sports-outdoors', 'cycling', 'Cycling'),
    (['yoga','dumbbell','gym ','workout','exercise','pilates','resistance band','kettlebell','weight bench','treadmill','exercise bike','pull up bar','foam roller'], 'sports-outdoors', 'fitness', 'Fitness & Yoga'),
    (['football','soccer','basketball','tennis','badminton','volleyball','cricket','lacrosse','trampoline','skate','scooter','surf','snow','ski','skiing','swimming','swim ','goggles','racket'], 'sports-outdoors', 'sports-gear', 'Sports Gear'),

    # === TOYS, KIDS & BABIES ===
    ([' toy','toys','plush','doll','doll clothes','doll outfit','doll accessories','doll accessory','doll clothing','action figure','building block','lego','puzzle','board game','remote control car','rc car','bubble machine','building blocks','montessori','toy set','stuffed'], 'toys-kids-babies', 'toys', 'Toys & Games'),
    (['baby','toddler','infant','stroller','pram','nursing','pacifier','crib','bassinet','high chair','diaper','baby bottle','nursery','teether'], 'toys-kids-babies', 'baby-toddler', 'Baby & Toddler'),
    (['kids','children','toddler','child ','boys','girls'], 'toys-kids-babies', 'kids', 'Kids'),

    # === PHONES & ACCESSORIES ===
    (['phone case','iphone','samsung case','screen protector','phone screen','mobile case','charging case','phone holder','phone stand','phone mount','phone cover','phone sleeve'], 'phones-accessories', 'phone-cases', 'Phone Cases & Covers'),
    (['charger','charging cable','usb cable','power bank','wireless charger','charging pad','fast charger','usb-c','car charger','charging station'], 'phones-accessories', 'chargers-cables', 'Chargers & Cables'),
    (['phone','mobile phone','cellphone','smartphone','iphone'], 'phones-accessories', 'phones', 'Phones'),

    # === CONSUMER ELECTRONICS ===
    (['bluetooth speaker','speaker','headphone','earbuds','headset','earphone','soundbar','subwoofer','amplifier','microphone','audio','radio','boombox','karaoke'], 'consumer-electronics', 'audio', 'Audio & Speakers'),
    (['camera','camcorder','dvr','dash cam','action camera','cctv','surveillance','security camera','webcam','trail camera','baby monitor'], 'consumer-electronics', 'cameras', 'Cameras & Security'),
    (['projector','television','tv set','monitor','tablet','kindle','ebook','smart watch','smartwatch','fitness tracker','drone','gps','translator','e-reader'], 'consumer-electronics', 'electronics', 'Electronics & Gadgets'),

    # === AUTOMOBILES & MOTORCYCLES ===
    (['windshield','car floor mat','car seat','car cover','car wash','car care','car cleaning','car accessory','car accessories','car mat','car polish','car wax','car organizer','car trash','car mount','car holder','car charger mount'], 'automobiles-motorcycles', 'car-accessories', 'Car Accessories'),
    (['dump truck','car ','auto parts','dashboard','steering wheel','vehicle','tire pressure','car jack','jump starter','obd','air pump','car pump','fuel','engine ','brake ','oil filter'], 'automobiles-motorcycles', 'car-accessories', 'Car Accessories'),
    (['motorcycle','motorbike','riding gear','motorcycle helmet','bike helmet','motorcycle gloves','motorcycle cover'], 'automobiles-motorcycles', 'motorcycle', 'Motorcycle'),
    (['speed bump','parking','traffic cone','road barrier','garage ','tow strap','carabiner'], 'automobiles-motorcycles', 'garage-parking', 'Garage & Parking'),

    # === PET SUPPLIES ===
    (['dog','puppy','cat ','kitten','cat tree','cat tower','cat litter','pet ','pets','bird cage','fish tank','aquarium','hamster','rabbit','reptile','chicken coop','pet carrier','dog collar','cat collar','pet bed','pet feeder','pet bowl'], 'pet-supplies', 'pet-supplies', 'Pet Supplies'),

    # === COMPUTER & OFFICE ===
    (['laptop','keyboard','mouse ','computer','desktop','printer','scanner','webcam','cpu ','ram ','ssd','hard drive','graphics card','motherboard','computer accessory'], 'computer-office', 'computers', 'Computers & Accessories'),
    (['office','stationery','stationary','pen ','pencil','paper ','notebook','file ','binder','whiteboard','ergonomic','headset stand','monitor stand','desk organizer','document holder','paper shredder'], 'computer-office', 'office', 'Office & Stationery'),
]

# Canonical top-levels (slug -> display name), in display order.
TOP_LEVELS = [
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
]
TOP_NAME = {s: n for s, n in TOP_LEVELS}

# Sort rules by phrase length (most specific first), stable.
RULES.sort(key=lambda r: -max(len(k) for k in r[0]))

def _tk_re(tok):
    return r'(?<![a-z0-9])' + re.escape(tok) + r'(?:s|es)?(?![a-z0-9])'

_SEP = r'[\s\-]+'

_compiled = []
for _phrases, _top, _sub, _disp in RULES:
    for _ph in _phrases:
        _toks = [_t for _t in _ph.split(' ') if _t]
        _pat = _SEP.join(_tk_re(_t) for _t in _toks)
        _compiled.append((re.compile(_pat), _top, _sub, _disp))
_compiled.sort(key=lambda x: -len(x[0].pattern))

_FALLBACK_TOP = {
    'womens-clothing','mens-clothing','bags-shoes','jewelry-watches','furniture',
    'home-garden','home-improvement','health-beauty-hair','sports-outdoors',
    'toys-kids-babies','phones-accessories','consumer-electronics',
    'automobiles-motorcycles','pet-supplies','computer-office',
}

def classify(title, ptype=''):
    """Return (top_slug, sub_slug, sub_display)."""
    t = (title + ' ' + (ptype or '')).lower()
    for rx, top, sub, disp in _compiled:
        if rx.search(t):
            return top, sub, disp
    n = (ptype or '').lower().replace(' & ','-').replace(' ','-').replace('"','').replace("'",'').replace(',','')
    if n in _FALLBACK_TOP:
        return n, 'other', 'Other'
    return 'other', 'other', 'Other'

def category_key(top, sub):
    """Hierarchical key for categories-data.json (sub -> 'top->sub')."""
    if sub and sub not in ('other',):
        return f"{top}->{sub}"
    return top
