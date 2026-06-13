import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL("/login", req.url);
  const res = NextResponse.redirect(url);
  res.cookies.set("jt_auth", "", { path: "/", maxAge: 0 });
  return res;
}
