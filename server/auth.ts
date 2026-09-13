import crypto from "node:crypto";
import type { CookieOptions, NextFunction, Request, Response } from "express";
import { query } from "./db.js";

const production = process.env.NODE_ENV === "production";
export const SESSION_COOKIE = production ? "__Host-dejoy_admin" : "dejoy_admin";
const sessionDays = 7;
export const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: production,
  maxAge: sessionDays * 86_400_000,
  path: "/",
};

export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

const requestIp = (req: Request) => (req.ip || req.socket.remoteAddress || "unknown").slice(0, 100);

export async function createSession(adminId: string, req: Request, res: Response) {
  const token = crypto.randomBytes(32).toString("base64url");
  await query("DELETE FROM admin_sessions WHERE expires_at <= now()");
  await query("INSERT INTO admin_sessions (id,admin_id,token_hash,expires_at,ip_address,user_agent) VALUES ($1,$2,$3,now() + interval '7 days',$4,$5)", [crypto.randomUUID(), adminId, hashToken(token), requestIp(req), (req.get("user-agent") || "Unknown browser").slice(0, 300)]);
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions);
}

declare global {
  namespace Express {
    interface Request { admin?: { id: string; email: string; displayName: string; role: string; sessionId: string } }
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token || typeof token !== "string" || token.length > 128) return res.status(401).json({ error: "Authentication required" });
    const result = await query<{ id: string; email: string; display_name: string; role: string; session_id: string }>(`SELECT a.id,a.email,a.display_name,a.role,s.id session_id FROM admin_sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=$1 AND s.expires_at>now()`, [hashToken(token)]);
    if (!result.rowCount) {
      res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions, maxAge: undefined });
      return res.status(401).json({ error: "Session expired" });
    }
    const admin = result.rows[0];
    req.admin = { id: admin.id, email: admin.email, displayName: admin.display_name, role: admin.role, sessionId: admin.session_id };
    void query("UPDATE admin_sessions SET last_seen_at=now() WHERE id=$1 AND last_seen_at < now() - interval '5 minutes'", [admin.session_id]).catch(() => {});
    next();
  } catch (error) { next(error); }
}

export function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (req.admin?.role !== "owner") return res.status(403).json({ error: "Store owner access required" });
  next();
}

export const passwordPolicy = (value: string) => value.length >= 15 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);

export function enforceSameOrigin(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (!origin) return next();
  try {
    if (new URL(origin).host !== req.get("host")) return res.status(403).json({ error: "Origin rejected" });
  } catch {
    return res.status(403).json({ error: "Origin rejected" });
  }
  next();
}
