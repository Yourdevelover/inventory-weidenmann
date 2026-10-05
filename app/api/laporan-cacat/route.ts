import { NextResponse } from "next/server";
import { prisma, dbFast } from "@/lib/prisma";

// GET /api/laporan-cacat
export async function GET() {
  const laporan = await dbFast(prisma.laporanCacat.findMany({ orderBy: { id: "desc" } }));
  return NextResponse.json(laporan || []);
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
    const laporan = await prisma.$transaction(async (tx) => {
      const l = await tx.laporanCacat.create({ data: { tipe, itemId: Number(itemId), itemName: item.name, jenisCacat, jumlah: Number(jumlah), tanggal } });
      await tx.item.update({ where: { id: Number(itemId) }, data: { stock: stokSesudah } });
      await tx.transaction.create({ data: { itemId: Number(itemId), itemName: item.name, itemCode: item.code, satuan: item.satuan, type: "keluar", quantity: Number(jumlah), tanggal, jam, tujuan: `Rusak: ${jenisCacat}`, stokSebelum, stokSesudah } });
      return l;
    });
    return NextResponse.json(laporan, { status: 201 });
  } catch { return NextResponse.json({ error: "DB unreachable" }, { status: 503 }); }
}