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
import { createSession, enforceSameOrigin, hashToken, passwordPolicy, requireAdmin, requireOwner, sessionCookieOptions, SESSION_COOKIE } from "./auth.js";
import { audit } from "./audit.js";
import { gatewayReadiness, initializeGateway, paymentReference, validFlutterwaveSignature, validPaystackSignature, verifyGateway, type GatewaySettings, type Provider } from "./payments.js";
import { rateLimit, safeRequestId } from "./security.js";
import { migrate, pool, query } from "./db.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(pinoHttp({ genReqId: (req) => safeRequestId(req.headers["x-request-id"]) }));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));
app.use(compression());
app.use(express.json({ limit: "1mb", verify: (req, _res, buffer) => { (req as express.Request).rawBody = Buffer.from(buffer); } }));
app.use(cookieParser());
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use(enforceSameOrigin);
app.use("/uploads", express.static(uploadDir, { maxAge: "7d", immutable: true }));

const asyncRoute = (handler: express.RequestHandler): express.RequestHandler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const productSchema = z.object({ name: z.string().min(2).max(120), slug: z.string().max(140).optional(), short_description:z.string().max(300).default(""), description: z.string().max(5000).default(""), price: z.coerce.number().int().min(0), compare_at_price: z.coerce.number().int().min(0).nullable().optional(), inventory: z.coerce.number().int().min(0).default(0), status: z.enum(["draft", "active", "archived"]).default("draft"), category: z.string().max(80).default("Nail care"), featured: z.boolean().default(false) });
const credentialsSchema = z.object({ email: z.string().email().transform(v => v.toLowerCase()), password: z.string().min(12).max(128), displayName: z.string().min(2).max(80).default("Store Owner") });
const dummyPasswordHash = "$2b$12$sG7akeqYgzjCFBDebW3qpeQx32zaIiDH4LOcY6ep1hiBwA8aypq4e";
const paymentSettingsSchema=z.object({activeProvider:z.enum(["paystack","flutterwave"]),paystackEnabled:z.boolean(),flutterwaveEnabled:z.boolean(),manualEnabled:z.boolean(),mode:z.enum(["test","live"]),manualLabel:z.string().min(2).max(60),bankName:z.string().max(100),accountName:z.string().max(120),accountNumber:z.string().max(30).regex(/^[0-9]*$/),instructions:z.string().max(1000)});
const paymentSettings=async()=>{const r=await query<any>("SELECT value FROM store_settings WHERE key='payments'");return paymentSettingsSchema.parse(r.rows[0]?.value||{activeProvider:"paystack",paystackEnabled:true,flutterwaveEnabled:true,manualEnabled:true,mode:"test",manualLabel:"Bank transfer",bankName:"",accountName:"",accountNumber:"",instructions:"Payment instructions will be confirmed after checkout."});};

async function products(includePrivate = false) {
  const result = await query(`SELECT p.id,p.title name,p.slug,p.description,p.description short_description,p.price_minor price,p.compare_at_minor compare_at_price,p.inventory,p.status,p.category,p.featured,p.created_at,p.updated_at,COALESCE(oi_totals.sold_count,0)::int sold_count,COALESCE(json_agg(json_build_object('id',i.id,'url',i.url,'alt_text',i.alt_text,'position',i.position) ORDER BY i.position) FILTER (WHERE i.id IS NOT NULL),'[]') images FROM products p LEFT JOIN (SELECT product_id,SUM(quantity)::int sold_count FROM order_items GROUP BY product_id) oi_totals ON oi_totals.product_id=p.id LEFT JOIN product_images i ON i.product_id=p.id ${includePrivate ? "" : "WHERE p.status='active'"} GROUP BY p.id,oi_totals.sold_count ORDER BY p.featured DESC,p.created_at DESC`);
  return result.rows;
}

app.get("/api/health", asyncRoute(async (_req, res) => { await query("SELECT 1"); res.json({ status: "ok", service: "dejoy-store" }); }));
app.get("/api/store", asyncRoute(async (_req, res) => {
  const [items, settings] = await Promise.all([products(false), query("SELECT key,value FROM store_settings")]);
  const raw=Object.fromEntries(settings.rows.map((row: any) => [row.key, row.value])); const store=raw.store||{},contact=raw.contact||{};
  res.json({ products: items, store_name:store.name,announcement:store.announcement,offline_payment_instructions:store.offlineInstructions,whatsapp:contact.whatsapp,contact_email:contact.email });
}));
app.get("/api/products", asyncRoute(async (_req,res)=>res.json({products:await products(false)})));
app.get("/api/payment-methods",asyncRoute(async(_req,res)=>{const s=await paymentSettings(),ready=gatewayReadiness(s);res.json({activeProvider:s.activeProvider,mode:s.mode,methods:[...(s.paystackEnabled&&ready.paystack.configured?[{id:"paystack",label:"Paystack",online:true}]:[]),...(s.flutterwaveEnabled&&ready.flutterwave.configured?[{id:"flutterwave",label:"Flutterwave",online:true}]:[]),...(s.manualEnabled?[{id:"manual",label:s.manualLabel,online:false,instructions:s.instructions,bankName:s.bankName,accountName:s.accountName,accountNumber:s.accountNumber}]:[])]});}));
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
  if (!passwordPolicy(input.password)) return res.status(400).json({ error: "Use at least 15 characters with uppercase, lowercase and a number" });
  const id = crypto.randomUUID();
  await query("INSERT INTO admins (id,email,password_hash,display_name,role) VALUES ($1,$2,$3,$4,'owner')", [id, input.email, await bcrypt.hash(input.password, 12), input.displayName]);
  await createSession(id, req, res); await audit(req, "owner.setup", "admin", id); res.status(201).json({ id, email: input.email, displayName: input.displayName, role: "owner" });
}); app.post("/api/admin/setup",rateLimit("owner-setup",5,15*60_000),setupOwner); app.post("/api/setup",rateLimit("owner-setup",5,15*60_000),setupOwner);
app.post("/api/admin/login", rateLimit("admin-login",10,15*60_000), asyncRoute(async (req, res) => {
  const input = credentialsSchema.pick({ email: true, password: true }).parse(req.body);
  const result = await query<any>("SELECT * FROM admins WHERE email=$1", [input.email]);
  const valid = await bcrypt.compare(input.password, result.rowCount ? result.rows[0].password_hash : dummyPasswordHash);
  if (!result.rowCount || !valid) { await audit(req,"auth.login_failed","admin",undefined,{email:input.email}); return res.status(401).json({ error: "Invalid email or password" }); }
  await createSession(result.rows[0].id, req, res); req.admin={id:result.rows[0].id,email:result.rows[0].email,displayName:result.rows[0].display_name,role:result.rows[0].role,sessionId:""}; await audit(req,"auth.login","admin",result.rows[0].id); res.json({ id: result.rows[0].id, email: result.rows[0].email, displayName: result.rows[0].display_name, role: result.rows[0].role });
}));
app.post("/api/admin/logout", requireAdmin, asyncRoute(async (req, res) => { const token = req.cookies?.[SESSION_COOKIE]; if (token) await query("DELETE FROM admin_sessions WHERE token_hash=$1", [hashToken(token)]); res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions, maxAge: undefined }); res.status(204).end(); }));
app.get("/api/admin/me", requireAdmin, (req, res) => res.json(req.admin));
app.get("/api/admin/security", requireAdmin, requireOwner, asyncRoute(async (req,res)=>{const [sessions,logs]=await Promise.all([query("SELECT id,created_at,last_seen_at,expires_at,ip_address,user_agent,(id=$2) current FROM admin_sessions WHERE admin_id=$1 AND expires_at>now() ORDER BY last_seen_at DESC",[req.admin!.id,req.admin!.sessionId]),query("SELECT id,action,entity_type,entity_id,metadata,ip_address,created_at FROM admin_audit_logs ORDER BY created_at DESC LIMIT 100")]);res.json({sessions:sessions.rows,auditLogs:logs.rows});}));
app.get("/api/admin/payment-settings",requireAdmin,requireOwner,asyncRoute(async(_req,res)=>{const settings=await paymentSettings(),readiness=gatewayReadiness(settings);const transactions=await query("SELECT pt.id,pt.reference,pt.provider,pt.amount_minor,pt.currency,pt.status,pt.created_at,o.order_number FROM payment_transactions pt JOIN orders o ON o.id=pt.order_id ORDER BY pt.created_at DESC LIMIT 25");res.json({settings,readiness,transactions:transactions.rows,webhooks:{paystack:Boolean(process.env.PAYSTACK_WEBHOOK_SECRET),flutterwave:Boolean(process.env.FLUTTERWAVE_WEBHOOK_HASH)}});}));
app.put("/api/admin/payment-settings",requireAdmin,requireOwner,asyncRoute(async(req,res)=>{const settings=paymentSettingsSchema.parse(req.body);if(!settings.paystackEnabled&&!settings.flutterwaveEnabled&&!settings.manualEnabled)return res.status(400).json({error:"Enable at least one payment method"});if(settings.activeProvider==="paystack"&&!settings.paystackEnabled||settings.activeProvider==="flutterwave"&&!settings.flutterwaveEnabled)return res.status(400).json({error:"The active gateway must be enabled"});await query("INSERT INTO store_settings(key,value,updated_at) VALUES('payments',$1,now()) ON CONFLICT(key) DO UPDATE SET value=$1,updated_at=now()",[settings]);await audit(req,"payments.settings_updated","store","payments",{activeProvider:settings.activeProvider,mode:settings.mode});res.json({settings,readiness:gatewayReadiness(settings)});}));
app.delete("/api/admin/sessions/:id",requireAdmin,requireOwner,asyncRoute(async(req,res)=>{const sessionId=String(req.params.id);if(sessionId===req.admin!.sessionId)return res.status(400).json({error:"Use sign out to end the current session"});await query("DELETE FROM admin_sessions WHERE id=$1 AND admin_id=$2",[sessionId,req.admin!.id]);await audit(req,"session.revoked","session",sessionId);res.status(204).end();}));
app.post("/api/admin/change-password",requireAdmin,requireOwner,rateLimit("change-password",5,60*60_000),asyncRoute(async(req,res)=>{const input=z.object({currentPassword:z.string().max(128),newPassword:z.string().max(128).refine(passwordPolicy,"Use at least 15 characters with uppercase, lowercase and a number")}).parse(req.body);const row=await query<any>("SELECT password_hash FROM admins WHERE id=$1",[req.admin!.id]);if(!row.rowCount||!await bcrypt.compare(input.currentPassword,row.rows[0].password_hash))return res.status(400).json({error:"Current password is incorrect"});await query("UPDATE admins SET password_hash=$2,updated_at=now() WHERE id=$1",[req.admin!.id,await bcrypt.hash(input.newPassword,12)]);await query("DELETE FROM admin_sessions WHERE admin_id=$1 AND id<>$2",[req.admin!.id,req.admin!.sessionId]);await audit(req,"password.changed","admin",req.admin!.id);res.status(204).end();}));
app.get("/api/admin/overview",requireAdmin,asyncRoute(async(_req,res)=>{const [metrics,recent,lowStock]=await Promise.all([query(`SELECT (SELECT COUNT(*)::int FROM orders) orders,(SELECT COUNT(*)::int FROM orders WHERE fulfillment_status='unfulfilled') pending_orders,(SELECT COALESCE(SUM(total_minor),0)::int FROM orders WHERE payment_status='paid') paid_revenue,(SELECT COUNT(*)::int FROM products WHERE status='active') active_products,(SELECT COUNT(*)::int FROM products WHERE status='draft') draft_products,(SELECT COALESCE(SUM(inventory),0)::int FROM products WHERE status<>'archived') inventory_units`),query(`SELECT id,order_number,customer_name,total_minor total,payment_status,fulfillment_status,created_at FROM orders ORDER BY created_at DESC LIMIT 6`),query(`SELECT id,title name,inventory,status FROM products WHERE track_inventory=true AND status<>'archived' AND inventory<=5 ORDER BY inventory ASC,title LIMIT 8`)]);res.json({metrics:metrics.rows[0],recent_orders:recent.rows,low_stock:lowStock.rows});}));
app.get("/api/admin/products", requireAdmin, asyncRoute(async (_req, res) => res.json({products:await products(true)})));
app.post("/api/admin/products", requireAdmin, asyncRoute(async (req, res) => {
  const input = productSchema.parse(req.body), id = crypto.randomUUID(), slug = slugify(input.slug || input.name);
  const r = await query("INSERT INTO products (id,title,slug,description,price_minor,compare_at_minor,inventory,status,category,featured) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *", [id,input.name,slug,input.description||input.short_description,input.price,input.compare_at_price ?? null,input.inventory,input.status,input.category||"Nail care",input.featured]);
  await audit(req,"product.created","product",id,{status:input.status}); res.status(201).json(r.rows[0]);
}));
app.put("/api/admin/products/:id", requireAdmin, asyncRoute(async (req, res) => {
  const input = productSchema.parse(req.body), slug = slugify(input.slug || input.name);
  const r = await query("UPDATE products SET title=$2,slug=$3,description=$4,price_minor=$5,compare_at_minor=$6,inventory=$7,status=$8,category=$9,featured=$10,updated_at=now() WHERE id=$1 RETURNING *", [req.params.id,input.name,slug,input.description||input.short_description,input.price,input.compare_at_price ?? null,input.inventory,input.status,input.category||"Nail care",input.featured]);
  if (!r.rowCount) return res.status(404).json({ error: "Product not found" }); await audit(req,"product.updated","product",String(req.params.id),{status:input.status}); res.json(r.rows[0]);
}));
app.delete("/api/admin/products/:id", requireAdmin, requireOwner, asyncRoute(async (req, res) => { const productId=String(req.params.id);const images = await query<any>("SELECT url FROM product_images WHERE product_id=$1", [productId]); const r = await query("DELETE FROM products WHERE id=$1 RETURNING id", [productId]); if (!r.rowCount) return res.status(404).json({ error: "Product not found" }); await audit(req,"product.deleted","product",productId); for (const image of images.rows) { if (image.url.startsWith("/uploads/")) fs.promises.unlink(path.join(uploadDir,path.basename(image.url))).catch(()=>{}); } res.status(204).end(); }));

const imageExtensions: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif" };
const upload = multer({
  storage: multer.diskStorage({ destination: uploadDir, filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${imageExtensions[file.mimetype] || ""}`) }),
  limits: { fileSize: 8 * 1024 * 1024, files: 12, fields: 4, parts: 16 },
  fileFilter: (_req, file, cb) => cb(null, Boolean(imageExtensions[file.mimetype])),
});
const hasImageSignature = async (file: Express.Multer.File) => {
  const handle = await fs.promises.open(file.path, "r");
  try {
    const buffer = Buffer.alloc(16);
    await handle.read(buffer, 0, buffer.length, 0);
    if (file.mimetype === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (file.mimetype === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
    if (file.mimetype === "image/webp") return buffer.toString("ascii",0,4) === "RIFF" && buffer.toString("ascii",8,12) === "WEBP";
    if (file.mimetype === "image/avif") return buffer.toString("ascii",4,12) === "ftypavif";
    return false;
  } finally { await handle.close(); }
};
app.post("/api/admin/products/:id/images", requireAdmin, upload.array("images", 12), asyncRoute(async (req, res) => {
  const files = (req.files || []) as Express.Multer.File[];
  const valid = await Promise.all(files.map(hasImageSignature));
  if (valid.some((value) => !value)) {
    await Promise.all(files.map((file) => fs.promises.unlink(file.path).catch(() => {})));
    return res.status(400).json({ error: "One or more files are not valid supported images" });
  }
  const count = await query<any>("SELECT COUNT(*)::int count,COALESCE(MAX(position),-1) position FROM product_images WHERE product_id=$1", [req.params.id]);
  if (!files.length) return res.status(400).json({ error: "Select at least one image" });
  if (count.rows[0].count + files.length > 12) { for (const file of files) fs.promises.unlink(file.path).catch(()=>{}); return res.status(400).json({ error: "A product can have up to 12 images" }); }
  const existing = { rows: [{ position: count.rows[0].position }] };
  const saved=[]; for (const [index,file] of files.entries()) { const r=await query("INSERT INTO product_images (id,product_id,url,alt_text,position) VALUES ($1,$2,$3,$4,$5) RETURNING *", [crypto.randomUUID(),req.params.id,`/uploads/${file.filename}`,req.body.altText || "Product image",existing.rows[0].position+index+1]); saved.push(r.rows[0]); } res.status(201).json(saved);
}));
app.delete("/api/admin/images/:id", requireAdmin, asyncRoute(async (req, res) => { const r=await query<any>("DELETE FROM product_images WHERE id=$1 RETURNING url", [req.params.id]); if (!r.rowCount) return res.status(404).json({ error: "Image not found" }); const file=path.join(uploadDir,path.basename(r.rows[0].url)); fs.promises.unlink(file).catch(()=>{}); res.status(204).end(); }));

app.get("/api/admin/orders", requireAdmin, asyncRoute(async (_req, res) => { const r=await query(`SELECT o.*,o.total_minor total,(CASE WHEN o.fulfillment_status='unfulfilled' THEN 'pending' WHEN o.fulfillment_status='processing' THEN 'confirmed' ELSE o.fulfillment_status END) status,COALESCE(json_agg(oi ORDER BY oi.id) FILTER(WHERE oi.id IS NOT NULL),'[]') items FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id GROUP BY o.id ORDER BY o.created_at DESC`); res.json({orders:r.rows}); }));
app.put("/api/admin/orders/:id/status",requireAdmin,asyncRoute(async(req,res)=>{const status=z.enum(["pending","confirmed","fulfilled","cancelled"]).parse(req.body.status);const mapped=status==="pending"?"unfulfilled":status==="confirmed"?"processing":status;const r=await query("UPDATE orders SET fulfillment_status=$2,updated_at=now() WHERE id=$1 RETURNING *",[req.params.id,mapped]);res.json(r.rows[0]);}));
app.patch("/api/admin/orders/:id", requireAdmin, asyncRoute(async (req, res) => { const input=z.object({paymentStatus:z.enum(["pending","paid","failed","refunded"]),fulfillmentStatus:z.enum(["unfulfilled","processing","fulfilled","cancelled"])}).parse(req.body); const r=await query("UPDATE orders SET payment_status=$2,fulfillment_status=$3,updated_at=now() WHERE id=$1 RETURNING *",[req.params.id,input.paymentStatus,input.fulfillmentStatus]); res.json(r.rows[0]); }));
app.get("/api/admin/settings", requireAdmin, asyncRoute(async (_req,res)=>{const r=await query("SELECT key,value FROM store_settings");const raw=Object.fromEntries(r.rows.map((x:any)=>[x.key,x.value])),s=raw.store||{},c=raw.contact||{};res.json({store_name:s.name,announcement:s.announcement,offline_payment_instructions:s.offlineInstructions,whatsapp:c.whatsapp,contact_email:c.email});}));
app.put("/api/admin/settings", requireAdmin, requireOwner, asyncRoute(async (req,res)=>{const b=z.object({store_name:z.string().min(2).max(100),announcement:z.string().max(180),offline_payment_instructions:z.string().max(1000),whatsapp:z.string().regex(/^\+?[0-9]{7,16}$/),contact_email:z.union([z.literal(""),z.string().email()])}).parse(req.body);await query("UPDATE store_settings SET value=$2,updated_at=now() WHERE key=$1",["store",{name:b.store_name,announcement:b.announcement,offlineInstructions:b.offline_payment_instructions,currency:"NGN"}]);await query("UPDATE store_settings SET value=$2,updated_at=now() WHERE key=$1",["contact",{whatsapp:b.whatsapp,email:b.contact_email}]);await audit(req,"settings.updated","store","store");res.json(b);}));

app.post("/api/orders", rateLimit("create-order",20,10*60_000), asyncRoute(async (req, res) => {
  const b=req.body; const input=z.object({customerName:z.string().min(2).max(100),customerEmail:z.string().email(),customerPhone:z.string().min(7).max(30),deliveryAddress:z.string().min(10).max(500),notes:z.string().max(1000).default(""),paymentMethod:z.enum(["paystack","flutterwave","manual"]),items:z.array(z.object({productId:z.string().uuid(),quantity:z.number().int().min(1).max(50)})).min(1)}).parse({customerName:b.customer_name,customerEmail:b.customer_email,customerPhone:b.customer_phone,deliveryAddress:b.delivery_address,notes:b.notes||"",paymentMethod:b.payment_method,items:(b.items||[]).map((x:any)=>({productId:x.product_id,quantity:x.quantity}))});
  const settings=await paymentSettings(),ready=gatewayReadiness(settings);const enabled=input.paymentMethod==="manual"?settings.manualEnabled:ready[input.paymentMethod].enabled&&ready[input.paymentMethod].configured;if(!enabled)return res.status(400).json({error:"That payment method is currently unavailable"});const checkoutToken=crypto.randomBytes(32).toString("base64url"),checkoutHash=hashToken(checkoutToken);const client=await pool.connect(); try { await client.query("BEGIN"); let subtotal=0; const lines=[]; for(const item of input.items){const r=await client.query("SELECT * FROM products WHERE id=$1 AND status='active' FOR UPDATE",[item.productId]);if(!r.rowCount) throw new Error("A product is no longer available");const p=r.rows[0];if(p.track_inventory&&p.inventory<item.quantity) throw new Error(`${p.title} does not have enough inventory`);const total=p.price_minor*item.quantity;subtotal+=total;lines.push({...item,title:p.title,unitPrice:p.price_minor,lineTotal:total});if(p.track_inventory)await client.query("UPDATE products SET inventory=inventory-$2 WHERE id=$1",[p.id,item.quantity]);} const orderId=crypto.randomUUID();const order=await client.query("INSERT INTO orders(id,customer_name,customer_email,customer_phone,delivery_address,customer_notes,subtotal_minor,total_minor,payment_method,checkout_token_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$7,$8,$9) RETURNING *",[orderId,input.customerName,input.customerEmail.toLowerCase(),input.customerPhone,input.deliveryAddress,input.notes,subtotal,input.paymentMethod,checkoutHash]);for(const line of lines)await client.query("INSERT INTO order_items(id,order_id,product_id,title,quantity,unit_price_minor,line_total_minor) VALUES($1,$2,$3,$4,$5,$6,$7)",[crypto.randomUUID(),orderId,line.productId,line.title,line.quantity,line.unitPrice,line.lineTotal]);await client.query("COMMIT");res.status(201).json({...order.rows[0],checkout_token:checkoutToken}); } catch(error){await client.query("ROLLBACK");throw error;} finally{client.release();}
}));
app.post("/api/payments/initialize",rateLimit("initialize-payment",15,10*60_000),asyncRoute(async(req,res)=>{const input=z.object({orderNumber:z.coerce.number().int().positive(),checkoutToken:z.string().min(32),provider:z.enum(["paystack","flutterwave"])}).parse(req.body);const order=await query<any>("SELECT * FROM orders WHERE order_number=$1 AND checkout_token_hash=$2",[input.orderNumber,hashToken(input.checkoutToken)]);if(!order.rowCount)return res.status(404).json({error:"Order authorization could not be verified"});const settings=await paymentSettings();if(input.provider!==settings.activeProvider)return res.status(400).json({error:"That gateway is not currently active"});const ready=gatewayReadiness(settings);if(!ready[input.provider].enabled||!ready[input.provider].configured)return res.status(503).json({error:"The selected gateway is not ready"});const reference=paymentReference(input.provider,input.orderNumber),base=`${req.protocol}://${req.get("host")}`,callbackUrl=`${base}/api/payments/${input.provider}/callback`;const initialized=await initializeGateway({provider:input.provider,mode:settings.mode,email:order.rows[0].customer_email,amount:order.rows[0].total_minor,currency:order.rows[0].currency,reference,callbackUrl,customerName:order.rows[0].customer_name,orderNumber:String(input.orderNumber)});await query("INSERT INTO payment_transactions(id,order_id,provider,reference,provider_transaction_id,amount_minor,currency,status,checkout_url,response_data) VALUES($1,$2,$3,$4,$5,$6,$7,'initialized',$8,$9)",[crypto.randomUUID(),order.rows[0].id,input.provider,reference,initialized.providerId,order.rows[0].total_minor,order.rows[0].currency,initialized.checkoutUrl,initialized.raw]);res.status(201).json({checkoutUrl:initialized.checkoutUrl,reference});}));
const finishPayment=async(provider:Provider,identifier:string)=>{const settings=await paymentSettings(),verified=await verifyGateway(provider,settings.mode,identifier);const tx=await query<any>("SELECT * FROM payment_transactions WHERE reference=$1 AND provider=$2",[verified.reference,provider]);if(!tx.rowCount||tx.rows[0].amount_minor!==verified.amountMinor||tx.rows[0].currency!==verified.currency)return false;await query("UPDATE payment_transactions SET status=$2,provider_transaction_id=$3,verified_at=CASE WHEN $2='successful' THEN now() ELSE verified_at END,response_data=$4,updated_at=now() WHERE id=$1",[tx.rows[0].id,verified.successful?"successful":"failed",verified.providerId,verified.raw]);if(verified.successful)await query("UPDATE orders SET payment_status='paid',updated_at=now() WHERE id=$1",[tx.rows[0].order_id]);return verified.successful;};
app.get("/api/payments/paystack/callback",asyncRoute(async(req,res)=>{const reference=String(req.query.reference||"");const ok=reference&&await finishPayment("paystack",reference);res.redirect(`/order-success?payment=${ok?"paid":"failed"}&reference=${encodeURIComponent(reference)}`);}));
app.get("/api/payments/flutterwave/callback",asyncRoute(async(req,res)=>{const id=String(req.query.transaction_id||"");const reference=String(req.query.tx_ref||"");const ok=id&&await finishPayment("flutterwave",id);res.redirect(`/order-success?payment=${ok?"paid":"failed"}&reference=${encodeURIComponent(reference)}`);}));
app.post("/api/payments/paystack/webhook",asyncRoute(async(req,res)=>{if(!req.rawBody||!validPaystackSignature(req.rawBody,req.get("x-paystack-signature")))return res.status(401).end();if(req.body?.event==="charge.success")await finishPayment("paystack",String(req.body.data.reference));res.status(200).end();}));
app.post("/api/payments/flutterwave/webhook",asyncRoute(async(req,res)=>{if(!validFlutterwaveSignature(req.get("verif-hash")))return res.status(401).end();if(req.body?.event==="charge.completed"&&req.body?.data?.id)await finishPayment("flutterwave",String(req.body.data.id));res.status(200).end();}));
app.get("/api/orders/track",rateLimit("track-order",60,10*60_000),asyncRoute(async(req,res)=>{const input=z.object({number:z.coerce.number().int().positive(),email:z.string().email()}).parse(req.query);const r=await query("SELECT order_number,payment_status,fulfillment_status,created_at,updated_at FROM orders WHERE order_number=$1 AND lower(customer_email)=lower($2)",[input.number,input.email]);if(!r.rowCount)return res.status(404).json({error:"We could not find an order matching those details"});res.json(r.rows[0]);}));

app.use("/api", (_req, res) => res.status(404).json({ error: "API route not found" }));

if (process.env.NODE_ENV === "production") { app.use(express.static(path.resolve("dist"), { maxAge: "1h", etag: true })); app.use((_req,res)=>res.sendFile(path.resolve("dist/index.html"))); }
app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  req.log.error({ err: error, requestId: req.id }, "request failed");
  if (error instanceof z.ZodError) return res.status(400).json({ error: "Please check the submitted information", issues: error.issues });
  if (error instanceof multer.MulterError) return res.status(400).json({ error: "The uploaded files exceed the allowed limits" });
  if (error?.code === "23505") return res.status(409).json({ error: "That value is already in use" });
  res.status(500).json({ error: "Unexpected server error", requestId: req.id });
});

if (process.env.NODE_ENV === "production") {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  if (!process.env.SETUP_TOKEN || process.env.SETUP_TOKEN.length < 32) throw new Error("SETUP_TOKEN must contain at least 32 characters");
}
await migrate();
const server = app.listen(port, () => console.log(`DE_JOY store listening on ${port}`));
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}; shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
