import { NextRequest, NextResponse } from "next/server";
import { getOrCreateConfig, getSpendingStats } from "@/lib/payagent-store";

export async function GET(req: NextRequest) {
  const ownerAddress = req.headers.get("x-owner-address");
  if (!ownerAddress) {
    return NextResponse.json({ error: "x-owner-address header required" }, { status: 400 });
  }
  const config = getOrCreateConfig(ownerAddress);
  const stats = getSpendingStats(config.id, config);
  return NextResponse.json(stats);
}
