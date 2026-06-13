import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Jednoduchá ochrana heslem. Pokud není nastavená proměnná APP_PASSWORD,
// aplikace je otevřená (vhodné pro lokální vývoj).
// (V Next.js 16 nahrazuje dřívější "middleware".)
export function proxy(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;
  // Veřejné cesty bez přihlášení
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/logout")
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("jt_auth")?.value;
  if (cookie === password) return NextResponse.next();

  // API → 401, stránky → přesměrování na /login
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Neautorizováno" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  // Vynech statické soubory a obrázky
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
