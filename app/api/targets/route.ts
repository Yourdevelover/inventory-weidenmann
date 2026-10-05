import { NextResponse } from "next/server";
import { prisma, dbFast } from "@/lib/prisma";

// GET /api/targets
export async function GET() {
  const targets = await dbFast(prisma.target.findMany({ orderBy: { id: "desc" } }));
  return NextResponse.json(targets || []);
}

// POST /api/targets
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { itemId, itemName, brand, kategori, periode, jumlah, createdAt } = body;
    const target = await prisma.target.create({ data: { itemId, itemName, brand, kategori, periode, jumlah: Number(jumlah), realisasi: 0, createdAt } });
    return NextResponse.json(target, { status: 201 });
  } catch { return NextResponse.json({ error: "DB unreachable" }, { status: 503 }); }
}