import { NextRequest, NextResponse } from "next/server";

function baseUrl(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? baseUrl(req);
  const returnTo = `${base.replace(/\/$/, "")}/api/auth/steam/callback`;
  const realm = `${base.replace(/\/$/, "")}/`;

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  const steam = `https://steamcommunity.com/openid/login?${params.toString()}`;
  return NextResponse.redirect(steam);
}
