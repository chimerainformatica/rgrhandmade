import { NextRequest } from "next/server";
import { bulkUpdateVitrixEvents } from "@/lib/vitrix/events-service";

export async function PATCH(req: NextRequest) {
  return bulkUpdateVitrixEvents(req);
}
