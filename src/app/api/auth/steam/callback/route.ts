import { NextRequest, NextResponse } from "next/server";

function baseUrl(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const incoming = url.searchParams;

  if (incoming.get("openid.mode") !== "id_res") {
    return NextResponse.redirect(
      new URL("/?steam_error=mode", process.env.NEXT_PUBLIC_APP_URL ?? baseUrl(req)),
    );
  }

  const body = new URLSearchParams();
  for (const [key, value] of incoming) {
    if (key.startsWith("openid.")) {
      body.append(key, value);
    }
  }
  body.set("openid.mode", "check_authentication");

  const verify = await fetch("https://steamcommunity.com/openid/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const text = await verify.text();
  if (!text.includes("is_valid:true")) {
    return NextResponse.redirect(
      new URL("/?steam_error=verify", process.env.NEXT_PUBLIC_APP_URL ?? baseUrl(req)),
    );
  }

  const claimed = incoming.get("openid.claimed_id") ?? "";
  const match = claimed.match(/\/openid\/id\/(\d+)/);
  const steamId = match?.[1];
  if (!steamId) {
    return NextResponse.redirect(
      new URL("/?steam_error=id", process.env.NEXT_PUBLIC_APP_URL ?? baseUrl(req)),
    );
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? baseUrl(req);
  const res = NextResponse.redirect(new URL("/?steam=ok", base));
  res.cookies.set("casebs_steam_id", steamId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
