import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { query } from "./db.js";

export const SESSION_COOKIE = "dejoy_admin";
const sessionDays = 7;
export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export async function createSession(adminId: string, res: Response) {
  const token = crypto.randomBytes(32).toString("base64url");
  await query("INSERT INTO admin_sessions (id, admin_id, token_hash, expires_at) VALUES ($1,$2,$3,now() + interval '7 days')", [crypto.randomUUID(), adminId, hashToken(token)]);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionDays * 86400000,
    path: "/",
  });
}

declare global {
  namespace Express {
    interface Request { admin?: { id: string; email: string; displayName: string; role: string } }
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) return res.status(401).json({ error: "Authentication required" });
    const result = await query<{ id: string; email: string; display_name: string; role: string }>(`SELECT a.id,a.email,a.display_name,a.role FROM admin_sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=$1 AND s.expires_at>now()`, [hashToken(token)]);
    if (!result.rowCount) return res.status(401).json({ error: "Session expired" });
    const admin = result.rows[0];
    req.admin = { id: admin.id, email: admin.email, displayName: admin.display_name, role: admin.role };
    next();
  } catch (error) { next(error); }
}

export function enforceSameOrigin(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  const host = req.get("host");
  if (origin && new URL(origin).host !== host) return res.status(403).json({ error: "Origin rejected" });
  next();
}
