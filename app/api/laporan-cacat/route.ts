import { NextResponse } from "next/server";
import { prisma, dbFast } from "@/lib/prisma";

// GET /api/laporan-cacat
export async function GET() {
  const laporan = await dbFast(prisma.laporanCacat.findMany({ orderBy: { id: "desc" } }));
  if (laporan === null) {
    return NextResponse.json(
      { error: "Database tidak dapat diakses. Periksa koneksi dan pastikan tabel sudah dibuat." },
      { status: 503 }
    );
  }
  return NextResponse.json(laporan);
}

// POST /api/laporan-cacat — create laporan + reduce stock
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipe, itemId, jenisCacat, jumlah, tanggal } = body;
    const item = await prisma.item.findUniqueOrThrow({ where: { id: Number(itemId) } });
    const stokSebelum = item.stock;
    const stokSesudah = Math.max(0, stokSebelum - Number(jumlah));
    const now = new Date();
    const jam = now.toTimeString().slice(0, 5);
    const result = await prisma.$transaction(async (tx) => {
      const l = await tx.laporanCacat.create({ data: { tipe, itemId: Number(itemId), itemName: item.name, jenisCacat, jumlah: Number(jumlah), tanggal } });
      const updatedItem = await tx.item.update({ where: { id: Number(itemId) }, data: { stock: stokSesudah } });
      const transaction = await tx.transaction.create({ data: { itemId: Number(itemId), itemName: item.name, itemCode: item.code, satuan: item.satuan, type: "keluar", quantity: Number(jumlah), tanggal, jam, tujuan: `Rusak: ${jenisCacat}`, stokSebelum, stokSesudah } });
      return { laporan: l, item: updatedItem, transaction };
    });
    return NextResponse.json(result, { status: 201 });
  } catch { return NextResponse.json({ error: "DB unreachable" }, { status: 503 }); }
}