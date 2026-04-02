import { NextResponse } from "next/server";

/** Santé du service (load balancer / monitoring). */
export async function GET() {
  return NextResponse.json({ ok: true, t: new Date().toISOString() });
}
