import { sql, ensureTable, rowToJob } from "@/lib/db";

export const dynamic = "force-dynamic";

function uid() {
  return Date.now().toString(36) + Math.floor(Math.random() * 1e9).toString(36);
}

// GET /api/jobs — všechny pozice
export async function GET() {
  try {
    await ensureTable();
    const rows = await sql`SELECT * FROM jobs ORDER BY created DESC`;
    return Response.json(rows.map(rowToJob));
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/jobs — nová pozice
export async function POST(req: Request) {
  try {
    await ensureTable();
    const b = await req.json();
    if (!b.title || !b.company) {
      return Response.json({ error: "Chybí název pozice nebo firma" }, { status: 400 });
    }
    const id = uid();
    const created = Date.now();
    const group = b.group === "top" ? "top" : "basic";
    await sql`
      INSERT INTO jobs (id, title, company, link, note, status, grp, comments, created)
      VALUES (
        ${id}, ${b.title}, ${b.company}, ${b.link || ""}, ${b.note || ""},
        ${b.status || "todo"}, ${group}, ${JSON.stringify(b.comments || [])}::jsonb, ${created}
      )
    `;
    return Response.json({ ok: true, id, created });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
