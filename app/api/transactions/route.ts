import { NextResponse } from "next/server";
import { prisma, dbFast } from "@/lib/prisma";

// GET /api/transactions — list all transactions (?itemId=X to filter)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  const where = itemId ? { itemId: Number(itemId) } : {};
  const txns = await dbFast(prisma.transaction.findMany({ where, orderBy: { id: "desc" } }));
  return NextResponse.json(txns || []);
}

// POST /api/transactions — record masuk/keluar (server computes stok)
export async function POST(req: Request) {
  const body = await req.json();
  const { itemId, quantity, tanggal, jam, tujuan } = body;

  try {
    const item = await prisma.item.findUniqueOrThrow({ where: { id: Number(itemId) } });
    const stokSebelum = item.stock;
    const stokSesudah = body.type === "masuk" ? stokSebelum + Number(quantity) : Math.max(0, stokSebelum - Number(quantity));

    const txn = await prisma.$transaction(async (tx) => {
      const t = await tx.transaction.create({
        data: {
          itemId: Number(itemId),
          itemName: item.name,
          itemCode: item.code,
          satuan: item.satuan,
          type: body.type,
          quantity: Number(quantity),
          tanggal,
          jam,
          tujuan: tujuan || null,
          stokSebelum,
          stokSesudah,
        },
      });
      await tx.item.update({ where: { id: Number(itemId) }, data: { stock: stokSesudah } });
      return t;
    });

    return NextResponse.json(txn, { status: 201 });
  } catch {
    return NextResponse.json({ error: "DB unreachable" }, { status: 503 });
  }
}
