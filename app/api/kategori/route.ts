import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULTS = ["sandal", "sepatu", "bahan"];
// ponytail: fallback in-memory saat DB unreachable. Upgrade: hapus saat DB connect.
const memoryKategori = new Set<string>(DEFAULTS);
// Cache status DB — cegah timeout 10s tiap request
let dbReachable: boolean | null = null;

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  const safe = p.catch(() => null);
  const timer = new Promise<null>(resolve => setTimeout(() => resolve(null), ms));
  return Promise.race([safe, timer]);
}

async function ensureTable() {
  for (const name of DEFAULTS) {
    await prisma.kategori.upsert({ where: { name }, update: {}, create: { name } });
  }
}

export async function GET() {
  if (dbReachable !== false) {
    const ok = await withTimeout(ensureTable(), 2000);
    if (ok !== null) {
      const rows = await withTimeout(prisma.kategori.findMany({ orderBy: { name: "asc" } }), 2000);
      if (rows) {
        dbReachable = true;
        for (const r of rows) memoryKategori.add(r.name);
        return NextResponse.json(Array.from(memoryKategori).sort().map(name => ({ name })));
      }
    }
    dbReachable = false;
  }
  return NextResponse.json(Array.from(memoryKategori).sort().map(name => ({ name })));
}

export async function POST(req: Request) {
  let n = "";
  try {
    const b = await req.json();
    n = String(b?.name || "").trim().toLowerCase();
  } catch { n = ""; }
  if (!n) return NextResponse.json({ error: "Nama kategori wajib" }, { status: 400 });
  memoryKategori.add(n);
  if (dbReachable !== false) {
    const ok = await withTimeout(ensureTable(), 2000);
    if (ok !== null) {
      const row = await withTimeout(
        prisma.kategori.upsert({ where: { name: n }, update: {}, create: { name: n } }),
        2000
      );
      if (row) { dbReachable = true; return NextResponse.json(row, { status: 201 }); }
    }
    dbReachable = false;
  }
  return NextResponse.json({ name: n }, { status: 201 });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const n = String(searchParams.get("name") || "").trim().toLowerCase();
  if (!n) return NextResponse.json({ error: "Nama kategori wajib" }, { status: 400 });
  memoryKategori.delete(n);
  if (dbReachable !== false) {
    const ok = await withTimeout(prisma.kategori.deleteMany({ where: { name: n } }), 2000);
    if (ok !== null) dbReachable = true;
    else dbReachable = false;
  }
  return NextResponse.json({ ok: true });
}
