import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/targets/:id
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; const body = await req.json(); return NextResponse.json(await prisma.target.update({ where: { id: Number(id) }, data: body })); } catch { return NextResponse.json({ error: "DB unreachable" }, { status: 503 }); }
}

// DELETE /api/targets/:id
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; await prisma.target.delete({ where: { id: Number(id) } }); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "DB unreachable" }, { status: 503 }); }
}