import React, { FormEvent, useEffect, useState } from "react";
import {
  Link,
  NavLink,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  CircleDollarSign,
  ExternalLink,
  FolderTree,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Minus,
  Package,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Truck,
  Trash2,
} from "lucide-react";
import "./store.css";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  compare_at_price: number | null;
  inventory: number;
  status: string;
  category: string;
  featured: boolean;
  created_at: string;
  sold_count: number;
  images: { id: string; url: string; alt_text: string; position: number }[];
};
type CartLine = { product: Product; quantity: number };
type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  status: "active" | "archived";
  sort_order: number;
  product_count: number;
};
type SettingsData = {
  store_name: string;
  announcement: string;
  offline_payment_instructions: string;
  whatsapp: string;
  contact_email: string;
};
const money = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n / 100);
async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options?.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

const CartContext = React.createContext<{
  lines: CartLine[];
  add: (p: Product) => void;
  setQty: (id: string, n: number) => void;
  clear: () => void;
}>({ lines: [], add: () => {}, setQty: () => {}, clear: () => {} });
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("dejoy-cart") || "[]");
    } catch {
      return [];
    }
  });
  useEffect(
    () => localStorage.setItem("dejoy-cart", JSON.stringify(lines)),
    [lines],
  );
  const add = (p: Product) =>
    setLines((v) => {
      const x = v.find((l) => l.product.id === p.id);
      return x
        ? v.map((l) =>
            l.product.id === p.id
              ? { ...l, quantity: Math.min(l.quantity + 1, p.inventory) }
              : l,
          )
        : [...v, { product: p, quantity: 1 }];
    });
  const setQty = (id: string, n: number) =>
    setLines((v) =>
      v.flatMap((l) =>
        l.product.id === id && n <= 0
          ? []
          : [
              l.product.id === id
                ? { ...l, quantity: Math.min(n, l.product.inventory) }
                : l,
            ],
      ),
    );
  return (
    <CartContext.Provider
      value={{ lines, add, setQty, clear: () => setLines([]) }}
    >
      {children}
    </CartContext.Provider>
  );
}
export const useCart = () => React.useContext(CartContext);

function StoreShell({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<SettingsData | null>(null);
  const { lines } = useCart();
  useEffect(() => {
    api<SettingsData>("/api/store")
      .then(setS)
      .catch(() => {});
  }, []);
  return (
    <div className="shop">
      <div className="shop-announcement">
        {s?.announcement || "Thoughtfully selected beauty essentials"}
      </div>
      <nav className="shop-nav" aria-label="Store navigation">
        <Link to="/store" className="shop-wordmark">
          DE_JOY <small>STORE</small>
        </Link>
        <div>
          <NavLink to="/collections/new-arrivals">New arrivals</NavLink>
          <NavLink to="/collections/all">Shop all</NavLink>
          <NavLink to="/collections/nail-care">Nail care</NavLink>
          <NavLink to="/collections/press-ons">Press-ons</NavLink>
        </div>
        <div className="shop-tools">
          <Link to="/search" aria-label="Search">
            <Search />
          </Link>
          <Link to="/cart" aria-label="Shopping bag">
            <ShoppingBag />
            <b>{lines.reduce((n, l) => n + l.quantity, 0)}</b>
          </Link>
        </div>
      </nav>
      {children}
      <footer className="shop-footer">
        <div>
          <b>DE_JOY STORE</b>
          <p>
            Considered beauty essentials and signature nail pieces, curated in
            Abuja.
          </p>
        </div>
        <div>
          <b>SHOP</b>
          <Link to="/collections/new-arrivals">New arrivals</Link>
          <Link to="/collections/all">All products</Link>
          <Link to="/search">Search</Link>
          <Link to="/cart">Your bag</Link>
        </div>
        <div>
          <b>HELP</b>
          <Link to="/shop/shipping">Shipping & delivery</Link>
          <Link to="/shop/returns">Returns</Link>
          <Link to="/shop/faq">FAQs</Link>
          <Link to="/track-order">Track an order</Link>
        </div>
        <small>
          © 2026 PressCreates LLC. Store platform owned and operated
          independently.
        </small>
      </footer>
    </div>
  );
}
function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  return (
    <article className="product-card">
      <Link to={`/store/${p.slug}`} className="product-media">
        {p.images[0] ? (
          <img src={p.images[0].url} alt={p.images[0].alt_text || p.name} />
        ) : (
          <span>No image</span>
        )}
        {p.compare_at_price && <b>Sale</b>}
      </Link>
      <div>
        <small>{p.category || "DE_JOY EDIT"}</small>
        <Link to={`/store/${p.slug}`}>
          <h3>{p.name}</h3>
        </Link>
        <p>
          {money(p.price)}{" "}
          {p.compare_at_price && <del>{money(p.compare_at_price)}</del>}
        </p>
        <button
          className="store-button"
          disabled={!p.inventory}
          onClick={() => add(p)}
        >
          {p.inventory ? "Add to bag" : "Sold out"}
        </button>
      </div>
    </article>
  );
}
export function StoreHome() {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    api<{ products: Product[] }>("/api/products").then((x) =>
      setProducts(x.products),
    );
  }, []);
  const categories = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];
  return (
    <StoreShell>
      <section className="store-hero">
        <div>
          <span>THE DE_JOY STORE</span>
          <h1>
            The art of beautiful
            <br />
            <em>finishing touches.</em>
          </h1>
          <p>
            Discover nail essentials, signature press-ons and considered beauty
            pieces curated to elevate your everyday ritual.
          </p>
          <Link to="/collections/new-arrivals" className="store-button">
            Shop new arrivals <ArrowRight />
          </Link>
        </div>
      </section>
      <section className="shop-promises">
        <div>
          <Truck />
          <span>
            <b>Delivery across Nigeria</b>
            <small>Confirmed after checkout</small>
          </span>
        </div>
        <div>
          <ShieldCheck />
          <span>
            <b>Carefully selected</b>
            <small>Quality-led essentials</small>
          </span>
        </div>
        <div>
          <Sparkles />
          <span>
            <b>The DE_JOY standard</b>
            <small>Distinctive, considered beauty</small>
          </span>
        </div>
      </section>
      <section className="collection-cards">
        <header>
          <span>SHOP BY COLLECTION</span>
          <h2>Find your finishing touch</h2>
        </header>
        <div>
          {(categories.length
            ? categories
            : ["Nail care", "Press-ons", "Beauty tools"]
          )
            .slice(0, 3)
            .map((c, i) => (
              <Link
                key={c}
                to={`/collections/${encodeURIComponent(c.toLowerCase().replace(/\s+/g, "-"))}`}
              >
                <div className={`collection-art art-${i + 1}`} />
                <span>COLLECTION {String(i + 1).padStart(2, "0")}</span>
                <h3>{c}</h3>
                <p>
                  Explore the edit <ArrowRight />
                </p>
              </Link>
            ))}
        </div>
      </section>
      <section id="collection" className="store-section">
        <header>
          <span>JUST LANDED</span>
          <h2>New Arrivals</h2>
          <p>Fresh additions and DE_JOY favourites, selected with intention.</p>
        </header>
        <div className="product-grid">
          {products.slice(0, 6).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
          {!products.length && (
            <p className="empty">The first collection is being prepared.</p>
          )}
        </div>
        <div className="section-action">
          <Link className="store-button" to="/collections/new-arrivals">
            Shop New Arrivals <ArrowRight />
          </Link>
        </div>
      </section>
      <section className="shop-editorial">
        <div />
        <article>
          <span>THE DE_JOY EDIT</span>
          <h2>
            Thoughtful details.
            <br />
            Effortless confidence.
          </h2>
          <p>
            Every item earns its place through quality, usefulness and the
            ability to make your beauty ritual feel more considered.
          </p>
          <Link to="/collections/all">
            Discover the collection <ArrowRight />
          </Link>
        </article>
      </section>
    </StoreShell>
  );
}

function Catalogue({ title, category }: { title: string; category?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sort, setSort] = useState(
    category === "new-arrivals" ? "newest" : "featured",
  );
  const [stock, setStock] = useState(false);
  const [facet, setFacet] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [visible, setVisible] = useState(12);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<{ products: Product[] }>("/api/products")
      .then((x) => setProducts(x.products))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => setVisible(12), [sort, stock, facet, maxPrice, category]);
  const categories = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];
  let shown = products.filter(
    (p) =>
      (!category ||
        category === "all" ||
        category === "new-arrivals" ||
        p.category.toLowerCase().replace(/\s+/g, "-") === category) &&
      (!stock || p.inventory > 0) &&
      (facet === "all" || p.category === facet) &&
      (!maxPrice || p.price <= Number(maxPrice) * 100),
  );
  shown = [...shown].sort((a, b) => {
    if (sort === "price-low") return a.price - b.price;
    if (sort === "price-high") return b.price - a.price;
    if (sort === "name-asc") return a.name.localeCompare(b.name);
    if (sort === "name-desc") return b.name.localeCompare(a.name);
    if (sort === "newest")
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    if (sort === "oldest")
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    if (sort === "best-selling")
      return Number(b.sold_count || 0) - Number(a.sold_count || 0);
    return Number(b.featured) - Number(a.featured);
  });
  const suggested = products
    .filter((p) => !shown.some((x) => x.id === p.id))
    .slice(0, 3);
  const hasFilters = stock || facet !== "all" || Boolean(maxPrice);
  const clearFilters = () => {
    setStock(false);
    setFacet("all");
    setMaxPrice("");
  };
  return (
    <StoreShell>
      <div className="collection-breadcrumb">
        <Link to="/store">Home</Link>
        <span>/</span>
        <b>{title}</b>
      </div>
      <section className={`collection-head collection-${category || "all"}`}>
        <div className="collection-head-copy">
          <span>DE_JOY COLLECTION</span>
          <h1>{title}</h1>
          <p>
            {category === "press-ons"
              ? "Salon-worthy artistry, sized for you and designed to wear beautifully—wherever your moment takes you."
              : "Distinctive beauty essentials, selected to complement your style and elevate your ritual."}
          </p>
        </div>
        <div className="collection-head-art" aria-hidden="true" />
      </section>
      <section className="catalogue">
        {loading ? (
          <div className="collection-loading">
            <div />
            <div />
            <div />
          </div>
        ) : shown.length ? (
          <>
            <div className="catalogue-bar">
              <p>
                <b>{shown.length}</b>{" "}
                {shown.length === 1 ? "product" : "products"}
              </p>
              <span className="filter-label">
                <SlidersHorizontal /> Filter and sort
              </span>
              <label>
                <span>Sort by</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="best-selling">Best selling</option>
                  <option value="newest">Date: new to old</option>
                  <option value="oldest">Date: old to new</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="name-asc">Alphabetically: A–Z</option>
                  <option value="name-desc">Alphabetically: Z–A</option>
                </select>
                <ChevronDown />
              </label>
            </div>
            {hasFilters && (
              <div className="active-filters">
                {stock && (
                  <button onClick={() => setStock(false)}>
                    Available now ×
                  </button>
                )}
                {facet !== "all" && (
                  <button onClick={() => setFacet("all")}>{facet} ×</button>
                )}
                {maxPrice && (
                  <button onClick={() => setMaxPrice("")}>
                    Up to {money(Number(maxPrice) * 100)} ×
                  </button>
                )}
                <button onClick={clearFilters}>Clear all</button>
              </div>
            )}
            <div className="catalogue-layout">
              <aside className="filter-panel">
                <h2>Filter</h2>
                <details open>
                  <summary>
                    Availability <ChevronDown />
                  </summary>
                  <label>
                    <input
                      type="checkbox"
                      checked={stock}
                      onChange={(e) => setStock(e.target.checked)}
                    />{" "}
                    In stock{" "}
                    <span>
                      {products.filter((p) => p.inventory > 0).length}
                    </span>
                  </label>
                </details>
                {(category === "all" || category === "new-arrivals") && (
                  <details open>
                    <summary>
                      Product type <ChevronDown />
                    </summary>
                    <label>
                      <input
                        type="radio"
                        name="category"
                        checked={facet === "all"}
                        onChange={() => setFacet("all")}
                      />{" "}
                      All categories <span>{products.length}</span>
                    </label>
                    {categories.map((c) => (
                      <label key={c}>
                        <input
                          type="radio"
                          name="category"
                          checked={facet === c}
                          onChange={() => setFacet(c)}
                        />{" "}
                        {c}{" "}
                        <span>
                          {products.filter((p) => p.category === c).length}
                        </span>
                      </label>
                    ))}
                  </details>
                )}
                <details open>
                  <summary>
                    Price <ChevronDown />
                  </summary>
                  <label className="price-filter">
                    <span>₦</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Maximum price"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </label>
                </details>
              </aside>
              <div className="catalogue-products">
                <div className="product-grid">
                  {shown.slice(0, visible).map((p) => (
                    <ProductCard key={p.id} p={p} />
                  ))}
                </div>
                {visible < shown.length && (
                  <div className="load-more">
                    <p>
                      Showing {visible} of {shown.length} products
                    </p>
                    <button
                      className="store-button"
                      onClick={() => setVisible((v) => v + 12)}
                    >
                      Load more
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <section className="collection-empty">
            <div className="empty-visual">
              <span>{hasFilters ? "NO MATCHES" : "COMING SOON"}</span>
            </div>
            <div>
              <span>
                {hasFilters ? "REFINE YOUR SEARCH" : "THE NEXT DE_JOY DROP"}
              </span>
              <h2>
                {hasFilters ? "No products match" : "This collection is"}
                <br />
                <em>{hasFilters ? "your filters." : "being perfected."}</em>
              </h2>
              <p>
                {hasFilters
                  ? "Clear your selected filters to see more of the DE_JOY collection."
                  : "We are thoughtfully preparing pieces worthy of your ritual. Explore the complete edit now, or check back for the first release."}
              </p>
              <div>
                {hasFilters ? (
                  <button className="store-button" onClick={clearFilters}>
                    Clear all filters
                  </button>
                ) : (
                  <Link className="store-button" to="/collections/all">
                    Shop all products <ArrowRight />
                  </Link>
                )}
                <Link className="collection-text-link" to="/store">
                  Return to store
                </Link>
              </div>
            </div>
          </section>
        )}
        {!shown.length && suggested.length > 0 && (
          <section className="recommended">
            <header>
              <span>AVAILABLE NOW</span>
              <h2>You may also love</h2>
            </header>
            <div className="product-grid">
              {suggested.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        )}
        <section className="collection-service">
          <div>
            <ShieldCheck />
            <b>Carefully selected</b>
            <small>Quality-led essentials</small>
          </div>
          <div>
            <Truck />
            <b>Delivery across Nigeria</b>
            <small>Confirmed after checkout</small>
          </div>
          <div>
            <Sparkles />
            <b>Personal service</b>
            <small>Support directly from DE_JOY</small>
          </div>
        </section>
      </section>
    </StoreShell>
  );
}
export function CollectionPage() {
  const { handle = "all" } = useParams();
  const title =
    handle === "all"
      ? "All products"
      : handle
          .split("-")
          .map((x) => x[0].toUpperCase() + x.slice(1))
          .join(" ");
  return <Catalogue title={title} category={handle} />;
}
export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const q = params.get("q") || "";
  useEffect(() => {
    api<{ products: Product[] }>("/api/products").then((x) =>
      setProducts(x.products),
    );
  }, []);
  const results = q
    ? products.filter((p) =>
        `${p.name} ${p.category} ${p.description}`
          .toLowerCase()
          .includes(q.toLowerCase()),
      )
    : [];
  return (
    <StoreShell>
      <section className="search-page">
        <span>SEARCH THE STORE</span>
        <h1>What are you looking for?</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParams({
              q: String(new FormData(e.currentTarget).get("q") || ""),
            });
          }}
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="Search products"
            autoFocus
          />
          <button aria-label="Search">
            <Search />
          </button>
        </form>
        {q && (
          <p>
            {results.length} results for “{q}”
          </p>
        )}
        <div className="product-grid">
          {results.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>
    </StoreShell>
  );
}
export function ShopInfo({ type }: { type: "shipping" | "returns" | "faq" }) {
  const content = {
    shipping: {
      label: "SHIPPING & DELIVERY",
      title: "From our studio to your door",
      intro: "Orders are reviewed personally before delivery is arranged.",
      items: [
        [
          "Where do you deliver?",
          "Delivery is available across Nigeria. Timing and cost depend on your location and are confirmed after checkout.",
        ],
        [
          "When will my order ship?",
          "Available items are prepared after payment confirmation. Custom pieces may require additional production time.",
        ],
        [
          "How do I receive updates?",
          "We use the email and phone number supplied at checkout to confirm payment, delivery and fulfilment updates.",
        ],
      ],
    },
    returns: {
      label: "RETURNS & EXCHANGES",
      title: "Purchase with confidence",
      intro: "We want every DE_JOY order to arrive as expected.",
      items: [
        [
          "Can I return an item?",
          "Contact us promptly after delivery. Eligibility depends on item condition, hygiene requirements and whether the piece was custom-made.",
        ],
        [
          "What cannot be returned?",
          "Used, opened hygiene-sensitive products and personalised or made-to-order pieces cannot normally be returned unless faulty.",
        ],
        [
          "What if something is damaged?",
          "Send clear photos and your order reference so the team can review the issue and arrange the appropriate resolution.",
        ],
      ],
    },
    faq: {
      label: "FREQUENTLY ASKED QUESTIONS",
      title: "Everything you need to know",
      intro: "Quick answers about shopping with DE_JOY.",
      items: [
        [
          "How do I pay?",
          "Checkout creates your order request. The team then sends the approved offline payment instructions.",
        ],
        [
          "Do I need an account?",
          "No. You can shop and place an order as a guest.",
        ],
        [
          "Can I change an order?",
          "Contact the team immediately with your order reference. Changes depend on fulfilment status and availability.",
        ],
        [
          "Are colours exact?",
          "Screens and lighting can affect colour. Product photos are a close representation, but slight variation is possible.",
        ],
      ],
    },
  }[type];
  return (
    <StoreShell>
      <section className="info-page">
        <span>{content.label}</span>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
        <div>
          {content.items.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <Plus />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </StoreShell>
  );
}
export function TrackOrder() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      setResult(
        await api(
          `/api/orders/track?number=${encodeURIComponent(String(f.get("number")))}&email=${encodeURIComponent(String(f.get("email")))}`,
        ),
      );
      setError("");
    } catch (x) {
      setResult(null);
      setError((x as Error).message);
    }
  }
  return (
    <StoreShell>
      <section className="track-page">
        <span>ORDER STATUS</span>
        <h1>Track your order</h1>
        <p>Enter your order reference and the email used at checkout.</p>
        <form onSubmit={submit}>
          <label>
            Order reference
            <input name="number" required placeholder="e.g. 1024" />
          </label>
          <label>
            Email address
            <input name="email" type="email" required />
          </label>
          <button className="store-button">Check status</button>
        </form>
        {error && <p className="form-error">{error}</p>}
        {result && (
          <article>
            <b>Order #{result.order_number}</b>
            <h2>{result.fulfillment_status}</h2>
            <p>Payment: {result.payment_status}</p>
            <small>
              Placed {new Date(result.created_at).toLocaleDateString()}
            </small>
          </article>
        )}
      </section>
    </StoreShell>
  );
}
export function ProductPage() {
  const { slug } = useParams();
  const [p, setP] = useState<Product | null>(null);
  const { add } = useCart();
  useEffect(() => {
    api<Product>(`/api/products/${slug}`).then(setP);
  }, [slug]);
  if (!p) return <div className="store-loading">Loading product…</div>;
  return (
    <StoreShell>
      <section className="product-detail">
        <div className="product-gallery">
          {p.images.length ? (
            p.images.map((i) => (
              <img key={i.id} src={i.url} alt={i.alt_text || p.name} />
            ))
          ) : (
            <div className="empty">No image</div>
          )}
        </div>
        <div className="product-info">
          <span>{p.category}</span>
          <h1>{p.name}</h1>
          <h2>{money(p.price)}</h2>
          <p>{p.description || p.short_description}</p>
          <button
            className="store-button wide"
            disabled={!p.inventory}
            onClick={() => add(p)}
          >
            {p.inventory ? "Add to bag" : "Sold out"}
          </button>
          <small>
            {p.inventory > 0
              ? `${p.inventory} available`
              : `Currently unavailable`}
          </small>
        </div>
      </section>
    </StoreShell>
  );
}
export function CartPage() {
  const { lines, setQty } = useCart();
  const total = lines.reduce((s, l) => s + l.product.price * l.quantity, 0);
  return (
    <StoreShell>
      <section className="cart-page">
        <h1>Your bag</h1>
        {!lines.length ? (
          <div className="empty">
            <p>Your bag is empty.</p>
            <Link className="store-button" to="/store">
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-layout">
              <div>
                {lines.map((l) => (
                  <article className="cart-line" key={l.product.id}>
                    {l.product.images[0] && (
                      <img src={l.product.images[0].url} alt="" />
                    )}
                    <div>
                      <h3>{l.product.name}</h3>
                      <p>{money(l.product.price)}</p>
                      <div className="qty">
                        <button
                          onClick={() => setQty(l.product.id, l.quantity - 1)}
                        >
                          <Minus />
                        </button>
                        <span>{l.quantity}</span>
                        <button
                          onClick={() => setQty(l.product.id, l.quantity + 1)}
                        >
                          <Plus />
                        </button>
                        <button
                          aria-label="Remove"
                          onClick={() => setQty(l.product.id, 0)}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <aside>
                <h2>Order summary</h2>
                <p>
                  <span>Subtotal</span>
                  <b>{money(total)}</b>
                </p>
                <small>
                  Delivery and offline payment details are confirmed after
                  checkout.
                </small>
                <Link className="store-button wide" to="/checkout">
                  Checkout <ArrowRight />
                </Link>
              </aside>
            </div>
          </>
        )}
      </section>
    </StoreShell>
  );
}
export function CheckoutPage() {
  const { lines, clear } = useCart();
  const nav = useNavigate();
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const x = await api<{ order_number: string }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customer_name: fd.get("name"),
          customer_email: fd.get("email"),
          customer_phone: fd.get("phone"),
          delivery_address: fd.get("address"),
          notes: fd.get("notes"),
          items: lines.map((l) => ({
            product_id: l.product.id,
            quantity: l.quantity,
          })),
        }),
      });
      clear();
      nav(`/order-success?order=${x.order_number}`);
    } catch (err) {
      setError((err as Error).message);
    }
  }
  if (!lines.length) return <CartPage />;
  return (
    <StoreShell>
      <section className="checkout">
        <form onSubmit={submit}>
          <span>SECURE CHECKOUT</span>
          <h1>Complete your order</h1>
          <div className="form-grid">
            <label>
              Full name
              <input name="name" required />
            </label>
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <label>
              Phone
              <input name="phone" required />
            </label>
            <label className="wide">
              Delivery address
              <textarea name="address" required />
            </label>
            <label className="wide">
              Order notes
              <textarea name="notes" />
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="store-button wide">Place order</button>
        </form>
        <aside>
          <h2>Your order</h2>
          {lines.map((l) => (
            <article className="checkout-product" key={l.product.id}>
              <div className="checkout-media-stack">
                {l.product.images.slice(0, 3).map((image, index) => (
                  <img
                    key={image.id}
                    src={image.url}
                    alt={
                      image.alt_text || `${l.product.name} view ${index + 1}`
                    }
                  />
                ))}
                {!l.product.images.length && (
                  <div className="checkout-image-placeholder">
                    <ImagePlus />
                  </div>
                )}
                <b>{l.quantity}</b>
              </div>
              <div>
                <strong>{l.product.name}</strong>
                <small>
                  {l.product.category} · {l.product.images.length}{" "}
                  {l.product.images.length === 1 ? "view" : "views"}
                </small>
              </div>
              <b>{money(l.product.price * l.quantity)}</b>
            </article>
          ))}
          <p className="checkout-total">
            <span>Total</span>
            <b>
              {money(
                lines.reduce((s, l) => s + l.product.price * l.quantity, 0),
              )}
            </b>
          </p>
          <small>
            No online payment is collected. Payment and fulfilment instructions
            follow after your order is reviewed.
          </small>
        </aside>
      </section>
    </StoreShell>
  );
}
export function OrderSuccess() {
  const q = new URLSearchParams(location.search);
  return (
    <StoreShell>
      <section className="success">
        <Package />
        <span>ORDER RECEIVED</span>
        <h1>Thank you for your order.</h1>
        <p>
          Your reference is <b>{q.get("order")}</b>. The DE_JOY team will
          contact you with offline payment and fulfilment details.
        </p>
        <Link className="store-button" to="/store">
          Return to store
        </Link>
      </section>
    </StoreShell>
  );
}

type AdminProduct = Partial<Product> & { images?: Product["images"] };
export function Admin() {
  const [state, setState] = useState<"loading" | "setup" | "login" | "ready">(
    "loading",
  );
  const [tab, setTab] = useState("overview");
  const [admin, setAdmin] = useState<any>(null);
  useEffect(() => {
    Promise.all([
      api<{ configured: boolean }>("/api/setup/status"),
      api<any>("/api/admin/me").catch(() => null),
    ]).then(([s, me]) => {
      setAdmin(me);
      setState(me ? "ready" : s.configured ? "login" : "setup");
    });
  }, []);
  if (state === "loading")
    return (
      <div className="admin-auth">
        <div className="admin-spinner" />
        Preparing your workspace…
      </div>
    );
  if (state !== "ready")
    return <AdminAuth mode={state} onDone={() => setState("ready")} />;
  const links = [
    ["overview", "Overview", <LayoutDashboard />],
    ["products", "Products", <Package />],
    ["categories", "Categories", <FolderTree />],
    ["orders", "Orders", <ShoppingBag />],
    ["settings", "Settings", <Settings />],
  ];
  return (
    <div className="admin">
      <aside>
        <div>
          <Link className="logo" to="/">
            <b>DE_JOY</b>
            <span>COMMERCE</span>
          </Link>
          <small>Store administration</small>
        </div>
        <nav>
          {links.map(([id, label, icon]) => (
            <button
              key={String(id)}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(String(id))}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <a href="/store" target="_blank">
            View live store <ExternalLink />
          </a>
          <div className="admin-user">
            <span>
              {(admin?.displayName || admin?.email || "A")
                .slice(0, 1)
                .toUpperCase()}
            </span>
            <div>
              <b>{admin?.displayName || "Store owner"}</b>
              <small>{admin?.email}</small>
            </div>
          </div>
          <button
            onClick={() =>
              api("/api/admin/logout", { method: "POST" }).then(() =>
                setState("login"),
              )
            }
          >
            <LogOut />
            Sign out
          </button>
        </div>
      </aside>
      <main>
        {tab === "overview" ? (
          <AdminOverview go={setTab} />
        ) : tab === "products" ? (
          <AdminProducts />
        ) : tab === "categories" ? (
          <AdminCategories />
        ) : tab === "orders" ? (
          <AdminOrders />
        ) : (
          <AdminSettings />
        )}
      </main>
    </div>
  );
}
function AdminOverview({ go }: { go: (tab: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api("/api/admin/overview")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  if (error) return <div className="admin-notice error">{error}</div>;
  if (!data) return <div className="admin-skeleton">Loading dashboard…</div>;
  const m = data.metrics;
  return (
    <>
      <header className="admin-head dashboard-head">
        <div>
          <span>STORE OVERVIEW</span>
          <h1>Good day.</h1>
          <p>Here’s what is happening across your store.</p>
        </div>
        <button className="store-button" onClick={() => go("products")}>
          <Plus />
          Add product
        </button>
      </header>
      <section className="metric-grid">
        <article>
          <div>
            <span>Total orders</span>
            <ShoppingBag />
          </div>
          <strong>{m.orders}</strong>
          <small>{m.pending_orders} awaiting action</small>
        </article>
        <article>
          <div>
            <span>Paid revenue</span>
            <CircleDollarSign />
          </div>
          <strong>{money(m.paid_revenue)}</strong>
          <small>Confirmed offline payments</small>
        </article>
        <article>
          <div>
            <span>Active products</span>
            <Package />
          </div>
          <strong>{m.active_products}</strong>
          <small>{m.draft_products} saved as draft</small>
        </article>
        <article>
          <div>
            <span>Inventory</span>
            <TrendingUp />
          </div>
          <strong>{m.inventory_units}</strong>
          <small>Units currently available</small>
        </article>
      </section>
      <section className="dashboard-grid">
        <article className="dashboard-panel">
          <header>
            <div>
              <span>RECENT ACTIVITY</span>
              <h2>Latest orders</h2>
            </div>
            <button onClick={() => go("orders")}>
              View all <ArrowRight />
            </button>
          </header>
          {data.recent_orders.length ? (
            data.recent_orders.map((o: any) => (
              <div className="recent-order" key={o.id}>
                <span className={`status-dot ${o.fulfillment_status}`} />
                <div>
                  <b>Order #{o.order_number}</b>
                  <small>
                    {o.customer_name} ·{" "}
                    {new Date(o.created_at).toLocaleDateString()}
                  </small>
                </div>
                <strong>{money(o.total)}</strong>
                <span className={`admin-badge ${o.payment_status}`}>
                  {o.payment_status}
                </span>
              </div>
            ))
          ) : (
            <div className="admin-empty">
              <ShoppingBag />
              <b>No orders yet</b>
              <p>New customer orders will appear here.</p>
            </div>
          )}
        </article>
        <article className="dashboard-panel">
          <header>
            <div>
              <span>INVENTORY WATCH</span>
              <h2>Low stock</h2>
            </div>
            <button onClick={() => go("products")}>
              Manage <ArrowRight />
            </button>
          </header>
          {data.low_stock.length ? (
            data.low_stock.map((p: any) => (
              <div className="stock-row" key={p.id}>
                <AlertTriangle />
                <div>
                  <b>{p.name}</b>
                  <small>{p.status}</small>
                </div>
                <strong>{p.inventory} left</strong>
              </div>
            ))
          ) : (
            <div className="admin-empty">
              <Package />
              <b>Inventory looks healthy</b>
              <p>No products have five units or fewer.</p>
            </div>
          )}
        </article>
      </section>
      <section className="quick-actions">
        <span>QUICK ACTIONS</span>
        <div>
          <button onClick={() => go("products")}>
            <Plus />
            <b>Create product</b>
            <small>Add an item to your catalogue</small>
          </button>
          <button onClick={() => go("orders")}>
            <ShoppingBag />
            <b>Review orders</b>
            <small>Confirm payment and fulfilment</small>
          </button>
          <a href="/store" target="_blank">
            <ExternalLink />
            <b>Open storefront</b>
            <small>View the customer experience</small>
          </a>
        </div>
      </section>
    </>
  );
}
function AdminAuth({
  mode,
  onDone,
}: {
  mode: "setup" | "login";
  onDone: () => void;
}) {
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api(mode === "setup" ? "/api/setup" : "/api/admin/login", {
        method: "POST",
        headers:
          mode === "setup" ? { "x-setup-token": String(f.get("setup")) } : {},
        body: JSON.stringify({
          display_name: f.get("name"),
          email: f.get("email"),
          password: f.get("password"),
        }),
      });
      onDone();
    } catch (x) {
      setError((x as Error).message);
    }
  }
  return (
    <div className="admin-auth">
      <form onSubmit={submit}>
        <span>DE_JOY STORE ADMIN</span>
        <h1>
          {mode === "setup" ? "Create the owner account" : "Welcome back"}
        </h1>
        {mode === "setup" && (
          <>
            <label>
              Owner name
              <input name="name" required />
            </label>
            <label>
              Private setup key
              <input name="setup" type="password" required />
            </label>
          </>
        )}
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" minLength={12} required />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="store-button">
          {mode === "setup" ? "Create owner" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
function AdminCategories() {
  const [items, setItems] = useState<Category[]>([]);
  const [edit, setEdit] = useState<Partial<Category> | null>(null);
  const [error, setError] = useState("");
  const load = () =>
    api<{ categories: Category[] }>("/api/admin/categories").then((x) =>
      setItems(x.categories),
    );
  useEffect(() => {
    load();
  }, []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const body = {
      name: f.get("name"),
      slug: f.get("slug"),
      description: f.get("description"),
      image_url: f.get("image_url"),
      status: f.get("status"),
      sort_order: Number(f.get("sort_order")),
    };
    try {
      await api(
        edit?.id ? `/api/admin/categories/${edit.id}` : "/api/admin/categories",
        { method: edit?.id ? "PUT" : "POST", body: JSON.stringify(body) },
      );
      setEdit(null);
      load();
    } catch (x) {
      setError((x as Error).message);
    }
  }
  async function remove(c: Category) {
    if (!confirm(`Delete ${c.name}?`)) return;
    try {
      await api(`/api/admin/categories/${c.id}`, { method: "DELETE" });
      load();
    } catch (x) {
      setError((x as Error).message);
    }
  }
  return (
    <>
      <header className="admin-head">
        <div>
          <span>CATALOGUE ORGANISATION</span>
          <h1>Categories</h1>
          <p>Group products into customer-facing collections.</p>
        </div>
        <button
          className="store-button"
          onClick={() =>
            setEdit({ status: "active", sort_order: items.length + 1 })
          }
        >
          <Plus />
          Add category
        </button>
      </header>
      {error && <div className="admin-notice error">{error}</div>}
      {edit && (
        <form className="admin-form category-form" onSubmit={save}>
          <div className="admin-form-title">
            <div>
              <span>{edit.id ? "EDIT CATEGORY" : "NEW CATEGORY"}</span>
              <h2>{edit.id ? edit.name : "Create a category"}</h2>
            </div>
            <button type="button" onClick={() => setEdit(null)}>
              ×
            </button>
          </div>
          <div className="form-grid">
            <label>
              Name
              <input name="name" defaultValue={edit.name} required />
            </label>
            <label>
              URL handle
              <input
                name="slug"
                defaultValue={edit.slug}
                placeholder="e.g. nail-care"
              />
            </label>
            <label className="wide">
              Description
              <textarea name="description" defaultValue={edit.description} />
            </label>
            <label className="wide">
              Cover image URL
              <input
                name="image_url"
                type="url"
                defaultValue={edit.image_url}
                placeholder="https://…"
              />
            </label>
            <label>
              Status
              <select name="status" defaultValue={edit.status}>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label>
              Display order
              <input
                name="sort_order"
                type="number"
                min="0"
                defaultValue={edit.sort_order}
              />
            </label>
          </div>
          <div className="admin-actions">
            <button type="button" onClick={() => setEdit(null)}>
              Cancel
            </button>
            <button className="store-button">Save category</button>
          </div>
        </form>
      )}
      <div className="category-grid">
        {items.map((c) => (
          <article key={c.id}>
            {c.image_url ? (
              <img src={c.image_url} alt="" />
            ) : (
              <div className="category-placeholder">
                <FolderTree />
              </div>
            )}
            <div>
              <span className={`admin-badge ${c.status}`}>{c.status}</span>
              <h2>{c.name}</h2>
              <p>{c.description || "No description added."}</p>
              <small>
                {c.product_count}{" "}
                {c.product_count === 1 ? "product" : "products"} · /collections/
                {c.slug}
              </small>
            </div>
            <footer>
              <button onClick={() => setEdit(c)}>Edit</button>
              <button disabled={c.product_count > 0} onClick={() => remove(c)}>
                <Trash2 /> Delete
              </button>
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}

function CategorySelect({ value }: { value?: string }) {
  const [items, setItems] = useState<Category[]>([]);
  useEffect(() => {
    api<{ categories: Category[] }>("/api/admin/categories").then((x) =>
      setItems(x.categories),
    );
  }, []);
  return (
    <select name="category" defaultValue={value || ""} required>
      <option value="" disabled>
        Select a category
      </option>
      {items
        .filter((c) => c.status === "active" || c.name === value)
        .map((c) => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
    </select>
  );
}
function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [edit, setEdit] = useState<AdminProduct | null>(null);
  const load = () =>
    api<{ products: Product[] }>("/api/admin/products").then((x) => {
      setItems(x.products);
      if (edit?.id) setEdit(x.products.find((p) => p.id === edit.id) || null);
    });
  useEffect(() => {
    load();
  }, []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      name: f.get("name"),
      slug: f.get("slug"),
      category: f.get("category"),
      short_description: f.get("short"),
      description: f.get("description"),
      price: Math.round(Number(f.get("price")) * 100),
      compare_at_price: f.get("compare")
        ? Math.round(Number(f.get("compare")) * 100)
        : null,
      inventory: Number(f.get("inventory")),
      status: f.get("status"),
      featured: f.get("featured") === "on",
    };
    await api(
      edit?.id ? `/api/admin/products/${edit.id}` : "/api/admin/products",
      { method: edit?.id ? "PUT" : "POST", body: JSON.stringify(body) },
    );
    setEdit(null);
    load();
  }
  return (
    <>
      <header className="admin-head">
        <div>
          <span>CATALOGUE</span>
          <h1>Products</h1>
        </div>
        <button
          className="store-button"
          onClick={() => setEdit({ status: "draft", inventory: 0, price: 0 })}
        >
          <Plus />
          Add product
        </button>
      </header>
      {edit && (
        <form className="admin-form" onSubmit={save}>
          <h2>{edit.id ? "Edit product" : "New product"}</h2>
          <div className="form-grid">
            <label>
              Name
              <input name="name" defaultValue={edit.name} required />
            </label>
            <label>
              URL slug
              <input name="slug" defaultValue={edit.slug} required />
            </label>
            <label>
              Category
              <CategorySelect value={edit.category} />
            </label>
            <label>
              Price (NGN)
              <input
                name="price"
                type="number"
                min="0"
                defaultValue={(edit.price || 0) / 100}
                required
              />
            </label>
            <label>
              Compare at price
              <input
                name="compare"
                type="number"
                min="0"
                defaultValue={
                  edit.compare_at_price ? edit.compare_at_price / 100 : ""
                }
              />
            </label>
            <label>
              Inventory
              <input
                name="inventory"
                type="number"
                min="0"
                defaultValue={edit.inventory}
              />
            </label>
            <label>
              Status
              <select name="status" defaultValue={edit.status}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label>
              Featured
              <input
                name="featured"
                type="checkbox"
                defaultChecked={edit.featured}
              />
            </label>
            <label className="wide">
              Short description
              <input name="short" defaultValue={edit.short_description} />
            </label>
            <label className="wide">
              Description
              <textarea name="description" defaultValue={edit.description} />
            </label>
          </div>
          <div className="admin-actions">
            <button type="button" onClick={() => setEdit(null)}>
              Cancel
            </button>
            <button className="store-button">Save product</button>
          </div>
          {edit.id && (
            <ImageManager
              product={edit as Product}
              onChange={() => {
                load();
              }}
            />
          )}
        </form>
      )}
      <div className="admin-table">
        {items.map((p) => (
          <article key={p.id}>
            {p.images[0] ? (
              <img src={p.images[0].url} alt="" />
            ) : (
              <div className="thumb" />
            )}
            <div>
              <h3>{p.name}</h3>
              <small>
                {p.status} · {p.inventory} in stock
              </small>
            </div>
            <b>{money(p.price)}</b>
            <button onClick={() => setEdit(p)}>Edit</button>
          </article>
        ))}
      </div>
    </>
  );
}
function ImageManager({
  product,
  onChange,
}: {
  product: Product;
  onChange: () => void;
}) {
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    const f = new FormData();
    Array.from(e.target.files).forEach((file) => f.append("images", file));
    await api(`/api/admin/products/${product.id}/images`, {
      method: "POST",
      body: f,
    });
    onChange();
  }
  return (
    <div className="image-manager">
      <div className="media-heading">
        <div>
          <span>PRODUCT MEDIA</span>
          <h3>Product images</h3>
          <p>
            Upload up to eight angles, details, colours or packaging views. The
            first image is the product cover.
          </p>
        </div>
        <b>{product.images?.length || 0}/8</b>
      </div>
      <div>
        {product.images?.map((i) => (
          <figure key={i.id}>
            <img src={i.url} />
            <button
              type="button"
              onClick={() =>
                api(`/api/admin/images/${i.id}`, { method: "DELETE" }).then(
                  onChange,
                )
              }
            >
              <Trash2 />
            </button>
          </figure>
        ))}
        <label
          className={(product.images?.length || 0) >= 8 ? "media-limit" : ""}
        >
          <ImagePlus />
          {(product.images?.length || 0) >= 8
            ? "Image limit reached"
            : "Add images"}
          <input
            hidden
            disabled={(product.images?.length || 0) >= 8}
            multiple
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={upload}
          />
        </label>
      </div>
    </div>
  );
}
function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const load = () =>
    api<{ orders: any[] }>("/api/admin/orders").then((x) =>
      setOrders(x.orders),
    );
  useEffect(() => {
    load();
  }, []);
  return (
    <>
      <header className="admin-head">
        <div>
          <span>SALES</span>
          <h1>Orders</h1>
        </div>
      </header>
      <div className="orders">
        {orders.map((o) => (
          <article key={o.id}>
            <div>
              <b>{o.order_number}</b>
              <h3>{o.customer_name}</h3>
              <p>
                {o.customer_email} · {o.customer_phone}
              </p>
              <small>{new Date(o.created_at).toLocaleString()}</small>
            </div>
            <b>{money(o.total)}</b>
            <select
              value={o.status}
              onChange={(e) =>
                api(`/api/admin/orders/${o.id}/status`, {
                  method: "PUT",
                  body: JSON.stringify({ status: e.target.value }),
                }).then(load)
              }
            >
              <option>pending</option>
              <option>confirmed</option>
              <option>fulfilled</option>
              <option>cancelled</option>
            </select>
          </article>
        ))}
      </div>
    </>
  );
}
function AdminSettings() {
  const [s, setS] = useState<SettingsData | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    api<SettingsData>("/api/admin/settings").then(setS);
  }, []);
  if (!s) return null;
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await api("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(Object.fromEntries(f)),
    });
    setSaved(true);
  }
  return (
    <>
      <header className="admin-head">
        <div>
          <span>CONFIGURATION</span>
          <h1>Store settings</h1>
        </div>
      </header>
      <form className="admin-form settings-form" onSubmit={save}>
        <label>
          Store name
          <input name="store_name" defaultValue={s.store_name} />
        </label>
        <label>
          Announcement
          <input name="announcement" defaultValue={s.announcement} />
        </label>
        <label>
          Contact email
          <input
            name="contact_email"
            type="email"
            defaultValue={s.contact_email}
          />
        </label>
        <label>
          WhatsApp
          <input name="whatsapp" defaultValue={s.whatsapp} />
        </label>
        <label>
          Offline payment instructions
          <textarea
            name="offline_payment_instructions"
            defaultValue={s.offline_payment_instructions}
          />
        </label>
        <button className="store-button">Save settings</button>
        {saved && <small>Saved successfully.</small>}
      </form>
    </>
  );
}
