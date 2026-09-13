import crypto from "node:crypto";
import type { Request } from "express";
import { query } from "./db.js";

export async function audit(req: Request, action: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}) {
  await query("INSERT INTO admin_audit_logs (id,admin_id,action,entity_type,entity_id,metadata,ip_address) VALUES ($1,$2,$3,$4,$5,$6,$7)", [crypto.randomUUID(), req.admin?.id || null, action, entityType, entityId || null, metadata, (req.ip || "unknown").slice(0, 100)]);
}
