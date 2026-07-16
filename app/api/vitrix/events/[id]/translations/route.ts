import { NextRequest } from "next/server";
import { createVitrixEventTranslation } from "@/lib/vitrix/events-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return createVitrixEventTranslation(req, id);
}
