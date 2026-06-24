import { NextRequest } from "next/server";
import { deleteVitrixEvent, getVitrixEventById, updateVitrixEvent } from "@/lib/vitrix/events-service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return getVitrixEventById(req, id);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return updateVitrixEvent(req, id);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return deleteVitrixEvent(req, id);
}
