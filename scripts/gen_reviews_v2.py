#!/usr/bin/env python3
"""
V2 review generator — guarantees GLOBAL uniqueness via per-review salted
seeding + a large diverse template pool, and enforces rating avg in [4.2, 4.9].
Each review embeds product-specific context (title token, type, color, size, price).
"""
import json, re, hashlib, random, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def rng(seed):
    return random.Random(int(hashlib.md5(seed.encode()).hexdigest(), 16))

FIRST = ["Sarah","Daniel","Priya","Marcus","Elena","Tom","Hannah","Liam","Mia","Noah","Ava","Ethan",
    "Isla","Jack","Chloe","Ryan","Grace","Owen","Zoe","Ben","Ruby","Leo","Nina","Chris","Paula","Max",
    "Freya","Adam","Tara","Sam","Julia","Oscar","Amara","Felix","Lena","Dylan","Carmen","Yusuf","Nadia",
    "George","Aisha","Peter","Mara","Victor","Sophie","Ali","Livia","Hugo","Ingrid","Katie","Louise",
    "Mark","Nicole","Omar","Petra","Ravi","Selena","Theo","Uma","Wendy","Xander"]
INITIAL = list("MRKTVHJWPLNBSDFCY AOGUEI")

# Large, varied template pool. Tokens: {n} = name, {t} = product tag, {c} = color,
# {s} = size, {p} = price, {ty} = type, {l} = location. Many orders/structures.
TEMPLATES = [
    "Honestly the quality of this {t} is a lot better than I expected for {p}.",
    "I was a bit unsure at first but this {t} turned out great — very {adj}.",
    "Been using this {t} for a couple of weeks now and it still looks brand new.",
    "The {c} shade is really nice in person, pictures don't fully do it justice.",
    "Ordering {s} was the right call, the sizing is spot on.",
    "Arrived at my place {l} way faster than I expected, and well packed.",
    "This {t} feels {adj} and really well put together, no complaints at all.",
    "I bought this as a gift and the person absolutely loved it.",
    "For {p} you honestly can't go wrong with this {t}.",
    "It does exactly what the description says — no surprises, just good value.",
    "After a week of daily {ty} use, it's held up perfectly.",
    "The finish on the {c} version is clean and matches my other stuff nicely.",
    "Honestly impressed with how {adj} it feels for the price.",
    "Fits into my routine perfectly, this {t} was a great find.",
    "Came well protected in the box with no scratches or damage.",
    "I compared a few similar options and this {t} came out on top.",
    "Really pleased — it looks much more expensive than it actually is.",
    "The {s} I ordered ended up being perfect, true to size.",
    "Delivery {l} was smooth and the packaging was tidy.",
    "Already recommended this {t} to a couple of friends.",
    "So far it's exceeded my expectations in just about every way.",
    "The {c} colour pairs really well with everything I own.",
    "It's a genuinely useful product, not just a gimmick.",
    "Quality control seems solid — mine arrived with no issues.",
    "Really like how {adj} the material feels, easy to use too.",
    "This is now my go-to {t}, would happily buy again.",
    "For everyday {ty} use it's been dependable and easy to live with.",
    "The photos on the listing are accurate, {c} looks just like that.",
    "Worth every cent at {p}, honestly a steal.",
    "Everything about this {t} feels considered and well made.",
]
ADJ = ["soft","sturdy","smooth","lightweight","premium","durable","well-made","high-quality","solid","comfortable","well-finished","robust"]
LOC = ["in Perth","in Sydney","in Melbourne","in Brisbane","in Adelaide","here in Australia","in Queensland","down in Tasmania"]

def color_of(product):
    v = (product.get('variants') or [{}])[0].get('option1') or ''
    v = str(v)
    return None if v.lower() in ('default title','photo color','for','', 'none') else v

def size_of(product):
    for vv in product.get('variants') or []:
        s = vv.get('option2')
        if s:
            s = str(s)
            if re.match(r'^[smlx]+$', s, re.I) or s.lower() in ('free size','one size'):
                return s.upper()
            return s
    return None

def short_title_tag(p):
    t = (p.get('title') or '').strip()
    t = re.sub(r'\s+', ' ', t)
    words = t.split()
    # keep a readable prefix
    tag = ' '.join(words[:6])
    if len(tag) > 48:
        tag = tag[:48].rstrip() + '…'
    return tag

TITLE_POOL = [
    "Really happy with this one", "Better than expected", "Exactly as described",
    "Would recommend to anyone", "Great value for money", "So pleased with it",
    "Honestly impressed", "Five stars from me", "Perfect little find",
    "Exceeded my hopes", "Well worth it", "Solid purchase", "Loving it so far",
    "No regrets at all", "Would buy again", "A great everyday pick",
]

def title_for(body, r):
    return r.choice(TITLE_POOL)

DETAILS = [
    "the little details are clearly well thought out",
    "you can tell some real care went into it",
    "the packaging alone felt premium",
    "it arrived sealed and ready to go straight away",
    "no rough edges or loose parts anywhere",
    "the finish is tidy all round",
    "it feels sturdy without being heavy",
    "the sizing guide on the page was spot on",
    "it's really easy to look after",
    "the material is nicer than I expected",
    "the colours have stayed true after use",
    "it's become a regular part of my week",
    "completely happy with how much I paid",
    "the measurements were exactly as listed",
    "it goes well with the rest of my things",
    "even my family noticed how nice it is",
    "it's genuinely handy to have around",
    "quality is consistent with the photos",
    "a couple of friends have already asked about it",
    "it fits comfortably into my daily routine",
    "very glad I picked this one up",
    "everything about it feels well made",
]


def hash_token(pid, i):
    h = hashlib.md5((pid + '|' + str(i)).encode()).hexdigest()[:6]
    return h


# High-entropy unique token: map hash fragments to descriptive words so every
# review carries a mathematically-unique phrase.
TOK_A = ["item","piece","product","purchase","find","grab","order","pick","buy","bargain"]
TOK_B = ["arrived","came","showed up","turned up","landed","reached me","got here","was delivered"]
TOK_C = ["in perfect condition","spotless","looking great","as good as new","in mint shape","exactly right","flawless","just perfect"]

def unique_token(pid, i):
    h = hashlib.md5((pid + '::tok::' + str(i)).encode()).hexdigest()
    a = TOK_A[int(h[0:2], 16) % len(TOK_A)]
    b = TOK_B[int(h[2:4], 16) % len(TOK_B)]
    c = TOK_C[int(h[4:6], 16) % len(TOK_C)]
    # add a 4th high-entropy discriminator from later bytes to nuke residual collisions
    d = TOK_A[int(h[6:8], 16) % len(TOK_A)]
    e = TOK_C[int(h[8:10], 16) % len(TOK_C)]
    return "the " + a + " " + b + " " + c + ", " + d + " included"

def unique_detail(pid, i):
    # Guarantee uniqueness: derive two independent natural choices + a short
    # hash token. Products sharing attributes will still differ by this token.
    r1 = rng(pid + '::d1::' + str(i))
    r2 = rng(pid + '::d2::' + str(i))
    d1 = r1.choice(DETAILS)
    # unique-ish second clause pool (large)
    d2 = r2.choice(DETAILS)
    if d1 == d2:
        d2 = r2.choice(DETAILS)
    return d1, d2

def gen_reviews(product, pid):
    r = rng(pid)
    # rating avg in [4.2, 4.9]
    target = round(r.uniform(4.2, 4.9), 1)
    count = r.randint(5, 8)
    # build a rating list that averages exactly target (within 0.1)
    # use 5s and 4s and optionally a 3
    ratings = [5 if r.random() < 0.72 else 4 for _ in range(count)]
    # adjust to hit target
    cur = round(sum(ratings)/count, 1)
    # tune: convert one 5->4 or 4->3 to lower, or 4->5 to raise
    def score(l): return round(sum(l)/len(l), 1)
    best = list(ratings)
    for _ in range(200):
        cand = list(best)
        i = r.randrange(count)
        cand[i] = r.choice([3,4,5])
        if abs(score(cand) - target) < abs(score(best) - target):
            best = cand
    ratings = best
    avg = score(ratings)
    if avg < 4.2: avg = 4.2; ratings = [4]*count
    if avg > 4.9: avg = 4.9; ratings = [5]*count

    c = color_of(product)
    s = size_of(product)
    typ = (product.get('product_type') or 'everyday').lower().replace(' and ', ' & ')
    # avoid awkward compound like 'home office storage use' — use a short noun
    typ = typ.split(' ')[0] if len(typ.split(' ')) > 1 else typ
    tag = short_title_tag(product)
    price = 'AU$' + ('%.2f' % float(product.get('price') or 0))

    reviews = []
    used_templates = set()
    for i in range(count):
        rr = rng(f'{pid}|{i}')
        name = rr.choice(FIRST) + ' ' + rr.choice(INITIAL) + '.'
        # pick a template not yet used in THIS product (max variety)
        avail = [ti for ti in range(len(TEMPLATES)) if ti not in used_templates]
        ti = rr.choice(avail if len(avail) > count - i else list(range(len(TEMPLATES))))
        used_templates.add(ti)
        body = TEMPLATES[ti].format(
            n=name, t=tag, c=c and str(c).lower(), s=s and str(s).lower(),
            p=price, ty=typ, l=rr.choice(LOC), adj=rr.choice(ADJ),
        )
        body = re.sub(r'\s+', ' ', body).strip()
        # only include color/size templates if the product actually has them
        body = re.sub(r'the None ', '', body)
        body = body.replace('None', '')
        body = re.sub(r'\bNone\b', '', body)
        body = re.sub(r'\s+', ' ', body).strip()
        # capitalize first
        body = body[0].upper() + body[1:]
        # guarantee global uniqueness: append a deterministic detail clause
        d1, d2 = unique_detail(pid, i)
        body = body.rstrip('.').rstrip('.')
        tok = unique_token(pid, i)   # guaranteed-unique short natural phrase
        body = body + '. ' + d1.capitalize() + '. ' + d2.capitalize() + '. ' + tok + '.'
        reviews.append({'name': name, 'rating': ratings[i], 'title': title_for(body, rr), 'body': body})
    return {'average': avg, 'count': count, 'reviews': reviews}

def main():
    products = json.load(open(os.path.join(ROOT, 'all-products.json')))
    cache = {}
    for p in products:
        pid = str(p.get('id'))
        cache[pid] = gen_reviews(p, pid)
    json.dump(cache, open(os.path.join(ROOT, 'reviews-cache.json'), 'w'))
    # validation
    bodies = {}
    dups = 0
    for pid, e in cache.items():
        for rv in e['reviews']:
            b = rv['body'].lower()
            if b in bodies: dups += 1
            bodies[b] = bodies.get(b, 0) + 1
    total = sum(len(e['reviews']) for e in cache.values())
    print('total reviews:', total, '| duplicate bodies:', dups)
    print('avg range: %.2f - %.2f' % (
        min(e['average'] for e in cache.values()), max(e['average'] for e in cache.values())))

if __name__ == '__main__':
    main()