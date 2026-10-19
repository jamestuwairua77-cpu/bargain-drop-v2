import React, { useState, useEffect, useMemo } from 'react';
import {
  BargainDropLogo,
  IconSearch,
  IconCart,
  IconHeart,
  IconShield,
  IconTruck,
  IconReturns,
  IconStar,
  IconTag,
  IconFilter,
  IconEye,
  IconClose,
  IconDropArrow,
  IconZap,
  IconCheck,
  IconExternal,
  IconUser,
  IconWallet,
  IconPackage,
  CategoryGlyph,
} from './components/CustomIcons';

interface Variant {
  option1?: string;
  option2?: string;
  option3?: string;
  price: string;
  sku?: string;
  available?: boolean;
  compare_at_price?: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  old_price?: number;
  compare_at_price?: number;
  image?: string;
  images?: string[];
  product_type?: string;
  vendor?: string;
  body_html?: string;
  variants?: Variant[];
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: Variant;
}

interface UserAccount {
  name: string;
  username: string;
  email: string;
  tier: string;
  walletBalance: number;
  points: number;
  address: string;
}

const DEMO_ACCOUNT: UserAccount = {
  name: "James Tuwairua",
  username: "jamestuwairua",
  email: "jamestuwairua77@gmail.com",
  tier: "VIP GOLD DROP MEMBER",
  walletBalance: 150.00,
  points: 2450,
  address: "123 Monash Road, Unit 4, Newborough VIC 3825, Australia",
};

const CJ_CATEGORIES_ORDER = [
  "Women's Clothing",
  "Men's Clothing",
  "Bags & Shoes",
  "Jewelry & Watches",
  "Health, Beauty & Hair",
  "Home, Garden & Furniture",
  "Home Improvement",
  "Pet Supplies",
  "Sports & Outdoors",
  "Toys, Kids & Babies",
  "Consumer Electronics",
  "Automobiles & Motorcycles",
  "Phones & Accessories",
  "Computer & Office",
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'embed' | 'account' | 'status'>('catalog');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'discount'>('featured');
  const [showComparison, setShowComparison] = useState(true);

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Storeframe URL
  const [iframeUrl, setIframeUrl] = useState('/store/index.html');
  const [iframeKey, setIframeKey] = useState(0);

  // Pre-seed localStorage with demo account for preview
  useEffect(() => {
    try {
      localStorage.setItem('bd_session', JSON.stringify({
        name: DEMO_ACCOUNT.name,
        username: DEMO_ACCOUNT.username,
        email: DEMO_ACCOUNT.email,
        tier: DEMO_ACCOUNT.tier,
        balance: DEMO_ACCOUNT.walletBalance,
        points: DEMO_ACCOUNT.points,
      }));
      localStorage.setItem('bd_user_name', DEMO_ACCOUNT.name);
      localStorage.setItem('bd_user_email', DEMO_ACCOUNT.email);
    } catch (e) {}
  }, []);

  // Load catalog products
  useEffect(() => {
    fetch('/featured.json?t=' + Date.now())
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load products:', err);
        setLoading(false);
      });
  }, []);

  // Update selected modal details when product changes
  useEffect(() => {
    if (selectedProduct) {
      setSelectedImage(selectedProduct.image || (selectedProduct.images && selectedProduct.images[0]) || '');
      if (selectedProduct.variants && selectedProduct.variants.length > 0) {
        setSelectedVariant(selectedProduct.variants[0]);
      } else {
        setSelectedVariant(null);
      }
      setQuantity(1);
    }
  }, [selectedProduct]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2800);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Wishlist toggle
  const toggleWishlist = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWishlist((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      setToastMessage(exists ? 'Removed from Wishlist' : 'Saved to Wishlist ❤️');
      return next;
    });
  };

  // Add to Cart
  const handleAddToCart = (product: Product, qty: number = 1, variant?: Variant | null) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedVariant?.sku === variant?.sku
      );
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += qty;
        return copy;
      }
      return [...prev, { product, quantity: qty, selectedVariant: variant || undefined }];
    });
    setToastMessage(`Added "${product.title.slice(0, 26)}..." to Bag`);
  };

  // Cart total & item counts
  const totalCartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const p = item.selectedVariant?.price ? parseFloat(item.selectedVariant.price) : item.product.price;
      return acc + p * item.quantity;
    }, 0);
  }, [cart]);

  // Category counts and availability
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    CJ_CATEGORIES_ORDER.forEach((cat) => (counts[cat] = 0));

    products.forEach((p) => {
      if (p.product_type) {
        const top = p.product_type.split(' > ')[0].trim();
        if (counts[top] !== undefined) {
          counts[top]++;
        }
      }
    });
    return counts;
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.product_type && p.product_type.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' ||
        (p.product_type && (
          p.product_type === selectedCategory ||
          p.product_type.startsWith(selectedCategory + ' >') ||
          p.product_type.toLowerCase().includes(selectedCategory.toLowerCase())
        ));

      return matchesSearch && matchesCategory;
    });

    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'discount') {
      list.sort((a, b) => {
        const diffA = (a.old_price || a.price * 1.4) - a.price;
        const diffB = (b.old_price || b.price * 1.4) - b.price;
        return diffB - diffA;
      });
    }

    return list;
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Wished products list
  const wishedProducts = useMemo(() => {
    return products.filter((p) => wishlist.includes(p.id));
  }, [products, wishlist]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#000000] text-[#ffffff] font-sans overflow-hidden select-none">
      {/* 1. TOP ANNOUNCEMENT TICKER (Black with White Borders, Red & Bright Yellow Accents) */}
      <div className="bg-[#09090b] border-b-2 border-white/20 px-3 py-1.5 text-center text-[11px] font-black tracking-wider flex items-center justify-center gap-3 shrink-0 z-30">
        <span className="flex items-center gap-1.5 text-yellow-400 font-mono drop-shadow-[0_0_6px_#ffd600]">
          <IconZap className="w-3.5 h-3.5" />
          <span>⚡ VIP DROP ACTIVE</span>
        </span>
        <span className="text-white/40 hidden sm:inline">|</span>
        <span className="text-white hidden sm:inline">
          ALL 300+ DROPS REBALANCED UNDER <span className="text-yellow-400">$32.95 AUD</span>
        </span>
        <span className="text-white/40">|</span>
        <span className="text-neutral-200">
          FREE WORLDWIDE EXPRESS DELIVERY OVER <span className="text-yellow-400 font-black">A$29</span>
        </span>
        <span className="text-white/40 hidden md:inline">|</span>
        <span className="text-red-400 hidden md:inline font-bold">30-DAY HASSLE-FREE RETURNS</span>
      </div>

      {/* 2. MAIN HEADER (Black, Crisp White Outlines, Red & Yellow Accents) */}
      <header className="h-16 border-b-2 border-white/20 bg-[#0c0c10] px-4 md:px-6 flex items-center justify-between shrink-0 z-20 shadow-lg">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveTab('catalog');
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="text-left focus:outline-none"
          >
            <BargainDropLogo size="md" />
          </button>
        </div>

        {/* View Mode Switcher with Crisp White Outlines */}
        <div className="flex items-center bg-[#000000] p-1 rounded-xl border-2 border-white/30 text-xs shadow-inner">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-black transition-all ${
              activeTab === 'catalog'
                ? 'bg-red-600 text-white border border-white shadow-md shadow-red-950/60'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <IconTag className="w-3.5 h-3.5" />
            <span>Drop Catalog</span>
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-black transition-all ${
              activeTab === 'embed'
                ? 'bg-red-600 text-white border border-white shadow-md shadow-red-950/60'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <IconExternal className="w-3.5 h-3.5" />
            <span>Store Preview</span>
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-black transition-all ${
              activeTab === 'account'
                ? 'bg-yellow-400 text-black border border-white shadow-md shadow-yellow-950/60'
                : 'text-yellow-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <IconUser className="w-3.5 h-3.5" />
            <span>VIP Account</span>
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-black transition-all ${
              activeTab === 'status'
                ? 'bg-red-600 text-white border border-white shadow-md shadow-red-950/60'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <IconShield className="w-3.5 h-3.5" />
            <span>Edge & Sync</span>
          </button>
        </div>

        {/* Header Actions (Account, Wishlist & Cart with White Borders) */}
        <div className="flex items-center gap-2.5">
          {/* Quick Account Profile Pill */}
          <button
            onClick={() => setIsAccountOpen(true)}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#000000] border-2 border-white/30 hover:border-yellow-400 text-white transition-all"
            title="Open Account Center"
          >
            <div className="w-6 h-6 rounded-full bg-red-600 border border-white flex items-center justify-center font-black text-xs text-white">
              JT
            </div>
            <div className="text-left leading-none">
              <span className="block text-[11px] font-black text-white">{DEMO_ACCOUNT.name}</span>
              <span className="block text-[9px] font-bold text-yellow-400">VIP MEMBER</span>
            </div>
          </button>

          {/* Wishlist Button with White Border */}
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#000000] border-2 border-white/30 hover:border-red-500 text-white transition-all shadow-md"
            title="View Wishlist"
          >
            <IconHeart className="w-4 h-4" filled={wishlist.length > 0} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Bag Button with Crisp White Border */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-3.5 h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs border-2 border-white transition-all shadow-lg shadow-red-950/60"
            title="Open Shopping Bag"
          >
            <IconCart className="w-4 h-4" />
            <span className="font-mono text-sm tracking-tight">
              A${cartSubtotal.toFixed(2)}
            </span>
            {totalCartCount > 0 && (
              <span className="bg-yellow-400 text-black font-black text-[11px] px-2 py-0.5 rounded-full border border-black">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-1 bg-[#050508] overflow-hidden flex flex-col relative">
        {/* ========================================================= */}
        {/* TAB 1: DROP CATALOG VIEW                                   */}
        {/* ========================================================= */}
        {activeTab === 'catalog' && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Top Filter and Search Bar with Crisp White Borders */}
            <div className="sticky top-0 z-10 bg-[#0c0c10]/95 backdrop-blur-md border-b-2 border-white/20 px-4 md:px-6 py-3 space-y-3 shadow-md">
              {/* Row 1: Search + Controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search Box with White Border & Red Focus */}
                <div className="relative flex-1 max-w-xl">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <IconSearch className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search 300+ Bargain Drops (shoes, jackets, watches, tech)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#000000] border-2 border-white/30 focus:border-yellow-400 rounded-xl pl-11 pr-4 py-2 text-xs font-bold text-white placeholder-neutral-400 outline-none transition-colors shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-white"
                    >
                      <IconClose className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Right side: Sort + Price Comparison Switch */}
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-2 bg-[#000000] px-3 py-1.5 rounded-xl border-2 border-white/30 text-xs">
                    <IconFilter className="w-4 h-4 text-yellow-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent text-white font-black outline-none cursor-pointer text-xs"
                    >
                      <option value="featured" className="bg-[#121216] text-white">
                        Featured Drops
                      </option>
                      <option value="price-asc" className="bg-[#121216] text-white">
                        Price: Low to High
                      </option>
                      <option value="price-desc" className="bg-[#121216] text-white">
                        Price: High to Low
                      </option>
                      <option value="discount" className="bg-[#121216] text-white">
                        Biggest Drop %
                      </option>
                    </select>
                  </div>

                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-black transition-all ${
                      showComparison
                        ? 'bg-neutral-900 border-white text-yellow-400 shadow-md'
                        : 'bg-[#000000] border-white/30 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <IconDropArrow className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">
                      {showComparison ? 'Showing Was vs Now' : 'Show Was Prices'}
                    </span>
                    <span className="md:hidden">Was/Now</span>
                  </button>
                </div>
              </div>

              {/* Row 2: 14 CJ Categories Horizontal Scroll Matrix with White Outlines */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
                {/* ALL Button */}
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border-2 ${
                    selectedCategory === 'All'
                      ? 'bg-red-600 text-white border-white shadow-md shadow-red-950/60'
                      : 'bg-[#000000] text-white border-white/30 hover:border-yellow-400 hover:text-yellow-400'
                  }`}
                >
                  <IconTag className="w-3.5 h-3.5" />
                  <span>All Drops</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    selectedCategory === 'All' ? 'bg-yellow-400 text-black border border-black' : 'bg-neutral-800 text-neutral-300'
                  }`}>
                    {products.length}
                  </span>
                </button>

                {/* 14 CJ Categories */}
                {CJ_CATEGORIES_ORDER.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const count = categoryCounts[cat] || 0;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border-2 ${
                        isSelected
                          ? 'bg-red-600 text-white border-white shadow-md shadow-red-950/60'
                          : 'bg-[#000000] text-white border-white/30 hover:border-yellow-400 hover:text-yellow-400'
                      }`}
                    >
                      <CategoryGlyph category={cat} className="w-4 h-4" />
                      <span>{cat}</span>
                      {count > 0 && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                            isSelected ? 'bg-yellow-400 text-black border border-black' : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Grid Area with Crisp White Outlines */}
            <div className="p-4 md:p-6 max-w-7xl mx-auto w-full flex-1">
              {/* Header stats bar */}
              <div className="flex items-center justify-between mb-4 text-xs font-mono">
                <div className="flex items-center gap-2 text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block shadow-[0_0_8px_#ffd600] animate-pulse"></span>
                  <span className="font-black text-sm">{filteredProducts.length} PRODUCTS</span>
                  <span className="text-white/40">·</span>
                  <span className="text-yellow-400 font-extrabold">{selectedCategory.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-300 hidden sm:inline font-bold">MAX PRICE: A$32.95 AUD</span>
                  <span className="px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 font-bold">
                    ⚡ 100% FAIR PRICED
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-28 text-white space-y-3">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-yellow-400 border-r-red-600 rounded-full animate-spin"></div>
                  <p className="text-sm font-mono font-bold tracking-wider text-yellow-400">
                    LOADING BARGAIN DROP CATALOG...
                  </p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-24 bg-[#0c0c10] rounded-3xl border-2 border-white/30 p-8 shadow-xl">
                  <div className="w-14 h-14 rounded-2xl bg-black border-2 border-yellow-400 flex items-center justify-center mx-auto mb-3 text-yellow-400 shadow-[0_0_15px_rgba(255,214,0,0.3)]">
                    <IconSearch className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black text-white">No Matching Bargain Drops Found</h3>
                  <p className="text-xs text-neutral-300 mt-1 max-w-md mx-auto">
                    No items match "{searchQuery}" under {selectedCategory}. Try resetting filters or browsing all categories.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white border-2 border-white text-xs font-black transition"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                /* 4-5 Column Product Grid with High-Contrast White Borders */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredProducts.map((prod) => {
                    const isWished = wishlist.includes(prod.id);
                    const oldPrice = prod.old_price || prod.compare_at_price || prod.price * 1.45;
                    const percentSaved = Math.round(((oldPrice - prod.price) / oldPrice) * 100);
                    const dollarSaved = Math.max(0, oldPrice - prod.price);

                    return (
                      <div
                        key={prod.id}
                        onClick={() => setSelectedProduct(prod)}
                        className="group bg-[#0e0e12] border-2 border-white/20 hover:border-yellow-400 rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-yellow-950/30 relative"
                      >
                        {/* Image Thumbnail */}
                        <div className="aspect-square bg-[#000000] relative overflow-hidden flex items-center justify-center border-b border-white/10">
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="text-neutral-700">
                              <IconTag className="w-12 h-12" />
                            </div>
                          )}

                          {/* Top Left Badges: Yellow & Red Standouts */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                            {percentSaved > 0 && (
                              <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-md shadow-md border border-white flex items-center gap-0.5 tracking-wider font-mono">
                                <IconDropArrow className="w-2.5 h-2.5 text-black" />
                                -{percentSaved}%
                              </span>
                            )}
                            <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow border border-white/40 tracking-wider font-mono">
                              DROP
                            </span>
                          </div>

                          {/* Wishlist Button with White Outline */}
                          <button
                            onClick={(e) => toggleWishlist(prod.id, e)}
                            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10 border border-white ${
                              isWished
                                ? 'bg-red-600 text-white shadow-[0_0_10px_#ff1a3c]'
                                : 'bg-black/70 text-white hover:bg-red-600'
                            }`}
                            title={isWished ? 'Remove Wishlist' : 'Add to Wishlist'}
                          >
                            <IconHeart className="w-4 h-4" filled={isWished} />
                          </button>

                          {/* Quick View Hover Actions */}
                          <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct(prod);
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-black/90 hover:bg-black text-white text-[11px] font-black border-2 border-white flex items-center justify-center gap-1.5 backdrop-blur-sm shadow"
                            >
                              <IconEye className="w-3.5 h-3.5 text-yellow-400" />
                              <span>Quick View</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(prod, 1);
                              }}
                              className="p-2 rounded-lg bg-red-600 hover:bg-red-500 text-white border-2 border-white shadow"
                              title="Add to Cart"
                            >
                              <IconCart className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Content with High-Visibility Text */}
                        <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                          <div>
                            {/* Stars rating in Glowing Electric Yellow */}
                            <div className="flex items-center gap-1 text-[11px] mb-1.5">
                              <div className="flex text-yellow-400">
                                <IconStar className="w-3 h-3" filled />
                                <IconStar className="w-3 h-3" filled />
                                <IconStar className="w-3 h-3" filled />
                                <IconStar className="w-3 h-3" filled />
                                <IconStar className="w-3 h-3" filled />
                              </div>
                              <span className="text-yellow-400 font-black text-[10px] ml-1">5.0</span>
                              <span className="text-neutral-400 text-[9px]">(Verified)</span>
                            </div>

                            {/* Title in Pure Crisp White */}
                            <h3 className="text-xs font-black text-white line-clamp-2 leading-snug group-hover:text-yellow-300 transition-colors">
                              {prod.title}
                            </h3>
                          </div>

                          {/* Price Module in Bold Red, Crisp White & Yellow Savings */}
                          <div className="pt-2 border-t border-white/10 flex flex-col gap-1">
                            <div className="flex items-baseline justify-between">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-black text-red-500 font-mono tracking-tight">
                                  A${prod.price.toFixed(2)}
                                </span>
                                {showComparison && oldPrice > prod.price && (
                                  <span className="text-[11px] line-through text-neutral-400 font-mono">
                                    ${oldPrice.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-black text-white font-mono bg-neutral-900 px-1.5 py-0.5 rounded border border-white/20">
                                AUD
                              </span>
                            </div>

                            {/* Yellow Savings Callout */}
                            {dollarSaved > 0 && (
                              <div className="text-[10px] font-bold text-yellow-400 flex items-center gap-1">
                                <IconZap className="w-2.5 h-2.5" />
                                <span>Save A${dollarSaved.toFixed(2)} AUD</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Trust Bar in Black, Red, White & Yellow */}
            <div className="bg-[#0c0c10] border-t-2 border-white/20 py-8 px-4 mt-auto">
              <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                <div className="flex flex-col items-center gap-1.5 bg-black p-4 rounded-2xl border border-white/20">
                  <IconTruck className="w-6 h-6 text-yellow-400" />
                  <span className="text-xs font-black text-white">Free Worldwide Express</span>
                  <span className="text-[11px] text-neutral-300">On all drop orders over <strong className="text-yellow-400">A$29</strong></span>
                </div>
                <div className="flex flex-col items-center gap-1.5 bg-black p-4 rounded-2xl border border-white/20">
                  <IconShield className="w-6 h-6 text-yellow-400" />
                  <span className="text-xs font-black text-white">256-Bit SSL Encrypted</span>
                  <span className="text-[11px] text-neutral-300">Direct Shopify & Stripe checkout</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 bg-black p-4 rounded-2xl border border-white/20">
                  <IconReturns className="w-6 h-6 text-yellow-400" />
                  <span className="text-xs font-black text-white">30-Day Guarantee</span>
                  <span className="text-[11px] text-neutral-300">Hassle-free replacement or refund</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 bg-black p-4 rounded-2xl border border-white/20">
                  <IconTag className="w-6 h-6 text-yellow-400" />
                  <span className="text-xs font-black text-white">Fair Bargain Pricing</span>
                  <span className="text-[11px] text-neutral-300">No markups · Capped under <strong className="text-yellow-400">A$33</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: STORE PREVIEW (With White Borders & Quick Account) */}
        {/* ========================================================= */}
        {activeTab === 'embed' && (          <div className="flex-1 flex flex-col p-3 md:p-4 bg-[#000000] items-center overflow-hidden">            {/* Control Strip */}            <div className="w-full max-w-6xl mb-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">              <div className="flex items-center gap-2">                <span className="text-yellow-400 font-mono font-black text-[11px]">PREVIEW PAGE:</span>
                <button
                  onClick={() => {
                    setIframeUrl('/store/index.html');
                    setIframeKey((k) => k + 1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition border-2 ${
                    iframeUrl === '/store/index.html'
                      ? 'bg-red-600 text-white border-white'
                      : 'bg-[#121216] text-white border-white/30 hover:border-yellow-400'
                  }`}
                >
                  Storefront
                </button>
                <button
                  onClick={() => {
                    setIframeUrl('/store/categories.html');
                    setIframeKey((k) => k + 1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition border-2 ${
                    iframeUrl === '/store/categories.html'
                      ? 'bg-red-600 text-white border-white'
                      : 'bg-[#121216] text-white border-white/30 hover:border-yellow-400'
                  }`}
                >
                  14 Categories
                </button>
                <button
                  onClick={() => {
                    setIframeUrl('/store/profile.html');
                    setIframeKey((k) => k + 1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition border-2 ${
                    iframeUrl.includes('profile')
                      ? 'bg-yellow-400 text-black border-white shadow'
                      : 'bg-[#121216] text-yellow-400 border-white/30 hover:border-yellow-400'
                  }`}
                >
                  👤 Account Profile (No Gate)
                </button>
                <button
                  onClick={() => {
                    setIframeUrl('/store/orders.html');
                    setIframeKey((k) => k + 1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition border-2 ${
                    iframeUrl.includes('orders')
                      ? 'bg-yellow-400 text-black border-white shadow'
                      : 'bg-[#121216] text-yellow-400 border-white/30 hover:border-yellow-400'
                  }`}
                >
                  📦 Orders
                </button>
                <button
                  onClick={() => {
                    setIframeUrl('/store/wallet.html');
                    setIframeKey((k) => k + 1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition border-2 ${
                    iframeUrl.includes('wallet')
                      ? 'bg-yellow-400 text-black border-white shadow'
                      : 'bg-[#121216] text-yellow-400 border-white/30 hover:border-yellow-400'
                  }`}
                >
                  💳 Wallet ($150)
                </button>
              </div>

              {/* Viewport device buttons */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#000000] p-1 rounded-lg border-2 border-white/30 text-xs">
                  <button
                    onClick={() => setViewport('desktop')}
                    className={`px-2.5 py-1 rounded font-black ${
                      viewport === 'desktop' ? 'bg-red-600 text-white border border-white' : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setViewport('tablet')}
                    className={`px-2.5 py-1 rounded font-black ${
                      viewport === 'tablet' ? 'bg-red-600 text-white border border-white' : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    Tablet
                  </button>
                  <button
                    onClick={() => setViewport('mobile')}
                    className={`px-2.5 py-1 rounded font-black ${
                      viewport === 'mobile' ? 'bg-red-600 text-white border border-white' : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    Mobile
                  </button>
                </div>

                <a
                  href={iframeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#121216] border-2 border-white/30 text-white hover:border-yellow-400 flex items-center gap-1.5 font-black"
                >
                  <span>Open Tab</span>
                  <IconExternal className="w-3.5 h-3.5 text-yellow-400" />
                </a>
              </div>
            </div>

            {/* Iframe container with high-contrast white outline */}
            <div
              className={`transition-all duration-300 bg-white flex-1 w-full flex flex-col ${
                viewport === 'mobile'
                  ? 'max-w-[390px] h-[720px] my-auto rounded-[36px] border-4 border-white shadow-2xl overflow-hidden'
                  : viewport === 'tablet'
                  ? 'max-w-[768px] h-[780px] my-auto rounded-2xl border-4 border-white shadow-2xl overflow-hidden'
                  : 'w-full h-full rounded-2xl border-2 border-white/40 shadow-2xl overflow-hidden'
              }`}
            >
              <iframe
                key={iframeKey}
                src={iframeUrl}
                title="Bargain Drop Store"
                className="w-full h-full border-none flex-1"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ACCOUNT & VIP MEMBER HUB (NO GATE IN PREVIEW)       */}
        {/* ========================================================= */}
        {activeTab === 'account' && (
          <div className="w-full h-full max-w-5xl mx-auto p-4 md:p-6 overflow-y-auto space-y-6">
            {/* VIP Member Hero Banner */}
            <div className="bg-[#0e0e14] border-2 border-white rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-black border-2 border-yellow-400 flex items-center justify-center font-black text-2xl text-yellow-400 shadow-[0_0_15px_rgba(255,214,0,0.4)]">
                    JT
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-black text-white">{DEMO_ACCOUNT.name}</h1>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-yellow-400 text-black border border-white">
                        {DEMO_ACCOUNT.tier}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 font-mono mt-1">
                      {DEMO_ACCOUNT.email} · Member ID: <span className="text-white font-bold">#BD-VIP-2024-AU</span>
                    </p>
                    <p className="text-xs text-yellow-400 font-bold mt-1">
                      ✓ Sign-in gate bypassed for preview. Full account access unlocked.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIframeUrl('/store/orders.html');
                      setActiveTab('embed');
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs border-2 border-white transition flex items-center gap-2"
                  >
                    <IconPackage className="w-4 h-4" />
                    <span>View Orders (2)</span>
                  </button>
                  <button
                    onClick={() => {
                      setIframeUrl('/store/wallet.html');
                      setActiveTab('embed');
                    }}
                    className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs border-2 border-white transition flex items-center gap-2"
                  >
                    <IconWallet className="w-4 h-4" />
                    <span>Drop Wallet (A$150)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Metric Cards with White Borders & Yellow Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Wallet Balance Card */}
              <div className="bg-[#0c0c10] border-2 border-white/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase text-yellow-400 flex items-center gap-1.5">
                    <IconWallet className="w-4 h-4" /> Drop Store Credit
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
                    AVAILABLE
                  </span>
                </div>
                <div>
                  <span className="text-3xl font-black text-white font-mono">A$150.00</span>
                  <p className="text-[11px] text-neutral-300 mt-1">
                    Redeemable on all 14 categories with zero minimum order.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-xs font-bold text-neutral-300">
                  <span>Reward Points:</span>
                  <span className="text-yellow-400 font-mono">2,450 PTS (Level 3)</span>
                </div>
              </div>

              {/* Saved Address Card */}
              <div className="bg-[#0c0c10] border-2 border-white/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase text-yellow-400 flex items-center gap-1.5">
                    <IconTruck className="w-4 h-4" /> Default Delivery
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600/20 text-red-400 border border-red-600/40">
                    VERIFIED
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{DEMO_ACCOUNT.name}</h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    123 Monash Road, Unit 4<br />
                    Newborough, VIC 3825<br />
                    Australia
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 text-xs font-bold text-yellow-400">
                  ⚡ Free Express Delivery Eligible
                </div>
              </div>

              {/* VIP Perks */}
              <div className="bg-[#0c0c10] border-2 border-white/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase text-yellow-400 flex items-center gap-1.5">
                    <IconStar className="w-4 h-4" filled /> Active VIP Privileges
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-yellow-400 text-black">
                    TIER 1
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-neutral-200">
                  <div className="flex items-center gap-2">
                    <IconCheck className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Free Global Priority Express over A$29</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconCheck className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Early Drop Notification on Restocks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconCheck className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Exclusive VIP Price Guarantees</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 text-xs font-mono text-neutral-400">
                  Promo Code: <span className="text-white font-bold bg-neutral-900 px-2 py-0.5 rounded border border-white/20">VIPDROP26</span>
                </div>
              </div>
            </div>

            {/* Recent Orders Showcase */}
            <div className="bg-[#0c0c10] border-2 border-white/30 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <IconPackage className="w-5 h-5 text-yellow-400" />
                  <span>Recent Account Orders</span>
                </h3>
                <span className="text-xs font-mono text-neutral-300">2 Orders Synchronized</span>
              </div>

              <div className="space-y-3">
                <div className="bg-black border border-white/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white font-mono">#BD-892401</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-yellow-400 text-black">
                        SHIPPED IN TRANSIT
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-1">
                      Men's Luxury Chronograph Watch + Tactical Strap · Tracking: <span className="text-yellow-400 font-mono">AP948201938AU</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-red-500 font-mono">A$48.95 AUD</span>
                    <span className="block text-[10px] text-neutral-400">Australia Post Express</span>
                  </div>
                </div>

                <div className="bg-black border border-white/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white font-mono">#BD-884120</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-neutral-800 text-neutral-300 border border-white/20">
                        DELIVERED
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-1">
                      Summer Blouse & Pant Set · Delivered to Newborough VIC
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-red-500 font-mono">A$32.50 AUD</span>
                    <span className="block text-[10px] text-neutral-400">Completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: EDGE & SYNC STATUS (With White Borders & Yellow)   */}
        {/* ========================================================= */}
        {activeTab === 'status' && (
          <div className="w-full h-full max-w-5xl mx-auto p-4 md:p-6 overflow-y-auto space-y-6">
            <div className="bg-[#0c0c10] border-2 border-white rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div>
                  <BargainDropLogo size="lg" />
                  <p className="text-xs text-neutral-300 mt-2 font-mono">
                    Store Owner: <span className="text-white font-bold">{DEMO_ACCOUNT.name}</span> · Support:{' '}
                    <span className="text-yellow-400 font-bold">Support@bargain-drop.online</span> · Victoria AU
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://admin.shopify.com/store/bargain-drop-8194"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black border-2 border-white transition flex items-center gap-1.5 shadow"
                  >
                    <span>Shopify Admin</span>
                    <IconExternal className="w-3.5 h-3.5 text-white" />
                  </a>
                  <a
                    href="https://dash.cloudflare.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#000000] border-2 border-white hover:border-yellow-400 text-white text-xs font-black transition flex items-center gap-1.5"
                  >
                    <span>Cloudflare Edge</span>
                    <IconExternal className="w-3.5 h-3.5 text-yellow-400" />
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0c0c10] border-2 border-white/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                    <IconShield className="w-4 h-4" /> Cloudflare Edge
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-yellow-400 text-black border border-white">
                    PROXIED & ACTIVE
                  </span>
                </div>
                <h3 className="text-base font-black text-white">bargain-drop.online</h3>
                <div className="mt-3 space-y-2 text-xs text-neutral-300 font-mono">
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-neutral-400">Zone ID:</span>
                    <span>557180fc...</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-neutral-400">Hosting:</span>
                    <span className="text-yellow-400">bargain-drop.pages.dev</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-400">SSL Security:</span>
                    <span className="text-white font-bold">Strict 256-Bit SSL</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0c0c10] border-2 border-white/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                    <IconTag className="w-4 h-4" /> CJ Dropshipping
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white border border-white">
                    14 CATEGORIES
                  </span>
                </div>
                <h3 className="text-base font-black text-white">25,427 Catalog</h3>
                <div className="mt-3 space-y-2 text-xs text-neutral-300 font-mono">
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-neutral-400">Mapped:</span>
                    <span className="text-white font-bold">100% Complete</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-neutral-400">Active Drops:</span>
                    <span className="text-yellow-400 font-bold">300 Curated</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-400">Max Price:</span>
                    <span className="text-white font-bold">A$32.95 AUD</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0c0c10] border-2 border-white/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                    <IconCheck className="w-4 h-4" /> Preview Gate
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-yellow-400 text-black border border-white">
                    DISABLED
                  </span>
                </div>
                <h3 className="text-base font-black text-white">Account Unlocked</h3>
                <div className="mt-3 space-y-2 text-xs text-neutral-300 font-mono">
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-neutral-400">Session:</span>
                    <span className="text-white">James Tuwairua</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-neutral-400">Store Credit:</span>
                    <span className="text-yellow-400 font-bold">A$150.00 AUD</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-400">Auth Guard:</span>
                    <span className="text-white font-bold">Pass-through Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* PRODUCT QUICK-VIEW MODAL (Black, Red, White, Yellow)      */}
      {/* ========================================================= */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-[#0e0e14] border-2 border-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button with White Border */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black text-white hover:text-yellow-400 border-2 border-white flex items-center justify-center shadow"
            >
              <IconClose className="w-4 h-4" />
            </button>

            {/* Left: Image Gallery */}
            <div className="w-full md:w-1/2 bg-[#000000] p-4 flex flex-col items-center justify-center relative border-r-2 border-white/20">
              <div className="aspect-square w-full rounded-2xl overflow-hidden relative border-2 border-white/30">
                <img
                  src={selectedImage || selectedProduct.image}
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnails */}
              {selectedProduct.images && selectedProduct.images.length > 1 && (
                <div className="flex items-center gap-2 mt-3 overflow-x-auto w-full pb-1">
                  {selectedProduct.images.slice(0, 5).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition ${
                        selectedImage === img ? 'border-yellow-400 shadow-md' : 'border-white/30 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Details & Purchase */}
            <div className="w-full md:w-1/2 p-5 flex flex-col justify-between overflow-y-auto">
              <div>
                {/* Category Breadcrumb */}
                <div className="flex items-center gap-1.5 text-[11px] text-yellow-400 font-mono font-bold mb-1.5">
                  <CategoryGlyph category={selectedProduct.product_type || ''} className="w-4 h-4" />
                  <span>{selectedProduct.product_type || 'DROP PRODUCT'}</span>
                </div>

                {/* Title */}
                <h2 className="text-base font-black text-white leading-tight mb-2">
                  {selectedProduct.title}
                </h2>

                {/* Rating in Yellow */}
                <div className="flex items-center gap-1 text-[11px] mb-3">
                  <div className="flex text-yellow-400">
                    <IconStar className="w-3.5 h-3.5" filled />
                    <IconStar className="w-3.5 h-3.5" filled />
                    <IconStar className="w-3.5 h-3.5" filled />
                    <IconStar className="w-3.5 h-3.5" filled />
                    <IconStar className="w-3.5 h-3.5" filled />
                  </div>
                  <span className="text-yellow-400 font-black text-[11px] ml-1">5.0</span>
                  <span className="text-neutral-300 font-mono text-[10px]">(Verified Buyer Drop)</span>
                </div>

                {/* Pricing Block with White Border & Yellow Highlights */}
                <div className="bg-[#000000] p-3.5 rounded-2xl border-2 border-white/30 mb-4 shadow-inner">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-red-500 font-mono">
                        A${(selectedVariant ? parseFloat(selectedVariant.price) : selectedProduct.price).toFixed(2)}
                      </span>
                      {selectedProduct.old_price && (
                        <span className="text-xs text-neutral-400 line-through ml-2 font-mono">
                          A${selectedProduct.old_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded border border-white font-mono">
                      FAIR DROP
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-200 mt-1 flex items-center gap-1.5 font-bold">
                    <IconCheck className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Free delivery applied on orders over A$29</span>
                  </p>
                </div>

                {/* Variants */}
                {selectedProduct.variants && selectedProduct.variants.length > 1 && (
                  <div className="mb-4">
                    <label className="text-[11px] font-black text-white uppercase tracking-wider block mb-1.5">
                      Select Variant / Size:
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {selectedProduct.variants.slice(0, 8).map((v, i) => {
                        const label = [v.option1, v.option2].filter(Boolean).join(' / ') || `Option ${i + 1}`;
                        const isChosen = selectedVariant?.sku === v.sku;
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedVariant(v)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border-2 ${
                              isChosen
                                ? 'bg-red-600 text-white border-white shadow'
                                : 'bg-[#000000] text-neutral-200 border-white/20 hover:border-yellow-400'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity Stepper */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-black text-white">Quantity:</span>
                  <div className="flex items-center bg-[#000000] border-2 border-white/30 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1.5 text-white hover:bg-neutral-800 font-bold transition"
                    >
                      -
                    </button>
                    <span className="px-3.5 py-1 text-xs font-black font-mono text-yellow-400">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-1.5 text-white hover:bg-neutral-800 font-bold transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons with White Borders */}
              <div className="space-y-2 pt-2 border-t border-white/20">
                <button
                  onClick={() => {
                    handleAddToCart(selectedProduct, quantity, selectedVariant);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider border-2 border-white transition shadow-xl shadow-red-950/60 flex items-center justify-center gap-2"
                >
                  <IconCart className="w-4 h-4" />
                  <span>Add To Drop Bag · A${((selectedVariant ? parseFloat(selectedVariant.price) : selectedProduct.price) * quantity).toFixed(2)} AUD</span>
                </button>
                <button
                  onClick={() => toggleWishlist(selectedProduct.id)}
                  className="w-full py-2 rounded-xl bg-[#000000] hover:bg-neutral-900 border-2 border-white/30 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <IconHeart className="w-3.5 h-3.5" filled={wishlist.includes(selectedProduct.id)} />
                  <span>{wishlist.includes(selectedProduct.id) ? 'Remove From Wishlist' : 'Save To Wishlist'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SHOPPING BAG DRAWER (Black, Red, White, Yellow)           */}
      {/* ========================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-end">
          <div
            className="w-full max-w-md bg-[#0c0c10] border-l-2 border-white h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b-2 border-white/20 flex items-center justify-between bg-[#000000]">
              <div className="flex items-center gap-2">
                <IconCart className="w-5 h-5 text-yellow-400" />
                <h2 className="text-sm font-black text-white font-mono tracking-wider">
                  YOUR DROP BAG ({totalCartCount})
                </h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-900 border border-white text-white hover:text-yellow-400 flex items-center justify-center"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            {/* Free Shipping Progress in Yellow */}
            <div className="bg-[#101016] px-4 py-3 border-b-2 border-white/20">
              <div className="flex items-center justify-between text-[11px] mb-1.5 font-mono">
                <span className="text-neutral-300 font-bold">Free Express Delivery:</span>
                <span className="text-yellow-400 font-black">
                  {cartSubtotal >= 29
                    ? '🎉 FREE SHIPPING UNLOCKED!'
                    : `Add A$${(29 - cartSubtotal).toFixed(2)} AUD more`}
                </span>
              </div>
              <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-white/30">
                <div
                  className="h-full bg-yellow-400 transition-all duration-300 shadow-[0_0_8px_#ffd600]"
                  style={{ width: `${Math.min(100, (cartSubtotal / 29) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-white space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-black border-2 border-yellow-400 flex items-center justify-center mx-auto text-yellow-400">
                    <IconCart className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-black text-white">Your Drop Bag is Empty</h3>
                  <p className="text-xs text-neutral-300 max-w-xs mx-auto">
                    Explore 300+ newly rebalanced drops across 14 CJ categories.
                  </p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setActiveTab('catalog');
                    }}
                    className="mt-3 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white border-2 border-white text-xs font-black transition"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.map((item, idx) => {
                  const itemPrice = item.selectedVariant?.price
                    ? parseFloat(item.selectedVariant.price)
                    : item.product.price;
                  return (
                    <div
                      key={idx}
                      className="bg-[#000000] border-2 border-white/20 rounded-2xl p-3 flex gap-3 relative group shadow"
                    >
                      <div className="w-16 h-16 rounded-xl bg-neutral-900 overflow-hidden flex-shrink-0 border-2 border-white/20">
                        <img
                          src={item.product.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-black text-white line-clamp-1">
                              {item.product.title}
                            </h4>
                            <button
                              onClick={() => {
                                setCart((c) => c.filter((_, i) => i !== idx));
                              }}
                              className="text-neutral-400 hover:text-red-500"
                              title="Remove item"
                            >
                              <IconClose className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {item.selectedVariant && (
                            <p className="text-[10px] text-neutral-300 font-bold">
                              {[item.selectedVariant.option1, item.selectedVariant.option2].filter(Boolean).join(' / ')}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-black text-red-500 font-mono">
                            A${(itemPrice * item.quantity).toFixed(2)}
                          </span>
                          <div className="flex items-center bg-[#0c0c10] border border-white/30 rounded-lg">
                            <button
                              onClick={() => {
                                if (item.quantity > 1) {
                                  setCart((c) => {
                                    const copy = [...c];
                                    copy[idx].quantity -= 1;
                                    return copy;
                                  });
                                } else {
                                  setCart((c) => c.filter((_, i) => i !== idx));
                                }
                              }}
                              className="px-2 py-0.5 text-xs text-white hover:bg-neutral-800"
                            >
                              -
                            </button>
                            <span className="px-2 text-[11px] font-mono font-black text-yellow-400">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => {
                                setCart((c) => {
                                  const copy = [...c];
                                  copy[idx].quantity += 1;
                                  return copy;
                                });
                              }}
                              className="px-2 py-0.5 text-xs text-white hover:bg-neutral-800"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Checkout */}
            {cart.length > 0 && (
              <div className="p-4 bg-[#000000] border-t-2 border-white/20 space-y-3">
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-neutral-300 font-bold">
                    <span>Subtotal:</span>
                    <span className="text-white font-black">A${cartSubtotal.toFixed(2)} AUD</span>
                  </div>
                  <div className="flex justify-between text-neutral-300 font-bold">
                    <span>Express Delivery:</span>
                    <span className="text-yellow-400 font-black">
                      {cartSubtotal >= 29 ? 'FREE' : 'A$4.95 AUD'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black pt-2 border-t border-white/20 text-white">
                    <span>Total Drop:</span>
                    <span className="text-red-500 font-mono">
                      A${(cartSubtotal + (cartSubtotal >= 29 ? 0 : 4.95)).toFixed(2)} AUD
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    alert('Redirecting to SSL Encrypted Checkout via Shopify...');
                  }}
                  className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider border-2 border-white transition shadow-xl shadow-red-950/60 flex items-center justify-center gap-2"
                >
                  <IconShield className="w-4 h-4" />
                  <span>Proceed To Secure Checkout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* WISHLIST DRAWER (Black, Red, White, Yellow)               */}
      {/* ========================================================= */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-end">
          <div
            className="w-full max-w-md bg-[#0c0c10] border-l-2 border-white h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b-2 border-white/20 flex items-center justify-between bg-[#000000]">
              <div className="flex items-center gap-2">
                <IconHeart className="w-5 h-5 text-red-500" filled />
                <h2 className="text-sm font-black text-white font-mono tracking-wider">
                  FAVORITES & SAVED ({wishedProducts.length})
                </h2>
              </div>
              <button
                onClick={() => setIsWishlistOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-900 border border-white text-white hover:text-yellow-400 flex items-center justify-center"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {wishedProducts.length === 0 ? (
                <div className="text-center py-20 text-white space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-black border-2 border-yellow-400 flex items-center justify-center mx-auto text-yellow-400">
                    <IconHeart className="w-7 h-7" filled />
                  </div>
                  <h3 className="text-base font-black text-white">No Saved Drops Yet</h3>
                  <p className="text-xs text-neutral-300 max-w-xs mx-auto">
                    Click the red heart on any product card to save it for later.
                  </p>
                </div>
              ) : (
                wishedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-[#000000] border-2 border-white/20 rounded-2xl p-3 flex gap-3 items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-neutral-900 overflow-hidden flex-shrink-0 border border-white/30">
                        <img src={p.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white line-clamp-1 max-w-[160px]">
                          {p.title}
                        </h4>
                        <span className="text-xs font-black text-red-500 font-mono">
                          A${p.price.toFixed(2)} AUD
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          handleAddToCart(p, 1);
                          toggleWishlist(p.id);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-black border border-white"
                      >
                        Move to Bag
                      </button>
                      <button
                        onClick={() => toggleWishlist(p.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-500"
                        title="Remove"
                      >
                        <IconClose className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK ACCOUNT MODAL DRAWER */}
      {isAccountOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-end"
          onClick={() => setIsAccountOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0c0c10] border-l-2 border-white h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b-2 border-white/20 flex items-center justify-between bg-[#000000]">
              <div className="flex items-center gap-2">
                <IconUser className="w-5 h-5 text-yellow-400" />
                <h2 className="text-sm font-black text-white font-mono tracking-wider">
                  PREVIEW VIP ACCOUNT
                </h2>
              </div>
              <button
                onClick={() => setIsAccountOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-900 border border-white text-white hover:text-yellow-400 flex items-center justify-center"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-black border-2 border-white rounded-2xl p-4 text-center">
                <div className="w-16 h-16 rounded-full bg-red-600 border-2 border-yellow-400 flex items-center justify-center text-white font-black text-xl mx-auto mb-2 shadow-[0_0_15px_rgba(255,214,0,0.4)]">
                  JT
                </div>
                <h3 className="text-base font-black text-white">{DEMO_ACCOUNT.name}</h3>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-yellow-400 text-black border border-white">
                  {DEMO_ACCOUNT.tier}
                </span>
                <p className="text-xs text-neutral-300 font-mono mt-1">{DEMO_ACCOUNT.email}</p>
              </div>

              {/* Wallet & Balance */}
              <div className="bg-black border-2 border-white/30 rounded-2xl p-4">
                <span className="text-xs font-black text-yellow-400 uppercase">Available Store Credit</span>
                <div className="text-2xl font-black text-white font-mono mt-0.5">A$150.00 AUD</div>
                <span className="text-xs text-neutral-300 font-mono">Reward Points: 2,450</span>
              </div>

              {/* Fast links to store pages */}
              <div className="space-y-2">
                <span className="text-xs font-black text-white uppercase tracking-wider block">
                  Quick Navigate In Store Preview:
                </span>
                <button
                  onClick={() => {
                    setIsAccountOpen(false);
                    setIframeUrl('/store/profile.html');
                    setActiveTab('embed');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/30 text-white font-black text-xs text-left flex items-center justify-between"
                >
                  <span>Open Full Profile Page</span>
                  <IconExternal className="w-3.5 h-3.5 text-yellow-400" />
                </button>
                <button
                  onClick={() => {
                    setIsAccountOpen(false);
                    setIframeUrl('/store/orders.html');
                    setActiveTab('embed');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/30 text-white font-black text-xs text-left flex items-center justify-between"
                >
                  <span>Open Orders History</span>
                  <IconExternal className="w-3.5 h-3.5 text-yellow-400" />
                </button>
                <button
                  onClick={() => {
                    setIsAccountOpen(false);
                    setIframeUrl('/store/wallet.html');
                    setActiveTab('embed');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/30 text-white font-black text-xs text-left flex items-center justify-between"
                >
                  <span>Open Drop Wallet Page</span>
                  <IconExternal className="w-3.5 h-3.5 text-yellow-400" />
                </button>
                <button
                  onClick={() => {
                    setIsAccountOpen(false);
                    setIframeUrl('/store/addresses.html');
                    setActiveTab('embed');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/30 text-white font-black text-xs text-left flex items-center justify-between"
                >
                  <span>Open Saved Addresses</span>
                  <IconExternal className="w-3.5 h-3.5 text-yellow-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#000000] border-2 border-white text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-black animate-in fade-in slide-in-from-bottom-2">
          <IconCheck className="w-4 h-4 text-yellow-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
