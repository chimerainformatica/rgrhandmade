import { NextRequest } from "next/server";
import { createVitrixEvent, getVitrixEvents } from "@/lib/vitrix/events-service";

export async function GET(req: NextRequest) {
  return getVitrixEvents(req);
}

export async function POST(req: NextRequest) {
  return createVitrixEvent(req);
}
