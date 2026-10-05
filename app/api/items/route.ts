import { NextResponse } from "next/server";
import { prisma, dbFast } from "@/lib/prisma";

// GET /api/items — list all items
export async function GET() {
  const items = await dbFast(prisma.item.findMany({ orderBy: { id: "desc" } }));
  return NextResponse.json(items || []);
}

// DELETE /api/items?kategori=xxx — delete all items in a kategori
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const kategori = url.searchParams.get("kategori");
  if (!kategori) return NextResponse.json({ error: "kategori required" }, { status: 400 });
  try {
    const items = await prisma.item.findMany({ where: { kategori }, select: { id: true } });
    const ids = items.map(i => i.id);
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { itemId: { in: ids } } }),
      prisma.target.deleteMany({ where: { itemId: { in: ids } } }),
      prisma.laporanCacat.deleteMany({ where: { itemId: { in: ids } } }),
      prisma.item.deleteMany({ where: { kategori } }),
    ]);
    return NextResponse.json({ deleted: ids.length });
  } catch (e: any) {
    console.error("DELETE /api/items?kategori error:", e.message || e);
    return NextResponse.json({ error: e.message || "Gagal hapus" }, { status: 500 });
  }
}

// POST /api/items — create item + initial transaction
export async function POST(req: Request) {
  const body = await req.json();
  const { name, code, stock, satuan, type, kategori, brand, model, size } = body;

  if (!name || !code || stock == null || !satuan || !type || !kategori) {
    return NextResponse.json({ error: "Field wajib kosong" }, { status: 400 });
  }

  try {
    const now = new Date();
    const tanggal = now.toISOString().slice(0, 10);
    const jam = now.toTimeString().slice(0, 5);

    const item = await prisma.$transaction(async (tx) => {
      const newItem = await tx.item.create({
        data: { name, code, stock: Number(stock), satuan, type, kategori, brand, model, size },
      });
      if (Number(stock) > 0) {
        await tx.transaction.create({
          data: {
            itemId: newItem.id,
            itemName: newItem.name,
            itemCode: newItem.code,
            satuan: newItem.satuan,
            type: "masuk",
            quantity: Number(stock),
            tanggal,
            jam,
            stokSebelum: 0,
            stokSesudah: Number(stock),
          },
        });
      }
      return newItem;
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/items error:", e.message || e);
    return NextResponse.json({ error: e.message || "Gagal tambah barang" }, { status: 500 });
  }
}
