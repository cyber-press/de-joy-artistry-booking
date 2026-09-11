import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import bcrypt from "bcryptjs";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import multer from "multer";
import pinoHttp from "pino-http";
import { z } from "zod";
import { createSession, enforceSameOrigin, hashToken, requireAdmin, SESSION_COOKIE } from "./auth.js";
import { migrate, pool, query } from "./db.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

app.set("trust proxy", 1);
app.use(pinoHttp({ genReqId: (req) => req.headers["x-request-id"]?.toString() || crypto.randomUUID() }));
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(enforceSameOrigin);
app.use("/uploads", express.static(uploadDir, { maxAge: "7d", immutable: true }));

const asyncRoute = (handler: express.RequestHandler): express.RequestHandler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const productSchema = z.object({ name: z.string().min(2).max(120), slug: z.string().max(140).optional(), short_description:z.string().max(300).default(""), description: z.string().max(5000).default(""), price: z.coerce.number().int().min(0), compare_at_price: z.coerce.number().int().min(0).nullable().optional(), inventory: z.coerce.number().int().min(0).default(0), status: z.enum(["draft", "active", "archived"]).default("draft"), category: z.string().max(80).default("Nail care"), featured: z.boolean().default(false) });
const credentialsSchema = z.object({ email: z.string().email().transform(v => v.toLowerCase()), password: z.string().min(12).max(128), displayName: z.string().min(2).max(80).default("Store Owner") });

async function products(includePrivate = false) {
  const result = await query(`SELECT p.id,p.title name,p.slug,p.description,p.description short_description,p.price_minor price,p.compare_at_minor compare_at_price,p.inventory,p.status,p.category,p.featured,p.created_at,p.updated_at,COALESCE(json_agg(json_build_object('id',i.id,'url',i.url,'alt_text',i.alt_text,'position',i.position) ORDER BY i.position) FILTER (WHERE i.id IS NOT NULL),'[]') images FROM products p LEFT JOIN product_images i ON i.product_id=p.id ${includePrivate ? "" : "WHERE p.status='active'"} GROUP BY p.id ORDER BY p.featured DESC,p.created_at DESC`);
  return result.rows;
}

app.get("/api/health", asyncRoute(async (_req, res) => { await query("SELECT 1"); res.json({ status: "ok", service: "dejoy-store" }); }));
app.get("/api/store", asyncRoute(async (_req, res) => {
  const [items, settings] = await Promise.all([products(false), query("SELECT key,value FROM store_settings")]);
  const raw=Object.fromEntries(settings.rows.map((row: any) => [row.key, row.value])); const store=raw.store||{},contact=raw.contact||{};
  res.json({ products: items, store_name:store.name,announcement:store.announcement,offline_payment_instructions:store.offlineInstructions,whatsapp:contact.whatsapp,contact_email:contact.email });
}));
app.get("/api/products", asyncRoute(async (_req,res)=>res.json({products:await products(false)})));
app.get("/api/products/:slug", asyncRoute(async (req, res) => {
  const result = await query(`SELECT p.id,p.title name,p.slug,p.description,p.description short_description,p.price_minor price,p.compare_at_minor compare_at_price,p.inventory,p.status,p.category,p.featured,COALESCE(json_agg(json_build_object('id',i.id,'url',i.url,'alt_text',i.alt_text,'position',i.position) ORDER BY i.position) FILTER (WHERE i.id IS NOT NULL),'[]') images FROM products p LEFT JOIN product_images i ON i.product_id=p.id WHERE p.slug=$1 AND p.status='active' GROUP BY p.id`, [req.params.slug]);
  if (!result.rowCount) return res.status(404).json({ error: "Product not found" });
  res.json(result.rows[0]);
}));

const setupStatus=asyncRoute(async (_req, res) => { const r = await query("SELECT EXISTS(SELECT 1 FROM admins) configured"); res.json(r.rows[0]); });
app.get("/api/admin/setup-status",setupStatus); app.get("/api/setup/status",setupStatus);
const setupOwner=asyncRoute(async (req, res) => {
  const count = await query("SELECT EXISTS(SELECT 1 FROM admins) configured");
  if ((count.rows[0] as any).configured) return res.status(409).json({ error: "Owner setup is already complete" });
  if (!process.env.SETUP_TOKEN || req.get("x-setup-token") !== process.env.SETUP_TOKEN) return res.status(403).json({ error: "Invalid owner setup key" });
  const input = credentialsSchema.parse({email:req.body.email,password:req.body.password,displayName:req.body.display_name||req.body.displayName});
  const id = crypto.randomUUID();
  await query("INSERT INTO admins (id,email,password_hash,display_name,role) VALUES ($1,$2,$3,$4,'owner')", [id, input.email, await bcrypt.hash(input.password, 12), input.displayName]);
  await createSession(id, res); res.status(201).json({ id, email: input.email, displayName: input.displayName, role: "owner" });
}); app.post("/api/admin/setup",setupOwner); app.post("/api/setup",setupOwner);
app.post("/api/admin/login", asyncRoute(async (req, res) => {
  const input = credentialsSchema.pick({ email: true, password: true }).parse(req.body);
  const result = await query<any>("SELECT * FROM admins WHERE email=$1", [input.email]);
  if (!result.rowCount || !(await bcrypt.compare(input.password, result.rows[0].password_hash))) return res.status(401).json({ error: "Invalid email or password" });
  await createSession(result.rows[0].id, res); res.json({ id: result.rows[0].id, email: result.rows[0].email, displayName: result.rows[0].display_name, role: result.rows[0].role });
}));
app.post("/api/admin/logout", requireAdmin, asyncRoute(async (req, res) => { const token = req.cookies?.[SESSION_COOKIE]; if (token) await query("DELETE FROM admin_sessions WHERE token_hash=$1", [hashToken(token)]); res.clearCookie(SESSION_COOKIE, { path: "/" }); res.status(204).end(); }));
app.get("/api/admin/me", requireAdmin, (req, res) => res.json(req.admin));
app.get("/api/admin/overview",requireAdmin,asyncRoute(async(_req,res)=>{const [metrics,recent,lowStock]=await Promise.all([query(`SELECT (SELECT COUNT(*)::int FROM orders) orders,(SELECT COUNT(*)::int FROM orders WHERE fulfillment_status='unfulfilled') pending_orders,(SELECT COALESCE(SUM(total_minor),0)::int FROM orders WHERE payment_status='paid') paid_revenue,(SELECT COUNT(*)::int FROM products WHERE status='active') active_products,(SELECT COUNT(*)::int FROM products WHERE status='draft') draft_products,(SELECT COALESCE(SUM(inventory),0)::int FROM products WHERE status<>'archived') inventory_units`),query(`SELECT id,order_number,customer_name,total_minor total,payment_status,fulfillment_status,created_at FROM orders ORDER BY created_at DESC LIMIT 6`),query(`SELECT id,title name,inventory,status FROM products WHERE track_inventory=true AND status<>'archived' AND inventory<=5 ORDER BY inventory ASC,title LIMIT 8`)]);res.json({metrics:metrics.rows[0],recent_orders:recent.rows,low_stock:lowStock.rows});}));
app.get("/api/admin/products", requireAdmin, asyncRoute(async (_req, res) => res.json({products:await products(true)})));
app.post("/api/admin/products", requireAdmin, asyncRoute(async (req, res) => {
  const input = productSchema.parse(req.body), id = crypto.randomUUID(), slug = slugify(input.slug || input.name);
  const r = await query("INSERT INTO products (id,title,slug,description,price_minor,compare_at_minor,inventory,status,category,featured) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *", [id,input.name,slug,input.description||input.short_description,input.price,input.compare_at_price ?? null,input.inventory,input.status,input.category||"Nail care",input.featured]);
  res.status(201).json(r.rows[0]);
}));
app.put("/api/admin/products/:id", requireAdmin, asyncRoute(async (req, res) => {
  const input = productSchema.parse(req.body), slug = slugify(input.slug || input.name);
  const r = await query("UPDATE products SET title=$2,slug=$3,description=$4,price_minor=$5,compare_at_minor=$6,inventory=$7,status=$8,category=$9,featured=$10,updated_at=now() WHERE id=$1 RETURNING *", [req.params.id,input.name,slug,input.description||input.short_description,input.price,input.compare_at_price ?? null,input.inventory,input.status,input.category||"Nail care",input.featured]);
  if (!r.rowCount) return res.status(404).json({ error: "Product not found" }); res.json(r.rows[0]);
}));
app.delete("/api/admin/products/:id", requireAdmin, asyncRoute(async (req, res) => { const r = await query("UPDATE products SET status='archived',updated_at=now() WHERE id=$1 RETURNING id", [req.params.id]); if (!r.rowCount) return res.status(404).json({ error: "Product not found" }); res.status(204).end(); }));

const upload = multer({ storage: multer.diskStorage({ destination: uploadDir, filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`) }), limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, ["image/jpeg","image/png","image/webp","image/avif"].includes(file.mimetype)) });
app.post("/api/admin/products/:id/images", requireAdmin, upload.any(), asyncRoute(async (req, res) => {
  const files = req.files as Express.Multer.File[]; const existing = await query<any>("SELECT COALESCE(MAX(position),-1) position FROM product_images WHERE product_id=$1", [req.params.id]);
  const saved=[]; for (const [index,file] of files.entries()) { const r=await query("INSERT INTO product_images (id,product_id,url,alt_text,position) VALUES ($1,$2,$3,$4,$5) RETURNING *", [crypto.randomUUID(),req.params.id,`/uploads/${file.filename}`,req.body.altText || "Product image",existing.rows[0].position+index+1]); saved.push(r.rows[0]); } res.status(201).json(saved);
}));
app.delete("/api/admin/images/:id", requireAdmin, asyncRoute(async (req, res) => { const r=await query<any>("DELETE FROM product_images WHERE id=$1 RETURNING url", [req.params.id]); if (!r.rowCount) return res.status(404).json({ error: "Image not found" }); const file=path.join(uploadDir,path.basename(r.rows[0].url)); fs.promises.unlink(file).catch(()=>{}); res.status(204).end(); }));

app.get("/api/admin/orders", requireAdmin, asyncRoute(async (_req, res) => { const r=await query(`SELECT o.*,o.total_minor total,(CASE WHEN o.fulfillment_status='unfulfilled' THEN 'pending' WHEN o.fulfillment_status='processing' THEN 'confirmed' ELSE o.fulfillment_status END) status,COALESCE(json_agg(oi ORDER BY oi.id) FILTER(WHERE oi.id IS NOT NULL),'[]') items FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id GROUP BY o.id ORDER BY o.created_at DESC`); res.json({orders:r.rows}); }));
app.put("/api/admin/orders/:id/status",requireAdmin,asyncRoute(async(req,res)=>{const status=z.enum(["pending","confirmed","fulfilled","cancelled"]).parse(req.body.status);const mapped=status==="pending"?"unfulfilled":status==="confirmed"?"processing":status;const r=await query("UPDATE orders SET fulfillment_status=$2,updated_at=now() WHERE id=$1 RETURNING *",[req.params.id,mapped]);res.json(r.rows[0]);}));
app.patch("/api/admin/orders/:id", requireAdmin, asyncRoute(async (req, res) => { const input=z.object({paymentStatus:z.enum(["pending","paid","failed","refunded"]),fulfillmentStatus:z.enum(["unfulfilled","processing","fulfilled","cancelled"])}).parse(req.body); const r=await query("UPDATE orders SET payment_status=$2,fulfillment_status=$3,updated_at=now() WHERE id=$1 RETURNING *",[req.params.id,input.paymentStatus,input.fulfillmentStatus]); res.json(r.rows[0]); }));
app.get("/api/admin/settings", requireAdmin, asyncRoute(async (_req,res)=>{const r=await query("SELECT key,value FROM store_settings");const raw=Object.fromEntries(r.rows.map((x:any)=>[x.key,x.value])),s=raw.store||{},c=raw.contact||{};res.json({store_name:s.name,announcement:s.announcement,offline_payment_instructions:s.offlineInstructions,whatsapp:c.whatsapp,contact_email:c.email});}));
app.put("/api/admin/settings", requireAdmin, asyncRoute(async (req,res)=>{const b=req.body;await query("UPDATE store_settings SET value=$2,updated_at=now() WHERE key=$1",["store",{name:b.store_name,announcement:b.announcement,offlineInstructions:b.offline_payment_instructions,currency:"NGN"}]);await query("UPDATE store_settings SET value=$2,updated_at=now() WHERE key=$1",["contact",{whatsapp:b.whatsapp,email:b.contact_email}]);res.json(b);}));

app.post("/api/orders", asyncRoute(async (req, res) => {
  const b=req.body; const input=z.object({customerName:z.string().min(2).max(100),customerEmail:z.string().email(),customerPhone:z.string().min(7).max(30),deliveryAddress:z.string().min(10).max(500),notes:z.string().max(1000).default(""),items:z.array(z.object({productId:z.string().uuid(),quantity:z.number().int().min(1).max(50)})).min(1)}).parse({customerName:b.customer_name,customerEmail:b.customer_email,customerPhone:b.customer_phone,deliveryAddress:b.delivery_address,notes:b.notes||"",items:(b.items||[]).map((x:any)=>({productId:x.product_id,quantity:x.quantity}))});
  const client=await pool.connect(); try { await client.query("BEGIN"); let subtotal=0; const lines=[]; for(const item of input.items){const r=await client.query("SELECT * FROM products WHERE id=$1 AND status='active' FOR UPDATE",[item.productId]);if(!r.rowCount) throw new Error("A product is no longer available");const p=r.rows[0];if(p.track_inventory&&p.inventory<item.quantity) throw new Error(`${p.title} does not have enough inventory`);const total=p.price_minor*item.quantity;subtotal+=total;lines.push({...item,title:p.title,unitPrice:p.price_minor,lineTotal:total});if(p.track_inventory)await client.query("UPDATE products SET inventory=inventory-$2 WHERE id=$1",[p.id,item.quantity]);} const orderId=crypto.randomUUID();const order=await client.query("INSERT INTO orders(id,customer_name,customer_email,customer_phone,delivery_address,customer_notes,subtotal_minor,total_minor) VALUES($1,$2,$3,$4,$5,$6,$7,$7) RETURNING *",[orderId,input.customerName,input.customerEmail.toLowerCase(),input.customerPhone,input.deliveryAddress,input.notes,subtotal]);for(const line of lines)await client.query("INSERT INTO order_items(id,order_id,product_id,title,quantity,unit_price_minor,line_total_minor) VALUES($1,$2,$3,$4,$5,$6,$7)",[crypto.randomUUID(),orderId,line.productId,line.title,line.quantity,line.unitPrice,line.lineTotal]);await client.query("COMMIT");res.status(201).json(order.rows[0]); } catch(error){await client.query("ROLLBACK");throw error;} finally{client.release();}
}));
app.get("/api/orders/track",asyncRoute(async(req,res)=>{const input=z.object({number:z.coerce.number().int().positive(),email:z.string().email()}).parse(req.query);const r=await query("SELECT order_number,payment_status,fulfillment_status,created_at,updated_at FROM orders WHERE order_number=$1 AND lower(customer_email)=lower($2)",[input.number,input.email]);if(!r.rowCount)return res.status(404).json({error:"We could not find an order matching those details"});res.json(r.rows[0]);}));

if (process.env.NODE_ENV === "production") { app.use(express.static(path.resolve("dist"))); app.use((_req,res)=>res.sendFile(path.resolve("dist/index.html"))); }
app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => { req.log.error({ err:error },"request failed"); if(error instanceof z.ZodError) return res.status(400).json({error:"Please check the submitted information",issues:error.issues}); res.status(error.code==="23505"?409:500).json({error:error.code==="23505"?"That value is already in use":error.message||"Unexpected server error"}); });

await migrate();
app.listen(port, () => console.log(`DE_JOY store listening on ${port}`));
