import postgres from "postgres";
import type { Job } from "./statuses";

let _sql: ReturnType<typeof postgres> | null = null;

/** Líná inicializace DB klienta — neběží při buildu, jen za běhu API.
 *  Univerzální Postgres ovladač (funguje se Supabase i Neonem). */
function client() {
  if (!_sql) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      "";
    if (!connectionString) {
      throw new Error(
        "Chybí DATABASE_URL — nastav ji v Environment Variables (connection string ze Supabase / Neon)."
      );
    }
    _sql = postgres(connectionString, {
      ssl: "require",
      prepare: false, // kompatibilní se Supabase transaction poolerem
      max: 1, // šetrné ke spojením v serverless prostředí
    });
  }
  return _sql;
}

export function sql(strings: TemplateStringsArray, ...params: any[]) {
  return client()(strings, ...params);
}

let tableReady = false;

/** Vytvoří tabulku, pokud neexistuje (idempotentní, levné). */
export async function ensureTable() {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id        TEXT PRIMARY KEY,
      title     TEXT NOT NULL,
      company   TEXT NOT NULL,
      link      TEXT NOT NULL DEFAULT '',
      note      TEXT NOT NULL DEFAULT '',
      status    TEXT NOT NULL DEFAULT 'todo',
      grp       TEXT NOT NULL DEFAULT 'basic',
      comments  JSONB NOT NULL DEFAULT '[]'::jsonb,
      created   BIGINT NOT NULL
    )
  `;
  tableReady = true;
}

/** Převod DB řádku (grp) na aplikační objekt (group). */
export function rowToJob(r: any): Job {
  return {
    id: r.id,
    title: r.title,
    company: r.company,
    link: r.link || "",
    note: r.note || "",
    status: r.status,
    group: r.grp === "top" ? "top" : "basic",
    comments: Array.isArray(r.comments) ? r.comments : [],
    created: Number(r.created),
  };
}
