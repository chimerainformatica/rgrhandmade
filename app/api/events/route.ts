import { NextRequest } from "next/server";
import { getPublicEvents } from "@/lib/vitrix/events-service";

export async function GET(req: NextRequest) {
  return getPublicEvents(req);
}
