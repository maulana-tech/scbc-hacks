import { NextRequest, NextResponse } from "next/server";
import { getOrCreateConfig, updateConfig } from "@/lib/payagent-store";

export async function GET(req: NextRequest) {
  const ownerAddress = req.headers.get("x-owner-address");
  if (!ownerAddress) {
    return NextResponse.json({ error: "x-owner-address header required" }, { status: 400 });
  }
  const config = getOrCreateConfig(ownerAddress);
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const ownerAddress = req.headers.get("x-owner-address");
  if (!ownerAddress) {
    return NextResponse.json({ error: "x-owner-address header required" }, { status: 400 });
  }
  const body = await req.json();
  getOrCreateConfig(ownerAddress);
  const updated = updateConfig(ownerAddress, body);
  return NextResponse.json(updated);
}
