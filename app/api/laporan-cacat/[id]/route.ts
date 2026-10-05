import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/laporan-cacat/:id
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; await prisma.laporanCacat.delete({ where: { id: Number(id) } }); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "DB unreachable" }, { status: 503 }); }
}