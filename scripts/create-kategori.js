const { Client } = require("pg");
const c = new Client({
  connectionString:
    "postgresql://postgres.gmhxrtjctxhxsfeyrefv:stokbarang1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

async function main() {
  await c.connect();
  console.log("CONNECTED");
  await c.query(
    `CREATE TABLE IF NOT EXISTS kategori (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  );
  for (const n of ["sandal", "sepatu", "bahan"]) {
    await c.query(
      `INSERT INTO kategori (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [n]
    );
  }
  const r = await c.query(`SELECT * FROM kategori ORDER BY name`);
  console.log("kategori ready:", JSON.stringify(r.rows));
  await c.end();
}

main().catch((e) => { console.error("ERR:", e.message); process.exit(1); });