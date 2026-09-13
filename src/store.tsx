import React, { FormEvent, useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowRight, ChevronDown, CircleDollarSign, ExternalLink, ImagePlus, LayoutDashboard, LogOut, Minus, Package, Plus, Search, Settings, ShieldCheck, ShoppingBag, Sparkles, TrendingUp, Truck, Trash2 } from "lucide-react";
import "./store.css";

type Product={id:string;name:string;slug:string;description:string;short_description:string;price:number;compare_at_price:number|null;inventory:number;status:string;category:string;featured:boolean;created_at:string;sold_count:number;images:{id:string;url:string;alt_text:string;position:number}[]};
const STARTER_PRODUCTS:Product[]=[
["10000000-0000-4000-8000-000000000001","Barely Blush Almond","barely-blush-almond","A refined blush nude almond manicure with an immaculate glossy finish.",1500000,"Press-ons","https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=88"],
["10000000-0000-4000-8000-000000000002","Rose Quartz Glow","rose-quartz-glow","A soft translucent pink manicure inspired by polished rose quartz.",1800000,"Nail care","https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1000&q=84"],
["10000000-0000-4000-8000-000000000003","Modern French Muse","modern-french-muse","A clean contemporary French manicure with precise statement tips.",2000000,"Press-ons","https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=1000&q=84"],
["10000000-0000-4000-8000-000000000004","Sculpted Mocha Luxe","sculpted-mocha-luxe","A sculpted editorial set in warm mocha and neutral tones.",2500000,"Nail care","https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=1000&q=84"],
["10000000-0000-4000-8000-000000000005","Everyday Nude Gloss","everyday-nude-gloss","A versatile glossy nude set designed for effortless everyday wear.",1400000,"Nail care","https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1000&q=84"],
["10000000-0000-4000-8000-000000000006","After Dark Statement","after-dark-statement","A confident statement manicure created for evenings and special moments.",2200000,"Press-ons","https://images.unsplash.com/photo-1619451334792-150fd785ee74?auto=format&fit=crop&w=1000&q=84"],
["10000000-0000-4000-8000-000000000007","Bridal Pearl Signature","bridal-pearl-signature","An elegant pearl-toned signature set for bridal and luxury occasions.",2800000,"Press-ons","https://images.pexels.com/photos/16363470/pexels-photo-16363470.jpeg?auto=compress&cs=tinysrgb&w=1600"]
].map(([id,name,slug,description,price,category,url],index)=>({id:String(id),name:String(name),slug:String(slug),description:String(description),short_description:String(description),price:Number(price),compare_at_price:null,inventory:12,status:"active",category:String(category),featured:index<3,created_at:new Date(Date.UTC(2026,8,11,12,index)).toISOString(),sold_count:0,images:[{id:`starter-image-${index+1}`,url:String(url),alt_text:String(name),position:0}]}));
type CartLine={product:Product;quantity:number};
type SettingsData={store_name:string;announcement:string;offline_payment_instructions:string;whatsapp:string;contact_email:string};
const money=(n:number)=>new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(n/100);
const collectionHandle=(value:string)=>value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
async function api<T>(path:string,options?:RequestInit):Promise<T>{const res=await fetch(path,{...options,headers:{...(options?.body instanceof FormData?{}:{"Content-Type":"application/json"}),...options?.headers}});const data=await res.json().catch(()=>({}));if(path==="/api/products"&&(!Array.isArray(data.products)||data.products.length===0))return {products:STARTER_PRODUCTS} as T;if(path.startsWith("/api/products/")&&(!res.ok||!data.id)){const fallback=STARTER_PRODUCTS.find(product=>product.slug===path.split("/").pop());if(fallback)return fallback as T}if(!res.ok)throw new Error(data.error||"Something went wrong");return data;}

const CartContext=React.createContext<{lines:CartLine[];add:(p:Product)=>void;setQty:(id:string,n:number)=>void;clear:()=>void}>({lines:[],add:()=>{},setQty:()=>{},clear:()=>{}});
export function StoreProvider({children}:{children:React.ReactNode}){const [lines,setLines]=useState<CartLine[]>(()=>{try{return JSON.parse(localStorage.getItem("dejoy-cart")||"[]")}catch{return[]}});useEffect(()=>localStorage.setItem("dejoy-cart",JSON.stringify(lines)),[lines]);const add=(p:Product)=>setLines(v=>{const x=v.find(l=>l.product.id===p.id);return x?v.map(l=>l.product.id===p.id?{...l,quantity:Math.min(l.quantity+1,p.inventory)}:l):[...v,{product:p,quantity:1}]});const setQty=(id:string,n:number)=>setLines(v=>v.flatMap(l=>l.product.id===id&&n<=0?[]:[l.product.id===id?{...l,quantity:Math.min(n,l.product.inventory)}:l]));return <CartContext.Provider value={{lines,add,setQty,clear:()=>setLines([])}}>{children}</CartContext.Provider>}
export const useCart=()=>React.useContext(CartContext);

function StoreShell({children}:{children:React.ReactNode}){const [s,setS]=useState<SettingsData|null>(null);const {lines}=useCart();useEffect(()=>{api<SettingsData>("/api/store").then(setS).catch(()=>{})},[]);return <div className="shop"><div className="shop-announcement">{s?.announcement||"Thoughtfully selected beauty essentials"}</div><nav className="shop-nav" aria-label="Store navigation"><Link to="/store" className="shop-wordmark">DE_JOY <small>STORE</small></Link><div><NavLink end to="/store">New & featured</NavLink><NavLink to="/collections/all">Shop all</NavLink><NavLink to="/collections/nail-care">Nail care</NavLink><NavLink to="/collections/press-ons">Press-ons</NavLink></div><div className="shop-tools"><Link to="/search" aria-label="Search"><Search/></Link><Link to="/cart" aria-label="Shopping bag"><ShoppingBag/><b>{lines.reduce((n,l)=>n+l.quantity,0)}</b></Link></div></nav>{children}<footer className="shop-footer"><div><b>DE_JOY STORE</b><p>Considered beauty essentials and signature nail pieces, curated in Abuja.</p></div><div><b>SHOP</b><Link to="/collections/all">All products</Link><Link to="/search">Search</Link><Link to="/cart">Your bag</Link></div><div><b>HELP</b><Link to="/shop/shipping">Shipping & delivery</Link><Link to="/shop/returns">Returns</Link><Link to="/shop/faq">FAQs</Link><Link to="/track-order">Track an order</Link></div><small>© 2026 PressCreates LLC. Store platform owned and operated independently.</small></footer></div>}
function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const cover = p.images[0];
  const alternate = p.images[1];
  const addToBag = () => {
    add(p);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };
  return (
    <article className="product-card">
      <Link to={`/store/${p.slug}`} className="product-media">
        {cover ? <img src={cover.url} alt={cover.alt_text || p.name} /> : <span>No image</span>}
        {alternate && <img className="product-image-alt" src={alternate.url} alt="" aria-hidden="true" />}
        {p.compare_at_price && <b>Sale</b>}
      </Link>
      <div>
        <small>{p.category || "DE_JOY EDIT"}</small>
        <Link to={`/store/${p.slug}`}><h3>{p.name}</h3></Link>
        <p>{money(p.price)} {p.compare_at_price && <del>{money(p.compare_at_price)}</del>}</p>
        <button className={`store-button ${added ? "added" : ""}`} disabled={!p.inventory || added} onClick={addToBag}>
          {added ? "Added to bag ✓" : p.inventory ? "Add to bag" : "Sold out"}
        </button>
      </div>
    </article>
  );
}
export function StoreHome(){const [products,setProducts]=useState<Product[]>([]);useEffect(()=>{api<{products:Product[]}>("/api/products").then(x=>setProducts(x.products))},[]);const categories=[...new Set(products.map(p=>p.category).filter(Boolean))];return <StoreShell><section className="store-hero"><div><span>THE DE_JOY STORE</span><h1>The art of beautiful<br/><em>finishing touches.</em></h1><p>Discover nail essentials, signature press-ons and considered beauty pieces curated to elevate your everyday ritual.</p><Link to="/collections/all" className="store-button">Shop new arrivals <ArrowRight/></Link></div></section><section className="shop-promises"><div><Truck/><span><b>Delivery across Nigeria</b><small>Confirmed after checkout</small></span></div><div><ShieldCheck/><span><b>Carefully selected</b><small>Quality-led essentials</small></span></div><div><Sparkles/><span><b>The DE_JOY standard</b><small>Distinctive, considered beauty</small></span></div></section><section className="collection-cards"><header><span>SHOP BY COLLECTION</span><h2>Find your finishing touch</h2></header><div>{(categories.length?categories:["Nail care","Press-ons","Beauty tools"]).slice(0,3).map((c,i)=><Link key={c} to={`/collections/${encodeURIComponent(collectionHandle(c))}`}><div className={`collection-art art-${i+1}`}/><span>COLLECTION {String(i+1).padStart(2,"0")}</span><h3>{c}</h3><p>Explore the edit <ArrowRight/></p></Link>)}</div></section><section id="collection" className="store-section"><header><span>CURATED FOR YOU</span><h2>New and noteworthy</h2><p>Fresh additions and DE_JOY favourites, selected with intention.</p></header><div className="product-grid">{products.slice(0,6).map(p=><ProductCard key={p.id} p={p}/>)}{!products.length&&<p className="empty">The first collection is being prepared.</p>}</div><div className="section-action"><Link className="store-button" to="/collections/all">View all products <ArrowRight/></Link></div></section><section className="shop-editorial"><div/><article><span>THE DE_JOY EDIT</span><h2>Thoughtful details.<br/>Effortless confidence.</h2><p>Every item earns its place through quality, usefulness and the ability to make your beauty ritual feel more considered.</p><Link to="/collections/all">Discover the collection <ArrowRight/></Link></article></section></StoreShell>}

function Catalogue({ title, category }: { title: string; category?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sort, setSort] = useState(category === "new-arrivals" ? "newest" : "featured");
  const [stock, setStock] = useState(false);
  const [collection, setCollection] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ products: Product[] }>("/api/products")
      .then((x) => setProducts(x.products))
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const routeCollection = category && !["all", "new-arrivals"].includes(category) ? category : "";
  const routeProducts = products.filter((p) => !routeCollection || collectionHandle(p.category) === routeCollection);
  let shown = routeProducts.filter((p) => {
    const handle = collectionHandle(p.category);
    const collectionMatch = routeCollection ? handle === routeCollection : collection === "all" || handle === collection;
    const priceNaira = p.price / 100;
    return collectionMatch &&
      (!stock || p.inventory > 0) &&
      (!minPrice || priceNaira >= Number(minPrice)) &&
      (!maxPrice || priceNaira <= Number(maxPrice));
  });

  shown = [...shown].sort((a, b) => {
    if (sort === "price-low") return a.price - b.price;
    if (sort === "price-high") return b.price - a.price;
    if (sort === "name-asc") return a.name.localeCompare(b.name);
    if (sort === "name-desc") return b.name.localeCompare(a.name);
    if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sort === "best-selling") return Number(b.sold_count || 0) - Number(a.sold_count || 0);
    return Number(b.featured) - Number(a.featured);
  });

  const hasFilters = stock || collection !== "all" || Boolean(minPrice) || Boolean(maxPrice);
  const clearFilters = () => {
    setStock(false);
    setCollection("all");
    setMinPrice("");
    setMaxPrice("");
  };

  return (
    <StoreShell>
      <section className="shop-all-head">
        <nav aria-label="Breadcrumb"><Link to="/store">Home</Link><span>•</span><span>Categories</span></nav>
        <h1>{title}</h1>
        <p>{category === "press-ons" ? "Salon-worthy artistry, sized for you and designed to wear beautifully." : "Explore every DE_JOY nail variation, from refined neutrals to expressive statement finishes."}</p>
      </section>
      <section className="shop-all-catalogue">
        <div className="shop-all-toolbar">
          <p><b>{shown.length}</b> {shown.length === 1 ? "product" : "products"}</p>
          <div>
            <label className="sort-control">
              <span>Sort by:</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="best-selling">Best selling</option>
                <option value="price-low">Price: Low to high</option>
                <option value="price-high">Price: High to low</option>
                <option value="name-asc">Alphabetically: A–Z</option>
                <option value="name-desc">Alphabetically: Z–A</option>
                <option value="oldest">Oldest</option>
              </select>
              <ChevronDown />
            </label>
            <button className="filter-toggle" onClick={() => setFiltersOpen((open) => !open)}>
              {filtersOpen ? "Hide filters" : "Show filters"} <Settings />
            </button>
          </div>
        </div>
        <div className={`shop-all-layout ${filtersOpen ? "filters-open" : ""}`}>
          <aside className="collection-filters" aria-label="Product filters">
            <div className="filter-heading"><b>Filters</b>{hasFilters && <button onClick={clearFilters}>Clear all</button>}</div>
            {!routeCollection && (
              <details open>
                <summary>Collection <ChevronDown /></summary>
                <div className="filter-options">
                  <label><input type="radio" name="collection" checked={collection === "all"} onChange={() => setCollection("all")} /><span>Shop all</span><small>{products.length}</small></label>
                  {categories.map((name) => {
                    const handle = collectionHandle(name);
                    return <label key={name}><input type="radio" name="collection" checked={collection === handle} onChange={() => setCollection(handle)} /><span>{name}</span><small>{products.filter((p) => p.category === name).length}</small></label>;
                  })}
                </div>
              </details>
            )}
            <details open>
              <summary>Availability <ChevronDown /></summary>
              <div className="filter-options">
                <label><input type="checkbox" checked={stock} onChange={(e) => setStock(e.target.checked)} /><span>In stock</span><small>{routeProducts.filter((p) => p.inventory > 0).length}</small></label>
              </div>
            </details>
            <details open>
              <summary>Price <ChevronDown /></summary>
              <div className="price-filter">
                <label><span>₦</span><input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="From" aria-label="Minimum price" /></label>
                <i>to</i>
                <label><span>₦</span><input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="To" aria-label="Maximum price" /></label>
              </div>
            </details>
            <details>
              <summary>Product type <ChevronDown /></summary>
              <div className="filter-options">
                <span className="filter-note">Nail sets and artistry collections</span>
              </div>
            </details>
          </aside>
          <main className="shop-all-results">
            {hasFilters && <div className="active-filter-row"><span>Filtered collection</span><button onClick={clearFilters}>Clear filters ×</button></div>}
            {loading ? (
              <div className="collection-loading"><div /><div /><div /></div>
            ) : shown.length ? (
              <div className="shop-all-grid">{shown.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            ) : (
              <div className="shop-all-empty"><Search /><h2>No products match these filters</h2><p>Try changing the collection, availability, or price range.</p><button className="store-button" onClick={clearFilters}>Clear filters</button></div>
            )}
          </main>
        </div>
        <section className="collection-service">
          <div><ShieldCheck /><b>Carefully selected</b><small>Quality-led essentials</small></div>
          <div><Truck /><b>Delivery across Nigeria</b><small>Confirmed after checkout</small></div>
          <div><Sparkles /><b>Personal service</b><small>Support directly from DE_JOY</small></div>
        </section>
      </section>
    </StoreShell>
  );
}
export function CollectionPage(){const {handle="all"}=useParams();const title=handle==="all"?"Shop all":handle.split("-").map(x=>x[0].toUpperCase()+x.slice(1)).join(" ");return <Catalogue title={title} category={handle}/>}
export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const q = params.get("q") || "";
  useEffect(() => {
    api<{ products: Product[] }>("/api/products").then((x) => setProducts(x.products)).finally(() => setLoading(false));
  }, []);
  const results = q ? products.filter((p) => `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q.toLowerCase())) : products.slice(0, 6);
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].slice(0, 6);
  return (
    <StoreShell>
      <section className="search-page upgraded-search">
        <span>SEARCH THE STORE</span>
        <h1>Find your next signature set</h1>
        <form onSubmit={(e) => { e.preventDefault(); const value = String(new FormData(e.currentTarget).get("q") || "").trim(); setParams(value ? { q: value } : {}); }}>
          <input name="q" defaultValue={q} placeholder="Search by style, finish, or collection" aria-label="Search products" autoFocus />
          <button aria-label="Search"><Search /></button>
        </form>
        {!q && categories.length > 0 && <div className="search-suggestions"><small>POPULAR COLLECTIONS</small><div>{categories.map((name) => <button key={name} onClick={() => setParams({ q: name })}>{name}</button>)}</div></div>}
        <header className="search-results-head"><h2>{q ? `Results for “${q}”` : "Explore the collection"}</h2><span>{q ? results.length : products.length} products</span></header>
        {loading ? <div className="collection-loading"><div /><div /><div /></div> : results.length ? <div className="product-grid">{results.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <div className="shop-all-empty"><Search /><h2>No matching products</h2><p>Try a broader style name or browse the complete collection.</p><Link className="store-button" to="/collections/all">Shop all nails</Link></div>}
      </section>
    </StoreShell>
  );
}
export function ShopInfo({type}:{type:"shipping"|"returns"|"faq"}){const content={shipping:{label:"SHIPPING & DELIVERY",title:"From our studio to your door",intro:"Orders are reviewed personally before delivery is arranged.",items:[["Where do you deliver?","Delivery is available across Nigeria. Timing and cost depend on your location and are confirmed after checkout."],["When will my order ship?","Available items are prepared after payment confirmation. Custom pieces may require additional production time."],["How do I receive updates?","We use the email and phone number supplied at checkout to confirm payment, delivery and fulfilment updates."]]},returns:{label:"RETURNS & EXCHANGES",title:"Purchase with confidence",intro:"We want every DE_JOY order to arrive as expected.",items:[["Can I return an item?","Contact us promptly after delivery. Eligibility depends on item condition, hygiene requirements and whether the piece was custom-made."],["What cannot be returned?","Used, opened hygiene-sensitive products and personalised or made-to-order pieces cannot normally be returned unless faulty."],["What if something is damaged?","Send clear photos and your order reference so the team can review the issue and arrange the appropriate resolution."]]},faq:{label:"FREQUENTLY ASKED QUESTIONS",title:"Everything you need to know",intro:"Quick answers about shopping with DE_JOY.",items:[["How do I pay?","Checkout creates your order request. The team then sends the approved offline payment instructions."],["Do I need an account?","No. You can shop and place an order as a guest."],["Can I change an order?","Contact the team immediately with your order reference. Changes depend on fulfilment status and availability."],["Are colours exact?","Screens and lighting can affect colour. Product photos are a close representation, but slight variation is possible."]]}}[type];return <StoreShell><section className="info-page"><span>{content.label}</span><h1>{content.title}</h1><p>{content.intro}</p><div>{content.items.map(([q,a])=><details key={q}><summary>{q}<Plus/></summary><p>{a}</p></details>)}</div></section></StoreShell>}
export function TrackOrder(){const [result,setResult]=useState<any>(null);const [error,setError]=useState("");async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);try{setResult(await api(`/api/orders/track?number=${encodeURIComponent(String(f.get("number")))}&email=${encodeURIComponent(String(f.get("email")))}`));setError("")}catch(x){setResult(null);setError((x as Error).message)}}return <StoreShell><section className="track-page"><span>ORDER STATUS</span><h1>Track your order</h1><p>Enter your order reference and the email used at checkout.</p><form onSubmit={submit}><label>Order reference<input name="number" required placeholder="e.g. 1024"/></label><label>Email address<input name="email" type="email" required/></label><button className="store-button">Check status</button></form>{error&&<p className="form-error">{error}</p>}{result&&<article><b>Order #{result.order_number}</b><h2>{result.fulfillment_status}</h2><p>Payment: {result.payment_status}</p><small>Placed {new Date(result.created_at).toLocaleDateString()}</small></article>}</section></StoreShell>}
export function ProductPage() {
  const { slug } = useParams();
  const [p, setP] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const { add } = useCart();

  useEffect(() => {
    setError("");
    api<Product>(`/api/products/${slug}`).then(setP).catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <StoreShell><section className="product-load-state"><AlertTriangle /><h1>Product unavailable</h1><p>{error}</p><Link className="store-button" to="/collections/all">Return to Shop All</Link></section></StoreShell>;
  if (!p) return <StoreShell><div className="product-detail-skeleton"><div /><div /></div></StoreShell>;

  const image = p.images[selectedImage] || p.images[0];
  const addSelection = () => {
    for (let index = 0; index < quantity; index += 1) add(p);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <StoreShell>
      <nav className="product-breadcrumb" aria-label="Breadcrumb"><Link to="/store">Home</Link><span>•</span><Link to="/collections/all">Shop all</Link><span>•</span><span>{p.name}</span></nav>
      <section className="product-detail">
        <div className="product-gallery">
          <div className="product-main-image">{image ? <img src={image.url} alt={image.alt_text || p.name} /> : <div className="empty">No image</div>}</div>
          {p.images.length > 1 && <div className="product-thumbnails" aria-label="Product images">{p.images.map((item, index) => <button key={item.id} className={selectedImage === index ? "active" : ""} onClick={() => setSelectedImage(index)} aria-label={`View image ${index + 1}`}><img src={item.url} alt="" /></button>)}</div>}
        </div>
        <div className="product-info">
          <span>{p.category}</span>
          <h1>{p.name}</h1>
          <h2>{money(p.price)} {p.compare_at_price && <del>{money(p.compare_at_price)}</del>}</h2>
          <p>{p.description || p.short_description}</p>
          <div className="product-purchase">
            <label>Quantity<div className="product-quantity"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus /></button><span>{quantity}</span><button type="button" onClick={() => setQuantity((value) => Math.min(p.inventory, value + 1))} aria-label="Increase quantity"><Plus /></button></div></label>
            <button className={`store-button wide ${added ? "added" : ""}`} disabled={!p.inventory || added} onClick={addSelection}>{added ? "Added to bag ✓" : p.inventory ? `Add to bag · ${money(p.price * quantity)}` : "Sold out"}</button>
          </div>
          <small className={p.inventory <= 5 ? "low-stock-note" : ""}>{p.inventory > 5 ? "In stock and ready to order" : p.inventory > 0 ? `Only ${p.inventory} available` : "Currently unavailable"}</small>
          <div className="product-assurances">
            <details open><summary>Product details <ChevronDown /></summary><p>{p.short_description || "A DE_JOY nail variation selected for a polished, confident finish."}</p></details>
            <details><summary>Delivery across Nigeria <ChevronDown /></summary><p>Delivery timing and cost are confirmed after checkout based on your location.</p></details>
            <details><summary>Personal support <ChevronDown /></summary><p>Questions about fit, finish, or your order are handled directly by the DE_JOY team.</p></details>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
export function CartPage() {
  const { lines, setQty } = useCart();
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  return (
    <StoreShell>
      <section className="cart-page">
        <div className="cart-title"><div><span>YOUR SELECTION</span><h1>Your bag</h1></div><Link to="/collections/all">Continue shopping <ArrowRight /></Link></div>
        {!lines.length ? (
          <div className="cart-empty-state"><ShoppingBag /><h2>Your bag is empty</h2><p>Explore the complete nail collection and find your next signature set.</p><Link className="store-button" to="/collections/all">Shop all nails</Link></div>
        ) : (
          <div className="cart-layout">
            <div className="cart-lines">
              {lines.map((line) => <article className="cart-line" key={line.product.id}>
                <Link to={`/store/${line.product.slug}`}>{line.product.images[0] ? <img src={line.product.images[0].url} alt={line.product.images[0].alt_text || line.product.name} /> : <div className="thumb" />}</Link>
                <div>
                  <small>{line.product.category}</small>
                  <Link to={`/store/${line.product.slug}`}><h3>{line.product.name}</h3></Link>
                  <p>{money(line.product.price)} each</p>
                  <div className="qty" aria-label={`Quantity for ${line.product.name}`}><button onClick={() => setQty(line.product.id, line.quantity - 1)} aria-label="Decrease quantity"><Minus /></button><span>{line.quantity}</span><button onClick={() => setQty(line.product.id, line.quantity + 1)} aria-label="Increase quantity"><Plus /></button></div>
                </div>
                <div className="cart-line-total"><b>{money(line.product.price * line.quantity)}</b><button aria-label={`Remove ${line.product.name}`} onClick={() => setQty(line.product.id, 0)}><Trash2 /></button></div>
              </article>)}
            </div>
            <aside>
              <h2>Order summary</h2>
              <p><span>Subtotal</span><b>{money(total)}</b></p>
              <p><span>Delivery</span><small>Confirmed after checkout</small></p>
              <div className="summary-total"><span>Estimated total</span><strong>{money(total)}</strong></div>
              <small>Payment and delivery instructions are confirmed personally after your order is reviewed.</small>
              <Link className="store-button wide" to="/checkout">Continue to checkout <ArrowRight /></Link>
              <div className="checkout-assurance"><ShieldCheck /><span><b>Personal confirmation</b><small>Your order is reviewed before payment.</small></span></div>
            </aside>
          </div>
        )}
      </section>
    </StoreShell>
  );
}
export function CheckoutPage() {
  const { lines, clear } = useCart();
  const nav = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const order = await api<{ order_number: string }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customer_name: fd.get("name"),
          customer_email: fd.get("email"),
          customer_phone: fd.get("phone"),
          delivery_address: fd.get("address"),
          notes: fd.get("notes"),
          items: lines.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
        }),
      });
      clear();
      nav(`/order-success?order=${order.order_number}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  if (!lines.length) return <CartPage />;
  return (
    <StoreShell>
      <section className="checkout">
        <form onSubmit={submit}>
          <span>SECURE CHECKOUT</span>
          <h1>Complete your order</h1>
          <p className="checkout-intro">Enter the details DE_JOY should use to confirm payment and delivery.</p>
          <div className="form-grid">
            <label>Full name<input name="name" autoComplete="name" required /></label>
            <label>Email<input name="email" type="email" autoComplete="email" required /></label>
            <label>Phone<input name="phone" type="tel" autoComplete="tel" required /></label>
            <label className="wide">Delivery address<textarea name="address" autoComplete="street-address" rows={4} required /></label>
            <label className="wide">Order notes <small>Optional</small><textarea name="notes" rows={3} placeholder="Fit, style, delivery, or special-request details" /></label>
          </div>
          <label className="checkout-consent"><input type="checkbox" required /><span>I agree to the <Link to="/terms">Terms of Use</Link> and acknowledge the <Link to="/privacy">Privacy Policy</Link>.</span></label>
          {error && <p className="form-error" role="alert"><AlertTriangle />{error}</p>}
          <button className="store-button wide" disabled={submitting}>{submitting ? "Placing your order…" : "Place order request"}</button>
          <small className="checkout-submit-note"><ShieldCheck /> No payment is collected on this screen.</small>
        </form>
        <aside>
          <h2>Your order</h2>
          <div className="checkout-lines">{lines.map((line) => <div className="checkout-line" key={line.product.id}>{line.product.images[0] && <img src={line.product.images[0].url} alt="" />}<span><b>{line.product.name}</b><small>Quantity {line.quantity}</small></span><strong>{money(line.product.price * line.quantity)}</strong></div>)}</div>
          <p className="checkout-total"><span>Total</span><b>{money(total)}</b></p>
          <small>Payment and fulfilment instructions follow after the DE_JOY team reviews your request.</small>
        </aside>
      </section>
    </StoreShell>
  );
}
export function OrderSuccess(){const q=new URLSearchParams(location.search);return <StoreShell><section className="success"><Package/><span>ORDER RECEIVED</span><h1>Thank you for your order.</h1><p>Your reference is <b>{q.get("order")}</b>. The DE_JOY team will contact you with offline payment and fulfilment details.</p><Link className="store-button" to="/store">Return to store</Link></section></StoreShell>}

type AdminProduct=Partial<Product>&{images?:Product["images"]};
export function Admin(){const [state,setState]=useState<"loading"|"setup"|"login"|"ready">("loading");const [tab,setTab]=useState("overview");const [admin,setAdmin]=useState<any>(null);useEffect(()=>{Promise.all([api<{configured:boolean}>("/api/setup/status"),api<any>("/api/admin/me").catch(()=>null)]).then(([s,me])=>{setAdmin(me);setState(me?"ready":s.configured?"login":"setup")})},[]);if(state==="loading")return <div className="admin-auth"><div className="admin-spinner"/>Preparing your workspace…</div>;if(state!=="ready")return <AdminAuth mode={state} onDone={()=>location.reload()}/>;const links=[['overview','Overview',<LayoutDashboard/>],['products','Products',<Package/>],['orders','Orders',<ShoppingBag/>],['settings','Settings',<Settings/>],['security','Security',<ShieldCheck/>]];return <div className="admin"><aside><div><Link className="logo" to="/"><b>DE_JOY</b><span>COMMERCE</span></Link><small>Store administration</small></div><nav>{links.map(([id,label,icon])=><button key={String(id)} className={tab===id?'active':''} onClick={()=>setTab(String(id))}>{icon}{label}</button>)}</nav><div className="admin-sidebar-bottom"><a href="/store" target="_blank">View live store <ExternalLink/></a><div className="admin-user"><span>{(admin?.displayName||admin?.email||'A').slice(0,1).toUpperCase()}</span><div><b>{admin?.displayName||'Store owner'}</b><small>{admin?.email}</small></div></div><button onClick={()=>api("/api/admin/logout",{method:"POST"}).then(()=>setState("login"))}><LogOut/>Sign out</button></div></aside><main>{tab==='overview'?<AdminOverview go={setTab}/>:tab==="products"?<AdminProducts/>:tab==="orders"?<AdminOrders/>:tab==="settings"?<AdminSettings/>:<AdminSecurity/>}</main></div>}
function AdminOverview({go}:{go:(tab:string)=>void}){const [data,setData]=useState<any>(null);const [error,setError]=useState('');useEffect(()=>{api('/api/admin/overview').then(setData).catch(e=>setError(e.message))},[]);if(error)return <div className="admin-notice error">{error}</div>;if(!data)return <div className="admin-skeleton">Loading dashboard…</div>;const m=data.metrics;return <><header className="admin-head dashboard-head"><div><span>STORE OVERVIEW</span><h1>Good day.</h1><p>Here’s what is happening across your store.</p></div><button className="store-button" onClick={()=>go('products')}><Plus/>Add product</button></header><section className="metric-grid"><article><div><span>Total orders</span><ShoppingBag/></div><strong>{m.orders}</strong><small>{m.pending_orders} awaiting action</small></article><article><div><span>Paid revenue</span><CircleDollarSign/></div><strong>{money(m.paid_revenue)}</strong><small>Confirmed offline payments</small></article><article><div><span>Active products</span><Package/></div><strong>{m.active_products}</strong><small>{m.draft_products} saved as draft</small></article><article><div><span>Inventory</span><TrendingUp/></div><strong>{m.inventory_units}</strong><small>Units currently available</small></article></section><section className="dashboard-grid"><article className="dashboard-panel"><header><div><span>RECENT ACTIVITY</span><h2>Latest orders</h2></div><button onClick={()=>go('orders')}>View all <ArrowRight/></button></header>{data.recent_orders.length?data.recent_orders.map((o:any)=><div className="recent-order" key={o.id}><span className={`status-dot ${o.fulfillment_status}`}/><div><b>Order #{o.order_number}</b><small>{o.customer_name} · {new Date(o.created_at).toLocaleDateString()}</small></div><strong>{money(o.total)}</strong><span className={`admin-badge ${o.payment_status}`}>{o.payment_status}</span></div>):<div className="admin-empty"><ShoppingBag/><b>No orders yet</b><p>New customer orders will appear here.</p></div>}</article><article className="dashboard-panel"><header><div><span>INVENTORY WATCH</span><h2>Low stock</h2></div><button onClick={()=>go('products')}>Manage <ArrowRight/></button></header>{data.low_stock.length?data.low_stock.map((p:any)=><div className="stock-row" key={p.id}><AlertTriangle/><div><b>{p.name}</b><small>{p.status}</small></div><strong>{p.inventory} left</strong></div>):<div className="admin-empty"><Package/><b>Inventory looks healthy</b><p>No products have five units or fewer.</p></div>}</article></section><section className="quick-actions"><span>QUICK ACTIONS</span><div><button onClick={()=>go('products')}><Plus/><b>Create product</b><small>Add an item to your catalogue</small></button><button onClick={()=>go('orders')}><ShoppingBag/><b>Review orders</b><small>Confirm payment and fulfilment</small></button><a href="/store" target="_blank"><ExternalLink/><b>Open storefront</b><small>View the customer experience</small></a></div></section></>}
function AdminAuth({mode,onDone}:{mode:"setup"|"login";onDone:()=>void}){const [error,setError]=useState("");async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);try{await api(mode==="setup"?"/api/setup":"/api/admin/login",{method:"POST",headers:mode==="setup"?{"x-setup-token":String(f.get("setup"))}:{},body:JSON.stringify({display_name:f.get("name"),email:f.get("email"),password:f.get("password")})});onDone()}catch(x){setError((x as Error).message)}}return <div className="admin-auth"><form onSubmit={submit}><span>DE_JOY STORE ADMIN</span><h1>{mode==="setup"?"Create the owner account":"Welcome back"}</h1>{mode==="setup"&&<><label>Owner name<input name="name" required/></label><label>Private setup key<input name="setup" type="password" required/></label></>}<label>Email<input name="email" type="email" required/></label><label>Password<input name="password" type="password" minLength={mode==="setup"?15:12} required/></label>{mode==="setup"&&<small>Use 15+ characters with uppercase, lowercase and a number.</small>}{error&&<p className="form-error">{error}</p>}<button className="store-button">{mode==="setup"?"Create owner":"Sign in"}</button></form></div>}
function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [edit, setEdit] = useState<AdminProduct | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const x = await api<{ products: Product[] }>("/api/admin/products");
    setItems(x.products);
    return x.products;
  };
  useEffect(() => {
    load();
  }, []);

  const visible = items.filter((p) => {
    const matchView = view === "all" || p.status === view;
    const haystack = `${p.name} ${p.category} ${p.slug}`.toLowerCase();
    return matchView && haystack.includes(query.toLowerCase());
  });
  const counts = {
    all: items.length,
    active: items.filter((p) => p.status === "active").length,
    draft: items.filter((p) => p.status === "draft").length,
    archived: items.filter((p) => p.status === "archived").length,
  };
  const categories = [...new Set(items.map((p) => p.category).filter(Boolean))];

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setNotice("");
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
    try {
      await api(
        edit?.id ? `/api/admin/products/${edit.id}` : "/api/admin/products",
        { method: edit?.id ? "PUT" : "POST", body: JSON.stringify(body) },
      );
      setEdit(null);
      await load();
      setNotice(edit?.id ? "Product updated." : "Product created.");
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`Permanently delete “${product.name}”? This cannot be undone.`)) return;
    await api(`/api/admin/products/${product.id}`, { method: "DELETE" });
    setEdit(null);
    setSelected((current) => current.filter((id) => id !== product.id));
    await load();
    setNotice("Product deleted.");
  }

  async function removeSelected() {
    if (!selected.length || !window.confirm(`Permanently delete ${selected.length} selected products?`)) return;
    await Promise.all(selected.map((id) => api(`/api/admin/products/${id}`, { method: "DELETE" })));
    setSelected([]);
    await load();
    setNotice("Selected products deleted.");
  }

  async function refreshEditor(productId: string) {
    const next = await load();
    const current = next.find((p) => p.id === productId);
    if (current) setEdit(current);
  }

  if (edit) {
    return (
      <section className="product-editor">
        <header className="admin-head product-editor-head">
          <div>
            <button className="back-link" onClick={() => setEdit(null)}>‹ Products</button>
            <h1>{edit.id ? edit.name : "Add product"}</h1>
            <p>{edit.id ? "Update product content, media, pricing and availability." : "Create a new item for the DE_JOY catalogue."}</p>
          </div>
          <div className="editor-head-actions">
            {edit.id && <a href={`/store/${edit.slug}`} target="_blank">Preview <ExternalLink /></a>}
            <button type="button" onClick={() => setEdit(null)}>Cancel</button>
            <button className="store-button" form="product-editor-form" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </header>
        <form id="product-editor-form" className="shopify-editor" onSubmit={save}>
          <div className="editor-primary">
            <section className="admin-card">
              <label>
                Title
                <input name="name" defaultValue={edit.name} placeholder="Short, recognizable product name" required />
              </label>
              <label>
                Description
                <textarea name="description" defaultValue={edit.description} rows={7} placeholder="Describe the finish, fit, materials and care." />
              </label>
              <label>
                Short description
                <input name="short" defaultValue={edit.short_description} placeholder="One-line storefront summary" />
              </label>
            </section>
            <section className="admin-card">
              <div className="card-title">
                <div><h2>Media</h2><p>Add images customers can inspect before checkout.</p></div>
              </div>
              {edit.id ? (
                <ImageManager product={edit as Product} onChange={() => refreshEditor(edit.id!)} />
              ) : (
                <div className="media-save-first"><ImagePlus /><b>Save this product to add media</b><span>You can upload up to 12 JPG, PNG, WebP or AVIF images.</span></div>
              )}
            </section>
            <section className="admin-card">
              <h2>Pricing</h2>
              <div className="form-grid">
                <label>
                  Price (NGN)
                  <div className="money-input"><span>₦</span><input name="price" type="number" min="0" step="0.01" defaultValue={(edit.price || 0) / 100} required /></div>
                </label>
                <label>
                  Compare-at price
                  <div className="money-input"><span>₦</span><input name="compare" type="number" min="0" step="0.01" defaultValue={edit.compare_at_price ? edit.compare_at_price / 100 : ""} /></div>
                </label>
              </div>
              <small className="field-help">Use compare-at price to display a markdown. Leave it blank when the product is not on sale.</small>
            </section>
            <section className="admin-card">
              <h2>Inventory</h2>
              <label>
                Quantity available
                <input name="inventory" type="number" min="0" defaultValue={edit.inventory} />
              </label>
            </section>
          </div>
          <aside className="editor-secondary">
            <section className="admin-card">
              <h2>Status</h2>
              <select name="status" defaultValue={edit.status || "draft"}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <p className="field-help">Only active products appear in the storefront.</p>
            </section>
            <section className="admin-card">
              <h2>Publishing</h2>
              <label className="switch-row">
                <span><b>Featured product</b><small>Prioritize this item in collections.</small></span>
                <input name="featured" type="checkbox" defaultChecked={edit.featured} />
              </label>
            </section>
            <section className="admin-card">
              <h2>Product organization</h2>
              <label>
                Category
                <input name="category" list="product-categories" defaultValue={edit.category} placeholder="e.g. Press-ons" />
                <datalist id="product-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist>
              </label>
              <label>
                URL handle
                <input name="slug" defaultValue={edit.slug} placeholder="Generated from title if blank" />
              </label>
            </section>
            {edit.id && (
              <section className="admin-card danger-card">
                <h2>Delete product</h2>
                <p>Permanently removes this product and its media from the catalogue.</p>
                <button type="button" onClick={() => removeProduct(edit as Product)}><Trash2 /> Delete product</button>
              </section>
            )}
          </aside>
        </form>
      </section>
    );
  }

  return (
    <>
      <header className="admin-head products-head">
        <div>
          <span>CATALOGUE</span>
          <h1>Products</h1>
          <p>Manage inventory, media, pricing and storefront availability.</p>
        </div>
        <button className="store-button" onClick={() => setEdit({ status: "draft", inventory: 0, price: 0, category: "Nail care", images: [] })}>
          <Plus /> Add product
        </button>
      </header>
      {notice && <div className="admin-notice success">{notice}<button onClick={() => setNotice("")}>×</button></div>}
      <section className="product-admin-card">
        <nav className="product-views" aria-label="Product status filters">
          {(["all", "active", "draft", "archived"] as const).map((id) => (
            <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}>
              {id[0].toUpperCase() + id.slice(1)} <span>{counts[id]}</span>
            </button>
          ))}
        </nav>
        <div className="product-toolbar">
          <label className="admin-search"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" /></label>
          <button className="filter-button"><span>Sort: Newest</span><ChevronDown /></button>
        </div>
        {selected.length > 0 && (
          <div className="bulk-bar">
            <b>{selected.length} selected</b>
            <button onClick={removeSelected}><Trash2 /> Delete products</button>
          </div>
        )}
        <div className="products-table" role="table" aria-label="Products">
          <div className="products-row products-columns" role="row">
            <label><input type="checkbox" checked={visible.length > 0 && visible.every((p) => selected.includes(p.id))} onChange={(e) => setSelected(e.target.checked ? visible.map((p) => p.id) : [])} /><span className="sr-only">Select all products</span></label>
            <span>Product</span><span>Status</span><span>Inventory</span><span>Category</span><span>Price</span><span></span>
          </div>
          {visible.map((p) => (
            <div className="products-row" role="row" key={p.id}>
              <label><input type="checkbox" checked={selected.includes(p.id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, p.id] : current.filter((id) => id !== p.id))} /><span className="sr-only">Select {p.name}</span></label>
              <button className="product-identity" onClick={() => setEdit(p)}>
                {p.images[0] ? <img src={p.images[0].url} alt="" /> : <div className="thumb"><ImagePlus /></div>}
                <span><b>{p.name}</b><small>{p.images.length} {p.images.length === 1 ? "image" : "images"}</small></span>
              </button>
              <span><b className={`product-status ${p.status}`}>{p.status}</b></span>
              <span className={p.inventory <= 5 ? "inventory-low" : ""}>{p.inventory} in stock</span>
              <span>{p.category || "Uncategorized"}</span>
              <b>{money(p.price)}</b>
              <button className="row-action" aria-label={`Edit ${p.name}`} onClick={() => setEdit(p)}>Edit</button>
            </div>
          ))}
          {!visible.length && (
            <div className="products-empty"><Package /><h2>No products found</h2><p>Adjust the filters or add a new product to the catalogue.</p></div>
          )}
        </div>
        <footer className="products-footer">Showing {visible.length} of {items.length} products</footer>
      </section>
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
  const [uploading, setUploading] = useState(false);
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = Math.max(0, 12 - (product.images?.length || 0));
    const f = new FormData();
    files.slice(0, remaining).forEach((file) => f.append("images", file));
    setUploading(true);
    try {
      await api(`/api/admin/products/${product.id}/images`, { method: "POST", body: f });
      onChange();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }
  return (
    <div className="image-manager">
      <div className="product-media-grid">
        {product.images?.map((image, index) => (
          <figure key={image.id} className={index === 0 ? "primary-media" : ""}>
            <img src={image.url} alt={image.alt_text || product.name} />
            {index === 0 && <figcaption>Primary</figcaption>}
            <button type="button" aria-label="Delete image" onClick={() => {
              if (window.confirm("Delete this product image?")) api(`/api/admin/images/${image.id}`, { method: "DELETE" }).then(onChange);
            }}><Trash2 /></button>
          </figure>
        ))}
        {(product.images?.length || 0) < 12 && (
          <label className="media-upload">
            <ImagePlus /><b>{uploading ? "Uploading…" : "Add media"}</b><span>Choose one or multiple images</span>
            <input hidden multiple disabled={uploading} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={upload} />
          </label>
        )}
      </div>
      <small className="field-help">{product.images?.length || 0} of 12 images. The first image is used as the storefront cover.</small>
    </div>
  );
}
function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [notice, setNotice] = useState("");
  const load = () => api<{ orders: any[] }>("/api/admin/orders").then((x) => setOrders(x.orders));
  useEffect(() => { load(); }, []);
  const shown = orders.filter((order) => {
    const searchable = `${order.order_number} ${order.customer_name} ${order.customer_email} ${order.customer_phone}`.toLowerCase();
    return (status === "all" || order.status === status) && searchable.includes(query.toLowerCase());
  });
  async function updateStatus(orderId: string, nextStatus: string) {
    await api(`/api/admin/orders/${orderId}/status`, { method: "PUT", body: JSON.stringify({ status: nextStatus }) });
    await load();
    setNotice("Order status updated.");
    window.setTimeout(() => setNotice(""), 1800);
  }
  return (
    <>
      <header className="admin-head products-head"><div><span>SALES</span><h1>Orders</h1><p>Review customer requests and manage fulfilment status.</p></div></header>
      {notice && <div className="admin-notice success">{notice}</div>}
      <section className="product-admin-card order-admin-card">
        <nav className="product-views">{["all", "pending", "confirmed", "fulfilled", "cancelled"].map((id) => <button key={id} className={status === id ? "active" : ""} onClick={() => setStatus(id)}>{id[0].toUpperCase() + id.slice(1)} <span>{id === "all" ? orders.length : orders.filter((order) => order.status === id).length}</span></button>)}</nav>
        <div className="product-toolbar"><label className="admin-search"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search orders, customers, email, or phone" /></label></div>
        <div className="admin-order-table">
          <div className="admin-order-row order-columns"><span>Order</span><span>Customer</span><span>Date</span><span>Total</span><span>Status</span></div>
          {shown.map((order) => <article className="admin-order-row" key={order.id}>
            <div><b>#{order.order_number}</b><small>{order.items?.length || 0} items</small></div>
            <div><b>{order.customer_name}</b><small>{order.customer_email}</small><small>{order.customer_phone}</small></div>
            <span>{new Date(order.created_at).toLocaleDateString()}</span>
            <b>{money(order.total)}</b>
            <select className={`order-status-select ${order.status}`} value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}>
              <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="fulfilled">Fulfilled</option><option value="cancelled">Cancelled</option>
            </select>
          </article>)}
          {!shown.length && <div className="products-empty"><ShoppingBag /><h2>No orders found</h2><p>New customer orders and matching search results will appear here.</p></div>}
        </div>
        <footer className="products-footer">Showing {shown.length} of {orders.length} orders</footer>
      </section>
    </>
  );
}
function AdminSettings(){const [s,setS]=useState<SettingsData|null>(null);const [saved,setSaved]=useState(false);useEffect(()=>{api<SettingsData>("/api/admin/settings").then(setS)},[]);if(!s)return null;async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);await api("/api/admin/settings",{method:"PUT",body:JSON.stringify(Object.fromEntries(f))});setSaved(true)}return <><header className="admin-head"><div><span>CONFIGURATION</span><h1>Store settings</h1></div></header><form className="admin-form settings-form" onSubmit={save}><label>Store name<input name="store_name" defaultValue={s.store_name}/></label><label>Announcement<input name="announcement" defaultValue={s.announcement}/></label><label>Contact email<input name="contact_email" type="email" defaultValue={s.contact_email}/></label><label>WhatsApp<input name="whatsapp" defaultValue={s.whatsapp}/></label><label>Offline payment instructions<textarea name="offline_payment_instructions" defaultValue={s.offline_payment_instructions}/></label><button className="store-button">Save settings</button>{saved&&<small>Saved successfully.</small>}</form></>}
function AdminSecurity(){const [data,setData]=useState<any>(null);const [notice,setNotice]=useState("");const load=()=>api<any>("/api/admin/security").then(setData);useEffect(()=>{load()},[]);async function change(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget,f=new FormData(form);try{await api("/api/admin/change-password",{method:"POST",body:JSON.stringify({currentPassword:f.get("current"),newPassword:f.get("next")})});form.reset();setNotice("Password updated and other sessions signed out.");await load()}catch(error){setNotice((error as Error).message)}}async function revoke(id:string){await api(`/api/admin/sessions/${id}`,{method:"DELETE"});setNotice("Session revoked.");await load()}return <><header className="admin-head"><div><span>ACCESS CONTROL</span><h1>Security</h1><p>Manage the owner password, signed-in devices and audit history.</p></div></header>{notice&&<div className="admin-notice success">{notice}<button onClick={()=>setNotice("")}>×</button></div>}<div className="security-grid"><form className="admin-card security-password" onSubmit={change}><h2>Change password</h2><p>Use at least 15 characters with uppercase, lowercase and a number.</p><label>Current password<input name="current" type="password" autoComplete="current-password" required/></label><label>New password<input name="next" type="password" autoComplete="new-password" minLength={15} required/></label><button className="store-button">Update password</button></form><section className="admin-card"><h2>Active sessions</h2>{data?.sessions?.map((s:any)=><article className="session-row" key={s.id}><div><b>{s.current?"This device":s.user_agent||"Unknown browser"}</b><small>{s.ip_address||"Unknown network"} · Last active {new Date(s.last_seen_at).toLocaleString()}</small></div>{!s.current&&<button onClick={()=>revoke(s.id)}>Revoke</button>}</article>)}</section></div><section className="admin-card audit-card"><h2>Recent security activity</h2>{data?.auditLogs?.map((log:any)=><article key={log.id}><span>{log.action.replaceAll("."," ")}</span><small>{log.entity_type}{log.entity_id?` · ${log.entity_id}`:""}</small><time>{new Date(log.created_at).toLocaleString()}</time></article>)}{data&&!data.auditLogs.length&&<p>No activity has been recorded yet.</p>}</section></>}
