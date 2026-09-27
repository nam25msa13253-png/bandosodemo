import { defineConfig } from "drizzle-kit";
import fs from "node:fs";

// Đọc DATABASE_URL từ file .env (drizzle-kit không tự đọc)
if (!process.env.DATABASE_URL && fs.existsSync(".env")) {
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Bỏ qua bảng hệ thống của PostGIS (spatial_ref_sys...) có sẵn trong image Docker
  extensionsFilters: ["postgis"],
  dbCredentials: { url: process.env.DATABASE_URL! },
});
