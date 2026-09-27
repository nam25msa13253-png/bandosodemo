/**
 * Tạo / cập nhật bảng trong CSDL từ các file SQL trong thư mục drizzle/
 * (không cần drizzle-kit lúc chạy thật → nhẹ, báo lỗi rõ ràng).
 *   npm run db:migrate
 */
import "./load-env";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu biến DATABASE_URL");
  console.log("→ Kết nối CSDL...");
  let client!: Client;
  for (let i = 1; ; i++) {
    client = new Client({ connectionString: url, connectionTimeoutMillis: 10000 });
    try {
      await client.connect();
      break;
    } catch (e) {
      await client.end().catch(() => {});
      if (i >= 6) throw new Error(`Không kết nối được CSDL: ${(e as Error).message}`);
      console.log(`   chưa kết nối được (${(e as Error).message}) – thử lại lần ${i + 1} sau 5 giây`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  await client.query(`create table if not exists app_migrations (name text primary key, applied_at timestamptz not null default now())`);
  const done = new Set((await client.query(`select name from app_migrations`)).rows.map((r) => r.name as string));

  const dir = path.join(process.cwd(), "drizzle");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (done.has(file)) continue;
    // CSDL đã có bảng từ trước (tạo bằng "drizzle-kit push") -> chỉ đánh dấu bản đầu tiên là đã chạy
    if (file.startsWith("0000")) {
      const { rows } = await client.query(`select to_regclass('public.places') as t`);
      if (rows[0].t) {
        await client.query(`insert into app_migrations(name) values ($1)`, [file]);
        console.log(`   = ${file} (bảng đã có sẵn, bỏ qua)`);
        continue;
      }
    }
    const statements = fs
      .readFileSync(path.join(dir, file), "utf8")
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    await client.query("begin");
    try {
      for (const st of statements) await client.query(st);
      await client.query(`insert into app_migrations(name) values ($1)`, [file]);
      await client.query("commit");
      console.log(`   + ${file} (${statements.length} lệnh)`);
    } catch (e) {
      await client.query("rollback");
      throw new Error(`Lỗi khi chạy ${file}: ${(e as Error).message}`);
    }
  }
  await client.end();
  console.log("✔ CSDL đã sẵn sàng");
}

main().catch((e) => {
  console.error("✘ Lỗi tạo bảng:", e.message ?? e);
  process.exit(1);
});
