import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const password = process.env.APP_PASSWORD;
  const { password: input } = await req.json().catch(() => ({ password: "" }));

  if (!password || input !== password) {
    return NextResponse.json({ error: "Špatné heslo" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("jt_auth", password, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dní
  });
  return res;
}
