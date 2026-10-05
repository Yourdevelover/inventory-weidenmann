import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/items/:id — update item fields
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const item = await prisma.item.update({ where: { id: Number(id) }, data: body });
    return NextResponse.json(item);
  } catch (e: any) {
    console.error("PATCH /api/items error:", e.message || e);
    return NextResponse.json({ error: e.message || "Gagal update" }, { status: 500 });
  }
}

// DELETE /api/items/:id — delete item + all related records
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = Number(id);
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { itemId: numId } }),
      prisma.target.deleteMany({ where: { itemId: numId } }),
      prisma.laporanCacat.deleteMany({ where: { itemId: numId } }),
      prisma.item.delete({ where: { id: numId } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/items error:", e.message || e);
    return NextResponse.json({ error: e.message || "Gagal hapus" }, { status: 500 });
  }
}
