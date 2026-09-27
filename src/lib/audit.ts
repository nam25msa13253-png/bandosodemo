import { db, schema as s } from "@/db";
import type { SessionUser } from "./session";

export async function audit(
  user: SessionUser | null,
  action: string,
  entity: string,
  entityId: string | number | null,
  summary: string,
  before?: unknown,
  after?: unknown,
) {
  try {
    await db.insert(s.auditLogs).values({
      userId: user?.id ?? null,
      username: user?.username ?? null,
      action,
      entity,
      entityId: entityId == null ? null : String(entityId),
      summary,
      before: (before ?? null) as never,
      after: (after ?? null) as never,
    });
  } catch (e) {
    console.error("audit failed", e);
  }
}
