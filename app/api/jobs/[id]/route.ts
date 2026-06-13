import { sql, ensureTable, rowToJob } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/jobs/[id] — úprava celé pozice
export async function PATCH(req: Request, { params }: Params) {
  try {
    await ensureTable();
    const { id } = await params;
    const b = await req.json();
    const group = b.group === "top" ? "top" : "basic";
    const rows = await sql`
      UPDATE jobs SET
        title    = ${b.title},
        company  = ${b.company},
        link     = ${b.link || ""},
        note     = ${b.note || ""},
        status   = ${b.status},
        grp      = ${group},
        comments = ${JSON.stringify(b.comments || [])}::jsonb
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) {
      return Response.json({ error: "Pozice nenalezena" }, { status: 404 });
    }
    return Response.json(rowToJob(rows[0]));
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/jobs/[id]
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await ensureTable();
    const { id } = await params;
    await sql`DELETE FROM jobs WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
