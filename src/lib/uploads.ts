import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/** Ảnh tải lên được lưu trong thư mục ./uploads (ngoài public để phục vụ được cả khi chạy production) */
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX = 5 * 1024 * 1024;

export async function saveUpload(file: File): Promise<string> {
  if (!ALLOWED.has(file.type)) throw new Error("Chỉ nhận ảnh JPG, PNG, WEBP, GIF");
  if (file.size > MAX) throw new Error("Ảnh vượt quá 5 MB");
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[file.type];
  const now = new Date();
  const sub = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  await fs.mkdir(path.join(UPLOAD_DIR, sub), { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, sub, name), Buffer.from(await file.arrayBuffer()));
  return `/api/files/${sub}/${name}`;
}

export async function saveUploads(files: File[]): Promise<string[]> {
  const out: string[] = [];
  for (const f of files) if (f && f.size > 0) out.push(await saveUpload(f));
  return out;
}
