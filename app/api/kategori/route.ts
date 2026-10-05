import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.kategori.findMany({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET /api/kategori error:", error);
    return NextResponse.json({ error: "Database kategori tidak dapat diakses." }, { status: 503 });
  }
}

export async function POST(req: Request) {
  let name = "";
  try {
    const body = await req.json();
    name = String(body?.name || "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }
  if (!name) return NextResponse.json({ error: "Nama kategori wajib" }, { status: 400 });
  try {
    const row = await prisma.kategori.upsert({ where: { name }, update: {}, create: { name } });
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("POST /api/kategori error:", error);
    return NextResponse.json({ error: "Kategori gagal disimpan ke database." }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = String(searchParams.get("name") || "").trim().toLowerCase();
  if (!name) return NextResponse.json({ error: "Nama kategori wajib" }, { status: 400 });
  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const items = await tx.item.findMany({ where: { kategori: name }, select: { id: true } });
      const itemIds = items.map((item) => item.id);
      await tx.transaction.deleteMany({ where: { itemId: { in: itemIds } } });
      await tx.target.deleteMany({ where: { itemId: { in: itemIds } } });
      await tx.laporanCacat.deleteMany({ where: { itemId: { in: itemIds } } });
      await tx.item.deleteMany({ where: { id: { in: itemIds } } });
      await tx.kategori.deleteMany({ where: { name } });
      return items.length;
    });
    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    console.error("DELETE /api/kategori error:", error);
    return NextResponse.json({ error: "Kategori gagal dihapus dari database." }, { status: 503 });
  }
}
